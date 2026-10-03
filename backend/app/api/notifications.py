from fastapi import APIRouter
router = APIRouter()
@router.get("")
def get_notifs(): return []
@router.post("/{id}/read")
def read_notif(id: int): return {}
@router.post("/read-all")
def read_all(): return {}
