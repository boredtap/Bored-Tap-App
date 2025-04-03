from database_connection import task_collection, user_collection
from tasks.schemas import MyTasks


# ------------------------------------------ GET USER ------------------------------------------
def get_user(telegram_user_id: str):
    user = user_collection.find_one({"telegram_user_id": telegram_user_id})

    return user


# ------------------------------------------ GET MY TASKS BY TASK TYPE ------------------------------------------
def my_tasks_by_type(telegram_user_id: str, task_type: str, skip: int = 0, limit: int = 10) -> list[MyTasks]:
    user: dict = get_user(telegram_user_id=telegram_user_id)
    current_level: str = user.get("level_name").lower()

    tasks = task_collection.find({"task_type": task_type, "task_participants": {"$in": ["all_users", current_level]}}).sort('task_deadline', -1).skip(skip).limit(limit)

    my_tasks: list[MyTasks] = []

    for task in tasks:
        my_tasks.append(
            MyTasks(
                task_id=str(task.get("_id", None)),
                task_name=task.get("task_name", None),
                task_reward=task.get("task_reward", None),
                task_image_id=task.get("task_image_id", None),
                task_description=task.get("task_description", None),
                task_url=task.get("task_url", None),
                task_participants=task.get("task_participants", None),
                task_deadline=task.get("task_deadline", None)
            )
        )

    return my_tasks


# ------------------------------------------ GET MY COMPLETED TASKS ------------------------------------------
def my_completed_tasks(telegram_user_id: str) -> list[MyTasks]:
    user: dict = get_user(telegram_user_id=telegram_user_id)
    current_level: str = user.get("level_name").lower()

    # get all tasks completed by current_user
    pipeline = [
        {
            '$match': {
                'task_participants': {
                    '$in': [
                        'all_users',
                        current_level
                    ]
                },
                'completed_users': {
                    '$in': [
                        telegram_user_id
                    ]
                }
            }
        }
    ]


    tasks = task_collection.aggregate(pipeline)

    my_tasks: list[MyTasks] = []

    for task in tasks:
        my_tasks.append(
            MyTasks(
                task_id=task["_id"],
                task_name=task["task_name"],
                task_reward=task["task_reward"],
                task_image=task.get("task_image", None),
                task_description=task.get("task_description", None),
                task_deadline=task.get("task_deadline", None)
            )
        )

    return my_tasks