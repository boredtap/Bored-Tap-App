from pydantic import BaseModel


class ExtraBoosters(BaseModel):
    booster_id: str
    name: str
    description: str
    level: int
    effect: str
    upgrade_cost: int
    image_id: str


class AutoBotTap(BaseModel):
    booster_id: str
    name: str
    description: str
    level: str = "-"
    effect: str
    upgrade_cost: int
    image_id: str
