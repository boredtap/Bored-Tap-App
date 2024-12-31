from database_connection import user_collection
from user_reg_and_prof_mngmnt.schemas import Update, UserProfile


user_levels = {
    # level: coins
    1: 0,
    2: 5000,
    3: 25000,
    4: 100000,
    5: 500000,
    6: 1000000,
    7: 20000000,
    8: 100000000,
    9: 500000000,
    10: 1000000000
}
referral_url_prefix = "https://t.me/Bored_Tap_Bot?start="


# update user coins in db
def update_coins_in_db(telegram_user_id: str, coins: int):
    # update coins
    query = {'telegram_user_id': telegram_user_id}
    coin_update_operation = {'$inc':
        {'total_coins': coins}
    }
    my_result = user_collection.update_one(query, coin_update_operation)

    if my_result.modified_count == 1:
        my_result = True
    else:
        my_result = False


    # update level
    new_level = update_level_logic(telegram_user_id)

    level_update_operation = {'$set':
        {'level': new_level['level']}
    }
    level_update_result = user_collection.update_one(query, level_update_operation)

    if level_update_result.modified_count == 1:
        level_update_result = True
    else:
        level_update_result = False

    return {
        'my_result': my_result,
        'level_update_result': level_update_result
    }

# # update level in db
# def update_level_in_db(telegram_user_id: str, update: Update):
#     query_filter = {'telegram_user_id': telegram_user_id}
#     coin_update_operation = {'$set':
#         {'level': update.level}
#     }
#     user_collection.update_one(query_filter, coin_update_operation)
#     return

def get_user_by_id(telegram_user_id: str) -> Update:
    """
    Retrieve a user by their telegram user ID.

    Args:
        telegram_user_id (str): The telegram user ID of the user to retrieve.

    Returns:
        UpdateCoins]: The user data if found, otherwise None.
    """
    user: dict = user_collection.find_one({"telegram_user_id": telegram_user_id})

    if user:
        user_data = Update(
            telegram_user_id=user.get("telegram_user_id", None),
            total_coins=user.get("total_coins", None),
            level=user.get("level", None)
        )
        return user_data
    return None

def update_level_logic(telegram_user_id: str):
    user = get_user_by_id(telegram_user_id)
    current_level = user.level
    current_coins = user.total_coins

    for level, required_coins in sorted(user_levels.items()):
        if level != 10:
            next_level = level + 1
            # get user level from their accumulated coins
            if required_coins <= current_coins < user_levels[next_level]:
                level_from_table = level
                break
    
    # update level if current level is less than the level from the table
    if current_level < level_from_table:
        new_level = level_from_table
    else:
        new_level = current_level

    return {
        "level": new_level,
        "required Coins": required_coins,
        "current Coins": current_coins
    }


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
            referral_url=referral_url_prefix + telegram_user_id,
            streak=user.get('streak'),
            invite=user.get('invite')
        )
        return user_data
    return None
