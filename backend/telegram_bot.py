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
welcome_photo_url = "https://s3-alpha-sig.figma.com/img/dae9/c267/ada3d9ffded20bd58885388f77afe727?Expires=1742774400&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=ZBO6yNdqTRlD0XyGntGkEQFbLbwOT8fWv2qJA-NqOyoVDfhp9iir5YNT57eHVM6KU~paRqUHBDlk4DKyv3Ql2bHLLV9RpM33~Lly6s-0vtzX~AL1dypHbdCX31vhNmFR-NMifARX6KUUJMmzkllcrsU70j-XYtBJRoXB-3OhXtuzEZ8YIfYHR3XA~tMNxM-kyo9fL6CtYcKwglzQBf1nmBYnb2Zrp~eYE1ujcLoTbMPwsbEMXsA6Y81KtTrjhRA5CsJacvrPsT5R2UdBXNyWoAw-XTztpQTXqetCWq1MD5-yZTQkMlT5~aUQxG~ghMgEigv0rKisSQPtoogmKVclSg__"


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
    """Handles incoming Telegram updates via webhook"""
    try:
        print("Received webhook request")
        # parse request body as json
        json_data = await request.json()

        # Process the update here
        update = Update.de_json(json_data)
        if not update:
            print("Received update is None.")
            return {
                "status": "warning",
                "message": "Invalid update received"
            }
        bot.process_new_updates([update])

        return {
            "message": "Webhook request processed successfully",
            "status": "ok"
        }
    except Exception as e:
        print(f"Error processing webhook: {e}")
        raise HTTPException(status_code=500, detail="internal server error")



@bot.message_handler(commands=['start'])
def start_command(message: Message):
    """Handles the /start command, registers users, and sends a welcome message"""

    # inline keyboard button to join community
    join_community_btn = InlineKeyboardButton(
        text="Join Community",
        callback_data="join_community",
        # web_app=telebot.types.WebAppInfo(url="https://boredtap.netlify.app/")
    )
    inline_keyboard = InlineKeyboardMarkup(row_width=1)

    # get user datails    
    user_id = str(message.from_user.id)
    username = message.from_user.username
    first_name = message.from_user.first_name
    last_name = message.from_user.last_name
    image_url = "https://example.com"       # actual url would be updated from client side

    # Extract referral code
    message_parts = message.text.split(" ")
    referral_code = message_parts[1] if len(message_parts) > 1 else None
    # referral_code = "1234521345"

    print(f"Received start command from user {user_id} (username: {username})")
    # bot.send_message(message.chat.id, f"Received start command from user {user_id} (username: {username})")
    # bot.send_message(message.chat.id, f"Message received: {message.text}")

    # instantiate Signup model with user details
    print("Setting user details in Signup model")
    user = Signup(
        telegram_user_id=user_id,
        username=username,
        image_url=image_url
    )

    try:
        # run sign_up function
        print("calling sign_up function")
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        referred_user = loop.run_until_complete(sign_up(user, referral_code))
        loop.close()

        # set welcome message action button
        launch_btn = InlineKeyboardButton(
            text="Claim Invite Reward",
            web_app=telebot.types.WebAppInfo(url="https://boredtap.netlify.app/")
        )

        # add buttons to inline keyboard
        inline_keyboard.add(launch_btn)
        inline_keyboard.add(join_community_btn)

        # send welcome message
        with open("./boredtap.png", "rb") as welcome_photo:
            bot.send_photo(
                message.chat.id, photo=welcome_photo,
                caption=f"""
                Hey, {referred_user.username}!👋 Welcome to BoredTap!\
                Tap, complete tasks, and stack up your coins!\
                
                BoredTap is a fun and rewarding platform where users earn \
                coins by engaging with the app’s features. The more you \
                tap, the more you earn--simple!\
                
                Invite your friends, family & colleagues to join the game! \
                More taps = More coins = More rewards! 🚀🔥.
                """,
                reply_markup=inline_keyboard
            )

    # except user already exist
    except HTTPException as e:
        print(f"HTTPException encountered: {e}")

        # set welcome message action button
        print(f"Error encountered: {e}")
        launch_btn = InlineKeyboardButton(
            text="Launch App",
            # callback_data="launch_webapp",
            web_app=telebot.types.WebAppInfo(url="https://boredtap.netlify.app/")
        )
        inline_keyboard = InlineKeyboardMarkup(row_width=1)
        inline_keyboard.add(launch_btn)
        inline_keyboard.add(join_community_btn)

        # send welcome message
        try:
            print("sending photo ...")
            with open("./boredtap.png", "rb") as welcome_photo:
                bot.send_photo(
                    message.chat.id, photo=welcome_photo,
                    # caption=f"Welcome back, {username}!\nPerform tasks and earn coins!",
                    caption=f"""
Hey, {username}!👋\nWelcome to BoredTap!\nTap, complete tasks, and stack up your coins!

BoredTap is a fun and rewarding platform where users earn coins by engaging with the app's features. \nThe more you tap, the more you earn--simple!

Invite your friends, family & colleagues to join the game!\nMore taps = More coins = More rewards! 🚀🔥.
""",
                    reply_markup=inline_keyboard
                )
                print("photo sent")
        except Exception as e:
            print(f"Error sending photo: {e}")
    
    except IndexError:
        print(f"Warning: Referral code not provided by user {user_id}.")
        bot.send_message(message.chat.id, "Please provide a referral code after the /start command.")

    except Exception as e:
        print(f"Error: {e}")

    print(f"Start command handled for user {username, user_id}")

