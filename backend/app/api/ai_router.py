from fastapi import APIRouter
from . import forecast, optimization, alerts, recommendations

router = APIRouter()
router.include_router(forecast.router, prefix="/forecast", tags=["forecast"])
router.include_router(optimization.router, prefix="/optimization", tags=["optimization"])
router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
router.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])
