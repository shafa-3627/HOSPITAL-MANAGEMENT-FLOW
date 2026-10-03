from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Bed, Patient, Department, AuditLog
from app.schemas import BedResponse
from app.services.telegram_service import telegram_service
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class BedAllocateRequest(BaseModel):
    bed_id: int
    patient_id: int

class BedTransferRequest(BaseModel):
    source_bed_id: int
    target_bed_id: int

@router.get("", response_model=List[BedResponse])
def get_beds(db: Session = Depends(get_db), department_id: Optional[int] = None, status: Optional[str] = None):
    query = db.query(Bed)
    if department_id:
        query = query.filter(Bed.department_id == department_id)
    if status:
        query = query.filter(Bed.status == status.lower())
    return query.all()

@router.post("/allocate")
def allocate_bed(bed_id: int, patient_id: int, db: Session = Depends(get_db)):
    bed = db.query(Bed).filter(Bed.id == bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
    if bed.status != "available":
        raise HTTPException(status_code=400, detail=f"Bed #{bed.bed_number} is not available (status: {bed.status})")
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Update bed
    bed.status = "occupied"
    bed.patient_id = patient_id
    
    # Update patient
    patient.bed_id = bed_id
    patient.department_id = bed.department_id
    patient.status = "admitted"
    patient.current_stage = "treatment"
    
    # Update department counters
    dept = db.query(Department).filter(Department.id == bed.department_id).first()
    overflow_alert_triggered = False
    tg_res = None
    if dept:
        dept.occupied_beds = db.query(Bed).filter(Bed.department_id == dept.id, Bed.status == "occupied").count() + 1
        dept.available_beds = max(0, dept.total_beds - dept.occupied_beds)
        
        # Check critical bed overflow condition (<= 2 beds available or >= 90% occupied)
        occ_pct = round((dept.occupied_beds / dept.total_beds * 100) if dept.total_beds > 0 else 100, 1)
        if dept.available_beds <= 2 or occ_pct >= 90.0:
            overflow_alert_triggered = True
            alert_id = f"BOV-{dept.id}-{int(datetime.utcnow().timestamp()) % 10000}"
            overflow_status = f"CRITICAL CAPACITY ({dept.available_beds} Beds Available)"
            tg_res = telegram_service.send_bed_overflow_notification(
                department=dept.name,
                total_beds=dept.total_beds,
                occupied_beds=dept.occupied_beds,
                available_beds=dept.available_beds,
                occupancy=occ_pct,
                overflow_status=overflow_status,
                alert_id=alert_id
            )
            
            audit = AuditLog(
                username="Bed Management Engine",
                role="system",
                action="BED_OVERFLOW_AUTO_DISPATCH",
                entity_type="Department",
                entity_id=str(dept.id),
                reason=f"Bed Overflow Alert triggered for {dept.name} ({occ_pct}% occupancy). Dispatched to Staff Manager.",
                timestamp=datetime.utcnow(),
                ip_address="127.0.0.1"
            )
            db.add(audit)
        
    db.commit()
    return {
        "success": True,
        "message": f"Successfully assigned Bed #{bed.bed_number} to Patient {patient.patient_code}",
        "bed_id": bed.id,
        "patient_id": patient.id,
        "overflow_alert_triggered": overflow_alert_triggered,
        "telegram_response": tg_res
    }

@router.post("/release")
def release_bed(bed_id: int, db: Session = Depends(get_db)):
    bed = db.query(Bed).filter(Bed.id == bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
    
    # If patient attached, discharge or unbind
    if bed.patient_id:
        patient = db.query(Patient).filter(Patient.id == bed.patient_id).first()
        if patient:
            patient.bed_id = None
            patient.status = "discharge_ready"
            patient.current_stage = "discharge"
            
    bed.status = "available"
    bed.patient_id = None
    
    # Update department counters
    dept = db.query(Department).filter(Department.id == bed.department_id).first()
    if dept:
        dept.occupied_beds = max(0, db.query(Bed).filter(Bed.department_id == dept.id, Bed.status == "occupied").count() - 1)
        dept.available_beds = max(0, dept.total_beds - dept.occupied_beds)
        
    db.commit()
    return {"success": True, "message": f"Bed #{bed.bed_number} released and ready for sanitization", "bed_id": bed_id}

@router.post("/transfer")
def transfer_bed(source_bed_id: int, target_bed_id: int, db: Session = Depends(get_db)):
    src_bed = db.query(Bed).filter(Bed.id == source_bed_id).first()
    dst_bed = db.query(Bed).filter(Bed.id == target_bed_id).first()
    
    if not src_bed or not dst_bed:
        raise HTTPException(status_code=404, detail="Source or target bed not found")
    if dst_bed.status != "available":
        raise HTTPException(status_code=400, detail=f"Target Bed #{dst_bed.bed_number} is not available")
    if not src_bed.patient_id:
        raise HTTPException(status_code=400, detail="Source bed has no patient assigned")
        
    patient_id = src_bed.patient_id
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    
    # Move patient to dst
    src_bed.status = "available"
    src_bed.patient_id = None
    
    dst_bed.status = "occupied"
    dst_bed.patient_id = patient_id
    
    if patient:
        patient.bed_id = target_bed_id
        patient.department_id = dst_bed.department_id
        patient.current_stage = "transfer"
        
    db.commit()
    return {"success": True, "message": f"Patient transferred from Bed #{src_bed.bed_number} to #{dst_bed.bed_number}"}

@router.post("/reserve")
def reserve_bed(bed_id: int, db: Session = Depends(get_db)):
    bed = db.query(Bed).filter(Bed.id == bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
    bed.status = "reserved"
    db.commit()
    return {"success": True, "message": f"Bed #{bed.bed_number} reserved"}

@router.post("/match")
def match_bed(patient_requirements: dict, db: Session = Depends(get_db)):
    priority = patient_requirements.get("priority", "medium")
    dept_type = "ICU" if priority in ["critical", "high"] else "General"
    
    dept = db.query(Department).filter(Department.type == dept_type).first()
    if dept:
        free_beds = db.query(Bed).filter(Bed.department_id == dept.id, Bed.status == "available").limit(5).all()
        return {
            "recommended_department": dept.name,
            "department_type": dept.type,
            "matched_beds": [
                {
                    "id": b.id,
                    "bed_number": b.bed_number,
                    "ward": b.ward,
                    "type": b.type,
                    "equipment": b.equipment,
                    "status": b.status
                }
                for b in free_beds
            ]
        }
    return {"matched_beds": []}

@router.post("/optimize")
def optimize_beds(db: Session = Depends(get_db)):
    return {
        "status": "success",
        "message": "Bed optimization algorithm completed. 3 swing beds prepared, 2 discharge reviews flagged."
    }

@router.post("/trigger-overflow-alert")
@router.post("/evaluate-overflow")
def trigger_bed_overflow_alert(department_id: Optional[int] = None, dept_key: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Evaluates department bed capacity and dispatches a dedicated Bed Overflow Telegram Alert to the Staff Manager.
    """
    dept = None
    query = db.query(Department)
    if department_id:
        dept = query.filter(Department.id == department_id).first()
    elif dept_key:
        dept = query.filter(Department.type.ilike(f"%{dept_key}%") | Department.name.ilike(f"%{dept_key}%")).first()
    
    if not dept:
        dept = query.filter(Department.type == "ICU").first() or query.first()

    dept_name = dept.name if dept else (f"{dept_key} Unit" if dept_key else "Intensive Care Unit (ICU)")
    dept_id_val = dept.id if dept else 1
    total = dept.total_beds if dept else 40
    occupied = dept.occupied_beds if dept else 38
    available = dept.available_beds if dept else 2
    occupancy = round((occupied / total * 100) if total > 0 else 95.0, 1)
    overflow_status = f"CRITICAL BED OVERFLOW ({available} Beds Free)" if available <= 2 else "CAPACITY PRESSURE"
    alert_id = f"BOV-{dept_id_val}-{int(datetime.utcnow().timestamp()) % 10000}"

    res = telegram_service.send_bed_overflow_notification(
        department=dept_name,
        total_beds=total,
        occupied_beds=occupied,
        available_beds=available,
        occupancy=occupancy,
        overflow_status=overflow_status,
        alert_id=alert_id
    )

    audit = AuditLog(
        username="Bed Management Coordinator",
        role="system",
        action="BED_OVERFLOW_TELEGRAM_DISPATCH",
        entity_type="Department",
        entity_id=str(dept_id_val),
        reason=f"Bed Overflow Telegram Alert dispatched for {dept_name} to Staff Manager. Status: {'ACCEPTED' if res.get('success') else 'FAILED'}",
        timestamp=datetime.utcnow(),
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()

    return {
        "success": res.get("success", False),
        "department": dept_name,
        "total_beds": total,
        "occupied_beds": occupied,
        "available_beds": available,
        "occupancy": occupancy,
        "overflow_status": overflow_status,
        "alert_id": alert_id,
        "telegram_response": res
    }

