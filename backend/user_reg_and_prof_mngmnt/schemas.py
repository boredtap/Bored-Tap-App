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
    image_url: AnyHttpUrl
    # invite_code: str | None

class BasicProfile(BaseModel):
    telegram_user_id: str
    username: str
    firstname: str | None = None
    image_url: AnyHttpUrl
    level: int = 0
    total_coins: int = 0

class UpdateProfile(BasicProfile):
    user_id: str

