from typing import Dict, List

def check_filters(match: Dict, stats: Dict, odds: Dict, filters: List[Dict],
                  h2h_data: Dict = None, home_recent: Dict = None, away_recent: Dict = None) -> List[Dict]:
    """
    Проверяет матч по списку фильтров.
    Возвращает список фильтров, которые сработали.
    """
    triggered = []
    for f in filters:
        # --- Время матча ---
        minute = match.get('minute', 0)
        if not (f['match_time_min'] <= minute <= f['match_time_max']):
            continue

        # --- Общая статистика (суммарно) ---
        home_goals = stats.get('goals', {}).get('home', 0)
        away_goals = stats.get('goals', {}).get('away', 0)
        total_goals = home_goals + away_goals
        if not (f['total_goals_min'] <= total_goals <= f['total_goals_max']):
            continue

        home_corners = stats.get('corners', {}).get('home', 0)
        away_corners = stats.get('corners', {}).get('away', 0)
        total_corners = home_corners + away_corners
        if not (f['total_corners_min'] <= total_corners <= f['total_corners_max']):
            continue

        home_shots = stats.get('shots', {}).get('home', 0)
        away_shots = stats.get('shots', {}).get('away', 0)
        total_shots = home_shots + away_shots
        if not (f['total_shots_min'] <= total_shots <= f['total_shots_max']):
            continue

        home_sot = stats.get('shots_on_target', {}).get('home', 0)
        away_sot = stats.get('shots_on_target', {}).get('away', 0)
        total_sot = home_sot + away_sot
        if not (f['total_sot_min'] <= total_sot <= f['total_sot_max']):
            continue

        home_yellow = stats.get('yellow_cards', {}).get('home', 0)
        away_yellow = stats.get('yellow_cards', {}).get('away', 0)
        total_yellow = home_yellow + away_yellow
        if not (f['total_yellow_min'] <= total_yellow <= f['total_yellow_max']):
            continue

        # --- Индивидуальные показатели хозяев ---
        if not (f['home_goals_min'] <= home_goals <= f['home_goals_max']): continue
        if not (f['home_corners_min'] <= home_corners <= f['home_corners_max']): continue
        if not (f['home_shots_min'] <= home_shots <= f['home_shots_max']): continue
        if not (f['home_sot_min'] <= home_sot <= f['home_sot_max']): continue
        if not (f['home_yellow_min'] <= home_yellow <= f['home_yellow_max']): continue

        # --- Индивидуальные показатели гостей ---
        if not (f['away_goals_min'] <= away_goals <= f['away_goals_max']): continue
        if not (f['away_corners_min'] <= away_corners <= f['away_corners_max']): continue
        if not (f['away_shots_min'] <= away_shots <= f['away_shots_max']): continue
        if not (f['away_sot_min'] <= away_sot <= f['away_sot_max']): continue
        if not (f['away_yellow_min'] <= away_yellow <= f['away_yellow_max']): continue

        # --- Коэффициенты ---
        p1 = odds.get('p1', 0.0)
        p2 = odds.get('p2', 0.0)
        draw = odds.get('draw', 0.0)
        over25 = odds.get('total_over_2_5', 0.0)
        if not (f['odds_p1_min'] <= p1 <= f['odds_p1_max']): continue
        if not (f['odds_p2_min'] <= p2 <= f['odds_p2_max']): continue
        if not (f['odds_draw_min'] <= draw <= f['odds_draw_max']): continue
        if not (f['odds_total_over_2_5_min'] <= over25 <= f['odds_total_over_2_5_max']): continue

        # --- Проверка статистики предыдущих матчей (если данные предоставлены) ---
        if h2h_data is not None:
            avg_goals = h2h_data.get('avg_goals', 0)
            if not (f['h2h_avg_goals_min'] <= avg_goals <= f['h2h_avg_goals_max']):
                continue
        if home_recent is not None:
            avg_home = home_recent.get('avg_goals', 0)
            if not (f['home_recent_goals_min'] <= avg_home <= f['home_recent_goals_max']):
                continue
        if away_recent is not None:
            avg_away = away_recent.get('avg_goals', 0)
            if not (f['away_recent_goals_min'] <= avg_away <= f['away_recent_goals_max']):
                continue

        # Все условия выполнены
        triggered.append(f)
    return triggered