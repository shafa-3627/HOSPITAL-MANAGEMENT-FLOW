from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Department, Bed
from app.schemas import DepartmentResponse
from typing import List, Optional

router = APIRouter()

@router.get("", response_model=List[DepartmentResponse])
def get_departments(db: Session = Depends(get_db), hospital_id: Optional[int] = None):
    query = db.query(Department)
    if hospital_id:
        query = query.filter(Department.hospital_id == hospital_id)
    depts = query.all()
    
    # Update real bed availability directly from Bed records
    for d in depts:
        dept_bed_count = db.query(Bed).filter(Bed.department_id == d.id).count()
        if dept_bed_count > 0:
            occupied = db.query(Bed).filter(Bed.department_id == d.id, Bed.status == "occupied").count()
            d.total_beds = dept_bed_count
            d.occupied_beds = occupied
            d.available_beds = max(0, dept_bed_count - occupied)
            
    return depts

@router.get("/{id}", response_model=DepartmentResponse)
def get_department(id: int, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept
