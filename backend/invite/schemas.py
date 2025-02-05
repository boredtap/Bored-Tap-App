from pydantic import BaseModel


class Invitee(BaseModel):
    username: str
    level: int
    image_url: str
    total_coins: int
