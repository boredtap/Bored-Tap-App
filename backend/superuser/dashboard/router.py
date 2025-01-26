from datetime import timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Path
from fastapi.security import OAuth2PasswordRequestForm
from superuser.dashboard.models import AdminProfile, AdminRoleEnum
from superuser.dashboard.dependencies import get_new_users, get_overall_total_coins_earned, get_total_new_users, get_total_users
from superuser.dashboard.admin_auth import authenticate_admin, get_current_admin, hash_password
from superuser.dashboard.schemas import (
    AddAdmin
)
from user_reg_and_prof_mngmnt.schemas import Token
from user_reg_and_prof_mngmnt.user_authentication import create_access_token
from database_connection import admin_collection


adminDashboard = APIRouter(
    prefix="/admin/dashboard",
    tags=["Admin Dashboard"],
    responses={404: {"description": "Not found"}},
    dependencies=[Depends(get_current_admin)]
)


@adminDashboard.post("/add_admin", deprecated=False)
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

@adminDashboard.post("/signin")
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

@adminDashboard.get("/overall_total_users")
async def overall_total_users():
    total_users = get_total_users()
    return total_users

@adminDashboard.get("/total_new_users")
async def total_new_users():
    total_new_users = get_total_new_users()
    return total_new_users

@adminDashboard.get("/overall_total_coins_earned")
async def overall_total_coins_earned():
    total_coins_earned = get_overall_total_coins_earned()
    return total_coins_earned

@adminDashboard.get("/new_users")
async def new_users():
    total_new_users = get_new_users()
    return total_new_users



