from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.database import get_db
from app.models import Patient, Bed, Department, AuditLog, Event
from app.schemas import PatientResponse
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import random

router = APIRouter()

class AdmitPatientRequest(BaseModel):
    patient_name: str
    patient_code: Optional[str] = None
    age: int = Field(..., ge=0, le=130)
    gender: str
    contact_number: Optional[str] = None
    department_id: int
    admission_type: str = "General"  # Emergency, General, ICU, Referral
    priority: str = "medium"         # low, medium, high, critical
    chief_complaint: Optional[str] = None
    doctor_name: Optional[str] = None
    bed_required: bool = True
    bed_id: Optional[int] = None
    icu_required: bool = False
    emergency_flag: bool = False
    admission_time: Optional[datetime] = None

class PatientUpdateRequest(BaseModel):
    patient_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    contact_number: Optional[str] = None
    department_id: Optional[int] = None
    priority: Optional[str] = None
    chief_complaint: Optional[str] = None
    doctor_name: Optional[str] = None
    admission_type: Optional[str] = None
    bed_id: Optional[int] = None

class TriageUpdateRequest(BaseModel):
    priority: str
    status: Optional[str] = None

@router.get("", response_model=List[PatientResponse])
def get_patients(
    db: Session = Depends(get_db), 
    department_id: Optional[int] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 500
):
    query = db.query(Patient)
    if department_id:
        query = query.filter(Patient.department_id == department_id)
    if status:
        query = query.filter(Patient.status == status)
    if priority:
        query = query.filter(Patient.priority == priority.lower())
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Patient.patient_code.ilike(search_term),
                Patient.patient_name.ilike(search_term),
                Patient.doctor_name.ilike(search_term),
                Patient.diagnosis_category.ilike(search_term),
                Patient.chief_complaint.ilike(search_term)
            )
        )
    return query.order_by(Patient.arrival_time.desc()).limit(limit).all()

@router.post("", response_model=PatientResponse)
@router.post("/admit", response_model=PatientResponse)
def admit_patient(data: AdmitPatientRequest, db: Session = Depends(get_db)):
    # 1. Validation
    dept = db.query(Department).filter(Department.id == data.department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Selected department does not exist")

    now = data.admission_time or datetime.utcnow()

    # Generate patient code if not provided
    if not data.patient_code or not data.patient_code.strip():
        max_id = db.query(func.max(Patient.id)).scalar() or 1000
        patient_code = f"P-{max_id + 1}"
    else:
        patient_code = data.patient_code.strip().upper()
        # Check duplicate code
        existing = db.query(Patient).filter(Patient.patient_code == patient_code).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Patient ID {patient_code} is already registered")

    # 2. Bed Allocation handling
    assigned_bed = None
    target_bed_id = data.bed_id

    if data.bed_required:
        if target_bed_id:
            assigned_bed = db.query(Bed).filter(Bed.id == target_bed_id).first()
            if not assigned_bed:
                raise HTTPException(status_code=404, detail="Selected bed not found")
            if assigned_bed.status != "available":
                raise HTTPException(status_code=400, detail=f"Bed #{assigned_bed.bed_number} is currently {assigned_bed.status}")
        else:
            # Auto-assign first available bed in target department (or ICU if requested)
            bed_query = db.query(Bed).filter(Bed.department_id == data.department_id, Bed.status == "available")
            if data.icu_required:
                bed_query = db.query(Bed).filter(Bed.ward == "ICU", Bed.status == "available")
            assigned_bed = bed_query.first()

    # Determine status & current stage
    if assigned_bed:
        status = "admitted"
        stage = "treatment"
    elif data.bed_required:
        status = "waiting"
        stage = "bed_allocation"
    else:
        status = "waiting"
        stage = "triage" if data.emergency_flag else "registration"

    # 3. Create Patient Record
    patient = Patient(
        patient_code=patient_code,
        patient_name=data.patient_name.strip(),
        age=data.age,
        gender=data.gender,
        contact_number=data.contact_number,
        department_id=data.department_id,
        bed_id=assigned_bed.id if assigned_bed else None,
        arrival_time=now,
        admission_time=now if status == "admitted" else None,
        status=status,
        diagnosis_category=data.chief_complaint or "General Clinical Assessment",
        chief_complaint=data.chief_complaint,
        admission_type=data.admission_type,
        priority=data.priority.lower(),
        doctor_name=data.doctor_name or "On-Duty Physician",
        icu_required=data.icu_required,
        emergency_flag=data.emergency_flag or (data.admission_type.upper() == "EMERGENCY"),
        current_stage=stage,
        waiting_time_minutes=0,
        is_synthetic=False
    )
    db.add(patient)
    db.flush()  # populate patient.id

    # 4. Update Bed state if assigned
    if assigned_bed:
        assigned_bed.status = "occupied"
        assigned_bed.patient_id = patient.id
        
        # Update department census
        target_dept = db.query(Department).filter(Department.id == assigned_bed.department_id).first()
        if target_dept:
            target_dept.occupied_beds = db.query(Bed).filter(
                Bed.department_id == target_dept.id, Bed.status == "occupied"
            ).count()
            target_dept.available_beds = max(0, target_dept.total_beds - target_dept.occupied_beds)

    # 5. Create Audit Log
    audit = AuditLog(
        username="Admissions Desk",
        role="nurse",
        action="PATIENT_ADMISSION_CREATED",
        entity_type="Patient",
        entity_id=str(patient.patient_code),
        reason=(
            f"Admitted patient {patient.patient_name} ({patient.patient_code}) to {dept.name}. "
            f"Priority: {patient.priority.upper()}, Bed: {assigned_bed.bed_number if assigned_bed else 'Unassigned (Queue)'}"
        ),
        timestamp=now,
        ip_address="127.0.0.1"
    )
    db.add(audit)

    # 6. Dispatch Event
    event = Event(
        event_type="patient_admission",
        description=f"Patient {patient.patient_name} ({patient.patient_code}) admitted to {dept.name} with priority {patient.priority.upper()}",
        entity_id=patient.id,
        data={
            "patient_code": patient.patient_code,
            "department": dept.name,
            "priority": patient.priority,
            "bed_id": assigned_bed.id if assigned_bed else None,
            "admission_type": patient.admission_type
        },
        timestamp=now
    )
    db.add(event)

    db.commit()
    db.refresh(patient)
    return patient

@router.put("/{id}", response_model=PatientResponse)
def update_patient(id: int, data: PatientUpdateRequest, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if data.patient_name is not None:
        patient.patient_name = data.patient_name
    if data.age is not None:
        patient.age = data.age
    if data.gender is not None:
        patient.gender = data.gender
    if data.contact_number is not None:
        patient.contact_number = data.contact_number
    if data.priority is not None:
        patient.priority = data.priority.lower()
    if data.chief_complaint is not None:
        patient.chief_complaint = data.chief_complaint
    if data.doctor_name is not None:
        patient.doctor_name = data.doctor_name
    if data.admission_type is not None:
        patient.admission_type = data.admission_type

    if data.department_id is not None and data.department_id != patient.department_id:
        patient.department_id = data.department_id

    # Bed change request
    if data.bed_id is not None and data.bed_id != patient.bed_id:
        old_bed_id = patient.bed_id
        if old_bed_id:
            old_bed = db.query(Bed).filter(Bed.id == old_bed_id).first()
            if old_bed:
                old_bed.status = "available"
                old_bed.patient_id = None
        
        new_bed = db.query(Bed).filter(Bed.id == data.bed_id).first()
        if new_bed:
            new_bed.status = "occupied"
            new_bed.patient_id = patient.id
            patient.bed_id = new_bed.id
            patient.department_id = new_bed.department_id
            patient.status = "admitted"
            patient.current_stage = "treatment"

    audit = AuditLog(
        username="Operations Coordinator",
        role="admin",
        action="PATIENT_RECORD_UPDATED",
        entity_type="Patient",
        entity_id=str(patient.patient_code),
        reason=f"Updated details for patient {patient.patient_code}",
        timestamp=datetime.utcnow(),
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()
    db.refresh(patient)
    return patient

@router.get("/flow")
def get_patient_flow(db: Session = Depends(get_db)):
    stages = [
        "ambulance", "registration", "triage", "diagnosis", 
        "admission", "bed_allocation", "treatment", "transfer", "discharge"
    ]
    
    stage_counts = {}
    for s in stages:
        count = db.query(Patient).filter(Patient.current_stage == s).count()
        avg_wait = 15 if s in ["registration", "triage"] else 45 if s in ["diagnosis", "bed_allocation"] else 30
        is_bottleneck = count > 20 if s == "bed_allocation" else count > 25
        stage_counts[s] = {
            "stage": s,
            "patient_count": count,
            "avg_wait_minutes": avg_wait,
            "bottleneck": is_bottleneck
        }
        
    return {
        "stages": stage_counts,
        "total_active_patients": db.query(Patient).filter(Patient.status != "discharged").count(),
        "waiting_count": db.query(Patient).filter(Patient.status == "waiting").count(),
        "in_treatment_count": db.query(Patient).filter(Patient.status == "admitted").count()
    }

@router.get("/{id}", response_model=PatientResponse)
def get_patient(id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.post("/{id}/update-stage")
def update_stage(id: int, stage: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    old_stage = patient.current_stage
    patient.current_stage = stage
    
    if stage == "treatment":
        patient.status = "admitted"
    elif stage == "discharge":
        patient.status = "discharged"
        if patient.bed_id:
            bed = db.query(Bed).filter(Bed.id == patient.bed_id).first()
            if bed:
                bed.status = "available"
                bed.patient_id = None
                dept = db.query(Department).filter(Department.id == bed.department_id).first()
                if dept:
                    dept.occupied_beds = max(0, db.query(Bed).filter(Bed.department_id == dept.id, Bed.status == "occupied").count())
                    dept.available_beds = max(0, dept.total_beds - dept.occupied_beds)
            patient.bed_id = None
            
    # Audit log
    audit = AuditLog(
        username="Clinical Nurse",
        role="nurse",
        action="patient_stage_advanced",
        entity_type="Patient",
        entity_id=str(patient.patient_code),
        reason=f"Advanced patient from {old_stage} to {stage}",
        timestamp=datetime.utcnow(),
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()
    return {"success": True, "message": f"Patient {patient.patient_code} moved to {stage}", "patient": patient}

@router.post("/{id}/triage")
def update_triage(id: int, priority: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient.priority = priority.lower()
    
    audit = AuditLog(
        username="Triage Officer",
        role="doctor",
        action="patient_triage_updated",
        entity_type="Patient",
        entity_id=str(patient.patient_code),
        reason=f"Updated triage priority to {priority.upper()}",
        timestamp=datetime.utcnow(),
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()
    return {"success": True, "message": f"Updated triage priority for {patient.patient_code} to {priority}"}

@router.post("/{id}/discharge")
def discharge_patient(id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    patient.status = "discharged"
    patient.current_stage = "discharge"
    
    if patient.bed_id:
        bed = db.query(Bed).filter(Bed.id == patient.bed_id).first()
        if bed:
            bed.status = "available"
            bed.patient_id = None
            dept = db.query(Department).filter(Department.id == bed.department_id).first()
            if dept:
                dept.occupied_beds = max(0, db.query(Bed).filter(Bed.department_id == dept.id, Bed.status == "occupied").count())
                dept.available_beds = max(0, dept.total_beds - dept.occupied_beds)
        patient.bed_id = None
        
    audit = AuditLog(
        username="Attending Physician",
        role="doctor",
        action="patient_discharged",
        entity_type="Patient",
        entity_id=str(patient.patient_code),
        reason=f"Patient {patient.patient_code} discharged; bed released and marked available",
        timestamp=datetime.utcnow(),
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()
    return {"success": True, "message": f"Patient {patient.patient_code} discharged successfully"}
