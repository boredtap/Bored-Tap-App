from pydantic import BaseModel, AnyHttpUrl
from earn.schemas import StreakData


class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    telegram_user_id: str

class Signup(BaseModel):
    telegram_user_id: str
    username: str
    image_url: AnyHttpUrl
    # invite_code: str | None


class Update(BaseModel):
    telegram_user_id: str
    total_coins: int
    level: int

class BasicProfile(BaseModel):
    telegram_user_id: str
    username: str | None = None
    firstname: str | None = None
    image_url: AnyHttpUrl | str
    total_coins: int | None = 0
    level: int | None = 1

class UserProfile(
        StreakData,
        BasicProfile
    ):
    pass
