from enum import Enum
from datetime import datetime, timezone
from pydantic import BaseModel


class TaskType(str, Enum):
    IN_GAME = "in-game"
    SPECIAL = "special"
    SOCIAL = "social"

    def __repr__(self) -> str:
        return self.value

class TaskStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PAUSED = "paused"

    def __repr__(self) -> str:
        return self.value

class TaskParticipants(str, Enum):
    ALL = "all_users"
    NOVICE = "novice"
    EXPLORER = "explorer"
    APPRENTICE = "apprentice"
    WARRIOR = "warrior"
    MASTER = "master"
    CHAMPION = "champion"
    TACTICIAN = "tactician"
    SPECIALIST = "specialist"
    CONQUEROR = "conqueror"
    LEGEND = "legend"

    def __repr__(self) -> str:
        return self.value

class ExportFormat(str, Enum):
    CSV = "csv"
    XLSX = "xlsx"
    # JSON = "json"

class Task(BaseModel):
    task_name: str
    task_type: str
    task_description: str
    task_url: str | None = None
    task_status: TaskStatus
    task_participants: TaskParticipants | list[TaskParticipants]
    task_reward: int
    task_image_id: str | None
    completed_users: list[str] = []
    created_at: datetime = datetime.now(timezone.utc)
    last_updated: datetime | None = None
    task_deadline: datetime


class TaskModelResponse(BaseModel):
    _id: str
    task_name: str
    task_type: TaskType
    task_description: str
    task_status: TaskStatus
    task_participants: TaskParticipants | list[TaskParticipants]
    task_reward: int
    task_image_id: bytes | None
    created_at: datetime = datetime.now(timezone.utc)
    last_updated: datetime | None = None
    task_deadline: datetime

class UpdateTask(BaseModel):
    task_name: str
    task_type: TaskType
    task_description: str
    task_url: str | None = None
    task_status: TaskStatus
    task_participants: TaskParticipants | list[TaskParticipants]
    task_reward: int
    task_image_id: str | None
    # created_at: datetime = datetime.now()
    last_updated: datetime = None
    task_deadline: datetime
