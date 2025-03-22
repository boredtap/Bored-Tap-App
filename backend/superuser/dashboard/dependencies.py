from database_connection import fs
from datetime import datetime, timedelta, tzinfo, timezone
from io import BytesIO
from bson import ObjectId
from fastapi.responses import StreamingResponse
from superuser.dashboard.admin_auth import verify_password
from superuser.dashboard.schemas import AdminProfile as schemasAdminProfile, LeaderboardData, LevelDataInfo, NewUserData, RecentActivityData
from database_connection import user_collection, coin_stats



# ------------------------------------- get total number of users ------------------------------------- 
def get_total_users() -> dict[str, int]:
    """
    Gets the total number of users in the user collection.

    The function counts the total number of documents in the user collection and
    returns the result as a dictionary with the key "total_users".

    :return: A dictionary with the total number of users in the user collection.
    :rtype: dict[str, int]
    """
    total_users = user_collection.count_documents({})
    return {"total_users": total_users}


# ------------------------------------- get total number of users [signal] -------------------------------------
overall_users_percentage_increase = 0.00
last_new_user_created_at = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
def get_total_users_signal() -> dict[str, int | float | datetime]:
    """
    Gets the total number of new users in the last 24 hours and the percentage increase.

    The function checks if there are any new users in the last 24 hours, and if there are, it calculates the percentage increase by dividing the number of new users by the total number of users, and then multiplying by 100.
    If there are no new users in the last 24 hours, the percentage increase is set to 0.00.

    The function returns a dictionary with the following keys:

        - `total_new_users`: The total number of new users in the last 24 hours.
        - `percentage_increase`: The percentage increase in the total number of users in the last 24 hours.
        - `last_new_user_created_at`: The datetime of the last new user created in the last 24 hours.

    :return: A dictionary with the total number of new users, the percentage increase, and the datetime of the last new user created in the last 24 hours.
    :rtype: dict[str, int | float | datetime]
    """
    global overall_users_percentage_increase
    global last_new_user_created_at
    current_total_users = get_total_users()
    current_total_users = current_total_users["total_users"]

    previous_total_users = user_collection.count_documents({"created_at": {"$lt": last_new_user_created_at}})
    new_users = user_collection.find({"created_at": {"$gte": last_new_user_created_at}}).sort("created_at", -1)
    new_users = list(new_users)

    if len(new_users) > 0:
        new_users_creation_dates = [user["created_at"] for user in new_users]
        last_new_user_created_at = new_users_creation_dates[0]
    
        overall_users_percentage_increase = ((current_total_users - previous_total_users) / previous_total_users) * 100
        overall_users_percentage_increase = round(overall_users_percentage_increase, 2)
        print(f"Percentage increase: {overall_users_percentage_increase}")
        print(f"global last new created at: {last_new_user_created_at}")

        return {
            "total_users": current_total_users,
            "total_new_users": current_total_users - previous_total_users,
            "percentage_increase": overall_users_percentage_increase,
            # "last_new_user_created_at": last_new_user_created_at,
        }

    # if there are no new users in the last 24 hours
    if current_total_users - previous_total_users == 0 and last_new_user_created_at == datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0):
        overall_users_percentage_increase = 0.00

    return {
        "total_users": current_total_users,
        "total_new_users": 0,
        "percentage_increase": f"{overall_users_percentage_increase}%",
        # "last_new_user_created_at": last_new_user_created_at
    }


# ------------------------------------- get total number of new users -------------------------------------
def get_total_new_users() -> dict[str, int]:
    # today begins at (00:00:00)
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday = today_start - timedelta(days=1)

    # find users that registered today
    new_users_today = user_collection.count_documents({"created_at": {"$gte": today_start}})

    # calculate percentage increase
    percentage_increase = 0.00
    new_users_yesterday = 0
    if new_users_today > 0:
        # get users that registered yesterday
        new_users_yesterday = user_collection.count_documents({"created_at": {"$gte": yesterday, "$lt": today_start}})
    
        # calculate percentage increase
        if new_users_yesterday > 0:
            percentage_increase = (new_users_today / new_users_yesterday) * 100
            percentage_increase = round(percentage_increase, 2)
    
    return {
        "total_new_users": new_users_today,
        "users_yesterday": new_users_yesterday,
        "percentage_increase": f"{percentage_increase}%"
    }


# ------------------------------------- get overall total coins -------------------------------------
def get_overall_total_coins_earned() -> dict[str, int] | dict:
    # get total coins earned today
    today_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    print(today_date)

    # today coins pipeline for aggregation
    today_coins_pipeline = [
        {
            "$group": {
                "_id": None,  # Group all documents together
                "total_coins": {
                    "$sum": f"$date.{today_date}"
                }
            }
        }
    ]

    # Execute the aggregation pipeline
    today_coins_result = coin_stats.aggregate(today_coins_pipeline)

    # Extract the total coins value from the aggregation result
    try:
        today_coins = today_coins_result.next()["total_coins"]
        print(today_coins)
    except StopIteration:
        today_coins = 0


    # Perform aggregation to get overall total coins
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
        overall_total_coins = total_coins_result.next()["total_coins"]
    except StopIteration:
        overall_total_coins = 0

    # calculate percentage increase
    percentage_increase = 0.00
    if overall_total_coins > 0:
        percentage_increase = (today_coins / overall_total_coins) * 100
        percentage_increase = round(percentage_increase, 2)

    # return overall total coins
    return {
        "overall_total_coins": overall_total_coins,
        "percentage_increase": f"{percentage_increase}%"
    }


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
def get_users_leaderboard() -> list:
    # aggregation to get leaderboard data
    pipeline = [
        {
            '$sort': {
                'total_coins': -1
            }
        }, {
            '$project': {
                'username': 1, 
                'image_url': 1, 
                'total_coins': 1, 
                '_id': 0
            }
        }
    ]

    leaderboard_data_cursor = user_collection.aggregate(pipeline)

    # extract data from pipeline result
    leaderboard_data: list[LeaderboardData] = []

    for data in leaderboard_data_cursor:
        data = LeaderboardData(
            username=data["username"],
            image_url=data["image_url"],
            total_coins=data["total_coins"]
        )

        leaderboard_data.append(data)
    
    return leaderboard_data


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


# ------------------------------------- get recent activity data for users -------------------------------------
def recent_activity_data_for_users() -> dict:
    pipeline = [
        {
            '$group': {
                '_id': {
                    'year': {
                        '$year': '$created_at'
                    }, 
                    'month': {
                        '$month': '$created_at'
                    }
                }, 
                'count': {
                    '$sum': 1
                }
            }
        }, {
            '$group': {
                '_id': '$_id.year', 
                'month_data': {
                    '$push': {
                        'k': {
                            '$toString': '$_id.month'
                        }, 
                        'v': '$count'
                    }
                }
            }
        }, {
            '$project': {
                'year': '$_id', 
                '_id': 0, 
                'month_data': {
                    '$arrayToObject': '$month_data'
                }
            }
        }
    ]

    recent_activity_for_users = user_collection.aggregate(pipeline)

    # extract data from pipeline result
    data: list[RecentActivityData] = []

    for activity in recent_activity_for_users:
        info = RecentActivityData(
            year=activity["year"],
            data=activity["month_data"]
        )

        data.append(info)
    
    return data


# ------------------------------------- get user level data -------------------------------------
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


# ------------------------------------- get image -------------------------------------
def get_image(image_id: str):
    image = fs.get(ObjectId(image_id))
    image_buffer = BytesIO(image.read())
    image_buffer.seek(0)
    return StreamingResponse(image_buffer, media_type="image/jpeg")
