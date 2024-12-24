from database_connection import user_collection
from user_reg_and_prof_mngmnt.schemas import UserProfile

# update user streak in db
def update_coins_in_db(telegram_user_id: str, coins: int):
    query_filter = {'telegram_user_id': telegram_user_id}
    update_operation = {'$set':
        {'total_coins': coins}
    }
    user_collection.update_one(query_filter, update_operation)
    return


def get_user_profile(telegram_user_id: str) -> UserProfile:
    """
    Retrieve a user by their telegram user ID.

    Args:   
        telegram_user_id (str): The telegram user ID of the user to retrieve.

    Returns:
        UserProfile: The user data if found, otherwise None.
    """
    user: dict = user_collection.find_one({"telegram_user_id": telegram_user_id})

    if user:
        user_data = UserProfile(
            telegram_user_id=user.get('telegram_user_id'),
            username=user.get('username', None),
            firstname=user.get('firstname', None),
            image_url=user.get('image_url'),
            total_coins=user.get('total_coins'),
            level=user.get('level'),
            current_streak=user.get('current_streak'),
            longest_streak=user.get('longest_streak'),
            last_action_date=user.get('last_action_date')
        )
        return user_data
    return None
