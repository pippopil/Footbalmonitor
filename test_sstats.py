"""
Тестовый скрипт для проверки работы SStatsClient.
Запуск: py test_sstats.py
"""

import json
import logging
from app.sstats_client import SStatsClient
from app.config import SSTATS_API_KEY, SSTATS_BASE_URL

# Настроим логирование, чтобы видеть, что происходит
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

def pretty_print(data, title):
    """Выводит данные в читаемом формате."""
    print(f"\n{'='*60}")
    print(f"📊 {title}")
    print('='*60)
    if isinstance(data, list):
        print(f"Количество записей: {len(data)}")
        # Покажем первые 2 элемента для наглядности
        for i, item in enumerate(data[:2]):
            print(f"\n--- Элемент {i+1} ---")
            print(json.dumps(item, indent=2, ensure_ascii=False)[:1000] + ("..." if len(json.dumps(item)) > 1000 else ""))
        if len(data) > 2:
            print(f"\n... и ещё {len(data)-2} записей")
    else:
        print(json.dumps(data, indent=2, ensure_ascii=False)[:2000] + ("..." if len(json.dumps(data)) > 2000 else ""))

def main():
    print("🚀 Запуск тестов SStatsClient")
    print(f"Базовый URL: {SSTATS_BASE_URL}")
    print(f"API ключ: {'установлен' if SSTATS_API_KEY else 'не установлен (работаем без ключа)'}")
    print()

    # Создаём клиент
    client = SStatsClient()

    # --- 1. Проверка получения списка лиг ---
    print("📌 1. Получение списка лиг...")
    leagues = client.get_leagues()
    if leagues:
        pretty_print(leagues, "Список лиг (первые 2)")
        print("✅ Лиги получены успешно!")
    else:
        print("❌ Не удалось получить лиги")
        return

    # --- 2. Проверка получения live-матчей ---
    print("\n📌 2. Получение live-матчей...")
    live_matches = client.get_live_matches()
    if live_matches:
        pretty_print(live_matches, "Live-матчи (первые 2)")
        print("✅ Live-матчи получены!")
    else:
        print("⚠️ Нет live-матчей (это нормально, если сейчас нет игр)")

    # --- 3. Проверка получения деталей матча (на примере конкретного матча) ---
    TEST_MATCH_ID = 1183255  # из документации
    print(f"\n📌 3. Получение деталей матча ID {TEST_MATCH_ID}...")
    details = client.get_match_details(TEST_MATCH_ID)
    if details:
        pretty_print(details, f"Детали матча {TEST_MATCH_ID}")
        print("✅ Детали матча получены!")
    else:
        print(f"❌ Не удалось получить детали матча {TEST_MATCH_ID}")

    # --- 4. Проверка получения коэффициентов ---
    print(f"\n📌 4. Получение коэффициентов для матча {TEST_MATCH_ID}...")
    odds = client.get_match_odds(TEST_MATCH_ID, live=False)
    if odds:
        pretty_print(odds, f"Коэффициенты матча {TEST_MATCH_ID}")
        print("✅ Коэффициенты получены!")
    else:
        print(f"⚠️ Коэффициенты не найдены для матча {TEST_MATCH_ID}")

    # --- 5. Проверка получения Glicko-прогноза ---
    print(f"\n📌 5. Получение Glicko-прогноза для матча {TEST_MATCH_ID}...")
    glicko = client.get_glicko(TEST_MATCH_ID)
    if glicko:
        pretty_print(glicko, f"Glicko-прогноз для матча {TEST_MATCH_ID}")
        print("✅ Glicko-прогноз получен!")
    else:
        print(f"⚠️ Glicko-прогноз не найден для матча {TEST_MATCH_ID}")

    # --- 6. Проверка исторических данных (H2H) ---
    # Для этого нам нужны ID команд из матча. Если детали получены, возьмём оттуда.
    if details and 'home' in details and 'away' in details:
        home_id = details['home'].get('id')
        away_id = details['away'].get('id')
        if home_id and away_id:
            print(f"\n📌 6. Получение H2H между {home_id} и {away_id}...")
            h2h = client.get_head_to_head(home_id, away_id, limit=3)
            pretty_print(h2h, f"H2H между командами (последние 3 матча)")
            print("✅ H2H получен!")
        else:
            print("⚠️ Не удалось определить ID команд для H2H")
    else:
        print("⚠️ Нет данных для проверки H2H")

    # --- 7. Проверка последних матчей команды ---
    if details and 'home' in details:
        home_id = details['home'].get('id')
        if home_id:
            print(f"\n📌 7. Получение последних матчей команды {home_id} (дома)...")
            recent = client.get_team_recent_matches(home_id, venue='home', limit=3)
            pretty_print(recent, f"Последние домашние матчи команды {home_id}")
            print("✅ Последние матчи получены!")
        else:
            print("⚠️ Не удалось определить ID хозяев")
    else:
        print("⚠️ Нет данных для проверки последних матчей")

    print("\n✅ Тестирование завершено!")

if __name__ == "__main__":
    main()
