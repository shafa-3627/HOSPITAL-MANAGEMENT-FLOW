from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

from app.database import get_db
from app.models import Alert, AuditLog, Patient, Bed, Department
from app.services.agent_service import agentic_service
from app.services.notification_service import notification_service

router = APIRouter()

class ThresholdUpdateRequest(BaseModel):
    bed_warning_pct: Optional[float] = None
    bed_critical_pct: Optional[float] = None
    ed_waiting_backlog: Optional[int] = None
    icu_occupancy_critical: Optional[float] = None

class EmergencyActivateRequest(BaseModel):
    disaster_type: str = "FLOOD"
    severity: str = "CRITICAL"
    affected_department: str = "Emergency & Trauma"
    is_simulation: bool = True

class HumanOverrideRequest(BaseModel):
    action: str  # acknowledge, dismiss, escalate, resolve
    reason: Optional[str] = "Clinical staff manual override"
    operator_role: Optional[str] = "Charge Nurse / Incident Lead"

class AgentAskRequest(BaseModel):
    question: str

class SimulationTriggerRequest(BaseModel):
    scenario_type: str  # low_beds, flood, tsunami, mass_casualty, high_priority_patient, reset

@router.get("/status")
def get_agent_status(db: Session = Depends(get_db)):
    """Runs a monitoring cycle and returns complete real-time Agentic AI operational telemetry."""
    return agentic_service.run_agent_cycle(db)

@router.post("/toggle")
def toggle_agent_status(target_status: Optional[str] = None, db: Session = Depends(get_db)):
    """Pauses or Resumes the autonomous monitoring cycle."""
    new_status = agentic_service.toggle_agent(db, target_status)
    return {"status": new_status, "message": f"Agentic AI is now {new_status}"}

@router.put("/thresholds")
def update_thresholds(req: ThresholdUpdateRequest, db: Session = Depends(get_db)):
    """Updates dynamic warning and critical thresholds."""
    payload = {k: v for k, v in req.model_dump().items() if v is not None}
    updated = agentic_service.update_thresholds(db, payload)
    return {"success": True, "thresholds": updated, "message": "Agent thresholds updated."}

@router.get("/decisions")
def get_recent_decisions(db: Session = Depends(get_db)):
    """Returns explainable Agent Decision trails with 5-step breakdown."""
    agentic_service.run_agent_cycle(db)
    return agentic_service.decision_history

@router.get("/notifications")
def get_notification_logs():
    """Returns clinical notification delivery logs."""
    return notification_service.get_dispatch_logs()

@router.get("/calls")
def get_call_logs():
    """Returns emergency telemetry and simulated doctor call logs."""
    logs = notification_service.get_dispatch_logs()
    calls = [l for l in logs if l.get("channel") in ["phone", "voice", "call"]]
    if not calls:
        calls = [
            {
                "call_id": "CALL-9021",
                "recipient": "+91 98765 43210 (Dr. Rithish T, Chief of Trauma)",
                "status": "COMPLETED",
                "duration_seconds": 45,
                "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
                "event": "Automated Mass Casualty Trigger"
            }
        ]
    return calls

@router.post("/emergency/activate")
def activate_emergency(req: EmergencyActivateRequest, db: Session = Depends(get_db)):
    """Activates mass emergency / disaster mode with rapid triage and doctor notification."""
    mode = agentic_service.activate_emergency_mode(
        db=db,
        disaster_type=req.disaster_type,
        severity=req.severity,
        affected_dept=req.affected_department,
        is_simulation=req.is_simulation
    )
    return {"success": True, "emergency_mode": mode, "message": f"Emergency mode {req.disaster_type.upper()} activated."}

@router.post("/emergency/deactivate")
def deactivate_emergency(db: Session = Depends(get_db)):
    """Deactivates disaster mode, resolves crisis alerts, and returns to baseline."""
    mode = agentic_service.deactivate_emergency_mode(db)
    return {"success": True, "emergency_mode": mode, "message": "Emergency mode deactivated. System returned to baseline."}

@router.post("/alerts/{id}/override")
def human_override_alert(id: int, req: HumanOverrideRequest, db: Session = Depends(get_db)):
    """Human-in-the-Loop Override for Agent alerts (Acknowledge, Dismiss, Escalate, Resolve)."""
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    action_type = req.action.lower()
    now = datetime.utcnow()
    
    if action_type in ["resolve", "dismiss"]:
        alert.status = "resolved"
        alert.resolved_at = now
    elif action_type == "acknowledge":
        alert.status = "acknowledged"
    elif action_type == "escalate":
        alert.severity = "critical"
    
    audit = AuditLog(
        username="Clinical Operator",
        role=req.operator_role or "doctor",
        action=f"AGENT_ALERT_OVERRIDE_{action_type.upper()}",
        entity_type="Alert",
        entity_id=str(alert.id),
        reason=f"Human override on Alert '{alert.title}': {req.reason}",
        timestamp=now,
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "alert_id": id,
        "action": req.action,
        "new_status": alert.status,
        "message": f"Alert #{id} successfully updated by human operator."
    }

@router.post("/ask")
def ask_agent_qa(req: AgentAskRequest, db: Session = Depends(get_db)):
    """Real-time natural language Q&A backed by live hospital database telemetry."""
    return agentic_service.answer_agent_question(req.question, db)

@router.post("/simulation/trigger")
def trigger_simulation_scenario(req: SimulationTriggerRequest, db: Session = Depends(get_db)):
    """Controlled hackathon demo simulation triggers."""
    scenario = req.scenario_type.lower()
    now = datetime.utcnow()
    
    if scenario == "low_beds":
        # Simulate bed capacity critical condition
        agentic_service.thresholds["bed_warning_pct"] = 30.0  # Temporarily elevate threshold to trigger alert
        agentic_service.run_agent_cycle(db)
        return {
            "success": True,
            "scenario": "low_beds",
            "message": "Simulated low bed capacity condition. Capacity alert triggered."
        }


    elif scenario in ["flood", "tsunami", "mass_casualty", "earthquake", "fire"]:
        agentic_service.activate_emergency_mode(
            db=db,
            disaster_type=scenario.upper(),
            severity="CRITICAL",
            affected_dept="Emergency & Trauma",
            is_simulation=True
        )
        return {
            "success": True,
            "scenario": scenario,
            "message": f"Simulated {scenario.upper()} emergency mode activated. Doctor notification protocol dispatched."
        }

    elif scenario == "high_priority_patient":
        # Create a critical triage patient in ED
        patient_code = f"P-DEMO-{datetime.utcnow().strftime('%S%f')[:4]}"
        patient = Patient(
            patient_code=patient_code,
            age=54,
            gender="Female",
            priority="critical",
            department_id=1,
            status="waiting",
            current_stage="triage",
            diagnosis_category="Acute Trauma / Shock",
            arrival_time=now,
            is_synthetic=True
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)
        
        # If emergency mode is active, agent will trigger doctor alert
        if not agentic_service.emergency_mode["active"]:
            agentic_service.activate_emergency_mode(db, "MASS_CASUALTY", "CRITICAL", is_simulation=True)
        else:
            agentic_service.run_agent_cycle(db)
            
        return {
            "success": True,
            "scenario": "high_priority_patient",
            "patient_code": patient_code,
            "message": f"Injected critical patient {patient_code} into triage. Doctor emergency alert dispatched."
        }

    elif scenario == "reset":
        agentic_service.deactivate_emergency_mode(db)
        agentic_service.thresholds["bed_warning_pct"] = settings.BED_WARNING_THRESHOLD_PCT
        agentic_service.thresholds["bed_critical_pct"] = settings.BED_CRITICAL_THRESHOLD_PCT
        return {
            "success": True,
            "scenario": "reset",
            "message": "All simulation states and emergency disaster modes reset to normal baseline."
        }

    return {"success": False, "message": f"Unknown scenario: {scenario}"}
