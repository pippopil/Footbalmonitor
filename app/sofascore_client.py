import time
import logging
from typing import Dict, List, Optional
import tls_client

logger = logging.getLogger(__name__)

class SofascoreClient:
    def __init__(self):
        self.base_url = "https://www.sofascore.com/api/v1"
        self.session = tls_client.Session(
            client_identifier="chrome_120",
            random_tls_extension_order=True
        )
        self.session.timeout = 15
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
            'Referer': 'https://www.sofascore.com/',
            'Origin': 'https://www.sofascore.com',
            'X-Requested-With': 'XMLHttpRequest',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
        })
        self.last_request_time = 0
        self.min_interval = 2.0

    def _get(self, endpoint: str, params: Optional[Dict] = None) -> Dict:
        if params is None:
            params = {}
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        now = time.time()
        elapsed = now - self.last_request_time
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self.last_request_time = time.time()
        try:
            resp = self.session.get(url, params=params)
            if resp.status_code != 200:
                logger.error(f"Sofascore request failed with status {resp.status_code} for {url}")
                return {}
            return resp.json()
        except Exception as e:
            logger.error(f"Sofascore request failed: {e}")
            return {}

    def get_live_matches(self) -> List[Dict]:
        data = self._get("sport/football/events/live")
        events = data.get('events', []) if isinstance(data, dict) else []
        result = []
        for ev in events:
            match = {
                'id': ev.get('id'),
                'homeTeam': {
                    'id': ev.get('homeTeam', {}).get('id'),
                    'name': ev.get('homeTeam', {}).get('name')
                },
                'awayTeam': {
                    'id': ev.get('awayTeam', {}).get('id'),
                    'name': ev.get('awayTeam', {}).get('name')
                },
                'minute': ev.get('minute', 0),
                'status': ev.get('status', {}).get('code', 0),
                'statusName': self._map_status_name(ev.get('status', {}).get('code', 0)),
                'league': {
                    'id': ev.get('tournament', {}).get('id'),
                    'name': ev.get('tournament', {}).get('name')
                },
                'goals': {
                    'home': ev.get('homeScore', {}).get('current', 0),
                    'away': ev.get('awayScore', {}).get('current', 0)
                }
            }
            result.append(match)
        return result

    def get_match_details(self, match_id: int) -> Dict:
        data = self._get(f"event/{match_id}/statistics")
        if not data:
            data = self._get(f"event/{match_id}")
            if not data:
                return {}

        stats = {}
        # Рекурсивный поиск statisticsItems
        def find_items(obj):
            if isinstance(obj, dict):
                if 'statisticsItems' in obj and isinstance(obj['statisticsItems'], list):
                    for item in obj['statisticsItems']:
                        name = item.get('name')
                        home = item.get('home')
                        away = item.get('away')
                        if name and home is not None and away is not None:
                            try:
                                home_val = int(str(home).replace('%', '').strip())
                                away_val = int(str(away).replace('%', '').strip())
                            except:
                                continue
                            if name == 'Corner kicks':
                                stats['corners'] = {'home': home_val, 'away': away_val, 'total': home_val + away_val}
                            elif name == 'Total shots':
                                stats['shots'] = {'home': home_val, 'away': away_val, 'total': home_val + away_val}
                            elif name == 'Shots on target':
                                stats['shots_on_target'] = {'home': home_val, 'away': away_val, 'total': home_val + away_val}
                            elif name == 'Yellow cards':
                                stats['yellow_cards'] = {'home': home_val, 'away': away_val, 'total': home_val + away_val}
                            elif name in ('Goals', 'Goals scored'):
                                stats['goals'] = {'home': home_val, 'away': away_val, 'total': home_val + away_val}
                for value in obj.values():
                    find_items(value)
            elif isinstance(obj, list):
                for item in obj:
                    find_items(item)

        find_items(data)

        # Если статистики нет, но есть счёт
        if not stats.get('goals') and 'homeScore' in data:
            home_goals = data.get('homeScore', {}).get('current', 0) if isinstance(data.get('homeScore'), dict) else data.get('homeScore', 0)
            away_goals = data.get('awayScore', {}).get('current', 0) if isinstance(data.get('awayScore'), dict) else data.get('awayScore', 0)
            stats['goals'] = {'home': int(home_goals), 'away': int(away_goals), 'total': int(home_goals) + int(away_goals)}

        return stats

    def get_match_odds(self, match_id: int, live: bool = False) -> Dict:
        data = self._get(f"event/{match_id}/odds/1")
        if not data:
            return {}
        odds = {}
        if 'markets' in data and isinstance(data['markets'], list):
            for market in data['markets']:
                market_id = market.get('marketId')
                if market_id == 1:
                    choices = market.get('choices', [])
                    for choice in choices:
                        if choice.get('name') == 'Home':
                            odds['p1'] = choice.get('price')
                        elif choice.get('name') == 'Draw':
                            odds['draw'] = choice.get('price')
                        elif choice.get('name') == 'Away':
                            odds['p2'] = choice.get('price')
                elif market_id == 5:
                    choices = market.get('choices', [])
                    for choice in choices:
                        if choice.get('name') == 'Over 2.5':
                            odds['total_over_2_5'] = choice.get('price')
        odds.setdefault('p1', 0.0)
        odds.setdefault('p2', 0.0)
        odds.setdefault('draw', 0.0)
        odds.setdefault('total_over_2_5', 0.0)
        return odds

    def get_glicko(self, match_id: int) -> Dict:
        return {}

    def get_head_to_head(self, team1_id: int, team2_id: int, limit: int = 5) -> Dict:
        return self._empty_stats()

    def get_team_recent_matches(self, team_id: int, venue: str = 'all', limit: int = 5) -> Dict:
        return self._empty_stats()

    def get_team_recent_matches_full(self, team_id: int, limit: int = 5, venue: str = 'all') -> List[Dict]:
        return []

    def _map_status_name(self, code: int) -> str:
        status_map = {
            0: "Not Started",
            1: "Live",
            2: "Halftime",
            3: "Finished",
            4: "Extra Time",
            5: "Penalty Shootout",
            6: "Suspended",
            7: "Postponed",
            8: "Cancelled",
        }
        return status_map.get(code, "Unknown")

    def _empty_stats(self) -> Dict:
        return {
            'matches_count': 0,
            'avg_goals': 0.0,
            'avg_corners': 0.0,
            'avg_shots': 0.0,
            'avg_sot': 0.0,
            'avg_yellow': 0.0,
        }