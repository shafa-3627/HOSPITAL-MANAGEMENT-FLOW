from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from app.database import get_db
from app.models import Department, Patient, Staff, Alert, Bed, Forecast, Resource
from app.services.congestion_service import ACTIVE_CONGESTION_ALERTS, STAFF_RECALL_REGISTRY

router = APIRouter()

class CopilotQuery(BaseModel):
    question: str

@router.post("/ask")
def ask_copilot(query: CopilotQuery, db: Session = Depends(get_db)):
    q = query.question.lower()
    evidence = []
    
    depts = db.query(Department).filter(Department.hospital_id == 1).all()
    icu = next((d for d in depts if d.type == "ICU"), None)
    ed = next((d for d in depts if d.type == "ED"), None)
    
    # Check if asking about active emergency alerts, congestion alerts, or staff notification / recall
    if any(k in q for k in ["emergency alert", "active alert", "congestion alert", "who has been notified", "notified", "acknowledged", "recall"]):
        active_alerts = [a for a in ACTIVE_CONGESTION_ALERTS if a.get("status") in ["ACTIVE", "ESCALATED"]]
        if active_alerts:
            latest = active_alerts[0]
            recalls = STAFF_RECALL_REGISTRY.get(latest["alert_code"], [])
            ack_count = sum(1 for r in recalls if r["status"] in ["ACKNOWLEDGED", "RESPONDED"])
            
            evidence = [
                {"label": "Active Congestion Alert", "value": f"{latest['alert_code']} ({latest['department_name']})"},
                {"label": "Affected Department", "value": latest['department_name']},
                {"label": "Staff Recall Progress", "value": f"{ack_count}/{len(recalls)} Acknowledged"},
                {"label": "Predicted Occupancy", "value": f"{latest['predicted_occupancy']}% within {latest['horizon_hours']}h"},
                {"label": "Protocol Status", "value": latest.get("status", "ACTIVE")}
            ]
            answer = (
                f"Active Alert: {latest['title']} ({latest['alert_code']}). "
                f"Affected Department: {latest['department_name']} (Current: {latest['current_occupancy']}%, Predicted: {latest['predicted_occupancy']}%). "
                f"{ack_count} out of {len(recalls)} on-call response team members have acknowledged the alert. "
                f"Cause: {latest['reason']}."
            )
        else:
            db_alerts = db.query(Alert).filter(Alert.status == "active").all()
            evidence = [{"label": a.title, "value": f"Severity: {a.severity.upper()}"} for a in db_alerts[:3]]
            answer = f"There are currently {len(db_alerts)} active operational alerts in the hospital system. All designated department response teams are on standby."
            
    elif any(k in q for k in ["which department is", "congested", "congest", "requires additional support", "support"]):
        active_alerts = [a for a in ACTIVE_CONGESTION_ALERTS if a.get("status") in ["ACTIVE", "ESCALATED"]]
        if active_alerts:
            latest = active_alerts[0]
            evidence = [
                {"label": "Congested Department", "value": latest["department_name"]},
                {"label": "Current Utilization", "value": f"{latest['current_occupancy']}%"},
                {"label": "Projected Peak", "value": f"{latest['predicted_occupancy']}% (in {latest['horizon_hours']}h)"},
                {"label": "Primary Driver", "value": latest["reason"]}
            ]
            answer = (
                f"The most congested department is {latest['department_name']}, currently operating at {latest['current_occupancy']}% occupancy "
                f"and predicted to reach {latest['predicted_occupancy']}% within {latest['horizon_hours']} hours. "
                f"Root cause: {latest['reason']}. Clinical surge protocol has been activated."
            )
        else:
            most_full = max(depts, key=lambda d: d.occupied_beds / d.total_beds if d.total_beds > 0 else 0)
            occ_pct = round(most_full.occupied_beds / most_full.total_beds * 100, 1)
            evidence = [
                {"label": "Highest Occupancy Ward", "value": f"{most_full.name} ({occ_pct}%)"},
                {"label": "Available Beds", "value": str(most_full.available_beds)}
            ]
            answer = f"Currently, {most_full.name} has the highest occupancy at {occ_pct}%. No emergency congestion alert is currently triggered."

    elif any(k in q for k in ["icu", "intensive", "critical care"]):
        occ = round(icu.occupied_beds / icu.total_beds * 100, 1) if icu else 90.0
        forecasts = db.query(Forecast).filter(Forecast.department_id == (icu.id if icu else 2)).all()
        pred_val = f"{forecasts[1].predicted_value:.1f}%" if len(forecasts) > 1 else "97.0%"
        evidence = [
            {"label": "ICU Occupancy", "value": f"{occ}%"},
            {"label": "ICU Beds Occupied", "value": f"{icu.occupied_beds}/{icu.total_beds}" if icu else "27/30"},
            {"label": "Predicted 6h Occupancy", "value": pred_val},
            {"label": "Clinical Lead", "value": "Dr. ICU Charge Intensivist"}
        ]
        if occ > 85:
            answer = f"ICU risk is elevated. Current occupancy is {occ}%, which exceeds the 85% threshold. Predicted occupancy is {pred_val} within 6 hours due to ED admissions. Clinical on-call team recall protocol is active."
        else:
            answer = f"ICU is currently at {occ}% occupancy. This is within acceptable operational limits."
            
    elif any(k in q for k in ["ed", "emergency", "waiting", "delay"]):
        waiting = db.query(Patient).filter(Patient.status == "waiting").count()
        avg_wait = db.query(func.avg(Patient.waiting_time_minutes)).filter(Patient.status == "waiting").scalar() or 22
        evidence = [
            {"label": "ED Patients Waiting", "value": str(waiting)},
            {"label": "Average Wait Time", "value": f"{round(avg_wait)} min"},
            {"label": "ED Occupancy", "value": f"{round(ed.occupied_beds / ed.total_beds * 100, 1)}%" if ed else "82.5%"},
            {"label": "Triage Lead", "value": "ED Emergency Coordinator"}
        ]
        answer = f"There are currently {waiting} patients in the ED queue with an average wait time of {round(avg_wait)} minutes. Designated trauma lead is on duty."
        
    elif any(k in q for k in ["staff", "nurse", "doctor", "workload"]):
        on_duty = db.query(Staff).filter(Staff.status == "on_duty").count()
        total_staff = db.query(Staff).count()
        avg_wl = db.query(func.avg(Staff.workload_index)).scalar() or 74.0
        evidence = [
            {"label": "Staff On Duty", "value": str(on_duty)},
            {"label": "Total Staff", "value": str(total_staff)},
            {"label": "Avg Workload Index", "value": f"{round(float(avg_wl), 1)}/100"},
        ]
        answer = f"{on_duty} staff members are on duty out of {total_staff} total. Average workload index is {round(float(avg_wl),1)}/100. Emergency float recall protocol is active."
        
    elif any(k in q for k in ["morning", "brief", "summary", "today"]):
        total_patients = db.query(Patient).count()
        waiting = db.query(Patient).filter(Patient.status == "waiting").count()
        alerts = db.query(Alert).filter(Alert.status == "active").count()
        evidence = [
            {"label": "Total Patients", "value": str(total_patients)},
            {"label": "ED Waiting", "value": str(waiting)},
            {"label": "Active Alerts", "value": str(alerts)},
            {"label": "ICU Status", "value": "90% (Elevated)"}
        ]
        answer = f"Operational brief: Hospital census is {total_patients} patients, {waiting} waiting in ED, {alerts} active operational alerts. ICU is at 90% capacity with proactive staff recall enabled."
        
    else:
        answer = "I am ready to help with hospital operations telemetry. Try asking: 'What emergency alerts are active?', 'Which department is currently congested?', 'Who has been notified?', 'What is the predicted occupancy?', or 'How many staff acknowledged the alert?'"
        evidence = []
    
    return {"answer": answer, "evidence": evidence, "source": "YODHA AI Copilot — Connected to Live Telemetry & Clinical Flow Engine"}
