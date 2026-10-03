from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Float
from sqlalchemy.orm import relationship
from app.database import Base

class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    patient_code = Column(String, unique=True, index=True)
    age = Column(Integer)
    gender = Column(String)
    priority = Column(String)
    department_id = Column(Integer, ForeignKey("departments.id"))
    bed_id = Column(Integer, ForeignKey("beds.id"), nullable=True)
    arrival_time = Column(DateTime)
    admission_time = Column(DateTime, nullable=True)
    status = Column(String)
    diagnosis_category = Column(String)
    current_stage = Column(String)
    waiting_time_minutes = Column(Integer)
    is_synthetic = Column(Boolean, default=True)
    patient_name = Column(String, nullable=True)
    contact_number = Column(String, nullable=True)
    admission_type = Column(String, default="General", nullable=True)
    chief_complaint = Column(String, nullable=True)
    doctor_name = Column(String, nullable=True)
    icu_required = Column(Boolean, default=False, nullable=True)
    emergency_flag = Column(Boolean, default=False, nullable=True)

    department = relationship("Department")
    bed = relationship("Bed", foreign_keys=[bed_id])

    @property
    def bed_number(self):
        return f"Bed #{self.bed.bed_number}" if self.bed else None

    @property
    def department_name(self):
        return self.department.name if self.department else None
