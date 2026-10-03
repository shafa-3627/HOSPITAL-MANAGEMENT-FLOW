import asyncio
import json
import random
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.models import Event, Department, Patient, Bed, Staff

router = APIRouter()

# In-memory streaming broadcast subscribers queue
STREAM_SUBSCRIBERS: List[asyncio.Queue] = []
SIMULATION_ACTIVE = True

EVENT_TEMPLATES = [
    {
        "event_type": "ambulance_arrival",
        "type": "warning",
        "severity": "high",
        "title": "Incoming EMS Unit Arrival",
        "message_tpl": "EMS Unit Medic-{unit} arrived with Level {priority_level} Trauma patient ({patient_code}) to Emergency Bay {bay}",
        "source": "EMS Dispatch Feed",
        "dept": "Emergency & Trauma"
    },
    {
        "event_type": "bed_allocation",
        "type": "info",
        "severity": "medium",
        "title": "Bed Allocated",
        "message_tpl": "Patient {patient_code} assigned to {dept} Bed #{bed_code} following clinical triage",
        "source": "Bed Management Hub",
        "dept": "General Medicine"
    },
    {
        "event_type": "icu_transfer",
        "type": "critical",
        "severity": "critical",
        "title": "Emergency ICU Transfer",
        "message_tpl": "Patient {patient_code} expedited transfer from ED to ICU Bed #{bed_code} for critical ventilation support",
        "source": "Clinical Flow Engine",
        "dept": "Intensive Care Unit (ICU)"
    },
    {
        "event_type": "vitals_alert",
        "type": "critical",
        "severity": "critical",
        "title": "Continuous Telemetry Alert",
        "message_tpl": "Telemetry alarm: SpO2 drop ({spo2}%) and tachyarrhythmia detected for Patient {patient_code}",
        "source": "Biometric Monitor Network",
        "dept": "ICU"
    },
    {
        "event_type": "discharge_completed",
        "type": "success",
        "severity": "low",
        "title": "Discharge Processed",
        "message_tpl": "Patient {patient_code} discharge summary finalized. Bed #{bed_code} marked for sanitization turnover",
        "source": "ADT / EHR System",
        "dept": "General Medicine"
    },
    {
        "event_type": "surge_protocol_activated",
        "type": "warning",
        "severity": "high",
        "title": "Clinical Surge Protocol Initiated",
        "message_tpl": "Surge Protocol activated for {dept}: Predicted congestion threshold reached (Alert ID: YD-{alert_num})",
        "source": "YODHA Clinical Engine",
        "dept": "Emergency Department"
    },
    {
        "event_type": "lab_results_ready",
        "type": "info",
        "severity": "medium",
        "title": "STAT Lab Results Available",
        "message_tpl": "STAT Arterial Blood Gas (ABG) & Troponin panel ready for Patient {patient_code}",
        "source": "LIS / Pathology Hub",
        "dept": "Emergency & Trauma"
    },
    {
        "event_type": "staff_reallocation",
        "type": "info",
        "severity": "medium",
        "title": "Float Nursing Reallocation",
        "message_tpl": "Nurse Float Team deployed 2 RNs to {dept} to balance clinical nurse-to-patient ratio",
        "source": "Workforce Optimizer",
        "dept": "Intensive Care Unit (ICU)"
    },
    {
        "event_type": "resource_restocked",
        "type": "success",
        "severity": "low",
        "title": "Oxygen Reserve Replenished",
        "message_tpl": "Automated supply requisition completed: 8 portable oxygen cylinders delivered to Ward Stepdown Bay",
        "source": "Inventory AI",
        "dept": "General Surgery"
    }
]

def generate_synthetic_event_data(custom_dept: Optional[str] = None) -> Dict[str, Any]:
    tpl = random.choice(EVENT_TEMPLATES)
    patient_num = random.randint(101, 399)
    patient_code = f"P-{patient_num}"
    bed_num = random.randint(1, 40)
    dept_name = custom_dept or tpl["dept"]
    
    bed_prefix = "ICU" if "ICU" in dept_name else "ED" if "Emergency" in dept_name else "W"
    bed_code = f"{bed_prefix}-{bed_num:02d}"
    
    msg = tpl["message_tpl"].format(
        unit=random.randint(10, 29),
        priority_level=random.choice(["1 (Resuscitation)", "2 (Emergent)", "3 (Urgent)"]),
        patient_code=patient_code,
        dept=dept_name,
        bed_code=bed_code,
        bay=random.randint(1, 8),
        spo2=random.randint(82, 89),
        alert_num=random.randint(1000, 9999)
    )
    
    return {
        "event_type": tpl["event_type"],
        "type": tpl["type"],
        "severity": tpl["severity"],
        "title": tpl["title"],
        "message": msg,
        "description": msg,
        "entity_id": patient_code,
        "patient_id": patient_code,
        "department": dept_name,
        "source": tpl["source"],
        "data": {
            "patient_code": patient_code,
            "department": dept_name,
            "severity": tpl["severity"],
            "source": tpl["source"],
            "title": tpl["title"]
        }
    }

def ensure_initial_events_seeded(db: Session, count: int = 30):
    """Ensures at least `count` recent events exist in the database for instant display."""
    existing_count = db.query(Event).count()
    if existing_count < count:
        needed = count - existing_count
        now = datetime.utcnow()
        new_events = []
        for i in range(needed):
            ev_data = generate_synthetic_event_data()
            event_time = now - timedelta(seconds=(needed - i) * random.randint(15, 60))
            event_obj = Event(
                event_type=ev_data["event_type"],
                description=ev_data["description"],
                entity_id=ev_data["entity_id"],
                data=ev_data["data"],
                timestamp=event_time
            )
            new_events.append(event_obj)
        db.add_all(new_events)
        db.commit()

@router.get("")
def get_events(limit: int = 60, db: Session = Depends(get_db)):
    """Returns a list of recent hospital events, normalized with message, severity, and department fields."""
    ensure_initial_events_seeded(db, count=35)
    
    events = db.query(Event).order_by(Event.timestamp.desc()).limit(limit).all()
    
    results = []
    for e in events:
        data_dict = e.data if isinstance(e.data, dict) else {}
        # Infer severity and type from data or event_type
        ev_type = e.event_type or "system_info"
        severity = data_dict.get("severity")
        if not severity:
            if any(k in ev_type.lower() for k in ["critical", "icu", "vitals", "alert"]):
                severity = "critical"
            elif any(k in ev_type.lower() for k in ["warning", "ambulance", "surge"]):
                severity = "warning"
            elif any(k in ev_type.lower() for k in ["discharge", "restock"]):
                severity = "success"
            else:
                severity = "info"

        msg = e.description or data_dict.get("message") or f"Event {ev_type} logged"
        
        results.append({
            "id": e.id,
            "event_type": ev_type,
            "type": severity,
            "severity": severity,
            "title": data_dict.get("title") or ev_type.replace("_", " ").title(),
            "message": msg,
            "description": msg,
            "entity_id": e.entity_id or data_dict.get("patient_code"),
            "patient_id": e.entity_id or data_dict.get("patient_code"),
            "department": data_dict.get("department", "Apex General Hospital"),
            "source": data_dict.get("source", "Hospital Flow Engine"),
            "data": data_dict,
            "timestamp": e.timestamp.isoformat() if e.timestamp else datetime.utcnow().isoformat()
        })
    return results

@router.get("/stream")
async def get_event_stream(request: Request):
    """
    Genuine Server-Sent Events (SSE) stream endpoint.
    Emits real-time live events every 2-4 seconds or on subscriber broadcasts.
    """
    queue = asyncio.Queue()
    STREAM_SUBSCRIBERS.append(queue)

    async def event_generator():
        try:
            # First send initial connection ack
            init_payload = {
                "id": 0,
                "event_type": "stream_connected",
                "type": "info",
                "severity": "info",
                "title": "Live SSE Stream Connected",
                "message": "Connected to YODHA Real-Time Event Stream Broker",
                "department": "Apex Control Tower",
                "source": "Stream Engine",
                "timestamp": datetime.utcnow().isoformat()
            }
            yield f"data: {json.dumps(init_payload)}\n\n"

            # Continuous generator loop
            while True:
                if await request.is_disconnected():
                    break

                try:
                    # Wait for queued broadcast or generate automatic tick event
                    event_data = None
                    try:
                        event_data = await asyncio.wait_for(queue.get(), timeout=random.uniform(2.5, 4.5))
                    except asyncio.TimeoutError:
                        # Periodic live synthetic event emitted if simulation is active
                        if SIMULATION_ACTIVE:
                            ev_info = generate_synthetic_event_data()
                            now = datetime.utcnow()
                            
                            # Persist to database in background
                            db = SessionLocal()
                            try:
                                new_ev = Event(
                                    event_type=ev_info["event_type"],
                                    description=ev_info["message"],
                                    entity_id=ev_info["entity_id"],
                                    data=ev_info["data"],
                                    timestamp=now
                                )
                                db.add(new_ev)
                                db.commit()
                                db.refresh(new_ev)
                                ev_id = new_ev.id
                            except Exception:
                                ev_id = random.randint(1000, 9999)
                            finally:
                                db.close()

                            event_data = {
                                "id": ev_id,
                                "event_type": ev_info["event_type"],
                                "type": ev_info["type"],
                                "severity": ev_info["severity"],
                                "title": ev_info["title"],
                                "message": ev_info["message"],
                                "description": ev_info["message"],
                                "entity_id": ev_info["entity_id"],
                                "patient_id": ev_info["patient_id"],
                                "department": ev_info["department"],
                                "source": ev_info["source"],
                                "data": ev_info["data"],
                                "timestamp": now.isoformat()
                            }

                    if event_data:
                        yield f"data: {json.dumps(event_data)}\n\n"

                except Exception:
                    await asyncio.sleep(1)

        finally:
            if queue in STREAM_SUBSCRIBERS:
                STREAM_SUBSCRIBERS.remove(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/simulate-single")
async def simulate_single_event(dept: Optional[str] = None, db: Session = Depends(get_db)):
    """Triggers an instant simulated event and broadcasts to all active SSE subscribers."""
    ev_info = generate_synthetic_event_data(custom_dept=dept)
    now = datetime.utcnow()
    
    new_ev = Event(
        event_type=ev_info["event_type"],
        description=ev_info["message"],
        entity_id=ev_info["entity_id"],
        data=ev_info["data"],
        timestamp=now
    )
    db.add(new_ev)
    db.commit()
    db.refresh(new_ev)
    
    event_payload = {
        "id": new_ev.id,
        "event_type": ev_info["event_type"],
        "type": ev_info["type"],
        "severity": ev_info["severity"],
        "title": ev_info["title"],
        "message": ev_info["message"],
        "description": ev_info["message"],
        "entity_id": ev_info["entity_id"],
        "patient_id": ev_info["patient_id"],
        "department": ev_info["department"],
        "source": ev_info["source"],
        "data": ev_info["data"],
        "timestamp": now.isoformat()
    }

    # Broadcast to all live SSE queues
    for q in STREAM_SUBSCRIBERS:
        await q.put(event_payload)

    return {"status": "broadcasted", "event": event_payload}

@router.post("/simulation/start")
def start_sim():
    global SIMULATION_ACTIVE
    SIMULATION_ACTIVE = True
    return {"status": "started", "simulation_active": True}

@router.post("/simulation/stop")
def stop_sim():
    global SIMULATION_ACTIVE
    SIMULATION_ACTIVE = False
    return {"status": "stopped", "simulation_active": False}

@router.post("/simulation/reset")
def reset_sim(db: Session = Depends(get_db)):
    db.query(Event).delete()
    db.commit()
    ensure_initial_events_seeded(db, count=40)
    return {"status": "reset", "message": "Event stream reset with 40 fresh operational telemetry events."}
