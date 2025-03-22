from datetime import datetime, timezone
from pydantic import BaseModel, AnyHttpUrl, Field
from earn.schemas import StreakData



extra_boost = {
    "boost": 0,
    "multiplier": 0,
    "recharging_speed": 0,
    "auto_bot_tap": False
}


class InviteeData(BaseModel):
    """
    Invites model for storing user invite information.

    Attributes:
        telegram_user_id (str): The Telegram user ID.
        invitee (str | None): The invitee's username, if any.
    """
    username: str | None = None
    level: int | None = 1
    # level_name: str
    total_coins: int | None = 0

class ExtraBoost(BaseModel):
    boost: int = 0
    multiplier: int = 0
    recharging_speed: int = 0
    auto_bot_tap: bool = False

class Clan(BaseModel):
    id: str | None = None
    name: str | None = None

class UserProfile(BaseModel):
    telegram_user_id: str
    username: str | None = None
    firstname: str | None = None
    image_url: AnyHttpUrl | str
    total_coins: int | None = 0
    power_limit: int | None = 1000
    last_active_time: datetime | None = None
    auto_bot_active: bool = False
    level: int | None = 1
    level_name: str | None = "Novice"
    referral_url: str | None = None
    streak: StreakData = Field(default_factory=StreakData)
    invite: list[InviteeData] | None = []
    is_admin: bool = False
    is_active: bool = True
    created_at: datetime = datetime.now(timezone.utc)
    clan: Clan = Field(default_factory=Clan)
    claimed_rewards: list[str] = []
    extra_boost: ExtraBoost = Field(default_factory=ExtraBoost)
