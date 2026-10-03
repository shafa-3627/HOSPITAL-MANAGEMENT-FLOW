import urllib.request
import json
import sys

endpoints = [
    ('GET', '/api/dashboard'),
    ('GET', '/api/departments'),
    ('GET', '/api/beds'),
    ('GET', '/api/beds?status=available'),
    ('GET', '/api/patients'),
    ('GET', '/api/patients/flow'),
    ('GET', '/api/patient-flow'),
    ('GET', '/api/alerts'),
    ('GET', '/api/crisis'),
    ('GET', '/api/forecast?department=1&horizon=4&metric=admissions'),
    ('GET', '/api/optimization'),
    ('GET', '/api/simulation/presets'),
    ('GET', '/api/simulation/history'),
    ('GET', '/api/staff'),
    ('GET', '/api/staff/workload'),
    ('GET', '/api/resources'),
    ('GET', '/api/anomalies'),
    ('GET', '/api/events'),
    ('GET', '/api/fhir/status'),
    ('GET', '/api/model/evaluations'),
    ('GET', '/api/analytics?period=daily'),
    ('GET', '/api/reports/generate'),
    ('GET', '/api/audit'),
    ('GET', '/api/notifications'),
    ('GET', '/api/network/hospitals'),
    ('GET', '/api/settings'),
    ('GET', '/api/safety'),
    ('GET', '/api/security'),
    ('GET', '/api/agent/status'),
    ('GET', '/api/agent/calls'),
    ('GET', '/api/bottlenecks'),
    ('GET', '/api/ems/ambulances'),
    ('GET', '/api/ems/routing'),
    ('GET', '/api/data-quality')
]

print(f"Testing {len(endpoints)} endpoints...", flush=True)
passed = 0
failed = 0

for method, ep in endpoints:
    url = f"http://127.0.0.1:8000{ep}"
    try:
        req = urllib.request.Request(url, method=method)
        with urllib.request.urlopen(req, timeout=5) as response:
            status = response.status
            data = json.loads(response.read().decode())
            count = len(data) if isinstance(data, list) else (len(data.keys()) if isinstance(data, dict) else 'ok')
            print(f"SUCCESS [{status}] {ep} -> {type(data).__name__} ({count})", flush=True)
            passed += 1
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()[:200]
        print(f"HTTP ERROR [{e.code}] {ep} -> {err_body}", flush=True)
        failed += 1
    except Exception as e:
        print(f"FAIL {ep} -> {e}", flush=True)
        failed += 1

print(f"\nTotal: {len(endpoints)}, Passed: {passed}, Failed: {failed}", flush=True)
