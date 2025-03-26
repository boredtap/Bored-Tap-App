from datetime import datetime
from enum import Enum
from pydantic import  BaseModel



class UserStatusCategory(str, Enum):
    # ACTIVE = "active"
    SUSPEND = "suspend"
    BAN = "ban"
    RESUME = "resume"

    def __repr__(self):
        return self.value


class UserStatus(BaseModel):
    user_id: str
    status: UserStatusCategory
    end_date: datetime | None = None
    reason: str | None = None
