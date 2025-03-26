from datetime import datetime, timedelta, timezone
from typing import Annotated
import jwt
from jwt.exceptions import InvalidTokenError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from config import get_settings
from database_connection import user_collection, invites_ref
from dependencies import update_coin_stats
from user_reg_and_prof_mngmnt.schemas import BasicProfile, InviteeData, Invites, Signup, TokenData
from user_reg_and_prof_mngmnt.models import (
    UserProfile as UserProfileModel
)
from user_reg_and_prof_mngmnt.dependencies import get_user_by_id, serialize_any_http_url, referral_url_prefix



SECRET_KEY = get_settings().secret_key
ALGORITHM = get_settings().algorithm
USER_ACCESS_TOKEN_EXPIRE_HOURS = 2
ADMIN_ACCESS_TOKEN_EXPIRE_HOURS = 12

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/signin",
    # scopes={
    #     "me": "read information about the current user only",
    #     "superuser": "read and write full access"
    # }
)


def authenticate_user(telegram_user_id: str) -> BasicProfile:
    """
    Authenticate a user by their Telegram user ID and check their suspension status.

    Args:
        telegram_user_id (str): The Telegram user ID to authenticate.

    Returns:
        BasicProfile: The user's basic profile if authentication is successful.

    Raises:
        HTTPException: If the user is suspended with remaining suspension time,
                       or if releasing the suspension fails.
    """
    user = get_user_by_id(telegram_user_id)

    if not user:
        return None

    # check if user is suspended
    if not user.is_active:
        # get suspension remaining time
        suspend_end_date: datetime = user_collection.find_one({"telegram_user_id": telegram_user_id, "suspend_details.end_date": {"$exists": True}})["suspend_details"]["end_date"]
        if suspend_end_date.tzinfo:
            suspend_end_date = suspend_end_date.astimezone(timezone.utc)
        else:
            suspend_end_date = suspend_end_date.replace(tzinfo=timezone.utc)

        now = datetime.now()
        today = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

        suspend_remaining_time = suspend_end_date - today

        if suspend_remaining_time > timedelta(days=0, hours=0, minutes=0, microseconds=0):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"User has been suspended. Remaining time: {suspend_remaining_time}")

        # release user and remove suspend details from user profile
        release_suspend = user_collection.update_one(
            {"telegram_user_id": telegram_user_id, "is_active": False},
            {
                "$set": {"is_active": True},
                "$unset": {"suspend_details": ""}
            },
        )

        if release_suspend.modified_count == 0:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="User suspension release failed.")

    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """
    Create a JSON Web Token (JWT) for user authentication.

    Args:
        data (dict): The data to encode within the JWT, typically containing user information.
        expires_delta (timedelta | None, optional): The time duration for which the token is valid.
            If not provided, a default duration of 365 days is used.

    Returns:
        str: The encoded JWT as a string.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=12)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    """
    Authorize a user by validating a JWT token and extracting the username.

    Args:
        token (Annotated[str, Depends(oauth2_scheme)]): The JWT token to be validated.

    Returns:
        str: The username extracted from the token if validation is successful.

    Raises:
        HTTPException: If the token is invalid or the username is not found.
    """
    # if security_scopes.scopes:
    #     authenticate_value = f'Bearer scope="{security_scopes.scope_str}"'
    # else:
    #     authenticate_value="Bearer"

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    admin_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="route for users only",
            headers={"WWW-Authenticate": "Bearer"}
        )
    try:
        payload: dict = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        telegram_user_id: str = payload.get("telegram_user_id")
        admin_role: str = payload.get("role")
        # username: str = payload.get("username")

        if admin_role:
            raise admin_exception

        if not telegram_user_id:
            raise credentials_exception
        # token_scopes = payload.get("scopes", [])
        
        token_data = TokenData(telegram_user_id=telegram_user_id)
        return token_data.telegram_user_id
    except InvalidTokenError:
        raise credentials_exception


def validate_referral_code(referral_code: str):
    inviter = authenticate_user(referral_code)
    if inviter:
        return True


def reward_inviter_and_invitee(inviter_id: str, invitee_id: str, reward: int):
    inviter = {'telegram_user_id': inviter_id}
    invitee = {'telegram_user_id': invitee_id}

    update_operation = {'$inc':
        {'total_coins': reward}
    }

    user_collection.update_one(inviter, update_operation)
    user_collection.update_one(invitee, update_operation)

    # update coin stats of inviter and invitee
    update_coin_stats(telegram_user_id=inviter_id, coins_tapped=reward)
    update_coin_stats(telegram_user_id=invitee_id, coins_tapped=reward)


def create_invited_user(invited: Signup):
    invited_user = UserProfileModel(
        telegram_user_id=invited.telegram_user_id,
        username=invited.username,
        image_url=serialize_any_http_url(invited.image_url),
        total_coins=0,
        level=1,
        referral_url=referral_url_prefix + invited.telegram_user_id,
    )
    return invited_user

def create_invite_ref(inviter_id: str, ref = Signup):
    """
    Creates or updates an invite reference for a given inviter.
    If the inviter does not have any existing invites, a new invite reference is created.
    If the inviter already has invites, the new invitee is added to the existing invite reference.
    Args:
        inviter_id (str): The Telegram ID of the inviter.
        ref (Signup): An instance of the Signup class containing the invitee's information.
    Returns:
        Invites: A new invite reference if the inviter does not have any existing invites.
    """
    # check if inviter has reference of their invitees in db invites_ref collection
    reference_in_db = invites_ref.find_one({'inviter_telegram_id': inviter_id})

    if not reference_in_db:
        invite_ref = Invites(
            inviter_telegram_id=inviter_id,
            invitees=[ref.telegram_user_id]
        )
        return invite_ref
    
    inviter = {'inviter_telegram_id': inviter_id}
    update_operation = {'$addToSet':
        {'invitees': ref.telegram_user_id}
    }
    invites_ref.update_one(inviter, update_operation)

def add_invitee_to_inviter_list(inviter_id: str, invitee_id: str):
    inviter = {'telegram_user_id': inviter_id}
    invitee = get_user_by_id(invitee_id)

    invitee_info = InviteeData(
        # telegram_user_id=invitee.telegram_user_id,
        username=invitee.username,
        level=invitee.level,
        # level_name=invitee.level_name,
        total_coins=invitee.total_coins
    )

    update_operation = {'$push':
        {'invite': invitee_info.model_dump()}
    }

    user_collection.update_one(inviter, update_operation)
