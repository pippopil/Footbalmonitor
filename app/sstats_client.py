import requests
from typing import Dict, List, Optional
import logging
from config import SSTATS_API_KEY, SSTATS_BASE_URL

logger = logging.getLogger(__name__)

class SStatsClient:
    def __init__(self, api_key: str = SSTATS_API_KEY, base_url: str = SSTATS_BASE_URL):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()

    def _get(self, endpoint: str, params: Optional[Dict] = None) -> Dict:
        if params is None:
            params = {}
        params['apikey'] = self.api_key
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        try:
            resp = self.session.get(url, params=params, timeout=15)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"API error: {e}")
            return {}

    def get_live_matches(self) -> List[Dict]:
        """Возвращает список live-матчей (базовая информация)"""
        data = self._get("games/list", {"status": "live"})
        return data.get('data', []) or data.get('games', [])

    def get_match_details(self, match_id: int) -> Dict:
        """Детальная статистика матча (голы, угловые, удары, карточки)"""
        return self._get(f"games/{match_id}")

    def get_match_odds(self, match_id: int) -> Dict:
        """Коэффициенты на матч (П1, П2, Ничья, Тотал 2.5)"""
        return self._get(f"games/{match_id}/odds")

    def get_leagues(self) -> List[Dict]:
        """Список всех лиг"""
        data = self._get("leagues/list")
        return data.get('data', []) or data.get('leagues', [])

    # --- Методы для исторических данных (заглушки, необходимо адаптировать под реальные эндпоинты SStats) ---
    def get_head_to_head(self, team1_id: int, team2_id: int, limit: int = 5) -> Dict:
        """
        Возвращает средние показатели в личных встречах.
        Если API не поддерживает, можно парсить или использовать другой источник.
        Здесь возвращаем заглушку.
        """
        # Пытаемся запросить, если есть эндпоинт
        # data = self._get(f"h2h/{team1_id}/{team2_id}", {"limit": limit})
        # return {'avg_goals': data.get('avg_goals', 0)}
        return {'avg_goals': 2.5}  # заглушка

    def get_team_recent_matches(self, team_id: int, venue: str = 'home', limit: int = 5) -> Dict:
        """
        Возвращает средние показатели команды в последних N матчах (дома или в гостях)
        """
        # data = self._get(f"teams/{team_id}/recent", {"venue": venue, "limit": limit})
        # return {'avg_goals': data.get('avg_goals', 0)}
        return {'avg_goals': 1.8}  # заглушка