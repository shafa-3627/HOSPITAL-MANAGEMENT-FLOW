from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to YODHA 2.0 API"}

def test_login_invalid():
    response = client.post("/api/auth/login", data={"username": "wrong", "password": "wrong"})
    assert response.status_code == 400

def test_dashboard():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    assert "health_score" in response.json()

def test_telegram_status():
    response = client.get("/api/telegram/status")
    assert response.status_code == 200
    data = response.json()
    assert data.get("bot_username") == "@CrewResponsebot"
    assert "staff_manager_chat_id" in data
    assert "doctor_chat_id" in data

def test_telegram_test_endpoint():
    response = client.post("/api/test-telegram")
    assert response.status_code == 200
    data = response.json()
    assert "success" in data

def test_congestion_alerts_active():
    response = client.get("/api/alerts/active")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_alert_send_telegram():
    response = client.post("/api/alerts/YD-TEST-1/send-telegram")
    assert response.status_code == 200
    data = response.json()
    assert "success" in data

def test_bed_overflow_trigger_telegram():
    response = client.post("/api/beds/trigger-overflow-alert?dept_key=ICU")
    assert response.status_code == 200
    data = response.json()
    assert "success" in data
    assert "total_beds" in data
    assert "occupied_beds" in data
    assert "overflow_status" in data

def test_bed_overflow_scenario():
    response = client.post("/api/scenarios/bed-overflow")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "triggered"
    assert "telegram" in data

def test_doctor_availability_alert_trigger():
    response = client.post("/api/staff/trigger-doctor-alert?dept_key=ICU")
    assert response.status_code == 200
    data = response.json()
    assert "success" in data
    assert "current_patients" in data
    assert "available_doctors" in data
    assert "required_doctors" in data
    assert "risk_level" in data
    assert "alert_id" in data
    assert "telegram_response" in data

def test_doctor_shortage_scenario():
    response = client.post("/api/scenarios/doctor-shortage")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "triggered"
    assert data.get("scenario") == "doctor-shortage"
    assert "current_patients" in data
    assert "available_doctors" in data
    assert "required_doctors" in data
    assert "telegram" in data

