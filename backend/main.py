from fastapi import FastAPI, Request, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings
from user_reg_and_prof_mngmnt.router import userApp
from user_reg_and_prof_mngmnt.user_authentication import oauth2_scheme
from typing import Annotated
from user_reg_and_prof_mngmnt.schemas import BasicProfile


tags_metadata = [
    {
        "name": "Global Routes",
        "description": "These routes returns data that could be used across different screens in the Frontend."
    },
    {
        "name": "Registration/Authentication",
        "description": "These routes are used for user registration and authentication."
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

@app.get('/', tags=["Global Routes"])
async def home():
    return {"message": "Welcome to BoredTap Coin :)"}


# update user coins tapped
@app.post('/{telegram_user_id}/coins', tags=["Global Routes"])
async def update_coins(telegram_user_id: Annotated[str, Depends(oauth2_scheme)]):
    return {"message": f"Coins successfully retrieved for {telegram_user_id}"}


# get user data
@app.get('/{telegram_user_id}/user_data', tags=["Global Routes"])
async def get_user_data(telegram_user_id: Annotated[str, Depends(oauth2_scheme)]) -> BasicProfile:
    return {"message": f"User data successfully retrieved for {telegram_user_id}"}
