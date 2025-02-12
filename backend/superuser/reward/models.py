from datetime import datetime


class Id(BaseModel):
    id: str

class RewardsModel(BaseModel):
    reward_title: str
    reward: int
    beneficiary: list[str]
    launch_date: datetime
    status: str
    claim_count: int
    claim_rate: int
    reward_image_id: str

class RewardsModelResponse(Id, RewardsModel):
    pass