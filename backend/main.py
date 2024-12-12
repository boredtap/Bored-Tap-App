from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import telebot
from telegram import Update
from config import get_settings
from user_reg_and_prof_mngmnt.router import launch_app


# initialize fastapi app
app = FastAPI(title="Bored Tap Coin API")

# initialize telegram bot application
BotToken = get_settings().bot_token
bot = telebot.TeleBot(BotToken)

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
# start_handler = CommandHandler('start', start_cmd)

# add handlers to bot application
...


@app.post('/webhook')
async def webhook_handler(update: dict):
    # Process the update here
    if update.message:
        text = update.message.text
        chat_id = update.message.chat.id
        bot.send_message(chat_id=chat_id, text=f"You said: {text}")
        launch_app(message=update.message)
    # elif update.callback_query:
    #     call = update.callback_query
    #     # Handle callback query
    #     bot.answer_callback_query(call.id, f"You clicked {call.data}")
    print(update)
    # return {'message': 'Webhook received'}

# set webhook url
bot.set_webhook(url=f"{get_settings().base_url}/webhook")
