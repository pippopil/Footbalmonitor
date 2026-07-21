import os

# --- SStats.net ---
SSTATS_API_KEY = os.getenv("SSTATS_API_KEY", "ваш_ключ_от_sstats")
SSTATS_BASE_URL = "https://api.sstats.net"

# --- Telegram ---
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "ваш_токен_бота")
TELEGRAM_USE_BOTGATE = True
BOTGATE_API_KEY = os.getenv("BOTGATE_API_KEY", "")   # если требуется

# --- База данных ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_PATH = os.path.join(BASE_DIR, "data", "app.db")

# --- Excel ---
EXCEL_PATH = os.path.join(BASE_DIR, "data", "signals.xlsx")

# --- Интервал проверки (сек) ---
CHECK_INTERVAL = 30

# --- Чат ID (временно фиксированный, потом сделать авторизацию) ---
DEFAULT_CHAT_ID = 123456789  # замените на свой chat_id