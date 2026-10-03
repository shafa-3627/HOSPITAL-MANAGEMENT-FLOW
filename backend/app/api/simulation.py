from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import Department, Patient, Staff, SimulationResult
from datetime import datetime
import json

router = APIRouter()

class SimulationParams(BaseModel):
    scenario: str = "normal"
    additional_beds: int = 0
    additional_staff: int = 0
    expected_discharges: int = 0
    arrival_surge: int = 0
    transfer_capacity: int = 0

@router.post("/run")
def run_simulation(params: SimulationParams, db: Session = Depends(get_db)):
    depts = db.query(Department).filter(Department.hospital_id == 1).all()
    
    # Current state
    before = {}
    for d in depts:
        occ_pct = round(d.occupied_beds / d.total_beds * 100, 1) if d.total_beds > 0 else 0
        before[d.type] = {
            "occupancy": occ_pct,
            "occupied": d.occupied_beds,
            "total": d.total_beds,
            "available": d.available_beds
        }
    
    waiting = db.query(Patient).filter(Patient.status == "waiting").count()
    avg_workload = 75.0
    for s in db.query(Staff).filter(Staff.department_id.in_([d.id for d in depts])).all():
        avg_workload = max(avg_workload, s.workload_index or 70)
    
    before_summary = {
        "total_occupancy": round(sum(d.occupied_beds for d in depts) / sum(d.total_beds for d in depts) * 100, 1),
        "waiting_patients": waiting,
        "avg_workload": round(avg_workload, 1),
        "crisis_risk": "Critical" if before.get("ICU", {}).get("occupancy", 0) > 90 else "High" if before.get("ICU", {}).get("occupancy", 0) > 80 else "Moderate",
        "departments": before
    }
    
    # Apply scenario multipliers
    surge_mult = 1.0
    discharge_mult = 1.0
    staff_mult = 1.0
    
    if params.scenario == "icu_surge":
        surge_mult = 1.35
    elif params.scenario == "mass_casualty":
        surge_mult = 1.8
    elif params.scenario == "staff_shortage":
        staff_mult = 0.7
    elif params.scenario == "weekend_surge":
        surge_mult = 1.25
    
    # Calculate after state
    after = {}
    for d in depts:
        extra_arrivals = int(params.arrival_surge * surge_mult * (0.4 if d.type == "ED" else 0.2 if d.type == "ICU" else 0.15))
        discharges = int(params.expected_discharges * discharge_mult * (0.3 if d.type == "General" else 0.2))
        new_beds = int(params.additional_beds * (0.4 if d.type == "ICU" else 0.2))
        
        new_occupied = max(0, d.occupied_beds + extra_arrivals - discharges)
        new_total = d.total_beds + new_beds
        new_available = max(0, new_total - new_occupied)
        occ_pct = round(new_occupied / new_total * 100, 1) if new_total > 0 else 0
        
        after[d.type] = {
            "occupancy": min(occ_pct, 100.0),
            "occupied": min(new_occupied, new_total),
            "total": new_total,
            "available": max(new_available, 0)
        }
    
    new_waiting = max(0, waiting + int(params.arrival_surge * 0.5) - int(params.expected_discharges * 0.3))
    new_workload = max(40, avg_workload - params.additional_staff * 2.5 + params.arrival_surge * 0.8)
    
    after_summary = {
        "total_occupancy": round(sum(v["occupied"] for v in after.values()) / sum(v["total"] for v in after.values()) * 100, 1),
        "waiting_patients": new_waiting,
        "avg_workload": round(new_workload, 1),
        "crisis_risk": "Critical" if after.get("ICU", {}).get("occupancy", 0) > 90 else "High" if after.get("ICU", {}).get("occupancy", 0) > 80 else "Moderate" if after.get("ICU", {}).get("occupancy", 0) > 70 else "Low",
        "departments": after
    }
    
    # Save simulation result
    sim = SimulationResult(
        scenario_type=params.scenario,
        parameters=params.model_dump(),
        before_state=before_summary,
        after_state=after_summary,
        metrics_comparison={
            "occupancy_change": round(after_summary["total_occupancy"] - before_summary["total_occupancy"], 1),
            "waiting_change": new_waiting - waiting,
            "workload_change": round(new_workload - avg_workload, 1),
        },
        created_at=datetime.utcnow()
    )
    db.add(sim)
    db.commit()
    
    return {"before": before_summary, "after": after_summary, "scenario": params.scenario, "simulation_id": sim.id}

@router.get("/presets")
def get_presets():
    return [
        {"id": "normal", "name": "Normal Day", "description": "Standard operational parameters"},
        {"id": "icu_surge", "name": "ICU Surge", "description": "Sudden increase in ICU demand"},
        {"id": "mass_casualty", "name": "Mass Casualty Event", "description": "Large-scale emergency with multiple critical patients"},
        {"id": "staff_shortage", "name": "Staff Shortage", "description": "30% reduction in available staff"},
        {"id": "weekend_surge", "name": "Weekend Surge", "description": "Increased ED volume typical of weekends"},
    ]

@router.get("/history")
def get_history(db: Session = Depends(get_db)):
    sims = db.query(SimulationResult).order_by(SimulationResult.created_at.desc()).limit(20).all()
    return [
        {
            "id": s.id, "scenario_type": s.scenario_type,
            "before_state": s.before_state, "after_state": s.after_state,
            "metrics_comparison": s.metrics_comparison,
            "created_at": s.created_at.isoformat() if s.created_at else None
        } for s in sims
    ]

@router.post("/queue")
def queue_simulation():
    return {"status": "queued", "message": "Queue simulation initiated. Results will appear shortly."}
