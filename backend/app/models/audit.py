from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON
from datetime import datetime
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    username = Column(String)
    role = Column(String)
    action = Column(String)
    entity_type = Column(String)
    entity_id = Column(String)
    before_state = Column(JSON)
    after_state = Column(JSON)
    reason = Column(String)
    ip_address = Column(String, nullable=True)
