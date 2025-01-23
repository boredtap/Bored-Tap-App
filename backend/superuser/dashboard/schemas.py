from pydantic import BaseModel


class RecentActivity(BaseModel):
    total_coins: int