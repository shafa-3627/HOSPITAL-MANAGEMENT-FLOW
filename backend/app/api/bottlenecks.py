from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Department, Patient, Bed, Staff
from typing import List

router = APIRouter()

@router.get("")
def get_bottlenecks(db: Session = Depends(get_db)):
    depts = db.query(Department).filter(Department.hospital_id == 1).all()
    icu = next((d for d in depts if d.type == "ICU"), None)
    ed = next((d for d in depts if d.type == "ED"), None)
    gw = next((d for d in depts if d.type == "General"), None)
    
    waiting_ed = db.query(Patient).filter(Patient.status == "waiting").count()
    icu_occ = round(icu.occupied_beds / icu.total_beds * 100, 1) if icu and icu.total_beds > 0 else 88.0
    
    bottlenecks = [
        {
            "id": "b1",
            "rank": 1,
            "transition": "Emergency Department → ICU Inpatient Admission",
            "severity": "critical" if icu_occ > 85 else "high",
            "current_delay_mins": 58,
            "predicted_delay_mins": 92 if icu_occ > 85 else 45,
            "queue_length": max(4, waiting_ed // 3),
            "root_cause": f"ICU ward at {icu_occ}% occupancy with high bed demand.",
            "prescribed_fix": "Expedite discharge review for stable ICU stepdown patients to General Ward."
        },
        {
            "id": "b2",
            "rank": 2,
            "transition": "Clinical Triage → Diagnostic Imaging (CT / Labs)",
            "severity": "high" if waiting_ed > 15 else "medium",
            "current_delay_mins": 38,
            "predicted_delay_mins": 55,
            "queue_length": max(6, waiting_ed // 2),
            "root_cause": "Trauma arrival volume during afternoon clinical shift changeover.",
            "prescribed_fix": "Prioritize fast-track lab orders and dedicate CT scanner 2 to emergency priority."
        },
        {
            "id": "b3",
            "rank": 3,
            "transition": "General Ward Discharge → Bed Sanitization Turnover",
            "severity": "medium",
            "current_delay_mins": 42,
            "predicted_delay_mins": 48,
            "queue_length": 8,
            "root_cause": "Housekeeping turnover bottleneck across 3rd floor surgical ward.",
            "prescribed_fix": "Deploy environmental services float staff to prep ready beds."
        },
        {
            "id": "b4",
            "rank": 4,
            "transition": "Ambulance Arrival → ER Registration Desk",
            "severity": "low",
            "current_delay_mins": 14,
            "predicted_delay_mins": 18,
            "queue_length": 3,
            "root_cause": "Manual insurance and identity intake entry during surge peaks.",
            "prescribed_fix": "Enable FHIR e-kiosk fast registration for stable walk-ins."
        }
    ]
    
    return bottlenecks
