from datetime import timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from user_reg_and_prof_mngmnt.dependencies import get_user_by_id
from user_reg_and_prof_mngmnt.user_authentication import (
    ACCESS_TOKEN_EXPIRE_MINUTES, 
    authenticate_user,
    create_access_token)
from . schemas import Token, Signup, BasicProfile
from user_reg_and_prof_mngmnt.dependencies import insert_new_user


userApp = APIRouter()


@userApp.post("/sign-up", tags=["Registration/Authentication"])
async def sign_up(user: Signup) -> BasicProfile:
    # check if telegram_user_id already exists in database
    existing_user = get_user_by_id(user.telegram_user_id)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )
    # else create new user
    new_user = BasicProfile(
        telegram_user_id=user.telegram_user_id,
        username=user.username,
        image_url=user.image_url
    )

    # insert new user in database
    insert_new_user(new_user)

    return new_user


@userApp.post("/signin", tags=["Registration/Authentication"])
async def sign_in(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Token:
    """
    Sign in user and return access token.

    Args:
        form_data (Annotated[OAuth2PasswordRequestForm, Depends()]):
            Form data containing username and password.`
            Enter users telegram id in pasword field.

    Returns:
        Token: Access token with username and telegram_user_id data.
    """
    user = authenticate_user(form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username",
            headers={"WWW-Authenticate": "Bearer"}
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "username": user.username, "telegram_user_id": user.telegram_user_id
        }, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")


# @userApp.put("/{username}/update-profile")