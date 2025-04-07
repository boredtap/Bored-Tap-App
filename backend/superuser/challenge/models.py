from datetime import datetime
from enum import Enum
from pydantic import BaseModel


class ChallengeCategory(str, Enum):
    OPENED = "opened"
    COMPLETED = "completed"

    def __repr__(self) -> str:
        return self.value


class Id(BaseModel):
    id: str


class ChallengeModel(BaseModel):
    name: str
    description: str
    launch_date: datetime
    reward: int
    duration: str
    remaining_time: str
    participants: list[str]
    image_id: str


class ChallengeModelResponse(ChallengeModel, Id):
    pass
