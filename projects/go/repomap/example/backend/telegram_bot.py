# Фрагмент Telegram-бота для демонстрации RepoMap.
from telegram import InlineKeyboardButton
from telegram.ext import CommandHandler

def greet(update, context):
    return [InlineKeyboardButton("Каталог", callback_data="open_catalog")]

def help_command(update, context):
    return [InlineKeyboardButton("Контакты", callback_data="open_contact")]

handlers = [CommandHandler("start", greet), CommandHandler("help", help_command)]
