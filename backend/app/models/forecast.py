from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, JSON
from datetime import datetime
from app.database import Base

class Forecast(Base):
    __tablename__ = "forecasts"
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"))
    metric = Column(String)
    horizon_hours = Column(Integer)
    predicted_value = Column(Float)
    confidence = Column(Float)
    lower_bound = Column(Float)
    upper_bound = Column(Float)
    actual_value = Column(Float, nullable=True)
    features_used = Column(JSON)
    model_type = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
