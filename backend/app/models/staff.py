from sqlalchemy import Column, Integer, String, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database import Base

class Staff(Base):
    __tablename__ = "staff"
    id = Column(Integer, primary_key=True, index=True)
    staff_code = Column(String, unique=True, index=True)
    name = Column(String)
    role = Column(String)
    department_id = Column(Integer, ForeignKey("departments.id"))
    shift = Column(String)
    status = Column(String)
    workload_index = Column(Float)
    specialization = Column(String)

    department = relationship("Department")
