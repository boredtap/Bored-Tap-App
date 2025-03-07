from datetime import datetime
from enum import Enum
from pydantic import BaseModel


class ClanCategories(str, Enum):
    ALL_CLANS="all_clans"
    ACTIVE="active"
    PENDING="pending"
    DISBANDED="disbanded"

    def __repr__(self):
        return self.value


class ClanTopMembers(BaseModel):
    username: str
    level: int
    total_coins: int
    in_clan_rank: str


class ClanProfile(BaseModel):
    id: str
    name: str
    status: str
    rank: str
    creator: str
    coins_earned: int
    members: int
    created_at: datetime


class ClanProfileMembers(ClanProfile):
    top_members: dict
