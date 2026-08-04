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

def check_filters(match: Dict, stats: Dict, odds: Dict, filters: List[Dict],
                  h2h_data: Dict = None, home_recent_agg: Dict = None, away_recent_agg: Dict = None,
                  glicko: Dict = None,
                  home_recent_matches: List[Dict] = None,
                  away_recent_matches: List[Dict] = None) -> List[Dict]:
    triggered = []
    for f in filters:
        rules_json = f.get('rules', '[]')
        try:
            rules = json.loads(rules_json)
        except:
            rules = []
        logic = f.get('rule_logic', 'AND')
        if not rules:
            continue
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
    return triggered

def check_single_filter(match: Dict, stats: Dict, odds: Dict, filter: Dict,
                        h2h_data: Dict = None, home_recent_agg: Dict = None, away_recent_agg: Dict = None,
                        glicko: Dict = None,
                        home_recent_matches: List[Dict] = None,
                        away_recent_matches: List[Dict] = None) -> bool:
    result = check_filters(match, stats, odds, [filter], h2h_data, home_recent_agg, away_recent_agg,
                           glicko, home_recent_matches, away_recent_matches)
    return len(result) > 0

def determine_actual_outcome(match_details: Dict, expected_outcome: str) -> str:
    """
    Определяет фактический исход матча по его детальным данным.
    Поддерживает:
      - Исходы матча: home_win, away_win, draw
      - Тотал голов: total_over_0_5, total_over_2_5, total_under_2_5
      - Тотал угловых: corners_over_1_5, corners_over_2_5, ... до corners_over_15_5
      - Тотал ЖК: yellow_cards_over_1_5, yellow_cards_over_2_5, yellow_cards_over_3_5
      - Гол в первом тайме (заглушка): first_half_over_0_5
    """
    stats = match_details.get('stats', {})
    home_goals = stats.get('goals', {}).get('home', 0)
    away_goals = stats.get('goals', {}).get('away', 0)
    total_goals = home_goals + away_goals
    total_corners = stats.get('corners', {}).get('total', 0)
    total_yellow = stats.get('yellow_cards', {}).get('total', 0)

    # Исходы матча
    if expected_outcome in ['home_win', 'away_win', 'draw']:
        if home_goals > away_goals:
            return 'home_win'
        elif home_goals < away_goals:
            return 'away_win'
        else:
            return 'draw'

    # Тотал голов
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

    # Угловые
    if expected_outcome.startswith('corners_over_'):
        threshold_str = expected_outcome.replace('corners_over_', '').replace('_', '.')
        try:
            threshold = float(threshold_str)
            return 'over' if total_corners > threshold else 'under'
        except:
            return 'unknown'

    # ЖК
    if expected_outcome.startswith('yellow_cards_over_'):
        threshold_str = expected_outcome.replace('yellow_cards_over_', '').replace('_', '.')
        try:
            threshold = float(threshold_str)
            return 'over' if total_yellow > threshold else 'under'
        except:
            return 'unknown'

    # Гол в первом тайме (заглушка)
    if expected_outcome == 'first_half_over_0_5':
        return 'unknown'

    return 'unknown'

def is_outcome_success(actual: str, expected: str) -> bool:
    """
    Сравнивает фактический исход с ожидаемым для всех типов.
    Для тоталов (over/under) сравнивает строки 'over'/'under'.
    Для исходов матча сравнивает строки.
    """
    # Нормализация для тоталов
    if expected.startswith('total_') or expected.startswith('corners_') or expected.startswith('yellow_'):
        # Определяем, что ожидается: 'over' или 'under'
        if 'over' in expected:
            expected_norm = 'over'
        else:
            expected_norm = 'under'
        return actual == expected_norm
    # Исходы матча
    return actual == expected