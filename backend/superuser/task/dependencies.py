import base64
import csv
from datetime import datetime
from enum import Enum
from io import BytesIO
from bson import ObjectId
import bson
import openpyxl
from fastapi import HTTPException, UploadFile
from superuser.task.schemas import TaskSchema, TaskSchemaResponse, UpdateTask
from superuser.task.models import Task, TaskModelResponse, TaskStatus, TaskType, UpdateTask as UpdateTaskModel
from database_connection import task_collection



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
    
    # ensure it doesn't exceed 10MB of size
    max_size = 10 * 1024 * 1024
    image_size = task_image.file.tell()
    # image_size = image.size
    task_image.file.seek(0)  # reset file pointer to beginning of the file

    if image_size > max_size:
        raise HTTPException(status_code=400, detail="Image file size too large. Max file size allowed is 10MB.")

    # convert image to bytes
    image_bytes = await task_image.read()
    image_data = base64.b64encode(image_bytes).decode("utf-8")
    # image_binary = Binary(image_bytes)
    # image_binary = str(image_binary)
    return image_data


# --------------------------------- CREATE TASK ---------------------------------
def create_task(task: TaskSchema):
    created_task = Task(
        task_name=task.task_name,
        task_type=task.task_type,
        task_description=task.task_description,
        task_status=task.task_status,
        task_participants=task.task_participants,
        task_reward=task.task_reward,
        task_image=task.task_image,
        task_deadline=task.task_deadline
    )

    result = task_collection.insert_one(created_task.model_dump())

    if result.acknowledged:
        id = result.inserted_id
        response = created_task.model_dump()
        response["id"] = str(id)
        return response
    
    raise Exception("Task creation failed.")


# --------------------------------- UPDATE TASK ---------------------------------
def update_task(task: UpdateTask, task_id: str):
    updated_task = UpdateTaskModel(
        task_name=task.task_name,
        task_type=task.task_type,
        task_description=task.task_description,
        task_status=task.task_status,
        task_participants=task.task_participants,
        task_reward=task.task_reward,
        task_image=task.task_image,
        last_updated=datetime.now(),
        task_deadline=task.task_deadline
    )

    query_filter = {"_id": ObjectId(task_id)}
    update_operation = {
        "$set": {
                "task_name": updated_task.task_name,
                "task_type": updated_task.task_type,
                "task_description": updated_task.task_description,
                "task_status": updated_task.task_status,
                "task_participants": updated_task.task_participants,
                "task_reward": updated_task.task_reward,
                "task_image": updated_task.task_image,
                "last_updated": datetime.now(),
                "task_deadline": updated_task.task_deadline,
            }
    }

    result = task_collection.update_one(query_filter, update_operation, upsert=True)

    if result.upserted_id:
        return updated_task

    return updated_task


# --------------------------------- CHECK IF TASK EXISTS BY ID ---------------------------------
def check_task_by_id(task_id: str):
    task = task_collection.find_one({"_id": ObjectId(task_id)})

    if task:
        return True

    return False


# --------------------------------- GET TASKS BY ID ---------------------------------
def get_task_by_id(task_id: str) -> TaskSchema | None:
    try:
        task = task_collection.find_one({"_id": ObjectId(task_id)})
    except bson.errors.InvalidId:
        return {"message": "Invalid task id"}

    if task:
        return TaskSchema(
            task_name=task["task_name"],
            task_type=task["task_type"],
            task_description=task["task_description"],
            task_status=task["task_status"],
            task_participants=task["task_participants"],
            task_reward=task["task_reward"],
            task_image=task["task_image"],
            task_deadline=task["task_deadline"]
        )


# --------------------------------- GET ALL TASKS ---------------------------------
def get_all_tasks():
    tasks = task_collection.find()

    all_tasks: list[TaskSchemaResponse] = []

    for task in tasks:
        item = TaskSchemaResponse(
            id=str(task["_id"]),
            task_name=task["task_name"],
            task_type=task["task_type"],
            task_description=task["task_description"],
            task_status=task["task_status"],
            task_participants=task["task_participants"],
            task_reward=task["task_reward"],
            task_image=task["task_image"],
            task_deadline=task["task_deadline"]
        )

        all_tasks.append(item)

    return all_tasks


# --------------------------------- GET TASKS BY TYPE ---------------------------------
def get_tasks_by_type(task_type: TaskType):
    tasks = task_collection.find({"task_type": task_type})

    all_tasks: list[TaskSchemaResponse] = []

    for task in tasks:
        item = TaskSchemaResponse(
            id=str(task["_id"]),
            task_name=task["task_name"],
            task_type=task["task_type"],
            task_description=task["task_description"],
            task_status=task["task_status"],
            task_participants=task["task_participants"],
            task_reward=task["task_reward"],
            task_image=task["task_image"],
            task_deadline=task["task_deadline"]
        )

        all_tasks.append(item)

    return all_tasks


# --------------------------------- GET TASKS BY STATUS ---------------------------------
def get_tasks_by_status(task_status: TaskStatus):
    tasks = task_collection.find({"task_status": task_status})

    all_tasks: list[TaskSchemaResponse] = []

    for task in tasks:
        item = TaskSchemaResponse(
            id=str(task["_id"]),
            task_name=task["task_name"],
            task_type=task["task_type"],
            task_description=task["task_description"],
            task_status=task["task_status"],
            task_participants=task["task_participants"],
            task_reward=task["task_reward"],
            task_image=task["task_image"],
            task_deadline=task["task_deadline"]
        )

        all_tasks.append(item)

    return all_tasks


# ------------------------------------- EXPORT TASKS -------------------------------------
# export to csv
def export_to_csv(tasks: list[TaskModelResponse]):
    output = BytesIO()
    fieldnames = TaskModelResponse.model_fields()  # Get the field names from the model fields
    writer = csv.DictWriter(output, fieldnames=fieldnames)

    writer.writeheader()
    for task in tasks:
        task_dict = task.model_dump()

        # Handle Enum values:
        for key, value in task_dict.items():
            if isinstance(value, Enum):  # Convert Enum to value
                task_dict[key] = value.value
            if isinstance(value, list): # Convert List of Enum to value
                task_dict[key] = [item.value if isinstance(item, Enum) else item for item in value]

        writer.writerow(task_dict)
    
    output.seek(0)
    return output

# export to excel
def export_to_excel(tasks: list[TaskModelResponse]):
    output = BytesIO()
    workbook = openpyxl.Workbook()
    sheet = workbook.active

    # header row
    fieldnames = [key for key in TaskModelResponse.model_fields.keys()]  # Get the field names from the model fields
    sheet.append(fieldnames)

    for task in tasks:
        task_dict = task.model_dump()

        # Handle Enum values:
        for key, value in task_dict.items():
            if isinstance(value, Enum):  # Convert Enum to value
                task_dict[key] = value.value
            if isinstance(value, list): # Convert List of Enum to value
                task_dict[key] = [item.value if isinstance(item, Enum) else item for item in value]

        sheet.append(list(task_dict.values()))  # append data as a row

    workbook.save(output)
    output.seek(0)

    return output

def export_tasks(format: str = "xlsx") -> BytesIO:
    tasks = task_collection.find()

    all_tasks: list[TaskModelResponse] = []

    for task in tasks:
        item = TaskModelResponse(
            _id=str(task["_id"]),
            task_name=task["task_name"],
            task_type=task["task_type"],
            task_description=task["task_description"],
            task_status=task["task_status"],
            task_participants=task["task_participants"],
            task_reward=task["task_reward"],
            task_image=task["task_image"],
            created_at=task["created_at"],
            last_updated=task["last_updated"],
            task_deadline=task["task_deadline"]
        )

        all_tasks.append(item)
    
    if format == "csv":
        output: BytesIO = export_to_csv(all_tasks)

        return output

    if format == "xlsx":
        output: BytesIO = export_to_excel(all_tasks)

        return output

    # default to return xlsx
    output: BytesIO = export_to_excel(all_tasks)

    return output


# --------------------------------- DELETE TASK ---------------------------------
def delete_task(task_id: str) -> bool:
    result = task_collection.delete_one({"_id": ObjectId(task_id)})

    if result.deleted_count == 1:
        return True

    return False 
