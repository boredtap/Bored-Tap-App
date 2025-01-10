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





"""
TELEGRAM BOT
"""
from decimal import DefaultContext
from typing import Final
from telegram import Update, WebAppInfo
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    filters,
    ContextTypes
)


TOKEN: Final = "7684929253:AAHyLYTuFPAu-RKELx2KK-aYhwcmevU7Aaw"
BOT_USERNAME: Final = "@veenzent_bot"

# commands
async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    #await update.message.reply_text("Hello! Welcome to Lulu's Fragrance bot.")
    await update.message.reply_text("Hello! Welcome to Lulu's Fragrance bot.")

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Hello! Welcome to Lulu's Fragrance bot.")

async def custom_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Hello! Welcome to Lulu's Fragrance bot.")


# responses
def handle_response(text: str) -> str:
    processed: str = text.lower()

    if 'hello' in processed:
        return 'Hey there'
    
    return "I do not understand what you wrote..."


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message_type: str = update.message.chat.type
    text: str = update.message.text

    print(f"User ({update.message.chat.id} in {message_type}: {text})")

    if message_type == 'group':
        if BOT_USERNAME in text:
            new_text: str = text.replace(BOT_USERNAME, '').strip()
            response: str = handle_response(new_text)
        else:
            return
    else:
        response:str = handle_response(text)

    print('Bot', response)
    await update.message.reply_text(response)

async def error(update: Update, context: ContextTypes.DEFAULT_TYPE):
    print(f"Update {update} caused error {context.error}")


if __name__ == '__main__':
    print('Starting bot...')
    app = Application.builder().token(TOKEN).build()

    # COMMANDS
    app.add_handler(CommandHandler('start', start_command))
    app.add_handler(CommandHandler('help', help_command))
    app.add_handler(CommandHandler('custom', custom_command))

    # MESSAGES
    app.add_handler(MessageHandler(filters.Text, handle_message))

    # ERRORS
    app.add_error_handler(error)

    print('Polling')
    app.run_polling(poll_interval=3)
