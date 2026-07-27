import logging
from typing import Dict, List

logger = logging.getLogger(__name__)

def check_filters(match: Dict, stats: Dict, odds: Dict, filters: List[Dict],
                  h2h_data: Dict = None, home_recent: Dict = None, away_recent: Dict = None) -> List[Dict]:
    triggered = []
    for f in filters:
        logger.info(f"Проверка фильтра ID {f['id']} для матча {match.get('id')}")

        # Время матча — используем elapsed, если есть, иначе minute
        minute = match.get('elapsed', match.get('minute', 0))
        if not (f['match_time_min'] <= minute <= f['match_time_max']):
            logger.info(f"  ❌ Время {minute} не в [{f['match_time_min']}, {f['match_time_max']}]")
            continue

        home_goals = stats.get('goals', {}).get('home', 0) or 0
        away_goals = stats.get('goals', {}).get('away', 0) or 0
        total_goals = home_goals + away_goals
        if not (f['total_goals_min'] <= total_goals <= f['total_goals_max']):
            logger.info(f"  ❌ Общие голы {total_goals} не в [{f['total_goals_min']}, {f['total_goals_max']}]")
            continue

        home_corners = stats.get('corners', {}).get('home', 0) or 0
        away_corners = stats.get('corners', {}).get('away', 0) or 0
        total_corners = home_corners + away_corners
        if not (f['total_corners_min'] <= total_corners <= f['total_corners_max']):
            logger.info(f"  ❌ Общие угловые {total_corners} не в [{f['total_corners_min']}, {f['total_corners_max']}]")
            continue

        home_shots = stats.get('shots', {}).get('home', 0) or 0
        away_shots = stats.get('shots', {}).get('away', 0) or 0
        total_shots = home_shots + away_shots
        if not (f['total_shots_min'] <= total_shots <= f['total_shots_max']):
            logger.info(f"  ❌ Общие удары {total_shots} не в [{f['total_shots_min']}, {f['total_shots_max']}]")
            continue

        home_sot = stats.get('shots_on_target', {}).get('home', 0) or 0
        away_sot = stats.get('shots_on_target', {}).get('away', 0) or 0
        total_sot = home_sot + away_sot
        if not (f['total_sot_min'] <= total_sot <= f['total_sot_max']):
            logger.info(f"  ❌ Общие удары в створ {total_sot} не в [{f['total_sot_min']}, {f['total_sot_max']}]")
            continue

        home_yellow = stats.get('yellow_cards', {}).get('home', 0) or 0
        away_yellow = stats.get('yellow_cards', {}).get('away', 0) or 0
        total_yellow = home_yellow + away_yellow
        if not (f['total_yellow_min'] <= total_yellow <= f['total_yellow_max']):
            logger.info(f"  ❌ Общие ЖК {total_yellow} не в [{f['total_yellow_min']}, {f['total_yellow_max']}]")
            continue

        if not (f['home_goals_min'] <= home_goals <= f['home_goals_max']):
            logger.info(f"  ❌ Голы хозяев {home_goals} не в [{f['home_goals_min']}, {f['home_goals_max']}]")
            continue
        if not (f['home_corners_min'] <= home_corners <= f['home_corners_max']):
            logger.info(f"  ❌ Угловые хозяев {home_corners} не в [{f['home_corners_min']}, {f['home_corners_max']}]")
            continue
        if not (f['home_shots_min'] <= home_shots <= f['home_shots_max']):
            logger.info(f"  ❌ Удары хозяев {home_shots} не в [{f['home_shots_min']}, {f['home_shots_max']}]")
            continue
        if not (f['home_sot_min'] <= home_sot <= f['home_sot_max']):
            logger.info(f"  ❌ Удары в створ хозяев {home_sot} не в [{f['home_sot_min']}, {f['home_sot_max']}]")
            continue
        if not (f['home_yellow_min'] <= home_yellow <= f['home_yellow_max']):
            logger.info(f"  ❌ ЖК хозяев {home_yellow} не в [{f['home_yellow_min']}, {f['home_yellow_max']}]")
            continue

        if not (f['away_goals_min'] <= away_goals <= f['away_goals_max']):
            logger.info(f"  ❌ Голы гостей {away_goals} не в [{f['away_goals_min']}, {f['away_goals_max']}]")
            continue
        if not (f['away_corners_min'] <= away_corners <= f['away_corners_max']):
            logger.info(f"  ❌ Угловые гостей {away_corners} не в [{f['away_corners_min']}, {f['away_corners_max']}]")
            continue
        if not (f['away_shots_min'] <= away_shots <= f['away_shots_max']):
            logger.info(f"  ❌ Удары гостей {away_shots} не в [{f['away_shots_min']}, {f['away_shots_max']}]")
            continue
        if not (f['away_sot_min'] <= away_sot <= f['away_sot_max']):
            logger.info(f"  ❌ Удары в створ гостей {away_sot} не в [{f['away_sot_min']}, {f['away_sot_max']}]")
            continue
        if not (f['away_yellow_min'] <= away_yellow <= f['away_yellow_max']):
            logger.info(f"  ❌ ЖК гостей {away_yellow} не в [{f['away_yellow_min']}, {f['away_yellow_max']}]")
            continue

        if isinstance(odds, dict):
            p1 = odds.get('p1', 0.0) or 0.0
            p2 = odds.get('p2', 0.0) or 0.0
            draw = odds.get('draw', 0.0) or 0.0
            over25 = odds.get('total_over_2_5', 0.0) or 0.0
            if not (f['odds_p1_min'] <= p1 <= f['odds_p1_max']):
                logger.info(f"  ❌ П1 {p1} не в [{f['odds_p1_min']}, {f['odds_p1_max']}]")
                continue
            if not (f['odds_p2_min'] <= p2 <= f['odds_p2_max']):
                logger.info(f"  ❌ П2 {p2} не в [{f['odds_p2_min']}, {f['odds_p2_max']}]")
                continue
            if not (f['odds_draw_min'] <= draw <= f['odds_draw_max']):
                logger.info(f"  ❌ Ничья {draw} не в [{f['odds_draw_min']}, {f['odds_draw_max']}]")
                continue
            if not (f['odds_total_over_2_5_min'] <= over25 <= f['odds_total_over_2_5_max']):
                logger.info(f"  ❌ Тотал 2.5 {over25} не в [{f['odds_total_over_2_5_min']}, {f['odds_total_over_2_5_max']}]")
                continue
        else:
            logger.warning("  ⚠️ Коэффициенты не словарь, пропускаем проверку")

        if h2h_data is not None:
            avg_goals = h2h_data.get('avg_goals', 0) or 0.0
            if not (f['h2h_avg_goals_min'] <= avg_goals <= f['h2h_avg_goals_max']):
                logger.info(f"  ❌ H2H средние голы {avg_goals} не в [{f['h2h_avg_goals_min']}, {f['h2h_avg_goals_max']}]")
                continue
        if home_recent is not None:
            avg_home = home_recent.get('avg_goals', 0) or 0.0
            if not (f['home_recent_goals_min'] <= avg_home <= f['home_recent_goals_max']):
                logger.info(f"  ❌ Последние дома {avg_home} не в [{f['home_recent_goals_min']}, {f['home_recent_goals_max']}]")
                continue
        if away_recent is not None:
            avg_away = away_recent.get('avg_goals', 0) or 0.0
            if not (f['away_recent_goals_min'] <= avg_away <= f['away_recent_goals_max']):
                logger.info(f"  ❌ Последние в гостях {avg_away} не в [{f['away_recent_goals_min']}, {f['away_recent_goals_max']}]")
                continue

        logger.info(f"  ✅ Фильтр {f['id']} сработал!")
        triggered.append(f)

    return triggered