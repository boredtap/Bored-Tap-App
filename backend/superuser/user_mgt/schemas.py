from datetime import datetime
from pydantic import BaseModel


class OverallAchievement(BaseModel):
    total_coins: int
    completed_tasks: int
    longest_streak: int
    rank: str
    invitees: int

class TodayAchievement(BaseModel):
    total_coins: int
    completed_tasks: int
    current_streak: int
    rank: str
    invitees: int

class Clan(BaseModel):
    clan_name: str | None = None
    in_clan_rank: int | None = None


class UserMgtDashboard(BaseModel):
    telegram_user_id: str
    username: str
    level: int
    level_name: str
    coins_earned: int
    invite_count: int
    registration_date: datetime
    status: str


class UserProfile(BaseModel):
    telegram_user_id: str
    username: str
    level: int
    level_name: str
    image_url: str
    overall_achievement: OverallAchievement
    today_achievement: TodayAchievement
    wallet_address: str | None = None
    clan: Clan | None = None
    created_at: datetime
