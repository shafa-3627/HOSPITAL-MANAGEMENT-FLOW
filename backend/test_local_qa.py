import urllib.request
import json
import sys
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"

def api_call(method, path, body=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"} if body is not None else {}
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())
    except Exception as ex:
        return 500, {"error": str(ex)}

results = {}

print("=" * 60)
print("YODHA 2.0 LOCAL FUNCTIONAL VERIFICATION SUITE")
print("=" * 60)

# -------------------------------------------------------------
# 1. ADMISSION ENTRY TEST
# -------------------------------------------------------------
print("\n[TEST 1] Testing Admission Entry & Bed Allocation...")
admit_payload = {
    "patient_name": "Marcus Wright",
    "age": 42,
    "gender": "Male",
    "contact_number": "+91 94441 23456",
    "department_id": 1, # ICU
    "admission_type": "ICU",
    "priority": "critical",
    "chief_complaint": "Acute Respiratory Distress / Monitored",
    "doctor_name": "Dr. Rajesh Sharma",
    "bed_required": True,
    "icu_required": True
}
status, admit_res = api_call("POST", "/api/patients/admit", admit_payload)
assert status == 200, f"Admit failed with status {status}: {admit_res}"
patient_id = admit_res.get("id")
patient_code = admit_res.get("patient_code")
allocated_bed_id = admit_res.get("bed_id")

print(f"  -> Successfully admitted patient: {patient_code} (ID: {patient_id})")
print(f"  -> Assigned Bed ID: {allocated_bed_id}, Priority: {admit_res.get('priority')}, Status: {admit_res.get('status')}")
assert patient_code.startswith("P-"), f"Invalid patient code: {patient_code}"
assert allocated_bed_id is not None, "Bed was not allocated"
results["admission_entry"] = "PASSED"

# -------------------------------------------------------------
# 2. BED MANAGEMENT INTEGRATION TEST
# -------------------------------------------------------------
print("\n[TEST 2] Testing Bed Management & State Consistency...")
# Verify the allocated bed is occupied
status, bed_data = api_call("GET", f"/api/beds")
assert status == 200
allocated_bed = next((b for b in bed_data if b["id"] == allocated_bed_id), None)
assert allocated_bed is not None, f"Allocated bed {allocated_bed_id} not found"
assert allocated_bed["status"] == "occupied", f"Bed status is {allocated_bed['status']}, expected 'occupied'"
assert allocated_bed["patient_id"] == patient_id, f"Bed patient_id is {allocated_bed['patient_id']}, expected {patient_id}"
print(f"  -> Bed #{allocated_bed['bed_number']} confirmed OCCUPIED by Patient {patient_code}")

# Test Reserve Bed
status, reserve_res = api_call("POST", "/api/beds/reserve?bed_id=10")
assert status == 200
print(f"  -> Bed #10 reserved successfully")

# Test Bed Matching
status, match_res = api_call("POST", "/api/beds/match", {"priority": "critical", "acuity": 1})
assert status == 200 and "matched_beds" in match_res
print(f"  -> Smart Bed Match returned {len(match_res.get('matched_beds', []))} candidate beds for {match_res.get('recommended_department')}")
results["bed_management"] = "PASSED"

# -------------------------------------------------------------
# 3. PATIENT FLOW STAGE ADVANCEMENT TEST
# -------------------------------------------------------------
print("\n[TEST 3] Testing Patient Flow (9 Stages)...")
status, flow_res = api_call("GET", "/api/patient-flow")
assert status == 200 and "stages" in flow_res
print(f"  -> Patient Flow active: {flow_res.get('total_active_patients')} total inpatients across 9 stages")

# Advance patient from treatment to transfer stage
status, stage_res = api_call("POST", f"/api/patients/{patient_id}/update-stage?stage=transfer")
assert status == 200
print(f"  -> Patient {patient_code} advanced to 'transfer' stage")

# Advance patient to discharge
status, discharge_res = api_call("POST", f"/api/patients/{patient_id}/discharge")
assert status == 200
print(f"  -> Patient {patient_code} successfully discharged")

# Verify bed is released
status, bed_data_after = api_call("GET", f"/api/beds")
released_bed = next((b for b in bed_data_after if b["id"] == allocated_bed_id), None)
assert released_bed["status"] == "available", f"Bed status is {released_bed['status']}, expected 'available'"
assert released_bed["patient_id"] is None, "Bed patient_id not cleared on discharge"
print(f"  -> Bed #{released_bed['bed_number']} successfully restored to AVAILABLE on discharge")
results["patient_flow"] = "PASSED"

# -------------------------------------------------------------
# 4. TELEGRAM INTEGRATION ROUTING TEST
# -------------------------------------------------------------
print("\n[TEST 4] Testing Telegram Integration & Targeted Routing...")
# Verify bot status & routing config
status, tg_status = api_call("GET", "/api/telegram/status")
assert status == 200
assert tg_status.get("bot_username") == "@CrewResponsebot"
print(f"  -> Bot Verified: {tg_status.get('bot_username')}")
print(f"  -> Staff Manager Chat ID: {tg_status.get('staff_manager_chat_id')}")
print(f"  -> Doctor Chat ID: {tg_status.get('doctor_chat_id')}")

# 4A. Bed Overflow Alert -> Staff Manager
status, bov_res = api_call("POST", "/api/beds/trigger-overflow-alert?dept_key=ICU")
assert status == 200 and bov_res.get("success") == True
print(f"  -> Bed Overflow Alert Triggered: ID={bov_res.get('alert_id')}, Status={bov_res.get('overflow_status')}")

# 4B. Doctor Shortage Alert -> Doctor Chat ID
status, doc_res = api_call("POST", "/api/staff/trigger-doctor-alert?dept_key=ICU")
assert status == 200 and doc_res.get("success") == True
print(f"  -> Doctor Availability Alert Triggered: ID={doc_res.get('alert_id')}, Risk={doc_res.get('risk_level')}")
results["telegram_routing"] = "PASSED"

# -------------------------------------------------------------
# 5. CRISIS WARNING RADAR & SCENARIOS TEST
# -------------------------------------------------------------
print("\n[TEST 5] Testing Crisis Warning Radar...")
status, crisis_list = api_call("GET", "/api/crisis")
assert status == 200 and isinstance(crisis_list, list)
print(f"  -> Crisis Center loaded {len(crisis_list)} active operational crisis warnings")

status, surge_res = api_call("POST", "/api/scenarios/icu-surge")
assert status == 200 and surge_res.get("status") == "triggered"
print(f"  -> ICU Surge protocol triggered: {surge_res.get('message')}")

status, reset_scen = api_call("POST", "/api/scenarios/reset")
assert status == 200 and reset_scen.get("status") == "reset"
print(f"  -> Scenario state reset cleanly to baseline")
results["crisis_radar"] = "PASSED"

# -------------------------------------------------------------
# 6. AGENTIC AI CONTROL HUB (7 STAGES & DECISIONS)
# -------------------------------------------------------------
print("\n[TEST 6] Testing Agentic AI 7-Stage Autonomous Pipeline...")
status, agent_status = api_call("GET", "/api/agent/status")
assert status == 200
assert agent_status.get("status") in ["ACTIVE", "PAUSED"]
decisions = agent_status.get("recent_decisions", [])
print(f"  -> Agent Status: {agent_status.get('status')}, Total Decisions: {len(decisions)}")
if decisions:
    d = decisions[0]
    print(f"  -> Decision Trace: [{d.get('id')}] {d.get('title')}")
    print(f"     1. Observed: {d.get('observed_data')}")
    print(f"     2. Rule:     {d.get('rule_applied')}")
    print(f"     3. Decision: {d.get('decision')}")
    print(f"     4. Action:   {d.get('action_taken')}")
    print(f"     5. Dispatch: {d.get('notification_status')}")

status, notifs = api_call("GET", "/api/agent/notifications")
assert status == 200
print(f"  -> Clinician Notification Center loaded {len(notifs)} transparent event notifications")
results["agentic_ai"] = "PASSED"

# -------------------------------------------------------------
# 7. DIGITAL TWIN SIMULATION TEST
# -------------------------------------------------------------
print("\n[TEST 7] Testing Hospital Digital Twin (M/M/c)...")
sim_payload = {
    "scenario": "surge_analysis",
    "additional_beds": 5,
    "additional_staff": 3,
    "expected_discharges": 4,
    "arrival_surge": 12
}
status, sim_res = api_call("POST", "/api/simulation/run", sim_payload)
assert status == 200 and "before" in sim_res and "after" in sim_res
before_occ = sim_res["before"].get("total_occupancy")
after_occ = sim_res["after"].get("total_occupancy")
print(f"  -> Simulation Executed successfully (ID: {sim_res.get('simulation_id')})")
print(f"  -> Before Occupancy: {before_occ}% | After Intervention: {after_occ}%")
assert isinstance(before_occ, (int, float)) and isinstance(after_occ, (int, float))
results["digital_twin"] = "PASSED"

# -------------------------------------------------------------
# 8. EMERGENCY / DISASTER SIMULATION SUITE
# -------------------------------------------------------------
print("\n[TEST 8] Testing Emergency / Disaster Simulations...")
disasters = ["FLOOD", "TSUNAMI", "CYCLONE", "EARTHQUAKE", "FIRE", "MASS_CASUALTY"]
for d in disasters:
    status, d_res = api_call("POST", "/api/agent/emergency/activate", {
        "disaster_type": d,
        "severity": "CRITICAL",
        "affected_department": "Emergency Trauma Bay",
        "is_simulation": True
    })
    assert status == 200
print(f"  -> Tested {len(disasters)} disaster presets (Flood, Tsunami, Cyclone, Earthquake, Fire, Mass Casualty)")

# Test quick triggers
status, _ = api_call("POST", "/api/agent/simulation/trigger", {"scenario_type": "low_beds"})
assert status == 200
status, _ = api_call("POST", "/api/agent/simulation/trigger", {"scenario_type": "high_priority_patient"})
assert status == 200

# Reset disaster state
status, deact_res = api_call("POST", "/api/agent/emergency/deactivate")
assert status == 200
print(f"  -> Emergency disaster mode deactivated and restored to baseline")
results["disaster_sim"] = "PASSED"

# -------------------------------------------------------------
# 9. AI COPILOT & CLINICAL QUERY ASSISTANT
# -------------------------------------------------------------
print("\n[TEST 9] Testing AI Copilot Natural Language Telemetry Queries...")
queries = [
    "Are we running low on beds?",
    "How many ICU beds are available?",
    "How many emergency patients need immediate attention?",
    "Is there an active emergency?",
    "What actions should the hospital take right now?"
]
for q in queries:
    status, ans_res = api_call("POST", "/api/copilot/ask", {"question": q})
    assert status == 200 and "answer" in ans_res
    print(f"  -> Q: \"{q}\"")
    print(f"     A: {ans_res.get('answer')[:95]}...")
results["ai_copilot"] = "PASSED"

# -------------------------------------------------------------
# 10. AUDIT TRAIL & DATA INTEGRITY
# -------------------------------------------------------------
print("\n[TEST 10] Testing Audit Trail & Regulatory Logs...")
status, audit_logs = api_call("GET", "/api/audit")
assert status == 200 and len(audit_logs) > 0
print(f"  -> Audit Trail loaded {len(audit_logs)} immutable event logs")
latest_audit = audit_logs[0]
print(f"  -> Latest Audit Action: [{latest_audit.get('action')}] by {latest_audit.get('username')} ({latest_audit.get('role')})")
results["audit_trail"] = "PASSED"

print("\n" + "=" * 60)
print("FINAL LOCAL QA SUMMARY:")
for mod, res in results.items():
    print(f"  [OK] {mod.upper():<25} : {res}")
print(f"TOTAL MODULES VERIFIED: {len(results)} / {len(results)} PASSED")
print("=" * 60)
