from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from telegram.ext import ApplicationBuilder, ContextTypes, CommandHandler
from config import get_settings
from user_reg_and_prof_mngmnt.router import start_cmd

# initialize fastapi app
app = FastAPI(title="Bored Tap Coin API")

# initialize telegram bot application
BotToken = get_settings().bot_token
BotApplication = ApplicationBuilder().token(BotToken).build()

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

# app.include_router(url_shortener)
start_handler = CommandHandler('start', start_cmd)

# add handlers to bot application
BotApplication.add_handler(start_handler)


@app.get("/")
async def home():
    return {"msg": "Welcome to Bored Tap :)"}
