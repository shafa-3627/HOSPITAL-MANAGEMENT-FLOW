from app.config import settings
from app.models import Notification, AuditLog
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any, Optional

# In-memory delivery ledger for real-time audit visualization
NOTIFICATION_DISPATCH_LOGS = []

class NotificationService:
    @staticmethod
    def send_notification(
        db: Session,
        recipient_role: str,
        title: str,
        message: str,
        severity: str = "HIGH",
        channel: str = "IN_APP",
        related_entity: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Dispatches in-app clinical notification and creates audit trail entry.
        """
        timestamp = datetime.utcnow()
        delivery_status = "DELIVERED"
        provider_note = f"In-App clinical dispatch registered for {recipient_role}."

        # 1. Persist in-app clinical notification
        try:
            in_app_note = Notification(
                user_id=1,  # Broadcast / Admin ID
                type="critical" if severity in ["CRITICAL", "HIGH"] else "warning" if severity == "WARNING" else "info",
                title=title,
                message=message,
                related_entity=related_entity or "Agentic AI",
                is_read=False,
                created_at=timestamp
            )
            db.add(in_app_note)
        except Exception:
            pass

        # 2. Structured Dispatch Record
        dispatch_record = {
            "id": f"NTF-{len(NOTIFICATION_DISPATCH_LOGS) + 1001}",
            "channel": "IN_APP",
            "recipient_role": recipient_role,
            "title": title,
            "message": message,
            "severity": severity,
            "delivery_status": delivery_status,
            "provider_note": provider_note,
            "timestamp": timestamp.isoformat(),
            "timestamp_display": timestamp.strftime("%H:%M:%S")
        }
        
        NOTIFICATION_DISPATCH_LOGS.insert(0, dispatch_record)
        if len(NOTIFICATION_DISPATCH_LOGS) > 100:
            NOTIFICATION_DISPATCH_LOGS.pop()

        # 3. Immutable Audit Trail Entry
        audit = AuditLog(
            username="Clinical Notification Engine",
            role="system",
            action="NOTIFY_IN_APP_DELIVERED",
            entity_type="Notification",
            entity_id=recipient_role,
            reason=f"Alert: {title} | Status: {delivery_status} | Note: {provider_note}",
            timestamp=timestamp,
            ip_address="127.0.0.1"
        )
        db.add(audit)
        db.commit()

        return dispatch_record

    @staticmethod
    def get_dispatch_logs():
        return NOTIFICATION_DISPATCH_LOGS

notification_service = NotificationService()
