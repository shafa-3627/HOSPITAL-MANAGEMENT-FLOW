from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, JSON
from datetime import datetime
from app.database import Base

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String)
    severity = Column(String)
    title = Column(String)
    description = Column(String)
    department_id = Column(Integer, ForeignKey("departments.id"))
    predicted_time = Column(DateTime)
    probability = Column(Float)
    drivers = Column(JSON)
    recommended_actions = Column(JSON)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    acknowledged_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
