from datetime import datetime, timedelta
from typing import Annotated
from httpx import get
import jwt
from jwt.exceptions import InvalidTokenError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from config import get_settings
from earn.schemas import StreakData
from database_connection import user_collection
from user_reg_and_prof_mngmnt.schemas import BasicProfile, Invites, Signup, TokenData, UserProfile
from user_reg_and_prof_mngmnt.dependencies import get_user_by_id, insert_new_user, serialize_any_http_url



SECRET_KEY = get_settings().secret_key
ALGORITHM = get_settings().algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/signin",
    # scopes={
    #     "me": "read information about the current user only",
    #     "superuser": "read and write full access"
    # }
)


def authenticate_user(telegram_user_id: str) -> BasicProfile:
    """
    Authenticate a user by checking if they exist in the database.

    Args:
        telegram_user_id (str): The Telegram user ID of the user to authenticate.
        username (str): The username of the user to authenticate.

    Returns:
        BasicProfile: The basic profile of the user if authenticated, otherwise None.
    """
    user = get_user_by_id(telegram_user_id)
    if not user:
        return None

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
        expire = datetime.utcnow() + expires_delta
    else:
        # a very long expiration time because I don't want users signing in all the time
        # though very risky but thoughts on it is still in progress
        expire = datetime.utcnow() + timedelta(days=365)
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
    try:
        payload: dict = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        telegram_user_id: str = payload.get("telegram_user_id")
        # username: str = payload.get("username")
        if telegram_user_id is None:
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


def create_invited_user(invited: Signup):
    invited_user = UserProfile(
        telegram_user_id=invited.telegram_user_id,
        username=invited.username,
        image_url=serialize_any_http_url(invited.image_url),
        total_coins=0,
        level=1,
    )
    return invited_user


def add_invitee_to_inviter_list(inviter_id: str, invitee_id: str):
    inviter = {'telegram_user_id': inviter_id}
    invitee = get_user_by_id(invitee_id)

    invitee_info = Invites(
        telegram_user_id=invitee.telegram_user_id,
        username=invitee.username,
        level=invitee.level,
        total_coins=invitee.total_coins
    )

    update_operation = {'$push':
        {'invite': invitee_info.model_dump()}
    }

    user_collection.update_one(inviter, update_operation)