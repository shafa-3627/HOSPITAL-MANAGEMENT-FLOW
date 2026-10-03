from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Bed(Base):
    __tablename__ = "beds"
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"))
    bed_number = Column(String, index=True)
    ward = Column(String)
    type = Column(String)
    status = Column(String)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    equipment = Column(String)
    isolation_capable = Column(Boolean, default=False)
    last_updated = Column(DateTime, default=datetime.utcnow)

    department = relationship("Department")
    patient = relationship("Patient", foreign_keys=[patient_id])
