from datetime import datetime
from earn.schemas import StreakData
from database_connection import user_collection


# get current streak from db
def get_current_streak(telegram_user_id: str) -> StreakData:
    """
    Retrieves the current streak of a user from the database.

    Args:
        telegram_user_id (str): The Telegram user ID of the user.

    Returns:
        int: The current streak of the user.
    """
    user: dict = user_collection.find_one({'telegram_user_id': telegram_user_id})
    if user:
        streak = StreakData(
                current_streak=user.get("current_streak", 0),
                longest_streak=user.get("longest_streak", 0),
                last_action_date=user.get("last_action_date", None)            
            )
        return streak
    return None

# update user streak in db
def update_streak_in_db(telegram_user_id: str, streak: StreakData):
    query_filter = {'telegram_user_id': telegram_user_id}
    update_operation = {'$set':
        streak.model_dump()
    }
    user_collection.update_one(query_filter, update_operation)
    return 

def init_restart_streak(current_date: datetime, streak: StreakData):
    """
    Resets the streak of a user to its initial state.
    """
    streak.current_streak = 1      # Set current streak to 1
    streak.longest_streak = 1
    streak.last_action_date = current_date