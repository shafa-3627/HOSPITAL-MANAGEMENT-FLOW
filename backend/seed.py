import random
import numpy as np
from datetime import datetime, timedelta
from app.database import SessionLocal, engine, Base
from app.models import (
    User, Hospital, Department, Bed, Patient, Staff, Resource, Forecast, Alert, Recommendation, Event, AuditLog, ModelEvaluation, Integration, Notification
)

def seed_data():
    random.seed(42)
    np.random.seed(42)
    
    # Create all database tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    if db.query(User).first():
        print("Data already seeded")
        db.close()
        return

    # Users
    users = [
        User(username="admin", password_hash="admin123", role="admin", email="admin@yodha.com", full_name="Hospital Administrator"),
        User(username="doctor", password_hash="doctor123", role="doctor", email="doc@yodha.com", full_name="Dr. Sarah Jenkins"),
        User(username="nurse", password_hash="nurse123", role="nurse", email="nurse@yodha.com", full_name="Head Nurse Marcus"),
        User(username="bedmgr", password_hash="bedmgr123", role="bed_manager", email="bedmgr@yodha.com", full_name="Bed Manager Alex"),
        User(username="emergency", password_hash="emerg123", role="emergency_coordinator", email="emerg@yodha.com", full_name="Emergency Coord Sam")
    ]
    db.add_all(users)
    db.commit()

    # Hospitals
    hospitals = []
    h_names = ["Apex General Hospital", "Metro Health Center", "Valley Memorial", "St. Jude Regional"]
    for i, name in enumerate(h_names):
        h = Hospital(name=name, code=f"H-00{i+1}", address=f"{100 + i*50} Healthcare Blvd", total_beds=450 + i*50, lat=10.7904 + i*0.05, lng=78.7047 + i*0.05)
        hospitals.append(h)
    db.add_all(hospitals)
    db.commit()

    # Departments for main hospital (Hospital A)
    dept_configs = [
        {"name": "Emergency Department", "type": "ED", "total": 60, "occ": 52, "staff": 28},
        {"name": "Intensive Care Unit (ICU)", "type": "ICU", "total": 40, "occ": 36, "staff": 22},
        {"name": "General Ward", "type": "General", "total": 200, "occ": 165, "staff": 40},
        {"name": "Pediatric Ward", "type": "Pediatric", "total": 50, "occ": 32, "staff": 15},
        {"name": "Operating Theatre (OT)", "type": "OR", "total": 20, "occ": 14, "staff": 18}
    ]
    
    departments = []
    for h in hospitals:
        for cfg in dept_configs:
            d = Department(
                hospital_id=h.id,
                name=f"{h.name} - {cfg['name']}",
                type=cfg["type"],
                total_beds=cfg["total"],
                occupied_beds=cfg["occ"],
                available_beds=cfg["total"] - cfg["occ"],
                reserved_beds=2,
                staff_count=cfg["staff"],
                status="active"
            )
            departments.append(d)
    db.add_all(departments)
    db.commit()

    # Beds & Patients
    beds = []
    patients = []
    stages = ["Ambulance", "Registration", "Triage", "Diagnosis", "Admission", "Bed Allocation", "Treatment", "Transfer", "Discharge"]
    priorities = ["critical", "high", "medium", "low"]
    diagnoses = ["Cardiovascular", "Respiratory", "Trauma", "Neurological", "Gastrointestinal", "Orthopedic"]

    main_hospital_depts = [d for d in departments if d.hospital_id == hospitals[0].id]
    patient_id_counter = 1000

    for d in main_hospital_depts:
        # Create beds
        for i in range(d.total_beds):
            is_occ = i < d.occupied_beds
            p_obj = None
            if is_occ:
                patient_id_counter += 1
                p_code = f"P-{patient_id_counter}"
                stage = random.choice(["Treatment", "Admission", "Diagnosis"])
                p_obj = Patient(
                    patient_code=p_code,
                    age=random.randint(18, 85),
                    gender=random.choice(["Male", "Female"]),
                    priority=random.choice(priorities),
                    department_id=d.id,
                    arrival_time=datetime.utcnow() - timedelta(hours=random.randint(1, 24)),
                    admission_time=datetime.utcnow() - timedelta(hours=random.randint(1, 12)),
                    status="admitted" if stage != "Discharge" else "discharge_ready",
                    diagnosis_category=random.choice(diagnoses),
                    current_stage=stage,
                    waiting_time_minutes=random.randint(15, 120),
                    is_synthetic=True
                )
                db.add(p_obj)
                db.flush()
                patients.append(p_obj)

            b = Bed(
                department_id=d.id,
                bed_number=f"{d.type[:3]}-{i+1:03d}",
                ward=d.type,
                type="icu" if d.type == "ICU" else ("isolation" if i % 10 == 0 else "standard"),
                status="occupied" if is_occ else ("reserved" if i == d.total_beds - 1 else "available"),
                patient_id=p_obj.id if p_obj else None,
                equipment="Ventilator, Monitor" if d.type == "ICU" else "Standard Monitor",
                isolation_capable=(i % 10 == 0),
                last_updated=datetime.utcnow()
            )
            beds.append(b)

    db.add_all(beds)
    db.commit()

    # Additional Waiting ED Patients
    ed_dept = [d for d in main_hospital_depts if d.type == "ED"][0]
    for _ in range(12):
        patient_id_counter += 1
        p_obj = Patient(
            patient_code=f"P-{patient_id_counter}",
            age=random.randint(20, 75),
            gender=random.choice(["Male", "Female"]),
            priority=random.choice(["critical", "high", "medium"]),
            department_id=ed_dept.id,
            arrival_time=datetime.utcnow() - timedelta(minutes=random.randint(10, 180)),
            status="waiting",
            diagnosis_category=random.choice(diagnoses),
            current_stage=random.choice(["Registration", "Triage", "Diagnosis"]),
            waiting_time_minutes=random.randint(20, 110),
            is_synthetic=True
        )
        patients.append(p_obj)
    db.add_all(patients)
    db.commit()

    # Staff
    staff_list = []
    roles = ["doctor", "nurse", "support"]
    for d in main_hospital_depts:
        for i in range(15):
            s = Staff(
                staff_code=f"STF-{d.id}-{i+1:02d}",
                name=f"Staff Member {d.type} {i+1}",
                role=random.choice(roles),
                department_id=d.id,
                shift=random.choice(["morning", "afternoon", "night"]),
                status="on_duty" if i < 10 else "on_call",
                workload_index=random.randint(55, 92),
                specialization=d.type
            )
            staff_list.append(s)
    db.add_all(staff_list)
    db.commit()

    # Resources
    resources = [
        Resource(name="Mechanical Ventilators", type="ventilator", department_id=main_hospital_depts[1].id, total=25, available=4, in_use=21, maintenance=0, predicted_demand_6h=6, predicted_demand_12h=9),
        Resource(name="Oxygen Flowmeters", type="oxygen", department_id=main_hospital_depts[0].id, total=80, available=15, in_use=65, maintenance=0, predicted_demand_6h=18, predicted_demand_12h=22),
        Resource(name="Infusion Pumps", type="monitor", department_id=main_hospital_depts[1].id, total=50, available=8, in_use=42, maintenance=0, predicted_demand_6h=10, predicted_demand_12h=14),
        Resource(name="Patient Monitors", type="monitor", department_id=main_hospital_depts[0].id, total=70, available=12, in_use=58, maintenance=0, predicted_demand_6h=14, predicted_demand_12h=19),
        Resource(name="Transport Wheelchairs", type="wheelchair", department_id=main_hospital_depts[0].id, total=40, available=10, in_use=30, maintenance=0, predicted_demand_6h=12, predicted_demand_12h=15)
    ]
    db.add_all(resources)
    db.commit()

    # Alerts & Recommendations
    icu_dept = main_hospital_depts[1]
    alert1 = Alert(
        type="crisis",
        severity="critical",
        title="Predicted ICU Capacity Crisis",
        description="ICU occupancy predicted to reach 97% in 6 hours due to high ED admission flow.",
        department_id=icu_dept.id,
        predicted_time=datetime.utcnow() + timedelta(hours=6),
        probability=0.87,
        drivers={"ed_arrivals": "+18%", "pending_admissions": 7, "discharge_rate": "-25%"},
        recommended_actions=["Prepare 3 ICU swing beds", "Accelerate 2 pending discharge reviews", "Reallocate 2 ICU-trained nurses from General Ward"],
        status="active"
    )
    db.add(alert1)
    db.commit()

    rec1 = Recommendation(
        alert_id=alert1.id,
        title="Prepare 3 ICU Swing Beds",
        description="Convert step-down recovery beds for ICU spillover capacity.",
        expected_impact="Reduces predicted ICU peak occupancy from 97% to 88%",
        confidence=0.91,
        affected_department="ICU",
        action_type="bed_preparation",
        status="pending"
    )
    rec2 = Recommendation(
        alert_id=alert1.id,
        title="Reallocate 2 Nurses to ICU",
        description="Shift on-call general nurses to ICU night shift.",
        expected_impact="Maintains 1:2 nurse-to-patient ratio during predicted surge",
        confidence=0.85,
        affected_department="ICU",
        action_type="staff_reallocation",
        status="pending"
    )
    db.add_all([rec1, rec2])
    db.commit()

    # Forecasts
    forecasts = []
    for h_ahead in [4, 8, 12, 24]:
        f = Forecast(
            department_id=icu_dept.id,
            metric="occupancy",
            horizon_hours=h_ahead,
            predicted_value=90.0 + h_ahead * 0.3,
            confidence=0.88,
            lower_bound=85.0 + h_ahead * 0.2,
            upper_bound=95.0 + h_ahead * 0.4,
            actual_value=89.0,
            features_used={"historical_trend": 0.4, "ed_flow": 0.3, "time_of_day": 0.2},
            model_type="GradientBoosting",
            created_at=datetime.utcnow()
        )
        forecasts.append(f)
    db.add_all(forecasts)

    # Model evaluations
    me = ModelEvaluation(
        model_name="YODHA XGBoost Flow Predictor v2",
        model_type="Gradient Boosting",
        dataset_size=15000,
        feature_count=18,
        training_samples=12000,
        validation_samples=3000,
        mae=1.42,
        rmse=2.15,
        mape=0.032,
        r2_score=0.942,
        prediction_horizon=24,
        evaluated_at=datetime.utcnow(),
        notes="Evaluated on 30-day synthetic hospital flow dataset."
    )
    db.add(me)

    # Integrations
    integrations = [
        Integration(name="HL7 FHIR R4 Engine", type="fhir", status="connected", endpoint="http://fhir.hospital.internal/v1", version="R4"),
        Integration(name="ADT Feed Handler", type="adt", status="connected", endpoint="http://adt.hospital.internal/v1", version="2.5"),
        Integration(name="Epic Hyperspace Connector", type="ehr", status="demo", endpoint="http://epic.demo/api", version="2024"),
        Integration(name="EMS CAD Dispatch", type="ems", status="connected", endpoint="http://cad.ems.gov/feed", version="1.2")
    ]
    db.add_all(integrations)
    db.commit()

    # Seed initial audit log
    audit = AuditLog(
        timestamp=datetime.utcnow(),
        username="system",
        role="system",
        action="SYSTEM_INIT",
        entity_type="database",
        entity_id=1,
        before_state={"status": "uninitialized"},
        after_state={"status": "seeded", "records": len(patients)},
        reason="Initial system seed for YODHA 2.0 hackathon demonstration"
    )
    db.add(audit)
    db.commit()

    print("Seed complete for core entities and synthetic dataset.")
    db.close()

if __name__ == "__main__":
    seed_data()
