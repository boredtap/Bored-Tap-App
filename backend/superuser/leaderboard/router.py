from datetime import datetime
from fastapi import APIRouter, Depends
from superuser.dashboard.admin_auth import get_current_admin
from superuser.leaderboard.dependencies import all_time_leaderboard, daily_leaderboard, leaderboard_date_filter, leaderboard_profile, monthly_leaderboard, weekly_leaderboard
from superuser.leaderboard.schemas import LeaderboardType


adminLeaderboard = APIRouter(
    prefix="/admin/leaderboard",
    tags=["Admin Panel Leaderboard"],
    dependencies=[Depends(get_current_admin)]
)


# ------------------------------------- get leaderboard ------------------------------------- #
@adminLeaderboard.get("/")
async def leaderboard(category: LeaderboardType):
    if category == LeaderboardType.ALL_TIME:
        leaderboard = all_time_leaderboard()
    
    if category == LeaderboardType.DAILY:
        leaderboard = daily_leaderboard()
    
    if category == LeaderboardType.WEEKLY:
        leaderboard = weekly_leaderboard()
    
    if category == LeaderboardType.MONTHLY:
        leaderboard = monthly_leaderboard() 
    
    return leaderboard


# ------------------------------------- filter leaderboard by date ------------------------------------- #
@adminLeaderboard.get("/filter")
async def leaderboard(date_filter: datetime):
    return leaderboard_date_filter(date_filter)


# ------------------------------------- LEADERBOARD PROFILE ------------------------------------- #
@adminLeaderboard.get("/leaderboard_profile")
async def overall_achievement(telegram_user_id: str):
    return leaderboard_profile(telegram_user_id)
