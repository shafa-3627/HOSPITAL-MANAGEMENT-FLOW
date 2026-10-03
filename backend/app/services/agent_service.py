from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import hashlib
from typing import Dict, List, Any, Optional

from app.config import settings
from app.models import Department, Bed, Patient, Staff, Alert, AuditLog, Event
from app.services.notification_service import notification_service

class AgenticAIService:
    def __init__(self):
        self.status = "ACTIVE"  # ACTIVE or PAUSED
        self.emergency_mode = {
            "active": False,
            "type": "NONE",
            "severity": "NORMAL",
            "activated_at": None,
            "affected_department": "Hospital Wide",
            "simulated": False,
            "description": "Hospital operating under normal baseline parameters."
        }
        self.thresholds = {
            "bed_warning_pct": settings.BED_WARNING_THRESHOLD_PCT,    # Default: 15.0%
            "bed_critical_pct": settings.BED_CRITICAL_THRESHOLD_PCT,  # Default: 10.0%
            "ed_waiting_backlog": 15,
            "icu_occupancy_critical": 90.0
        }
        self.last_analysis_time = datetime.utcnow()
        self.decision_history: List[Dict[str, Any]] = []
        self.alert_cooldowns: Dict[str, datetime] = {}
        self.simulated_scenario = None

    def toggle_agent(self, db: Session, target_status: Optional[str] = None) -> str:
        """Pauses or Resumes the Agentic AI monitoring loop."""
        if target_status:
            self.status = target_status.upper()
        else:
            self.status = "PAUSED" if self.status == "ACTIVE" else "ACTIVE"
        
        audit = AuditLog(
            username="Clinical Operator",
            role="admin",
            action=f"AGENT_{self.status}",
            entity_type="Agentic AI",
            entity_id="Core Engine",
            reason=f"Agent monitoring loop status toggled to {self.status}",
            timestamp=datetime.utcnow(),
            ip_address="127.0.0.1"
        )
        db.add(audit)
        db.commit()
        return self.status

    def update_thresholds(self, db: Session, new_thresholds: Dict[str, Any]) -> Dict[str, Any]:
        """Updates configurable bed and capacity thresholds."""
        for k, v in new_thresholds.items():
            if k in self.thresholds:
                self.thresholds[k] = float(v)
        
        audit = AuditLog(
            username="Clinical Administrator",
            role="admin",
            action="UPDATE_AGENT_THRESHOLDS",
            entity_type="Agentic AI",
            entity_id="Configuration",
            reason=f"Updated thresholds: {self.thresholds}",
            timestamp=datetime.utcnow(),
            ip_address="127.0.0.1"
        )
        db.add(audit)
        db.commit()
        return self.thresholds

    def activate_emergency_mode(
        self,
        db: Session,
        disaster_type: str,
        severity: str = "CRITICAL",
        affected_dept: str = "Emergency & Trauma",
        is_simulation: bool = True
    ) -> Dict[str, Any]:
        """
        Activates Disaster / Mass Emergency Mode.
        Triggers emergency situation analysis and high-priority patient monitoring.
        """
        now = datetime.utcnow()
        self.emergency_mode = {
            "active": True,
            "type": disaster_type.upper(),
            "severity": severity.upper(),
            "activated_at": now.isoformat(),
            "affected_department": affected_dept,
            "simulated": is_simulation,
            "description": f"{disaster_type.upper()} protocol activated. Surge response and rapid doctor dispatch enabled."
        }

        # Create Disaster Alert in DB
        disaster_alert = Alert(
            type="crisis",
            severity=severity.lower(),
            title=f"🚨 MASS EMERGENCY: {disaster_type.upper()}",
            description=f"Mass emergency protocol active ({disaster_type.upper()}). High-priority patient escalation and rapid triage routing initiated.",
            department_id=1,  # ED
            predicted_time=now + timedelta(hours=1),
            probability=0.98,
            drivers=[f"External disaster: {disaster_type.upper()}", "Anticipated surge arrival volume +60%"],
            recommended_actions=[
                "Deploy emergency triage teams to ambulance bay",
                "Expedite stable general ward discharges to create buffer",
                "Authorize float nursing pool and activate on-call physicians"
            ],
            status="active",
            created_at=now
        )
        db.add(disaster_alert)

        # Log to Audit Trail
        audit = AuditLog(
            username="Emergency Incident Commander",
            role="admin",
            action=f"ACTIVATE_DISASTER_{disaster_type.upper()}",
            entity_type="Emergency Mode",
            entity_id=disaster_type.upper(),
            reason=f"Emergency mode activated. Severity: {severity}. Simulated: {is_simulation}",
            timestamp=now,
            ip_address="127.0.0.1"
        )
        db.add(audit)
        db.commit()

        # Run cycle immediately to analyze and notify
        self.run_agent_cycle(db)

        return self.emergency_mode

    def deactivate_emergency_mode(self, db: Session) -> Dict[str, Any]:
        """Deactivates disaster mode, returns to normal, and resolves scenario alerts."""
        now = datetime.utcnow()
        self.emergency_mode = {
            "active": False,
            "type": "NONE",
            "severity": "NORMAL",
            "activated_at": None,
            "affected_department": "Hospital Wide",
            "simulated": False,
            "description": "Hospital operating under normal baseline parameters."
        }
        self.simulated_scenario = None

        # Resolve active crisis alerts
        db.query(Alert).filter(Alert.type == "crisis", Alert.status == "active").update(
            {"status": "resolved", "resolved_at": now}
        )

        audit = AuditLog(
            username="Emergency Incident Commander",
            role="admin",
            action="DEACTIVATE_DISASTER_MODE",
            entity_type="Emergency Mode",
            entity_id="ALL",
            reason="Mass emergency declared resolved. Hospital returned to normal operational baseline.",
            timestamp=now,
            ip_address="127.0.0.1"
        )
        db.add(audit)
        db.commit()

        return self.emergency_mode

    def run_agent_cycle(self, db: Session) -> Dict[str, Any]:
        """
        Core Agentic AI Evaluation Loop:
        MONITOR → DETECT → ANALYZE → DECIDE → TAKE ACTION → NOTIFY → AUDIT
        """
        self.last_analysis_time = datetime.utcnow()
        now = self.last_analysis_time

        if self.status == "PAUSED":
            return {"status": "PAUSED", "message": "Agent monitoring paused by clinical administrator."}

        # 1. MONITOR & ANALYZE BED CAPACITY
        depts = db.query(Department).filter(Department.hospital_id == 1).all()
        dept_data = []
        for d in depts:
            dept_beds = db.query(Bed).filter(Bed.department_id == d.id).all()
            if dept_beds:
                t_beds = len(dept_beds)
                o_beds = sum(1 for b in dept_beds if b.status == "occupied")
                a_beds = sum(1 for b in dept_beds if b.status == "available")
            else:
                t_beds, o_beds, a_beds = d.total_beds, d.occupied_beds, d.available_beds
            
            utilization = round((o_beds / t_beds * 100), 1) if t_beds > 0 else 0.0
            dept_data.append({
                "id": d.id, "name": d.name, "type": d.type,
                "total": t_beds, "occupied": o_beds, "available": a_beds,
                "utilization": utilization
            })

        total_beds = sum(d["total"] for d in dept_data)
        occupied_beds = sum(d["occupied"] for d in dept_data)
        available_beds = sum(d["available"] for d in dept_data)
        available_pct = round((available_beds / total_beds * 100), 1) if total_beds > 0 else 0.0
        occupancy_pct = round((occupied_beds / total_beds * 100), 1) if total_beds > 0 else 0.0

        icu_dept = next((d for d in dept_data if d["type"] == "ICU"), None)
        icu_utilization = icu_dept["utilization"] if icu_dept else 0.0

        ed_waiting_count = db.query(Patient).filter(Patient.status == "waiting").count()
        total_active_patients = db.query(Patient).filter(Patient.status != "discharged").count()

        # 2. EVALUATE BED CAPACITY THRESHOLDS & DISPATCH MANAGER ALERTS
        is_critical_beds = available_pct <= self.thresholds["bed_critical_pct"]
        is_warning_beds = available_pct <= self.thresholds["bed_warning_pct"]

        if is_critical_beds or is_warning_beds:
            severity = "CRITICAL" if is_critical_beds else "WARNING"
            fingerprint = f"BED_CAPACITY_{severity}_{available_beds}"
            
            # Deduplication cooldown check (5 minutes)
            last_sent = self.alert_cooldowns.get(fingerprint)
            if not last_sent or (now - last_sent).total_seconds() > 300:
                self.alert_cooldowns[fingerprint] = now
                
                # Format Manager Notification Message (using configured phone setting)
                manager_phone = settings.STAFF_MANAGER_PHONE
                manager_msg = (
                    f"🚨 YODHA BED CAPACITY ALERT\n"
                    f"Severity: {severity}\n"
                    f"Available Beds: {available_beds} ({available_pct}% free)\n"
                    f"Occupancy: {occupancy_pct}%\n"
                    f"ICU Load: {icu_utilization}%\n"
                    f"Recommended Action: Review ward discharge candidates and initiate bed-management rebalancing workflow."
                )

                # Dispatch notification
                dispatch = notification_service.send_notification(
                    db=db,
                    recipient_role="Staff / Bed Capacity Manager",
                    title=f"🚨 YODHA BED CAPACITY ALERT ({severity})",
                    message=manager_msg,
                    severity=severity,
                    channel="IN_APP",
                    related_entity="Bed Management"
                )

                # Record Agent Decision with 5-step explanation trace
                decision = {
                    "id": f"DEC-{len(self.decision_history) + 1001}",
                    "timestamp": now.strftime("%H:%M:%S"),
                    "title": f"Bed Capacity Alert Triggered ({severity})",
                    "observed_data": f"Available beds dropped to {available_beds}/{total_beds} ({available_pct}%). ICU at {icu_utilization}%.",
                    "rule_applied": f"Available beds <= {self.thresholds['bed_critical_pct'] if is_critical_beds else self.thresholds['bed_warning_pct']}% configured threshold.",
                    "decision": f"Classified capacity risk as {severity}. Initiated automated Staff Manager dispatch protocol.",
                    "action_taken": "Dispatched In-App Clinical Notification to Staff Manager. Logged to Audit Trail.",
                    "notification_status": dispatch["delivery_status"],
                    "status": "EXECUTED"
                }
                self.decision_history.insert(0, decision)

        # 3. EVALUATE EMERGENCY DISASTER MODE + HIGH-PRIORITY PATIENTS
        if self.emergency_mode["active"]:
            # Query active high-priority / critical patients in ED or unassigned
            critical_patients = db.query(Patient).filter(
                Patient.status.in_(["waiting", "admitted"]),
                Patient.priority.in_(["critical", "high"])
            ).limit(5).all()

            for cp in critical_patients:
                pt_fingerprint = f"DOCTOR_ALERT_{self.emergency_mode['type']}_{cp.id}_{cp.priority}"
                last_pt_sent = self.alert_cooldowns.get(pt_fingerprint)

                if not last_pt_sent or (now - last_pt_sent).total_seconds() > 600:
                    self.alert_cooldowns[pt_fingerprint] = now
                    
                    doc_msg = (
                        f"🚨 YODHA EMERGENCY ALERT\n"
                        f"Emergency Mode: {self.emergency_mode['type']}\n"
                        f"Patient Priority: {cp.priority.upper()}\n"
                        f"Patient ID: {cp.patient_code}\n"
                        f"Department: Emergency & Trauma\n"
                        f"Status: Immediate Clinical Review Required\n"
                        f"Please review the patient immediately."
                    )

                    # Dispatch notification to Doctor group/channel
                    doc_dispatch = notification_service.send_notification(
                        db=db,
                        recipient_role="On-Call Emergency Physician",
                        title=f"🚨 URGENT: High-Priority Patient ({cp.patient_code})",
                        message=doc_msg,
                        severity="CRITICAL",
                        channel="IN_APP",
                        related_entity=f"Patient {cp.patient_code}"
                    )

                    # Record Decision
                    decision = {
                        "id": f"DEC-{len(self.decision_history) + 1001}",
                        "timestamp": now.strftime("%H:%M:%S"),
                        "title": f"Urgent Doctor Notification ({cp.patient_code})",
                        "observed_data": f"Emergency Mode: {self.emergency_mode['type']} is ACTIVE. Patient {cp.patient_code} flagged as {cp.priority.upper()} priority.",
                        "rule_applied": "Emergency Mode == ACTIVE AND Patient Priority in (CRITICAL, HIGH).",
                        "decision": f"Urgent clinical escalation required for Patient {cp.patient_code}.",
                        "action_taken": "Dispatched In-App Clinical Notification to On-Call Doctor. Logged to Audit Trail.",
                        "notification_status": doc_dispatch["delivery_status"],
                        "status": "EXECUTED"
                    }
                    self.decision_history.insert(0, decision)


        if len(self.decision_history) > 50:
            self.decision_history = self.decision_history[:50]

        return {
            "status": self.status,
            "last_analysis_time": self.last_analysis_time.isoformat(),
            "emergency_mode": self.emergency_mode,
            "bed_stats": {
                "total": total_beds,
                "occupied": occupied_beds,
                "available": available_beds,
                "available_pct": available_pct,
                "occupancy_pct": occupancy_pct,
                "icu_occupancy": icu_utilization,
                "ed_waiting": ed_waiting_count,
                "total_patients": total_active_patients
            },
            "thresholds": self.thresholds,
            "recent_decisions": self.decision_history[:10]
        }

    def answer_agent_question(self, question: str, db: Session) -> Dict[str, Any]:
        """
        Intelligent natural-language Q&A Assistant querying the live database state.
        Returns fact-grounded answer with structured Source Evidence Cards.
        """
        q = question.lower()
        now = datetime.utcnow()
        
        # Pull live operational data
        depts = db.query(Department).filter(Department.hospital_id == 1).all()
        beds = db.query(Bed).all()
        total_beds = len(beds)
        occupied_beds = sum(1 for b in beds if b.status == "occupied")
        available_beds = sum(1 for b in beds if b.status == "available")
        occupancy_pct = round((occupied_beds / total_beds * 100), 1) if total_beds > 0 else 0.0

        icu_beds = [b for b in beds if b.ward == "ICU" or b.department_id == 2]
        icu_total = len(icu_beds) or 30
        icu_occupied = sum(1 for b in icu_beds if b.status == "occupied")
        icu_available = sum(1 for b in icu_beds if b.status == "available")
        icu_pct = round((icu_occupied / icu_total * 100), 1) if icu_total > 0 else 0.0

        ed_waiting = db.query(Patient).filter(Patient.status == "waiting").count()
        high_priority_pts = db.query(Patient).filter(
            Patient.status.in_(["waiting", "admitted"]),
            Patient.priority.in_(["critical", "high"])
        ).count()
        total_active_patients = db.query(Patient).filter(Patient.status != "discharged").count()
        active_alerts_count = db.query(Alert).filter(Alert.status == "active").count()

        evidence = []

        if any(w in q for w in ["low on beds", "bed availability", "how many beds", "bed capacity"]):
            is_low = available_beds < (total_beds * (self.thresholds["bed_warning_pct"] / 100))
            if is_low:
                answer = f"Yes, bed availability is under elevated pressure. Currently, {available_beds} beds are available out of {total_beds} total beds ({occupancy_pct}% occupied, {round((available_beds/total_beds)*100,1)}% available). This is below the configured warning threshold of {self.thresholds['bed_warning_pct']}%."
            else:
                answer = f"Hospital bed capacity is currently stable. There are {available_beds} available beds out of {total_beds} total beds ({occupancy_pct}% occupied). Available capacity is {round((available_beds/total_beds)*100,1)}%."
            
            evidence = [
                {"source": "Bed Management", "metric": "Available Beds", "value": f"{available_beds}/{total_beds} ({round((available_beds/total_beds)*100,1)}%)"},
                {"source": "Command Center", "metric": "Total Occupancy", "value": f"{occupancy_pct}%"},
                {"source": "Agentic AI Config", "metric": "Warning Threshold", "value": f"{self.thresholds['bed_warning_pct']}%"}
            ]

        elif any(w in q for w in ["icu", "intensive care", "icu beds"]):
            answer = f"The Intensive Care Unit (ICU) currently has {icu_available} available beds out of {icu_total} total ICU beds ({icu_pct}% occupancy). {'ICU load is critical and requires discharge acceleration.' if icu_pct > 85 else 'ICU capacity is within safe operational margins.'}"
            evidence = [
                {"source": "Bed Management", "metric": "ICU Available Beds", "value": f"{icu_available} free"},
                {"source": "Command Center", "metric": "ICU Occupancy", "value": f"{icu_pct}%"},
                {"source": "Crisis Radar", "metric": "ICU Saturation Threshold", "value": f"{self.thresholds['icu_occupancy_critical']}%"}
            ]

        elif any(w in q for w in ["high priority", "critical patient", "immediate attention", "triage"]):
            answer = f"There are currently {high_priority_pts} patients triaged with HIGH or CRITICAL priority across Emergency and Inpatient wards. {ed_waiting} patients are waiting in the unallocated ED queue."
            evidence = [
                {"source": "Emergency Triage", "metric": "High/Critical Acuity", "value": f"{high_priority_pts} patients"},
                {"source": "Patient Flow", "metric": "ED Waiting Backlog", "value": f"{ed_waiting} patients"},
                {"source": "Audit Trail", "metric": "Doctor Alerts Dispatched", "value": f"{len([d for d in self.decision_history if 'Doctor' in d['title']])}"}
            ]

        elif any(w in q for w in ["emergency", "disaster", "active emergency", "flood", "tsunami", "mass casualty"]):
            if self.emergency_mode["active"]:
                answer = f"🚨 ACTIVE EMERGENCY DETECTED: {self.emergency_mode['type']} ({self.emergency_mode['severity']} Severity) is currently active since {self.emergency_mode['activated_at']}. High-priority doctor dispatch and rapid triage protocols are engaged."
            else:
                answer = "No mass disaster emergency is currently active. The hospital is operating under standard clinical protocols."
            evidence = [
                {"source": "Agentic AI Controller", "metric": "Disaster Mode", "value": self.emergency_mode["type"]},
                {"source": "Command Center", "metric": "Active Crisis Alerts", "value": f"{active_alerts_count} active"},
                {"source": "Audit Trail", "metric": "Emergency State", "value": "ACTIVE" if self.emergency_mode["active"] else "NORMAL"}
            ]

        elif any(w in q for w in ["admitted", "admission", "total patients", "census"]):
            answer = f"The hospital is currently managing {total_active_patients} active inpatients across all 5 wards. {ed_waiting} patients are currently undergoing intake and triage in the Emergency Department."
            evidence = [
                {"source": "Patient Flow", "metric": "Active Inpatients", "value": f"{total_active_patients}"},
                {"source": "Emergency Department", "metric": "ED Waiting", "value": f"{ed_waiting}"},
                {"source": "Command Center", "metric": "Hospital Census", "value": f"{total_active_patients} admitted"}
            ]

        elif any(w in q for w in ["why was this alert", "decision", "why alert", "reason"]):
            if self.decision_history:
                latest = self.decision_history[0]
                answer = f"The latest operational decision was '{latest['title']}'. Reason: {latest['observed_data']} Rule: {latest['rule_applied']} Action taken: {latest['action_taken']}"
                evidence = [
                    {"source": "Agent Decision Engine", "metric": "Decision ID", "value": latest["id"]},
                    {"source": "Rule Evaluator", "metric": "Trigger Rule", "value": latest["rule_applied"]},
                    {"source": "Notification Engine", "metric": "Dispatch Status", "value": latest["notification_status"]}
                ]
            else:
                answer = "No automated escalation decisions have been triggered recently. Operations are within standard safety thresholds."
                evidence = [{"source": "Agentic AI Engine", "metric": "Status", "value": "Normal Baseline"}]

        elif any(w in q for w in ["what action", "what should", "recommend", "next step"]):
            recs = []
            if available_pct <= 15:
                recs.append("Review General Ward discharge candidates to release 5+ beds")
            if icu_pct >= 85:
                recs.append("Prepare 3 ICU swing beds and authorize stepdown transfers")
            if ed_waiting > 10:
                recs.append("Activate fast-track triage nurse to clear ED backlog")
            if self.emergency_mode["active"]:
                recs.append("Maintain active on-call doctor coverage for emergency intake")
            
            if not recs:
                recs.append("Maintain routine bed sanitization and shift monitoring.")

            answer = "Based on current hospital telemetry, the Agent recommends: " + " | ".join(recs)
            evidence = [
                {"source": "AI Optimization", "metric": "Recommended Actions", "value": f"{len(recs)} prioritized"},
                {"source": "Command Center", "metric": "Current Health Score", "value": "Dynamic Flow Index"},
                {"source": "Safety Policy", "metric": "Governance", "value": "AI Recommends. Human Decides."}
            ]

        else:
            answer = f"Apex Control Tower Status: {total_active_patients} active patients, {available_beds} beds available ({occupancy_pct}% occupancy), {icu_available} ICU beds available ({icu_pct}% occupancy), and {high_priority_pts} high-priority patients. All systems operating under {self.status} agent monitoring."
            evidence = [
                {"source": "Command Center", "metric": "Total Patients", "value": str(total_active_patients)},
                {"source": "Bed Management", "metric": "Available Beds", "value": str(available_beds)},
                {"source": "Agentic AI", "metric": "Engine Status", "value": self.status}
            ]

        return {
            "question": question,
            "answer": answer,
            "evidence": evidence,
            "timestamp": now.strftime("%H:%M:%S")
        }

agentic_service = AgenticAIService()
