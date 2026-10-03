import json
import urllib.request
import urllib.error
from datetime import datetime
from typing import Dict, Any, Optional
from app.config import settings

TELEGRAM_DISPATCH_LOGS = []

class TelegramService:
    def __init__(self):
        self.bot_username = "@CrewResponsebot"

    def _get_token(self) -> Optional[str]:
        # 1. Environment variable
        token = settings.TELEGRAM_BOT_TOKEN or None
        
        # 2. Dynamic live read from backend/.env if needed
        if not token or token == "YOUR_BOT_TOKEN" or token.strip() == "":
            try:
                from pathlib import Path
                from dotenv import dotenv_values
                env_paths = [
                    Path(__file__).resolve().parent.parent.parent / ".env",
                    Path("d:/yodha/backend/.env"),
                    Path("d:/yodha/.env")
                ]
                for p in env_paths:
                    if p.exists():
                        vals = dotenv_values(p)
                        val = vals.get("TELEGRAM_BOT_TOKEN")
                        if val and val != "YOUR_BOT_TOKEN" and val.strip() != "":
                            token = val.strip()
                            break
            except Exception:
                pass

        if not token or token == "YOUR_BOT_TOKEN" or token.strip() == "":
            return None
        return token.strip()

    def mask_chat_id(self, chat_id: Optional[str]) -> str:
        if not chat_id:
            return "NOT_SET"
        s = str(chat_id).strip()
        if len(s) <= 4:
            return "***" + s
        return "*" * (len(s) - 4) + s[-4:]

    def get_department_chat_id(self, department_key: str = "") -> Optional[str]:
        return settings.TELEGRAM_TEST_CHAT_ID

    def send_message(self, chat_id: str, text: str, parse_mode: str = "HTML") -> Dict[str, Any]:
        """
        Calls the official Telegram Bot API sendMessage endpoint.
        Returns a dict indicating success or safe error.
        Never exposes the bot token in logs or responses.
        """
        token = self._get_token()
        masked_id = self.mask_chat_id(chat_id)

        if not token:
            error_msg = "Telegram Bot Token is not configured in backend/.env (TELEGRAM_BOT_TOKEN)."
            return {
                "success": False,
                "error": error_msg,
                "chat_id": masked_id,
                "bot": self.bot_username
            }

        if not chat_id or str(chat_id).strip() == "":
            return {
                "success": False,
                "error": "Telegram Chat ID is missing or not configured.",
                "chat_id": "NOT_SET",
                "bot": self.bot_username
            }

        url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload = {
            "chat_id": str(chat_id).strip(),
            "text": text,
            "parse_mode": parse_mode
        }

        try:
            req_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=req_data,
                headers={"Content-Type": "application/json", "User-Agent": "YODHA-2.0-Emergency-Gateway"}
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                status_code = response.getcode()
                body = response.read().decode("utf-8")
                res_json = json.loads(body)

                if res_json.get("ok"):
                    result_data = res_json.get("result", {})
                    return {
                        "success": True,
                        "message": "Telegram message accepted",
                        "message_id": result_data.get("message_id"),
                        "chat_id": masked_id,
                        "bot": self.bot_username
                    }
                else:
                    raw_desc = res_json.get("description", "Unknown Telegram API rejection")
                    safe_desc = str(raw_desc).replace(token, "[REDACTED_TOKEN]")
                    return {
                        "success": False,
                        "error": safe_desc,
                        "chat_id": masked_id,
                        "bot": self.bot_username
                    }

        except urllib.error.HTTPError as e:
            try:
                err_body = e.read().decode("utf-8")
                err_json = json.loads(err_body)
                raw_desc = err_json.get("description", e.reason)
            except Exception:
                raw_desc = str(e.reason)

            safe_desc = str(raw_desc).replace(token, "[REDACTED_TOKEN]")
            return {
                "success": False,
                "error": f"Telegram API HTTP {e.code}: {safe_desc}",
                "chat_id": masked_id,
                "bot": self.bot_username
            }
        except urllib.error.URLError as e:
            safe_reason = str(e.reason).replace(token, "[REDACTED_TOKEN]")
            return {
                "success": False,
                "error": f"Network error contacting Telegram API: {safe_reason}",
                "chat_id": masked_id,
                "bot": self.bot_username
            }
        except Exception as e:
            safe_err = str(e).replace(token, "[REDACTED_TOKEN]")
            return {
                "success": False,
                "error": f"Internal dispatch error: {safe_err}",
                "chat_id": masked_id,
                "bot": self.bot_username
            }

    def send_test_message(self, chat_id: Optional[str] = None) -> Dict[str, Any]:
        target_chat_id = chat_id or settings.TELEGRAM_TEST_CHAT_ID
        text = (
            "🧪 <b>YODHA TELEGRAM TEST</b>\n\n"
            "Telegram integration is working successfully.\n\n"
            "<b>System:</b> YODHA 2.0\n"
            "<b>Bot:</b> @CrewResponsebot"
        )
        res = self.send_message(target_chat_id, text)
        
        # Log dispatch
        now = datetime.utcnow()
        dispatch_record = {
            "id": f"TG-{len(TELEGRAM_DISPATCH_LOGS) + 1001}",
            "type": "TEST_MESSAGE",
            "department": "TEST",
            "chat_id": self.mask_chat_id(target_chat_id),
            "status": "SENT / ACCEPTED" if res.get("success") else "FAILED",
            "error": res.get("error"),
            "timestamp": now.isoformat(),
            "timestamp_display": now.strftime("%H:%M:%S")
        }
        TELEGRAM_DISPATCH_LOGS.insert(0, dispatch_record)
        if len(TELEGRAM_DISPATCH_LOGS) > 100:
            TELEGRAM_DISPATCH_LOGS.pop()

        return res

    def send_alert_notification(
        self,
        department: str,
        alert_type: str,
        current_occupancy: float,
        predicted_occupancy: float,
        prediction_window: str,
        risk_level: str,
        alert_id: str,
        timestamp_str: Optional[str] = None,
        chat_id_override: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Builds and sends a dynamic department-routed emergency alert to Telegram.
        """
        chat_id = chat_id_override or self.get_department_chat_id(department)
        time_display = timestamp_str or datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

        text = (
            "🚨 <b>YODHA EMERGENCY ALERT</b>\n\n"
            f"<b>Department:</b> {department}\n"
            f"<b>Alert Type:</b> {alert_type}\n\n"
            f"<b>Current Occupancy:</b> {current_occupancy}%\n"
            f"<b>Predicted Occupancy:</b> {predicted_occupancy}%\n"
            f"<b>Prediction Window:</b> {prediction_window}\n\n"
            f"<b>Risk Level:</b> {risk_level}\n\n"
            f"<b>Alert ID:</b> {alert_id}\n"
            f"<b>Time:</b> {time_display}\n\n"
            "Immediate attention required."
        )

        res = self.send_message(chat_id, text)

        # Record in ledger
        now = datetime.utcnow()
        dispatch_record = {
            "id": f"TG-{len(TELEGRAM_DISPATCH_LOGS) + 1001}",
            "alert_id": alert_id,
            "type": "EMERGENCY_ALERT",
            "department": department,
            "chat_id": self.mask_chat_id(chat_id),
            "status": "SENT / ACCEPTED" if res.get("success") else "FAILED",
            "error": res.get("error"),
            "timestamp": now.isoformat(),
            "timestamp_display": now.strftime("%H:%M:%S")
        }
        TELEGRAM_DISPATCH_LOGS.insert(0, dispatch_record)
        if len(TELEGRAM_DISPATCH_LOGS) > 100:
            TELEGRAM_DISPATCH_LOGS.pop()

        return res

    def send_bed_overflow_notification(
        self,
        department: str,
        total_beds: int,
        occupied_beds: int,
        available_beds: int,
        occupancy: float,
        overflow_status: str,
        alert_id: str,
        timestamp_str: Optional[str] = None,
        chat_id_override: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Builds and sends a Bed Overflow Telegram Alert ONLY to STAFF_MANAGER_CHAT_ID.
        """
        chat_id = chat_id_override or settings.STAFF_MANAGER_CHAT_ID or settings.TELEGRAM_TEST_CHAT_ID
        time_display = timestamp_str or datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

        text = (
            "🚨 <b>YODHA BED OVERFLOW ALERT</b>\n\n"
            f"<b>Department:</b> {department}\n"
            f"<b>Total Beds:</b> {total_beds}\n"
            f"<b>Occupied Beds:</b> {occupied_beds}\n"
            f"<b>Available Beds:</b> {available_beds}\n"
            f"<b>Occupancy:</b> {occupancy}%\n"
            f"<b>Overflow Status:</b> {overflow_status}\n\n"
            f"<b>Alert ID:</b> {alert_id}\n"
            f"<b>Time:</b> {time_display}\n\n"
            "Immediate staff action required."
        )

        res = self.send_message(chat_id, text)

        # Record in ledger
        now = datetime.utcnow()
        dispatch_record = {
            "id": f"TG-{len(TELEGRAM_DISPATCH_LOGS) + 1001}",
            "alert_id": alert_id,
            "type": "BED_OVERFLOW_ALERT",
            "department": department,
            "recipient_role": "Staff Manager",
            "chat_id": self.mask_chat_id(chat_id),
            "status": "SENT / ACCEPTED" if res.get("success") else "FAILED",
            "error": res.get("error"),
            "timestamp": now.isoformat(),
            "timestamp_display": now.strftime("%H:%M:%S")
        }
        TELEGRAM_DISPATCH_LOGS.insert(0, dispatch_record)
        if len(TELEGRAM_DISPATCH_LOGS) > 100:
            TELEGRAM_DISPATCH_LOGS.pop()

        return res

    def get_doctor_chat_id(self) -> Optional[str]:
        doc_id = settings.DOCTOR_CHAT_ID
        if not doc_id or doc_id.strip() == "":
            try:
                from pathlib import Path
                from dotenv import dotenv_values
                env_paths = [
                    Path(__file__).resolve().parent.parent.parent / ".env",
                    Path("d:/yodha/backend/.env"),
                    Path("d:/yodha/.env")
                ]
                for p in env_paths:
                    if p.exists():
                        vals = dotenv_values(p)
                        val = vals.get("DOCTOR_CHAT_ID")
                        if val and val.strip() != "":
                            doc_id = val.strip()
                            break
            except Exception:
                pass
        return doc_id or settings.TELEGRAM_TEST_CHAT_ID

    def send_doctor_availability_notification(
        self,
        department: str,
        current_patients: int,
        available_doctors: int,
        required_doctors: int,
        risk_level: str,
        alert_id: str,
        timestamp_str: Optional[str] = None,
        chat_id_override: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Builds and sends a Doctor Availability Telegram Alert ONLY to DOCTOR_CHAT_ID.
        """
        chat_id = chat_id_override or self.get_doctor_chat_id()
        time_display = timestamp_str or datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

        text = (
            "🚨 <b>YODHA DOCTOR AVAILABILITY ALERT</b>\n\n"
            f"<b>Department:</b> {department}\n"
            "<b>Alert Type:</b> PATIENT LOAD HIGH / DOCTOR AVAILABILITY LOW\n\n"
            f"<b>Current Patients:</b> {current_patients}\n"
            f"<b>Available Doctors:</b> {available_doctors}\n"
            f"<b>Required Doctors:</b> {required_doctors}\n\n"
            f"<b>Risk Level:</b> {risk_level}\n\n"
            f"<b>Alert ID:</b> {alert_id}\n"
            f"<b>Time:</b> {time_display}\n\n"
            "Immediate medical attention required."
        )

        res = self.send_message(chat_id, text)

        # Record in ledger
        now = datetime.utcnow()
        dispatch_record = {
            "id": f"TG-{len(TELEGRAM_DISPATCH_LOGS) + 1001}",
            "alert_id": alert_id,
            "type": "DOCTOR_AVAILABILITY_ALERT",
            "department": department,
            "recipient_role": "Doctor",
            "chat_id": self.mask_chat_id(chat_id),
            "status": "SENT / ACCEPTED" if res.get("success") else "FAILED",
            "error": res.get("error"),
            "timestamp": now.isoformat(),
            "timestamp_display": now.strftime("%H:%M:%S")
        }
        TELEGRAM_DISPATCH_LOGS.insert(0, dispatch_record)
        if len(TELEGRAM_DISPATCH_LOGS) > 100:
            TELEGRAM_DISPATCH_LOGS.pop()

        return res

    def get_dispatch_logs(self):
        return TELEGRAM_DISPATCH_LOGS

telegram_service = TelegramService()
