from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings
from user_reg_and_prof_mngmnt.router import userApp


# initialize fastapi app
app = FastAPI(title="Bored Tap Coin API")

origins = [
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    # allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(userApp)

@app.post('/')
async def home():
    return {"message": "Welcome to BoredTap Coin :}"}
