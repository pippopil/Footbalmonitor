import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Activity,
  Bell,
  Play,
  Pause,
  RefreshCw,
  Sliders,
  Send,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Flame,
  Zap,
  Search,
  Plus,
  Trash2,
  Clock,
  Target,
  Radio,
  Share2,
  Filter,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Shield,
  Layers,
  Bot,
  XCircle,
  Key,
  Hash,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  ExternalLink,
  User,
  MessageSquare,
  Sparkles,
  Edit3,
  Copy,
  Download,
  Upload,
  RotateCcw,
  Check,
  FileSpreadsheet,
  Globe,
  Database,
  FlaskConical,
} from 'lucide-react';

import {
  Match,
  MatchStats,
  FilterRule,
  SignalAlert,
  SignalOutcome,
  TelegramConfig,
  FilterCategory,
  ScoreCondition,
  PressureAnalysis,
  DataSourceConfig,
  DataSourceType,
} from './types';
import { EXPANDED_DEFAULT_FILTERS } from './data/defaultFilters';
import {
  calculatePressureAnalysis,
  evaluateFilterRule,
  formatExtendedTelegramAlert,
} from './algorithms';
import { FilterBuilderModal } from './components/FilterBuilderModal';
import { BacktestingView } from './components/BacktestingView';
import { AIAnalystModal } from './components/AIAnalystModal';
import { DataSourcesModal } from './components/DataSourcesModal';
import { RealMatchTesterModal } from './components/RealMatchTesterModal';
import { getEstimatedOdds } from './backtestEngine';

const INITIAL_SIGNALS: SignalAlert[] = [
  {
    id: 'sig-seed-1',
    timestamp: '15:42:10',
    matchId: 'm-1',
    matchName: 'Arsenal vs Chelsea',
    league: 'Premier League',
    country: 'England',
    minute: 68,
    score: '1:1',
    ruleName: 'Штурм аутсайдера / Фаворит давит',
    marketSuggestion: 'ТБ 0.5 во 2-м тайме',
    message: '⚽ [СИГНАЛ] England | Premier League\nArsenal 1:1 Chelsea (68\')\n🎯 Исход: ТБ 0.5 во 2-м тайме\n🔥 Давление: 84/100 | Оп. атаки 64-38',
    sentToTelegram: true,
    telegramStatusText: 'Доставлено в TG',
    outcome: 'WIN',
    odds: 1.82,
    stake: 1000,
    profit: 820,
    finalScore: '2:1',
    resolutionNote: 'Гол забит на 82-й минуте (2:1)',
    resolvedAt: '16:05:00',
  },
  {
    id: 'sig-seed-2',
    timestamp: '14:20:05',
    matchId: 'm-2',
    matchName: 'Real Madrid vs Sevilla',
    league: 'La Liga',
    country: 'Spain',
    minute: 74,
    score: '0:0',
    ruleName: 'Супер-доминация по xG при 0:0',
    marketSuggestion: 'ТБ 0.5 в матче / Победа 1',
    message: '⚽ [СИГНАЛ] Spain | La Liga\nReal Madrid 0:0 Sevilla (74\')\n🎯 Исход: ТБ 0.5 в матче\n🔥 Давление: 78/100 | xG 2.10 vs 0.35',
    sentToTelegram: true,
    telegramStatusText: 'Доставлено в TG',
    outcome: 'WIN',
    odds: 1.95,
    stake: 1000,
    profit: 950,
    finalScore: '1:0',
    resolutionNote: 'Гол на 86-й минуте (1:0)',
    resolvedAt: '14:40:00',
  },
  {
    id: 'sig-seed-3',
    timestamp: '13:10:44',
    matchId: 'm-3',
    matchName: 'Bayern Munich vs RB Leipzig',
    league: 'Bundesliga',
    country: 'Germany',
    minute: 82,
    score: '2:1',
    ruleName: 'Серия угловых в концовке',
    marketSuggestion: 'Тотал больше угловых',
    message: '⚽ [СИГНАЛ] Germany | Bundesliga\nBayern Munich 2:1 RB Leipzig (82\')\n🎯 Исход: ТБ угловых\n🚩 Угловые: 8-5',
    sentToTelegram: false,
    telegramStatusText: 'Локальный сигнал',
    outcome: 'WIN',
    odds: 1.90,
    stake: 1000,
    profit: 900,
    finalScore: '2:1',
    resolutionNote: 'Подано 3 угловых в концовке (итог 16)',
    resolvedAt: '13:25:00',
  },
  {
    id: 'sig-seed-4',
    timestamp: '12:05:12',
    matchId: 'm-4',
    matchName: 'Juventus vs Napoli',
    league: 'Serie A',
    country: 'Italy',
    minute: 65,
    score: '0:1',
    ruleName: 'Потенциал камбэка фаворита',
    marketSuggestion: '1X / Фора (0) / ИТБ1 (0.5)',
    message: '⚽ [СИГНАЛ] Italy | Serie A\nJuventus 0:1 Napoli (65\')\n🎯 Исход: 1X Камбэк\n🔥 Давление: 72/100',
    sentToTelegram: true,
    telegramStatusText: 'Доставлено в TG',
    outcome: 'LOSS',
    odds: 2.10,
    stake: 1000,
    profit: -1000,
    finalScore: '0:1',
    resolutionNote: 'Матч завершился со счетом 0:1, камбэк не состоялся',
    resolvedAt: '12:35:00',
  },
  {
    id: 'sig-seed-5',
    timestamp: '11:45:00',
    matchId: 'm-5',
    matchName: 'Flamengo vs Palmeiras',
    league: 'Serie A Betano',
    country: 'Brazil',
    minute: 38,
    score: '0:0',
    ruleName: 'Гол в первом тайме',
    marketSuggestion: 'ТБ 0.5 в 1-м тайме',
    message: '⚽ [СИГНАЛ] Brazil | Serie A\nFlamengo 0:0 Palmeiras (38\')\n🎯 Исход: ТБ 0.5 в 1-м тайме\n🔥 Давление: 68/100',
    sentToTelegram: true,
    telegramStatusText: 'Доставлено в TG',
    outcome: 'PENDING',
    odds: 2.05,
    stake: 1000,
  },
];

const INITIAL_MATCHES: Match[] = [
  {
    id: 'm-1',
    country: 'England',
    countryCode: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    league: 'Premier League',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    score: [1, 1],
    minute: 68,
    status: 'LIVE',
    source: 'Flashscore',
    stats: {
      possession: [58, 42],
      dangerousAttacks: [64, 38],
      attacks: [112, 74],
      shotsOnTarget: [7, 3],
      shotsOffTarget: [6, 2],
      corners: [8, 2],
      yellowCards: [2, 3],
      redCards: [0, 0],
      xg: [1.82, 0.94],
    },
    momentum: [15, 30, 45, 60, -20, 55, 70, 65],
    lastEvent: "67' Опасный удар со штрафного (Arsenal)",
    odds: { home: 1.65, draw: 3.4, away: 5.5, over25: 1.62, btts: 1.60 },
    history: {
      homeConcededLastMatch: 2,
      awayConcededLastMatch: 2,
      homeLostLastMatch: true,
      awayLostLastMatch: true,
      homeLast5NoZeroZero: true,
      awayLast5NoZeroZero: true,
      homeOver25Streak: 5,
      awayOver25Streak: 4,
      predictedIpt: 2.85,
    },
  },
  {
    id: 'm-2',
    country: 'Spain',
    countryCode: '🇪🇸',
    league: 'LaLiga EA Sports',
    homeTeam: 'Real Madrid',
    awayTeam: 'Valencia',
    score: [0, 0],
    minute: 74,
    status: 'LIVE',
    source: 'SStats',
    stats: {
      possession: [68, 32],
      dangerousAttacks: [82, 19],
      attacks: [134, 45],
      shotsOnTarget: [9, 1],
      shotsOffTarget: [8, 2],
      corners: [11, 1],
      yellowCards: [1, 4],
      redCards: [0, 0],
      xg: [2.15, 0.22],
    },
    momentum: [40, 50, 75, 80, 85, 90, 80, 88],
    lastEvent: "72' Сейв вратаря Valencia после удара в створ",
    odds: { home: 1.44, draw: 3.8, away: 8.5, over25: 1.65, btts: 1.80 },
    history: {
      homeConcededLastMatch: 1,
      awayConcededLastMatch: 2,
      homeLast5NoZeroZero: true,
      awayLast5NoZeroZero: true,
      homeOver25Streak: 6,
      awayOver25Streak: 3,
      predictedIpt: 2.92,
    },
  },
  {
    id: 'm-3',
    country: 'Germany',
    countryCode: '🇩🇪',
    league: 'Bundesliga',
    homeTeam: 'Borussia Dortmund',
    awayTeam: 'RB Leipzig',
    score: [2, 1],
    minute: 54,
    status: 'LIVE',
    source: 'Sofascore',
    stats: {
      possession: [51, 49],
      dangerousAttacks: [44, 47],
      attacks: [89, 91],
      shotsOnTarget: [5, 4],
      shotsOffTarget: [4, 5],
      corners: [4, 5],
      yellowCards: [1, 1],
      redCards: [0, 0],
      xg: [1.34, 1.28],
    },
    momentum: [10, -20, 25, -15, 30, 40, -10, 20],
    lastEvent: "53' Гол! Dortmund выходит вперед (2:1)",
    odds: { home: 1.85, draw: 3.75, away: 4.1, over25: 1.35, btts: 1.52 },
    history: {
      predictedIpt: 3.2,
      homeOver25Streak: 7,
      awayOver25Streak: 5,
    },
  },
  {
    id: 'm-4',
    country: 'Italy',
    countryCode: '🇮🇹',
    league: 'Serie A',
    homeTeam: 'Juventus',
    awayTeam: 'Atalanta',
    score: [0, 1],
    minute: 81,
    status: 'LIVE',
    source: 'Flashscore',
    stats: {
      possession: [62, 38],
      dangerousAttacks: [73, 31],
      attacks: [118, 62],
      shotsOnTarget: [6, 2],
      shotsOffTarget: [7, 3],
      corners: [9, 2],
      yellowCards: [3, 2],
      redCards: [0, 0],
      xg: [1.76, 0.65],
    },
    momentum: [35, 60, 70, 75, 80, 85, 80, 92],
    lastEvent: "80' Штурм ворот Atalanta, заблокирован удар",
    odds: { home: 2.1, draw: 2.45, away: 4.8, over25: 1.70, btts: 1.65 },
    history: {
      predictedIpt: 2.75,
      homeLast5NoZeroZero: true,
      awayLast5NoZeroZero: true,
    },
  },
  {
    id: 'm-5',
    country: 'Brazil',
    countryCode: '🇧🇷',
    league: 'Serie A Betano',
    homeTeam: 'Flamengo',
    awayTeam: 'Palmeiras',
    score: [0, 0],
    minute: 38,
    status: 'LIVE',
    source: 'SStats',
    stats: {
      possession: [52, 48],
      dangerousAttacks: [29, 32],
      attacks: [58, 61],
      shotsOnTarget: [2, 2],
      shotsOffTarget: [3, 1],
      corners: [3, 4],
      yellowCards: [2, 1],
      redCards: [0, 0],
      xg: [0.45, 0.52],
    },
    momentum: [-5, 10, -15, 20, 10, -5, 15, -10],
    lastEvent: "35' Опасная контратака Palmeiras",
    odds: { home: 2.3, draw: 3.1, away: 3.2, over25: 2.05, btts: 1.95 },
  },
  {
    id: 'm-6',
    country: 'England',
    countryCode: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    league: 'Premier League',
    homeTeam: 'Manchester City',
    awayTeam: 'Everton',
    score: [0, 0],
    minute: 17,
    status: 'LIVE',
    source: 'Flashscore',
    stats: {
      possession: [72, 28],
      dangerousAttacks: [24, 6],
      attacks: [38, 12],
      shotsOnTarget: [3, 0],
      shotsOffTarget: [3, 0],
      corners: [3, 0],
      yellowCards: [0, 1],
      redCards: [0, 0],
      xg: [0.78, 0.05],
    },
    momentum: [60, 75, 80, 85, 88],
    lastEvent: "16' Плотный дальний удар фаворита в створ",
    odds: { home: 1.25, draw: 6.5, away: 12.0, over25: 1.55, btts: 1.85 },
    history: {
      homeLast5NoZeroZero: true,
      awayLast5NoZeroZero: true,
      predictedIpt: 3.15,
    },
  },
  {
    id: 'm-7',
    country: 'Italy',
    countryCode: '🇮🇹',
    league: 'Serie A',
    homeTeam: 'Napoli',
    awayTeam: 'Cagliari',
    score: [0, 0],
    minute: 60,
    status: 'LIVE',
    source: 'Sofascore',
    stats: {
      possession: [66, 34],
      dangerousAttacks: [58, 22],
      attacks: [98, 41],
      shotsOnTarget: [6, 1],
      shotsOffTarget: [5, 2],
      corners: [8, 1],
      yellowCards: [1, 2],
      redCards: [0, 0],
      xg: [1.74, 0.18],
    },
    momentum: [45, 60, 70, 80, 85, 90],
    lastEvent: "59' Штурм ворот Cagliari, спасение защитника",
    odds: { home: 1.48, draw: 4.2, away: 7.5, over25: 1.62, btts: 1.75 },
    history: {
      homeLast5NoZeroZero: true,
      awayLast5NoZeroZero: true,
      homeOver25Streak: 5,
      awayOver25Streak: 3,
      predictedIpt: 2.88,
    },
  },
  {
    id: 'm-8',
    country: 'Germany',
    countryCode: '🇩🇪',
    league: 'Bundesliga',
    homeTeam: 'Bayern Munich',
    awayTeam: 'Hoffenheim',
    score: [1, 0],
    minute: 28,
    status: 'LIVE',
    source: 'Flashscore',
    stats: {
      possession: [74, 26],
      dangerousAttacks: [42, 11],
      attacks: [65, 20],
      shotsOnTarget: [5, 1],
      shotsOffTarget: [4, 1],
      corners: [5, 1],
      yellowCards: [0, 1],
      redCards: [0, 0],
      xg: [1.62, 0.15],
    },
    momentum: [65, 80, 85, 90],
    lastEvent: "27' Удар в перекладину ворот Hoffenheim",
    odds: {
      home: 1.18,
      draw: 7.5,
      away: 14.0,
      over25: 1.38,
      over35: 1.88,
      handicap1: 1.45,
      itb1_25: 1.50,
      btts: 1.55,
    },
    history: {
      homeLast5NoZeroZero: true,
      awayLast5NoZeroZero: true,
      predictedIpt: 3.45,
    },
  },
  {
    id: 'm-9',
    country: 'England',
    countryCode: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    league: 'Premier League',
    homeTeam: 'Liverpool',
    awayTeam: 'Aston Villa',
    score: [1, 2],
    minute: 82,
    status: 'LIVE',
    source: 'Flashscore',
    stats: {
      possession: [65, 35],
      dangerousAttacks: [78, 28],
      attacks: [126, 54],
      shotsOnTarget: [8, 3],
      shotsOffTarget: [7, 2],
      corners: [10, 3],
      yellowCards: [2, 3],
      redCards: [0, 0],
      xg: [2.35, 1.10],
    },
    momentum: [50, 70, 80, 85, 92, 95],
    lastEvent: "81' Сейв вратаря Aston Villa после углового",
    odds: { home: 1.55, draw: 3.9, away: 5.8, over25: 1.60, btts: 1.62 },
    history: {
      homeLast5NoZeroZero: true,
      awayLast5NoZeroZero: true,
      last4LateGoalCount: 3,
    },
  },
  {
    id: 'm-10',
    country: 'Italy',
    countryCode: '🇮🇹',
    league: 'Serie A',
    homeTeam: 'Inter',
    awayTeam: 'Torino',
    score: [0, 1],
    minute: 52,
    status: 'LIVE',
    source: 'Sofascore',
    stats: {
      possession: [67, 33],
      dangerousAttacks: [54, 18],
      attacks: [92, 39],
      shotsOnTarget: [5, 1],
      shotsOffTarget: [6, 2],
      corners: [7, 1],
      yellowCards: [1, 2],
      redCards: [0, 0],
      xg: [1.45, 0.40],
    },
    momentum: [40, 60, 75, 80, 85],
    lastEvent: "50' Давление Интера у ворот Torino",
    odds: { home: 1.35, draw: 4.8, away: 8.5, over25: 1.68, btts: 1.85 },
    history: {
      homeLast5NoZeroZero: true,
      awayLast5NoZeroZero: true,
    },
  },
  {
    id: 'm-11',
    country: 'Portugal',
    countryCode: '🇵🇹',
    league: 'Primeira Liga',
    homeTeam: 'Benfica',
    awayTeam: 'Sporting',
    score: [1, 2],
    minute: 48,
    status: 'LIVE',
    source: 'Flashscore',
    stats: {
      possession: [50, 50],
      dangerousAttacks: [40, 43],
      attacks: [72, 78],
      shotsOnTarget: [4, 5],
      shotsOffTarget: [3, 4],
      corners: [4, 4],
      yellowCards: [2, 1],
      redCards: [0, 0],
      xg: [1.15, 1.40],
    },
    momentum: [10, -30, 20, -25, 15],
    lastEvent: "46' Начало второго тайма",
    odds: { home: 2.10, draw: 3.3, away: 3.4, over25: 1.65, btts: 1.55 },
    history: {
      guestScoredTwoQuickFirstHalf: true,
      h2hOver15Pct: 85,
    },
  },
];

export default function App() {
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  
  // Persistent filters loaded from localStorage with auto-sync for new presets
  const [filters, setFilters] = useState<FilterRule[]>(() => {
    const saved = localStorage.getItem('footbalmonitor_filters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((f: any) => f.id));
          const merged = [...parsed];
          for (const preset of EXPANDED_DEFAULT_FILTERS) {
            if (!existingIds.has(preset.id)) {
              merged.push(preset);
            }
          }
          return merged;
        }
      } catch (e) {
        // fallback
      }
    }
    return EXPANDED_DEFAULT_FILTERS;
  });

  // Filter manager UI state
  const [activeFilterCategory, setActiveFilterCategory] = useState<FilterCategory>('all');
  const [filterSearchQuery, setFilterSearchQuery] = useState<string>('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [editingFilter, setEditingFilter] = useState<FilterRule | null>(null);

  // Save filters to localStorage whenever modified
  useEffect(() => {
    localStorage.setItem('footbalmonitor_filters', JSON.stringify(filters));
  }, [filters]);

  const [selectedMatchId, setSelectedMatchId] = useState<string>(INITIAL_MATCHES[0].id);
  const [isMonitoringActive, setIsMonitoringActive] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'matches' | 'filters' | 'signals' | 'backtest' | 'telegram'>('matches');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Persistent signals tracker state
  const [signals, setSignals] = useState<SignalAlert[]>(() => {
    const saved = localStorage.getItem('footbalmonitor_signals');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_SIGNALS;
  });

  // Save signals to localStorage
  useEffect(() => {
    localStorage.setItem('footbalmonitor_signals', JSON.stringify(signals));
  }, [signals]);

  // Signal tracker UI filters
  const [signalOutcomeFilter, setSignalOutcomeFilter] = useState<'ALL' | 'WIN' | 'LOSS' | 'PENDING' | 'REFUND'>('ALL');
  const [signalSearchQuery, setSignalSearchQuery] = useState<string>('');

  // AI Match Analyst modal state
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
  const [aiTargetMatch, setAiTargetMatch] = useState<Match | null>(null);

  const handleOpenAIAnalyst = (targetMatch: Match) => {
    setAiTargetMatch(targetMatch);
    setIsAIModalOpen(true);
  };

  // Real Match Tester modal state
  const [isRealMatchTesterOpen, setIsRealMatchTesterOpen] = useState<boolean>(false);

  // Data Sources configuration state
  const [isDataSourcesModalOpen, setIsDataSourcesModalOpen] = useState<boolean>(false);
  const [isRefreshingMatches, setIsRefreshingMatches] = useState<boolean>(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const [dataSourceError, setDataSourceError] = useState<string | null>(null);

  const [dataSourceConfig, setDataSourceConfig] = useState<DataSourceConfig>(() => {
    const saved = localStorage.getItem('footbalmonitor_datasource_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            activeSource: (parsed.activeSource || 'flashscore') as DataSourceType,
            flashscore: parsed.flashscore || {
              enabled: true,
              includeOdds: true,
              maxMatches: 150,
            },
            sstats: parsed.sstats || {
              enabled: true,
              apiKey: '',
            },
            sofascore: parsed.sofascore || {
              enabled: true,
              useProxy: false,
            },
            apiFootball: parsed.apiFootball || {
              enabled: false,
              apiKey: '',
              provider: 'api-sports' as const,
              leaguesFilter: '39,140,135,78,61',
            },
            footballData: parsed.footballData || {
              enabled: false,
              apiToken: '',
              plan: 'free' as const,
            },
            webhook: parsed.webhook || {
              enabled: false,
              secretKey: '',
              ingestedCount: 0,
            },
            publicFeed: parsed.publicFeed || {
              enabled: true,
            },
            autoRefresh: parsed.autoRefresh ?? true,
            refreshIntervalSeconds: parsed.refreshIntervalSeconds || 30,
          };
        }
      } catch (e) {}
    }
    return {
      activeSource: 'flashscore' as DataSourceType,
      flashscore: {
        enabled: true,
        includeOdds: true,
        maxMatches: 150,
      },
      sstats: {
        enabled: true,
        apiKey: '',
      },
      sofascore: {
        enabled: true,
        useProxy: false,
      },
      apiFootball: {
        enabled: false,
        apiKey: '',
        provider: 'api-sports' as const,
        leaguesFilter: '39,140,135,78,61',
      },
      footballData: {
        enabled: false,
        apiToken: '',
        plan: 'free' as const,
      },
      webhook: {
        enabled: false,
        secretKey: '',
        ingestedCount: 0,
      },
      publicFeed: {
        enabled: true,
      },
      autoRefresh: true,
      refreshIntervalSeconds: 30,
    };
  });

  // Save data source config to localStorage
  useEffect(() => {
    localStorage.setItem('footbalmonitor_datasource_config', JSON.stringify(dataSourceConfig));
  }, [dataSourceConfig]);

  // Fetch real matches from selected data source
  const fetchLiveMatchesFromSource = async (sourceType?: DataSourceType) => {
    const src = sourceType || dataSourceConfig.activeSource;
    if (src === 'simulated') {
      setMatches(INITIAL_MATCHES);
      setLastFetchedAt(new Date().toLocaleTimeString('ru-RU'));
      return;
    }

    setIsRefreshingMatches(true);
    setDataSourceError(null);

    try {
      let query = `?source=${src}&nocache=1`;
      if (src === 'sstats' && dataSourceConfig.sstats?.apiKey) {
        query += `&sstats_key=${encodeURIComponent(dataSourceConfig.sstats.apiKey)}`;
      } else if (src === 'api-football' && dataSourceConfig.apiFootball?.apiKey) {
        query += `&api_key=${encodeURIComponent(dataSourceConfig.apiFootball.apiKey)}&provider=${dataSourceConfig.apiFootball.provider}&leagues=${encodeURIComponent(dataSourceConfig.apiFootball.leaguesFilter)}`;
      } else if (src === 'football-data' && dataSourceConfig.footballData?.apiToken) {
        query += `&football_data_token=${encodeURIComponent(dataSourceConfig.footballData.apiToken)}`;
      }

      const res = await fetch(`/api/datasources/live${query}`);
      const data = await res.json();
      if (res.ok && data.ok && Array.isArray(data.matches) && data.matches.length > 0) {
        setMatches(data.matches);
        if (!data.matches.some((m: Match) => m.id === selectedMatchId)) {
          setSelectedMatchId(data.matches[0].id);
        }
        setLastFetchedAt(data.fetchedAt || new Date().toLocaleTimeString('ru-RU'));
      } else if (data.matches && data.matches.length === 0) {
        setDataSourceError('В выбранном источнике сейчас нет активных Live-матчей. Попробуйте Flashscore или Public Feed.');
      } else {
        setDataSourceError(data.error || 'Ошибка при получении матчей из источника');
      }
    } catch (err: any) {
      setDataSourceError(`Сетевая ошибка: ${err?.message || err}`);
    } finally {
      setIsRefreshingMatches(false);
    }
  };

  // Initial load of real matches if public-feed or api is chosen
  useEffect(() => {
    if (dataSourceConfig.activeSource !== 'simulated') {
      fetchLiveMatchesFromSource(dataSourceConfig.activeSource);
    }
  }, [dataSourceConfig.activeSource]);

  // Periodic auto-refresh for real live matches
  useEffect(() => {
    if (dataSourceConfig.activeSource !== 'simulated' && dataSourceConfig.autoRefresh && isMonitoringActive) {
      const intervalMs = Math.max(15, dataSourceConfig.refreshIntervalSeconds || 30) * 1000;
      const timer = setInterval(() => {
        fetchLiveMatchesFromSource(dataSourceConfig.activeSource);
      }, intervalMs);
      return () => clearInterval(timer);
    }
  }, [dataSourceConfig.activeSource, dataSourceConfig.autoRefresh, dataSourceConfig.refreshIntervalSeconds, isMonitoringActive]);

  const handleAddMatchToLive = (newMatch: Match) => {
    setMatches((prev) => [newMatch, ...prev.filter((m) => m.id !== newMatch.id)]);
    setSelectedMatchId(newMatch.id);
  };

  // Update signal outcome (WIN, LOSS, REFUND, PENDING)
  const updateSignalOutcome = (signalId: string, outcome: SignalOutcome, oddsOverride?: number) => {
    setSignals((prev) =>
      prev.map((sig) => {
        if (sig.id !== signalId) return sig;
        const finalOdds = oddsOverride !== undefined ? oddsOverride : sig.odds;
        const stake = sig.stake || 1000;
        let profit: number | undefined = undefined;
        if (outcome === 'WIN') {
          profit = Number(((finalOdds - 1) * stake).toFixed(2));
        } else if (outcome === 'LOSS') {
          profit = -stake;
        } else if (outcome === 'REFUND') {
          profit = 0;
        }
        return {
          ...sig,
          outcome,
          odds: finalOdds,
          profit,
          resolvedAt: outcome !== 'PENDING' ? new Date().toLocaleTimeString('ru-RU') : undefined,
        };
      })
    );
  };

  // Export signals to CSV
  const handleExportSignalsCsv = () => {
    const headers = ['ID', 'Время', 'Матч', 'Лига', 'Страна', 'Мин', 'Счет', 'Итог', 'Стратегия', 'Маркет', 'Кэф', 'Ставка', 'Исход', 'Профит', 'Telegram'];
    const rows = signals.map((s) => [
      s.id,
      s.timestamp,
      `"${s.matchName.replace(/"/g, '""')}"`,
      `"${s.league.replace(/"/g, '""')}"`,
      `"${s.country.replace(/"/g, '""')}"`,
      s.minute,
      `"${s.score}"`,
      `"${s.finalScore || '-'}"`,
      `"${s.ruleName.replace(/"/g, '""')}"`,
      `"${(s.marketSuggestion || '').replace(/"/g, '""')}"`,
      s.odds,
      s.stake,
      s.outcome,
      s.profit !== undefined ? s.profit : '',
      s.sentToTelegram ? 'Отправлено' : 'Локально',
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `footbalmonitor_signals_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(() => {
    const saved = localStorage.getItem('footbalmonitor_tg_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          botToken: parsed.botToken || '',
          channelId: parsed.channelId || '',
          notificationsCount: parsed.notificationsCount || 0,
          lastPing: parsed.lastPing || '',
          autoSend: parsed.autoSend ?? true,
          silentMode: parsed.silentMode ?? false,
          parseMode: parsed.parseMode || 'HTML',
          suppressDuplicates: parsed.suppressDuplicates ?? true,
          deduplicationMode: parsed.deduplicationMode || 'once-per-match',
          cooldownMinutes: parsed.cooldownMinutes ?? 15,
          blockedDuplicatesCount: parsed.blockedDuplicatesCount || 0,
        };
      } catch (e) {
        // fallback
      }
    }
    return {
      botToken: '',
      channelId: '',
      notificationsCount: 0,
      lastPing: '',
      autoSend: true,
      silentMode: false,
      parseMode: 'HTML' as const,
      suppressDuplicates: true,
      deduplicationMode: 'once-per-match' as const,
      cooldownMinutes: 15,
      blockedDuplicatesCount: 0,
    };
  });

  // Sent signals tracker to block duplicate alerts every minute
  const sentSignalsTrackerRef = useRef<Map<string, { lastSentAt: number; lastMinute: number; lastScore: string }>>(new Map());

  // Load tracker from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('footbalmonitor_sent_signals_tracker');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach(([k, v]) => sentSignalsTrackerRef.current.set(k, v));
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const clearDeduplicationHistory = async () => {
    sentSignalsTrackerRef.current.clear();
    try {
      localStorage.removeItem('footbalmonitor_sent_signals_tracker');
    } catch (e) {
      // ignore
    }
    setTelegramConfig((prev) => ({ ...prev, blockedDuplicatesCount: 0 }));
    try {
      await fetch('/api/telegram/clear-dedup', { method: 'POST' });
    } catch (e) {
      // ignore
    }
  };

  const [telegramStatus, setTelegramStatus] = useState<'idle' | 'checking' | 'connected' | 'error' | 'sending'>('idle');
  const [telegramBotInfo, setTelegramBotInfo] = useState<{ id?: number; username?: string; first_name?: string } | null>(null);
  const [telegramError, setTelegramError] = useState<string | null>(null);
  const [showToken, setShowToken] = useState<boolean>(false);
  const [lastSentResult, setLastSentResult] = useState<{ ok: boolean; messageId?: number; text?: string; time?: string } | null>(null);

  // Auto-detect chat state
  const [isDetectingChat, setIsDetectingChat] = useState<boolean>(false);
  const [detectedChats, setDetectedChats] = useState<Array<{ id: number | string; title: string; type: string; username?: string }>>([]);
  const [showChatPicker, setShowChatPicker] = useState<boolean>(false);

  // Check if user accidentally entered bot's own username / ID
  const isEnteringBotItself = useMemo(() => {
    if (!telegramBotInfo?.username && !telegramBotInfo?.id) return false;
    const cleanInput = telegramConfig.channelId.trim().replace(/^@/, '').toLowerCase();
    const botUser = (telegramBotInfo?.username || '').toLowerCase();
    const botId = String(telegramBotInfo?.id || '');
    return cleanInput.length > 0 && (cleanInput === botUser || cleanInput === botId);
  }, [telegramConfig.channelId, telegramBotInfo]);

  // Query bot updates to discover user chat ID or channel ID
  const detectChatId = async () => {
    if (!telegramConfig.botToken.trim()) {
      setTelegramError('Сначала введите Bot Token и проверьте статус бота.');
      return;
    }
    setIsDetectingChat(true);
    setTelegramError(null);
    try {
      const res = await fetch(`/api/telegram/updates?token=${encodeURIComponent(telegramConfig.botToken.trim())}`);
      const data = await res.json();
      if (res.ok && data.ok) {
        if (data.chats && data.chats.length > 0) {
          setDetectedChats(data.chats);
          setShowChatPicker(true);
          // If only 1 chat found, automatically set it
          if (data.chats.length === 1) {
            const firstChat = data.chats[0];
            setTelegramConfig((c: typeof telegramConfig) => ({ ...c, channelId: String(firstChat.id) }));
          }
        } else {
          setTelegramError(
            `Бот пока не получил ни одного сообщения. Откройте диалог с @${telegramBotInfo?.username || 'вашим ботом'} в Telegram, нажмите кнопку «Запустить» (/start) или отправьте любое сообщение, затем нажмите «Определить мой Chat ID» ещё раз.`
          );
        }
      } else {
        setTelegramError(data.error || 'Не удалось получить список чатов бота');
      }
    } catch (e: any) {
      setTelegramError(`Сетевая ошибка при поиске чатов: ${e?.message || e}`);
    } finally {
      setIsDetectingChat(false);
    }
  };

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('footbalmonitor_tg_config', JSON.stringify(telegramConfig));
  }, [telegramConfig]);

  // Format alert into structured HTML for Telegram
  const formatTelegramAlert = (match: Match, ruleName: string): string => {
    const diffDang = match.stats.dangerousAttacks[0] - match.stats.dangerousAttacks[1];
    const dangSign = diffDang > 0 ? `+${diffDang} (Хозяева)` : diffDang < 0 ? `+${Math.abs(diffDang)} (Гости)` : 'Равенство';
    const totalShots = match.stats.shotsOnTarget[0] + match.stats.shotsOnTarget[1] + match.stats.shotsOffTarget[0] + match.stats.shotsOffTarget[1];
    const totalCorners = match.stats.corners[0] + match.stats.corners[1];

    return `⚽ <b>СИГНАЛ ФИЛЬТРА: ${ruleName}</b>\n` +
      `🏆 <b>${match.countryCode} ${match.country} | ${match.league}</b>\n\n` +
      `⚔️ <b>${match.homeTeam} ${match.score[0]} : ${match.score[1]} ${match.awayTeam}</b> (<b>${match.minute}'</b>)\n\n` +
      `🔥 <b>Опасные атаки:</b> ${match.stats.dangerousAttacks[0]} - ${match.stats.dangerousAttacks[1]} [${dangSign}]\n` +
      `🎯 <b>Удары в створ:</b> ${match.stats.shotsOnTarget[0]} - ${match.stats.shotsOnTarget[1]} (Всего: ${totalShots})\n` +
      `🚩 <b>Угловые:</b> ${match.stats.corners[0]} - ${match.stats.corners[1]} (Всего: ${totalCorners})\n` +
      `📊 <b>xG:</b> ${match.stats.xg[0].toFixed(2)} vs ${match.stats.xg[1].toFixed(2)}\n` +
      `⚡ <b>Владение мячом:</b> ${match.stats.possession[0]}% - ${match.stats.possession[1]}%\n\n` +
      `⏱ <i>Время: ${new Date().toLocaleTimeString('ru-RU')} | Источник: ${match.source}</i>\n` +
      `🤖 <i>Footbalmonitor Live Engine</i>`;
  };

  // Verify Bot via API
  const verifyTelegramBot = async (tokenOverride?: string, chatOverride?: string) => {
    const token = tokenOverride !== undefined ? tokenOverride : telegramConfig.botToken;
    const chat = chatOverride !== undefined ? chatOverride : telegramConfig.channelId;

    if (!token.trim()) {
      setTelegramStatus('idle');
      setTelegramError('Укажите токен бота для проверки.');
      return;
    }

    setTelegramStatus('checking');
    setTelegramError(null);
    try {
      const res = await fetch(`/api/telegram/status?token=${encodeURIComponent(token.trim())}&chat_id=${encodeURIComponent(chat.trim())}`);
      const data = await res.json();
      if (res.ok && data.configured && data.bot) {
        setTelegramStatus('connected');
        setTelegramBotInfo(data.bot);
        setTelegramConfig((prev: typeof telegramConfig) => ({
          ...prev,
          lastPing: new Date().toLocaleTimeString('ru-RU'),
        }));
      } else {
        setTelegramStatus('error');
        setTelegramError(data.error || 'Не удалось авторизовать бота. Проверьте правильность токена.');
        setTelegramBotInfo(null);
      }
    } catch (err: any) {
      setTelegramStatus('error');
      setTelegramError(`Сетевая ошибка при связи с сервером: ${err?.message || err}`);
    }
  };

  // Check on mount if token is saved
  useEffect(() => {
    if (telegramConfig.botToken) {
      verifyTelegramBot(telegramConfig.botToken, telegramConfig.channelId);
    }
  }, []);

  // Send message through backend API
  const sendTelegramMessage = async (
    text: string,
    isManualTest = false,
    options?: { matchId?: string; ruleId?: string; force?: boolean }
  ) => {
    const token = telegramConfig.botToken.trim();
    const chatId = telegramConfig.channelId.trim();

    if (!token || !chatId) {
      if (isManualTest) {
        setTelegramError('Заполните Bot Token и Chat ID перед отправкой сообщения.');
      }
      return { ok: false, error: 'Заполните Bot Token и Chat ID' };
    }

    setTelegramStatus('sending');
    setTelegramError(null);

    try {
      const res = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          chat_id: chatId,
          bot_token: token,
          disable_notification: telegramConfig.silentMode,
          parse_mode: telegramConfig.parseMode,
          match_id: options?.matchId,
          rule_id: options?.ruleId,
          force: options?.force ?? isManualTest,
          cooldown_seconds: (telegramConfig.cooldownMinutes || 15) * 60,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        if (data.duplicateSuppressed) {
          setTelegramStatus('connected');
          setTelegramConfig((prev: typeof telegramConfig) => ({
            ...prev,
            blockedDuplicatesCount: (prev.blockedDuplicatesCount || 0) + 1,
          }));
          return { ok: true, duplicateSuppressed: true, message: data.message };
        }

        setTelegramStatus('connected');
        setTelegramConfig((prev: typeof telegramConfig) => ({
          ...prev,
          notificationsCount: prev.notificationsCount + 1,
          lastPing: new Date().toLocaleTimeString('ru-RU'),
        }));
        setLastSentResult({
          ok: true,
          messageId: data.messageId,
          text: `Сообщение доставлено в чат/канал (ID: #${data.messageId})`,
          time: new Date().toLocaleTimeString('ru-RU'),
        });
        return { ok: true, messageId: data.messageId };
      } else {
        setTelegramStatus('error');
        const errMsg = data.error || 'Ошибка при отправке в Telegram';
        setTelegramError(errMsg);
        setLastSentResult({
          ok: false,
          text: errMsg,
          time: new Date().toLocaleTimeString('ru-RU'),
        });
        return { ok: false, error: errMsg };
      }
    } catch (err: any) {
      setTelegramStatus('error');
      const netErr = `Сетевая ошибка отправки: ${err?.message || err}`;
      setTelegramError(netErr);
      return { ok: false, error: netErr };
    }
  };

  // Simulation: live ticking (only when in simulated demo mode)
  useEffect(() => {
    if (!isMonitoringActive) return;
    if (dataSourceConfig.activeSource !== 'simulated') return;

    const interval = setInterval(() => {
      setMatches((prev) =>
        prev.map((m) => {
          if (m.status !== 'LIVE') return m;
          const nextMinute = m.minute >= 90 ? 90 : m.minute + 1;
          const isHomePressuring = Math.random() > 0.45;
          const deltaAttacks = Math.floor(Math.random() * 2);
          const deltaDang = Math.random() > 0.6 ? 1 : 0;
          const deltaShots = Math.random() > 0.85 ? 1 : 0;
          const deltaCorners = Math.random() > 0.9 ? 1 : 0;

          return {
            ...m,
            minute: nextMinute,
            stats: {
              ...m.stats,
              attacks: [
                m.stats.attacks[0] + (isHomePressuring ? deltaAttacks : 0),
                m.stats.attacks[1] + (!isHomePressuring ? deltaAttacks : 0),
              ],
              dangerousAttacks: [
                m.stats.dangerousAttacks[0] + (isHomePressuring ? deltaDang : 0),
                m.stats.dangerousAttacks[1] + (!isHomePressuring ? deltaDang : 0),
              ],
              shotsOnTarget: [
                m.stats.shotsOnTarget[0] + (isHomePressuring && deltaShots ? 1 : 0),
                m.stats.shotsOnTarget[1] + (!isHomePressuring && deltaShots ? 1 : 0),
              ],
              corners: [
                m.stats.corners[0] + (isHomePressuring && deltaCorners ? 1 : 0),
                m.stats.corners[1] + (!isHomePressuring && deltaCorners ? 1 : 0),
              ],
            },
          };
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [isMonitoringActive]);

  // Check filter triggers and auto-send alerts with Anti-Spam deduplication
  useEffect(() => {
    matches.forEach((match) => {
      const analysis = calculatePressureAnalysis(match);

      filters.filter((f) => f.enabled).forEach((rule) => {
        const evalResult = evaluateFilterRule(match, rule);
        if (!evalResult.matches) return;

        const trackerKey = `${match.id}__${rule.id}`;
        const existingTrack = sentSignalsTrackerRef.current.get(trackerKey);
        const currentScoreStr = `${match.score[0]}:${match.score[1]}`;

        let isDuplicateSuppressed = false;

        if (telegramConfig.suppressDuplicates) {
          if (existingTrack) {
            if (telegramConfig.deduplicationMode === 'once-per-match') {
              isDuplicateSuppressed = true;
            } else if (telegramConfig.deduplicationMode === 'cooldown') {
              const minutesPassed = Math.abs(match.minute - existingTrack.lastMinute);
              const msPassed = Date.now() - existingTrack.lastSentAt;
              const cooldownMs = (telegramConfig.cooldownMinutes || 15) * 60 * 1000;
              if (minutesPassed < (telegramConfig.cooldownMinutes || 15) && msPassed < cooldownMs) {
                isDuplicateSuppressed = true;
              }
            } else if (telegramConfig.deduplicationMode === 'score-change') {
              if (currentScoreStr === existingTrack.lastScore) {
                isDuplicateSuppressed = true;
              }
            }
          }
        }

        if (isDuplicateSuppressed) {
          return;
        }

        // Record into anti-spam memory
        sentSignalsTrackerRef.current.set(trackerKey, {
          lastSentAt: Date.now(),
          lastMinute: match.minute,
          lastScore: currentScoreStr,
        });
        try {
          localStorage.setItem(
            'footbalmonitor_sent_signals_tracker',
            JSON.stringify(Array.from(sentSignalsTrackerRef.current.entries()))
          );
        } catch (e) {
          // ignore
        }

        // Found match and passed anti-spam! Check if alert already recorded in current state list
        const alertId = `${match.id}-${rule.id}-${match.minute}`;
        setSignals((prev) => {
          if (prev.some((s) => s.id === alertId)) return prev;

          const shouldSendTg = rule.telegramEnabled && telegramConfig.autoSend && !!telegramConfig.botToken && !!telegramConfig.channelId;
          const estimatedOdds = getEstimatedOdds(rule.targetMarket, match.minute);
          const newAlert: SignalAlert = {
            id: alertId,
            timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            matchId: match.id,
            matchName: `${match.homeTeam} vs ${match.awayTeam}`,
            league: match.league,
            country: match.country,
            minute: match.minute,
            score: currentScoreStr,
            ruleId: rule.id,
            ruleName: rule.name,
            marketSuggestion: rule.targetMarket,
            outcome: 'PENDING',
            odds: estimatedOdds,
            stake: 1000,
            message: `⚽ [СИГНАЛ] ${match.country} | ${match.league}\n${match.homeTeam} ${match.score[0]}:${match.score[1]} ${match.awayTeam} (${match.minute}')\n` +
              (rule.targetMarket ? `🎯 Исход: ${rule.targetMarket}\n` : '') +
              `🔥 Давление: ${analysis.pressureIndex}/100 | Оп. атаки ${match.stats.dangerousAttacks[0]}-${match.stats.dangerousAttacks[1]} | Удары в створ ${match.stats.shotsOnTarget[0]}-${match.stats.shotsOnTarget[1]} | Углы ${match.stats.corners[0]}-${match.stats.corners[1]}`,
            sentToTelegram: shouldSendTg,
            telegramStatusText: shouldSendTg ? 'Отправка в Telegram...' : 'Локальный сигнал',
          };

          if (shouldSendTg) {
            sendTelegramMessage(
              formatExtendedTelegramAlert(match, rule, analysis),
              false,
              { matchId: match.id, ruleId: rule.id }
            ).then((res) => {
              setSignals((curr) =>
                curr.map((item) =>
                  item.id === alertId
                    ? {
                        ...item,
                        sentToTelegram: res.ok && !res.duplicateSuppressed,
                        telegramStatusText: res.duplicateSuppressed
                          ? '🛡️ Дубликат подавлен'
                          : res.ok
                          ? `Доставлено в TG (#${res.messageId})`
                          : (res.error || 'Ошибка отправки'),
                        telegramMessageId: res.messageId,
                      }
                    : item
                )
              );
            });
          }

          return [newAlert, ...prev].slice(0, 50);
        });
      });
    });
  }, [
    matches,
    filters,
    telegramConfig.autoSend,
    telegramConfig.botToken,
    telegramConfig.channelId,
    telegramConfig.suppressDuplicates,
    telegramConfig.deduplicationMode,
    telegramConfig.cooldownMinutes,
  ]);

  const selectedMatch = useMemo(() => {
    return matches.find((m) => m.id === selectedMatchId) || matches[0];
  }, [matches, selectedMatchId]);

  const filteredMatches = useMemo(() => {
    return matches.filter(
      (m) =>
        m.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.awayTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.league.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.country.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [matches, searchQuery]);

  // Filter manager operations
  const handleSaveFilter = (savedRule: FilterRule) => {
    setFilters((prev) => {
      const exists = prev.some((f) => f.id === savedRule.id);
      if (exists) {
        return prev.map((f) => (f.id === savedRule.id ? savedRule : f));
      }
      return [savedRule, ...prev];
    });
  };

  const handleDeleteFilter = (id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDuplicateFilter = (rule: FilterRule) => {
    const copy: FilterRule = {
      ...rule,
      id: `copy-${Date.now()}`,
      name: `${rule.name} (копия)`,
      isPreset: false,
    };
    setFilters((prev) => [copy, ...prev]);
  };

  const handleCreateFilterFromMatch = (match: Match) => {
    const dangDiff = Math.abs(match.stats.dangerousAttacks[0] - match.stats.dangerousAttacks[1]);
    const totalShots =
      match.stats.shotsOnTarget[0] +
      match.stats.shotsOnTarget[1] +
      match.stats.shotsOffTarget[0] +
      match.stats.shotsOffTarget[1];
    const totalSot = match.stats.shotsOnTarget[0] + match.stats.shotsOnTarget[1];
    const totalCorners = match.stats.corners[0] + match.stats.corners[1];
    const totalXg = match.stats.xg[0] + match.stats.xg[1];
    const analysis = calculatePressureAnalysis(match);

    const customRule: FilterRule = {
      id: `custom-match-${Date.now()}`,
      name: `⚡ Стратегия под ${match.homeTeam} (${match.minute}')`,
      description: `Создано на основе параметров игры ${match.homeTeam} vs ${match.awayTeam} (${match.score[0]}:${match.score[1]}, ${match.minute}')`,
      category: 'custom',
      enabled: true,
      minMinute: Math.max(0, match.minute - 10),
      maxMinute: Math.min(90, match.minute + 15),
      scoreCondition:
        match.score[0] === match.score[1]
          ? match.score[0] === 0
            ? '0-0'
            : 'DRAW'
          : Math.abs(match.score[0] - match.score[1]) === 1
          ? 'ONE_GOAL_DIFF'
          : 'ANY',
      minDangerousAttacksDiff: dangDiff >= 10 ? dangDiff - 5 : 10,
      minTotalShots: totalShots >= 5 ? totalShots - 2 : undefined,
      minShotsOnTargetTotal: totalSot >= 3 ? totalSot - 1 : undefined,
      minTotalCorners: totalCorners >= 4 ? totalCorners - 1 : undefined,
      minXgTotal: totalXg >= 1 ? Number((totalXg * 0.8).toFixed(1)) : undefined,
      minPressureIndex: Math.max(40, analysis.pressureIndex - 10),
      redCardCondition:
        match.stats.redCards[0] > 0 || match.stats.redCards[1] > 0 ? 'HAS_RED_CARD' : 'ANY',
      targetMarket:
        match.score[0] + match.score[1] === 0
          ? 'ТБ 0.5 в матче'
          : 'Следующий гол / ТБ',
      telegramEnabled: true,
      color: 'emerald',
      isPreset: false,
    };

    setEditingFilter(customRule);
    setIsFilterModalOpen(true);
  };

  const handleResetFilters = () => {
    if (window.confirm('Сбросить все фильтры к расширенным заводским алгоритмам? Все пользовательские изменения будут сброшены.')) {
      setFilters(EXPANDED_DEFAULT_FILTERS);
    }
  };

  const handleExportFiltersJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filters, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `footbalmonitor_filters_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleImportFiltersJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFilters(parsed);
        } else {
          alert('Файл должен содержать массив правил фильтрации');
        }
      } catch (err: any) {
        alert('Ошибка при импорте JSON: ' + (err?.message || err));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const triggerTestSignal = async () => {
    if (!selectedMatch) return;
    const alertId = `manual-${Date.now()}`;
    const analysis = calculatePressureAnalysis(selectedMatch);
    const activeRule = filters.find((f) => f.enabled) || filters[0];
    const textHtml = formatExtendedTelegramAlert(selectedMatch, activeRule, analysis);
    const displayMsg = `🔔 [ТЕСТОВЫЙ ПУШ]\n${selectedMatch.countryCode} ${selectedMatch.country} | ${selectedMatch.league}\n${selectedMatch.homeTeam} ${selectedMatch.score[0]}:${selectedMatch.score[1]} ${selectedMatch.awayTeam} (${selectedMatch.minute}')\n` +
      `🔥 Давление: ${analysis.pressureIndex}/100 | Опасные атаки: ${selectedMatch.stats.dangerousAttacks[0]}-${selectedMatch.stats.dangerousAttacks[1]} | Удары в створ: ${selectedMatch.stats.shotsOnTarget[0]}-${selectedMatch.stats.shotsOnTarget[1]}`;

    const res = await sendTelegramMessage(textHtml, true);

    const testAlert: SignalAlert = {
      id: alertId,
      timestamp: new Date().toLocaleTimeString('ru-RU'),
      matchId: selectedMatch.id,
      matchName: `${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`,
      league: selectedMatch.league,
      country: selectedMatch.country,
      minute: selectedMatch.minute,
      score: `${selectedMatch.score[0]}:${selectedMatch.score[1]}`,
      ruleId: activeRule?.id,
      ruleName: `Тестовый сигнал (${activeRule?.name || 'Ручной'})`,
      marketSuggestion: activeRule?.targetMarket || 'ТБ 0.5',
      outcome: 'WIN',
      odds: 1.85,
      stake: 1000,
      profit: 850,
      finalScore: `${selectedMatch.score[0] + 1}:${selectedMatch.score[1]}`,
      resolutionNote: 'Тестовый сигнал подтвержден (зашел)',
      resolvedAt: new Date().toLocaleTimeString('ru-RU'),
      message: displayMsg,
      sentToTelegram: res.ok,
      telegramStatusText: res.ok ? `Доставлено в TG (#${res.messageId})` : (res.error || 'Ошибка отправки'),
      telegramMessageId: res.messageId,
    };
    setSignals((prev) => [testAlert, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header id="app-header" className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
            <Radio className="h-5 w-5 animate-pulse text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Footbalmonitor</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                LIVE ENGINE v2.4
              </span>
            </div>
            <p className="text-xs text-slate-400">Платформа мониторинга Flashscore & SStats с автоматическими Telegram-сигналами</p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Data Sources / Real Matches Trigger */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              id="open-datasources-btn"
              onClick={() => setIsDataSourcesModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition"
              title="Открыть настройку источников данных (Public Live Feed, API-Football, Webhook)"
            >
              <Globe className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">
                {dataSourceConfig.activeSource === 'flashscore'
                  ? '⚡ Flashscore Live'
                  : dataSourceConfig.activeSource === 'sstats'
                  ? '📊 SStats.net'
                  : dataSourceConfig.activeSource === 'sofascore'
                  ? '⚽ Sofascore'
                  : dataSourceConfig.activeSource === 'public-feed'
                  ? 'Public Live Feed'
                  : dataSourceConfig.activeSource === 'api-football'
                  ? 'API-Football'
                  : dataSourceConfig.activeSource === 'football-data'
                  ? 'Football-Data'
                  : dataSourceConfig.activeSource === 'webhook'
                  ? 'Webhook Feed'
                  : 'Демо-симулятор'}
              </span>
              <span className="sm:hidden">Фид</span>
            </button>
            <button
              onClick={() => fetchLiveMatchesFromSource()}
              disabled={isRefreshingMatches}
              className="p-1.5 rounded-md text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition disabled:opacity-50"
              title="Синхронизировать реальные live-матчи прямо сейчас"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingMatches ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>

          {/* Real Match Lab / Tester */}
          <button
            id="open-real-match-tester-btn"
            onClick={() => setIsRealMatchTesterOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm transition hover:scale-[1.02] active:scale-[0.98]"
            title="Протестировать любой реальный матч из БК или Flashscore на всех 35 стратегиях"
          >
            <FlaskConical className="h-3.5 w-3.5 text-amber-400" />
            <span>Тест матча</span>
            <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-[10px] font-extrabold uppercase">
              LAB
            </span>
          </button>

          <button
            id="toggle-monitoring-btn"
            onClick={() => setIsMonitoringActive(!isMonitoringActive)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isMonitoringActive
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {isMonitoringActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isMonitoringActive ? 'Мониторинг активен' : 'Пауза'}</span>
          </button>

          <button
            id="send-test-signal-btn"
            onClick={triggerTestSignal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 transition-colors"
            title="Отправить тестовый сигнал в настроенный Telegram канал"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Тест в TG</span>
          </button>

          <button
            id="open-ai-analyst-header-btn"
            onClick={() => handleOpenAIAnalyst(selectedMatch || matches[0])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-950/50 border border-indigo-400/30 transition hover:scale-[1.02] active:scale-[0.98]"
            title="Запустить мгновенный AI-анализ матча"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-200 animate-pulse" />
            <span>AI-Аналитик</span>
          </button>

          <button
            id="create-filter-header-btn"
            onClick={() => {
              setEditingFilter(null);
              setIsFilterModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 border border-emerald-500/40 transition hover:scale-[1.02] active:scale-[0.98]"
            title="Создать и настроить собственный алгоритм фильтрации"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Новый фильтр</span>
          </button>

          <div className="h-4 w-px bg-slate-800 hidden md:block" />

          {/* Navigation tabs */}
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-3 py-1 rounded-md transition ${activeTab === 'matches' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Матчи ({matches.length})
            </button>
            <button
              onClick={() => setActiveTab('filters')}
              className={`px-3 py-1 rounded-md transition ${activeTab === 'filters' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Фильтры ({filters.filter((f) => f.enabled).length})
            </button>
            <button
              onClick={() => setActiveTab('signals')}
              className={`px-3 py-1 rounded-md transition relative ${activeTab === 'signals' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Сигналы
              {signals.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                  {signals.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('backtest')}
              className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
                activeTab === 'backtest'
                  ? 'bg-slate-800 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              Бэктестинг & ROI
            </button>
            <button
              onClick={() => setActiveTab('telegram')}
              className={`px-3 py-1 rounded-md transition ${activeTab === 'telegram' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Telegram Бот
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div
            onClick={() => setIsDataSourcesModalOpen(true)}
            className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-4 flex items-center justify-between cursor-pointer transition group"
            title="Нажмите, чтобы переключить источник (Public Live Feed, API-Football, Webhook)"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-slate-400 group-hover:text-cyan-300 transition">
                <span>Провайдер данных</span>
                <span className="text-[10px] text-cyan-400 font-mono">⚙</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${
                  dataSourceConfig.activeSource !== 'simulated' ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400 animate-ping'
                }`} />
                <span className="text-sm font-semibold text-white">
                  {dataSourceConfig.activeSource === 'public-feed'
                    ? 'Public Live Feed'
                    : dataSourceConfig.activeSource === 'api-football'
                    ? 'API-Football Live'
                    : dataSourceConfig.activeSource === 'webhook'
                    ? 'Webhook Stream'
                    : 'Flashscore Demo'}
                </span>
              </div>
              {lastFetchedAt && (
                <div className="text-[10px] text-slate-500">
                  Обновлено: {lastFetchedAt}
                </div>
              )}
            </div>
            <Globe className="h-6 w-6 text-cyan-400/50 group-hover:text-cyan-400 transition" />
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400">Матчей в лайве</span>
              <div className="text-xl font-bold text-white">{matches.length}</div>
            </div>
            <Flame className="h-6 w-6 text-amber-400/50" />
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400">Активные фильтры</span>
              <div className="text-xl font-bold text-emerald-400">{filters.filter((f) => f.enabled).length} / {filters.length}</div>
            </div>
            <Sliders className="h-6 w-6 text-blue-400/50" />
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                Отправлено в канал
                {telegramConfig.blockedDuplicatesCount ? (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono" title="Заблокировано повторных спам-сигналов">
                    🛡️ -{telegramConfig.blockedDuplicatesCount} спама
                  </span>
                ) : null}
              </span>
              <div className="text-xl font-bold text-blue-400">{telegramConfig.notificationsCount} алертов</div>
            </div>
            <Send className="h-6 w-6 text-blue-400/50" />
          </div>
        </div>

        {/* Data Source Error Banner */}
        {dataSourceError && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center justify-between text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{dataSourceError}</span>
            </div>
            <button
              onClick={() => setDataSourceError(null)}
              className="text-slate-400 hover:text-white text-xs px-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab 1: Live Matches & Detailed In-Play Analytics */}
        {activeTab === 'matches' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Matches list (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="search-match-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск по команде, лиге, стране..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  onClick={() => setIsRealMatchTesterOpen(true)}
                  className="px-2.5 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition shrink-0"
                  title="Открыть лабораторию тестирования реального матча"
                >
                  <FlaskConical className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Тестер</span>
                </button>

                <button
                  onClick={() => fetchLiveMatchesFromSource()}
                  disabled={isRefreshingMatches}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-slate-700 transition shrink-0 disabled:opacity-50"
                  title="Обновить live-матчи"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshingMatches ? 'animate-spin text-emerald-400' : ''}`} />
                </button>
              </div>

              {/* Feed mode indicator bar */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${dataSourceConfig.activeSource !== 'simulated' ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
                  <span>
                    Источник: <strong className="text-slate-200">{
                      dataSourceConfig.activeSource === 'flashscore' ? '⚡ Flashscore Live (Парсер)' :
                      dataSourceConfig.activeSource === 'sstats' ? '📊 SStats.net API' :
                      dataSourceConfig.activeSource === 'sofascore' ? '⚽ Sofascore Live' :
                      dataSourceConfig.activeSource === 'public-feed' ? 'Реальный онлайн-фид' :
                      dataSourceConfig.activeSource === 'api-football' ? 'API-Football' :
                      dataSourceConfig.activeSource === 'football-data' ? 'Football-Data.org' :
                      dataSourceConfig.activeSource === 'webhook' ? 'Webhook' : 'Демо-симулятор'
                    }</strong>
                  </span>
                </div>
                <button
                  onClick={() => setIsDataSourcesModalOpen(true)}
                  className="text-cyan-400 hover:underline font-medium text-[10px]"
                >
                  Сменить / Настроить →
                </button>
              </div>

              <div className="space-y-2">
                {filteredMatches.map((match) => {
                  const isSelected = match.id === selectedMatchId;
                  const dangDiff = match.stats.dangerousAttacks[0] - match.stats.dangerousAttacks[1];
                  const isHighPressure = Math.abs(dangDiff) >= 25;
                  const analysis = calculatePressureAnalysis(match);
                  const matchingRules = filters.filter((f) => f.enabled && evaluateFilterRule(match, f).matches);

                  return (
                    <div
                      key={match.id}
                      onClick={() => setSelectedMatchId(match.id)}
                      className={`cursor-pointer rounded-xl border p-4 transition-all ${
                        isSelected
                          ? 'bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-950/40'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span>{match.countryCode}</span>
                          <span>{match.country}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-300">{match.league}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAIAnalyst(match);
                            }}
                            className="px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold flex items-center gap-1 transition"
                            title="Открыть AI-анализ матча в один клик"
                          >
                            <Sparkles className="h-2.5 w-2.5 text-indigo-400" />
                            AI
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateFilterFromMatch(match);
                            }}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/40 text-[10px] font-semibold flex items-center gap-1 transition"
                            title="Создать алгоритм фильтрации по текущей статистике этого матча"
                          >
                            <Sliders className="h-2.5 w-2.5 text-emerald-400" />
                            Фильтр
                          </button>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[11px] border border-emerald-500/20">
                            {match.minute}'
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{match.source}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between my-2">
                        <div className="flex-1 space-y-1">
                          <div className="font-semibold text-sm text-white flex items-center justify-between pr-4">
                            <span>{match.homeTeam}</span>
                            <span className="text-lg font-bold font-mono">{match.score[0]}</span>
                          </div>
                          <div className="font-semibold text-sm text-white flex items-center justify-between pr-4">
                            <span>{match.awayTeam}</span>
                            <span className="text-lg font-bold font-mono">{match.score[1]}</span>
                          </div>
                        </div>

                        {/* Pressure badge */}
                        <div className="pl-3 border-l border-slate-800 flex flex-col items-center justify-center min-w-[65px]">
                          <span
                            className={`p-1.5 rounded-lg border text-xs font-bold font-mono flex items-center gap-1 ${
                              analysis.pressureIndex >= 75
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
                                : analysis.pressureIndex >= 50
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            <Flame className="h-3.5 w-3.5" />
                            {analysis.pressureIndex}%
                          </span>
                          <span className="text-[9px] text-slate-400 mt-1 font-medium text-center">
                            {analysis.goalProbability === 'EXTREME'
                              ? 'Гол назревает'
                              : analysis.goalProbability === 'HIGH'
                              ? 'Высокое давл.'
                              : analysis.goalProbability === 'MEDIUM'
                              ? 'Средний темп'
                              : 'Спокойно'}
                          </span>
                        </div>
                      </div>

                      {/* Quick stat bar */}
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          Оп. атаки: <strong className="text-slate-200">{match.stats.dangerousAttacks[0]} - {match.stats.dangerousAttacks[1]}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          Удары: <strong className="text-slate-200">{match.stats.shotsOnTarget[0] + match.stats.shotsOffTarget[0]} - {match.stats.shotsOnTarget[1] + match.stats.shotsOffTarget[1]}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          Углы: <strong className="text-slate-200">{match.stats.corners[0]} - {match.stats.corners[1]}</strong>
                        </span>
                      </div>

                      {/* Matching Filters badges on card */}
                      {matchingRules.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5 items-center">
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Сработали ({matchingRules.length}):
                          </span>
                          {matchingRules.map((rule) => (
                            <span
                              key={rule.id}
                              className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1"
                              title={rule.name}
                            >
                              {rule.name.split('(')[0].trim()}
                              {rule.targetMarket && <span className="text-emerald-400/80 font-mono font-normal">[{rule.targetMarket}]</span>}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Match In-Depth Inspector (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {selectedMatch && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                  {/* Title Bar */}
                  <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-base">{selectedMatch.countryCode}</span>
                        <span className="font-semibold text-slate-200">{selectedMatch.country}</span>
                        <span>•</span>
                        <span>{selectedMatch.league}</span>
                      </div>
                      <h2 className="text-2xl font-black text-white mt-1">
                        {selectedMatch.homeTeam} <span className="text-emerald-400">{selectedMatch.score[0]} : {selectedMatch.score[1]}</span> {selectedMatch.awayTeam}
                      </h2>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          id="match-inspector-create-filter-btn"
                          onClick={() => handleCreateFilterFromMatch(selectedMatch)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 hover:border-emerald-500/50 transition active:scale-[0.98]"
                          title="Создать собственный фильтр по текущим показателям этого матча"
                        >
                          <Sliders className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Создать фильтр по матчу</span>
                        </button>

                        <button
                          id="match-inspector-ai-btn"
                          onClick={() => handleOpenAIAnalyst(selectedMatch)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-950/60 border border-indigo-400/30 transition hover:scale-[1.02] active:scale-[0.98]"
                          title="Запустить глубокий AI-анализ матча и расчет вероятностей"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-indigo-200 animate-pulse" />
                          <span>AI-Аналитик в 1 клик</span>
                        </button>

                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                          {selectedMatch.minute} МИНУТА
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400">Синхронизация: {selectedMatch.source} API</div>
                    </div>
                  </div>

                  {/* Last Match Event */}
                  {selectedMatch.lastEvent && (
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Последнее ключевое событие</div>
                        <div className="text-xs text-slate-200 font-medium">{selectedMatch.lastEvent}</div>
                      </div>
                    </div>
                  )}

                  {/* Algorithmic Pressure & Filter Intelligence Inspector */}
                  {(() => {
                    const analysis = calculatePressureAnalysis(selectedMatch);
                    const matchingRules = filters.filter((f) => f.enabled && evaluateFilterRule(selectedMatch, f).matches);
                    const evaluatedRules = filters.filter((f) => f.enabled).map((rule) => ({
                      rule,
                      result: evaluateFilterRule(selectedMatch, rule),
                    }));

                    return (
                      <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
                            <Cpu className="h-4 w-4 text-emerald-400" />
                            Алгоритмический анализ давления и вероятность гола
                          </h3>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                              analysis.goalProbability === 'EXTREME'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : analysis.goalProbability === 'HIGH'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : analysis.goalProbability === 'MEDIUM'
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            Вероятность гола: {analysis.goalProbability} ({analysis.pressureIndex}/100)
                          </span>
                        </div>

                        {/* Pressure progress bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-400">Индекс штурма (Pressure Index)</span>
                            <span className="font-bold text-white">{analysis.pressureIndex}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${analysis.pressureIndex}%` }}
                              className={`h-full transition-all duration-500 ${
                                analysis.pressureIndex >= 75
                                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                                  : analysis.pressureIndex >= 50
                                  ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Reasons grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          {analysis.reasons.map((reason, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              <span className="text-[11px]">{reason}</span>
                            </div>
                          ))}
                        </div>

                        {/* Evaluated Rules Matrix */}
                        <div className="pt-2 border-t border-slate-800/80">
                          <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center justify-between">
                            <span>Проверка совпадения фильтров для этого матча:</span>
                            <span className="text-emerald-400">{matchingRules.length} из {filters.filter((f) => f.enabled).length} сработало</span>
                          </div>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {evaluatedRules.map(({ rule, result }) => (
                              <div
                                key={rule.id}
                                className={`p-2 rounded-lg border flex items-center justify-between text-xs transition ${
                                  result.matches
                                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                                    : 'bg-slate-900/40 border-slate-800 text-slate-400'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {result.matches ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                  ) : (
                                    <div className="h-4 w-4 rounded-full border border-slate-700 shrink-0 flex items-center justify-center text-[9px] text-slate-600">
                                      ✕
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-semibold text-white text-[12px]">{rule.name}</div>
                                    {rule.targetMarket && (
                                      <div className="text-[10px] text-amber-400 font-mono">🎯 Исход: {rule.targetMarket}</div>
                                    )}
                                    {!result.matches && result.unmetCriteria && result.unmetCriteria.length > 0 && (
                                      <div className="text-[10px] text-slate-500 mt-0.5">
                                        Не выполнено: {result.unmetCriteria[0]}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingFilter(rule);
                                      setIsFilterModalOpen(true);
                                    }}
                                    className="p-1 rounded bg-slate-850 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700/60 transition"
                                    title="Настроить параметры этого фильтра"
                                  >
                                    <Sliders className="h-3 w-3 text-emerald-400" />
                                  </button>
                                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                                    result.matches ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                                  }`}>
                                    {result.matches ? 'СИГНАЛ' : 'НЕТ'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => {
                              setEditingFilter(null);
                              setIsFilterModalOpen(true);
                            }}
                            className="w-full mt-2.5 py-1.5 px-3 rounded-lg border border-dashed border-slate-700 hover:border-emerald-500/80 text-slate-400 hover:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition bg-slate-900/40 hover:bg-slate-900"
                          >
                            <Plus className="h-3.5 w-3.5 text-emerald-400" />
                            Создать новый фильтр под этот матч
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Stat Comparison Bars */}
                  <div className="space-y-4">
                    <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-emerald-400" />
                      Статистика матча в реальном времени
                    </h3>

                    {/* Possession */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{selectedMatch.stats.possession[0]}%</span>
                        <span className="text-slate-400 font-normal">Владение мячом</span>
                        <span>{selectedMatch.stats.possession[1]}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div style={{ width: `${selectedMatch.stats.possession[0]}%` }} className="bg-emerald-500" />
                        <div style={{ width: `${selectedMatch.stats.possession[1]}%` }} className="bg-blue-500" />
                      </div>
                    </div>

                    {/* Dangerous Attacks */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-emerald-400 font-bold">{selectedMatch.stats.dangerousAttacks[0]}</span>
                        <span className="text-slate-400 font-normal">Опасные атаки (DA)</span>
                        <span className="text-blue-400 font-bold">{selectedMatch.stats.dangerousAttacks[1]}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          style={{
                            width: `${
                              (selectedMatch.stats.dangerousAttacks[0] /
                                (selectedMatch.stats.dangerousAttacks[0] + selectedMatch.stats.dangerousAttacks[1] || 1)) *
                              100
                            }%`,
                          }}
                          className="bg-emerald-500"
                        />
                        <div
                          style={{
                            width: `${
                              (selectedMatch.stats.dangerousAttacks[1] /
                                (selectedMatch.stats.dangerousAttacks[0] + selectedMatch.stats.dangerousAttacks[1] || 1)) *
                              100
                            }%`,
                          }}
                          className="bg-blue-500"
                        />
                      </div>
                    </div>

                    {/* Shots on Target */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{selectedMatch.stats.shotsOnTarget[0]}</span>
                        <span className="text-slate-400 font-normal">Удары в створ</span>
                        <span>{selectedMatch.stats.shotsOnTarget[1]}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          style={{
                            width: `${
                              (selectedMatch.stats.shotsOnTarget[0] /
                                (selectedMatch.stats.shotsOnTarget[0] + selectedMatch.stats.shotsOnTarget[1] || 1)) *
                              100
                            }%`,
                          }}
                          className="bg-emerald-500"
                        />
                        <div
                          style={{
                            width: `${
                              (selectedMatch.stats.shotsOnTarget[1] /
                                (selectedMatch.stats.shotsOnTarget[0] + selectedMatch.stats.shotsOnTarget[1] || 1)) *
                              100
                            }%`,
                          }}
                          className="bg-blue-500"
                        />
                      </div>
                    </div>

                    {/* Corners */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{selectedMatch.stats.corners[0]}</span>
                        <span className="text-slate-400 font-normal">Угловые</span>
                        <span>{selectedMatch.stats.corners[1]}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          style={{
                            width: `${
                              (selectedMatch.stats.corners[0] /
                                (selectedMatch.stats.corners[0] + selectedMatch.stats.corners[1] || 1)) *
                              100
                            }%`,
                          }}
                          className="bg-emerald-500"
                        />
                        <div
                          style={{
                            width: `${
                              (selectedMatch.stats.corners[1] /
                                (selectedMatch.stats.corners[0] + selectedMatch.stats.corners[1] || 1)) *
                              100
                            }%`,
                          }}
                          className="bg-blue-500"
                        />
                      </div>
                    </div>

                    {/* xG Model */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="font-mono">{selectedMatch.stats.xg[0]}</span>
                        <span className="text-slate-400 font-normal">Ожидаемые голы (xG)</span>
                        <span className="font-mono">{selectedMatch.stats.xg[1]}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          style={{
                            width: `${
                              (selectedMatch.stats.xg[0] /
                                (selectedMatch.stats.xg[0] + selectedMatch.stats.xg[1] || 1)) *
                              100
                            }%`,
                          }}
                          className="bg-emerald-400"
                        />
                        <div
                          style={{
                            width: `${
                              (selectedMatch.stats.xg[1] /
                                (selectedMatch.stats.xg[0] + selectedMatch.stats.xg[1] || 1)) *
                              100
                            }%`,
                          }}
                          className="bg-blue-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live Odds */}
                  <div className="border-t border-slate-800 pt-4">
                    <div className="text-xs text-slate-400 mb-2 font-medium">Коэффициенты (1X2 & ТБ 2.5)</div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-slate-500">П1 ({selectedMatch.homeTeam})</div>
                        <div className="text-sm font-bold font-mono text-emerald-400">{selectedMatch.odds.home}</div>
                      </div>
                      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-slate-500">Ничья (X)</div>
                        <div className="text-sm font-bold font-mono text-white">{selectedMatch.odds.draw}</div>
                      </div>
                      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-slate-500">П2 ({selectedMatch.awayTeam})</div>
                        <div className="text-sm font-bold font-mono text-blue-400">{selectedMatch.odds.away}</div>
                      </div>
                      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-slate-500">ТБ 2.5</div>
                        <div className="text-sm font-bold font-mono text-amber-400">{selectedMatch.odds.over25}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Filter Engine (Expanded Management Center) */}
        {activeTab === 'filters' && (
          <div className="space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-emerald-400" />
                  Алгоритмические стратегии и фильтры сигналов
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Продвинутый конструктор правил для отслеживания аномалий, анализа давления и мгновенных алертов
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setEditingFilter(null);
                    setIsFilterModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  Создать алгоритм
                </button>

                <button
                  onClick={handleResetFilters}
                  title="Восстановить заводские 8 алгоритмов"
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                  Сброс пресетов
                </button>

                <button
                  onClick={handleExportFiltersJson}
                  title="Экспортировать правила в JSON"
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Download className="h-3.5 w-3.5 text-slate-400" />
                  JSON Экспорт
                </button>

                <label
                  title="Импортировать правила из JSON"
                  className="cursor-pointer px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Upload className="h-3.5 w-3.5 text-slate-400" />
                  JSON Импорт
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFiltersJson}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Quick Strategy Templates Banner */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  Быстрый старт: популярные шаблоны алгоритмов для настройки
                </span>
                <span className="text-[11px] text-slate-500">
                  Кликните по шаблону для открытия конструктора с готовыми параметрами
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    name: '🔥 Штурм (75-90\')',
                    desc: 'Навал в концовке',
                    preset: {
                      name: '🔥 Штурм в концовке (75-90\')',
                      description: 'Интенсивный навал в заключительные 15 минут матча при высокой активности',
                      category: 'pressure' as FilterCategory,
                      minMinute: 75,
                      maxMinute: 90,
                      scoreCondition: 'ANY' as ScoreCondition,
                      minDangerousAttacksDiff: 18,
                      minDangerousAttacksTotal: 45,
                      minTotalShots: 10,
                      minShotsOnTargetTotal: 4,
                      minTotalCorners: 6,
                      minPressureIndex: 65,
                      targetMarket: 'ТБ 0.5 во 2-м тайме / Гол в концовке',
                      color: 'rose',
                    },
                  },
                  {
                    name: '⚽ 0:0 Доминация',
                    desc: 'Сухой фаворит',
                    preset: {
                      name: '⚽ Сухое доминирование при 0:0',
                      description: 'Матч без голов во 2-м тайме, где одна из команд создала огромный перевес',
                      category: 'goals' as FilterCategory,
                      minMinute: 60,
                      maxMinute: 85,
                      scoreCondition: '0-0' as ScoreCondition,
                      minDangerousAttacksDiff: 22,
                      minTotalShots: 8,
                      minShotsOnTargetTotal: 4,
                      minXgTotal: 1.2,
                      minPressureIndex: 60,
                      targetMarket: 'ТБ 0.5 в матче / Победа фаворита',
                      color: 'emerald',
                    },
                  },
                  {
                    name: '🚩 Осада угловыми',
                    desc: 'Угловые ТБ',
                    preset: {
                      name: '🚩 Серия угловых и осада ворот',
                      description: 'Частые навесы, рикошеты и шквал стандартов у ворот соперника',
                      category: 'corners' as FilterCategory,
                      minMinute: 65,
                      maxMinute: 90,
                      scoreCondition: 'ANY' as ScoreCondition,
                      minDangerousAttacksDiff: 15,
                      minTotalCorners: 8,
                      minCornersDiff: 3,
                      minTotalShots: 10,
                      minPressureIndex: 55,
                      targetMarket: 'Тотал больше угловых',
                      color: 'blue',
                    },
                  },
                  {
                    name: '🎯 Камбэк фаворита',
                    desc: '1X / Фора 0',
                    preset: {
                      name: '🎯 Камбэк уступающего фаворита',
                      description: 'Фаворит уступает в 1 мяч при колоссальном перевесе по статистике',
                      category: 'comeback' as FilterCategory,
                      minMinute: 55,
                      maxMinute: 88,
                      scoreCondition: 'AWAY_LEAD' as ScoreCondition,
                      minDangerousAttacksDiff: 24,
                      minShotsOnTargetTotal: 5,
                      minPossessionDiff: 15,
                      minPressureIndex: 70,
                      targetMarket: '1X (двойной шанс) / Гол Хозяев',
                      color: 'amber',
                    },
                  },
                  {
                    name: '⏱️ 1-й тайм (HT Over)',
                    desc: 'Гол до перерыва',
                    preset: {
                      name: '⏱️ Открытая игра в 1-м тайме (HT Over)',
                      description: 'Высокий темп опасных атак и ударов в створ до 45-й минуты',
                      category: 'halftime' as FilterCategory,
                      minMinute: 25,
                      maxMinute: 45,
                      scoreCondition: '0-0' as ScoreCondition,
                      minDangerousAttacksTotal: 40,
                      minTotalShots: 7,
                      minShotsOnTargetTotal: 3,
                      minPressureIndex: 50,
                      targetMarket: 'ТБ 0.5 в 1-м тайме',
                      color: 'cyan',
                    },
                  },
                  {
                    name: '🟥 В большинстве',
                    desc: '11 vs 10',
                    preset: {
                      name: '🟥 Прессинг в численном большинстве',
                      description: 'Команда играет в большинстве после удаления и наращивает давление',
                      category: 'cards' as FilterCategory,
                      minMinute: 45,
                      maxMinute: 90,
                      scoreCondition: 'DRAW' as ScoreCondition,
                      redCardCondition: 'HAS_RED_CARD' as const,
                      minDangerousAttacksDiff: 15,
                      minPressureIndex: 60,
                      targetMarket: 'Победа команды в большинстве',
                      color: 'purple',
                    },
                  },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setEditingFilter({
                        id: `custom-${Date.now()}`,
                        enabled: true,
                        telegramEnabled: true,
                        isPreset: false,
                        ...item.preset,
                      });
                      setIsFilterModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                  >
                    <span className="font-semibold">{item.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({item.desc})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter Chips & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'all', label: 'Все', icon: '⚡' },
                    { id: 'goals', label: 'Голы', icon: '⚽' },
                    { id: 'corners', label: 'Угловые', icon: '🚩' },
                    { id: 'comeback', label: 'Камбэк', icon: '🎯' },
                    { id: 'halftime', label: '1-й тайм', icon: '⏱️' },
                    { id: 'pressure', label: 'Давление', icon: '🔥' },
                    { id: 'cards', label: 'Карточки', icon: '🟥' },
                    { id: 'custom', label: 'Мои фильтры', icon: '🛠️' },
                  ] as Array<{ id: FilterCategory; label: string; icon: string }>
                ).map((cat) => {
                  const count =
                    cat.id === 'all'
                      ? filters.length
                      : cat.id === 'custom'
                      ? filters.filter((f) => !f.isPreset).length
                      : filters.filter((f) => f.category === cat.id).length;

                  const isSelected = activeFilterCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveFilterCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search in filters */}
              <div className="relative min-w-[220px]">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={filterSearchQuery}
                  onChange={(e) => setFilterSearchQuery(e.target.value)}
                  placeholder="Поиск по фильтрам и рынкам..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Grid of Strategy Cards */}
            {(() => {
              const filteredList = filters.filter((rule) => {
                const matchCategory =
                  activeFilterCategory === 'all'
                    ? true
                    : activeFilterCategory === 'custom'
                    ? !rule.isPreset
                    : rule.category === activeFilterCategory;

                const matchQuery =
                  !filterSearchQuery.trim() ||
                  rule.name.toLowerCase().includes(filterSearchQuery.toLowerCase()) ||
                  rule.description.toLowerCase().includes(filterSearchQuery.toLowerCase()) ||
                  (rule.targetMarket && rule.targetMarket.toLowerCase().includes(filterSearchQuery.toLowerCase()));

                return matchCategory && matchQuery;
              });

              if (filteredList.length === 0) {
                return (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                    <Filter className="h-8 w-8 text-slate-600 mx-auto" />
                    <p className="text-sm text-slate-400">В этой категории или по вашему запросу нет фильтров.</p>
                    <button
                      onClick={() => {
                        setActiveFilterCategory('all');
                        setFilterSearchQuery('');
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                    >
                      Показать все стратегии
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredList.map((filter) => {
                    const matchingLiveMatches = matches.filter((m) => evaluateFilterRule(m, filter).matches);
                    const hasLiveMatches = matchingLiveMatches.length > 0;

                    return (
                      <div
                        key={filter.id}
                        className={`bg-slate-900 border rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all ${
                          filter.enabled
                            ? hasLiveMatches
                              ? 'border-emerald-500/70 shadow-lg shadow-emerald-950/30'
                              : 'border-slate-800 hover:border-slate-700'
                            : 'border-slate-800/60 opacity-60'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Top row */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {filter.minMinute}' - {filter.maxMinute}'
                              </span>
                              {filter.category && (
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800/80 text-emerald-400 border border-emerald-500/20">
                                  {filter.category}
                                </span>
                              )}
                              {filter.isPreset ? (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  Пресет
                                </span>
                              ) : (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                                  Авторский
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() =>
                                setFilters((prev) =>
                                  prev.map((f) => (f.id === filter.id ? { ...f, enabled: !f.enabled } : f))
                                )
                              }
                              className={`text-xs px-2.5 py-1 rounded-full font-semibold transition ${
                                filter.enabled
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                                  : 'bg-slate-800 text-slate-500 hover:text-slate-400'
                              }`}
                            >
                              {filter.enabled ? 'Активен' : 'Отключен'}
                            </button>
                          </div>

                          {/* Rule Title & Target Market */}
                          <div>
                            <h3 className="text-sm font-bold text-white leading-tight">{filter.name}</h3>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{filter.description}</p>
                            {filter.targetMarket && (
                              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-medium font-mono">
                                <Target className="h-3 w-3 text-amber-400" />
                                {filter.targetMarket}
                              </div>
                            )}
                          </div>

                          {/* Live match indicator */}
                          <div className="pt-1">
                            {hasLiveMatches ? (
                              <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[11px] text-emerald-300 font-semibold flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                                  Совпадает прямо сейчас ({matchingLiveMatches.length}):
                                </span>
                                <span className="font-mono text-white text-[10px]">
                                  {matchingLiveMatches.map((m) => m.homeTeam).join(', ')}
                                </span>
                              </div>
                            ) : (
                              <div className="px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[10px] text-slate-500 flex items-center gap-1.5">
                                <Clock className="h-3 w-3" />
                                Ожидание подходящей ситуации в live
                              </div>
                            )}
                          </div>

                          {/* Conditions Grid */}
                          <div className="pt-2 space-y-1.5 text-xs text-slate-300 font-mono bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
                            <div className="flex justify-between border-b border-slate-800/60 pb-1">
                              <span className="text-slate-500 font-sans">Счёт:</span>
                              <span className="font-bold text-slate-200">
                                {filter.scoreCondition === '0-0'
                                  ? '0:0'
                                  : filter.scoreCondition === 'DRAW'
                                  ? 'Любая ничья'
                                  : filter.scoreCondition === 'HOME_LEAD'
                                  ? 'Хозяева ведут'
                                  : filter.scoreCondition === 'AWAY_LEAD'
                                  ? 'Гости ведут'
                                  : filter.scoreCondition === 'ONE_GOAL_DIFF'
                                  ? 'Разница в 1 гол'
                                  : filter.scoreCondition === 'TOTAL_UNDER_2'
                                  ? 'ТМ 2.5'
                                  : filter.scoreCondition === 'TOTAL_OVER_2'
                                  ? 'ТБ 2.5'
                                  : 'Любой'}
                              </span>
                            </div>

                            {filter.minDangerousAttacksDiff && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Разница оп. атак:</span>
                                <span>≥ {filter.minDangerousAttacksDiff}</span>
                              </div>
                            )}
                            {filter.minTotalShots && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Всего ударов:</span>
                                <span>≥ {filter.minTotalShots}</span>
                              </div>
                            )}
                            {filter.minShotsOnTargetTotal && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Удары в створ:</span>
                                <span>≥ {filter.minShotsOnTargetTotal}</span>
                              </div>
                            )}
                            {filter.minTotalCorners && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Всего угловых:</span>
                                <span>≥ {filter.minTotalCorners}</span>
                              </div>
                            )}
                            {filter.minPressureIndex && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Индекс давления:</span>
                                <span className="text-rose-400 font-bold">≥ {filter.minPressureIndex}%</span>
                              </div>
                            )}
                            {filter.minXgTotal && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Суммарный xG:</span>
                                <span>≥ {filter.minXgTotal}</span>
                              </div>
                            )}
                            {filter.minAttacksDiff && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Разница атак:</span>
                                <span>≥ {filter.minAttacksDiff}</span>
                              </div>
                            )}
                            {filter.minShotsDiff && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Разница ударов:</span>
                                <span>≥ {filter.minShotsDiff}</span>
                              </div>
                            )}
                            {filter.maxOddsFavorite && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Кэф фаворита:</span>
                                <span className="text-emerald-400 font-bold">≤ {filter.maxOddsFavorite.toFixed(2)}</span>
                              </div>
                            )}
                            {(filter.minOddsOver25 || filter.maxOddsOver25) && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Кэф ТБ 2.5:</span>
                                <span className="text-emerald-400">
                                  {filter.minOddsOver25 ? `${filter.minOddsOver25.toFixed(2)} – ` : '≤ '}
                                  {filter.maxOddsOver25 ? filter.maxOddsOver25.toFixed(2) : ''}
                                </span>
                              </div>
                            )}
                            {(filter.minOddsBtts || filter.maxOddsBtts) && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Кэф ОЗ:</span>
                                <span className="text-sky-400">
                                  {filter.minOddsBtts ? `${filter.minOddsBtts.toFixed(2)} – ` : '≤ '}
                                  {filter.maxOddsBtts ? filter.maxOddsBtts.toFixed(2) : ''}
                                </span>
                              </div>
                            )}
                            {filter.minModelIpt && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Модель IPT:</span>
                                <span className="text-amber-400 font-bold">&gt; {filter.minModelIpt}</span>
                              </div>
                            )}
                            {filter.excludeYouthAndWomen && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Лиги:</span>
                                <span className="text-purple-400">Без молодежек/женских</span>
                              </div>
                            )}
                            {filter.minOver25Streak && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Серия ТБ 2.5:</span>
                                <span className="text-purple-300 font-bold">≥ {filter.minOver25Streak} матчей</span>
                              </div>
                            )}
                            {filter.redCardCondition === 'NO_RED_CARDS' && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Составы:</span>
                                <span className="text-emerald-400">Строго 11 vs 11</span>
                              </div>
                            )}
                            {filter.redCardCondition === 'HAS_RED_CARD' && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Красная карточка:</span>
                                <span className="text-rose-400 font-bold">Обязательно (10 vs 11)</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Controls Footer */}
                        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                          {/* Telegram Switch */}
                          <div className="flex items-center gap-1.5">
                            <Send className="h-3.5 w-3.5 text-blue-400" />
                            <span className="text-slate-400">Telegram:</span>
                            <button
                              onClick={() =>
                                setFilters((prev) =>
                                  prev.map((f) => (f.id === filter.id ? { ...f, telegramEnabled: !f.telegramEnabled } : f))
                                )
                              }
                              className={`font-semibold ml-1 ${
                                filter.telegramEnabled ? 'text-emerald-400' : 'text-slate-500'
                              }`}
                            >
                              {filter.telegramEnabled ? 'ВКЛ' : 'ВЫКЛ'}
                            </button>
                          </div>

                          {/* Edit / Clone / Delete buttons */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingFilter(filter);
                                setIsFilterModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs flex items-center gap-1 border border-slate-700 hover:border-emerald-500/40 transition"
                              title="Настроить критерии фильтра"
                            >
                              <Sliders className="h-3 w-3 text-emerald-400" />
                              <span>Настроить</span>
                            </button>

                            <button
                              onClick={() => handleDuplicateFilter(filter)}
                              title="Дублировать фильтр"
                              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(`Удалить фильтр «${filter.name}»?`)) {
                                  handleDeleteFilter(filter.id);
                                }
                              }}
                              title="Удалить фильтр"
                              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* Tab 3: Signal Feed & Real-time Tracker */}
        {activeTab === 'signals' && (() => {
          const totalCount = signals.length;
          const winsCount = signals.filter((s) => s.outcome === 'WIN').length;
          const lossesCount = signals.filter((s) => s.outcome === 'LOSS').length;
          const pendingCount = signals.filter((s) => s.outcome === 'PENDING').length;
          const refundsCount = signals.filter((s) => s.outcome === 'REFUND').length;
          const resolvedCount = winsCount + lossesCount;
          const winRate = resolvedCount > 0 ? Number(((winsCount / resolvedCount) * 100).toFixed(1)) : 0;
          const totalProfit = signals.reduce((acc, s) => acc + (s.profit || 0), 0);
          const totalStaked = resolvedCount * 1000;
          const roi = totalStaked > 0 ? Number(((totalProfit / totalStaked) * 100).toFixed(1)) : 0;

          const filteredSignalsList = signals.filter((sig) => {
            const matchesOutcome =
              signalOutcomeFilter === 'ALL'
                ? true
                : sig.outcome === signalOutcomeFilter;
            const matchesSearch =
              !signalSearchQuery.trim() ||
              sig.matchName.toLowerCase().includes(signalSearchQuery.toLowerCase()) ||
              sig.ruleName.toLowerCase().includes(signalSearchQuery.toLowerCase()) ||
              sig.league.toLowerCase().includes(signalSearchQuery.toLowerCase());
            return matchesOutcome && matchesSearch;
          });

          return (
            <div className="space-y-6">
              {/* Header & KPI Summary */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Target className="h-5 w-5 text-emerald-400" />
                      Трекер проходимости сигналов (Live Win Rate & ROI)
                    </h2>
                    <p className="text-xs text-slate-400">
                      Учет результатов ставок, проходимость стратегий в реальном времени и экспорт отчетов
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportSignalsCsv}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                      Экспорт в CSV
                    </button>
                    {signals.length > 0 && (
                      <button
                        onClick={() => {
                          if (window.confirm('Очистить всю историю сигналов текущей сессии?')) {
                            setSignals([]);
                          }
                        }}
                        className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-rose-900 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Очистить
                      </button>
                    )}
                  </div>
                </div>

                {/* Tracker KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-[11px] text-slate-400">Проходимость (Win Rate)</div>
                    <div className="text-2xl font-bold font-mono mt-1 text-white">
                      <span
                        className={
                          winRate >= 65
                            ? 'text-emerald-400'
                            : winRate >= 50
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }
                      >
                        {winRate}%
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {winsCount} зашло / {lossesCount} не зашло
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-[11px] text-slate-400">Чистый профит (PnL)</div>
                    <div className="text-2xl font-bold font-mono mt-1">
                      <span className={totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {totalProfit >= 0 ? `+${totalProfit.toLocaleString('ru-RU')}` : totalProfit.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {totalProfit >= 0 ? '+' : ''}{(totalProfit / 1000).toFixed(2)} флетов (флет 1 000 ₽)
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-[11px] text-slate-400">Доходность (ROI)</div>
                    <div className="text-2xl font-bold font-mono mt-1">
                      <span className={roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {roi >= 0 ? `+${roi}%` : `${roi}%`}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Оборот: {(resolvedCount * 1000).toLocaleString('ru-RU')} ₽
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-[11px] text-slate-400">Всего сигналов</div>
                    <div className="text-2xl font-bold font-mono mt-1 text-white">
                      {totalCount}
                      <span className="text-xs font-normal text-slate-500 ml-1.5 font-sans">
                        ({pendingCount} в игре)
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {refundsCount > 0 ? `${refundsCount} возвратов • ` : ''}Авто-фиксация
                    </div>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <button
                      onClick={() => setSignalOutcomeFilter('ALL')}
                      className={`px-3 py-1 rounded-lg font-medium transition ${
                        signalOutcomeFilter === 'ALL'
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Все ({totalCount})
                    </button>
                    <button
                      onClick={() => setSignalOutcomeFilter('WIN')}
                      className={`px-3 py-1 rounded-lg font-medium transition ${
                        signalOutcomeFilter === 'WIN'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ✅ Зашли ({winsCount})
                    </button>
                    <button
                      onClick={() => setSignalOutcomeFilter('LOSS')}
                      className={`px-3 py-1 rounded-lg font-medium transition ${
                        signalOutcomeFilter === 'LOSS'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ❌ Не зашли ({lossesCount})
                    </button>
                    <button
                      onClick={() => setSignalOutcomeFilter('PENDING')}
                      className={`px-3 py-1 rounded-lg font-medium transition ${
                        signalOutcomeFilter === 'PENDING'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ⏳ В игре ({pendingCount})
                    </button>
                  </div>

                  <div className="relative min-w-[220px]">
                    <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Поиск по матчу или стратегии..."
                      value={signalSearchQuery}
                      onChange={(e) => setSignalSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Signals Cards Feed */}
              {filteredSignalsList.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center space-y-3">
                  <Bell className="h-8 w-8 text-slate-600 mx-auto" />
                  <p className="text-sm text-slate-400">Нет сигналов по выбранным критериям фильтра.</p>
                  <button
                    onClick={triggerTestSignal}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Сгенерировать сигнал
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSignalsList.map((sig) => (
                    <div
                      key={sig.id}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 space-y-3 transition"
                    >
                      {/* Top row: match minute, country, league, timestamp, telegram */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold font-mono">
                            {sig.minute}'
                          </span>
                          <span className="font-semibold text-white">
                            {sig.country} • {sig.league}
                          </span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            {sig.timestamp}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const foundMatch = matches.find((m) => m.id === sig.matchId || sig.matchName.includes(m.homeTeam)) || matches[0];
                              handleOpenAIAnalyst(foundMatch);
                            }}
                            className="px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold flex items-center gap-1 transition"
                            title="Открыть AI-анализ этого матча в один клик"
                          >
                            <Sparkles className="h-3 w-3 text-indigo-400" />
                            AI-Разбор
                          </button>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded flex items-center gap-1.5 font-medium border ${
                              sig.sentToTelegram
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            <Send className="h-3 w-3" />
                            {sig.telegramStatusText || (sig.sentToTelegram ? 'Отправлено в TG' : 'Локально')}
                          </span>
                        </div>
                      </div>

                      {/* Match title and market */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            <span>{sig.matchName}</span>
                            <span className="font-mono text-sky-400">({sig.score})</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                            <span className="text-slate-500">Стратегия:</span>
                            <span className="text-slate-300 font-medium">{sig.ruleName}</span>
                            {sig.marketSuggestion && (
                              <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[11px] font-medium">
                                🎯 {sig.marketSuggestion}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Interactive Outcome Marker */}
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-[10px] text-slate-500">Коэффициент:</div>
                            <div className="font-mono font-bold text-amber-300 text-sm">
                              {sig.odds?.toFixed(2) || '1.85'}
                            </div>
                          </div>

                          <div className="h-7 w-px bg-slate-800 mx-1" />

                          {/* Outcome Status Badge */}
                          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                            <button
                              type="button"
                              onClick={() => updateSignalOutcome(sig.id, 'WIN')}
                              title="Отметить как выигранную ставку"
                              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition ${
                                sig.outcome === 'WIN'
                                  ? 'bg-emerald-500 text-slate-950 shadow'
                                  : 'text-slate-400 hover:text-emerald-400'
                              }`}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Зашел
                            </button>
                            <button
                              type="button"
                              onClick={() => updateSignalOutcome(sig.id, 'LOSS')}
                              title="Отметить как проигранную ставку"
                              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition ${
                                sig.outcome === 'LOSS'
                                  ? 'bg-rose-500 text-white shadow'
                                  : 'text-slate-400 hover:text-rose-400'
                              }`}
                            >
                              <XCircle className="h-3 w-3" />
                              Минус
                            </button>
                            <button
                              type="button"
                              onClick={() => updateSignalOutcome(sig.id, 'REFUND')}
                              title="Возврат ставки (кэф 1.0)"
                              className={`px-2 py-1 rounded text-xs font-semibold transition ${
                                sig.outcome === 'REFUND'
                                  ? 'bg-slate-700 text-white'
                                  : 'text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              Возврат
                            </button>
                            <button
                              type="button"
                              onClick={() => updateSignalOutcome(sig.id, 'PENDING')}
                              title="Сбросить статус в ожидание"
                              className={`px-2 py-1 rounded text-xs font-semibold transition ${
                                sig.outcome === 'PENDING'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'text-slate-500 hover:text-amber-400'
                              }`}
                            >
                              В игре
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Profit and Resolution Note */}
                      <div className="flex items-center justify-between text-xs bg-slate-950/70 px-3 py-2 rounded-lg border border-slate-800/80">
                        <div className="text-slate-400">
                          {sig.resolutionNote ? (
                            <span>📌 {sig.resolutionNote}</span>
                          ) : sig.outcome === 'WIN' ? (
                            <span className="text-emerald-400">Ставка рассчитана как выигрышная</span>
                          ) : sig.outcome === 'LOSS' ? (
                            <span className="text-rose-400">Ставка не зашла</span>
                          ) : (
                            <span className="text-amber-400/80">Матч продолжается / ожидает расчета</span>
                          )}
                        </div>

                        <div className="font-mono font-bold text-xs flex items-center gap-2">
                          <span className="text-slate-500 font-sans font-normal text-[11px]">Результат:</span>
                          <span
                            className={
                              sig.profit && sig.profit > 0
                                ? 'text-emerald-400'
                                : sig.profit && sig.profit < 0
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }
                          >
                            {sig.profit !== undefined ? (
                              <>
                                {sig.profit > 0 ? `+${sig.profit}` : sig.profit} ₽ (
                                {sig.profit > 0 ? `+${(sig.profit / 1000).toFixed(2)}` : (sig.profit / 1000).toFixed(2)} фл.)
                              </>
                            ) : (
                              'В расчете...'
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Expandable message payload */}
                      <details className="text-xs group">
                        <summary className="cursor-pointer text-slate-500 hover:text-slate-400 select-none flex items-center gap-1 text-[11px]">
                          <span>Показать текст уведомления</span>
                        </summary>
                        <div className="mt-2 text-slate-400 font-mono bg-slate-950 p-3 rounded-lg whitespace-pre-line border border-slate-800/80">
                          {sig.message}
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Tab 4: Backtesting & ROI Laboratory */}
        {activeTab === 'backtest' && (
          <BacktestingView
            filters={filters}
            onSelectFilterToEdit={(rule) => {
              setEditingFilter(rule);
              setIsFilterModalOpen(true);
            }}
          />
        )}

        {/* Tab 5: Telegram Settings & Preview */}
        {activeTab === 'telegram' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Config & Controls (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Bot className="h-5 w-5 text-sky-400" />
                        Параметры Telegram бота
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Отправка оповещений в реальном времени при совпадении live-фильтров матчей
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {telegramStatus === 'connected' && telegramBotInfo ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>@{telegramBotInfo.username || 'Бот активен'}</span>
                        </div>
                      ) : telegramStatus === 'checking' ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Проверка токена...</span>
                        </div>
                      ) : telegramStatus === 'sending' ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
                          <Send className="h-3.5 w-3.5 animate-pulse" />
                          <span>Отправка в TG...</span>
                        </div>
                      ) : telegramStatus === 'error' ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Ошибка связи</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs">
                          <span>Не подключен</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-4 pt-1">
                    {/* Bot Token Input */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Key className="h-3.5 w-3.5 text-slate-400" />
                          Bot Token (от @BotFather)
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowToken(!showToken)}
                          className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
                        >
                          {showToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          {showToken ? 'Скрыть' : 'Показать'}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showToken ? 'text' : 'password'}
                          placeholder="Пример: 6892401248:AAF9j3-xLpQ..."
                          value={telegramConfig.botToken}
                          onChange={(e) => setTelegramConfig({ ...telegramConfig, botToken: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:border-sky-500 focus:outline-none placeholder:text-slate-600"
                        />
                      </div>
                    </div>

                    {/* Chat ID Input */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Hash className="h-3.5 w-3.5 text-slate-400" />
                          Chat ID или Юзернейм канала
                        </label>
                        <button
                          type="button"
                          onClick={detectChatId}
                          disabled={isDetectingChat || !telegramConfig.botToken.trim()}
                          className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium disabled:opacity-40 transition"
                          title="Определить ID чата по входящим сообщениям боту"
                        >
                          <Sparkles className={`h-3 w-3 ${isDetectingChat ? 'animate-spin' : ''}`} />
                          {isDetectingChat ? 'Поиск сообщений...' : 'Определить мой Chat ID'}
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Личный ID (12345678) или канал (@channel_name)"
                          value={telegramConfig.channelId}
                          onChange={(e) => setTelegramConfig({ ...telegramConfig, channelId: e.target.value })}
                          className={`w-full bg-slate-950 border rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none placeholder:text-slate-600 ${
                            isEnteringBotItself
                              ? 'border-amber-500 focus:border-amber-400'
                              : 'border-slate-800 focus:border-sky-500'
                          }`}
                        />
                      </div>

                      {/* Warning if user entered bot's own username */}
                      {isEnteringBotItself && (
                        <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs space-y-1.5">
                          <div className="font-bold flex items-center gap-1.5 text-amber-200">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                            Ошибка: Указан юзернейм самого бота (@{telegramBotInfo?.username})
                          </div>
                          <p className="text-[11px] text-amber-300/90 leading-relaxed">
                            Telegram API запрещает ботам отправлять сообщения самим себе (ошибка <i>«the bot can't send messages to the bot»</i>).
                          </p>
                          <div className="text-[11px] text-amber-200 pt-1 border-t border-amber-500/20">
                            <strong>Как исправить:</strong>
                            <div className="mt-1 space-y-1 text-amber-300/90">
                              <div>• <b>В личные сообщения:</b> напишите боту в Telegram <code className="bg-amber-950/80 px-1 py-0.5 rounded text-amber-200 font-mono">/start</code> и нажмите синюю кнопку <b>«Определить мой Chat ID»</b> выше.</div>
                              <div>• <b>В Telegram-канал:</b> укажите юзернейм канала (например <code className="bg-amber-950/80 px-1 py-0.5 rounded text-amber-200 font-mono">@my_channel</code>), сделав бота администратором с правом публикации.</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Detected Chats List */}
                      {showChatPicker && detectedChats.length > 0 && (
                        <div className="p-3 rounded-lg bg-slate-950 border border-sky-500/30 text-xs space-y-2 mt-2 shadow-lg">
                          <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold border-b border-slate-800 pb-1.5">
                            <span className="flex items-center gap-1.5 text-sky-400">
                              <MessageSquare className="h-3.5 w-3.5" />
                              Найденные чаты (нажмите, чтобы подставить):
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowChatPicker(false)}
                              className="text-slate-500 hover:text-slate-300 text-[10px]"
                            >
                              Закрыть ✕
                            </button>
                          </div>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {detectedChats.map((c) => (
                              <div
                                key={c.id}
                                onClick={() => {
                                  setTelegramConfig({ ...telegramConfig, channelId: String(c.id) });
                                  setShowChatPicker(false);
                                  setTelegramError(null);
                                }}
                                className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition ${
                                  String(telegramConfig.channelId) === String(c.id)
                                    ? 'bg-sky-500/20 border-sky-500 text-white'
                                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {c.type === 'private' ? (
                                    <div className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                                      <User className="h-3.5 w-3.5" />
                                    </div>
                                  ) : (
                                    <div className="p-1 rounded bg-sky-500/20 text-sky-400">
                                      <Hash className="h-3.5 w-3.5" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-semibold text-white text-xs">{c.title}</div>
                                    <div className="text-[10px] text-slate-400">
                                      {c.type === 'private' ? 'Личный диалог' : c.type} {c.username ? `@${c.username}` : ''}
                                    </div>
                                  </div>
                                </div>
                                <div className="font-mono text-xs font-semibold text-sky-300">ID: {c.id}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Toggles */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div
                        onClick={() => setTelegramConfig({ ...telegramConfig, autoSend: !telegramConfig.autoSend })}
                        className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition ${
                          telegramConfig.autoSend
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="text-xs font-medium">
                          <div className="font-semibold text-white">Автоотправка сигналов</div>
                          <div className="text-[11px] text-slate-400">При срабатывании фильтров</div>
                        </div>
                        <div
                          className={`w-9 h-5 rounded-full relative transition-colors ${
                            telegramConfig.autoSend ? 'bg-emerald-500' : 'bg-slate-700'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                              telegramConfig.autoSend ? 'left-4.5' : 'left-0.5'
                            }`}
                          />
                        </div>
                      </div>

                      <div
                        onClick={() => setTelegramConfig({ ...telegramConfig, silentMode: !telegramConfig.silentMode })}
                        className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition ${
                          telegramConfig.silentMode
                            ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="text-xs font-medium">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            {telegramConfig.silentMode ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                            Тихий режим
                          </div>
                          <div className="text-[11px] text-slate-400">Без звука на устройствах</div>
                        </div>
                        <div
                          className={`w-9 h-5 rounded-full relative transition-colors ${
                            telegramConfig.silentMode ? 'bg-blue-500' : 'bg-slate-700'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                              telegramConfig.silentMode ? 'left-4.5' : 'left-0.5'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Anti-Spam & Deduplication Filtering Section */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Shield className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                              Анти-спам фильтрация повторных сигналов
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-normal ${
                                telegramConfig.suppressDuplicates
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}>
                                {telegramConfig.suppressDuplicates ? 'Активен' : 'Отключен'}
                              </span>
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              Блокирует повторную отправку одних и тех же сигналов каждую минуту для текущего матча
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setTelegramConfig({ ...telegramConfig, suppressDuplicates: !telegramConfig.suppressDuplicates })}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                              telegramConfig.suppressDuplicates
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {telegramConfig.suppressDuplicates ? 'Включено' : 'Выключено'}
                          </button>
                          <button
                            type="button"
                            onClick={clearDeduplicationHistory}
                            title="Сбросить историю отправленных сигналов для повторного тестирования"
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Сбросить память
                          </button>
                        </div>
                      </div>

                      {telegramConfig.suppressDuplicates && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                            {/* Mode 1: 1 per match */}
                            <div
                              onClick={() => setTelegramConfig({ ...telegramConfig, deduplicationMode: 'once-per-match' })}
                              className={`p-3 rounded-lg border cursor-pointer transition ${
                                telegramConfig.deduplicationMode === 'once-per-match'
                                  ? 'bg-emerald-500/10 border-emerald-500/40 text-white shadow-sm'
                                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="font-semibold text-xs text-emerald-300 flex items-center gap-1.5">
                                  <Target className="h-3.5 w-3.5 text-emerald-400" />
                                  1 сигнал на матч
                                </div>
                                {telegramConfig.deduplicationMode === 'once-per-match' && (
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 leading-snug">
                                Фильтр срабатывает ровно 1 раз за матч. Полный запрет повторов в бот каждую минуту (Рекомендуется).
                              </p>
                            </div>

                            {/* Mode 2: Cooldown */}
                            <div
                              onClick={() => setTelegramConfig({ ...telegramConfig, deduplicationMode: 'cooldown' })}
                              className={`p-3 rounded-lg border cursor-pointer transition ${
                                telegramConfig.deduplicationMode === 'cooldown'
                                  ? 'bg-sky-500/10 border-sky-500/40 text-white shadow-sm'
                                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="font-semibold text-xs text-sky-300 flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 text-sky-400" />
                                  Кулдаун (пауза)
                                </div>
                                {telegramConfig.deduplicationMode === 'cooldown' && (
                                  <Check className="h-3.5 w-3.5 text-sky-400" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 leading-snug">
                                Повторный сигнал разрешён только через {telegramConfig.cooldownMinutes || 15} мин, если условия сохраняются.
                              </p>
                            </div>

                            {/* Mode 3: Score Change */}
                            <div
                              onClick={() => setTelegramConfig({ ...telegramConfig, deduplicationMode: 'score-change' })}
                              className={`p-3 rounded-lg border cursor-pointer transition ${
                                telegramConfig.deduplicationMode === 'score-change'
                                  ? 'bg-amber-500/10 border-amber-500/40 text-white shadow-sm'
                                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="font-semibold text-xs text-amber-300 flex items-center gap-1.5">
                                  <Activity className="h-3.5 w-3.5 text-amber-400" />
                                  При смене счёта
                                </div>
                                {telegramConfig.deduplicationMode === 'score-change' && (
                                  <Check className="h-3.5 w-3.5 text-amber-400" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 leading-snug">
                                Повторный сигнал отправляется только если в матче был забит гол и изменился счёт.
                              </p>
                            </div>
                          </div>

                          {/* Cooldown duration selector when cooldown mode is selected */}
                          {telegramConfig.deduplicationMode === 'cooldown' && (
                            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                              <span className="text-slate-400 font-medium">Интервал паузы между сигналами:</span>
                              <div className="flex items-center gap-1.5">
                                {[5, 10, 15, 20, 30].map((mins) => (
                                  <button
                                    key={mins}
                                    type="button"
                                    onClick={() => setTelegramConfig({ ...telegramConfig, cooldownMinutes: mins })}
                                    className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                                      telegramConfig.cooldownMinutes === mins
                                        ? 'bg-sky-600 text-white shadow'
                                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                                    }`}
                                  >
                                    {mins} мин
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Заблокировано спам-дубликатов:</span>
                          <span className="font-bold font-mono text-emerald-400">{telegramConfig.blockedDuplicatesCount || 0}</span>
                        </div>
                        <div className="text-slate-500">
                          Режим:{' '}
                          {telegramConfig.deduplicationMode === 'once-per-match'
                            ? '1 сигнал на матч'
                            : telegramConfig.deduplicationMode === 'cooldown'
                            ? `Пауза ${telegramConfig.cooldownMinutes} мин`
                            : 'Только при новом голе'}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => verifyTelegramBot()}
                        disabled={telegramStatus === 'checking'}
                        className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${telegramStatus === 'checking' ? 'animate-spin' : ''}`} />
                        Проверить статус бота
                      </button>

                      <button
                        type="button"
                        onClick={triggerTestSignal}
                        disabled={telegramStatus === 'sending' || !telegramConfig.botToken || !telegramConfig.channelId}
                        className="px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-sky-900/30"
                      >
                        <Send className={`h-3.5 w-3.5 ${telegramStatus === 'sending' ? 'animate-pulse' : ''}`} />
                        Отправить тестовый сигнал
                      </button>
                    </div>

                    {/* Error or Success notification */}
                    {telegramError && (
                      <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                        <div>
                          <div className="font-semibold text-rose-200">Ошибка взаимодействия с Telegram</div>
                          <div className="mt-0.5 text-[11px] text-rose-300/90">{telegramError}</div>
                        </div>
                      </div>
                    )}

                    {lastSentResult && (
                      <div
                        className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                          lastSentResult.ok
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        }`}
                      >
                        {lastSentResult.ok ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                        ) : (
                          <XCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                        )}
                        <div>
                          <div className="font-semibold">{lastSentResult.ok ? 'Успешная доставка' : 'Статус отправки'}</div>
                          <div className="text-[11px]">{lastSentResult.text} ({lastSentResult.time})</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Setup Guide */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Куда бот может отправлять сигналы?
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                    <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        Вариант 1: В ваши личные сообщения
                      </div>
                      <ol className="text-[11px] text-slate-400 space-y-1 list-decimal list-inside leading-relaxed">
                        <li>Откройте бота в Telegram: {telegramBotInfo?.username ? <strong className="text-white">@{telegramBotInfo.username}</strong> : 'по его юзернейму'}.</li>
                        <li>Нажмите кнопку <b>«Запустить» (/start)</b> или отправьте приветствие.</li>
                        <li>В этом приложении нажмите кнопку <span className="text-sky-300 font-semibold">«Определить мой Chat ID»</span> — ваш личный ID подставится сам!</li>
                      </ol>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="font-bold text-sky-400 flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5" />
                        Вариант 2: В Telegram-канал или группу
                      </div>
                      <ol className="text-[11px] text-slate-400 space-y-1 list-decimal list-inside leading-relaxed">
                        <li>Зайдите в настройки вашего канала или группы.</li>
                        <li>Добавьте бота в <b>Администраторы</b> с правом публикации сообщений.</li>
                        <li>В поле Chat ID укажите <code className="text-sky-300 font-mono">@имя_канала</code> (для открытого) или ID (например <code className="text-sky-300 font-mono">-100...</code>).</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Telegram Live Preview (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Radio className="h-4 w-4 text-emerald-400" />
                      Предпросмотр сигнала в Telegram
                    </h2>
                    <span className="text-[11px] font-mono text-slate-400">
                      Матч: {selectedMatch?.homeTeam}
                    </span>
                  </div>

                  {/* Telegram Client Simulation Card */}
                  <div className="bg-[#17212b] border border-[#242f3d] rounded-2xl p-4 text-slate-200 text-xs font-sans space-y-2.5 shadow-xl">
                    <div className="flex items-center justify-between border-b border-[#242f3d]/80 pb-2 text-[11px]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-sky-600 flex items-center justify-center text-[10px] font-bold text-white">
                          FM
                        </div>
                        <div>
                          <div className="font-semibold text-sky-400">
                            {telegramBotInfo?.first_name || 'Footbalmonitor Alert Bot'}
                          </div>
                          <div className="text-[9px] text-slate-400">
                            {telegramBotInfo?.username ? `@${telegramBotInfo.username}` : 'bot'}
                          </div>
                        </div>
                      </div>
                      <span className="text-slate-400 text-[10px] font-mono">
                        {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="space-y-2 text-slate-200 leading-relaxed font-sans text-xs">
                      <div>
                        ⚽ <span className="font-bold text-white">СИГНАЛ:</span> <span className="text-amber-300 font-semibold">Доминирование при ничьей 0:0</span>
                      </div>
                      <div>
                        🏆 <span className="font-bold text-slate-100">{selectedMatch?.countryCode} {selectedMatch?.country} | {selectedMatch?.league}</span>
                      </div>

                      <div className="bg-[#1f2b38] p-2.5 rounded-lg border border-[#2b3a4a] my-2">
                        <div className="text-sm font-bold text-emerald-400 flex items-center justify-between">
                          <span>{selectedMatch?.homeTeam} {selectedMatch?.score[0]} : {selectedMatch?.score[1]} {selectedMatch?.awayTeam}</span>
                          <span className="text-xs font-mono text-emerald-300">({selectedMatch?.minute}')</span>
                        </div>
                      </div>

                      <div className="space-y-1 text-slate-300 text-[11.5px]">
                        <div>
                          🔥 <strong>Опасные атаки:</strong> {selectedMatch?.stats.dangerousAttacks[0]} - {selectedMatch?.stats.dangerousAttacks[1]} <span className="text-emerald-400">(+{Math.abs((selectedMatch?.stats.dangerousAttacks[0] || 0) - (selectedMatch?.stats.dangerousAttacks[1] || 0))})</span>
                        </div>
                        <div>
                          🎯 <strong>Удары в створ:</strong> {selectedMatch?.stats.shotsOnTarget[0]} - {selectedMatch?.stats.shotsOnTarget[1]} (Всего: {(selectedMatch?.stats.shotsOnTarget[0] || 0) + (selectedMatch?.stats.shotsOnTarget[1] || 0) + (selectedMatch?.stats.shotsOffTarget[0] || 0) + (selectedMatch?.stats.shotsOffTarget[1] || 0)})
                        </div>
                        <div>
                          🚩 <strong>Угловые:</strong> {selectedMatch?.stats.corners[0]} - {selectedMatch?.stats.corners[1]}
                        </div>
                        <div>
                          📊 <strong>xG:</strong> {selectedMatch?.stats.xg[0].toFixed(2)} vs {selectedMatch?.stats.xg[1].toFixed(2)}
                        </div>
                        <div>
                          ⚡ <strong>Владение:</strong> {selectedMatch?.stats.possession[0]}% - {selectedMatch?.stats.possession[1]}%
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#242f3d]/80 text-[10px] text-slate-400 flex items-center justify-between">
                        <span>Источник: {selectedMatch?.source}</span>
                        <span className="italic">Footbalmonitor Live Engine</span>
                      </div>
                    </div>
                  </div>

                  {/* Telegram Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="text-slate-400 text-[11px]">Отправлено сигналов</div>
                      <div className="text-lg font-bold text-white font-mono mt-0.5">{telegramConfig.notificationsCount}</div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="text-slate-400 text-[11px]">Последняя активность</div>
                      <div className="text-xs font-semibold text-emerald-400 font-mono mt-1">
                        {telegramConfig.lastPing || 'Ожидание'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Builder & Editor Modal */}
        <FilterBuilderModal
          isOpen={isFilterModalOpen}
          initialFilter={editingFilter}
          liveMatches={matches}
          onClose={() => {
            setIsFilterModalOpen(false);
            setEditingFilter(null);
          }}
          onSave={(savedRule) => {
            handleSaveFilter(savedRule);
            setIsFilterModalOpen(false);
            setEditingFilter(null);
          }}
        />

        {/* AI Match Analyst in 1 Click Modal */}
        <AIAnalystModal
          isOpen={isAIModalOpen}
          match={aiTargetMatch || selectedMatch}
          pressureAnalysis={
            aiTargetMatch
              ? calculatePressureAnalysis(aiTargetMatch)
              : selectedMatch
              ? calculatePressureAnalysis(selectedMatch)
              : undefined
          }
          telegramConfig={telegramConfig}
          onClose={() => {
            setIsAIModalOpen(false);
            setAiTargetMatch(null);
          }}
          onSendTelegramMessage={async (textHtml) => {
            const res = await sendTelegramMessage(textHtml, false);
            return {
              ok: res.ok,
              messageId: res.messageId,
              error: res.error,
            };
          }}
        />

        {/* Data Sources & Real Match Feed Modal */}
        <DataSourcesModal
          isOpen={isDataSourcesModalOpen}
          onClose={() => setIsDataSourcesModalOpen(false)}
          config={dataSourceConfig}
          onUpdateConfig={(newConfig) => {
            setDataSourceConfig(newConfig);
            if (newConfig.activeSource !== dataSourceConfig.activeSource) {
              fetchLiveMatchesFromSource(newConfig.activeSource);
            }
          }}
          activeMatchesCount={matches.length}
          onRefreshMatches={async () => {
            await fetchLiveMatchesFromSource();
          }}
          isRefreshing={isRefreshingMatches}
          lastFetchedAt={lastFetchedAt}
        />

        {/* Real Match Live Tester & Scenario Lab */}
        <RealMatchTesterModal
          isOpen={isRealMatchTesterOpen}
          onClose={() => setIsRealMatchTesterOpen(false)}
          currentMatches={matches}
          filters={filters}
          onSendTelegramAlert={async (targetMatch, rule) => {
            const analysis = calculatePressureAnalysis(targetMatch);
            const msgHtml = formatExtendedTelegramAlert(targetMatch, rule, analysis);
            const res = await sendTelegramMessage(msgHtml, false);
            return {
              ok: res.ok,
              messageId: res.messageId,
              error: res.error,
            };
          }}
          onOpenAIAnalyst={(targetMatch) => {
            setIsRealMatchTesterOpen(false);
            handleOpenAIAnalyst(targetMatch);
          }}
          onAddMatchToLive={(newMatch) => {
            handleAddMatchToLive(newMatch);
          }}
        />
      </div>
    </div>
  );
}
