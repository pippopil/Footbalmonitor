#!/usr/bin/env python3
"""
Dedicated entry point for running the Telegram Bot worker as an isolated service.
"""
import logging
from app.config import TELEGRAM_BOT_TOKEN, TELEGRAM_USE_BOTGATE
from app.telegram_bot import TelegramBot
from app import database as db

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] [TelegramBotService] %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    logger.info("Initializing Database for Telegram Bot Service...")
    db.init_db()

    if not TELEGRAM_BOT_TOKEN:
        logger.warning("TELEGRAM_BOT_TOKEN is not configured. Running in idle mock mode.")
    
    logger.info("Starting Telegram Bot long-polling worker...")
    bot = TelegramBot(token=TELEGRAM_BOT_TOKEN, use_botgate=TELEGRAM_USE_BOTGATE)
    try:
        bot.run_polling()
    except KeyboardInterrupt:
        logger.info("Telegram Bot service stopped gracefully.")

if __name__ == '__main__':
    main()
