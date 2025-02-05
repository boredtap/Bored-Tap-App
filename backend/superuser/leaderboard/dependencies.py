from datetime import datetime, timedelta

import telegram
from database_connection import user_collection, coin_stats
from superuser.leaderboard.schemas import Clan, LeaderBoard, LeaderBoardUserProfile, OverallAchievement, TodayAchievement



def process_result_from_aggregation(result):
    for rank, data in enumerate(result):
        response = LeaderBoard(
            telegram_user_id=data["telegram_user_id"],
            rank= f"#{rank+1}",
            username=data["username"],
            level=data["level"],
            level_name=data["level_name"],
            coins_earned=data["total_coins"],
            clan="clan",
            longest_streak=data["longest_streak"]
        )

        yield response


# --------------------------- ALL TIME LEADERBOARD --------------------------------
def all_time_leaderboard():
    # aggregation to get leaderboard data
    all_time_pipeline = [
        {
            '$sort': {
                'total_coins': -1
            }
        }, {
            '$lookup': {
                "from": "users",
                "localField": "telegram_user_id",
                "foreignField": "telegram_user_id",
                "as": "user_info"
            }
        }, {
            '$unwind': '$user_info'
        }, {
            '$project': {
                'telegram_user_id': 1,
                'username': 1,
                'level': "$user_info.level",
                'level_name': "$user_info.level_name",
                'total_coins': 1,
                # 'clan': "$user_info.clan",
                'longest_streak': "$user_info.streak.longest_streak",
                'image_url': 1,
                'telegram_user_id': 1,
                '_id': 0
            }
        }
    ]

    leaderboard_data_cursor = user_collection.aggregate(all_time_pipeline)

    return process_result_from_aggregation(leaderboard_data_cursor)


# --------------------------- DAILY LEADERBOARD --------------------------------
def daily_leaderboard():
    today_date = datetime.now().strftime("%Y-%m-%d")

    # aggregation to get daily leaderboard data
    pipeline = [
        {
            "$project": {  # Create a new field 'total_coins'
                "telegram_user_id": 1,
                "total_coins": {
                    "$ifNull": [f"$date.{today_date}", 0]    # Get the coins for the date or 0 if not present
                }
            }
        }, {
            "$match": {  # Filter out documents where the date is not present
                "total_coins": {"$gt": 0}
            }
        }, {
            "$sort": {"total_coins": -1}  # Sort by coins (descending)
        }, {
            "$lookup": {
                "from": "users",
                "localField": "telegram_user_id",
                "foreignField": "telegram_user_id",
                "as": "user_info"
            }
        }, {
            "$unwind": "$user_info"
        }, {
            '$project': {
                'username': "$user_info.username",
                'level': "$user_info.level",
                'level_name': "$user_info.level_name",
                'total_coins': 1,
                # 'clan': "$user_info.clan",
                'longest_streak': "$user_info.streak.longest_streak",
                'image_url': "$user_info.image_url",
                'telegram_user_id': 1,
                '_id': 0
            }
        }

    ]

    leaderboard_data_cursor = coin_stats.aggregate(pipeline)

    return process_result_from_aggregation(leaderboard_data_cursor)


# --------------------------- WEEKLY LEADERBOARD --------------------------------
def weekly_leaderboard():
    # today = datetime.now()
    # week_start = today - timedelta(days=today.weekday())
    # week_end = week_start + timedelta(days=7)


    # aggregation to get weekly leaderboard data
    pipeline = [
        {
            '$project': {
                'telegram_user_id': 1, 
                'date_array': {
                    '$objectToArray': '$date'
                }
            }
        }, {
            '$unwind': '$date_array'
        }, {
            '$addFields': {
                'date_obj': {
                    '$dateFromString': {
                        'dateString': '$date_array.k', 
                        'format': '%Y-%m-%d'
                    }
                }
            }
        }, {
            '$addFields': {
                'year': {
                    '$year': '$date_obj'
                }, 
                'week': {
                    '$isoWeek': '$date_obj'
                }
            }
        }, {
            '$group': {
                '_id': {
                    'telegram_user_id': '$telegram_user_id', 
                    'year': '$year', 
                    'week': '$week'
                }, 
                'max_coins': {
                    '$max': '$date_array.v'
                }
            }
        }, {
            '$group': {
                '_id': '$_id.telegram_user_id', 
                'total_coins': {
                    '$max': '$max_coins'
                }
            }
        }, {
            '$sort': {
                'total_coins': -1
            }
        }, {
            "$lookup": {
                "from": "users",
                "localField": "_id",
                "foreignField": "telegram_user_id",
                "as": "user_info"
            }
        }, {
            "$unwind": "$user_info"
        }, {
            '$project': {
                'telegram_user_id': '$user_info.telegram_user_id',
                'username': "$user_info.username",
                'level': "$user_info.level",
                'level_name': "$user_info.level_name",
                'total_coins': 1,
                # 'clan': "$user_info.clan",
                'longest_streak': "$user_info.streak.longest_streak",
                'image_url': "$user_info.image_url",
                '_id': 0
            }
        }
    ]

    leaderboard_data_cursor = coin_stats.aggregate(pipeline)

    return process_result_from_aggregation(leaderboard_data_cursor)


# --------------------------- MONTHLY LEADERBOARD --------------------------------
def monthly_leaderboard():

    # aggregation to get weekly leaderboard data
    pipeline = [
        {
            '$project': {
                'telegram_user_id': 1, 
                'date_array': {
                    '$objectToArray': '$date'
                }
            }
        }, {
            '$unwind': '$date_array'
        }, {
            '$addFields': {
                'date_obj': {
                    '$dateFromString': {
                        'dateString': '$date_array.k', 
                        'format': '%Y-%m-%d'
                    }
                }
            }
        }, {
            '$addFields': {
                'year': {
                    '$year': '$date_obj'
                }, 
                'month': {
                    '$month': '$date_obj'
                }
            }
        }, {
            '$group': {
                '_id': {
                    'telegram_user_id': '$telegram_user_id', 
                    'year': '$year', 
                    'month': '$month'
                }, 
                'max_coins': {
                    '$max': '$date_array.v'
                }
            }
        }, {
            '$group': {
                '_id': '$_id.telegram_user_id', 
                'total_coins': {
                    '$max': '$max_coins'
                }
            }
        }, {
            '$sort': {
                'total_coins': -1
            }
        }, {
            '$lookup': {
                'from': 'users', 
                'localField': '_id', 
                'foreignField': 'telegram_user_id', 
                'as': 'user_info'
            }
        }, {
            '$unwind': '$user_info'
        }, {
            '$project': {
                'telegram_user_id': '$user_info.telegram_user_id',
                'username': '$user_info.username', 
                'level': '$user_info.level', 
                'level_name': '$user_info.level_name', 
                'total_coins': 1, 
                'longest_streak': '$user_info.streak.longest_streak', 
                'image_url': '$user_info.image_url', 
                '_id': 0
            }
        }
    ]

    leaderboard_data_cursor = coin_stats.aggregate(pipeline)

    return process_result_from_aggregation(leaderboard_data_cursor)


# --------------------------- LEADERBOARD: FILTER BY DATE --------------------------------
def leaderboard_date_filter(date: datetime):
    given_date = datetime.now().strftime("%Y-%m-%d")

    # aggregation to get daily leaderboard data
    pipeline = [
        {
            "$project": {  # Create a new field 'total_coins'
                "telegram_user_id": 1,
                "total_coins": {
                    "$ifNull": [f"$date.{given_date}", 0]    # Get the coins for the date or 0 if not present
                } 
            }
        }, {
            "$match": {  # Filter out documents where the date is not present
                "total_coins": {"$gt": 0}
            }
        }, {
            "$sort": {"total_coins": -1}  # Sort by coins (descending)
        }, {
            "$lookup": {
                "from": "users",
                "localField": "telegram_user_id",
                "foreignField": "telegram_user_id",
                "as": "user_info"
            }
        }, {
            "$unwind": "$user_info"
        }, {
            '$project': {
                'username': "$user_info.username",
                'level': "$user_info.level",
                'level_name': "$user_info.level_name",
                'total_coins': 1,
                # 'clan': "$user_info.clan",
                'longest_streak': "$user_info.streak.longest_streak",
                'image_url': "$user_info.image_url",
                'telegram_user_id': 1,
                '_id': 0
            }
        }

    ]

    leaderboard_data_cursor = coin_stats.aggregate(pipeline)

    return process_result_from_aggregation(leaderboard_data_cursor)



##########################################################################################
# --------------------------- LEADERBOARD PROFILE --------------------------------

def daily_achievement(telegram_user_id: str):
    for data in daily_leaderboard():
        if data.telegram_user_id == telegram_user_id:
            return {
                'total_coins': data.coins_earned,
                'rank': data.rank
            }
    return {}

def all_time_achievement(telegram_user_id: str):
    for data in all_time_leaderboard():
        if data.telegram_user_id == telegram_user_id:
            return {
                'rank': data.rank
            }

def leaderboard_profile(telegram_user_id: str):
    user: dict = user_collection.find_one({"telegram_user_id": telegram_user_id})
    today_data = daily_achievement(telegram_user_id)
    all_time_data = all_time_achievement(telegram_user_id)


    today_achievement = TodayAchievement(
        total_coin=today_data.get('total_coins', 0),
        completed_tasks=0,
        current_streak=user.get("streak")["current_streak"],
        rank=today_data.get('rank', '0'),
        # invitees=
    )

    overall_achievement = OverallAchievement(
        total_coins = user.get("total_coins"),
        completed_tasks=0,
        longest_streak = user.get("streak")["longest_streak"],
        rank=all_time_data['rank'],
        invitees = len(user.get("invite"))
    )

    clan = Clan(
        clan_name=None,
        in_clan_rank=None,
    )

    profile_response = LeaderBoardUserProfile(
        username = user.get("username"),
        level = user.get("level"),
        level_name = user.get("level_name"),
        image_url = user.get("image_url"),
        today_achievement = today_achievement,
        overall_achievement = overall_achievement,
        wallet_address = None,
        clan = clan
    )

    return profile_response
