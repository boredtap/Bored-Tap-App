from supabase import create_client, Client
from config import get_settings
from user_reg_and_prof_mngmnt.schemas import BasicProfile
from postgrest.base_request_builder import APIResponse

supabase_url: str = get_settings().supabase_url
supabase_key: str = get_settings().supabase_key

supabase: Client = create_client(supabase_url, supabase_key)


# insert new user in database
def insert_new_user(new_user: BasicProfile):
    supabase.table("users").insert({
        "telegram_user_id": new_user.telegram_user_id,
        "username": new_user.username,
        "firstname":new_user.firstname,
        "image_url": new_user.image_url,
        "level": new_user.level,
        "total_coins": new_user.total_coins
    }).execute()


# query user by id
def get_user_by_id(telegram_user_id: str) -> BasicProfile:
    """
    Retrieve a user's basic profile from the database using their Telegram user ID.

    Args:
        telegram_user_id (str): The Telegram user ID of the user to retrieve.

    Returns:
        BasicProfile: The basic profile of the user if found, otherwise None.
    """
    user: APIResponse = supabase.table("users")\
    .select().eq("telegram_user_id", telegram_user_id).execute()

    if user.data:
        fetched_user = user.data[0]
        user_data = BasicProfile(
            telegram_user_id=fetched_user.get("telegram_user_id"),
            username=fetched_user.get("username"),
            firstname=fetched_user.get("firstname"),
            image_url=fetched_user.get("image_url"),
            level=fetched_user.get("level"),
            total_coins=fetched_user.get("total_coins")
        )
        return user_data
    return None