from datetime import timedelta, datetime
import json
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from redis import Redis
from database_connection import get_redis_client
from dependencies import (
    get_user_profile,
    update_coins_in_db,
    get_user_by_id,
    get_image as get_image_func,
    update_coins_power_limit_last_active_time_autobot,
    update_photo_url,
    update_power_limit_last_active_time_autobot
)
from superuser.level.dependencies import get_levels as get_levels_func
from superuser.level.models import LevelModelResponse
from user_reg_and_prof_mngmnt.router import userApp
from earn.router import earnApp
from clan.router import user_clan_router
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

all_routers = [
    userApp, earnApp, user_clan_router, userExtraBoostApp, taskApp, inviteApp, bot_interactions, 
    adminDashboard, task_router, rewardApp, challenge_router,
    adminLeaderboard, boostApp, levelApp, userMgtApp, securityApp
]

# include all routers
for router_app in all_routers:
    app.include_router(router_app)



# # health check
# @app.get("/health", tags=["Global Routes"])
# async def health_check():
#     return {"status": "OK"}


@app.get('/', tags=["Global Routes"])
async def home():
    return {"message": "Welcome to BoredTap Coin :)"}


# update user coins tapped
@app.post('/update-coins', tags=["Global Routes"])
async def update_coins(
    request: Request,
    telegram_user_id: Annotated[str, Depends(get_current_user)],
    auto_bot_active: bool | None = None,
    coins: int | None = None,
    current_power_limit: int | None = None,
    last_active_time: datetime | None = None,):

    """
    This endpoint updates: 
    - the user's coins, power limit, last active time and auto bot active status if all four parameters are provided.
    - the user's coins alone if only the coins parameter is provided.
    - the user's current power limit, last active time, and auto bot active status if only the three mentioned parameters are provided.
    
    Parameters:
    - telegram_user_id (str): The telegram user ID of the user to update.
    - request (Request): The request object.
    - coins (int): The number of coins to add to the user's current coins.
    - current_power_limit (int): The new power limit of the user.
    - last_active_time (datetime): The new last active time of the user.
    - auto_bot_active (bool): The new auto bot active status of the user.
    
    Returns:
    - A dictionary containing the status of the update operation.
    """

    user_agent = request.headers.get("User-Agent")
    referer = request.headers.get("Referer")
    origin = request.headers.get("Origin")

    print("user agent: ", user_agent)
    print("referer: ", referer)
    print("origin: ", origin)

    response = {}

    # --------- update all (coins, power limit, last active time, auto bot active) at once ------------- #
    if coins and current_power_limit and last_active_time:
        response = update_coins_power_limit_last_active_time_autobot(
            telegram_user_id, coins, current_power_limit, last_active_time, auto_bot_active
        )

        return response

    # ------------------------- update coins only ----------------------------- #
    if coins:
        result = update_coins_in_db(telegram_user_id, coins)
        user = get_user_by_id(telegram_user_id)
        if result:
            response["coin status"] = "Coins updated successfully"
            response["current coins"] = user.total_coins
            response["current level"] = user.level

        return response
    
    # ---------------------- update power limit, last active time and auto_bot_active ------------------------ #
    if current_power_limit and last_active_time:
        result = update_power_limit_last_active_time_autobot(
            telegram_user_id, current_power_limit, last_active_time, auto_bot_active
        )

        if result:
            response["status"] = "Success"
            response["power limit status"] = "Power limit updated successfully"
            response["last active status"] = "Last active time updated successfully"
            response["auto bot status"] = "Auto bot status updated successfully"

            return response
    
    return {
        "status": False,
        "message": "Enter either coins to update coins alone, power limit and last active time to update power limit and last active time or all parameters to update them at once"
    }


# get user data
@app.get('/user/profile', tags=["Global Routes"], response_model=UserProfile)
async def get_user_data(
    telegram_user_id: Annotated[str, Depends(get_current_user)],
    # redis_client: Annotated[Redis, Depends(get_redis_client)]
) -> UserProfile:
    """
    Retrieve and return the profile of a signed-in user.

    Args:
        telegram_user_id (Annotated[str, Depends(get_current_user)]): The Telegram user ID of the user to retrieve.

    Returns:
        UserProfile: The user profile if found, otherwise None.
    """
    user = get_user_profile(telegram_user_id)

    return user


# get levels
@app.get("/bored-tap/levels", tags=["Global Routes"])
async def get_levels(request: Request, redis_client: Annotated[Redis, Depends(get_redis_client)]) -> list[LevelModelResponse]:    
    """
    Retrieve and return all levels available in the system.

    This endpoint fetches levels from the database and caches the result in Redis
    for subsequent requests to improve performance. If the levels are already cached,
    it returns the cached data. Otherwise, it fetches the levels from the database,
    caches them, and then returns the data.

    Args:
        request (Request): The FastAPI request object containing details of the HTTP request.

    Returns:
        list[LevelModelResponse]: A list of LevelModelResponse instances representing
        the levels retrieved from the database or cache.
    """

    if redis_client:
        cache_key = f"{request.url.path}"
        cached_response = redis_client.get(cache_key) if redis_client else None

        if cached_response:
            print("Cache hit: levels")
            deserialized_levels = json.loads(cached_response)
            model_instances = [LevelModelResponse(**level) for level in deserialized_levels]

            return model_instances

        print("Cache miss: levels")
        level_generator = get_levels_func()
        serialized_levels = [level.model_dump() for level in level_generator]

        try:
            redis_client.set(cache_key, json.dumps(serialized_levels), ex=timedelta(minutes=5))
        except Exception as e:
            print(f"Error caching levels: {e}")

    return [LevelModelResponse(**level) for level in serialized_levels]


# update profile photo url
@app.post("/bored-tap/user_app", tags=["Global Routes"])
async def update_profile_image_url(image_url: str, telegram_user_id: Annotated[str, Depends(get_current_user)]):
    result = update_photo_url(telegram_user_id, image_url)

    return result



# get user image
@app.get("/bored-tap/user_app/image", tags=["Global Routes"])
async def get_image(
    image_id: str, request: Request, user: Annotated[str, Depends(get_current_user)]):

    if user:
        return get_image_func(image_id)

    # invalid image id
    raise HTTPException(status_code=404, detail="Image not found")
