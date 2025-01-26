from datetime import datetime, timedelta
from typing import Annotated
from typing_extensions import deprecated
import jwt
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from superuser.dashboard.models import AdminProfile as modelsAdminProfile
from superuser.dashboard.schemas import AdminProfile as schemasAdminProfile
from superuser.dashboard.schemas import AdminSignin, TokenData
from config import get_settings
from database_connection import user_collection, invites_ref, admin_collection
from user_reg_and_prof_mngmnt.schemas import InviteeData, Invites, Signup, UserProfile
from user_reg_and_prof_mngmnt.dependencies import get_user_by_id, serialize_any_http_url, referral_url_prefix
from user_reg_and_prof_mngmnt.user_authentication import oauth2_scheme


SECRET_KEY = get_settings().secret_key
ALGORITHM = get_settings().algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = 30
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_admin(username: str, password: str) -> schemasAdminProfile | None:
    """
    Authenticate a user by checking if they exist in the database.
    """
    admin_check: dict = admin_collection.find_one({"username": username})

    if not admin_check:
        return None
    
    hashed_password = admin_check.get("hashed_password")
    if not verify_password(password, hashed_password):
        return None

    admin_data: dict = schemasAdminProfile(
        username=admin_check.get("username", None),
        role=admin_check.get("role", None)
    )
    return admin_data


async def get_current_admin(token: Annotated[str, Depends(oauth2_scheme)]):
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
    
    users_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Access denied, not enough permissions",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload: dict = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("username")
        role: str = payload.get("role")
        
        if payload.get("telegram_user_id"):
            raise users_exception

        if not username and not role:
            raise credentials_exception
        
        # token_scopes = payload.get("scopes", [])
        token_data = TokenData(username=username, role=role)
        return token_data.username
    except InvalidTokenError:
        raise credentials_exception


