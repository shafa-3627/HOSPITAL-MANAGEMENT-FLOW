from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float
from datetime import datetime
from app.database import Base

class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True)
    title = Column(String)
    description = Column(String)
    expected_impact = Column(String)
    confidence = Column(Float)
    affected_department = Column(Integer, ForeignKey("departments.id"))
    action_type = Column(String)
    status = Column(String, default="pending")
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    reason = Column(String, nullable=True)
