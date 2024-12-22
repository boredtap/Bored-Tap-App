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


class UpdateLevel(BaseModel):
    telegram_user_id: str
    level: int

class BasicProfile(BaseModel):
    telegram_user_id: str
    username: str | None = None
    firstname: str | None = None
    image_url: AnyHttpUrl | str
    level: int | None = None
    total_coins: int | None = None

class UpdateProfile(BasicProfile):
    pass
