import telebot
from config import get_settings
from fastapi import FastAPI, Request



trial = FastAPI()

BotToken = get_settings().bot_token
bot = telebot.TeleBot(token=BotToken)

@trial.post('/webhook')
async def webhook(request: Request):
    update: telebot.types.Update = await request.json()

    # update bot with the received data
    bot.process_new_updates([telebot.types.Update.de_json(update)])

    return {'message': 'Webhook received'}

@bot.message_handler(commands=['start'])
def start_command(message):

    bot.send_message(
        message.chat.id, f"run webapp here: https://veenzent.netlify.app"
    )


if __name__ == "__telegram_bot__":
    import uvicorn
    uvicorn.run(trial, host="0.0.0.0", port=8000)


# initialize telegram bot application
# BotToken = get_settings().bot_token
# bot = telebot.TeleBot(token=BotToken)

# @bot.message_handler(func=lambda message: True)
# def echo_all(message):
#     bot.reply_to(message, message.text)

# bot.polling()










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





"""
TELEGRAM BOT
"""
# from decimal import DefaultContext
# from typing import Final
# from telegram import Update, WebAppInfo
# from telegram.ext import (
#     Application,
#     CommandHandler,
#     MessageHandler,
#     filters,
#     ContextTypes
# )


# TOKEN: Final = "7684929253:AAHyLYTuFPAu-RKELx2KK-aYhwcmevU7Aaw"
# BOT_USERNAME: Final = "@veenzent_bot"

# # commands
# async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
#     context.bot.send_message(
#         chat_id=update.effective_chat.id,
#         text="Click the button to launch webapp.",
#         reply_markup={
#             "inline_keyboard": [
#                 {
#                     "text": "Launch Web App",
#                     "url": "https://veenzent.netlify.app/"
#                 }
#             ]
#         }
#     )
#     await update.message.reply_text("Hello! Welcome to Lulu's Fragrance bot.")


# if __name__ == '__main__':
#     print('Starting bot...')
#     app = Application.builder().token(TOKEN).build()

#     # COMMANDS
#     app.add_handler(CommandHandler('start', start_command))
#     app.add_handler(CommandHandler('help', help_command))
#     app.add_handler(CommandHandler('custom', custom_command))

#     # MESSAGES
#     app.add_handler(MessageHandler(filters.Text, handle_message))

#     # ERRORS
#     app.add_error_handler(error)

#     print('Polling')
#     app.run_polling(poll_interval=3)
