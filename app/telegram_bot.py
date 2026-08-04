import logging
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
from app import database as db
from app.config import TELEGRAM_BOT_TOKEN, TELEGRAM_USE_BOTGATE

logger = logging.getLogger(__name__)

class TelegramBot:
    def __init__(self, token: str = TELEGRAM_BOT_TOKEN, use_botgate: bool = TELEGRAM_USE_BOTGATE):
        self.token = token
        self.use_botgate = use_botgate
        self.application = None

    async def send_message(self, chat_id: int, text: str):
        try:
            if self.application is None:
                logger.error("Application not initialized")
                return
            await self.application.bot.send_message(chat_id=chat_id, text=text)
        except Exception as e:
            logger.error(f"Send error: {e}")

    def run_polling(self):
        self.application = Application.builder().token(self.token).build()
        self.application.add_handler(CommandHandler("start", self.start_command))
        self.application.run_polling()

    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        chat_id = update.effective_chat.id
        db.create_user(chat_id)
        # Замените URL на реальный адрес вашего сервера
        web_url = "http://localhost:8000"  # или ваш внешний IP/домен
        link = f"{web_url}/?chat_id={chat_id}"
        await update.message.reply_text(
            f"✅ Бот активирован!\n"
            f"Перейдите по ссылке для настройки фильтров:\n{link}\n\n"
            f"Также вы можете управлять чёрным списком лиг."
        )