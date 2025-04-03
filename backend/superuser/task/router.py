from io import BytesIO
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from superuser.dashboard.admin_auth import get_current_admin
from superuser.task.models import ExportFormat, TaskParticipants, TaskStatus, TaskType, UpdateTask as UpdateTaskModel
from superuser.task.schemas import CreateTask, TaskSchema, TaskSchemaResponse, UpdateTask
from superuser.task.dependencies import (
        extract_url_from_description,
        validate_image,
        create_task as create_task_func, 
        check_task_by_id, task_exists_in_db,
        get_task_by_id as get_task_by_id_func, 
        update_task as update_task_func,
        get_all_tasks as get_all_tasks_func,
        get_tasks_by_type as get_tasks_by_type_func,
        get_tasks_by_status as get_tasks_by_status_func,
        delete_task as delete_task_func,
        # export_tasks as export_tasks_func,
        validate_task_deadline
    )


task_router = APIRouter(
    prefix="/admin/task",
    tags=["Admin Panel Task"],
    # responses={404: {"description": "Not found"}},
    dependencies=[Depends(get_current_admin)]
)

# --------------------------------- CREATE TASK ---------------------------------
@task_router.post("/create_task", status_code=201, response_model=TaskSchemaResponse)
async def create_task(task: CreateTask = Depends(CreateTask)):
    """
    Endpoint to create a new task in the system.

    This endpoint checks if a task with the given name already exists.
    If it does, it raises an HTTP exception. Otherwise, it validates
    the task image (max size: 3MB) if provided and creates a new task with the specified
    details.
    Task deadline has to be greater than current date.
    Task expires at same time of creation on deadline date: if task was created at 10:00, 
    it expires at 10:00 of deadline date.

    Args:
        task (CreateTask): Task data, including name, type, description,
                           status, participants, reward, image, and deadline.
                           Participants are either all users, a level or list of levels

    Returns:
        TaskSchemaResponse: The created task data with an assigned ID.

    Raises:
        HTTPException: If a task with the specified name already exists.
    """
    # check if task already exists
    if task_exists_in_db(task.task_name):
        raise HTTPException(status_code=400, detail="Task with this name already exists.")
    
    # convert deadline timezone to utc and ensure it's greater than current time
    deadline = validate_task_deadline(task.task_deadline)
    task_url = extract_url_from_description(task.task_description)

    # ensure an image is attached to task
    if not task.task_image:
        raise HTTPException(status_code=400, detail="Please upload a task image.")

    image_id = await validate_image(task.task_image)
    
    # create task
    task = TaskSchema(
        task_name=task.task_name,
        task_type=task.task_type,
        task_description=task.task_description,
        task_url=task_url,
        task_status=task.task_status,
        task_participants=task.task_participants,
        task_reward=task.task_reward,
        task_image_id=image_id,
        task_deadline=deadline
    )

    created_task = create_task_func(task)

    return created_task


# --------------------------------- UPDATE TASK ---------------------------------
@task_router.put("/update_task", response_model=TaskSchema)
async def update_task(task_id: str, task: UpdateTask = Depends(UpdateTask)):
    """
    Endpoint to update a task in the system.

    This endpoint checks if a task with the provided ID exists.
    If it doesn't, it raises an HTTP exception. Otherwise, it validates
    the task image (max size: 3MB) if provided, and updates the task with the edited
    details.

    URL to be extracted from description must start with http:// or https://
    Task can't be edited on deadline's date.


    Args:
        task_id (str): ID of the task to update
        task (UpdateTask): Task data, including name, type, description,
                           status, participants, reward, image, and deadline.
                           Participants are either all users, a level or list of levels

    Returns:
        TaskSchema: The updated task data.

    Raises:
        HTTPException: If a task with the specified ID doesn't exist.
    """
    # check if task exists
    task_exists = check_task_by_id(task_id)

    # check if file exists
    if not task_exists:
        raise HTTPException(status_code=404, detail="Task not found.")

    deadline = validate_task_deadline(task.task_deadline)
    task_url = extract_url_from_description(task.task_description)

    # validate image if modified
    new_img_id = None   # to avoid unbound local variable error
    if task.task_image:
        new_img_id = await validate_image(task.task_image)

    # update task
    task = UpdateTaskModel(
        task_name=task.task_name,
        task_type=task.task_type,
        task_description=task.task_description,
        task_url=task_url,
        task_status=task.task_status,
        task_participants=task.task_participants,
        task_reward=task.task_reward,
        task_image_id=new_img_id,
        last_updated=datetime.now(timezone.utc),
        task_deadline=deadline
    )

    updated_task = update_task_func(task=task, task_id=task_id)


    return updated_task


# --------------------------------- GET TASK BY ID ---------------------------------
@task_router.get("/tasks_by_id", response_model=TaskSchema | dict)
async def get_task_by_id(task_id: str) -> TaskSchema:
    """
    Get a task by its ID.

    Args:
        task_id (str): ID of the task to retrieve.

    Returns:
        TaskSchema: The retrieved task, or an empty dict if the task doesn't exist.

    Raises:
        HTTPException: If the task with the specified ID doesn't exist.
    """

    task = get_task_by_id_func(task_id)

    return task


# --------------------------------- GET ALL TASKS ---------------------------------
@task_router.get("/all_tasks", response_model=List[TaskSchemaResponse])
async def get_all_tasks(
    page_size: int = Query(10, description="Page size/maximum number of results"),
    page_number: int = Query(1, description="Page number"),
):
    """
    Retrieve a paginated list of all tasks.

    This endpoint returns a list of tasks with pagination support.
    The tasks are sorted by their deadline in descending order.

    Args:
        page_size (int): The maximum number of tasks to return per page. Defaults to 10.
        page_number (int): The page number to retrieve. Defaults to 1.

    Returns:
        List[TaskSchemaResponse]: A list of TaskSchemaResponse objects representing the tasks.
    """
    skip = (page_number - 1) * page_size
    tasks = get_all_tasks_func(skip=skip, limit=page_size)

    return tasks


# --------------------------------- GET TASK BY TYPE ---------------------------------
@task_router.get("/tasks_by_type")
async def get_task_by_type(
        task_type: TaskType,
        page_size: int = Query(10, description="Page size/maximum number of results"),
        page_number: int = Query(1, description="Page number"),
    ) -> list[TaskSchemaResponse]:
    """
    Retrieve a paginated list of tasks of the given type.

    This endpoint returns a list of tasks with pagination support.
    The tasks are sorted by their deadline in descending order.

    Args:
        task_type (TaskType): The type of tasks to retrieve.
        page_size (int): The maximum number of tasks to return per page. Defaults to 10.
        page_number (int): The page number to retrieve. Defaults to 1.

    Returns:
        List[TaskSchemaResponse]: A list of TaskSchemaResponse objects representing the tasks.
    """
    skip = (page_number - 1) * page_size
    tasks = get_tasks_by_type_func(task_type, skip=skip, limit=page_size)

    return tasks

# --------------------------------- GET TASK BY STATUS ---------------------------------
@task_router.get("/tasks_by_status", response_model=List[TaskSchemaResponse])
async def get_task_by_status(
        status: TaskStatus,
        page_size: int = Query(10, description="Page size/maximum number of results"),
        page_number: int = Query(1, description="Page number"),
    ) -> list[TaskSchemaResponse]:
    """
    Retrieve a paginated list of tasks with the given status.

    This endpoint returns a list of tasks with pagination support.
    The tasks are sorted by their deadline in descending order.

    Args:
        status (TaskStatus): The status of tasks to retrieve.
        page_size (int): The maximum number of tasks to return per page. Defaults to 10.
        page_number (int): The page number to retrieve. Defaults to 1.

    Returns:
        List[TaskSchemaResponse]: A list of TaskSchemaResponse objects representing the tasks.
    """
    skip = (page_number - 1) * page_size
    tasks = get_tasks_by_status_func(status, skip=skip, limit=page_size)

    return tasks


# --------------------------------- DELETE TASK ---------------------------------
@task_router.delete("/delete_task")
async def delete_task(task_id: str):
    deleted_task = delete_task_func(task_id)

    if deleted_task:
        return {"message": "Task deleted successfully."}

    return {"message": "Task not found/Invalid task id."}



# --------------------------------- GET TASK BY PARTICIPANTS ---------------------------------
# @task_router.get("/tasks_by_participants", deprecated=True)
# async def get_task_by_participants(participants: TaskParticipants):
#     return {"message": f"Get tasks with participants {participants}"}

# # --------------------------------- GET TASK BY DATE CREATED ---------------------------------
# @task_router.get("/tasks_by_date", deprecated=True)
# async def get_task_by_date(date_created: str):
#     return {"message": f"Get tasks created on {date_created}"}

# # --------------------------------- GET TASK BY DEADLINE DATE ---------------------------------
# @task_router.get("/get_tasks_by_deadline", deprecated=True)
# async def get_task_by_deadline(deadline: str):
#     return {"message": f"Get tasks with deadline {deadline}"}

# # --------------------------------- EXPORT TASKS ---------------------------------
# @task_router.get("/export_tasks", deprecated=True)
# async def export_tasks(task_format: ExportFormat):
#     output: BytesIO = export_tasks_func(task_format)
    
#     if task_format == ExportFormat.CSV:
#         format = "csv"
#     elif task_format == ExportFormat.XLSX:
#         format = "xlsx"
#     else:
#         raise HTTPException(status_code=400, detail="Invalid format.")

#     return Response(
#         content=output.getvalue(),
#         media_type=f"text/{format}",
#         headers={
#             "Content-Disposition": "attachment;\
#             filename=bored_tap_tasks.{format}"
#         }
#     )
