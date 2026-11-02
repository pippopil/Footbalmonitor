import json
from typing import Dict, List, Any, Optional
from app.utils.comparison_utils import compare
from app.utils.stats_utils import get_current_stat, get_stat_from_match

# Declarative dictionary of stat extractors to eliminate duplicate range checks in check_static_conditions
STATIC_EXTRACTORS = {
    'match_time': lambda m, s, o, g: float(m.get('minute', 0)),
    'total_goals': lambda m, s, o, g: float(s.get('goals', {}).get('home', 0) + s.get('goals', {}).get('away', 0)),
    'home_goals': lambda m, s, o, g: float(s.get('goals', {}).get('home', 0)),
    'away_goals': lambda m, s, o, g: float(s.get('goals', {}).get('away', 0)),
    'total_corners': lambda m, s, o, g: float(s.get('corners', {}).get('home', 0) + s.get('corners', {}).get('away', 0)),
    'home_corners': lambda m, s, o, g: float(s.get('corners', {}).get('home', 0)),
    'away_corners': lambda m, s, o, g: float(s.get('corners', {}).get('away', 0)),
    'total_shots': lambda m, s, o, g: float(s.get('shots', {}).get('home', 0) + s.get('shots', {}).get('away', 0)),
    'home_shots': lambda m, s, o, g: float(s.get('shots', {}).get('home', 0)),
    'away_shots': lambda m, s, o, g: float(s.get('shots', {}).get('away', 0)),
    'total_sot': lambda m, s, o, g: float(s.get('shots_on_target', {}).get('home', 0) + s.get('shots_on_target', {}).get('away', 0)),
    'home_sot': lambda m, s, o, g: float(s.get('shots_on_target', {}).get('home', 0)),
    'away_sot': lambda m, s, o, g: float(s.get('shots_on_target', {}).get('away', 0)),
    'total_yellow': lambda m, s, o, g: float(s.get('yellow_cards', {}).get('home', 0) + s.get('yellow_cards', {}).get('away', 0)),
    'home_yellow': lambda m, s, o, g: float(s.get('yellow_cards', {}).get('home', 0)),
    'away_yellow': lambda m, s, o, g: float(s.get('yellow_cards', {}).get('away', 0)),
    'odds_p1': lambda m, s, o, g: float(o.get('p1', 0.0) if isinstance(o, dict) else 0.0),
    'odds_p2': lambda m, s, o, g: float(o.get('p2', 0.0) if isinstance(o, dict) else 0.0),
    'odds_draw': lambda m, s, o, g: float(o.get('draw', 0.0) if isinstance(o, dict) else 0.0),
    'odds_total_over_2_5': lambda m, s, o, g: float(o.get('total_over_2_5', 0.0) if isinstance(o, dict) else 0.0),
}

def evaluate_rule(rule: Dict, match: Dict, stats: Dict, odds: Dict, glicko: Dict,
                  home_recent_matches: Optional[List[Dict]] = None,
                  away_recent_matches: Optional[List[Dict]] = None) -> bool:
    """
    Evaluates a single dynamic rule against the current match state or team historical trends.
    """
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
        recent = home_recent_matches if team == 'home' else away_recent_matches
        recent = recent or []
        hits = 0
        for m in recent[:matches_count]:
            val = get_stat_from_match(m, stat_name)
            if compare(val, comparison, threshold):
                hits += 1
        return hits >= required_hits
    elif rule_type == 'time_window':
        # Replaced dummy "return True" with real minute-window check
        min_minute = int(rule.get('min_minute', rule.get('min', 0)))
        max_minute = int(rule.get('max_minute', rule.get('max', 90)))
        minute = int(match.get('minute', 0))
        return min_minute <= minute <= max_minute
    else:
        return False

def check_static_conditions(f: Dict, match: Dict, stats: Dict, odds: Dict, glicko: Dict,
                            h2h_data: Dict = None, home_recent_agg: Dict = None, away_recent_agg: Dict = None) -> bool:
    """
    Проверяет все статические поля фильтра.
    Заменяет десятки однотипных ручных if-проверок компактным декларативным циклом.
    """
    if not isinstance(odds, dict):
        odds = {}
    if not isinstance(stats, dict):
        stats = {}
    if not isinstance(glicko, dict) and glicko is not None:
        glicko = {}

    # 1. Проверка стандартных диапазонов из декларативной карты
    for stat_key, extractor in STATIC_EXTRACTORS.items():
        min_key = f"{stat_key}_min"
        max_key = f"{stat_key}_max"
        if min_key in f and max_key in f:
            val = extractor(match, stats, odds, glicko)
            if not (f[min_key] <= val <= f[max_key]):
                return False

    # 2. Glicko вероятности (если переданы)
    if glicko is not None:
        glicko_checks = [
            ('glicko_home_min', 'glicko_home_max', glicko.get('home_prob', 0)),
            ('glicko_away_min', 'glicko_away_max', glicko.get('away_prob', 0)),
            ('glicko_draw_min', 'glicko_draw_max', glicko.get('draw_prob', 0)),
        ]
        for min_k, max_k, prob in glicko_checks:
            if min_k in f and max_k in f:
                if not (f[min_k] <= prob <= f[max_k]):
                    return False

    # 3. Исторические H2H и недавние матчи
    if h2h_data is not None and 'h2h_avg_goals_min' in f and 'h2h_avg_goals_max' in f:
        avg_goals = h2h_data.get('avg_goals', 0)
        if not (f['h2h_avg_goals_min'] <= avg_goals <= f['h2h_avg_goals_max']):
            return False

    if home_recent_agg is not None and 'home_recent_goals_min' in f and 'home_recent_goals_max' in f:
        avg_home = home_recent_agg.get('avg_goals', 0)
        if not (f['home_recent_goals_min'] <= avg_home <= f['home_recent_goals_max']):
            return False

    if away_recent_agg is not None and 'away_recent_goals_min' in f and 'away_recent_goals_max' in f:
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
        # 1. Проверка статических условий
        if not check_static_conditions(f, match, stats, odds, glicko, h2h_data, home_recent_agg, away_recent_agg):
            continue

        # 2. Проверка комбинированных динамических правил
        rules_json = f.get('rules', '[]')
        try:
            rules = json.loads(rules_json) if isinstance(rules_json, str) else rules_json
        except Exception:
            rules = []
        logic = f.get('rule_logic', 'AND')

        if rules:
            results = [
                evaluate_rule(rule, match, stats, odds, glicko, home_recent_matches, away_recent_matches)
                for rule in rules
            ]
            if logic == 'AND' and all(results):
                triggered.append({
                    'filter': f,
                    'conditions': [str(r) for r in rules],
                    'glicko': glicko
                })
            elif logic == 'OR' and any(results):
                triggered.append({
                    'filter': f,
                    'conditions': [str(r) for r in rules],
                    'glicko': glicko
                })
        else:
            triggered.append({
                'filter': f,
                'conditions': [],
                'glicko': glicko
            })

    return triggered

def check_single_filter(match: Dict, stats: Dict, odds: Dict, filter_dict: Dict,
                        h2h_data: Dict = None, home_recent_agg: Dict = None, away_recent_agg: Dict = None,
                        glicko: Dict = None,
                        home_recent_matches: List[Dict] = None,
                        away_recent_matches: List[Dict] = None) -> bool:
    """Проверяет один фильтр, возвращает True, если все условия выполнены."""
    result = check_filters(match, stats, odds, [filter_dict], h2h_data, home_recent_agg, away_recent_agg,
                           glicko, home_recent_matches, away_recent_matches)
    return len(result) > 0

def determine_actual_outcome(match_details: Dict, expected_outcome: str) -> str:
    """
    Определяет реальный исход завершенного матча.
    """
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
        except Exception:
            return 'unknown'

    if expected_outcome.startswith('corners_over_'):
        threshold_str = expected_outcome.replace('corners_over_', '').replace('_', '.')
        try:
            threshold = float(threshold_str)
            return 'over' if total_corners > threshold else 'under'
        except Exception:
            return 'unknown'

    if expected_outcome.startswith('yellow_cards_over_'):
        threshold_str = expected_outcome.replace('yellow_cards_over_', '').replace('_', '.')
        try:
            threshold = float(threshold_str)
            return 'over' if total_yellow > threshold else 'under'
        except Exception:
            return 'unknown'

    return 'unknown'

def is_outcome_success(actual: str, expected: str) -> bool:
    """
    Проверяет, сыграла ли ставка.
    """
    if expected.startswith('total_') or expected.startswith('corners_') or expected.startswith('yellow_'):
        expected_norm = 'over' if 'over' in expected else 'under'
        return actual == expected_norm
    return actual == expected
