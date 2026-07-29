import threading
import uvicorn
from app.config import *
from app.sstats_client import SStatsClient
from app.telegram_bot import TelegramBot
from app.excel_exporter import ExcelExporter
from app.scheduler import MatchScheduler
from app.web.routes import router as web_router
from fastapi import FastAPI
from app import database as db
import logging

logging.basicConfig(level=logging.DEBUG)  # было INFO
logger = logging.getLogger(__name__)

app = FastAPI()
app.include_router(web_router)

def main():
    db.init_db()

    sstats = SStatsClient()
    bot = TelegramBot(token=TELEGRAM_BOT_TOKEN, use_botgate=TELEGRAM_USE_BOTGATE)
    excel = ExcelExporter()

    scheduler = MatchScheduler(sstats, bot, excel, DEFAULT_CHAT_ID)
    scheduler.start()

    def run_web():
        uvicorn.run(app, host="0.0.0.0", port=8000)

    web_thread = threading.Thread(target=run_web, daemon=True)
    web_thread.start()
    logger.info("Веб-сервер запущен на http://0.0.0.0:8000")

    def run_bot():
        try:
            bot.run_polling()
        except Exception as e:
            logger.error(f"Ошибка в потоке бота: {e}", exc_info=True)

    bot_thread = threading.Thread(target=run_bot, daemon=True)
    bot_thread.start()
    logger.info("Поток бота запущен")

    try:
        while True:
            import time
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Завершение работы...")

if __name__ == "__main__":
    main()