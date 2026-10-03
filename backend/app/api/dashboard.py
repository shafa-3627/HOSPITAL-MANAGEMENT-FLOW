from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Department, Patient, Staff, Alert, Bed, Forecast, Resource

router = APIRouter()

@router.get("")
def get_dashboard(db: Session = Depends(get_db)):
    # Get first hospital's departments (id 1-5)
    depts = db.query(Department).filter(Department.hospital_id == 1).all()
    
    dept_data = []
    for d in depts:
        dept_beds = db.query(Bed).filter(Bed.department_id == d.id).all()
        if dept_beds:
            t_beds = len(dept_beds)
            o_beds = sum(1 for b in dept_beds if b.status == "occupied")
            a_beds = sum(1 for b in dept_beds if b.status == "available")
            r_beds = sum(1 for b in dept_beds if b.status == "reserved")
        else:
            t_beds = d.total_beds
            o_beds = d.occupied_beds
            a_beds = d.available_beds
            r_beds = d.reserved_beds
            
        utilization = round((o_beds / t_beds * 100), 1) if t_beds > 0 else 0.0
        status = "critical" if utilization > 90 else "warning" if utilization > 80 else "normal"
        
        dept_data.append({
            "id": d.id,
            "name": d.name,
            "type": d.type,
            "total_beds": t_beds,
            "occupied_beds": o_beds,
            "available_beds": a_beds,
            "reserved_beds": r_beds,
            "utilization": utilization,
            "status": status
        })
    
    total_beds = sum(d["total_beds"] for d in dept_data)
    occupied_beds = sum(d["occupied_beds"] for d in dept_data)
    available_beds = sum(d["available_beds"] for d in dept_data)
    occupancy_pct = round((occupied_beds / total_beds * 100) if total_beds > 0 else 0, 1)
    
    # Active waiting backlog in ED
    ed_waiting = db.query(Patient).filter(Patient.status == "waiting").count()
    
    # ICU occupancy calculated from live bed matrix
    icu_dept = next((d for d in dept_data if d["type"] == "ICU"), None)
    icu_occ = icu_dept["utilization"] if icu_dept else 0.0
    
    staff_on_duty = db.query(Staff).filter(Staff.status == "on_duty").count()
    avg_workload = db.query(func.avg(Staff.workload_index)).scalar() or 70
    
    active_alerts = db.query(Alert).filter(Alert.status == "active").count()
    
    # Live active patient census (excluding discharged patients)
    active_inpatients = db.query(Patient).filter(Patient.status != "discharged").count()
    
    # Dynamic Composite Flow Health Score Calculation (0 - 100)
    # 1. Overall bed occupancy penalty (max 20)
    occ_penalty = 0
    if occupancy_pct >= 92:
        occ_penalty = 20
    elif occupancy_pct >= 85:
        occ_penalty = 14
    elif occupancy_pct >= 75:
        occ_penalty = 8
    elif occupancy_pct >= 65:
        occ_penalty = 4

    # 2. ICU saturation penalty (max 22)
    icu_penalty = 0
    if icu_occ >= 95:
        icu_penalty = 22
    elif icu_occ >= 90:
        icu_penalty = 16
    elif icu_occ >= 80:
        icu_penalty = 10
    elif icu_occ >= 70:
        icu_penalty = 4

    # 3. Emergency Department waiting queue backlog penalty (max 18)
    ed_penalty = 0
    if ed_waiting >= 25:
        ed_penalty = 18
    elif ed_waiting >= 15:
        ed_penalty = 12
    elif ed_waiting >= 8:
        ed_penalty = 6
    elif ed_waiting >= 4:
        ed_penalty = 2

    # 4. Clinical staff workload penalty (max 15)
    staff_penalty = 0
    if avg_workload >= 88:
        staff_penalty = 15
    elif avg_workload >= 80:
        staff_penalty = 10
    elif avg_workload >= 72:
        staff_penalty = 4

    # 5. Active crisis / congestion alerts penalty (max 15)
    # Check both real-time congestion alerts and active database alerts
    from app.services.congestion_service import ACTIVE_CONGESTION_ALERTS
    active_congestion_count = len([a for a in ACTIVE_CONGESTION_ALERTS if a.get("status") in ["ACTIVE", "ESCALATED"]])
    active_db_critical = db.query(Alert).filter(Alert.status == "active", Alert.severity.in_(["critical", "CRITICAL"])).count()
    
    alert_penalty = min(15, max(active_congestion_count * 5, min(15, active_db_critical * 3)))

    # Calculate final health score
    score = 100 - (occ_penalty + icu_penalty + ed_penalty + staff_penalty + alert_penalty)
    score = max(12, min(100, round(score)))
    
    status_label = "OPTIMAL" if score >= 80 else "WARNING" if score >= 60 else "CRITICAL"

    return {
        "health_score": score,
        "status": status_label,
        "score_breakdown": {
            "occupancy_penalty": occ_penalty,
            "icu_penalty": icu_penalty,
            "ed_penalty": ed_penalty,
            "staff_penalty": staff_penalty,
            "alert_penalty": alert_penalty
        },
        "total_patients": active_inpatients,
        "available_beds": available_beds,
        "occupied_beds": occupied_beds,
        "total_beds": total_beds,
        "ed_waiting": ed_waiting,
        "icu_occupancy": icu_occ,
        "staff_available": staff_on_duty,
        "active_alerts": active_alerts,
        "occupancy_pct": occupancy_pct,
        "avg_workload": round(float(avg_workload), 1),
        "departments": dept_data
    }

@router.get("/capacity")
def get_capacity(db: Session = Depends(get_db)):
    depts = db.query(Department).filter(Department.hospital_id == 1).all()
    results = []
    for d in depts:
        dept_beds = db.query(Bed).filter(Bed.department_id == d.id).all()
        if dept_beds:
            t_beds = len(dept_beds)
            o_beds = sum(1 for b in dept_beds if b.status == "occupied")
            a_beds = sum(1 for b in dept_beds if b.status == "available")
            r_beds = sum(1 for b in dept_beds if b.status == "reserved")
        else:
            t_beds = d.total_beds
            o_beds = d.occupied_beds
            a_beds = d.available_beds
            r_beds = d.reserved_beds
            
        utilization = round((o_beds / t_beds * 100), 1) if t_beds > 0 else 0.0
        status = "critical" if utilization > 90 else "warning" if utilization > 80 else "normal"
        
        results.append({
            "id": d.id,
            "name": d.name,
            "type": d.type,
            "total": t_beds,
            "occupied": o_beds,
            "available": a_beds,
            "reserved": r_beds,
            "utilization": utilization,
            "forecast_utilization": round(utilization + 3.5, 1),
            "status": status
        })
    return results

@router.get("/forecast-summary")
def get_forecast_summary(db: Session = Depends(get_db)):
    forecasts = db.query(Forecast).order_by(Forecast.horizon_hours).all()
    return [
        {
            "id": f.id, "department_id": f.department_id, "metric": f.metric,
            "horizon_hours": f.horizon_hours, "predicted_value": f.predicted_value,
            "confidence": f.confidence, "lower_bound": f.lower_bound,
            "upper_bound": f.upper_bound, "model_type": f.model_type
        }
        for f in forecasts
    ]
