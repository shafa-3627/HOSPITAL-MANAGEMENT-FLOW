from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    last_login: Optional[datetime] = None
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class HospitalBase(BaseModel):
    name: str
    code: str
    address: str
    total_beds: int
    active: bool = True
    lat: float
    lng: float

class HospitalResponse(HospitalBase):
    id: int
    class Config:
        from_attributes = True

class DepartmentBase(BaseModel):
    hospital_id: int
    name: str
    type: str
    total_beds: int
    occupied_beds: int
    available_beds: int
    reserved_beds: int
    staff_count: int
    status: str

class DepartmentResponse(DepartmentBase):
    id: int
    class Config:
        from_attributes = True

class BedBase(BaseModel):
    department_id: int
    bed_number: str
    ward: str
    type: str
    status: str
    patient_id: Optional[int] = None
    equipment: Optional[str] = "standard_monitor"
    isolation_capable: Optional[bool] = False

class BedResponse(BedBase):
    id: int
    last_updated: Optional[datetime] = None
    class Config:
        from_attributes = True
