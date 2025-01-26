from database_connection import user_collection


# get all users
def get_total_users() -> int:
    total_users = user_collection.count_documents({})
    return total_users

# get total_new_users
def get_total_new_users() -> int:
    pass

def get_new_users() -> list:
    pass

# get leaderboard
def get_leaderboard() -> list:
    pass

# get total coins
def get_total_coins_earned() -> int:
    pass

# get recent activity data
def get_recent_activity_data() -> dict:
    pass

# get user level data
def get_users_level_data() -> dict:
    # data needed to plot a graph of level_names against the number of users at each level
    pass
