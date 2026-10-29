# 🌐 REST API & Webhooks Documentation

Спецификация серверных эндпоинтов FastAPI и протоколов вебхуков сервиса Football Monitor.

---

## 1. Базовый URL и Аутентификация

- **Local Development:** `http://localhost:8000` или `http://localhost:3000/api`
- **Заголовки безопасности:**
  - `X-Webhook-Secret: <SECRET_KEY>` — обязателен для входящих вебхуков со стримом матчей.
  - `Authorization: Bearer <TOKEN>` — для защищенных эндпоинтов панели управления.

---

## 2. Эндпоинты Live-матчей и Парсеров

### `GET /api/matches`
Получение списка текущих матчей (лайв и предматч).

- **Query-параметры:**
  - `status` (опционально): `LIVE`, `PREMATCH`, `FINISHED`
  - `league` (опционально): фильтр по названию лиги
- **Пример ответа (200 OK):**
```json
{
  "count": 1,
  "matches": [
    {
      "id": "match-esp-1",
      "league": "La Liga",
      "country": "Spain",
      "homeTeam": "Real Madrid",
      "awayTeam": "Barcelona",
      "minute": 68,
      "score": [1, 1],
      "status": "LIVE",
      "stats": {
        "shotsOnTarget": [7, 5],
        "corners": [6, 4],
        "dangerousAttacks": [75, 58],
        "xg": [1.95, 1.45]
      },
      "odds": {
        "home": 2.10,
        "draw": 3.40,
        "away": 3.60,
        "over25": 1.74
      }
    }
  ]
}
```

---

### `POST /api/webhook/matches`
Входящий Webhook для приёма потока матчей от внешних парсеров или браузерного реле (Flashscore / Sofascore Browser Relay).

- **Заголовок:** `X-Webhook-Secret: footbalmonitor_secret_key`
- **Тело запроса (200 OK):**
```json
{
  "source": "FlashscoreRelay",
  "timestamp": "2026-09-28T09:00:00Z",
  "matches": [ ... ]
}
```

---

## 3. Эндпоинты фильтров и бэктестинга

### `GET /api/filters`
Список всех активных и предустановленных стратегий.

### `POST /api/backtest/run`
Запуск исторического бэктеста по правилу фильтра на массиве исторических матчей.

- **Тело запроса:**
```json
{
  "filter": {
    "id": "strat-4",
    "name": "⚽ А ГДЕ ЖЕ ГОЛ!!! v2.0",
    "minMinute": 50,
    "maxMinute": 68,
    "scoreCondition": "0-0",
    "targetMarket": "ТБ 0.5 в матче"
  },
  "datasetSize": 500
}
```

- **Ответ (200 OK):**
```json
{
  "ruleId": "strat-4",
  "totalMatchesScanned": 500,
  "totalSignals": 84,
  "wins": 79,
  "losses": 5,
  "refunds": 0,
  "winRate": 94.0,
  "totalProfit": 51.88,
  "roi": 61.76,
  "avgOdds": 1.72,
  "leagueStats": [ ... ]
}
```

---

## 4. Эндпоинты Telegram-бота

### `POST /api/telegram/send_test`
Отправка тестового уведомления в Telegram через настроенного бота.

- **Тело запроса:**
```json
{
  "botToken": "123456789:ABCdefGHI...",
  "chatId": "-1001234567890",
  "message": "🔔 Тестовый сигнал Football Monitor"
}
```
