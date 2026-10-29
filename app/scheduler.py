import asyncio
import logging
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app import database as db
from app.filter_engine import check_filters, check_single_filter, determine_actual_outcome, is_outcome_success
from app.config import CHECK_INTERVAL

logger = logging.getLogger(__name__)

class MatchScheduler:
    def __init__(self, data_client, bot, excel):
        self.data_client = data_client
        self.bot = bot
        self.excel = excel
        self.scheduler = BackgroundScheduler()
        self.sent_matches_cache = set()  # set of (str(match_id), str(filter_id))
        self.sent_match_chat_cache = set()  # set of (str(match_id), str(chat_id)) to guarantee max 1 alert per match
        self._is_checking = False

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
        self.scheduler.add_job(
            self._check_odds_changes,
            trigger=IntervalTrigger(seconds=60),
            id='check_odds',
            replace_existing=True
        )
        self.scheduler.start()
        logger.info("Планировщик запущен с интервалом %s сек", CHECK_INTERVAL)

    def _check_all_users(self):
        if self._is_checking:
            logger.warning("Предыдущий цикл проверки ещё активен, пропускаем тик планировщика")
            return
        self._is_checking = True
        try:
            asyncio.run(self._async_check_all_users())
        except Exception as e:
            logger.error(f"Ошибка в цикле проверки пользователей: {e}", exc_info=True)
        finally:
            self._is_checking = False

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
                details = self.data_client.get_match_details(match_id)
                if not details:
                    continue
                status = details.get('status', '')
                if status == 'finished':
                    actual = determine_actual_outcome(details, expected)
                    success = is_outcome_success(actual, expected)
                    db.update_match_outcome(match_id, filter_id, actual, success)
                    logger.info(f"Обновлён исход для матча {match_id}: ожидалось {expected}, фактически {actual}, успех={success}")

                    # Переписываем сообщение в Telegram боте с результатом завершения матча
                    tg_msg_id = rec.get('telegram_message_id')
                    tg_chat_id = rec.get('telegram_chat_id')
                    if tg_msg_id and tg_chat_id:
                        try:
                            home_team = details.get('home_team', 'Хозяева')
                            away_team = details.get('away_team', 'Гости')
                            score_home = details.get('score_home', 0)
                            score_away = details.get('score_away', 0)
                            status_icon = "✅ <b>СИГНАЛ ЗАШЁЛ (WIN)</b> 🎯" if success else "❌ <b>СИГНАЛ НЕ ЗАШЁЛ (LOSS)</b> ⚠️"

                            edited_text = (
                                f"{status_icon}\n"
                                f"━━━━━━━━━━━━━━━━━━━━\n"
                                f"⚽ <b>{home_team} {score_home}:{score_away} {away_team}</b> [Матч завершён]\n"
                                f"🎯 <b>Ожидаемый исход:</b> <u>{expected}</u>\n"
                                f"📊 <b>Фактический исход:</b> {actual}\n"
                                f"💰 <b>Результат:</b> <b>{'✅ ПРОХОД' if success else '❌ НЕ ПРОШЛО'}</b>\n\n"
                                f"⏱ <i>Результат зафиксирован: {datetime.now().strftime('%H:%M:%S')}</i>\n"
                                f"🤖 <i>Footbalmonitor Auto-Verification Engine</i>"
                            )
                            await self.bot.edit_message(tg_chat_id, tg_msg_id, edited_text)
                            logger.info(f"Сообщение #{tg_msg_id} в Telegram чате {tg_chat_id} успешно переписано с результатом!")
                        except Exception as e:
                            logger.error(f"Не удалось переписать сообщение #{tg_msg_id} в Telegram: {e}")
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

            # --- ВРЕМЕННО: завершённые матчи ---
            yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
            today = datetime.now().strftime("%Y-%m-%d")
            logger.info(f"Тестовый режим: получаем завершённые матчи с {yesterday} по {today}")
            matches = self.data_client.get_matches_by_date(yesterday, today, limit=200)

            if not matches:
                logger.debug("Нет матчей за выбранный период")
                return

            logger.info(f"Найдено матчей для проверки: {len(matches)}")

            for user in users:
                user_id = user['id']
                chat_id = user['telegram_chat_id']
                if chat_id == 123456789:
                    logger.warning(f"Пропускаем тестовый chat_id {chat_id}")
                    continue

                filters = db.get_active_filters(user_id)
                if not filters:
                    logger.info(f"Пользователь {user_id} не имеет активных фильтров")
                    continue

                logger.info(f"Пользователь {user_id}: активных фильтров - {len(filters)}")

                blacklist = db.get_blacklisted_leagues(user_id)

                for match in matches:
                    match_id = match.get('id')
                    if not match_id:
                        continue
                    league_id = match.get('league', {}).get('id')
                    if league_id and league_id in blacklist:
                        continue

                    home_team = match.get('homeTeam') or match.get('home')
                    away_team = match.get('awayTeam') or match.get('away')
                    home_name = home_team.get('name', 'Unknown') if home_team else 'Unknown'
                    away_name = away_team.get('name', 'Unknown') if away_team else 'Unknown'
                    logger.info(f"Проверяем матч {match_id}: {home_name} vs {away_name}")

                    try:
                        stats = self.data_client.get_match_details(match_id)
                        if not stats:
                            stats = {}
                            logger.warning(f"Статистика для матча {match_id} не найдена, используем пустую")

                        odds = self.data_client.get_match_odds(match_id)
                        if not odds or not isinstance(odds, dict):
                            odds = {}
                        glicko = self.data_client.get_glicko(match_id)
                        if not glicko:
                            glicko = {}

                        team1_id = home_team.get('id') if home_team else None
                        team2_id = away_team.get('id') if away_team else None

                        h2h_data = self.data_client.get_head_to_head(team1_id, team2_id, limit=5) if team1_id and team2_id else None
                        home_recent_agg = self.data_client.get_team_recent_matches(team1_id, venue='home', limit=5) if team1_id else None
                        away_recent_agg = self.data_client.get_team_recent_matches(team2_id, venue='away', limit=5) if team2_id else None

                        home_recent_matches = self.data_client.get_team_recent_matches_full(team1_id, limit=5, venue='home') if team1_id else []
                        away_recent_matches = self.data_client.get_team_recent_matches_full(team2_id, limit=5, venue='away') if team2_id else []

                        triggered = check_filters(
                            match, stats, odds, filters,
                            h2h_data, home_recent_agg, away_recent_agg,
                            glicko,
                            home_recent_matches, away_recent_matches
                        )

                        if triggered:
                            logger.info(f"Матч {match_id}: сработало {len(triggered)} фильтров для пользователя {chat_id}")
                            
                            # Анти-спам проверка на уровне (матч + пользователь): отправляем ровно 1 сигнал на матч
                            match_chat_key = (str(match_id), str(chat_id))
                            if match_chat_key in self.sent_match_chat_cache or db.is_match_sent_to_chat(match_id, chat_id):
                                logger.info(f"Матч {match_id} уже был отправлен в чат {chat_id} (подавлен дубликат)")
                                for item in triggered:
                                    self.sent_matches_cache.add((str(match_id), str(item['filter']['id'])))
                                self.sent_match_chat_cache.add(match_chat_key)
                                continue

                            # Берем первичный сработавший фильтр
                            primary_item = triggered[0]
                            primary_filter = primary_item['filter']
                            primary_filter_id = primary_filter['id']

                            # Проверяем, не отправлялся ли уже этот фильтр
                            cache_key = (str(match_id), str(primary_filter_id))
                            if cache_key in self.sent_matches_cache or db.is_match_triggered(match_id, primary_filter_id):
                                logger.info(f"Матч {match_id} уже был отправлен для фильтра {primary_filter_id} (анти-спам)")
                                self.sent_matches_cache.add(cache_key)
                                self.sent_match_chat_cache.add(match_chat_key)
                                continue

                            # Формируем сообщение
                            try:
                                msg = self._format_message(match, stats, odds, h2h_data, home_recent_agg, away_recent_agg, glicko, primary_filter)
                                if len(triggered) > 1:
                                    other_names = [it['filter'].get('name') or f"#{it['filter']['id']}" for it in triggered[1:]]
                                    msg += f"\n\n⚡ <b>Также совпали фильтры ({len(triggered)}):</b> {', '.join(other_names)}"
                            except Exception as e:
                                logger.error(f"Ошибка форматирования сообщения для матча {match_id}: {e}", exc_info=True)
                                continue

                            # Фиксируем в кэше ДО отправки, чтобы исключить параллельные гонки
                            self.sent_match_chat_cache.add(match_chat_key)
                            for item in triggered:
                                self.sent_matches_cache.add((str(match_id), str(item['filter']['id'])))

                            msg_id = None
                            try:
                                msg_id = await self.bot.send_message(chat_id, msg)
                                logger.info(f"Отправлено единое сообщение #{msg_id} пользователю {chat_id} для матча {match_id} (фильтров: {len(triggered)})")
                            except Exception as e:
                                logger.error(f"Ошибка отправки сообщения пользователю {chat_id}: {e}")

                            self.excel.append_match(match, stats, odds, primary_filter_id)
                            for item in triggered:
                                f_item = item['filter']
                                db.add_triggered_match(
                                    match_id,
                                    f_item['id'],
                                    match,
                                    f_item.get('expected_outcome', ''),
                                    item['conditions'],
                                    telegram_message_id=msg_id,
                                    telegram_chat_id=chat_id
                                )
                        else:
                            logger.debug(f"Матч {match_id}: ни один фильтр не сработал")
                    except Exception as e:
                        logger.error(f"Ошибка обработки матча {match_id}: {e}", exc_info=True)
                        continue
        except Exception as e:
            logger.error(f"Scheduler error: {e}", exc_info=True)

    async def _async_check_odds_changes(self):
        # Отключаем отслеживание коэффициентов во время теста
        logger.debug("Отслеживание коэффициентов временно отключено для теста")
        return

    def _format_message(self, match, stats, odds, h2h_data, home_recent, away_recent, glicko, filter_data):
        # Убеждаемся, что odds — словарь
        if not isinstance(odds, dict):
            odds = {}

        home_team = match.get('homeTeam') or match.get('home')
        away_team = match.get('awayTeam') or match.get('away')
        home_name = home_team.get('name', 'Home') if home_team else 'Home'
        away_name = away_team.get('name', 'Away') if away_team else 'Away'

        minute = match.get('minute', 0)
        home_goals = match.get('goals', {}).get('home', 0)
        away_goals = match.get('goals', {}).get('away', 0)

        home_corners = stats.get('corners', {}).get('home', 0) if stats else 0
        away_corners = stats.get('corners', {}).get('away', 0) if stats else 0
        home_shots = stats.get('shots', {}).get('home', 0) if stats else 0
        away_shots = stats.get('shots', {}).get('away', 0) if stats else 0
        home_sot = stats.get('shots_on_target', {}).get('home', 0) if stats else 0
        away_sot = stats.get('shots_on_target', {}).get('away', 0) if stats else 0
        home_yellow = stats.get('yellow_cards', {}).get('home', 0) if stats else 0
        away_yellow = stats.get('yellow_cards', {}).get('away', 0) if stats else 0

        p1 = odds.get('p1', 'Н/Д')
        draw = odds.get('draw', 'Н/Д')
        p2 = odds.get('p2', 'Н/Д')
        over = odds.get('total_over_2_5', 'Н/Д')

        filter_name = filter_data.get('name') or f"Фильтр #{filter_data['id']}"

        msg = f"⚽ МАТЧ ПОДОШЕЛ ПОД ФИЛЬТР!\n\n"
        msg += f"{home_name} vs {away_name}\n"
        tournament = match.get('league', {}).get('name') or match.get('tournament', {}).get('name') or ''
        if tournament:
            msg += f"🏆 {tournament}\n"
        msg += f"⏱ {minute}'\n"
        msg += f"Счет: {home_goals}-{away_goals}\n"
        msg += f"Угловые: {home_corners} - {away_corners}\n"
        msg += f"Удары всего: {home_shots} - {away_shots}\n"
        msg += f"Удары в створ: {home_sot} - {away_sot}\n"
        msg += f"ЖК: {home_yellow} - {away_yellow}\n"
        msg += f"Коэф: П1={p1}, Ничья={draw}, П2={p2}, Тотал 2.5 Овер={over}\n"
        if h2h_data:
            msg += f"\nСр. голов в личных встречах: {h2h_data.get('avg_goals', 0):.2f}"
        if home_recent:
            msg += f"\nСр. голов хозяев дома (последние 5): {home_recent.get('avg_goals', 0):.2f}"
        if away_recent:
            msg += f"\nСр. голов гостей в гостях (последние 5): {away_recent.get('avg_goals', 0):.2f}"
        if glicko and any(glicko.values()):
            msg += f"\n🧠 Glicko: П1={glicko.get('home_prob',0)}%, Ничья={glicko.get('draw_prob',0)}%, П2={glicko.get('away_prob',0)}%"
        msg += f"\n\n🔹 {filter_name}"
        return msg

    def _format_odds_message(self, match, filter_data, target, initial, current, change):
        # Заглушка
        return ""