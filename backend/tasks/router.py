from typing import Annotated
from fastapi import APIRouter, Depends, Query
from superuser.task.models import TaskType
from tasks.dependencies import (
        my_tasks_by_type,
        my_completed_tasks as my_completed_tasks_func
    )
from tasks.schemas import MyTasks
from user_reg_and_prof_mngmnt.user_authentication import get_current_user


taskApp = APIRouter(
    prefix="/user/tasks",
    tags=["User Tasks"],
    dependencies=[Depends(get_current_user)],
)


# ------------------------------------- GET MY TASKS BY TYPE -------------------------------------
@taskApp.get("/my_tasks")
async def my_tasks(
        task_type: TaskType, 
        telegram_user_id: Annotated[str, Depends(get_current_user)],
        page_size: int = Query(10, description="Page size/maximum number of results"),
        page_number: int = Query(1, description="Page number"),
    ) -> list[MyTasks]:
    skip = (page_number - 1) * page_size
    my_tasks = my_tasks_by_type(telegram_user_id=telegram_user_id, task_type=task_type, skip=skip, limit=page_size)

    return my_tasks


# ------------------------------------- GET MY COMPLETED TASKS -------------------------------------
@taskApp.get("/my_tasks/completed")
async def my_completed_tasks(telegram_user_id: Annotated[str, Depends(get_current_user)]) -> MyTasks | list[MyTasks]:
    my_tasks = my_completed_tasks_func(telegram_user_id=telegram_user_id)

    return my_tasks
