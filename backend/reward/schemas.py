from pydantic import BaseModel


class RewardSchema(BaseModel):
    reward_id: str
    reward_title: str
    reward: int
    reward_image_id: str
