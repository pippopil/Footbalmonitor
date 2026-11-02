import unittest
from app.utils.comparison_utils import compare
from app.utils.stats_utils import get_current_stat, get_stat_from_match
from app.filter_engine import (
    evaluate_rule,
    check_static_conditions,
    check_single_filter,
    determine_actual_outcome,
    is_outcome_success
)

class TestComparisonUtils(unittest.TestCase):
    def test_compare_eq(self):
        self.assertTrue(compare(3.0, 'eq', 3.0))
        self.assertFalse(compare(3.0, 'eq', 2.9))

    def test_compare_gt_gte(self):
        self.assertTrue(compare(5.0, 'gt', 4.9))
        self.assertFalse(compare(5.0, 'gt', 5.0))
        self.assertTrue(compare(5.0, 'gte', 5.0))

    def test_compare_lt_lte(self):
        self.assertTrue(compare(2.0, 'lt', 2.1))
        self.assertFalse(compare(2.0, 'lt', 2.0))
        self.assertTrue(compare(2.0, 'lte', 2.0))

    def test_compare_invalid(self):
        self.assertFalse(compare(5.0, 'unknown_op', 5.0))

class TestStatsUtils(unittest.TestCase):
    def setUp(self):
        self.match = {'minute': 72}
        self.stats = {
            'goals': {'home': 2, 'away': 1},
            'corners': {'home': 6, 'away': 4, 'total': 10},
            'shots': {'home': 14, 'away': 8, 'total': 22}
        }
        self.odds = {'p1': 1.65, 'p2': 5.20, 'draw': 3.80}
        self.glicko = {'home_prob': 0.62, 'away_prob': 0.15, 'draw_prob': 0.23}

    def test_get_current_stat(self):
        self.assertEqual(get_current_stat('minute', self.match, self.stats, self.odds, self.glicko), 72.0)
        self.assertEqual(get_current_stat('odds_p1', self.match, self.stats, self.odds, self.glicko), 1.65)
        self.assertEqual(get_current_stat('glicko_home', self.match, self.stats, self.odds, self.glicko), 0.62)
        self.assertEqual(get_current_stat('home_goals', self.match, self.stats, self.odds, self.glicko), 2.0)
        self.assertEqual(get_current_stat('away_goals', self.match, self.stats, self.odds, self.glicko), 1.0)
        self.assertEqual(get_current_stat('total_corners', self.match, self.stats, self.odds, self.glicko), 10.0)

    def test_get_stat_from_match(self):
        match_hist = {'stats': {'goals': {'home': 3, 'away': 0}, 'corners': {'total': 8}}}
        self.assertEqual(get_stat_from_match(match_hist, 'home_goals'), 3.0)
        self.assertEqual(get_stat_from_match(match_hist, 'total_corners'), 8.0)

class TestFilterEngine(unittest.TestCase):
    def setUp(self):
        self.match = {'id': 'm1', 'minute': 65}
        self.stats = {
            'goals': {'home': 1, 'away': 0},
            'corners': {'home': 5, 'away': 2, 'total': 7},
            'shots': {'home': 10, 'away': 4, 'total': 14},
            'shots_on_target': {'home': 4, 'away': 1, 'total': 5},
            'yellow_cards': {'home': 1, 'away': 2, 'total': 3}
        }
        self.odds = {'p1': 1.70, 'p2': 4.50, 'draw': 3.20, 'total_over_2_5': 1.85}
        self.glicko = {'home_prob': 0.58, 'away_prob': 0.18, 'draw_prob': 0.24}

    def test_evaluate_rule_stat(self):
        rule = {'type': 'stat', 'stat': 'home_shots', 'comparison': 'gte', 'value': 10}
        self.assertTrue(evaluate_rule(rule, self.match, self.stats, self.odds, self.glicko))

        rule_fail = {'type': 'stat', 'stat': 'away_goals', 'comparison': 'gt', 'value': 0}
        self.assertFalse(evaluate_rule(rule_fail, self.match, self.stats, self.odds, self.glicko))

    def test_evaluate_rule_time_window(self):
        # Now truly evaluates min_minute and max_minute instead of blindly returning True!
        rule_ok = {'type': 'time_window', 'min_minute': 60, 'max_minute': 75}
        self.assertTrue(evaluate_rule(rule_ok, self.match, self.stats, self.odds, self.glicko))

        rule_miss = {'type': 'time_window', 'min_minute': 10, 'max_minute': 30}
        self.assertFalse(evaluate_rule(rule_miss, self.match, self.stats, self.odds, self.glicko))

    def test_check_static_conditions(self):
        filter_dict = {
            'match_time_min': 50, 'match_time_max': 70,
            'total_goals_min': 0, 'total_goals_max': 2,
            'home_goals_min': 0, 'home_goals_max': 2,
            'away_goals_min': 0, 'away_goals_max': 1,
            'total_shots_min': 5, 'total_shots_max': 30,
            'total_corners_min': 3, 'total_corners_max': 15,
            'odds_p1_min': 1.40, 'odds_p1_max': 2.20
        }
        self.assertTrue(check_static_conditions(filter_dict, self.match, self.stats, self.odds, self.glicko))

        # Fails when minute is outside range
        filter_dict_fail = dict(filter_dict)
        filter_dict_fail['match_time_max'] = 60
        self.assertFalse(check_static_conditions(filter_dict_fail, self.match, self.stats, self.odds, self.glicko))

    def test_determine_actual_outcome(self):
        match_ft = {
            'stats': {
                'goals': {'home': 2, 'away': 1},
                'corners': {'total': 11},
                'yellow_cards': {'total': 4}
            }
        }
        self.assertEqual(determine_actual_outcome(match_ft, 'home_win'), 'home_win')
        self.assertEqual(determine_actual_outcome(match_ft, 'total_over_2_5'), 'over')
        self.assertEqual(determine_actual_outcome(match_ft, 'corners_over_10_5'), 'over')
        self.assertTrue(is_outcome_success('over', 'total_over_2_5'))

if __name__ == '__main__':
    unittest.main()
