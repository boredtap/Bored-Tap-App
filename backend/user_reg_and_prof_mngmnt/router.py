# from fastapi import APIRouter
import telebot
from telegram import Message
from config import get_settings

# starter = APIRouter()
BotToken = get_settings().bot_token
bot = telebot.TeleBot(BotToken)

@bot.message_handler(commands=['start'])
def launch_app(message: Message):
    markup = telebot.types.InlineKeyboardMarkup()
    markup.add(telebot.types.InlineKeyboardButton("Launch Web App", url="https://veenzent.netlify.app"))
    bot.send_message(message.chat.id, "Welcome! Click the button to launch the web app.", reply_markup=markup)
