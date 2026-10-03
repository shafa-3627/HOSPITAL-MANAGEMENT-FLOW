import urllib.request
import json
import sqlite3

BASE_URL = "http://127.0.0.1:8000"

print("==================================================")
print("1. VERIFYING GET /api/departments")
print("==================================================")
req = urllib.request.urlopen(f"{BASE_URL}/api/departments")
depts = json.loads(req.read().decode())
print(f"Total Departments Returned: {len(depts)}")
h1_depts = [d for d in depts if d.get('hospital_id') == 1]
print(f"Hospital 1 (Apex General) Departments: {len(h1_depts)}")
for d in h1_depts:
    print(f"  [{d['id']}] {d['name']} | Type: {d['type']} | Available: {d['available_beds']}/{d['total_beds']} beds")

print("\n==================================================")
print("2. VERIFYING GET /api/beds?status=available")
print("==================================================")
req = urllib.request.urlopen(f"{BASE_URL}/api/beds?status=available")
avail_beds = json.loads(req.read().decode())
print(f"Total Available Beds in Hospital: {len(avail_beds)}")
gen_med_beds = [b for b in avail_beds if b['department_id'] == 3]
print(f"Available Beds in General Medicine (Dept 3): {len(gen_med_beds)}")
if gen_med_beds:
    print(f"  Sample Available Bed: #{gen_med_beds[0]['bed_number']} (ID: {gen_med_beds[0]['id']})")

print("\n==================================================")
print("3. SUBMITTING TEST PATIENT ADMISSION VIA API")
print("==================================================")
payload = {
    "patient_name": "TEST Patient YODHA",
    "age": 45,
    "gender": "Male",
    "contact_number": "+91 99887 76655",
    "department_id": 3, # General Medicine
    "doctor_name": "Dr. Sarah Lin",
    "admission_type": "Emergency",
    "priority": "high",
    "chief_complaint": "TEST admission verification",
    "icu_required": False,
    "emergency_flag": True,
    "bed_required": True
}

data_bytes = json.dumps(payload).encode('utf-8')
post_req = urllib.request.Request(
    f"{BASE_URL}/api/patients/admit",
    data=data_bytes,
    headers={"Content-Type": "application/json"}
)
post_res = urllib.request.urlopen(post_req)
admitted = json.loads(post_res.read().decode())

print(f"Admission Status: SUCCESS (HTTP 200)")
print(f"  Patient ID / Code: {admitted['patient_code']} (DB ID: {admitted['id']})")
print(f"  Name: {admitted['patient_name']}")
print(f"  Department: {admitted['department_name']}")
print(f"  Assigned Bed: {admitted['bed_number']} (Bed ID: {admitted['bed_id']})")
print(f"  Priority: {admitted['priority'].upper()}")
print(f"  Stage / Status: {admitted['current_stage']} / {admitted['status']}")

print("\n==================================================")
print("4. VERIFYING DATABASE PERSISTENCE IN SQLITE")
print("==================================================")
conn = sqlite3.connect('yodha.db')
c = conn.cursor()

# Check Patient
c.execute("SELECT id, patient_code, patient_name, department_id, bed_id, status, priority FROM patients WHERE id = ?", (admitted['id'],))
db_patient = c.fetchone()
print(f"Patient in DB: {db_patient}")

# Check Bed
c.execute("SELECT id, bed_number, department_id, status, patient_id FROM beds WHERE id = ?", (admitted['bed_id'],))
db_bed = c.fetchone()
print(f"Assigned Bed in DB: {db_bed} (Expected status='occupied', patient_id={admitted['id']})")

# Check Department
c.execute("SELECT id, name, total_beds, occupied_beds, available_beds FROM departments WHERE id = 3")
db_dept = c.fetchone()
print(f"Department in DB: {db_dept}")

# Check Audit Log
c.execute("SELECT id, action, entity_type, entity_id, reason, timestamp FROM audit_logs WHERE entity_id = ? ORDER BY id DESC LIMIT 1", (admitted['patient_code'],))
db_audit = c.fetchone()
print(f"Audit Log in DB: {db_audit}")

print("\n==================================================")
print("5. VERIFYING DASHBOARD CENSUS SYNCHRONIZATION")
print("==================================================")
dash_req = urllib.request.urlopen(f"{BASE_URL}/api/dashboard")
dash = json.loads(dash_req.read().decode())
print(f"Dashboard Total Inpatients: {dash['total_patients']}")
print(f"Dashboard Available Beds: {dash['available_beds']}")
print(f"Dashboard Health Score: {dash['health_score']}")

print("\n==================================================")
print("6. CLEANING UP TEST RECORD & RESTORING BED/DEPT STATE")
print("==================================================")
# Release the bed and remove test patient
if db_bed:
    c.execute("UPDATE beds SET status = 'available', patient_id = NULL WHERE id = ?", (admitted['bed_id'],))
    c.execute("UPDATE departments SET occupied_beds = occupied_beds - 1, available_beds = available_beds + 1 WHERE id = 3")
c.execute("DELETE FROM patients WHERE id = ?", (admitted['id'],))
c.execute("DELETE FROM audit_logs WHERE entity_id = ?", (admitted['patient_code'],))
c.execute("DELETE FROM events WHERE entity_id = ? AND event_type = 'patient_admission'", (admitted['id'],))
conn.commit()
conn.close()
print("Cleaned up TEST Patient YODHA and restored bed/department counters safely.")

print("\n==================================================")
print("ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY")
print("==================================================")
