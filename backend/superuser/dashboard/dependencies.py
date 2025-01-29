from datetime import datetime, tzinfo, timezone
from pprint import pprint
from superuser.dashboard.admin_auth import verify_password
from superuser.dashboard.schemas import AdminProfile as schemasAdminProfile, LevelDataInfo, NewUserData, RecentActivityData
from database_connection import user_collection, coin_stats



# ------------------------------------- get total number of users ------------------------------------- 
def get_total_users() -> int:
    total_users = user_collection.count_documents({})
    return {"total_users": total_users}


# ------------------------------------- get total number of new users -------------------------------------
def get_total_new_users() -> int:
    # today begins at (00:00:00)
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    # aggregation to find users created today
    pipeline = [
        {
            '$match': {
                'created_at': {
                    '$gte': today_start
                    # '$lt': datetime(2025, 1, 27, 0, 0, 0, tzinfo=timezone.utc)
                }
            }
        }, {
            '$count': 'user_count'
        }
    ]

    # count db docs matching aggregation
    total_users_today = user_collection.aggregate(pipeline)
    total_users_today = total_users_today.next()

    return {"total_new_users": total_users_today["user_count"]}


# ------------------------------------- get overall total coins -------------------------------------
def get_overall_total_coins_earned() -> int:
    # Perform aggregation to calculate total coins
    pipeline = [
        {
            "$group": {
                "_id": None,  # Group all documents together
                "total_coins": {"$sum": "$total_coins"}  # Sum the total_coins field
            }
        }
    ]

    # Execute the aggregation pipeline
    total_coins_result = user_collection.aggregate(pipeline)

    # Extract the total coins value from the aggregation result
    try:
        total_coins = total_coins_result.next()["total_coins"]

        return {"overall_total_coins": total_coins}
    except StopIteration:
        return {"message": "No user profiles found in the collection."}


# ------------------------------------- get new users details -------------------------------------
def get_new_users() -> list:
    # today begins at (00:00:00)
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    # aggregation to get users created today    
    pipeline = [
        {
            "$match": {
                "created_at": {
                    "$gte": today,
                    # "$lte": ISODate("2025-01-26T23:59:59Z")
                }
            }
        },
        {
            "$project": {
                "telegram_user_id": 1,
                "username": 1,
                "image_url": 1
            }
        }
    ]

    new_users_data = user_collection.aggregate(pipeline)

    new_users: list[NewUserData] = []
    for user in new_users_data:
        data = NewUserData(
            telegram_user_id=user["telegram_user_id"],
            username=user["username"],
            image_url=user["image_url"]
        )
        new_users.append(data)
    return new_users


# ------------------------------------- get leaderboard ------------------------------------- 
def get_leaderboard() -> list:
    pass


# ------------------------------------- get recent activity data for coins -------------------------------------
def recent_activity_data_for_coins() -> dict:
    # aggregation to get recent activity data: coins earned monthly
    pipeline_for_coins_activity = [
        {
            '$project': {
                'yearlyCoins': {
                    '$map': {
                        'input': {
                            '$objectToArray': '$date'
                        }, 
                        'as': 'dateItem', 
                        'in': {
                            'year': {
                                '$year': {
                                    '$dateFromString': {
                                        'dateString': '$$dateItem.k'
                                    }
                                }
                            },
                            'month': {
                                '$month': {
                                    '$dateFromString': {
                                        'dateString': '$$dateItem.k'
                                    }
                                }
                            },
                            'coins': '$$dateItem.v'
                        }
                    }
                }
            }
        }, {
            '$unwind': '$yearlyCoins'
        }, {
            '$group': {
                '_id': {
                    'year': '$yearlyCoins.year', 
                    'month': '$yearlyCoins.month'
                }, 
                'totalCoins': {
                    '$sum': '$yearlyCoins.coins'
                }
            }
        }, {
            '$group': {
                '_id': '$_id.year', 
                'monthlyCoins': {
                    '$push': {
                        'month': '$_id.month', 
                        'totalCoins': '$totalCoins'
                    }
                }
            }
        }
    ]

    recent_activity_for_coins = coin_stats.aggregate(pipeline_for_coins_activity)

    data: list[RecentActivityData] = []
    # sample data structure
    # {
    #     "year": 2021,
    #     "data": {
    #         1: 100,
    #         2: 200,
    # }

    for activity in recent_activity_for_coins:
        # activity schemas
        # {'_id': 2025, 'monthlyCoins': 
        #   [
        #     {'month': 1, 'totalCoins': 1200}, 
        #     {'month': 2, 'totalCoins': 2000}
        #   ]
        # }
        info = RecentActivityData(
            year=activity["_id"],
            data={}
        )

        for month in activity["monthlyCoins"]:
            info.data[month["month"]] = month["totalCoins"]

        data.append(info)

    return data


# get user level data
def get_users_level_data() -> dict:
    # aggregation to get user level data
    pipeline = [
        {
            '$group': {
                '_id': {
                    'level': '$level', 
                    'level_name': '$level_name'
                }, 
                'total_users': {
                    '$sum': 1
                }
            }
        }, {
            '$project': {
                '_id': 0, 
                'level': '$_id.level', 
                'level_name': '$_id.level_name', 
                'total_users': 1
            }
        }
    ]
    
    data_cursor = user_collection.aggregate(pipeline)

    level_data_list: list[LevelDataInfo] = []

    for data in data_cursor:
        level_data = LevelDataInfo(
            level=data["level"],
            level_name=data["level_name"],
            total_users=data["total_users"]
        )
        level_data_list.append(data)

    return level_data_list
