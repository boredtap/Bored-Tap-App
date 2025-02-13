from fastapi import APIRouter, Depends
from superuser.dashboard.admin_auth import get_current_admin



challenge_router = APIRouter(
    prefix="/admin/task",
    tags=["Admin Panel Task"],
    # responses={404: {"description": "Not found"}},
    dependencies=[Depends(get_current_admin)]
)
