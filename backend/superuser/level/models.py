from pydantic import BaseModel

from superuser import level


class LevelModel(BaseModel):
    name: str
    level: int
    requirement: int
    badge_id: str

class LevelModelResponse(BaseModel):
    id: str
    name: str
    level: int
    requirement: int
    badge_id: str