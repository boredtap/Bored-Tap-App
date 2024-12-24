from fastapi import FastAPI, Request, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings
from dependencies import get_user_profile, update_coins_in_db
from user_reg_and_prof_mngmnt.dependencies import get_user_by_id
from user_reg_and_prof_mngmnt.router import userApp
from earn.router import earnApp
from user_reg_and_prof_mngmnt.user_authentication import get_current_user, oauth2_scheme
from typing import Annotated
from user_reg_and_prof_mngmnt.schemas import BasicProfile, UserProfile


tags_metadata = [
    {
        "name": "Global Routes",
        "description": "These routes returns data that could be used across different screens in the Frontend."
    },
    {
        "name": "Registration/Authentication",
        "description": "These routes are for user registration and authentication."
    },
    {
        "name": "Earn features",
        "description": "These routes are for earn action buttons on the earn tab of dashboard."
    }
]




# initialize fastapi app
app = FastAPI(
    title="Bored Tap Coin API",
    description="API for Bored Tap Coin",
    version="1.0.0",
    openapi_tags=tags_metadata
)

origins = [
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    # allow_origins=origins,
    allow_credentials=True,
    # allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(userApp)
app.include_router(earnApp)

@app.get('/', tags=["Global Routes"])
async def home():
    return {"message": "Welcome to BoredTap Coin :)"}


# update user coins tapped
@app.post('/coins', tags=["Global Routes"])
async def update_coins(telegram_user_id: Annotated[str, Depends(get_current_user)], coins: int):
    """Update coins gannered from different activities in database

    Args:
        telegram_user_id (Annotated[str, Depends): gets the telegram id of signed-in users
        coins (int): total coins accumulated by user

    Returns:
        _type_: int
    """
    update_coins_in_db(telegram_user_id, coins)
    return {"message": f"User coins updated successfully"}


# get user data
@app.get('/user/profile', tags=["Global Routes"], response_model=UserProfile)
async def get_user_data(telegram_user_id: Annotated[str, Depends(get_current_user)]) -> UserProfile:
    """Get full user profile information

    Args:
        telegram_user_id (Annotated[str, Depends): _description_

    Returns:
        UserProfile: user profile information
    """
    user = get_user_profile(telegram_user_id)
    return user


# update user level
@app.post('/update-level', tags=["Global Routes"])
async def update_level(telegram_user_id: Annotated[str, Depends(get_current_user)]):
    return {"message": f"Level successfully updated for {telegram_user_id}"}