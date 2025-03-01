from fastapi import APIRouter, Depends
from superuser.dashboard.admin_auth import get_current_admin


clan_router = APIRouter(
    prefix="/admin/clan",
    tags=["Admin Panel Clan"],
    # responses={404: {"description": "Not found"}},
    dependencies=[Depends(get_current_admin)]
)


