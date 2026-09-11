# 📋 Football Monitor — Полное описание проекта (README для передачи контекста)

## 🎯 О проекте

**Football Monitor** — веб-приложение + Telegram-бот для мониторинга футбольных матчей в реальном времени. Пользователь создаёт фильтры (по статистике, коэффициентам, Glicko, трендам), система проверяет live-матчи и отправляет уведомления в Telegram при совпадении условий. Есть архив сигналов, статистика эффективности фильтров, отслеживание коэффициентов.

**Цель проекта:** стать коммерческим SaaS-сервисом с подписками, рекламой и партнёрскими программами букмекеров.

---

## 📂 Структура проекта
Footbalmonitor/
├── app/
│ ├── init.py
│ ├── main.py # Точка входа: FastAPI + threading (веб + бот + планировщик)
│ ├── config.py # Конфигурация (токены, пути, интервалы, source)
│ ├── database.py # Работа с SQLite (все CRUD-операции)
│ ├── data_client.py # Фабрика клиентов с fallback (SStats ↔ Sofascore)
│ ├── sstats_client.py # Клиент для SStats API (с retry и safe_int)
│ ├── sofascore_client.py # Клиент для Sofascore (через sofascrape) — НОВЫЙ
│ ├── filter_engine.py # Логика проверки фильтров (статика + правила)
│ ├── scheduler.py # Планировщик: проверка матчей, обновление исходов
│ ├── telegram_bot.py # Telegram-бот (прямой HTTP, без PTB)
│ ├── excel_exporter.py # Экспорт сигналов в Excel
│ ├── agent.py # AI-агент (временно отложен)
│ ├── ai_agents.py # Мультиагентная система (YandexGPT, DeepSeek, Qwen) — эксперимент
│ └── web/
│ ├── routes.py # Все маршруты FastAPI
│ └── templates/ # Jinja2-шаблоны
│ ├── index.html
│ ├── filter_form.html
│ ├── edit_filter.html
│ ├── archive.html
│ ├── _signals_table.html
│ ├── _filter_table.html
│ ├── leagues.html
│ ├── filter_stats.html
│ └── agent.html
├── data/
│ ├── app.db # SQLite
│ └── signals.xlsx # Excel-экспорт
├── requirements.txt
└── README.md

---

## ✅ Что уже реализовано

### 1. Ядро проекта
- **FastAPI-сервер** на `http://0.0.0.0:8000` (с Jinja2 + Bootstrap 5).
- **Планировщик APScheduler** с тремя задачами:
  - `_check_all_users` — каждые 120 сек.
  - `_update_pending_outcomes` — каждые 60 сек.
  - `_check_odds_changes` — каждые 60 сек (сейчас отключён).
- **Многопоточность:** веб + Telegram-бот + планировщик запускаются параллельно.

### 2. База данных SQLite (`app/database.py`)
Таблицы:
- **`users`** — id, telegram_chat_id, поля для AI-агента.
- **`filters`** — 50+ полей (статистика, коэффициенты, Glicko, правила, ожидаемый исход, отслеживание коэффициентов, `name`).
- **`triggered_matches`** — id, match_id, filter_id, match_data (JSON), expected_outcome, actual_outcome, is_success, conditions.
- **`blacklisted_leagues`** — user_id, league_id, league_name.
- **`odds_tracking`** — filter_id, match_id, initial_value, current_value, triggered.
- **`odds_history`** — для истории коэффициентов (не используется).

Есть функция `migrate_db()` — автоматически добавляет новые колонки.

### 3. Клиенты данных
- **`sstats_client.py`** — работает, парсит статистику, но часто отдаёт 400 на детали матча.
  - `get_live_matches()`, `get_match_details()`, `get_match_odds()`, `get_glicko()`, `get_matches_by_date()`.
  - `safe_int()` — защита от None.
  - Retry-декоратор.
- **`sofascore_client.py`** — новый клиент через `sofascrape` + Playwright. Пока не протестирован.
- **`data_client.py`** — фабрика с fallback. `DATA_SOURCE = "sstats"` (переключается в `config.py`).

### 4. Движок фильтров (`filter_engine.py`)
- Проверка **статических полей** (время, голы, угловые, удары, ЖК, коэффициенты, Glicko, H2H).
- Проверка **комбинированных правил** (JSON: `stat`, `trend`) с логикой `AND`/`OR`.
- Защита от `list` вместо `dict` для odds.
- `determine_actual_outcome()` + `is_outcome_success()` — для статистики.

### 5. Планировщик (`scheduler.py`)
- Проверяет **live-матчи** или **завершённые** (сейчас переключён на завершённые за вчера-сегодня для теста).
- Отправляет уведомления в Telegram при срабатывании фильтра.
- Сохраняет сигналы в БД и Excel.
- **Исправлено:** ошибка `'list' object has no attribute 'get'` → добавлена проверка типа odds.
- **Исправлено:** None в статистике → `safe_int`.
- **Отключено:** отслеживание коэффициентов (для теста).

### 6. Telegram-бот (`telegram_bot.py`)
- **Прямой HTTP** через `httpx`, без python-telegram-bot.
- Команда `/start` регистрирует пользователя.
- Отправка уведомлений с полной статистикой матча.
- Обработка `chat not found`.

### 7. Веб-интерфейс
- **Главная** — фильтры с вкладками (Все / Активные / Неактивные) + вкладка «Сигналы» (AJAX).
- **Создание фильтра** — 5 вкладок: Основное, Статистика, Коэффициенты и Glicko, Правила, Отслеживание.
- **Редактирование фильтра** — то же, с подстановкой данных.
- **Архив сигналов** — фильтрация по дате, матчу, фильтру, пагинация, очистка.
- **Чёрный список лиг** — добавление/удаление.
- **Статистика фильтра** — процент успеха, распределение исходов.
- **AI-страница** (`agent.html`) — отложена.

### 8. Стиль уведомлений в Telegram
⚽ МАТЧ ПОДОШЕЛ ПОД ФИЛЬТР!

Home vs Away
🏆 Название турнира
⏱ 68'
Счет: 3-0
Угловые: 4 - 2
Удары всего: 12 - 8
Удары в створ: 5 - 2
ЖК: 1 - 2
Коэф: П1=1.5, Ничья=3.5, П2=6.25, Тотал 2.5 Овер=2.1

Ср. голов в личных встречах: 2.50
🧠 Glicko: П1=65%, Ничья=20%, П2=15%

🔹 Название фильтра

---

## 🚧 На каком этапе сейчас

**Этап: стабилизация ядра.**

- ✅ Фильтры срабатывают и отправляют сигналы (тест на завершённых матчах).
- ✅ Архив и статистика работают.
- ⚠️ **Проблема:** SStats API возвращает 400 на `/games/{id}` — статистика в сигналах нулевая.
- ⚠️ **Решение:** переходим на Sofascore через `sofascrape`.
- ⚠️ **Telegram-бот** работает, но иногда теряет соединение (нужен VPN или прокси).

**Последние действия:**
1. Установлен `sofascrape` и `playwright`.
2. Создан `sofascore_client.py` (адаптер).
3. **Не выполнен** `playwright install chromium` — это нужно сделать перед первым запуском.

---

## 📌 Что предстоит сделать

### Ближайшие шаги (этап стабилизации):
1. **Установить Chromium** для Playwright:
   ```powershell
   py -m playwright install chromium
	     Протестировать sofascore_client.py:

        Запустить сервер с DATA_SOURCE = "sofascore".

        Проверить логи на ошибки парсинга sofascrape.

        Убедиться, что статистика приходит корректно.

    Исправить парсинг статистики Sofascore (если структура Event не совпадает с ожидаемой).

    Вернуть live-матчи после стабилизации:

        В scheduler.py заменить блок с get_matches_by_date на get_live_matches.

Среднесрочные задачи:

    Реализовать get_head_to_head и get_team_recent_matches для Sofascore.

    Добавить в фильтры условия по хоккею и баскетболу (мультиспорт).

    Улучшить Telegram-уведомления — добавить кнопки «Открыть в Sofascore», «Сделать ставку».

    Настроить fallback SStats ↔ Sofascore.

    Перенести проект на VPS для работы 24/7.

Долгосрочные задачи (монетизация и рост):

    Freemium-модель: Free (3 фильтра, архив за 3 дня) / Pro (499 ₽/мес).

    Регистрация и авторизация на сайте (email + пароль / Telegram OAuth).

    Интеграция платёжной системы (ЮKassa / CloudPayments).

    Партнёрские ссылки на БК в уведомлениях и на сайте.

    AI-ассистент (YandexGPT / DeepSeek) для анализа матчей и рекомендаций.

    Мобильное приложение (PWA → React Native).

    Маркетплейс фильтров (публичные фильтры с подписками).

    Бектестинг фильтров на исторических матчах.

    Мультиспорт (футбол, хоккей, баскетбол) — решает проблему «мёртвых сезонов».

🔑 Ключевые файлы и их назначение
Файл	Что делает
app/main.py	Запуск FastAPI + бота + планировщика
app/config.py	Токены, пути, DATA_SOURCE, CHECK_INTERVAL
app/database.py	CRUD для БД (users, filters, triggered, blacklist, odds_tracking)
app/data_client.py	Фабрика клиентов с fallback
app/sstats_client.py	Клиент SStats (работает, но отдаёт 400 на детали)
app/sofascore_client.py	Клиент Sofascore через sofascrape (новый, не протестирован)
app/filter_engine.py	Проверка фильтров (статика + правила)
app/scheduler.py	Планировщик проверок + отправка уведомлений
app/telegram_bot.py	Бот на прямых HTTP-запросах
app/web/routes.py	Все веб-маршруты
app/web/templates/*.html	Jinja2-шаблоны
🧩 Схема БД (кратко)

users — id, telegram_chat_id, agent_*
filters — id, user_id, name, match_time, total_goals/corners/shots/sot/yellow, home_/away_, odds_, glicko_, expected_outcome, rules, rule_logic, track_odds, odds_target, odds_change_threshold, is_active
triggered_matches — id, match_id, filter_id, triggered_at, match_data, expected_outcome, actual_outcome, is_success, conditions
blacklisted_leagues — id, user_id, league_id, league_name
odds_tracking — id, filter_id, match_id, initial_value, current_value, triggered
⚙️ Установка и запуск
1. Установка зависимостей
py -m pip install -r requirements.txt
py -m pip install sofascrape playwright
py -m playwright install chromium
2. Настройка app/config.py
TELEGRAM_BOT_TOKEN = "ваш_токен"
DEFAULT_CHAT_ID = 295117406  # ваш chat_id
PROXY_URL = ""  # если нужен прокси для Telegram
DATA_SOURCE = "sofascore"  # или "sstats"
CHECK_INTERVAL = 120
3. Запуск
py -m app.main
4. Открыть веб-интерфейс
http://localhost:8000/?chat_id=295117406
🐛 Известные проблемы
Проблема	Причина	Решение
SStats 400 на /games/{id}	Невалидный ключ или изменён эндпоинт	Перейти на Sofascore
Sofascore 403	Блокировка ботов	Использовать sofascrape + Playwright
Telegram WinError 10060	Блокировка в РФ	VPN или прокси (TGLock)
Нулевая статистика в сигналах	SStats не отдаёт детали	После перехода на Sofascore должно исправиться
Фильтры проверяют только завершённые матчи	Тестовый режим	Вернуть get_live_matches()
playwright не установлен	Не выполнен playwright install chromium	Выполнить команду
Ошибки 'list' object has no attribute 'get'	odds приходит как список	Исправлено в filter_engine.py и sstats_client.py
None в статистике	SStats отдаёт null	Исправлено через safe_int()
 Что помнить при продолжении

    Проект на этапе стабилизации ядра. Не начинать новые фичи, пока не работает основной сканер.

    SStats нестабилен. Основная ставка — на Sofascore (через sofascrape).

    AI-агенты отложены. Были попытки с YandexGPT и DeepSeek, но из-за ограничений по правам и балансу отложены.

    Монетизация в планах. Сначала стабильность, потом Freemium, партнёрки, реклама.

    Мультиспорт в планах (хоккей, баскетбол) — решает проблему мёртвых сезонов.

    Telegram-бот работает через прямой HTTP, без PTB.
		