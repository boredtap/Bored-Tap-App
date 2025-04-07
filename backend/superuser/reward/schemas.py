from datetime import datetime
from enum import Enum
from typing import Annotated
from fastapi import Form, UploadFile
from pydantic import BaseModel


class Status(str, Enum):
    ONGOING = "on_going"
    CLAIMED = "claimed"

    def __repr__(self):
        return self.value

class Level(str, Enum):
    NOVICE = "novice"
    EXPLORER = "explorer"
    APPRENTICE = "apprentice"
    WARRIOR = "warrior"
    MASTER = "master"
    CHAMPION = "champion"
    TACTICIAN = "tactician"
    SPECIALIST = "specialist"
    CONQUEROR = "conqueror"
    LEGEND = "legend"

    def __repr__(self):
        return self.value


class Beneficiary(str, Enum):
    ALL_USERS = "all_users"
    LEVEL = "level"
    CLAN = "clan"
    SPECIFIC_USERS = "specific_users"

    def __repr__(self):
        return self.value

class CreateReward(BaseModel):
    reward_title: Annotated[str, Form(description="Reward title")]
    reward: Annotated[int, Form(description="Reward amount")]
    expiry_date: Annotated[datetime, Form(description="Launch date")]
    beneficiary: Annotated[Beneficiary, Form(description="Beneficiary")]
    reward_image: Annotated[UploadFile, Form(description="Upload reward image", media_type="multipart/form-data")]


class UpdateReward(CreateReward):
    pass
