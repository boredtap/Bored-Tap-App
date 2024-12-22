from datetime import date
from pydantic import BaseModel


class StreakData(BaseModel):
    telegram_user_id: str
    last_action_date: date
    current_streak: int
    longest_streak: int
    