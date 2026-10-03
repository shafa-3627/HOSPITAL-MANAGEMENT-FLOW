from fastapi import APIRouter
router = APIRouter()
@router.get("/info")
def get_info(): return {}
@router.get("/evaluations")
def get_evals(): return []
@router.post("/evaluate")
def evals(): return {}
