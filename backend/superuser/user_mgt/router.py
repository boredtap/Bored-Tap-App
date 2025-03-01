from fastapi import APIRouter, Depends
from superuser.dashboard.admin_auth import get_current_admin
from superuser.user_mgt.dependencies import (
    delete_many_users,
    delete_one_user,
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


# ---------------------------------- DELETE A USER -------------------------------- #
@userMgtApp.delete("/delete/user/{telegram_user_id}")
async def delete_user(telegram_user_id: str):
    
    return delete_one_user(telegram_user_id)


# --------------------------------------- DELETE MANY USERS --------------------------------------- #
@userMgtApp.delete("/delete/users")
async def delete_users(user_ids: list[str] | None = None):

    
    return delete_many_users(telegram_user_ids=user_ids)