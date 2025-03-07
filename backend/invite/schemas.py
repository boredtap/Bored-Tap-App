from pydantic import BaseModel


class Invitee(BaseModel):
    telegram_user_id: str
    username: str
    level: int
    image_url: str
    total_coins: int
    invites: int = 0
