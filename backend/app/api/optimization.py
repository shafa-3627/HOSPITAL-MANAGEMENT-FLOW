from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Recommendation, AuditLog
from datetime import datetime
from typing import Optional

router = APIRouter()

@router.get("")
def get_recommendations(db: Session = Depends(get_db), status: Optional[str] = None):
    query = db.query(Recommendation)
    if status:
        query = query.filter(Recommendation.status == status.lower())
    recs = query.all()
    return [
        {
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "action_type": r.action_type,
            "expected_impact": r.expected_impact,
            "confidence": r.confidence,
            "affected_department": r.affected_department,
            "status": r.status,
            "alert_id": r.alert_id,
            "reason": r.reason,
            "approved_at": r.approved_at.isoformat() if r.approved_at else None
        } for r in recs
    ]

@router.post("/apply/{id}")
@router.post("/{id}/approve")
def approve_recommendation(id: int, db: Session = Depends(get_db)):
    rec = db.query(Recommendation).filter(Recommendation.id == id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    
    rec.status = "approved"
    rec.approved_at = datetime.utcnow()
    
    # Log to audit trail
    audit = AuditLog(
        timestamp=datetime.utcnow(),
        username="Clinical Admin",
        role="admin",
        action="optimization_approved",
        entity_type="Recommendation",
        entity_id=rec.id,
        reason=f"Approved optimization: {rec.title} ({rec.expected_impact})"
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "status": "approved",
        "message": f"Optimization '{rec.title}' applied and active across hospital wards.",
        "id": id
    }

@router.post("/{id}/reject")
@router.post("/dismiss/{id}")
def reject_recommendation(id: int, db: Session = Depends(get_db)):
    rec = db.query(Recommendation).filter(Recommendation.id == id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    
    rec.status = "rejected"
    rec.approved_at = datetime.utcnow()
    
    audit = AuditLog(
        timestamp=datetime.utcnow(),
        username="Clinical Admin",
        role="admin",
        action="optimization_rejected",
        entity_type="Recommendation",
        entity_id=rec.id,
        reason=f"Dismissed optimization: {rec.title}"
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "status": "rejected",
        "message": f"Optimization '{rec.title}' dismissed.",
        "id": id
    }
