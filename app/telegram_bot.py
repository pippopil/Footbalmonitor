import asyncio
import logging
import time
import httpx
from app import database as db
from app.config import TELEGRAM_BOT_TOKEN, TELEGRAM_USE_BOTGATE, PROXY_URL

logger = logging.getLogger(__name__)

class TelegramBot:
    def __init__(self, token: str = TELEGRAM_BOT_TOKEN, use_botgate: bool = TELEGRAM_USE_BOTGATE):
        self.token = token
        self.use_botgate = use_botgate
        self.base_url = f"https://api.telegram.org/bot{token}"
        self.client = None
        self.async_client = None
        self.last_update_id = 0
        self.running = False

    def _get_sync_client(self):
        if self.client is None:
            kwargs = {"timeout": 30.0}
            if PROXY_URL:
                kwargs["proxy"] = PROXY_URL
            self.client = httpx.Client(**kwargs)
        return self.client

    async def _get_async_client(self):
        if self.async_client is None:
            kwargs = {"timeout": 30.0}
            if PROXY_URL:
                kwargs["proxy"] = PROXY_URL
            self.async_client = httpx.AsyncClient(**kwargs)
        return self.async_client

    async def send_message(self, chat_id: int, text: str):
        """Асинхронно отправляет сообщение через Telegram API."""
        try:
            client = await self._get_async_client()
            url = f"{self.base_url}/sendMessage"
            payload = {
                "chat_id": chat_id,
                "text": text,
                "parse_mode": "HTML"
            }
            resp = await client.post(url, json=payload, timeout=30)
            if resp.status_code == 400 and "chat not found" in resp.text:
                logger.warning(f"Чат {chat_id} не найден (пользователь не начал диалог с ботом)")
            elif resp.status_code != 200:
                logger.error(f"Ошибка отправки: {resp.status_code} {resp.text}")
            else:
                logger.info(f"Сообщение отправлено в {chat_id}")
        except Exception as e:
            logger.error(f"Ошибка отправки: {e}")

    def send_message_sync(self, chat_id: int, text: str):
        """Синхронная версия для поллинга."""
        try:
            client = self._get_sync_client()
            url = f"{self.base_url}/sendMessage"
            payload = {
                "chat_id": chat_id,
                "text": text,
                "parse_mode": "HTML"
            }
            resp = client.post(url, json=payload, timeout=30)
            if resp.status_code == 400 and "chat not found" in resp.text:
                logger.warning(f"Чат {chat_id} не найден (пользователь не начал диалог с ботом)")
            elif resp.status_code != 200:
                logger.error(f"Ошибка отправки: {resp.status_code} {resp.text}")
            else:
                logger.info(f"Сообщение отправлено в {chat_id}")
        except Exception as e:
            logger.error(f"Ошибка отправки: {e}")

    def _handle_update(self, update):
        if "message" in update:
            message = update["message"]
            chat_id = message["chat"]["id"]
            if "text" in message and message["text"].startswith("/start"):
                db.create_user(chat_id)
                web_url = "http://localhost:8000"
                link = f"{web_url}/?chat_id={chat_id}"
                self.send_message_sync(
                    chat_id,
                    f"✅ Бот активирован!\n"
                    f"Перейдите по ссылке для настройки фильтров:\n{link}\n\n"
                    f"Также вы можете управлять чёрным списком лиг."
                )
                logger.info(f"Пользователь {chat_id} зарегистрирован")

    def _poll_updates(self):
        client = self._get_sync_client()
        while self.running:
            try:
                url = f"{self.base_url}/getUpdates"
                params = {
                    "offset": self.last_update_id + 1,
                    "timeout": 30,
                    "allowed_updates": ["message"]
                }
                resp = client.get(url, params=params, timeout=35)
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("ok"):
                        for update in data.get("result", []):
                            self.last_update_id = update["update_id"]
                            self._handle_update(update)
                else:
                    logger.error(f"Ошибка getUpdates: {resp.status_code}")
            except Exception as e:
                logger.error(f"Ошибка в цикле поллинга: {e}")
            time.sleep(1)

    def run_polling(self):
        self.running = True
        logger.info("Запуск поллинга Telegram (без PTB)...")
        try:
            self._poll_updates()
        except KeyboardInterrupt:
            self.running = False
            logger.info("Поллинг остановлен")
        finally:
            if self.client:
                self.client.close()
            if self.async_client:
                asyncio.run(self.async_client.aclose())