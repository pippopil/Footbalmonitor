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
            replace_existing=True
        )
        self.scheduler.start()
        logger.info("Планировщик запущен с интервалом %s сек", CHECK_INTERVAL)

    def _check(self):
        asyncio.run(self._async_check())

    async def _async_check(self):
        try:
            matches = self.sstats.get_live_matches()
            if not matches:
                logger.debug("Нет live-матчей")
                return

            filters = db.get_active_filters(self.user_id)
            if not filters:
                logger.debug("Нет активных фильтров")
                return

            blacklist = db.get_blacklisted_leagues(self.user_id)

            for match in matches:
                match_id = match.get('id')
                if not match_id:
                    continue

                # Проверка чёрного списка
                league_id = match.get('league', {}).get('id')
                if league_id and league_id in blacklist:
                    continue

                stats = self.sstats.get_match_details(match_id)
                if not stats:
                    continue
                odds = self.sstats.get_match_odds(match_id)

                team1_id = match.get('home', {}).get('id')
                team2_id = match.get('away', {}).get('id')
                h2h_data = self.sstats.get_head_to_head(team1_id, team2_id, limit=5) if team1_id and team2_id else None
                home_recent = self.sstats.get_team_recent_matches(team1_id, venue='home', limit=5) if team1_id else None
                away_recent = self.sstats.get_team_recent_matches(team2_id, venue='away', limit=5) if team2_id else None

                triggered = check_filters(match, stats, odds, filters, h2h_data, home_recent, away_recent)

                for f in triggered:
                    filter_id = f['id']
                    if db.is_match_triggered(match_id, filter_id):
                        continue

                    filter_name = f.get('name', f'Фильтр #{filter_id}')
                    msg = self._format_message(match, stats, odds, h2h_data, home_recent, away_recent, filter_name, f)
                    await self.bot.send_message(self.chat_id, msg)
                    self.excel.append_match(match, stats, odds, filter_id)
                    db.add_triggered_match(match_id, filter_id, match)

        except Exception as e:
            logger.error(f"Scheduler error: {e}", exc_info=True)

    def _format_message(self, match, stats, odds, h2h_data, home_recent, away_recent, filter_name, filter_dict):
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

        # Формируем сообщение с именем фильтра и его условиями
        msg = f"⚽ СИГНАЛ ОТ ФИЛЬТРА: {filter_name}\n\n"
        msg += f"{home_name} vs {away_name}\n"
        msg += f"⏱ {minute}'\n"
        msg += f"Счет: {home_goals}-{away_goals}\n"
        msg += f"Угловые: {home_corners} - {away_corners}\n"
        msg += f"Удары всего: {home_shots} - {away_shots}\n"
        msg += f"Удары в створ: {home_sot} - {away_sot}\n"
        msg += f"ЖК: {home_yellow} - {away_yellow}\n"
        msg += f"Коэф: П1={p1}, Ничья={draw}, П2={p2}, Тотал 2.5 Овер={over}\n"

        # Добавим краткое описание условий фильтра (для наглядности)
        msg += f"\nУсловия фильтра:\n"
        if filter_dict.get('total_goals_min') != 0 or filter_dict.get('total_goals_max') != 10:
            msg += f"- Голы: {filter_dict['total_goals_min']} – {filter_dict['total_goals_max']}\n"
        if filter_dict.get('match_time_min') != 0 or filter_dict.get('match_time_max') != 90:
            msg += f"- Время матча: {filter_dict['match_time_min']} – {filter_dict['match_time_max']} мин\n"
        # Можно добавить и другие параметры по желанию

        if h2h_data:
            msg += f"\nСр. голов в личных встречах: {h2h_data.get('avg_goals', 0):.2f}"
        if home_recent:
            msg += f"\nСр. голов хозяев дома (последние 5): {home_recent.get('avg_goals', 0):.2f}"
        if away_recent:
            msg += f"\nСр. голов гостей в гостях (последние 5): {away_recent.get('avg_goals', 0):.2f}"
        return msg