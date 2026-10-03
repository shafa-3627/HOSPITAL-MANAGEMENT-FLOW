import os
import random
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Alert, Department, Patient, Staff, AuditLog, Forecast
from app.services.telegram_service import telegram_service

# Global in-memory state for real-time congestion alerts and clinical staff recall
STAFF_RECALL_REGISTRY: Dict[str, List[Dict[str, Any]]] = {}
ACTIVE_CONGESTION_ALERTS: List[Dict[str, Any]] = []

# Department clinical contacts directory
DEPARTMENT_CONTACTS = {
    "ED": {
        "key": "ED",
        "name": "Emergency Department",
        "phone": "+919489591645",
        "role": "ED Clinical Director / Triage Lead"
    },
    "ICU": {
        "key": "ICU",
        "name": "Intensive Care Unit",
        "phone": "+919840039052",
        "role": "ICU Intensivist / Charge Nurse"
    },
    "General": {
        "key": "General",
        "name": "General Medicine Ward",
        "phone": "+919894260013",
        "role": "Ward Clinical Supervisor"
    },
    "Operations": {
        "key": "Operations",
        "name": "Hospital Operations & Bed Management",
        "phone": "+918838621677",
        "role": "Incident Commander / Flow Coordinator"
    }
}


class CongestionAlertService:
    def __init__(self):
        self.contacts = DEPARTMENT_CONTACTS

    def get_contacts(self) -> Dict[str, Any]:
        """Returns department contacts for clinical directory."""
        return {
            "department_contacts": self.contacts
        }

    def generate_staff_recalls(
        self,
        db: Session,
        alert_id: str,
        dept_id: Optional[int],
        dept_key: str,
        severity: str = "CRITICAL"
    ) -> List[Dict[str, Any]]:
        """
        Retrieves staff associated with affected department and generates on-call emergency recall orders.
        """
        now = datetime.utcnow()
        query = db.query(Staff)
        if dept_id:
            query = query.filter(Staff.department_id == dept_id)
        
        dept_staff = query.all()
        if not dept_staff:
            dept_staff = db.query(Staff).limit(8).all()

        recalls = []
        for idx, s in enumerate(dept_staff[:7]):
            status = "PENDING"
            recall_id = f"RCL-{alert_id}-{idx+1}"
            
            recall_item = {
                "recall_id": recall_id,
                "alert_id": alert_id,
                "staff_id": s.id,
                "staff_code": s.staff_code,
                "staff_name": s.name,
                "role": s.role,
                "department": s.department.name if s.department else dept_key,
                "specialization": s.specialization or "Critical Care",
                "shift": s.shift,
                "status": status,
                "escalation_tier": 1,
                "notified_at": now.isoformat(),
                "notified_time": now.strftime("%H:%M:%S"),
                "acknowledged_at": None,
                "responded_at": None,
                "eta_minutes": 15 if s.status == "on_call" else 25
            }
            recalls.append(recall_item)

        STAFF_RECALL_REGISTRY[alert_id] = recalls
        return recalls

    def evaluate_and_trigger_congestion(
        self,
        db: Session,
        scenario_dept: Optional[str] = None,
        force_severity: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluates real-time hospital occupancy & forecasts to detect congestion,
        generates the clinical alert record in the database, and produces staff recall telemetry.
        """
        now = datetime.utcnow()
        depts = db.query(Department).all()
        waiting_ed = db.query(Patient).filter(Patient.status == "waiting").count()
        
        target_dept_key = scenario_dept or "ICU"
        target_dept = next((d for d in depts if target_dept_key.lower() in d.name.lower() or target_dept_key.lower() in d.type.lower()), None)
        dept_id = target_dept.id if target_dept else (2 if target_dept_key == "ICU" else 1)
        dept_name = target_dept.name if target_dept else f"{target_dept_key} Department"
        
        if target_dept:
            curr_occ = round((target_dept.occupied_beds / target_dept.total_beds * 100) if target_dept.total_beds > 0 else 88, 1)
        else:
            curr_occ = 90.0 if target_dept_key == "ICU" else 85.0

        pred_occ = min(99.0, round(curr_occ + (7.0 if target_dept_key == "ICU" else 9.5), 1))
        horizon = 4
        severity = force_severity or ("CRITICAL" if pred_occ >= 92 else "HIGH")
        alert_num = random.randint(1000, 9999)
        alert_id = f"YD-{alert_num}"

        # Dynamic Description & Context
        if target_dept_key == "ICU":
            reason = "High Emergency Department admission flow and post-surgical stepdown surge"
            response_req = "Please respond according to hospital emergency protocol. Prepare 3 transfer beds and recall on-call ICU nursing staff."
            title = "CRITICAL ICU CONGESTION DETECTED"
        elif target_dept_key == "ED":
            reason = f"Surge in incoming ambulance trauma cases with {waiting_ed} patients in queue"
            response_req = "Please respond according to emergency department protocol. Rapid triage escalation and resuscitation bay prep required."
            title = "CRITICAL EMERGENCY DEPARTMENT SURGE DETECTED"
        elif target_dept_key == "General":
            reason = "Inpatient surgical ward occupancy near maximum capacity"
            response_req = "Please review available beds and patient-flow requirements. Expedite clinical discharge reviews and prepare stepdown surge beds."
            title = "GENERAL WARD CAPACITY SATURATION RISK"
        else:
            reason = "Multiple ward bottlenecks impacting hospital-wide patient flow"
            response_req = "Incident Command activation and float staff reallocation required. Immediate operational coordination requested."
            title = "HOSPITAL-WIDE OPERATIONAL CRISIS"

        # 1. Create DB Alert
        alert_model = Alert(
            title=title,
            description=f"{reason}. Current occupancy: {curr_occ}%, Projected {horizon}h: {pred_occ}%. {response_req}",
            type="congestion",
            severity=severity.lower(),
            department_id=dept_id,
            predicted_time=now + timedelta(hours=horizon),
            probability=round(pred_occ / 100, 2),
            drivers={
                "current_occupancy": curr_occ,
                "predicted_occupancy": pred_occ,
                "waiting_patients": waiting_ed,
                "horizon_hours": horizon,
                "reason": reason,
                "alert_code": alert_id,
                "affected_dept": target_dept_key
            },
            recommended_actions=[
                "Expedite discharge assessments for eligible stepdown patients",
                "Deploy on-call clinical nursing float pool",
                "Prepare surge capacity beds and verify oxygen/ventilator readiness"
            ],
            status="active",
            created_at=now
        )
        db.add(alert_model)
        db.commit()
        db.refresh(alert_model)

        # 2. Generate On-Call Staff Recall Registry
        staff_recalls = self.generate_staff_recalls(
            db=db,
            alert_id=alert_id,
            dept_id=dept_id,
            dept_key=target_dept_key,
            severity=severity
        )

        # 3. Automatic Telegram Emergency Alert Dispatch
        tg_res = telegram_service.send_alert_notification(
            department=dept_name,
            alert_type=title,
            current_occupancy=curr_occ,
            predicted_occupancy=pred_occ,
            prediction_window=f"{horizon} hours",
            risk_level=severity,
            alert_id=alert_id,
            timestamp_str=now.strftime("%Y-%m-%d %H:%M UTC")
        )

        alert_payload = {
            "id": alert_model.id,
            "alert_code": alert_id,
            "title": title,
            "department_key": target_dept_key,
            "department_name": dept_name,
            "department_id": dept_id,
            "severity": severity,
            "current_occupancy": curr_occ,
            "predicted_occupancy": pred_occ,
            "horizon_hours": horizon,
            "waiting_patients": waiting_ed,
            "reason": reason,
            "required_response": response_req,
            "status": "ACTIVE",
            "created_at": now.isoformat(),
            "created_time_display": now.strftime("%I:%M %p"),
            "staff_recalls": staff_recalls,
            "acknowledged_count": 0,
            "total_staff_notified": len(staff_recalls),
            "coordinator_approved": False,
            "telegram_status": "SENT / ACCEPTED" if tg_res.get("success") else "FAILED",
            "telegram_chat_id": tg_res.get("chat_id"),
            "telegram_error": tg_res.get("error")
        }

        ACTIVE_CONGESTION_ALERTS.insert(0, alert_payload)
        if len(ACTIVE_CONGESTION_ALERTS) > 50:
            ACTIVE_CONGESTION_ALERTS.pop()

        return alert_payload

    def acknowledge_staff_recall(self, db: Session, alert_code: str, recall_id: str, staff_name: str) -> Dict[str, Any]:
        now = datetime.utcnow()
        recalls = STAFF_RECALL_REGISTRY.get(alert_code, [])
        target_recall = next((r for r in recalls if r["recall_id"] == recall_id), None)
        
        if target_recall:
            target_recall["status"] = "ACKNOWLEDGED"
            target_recall["acknowledged_at"] = now.isoformat()
            target_recall["acknowledged_time"] = now.strftime("%H:%M:%S")

        for a in ACTIVE_CONGESTION_ALERTS:
            if a["alert_code"] == alert_code:
                a["acknowledged_count"] = sum(1 for r in recalls if r["status"] in ["ACKNOWLEDGED", "RESPONDED"])

        audit = AuditLog(
            username=staff_name,
            role="clinical_staff",
            action="STAFF_RECALL_ACKNOWLEDGED",
            entity_type="StaffRecall",
            entity_id=recall_id,
            reason=f"Staff member {staff_name} acknowledged emergency recall for alert {alert_code}.",
            timestamp=now,
            ip_address="127.0.0.1"
        )
        db.add(audit)
        db.commit()

        return {"success": True, "recall_id": recall_id, "status": "ACKNOWLEDGED"}

    def respond_staff_recall(self, db: Session, alert_code: str, recall_id: str, staff_name: str, eta_minutes: int = 15) -> Dict[str, Any]:
        now = datetime.utcnow()
        recalls = STAFF_RECALL_REGISTRY.get(alert_code, [])
        target_recall = next((r for r in recalls if r["recall_id"] == recall_id), None)
        
        if target_recall:
            target_recall["status"] = "RESPONDED"
            target_recall["responded_at"] = now.isoformat()
            target_recall["eta_minutes"] = eta_minutes

        for a in ACTIVE_CONGESTION_ALERTS:
            if a["alert_code"] == alert_code:
                a["acknowledged_count"] = sum(1 for r in recalls if r["status"] in ["ACKNOWLEDGED", "RESPONDED"])

        audit = AuditLog(
            username=staff_name,
            role="clinical_staff",
            action="STAFF_RECALL_RESPONDED_EN_ROUTE",
            entity_type="StaffRecall",
            entity_id=recall_id,
            reason=f"Staff member {staff_name} confirmed en-route response (ETA: {eta_minutes} mins) for alert {alert_code}.",
            timestamp=now,
            ip_address="127.0.0.1"
        )
        db.add(audit)
        db.commit()

        return {"success": True, "recall_id": recall_id, "status": "RESPONDED", "eta_minutes": eta_minutes}

    def escalate_alert(self, db: Session, alert_code: str, reason: str = "Unacknowledged within response window") -> Dict[str, Any]:
        now = datetime.utcnow()
        recalls = STAFF_RECALL_REGISTRY.get(alert_code, [])
        for r in recalls:
            if r["status"] == "PENDING":
                r["escalation_tier"] = 2

        for a in ACTIVE_CONGESTION_ALERTS:
            if a["alert_code"] == alert_code:
                a["status"] = "ESCALATED"

        audit = AuditLog(
            username="YODHA Escalation Engine",
            role="system",
            action="ALERT_AUTO_ESCALATED",
            entity_type="Alert",
            entity_id=alert_code,
            reason=f"Alert {alert_code} escalated to Tier 2 & Operations Command: {reason}",
            timestamp=now,
            ip_address="127.0.0.1"
        )
        db.add(audit)
        db.commit()

        return {"success": True, "alert_code": alert_code, "status": "ESCALATED"}

    def coordinator_approve_response(self, db: Session, alert_code: str, coordinator_name: str = "Dr. Medical Director") -> Dict[str, Any]:
        now = datetime.utcnow()
        for a in ACTIVE_CONGESTION_ALERTS:
            if a["alert_code"] == alert_code:
                a["coordinator_approved"] = True
                a["approved_by"] = coordinator_name
                a["approved_at"] = now.isoformat()

        audit = AuditLog(
            username=coordinator_name,
            role="medical_coordinator",
            action="COORDINATOR_RESPONSE_PLAN_APPROVED",
            entity_type="Alert",
            entity_id=alert_code,
            reason=f"Hospital Coordinator {coordinator_name} approved emergency response plan for alert {alert_code}.",
            timestamp=now,
            ip_address="127.0.0.1"
        )
        db.add(audit)
        db.commit()

        return {"success": True, "alert_code": alert_code, "approved": True, "message": "Emergency response plan enacted."}

    def dismiss_alert(self, db: Session, alert_code: str, reason: str = "Congestion stabilized") -> Dict[str, Any]:
        now = datetime.utcnow()
        for a in ACTIVE_CONGESTION_ALERTS:
            if a["alert_code"] == alert_code:
                a["status"] = "RESOLVED"
                a["resolved_at"] = now.isoformat()

        audit = AuditLog(
            username="Hospital Operations Coordinator",
            role="admin",
            action="CONGESTION_ALERT_DISMISSED",
            entity_type="Alert",
            entity_id=alert_code,
            reason=f"Alert {alert_code} resolved/dismissed: {reason}",
            timestamp=now,
            ip_address="127.0.0.1"
        )
        db.add(audit)
        db.commit()

        return {"success": True, "alert_code": alert_code, "status": "RESOLVED"}

    def get_active_alerts(self, db: Session) -> List[Dict[str, Any]]:
        """Returns the active congestion alerts list."""
        if not ACTIVE_CONGESTION_ALERTS:
            self.reset_all(db)
        return ACTIVE_CONGESTION_ALERTS

    def reset_all(self, db: Session):
        """Resets all active congestion alerts and ledger for demo baseline."""
        ACTIVE_CONGESTION_ALERTS.clear()
        STAFF_RECALL_REGISTRY.clear()
        
        # Seed initial baseline alert
        self.evaluate_and_trigger_congestion(db, scenario_dept="ICU", force_severity="CRITICAL")
        if ACTIVE_CONGESTION_ALERTS:
            first_alert = ACTIVE_CONGESTION_ALERTS[0]
            recalls = STAFF_RECALL_REGISTRY.get(first_alert["alert_code"], [])
            for r in recalls[:3]:
                r["status"] = "ACKNOWLEDGED"
                r["acknowledged_at"] = (datetime.utcnow() - timedelta(minutes=4)).isoformat()
                r["acknowledged_time"] = (datetime.utcnow() - timedelta(minutes=4)).strftime("%H:%M:%S")
            first_alert["acknowledged_count"] = 3

congestion_service = CongestionAlertService()
