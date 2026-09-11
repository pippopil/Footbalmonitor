import os

SSTATS_API_KEY = os.getenv("SSTATS_API_KEY", "4dm5q8an48lgscfe")
SSTATS_BASE_URL = "https://api.sstats.net"

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8948010662:AAFOiDTHv4zaDVgkrDEsBnSC7EdsLuekWvk")
TELEGRAM_USE_BOTGATE = False
BOTGATE_API_KEY = os.getenv("BOTGATE_API_KEY", "")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_PATH = os.path.join(BASE_DIR, "data", "app.db")
EXCEL_PATH = os.path.join(BASE_DIR, "data", "signals.xlsx")

CHECK_INTERVAL = 120
DEFAULT_CHAT_ID = 295117406

PROXY_URL = os.getenv("PROXY_URL", "")

# Источник данных
DATA_SOURCE = os.getenv("DATA_SOURCE", "sstats")
FALLBACK_SOURCE = os.getenv("FALLBACK_SOURCE", "")  # отключаем fallback для стабильности

# Кэширование
CACHE_TTL = 60
RETRY_ATTEMPTS = 3
RETRY_DELAY = 2