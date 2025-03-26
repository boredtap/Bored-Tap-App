from enum import Enum
from pydantic import BaseModel


class LeaderboardType(str, Enum):
    ALL_TIME = "all_time"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"

    def __str__(self):
        return self.value


class OverallAchievement(BaseModel):
    total_coin: int = 0
    completed_tasks: int = 0
    longest_streak: int = 0
    rank: str | None
    invitees: int = 0

class TodayAchievement(BaseModel):
    total_coin: int = 0
    completed_tasks: int = 0
    current_streak: int = 0
    rank: str | None
    invitees: int | None = None

class Clan(BaseModel):
    clan_name: str | None
    in_clan_rank: str | None

class LeaderBoard(BaseModel):
    telegram_user_id: str
    rank: str
    username: str
    image_url: str
    level: int
    level_name: str
    coins_earned: int
    clan: str
    longest_streak: int

class LeaderBoardUserProfile(BaseModel):
    username: str
    level: int
    level_name: str
    image_url: str
    today_achievement: TodayAchievement
    overall_achievement: OverallAchievement
    wallet_address: str | None = None
    clan: Clan

