import asyncio
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app import database as db
from app.filter_engine import check_filters, check_single_filter, determine_actual_outcome, is_outcome_success
from app.config import CHECK_INTERVAL

logger = logging.getLogger(__name__)

class MatchScheduler:
    def __init__(self, sstats, bot, excel):
        self.sstats = sstats
        self.bot = bot
        self.excel = excel
        self.scheduler = BackgroundScheduler()

    def start(self):
        self.scheduler.add_job(
            self._check_all_users,
            trigger=IntervalTrigger(seconds=CHECK_INTERVAL),
            id='check_matches',
            replace_existing=True
        )
        self.scheduler.add_job(
            self._update_pending_outcomes,
            trigger=IntervalTrigger(seconds=60),
            id='update_outcomes',
            replace_existing=True
        )
        # Новая задача для отслеживания коэффициентов
        self.scheduler.add_job(
            self._check_odds_changes,
            trigger=IntervalTrigger(seconds=30),  # отдельный интервал
            id='check_odds',
            replace_existing=True
        )
        self.scheduler.start()
        logger.info("Планировщик запущен с интервалом %s сек", CHECK_INTERVAL)

    def _check_all_users(self):
        asyncio.run(self._async_check_all_users())

    def _update_pending_outcomes(self):
        asyncio.run(self._async_update_outcomes())

    def _check_odds_changes(self):
        asyncio.run(self._async_check_odds_changes())

    async def _async_update_outcomes(self):
        try:
            pending = db.get_pending_triggered_matches()
            for rec in pending:
                match_id = rec['match_id']
                filter_id = rec['filter_id']
                expected = rec['expected_outcome']
                if not expected:
                    continue
                details = self.sstats.get_match_details(match_id)
                if not details:
                    continue
                status = details.get('status', '')
                if status == 'finished':
                    actual = determine_actual_outcome(details, expected)
                    success = is_outcome_success(actual, expected)
                    db.update_match_outcome(match_id, filter_id, actual, success)
                    logger.info(f"Обновлён исход для матча {match_id}: ожидалось {expected}, фактически {actual}, успех={success}")
                elif status in ['not_started', '']:
                    pass
        except Exception as e:
            logger.error(f"Error in update_outcomes: {e}", exc_info=True)

    async def _async_check_all_users(self):
        try:
            conn = db.get_db()
            c = conn.cursor()
            c.execute("SELECT id, telegram_chat_id FROM users")
            users = c.fetchall()
            conn.close()
            if not users:
                logger.debug("Нет пользователей")
                return

            matches = self.sstats.get_live_matches()
            if not matches:
                logger.debug("Нет live-матчей")
                return

            for user in users:
                user_id = user['id']
                chat_id = user['telegram_chat_id']
                filters = db.get_active_filters(user_id)
                if not filters:
                    continue
                blacklist = db.get_blacklisted_leagues(user_id)

                for match in matches:
                    match_id = match.get('id')
                    if not match_id:
                        continue
                    league_id = match.get('league', {}).get('id')
                    if league_id and league_id in blacklist:
                        continue

                    stats = self.sstats.get_match_details(match_id)
                    if not stats:
                        continue
                    odds = self.sstats.get_match_odds(match_id)
                    glicko = self.sstats.get_glicko(match_id)

                    team1_id = match.get('home', {}).get('id')
                    team2_id = match.get('away', {}).get('id')
                    h2h_data = self.sstats.get_head_to_head(team1_id, team2_id, limit=5) if team1_id and team2_id else None
                    home_recent_agg = self.sstats.get_team_recent_matches(team1_id, venue='home', limit=5) if team1_id else None
                    away_recent_agg = self.sstats.get_team_recent_matches(team2_id, venue='away', limit=5) if team2_id else None

                    home_recent_matches = self.sstats.get_team_recent_matches_full(team1_id, limit=5, venue='home') if team1_id else []
                    away_recent_matches = self.sstats.get_team_recent_matches_full(team2_id, limit=5, venue='away') if team2_id else []

                    triggered = check_filters(
                        match, stats, odds, filters,
                        h2h_data, home_recent_agg, away_recent_agg,
                        glicko,
                        home_recent_matches, away_recent_matches
                    )

                    for item in triggered:
                        f = item['filter']
                        filter_id = f['id']
                        if db.is_match_triggered(match_id, filter_id):
                            continue

                        msg = self._format_message(match, stats, odds, h2h_data, home_recent_agg, away_recent_agg, glicko)
                        await self.bot.send_message(chat_id, msg)
                        self.excel.append_match(match, stats, odds, filter_id)
                        db.add_triggered_match(
                            match_id,
                            filter_id,
                            match,
                            f.get('expected_outcome', ''),
                            item['conditions']
                        )
        except Exception as e:
            logger.error(f"Scheduler error: {e}", exc_info=True)

    async def _async_check_odds_changes(self):
        try:
            # Получаем все фильтры с отслеживанием коэффициентов
            filters = db.get_all_untracked_filters_with_odds()
            if not filters:
                logger.debug("Нет фильтров для отслеживания коэффициентов")
                return

            matches = self.sstats.get_live_matches()
            if not matches:
                logger.debug("Нет live-матчей для отслеживания")
                return

            for f in filters:
                filter_id = f['id']
                target = f.get('odds_target', '')
                threshold = float(f.get('odds_change_threshold', 0.0))
                change_type = f.get('odds_change_type', 'absolute')
                direction = f.get('odds_direction', 'down')
                user_id = f['user_id']
                # Получаем chat_id пользователя
                chat_id = db.get_user_id(user_id)  # но у нас есть функция get_user_id, которая возвращает id по chat_id, а нам нужно наоборот. Исправим: создадим функцию get_chat_id_by_user_id
                # Лучше получить chat_id из базы
                conn = db.get_db()
                c = conn.cursor()
                c.execute("SELECT telegram_chat_id FROM users WHERE id=?", (user_id,))
                row = c.fetchone()
                conn.close()
                if not row:
                    continue
                chat_id = row[0]

                for match in matches:
                    match_id = match.get('id')
                    if not match_id:
                        continue

                    # Проверяем, подходит ли матч под основные условия фильтра
                    # Для этого нам нужны stats, odds, glicko и т.д.
                    # Получаем данные
                    stats = self.sstats.get_match_details(match_id)
                    if not stats:
                        continue
                    odds = self.sstats.get_match_odds(match_id, live=True)  # live коэффициенты
                    if not odds:
                        continue
                    glicko = self.sstats.get_glicko(match_id)

                    team1_id = match.get('home', {}).get('id')
                    team2_id = match.get('away', {}).get('id')
                    h2h_data = self.sstats.get_head_to_head(team1_id, team2_id, limit=5) if team1_id and team2_id else None
                    home_recent_agg = self.sstats.get_team_recent_matches(team1_id, venue='home', limit=5) if team1_id else None
                    away_recent_agg = self.sstats.get_team_recent_matches(team2_id, venue='away', limit=5) if team2_id else None
                    home_recent_matches = self.sstats.get_team_recent_matches_full(team1_id, limit=5, venue='home') if team1_id else []
                    away_recent_matches = self.sstats.get_team_recent_matches_full(team2_id, limit=5, venue='away') if team2_id else []

                    # Проверяем основной фильтр
                    if not check_single_filter(match, stats, odds, f,
                                               h2h_data, home_recent_agg, away_recent_agg,
                                               glicko, home_recent_matches, away_recent_matches):
                        # Если фильтр не подходит, пропускаем
                        continue

                    # Получаем текущее значение коэффициента для целевого исхода
                    if target == 'p1':
                        current_val = odds.get('p1', 0.0)
                    elif target == 'p2':
                        current_val = odds.get('p2', 0.0)
                    elif target == 'draw':
                        current_val = odds.get('draw', 0.0)
                    elif target == 'total_over_2_5':
                        current_val = odds.get('total_over_2_5', 0.0)
                    else:
                        continue
                    if current_val == 0:
                        continue

                    # Получаем состояние отслеживания
                    track = db.get_odds_tracking(filter_id, match_id)
                    if not track:
                        # Создаём запись с начальным значением
                        db.upsert_odds_tracking(filter_id, match_id, current_val, current_val)
                        logger.debug(f"Создана запись отслеживания для фильтра {filter_id}, матч {match_id}, начальное {current_val}")
                        continue

                    if track.get('triggered'):
                        continue

                    initial = track.get('initial_value', current_val)
                    # Вычисляем изменение
                    if change_type == 'absolute':
                        change = current_val - initial
                    else:  # percent
                        change = (current_val - initial) / initial * 100 if initial != 0 else 0

                    # Проверяем направление и порог
                    if direction == 'down':
                        if change <= -threshold:
                            # Сигнал!
                            await self._send_odds_signal(match, f, target, initial, current_val, change, chat_id)
                            db.mark_odds_tracking_triggered(filter_id, match_id)
                            logger.info(f"Отправлен сигнал по коэффициентам: фильтр {filter_id}, матч {match_id}, изменение {change}")
                    elif direction == 'up':
                        if change >= threshold:
                            await self._send_odds_signal(match, f, target, initial, current_val, change, chat_id)
                            db.mark_odds_tracking_triggered(filter_id, match_id)
                            logger.info(f"Отправлен сигнал по коэффициентам: фильтр {filter_id}, матч {match_id}, изменение {change}")
        except Exception as e:
            logger.error(f"Error checking odds: {e}", exc_info=True)

    async def _send_odds_signal(self, match, filter_data, target, initial, current, change, chat_id):
        home = match.get('home', {}).get('name', 'Home')
        away = match.get('away', {}).get('name', 'Away')
        change_type = filter_data.get('odds_change_type', 'absolute')
        direction = filter_data.get('odds_direction', 'down')
        msg = (f"📊 ИЗМЕНЕНИЕ КОЭФФИЦИЕНТА!\n"
               f"{home} vs {away}\n"
               f"Исход: {target}\n"
               f"Начальный коэффициент: {initial:.2f}\n"
               f"Текущий коэффициент: {current:.2f}\n"
               f"Изменение: {change:.2f} {'%' if change_type == 'percent' else ''}\n"
               f"Фильтр #{filter_data['id']}")
        await self.bot.send_message(chat_id, msg)

    def _format_message(self, match, stats, odds, h2h_data, home_recent, away_recent, glicko):
        home_name = match.get('home', {}).get('name', 'Home')
        away_name = match.get('away', {}).get('name', 'Away')
        minute = match.get('minute', 0)
        home_goals = stats.get('goals', {}).get('home', 0)
        away_goals = stats.get('goals', {}).get('away', 0)
        home_corners = stats.get('corners', {}).get('home', 0)
        away_corners = stats.get('corners', {}).get('away', 0)
        home_shots = stats.get('shots', {}).get('home', 0)
        away_shots = stats.get('shots', {}).get('away', 0)
        home_sot = stats.get('shots_on_target', {}).get('home', 0)
        away_sot = stats.get('shots_on_target', {}).get('away', 0)
        home_yellow = stats.get('yellow_cards', {}).get('home', 0)
        away_yellow = stats.get('yellow_cards', {}).get('away', 0)
        p1 = odds.get('p1', 0)
        draw = odds.get('draw', 0)
        p2 = odds.get('p2', 0)
        over = odds.get('total_over_2_5', 0)

        msg = (f"⚽ МАТЧ ПОДОШЕЛ ПОД ФИЛЬТР!\n\n"
               f"{home_name} vs {away_name}\n"
               f"⏱ {minute}'\n"
               f"Счет: {home_goals}-{away_goals}\n"
               f"Угловые: {home_corners} - {away_corners}\n"
               f"Удары всего: {home_shots} - {away_shots}\n"
               f"Удары в створ: {home_sot} - {away_sot}\n"
               f"ЖК: {home_yellow} - {away_yellow}\n"
               f"Коэф: П1={p1}, Ничья={draw}, П2={p2}, Тотал 2.5 Овер={over}\n")
        if h2h_data:
            msg += f"\nСр. голов в личных встречах: {h2h_data.get('avg_goals', 0):.2f}"
        if home_recent:
            msg += f"\nСр. голов хозяев дома (последние 5): {home_recent.get('avg_goals', 0):.2f}"
        if away_recent:
            msg += f"\nСр. голов гостей в гостях (последние 5): {away_recent.get('avg_goals', 0):.2f}"
        if glicko:
            msg += f"\n🧠 Glicko: П1={glicko.get('home_prob',0)}%, Ничья={glicko.get('draw_prob',0)}%, П2={glicko.get('away_prob',0)}%"
        return msg