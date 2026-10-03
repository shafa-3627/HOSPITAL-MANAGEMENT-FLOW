import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List, Optional

backend_dir = Path(__file__).resolve().parent.parent
env_file_path = str(backend_dir / ".env")

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./yodha.db"
    SECRET_KEY: str = "yodha-demo-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    DEMO_MODE: bool = True
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "*"]

    # Telegram Bot Configuration (@CrewResponsebot)
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    TELEGRAM_TEST_CHAT_ID: Optional[str] = "8535764406"
    STAFF_MANAGER_CHAT_ID: Optional[str] = "8535764406"
    DOCTOR_CHAT_ID: Optional[str] = None

    # Clinical Emergency Contact Roles
    STAFF_MANAGER_PHONE: str = "8838621677"
    DOCTOR_ALERT_PHONE: str = "9489591645"

    # Agent Bed Capacity Thresholds
    BED_WARNING_THRESHOLD_PCT: float = 15.0
    BED_CRITICAL_THRESHOLD_PCT: float = 10.0
    AGENT_MONITORING_INTERVAL_SEC: int = 10

    class Config:
        env_file = env_file_path
        extra = "ignore"

settings = Settings()
