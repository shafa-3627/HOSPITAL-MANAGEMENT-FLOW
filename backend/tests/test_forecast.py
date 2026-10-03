from ml.forecast_engine import GradientBoostingModel, MovingAverageModel

def test_ma_model():
    model = MovingAverageModel()
    res = model.predict({'historical_arrivals': [10, 20, 30]}, 1)
    assert res.predicted_value == 20.0

def test_gb_model():
    model = GradientBoostingModel()
    res = model.predict({'current_occupancy': 100}, 1)
    assert res.predicted_value == 105.0
    assert "current_occupancy" in res.features_used
