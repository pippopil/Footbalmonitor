import os

# SStats
SSTATS_API_KEY = os.getenv("SSTATS_API_KEY", "4dm5q8an48lgscfe")
SSTATS_BASE_URL = "https://api.sstats.net"

# Telegram
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8948010662:AAFOiDTHv4zaDVgkrDEsBnSC7EdsLuekWvk")  # ваш токен
TELEGRAM_USE_BOTGATE = False
BOTGATE_API_KEY = os.getenv("BOTGATE_API_KEY", "")

# Chat ID (ваш реальный)
DEFAULT_CHAT_ID = 295117406   # вставьте сюда свой chat_id

# Пути
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_PATH = os.path.join(BASE_DIR, "data", "app.db")
EXCEL_PATH = os.path.join(BASE_DIR, "data", "signals.xlsx")

# Интервал
CHECK_INTERVAL = 30