from database_connection import fs
from datetime import date, datetime
from io import BytesIO
from bson import ObjectId
from fastapi.responses import StreamingResponse
from models import CoinStats
from database_connection import user_collection, invites_ref, coin_stats
from user_reg_and_prof_mngmnt.schemas import InviteeData, Update, UserProfile


user_levels: dict[int, list] = {
    # level: [coins, level name]
    1: [0, "Novice"],
    2: [5000, "Explorer"],
    3: [25000, "Apprentice"],
    4: [100000, "Warrior"],
    5: [500000, "Master"],
    6: [1000000, "Champion"],
    7: [20000000, "Tactician"],
    8: [100000000, "Specialist"],
    9: [500000000, "Conqueror"],
    10:[1000000000, "Legend"]
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
    level_update_operation = {
        '$set': {
            'level': new_level['level'],
            'level_name': new_level['level_name']
        }
    }

    level_update_result = user_collection.update_one(query, level_update_operation)

    if level_update_result.modified_count:
        level_update_result = True
    else:
        level_update_result = False
    
    # update coin stats in db
    coin_stats_result = update_coin_stats(telegram_user_id, coins)
    print(coin_stats_result)

    return {
        'my_result': my_result,
        'level_update_result': level_update_result
    }


# update auto_bot_active status
def update_auto_bot_active_status(telegram_user_id: str, auto_bot_active: bool):
    query = {'telegram_user_id': telegram_user_id}
    update_operation = {'$set': {'auto_bot_active': auto_bot_active}}

    my_result = user_collection.update_one(query, update_operation)

    if my_result.modified_count == 1:
        my_result = True
    else:
        my_result = False

    return my_result


# update power limit, last active time and autobot active status
def update_power_limit_last_active_time_autobot(
        telegram_user_id: str,
        power_limit: int,
        last_active_time: datetime,
        auto_bot_active: bool = False):
    query = {'telegram_user_id': telegram_user_id}
    power_limit_update_operation = {'$set':
        {
            'power_limit': power_limit,
            'last_active_time': last_active_time,
            'auto_bot_active': auto_bot_active
        }
    }
    my_result = user_collection.update_one(query, power_limit_update_operation)

    if my_result.modified_count == 1:
        my_result = True
    else:
        my_result = False

    return my_result


# update coins, power limit, last active time and autobot active status at once
def update_coins_power_limit_last_active_time_autobot(
        telegram_user_id: str,
        coins: int,
        power_limit: int,
        last_active_time: datetime,
        auto_bot_active: bool = False
    ):
    query = {'telegram_user_id': telegram_user_id}
    update_operation = {
        '$set': {
                'power_limit': power_limit,
                'last_active_time': last_active_time,
                'auto_bot_active': auto_bot_active
            },
        '$inc': {
            'total_coins': coins
        }
    }
    my_result = user_collection.update_one(query, update_operation)

    if my_result.modified_count == 1:
        my_result = True
    else:
        my_result = False

    # update level
    new_level = update_level_logic(telegram_user_id)
    level_update_operation = {
        '$set': {
            'level': new_level['level'],
            'level_name': new_level['level_name']
        }
    }
    level_update_result = user_collection.update_one(query, level_update_operation)

    if level_update_result.modified_count:
        level_update_result = True
    else:
        level_update_result = False
    
    # update coin stats in db
    coin_stats_result = update_coin_stats(telegram_user_id, coins)
    print(coin_stats_result)

    return {
        'coin update': my_result,
        'power limit update': my_result,
        'last active time update': my_result,
        'auto bot active update': my_result,
        'level': new_level['level'],
        'level_name': new_level['level_name']
    }


def update_coin_stats(telegram_user_id: str, coins_tapped:int):
    # today's date
    today = date.today()

    # get current user coin stat
    user_query = {'telegram_user_id': telegram_user_id}
    user_stats = coin_stats.find_one(user_query)
    # print(user_stats)

    if user_stats:
        # user_stats['date'][str(today)]
        # update coins
        coin_update_operation = {'$inc':
            {'date.' + str(today): coins_tapped},
        }

        my_result = coin_stats.update_one(user_query, coin_update_operation, upsert=True)
        if my_result.modified_count == 1:
            my_result = {'status': True, 'message': 'Coin statistics updated successfully'}
        else:
            my_result = {'status': False, 'message': 'Failed to update coin statistics'}
        return my_result

    # create new user coin stat
    new_user_stats = CoinStats(
        telegram_user_id=telegram_user_id,
        date={str(today): coins_tapped}
    )
    my_result = coin_stats.insert_one(new_user_stats.model_dump())

    if my_result.inserted_id:
        my_result = {'status': True, 'message': 'Coin statistics updated successfully'}
    else:
        my_result = {'status': False, 'message': 'Failed to update coin'}

    return my_result


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
            level=user.get("level", None),
            level_name=user.get("level_name", None)
        )
        return user_data
    return None


def update_level_logic(telegram_user_id: str):
    user = get_user_by_id(telegram_user_id)
    current_level = user.level
    current_coins = user.total_coins

    level_from_table = current_level
    level_name = user.level_name
    for level, required_coins in sorted(user_levels.items()):
        if level != 10:
            next_level = level + 1
            # get user level from their accumulated coins
            if required_coins[0] <= current_coins < user_levels[next_level][0]:
                level_from_table = level
                level_name = required_coins[1]
                break
    
    # update level if current level is less than the level from the table
    if current_level < level_from_table:
        new_level = level_from_table
    else:
        new_level = current_level

    return {
        "level": new_level,
        "level_name": level_name,
        "required Coins": user_levels[level_from_table][0],
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
    user_invitees_ref = invites_ref.find_one({'inviter_telegram_id': telegram_user_id})
    
    if user:
        # get invitees data
        invitees: list[InviteeData] = []
        if user_invitees_ref:
            invitees_ref: list[str] = user_invitees_ref["invitees"]

            for id in invitees_ref:
                invitee = user_collection.find_one({"telegram_user_id": id})
                if invitee:
                    invitee_data = InviteeData(
                        username=invitee.get("username"),
                        level=invitee.get("level"),
                        total_coins=invitee.get("total_coins")
                    )
                    invitees.append(invitee_data)

        user_data = UserProfile(
            id=str(user.get('_id')),
            telegram_user_id=user.get('telegram_user_id'),
            username=user.get('username', None),
            firstname=user.get('firstname', None),
            image_url=user.get('image_url'),
            total_coins=user.get('total_coins'),
            power_limit=user.get('power_limit'),
            last_active_time=user.get('last_active_time'),
            auto_bot_active=user.get('auto_bot_active'),
            level=user.get('level'),
            level_name=user.get('level_name'),
            referral_url=referral_url_prefix + telegram_user_id,
            is_active=user.get('is_active'),
            streak=user.get('streak'),
            invite=invitees,
            clan=user.get('clan'),
        )
        return user_data
    return None


# update user photo_url
def update_photo_url(telegram_user_id: str, photo_url: str):
    user_query = {"telegram_user_id": telegram_user_id}
    update_operation = {"$set": {"image_url": photo_url}}

    my_result = user_collection.update_one(user_query, update_operation)

    if my_result.modified_count > 0:
        return {"status": True, "message": "Photo URL updated successfully"}
    else:
        return {"status": False, "message": "Failed to update photo URL"}


def get_image(image_id: str):
    image = fs.get(ObjectId(image_id))
    image_buffer = BytesIO(image.read())
    image_buffer.seek(0)

    return StreamingResponse(image_buffer, media_type="image/jpeg")


# Function to convert datetime objects in a dictionary or list to ISO format strings
def datetime_to_iso_str(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} is not JSON serializable")


