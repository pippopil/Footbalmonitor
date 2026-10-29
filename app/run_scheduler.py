#!/usr/bin/env python3
"""
Dedicated entry point for running the Match Scanner & Scheduler worker as an isolated service.
"""
import time
import logging
from app.config import TELEGRAM_BOT_TOKEN, TELEGRAM_USE_BOTGATE
from app.data_client import get_data_client
from app.telegram_bot import TelegramBot
from app.excel_exporter import ExcelExporter
from app.scheduler import MatchScheduler
from app import database as db

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] [SchedulerService] %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    logger.info("Initializing Database for Scheduler Service...")
    db.init_db()

    data_client = get_data_client()
    bot = TelegramBot(token=TELEGRAM_BOT_TOKEN, use_botgate=TELEGRAM_USE_BOTGATE)
    excel = ExcelExporter()
    
    logger.info("Starting Match Scheduler background parsing loop...")
    scheduler = MatchScheduler(data_client, bot, excel)
    scheduler.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Scheduler service stopped gracefully.")

if __name__ == '__main__':
    main()
