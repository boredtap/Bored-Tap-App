from user_reg_and_prof_mngmnt.schemas import BasicProfile
from postgrest.base_request_builder import APIResponse
from database_connection import get_db


db = get_db()
user_collection = db['users']

def get_user_by_id(telegram_user_id: str) -> BasicProfile:
    user = user_collection.find_one({"telegram_user_id": "123456789"})

    if user:
        user_data = BasicProfile(
            telegram_user_id=user.get("telegram_user_id", None),
            username=user.get("username", None),
            firstname=user.get("firstname", None),
            image_url=user.get("image_url", None),
            level=user.get("level", None),
            total_coins=user.get("total_coins", None)
        )
        return user_data
    return None


# insert new user in database
def insert_new_user(new_user: BasicProfile):
    user_collection.insert_one(new_user.model_dump())

