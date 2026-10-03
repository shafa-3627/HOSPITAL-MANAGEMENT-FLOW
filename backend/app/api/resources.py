from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Resource, Forecast, AuditLog
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel
import random

router = APIRouter()

# In-memory store for real-time emergency orders
EMERGENCY_ORDERS = [
    {
        "order_id": "EMERG-ORD-9021",
        "resource_name": "Mechanical Ventilators",
        "quantity": 5,
        "urgency": "CRITICAL",
        "supplier": "State Medical Equipment Logistics Hub",
        "status": "In-Transit",
        "eta_minutes": 22,
        "dispatched_at": (datetime.utcnow() - timedelta(minutes=8)).strftime("%H:%M:%S"),
        "destination": "Apex General Hospital - ICU Wing",
        "tracking_code": "TRK-APEX-8841"
    },
    {
        "order_id": "EMERG-ORD-9018",
        "resource_name": "Liquid Oxygen Cylinders (50L)",
        "quantity": 25,
        "urgency": "HIGH",
        "supplier": "Regional Cryogenic Gas Supply Depot",
        "status": "In-Transit",
        "eta_minutes": 35,
        "dispatched_at": (datetime.utcnow() - timedelta(minutes=15)).strftime("%H:%M:%S"),
        "destination": "Apex General Hospital - Central Supply",
        "tracking_code": "TRK-APEX-8839"
    }
]

class EmergencyOrderRequest(BaseModel):
    quantity: int = 5
    urgency: str = "CRITICAL"
    reason: Optional[str] = "Automated Emergency Low-Stock Replenishment"

@router.get("")
def get_resources(db: Session = Depends(get_db)):
    resources = db.query(Resource).all()
    results = []
    for r in resources:
        # Define minimum safety threshold per resource type
        min_threshold = 5 if r.type == "ventilator" else 20 if r.type == "oxygen" else 10
        is_critical = r.available < min_threshold or r.predicted_demand_6h > r.available
        
        results.append({
            "id": r.id,
            "name": r.name,
            "type": r.type,
            "department_id": r.department_id,
            "total": r.total,
            "available": r.available,
            "in_use": r.in_use,
            "maintenance": r.maintenance,
            "predicted_demand_6h": r.predicted_demand_6h,
            "predicted_demand_12h": r.predicted_demand_12h,
            "min_safety_threshold": min_threshold,
            "is_critical_shortage": is_critical,
            "auto_reorder_enabled": True
        })
    return results

@router.get("/emergency-orders")
def get_emergency_orders():
    return EMERGENCY_ORDERS

@router.post("/{id}/emergency-order")
def create_emergency_order(id: int, req: EmergencyOrderRequest, db: Session = Depends(get_db)):
    res = db.query(Resource).filter(Resource.id == id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    order_num = f"EMERG-ORD-{random.randint(1000, 9999)}"
    trk_code = f"TRK-APEX-{random.randint(1000, 9999)}"
    
    order = {
        "order_id": order_num,
        "resource_name": res.name,
        "quantity": req.quantity,
        "urgency": req.urgency,
        "supplier": "State Emergency Medical Logistics Hub",
        "status": "Dispatched (Expedited)",
        "eta_minutes": 25,
        "dispatched_at": datetime.utcnow().strftime("%H:%M:%S"),
        "destination": "Apex General Hospital - Central Receiving",
        "tracking_code": trk_code
    }
    
    EMERGENCY_ORDERS.insert(0, order)
    
    # Log to audit trail
    audit = AuditLog(
        timestamp=datetime.utcnow(),
        username="System AI Automated Re-order",
        role="admin",
        action="emergency_resource_auto_order",
        entity_type="Resource",
        entity_id=res.id,
        reason=f"Automated emergency replenishment triggered for {res.name}: {req.quantity} units ordered (ETA 25m)."
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "message": f"Emergency order {order_num} successfully dispatched for {req.quantity}x {res.name}! ETA: 25 minutes.",
        "order": order
    }

@router.post("/auto-dispatch-critical")
def auto_dispatch_all_critical(db: Session = Depends(get_db)):
    resources = db.query(Resource).all()
    dispatched = []
    
    for r in resources:
        min_threshold = 5 if r.type == "ventilator" else 20 if r.type == "oxygen" else 10
        if r.available < min_threshold or r.predicted_demand_6h > r.available:
            qty = max(10, min_threshold * 2 - r.available)
            order_num = f"EMERG-ORD-{random.randint(1000, 9999)}"
            order = {
                "order_id": order_num,
                "resource_name": r.name,
                "quantity": qty,
                "urgency": "CRITICAL",
                "supplier": "State Emergency Medical Logistics Hub",
                "status": "Dispatched (Expedited)",
                "eta_minutes": 20,
                "dispatched_at": datetime.utcnow().strftime("%H:%M:%S"),
                "destination": "Apex General Hospital",
                "tracking_code": f"TRK-APEX-{random.randint(1000, 9999)}"
            }
            EMERGENCY_ORDERS.insert(0, order)
            dispatched.append(order)
            
    return {
        "success": True,
        "dispatched_count": len(dispatched),
        "orders": dispatched,
        "message": f"Successfully auto-dispatched {len(dispatched)} emergency replenishment orders for all critical equipment!"
    }

@router.put("/{id}")
def update_resource(id: int, count: int, db: Session = Depends(get_db)):
    res = db.query(Resource).filter(Resource.id == id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
    res.available = count
    db.commit()
    return res

@router.get("/forecast")
def get_resource_forecast(db: Session = Depends(get_db)):
    forecasts = db.query(Forecast).filter(Forecast.metric.like("%resource%")).all()
    if not forecasts:
        forecasts = db.query(Forecast).limit(5).all()
    return [
        {
            "id": f.id, "department_id": f.department_id, "metric": f.metric,
            "horizon_hours": f.horizon_hours, "predicted_value": f.predicted_value,
            "created_at": f.created_at.isoformat() if f.created_at else None
        } for f in forecasts
    ]
