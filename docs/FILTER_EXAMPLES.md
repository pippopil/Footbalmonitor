# 📋 Примеры конфигураций фильтров (JSON Rule Specifications)

В данном документе представлены эталонные JSON-конфигурации для системы фильтрации и стратегий Football Monitor.

---

## 1. ⚽ Стратегия на гол во 2-м тайме при 0:0 («А ГДЕ ЖЕ ГОЛ!!! v2.0»)

Срабатывает, когда явный фаворит давит по всем статьям во втором тайме, но мяч упорно не идёт в ворота.

```json
{
  "id": "strat-4",
  "name": "⚽ Стратегия 4: А ГДЕ ЖЕ ГОЛ!!! v2.0 (0:0 на 50-68')",
  "description": "0:0 на 50-68 мин, фаворит давит. Оп.атаки фаворита >= 40, разница >= 22, удары >= 7, створ >= 3.",
  "category": "goals",
  "ruleType": "LIVE",
  "enabled": true,
  "minMinute": 50,
  "maxMinute": 68,
  "scoreCondition": "0-0",
  "maxTotalGoals": 0,
  "minDangerousAttacksDiff": 22,
  "minTotalShots": 7,
  "minShotsOnTargetTotal": 3,
  "minPossessionDiff": 15,
  "minPressureIndex": 65,
  "targetMarket": "ТБ 0.5 в матче / Гол фаворита (~1.72)",
  "telegramEnabled": true,
  "color": "emerald",
  "isPreset": true
}
```

---

## 2. 🚩 Штурм угловых в концовке матча (75–87 мин)

Осада ворот проигрывающей в 1 мяч командой, вызывающая лавину угловых ударов.

```json
{
  "id": "strat-corner-assault-75",
  "name": "🚩 Штурм угловых в концовке 75-87' (ТБ угловых +2.0 ~1.72)",
  "description": "Разница ровно в 1 гол на 75-87'. Проигрывающая команда взвинчивает темп: общее число угловых >= 8, разница оп. атак >= 20. Ставка на ТБ угловых (+2) по высокому кэфу ~1.72.",
  "category": "corners",
  "ruleType": "LIVE",
  "enabled": true,
  "minMinute": 75,
  "maxMinute": 87,
  "scoreCondition": "ONE_GOAL_DIFF",
  "scoreDiffExactly1: true,
  "maxScoreDiff": 1,
  "minTotalCorners": 8,
  "minDangerousAttacksDiff": 20,
  "minPressureIndex": 65,
  "targetMarket": "ТБ угловых в концовке (+2) (~1.72)",
  "telegramEnabled": true,
  "color": "blue",
  "isPreset": true
}
```

---

## 3. 📉 Аномальный прогруз линии (Smart Money / Steam Move)

Детектирование вливания крупного капитала на бирже с резким падением котировок.

```json
{
  "id": "strat-smart-money-steam-live",
  "name": "📉 Smart Money Steam: Прогруз победы во 2Т (П1 ~1.70)",
  "description": "Лайв-прогруз на П1 / фору фаворита во 2Т (55-75') при ничейном счёте 0:0 или 1:1. Падение кэфа >=12%, доля денег >=65%, оп. атаки фаворита >=40. Винрейт >84%.",
  "category": "odds_drop",
  "ruleType": "LIVE",
  "enabled": true,
  "minMinute": 55,
  "maxMinute": 75,
  "scoreCondition": "DRAW",
  "maxTotalGoals": 2,
  "minOddsDropPercent": 12,
  "minMoneyVolumePercent": 65,
  "oddsDropMarket": "HOME",
  "targetMarket": "Победа фаворита с прогрузом (П1 / Фора 0) (~1.70)",
  "telegramEnabled": true,
  "color": "amber",
  "isPreset": true
}
```

---

## 4. ⏱️ Гол в 1-м тайме (HT Over 0.5 на 18–38 мин)

Ранний всплеск опасных атак в первом тайме при счете 0:0.

```json
{
  "id": "f-4",
  "name": "⏱️ Гол в 1-м тайме (HT Over 0.5 / 18-38 мин)",
  "description": "Ранний шквал опасных атак и ударов в створ при счете 0:0 до перерыва по повышенному коэффициенту.",
  "category": "halftime",
  "ruleType": "LIVE",
  "enabled": true,
  "minMinute": 18,
  "maxMinute": 38,
  "scoreCondition": "0-0",
  "maxTotalGoals": 0,
  "minDangerousAttacksTotal": 26,
  "minShotsOnTargetTotal": 2,
  "minPressureIndex": 50,
  "targetMarket": "ТБ 0.5 в 1-м тайме (~1.89)",
  "telegramEnabled": true,
  "color": "cyan",
  "isPreset": true
}
```

---

## 5. 🛡️ Сушка / Тотал Меньше в концовке (65–88 мин)

Матч с низкой динамикой, отсутствием ударов в створ и пассивной игрой.

```json
{
  "id": "f-7",
  "name": "🛡️ Сушка / Тотал Меньше (65-88 мин)",
  "description": "Низкий темп: минимум ударов и опасных атак. Команды доигрывают матч.",
  "category": "custom",
  "ruleType": "LIVE",
  "enabled": true,
  "minMinute": 65,
  "maxMinute": 88,
  "scoreCondition": "ANY",
  "maxDangerousAttacksTotal": 55,
  "maxShotsOnTargetTotal": 4,
  "maxPressureIndex": 45,
  "targetMarket": "ТМ (текущий тотал + 0.5) / ТМ 2.5 (~1.75)",
  "telegramEnabled": true,
  "color": "indigo",
  "isPreset": true
}
```
