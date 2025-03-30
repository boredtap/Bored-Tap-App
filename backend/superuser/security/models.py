from datetime import datetime
from pydantic import BaseModel


class SuspendDetails(BaseModel):
    start_date: datetime
    end_date: datetime
    reason: str | None
    # remaining_time: int