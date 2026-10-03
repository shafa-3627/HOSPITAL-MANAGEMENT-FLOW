from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base

class Integration(Base):
    __tablename__ = "integrations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    type = Column(String)
    status = Column(String)
    last_sync = Column(DateTime)
    endpoint = Column(String)
    version = Column(String)
