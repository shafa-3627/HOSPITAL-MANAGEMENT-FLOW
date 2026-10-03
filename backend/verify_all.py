import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://127.0.0.1:5173"

endpoints = [
    ("/api/dashboard", "Command Center & Dashboard Aggregator"),
    ("/api/departments", "Department Directory & Ward Census"),
    ("/api/beds?status=available", "Live Available Bed Inventory"),
    ("/api/agent/status", "Agentic AI Operations Controller")
]

print("==================================================")
print("1. BACKEND API VERIFICATION (http://127.0.0.1:8000)")
print("==================================================")

for ep, desc in endpoints:
    url = f"{BASE_URL}{ep}"
    try:
        req = urllib.request.Request(url)
        res = urllib.request.urlopen(req, timeout=5)
        raw = res.read().decode('utf-8')
        data = json.loads(raw)
        
        print(f"\n[PASS] {ep} ({desc}) -> HTTP {res.status} OK")
        if ep == "/api/dashboard":
            print(f"       Health Score: {data.get('health_score')}/100 ({data.get('status')})")
            print(f"       Total Inpatients: {data.get('total_patients')}")
            print(f"       Available Beds: {data.get('available_beds')}")
            print(f"       ICU Occupancy: {data.get('icu_occupancy')}%")
            print(f"       ED Waiting: {data.get('ed_waiting')}")
        elif ep == "/api/departments":
            print(f"       Total Departments: {len(data)}")
            h1 = [d for d in data if d.get('hospital_id') == 1]
            print(f"       Apex General Departments ({len(h1)}):")
            for d in h1:
                print(f"         • [{d['id']}] {d['name']} -> {d['available_beds']}/{d['total_beds']} beds available")
        elif ep == "/api/beds?status=available":
            print(f"       Available Beds Count: {len(data)}")
        elif ep == "/api/agent/status":
            print(f"       Agent Mode: {data.get('status')} | Emergency Mode: {data.get('emergency_mode', {}).get('type')}")
            print(f"       Monitored Available Beds: {data.get('bed_stats', {}).get('available')}/{data.get('bed_stats', {}).get('total')}")
            print(f"       Staff Manager Channel: {data.get('configured_recipients', {}).get('staff_manager_mask')}")
            print(f"       Doctor Alert Channel: {data.get('configured_recipients', {}).get('doctor_alert_mask')}")
    except Exception as e:
        print(f"\n[FAIL] {ep} -> Error: {e}")

print("\n==================================================")
print("2. FRONTEND ROUTE VERIFICATION (http://127.0.0.1:5173)")
print("==================================================")
frontend_routes = [
    ("/", "Landing Page"),
    ("/app/command-center", "Command Center Dashboard"),
    ("/app/admissions", "Patient Admission Entry Desk"),
    ("/app/agentic-ai", "Agentic AI Control Hub")
]

for route, label in frontend_routes:
    url = f"{FRONTEND_URL}{route}"
    try:
        r = urllib.request.urlopen(url, timeout=5)
        print(f"[PASS] {route} ({label}) -> HTTP {r.status} OK (Serving {len(r.read())} bytes)")
    except Exception as e:
        print(f"[FAIL] {route} -> Error: {e}")
