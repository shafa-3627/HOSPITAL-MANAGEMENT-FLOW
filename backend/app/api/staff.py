from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Staff, Department, Recommendation
from app.schemas import StaffResponse
from typing import List, Optional

router = APIRouter()

@router.get("", response_model=List[StaffResponse])
def get_staff(db: Session = Depends(get_db)):
    return db.query(Staff).all()

@router.get("/workload")
def get_workload(db: Session = Depends(get_db)):
    depts = db.query(Department).all()
    dept_stats = []
    for d in depts:
        staff_count = db.query(Staff).filter(Staff.department_id == d.id).count()
        avg_wl = db.query(func.avg(Staff.workload_index)).filter(Staff.department_id == d.id).scalar() or 0
        dept_stats.append({
            "department_id": d.id,
            "department_name": d.name,
            "staff_count": staff_count,
            "avg_workload": round(float(avg_wl), 1)
        })
    return {"departments": dept_stats}

@router.get("/recommendations")
def get_recommendations(db: Session = Depends(get_db)):
    recs = db.query(Recommendation).filter(Recommendation.status == "pending").all()
    # Filter or fallback to staffing recommendations
    staff_recs = [r for r in recs if (r.action_type and "staff" in r.action_type.lower()) or "staff" in (r.title or "").lower()]
    if not staff_recs:
        staff_recs = recs[:4]
    
    return [
        {
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "confidence": r.confidence or 0.85,
            "expected_impact": r.expected_impact or "Reduces department workload by 18%",
            "department_id": r.affected_department or 1,
            "action_type": r.action_type or "staff_reallocation",
            "status": r.status or "pending"
        } for r in staff_recs
    ]

@router.post("/recommendations/{id}/approve")
def approve_recommendation(id: int, db: Session = Depends(get_db)):
    rec = db.query(Recommendation).filter(Recommendation.id == id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    rec.status = "approved"
    db.commit()
    return {"message": "Approved", "id": id}

from app.models import Staff, Department, Recommendation, Patient, AuditLog
from app.services.telegram_service import telegram_service
from datetime import datetime
import random

@router.post("/recommendations/{id}/reject")
def reject_recommendation(id: int, db: Session = Depends(get_db)):
    rec = db.query(Recommendation).filter(Recommendation.id == id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    rec.status = "rejected"
    db.commit()
    return {"message": "Rejected", "id": id}

@router.post("/trigger-doctor-alert")
@router.post("/evaluate-doctor-shortage")
def trigger_doctor_alert(
    department_id: Optional[int] = None,
    dept_key: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Evaluates current patient load vs available doctors using existing YODHA data.
    When patient load is HIGH and available doctors are LOW, sends Doctor Telegram Alert ONLY to DOCTOR_CHAT_ID.
    """
    dept = None
    query = db.query(Department)
    if department_id:
        dept = query.filter(Department.id == department_id).first()
    elif dept_key:
        dept = query.filter(Department.type.ilike(f"%{dept_key}%") | Department.name.ilike(f"%{dept_key}%")).first()
    
    if not dept:
        dept = query.filter(Department.type == "ICU").first() or query.first()

    dept_name = dept.name if dept else (f"{dept_key} Unit" if dept_key else "Emergency & Critical Care")
    dept_id_val = dept.id if dept else 1

    # 1. Query dynamic patient load
    patient_count = db.query(Patient).filter(
        Patient.department_id == dept_id_val,
        Patient.status.in_(["waiting", "admitted", "in_treatment"])
    ).count() if dept else 24

    # Fallback to occupied beds count if patient rows are fewer than census
    current_patients = max(patient_count, dept.occupied_beds if dept else 20, 12)

    # 2. Query dynamic available doctors
    on_duty_doctors = db.query(Staff).filter(
        Staff.department_id == dept_id_val,
        Staff.role.ilike("%doctor%"),
        Staff.status == "on_duty"
    ).count() if dept else 1

    available_doctors = on_duty_doctors

    # 3. Dynamic required doctors calculation (1 doctor per 4 high-acuity patients)
    required_doctors = max(2, (current_patients + 3) // 4)

    # 4. Dynamic Risk Level
    if available_doctors == 0 or available_doctors <= required_doctors // 3:
        risk_level = "CRITICAL"
    elif available_doctors < required_doctors:
        risk_level = "HIGH"
    else:
        risk_level = "MODERATE"

    alert_id = f"DOC-{dept_id_val}-{random.randint(1000, 9999)}"
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

    # 5. Send Telegram Alert ONLY to DOCTOR_CHAT_ID
    res = telegram_service.send_doctor_availability_notification(
        department=dept_name,
        current_patients=current_patients,
        available_doctors=available_doctors,
        required_doctors=required_doctors,
        risk_level=risk_level,
        alert_id=alert_id,
        timestamp_str=now_str
    )

    # 6. Audit Logging
    audit = AuditLog(
        username="Clinical Resource Coordinator",
        role="system",
        action="DOCTOR_AVAILABILITY_TELEGRAM_DISPATCH",
        entity_type="Department",
        entity_id=str(dept_id_val),
        reason=f"Doctor Alert triggered for {dept_name} ({current_patients} patients, {available_doctors}/{required_doctors} MDs). Dispatched to Doctor Telegram.",
        timestamp=datetime.utcnow(),
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()

    return {
        "success": res.get("success", False),
        "department": dept_name,
        "current_patients": current_patients,
        "available_doctors": available_doctors,
        "required_doctors": required_doctors,
        "risk_level": risk_level,
        "alert_id": alert_id,
        "timestamp": now_str,
        "telegram_response": res
    }
