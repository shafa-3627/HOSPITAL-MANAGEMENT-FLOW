import os

files = {
    "d:\\yodha\\backend\\app\\__init__.py": "",
    "d:\\yodha\\backend\\app\\config.py": """
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./yodha.db"
    SECRET_KEY: str = "yodha-demo-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    DEMO_MODE: bool = True
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "*"]

    class Config:
        env_file = ".env"

settings = Settings()
    """,
    "d:\\yodha\\backend\\app\\database.py": """
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

engine = create_engine(
    settings.DATABASE_URL, connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
    """
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\\n")
