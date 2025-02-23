from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from superuser.security.schemas import UserStatus
from superuser.security.dependencies import (
    suspend_user as suspend_user_func,
    ban_user
)
from superuser.dashboard.admin_auth import get_current_admin
from user_reg_and_prof_mngmnt.user_authentication import get_current_user



securityApp = APIRouter(
    prefix="/admin/security",
    tags=["Admin Panel Security"],
    # responses={404: {"description": "Not found"}},
    dependencies=[Depends(get_current_admin)]
)


@securityApp.put("/suspend_user/{user_id}")
async def suspend_user(user: UserStatus = Depends(UserStatus)):
    if user.status == "suspend":
        if not user.end_date:
            raise HTTPException(status_code=400, detail="End date is required.")
        suspended = suspend_user_func(user_id=user.user_id, end_date=user.end_date, reason=user.reason)
        return suspended
    
    banned_user = ban_user(user_id=user.user_id)

    return banned_user

