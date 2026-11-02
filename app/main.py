import threading
import uvicorn
from app.config import *
from app.telegram_bot import TelegramBot
from app.excel_exporter import ExcelExporter
from app.scheduler import MatchScheduler
from app.web.routes import router as web_router
from app.data_client import get_data_client
from fastapi import FastAPI
from app import database as db
import logging

logging.basicConfig(level=logging.INFO)

app = FastAPI()
app.include_router(web_router)

def main():
    db.init_db()
    data_client = get_data_client()  # возвращает DataClient с fallback
    bot = TelegramBot(token=TELEGRAM_BOT_TOKEN, use_botgate=TELEGRAM_USE_BOTGATE)
    excel = ExcelExporter()
    scheduler = MatchScheduler(data_client, bot, excel)
    scheduler.start()

    def run_web():
        uvicorn.run(app, host="0.0.0.0", port=8000)

    web_thread = threading.Thread(target=run_web, daemon=True)
    web_thread.start()

    def run_bot():
        bot.run_polling()

    bot_thread = threading.Thread(target=run_bot, daemon=True)
    bot_thread.start()

    try:
        while True:
            import time
            time.sleep(1)
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main()