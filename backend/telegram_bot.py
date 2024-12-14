from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import telebot
import telegram
from telegram.ext import Updater, CommandHandler
from config import get_settings


# initialize telegram bot application
BotToken = get_settings().bot_token
bot = telebot.TeleBot(token=BotToken)

@bot.message_handler(func=lambda message: True)
def echo_all(message):
    bot.reply_to(message, message.text)

bot.polling()









# set webhook url
# bot.set_webhook(url="")

# @app.post('/webhook')
# async def webhook_handler(update):
#     # parse request body as json
#     # update = await request.json()

#     # Process the update here
#     if update.message:
#         text = update.message.text
#         chat_id = update.message.chat.id
#         bot.send_message(chat_id=chat_id, text=f"You said: {text}")
#     # elif update.callback_query:
#     #     call = update.callback_query
#     #     # Handle callback query
#     #     bot.answer_callback_query(call.id, f"You clicked {call.data}")
#     # print(update)
#         return {'message': 'Webhook received'}
