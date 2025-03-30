from datetime import datetime
from pydantic import BaseModel


class StreakData(BaseModel):
    current_streak: int = 0
    longest_streak: int = 0
    last_action_date: datetime | None = None

class Update(BaseModel):
    telegram_user_id: str
    total_coins: int