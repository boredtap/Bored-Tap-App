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
    telegram_user_id: int
    username: str
    image_url: str

class RecentActivityData(BaseModel):
    year: int
    data: dict[int, int]

"""
year    |            data
-------------------------------------
2021    |    {1: 100, 2: 200, 3: 300}
2022    |    {1: 100, 2: 200, 3: 300}
"""


class LevelDataInfo(BaseModel):
    level: int
    level_name: str
    total_users: int
