from io import BytesIO
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response
from superuser.dashboard.admin_auth import get_current_admin
from superuser.task.models import ExportFormat, TaskParticipants, TaskStatus, TaskType
from superuser.task.schemas import CreateTask, TaskSchema, TaskSchemaResponse, UpdateTask
from superuser.task.dependencies import (
        validate_image,
        create_task as create_task_func, 
        check_task_by_id, task_exists_in_db,
        get_task_by_id as get_task_by_id_func, 
        update_task as update_task_func,
        get_all_tasks as get_all_tasks_func,
        get_tasks_by_type as get_tasks_by_type_func,
        get_tasks_by_status as get_tasks_by_status_func,
        delete_task as delete_task_func,
        export_tasks as export_tasks_func
    )


task_router = APIRouter(
    prefix="/admin/task",
    tags=["Admin Panel Task"],
    # responses={404: {"description": "Not found"}},
    dependencies=[Depends(get_current_admin)]
)

# --------------------------------- CREATE TASK ---------------------------------
@task_router.post("/create_task", status_code=201, response_model=TaskSchemaResponse)
async def create_task(task = Depends(CreateTask)):
    # check if task already exists
    task_already_exists = task_exists_in_db(task.task_name)

    if task_already_exists:
        raise HTTPException(status_code=400, detail="Task with this name already exists.")

    image_data = None    # initialize image_date to None
    if task.task_image:
        image_data = await validate_image(task.task_image)
    
    # create task
    task = TaskSchema(
        task_name=task.task_name,
        task_type=task.task_type,
        task_description=task.task_description,
        task_status=task.task_status,
        task_participants=task.task_participants,
        task_reward=task.task_reward,
        task_image=image_data,
        task_deadline=task.task_deadline
    )

    created_task = create_task_func(task, image_data)


    return created_task


# --------------------------------- UPDATE TASK ---------------------------------
@task_router.put("/update_task", response_model=TaskSchema)
async def update_task(task_id: str, task = Depends(UpdateTask)):
    # check if task exists
    task_exists = check_task_by_id(task_id)

    # check if file exists
    if not task_exists:
        raise HTTPException(status_code=404, detail="Task not found.")
    
    # validate image if modified
    image_data = None
    if task.task_image:
        image_data = await validate_image(task.task_image)

    # update task
    task = TaskSchema(
        task_name=task.task_name,
        task_type=task.task_type,
        task_description=task.task_description,
        task_status=task.task_status,
        task_participants=task.task_participants,
        task_reward=task.task_reward,
        task_image=image_data,
        task_deadline=task.task_deadline
    )

    updated_task = update_task_func(task=task, task_id=task_id)


    return updated_task


# --------------------------------- GET TASK BY ID ---------------------------------
@task_router.get("/tasks_by_id", response_model=TaskSchema | dict)
async def get_task_by_id(task_id: str) -> TaskSchema:
    task = get_task_by_id_func(task_id)

    return task


# --------------------------------- GET ALL TASKS ---------------------------------
@task_router.get("/all_tasks", response_model=List[TaskSchemaResponse])
async def get_all_tasks():
    tasks = get_all_tasks_func()

    return tasks


# --------------------------------- GET TASK BY TYPE ---------------------------------
@task_router.get("/tasks_by_type")
async def get_task_by_type(task_type: TaskType) -> list[TaskSchemaResponse]:
    tasks = get_tasks_by_type_func(task_type)

    return tasks

# --------------------------------- GET TASK BY STATUS ---------------------------------
@task_router.get("/tasks_by_status", response_model=List[TaskSchemaResponse])
async def get_task_by_status(status: TaskStatus) -> list[TaskSchemaResponse]:
    tasks = get_tasks_by_status_func(status)

    return tasks


# --------------------------------- GET TASK BY PARTICIPANTS ---------------------------------
@task_router.get("/tasks_by_participants", deprecated=True)
async def get_task_by_participants(participants: TaskParticipants):
    return {"message": f"Get tasks with participants {participants}"}

# --------------------------------- GET TASK BY DATE CREATED ---------------------------------
@task_router.get("/tasks_by_date", deprecated=True)
async def get_task_by_date(date_created: str):
    return {"message": f"Get tasks created on {date_created}"}

# --------------------------------- GET TASK BY DEADLINE DATE ---------------------------------
@task_router.get("/get_tasks_by_deadline", deprecated=True)
async def get_task_by_deadline(deadline: str):
    return {"message": f"Get tasks with deadline {deadline}"}


# --------------------------------- DELETE TASK ---------------------------------
@task_router.delete("/delete_task")
async def delete_task(task_id: str):
    deleted_task = delete_task_func(task_id)

    if deleted_task:
        return {"message": "Task deleted successfully."}

    return {"message": "Task not found/Invalid task id."}


# --------------------------------- EXPORT TASKS ---------------------------------
@task_router.get("/export_tasks", deprecated=True)
async def export_tasks(task_format: ExportFormat):
    output: BytesIO = export_tasks_func(task_format)
    
    if task_format == ExportFormat.CSV:
        format = "csv"
    elif task_format == ExportFormat.XLSX:
        format = "xlsx"
    else:
        raise HTTPException(status_code=400, detail="Invalid format.")

    return Response(
        content=output.getvalue(),
        media_type=f"text/{format}",
        headers={
            "Content-Disposition": "attachment;\
            filename=bored_tap_tasks.{format}"
        }
    )
