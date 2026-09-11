import logging
from app.sstats_client import SStatsClient
from app.sofascore_client import SofascoreClient
from app.config import DATA_SOURCE, FALLBACK_SOURCE

logger = logging.getLogger(__name__)

class DataClient:
    def __init__(self):
        self.primary = None
        self.fallback = None
        self._init_clients()

    def _init_clients(self):
        if DATA_SOURCE == "sstats":
            self.primary = SStatsClient()
            if FALLBACK_SOURCE == "sofascore":
                self.fallback = SofascoreClient()
        else:
            self.primary = SofascoreClient()
            if FALLBACK_SOURCE == "sstats":
                self.fallback = SStatsClient()

    def _get_with_fallback(self, method_name, *args, **kwargs):
        # Сначала пробуем primary
        try:
            result = getattr(self.primary, method_name)(*args, **kwargs)
            if result is not None and result != [] and result != {}:
                return result
        except Exception as e:
            logger.error(f"Primary {method_name} failed: {e}")

        # Если fallback есть — пробуем его
        if self.fallback:
            try:
                logger.warning(f"Trying fallback for {method_name}")
                result = getattr(self.fallback, method_name)(*args, **kwargs)
                if result is not None and result != [] and result != {}:
                    return result
            except Exception as e:
                logger.error(f"Fallback {method_name} failed: {e}")
        return None

    def get_live_matches(self):
        result = self._get_with_fallback("get_live_matches")
        return result if result is not None else []

    def get_match_details(self, match_id):
        result = self._get_with_fallback("get_match_details", match_id)
        return result if result is not None else {}

    def get_match_odds(self, match_id, live=False):
        result = self._get_with_fallback("get_match_odds", match_id, live)
        return result if result is not None else {}

    def get_glicko(self, match_id):
        result = self._get_with_fallback("get_glicko", match_id)
        return result if result is not None else {}

    def get_head_to_head(self, team1_id, team2_id, limit=5):
        result = self._get_with_fallback("get_head_to_head", team1_id, team2_id, limit)
        return result if result is not None else {}

    def get_team_recent_matches(self, team_id, venue='all', limit=5):
        result = self._get_with_fallback("get_team_recent_matches", team_id, venue, limit)
        return result if result is not None else {}

    def get_team_recent_matches_full(self, team_id, limit=5, venue='all'):
        result = self._get_with_fallback("get_team_recent_matches_full", team_id, limit, venue)
        return result if result is not None else []

    # НОВЫЙ МЕТОД: получение матчей по диапазону дат
    def get_matches_by_date(self, from_date, to_date, limit=100):
        result = self._get_with_fallback("get_matches_by_date", from_date, to_date, limit)
        return result if result is not None else []

# Функция для обратной совместимости с main.py
def get_data_client():
    return DataClient()