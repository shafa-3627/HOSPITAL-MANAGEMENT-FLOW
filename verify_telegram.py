import json
import urllib.request
import urllib.error
import time

def test_endpoint(name, url, method="GET", data=None):
    try:
        headers = {"Content-Type": "application/json"} if data else {}
        req_data = json.dumps(data).encode("utf-8") if data else None
        req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=5) as resp:
            status = resp.getcode()
            body = resp.read().decode("utf-8", errors="replace")
            print(f"[PASS] {name} ({method} {url}) -> HTTP {status}")
            try:
                parsed = json.loads(body)
                print(f"       Response Preview: {json.dumps(parsed)[:150]}...")
            except Exception:
                print(f"       Body Length: {len(body)} bytes")
            return True, body
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"[HTTP {e.code}] {name} ({method} {url}) -> {body[:150]}")
        return False, body
    except Exception as e:
        print(f"[FAIL] {name} ({method} {url}) -> {e}")
        return False, str(e)

print("--- Running YODHA Telegram & Core API Verification ---")
time.sleep(2)

# 1. Root & Health
test_endpoint("FastAPI Root", "http://127.0.0.1:8000/")
test_endpoint("Dashboard API", "http://127.0.0.1:8000/api/dashboard")

# 2. Telegram Status & Tests
test_endpoint("Telegram Gateway Status", "http://127.0.0.1:8000/api/telegram/status")
test_endpoint("Telegram Test Endpoint POST /api/test-telegram", "http://127.0.0.1:8000/api/test-telegram", method="POST", data={})
test_endpoint("Telegram Test Endpoint POST /api/telegram/test", "http://127.0.0.1:8000/api/telegram/test", method="POST", data={})

# 3. Active Alerts & Dynamic Telegram Routing
test_endpoint("Active Congestion Alerts", "http://127.0.0.1:8000/api/alerts/active")
test_endpoint("Trigger ICU Congestion Alert", "http://127.0.0.1:8000/api/alerts/create", method="POST", data={"department": "ICU", "severity": "CRITICAL"})
test_endpoint("Send Telegram for Alert", "http://127.0.0.1:8000/api/alerts/YD-1024/send-telegram", method="POST", data={})

# 4. Frontend Accessibility
test_endpoint("Vite Frontend", "http://127.0.0.1:5173/")
