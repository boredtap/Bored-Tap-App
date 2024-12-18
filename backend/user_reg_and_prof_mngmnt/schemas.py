from pydantic import BaseModel, AnyHttpUrl


class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    telegram_user_id: str
    username: str

class Signup(BaseModel):
    telegram_user_id: str
    username: str
    # invite_code: str | None

class BasicProfile(BaseModel):
    telegram_user_id: str
    username: str | None = None
    firstname: str | None = None
    image_url: AnyHttpUrl | None = None
    level: int = 0
    total_coins: int = 0
