from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException
from superuser.dashboard.admin_auth import get_current_admin
from superuser.level.dependencies import verify_badge
from superuser.level.schemas import CreateLevel
from superuser.level.dependencies import (
    create_level as create_level_func, verify_new_level,
    get_levels as get_levels_func,
    delete_level as delete_level_func
)


levelApp = APIRouter(
    prefix="/admin/levels",
    tags=["Admin Panel Levels"],
    dependencies=[Depends(get_current_admin)]
)


# ------------------------ CREATE LEVEL ------------------------ #
@levelApp.post("/create_level")
async def create_level(level: CreateLevel = Depends(CreateLevel)):
    if not level.badge:
        raise HTTPException(status_code=400, detail="Please upload a badge image.")

    badge_filename = level.badge.filename
    badge_format = badge_filename.split(".")[1]
    badge_bytes = await level.badge.read()

    verify_badge(badge_format)
    verify_new_level(level)
        
    created_level = create_level_func(level, badge_bytes, badge_filename)

    return created_level


# ------------------------ GET ALL LEVELS ------------------------ #
@levelApp.get("/get_levels")
async def get_levels():

    return get_levels_func()


# ------------------------ DELETE LEVEL ------------------------ #
@levelApp.delete("/delete_level/{level_id}")
async def delete_level(level_id: str):

    deleted = delete_level_func(level_id)

    if deleted:
        return {
            "message": "Level deleted successfully."
        }
