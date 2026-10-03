from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from datetime import datetime

router = APIRouter()

AMBULANCES = [
    {
        "unit_id": "AMB-201",
        "patient": "55yo Male, Acute Chest Pain (STEMI Protocol)",
        "priority": "Level 1 - Critical",
        "eta_minutes": 8,
        "vitals": "HR 118, BP 155/95, SpO2 93%",
        "destination": "Apex General Hospital - ED Resus Bay 1",
        "status": "Inbound (Sirens Active)"
    },
    {
        "unit_id": "AMB-202",
        "patient": "34yo Female, Multi-Trauma / MVC",
        "priority": "Level 1 - Critical",
        "eta_minutes": 14,
        "vitals": "HR 125, BP 90/60, SpO2 96%",
        "destination": "Apex General Hospital - Trauma Bay 2",
        "status": "Inbound"
    },
    {
        "unit_id": "AMB-203",
        "patient": "68yo Male, Severe Respiratory Distress (COPD)",
        "priority": "Level 2 - High",
        "eta_minutes": 22,
        "vitals": "HR 102, BP 140/85, SpO2 88%",
        "destination": "Apex General Hospital - Stepdown ED",
        "status": "En Route"
    }
]

@router.get("/ambulances")
def get_ambulances():
    return AMBULANCES

@router.get("/routing")
def get_ems_routing():
    return {
        "recommended_hospital": "Apex General Hospital",
        "travel_time_mins": 12,
        "ed_capacity_status": "OPEN",
        "trauma_team_ready": True,
        "alternative_hospitals": [
            {"name": "Metro Health Center", "travel_time_mins": 18, "status": "Divert Warning"},
            {"name": "Valley Memorial Hospital", "travel_time_mins": 26, "status": "Open"}
        ]
    }

@router.post("/simulate")
def simulate_ambulance():
    new_amb = {
        "unit_id": f"AMB-{len(AMBULANCES) + 201}",
        "patient": "42yo Male, Compound Fracture / Shock",
        "priority": "Level 2 - High",
        "eta_minutes": 10,
        "vitals": "HR 110, BP 130/80, SpO2 97%",
        "destination": "Apex General Hospital - ED",
        "status": "Dispatched"
    }
    AMBULANCES.insert(0, new_amb)
    return {"success": True, "ambulance": new_amb}
