#!/usr/bin/env python3
"""
Footbalmonitor - 1xBet Live Collector Script
Скрипт для сбора live-матчей с 1xBet / 1хСтавка
Запуск:
  python scripts/1xbet_collector.py
"""

import sys
import time
import json
import urllib.request
import urllib.error

FOOTBALMONITOR_URL = "http://localhost:3000/api/feed/ingest"
WEBHOOK_SECRET = "footbalmonitor_secret_key_2026"
POLL_INTERVAL = 15

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8",
}

def parse_1xbet_live():
    url = "http://localhost:3000/api/datasources/live?source=1xbet&disable_fallback=1"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("ok") and data.get("matches"):
                return data["matches"]
    except Exception as e:
        print(f"[-] Инфо: опрос шлюза 1xBet: {e}")
    return []

def send_to_footbalmonitor(matches):
    if not matches:
        return 0
    payload = json.dumps({
        "secret": WEBHOOK_SECRET,
        "source": "1xBet Live",
        "matches": matches
    }).encode("utf-8")

    req = urllib.request.Request(
        FOOTBALMONITOR_URL,
        data=payload,
        headers={"Content-Type": "application/json", "User-Agent": "Footbalmonitor-1xBet-Collector/1.0"}
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            res = json.loads(resp.read().decode("utf-8"))
            return res.get("receivedCount", len(matches))
    except Exception as e:
        print(f"[-] Ошибка отправки вебхука в Footbalmonitor: {e}")
        return 0

def main():
    print("=" * 60)
    print("  Footbalmonitor - 1xBet Live Collector Daemon")
    print(f"  Целевой URL: {FOOTBALMONITOR_URL}")
    print(f"  Интервал опроса: {POLL_INTERVAL} сек")
    print("=" * 60)

    cycle = 1
    while True:
        try:
            print(f"[{time.strftime('%H:%M:%S')}] Цикл #{cycle}: сбор событий 1xBet Live...")
            matches = parse_1xbet_live()
            if matches:
                sent = send_to_footbalmonitor(matches)
                print(f"[+] Успешно доставлено: {sent} матчей в Footbalmonitor")
            else:
                print("[!] Событий не найдено")
        except KeyboardInterrupt:
            print("\nСборщик остановлен.")
            sys.exit(0)
        except Exception as e:
            print(f"[-] Ошибка: {e}")

        cycle += 1
        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()
