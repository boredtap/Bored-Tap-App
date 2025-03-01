from database_connection import user_collection, task_collection, coin_stats, invites_ref
from superuser.user_mgt.router import delete_user
from superuser.user_mgt.schemas import OverallAchievement, TodayAchievement, UserMgtDashboard, UserProfile
from superuser.leaderboard.dependencies import all_time_achievement, daily_achievement

# ------------------------------- ALL USERS --------------------------------
def get_all_users():
    users = user_collection.find({})

    for user in users:
        if user["is_active"] == True:
            status = "active"
        else:
            status = "suspended"

        user_data = UserMgtDashboard(
            telegram_user_id=str(user["telegram_user_id"]),
            username=user["username"],
            level=user["level"],
            level_name=user["level_name"],
            coins_earned=user["total_coins"],
            invite_count=len(user["invite"]),
            registration_date=user["created_at"],
            status=status
        )
        yield user_data


# ----------------------------- USER COMPLETED TASKS --------------------------------
def completed_tasks(telegram_user_id: str, user:dict) -> int:
    current_level: str = user.get("level_name").lower()

    # get all tasks completed by user
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
    my_tasks = 0

    for task in tasks:
        my_tasks += 1

    return my_tasks


# --------------------------- USER PROFILE -------------------------------
def get_user_profile(telegram_user_id: str):
    user: dict = user_collection.find_one({"telegram_user_id": telegram_user_id})
    completedTasks = completed_tasks(telegram_user_id, user)
    user_daily_achievement = daily_achievement(telegram_user_id)
    user_overall_achievement = all_time_achievement(telegram_user_id)

    overall_achieveiment = OverallAchievement(
        total_coins=user["total_coins"],
        completed_tasks=completedTasks,
        longest_streak=user["streak"]["longest_streak"],
        rank=user_overall_achievement["rank"],
        invitees=len(user["invite"])
    )

    today_achievement = TodayAchievement(
        total_coins=user["total_coins"],
        completed_tasks=completedTasks,
        current_streak=user["streak"]["current_streak"],
        rank=user_daily_achievement.get("rank", '0'),
        invitees=len(user["invite"])
    )

    if user:
        profile = UserProfile(
            telegram_user_id=str(user["telegram_user_id"]),
            username=user["username"],
            level=user["level"],
            level_name=user["level_name"],
            image_url=user["image_url"],
            overall_achievement=overall_achieveiment,
            today_achievement=today_achievement,
            # wallet_address=...,
            # clan=user["clan"],
            created_at=user["created_at"]
        )
    
        return profile


# --------------------------- DELETE ONE USER ------------------------------- #
def delete_one_user(telegram_user_id: str):
    delete_coin_stats = coin_stats.delete_many({"telegram_user_id": telegram_user_id})
    # delete_user_invites = invites_ref.delete_many({"telegram_user_id": telegram_user_id})
    deleted_user = user_collection.delete_one({"telegram_user_id": telegram_user_id})

    if deleted_user.deleted_count > 0 and delete_coin_stats.deleted_count > 0:
        return {"message": "User deleted successfully."}
    else:
        return {"message": "User not found."}


# --------------------------- DELETE MANY USERS ------------------------------- #
def delete_many_users(telegram_user_ids: list[str]):
    delete_coin_stats = coin_stats.delete_many({"telegram_user_id": {"$in": telegram_user_ids}})
    # delete_user_invites = invites_ref.delete_many({"telegram_user_id": {"$in": telegram_user_ids}})
    deleted_users = user_collection.delete_many({"telegram_user_id": {"$in": telegram_user_ids}})

    if deleted_users.deleted_count > 0 and delete_coin_stats.deleted_count > 0:
        return {"message": "Users deleted successfully."}
    else:
        return {"message": "Users not found."}
