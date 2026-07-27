import requests
import time
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from app.config import SSTATS_API_KEY, SSTATS_BASE_URL

logger = logging.getLogger(__name__)

class SStatsClient:
    """
    Клиент для взаимодействия с API SStats.net.
    Документация: https://api.sstats.net/docs/
    """

    def __init__(self, api_key: Optional[str] = None, base_url: str = SSTATS_BASE_URL):
        self.api_key = api_key or SSTATS_API_KEY
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.last_request_time = 0
        self.min_interval = 2.0

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
            if data.get('status') == 'ok':
                return data.get('data', {}) if isinstance(data.get('data'), dict) else data.get('data', [])
            else:
                logger.error(f"API error: {data.get('message', 'Unknown error')}")
                return {}
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            return {}
        except ValueError as e:
            logger.error(f"JSON decode error: {e}")
            return {}

    # ========== 1. Основные методы ==========

    def get_leagues(self) -> List[Dict]:
        return self._get("leagues")

    def get_live_matches(self) -> List[Dict]:
        return self._get("games/list", {"today": "true"})

    def get_match_details(self, match_id: int) -> Dict:
        return self._get(f"games/{match_id}")

    def get_match_odds(self, match_id: int, live: bool = False) -> Dict:
        if live:
            return self._get(f"odds/live/{match_id}")
        else:
            return self._get(f"odds/{match_id}")

    def get_glicko(self, match_id: int) -> Dict:
        return self._get(f"games/glicko/{match_id}")

    # ========== 2. Методы для исторических данных ==========

    def get_head_to_head(self, team1_id: int, team2_id: int, limit: int = 5) -> Dict:
        params = {
            "team1": team1_id,
            "team2": team2_id,
            "ended": "true",
            "limit": limit
        }
        matches = self._get("games/list", params)
        if not matches:
            return self._empty_stats()

        total_goals = 0
        total_corners = 0
        total_shots = 0
        total_sot = 0
        total_yellow = 0
        count = 0

        for match in matches[:limit]:
            match_id = match.get('id')
            if not match_id:
                continue
            details = self.get_match_details(match_id)
            if not details:
                continue
            stats = details.get('stats', {})
            total_goals += stats.get('goals', {}).get('total', 0)
            total_corners += stats.get('corners', {}).get('total', 0)
            total_shots += stats.get('shots', {}).get('total', 0)
            total_sot += stats.get('shots_on_target', {}).get('total', 0)
            total_yellow += stats.get('yellow_cards', {}).get('total', 0)
            count += 1
            time.sleep(0.5)

        if count == 0:
            return self._empty_stats()

        return {
            'matches_count': count,
            'avg_goals': total_goals / count,
            'avg_corners': total_corners / count,
            'avg_shots': total_shots / count,
            'avg_sot': total_sot / count,
            'avg_yellow': total_yellow / count,
        }

    def get_team_recent_matches(self, team_id: int, venue: str = 'all', limit: int = 5) -> Dict:
        params = {
            "team": team_id,
            "ended": "true",
            "limit": limit
        }
        matches = self._get("games/list", params)
        if not matches:
            return self._empty_stats()

        total_goals = 0
        total_corners = 0
        total_shots = 0
        total_sot = 0
        total_yellow = 0
        count = 0

        for match in matches[:limit]:
            match_id = match.get('id')
            if not match_id:
                continue
            details = self.get_match_details(match_id)
            if not details:
                continue

            is_home = details.get('home', {}).get('id') == team_id
            stats = details.get('stats', {})
            if venue == 'home' and not is_home:
                continue
            if venue == 'away' and is_home:
                continue

            if is_home:
                goals = stats.get('goals', {}).get('home', 0)
                corners = stats.get('corners', {}).get('home', 0)
                shots = stats.get('shots', {}).get('home', 0)
                sot = stats.get('shots_on_target', {}).get('home', 0)
                yellow = stats.get('yellow_cards', {}).get('home', 0)
            else:
                goals = stats.get('goals', {}).get('away', 0)
                corners = stats.get('corners', {}).get('away', 0)
                shots = stats.get('shots', {}).get('away', 0)
                sot = stats.get('shots_on_target', {}).get('away', 0)
                yellow = stats.get('yellow_cards', {}).get('away', 0)

            total_goals += goals
            total_corners += corners
            total_shots += shots
            total_sot += sot
            total_yellow += yellow
            count += 1
            time.sleep(0.5)

        if count == 0:
            return self._empty_stats()

        return {
            'matches_count': count,
            'avg_goals': total_goals / count,
            'avg_corners': total_corners / count,
            'avg_shots': total_shots / count,
            'avg_sot': total_sot / count,
            'avg_yellow': total_yellow / count,
        }

    def _empty_stats(self) -> Dict:
        return {
            'matches_count': 0,
            'avg_goals': 0.0,
            'avg_corners': 0.0,
            'avg_shots': 0.0,
            'avg_sot': 0.0,
            'avg_yellow': 0.0,
        }

    # ========== 3. Дополнительные методы ==========

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