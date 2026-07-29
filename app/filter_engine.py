from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

def check_filters(match: Dict, stats: Dict, odds: Dict, filters: List[Dict],
                  h2h_data: Dict = None, home_recent: Dict = None, away_recent: Dict = None) -> List[Dict]:
    """
    Проверяет матч по списку фильтров.
    Возвращает список фильтров, которые сработали.
    """
    triggered = []
    for f in filters:
        filter_id = f.get('id', '?')
        # --- Время матча ---
        minute = match.get('minute', 0)
        if not (f['match_time_min'] <= minute <= f['match_time_max']):
            logger.debug(f"Фильтр {filter_id}: время {minute} не в диапазоне {f['match_time_min']}-{f['match_time_max']}")
            continue

        # --- Общая статистика (суммарно) ---
        home_goals = stats.get('goals', {}).get('home', 0)
        away_goals = stats.get('goals', {}).get('away', 0)
        total_goals = home_goals + away_goals
        if not (f['total_goals_min'] <= total_goals <= f['total_goals_max']):
            logger.debug(f"Фильтр {filter_id}: общие голы {total_goals} вне диапазона {f['total_goals_min']}-{f['total_goals_max']}")
            continue

        home_corners = stats.get('corners', {}).get('home', 0)
        away_corners = stats.get('corners', {}).get('away', 0)
        total_corners = home_corners + away_corners
        if not (f['total_corners_min'] <= total_corners <= f['total_corners_max']):
            logger.debug(f"Фильтр {filter_id}: общие угловые {total_corners} вне диапазона")
            continue

        home_shots = stats.get('shots', {}).get('home', 0)
        away_shots = stats.get('shots', {}).get('away', 0)
        total_shots = home_shots + away_shots
        if not (f['total_shots_min'] <= total_shots <= f['total_shots_max']):
            logger.debug(f"Фильтр {filter_id}: общие удары {total_shots} вне диапазона")
            continue

        home_sot = stats.get('shots_on_target', {}).get('home', 0)
        away_sot = stats.get('shots_on_target', {}).get('away', 0)
        total_sot = home_sot + away_sot
        if not (f['total_sot_min'] <= total_sot <= f['total_sot_max']):
            logger.debug(f"Фильтр {filter_id}: общие удары в створ {total_sot} вне диапазона")
            continue

        home_yellow = stats.get('yellow_cards', {}).get('home', 0)
        away_yellow = stats.get('yellow_cards', {}).get('away', 0)
        total_yellow = home_yellow + away_yellow
        if not (f['total_yellow_min'] <= total_yellow <= f['total_yellow_max']):
            logger.debug(f"Фильтр {filter_id}: общие ЖК {total_yellow} вне диапазона")
            continue

        # --- Индивидуальные показатели хозяев ---
        if not (f['home_goals_min'] <= home_goals <= f['home_goals_max']):
            logger.debug(f"Фильтр {filter_id}: голы хозяев {home_goals} вне диапазона")
            continue
        if not (f['home_corners_min'] <= home_corners <= f['home_corners_max']):
            logger.debug(f"Фильтр {filter_id}: угловые хозяев {home_corners} вне диапазона")
            continue
        if not (f['home_shots_min'] <= home_shots <= f['home_shots_max']):
            logger.debug(f"Фильтр {filter_id}: удары хозяев {home_shots} вне диапазона")
            continue
        if not (f['home_sot_min'] <= home_sot <= f['home_sot_max']):
            logger.debug(f"Фильтр {filter_id}: удары в створ хозяев {home_sot} вне диапазона")
            continue
        if not (f['home_yellow_min'] <= home_yellow <= f['home_yellow_max']):
            logger.debug(f"Фильтр {filter_id}: ЖК хозяев {home_yellow} вне диапазона")
            continue

        # --- Индивидуальные показатели гостей ---
        if not (f['away_goals_min'] <= away_goals <= f['away_goals_max']):
            logger.debug(f"Фильтр {filter_id}: голы гостей {away_goals} вне диапазона")
            continue
        if not (f['away_corners_min'] <= away_corners <= f['away_corners_max']):
            logger.debug(f"Фильтр {filter_id}: угловые гостей {away_corners} вне диапазона")
            continue
        if not (f['away_shots_min'] <= away_shots <= f['away_shots_max']):
            logger.debug(f"Фильтр {filter_id}: удары гостей {away_shots} вне диапазона")
            continue
        if not (f['away_sot_min'] <= away_sot <= f['away_sot_max']):
            logger.debug(f"Фильтр {filter_id}: удары в створ гостей {away_sot} вне диапазона")
            continue
        if not (f['away_yellow_min'] <= away_yellow <= f['away_yellow_max']):
            logger.debug(f"Фильтр {filter_id}: ЖК гостей {away_yellow} вне диапазона")
            continue

        # --- РАЗНИЦА СТАТИСТИКИ (home - away) ---
        diff_goals = home_goals - away_goals
        if not (f['diff_goals_min'] <= diff_goals <= f['diff_goals_max']):
            logger.debug(f"Фильтр {filter_id}: разница голов {diff_goals} вне диапазона")
            continue

        diff_corners = home_corners - away_corners
        if not (f['diff_corners_min'] <= diff_corners <= f['diff_corners_max']):
            logger.debug(f"Фильтр {filter_id}: разница угловых {diff_corners} вне диапазона")
            continue

        diff_shots = home_shots - away_shots
        if not (f['diff_shots_min'] <= diff_shots <= f['diff_shots_max']):
            logger.debug(f"Фильтр {filter_id}: разница ударов {diff_shots} вне диапазона")
            continue

        diff_sot = home_sot - away_sot
        if not (f['diff_sot_min'] <= diff_sot <= f['diff_sot_max']):
            logger.debug(f"Фильтр {filter_id}: разница ударов в створ {diff_sot} вне диапазона")
            continue

        diff_yellow = home_yellow - away_yellow
        if not (f['diff_yellow_min'] <= diff_yellow <= f['diff_yellow_max']):
            logger.debug(f"Фильтр {filter_id}: разница ЖК {diff_yellow} вне диапазона")
            continue

        # --- Коэффициенты ---
        p1 = odds.get('p1', 0.0)
        p2 = odds.get('p2', 0.0)
        draw = odds.get('draw', 0.0)
        over25 = odds.get('total_over_2_5', 0.0)
        if not (f['odds_p1_min'] <= p1 <= f['odds_p1_max']):
            logger.debug(f"Фильтр {filter_id}: П1 {p1} вне диапазона")
            continue
        if not (f['odds_p2_min'] <= p2 <= f['odds_p2_max']):
            logger.debug(f"Фильтр {filter_id}: П2 {p2} вне диапазона")
            continue
        if not (f['odds_draw_min'] <= draw <= f['odds_draw_max']):
            logger.debug(f"Фильтр {filter_id}: ничья {draw} вне диапазона")
            continue
        if not (f['odds_total_over_2_5_min'] <= over25 <= f['odds_total_over_2_5_max']):
            logger.debug(f"Фильтр {filter_id}: тотал овер {over25} вне диапазона")
            continue

        # --- Проверка статистики предыдущих матчей (если данные предоставлены) ---
        if h2h_data is not None:
            avg_goals = h2h_data.get('avg_goals', 0)
            if not (f['h2h_avg_goals_min'] <= avg_goals <= f['h2h_avg_goals_max']):
                logger.debug(f"Фильтр {filter_id}: H2H средние голы {avg_goals} вне диапазона")
                continue
        if home_recent is not None:
            avg_home = home_recent.get('avg_goals', 0)
            if not (f['home_recent_goals_min'] <= avg_home <= f['home_recent_goals_max']):
                logger.debug(f"Фильтр {filter_id}: недавние голы хозяев {avg_home} вне диапазона")
                continue
        if away_recent is not None:
            avg_away = away_recent.get('avg_goals', 0)
            if not (f['away_recent_goals_min'] <= avg_away <= f['away_recent_goals_max']):
                logger.debug(f"Фильтр {filter_id}: недавние голы гостей {avg_away} вне диапазона")
                continue

        # Все условия выполнены
        logger.info(f"✅ Фильтр {filter_id} сработал на матче {match.get('id')}")
        triggered.append(f)

    return triggered