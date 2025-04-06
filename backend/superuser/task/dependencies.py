import csv
from datetime import datetime, timezone
from enum import Enum
from io import BytesIO
from bson import ObjectId
import bson
import openpyxl
from urlextract import URLExtract
from fastapi import HTTPException, UploadFile
from superuser.task.schemas import TaskSchema, TaskSchemaResponse, UpdateTask
from superuser.task.models import Task, TaskModelResponse, TaskStatus, TaskType, UpdateTask as UpdateTaskModel
from database_connection import task_collection, fs



# --------------------------------- CHECK IF TASK ALREADY EXISTS IN DB ---------------------------------
def task_exists_in_db(task_name: str):
    task = task_collection.find_one({"task_name": task_name})

    if task:
        return True

    return False


# --------------------------------- VALIDATE IMAGE --------------------------------- 
async def validate_image(task_image: UploadFile):
    # check file type to only allow image file uploads of max_size 10MB
    # check if file is an image
    if not task_image.content_type.startswith("image"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only images are allowed.")
    
    # ensure it doesn't exceed 3MB of size
    max_size = 3 * 1024 * 1024
    image_name = task_image.filename
    image_size = task_image.file.tell()
    task_image.file.seek(0)  # reset file pointer to beginning of the file

    if image_size > max_size:
        raise HTTPException(status_code=400, detail="Image file size too large. Max file size allowed is 3MB.")

    # convert image to bytes and add to fs
    image_bytes = await task_image.read()

    inserted_id = fs.put(image_bytes, filename="task_" + image_name)

    return str(inserted_id)


def validate_task_deadline(deadline: datetime):
    """
    Converts the given deadline datetime to UTC timezone and ensures it's a future date from the current date.

    Args:
        deadline (datetime): The task deadline to validate.

    Returns:
        datetime: The validated deadline datetime in UTC timezone.

    Raises:
        HTTPException: If the deadline is not a future date from the current date.
    """
    # convert deadline timezone to utc and ensure it's greater than current time
    today = datetime.now(timezone.utc)
    if deadline.tzinfo:
        deadline = deadline.astimezone(timezone.utc)
    else:
        deadline = deadline.replace(tzinfo=timezone.utc)

    deadline = deadline.replace(hour=today.hour, minute=today.minute, second=today.second, microsecond=today.microsecond, tzinfo=timezone.utc)
    if deadline.date() <= today.date():
        raise HTTPException(status_code=400, detail="task deadline date has to be a future date/time.")

    return deadline


def validate_task_update_deadline(deadline: datetime):
    """
    Converts the given deadline datetime to UTC timezone and ensures it's a future date from the current date.

    Args:
        deadline (datetime): The task deadline to validate.

    Returns:
        datetime: The validated deadline datetime in UTC timezone.

    Raises:
        HTTPException: If the deadline is not a future date from the current date.
    """
    # convert deadline timezone to utc and ensure it's greater than current time
    today = datetime.now(timezone.utc)
    if deadline.tzinfo:
        deadline = deadline.astimezone(timezone.utc)
    else:
        deadline = deadline.replace(tzinfo=timezone.utc)

    deadline = deadline.replace(hour=today.hour, minute=today.minute, second=today.second, microsecond=today.microsecond, tzinfo=timezone.utc)
    if deadline < today:
        raise HTTPException(status_code=400, detail="task deadline date has to be a future date/time.")

    return deadline


def extract_url_from_description(description: str):
    """
    Extracts the first URL from a given description string.

    Args:
        description (str): The input string containing the description.

    Returns:
        str | None: The first URL found in the description, or None if no URL is found.
    """

    extractor = URLExtract()

    urls = extractor.find_urls(description)
    url = urls[0] if urls else None

    return url



# --------------------------------- CREATE TASK ---------------------------------
def create_task(task: TaskSchema):
    created_task = Task(
        task_name=task.task_name,
        task_type=task.task_type,
        task_description=task.task_description,
        task_url=task.task_url,
        task_status=task.task_status,
        task_participants=task.task_participants,
        task_reward=task.task_reward,
        task_image_id=task.task_image_id,
        task_deadline=task.task_deadline
    )

    result = task_collection.insert_one(created_task.model_dump())

    if result.acknowledged:
        id = result.inserted_id
        response = created_task.model_dump()
        response["id"] = str(id)
        return response
    
    # delete inserted id
    fs.delete(ObjectId(task.task_image_id))

    raise HTTPException(status_code=400, detail="Task creation failed.")


# --------------------------------- UPDATE TASK ---------------------------------
def update_task(task: UpdateTaskModel, task_id: str):
    task_to_update = task_collection.find_one({"_id": ObjectId(task_id)})

    # delete old image if a new image is provided
    if task_to_update and task.task_image_id != None:
        old_img_id = task_to_update["task_image_id"]

        fs.delete(ObjectId(old_img_id))

    query_filter = {"_id": ObjectId(task_id)}
    update_operation_with_new_img = {
        "$set": {
                "task_name": task.task_name,
                "task_type": task.task_type,
                "task_description": task.task_description,
                "task_url": task.task_url,
                "task_status": task.task_status,
                "task_participants": task.task_participants,
                "task_reward": task.task_reward,
                "task_image_id": task.task_image_id,
                "last_updated": datetime.now(timezone.utc),
                "task_deadline": task.task_deadline,
            }
    }

    update_operation_wout_new_img = {
        "$set": {
                "task_name": task.task_name,
                "task_type": task.task_type,
                "task_description": task.task_description,
                "task_status": task.task_status,
                "task_participants": task.task_participants,
                "task_reward": task.task_reward,
                "last_updated": datetime.now(timezone.utc),
                "task_deadline": task.task_deadline,
            }
    }

    update_operation = update_operation_with_new_img if task.task_image_id else update_operation_wout_new_img
    result = task_collection.update_one(query_filter, update_operation, upsert=True)

    if result.modified_count == 1:
        return task

    raise HTTPException(status_code=400, detail="Task update failed.")


# --------------------------------- CHECK IF TASK EXISTS BY ID ---------------------------------
def check_task_by_id(task_id: str):
    task = task_collection.find_one({"_id": ObjectId(task_id)})

    if task:
        return True

    return False


# --------------------------------- GET TASKS BY ID ---------------------------------
def get_task_by_id(task_id: str) -> TaskSchema | None:
    task = task_collection.find_one({"_id": ObjectId(task_id)})

    if task:
        return TaskSchema(
            task_name=task["task_name"],
            task_type=task["task_type"],
            task_description=task["task_description"],
            task_url=task["task_url"],
            task_status=task["task_status"],
            task_participants=task["task_participants"],
            task_reward=task["task_reward"],
            task_image_id=task["task_image_id"],
            task_deadline=task["task_deadline"]
        )

    return None


# --------------------------------- GET ALL TASKS ---------------------------------
def get_all_tasks(skip: int = 0, limit: int = 10):
    """
    Retrieves all tasks from the database, sorted by deadline in descending order.
    Tasks are paginated with the given skip and limit parameters.

    Args:
        skip (int): Number of tasks to skip. Defaults to 0.
        limit (int): Maximum number of tasks to return. Defaults to 10.

    Returns:
        list[TaskSchemaResponse]: List of tasks, each as a TaskSchemaResponse object.
    """
    tasks = task_collection.find().sort("task_deadline", -1).skip(skip).limit(limit)

    all_tasks: list[TaskSchemaResponse] = []

    for task in tasks:
        item = TaskSchemaResponse(
            id=str(task["_id"]),
            task_name=task["task_name"],
            task_type=task["task_type"],
            task_description=task["task_description"],
            task_url=task["task_url"],
            task_status=task["task_status"],
            task_participants=task["task_participants"],
            task_reward=task["task_reward"],
            task_image_id=task["task_image_id"],
            task_deadline=task["task_deadline"]
        )

        all_tasks.append(item)

    return all_tasks


# --------------------------------- GET TASKS BY TYPE ---------------------------------
def get_tasks_by_type(task_type: TaskType, skip: int = 0, limit: int = 10):
    """
    Retrieves all tasks of a given type from the database, sorted by deadline in descending order.
    Tasks are paginated with the given skip and limit parameters.

    Args:
        task_type (TaskType): Type of task to retrieve.
        skip (int): Number of tasks to skip. Defaults to 0.
        limit (int): Maximum number of tasks to return. Defaults to 10.

    Returns:
        list[TaskSchemaResponse]: List of tasks, each as a TaskSchemaResponse object.
    """
    tasks = task_collection.find({"task_type": task_type}).sort("task_deadline", -1).skip(skip).limit(limit)

    all_tasks: list[TaskSchemaResponse] = []

    for task in tasks:
        item = TaskSchemaResponse(
            id=str(task["_id"]),
            task_name=task["task_name"],
            task_type=task["task_type"],
            task_description=task["task_description"],
            task_url=task["task_url"],
            task_status=task["task_status"],
            task_participants=task["task_participants"],
            task_reward=task["task_reward"],
            task_image=task["task_image"],
            task_deadline=task["task_deadline"]
        )

        all_tasks.append(item)

    return all_tasks


# --------------------------------- GET TASKS BY STATUS ---------------------------------
def get_tasks_by_status(task_status: TaskStatus, skip: int = 0, limit: int = 10):
    """
    Retrieves all tasks of a given status from the database, sorted by deadline in descending order.
    Tasks are paginated with the given skip and limit parameters.

    Args:
        task_status (TaskStatus): Status of task to retrieve.
        skip (int): Number of tasks to skip. Defaults to 0.
        limit (int): Maximum number of tasks to return. Defaults to 10.

    Returns:
        list[TaskSchemaResponse]: List of tasks, each as a TaskSchemaResponse object.
    """
    tasks = task_collection.find({"task_status": task_status}).sort("task_deadline", -1).skip(skip).limit(limit)

    all_tasks: list[TaskSchemaResponse] = []

    for task in tasks:
        item = TaskSchemaResponse(
            id=str(task["_id"]),
            task_name=task["task_name"],
            task_type=task["task_type"],
            task_description=task["task_description"],
            task_url=task["task_url"],
            task_status=task["task_status"],
            task_participants=task["task_participants"],
            task_reward=task["task_reward"],
            task_image=task["task_image"],
            task_deadline=task["task_deadline"]
        )

        all_tasks.append(item)

    return all_tasks


# --------------------------------- DELETE TASK ---------------------------------
def delete_task(task_id: str) -> bool:
    task = task_collection.find_one({"_id": ObjectId(task_id)})

    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    
    # delete image
    task_img_id = task["task_image_id"]
    if task_img_id != None:
        fs.delete(ObjectId(task_img_id))

    # delete task
    result = task_collection.delete_one({"_id": ObjectId(task_id)})

    if result.deleted_count == 1:
        return True

    return False 


# --------------------------------- UPDATE EXPIRED TASK STATUS ---------------------------------
def update_status_of_expired_tasks():
    tasks = task_collection.find({"task_deadline": {"$lt": datetime.now(timezone.utc)}})

    for task in tasks:
        task_collection.update_one(
            {"_id": ObjectId(task["_id"])}, 
            {
                "$set": {"task_status": "inactive"}
            }
        )