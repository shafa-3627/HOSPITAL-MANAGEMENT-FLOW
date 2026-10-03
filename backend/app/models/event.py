from sqlalchemy import Column, Integer, String, DateTime, JSON
from datetime import datetime
from app.database import Base

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, index=True)
    description = Column(String)
    entity_id = Column(String)
    data = Column(JSON)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
