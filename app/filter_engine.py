import json
from typing import Dict, List, Any, Optional

def get_current_stat(stat_name: str, match: Dict, stats: Dict, odds: Dict, glicko: Dict) -> float:
    if stat_name == 'minute':
        return float(match.get('minute', 0))
    if stat_name.startswith('odds_'):
        key = stat_name.replace('odds_', '')
        return float(odds.get(key, 0))
    if stat_name.startswith('glicko_'):
        key = stat_name.replace('glicko_', '')
        return float(glicko.get(key, 0))
    parts = stat_name.split('_')
    if len(parts) == 2 and parts[0] in ['home', 'away', 'total']:
        side = parts[0]
        stat_type = parts[1]
        if side == 'total':
            return float(stats.get(stat_type, {}).get('total', 0))
        else:
            return float(stats.get(stat_type, {}).get(side, 0))
    return 0.0

def get_stat_from_match(match_details: Dict, stat_name: str) -> float:
    stats = match_details.get('stats', {})
    if stat_name.startswith('total_'):
        stat_type = stat_name.replace('total_', '')
        return float(stats.get(stat_type, {}).get('total', 0))
    elif stat_name.startswith('home_'):
        stat_type = stat_name.replace('home_', '')
        return float(stats.get(stat_type, {}).get('home', 0))
    elif stat_name.startswith('away_'):
        stat_type = stat_name.replace('away_', '')
        return float(stats.get(stat_type, {}).get('away', 0))
    return 0.0

def compare(val: float, comparison: str, threshold: float) -> bool:
    if comparison == 'eq':
        return val == threshold
    elif comparison == 'gt':
        return val > threshold
    elif comparison == 'lt':
        return val < threshold
    elif comparison == 'gte':
        return val >= threshold
    elif comparison == 'lte':
        return val <= threshold
    return False

def evaluate_rule(rule: Dict, match: Dict, stats: Dict, odds: Dict, glicko: Dict,
                  home_recent_matches: Optional[List[Dict]] = None,
                  away_recent_matches: Optional[List[Dict]] = None) -> bool:
    rule_type = rule.get('type')
    if rule_type == 'stat':
        stat_name = rule.get('stat')
        comparison = rule.get('comparison')
        value = float(rule.get('value', 0))
        current = get_current_stat(stat_name, match, stats, odds, glicko)
        return compare(current, comparison, value)
    elif rule_type == 'trend':
        team = rule.get('team')
        stat_name = rule.get('stat')
        comparison = rule.get('comparison')
        threshold = float(rule.get('threshold', 0))
        matches_count = int(rule.get('matches', 5))
        required_hits = int(rule.get('required', matches_count))
        if team == 'home':
            recent = home_recent_matches or []
        else:
            recent = away_recent_matches or []
        hits = 0
        for m in recent[:matches_count]:
            val = get_stat_from_match(m, stat_name)
            if compare(val, comparison, threshold):
                hits += 1
        return hits >= required_hits
    elif rule_type == 'time_window':
        return True
    else:
        return False

def check_static_conditions(f: Dict, match: Dict, stats: Dict, odds: Dict, glicko: Dict,
                            h2h_data: Dict = None, home_recent_agg: Dict = None, away_recent_agg: Dict = None) -> bool:
    """Проверяет все статические поля фильтра. Возвращает True, если все условия выполнены."""
    # Убеждаемся, что odds — словарь (исправляет ошибку 'list' object has no attribute 'get')
    if not isinstance(odds, dict):
        odds = {}

    # Время матча
    minute = match.get('minute', 0)
    if not (f['match_time_min'] <= minute <= f['match_time_max']):
        return False

    # Общая статистика
    home_goals = stats.get('goals', {}).get('home', 0)
    away_goals = stats.get('goals', {}).get('away', 0)
    total_goals = home_goals + away_goals
    if not (f['total_goals_min'] <= total_goals <= f['total_goals_max']):
        return False

    home_corners = stats.get('corners', {}).get('home', 0)
    away_corners = stats.get('corners', {}).get('away', 0)
    total_corners = home_corners + away_corners
    if not (f['total_corners_min'] <= total_corners <= f['total_corners_max']):
        return False

    home_shots = stats.get('shots', {}).get('home', 0)
    away_shots = stats.get('shots', {}).get('away', 0)
    total_shots = home_shots + away_shots
    if not (f['total_shots_min'] <= total_shots <= f['total_shots_max']):
        return False

    home_sot = stats.get('shots_on_target', {}).get('home', 0)
    away_sot = stats.get('shots_on_target', {}).get('away', 0)
    total_sot = home_sot + away_sot
    if not (f['total_sot_min'] <= total_sot <= f['total_sot_max']):
        return False

    home_yellow = stats.get('yellow_cards', {}).get('home', 0)
    away_yellow = stats.get('yellow_cards', {}).get('away', 0)
    total_yellow = home_yellow + away_yellow
    if not (f['total_yellow_min'] <= total_yellow <= f['total_yellow_max']):
        return False

    # Индивидуальные показатели
    if not (f['home_goals_min'] <= home_goals <= f['home_goals_max']):
        return False
    if not (f['away_goals_min'] <= away_goals <= f['away_goals_max']):
        return False
    if not (f['home_corners_min'] <= home_corners <= f['home_corners_max']):
        return False
    if not (f['away_corners_min'] <= away_corners <= f['away_corners_max']):
        return False
    if not (f['home_shots_min'] <= home_shots <= f['home_shots_max']):
        return False
    if not (f['away_shots_min'] <= away_shots <= f['away_shots_max']):
        return False
    if not (f['home_sot_min'] <= home_sot <= f['home_sot_max']):
        return False
    if not (f['away_sot_min'] <= away_sot <= f['away_sot_max']):
        return False
    if not (f['home_yellow_min'] <= home_yellow <= f['home_yellow_max']):
        return False
    if not (f['away_yellow_min'] <= away_yellow <= f['away_yellow_max']):
        return False

    # Коэффициенты
    p1 = odds.get('p1', 0.0)
    p2 = odds.get('p2', 0.0)
    draw = odds.get('draw', 0.0)
    over25 = odds.get('total_over_2_5', 0.0)
    if not (f['odds_p1_min'] <= p1 <= f['odds_p1_max']):
        return False
    if not (f['odds_p2_min'] <= p2 <= f['odds_p2_max']):
        return False
    if not (f['odds_draw_min'] <= draw <= f['odds_draw_max']):
        return False
    if not (f['odds_total_over_2_5_min'] <= over25 <= f['odds_total_over_2_5_max']):
        return False

    # Glicko
    if glicko is not None:
        home_prob = glicko.get('home_prob', 0)
        draw_prob = glicko.get('draw_prob', 0)
        away_prob = glicko.get('away_prob', 0)
        if not (f['glicko_home_min'] <= home_prob <= f['glicko_home_max']):
            return False
        if not (f['glicko_away_min'] <= away_prob <= f['glicko_away_max']):
            return False
        if not (f['glicko_draw_min'] <= draw_prob <= f['glicko_draw_max']):
            return False

    # Исторические данные
    if h2h_data is not None:
        avg_goals = h2h_data.get('avg_goals', 0)
        if not (f['h2h_avg_goals_min'] <= avg_goals <= f['h2h_avg_goals_max']):
            return False
    if home_recent_agg is not None:
        avg_home = home_recent_agg.get('avg_goals', 0)
        if not (f['home_recent_goals_min'] <= avg_home <= f['home_recent_goals_max']):
            return False
    if away_recent_agg is not None:
        avg_away = away_recent_agg.get('avg_goals', 0)
        if not (f['away_recent_goals_min'] <= avg_away <= f['away_recent_goals_max']):
            return False

    return True

def check_filters(match: Dict, stats: Dict, odds: Dict, filters: List[Dict],
                  h2h_data: Dict = None, home_recent_agg: Dict = None, away_recent_agg: Dict = None,
                  glicko: Dict = None,
                  home_recent_matches: List[Dict] = None,
                  away_recent_matches: List[Dict] = None) -> List[Dict]:
    """
    Проверяет матч по списку фильтров.
    Возвращает список словарей: { 'filter': filter, 'conditions': условия, 'glicko': glicko }
    """
    triggered = []
    for f in filters:
        # 1. Проверка статических полей
        if not check_static_conditions(f, match, stats, odds, glicko, h2h_data, home_recent_agg, away_recent_agg):
            continue

        # 2. Проверка комбинированных правил (если есть)
        rules_json = f.get('rules', '[]')
        try:
            rules = json.loads(rules_json)
        except:
            rules = []
        logic = f.get('rule_logic', 'AND')

        if rules:
            results = []
            for rule in rules:
                res = evaluate_rule(rule, match, stats, odds, glicko,
                                   home_recent_matches, away_recent_matches)
                results.append(res)
            if logic == 'AND':
                if all(results):
                    triggered.append({
                        'filter': f,
                        'conditions': [str(r) for r in rules],
                        'glicko': glicko
                    })
            elif logic == 'OR':
                if any(results):
                    triggered.append({
                        'filter': f,
                        'conditions': [str(r) for r in rules],
                        'glicko': glicko
                    })
        else:
            # Если правил нет, фильтр срабатывает только по статике
            triggered.append({
                'filter': f,
                'conditions': [],
                'glicko': glicko
            })

    return triggered

def check_single_filter(match: Dict, stats: Dict, odds: Dict, filter: Dict,
                        h2h_data: Dict = None, home_recent_agg: Dict = None, away_recent_agg: Dict = None,
                        glicko: Dict = None,
                        home_recent_matches: List[Dict] = None,
                        away_recent_matches: List[Dict] = None) -> bool:
    """Проверяет один фильтр, возвращает True, если все условия выполнены."""
    result = check_filters(match, stats, odds, [filter], h2h_data, home_recent_agg, away_recent_agg,
                           glicko, home_recent_matches, away_recent_matches)
    return len(result) > 0

def determine_actual_outcome(match_details: Dict, expected_outcome: str) -> str:
    stats = match_details.get('stats', {})
    home_goals = stats.get('goals', {}).get('home', 0)
    away_goals = stats.get('goals', {}).get('away', 0)
    total_goals = home_goals + away_goals
    total_corners = stats.get('corners', {}).get('total', 0)
    total_yellow = stats.get('yellow_cards', {}).get('total', 0)

    if expected_outcome in ['home_win', 'away_win', 'draw']:
        if home_goals > away_goals:
            return 'home_win'
        elif home_goals < away_goals:
            return 'away_win'
        else:
            return 'draw'

    if expected_outcome == 'total_over_2_5':
        return 'over' if total_goals > 2.5 else 'under'
    if expected_outcome == 'total_under_2_5':
        return 'under' if total_goals < 2.5 else 'over'
    if expected_outcome.startswith('total_over_'):
        threshold_str = expected_outcome.replace('total_over_', '').replace('_', '.')
        try:
            threshold = float(threshold_str)
            return 'over' if total_goals > threshold else 'under'
        except:
            return 'unknown'

    if expected_outcome.startswith('corners_over_'):
        threshold_str = expected_outcome.replace('corners_over_', '').replace('_', '.')
        try:
            threshold = float(threshold_str)
            return 'over' if total_corners > threshold else 'under'
        except:
            return 'unknown'

    if expected_outcome.startswith('yellow_cards_over_'):
        threshold_str = expected_outcome.replace('yellow_cards_over_', '').replace('_', '.')
        try:
            threshold = float(threshold_str)
            return 'over' if total_yellow > threshold else 'under'
        except:
            return 'unknown'

    if expected_outcome == 'first_half_over_0_5':
        return 'unknown'

    return 'unknown'

def is_outcome_success(actual: str, expected: str) -> bool:
    if expected.startswith('total_') or expected.startswith('corners_') or expected.startswith('yellow_'):
        if 'over' in expected:
            expected_norm = 'over'
        else:
            expected_norm = 'under'
        return actual == expected_norm
    return actual == expected