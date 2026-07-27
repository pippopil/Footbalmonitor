import requests
import time
import logging
from typing import Dict, List, Optional
from app.config import SSTATS_API_KEY, SSTATS_BASE_URL

logger = logging.getLogger(__name__)

class SStatsClient:
    def __init__(self, api_key: Optional[str] = None, base_url: str = SSTATS_BASE_URL):
        self.api_key = api_key or SSTATS_API_KEY
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.last_request_time = 0
        self.min_interval = 1.0  # уменьшили до 1 секунды

    def _get(self, endpoint: str, params: Optional[Dict] = None) -> Dict:
        if params is None:
            params = {}
        if self.api_key:
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
            if data.get('status') == 'OK':
                return data.get('data', {}) if isinstance(data.get('data'), dict) else data.get('data', [])
            else:
                logger.error(f"API error: {data.get('message', 'Unknown error')}")
                return {}
        except Exception as e:
            logger.error(f"Request failed: {e}")
            return {}

    def get_live_matches(self) -> List[Dict]:
        return self._get("games/list", {"today": "true"})

    def get_match_details(self, match_id: int) -> Dict:
        data = self._get(f"games/{match_id}")
        if not data:
            logger.warning(f"Нет данных для матча {match_id}")
            return self._empty_stats_dict()

        game = data.get('game', {})
        events = data.get('events', [])
        stats_from_api = data.get('statistics')

        def to_int(val):
            return int(val) if val is not None else 0

        if stats_from_api and isinstance(stats_from_api, dict):
            logger.info(f"Матч {match_id}: статистика получена от API")
            return {
                'goals': {
                    'home': to_int(game.get('homeResult')),
                    'away': to_int(game.get('awayResult'))
                },
                'corners': {
                    'home': to_int(stats_from_api.get('cornerKicksHome')),
                    'away': to_int(stats_from_api.get('cornerKicksAway'))
                },
                'shots': {
                    'home': to_int(stats_from_api.get('totalShotsHome')),
                    'away': to_int(stats_from_api.get('totalShotsAway'))
                },
                'shots_on_target': {
                    'home': to_int(stats_from_api.get('shotsOnGoalHome')),
                    'away': to_int(stats_from_api.get('shotsOnGoalAway'))
                },
                'yellow_cards': {
                    'home': to_int(stats_from_api.get('yellowCardsHome')),
                    'away': to_int(stats_from_api.get('yellowCardsAway'))
                }
            }

        logger.info(f"Матч {match_id}: статистика отсутствует, собираем из game/events")
        home_goals = to_int(game.get('homeResult'))
        away_goals = to_int(game.get('awayResult'))

        home_yellow = 0
        away_yellow = 0
        home_id = game.get('homeTeam', {}).get('id')
        away_id = game.get('awayTeam', {}).get('id')
        for ev in events:
            if ev.get('type') == 2:  # Yellow Card
                team_id = ev.get('teamId')
                if team_id == home_id:
                    home_yellow += 1
                elif team_id == away_id:
                    away_yellow += 1

        return {
            'goals': {'home': home_goals, 'away': away_goals},
            'corners': {'home': 0, 'away': 0},
            'shots': {'home': 0, 'away': 0},
            'shots_on_target': {'home': 0, 'away': 0},
            'yellow_cards': {'home': home_yellow, 'away': away_yellow},
        }

    def _empty_stats_dict(self) -> Dict:
        return {
            'goals': {'home': 0, 'away': 0},
            'corners': {'home': 0, 'away': 0},
            'shots': {'home': 0, 'away': 0},
            'shots_on_target': {'home': 0, 'away': 0},
            'yellow_cards': {'home': 0, 'away': 0},
        }

    def get_match_odds(self, match_id: int, live: bool = False) -> Dict:
        endpoint = f"odds/live/{match_id}" if live else f"odds/{match_id}"
        data = self._get(endpoint)
        if not data:
            return {'p1': 0.0, 'draw': 0.0, 'p2': 0.0, 'total_over_2_5': 0.0}

        if isinstance(data, list):
            result = {'p1': 0.0, 'draw': 0.0, 'p2': 0.0, 'total_over_2_5': 0.0}
            for market in data:
                market_id = market.get('marketId')
                odds_list = market.get('odds', [])
                if market_id == 1:
                    for odd in odds_list:
                        name = odd.get('name')
                        value = odd.get('value', 0.0)
                        if name == 'Home':
                            result['p1'] = value
                        elif name == 'Draw':
                            result['draw'] = value
                        elif name == 'Away':
                            result['p2'] = value
                elif market_id == 5:
                    for odd in odds_list:
                        name = odd.get('name')
                        value = odd.get('value', 0.0)
                        if name == 'Over 2.5' or name == 'Over 2.5 Goals':
                            result['total_over_2_5'] = value
            return result
        else:
            return {
                'p1': data.get('p1', 0.0),
                'draw': data.get('draw', 0.0),
                'p2': data.get('p2', 0.0),
                'total_over_2_5': data.get('total_over_2_5', 0.0)
            }

    def get_glicko(self, match_id: int) -> Dict:
        return self._get(f"games/glicko/{match_id}")

    def get_head_to_head(self, team1_id: int, team2_id: int, limit: int = 5) -> Dict:
        params = {"team1": team1_id, "team2": team2_id, "ended": "true", "limit": limit}
        matches = self._get("games/list", params)
        if not matches:
            return self._empty_stats_avg()

        total_goals = total_corners = total_shots = total_sot = total_yellow = 0
        count = 0
        for match in matches[:limit]:
            match_id = match.get('id')
            if not match_id:
                continue
            details = self.get_match_details(match_id)
            if not details:
                continue
            total_goals += details['goals']['home'] + details['goals']['away']
            total_corners += details['corners']['home'] + details['corners']['away']
            total_shots += details['shots']['home'] + details['shots']['away']
            total_sot += details['shots_on_target']['home'] + details['shots_on_target']['away']
            total_yellow += details['yellow_cards']['home'] + details['yellow_cards']['away']
            count += 1
            # убрали time.sleep(0.5) для скорости
        if count == 0:
            return self._empty_stats_avg()
        return {
            'matches_count': count,
            'avg_goals': total_goals / count,
            'avg_corners': total_corners / count,
            'avg_shots': total_shots / count,
            'avg_sot': total_sot / count,
            'avg_yellow': total_yellow / count,
        }

    def get_team_recent_matches(self, team_id: int, venue: str = 'all', limit: int = 5) -> Dict:
        params = {"team": team_id, "ended": "true", "limit": limit}
        matches = self._get("games/list", params)
        if not matches:
            return self._empty_stats_avg()

        total_goals = total_corners = total_shots = total_sot = total_yellow = 0
        count = 0
        for match in matches[:limit]:
            match_id = match.get('id')
            if not match_id:
                continue
            details = self.get_match_details(match_id)
            if not details:
                continue
            total_goals += details['goals']['home'] + details['goals']['away']
            total_corners += details['corners']['home'] + details['corners']['away']
            total_shots += details['shots']['home'] + details['shots']['away']
            total_sot += details['shots_on_target']['home'] + details['shots_on_target']['away']
            total_yellow += details['yellow_cards']['home'] + details['yellow_cards']['away']
            count += 1
            # убрали time.sleep(0.5)
        if count == 0:
            return self._empty_stats_avg()
        return {
            'matches_count': count,
            'avg_goals': total_goals / count,
            'avg_corners': total_corners / count,
            'avg_shots': total_shots / count,
            'avg_sot': total_sot / count,
            'avg_yellow': total_yellow / count,
        }

    def _empty_stats_avg(self) -> Dict:
        return {
            'matches_count': 0,
            'avg_goals': 0.0,
            'avg_corners': 0.0,
            'avg_shots': 0.0,
            'avg_sot': 0.0,
            'avg_yellow': 0.0,
        }

    def get_leagues(self) -> List[Dict]:
        return self._get("leagues")

    def get_matches_by_league(self, league_id: int, year: int, limit: int = 100) -> List[Dict]:
        return self._get("games/list", {"leagueid": league_id, "year": year, "limit": limit})

    def get_matches_by_date(self, from_date: str, to_date: str, limit: int = 100) -> List[Dict]:
        return self._get("games/list", {"from": from_date, "to": to_date, "limit": limit})

    def get_team_matches(self, team_id: int, from_date: Optional[str] = None, to_date: Optional[str] = None, limit: int = 50) -> List[Dict]:
        params = {"team": team_id, "limit": limit}
        if from_date:
            params["from"] = from_date
        if to_date:
            params["to"] = to_date
        return self._get("games/list", params)