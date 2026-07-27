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

logging.basicConfig(level=logging.INFO)

app = FastAPI()
app.include_router(web_router)

def main():
    # Инициализация БД
    db.init_db()

    # Клиент SStats
    sstats = SStatsClient()

    # Telegram бот
    bot = TelegramBot(token=TELEGRAM_BOT_TOKEN, use_botgate=TELEGRAM_USE_BOTGATE)

    # Excel
    excel = ExcelExporter()

    # Планировщик
    scheduler = MatchScheduler(sstats, bot, excel, DEFAULT_CHAT_ID)
    scheduler.start()

    # Запуск веб-сервера в отдельном потоке
    def run_web():
        uvicorn.run(app, host="0.0.0.0", port=8000)

    web_thread = threading.Thread(target=run_web, daemon=True)
    web_thread.start()

    # Запуск бота (polling) в отдельном потоке
    def run_bot():
        bot.run_polling()

    bot_thread = threading.Thread(target=run_bot, daemon=True)
    bot_thread.start()

    # Держим основной поток живым
    try:
        while True:
            import time
            time.sleep(1)
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main()