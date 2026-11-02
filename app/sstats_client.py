import requests
import time
import logging
from functools import wraps
from typing import Dict, List, Optional

from app.config import SSTATS_API_KEY, SSTATS_BASE_URL, RETRY_ATTEMPTS, RETRY_DELAY

logger = logging.getLogger(__name__)

def retry(max_attempts=RETRY_ATTEMPTS, delay=RETRY_DELAY, backoff=2):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            current_delay = delay
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        logger.error(f"Retry failed for {func.__name__}: {e}")
                        raise
                    logger.warning(f"Retry {attempt+1}/{max_attempts} for {func.__name__}: {e}")
                    time.sleep(current_delay)
                    current_delay *= backoff
            return None
        return wrapper
    return decorator

class SStatsClient:
    def __init__(self, api_key: Optional[str] = None, base_url: str = SSTATS_BASE_URL):
        self.api_key = api_key or SSTATS_API_KEY
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.last_request_time = 0
        self.min_interval = 2.0

    @retry()
    def _get(self, endpoint: str, params: Optional[Dict] = None, use_key: bool = True) -> Dict:
        if params is None:
            params = {}
        if use_key and self.api_key:
            params['apikey'] = self.api_key
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        now = time.time()
        elapsed = now - self.last_request_time
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self.last_request_time = time.time()
        try:
            resp = self.session.get(url, params=params, timeout=15)
            resp.raise_for_status()
            data = resp.json()
            status = data.get('status', '')
            if status.lower() == 'ok':
                return data  # возвращаем весь ответ
            else:
                logger.error(f"SStats API error: {data.get('message', 'Unknown error')}")
                return {}
        except requests.exceptions.RequestException as e:
            if use_key and hasattr(e, 'response') and e.response is not None and e.response.status_code == 400:
                logger.warning("Ошибка 400 с ключом, пробуем без ключа")
                return self._get(endpoint, params, use_key=False)
            logger.error(f"SStats request failed: {e}")
            raise
        except ValueError as e:
            logger.error(f"SStats JSON decode error: {e}")
            raise

    # ===== Основные методы =====

    def get_leagues(self) -> List[Dict]:
        return self._get("leagues")

    def get_live_matches(self) -> List[Dict]:
        raw = self._get("games/list", {"today": "true"})
        matches = raw.get('data', []) if isinstance(raw, dict) else []
        result = []
        for m in matches:
            match = {
                'id': m.get('id'),
                'homeTeam': {
                    'id': m.get('homeTeam', {}).get('id'),
                    'name': m.get('homeTeam', {}).get('name')
                },
                'awayTeam': {
                    'id': m.get('awayTeam', {}).get('id'),
                    'name': m.get('awayTeam', {}).get('name')
                },
                'minute': m.get('elapsed', 0) if m.get('elapsed') is not None else 0,
                'goals': {
                    'home': m.get('homeResult', 0) if m.get('homeResult') is not None else 0,
                    'away': m.get('awayResult', 0) if m.get('awayResult') is not None else 0
                },
                'status': m.get('status', 0),
                'statusName': m.get('statusName', ''),
                'league': {
                    'id': m.get('league', {}).get('id'),
                    'name': m.get('league', {}).get('name')
                }
            }
            result.append(match)
        return result

    def get_match_details(self, match_id: int) -> Dict:
        raw = self._get(f"games/{match_id}")
        if not raw or not isinstance(raw, dict):
            return {}

        data = raw.get('data', {})
        game = data.get('game', {})
        stats_data = data.get('statistics', {})  # статистика может быть на этом уровне

        # Если статистика есть в stats_data, используем её
        if stats_data and isinstance(stats_data, dict):
            home_goals = game.get('homeResult', 0) if game.get('homeResult') is not None else 0
            away_goals = game.get('awayResult', 0) if game.get('awayResult') is not None else 0
            stats = {
                'goals': {'home': home_goals, 'away': away_goals, 'total': home_goals + away_goals},
                'corners': {
                    'home': stats_data.get('cornerKicksHome', 0),
                    'away': stats_data.get('cornerKicksAway', 0),
                    'total': stats_data.get('cornerKicksHome', 0) + stats_data.get('cornerKicksAway', 0)
                },
                'shots': {
                    'home': stats_data.get('totalShotsHome', 0),
                    'away': stats_data.get('totalShotsAway', 0),
                    'total': stats_data.get('totalShotsHome', 0) + stats_data.get('totalShotsAway', 0)
                },
                'shots_on_target': {
                    'home': stats_data.get('shotsOnGoalHome', 0),
                    'away': stats_data.get('shotsOnGoalAway', 0),
                    'total': stats_data.get('shotsOnGoalHome', 0) + stats_data.get('shotsOnGoalAway', 0)
                },
                'yellow_cards': {
                    'home': stats_data.get('yellowCardsHome', 0),
                    'away': stats_data.get('yellowCardsAway', 0),
                    'total': stats_data.get('yellowCardsHome', 0) + stats_data.get('yellowCardsAway', 0)
                }
            }
            return stats

        # Если stats_data нет, пытаемся из game (запасной вариант)
        stats = {}
        home_goals = game.get('homeResult', 0) if game.get('homeResult') is not None else 0
        away_goals = game.get('awayResult', 0) if game.get('awayResult') is not None else 0
        stats['goals'] = {'home': home_goals, 'away': away_goals, 'total': home_goals + away_goals}

        # Пытаемся найти вложенную статистику внутри game (если она там)
        home_corners = game.get('cornerKicksHome', 0) or 0
        away_corners = game.get('cornerKicksAway', 0) or 0
        stats['corners'] = {'home': home_corners, 'away': away_corners, 'total': home_corners + away_corners}

        home_shots = game.get('totalShotsHome', 0) or 0
        away_shots = game.get('totalShotsAway', 0) or 0
        stats['shots'] = {'home': home_shots, 'away': away_shots, 'total': home_shots + away_shots}

        home_sot = game.get('shotsOnGoalHome', 0) or 0
        away_sot = game.get('shotsOnGoalAway', 0) or 0
        stats['shots_on_target'] = {'home': home_sot, 'away': away_sot, 'total': home_sot + away_sot}

        home_yellow = game.get('yellowCardsHome', 0) or 0
        away_yellow = game.get('yellowCardsAway', 0) or 0
        stats['yellow_cards'] = {'home': home_yellow, 'away': away_yellow, 'total': home_yellow + away_yellow}

        return stats

    def get_match_odds(self, match_id: int, live: bool = False) -> Dict:
        raw = self._get(f"games/{match_id}")
        game = raw.get('data', {}).get('game', {}) if isinstance(raw, dict) else {}
        if not game:
            return {}
        odds_list = game.get('odds', [])
        odds_dict = {}
        for market in odds_list:
            market_id = market.get('marketId')
            if market_id == 1:
                for odd in market.get('odds', []):
                    name = odd.get('name', '').lower()
                    if 'home' in name:
                        odds_dict['p1'] = odd.get('value')
                    elif 'away' in name:
                        odds_dict['p2'] = odd.get('value')
                    elif 'draw' in name:
                        odds_dict['draw'] = odd.get('value')
            elif market_id == 5:
                for odd in market.get('odds', []):
                    name = odd.get('name', '').lower()
                    if 'over 2.5' in name or 'over 2,5' in name:
                        odds_dict['total_over_2_5'] = odd.get('value')
        odds_dict.setdefault('p1', 0.0)
        odds_dict.setdefault('p2', 0.0)
        odds_dict.setdefault('draw', 0.0)
        odds_dict.setdefault('total_over_2_5', 0.0)
        return odds_dict

    def get_glicko(self, match_id: int) -> Dict:
        # Glicko не поддерживается SStats
        return {}

    # ===== Исторические данные (заглушки) =====

    def get_head_to_head(self, team1_id: int, team2_id: int, limit: int = 5) -> Dict:
        return self._empty_stats()

    def get_team_recent_matches(self, team_id: int, venue: str = 'all', limit: int = 5) -> Dict:
        return self._empty_stats()

    def get_team_recent_matches_full(self, team_id: int, limit: int = 5, venue: str = 'all') -> List[Dict]:
        return []

    def get_matches_by_date(self, from_date: str, to_date: str, limit: int = 100) -> List[Dict]:
        raw = self._get("games/list", {"from": from_date, "to": to_date, "limit": limit})
        matches = raw.get('data', []) if isinstance(raw, dict) else []
        result = []
        for m in matches:
            match = {
                'id': m.get('id'),
                'homeTeam': {
                    'id': m.get('homeTeam', {}).get('id'),
                    'name': m.get('homeTeam', {}).get('name')
                },
                'awayTeam': {
                    'id': m.get('awayTeam', {}).get('id'),
                    'name': m.get('awayTeam', {}).get('name')
                },
                'minute': m.get('elapsed', 0) if m.get('elapsed') is not None else 0,
                'goals': {
                    'home': m.get('homeResult', 0) if m.get('homeResult') is not None else 0,
                    'away': m.get('awayResult', 0) if m.get('awayResult') is not None else 0
                },
                'status': m.get('status', 0),
                'statusName': m.get('statusName', ''),
                'league': {
                    'id': m.get('league', {}).get('id'),
                    'name': m.get('league', {}).get('name')
                }
            }
            result.append(match)
        return result

    def _empty_stats(self) -> Dict:
        return {
            'matches_count': 0,
            'avg_goals': 0.0,
            'avg_corners': 0.0,
            'avg_shots': 0.0,
            'avg_sot': 0.0,
            'avg_yellow': 0.0,
        }