from datetime import datetime, timedelta
from earn.schemas import StreakData, Update
from database_connection import user_collection
from user_reg_and_prof_mngmnt.schemas import UserProfile


# get current streak from db
def get_current_streak(telegram_user_id: str) -> StreakData:
    """
    Retrieves the current streak of a user from the database.

    Args:
        telegram_user_id (str): The Telegram user ID of the user.

    Returns:
        int: The current streak of the user.
    """
    user: UserProfile = user_collection.find_one({'telegram_user_id': telegram_user_id})

    if user:
        streak = StreakData(
                current_streak=user['streak']["current_streak"],
                longest_streak=user['streak']["longest_streak"],
                last_action_date=user['streak']["last_action_date"]            
            )
        return streak
    return None

# initialize user streak
def init_streak(telegram_user_id: str, init_streak: StreakData, daily_reward_amount: int):
    """
    Resets the streak of a user to its initial state.
    """
    query = {'telegram_user_id': telegram_user_id}
    update_operation = {
        '$set': {'streak': init_streak.model_dump()},
        '$inc': {'total_coins': daily_reward_amount}
        }
    user_collection.update_one(query, update_operation)
    return


def calculate_time_difference(current_date: datetime, last_action_date: datetime):
    """
    Calculate the time difference between two datetime objects in hours.
    Args:
        current_date (datetime): The current date and time.
        last_action_date (datetime): The date and time of the last action.
    Returns:
        timedelta: A timedelta object representing the difference in hours.
    """

    past_hours = current_date - last_action_date
    past_hours = past_hours.total_seconds() / 3600
    return timedelta(hours=int(past_hours))


# update user streak and coin in db
def increment_streak_and_coin(telegram_user_id: str, daily_reward_amount: int,
                        new_streak: StreakData):
    query_filter = {'telegram_user_id': telegram_user_id}
    update_operation = {
        '$set': {'streak': new_streak.model_dump()},
        '$inc': {'total_coins': daily_reward_amount},
    }
    user_collection.update_one(query_filter, update_operation)
    return

def broken_streak_reset(telegram_user_id: str, reset_streak: StreakData, daily_reward_amount: int):
    query_filter = {'telegram_user_id': telegram_user_id}
    update_operation = {
        '$set': {'streak': reset_streak.model_dump()},
        '$inc': {'total_coins': daily_reward_amount},
    }
    user_collection.update_one(query_filter, update_operation)
    return

