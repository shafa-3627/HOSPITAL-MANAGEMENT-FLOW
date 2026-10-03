from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.database import Base

class ModelEvaluation(Base):
    __tablename__ = "model_evaluations"
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String)
    model_type = Column(String)
    dataset_size = Column(Integer)
    feature_count = Column(Integer)
    training_samples = Column(Integer)
    validation_samples = Column(Integer)
    mae = Column(Float)
    rmse = Column(Float)
    mape = Column(Float)
    r2_score = Column(Float)
    prediction_horizon = Column(Integer)
    evaluated_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(String)
