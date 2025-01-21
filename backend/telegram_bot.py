import time
import requests
import telebot
import asyncio
from telebot.types import Message, Update
from config import get_settings
from fastapi import APIRouter, Request
from user_reg_and_prof_mngmnt.router import sign_up
from user_reg_and_prof_mngmnt.dependencies import get_user_by_id, insert_new_invite_ref, insert_new_user
from user_reg_and_prof_mngmnt.schemas import Signup
from user_reg_and_prof_mngmnt.user_authentication import create_invite_ref, create_invited_user, reward_inviter_and_invitee, validate_referral_code


bot_interactions = APIRouter()

BotToken = get_settings().bot_token
bot = telebot.TeleBot(token=BotToken)
base_url = get_settings().base_url



# set webhook url
def set_webhook_url():
    webhook_url = f"{base_url}/webhook"
    # webhook_url = "https://d5be-197-149-69-222.ngrok-free.app/webhook"
    for attempt in range(3):  # Try setting webhook up to 3 times
        try:
            bot.set_webhook(url=webhook_url)
            print("Webhook set successfully!")
            break  # Exit loop on success
        except (requests.exceptions.RequestException, telebot.apihelper.ApiException) as e:
            print(f"Error setting webhook (attempt {attempt+1}/3): {e}")
            time.sleep(2**attempt)  # Exponential backoff between retries

set_webhook_url()

# process incoming Updates from telegram
@bot_interactions.post('/webhook', tags=["Registration/Authentication"])
async def webhook_handler(request: Request):
    # parse request body as json
    json_string: Update = await request.json()

    # Process the update here
    update = Update.de_json(json_string)
    bot.process_new_updates([update])

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
    user_id = str(message.from_user.id)
    referral_code = message.text.split(" ")[1]
    username = message.from_user.username
    first_name = message.from_user.first_name
    last_name = message.from_user.last_name
    image_url = get_profile_url(user_id)

    print("Setting user details in Signup model")
    user = Signup(
        telegram_user_id=user_id,
        username=username,
        image_url=image_url
    )
    
    print("calling sign_up function")
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        referred_user = loop.run_until_complete(sign_up(user, referral_code))
        loop.close()

        bot.send_message(
            message.chat.id, f"Welcome, {referred_user.username}!\nClick the button below to launch app: ",
            reply_markup=telebot.types.ReplyKeyboardMarkup(resize_keyboard=True).
                add(telebot.types.InlineKeyboardButton("Launch:", url="https://boredtap.netlify.app"))
        )
    except Exception as e:
        print(e)



    # # check if invited user already exists and sign them in
    # existing_user = get_user_by_id(user_id)
    # if existing_user:
    #     # create an inline keyboard with a URL button
    #     keyboard = telebot.types.ReplyKeyboardMarkup(resize_keyboard=True)
    #     launch_btn = telebot.types.InlineKeyboardButton("Launch:", url="https://boredtap.netlify.app")
    #     keyboard.add(launch_btn)

    #     bot.send_message(
    #         message.chat.id, f"Welcome, {username}!\nClick the button below to launch app: ",
    #         reply_markup=keyboard
    #     )

    # # else register them
    # user = Signup(
    #     telegram_user_id=user_id,
    #     username=username,
    #     image_url=image_url
    # )

    # if referral_code and validate_referral_code(str(referral_code)):
    #     invited_user = create_invited_user(invited=user)
    #     new_invite_ref = create_invite_ref(inviter_id=referral_code, ref=user)
    #     insert_new_user(invited_user)

    #     if new_invite_ref:
    #         insert_new_invite_ref(new_invite_ref)
    #     reward_inviter_and_invitee(inviter_id=referral_code, invitee_id=user_id, reward=100)

    #     # create an inline keyboard with a URL button
    #     keyboard = telebot.types.ReplyKeyboardMarkup(resize_keyboard=True)
    #     launch_btn = telebot.types.InlineKeyboardButton("Launch:", url="https://boredtap.netlify.app")
    #     keyboard.add(launch_btn)

    #     # send welcome message
    #     bot.send_message(
    #         message.chat.id, f"Welcome, {username}!\nClick the button below to launch app",
    #         reply_markup=keyboard
    #     )

    print("Command handled")


