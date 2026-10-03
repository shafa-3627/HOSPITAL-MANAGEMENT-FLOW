from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Alert

router = APIRouter()

@router.get("")
def get_crisis(db: Session = Depends(get_db)):
    crises = db.query(Alert).filter(Alert.severity == "critical").all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "type": c.type,
            "severity": c.severity,
            "status": c.status,
            "probability": c.probability,
            "department_id": c.department_id,
            "drivers": c.drivers,
            "recommended_actions": c.recommended_actions,
            "predicted_time": c.predicted_time.isoformat() if c.predicted_time else None,
            "created_at": c.created_at.isoformat() if c.created_at else None
        } for c in crises
    ]

@router.get("/{id}/details")
def crisis_det(id: int, db: Session = Depends(get_db)):
    crisis = db.query(Alert).filter(Alert.id == id, Alert.severity == "critical").first()
    if not crisis:
        raise HTTPException(status_code=404, detail="Crisis not found")
    return {
        "id": crisis.id,
        "title": crisis.title,
        "description": crisis.description,
        "type": crisis.type,
        "severity": crisis.severity,
        "status": crisis.status,
        "probability": crisis.probability,
        "department_id": crisis.department_id,
        "drivers": crisis.drivers,
        "recommended_actions": crisis.recommended_actions,
        "predicted_time": crisis.predicted_time.isoformat() if crisis.predicted_time else None,
        "created_at": crisis.created_at.isoformat() if crisis.created_at else None
    }
