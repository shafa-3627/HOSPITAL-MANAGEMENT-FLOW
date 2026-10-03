from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AuditLog
from typing import Optional

router = APIRouter()

@router.get("")
def get_audit(
    action: Optional[str] = None, 
    user_id: Optional[int] = None,
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
        
    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "username": l.username or "system",
            "role": l.role or "Administrator",
            "action": l.action,
            "entity_type": l.entity_type or "system",
            "entity_id": str(l.entity_id or ""),
            "before_state": l.before_state,
            "after_state": l.after_state,
            "reason": l.reason or "Standard operational protocol",
            "timestamp": l.timestamp.isoformat() if l.timestamp else None,
            "ip_address": l.ip_address or "127.0.0.1"
        } for l in logs
    ]
