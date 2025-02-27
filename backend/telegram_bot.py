import time
import requests
import telebot
import asyncio
from telebot.types import Message, Update, InlineKeyboardMarkup, InlineKeyboardButton
from config import get_settings
from fastapi import APIRouter, HTTPException, Request
from user_reg_and_prof_mngmnt.router import sign_up
from user_reg_and_prof_mngmnt.schemas import Signup


bot_interactions = APIRouter()

BotToken = get_settings().bot_token
bot = telebot.TeleBot(token=BotToken)
base_url = get_settings().base_url


# --------------------------------- Set Webhook URL ----------------------------------- #
def set_webhook_url():
    webhook_url = f"{base_url}/webhook"
    # webhook_url = "https://d5be-197-149-69-222.ngrok-free.app/webhook"
    for attempt in range(3):  # Try setting webhook up to 3 times
        try:
            bot.set_webhook(url=webhook_url)
            print("Webhook set successfully!")
            break  # Exit loop on success
        except (requests.exceptions.RequestException, telebot.apihelper.ApiException) as e:
            print(f"\nError setting webhook (attempt {attempt+1}/3): \n{e}")
            time.sleep(2**attempt)  # Exponential backoff between retries

set_webhook_url()


# ---------------------------------- Webhook Handler ----------------------------------- #
# process incoming Updates from telegram
@bot_interactions.post('/webhook', tags=["Registration/Authentication"])
async def webhook_handler(request: Request):
    print("Received webhook request")
    # parse request body as json
    json_string: Update = await request.json()

    # Process the update here
    update = Update.de_json(json_string)
    bot.process_new_updates([update])

    return {
        "message": "Webhook request processed successfully",
        "status": "ok"
    }

# get user profile picture
def get_profile_url(user_id: int):
    user_profile_photos = bot.get_user_profile_photos(user_id=user_id, limit=1)
    if user_profile_photos.total_count > 0:
        file_id = user_profile_photos.photos[0][-1].file_id
        file_path = bot.get_file(file_id).file_path
        photo_url = f"https://api.telegram.org/file/bot{BotToken}/{file_path}"
        return photo_url

@bot.message_handler(commands=['start'])
def start_command(message: Message):
    # get user datails
    try:
        user_id = str(message.from_user.id)
        referral_code = message.text.split(" ")[1]
        # referral_code = "1234521345"
        username = message.from_user.username
        first_name = message.from_user.first_name
        last_name = message.from_user.last_name
        image_url = get_profile_url(user_id)
    except Exception as e:
        print(e)
        # raise e

    # instantiate Signup model with user details
    print("Setting user details in Signup model")
    user = Signup(
        telegram_user_id=user_id,
        username=username,
        image_url=image_url
    )
    
    print("calling sign_up function")
    try:
        # run sign_up function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        referred_user = loop.run_until_complete(sign_up(user, referral_code))
        loop.close()

        # send welcome message
        launch_btn = InlineKeyboardButton(
            text="Launch WebApp",
            # callback_data="launch_webapp"
            web_app=telebot.types.WebAppInfo(url="https://boredtap.netlify.app/")
        )
        inline_keyboard = InlineKeyboardMarkup(row_width=1).add(launch_btn)
        bot.send_message(
            message.chat.id, f"Welcome, {referred_user.username}!\nPerform tasks and earn coins!",
            reply_markup=inline_keyboard
        )

    # except user already exist
    except HTTPException as e:
        # send welcome message
        launch_btn = InlineKeyboardButton(
            text="Launch WebApp",
            # callback_data="launch_webapp",
            web_app=telebot.types.WebAppInfo(url="https://boredtap.netlify.app/")
        )
        inline_keyboard = InlineKeyboardMarkup(row_width=1).add(launch_btn)
        bot.send_message(
            message.chat.id, f"Welcome back, {username}!\nPerform tasks and earn coins!",
            reply_markup=inline_keyboard
        )

    except Exception as e:
        print(f"Error: {e}")

    print("Start command handled")


# launch webapp button
# @bot.callback_query_handler(func=lambda call: True)
# def launch_webapp(call):
#     if call.data == "launch_webapp":
#         bot.answer_callback_query(call.id, url="https://veenzent.netlify.app/", show_alert=True)

