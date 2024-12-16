from datetime import datetime, timedelta
from typing import Annotated
import jwt
from jwt.exceptions import InvalidTokenError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from config import get_settings
from user_reg_and_prof_mngmnt.schemas import BasicProfile
from postgrest.base_request_builder import APIResponse
from database_connection import supabase



SECRET_KEY = get_settings().secret_key
ALGORITHM = get_settings().algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/signin")


def get_user(telegram_user_id: str) -> BasicProfile:
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

def authenticate_user(telegram_user_id: str, username: str) -> BasicProfile:
    """
    Authenticate a user by checking if they exist in the database.

    Args:
        telegram_user_id (str): The Telegram user ID of the user to authenticate.
        username (str): The username of the user to authenticate.

    Returns:
        BasicProfile: The basic profile of the user if authenticated, otherwise False.
    """
    user = get_user(telegram_user_id)
    if not user:
        return False

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

def authorize_url(token: Annotated[str, Depends(oauth2_scheme)]):
    """
    Authorize a user by validating a JWT token and extracting the username.

    Args:
        token (Annotated[str, Depends(oauth2_scheme)]): The JWT token to be validated.

    Returns:
        str: The username extracted from the token if validation is successful.

    Raises:
        HTTPException: If the token is invalid or the username is not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        telegram_user_id: str = payload.get("telegram_user_id")
        username: str = payload.get("username")
        if username is None:
            raise credentials_exception
        return username
    except InvalidTokenError:
        raise credentials_exception
