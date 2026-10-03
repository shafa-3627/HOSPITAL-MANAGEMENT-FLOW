from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Resource(Base):
    __tablename__ = "resources"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    type = Column(String)
    department_id = Column(Integer, ForeignKey("departments.id"))
    total = Column(Integer)
    available = Column(Integer)
    in_use = Column(Integer)
    maintenance = Column(Integer)
    predicted_demand_6h = Column(Integer)
    predicted_demand_12h = Column(Integer)

    department = relationship("Department")
