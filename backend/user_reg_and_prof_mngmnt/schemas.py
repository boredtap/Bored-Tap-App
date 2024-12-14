from pydantic import BaseModel, Field

class BasicProfile(BaseModel):
    username: str
    image_url: str = Field(..., title="Image URL")
    level: int
    total_coins: int

