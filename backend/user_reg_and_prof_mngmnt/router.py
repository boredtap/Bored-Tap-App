from datetime import timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from user_reg_and_prof_mngmnt.user_authentication import (
    ACCESS_TOKEN_EXPIRE_MINUTES, 
    authenticate_user, 
    get_user,
    create_access_token)
from . schemas import Token, Signup, BasicProfile
from database_connection import supabase


userApp = APIRouter()


@userApp.post("/sign-up", tags=["Registration"])
async def sign_up(user: Signup):
    # check if telegram_user_id already exists in database
    existing_user = get_user(user.telegram_user_id)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )
    # else create new user
    new_user = BasicProfile(
        telegram_user_id=user.telegram_user_id,
        username=user.username,
    )

    # insert new user in database
    supabase.table("users").insert({
        "telegram_user_id": new_user.telegram_user_id,
        "username": new_user.username
    }).execute()

    return new_user


@userApp.post("/signin", tags=["Authentication"])
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

    user = authenticate_user(form_data.username, form_data.password)
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