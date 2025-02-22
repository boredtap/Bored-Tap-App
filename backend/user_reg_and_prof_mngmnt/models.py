from datetime import datetime
from pydantic import BaseModel, AnyHttpUrl, Field
from user_reg_and_prof_mngmnt.schemas import InviteeData
from earn.schemas import StreakData



extra_boost = {
    "boost": 0,
    "multiplier": 0,
    "recharging_speed": 0,
    "auto_bot_tap": False
}


class ExtraBoost(BaseModel):
    boost: int = 0
    multiplier: int = 0
    recharging_speed: int = 0
    auto_bot_tap: bool = False

class UserProfile(BaseModel):
    telegram_user_id: str
    username: str | None = None
    firstname: str | None = None
    image_url: AnyHttpUrl | str
    total_coins: int | None = 0
    level: int | None = 1
    level_name: str | None = "Novice"
    referral_url: str | None = None
    streak: StreakData = Field(default_factory=StreakData)
    invite: list[InviteeData] | None = []
    is_admin: bool = False
    is_active: bool = True
    created_at: datetime = datetime.now()
    clan: list[str] = []
    claimed_rewards: list[str] = []
    extra_boost: ExtraBoost = Field(default_factory=ExtraBoost)
