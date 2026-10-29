"""
Typed data models for match analytics, filter rules, and signals.
Uses dataclasses for zero-dependency standard library support, compatible with Pydantic.
"""
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any

@dataclass
class RuleCondition:
    type: str # 'stat' | 'trend' | 'time_window'
    stat: Optional[str] = None
    comparison: Optional[str] = None # 'gt', 'lt', 'gte', 'lte', 'eq', 'neq'
    value: float = 0.0
    team: Optional[str] = None # 'home' | 'away'
    threshold: float = 0.0
    matches: int = 5
    required: int = 5
    min_minute: int = 0
    max_minute: int = 90

@dataclass
class MatchStats:
    goals: Dict[str, int] = field(default_factory=lambda: {'home': 0, 'away': 0})
    corners: Dict[str, int] = field(default_factory=lambda: {'home': 0, 'away': 0})
    shots: Dict[str, int] = field(default_factory=lambda: {'home': 0, 'away': 0})
    shots_on_target: Dict[str, int] = field(default_factory=lambda: {'home': 0, 'away': 0})
    yellow_cards: Dict[str, int] = field(default_factory=lambda: {'home': 0, 'away': 0})
    red_cards: Dict[str, int] = field(default_factory=lambda: {'home': 0, 'away': 0})
    possession: Dict[str, int] = field(default_factory=lambda: {'home': 50, 'away': 50})
    dangerous_attacks: Dict[str, int] = field(default_factory=lambda: {'home': 0, 'away': 0})

@dataclass
class MatchSnapshot:
    id: str
    minute: int
    home_team: str
    away_team: str
    league: str
    stats: MatchStats = field(default_factory=MatchStats)
    odds: Dict[str, float] = field(default_factory=dict)
    glicko: Dict[str, float] = field(default_factory=dict)
    status: str = 'LIVE'

@dataclass
class FilterTriggerResult:
    filter_id: str
    filter_name: str
    match_id: str
    conditions_met: List[str]
    glicko: Optional[Dict[str, float]] = None
