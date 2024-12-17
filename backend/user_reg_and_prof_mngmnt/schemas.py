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

class BasicProfile(BaseModel):
    telegram_user_id: str
    username: str | None
    firstname: str | None
    image_url: AnyHttpUrl | None
    level: int = 0
    total_coins: int = 0

