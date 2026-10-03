from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Hospital

router = APIRouter()

@router.get("/hospitals")
def get_hosp(db: Session = Depends(get_db)):
    hospitals = db.query(Hospital).all()
    return [
        {
            "id": h.id,
            "name": h.name,
            "code": h.code,
            "address": h.address,
            "total_beds": h.total_beds,
            "active": h.active,
            "lat": h.lat,
            "lng": h.lng,
            "occupancy_rate": 78.5 if h.id == 1 else 84.0 if h.id == 2 else 62.5 if h.id == 3 else 91.0,
            "available_beds": 32 if h.id == 1 else 18 if h.id == 2 else 45 if h.id == 3 else 8,
            "ems_status": "open" if h.id != 4 else "divert_warning"
        } for h in hospitals
    ]
