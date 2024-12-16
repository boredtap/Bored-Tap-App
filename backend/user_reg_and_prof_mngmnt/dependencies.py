from user_reg_and_prof_mngmnt.schemas import BasicProfile
from postgrest.base_request_builder import APIResponse
from ..database_connection import supabase


def get_user(telegram_user_id: str) -> BasicProfile:
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
