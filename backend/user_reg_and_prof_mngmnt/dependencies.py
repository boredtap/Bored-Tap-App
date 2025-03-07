from fastapi import HTTPException
from pydantic import AnyHttpUrl
from user_reg_and_prof_mngmnt.schemas import BasicProfile, Invites, SuspendedUser
from user_reg_and_prof_mngmnt.models import UserProfile as UserProfileModel
from database_connection import user_collection, invites_ref
from config import get_settings


BOT_TOKEN = get_settings().bot_token

def get_user_by_id(telegram_user_id: str) -> BasicProfile | SuspendedUser | None:
    """
    Retrieve a user by their telegram user ID.

    Args:
        telegram_user_id (str): The telegram user ID of the user to retrieve.

    Returns:
        BasicProfile | SuspendedUser | None: The user data if found, otherwise None.
            If the user has been suspended, the function returns a SuspendedUser model
            with the start and end dates of the suspension, and the reason of suspension.
            If the user has been banned, the function raises an HTTPException with a
            status code of 400 and a detail of "User banned."

    Raises:
        HTTPException: If the user has been banned.
    """
    user: dict = user_collection.find_one({"telegram_user_id": telegram_user_id})

    if not user:
        return None

    if user["is_active"]:
        user_data = BasicProfile(
            id=str(user.get("_id", None)),
            telegram_user_id=user.get("telegram_user_id", None),
            username=user.get("username", None),
            firstname=user.get("firstname", None),
            image_url=user.get("image_url", None),
            level=user.get("level", None),
            total_coins=user.get("total_coins", None),
            power_limit=user.get("power_limit", None),
            last_active_time=user.get("last_active_time", None),
            auto_bot_active=user.get("auto_bot_active", None),
            referral_url=user.get("referral_url", None),
            is_active=user.get("is_active", None)
        )
        return user_data

    try:
        # banned users have the {"banned": True} and {"is_active": False} fields in their profile
        # check if user has been banned
        if not user["is_active"] and user["banned"]:
            raise HTTPException(status_code=400, detail="This user has been banned.")
    except KeyError:
            # suspended users only have the {"is_active": False} field in their profile
            # handle suspended users
            user_data = SuspendedUser(
                    id=str(user.get("_id", None)),
                    telegram_user_id=user.get("telegram_user_id", None),
                    username=user.get("username", None),
                    firstname=user.get("firstname", None),
                    image_url=user.get("image_url", None),
                    level=user.get("level", None),
                    total_coins=user.get("total_coins", None),
                    referral_url=user.get("referral_url", None),
                    is_active=user.get("is_active", None),
                    start_date=user["suspend_details"]["start_date"],
                    end_date=user["suspend_details"]["start_date"],
                    reason=user["suspend_details"]["reason"]
                )
            return user_data


# insert new user in database
def insert_new_user(new_user: UserProfileModel):
    user = user_collection.insert_one(new_user.model_dump())

    return user.inserted_id

def insert_new_invite_ref(new_invite_ref: Invites):
    try:
        new_invite = invites_ref.insert_one(new_invite_ref.model_dump())

        if new_invite.inserted_id:
            print(f"User: {new_invite_ref.inviter_telegram_id} invited user: {new_invite_ref.invitees[0]}.")
    except Exception as e:
        print(f"Error inserting invite: {e}")


def serialize_any_http_url(url: AnyHttpUrl):
  """
  Serializes a pydantic AnyHttpUrl object into a string.

  Args:
    url: The AnyHttpUrl object to serialize.

  Returns:
    The URL as a string.
  """
  if isinstance(url, AnyHttpUrl):
    return str(url)
  else:
    return url

referral_url_prefix = "https://t.me/Bored_Tap_Bot?start="


