# 🗄️ Схема Базы Данных (Database Schema & ER Diagram)

В данном документе представлена целевая реляционная схема базы данных для промышленного развёртывания (PostgreSQL / Supabase / SQLite).

---

## 1. ER-Диаграмма сущностей (Entity-Relationship Diagram)

```mermaid
erDiagram
    USERS ||--o{ TELEGRAM_BOTS : "owns"
    USERS ||--o{ FILTER_RULES : "configures"
    USERS ||--o{ USER_NOTIFICATIONS : "receives"
    
    TELEGRAM_BOTS ||--o{ SIGNALS : "dispatches"
    
    FILTER_RULES ||--o{ SIGNALS : "triggers"
    
    MATCHES ||--o{ MATCH_SNAPSHOTS : "has_history"
    MATCHES ||--o{ SIGNALS : "generates"

    USERS {
        uuid id PK
        varchar username
        varchar email
        varchar role "ADMIN | SUBSCRIBER | GUEST"
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    TELEGRAM_BOTS {
        uuid id PK
        uuid user_id FK
        varchar bot_name
        varchar bot_token_encrypted
        bigint default_chat_id
        boolean is_default
        boolean is_connected
        timestamp created_at
    }

    FILTER_RULES {
        varchar id PK
        uuid user_id FK
        varchar name
        text description
        varchar category "goals | corners | halftime | comeback | odds_drop | custom"
        varchar rule_type "LIVE | PREMATCH"
        boolean enabled
        int min_minute
        int max_minute
        varchar score_condition
        float min_pressure_index
        float min_dangerous_attacks_total
        float min_shots_on_target_total
        float min_xg_total
        varchar target_market
        boolean is_preset
        timestamp updated_at
    }

    MATCHES {
        varchar id PK
        varchar source "Flashscore | Sofascore | PublicFeed | SStats"
        varchar league
        varchar country
        varchar home_team
        varchar away_team
        varchar status "PREMATCH | LIVE | HT | FT"
        int minute
        int home_score
        int away_score
        jsonb current_stats
        jsonb odds
        timestamp kickoff_time
    }

    MATCH_SNAPSHOTS {
        uuid id PK
        varchar match_id FK
        int minute
        int home_score
        int away_score
        jsonb stats
        jsonb odds
        timestamp created_at
    }

    SIGNALS {
        uuid id PK
        varchar rule_id FK
        varchar match_id FK
        uuid bot_id FK
        int minute
        varchar score_at_signal
        varchar target_market
        float odds
        varchar outcome "WIN | LOSS | REFUND | PENDING"
        float profit
        text telegram_message_id
        timestamp created_at
        timestamp resolved_at
    }
```

---

## 2. Ключевые таблицы и индексы

1. **`filter_rules`**: Индексы по `(user_id, enabled)` и `(min_minute, max_minute)`. Позволяет быстро отбирать активные фильтры при сканировании матча на заданной минуте.
2. **`matches`**: Индекс по `(status, minute)` для мгновенной выборки всех текущих Live-матчей.
3. **`signals`**: Индекс по `(match_id, rule_id)` с ограничением уникальности, предотвращающим повторную отправку дублирующих алертов по одному и тому же фильтру в одном матче.
4. **`telegram_bots`**: Токен бота хранится в зашифрованном виде (`bot_token_encrypted`) и маскируется в API-ответах.
