from datetime import datetime
from bson import Binary
from pydantic import BaseModel, ConfigDict


class RewardsModel(BaseModel):
    reward_title: str
    reward: int
    beneficiary: list[str]
    launch_date: datetime
    status: str
    claim_rate: int
    reward_image: Binary

    model_config = ConfigDict(arbitrary_types_allowed=True)

class Id(BaseModel):
    id: str

class RewardsModelResponse(Id, RewardsModel):
    pass