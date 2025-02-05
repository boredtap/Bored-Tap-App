from pydantic import BaseModel
from .models import AdminRoleEnum


class AddAdmin(BaseModel):
    username: str
    password: str
    role: AdminRoleEnum

class AdminSignin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminProfile(BaseModel):
    username: str
    role: AdminRoleEnum

class TokenData(AdminProfile):
    pass

class NewUserData(BaseModel):
    telegram_user_id: str
    username: str
    image_url: str

class LeaderboardData(BaseModel):
    username: str
    image_url: str
    total_coins: int

class RecentActivityData(BaseModel):
    year: int
    data: dict[int, int]

class LevelDataInfo(BaseModel):
    level: int
    level_name: str
    total_users: int
