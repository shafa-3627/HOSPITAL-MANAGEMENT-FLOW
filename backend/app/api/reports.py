from fastapi import APIRouter
router = APIRouter()
@router.get("/generate")
def gen_report(): return {}
@router.get("/export/json")
def exp_json(): return {}
@router.get("/export/csv")
def exp_csv(): return {}
