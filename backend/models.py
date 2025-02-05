from pydantic import BaseModel


class CoinStats(BaseModel):
    telegram_user_id: str
    date: dict[str, int] = {}
