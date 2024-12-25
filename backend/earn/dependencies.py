from datetime import datetime
from earn.schemas import StreakData, Update
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

# user reward for successful streaks
def reward_user(telegram_user_id: str, current_streak: int, daily_reward_amount: int) -> Update:
    user: dict = user_collection.find_one({'telegram_user_id': telegram_user_id})
    if user:
        daily_reward = current_streak * daily_reward_amount
        total_coins = user.get('total_coins')
        total_coins += daily_reward
    reward = Update(
        telegram_user_id=telegram_user_id,
        total_coins=total_coins
    )
    return reward



# update user coins in db
def update_coins_in_db(telegram_user_id: str, reward: Update):
    query_filter = {'telegram_user_id': telegram_user_id}
    update_operation = {'$set':
        {'total_coins': reward.total_coins}
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