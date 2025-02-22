from datetime import datetime
from pydantic import BaseModel


class ExtraBoostModel(BaseModel):
    name: str
    description: str
    level: int
    effect: str
    upgrade_cost: int
    condition: str
    image_id: str
    created_at: datetime

class ExtraBoostModelResponse(ExtraBoostModel):
    id: str


class AutoBotModel(BaseModel):
    name: str = "Auto-bot Tapping"
    description: str = "Buy auto-bot to tap for you while you're away"
    level: str = "-"
    effect: str = "+10000 coins per hour while user is away"
    upgrade_cost: int
    condition: str= "connect wallet"
    image_id: str
    created_at: datetime

class AutoBotModelResponse(AutoBotModel):
    id: str
