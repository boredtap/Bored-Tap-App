from datetime import datetime, tzinfo, timezone
from hmac import new
from superuser.dashboard.admin_auth import verify_password
from superuser.dashboard.schemas import AdminProfile as schemasAdminProfile, NewUserData
from database_connection import user_collection



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

# get recent activity data
def get_recent_activity_data() -> dict:
    pass

# get user level data
def get_users_level_data() -> dict:
    # data needed to plot a graph of level_names against the number of users at each level
    pass
