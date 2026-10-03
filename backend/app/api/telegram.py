from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.services.telegram_service import telegram_service
from app.models import AuditLog
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel

router = APIRouter()

class SendTelegramTestRequest(BaseModel):
    chat_id: Optional[str] = None

class SendTelegramCustomMessage(BaseModel):
    chat_id: Optional[str] = None
    department: Optional[str] = None
    text: str

class SendTelegramAlertRequest(BaseModel):
    department: str = "ICU"
    alert_type: str = "Congestion & Saturation Surge"
    current_occupancy: float = 92.0
    predicted_occupancy: float = 98.5
    prediction_window: str = "4 hours"
    risk_level: str = "CRITICAL"
    alert_id: str = "YD-1024"
    chat_id: Optional[str] = None

@router.get("/status")
def get_telegram_status():
    token_configured = bool(telegram_service._get_token())
    return {
        "bot_username": "@CrewResponsebot",
        "service_enabled": token_configured,
        "token_configured": token_configured,
        "test_chat_id": telegram_service.mask_chat_id(settings.TELEGRAM_TEST_CHAT_ID),
        "staff_manager_chat_id": telegram_service.mask_chat_id(settings.STAFF_MANAGER_CHAT_ID),
        "doctor_chat_id": telegram_service.mask_chat_id(settings.DOCTOR_CHAT_ID),
        "recent_dispatches_count": len(telegram_service.get_dispatch_logs())
    }

@router.post("/test-doctor")
def test_doctor_telegram(db: Session = Depends(get_db)):
    """Sends a verification test message to the configured Doctor Telegram chat ID."""
    doc_chat_id = settings.DOCTOR_CHAT_ID
    if not doc_chat_id:
        # Check dynamic .env read
        try:
            from pathlib import Path
            from dotenv import dotenv_values
            vals = dotenv_values(Path(__file__).resolve().parent.parent.parent / ".env")
            doc_chat_id = vals.get("DOCTOR_CHAT_ID")
        except Exception:
            pass

    if not doc_chat_id:
        return {"success": False, "error": "DOCTOR_CHAT_ID is not configured in backend/.env"}

    text = (
        "🧪 <b>YODHA CLINICAL GATEWAY TEST</b>\n\n"
        "Doctor Telegram notification channel configured successfully.\n\n"
        "<b>Role:</b> On-Duty Clinical Specialist / Doctor\n"
        "<b>System:</b> YODHA 2.0\n"
        "<b>Bot:</b> @CrewResponsebot"
    )
    res = telegram_service.send_message(doc_chat_id, text)

    audit = AuditLog(
        username="Clinical Admin",
        role="admin",
        action="DOCTOR_TELEGRAM_TEST_DISPATCH",
        entity_type="DoctorGateway",
        entity_id=telegram_service.mask_chat_id(doc_chat_id),
        reason=f"Doctor Telegram verification executed. Result: {res.get('message') or res.get('error')}",
        timestamp=datetime.utcnow(),
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()

    return res

@router.post("/test")
def test_telegram_endpoint(req: Optional[SendTelegramTestRequest] = None, db: Session = Depends(get_db)):
    chat_id = req.chat_id if req else None
    res = telegram_service.send_test_message(chat_id=chat_id)
    
    # Audit log
    audit = AuditLog(
        username="System Administrator",
        role="admin",
        action="TELEGRAM_TEST_DISPATCH",
        entity_type="TelegramGateway",
        entity_id="test-telegram",
        reason=f"Telegram test executed. Result: {res.get('message') or res.get('error')}",
        timestamp=datetime.utcnow(),
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()

    return res

@router.get("/logs")
def get_telegram_logs():
    return telegram_service.get_dispatch_logs()

@router.post("/send-alert")
def send_telegram_alert(req: SendTelegramAlertRequest, db: Session = Depends(get_db)):
    res = telegram_service.send_alert_notification(
        department=req.department,
        alert_type=req.alert_type,
        current_occupancy=req.current_occupancy,
        predicted_occupancy=req.predicted_occupancy,
        prediction_window=req.prediction_window,
        risk_level=req.risk_level,
        alert_id=req.alert_id,
        chat_id_override=req.chat_id
    )

    audit = AuditLog(
        username="Clinical Emergency Engine",
        role="system",
        action="TELEGRAM_EMERGENCY_ALERT_DISPATCHED",
        entity_type="Alert",
        entity_id=req.alert_id,
        reason=f"Telegram alert sent to {req.department}. Status: {'ACCEPTED' if res.get('success') else 'FAILED'}",
        timestamp=datetime.utcnow(),
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()

    return res
