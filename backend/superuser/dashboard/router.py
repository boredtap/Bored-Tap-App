from datetime import timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from superuser.dashboard.models import AdminProfile
from superuser.dashboard.dependencies import (
    get_new_users,
    get_overall_total_coins_earned,
    get_total_users_signal,
    get_users_leaderboard,
    get_users_level_data,
    recent_activity_data_for_coins,
    get_total_new_users,
    recent_activity_data_for_users,
    get_image as get_image_func,
    search_through_app
)
from superuser.dashboard.admin_auth import authenticate_admin, get_current_admin, hash_password
from superuser.dashboard.schemas import (
    AddAdmin
)
from user_reg_and_prof_mngmnt.schemas import Token
from user_reg_and_prof_mngmnt.user_authentication import create_access_token
from database_connection import admin_collection


adminDashboard = APIRouter(
    prefix="/admin/dashboard",
    tags=["Admin Panel Dashboard"],
    # responses={404: {"description": "Not found"}},
    dependencies=[Depends(get_current_admin)]
)


@adminDashboard.post("/add_admin", deprecated=True)
async def add_admin(admin: AddAdmin):
    admin_check = admin_collection.find_one({"username": admin.username})
    if admin_check:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin already exists"
        )
    
    hashed_password = hash_password(admin.password)
    new_admin = AdminProfile(
        username=admin.username,
        hashed_password=hashed_password,
        role=admin.role
    )

    admin_collection.insert_one(new_admin.model_dump())
    return {
        "message": "Admin added successfully"
    }


@adminDashboard.post("/signin", deprecated=True)
async def sign_in(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    admin = authenticate_admin(form_data.username, form_data.password)

    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=60)
    access_token = create_access_token(
        data={
            "username": admin.username,
            "role": admin.role
        }, 
        expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")


# ------------------------------------- search through app -------------------------------------
@adminDashboard.get("/search")
async def search(query: str):
    
    return search_through_app(query)


# ------------------------------------- get total number of users -------------------------------------
@adminDashboard.get("/overall_total_users")
async def overall_total_users():
    """
    Gets the total number of users, new users in the last 24 hours and the percentage increase.

    This route checks if there are any new users in the last 24 hours, and if there are, it calculates the percentage increase.
    If there are no new users in the last 24 hours, the percentage increase is set to 0.00.

    This route returns a dictionary with the following keys:

        - total_users: The total number of registered users.
        - total_new_users: The total number of new users in the last 24 hours.
        - percentage_increase: The percentage increase in the total number of users in the last 24 hours.

    :return: A dictionary with the total users, total number of new users and the percentage increase.
    :rtype: dict[str, int | float | datetime]
    """

    total_users = get_total_users_signal()
    return total_users


# ------------------------------------- get total number of new users -------------------------------------
@adminDashboard.get("/total_new_users")
async def total_new_users():
    total_new_users = get_total_new_users()
    return total_new_users


# ------------------------------------- get overall total coins -------------------------------------
@adminDashboard.get("/overall_total_coins_earned")
async def overall_total_coins_earned():
    total_coins_earned = get_overall_total_coins_earned()
    return total_coins_earned


# ------------------------------------- get new users -------------------------------------
@adminDashboard.get("/new_users")
async def new_users():
    total_new_users = get_new_users()
    return total_new_users


# ------------------------------------- get users leaderboard -------------------------------------
@adminDashboard.get("/leaderboard")
async def leaderboard():
    leaderboard_data = get_users_leaderboard()

    return leaderboard_data


# ------------------------------------- get recent activity data for coins -------------------------------------
@adminDashboard.get("/coins/recent_activity")
async def coins_recent_activity():
    recent_activity_data = recent_activity_data_for_coins()

    return recent_activity_data


# ------------------------------------- get recent activity data for users -------------------------------------
@adminDashboard.get("/users/recent_activity")
async def users_recent_activity():
    recent_activity_data = recent_activity_data_for_users()

    return recent_activity_data


# ------------------------------------- get users data on levels -------------------------------------
@adminDashboard.get("/levels/chart_data")
async def levels_data():
    data = get_users_level_data()

    return data


# ------------------------------------- get images -------------------------------------
@adminDashboard.get("/images/image")
async def get_image(image_id: str):
    
    return get_image_func(image_id)