from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Event, Department, Patient, Alert
from datetime import datetime

router = APIRouter()

@router.get("")
def get_anomalies(db: Session = Depends(get_db)):
    events = db.query(Event).filter(Event.event_type.in_(["anomaly", "surge", "crisis", "alert"])).order_by(Event.timestamp.desc()).limit(20).all()
    if not events:
        events = db.query(Event).order_by(Event.timestamp.desc()).limit(10).all()
        
    results = []
    for e in events:
        details_text = e.description
        metric = (e.data or {}).get("metric", "Operational Metric") if isinstance(e.data, dict) else "Operational Metric"
        results.append({
            "id": e.id,
            "event_type": e.event_type,
            "metric": metric,
            "description": details_text,
            "details": details_text,
            "severity": (e.data or {}).get("severity", "medium") if isinstance(e.data, dict) else "medium",
            "timestamp": e.timestamp.isoformat() if e.timestamp else datetime.utcnow().isoformat(),
            "source": (e.data or {}).get("source", "Telemetry Monitor") if isinstance(e.data, dict) else "Telemetry Monitor"
        })
    return results
