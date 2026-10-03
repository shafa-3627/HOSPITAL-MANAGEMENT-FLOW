from sqlalchemy import Column, Integer, String, Boolean, Float
from app.database import Base

class Hospital(Base):
    __tablename__ = "hospitals"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    code = Column(String, unique=True, index=True)
    address = Column(String)
    total_beds = Column(Integer)
    active = Column(Boolean, default=True)
    lat = Column(Float)
    lng = Column(Float)
