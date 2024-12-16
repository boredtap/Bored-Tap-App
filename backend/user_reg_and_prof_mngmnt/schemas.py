from pydantic import BaseModel, Field

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    telegram_user_id: str
    username: str

class BasicProfile(BaseModel):
    telegram_user_id: str
    username: str
    firstname: str | None
    image_url: str = Field(..., title="Image URL")
    level: int
    total_coins: int

