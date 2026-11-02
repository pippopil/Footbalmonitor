# -*- coding: utf-8 -*-
import json
import os

def run():
    dump_path = os.path.join(os.path.dirname(__file__), 'filters_dump.json')
    with open(dump_path, 'r', encoding='utf-8') as f:
        filters = json.load(f)

    md = []
    md.append('# 📊 FOOTBALMONITOR & SPORTSIGNAL AI — ИНВЕСТИЦИОННЫЙ МЕМОРАНДУМ И ПАСПОРТ КАРТОЧЕК\n')
    md.append('**Стадия проекта:** Live MVP 2.0 (Парсинг Фонбет, Flashscore, Telegram Push)')
    md.append('**Рыночная ниша:** Sports Big Data SaaS / Predictive Analytics / B2B Lead Generation')
    md.append('**Запрашиваемый раунд:** 10 000 000 ₽ (15–20% долевого участия / спонсорский пакет)')
    md.append('**Прогнозируемая чистая прибыль Год 1:** 41 530 000 ₽ (EBITDA Margin 58–71%)\n')
    md.append('---\n')
    md.append('## ЧАСТЬ 1. ФИНАНСОВЫЙ ПЛАН И БИЗНЕС-МОДЕЛЬ ДЛЯ СПОНСОРОВ И УЧРЕДИТЕЛЕЙ\n')
    md.append('### 1.1. Модель Монетизации (4 потока выручки)')
    md.append('1. **B2C SaaS Подписки:** Free (0 ₽), PRO Analyst (2 990 ₽/мес), VIP Club (7 990 ₽/мес). Доля: 52%.')
    md.append('2. **Партнерские интеграции БК (CPA / RevShare):** Winline, Fonbet, Pari. CPA 5 000 ₽ за первый депозит + RevShare 30%. Доля: 28%.')
    md.append('3. **Маркетплейс авторских стратегий:** 25% комиссии с продаж стратегий популярных капперов. Доля: 12%.')
    md.append('4. **B2B API доступ:** Подключение синдикатов к парсеру Fonbet и мат-ядру (49 900 ₽/мес). Доля: 8%.\n')

    md.append('### 1.2. Юнит-экономика')
    md.append('- **CAC (Customer Acquisition Cost):** 580 ₽')
    md.append('- **ARPU (Average Revenue Per User):** 3 850 ₽/мес')
    md.append('- **LTV (Lifetime Value):** 28 875 ₽')
    md.append('- **LTV / CAC:** 49.7x (высокая маржинальность софта)')
    md.append('- **Monthly Churn Rate:** 4.2% (низкий отток за счет Telegram-ботов)\n')

    md.append('### 1.3. Прогноз P&L на Год 1 (в рублях)')
    md.append('| Квартал | Платная база | Валовая выручка | OPEX | Чистая прибыль |')
    md.append('|---|---|---|---|---|')
    md.append('| Q1 (1-3 мес) | 250 чел. | 3 250 000 ₽ | 2 620 000 ₽ | 630 000 ₽ |')
    md.append('| Q2 (4-6 мес) | 700 чел. | 9 400 000 ₽ | 5 100 000 ₽ | 4 300 000 ₽ |')
    md.append('| Q3 (7-9 мес) | 1 500 чел. | 20 500 000 ₽ | 8 750 000 ₽ | 11 750 000 ₽ |')
    md.append('| Q4 (10-12 мес) | 2 800 чел. | 38 300 000 ₽ | 13 450 000 ₽ | 24 850 000 ₽ |')
    md.append('| **ИТОГО ГОД 1** | **2 800 чел.** | **71 450 000 ₽** | **29 920 000 ₽** | **41 530 000 ₽** |\n')

    md.append('---\n')
    md.append('## ЧАСТЬ 2. ПАСПОРТ И ПАРАМЕТРЫ ВСЕХ КАРТОЧЕК СИСТЕМЫ\n')
    md.append('### 2.1. Карточка живого матча (Match Card)')
    md.append('- **Заголовок:** Флаг, лига, команды, минута, счёт.')
    md.append('- **Статистика:** Опасные атаки, удары всего и в створ, угловые, владение %, xG.')
    md.append('- **Индекс давления:** Шкала 0–100 + вероятности гола (EXTREME, HIGH, MEDIUM, LOW).')
    md.append('- **Линия БК:** П1, X, П2, ТБ 2.5, IPT модель.')
    md.append('- **Бейджи сработавших фильтров:** Мгновенный переход к сработавшим стратегиям.\n')

    md.append('### 2.2. Карточки 50 авторских стратегий и алгоритмов\n')

    for idx, f in enumerate(filters, 1):
        md.append(f"#### №{idx}. {f.get('name', 'Фильтр')} (ID: {f.get('id', '')})")
        md.append(f"- **Описание:** {f.get('description', '')}")
        md.append(f"- **Тип и спорт:** {f.get('ruleType', 'LIVE')} | Спорт: {f.get('sport', 'football')}")
        md.append(f"- **Целевой рынок:** `{f.get('targetMarket', 'ТБ / Победа')}` (Кэф: ~{f.get('defaultOdds', 1.75)})")
        conds = []
        if f.get('minMinute') or f.get('maxMinute'):
            conds.append(f"Таймлайн: {f.get('minMinute', 0)}'-{f.get('maxMinute', 90)}'")
        if f.get('scoreCondition') and f.get('scoreCondition') != 'ANY':
            conds.append(f"Счет: {f.get('scoreCondition')}")
        if f.get('minDangerousAttacksDiff') is not None:
            conds.append(f"Разница оп. атак >= {f.get('minDangerousAttacksDiff')}")
        if f.get('minTotalShots') is not None:
            conds.append(f"Ударов всего >= {f.get('minTotalShots')}")
        if f.get('minShotsOnTargetTotal') is not None:
            conds.append(f"Ударов в створ >= {f.get('minShotsOnTargetTotal')}")
        if f.get('minTotalCorners') is not None:
            conds.append(f"Угловых всего >= {f.get('minTotalCorners')}")
        if f.get('minPressureIndex') is not None:
            conds.append(f"Индекс давления >= {f.get('minPressureIndex')}/100")
        if f.get('minXgTotal') is not None:
            conds.append(f"xG суммарный >= {f.get('minXgTotal')}")
        if f.get('minOddsDropPercent') is not None:
            conds.append(f"Падение кэфа >= -{f.get('minOddsDropPercent')}%")
        md.append(f"- **Параметры:** {', '.join(conds) if conds else 'Базовые параметры'}\n")

    out_path = os.path.join(os.path.dirname(__file__), '..', 'docs', 'INVESTMENT_DECK_AND_CARDS_MANUAL.md')
    with open(out_path, 'w', encoding='utf-8') as out:
        out.write('\n'.join(md))
    print(f'Saved {out_path}')

if __name__ == '__main__':
    run()
