from enum import Enum
from pydantic import BaseModel
from datetime import datetime


class TaskType(str, Enum):
    IN_GAME = "in-game"
    SPECIAL = "special"
    SOCIAL = "social"



class MyTasksData(BaseModel):
    task_id: str
    task_name: str
    task_reward: int
    task_type: str
    task_description: str
    task_status: str
    task_deadline: datetime
    task_image: str

class MyTasks(BaseModel):
    task_id: str
    task_name: str
    task_reward: int
    task_image_id: str | None = None
    task_description: str
    task_participants: list[str]
    task_url: str | None = None
    task_deadline: datetime