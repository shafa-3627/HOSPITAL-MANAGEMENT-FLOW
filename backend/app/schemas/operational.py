from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PatientBase(BaseModel):
    patient_code: str
    age: Optional[int] = 0
    gender: Optional[str] = "Unknown"
    priority: Optional[str] = "medium"
    department_id: Optional[int] = None
    bed_id: Optional[int] = None
    arrival_time: Optional[datetime] = None
    admission_time: Optional[datetime] = None
    status: Optional[str] = "waiting"
    diagnosis_category: Optional[str] = None
    current_stage: Optional[str] = "registration"
    waiting_time_minutes: Optional[int] = 0
    is_synthetic: Optional[bool] = True
    patient_name: Optional[str] = None
    contact_number: Optional[str] = None
    admission_type: Optional[str] = "General"
    chief_complaint: Optional[str] = None
    doctor_name: Optional[str] = None
    icu_required: Optional[bool] = False
    emergency_flag: Optional[bool] = False
    bed_number: Optional[str] = None
    department_name: Optional[str] = None

class PatientResponse(PatientBase):
    id: int
    class Config:
        from_attributes = True

class StaffBase(BaseModel):
    staff_code: str
    name: str
    role: str
    department_id: int
    shift: str
    status: str
    workload_index: Optional[float] = 0.0
    specialization: Optional[str] = None

class StaffResponse(StaffBase):
    id: int
    class Config:
        from_attributes = True

class ResourceBase(BaseModel):
    name: str
    type: str
    department_id: int
    total: int
    available: int
    in_use: int
    maintenance: Optional[int] = 0
    predicted_demand_6h: Optional[int] = 0
    predicted_demand_12h: Optional[int] = 0

class ResourceResponse(ResourceBase):
    id: int
    class Config:
        from_attributes = True
