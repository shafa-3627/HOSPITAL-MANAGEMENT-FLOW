from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime

class ForecastResponse(BaseModel):
    id: int
    department_id: int
    metric: str
    horizon_hours: int
    predicted_value: float
    confidence: float
    lower_bound: float
    upper_bound: float
    actual_value: Optional[float] = None
    features_used: str
    model_type: str
    created_at: datetime
    class Config:
        from_attributes = True

class AlertResponse(BaseModel):
    id: int
    type: str
    severity: str
    title: str
    description: str
    department_id: int
    predicted_time: datetime
    probability: float
    drivers: str
    recommended_actions: str
    status: str
    created_at: datetime
    acknowledged_by: Optional[int] = None
    resolved_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class RecommendationResponse(BaseModel):
    id: int
    alert_id: Optional[int] = None
    title: str
    description: str
    expected_impact: str
    confidence: float
    affected_department: int
    action_type: str
    status: str
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    reason: Optional[str] = None
    class Config:
        from_attributes = True
