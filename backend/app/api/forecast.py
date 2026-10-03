from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Forecast, ModelEvaluation
from typing import Optional

router = APIRouter()

@router.get("")
def get_forecast(
    metric: Optional[str] = None,
    horizon: Optional[str] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Forecast)
    if department:
        try:
            dept_int = int(department)
            query = query.filter(Forecast.department_id == dept_int)
        except ValueError:
            pass
    if metric and metric != "all":
        query = query.filter(Forecast.metric.ilike(f"%{metric}%"))
        
    forecasts = query.order_by(Forecast.horizon_hours).all()
    if not forecasts:
        forecasts = db.query(Forecast).order_by(Forecast.horizon_hours).all()
        
    return [
        {
            "id": f.id,
            "department_id": f.department_id,
            "metric": f.metric,
            "horizon_hours": f.horizon_hours,
            "date": f"+{f.horizon_hours} Hours" if f.horizon_hours else "T+0",
            "value": f.predicted_value,
            "predicted_value": f.predicted_value,
            "confidence": f.confidence,
            "lower_bound": f.lower_bound,
            "upper_bound": f.upper_bound,
            "actual_value": f.actual_value,
            "features_used": f.features_used,
            "model_type": f.model_type,
            "created_at": f.created_at.isoformat() if f.created_at else None
        } for f in forecasts
    ]

@router.get("/comparison")
def get_comparison(db: Session = Depends(get_db)):
    evals = db.query(ModelEvaluation).all()
    return [
        {
            "id": e.id,
            "model_name": e.model_name,
            "model_type": e.model_type,
            "mae": e.mae,
            "rmse": e.rmse,
            "mape": e.mape,
            "r2_score": e.r2_score,
            "evaluated_at": e.evaluated_at.isoformat() if e.evaluated_at else None
        } for e in evals
    ]
