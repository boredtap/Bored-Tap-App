from fastapi import APIRouter, Depends
from superuser.dashboard.admin_auth import get_current_admin
from superuser.user_mgt.dependencies import (
    get_all_users as get_all_users_func,
    get_user_profile as get_user_profile_func
)


userMgtApp = APIRouter(
    prefix="/admin/user_management",
    tags=["Admin Panel User Management"],
    dependencies=[Depends(get_current_admin)]
)

# ----------------------------- GET ALL USERS --------------------------- #
@userMgtApp.get("/users")
async def get_users():
    
    return get_all_users_func()


# ----------------------------- GET USER PROFILE --------------------------- #
@userMgtApp.get("/user/{telegram_user_id}")
async def get_user_profile(telegram_user_id: str):

    return get_user_profile_func(telegram_user_id)