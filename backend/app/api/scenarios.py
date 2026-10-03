from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Alert, Department, Patient, AuditLog
from app.services.congestion_service import congestion_service
from datetime import datetime

router = APIRouter()

@router.post("/icu-surge")
def icu_surge(db: Session = Depends(get_db)):
    """Triggers ICU surge scenario & initiates clinical surge protocols."""
    alert = congestion_service.evaluate_and_trigger_congestion(db, scenario_dept="ICU", force_severity="CRITICAL")
    return {
        "status": "triggered",
        "scenario": "icu-surge",
        "department": "ICU",
        "message": "ICU Surge scenario activated. Critical surge protocol and staff recall initiated.",
        "alert": alert
    }

@router.post("/ed-congestion")
@router.post("/mass-casualty")
def ed_congestion(db: Session = Depends(get_db)):
    """Triggers ED congestion scenario & initiates rapid triage protocols."""
    alert = congestion_service.evaluate_and_trigger_congestion(db, scenario_dept="ED", force_severity="CRITICAL")
    return {
        "status": "triggered",
        "scenario": "ed-congestion",
        "department": "ED",
        "message": "Emergency Department Congestion activated. Rapid triage and resuscitation bays prepped.",
        "alert": alert
    }

@router.post("/ward-surge")
def ward_surge(db: Session = Depends(get_db)):
    """Triggers General Ward saturation scenario & initiates stepdown review."""
    alert = congestion_service.evaluate_and_trigger_congestion(db, scenario_dept="General", force_severity="HIGH")
    return {
        "status": "triggered",
        "scenario": "ward-surge",
        "department": "General",
        "message": "General Ward Congestion activated. Expedited discharge review protocol initiated.",
        "alert": alert
    }

@router.post("/hospital-emergency")
def hospital_emergency(db: Session = Depends(get_db)):
    """Triggers Hospital-wide crisis & activates Incident Command."""
    alert = congestion_service.evaluate_and_trigger_congestion(db, scenario_dept="Operations", force_severity="CRITICAL")
    return {
        "status": "triggered",
        "scenario": "hospital-emergency",
        "department": "Operations",
        "message": "Hospital-Wide Emergency activated. Incident Command and float nursing pool mobilized.",
        "alert": alert
    }

@router.post("/staff-shortage")
def staff_shortage(db: Session = Depends(get_db)):
    """Triggers Staff Shortage scenario & alerts Operations."""
    alert = congestion_service.evaluate_and_trigger_congestion(db, scenario_dept="Operations", force_severity="HIGH")
    return {
        "status": "triggered",
        "scenario": "staff-shortage",
        "department": "Operations",
        "message": "Staff Shortage scenario triggered. Emergency float pool and on-call roster mobilized.",
        "alert": alert
    }

@router.post("/weekend-surge")
def weekend_surge(db: Session = Depends(get_db)):
    """Triggers Weekend Surge scenario & alerts ED and General Ward."""
    alert = congestion_service.evaluate_and_trigger_congestion(db, scenario_dept="ED", force_severity="HIGH")
    return {
        "status": "triggered",
        "scenario": "weekend-surge",
        "department": "ED",
        "message": "Weekend Volume Surge scenario triggered. ED triage protocol activated.",
        "alert": alert
    }

from app.services.telegram_service import telegram_service
import random

@router.post("/bed-overflow")
@router.post("/bed-shortage")
def bed_overflow_scenario(db: Session = Depends(get_db)):
    """Triggers a realistic Bed Overflow scenario and alerts the Staff Manager via Telegram."""
    dept = db.query(Department).filter(Department.type == "ICU").first() or db.query(Department).first()
    if not dept:
        dept = db.query(Department).first()

    if dept:
        dept.occupied_beds = max(dept.total_beds - 1, int(dept.total_beds * 0.95))
        dept.available_beds = max(0, dept.total_beds - dept.occupied_beds)
        db.commit()

        occupancy = round((dept.occupied_beds / dept.total_beds * 100) if dept.total_beds > 0 else 96.0, 1)
        alert_id = f"BOV-{dept.id}-{random.randint(1000, 9999)}"
        overflow_status = f"CRITICAL BED OVERFLOW ({dept.available_beds} Bed Available)"

        res = telegram_service.send_bed_overflow_notification(
            department=dept.name,
            total_beds=dept.total_beds,
            occupied_beds=dept.occupied_beds,
            available_beds=dept.available_beds,
            occupancy=occupancy,
            overflow_status=overflow_status,
            alert_id=alert_id
        )

        audit = AuditLog(
            username="Scenario Simulator",
            role="system",
            action="BED_OVERFLOW_SCENARIO_TRIGGERED",
            entity_type="Department",
            entity_id=str(dept.id),
            reason=f"Bed Overflow scenario executed for {dept.name}. Notified Staff Manager.",
            timestamp=datetime.utcnow(),
            ip_address="127.0.0.1"
        )
        db.add(audit)
        db.commit()

        return {
            "status": "triggered",
            "scenario": "bed-overflow",
            "department": dept.name,
            "total_beds": dept.total_beds,
            "occupied_beds": dept.occupied_beds,
            "available_beds": dept.available_beds,
            "occupancy": occupancy,
            "message": "Bed Overflow scenario activated. Staff Manager alerted via Telegram.",
            "telegram": res
        }

    return {"status": "error", "message": "No department found"}

@router.post("/doctor-shortage")
def doctor_shortage_scenario(db: Session = Depends(get_db)):
    """
    Triggers a realistic Patient Load High + Doctor Availability Low scenario
    and sends a Telegram alert ONLY to DOCTOR_CHAT_ID.
    """
    dept = db.query(Department).filter(Department.type == "ICU").first() or db.query(Department).first()
    if not dept:
        return {"status": "error", "message": "No department found"}

    from app.models import Staff, Patient

    # Dynamic counts
    patient_count = db.query(Patient).filter(
        Patient.department_id == dept.id,
        Patient.status.in_(["waiting", "admitted", "in_treatment"])
    ).count()
    current_patients = max(patient_count, dept.occupied_beds, 14)

    # Available doctors on duty in this department
    on_duty_doctors = db.query(Staff).filter(
        Staff.department_id == dept.id,
        Staff.role.ilike("%doctor%"),
        Staff.status == "on_duty"
    ).count()

    available_doctors = on_duty_doctors
    required_doctors = max(2, (current_patients + 3) // 4)
    risk_level = "CRITICAL" if available_doctors <= 1 else "HIGH"
    alert_id = f"DOC-{dept.id}-{random.randint(1000, 9999)}"
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

    # Send ONLY to DOCTOR_CHAT_ID
    res = telegram_service.send_doctor_availability_notification(
        department=dept.name,
        current_patients=current_patients,
        available_doctors=available_doctors,
        required_doctors=required_doctors,
        risk_level=risk_level,
        alert_id=alert_id,
        timestamp_str=now_str
    )

    audit = AuditLog(
        username="Scenario Simulator",
        role="system",
        action="DOCTOR_SHORTAGE_SCENARIO_TRIGGERED",
        entity_type="Department",
        entity_id=str(dept.id),
        reason=f"Doctor Shortage scenario executed for {dept.name} ({current_patients} patients, {available_doctors}/{required_doctors} MDs). Notified Doctor Telegram.",
        timestamp=datetime.utcnow(),
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()

    return {
        "status": "triggered",
        "scenario": "doctor-shortage",
        "department": dept.name,
        "current_patients": current_patients,
        "available_doctors": available_doctors,
        "required_doctors": required_doctors,
        "risk_level": risk_level,
        "alert_id": alert_id,
        "message": f"Doctor Shortage scenario activated for {dept.name}. Doctor alerted via Telegram.",
        "telegram": res
    }

@router.post("/reset")
def reset_all_scenarios(db: Session = Depends(get_db)):
    """Resets all scenario alerts and restores baseline hospital conditions."""
    congestion_service.reset_all(db)
    return {
        "status": "reset",
        "message": "All scenario alerts resolved and baseline state restored."
    }
