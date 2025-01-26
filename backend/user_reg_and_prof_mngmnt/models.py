from datetime import datetime
from pydantic import BaseModel, AnyHttpUrl, Field
from user_reg_and_prof_mngmnt.schemas import InviteeData
from earn.schemas import StreakData


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
