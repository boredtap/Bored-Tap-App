from datetime import datetime
from enum import Enum
from pydantic import BaseModel


class ClanStatus(str, Enum):
    ACTIVE = "active"
    PENDING = "pending"
    DISBAND = "disband"

    def __repr__(self):
        return self.value

class ID(BaseModel):
    id: str


class Clan(BaseModel):
    name: str
    creator: str
    rank: int
    total_coins: int
    created_at: datetime
    status: str = ClanStatus.PENDING
    image_id: str
    members: int


class ClanModelResponse(Clan, ID):
    pass
