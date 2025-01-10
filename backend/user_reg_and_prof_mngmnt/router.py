from datetime import timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from telegram import Update
from telegram.ext import Updater, Dispatch
from config import get_settings
from user_reg_and_prof_mngmnt.dependencies import (
    get_user_by_id,
    insert_new_invite_ref,
    serialize_any_http_url,
    referral_url_prefix)
from user_reg_and_prof_mngmnt.user_authentication import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    authenticate_user,
    create_access_token,
    create_invite_ref,
    create_invited_user,
    reward_inviter_and_invitee,
    validate_referral_code)
from . schemas import Token, Signup, BasicProfile, UserProfile
from user_reg_and_prof_mngmnt.dependencies import insert_new_user


userApp = APIRouter()
bot_token = get_settings().bot_token
updater = Updater(token=bot_token, use_context=True)
dispatcher = updater.dispatcher


@userApp.post("/sign-up", tags=["Registration/Authentication"])
async def sign_up(user: Signup, referral_code: str | None = None) -> BasicProfile:
    """
    Sign up a new user and return the user data.

    Args:
        user (Signup): The user data to sign up, containing the telegram user ID, username and image URL.

    Returns:
        BasicProfile: The user data if sign up is successful.

    Raises:
        HTTPException: If the telegram user ID already exists in the database with status code 400.
    """
    # check if telegram_user_id already exists in database
    existing_user = get_user_by_id(user.telegram_user_id)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )
    
    if referral_code and validate_referral_code(referral_code):
        invited_user = create_invited_user(invited=user)
        new_invite_ref = create_invite_ref(inviter_id=referral_code, ref=user)
        insert_new_user(invited_user)
        if new_invite_ref:
            insert_new_invite_ref(new_invite_ref)
        reward_inviter_and_invitee(inviter_id=referral_code, invitee_id=user.telegram_user_id, reward=100)
        # add_invitee_to_inviter_list(inviter_id=referral_code, invitee_id=user.telegram_user_id)

        return BasicProfile(
        telegram_user_id=user.telegram_user_id,
        username=user.username,
        image_url=serialize_any_http_url(url=user.image_url),
        referral_url=referral_url_prefix + user.telegram_user_id
    )

    # else create new user
    full_profile = UserProfile(
        telegram_user_id=user.telegram_user_id,
        username=user.username,
        image_url=serialize_any_http_url(url=user.image_url),
        referral_url=referral_url_prefix + user.telegram_user_id
    )

    # insert new user in database
    insert_new_user(full_profile)

    return BasicProfile(
        telegram_user_id=user.telegram_user_id,
        username=user.username,
        image_url=serialize_any_http_url(url=user.image_url),
        referral_url=referral_url_prefix + user.telegram_user_id
    )


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


@userApp.post("/webhook", tags=["Registration/Authentication"])
async def webhook(request: Request) -> dict:
    data = await request.json()
    update: Update = Update.de_json(data, bot=updater.bot)
    dispatcher.process_update(update)
    return {"status": "ok"}