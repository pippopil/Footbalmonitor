export interface MatchStats {
  possession: [number, number];
  dangerousAttacks: [number, number];
  attacks: [number, number];
  shotsOnTarget: [number, number];
  shotsOffTarget: [number, number];
  corners: [number, number];
  yellowCards: [number, number];
  redCards: [number, number];
  xg: [number, number];
}

export interface Match {
  id: string;
  country: string;
  countryCode: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  score: [number, number];
  minute: number;
  status: 'LIVE' | 'HT' | 'FT';
  source: 'Flashscore' | 'Sofascore' | 'SStats';
  stats: MatchStats;
  momentum: number[];
  lastEvent: string;
  odds: {
    home: number;
    draw: number;
    away: number;
    over25: number;
  };
}

export type LiveMatch = Match;

export type ScoreCondition =
  | 'ANY'
  | 'DRAW'
  | '0-0'
  | 'HOME_LEAD'
  | 'AWAY_LEAD'
  | 'ONE_GOAL_DIFF'
  | 'TOTAL_UNDER_2'
  | 'TOTAL_OVER_2';

export type FilterCategory =
  | 'all'
  | 'goals'
  | 'corners'
  | 'pressure'
  | 'comeback'
  | 'halftime'
  | 'cards'
  | 'custom';

export interface FilterRule {
  id: string;
  name: string;
  description: string;
  category?: FilterCategory;
  enabled: boolean;
  minMinute: number;
  maxMinute: number;
  scoreCondition: ScoreCondition;
  minDangerousAttacksDiff?: number;
  minDangerousAttacksTotal?: number;
  minTotalShots?: number;
  minShotsOnTargetTotal?: number;
  minShotsOnTargetDiff?: number;
  minTotalCorners?: number;
  minCornersDiff?: number;
  minPossessionDiff?: number;
  minXgTotal?: number;
  minXgDiff?: number;
  minPressureIndex?: number;
  redCardCondition?: 'ANY' | 'NO_RED_CARDS' | 'HAS_RED_CARD';
  targetMarket?: string;
  telegramEnabled: boolean;
  color: string;
  isPreset?: boolean;
}

export type SignalOutcome = 'WIN' | 'LOSS' | 'PENDING' | 'REFUND';

export interface SignalAlert {
  id: string;
  timestamp: string;
  matchId: string;
  matchName: string;
  league: string;
  country: string;
  minute: number;
  score: string;
  ruleId?: string;
  ruleName: string;
  message: string;
  sentToTelegram: boolean;
  telegramStatusText?: string;
  telegramMessageId?: number;
  marketSuggestion?: string;
  // Tracker & ROI fields
  outcome: SignalOutcome;
  odds: number;
  stake: number;
  profit?: number;
  finalScore?: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

export interface TelegramConfig {
  botToken: string;
  channelId: string;
  notificationsCount: number;
  lastPing: string;
  autoSend: boolean;
  silentMode: boolean;
  parseMode: 'HTML' | 'Markdown';
}

export interface PressureAnalysis {
  pressureIndex: number; // 0 - 100
  dominantSide: 'home' | 'away' | 'balanced';
  dominantTeamName: string;
  dominantDiff: number;
  goalProbability: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  goalProbabilityScore: number; // 0 - 100%
  attacksPerMinute: number;
  reasons: string[];
}

export interface HistoricalSnapshot {
  minute: number;
  score: [number, number];
  stats: MatchStats;
}

export interface HistoricalMatch {
  id: string;
  date: string;
  league: string;
  country: string;
  countryCode: string;
  homeTeam: string;
  awayTeam: string;
  finalScore: [number, number];
  finalCorners: [number, number];
  finalYellowCards: [number, number];
  finalRedCards: [number, number];
  snapshots: HistoricalSnapshot[];
}

export interface BacktestSignal {
  id: string;
  matchId: string;
  matchName: string;
  league: string;
  date: string;
  minute: number;
  scoreAtSignal: [number, number];
  finalScore: [number, number];
  finalCorners: [number, number];
  ruleId: string;
  ruleName: string;
  targetMarket: string;
  odds: number;
  outcome: SignalOutcome;
  profit: number; // in units (e.g. +0.85 or -1.0)
  reason: string;
  statsAtSignal: MatchStats;
}

export interface BacktestResult {
  ruleId: string;
  ruleName: string;
  targetMarket: string;
  totalMatchesScanned: number;
  totalSignals: number;
  wins: number;
  losses: number;
  refunds: number;
  winRate: number; // 0 - 100%
  totalProfit: number; // in units
  roi: number; // in %
  avgOdds: number;
  maxDrawdown: number;
  profitFactor: number;
  signals: BacktestSignal[];
  equityCurve: Array<{
    step: number;
    profit: number;
    cumulativeProfit: number;
    matchName: string;
    outcome: SignalOutcome;
  }>;
}

export interface AIMatchAnalysis {
  matchId: string;
  generatedAt: string;
  headline: string;
  summary: string;
  momentum: {
    dominantSide: 'home' | 'away' | 'balanced';
    dominantTeam: string;
    pressureDescription: string;
    intensityLevel: 'CALM' | 'ACTIVE' | 'HIGH_PRESSURE' | 'SIEGE';
  };
  probabilities: {
    nextGoalHome: number;
    nextGoalAway: number;
    noMoreGoals: number;
    expectedTotalGoals: string;
  };
  recommendations: Array<{
    market: string;
    oddsEstimate: number;
    confidence: 'LOW' | 'MEDIUM' | 'HIGH';
    reasoning: string;
    edge: string;
  }>;
  keyRisks: string[];
  tacticalNote: string;
  telegramFormattedText: string;
  source: 'gemini' | 'heuristic';
}
