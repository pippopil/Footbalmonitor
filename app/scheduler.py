import asyncio
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app import database as db
from app.filter_engine import check_filters
from app.config import CHECK_INTERVAL, DEFAULT_CHAT_ID

logger = logging.getLogger(__name__)

class MatchScheduler:
    def __init__(self, sstats, bot, excel, chat_id: int = DEFAULT_CHAT_ID):
        self.sstats = sstats
        self.bot = bot
        self.excel = excel
        self.chat_id = chat_id
        self.scheduler = BackgroundScheduler()
        self.user_id = db.get_user_id(chat_id)
        if not self.user_id:
            self.user_id = db.create_user(chat_id)

    def start(self):
        self.scheduler.add_job(
            self._check,
            trigger=IntervalTrigger(seconds=CHECK_INTERVAL),
            id='check_matches',
            replace_existing=True,
            max_instances=1,
            misfire_grace_time=60
        )
        self.scheduler.start()
        logger.info("Планировщик запущен с интервалом %s сек", CHECK_INTERVAL)

    def _check(self):
        asyncio.run(self._async_check())

    async def _async_check(self):
        try:
            logger.info("🔄 Начало проверки матчей")
            matches = self.sstats.get_live_matches()
            if not matches:
                logger.info("Нет live-матчей")
                return

            # Получаем начальный список фильтров (для информации)
            initial_filters = db.get_active_filters(self.user_id)
            if not initial_filters:
                logger.info("Нет активных фильтров")
                return

            logger.info(f"📊 Найдено матчей: {len(matches)}, фильтров: {len(initial_filters)}")

            blacklist = db.get_blacklisted_leagues(self.user_id)

            for match in matches:
                match_id = match.get('id')
                if not match_id:
                    continue

                league_id = match.get('league', {}).get('id')
                if league_id and league_id in blacklist:
                    logger.debug(f"Матч {match_id} исключён (чёрный список лиги {league_id})")
                    continue

                # --- Перепроверка фильтров перед каждым матчем ---
                current_filters = db.get_active_filters(self.user_id)
                if not current_filters:
                    logger.debug("Нет активных фильтров, прекращаем обработку матчей")
                    break  # выходим из цикла, так как фильтров больше нет

                valid_filters = []
                for f in current_filters:
                    filter_check = db.get_filter(f['id'])
                    if filter_check and filter_check.get('is_active', 0):
                        valid_filters.append(filter_check)
                if not valid_filters:
                    logger.debug("Нет активных фильтров после проверки, прекращаем обработку матчей")
                    break

                # Получаем данные матча
                stats = self.sstats.get_match_details(match_id)
                if not stats:
                    logger.debug(f"Нет статистики для матча {match_id}")
                    continue
                odds = self.sstats.get_match_odds(match_id, live=True)

                team1_id = match.get('homeTeam', {}).get('id')
                team2_id = match.get('awayTeam', {}).get('id')
                h2h_data = self.sstats.get_head_to_head(team1_id, team2_id, limit=5) if team1_id and team2_id else None
                home_recent = self.sstats.get_team_recent_matches(team1_id, venue='home', limit=5) if team1_id else None
                away_recent = self.sstats.get_team_recent_matches(team2_id, venue='away', limit=5) if team2_id else None

                triggered = check_filters(match, stats, odds, valid_filters, h2h_data, home_recent, away_recent)

                if triggered:
                    logger.info(f"✅ Матч {match_id} подошёл под {len(triggered)} фильтр(ов)")
                    for f in triggered:
                        filter_id = f['id']

                        # Дополнительная проверка перед отправкой
                        current_filter = db.get_filter(filter_id)
                        if not current_filter or not current_filter.get('is_active', 0):
                            logger.info(f"Фильтр {filter_id} был отключён, пропускаем отправку")
                            continue

                        if db.is_match_triggered(match_id, filter_id):
                            logger.debug(f"Матч {match_id} уже был обработан фильтром {filter_id}")
                            continue

                        msg = self._format_message(match, stats, odds, h2h_data, home_recent, away_recent)
                        await self.bot.send_message(self.chat_id, msg)
                        self.excel.append_match(match, stats, odds, filter_id)
                        db.add_triggered_match(match_id, filter_id, match)
                        logger.info(f"📨 Отправлен сигнал для матча {match_id} по фильтру {filter_id}")
                else:
                    logger.debug(f"Матч {match_id} не подошёл ни под один фильтр")

            logger.info("✅ Проверка завершена")
        except Exception as e:
            logger.error(f"Ошибка в планировщике: {e}", exc_info=True)

    def _format_message(self, match, stats, odds, h2h_data=None, home_recent=None, away_recent=None):
        home_name = match.get('homeTeam', {}).get('name', 'Home')
        away_name = match.get('awayTeam', {}).get('name', 'Away')
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
        return msg