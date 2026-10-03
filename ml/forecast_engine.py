from abc import ABC, abstractmethod
import numpy as np

class ForecastResult:
    def __init__(self, pred, conf, lower, upper, feats):
        self.predicted_value = pred
        self.confidence = conf
        self.lower_bound = lower
        self.upper_bound = upper
        self.features_used = feats

class BaseForecastModel(ABC):
    @abstractmethod
    def predict(self, features, horizon_hours) -> ForecastResult:
        pass
    
    @abstractmethod
    def get_feature_importance(self) -> dict:
        pass

class MovingAverageModel(BaseForecastModel):
    def predict(self, features, horizon_hours) -> ForecastResult:
        hist = features.get('historical_arrivals', [0]*10)
        pred = sum(hist[-3:])/3 if len(hist)>=3 else 0
        return ForecastResult(pred, 0.5, pred*0.8, pred*1.2, {"model": "MA"})
        
    def get_feature_importance(self) -> dict:
        return {"historical": 1.0}

class GradientBoostingModel(BaseForecastModel):
    def predict(self, features, horizon_hours) -> ForecastResult:
        # Dummy actual prediction logic
        pred = features.get('current_occupancy', 0) * 1.05
        return ForecastResult(pred, 0.85, pred*0.9, pred*1.1, {"current_occupancy": 0.8, "hour": 0.2})
        
    def get_feature_importance(self) -> dict:
        return {"current_occupancy": 0.8, "hour": 0.2}

class LSTMAdapter(BaseForecastModel):
    def predict(self, features, horizon_hours) -> ForecastResult:
        return ForecastResult(10, 0.9, 9, 11, {})
        
    def get_feature_importance(self) -> dict:
        return {}
