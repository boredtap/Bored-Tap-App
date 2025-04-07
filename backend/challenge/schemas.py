from pydantic import BaseModel


class MyChallenges(BaseModel):
    challenge_id: str
    name: str
    description: str
    reward: int
    remaining_time: str
    image_id: str
