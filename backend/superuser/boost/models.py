from datetime import datetime
from pydantic import BaseModel


class ExtraBoostModel(BaseModel):
    name: str
    description: str
    level: int
    effect: str
    upgrade_cost: int
    condition: str
    image_id: str
    created_at: datetime

class ExtraBoostModelResponse(ExtraBoostModel):
    id: str
