from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from superuser.dashboard.admin_auth import get_current_admin
from dependencies import get_user_profile, update_coins_in_db,get_user_by_id, get_image as get_image_func
from user_reg_and_prof_mngmnt.router import userApp
from earn.router import earnApp
from boosts.router import userExtraBoostApp
from tasks.router import taskApp
from invite.router import inviteApp
from telegram_bot import bot_interactions
from superuser.dashboard.router import adminDashboard
from superuser.task.router import task_router
from superuser.reward.router import rewardApp
from superuser.challenge.router import challenge_router
from superuser.leaderboard.router import adminLeaderboard
from superuser.boost.router import boostApp
from superuser.level.router import levelApp
from superuser.user_mgt.router import userMgtApp
from superuser.security.router import securityApp
from user_reg_and_prof_mngmnt.user_authentication import get_current_user
from typing import Annotated
from user_reg_and_prof_mngmnt.schemas import UserProfile


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
    },
    {
        "name": "Invite features",
        "description": "These routes are for invite action buttons on the invite tab of dashboard."
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
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://boredtap.netlify.app",
    "https://boredtapadmin.netlify.app",
]

app.add_middleware(
    CORSMiddleware,
    # allow_origins=["*"],
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(userApp)
app.include_router(earnApp)
app.include_router(userExtraBoostApp)
app.include_router(taskApp)
app.include_router(inviteApp)
app.include_router(bot_interactions)
app.include_router(adminDashboard)
app.include_router(task_router)
app.include_router(rewardApp)
app.include_router(challenge_router)
app.include_router(adminLeaderboard)
app.include_router(boostApp)
app.include_router(levelApp)
app.include_router(userMgtApp)
app.include_router(securityApp)


@app.get('/', tags=["Global Routes"])
async def home():
    return {"message": "Welcome to BoredTap Coin :)"}


# update user coins tapped
@app.post('/update-coins', tags=["Global Routes"])
async def update_coins(telegram_user_id: Annotated[str, Depends(get_current_user)], coins: int, request: Request):
    """Update coins gannered from different activities to database

    Args:
        telegram_user_id (Annotated[str, Depends): gets the telegram id of signed-in users
        coins (int): total coins accumulated by user

    Returns:
        _type_: int
    """
    user_agent = request.headers.get("User-Agent")
    referer = request.headers.get("Referer")
    origin = request.headers.get("Origin")

    print("user agent: ", user_agent)
    print("referer: ", referer)
    print("origin: ", origin)
    print("request headers: ", request.headers)

    result = update_coins_in_db(telegram_user_id, coins)
    user = get_user_by_id(telegram_user_id)
    if result:
        return {
            "message": "Coins updated successfully",
            "current coins": user.total_coins,
            "current level": user.level
        }
    
    return {"message": "Coins not updated"}



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


@app.get("/bored-tap/user_app/image", tags=["Global Routes"])
async def get_image(
    image_id: str, request: Request, user: Annotated[str, Depends(get_current_user)]):
    # user_agent = request.headers.get("User-Agent")
    # referer = request.headers.get("Referer")
    # origin = request.headers.get("Origin")

    # if origin not in origins:
    #     raise HTTPException(
    #         status_code=403,
    #         detail="Access denied, not enough permissions"
    #     )

    if user:
        return get_image_func(image_id)

    # invalid image id
    raise HTTPException(status_code=404, detail="Image not found")
