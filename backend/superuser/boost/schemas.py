from enum import Enum
from typing import Annotated
from fastapi import Form, UploadFile
from pydantic import BaseModel


class BoostCategories(str, Enum):
    BOOST = "boost"
    MULTIPLIER = "multiplier"
    RECHARGING_SPEED = "recharging speed"
    AUTO_BOT_TAPPING = "Auto-bot Tapping"

    def __repr__(self):
        return self.value


class CreateExtraBoost(BaseModel):
    name: BoostCategories
    description: str
    level: int
    effect: str
    upgrade_cost: int
    condition: str = "Upgrade cost"
    image: Annotated[UploadFile | None, Form(description="Upload extra boost image", media_type="multipart/form-data")] = None


class UpdateUpgradeCost(BaseModel):
    extra_boost_id: str
    upgrade_cost: int
