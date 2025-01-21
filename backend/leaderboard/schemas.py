import datetime
from pydantic import BaseModel


class UserScores(BaseModel):
    user_id: str
    score: int
    date: datetime
    period: str
