from datetime import datetime
from fastapi.responses import Response
from pydantic import BaseModel, ConfigDict



class Id(BaseModel):
    id: str


class RewardsModel(BaseModel):
    reward_title: str
    reward: int
    beneficiary: list[str]
    launch_date: datetime
    status: str
    claim_rate: int
    reward_image_id: str


class RewardsModelResponse(Id, RewardsModel):
    pass