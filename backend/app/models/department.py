from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    name = Column(String)
    type = Column(String)
    total_beds = Column(Integer)
    occupied_beds = Column(Integer)
    available_beds = Column(Integer)
    reserved_beds = Column(Integer)
    staff_count = Column(Integer)
    status = Column(String)

    hospital = relationship("Hospital")
