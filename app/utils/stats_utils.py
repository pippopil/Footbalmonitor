"""
Utilities for extracting and calculating statistics from live matches and historical match records.
"""
from typing import Dict, Any

def get_current_stat(stat_name: str, match: Dict[str, Any], stats: Dict[str, Any], odds: Dict[str, Any], glicko: Dict[str, Any]) -> float:
    """
    Extracts a scalar float value for a given stat_name from match snapshot dictionaries.
    """
    if stat_name == 'minute':
        return float(match.get('minute', 0))
    if stat_name.startswith('odds_'):
        key = stat_name.replace('odds_', '')
        return float(odds.get(key, 0) if isinstance(odds, dict) else 0)
    if stat_name.startswith('glicko_'):
        key = stat_name.replace('glicko_', '')
        if isinstance(glicko, dict):
            val = glicko.get(key, glicko.get(f"{key}_prob", 0))
            return float(val)
        return 0.0
    
    parts = stat_name.split('_')
    if len(parts) == 2 and parts[0] in ['home', 'away', 'total']:
        side = parts[0]
        stat_type = parts[1]
        stat_dict = stats.get(stat_type, {}) if isinstance(stats, dict) else {}
        if side == 'total':
            if 'total' in stat_dict:
                return float(stat_dict.get('total', 0))
            return float(stat_dict.get('home', 0)) + float(stat_dict.get('away', 0))
        else:
            return float(stat_dict.get(side, 0))
            
    return 0.0

def get_stat_from_match(match_details: Dict[str, Any], stat_name: str) -> float:
    """
    Extracts statistic value from a historical or finished match dictionary.
    """
    stats = match_details.get('stats', {}) if isinstance(match_details, dict) else {}
    if stat_name.startswith('total_'):
        stat_type = stat_name.replace('total_', '')
        stat_dict = stats.get(stat_type, {}) if isinstance(stats, dict) else {}
        if 'total' in stat_dict:
            return float(stat_dict.get('total', 0))
        return float(stat_dict.get('home', 0)) + float(stat_dict.get('away', 0))
    elif stat_name.startswith('home_'):
        stat_type = stat_name.replace('home_', '')
        stat_dict = stats.get(stat_type, {}) if isinstance(stats, dict) else {}
        return float(stat_dict.get('home', 0))
    elif stat_name.startswith('away_'):
        stat_type = stat_name.replace('away_', '')
        stat_dict = stats.get(stat_type, {}) if isinstance(stats, dict) else {}
        return float(stat_dict.get('away', 0))
    return 0.0
