import os
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Alert, AuditLog
from app.services.congestion_service import congestion_service, ACTIVE_CONGESTION_ALERTS, STAFF_RECALL_REGISTRY
from app.services.telegram_service import telegram_service
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel

router = APIRouter()

class CreateAlertRequest(BaseModel):
    department: str = "ICU"
    severity: str = "CRITICAL"

class StaffAckRequest(BaseModel):
    recall_id: str
    staff_name: str = "Dr. On-Duty Clinical Specialist"

class StaffRespondRequest(BaseModel):
    recall_id: str
    staff_name: str = "Dr. On-Duty Clinical Specialist"
    eta_minutes: int = 15

class EscalateRequest(BaseModel):
    reason: Optional[str] = "No response from on-call staff within 15 minute window"

class ApproveResponseRequest(BaseModel):
    coordinator_name: Optional[str] = "Dr. Chief Medical Officer"

# Initialize baseline on startup if empty
try:
    from app.database import SessionLocal
    _init_db = SessionLocal()
    if not ACTIVE_CONGESTION_ALERTS:
        congestion_service.reset_all(_init_db)
    _init_db.close()
except Exception:
    pass

@router.get("")
def get_alerts(db: Session = Depends(get_db)):
    alerts = db.query(Alert).order_by(Alert.created_at.desc()).all()
    return [
        {
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "type": a.type,
            "severity": a.severity,
            "status": a.status,
            "department_id": a.department_id,
            "probability": a.probability,
            "drivers": a.drivers,
            "recommended_actions": a.recommended_actions,
            "predicted_time": a.predicted_time.isoformat() if a.predicted_time else None,
            "created_at": a.created_at.isoformat() if a.created_at else None
        } for a in alerts
    ]

@router.get("/active")
def get_active_congestion_alerts(db: Session = Depends(get_db)):
    """Returns real-time active congestion alerts with staff recall telemetry."""
    active_alerts = congestion_service.get_active_alerts(db)
    
    for a in active_alerts:
        recalls = STAFF_RECALL_REGISTRY.get(a["alert_code"], [])
        a["acknowledged_count"] = sum(1 for r in recalls if r["status"] in ["ACKNOWLEDGED", "RESPONDED"])
        a["total_staff_notified"] = len(recalls)
    
    return active_alerts

@router.get("/contacts")
def get_department_contacts():
    """Returns department clinical contact registry."""
    return congestion_service.get_contacts()

@router.post("/create")
@router.post("/evaluate")
def trigger_congestion_alert(req: Optional[CreateAlertRequest] = None, db: Session = Depends(get_db)):
    """
    Evaluates department congestion and triggers automated department-specific alert
    and staff recall notifications.
    """
    dept = req.department if req else "ICU"
    severity = req.severity if req else "CRITICAL"
    alert = congestion_service.evaluate_and_trigger_congestion(db, scenario_dept=dept, force_severity=severity)
    return {
        "success": True,
        "message": f"Automatic {dept} Congestion Alert generated. Clinical response protocol initiated.",
        "alert": alert
    }

@router.post("/{alert_code}/acknowledge-staff")
def acknowledge_staff_recall(alert_code: str, req: StaffAckRequest, db: Session = Depends(get_db)):
    """Staff member acknowledges the emergency recall alert."""
    res = congestion_service.acknowledge_staff_recall(db, alert_code, req.recall_id, req.staff_name)
    return res

@router.post("/{alert_code}/respond-staff")
def respond_staff_recall(alert_code: str, req: StaffRespondRequest, db: Session = Depends(get_db)):
    """Staff member confirms they are En-Route to the hospital."""
    res = congestion_service.respond_staff_recall(db, alert_code, req.recall_id, req.staff_name, req.eta_minutes)
    return res

@router.post("/{alert_code}/escalate")
def escalate_congestion_alert(alert_code: str, req: Optional[EscalateRequest] = None, db: Session = Depends(get_db)):
    """Escalates alert to Tier 2 and notifies Hospital Incident Command."""
    reason = req.reason if req and req.reason else "Unacknowledged within response window"
    res = congestion_service.escalate_alert(db, alert_code, reason)
    return res

@router.post("/{alert_code}/approve")
def approve_response_plan(alert_code: str, req: Optional[ApproveResponseRequest] = None, db: Session = Depends(get_db)):
    """Authorized coordinator approves the emergency response plan."""
    coord = req.coordinator_name if req and req.coordinator_name else "Dr. Medical Director"
    res = congestion_service.coordinator_approve_response(db, alert_code, coord)
    return res

@router.post("/{alert_code}/dismiss")
def dismiss_congestion_alert(alert_code: str, db: Session = Depends(get_db)):
    """Dismisses/resolves congestion alert."""
    res = congestion_service.dismiss_alert(db, alert_code)
    return res

@router.get("/{alert_code}/notifications")
def get_alert_staff_recalls(alert_code: str):
    """Returns staff recall telemetry for specific alert."""
    recalls = STAFF_RECALL_REGISTRY.get(alert_code, [])
    return recalls

@router.get("/{alert_code}/response-status")
def get_alert_response_status(alert_code: str):
    """Returns real-time response telemetry."""
    alert = next((a for a in ACTIVE_CONGESTION_ALERTS if a["alert_code"] == alert_code), None)
    recalls = STAFF_RECALL_REGISTRY.get(alert_code, [])
    ack_count = sum(1 for r in recalls if r["status"] in ["ACKNOWLEDGED", "RESPONDED"])
    
    return {
        "alert_code": alert_code,
        "department": alert["department_name"] if alert else "ICU",
        "total_notified": len(recalls),
        "acknowledged": ack_count,
        "pending": len(recalls) - ack_count,
        "coordinator_approved": alert.get("coordinator_approved", False) if alert else False,
        "status": alert.get("status", "ACTIVE") if alert else "ACTIVE"
    }

@router.post("/reset")
def reset_alerts(db: Session = Depends(get_db)):
    """Resets all congestion alerts and recall rosters to baseline."""
    congestion_service.reset_all(db)
    return {"success": True, "message": "All congestion alerts and staff recall rosters reset to normal baseline."}

@router.post("/{alert_code}/send-telegram")
def send_telegram_for_alert(alert_code: str, db: Session = Depends(get_db)):
    """Dispatches emergency Telegram notification to the affected department lead."""
    alert = next((a for a in ACTIVE_CONGESTION_ALERTS if str(a.get("alert_code")) == alert_code or str(a.get("id")) == alert_code), None)
    
    if not alert:
        db_alert = db.query(Alert).filter((Alert.id == int(alert_code)) if alert_code.isdigit() else (Alert.title.contains(alert_code))).first()
        if db_alert:
            drivers = db_alert.drivers or {}
            alert = {
                "alert_code": drivers.get("alert_code", f"YD-{db_alert.id}"),
                "department_name": db_alert.department.name if db_alert.department else "Hospital Department",
                "department_key": drivers.get("affected_dept", "ICU"),
                "title": db_alert.title,
                "current_occupancy": drivers.get("current_occupancy", 90.0),
                "predicted_occupancy": drivers.get("predicted_occupancy", 98.0),
                "horizon_hours": drivers.get("horizon_hours", 4),
                "severity": db_alert.severity.upper() if db_alert.severity else "CRITICAL"
            }

    if not alert:
        # Fallback default emergency alert
        alert = {
            "alert_code": alert_code,
            "department_name": "Intensive Care Unit",
            "department_key": "ICU",
            "title": "CRITICAL CONGESTION DETECTED",
            "current_occupancy": 92.0,
            "predicted_occupancy": 98.5,
            "horizon_hours": 4,
            "severity": "CRITICAL"
        }

    dept_name = alert.get("department_name") or alert.get("department_key") or "ICU"
    dept_key = alert.get("department_key") or "ICU"
    
    res = telegram_service.send_alert_notification(
        department=dept_name,
        alert_type=alert.get("title", "Congestion Surge"),
        current_occupancy=float(alert.get("current_occupancy", 90.0)),
        predicted_occupancy=float(alert.get("predicted_occupancy", 98.0)),
        prediction_window=f"{alert.get('horizon_hours', 4)} hours",
        risk_level=alert.get("severity", "CRITICAL"),
        alert_id=alert.get("alert_code", alert_code),
        timestamp_str=datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    )

    # Update in-memory state
    for a in ACTIVE_CONGESTION_ALERTS:
        if str(a.get("alert_code")) == alert_code or str(a.get("id")) == alert_code:
            a["telegram_status"] = "SENT / ACCEPTED" if res.get("success") else "FAILED"
            a["telegram_error"] = res.get("error")
            a["telegram_chat_id"] = res.get("chat_id")

    # Record Audit log
    audit = AuditLog(
        username="Clinical Emergency Coordinator",
        role="system",
        action="TELEGRAM_EMERGENCY_DISPATCH",
        entity_type="Alert",
        entity_id=alert.get("alert_code", alert_code),
        reason=f"Telegram notification triggered for {dept_name}. Status: {'ACCEPTED' if res.get('success') else 'FAILED'}",
        timestamp=datetime.utcnow(),
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()

    return res

@router.post("/{id}/acknowledge")
def ack_alert_by_id(id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "acknowledged"
    db.commit()
    return {"status": "acknowledged", "id": id}

@router.post("/{id}/resolve")
def resolve_alert_by_id(id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "resolved"
    alert.resolved_at = datetime.utcnow()
    db.commit()
    return {"status": "resolved", "id": id}
