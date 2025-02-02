from enum import Enum
from datetime import datetime
from tkinter import ACTIVE
from unittest.mock import Base
from h11 import PAUSED
from pydantic import BaseModel

from superuser import task


class TaskType(str, Enum):
    IN_GAME = "in-game"
    SPECIAL = "special"
    SOCIAL = "social"

class TaskStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PAUSED = "paused"

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

class ExportFormat(str, Enum):
    CSV = "csv"
    XLSX = "xlsx"
    # JSON = "json"

class Task(BaseModel):
    task_name: str
    task_type: TaskType
    task_description: str
    task_status: TaskStatus
    task_participants: TaskParticipants | list[TaskParticipants]
    task_reward: int
    task_image: bytes | None
    created_at: datetime = datetime.now()
    last_updated: datetime | None = None
    task_deadline: datetime


class TaskModelResponse(Task):
    _id: str

class UpdateTask(BaseModel):
    task_name: str
    task_type: TaskType
    task_description: str
    task_status: TaskStatus
    task_participants: TaskParticipants | list[TaskParticipants]
    task_reward: int
    task_image: str | None
    # created_at: datetime = datetime.now()
    last_updated: datetime = None
    task_deadline: datetime
