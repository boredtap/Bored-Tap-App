from datetime import datetime
from typing import Annotated, List, Union
from fastapi import Form, UploadFile
from pydantic import BaseModel
from superuser.task.models import TaskParticipants, TaskStatus, TaskType


class CreateTask(BaseModel):
    task_name: Annotated[str, Form(...)]
    task_type: TaskType
    task_description: Annotated[str, Form(...)]
    task_status: TaskStatus
    task_participants: Union[TaskParticipants, List[TaskParticipants]]
    task_reward: Annotated[int, Form(...)]
    task_deadline: Annotated[datetime, Form(...)]
    task_image: Annotated[UploadFile, Form(description="Upload task image", media_type="multipart/form-data")]


class UpdateTask(BaseModel):
    task_name: Annotated[str | None, Form(...)] = None
    task_type: TaskType | None = None
    task_description: Annotated[str | None, Form(...)] = None
    task_status: TaskStatus | None = None
    task_participants: Union[TaskParticipants, List[TaskParticipants]] | None = None
    task_reward: Annotated[int | None, Form(...)] = None
    task_deadline: Annotated[datetime | None, Form(...)] = None
    task_image: Annotated[UploadFile | str | None, Form(description="Upload task image", media_type="multipart/form-data")] = None


class TaskSchema(BaseModel):
    task_name: str
    task_type: TaskType
    task_description: str
    task_url: str | None = None
    task_status: TaskStatus
    task_participants: TaskParticipants | list[TaskParticipants]
    task_reward: int
    task_image_id: str | None
    task_deadline: datetime

class TaskSchemaResponse(BaseModel):
    id: str
    task_name: str
    task_type: str
    task_description: str
    task_url: str | None
    task_status: str
    task_participants: str | list[str]
    task_reward: int
    task_image_id: str | None
    task_deadline: datetime
