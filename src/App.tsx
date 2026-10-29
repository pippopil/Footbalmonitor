import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  Award,
  Flame,
  Zap,
  Search,
  Plus,
  Trash2,
  Clock,
  Target,
  Star,
  Radio,
  Share2,
  Filter,
  Flag,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
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
  PowerOff,
  SlidersHorizontal,
  TableProperties,
  LayoutGrid,
  Calendar,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Pin,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  Crown,
  GraduationCap,
  FileText,
  Lock,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Wallet,
  Trophy,
  BellRing,
  Smartphone,
  ArrowUpCircle,
} from 'lucide-react';
import {
  createCleanBlankFilter,
  isUserPaid,
  isUserDeveloper,
  cleanPresetTitle,
  getStrategyCardDisplayName,
  PRESET_STRATEGY_NUMBER_BY_ID,
} from './utils/filterDefaults';
import { isPwaStandalone } from './utils/pwaManager';
import { PwaSubscriptionPaywall } from './components/PwaSubscriptionPaywall';
import { PwaInstallModal } from './components/PwaInstallModal';
import { ProofOfWinModal, TOP_3_ALGORITHMS_WEEK } from './components/ProofOfWinModal';
import { ProofOfWinShareModal, ProofItem } from './components/ProofOfWinShareModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import {
  initTelegramWebApp,
  isRunningInTelegram,
  getTelegramUser,
  tgHaptic,
} from './utils/telegramWebApp';
import {
  playAlertSound,
  AlertSoundType,
  ALERT_SOUND_PROFILES,
} from './utils/audioAlerts';
import { exportSignalsToExcelCsv } from './utils/exportReports';

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
  UserProfile,
  TelegramBotProfile,
  AdBannerItem,
  OddsDropData,
  SportType,
} from './types';
import { EXPANDED_DEFAULT_FILTERS } from './data/defaultFilters';
import { DEFAULT_USERS } from './data/defaultUsers';
import { DEFAULT_ADS } from './data/defaultAds';
import {
  calculatePressureAnalysis,
  evaluateFilterRule,
  formatExtendedTelegramAlert,
  formatResolvedTelegramAlert,
  evaluateSignalOutcome,
  getBetTypeForSignal,
  calculateMatchIPT,
  enrichMatchWithOddsTracker,
  calculateMatchOddsFlows,
  inferSportFromRule,
  inferSportFromMatch,
  getInitialStrategyMetric,
  resolveStrategyMetric,
  detectStrategyMetricCategory,
  getRealSignalOdds,
  normalizeCanonicalTeam,
  getCanonicalMatchKey,
  detectBetActionBadge,
  getStrategyTargetCluster,
  StrategyTargetCluster,
} from './algorithms';
import { FilterBuilderModal } from './components/FilterBuilderModal';
import { FilterBacktestModal } from './components/FilterBacktestModal';
import { BacktestingView } from './components/BacktestingView';
import { AIAnalystModal } from './components/AIAnalystModal';
import { DataSourcesModal } from './components/DataSourcesModal';
import { useLanguage } from './i18n/LanguageContext';
import { PersonalCabinetView } from './components/PersonalCabinetView';
import { AdvertiserCabinetView } from './components/AdvertiserCabinetView';
import { AdBanner } from './components/AdBanner';
import { getEstimatedOdds } from './backtestEngine';
import { saveMatchesToAccumulatedLiveDB, loadAccumulatedLiveMatches } from './services/liveMatchesDatabase';
import { ScannerMatrixFilterView } from './components/ScannerMatrixFilterView';
import { PrematchScannerView } from './components/PrematchScannerView';
import { AIStrategySynthesizerModal } from './components/AIStrategySynthesizerModal';
import { EducationGuideView } from './components/EducationGuideView';
import { StrategyMarketplaceModal } from './components/StrategyMarketplaceModal';
import { BankrollTrackerModal } from './components/BankrollTrackerModal';
import { SignalsBankrollProgressChart } from './components/SignalsBankrollProgressChart';
import { OddsMovementRadarModal } from './components/OddsMovementRadarModal';
import { MatchMomentumRadarModal } from './components/MatchMomentumRadarModal';
import { voiceAnnouncer } from './services/voiceAlertAnnouncer';
import { ScannerSignalsTableView } from './components/ScannerSignalsTableView';
import { StrategyAuditLogModal } from './components/StrategyAuditLogModal';
import { MatchXgTimelineChart } from './components/MatchXgTimelineChart';
import { logStrategyTrigger, logStrategyResolution } from './services/strategyAuditLogger';
import { runDailyPrematchAnalysis } from './services/prematchScheduler';
import { AppLogo } from './components/AppLogo';
import { AuthGateModal } from './components/AuthGateModal';
import { GodModeConsole } from './components/GodModeConsole';
import { fetchSofascoreFromBrowserRelay } from './services/browserRelay';
import { AppFooter } from './components/AppFooter';
import {
  initYandexMetrika,
  loadAndRegisterSiteVisit,
  saveSiteAnalytics,
  reachGoal,
} from './services/analyticsService';
import { SiteAnalyticsData } from './types';
import { SearchMatchCounterBadge } from './components/SearchMatchCounterBadge';
import { InAppUpdateModal } from './components/InAppUpdateModal';
import { checkAppUpdate, AppReleaseInfo } from './services/appUpdateService';
import { safeFetchJson } from './services/apiClient';
import { UserSimulationAgentModal } from './components/UserSimulationAgentModal';
import { isMatchSearchMatch, getMatchTeamCodes } from './utils/teamCodes';
import { generateMatchResultCanvas } from './utils/shareResultCanvas';
import { ShareResultModal } from './components/ShareResultModal';
import { OffensiveTrendSparkline } from './components/OffensiveTrendSparkline';

// Real signals start clean - no synthetic dummy seed alerts
const INITIAL_SIGNALS: SignalAlert[] = [];

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
    oddsDrop: {
      market: 'HOME',
      marketName: 'П1 (Arsenal)',
      initialOdds: 2.15,
      currentOdds: 1.65,
      dropPercent: 23.3,
      moneyVolumePercent: 79,
      moneyVolumeAmountEur: 184500,
      bookmaker: 'Betfair Exchange / Pinnacle',
      detectedAtMinute: 35,
    },
    marketFlows: [
      {
        market: 'HOME',
        marketName: 'П1 (Arsenal)',
        initialOdds: 2.15,
        currentOdds: 1.65,
        dropPercent: 23.3,
        moneyVolumePercent: 79,
        moneyVolumeAmountEur: 184500,
        bookmaker: 'Betfair Exchange',
        detectedAtMinute: 35,
      },
      {
        market: 'OVER',
        marketName: 'ТБ 2.5',
        initialOdds: 1.95,
        currentOdds: 1.62,
        dropPercent: 16.9,
        moneyVolumePercent: 71,
        moneyVolumeAmountEur: 92000,
        bookmaker: 'Pinnacle',
        detectedAtMinute: 20,
      },
    ],
    history: {
      homeConcededLastMatch: 2,
      awayConcededLastMatch: 2,
      homeLostLastMatch: true,
      awayLostLastMatch: true,
      homeLast5NoZeroZero: true,
      awayLast5NoZeroZero: true,
      homeOver25Streak: 5,
      awayOver25Streak: 4,
      homeOver25CountLast5: 5,
      awayOver25CountLast5: 4,
      firstHalfScore: [1, 1],
      noGoalsInSecondHalf: true,
      scoreUnchangedSinceMinute: 45,
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
    initialOdds: { home: 1.85, draw: 3.6, away: 4.8, over25: 1.85, under25: 1.95, btts: 1.85 },
    odds: { home: 1.44, draw: 3.8, away: 8.5, over25: 1.65, btts: 1.80 },
    oddsDrop: {
      market: 'HOME',
      marketName: 'П1 (Real Madrid)',
      initialOdds: 1.85,
      currentOdds: 1.44,
      dropPercent: 22.2,
      moneyVolumePercent: 82,
      moneyVolumeAmountEur: 215000,
      bookmaker: 'Betfair Exchange / Pinnacle',
      detectedAtMinute: 65,
    },
    marketFlows: [
      {
        market: 'HOME',
        marketName: 'П1 (Real Madrid)',
        initialOdds: 1.85,
        currentOdds: 1.44,
        dropPercent: 22.2,
        moneyVolumePercent: 82,
        moneyVolumeAmountEur: 215000,
        bookmaker: 'Betfair Exchange',
        detectedAtMinute: 65,
      },
    ],
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
    score: [2, 0],
    minute: 38,
    status: 'LIVE',
    source: 'SStats',
    stats: {
      possession: [56, 44],
      dangerousAttacks: [36, 32],
      attacks: [68, 61],
      shotsOnTarget: [4, 2],
      shotsOffTarget: [3, 2],
      corners: [4, 4],
      yellowCards: [2, 1],
      redCards: [0, 0],
      xg: [1.45, 0.72],
    },
    momentum: [15, 25, 10, -5, 15, 20],
    lastEvent: "38' Счёт 2:0 с 22-й мин. Аномальный прогруз биржи на ТБ 2.5 (-18.4%) без изменения счёта",
    initialOdds: { home: 2.10, draw: 3.40, away: 3.50, over25: 1.95, under25: 1.85, btts: 1.80 },
    odds: { home: 1.35, draw: 4.5, away: 9.0, over25: 1.58, under25: 2.35, btts: 1.70 },
    oddsDrop: {
      market: 'OVER',
      marketName: 'ТБ 2.5 (Flamengo vs Palmeiras)',
      initialOdds: 1.95,
      currentOdds: 1.58,
      dropPercent: 18.9,
      moneyVolumePercent: 78,
      moneyVolumeAmountEur: 195000,
      bookmaker: 'Betfair Exchange / Pinnacle',
      detectedAtMinute: 28,
    },
    marketFlows: [
      {
        market: 'OVER',
        marketName: 'ТБ 2.5',
        initialOdds: 1.95,
        currentOdds: 1.58,
        dropPercent: 18.9,
        moneyVolumePercent: 78,
        moneyVolumeAmountEur: 195000,
        bookmaker: 'Betfair Exchange',
        detectedAtMinute: 28,
      },
    ],
    history: {
      homeLast5NoZeroZero: true,
      awayLast5NoZeroZero: true,
      firstHalfScore: [2, 0],
      scoreUnchangedSinceMinute: 22,
      predictedIpt: 3.20,
    },
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
    oddsDrop: {
      market: 'HOME',
      marketName: 'П1 (Manchester City)',
      initialOdds: 1.45,
      currentOdds: 1.22,
      dropPercent: 15.8,
      moneyVolumePercent: 84,
      moneyVolumeAmountEur: 245000,
      bookmaker: 'Betfair Exchange / Pinnacle',
      detectedAtMinute: 11,
    },
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
    minute: 76,
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
    lastEvent: "75' Штурм ворот Cagliari: суммарный xG 1.92 при счёте 0:0, гол назревает",
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
    score: [0, 2],
    minute: 75,
    status: 'LIVE',
    source: 'Flashscore',
    stats: {
      possession: [55, 45],
      dangerousAttacks: [58, 48],
      attacks: [92, 82],
      shotsOnTarget: [6, 5],
      shotsOffTarget: [5, 3],
      corners: [6, 4],
      yellowCards: [3, 2],
      redCards: [0, 0],
      xg: [1.65, 1.40],
    },
    momentum: [25, -20, 35, 15, 40],
    lastEvent: "75' С 29-й мин без голов после 2 быстрых голов Спортинга в 1Т (21', 29')",
    odds: { home: 14.0, draw: 6.0, away: 1.22, over25: 1.95, btts: 2.20 },
    history: {
      guestScoredTwoQuickFirstHalf: true,
      twoQuickGoalsFirstHalf: true,
      goalsAtFirstHalfQuick: 2,
      noGoalsSinceQuickGoals: true,
      twoQuickGoalsMinute: 29,
      h2hOver15Pct: 85,
    },
  },
  {
    id: 'm-12',
    country: 'Spain',
    countryCode: '🇪🇸',
    league: 'La Liga',
    homeTeam: 'Barcelona',
    awayTeam: 'Getafe',
    score: [0, 0],
    minute: 0,
    status: 'PREMATCH',
    startTime: '21:00',
    startsInMinutes: 60, // Ровно 1 час до начала матча
    source: 'Sofascore',
    stats: {
      possession: [50, 50],
      dangerousAttacks: [0, 0],
      attacks: [0, 0],
      shotsOnTarget: [0, 0],
      shotsOffTarget: [0, 0],
      corners: [0, 0],
      yellowCards: [0, 0],
      redCards: [0, 0],
      xg: [0, 0],
    },
    momentum: [0, 0, 0, 0],
    lastEvent: "До матча: 1 час (21:00). Проведён предматчевый отбор за 60 мин до свистка",
    odds: {
      home: 1.18,
      draw: 7.50,
      away: 14.50,
      over25: 1.42,
      over35: 1.95,
      handicap1: 1.48,
      btts: 1.70,
    },
    history: {
      homeLast5NoZeroZero: true,
      awayLast5NoZeroZero: true,
      homeOver25Streak: 6,
      awayOver25Streak: 4,
      predictedIpt: 3.25,
      h2hOver15Pct: 90,
      prematchInsiderDropReason: 'Массовый прогруз на П1 Барселоны (-18.2%) за 60 мин до матча из-за травм 4 ключевых защитников Хетафе',
    },
    oddsDrop: {
      market: 'HOME',
      marketName: 'П1 (Barcelona)',
      initialOdds: 1.45,
      currentOdds: 1.18,
      dropPercent: 18.6,
      moneyVolumePercent: 88,
      moneyVolumeAmountEur: 380000,
      bookmaker: 'Betfair Exchange / Pinnacle',
      detectedAtMinute: 0,
    },
  },
  {
    id: 'm-13',
    country: 'Germany',
    countryCode: '🇩🇪',
    league: 'Bundesliga',
    homeTeam: 'Bayer Leverkusen',
    awayTeam: 'Stuttgart',
    score: [0, 0],
    minute: 0,
    status: 'PREMATCH',
    startTime: '18:30',
    startsInMinutes: 60, // Ровно 1 час до начала матча
    source: 'Flashscore',
    stats: {
      possession: [50, 50],
      dangerousAttacks: [0, 0],
      attacks: [0, 0],
      shotsOnTarget: [0, 0],
      shotsOffTarget: [0, 0],
      corners: [0, 0],
      yellowCards: [0, 0],
      redCards: [0, 0],
      xg: [0, 0],
    },
    momentum: [0, 0, 0, 0],
    lastEvent: "До матча: 60 мин (18:30). Линия 1.50–1.67, сигнал за час до старта",
    odds: {
      home: 1.88,
      draw: 3.85,
      away: 3.90,
      over25: 1.58,
      btts: 1.56,
    },
    history: {
      homeLast5NoZeroZero: true,
      awayLast5NoZeroZero: true,
      homeOver25Streak: 5,
      awayOver25Streak: 5,
      predictedIpt: 2.95,
      bothScoredLast5Count: 5,
      h2hOver15Pct: 95,
    },
  },
  {
    id: 'm-14',
    country: 'Italy',
    countryCode: '🇮🇹',
    league: 'Serie A',
    homeTeam: 'Milan',
    awayTeam: 'Roma',
    score: [0, 0],
    minute: 0,
    status: 'PREMATCH',
    startTime: '22:45',
    startsInMinutes: 180, // 3 часа до начала матча (будет ждать окна 1 часа)
    source: 'Flashscore',
    stats: {
      possession: [50, 50],
      dangerousAttacks: [0, 0],
      attacks: [0, 0],
      shotsOnTarget: [0, 0],
      shotsOffTarget: [0, 0],
      corners: [0, 0],
      yellowCards: [0, 0],
      redCards: [0, 0],
      xg: [0, 0],
    },
    momentum: [0, 0, 0, 0],
    lastEvent: "До матча: 3 часа (22:45). Анализ запустится строго за 1 час (60 мин) до начала",
    odds: {
      home: 2.10,
      draw: 3.40,
      away: 3.50,
      over25: 1.90,
      btts: 1.75,
    },
    history: {
      homeLast5NoZeroZero: true,
      awayLast5NoZeroZero: true,
      predictedIpt: 2.40,
      h2hOver15Pct: 75,
    },
  },
  {
    id: 'm-hockey-1',
    country: 'Russia',
    countryCode: '🇷🇺',
    league: 'KHL (КХЛ)',
    homeTeam: 'СКА Санкт-Петербург',
    awayTeam: 'ЦСКА Москва',
    score: [2, 3],
    minute: 56,
    status: 'LIVE',
    sport: 'hockey',
    source: 'Flashscore',
    stats: {
      possession: [54, 46],
      dangerousAttacks: [48, 38],
      attacks: [88, 72],
      shotsOnTarget: [28, 22],
      shotsOffTarget: [14, 10],
      corners: [0, 0],
      yellowCards: [0, 0],
      redCards: [0, 0],
      xg: [2.85, 3.10],
    },
    momentum: [10, 20, 40, -10, 30, 50, 70],
    lastEvent: "55' СКА снимает вратаря! Штурм в 6 полевых игроков",
    odds: {
      home: 2.80,
      draw: 4.10,
      away: 1.85,
      over25: 1.15,
      over35: 1.75,
    },
    history: {
      homeLast5NoZeroZero: true,
      awayLast5NoZeroZero: true,
      h2hOver15Pct: 90,
    },
  },
  {
    id: 'm-hockey-2',
    country: 'USA / Canada',
    countryCode: '🇺🇸',
    league: 'NHL (НХЛ)',
    homeTeam: 'Tampa Bay Lightning',
    awayTeam: 'Florida Panthers',
    score: [0, 0],
    minute: 0,
    status: 'PREMATCH',
    sport: 'hockey',
    startTime: 'Сегодня в 20:00',
    startsInMinutes: 60,
    source: 'Flashscore',
    stats: {
      possession: [50, 50],
      dangerousAttacks: [0, 0],
      attacks: [0, 0],
      shotsOnTarget: [0, 0],
      shotsOffTarget: [0, 0],
      corners: [0, 0],
      yellowCards: [0, 0],
      redCards: [0, 0],
      xg: [0, 0],
    },
    momentum: [0, 0, 0, 0],
    lastEvent: "До матча: 1 час (20:00). Линия прогружена на ТБ 5.5",
    odds: {
      home: 2.25,
      draw: 4.20,
      away: 2.50,
      over25: 1.78,
    },
    history: {
      homeLast5NoZeroZero: true,
      awayLast5NoZeroZero: true,
      h2hOver15Pct: 85,
      homeOver25CountLast5: 4,
      awayOver25CountLast5: 5,
    },
  },
  {
    id: 'm-basketball-1',
    country: 'Europe',
    countryCode: '🇪🇺',
    league: 'EuroLeague',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    score: [78, 82],
    minute: 38,
    status: 'LIVE',
    sport: 'basketball',
    source: 'Flashscore',
    stats: {
      possession: [51, 49],
      dangerousAttacks: [60, 62],
      attacks: [95, 98],
      shotsOnTarget: [34, 37],
      shotsOffTarget: [22, 19],
      corners: [0, 0],
      yellowCards: [0, 0],
      redCards: [0, 0],
      xg: [1.2, 1.3],
    },
    momentum: [15, -20, 30, 45, -15, 60],
    lastEvent: "38' 4-я четверть: тактические фолы, пробитие штрафных",
    odds: {
      home: 2.10,
      draw: 15.0,
      away: 1.75,
      over25: 1.85,
    },
    history: {
      h2hOver15Pct: 80,
    },
  },
  {
    id: 'm-tennis-1',
    country: 'ATP Tour',
    countryCode: '🎾',
    league: 'ATP Masters 1000',
    homeTeam: 'Carlos Alcaraz',
    awayTeam: 'Jannik Sinner',
    score: [1, 1],
    minute: 74,
    status: 'LIVE',
    sport: 'tennis',
    source: 'Flashscore',
    stats: {
      possession: [50, 50],
      dangerousAttacks: [24, 26],
      attacks: [45, 48],
      shotsOnTarget: [12, 14],
      shotsOffTarget: [8, 7],
      corners: [0, 0],
      yellowCards: [0, 0],
      redCards: [0, 0],
      xg: [1.1, 1.2],
    },
    momentum: [20, -10, 40, -30, 50],
    lastEvent: "Решающий 3-й сет: брейк-поинты у Алькараса",
    odds: {
      home: 1.85,
      draw: 25.0,
      away: 1.95,
      over25: 1.70,
    },
    history: {
      h2hOver15Pct: 85,
    },
  },
  {
    id: 'm-volleyball-1',
    country: 'Europe',
    countryCode: '🏐',
    league: 'Champions League',
    homeTeam: 'Zenit Kazan',
    awayTeam: 'Sir Safety Perugia',
    score: [23, 23],
    minute: 32,
    status: 'LIVE',
    sport: 'volleyball',
    source: 'Flashscore',
    stats: {
      possession: [50, 50],
      dangerousAttacks: [18, 18],
      attacks: [30, 30],
      shotsOnTarget: [14, 14],
      shotsOffTarget: [4, 4],
      corners: [0, 0],
      yellowCards: [1, 1],
      redCards: [0, 0],
      xg: [0, 0],
    },
    momentum: [10, -10, 20, -20, 10],
    lastEvent: "4-я партия: счёт 23:23, выход на баланс (ТБ 45.5)",
    odds: {
      home: 1.90,
      draw: 30.0,
      away: 1.90,
      over25: 1.80,
    },
    history: {
      h2hOver15Pct: 80,
    },
  },
  {
    id: 'm-table-tennis-1',
    country: 'International',
    countryCode: '🏓',
    league: 'WTT Champions',
    homeTeam: 'Fan Zhendong',
    awayTeam: 'Truls Möregårdh',
    score: [9, 9],
    minute: 24,
    status: 'LIVE',
    sport: 'table_tennis',
    source: 'Flashscore',
    stats: {
      possession: [52, 48],
      dangerousAttacks: [12, 10],
      attacks: [22, 20],
      shotsOnTarget: [15, 14],
      shotsOffTarget: [3, 2],
      corners: [0, 0],
      yellowCards: [0, 0],
      redCards: [0, 0],
      xg: [0, 0],
    },
    momentum: [15, -10, 25, -15, 10],
    lastEvent: "Решающий 5-й сет: счёт 9:9, выход на баланс партии",
    odds: {
      home: 1.75,
      draw: 40.0,
      away: 2.10,
      over25: 1.75,
    },
    history: {
      h2hOver15Pct: 90,
    },
  },
  {
    id: 'm-football-prematch-today',
    country: 'England',
    countryCode: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    league: 'Premier League',
    homeTeam: 'Manchester City',
    awayTeam: 'Liverpool',
    score: [0, 0],
    minute: 0,
    status: 'PREMATCH',
    sport: 'football',
    startTime: 'Сегодня в 19:30',
    startsInMinutes: 45,
    source: 'Flashscore',
    stats: {
      possession: [50, 50],
      dangerousAttacks: [0, 0],
      attacks: [0, 0],
      shotsOnTarget: [0, 0],
      shotsOffTarget: [0, 0],
      corners: [0, 0],
      yellowCards: [0, 0],
      redCards: [0, 0],
      xg: [0, 0],
    },
    momentum: [0, 0, 0, 0],
    lastEvent: "Сегодня в 19:30. Очные матчи: ТБ 2.5 в 4 из 5 (80%)",
    odds: {
      home: 1.85,
      draw: 3.80,
      away: 4.10,
      over25: 1.65,
    },
    history: {
      h2hOver15Pct: 80,
      homeOver25CountLast5: 4,
      awayOver25CountLast5: 4,
    },
  },
  {
    id: 'm-hockey-3',
    country: 'Россия',
    countryCode: '🇷🇺',
    league: 'КХЛ (Регулярный чемпионат)',
    homeTeam: 'ЦСКА Москва',
    awayTeam: 'СКА Санкт-Петербург',
    score: [2, 1],
    minute: 44,
    status: 'LIVE',
    sport: 'hockey',
    source: 'Fonbet',
    stats: {
      possession: [54, 46],
      dangerousAttacks: [24, 18],
      attacks: [42, 36],
      shotsOnTarget: [29, 23],
      shotsOffTarget: [12, 9],
      corners: [0, 0],
      yellowCards: [3, 4],
      redCards: [0, 0],
      xg: [2.14, 1.48],
    },
    momentum: [20, 35, 50, 40, -15, 45, 60],
    lastEvent: "44' 2-й период. Удаление у СКА (2 мин). Большинство ЦСКА",
    odds: { home: 1.82, draw: 4.10, away: 3.65, over25: 1.35, over45: 1.78, under45: 2.05 },
    oddsDrop: {
      market: 'HOME',
      marketName: 'П1 (ЦСКА)',
      initialOdds: 2.25,
      currentOdds: 1.82,
      dropPercent: 19.1,
      moneyVolumePercent: 74,
      moneyVolumeAmountEur: 112000,
      bookmaker: 'Фонбет / БК Лига Ставок',
      detectedAtMinute: 38,
    },
    history: {
      predictedIpt: 3.40,
      homeLast5NoZeroZero: true,
      awayLast5NoZeroZero: true,
    },
  },
  {
    id: 'm-hockey-4',
    country: 'США / Канада',
    countryCode: '🇺🇸',
    league: 'НХЛ (NHL Regular Season)',
    homeTeam: 'Washington Capitals',
    awayTeam: 'Pittsburgh Penguins',
    score: [3, 3],
    minute: 53,
    status: 'LIVE',
    sport: 'hockey',
    source: 'Flashscore',
    stats: {
      possession: [49, 51],
      dangerousAttacks: [31, 33],
      attacks: [52, 55],
      shotsOnTarget: [36, 38],
      shotsOffTarget: [14, 15],
      corners: [0, 0],
      yellowCards: [2, 2],
      redCards: [0, 0],
      xg: [3.45, 3.62],
    },
    momentum: [45, 55, -30, 60, 75, 80],
    lastEvent: "52' 3-й период. Гол Овечкина! Счёт 3:3, мощный штурм ворот",
    odds: { home: 2.45, draw: 3.90, away: 2.50, over25: 1.15, over55: 1.85, under55: 1.95 },
    history: {
      predictedIpt: 4.10,
    },
  },
  {
    id: 'm-bball-1',
    country: 'Россия',
    countryCode: '🇷🇺',
    league: 'Единая Лига ВТБ',
    homeTeam: 'ЦСКА',
    awayTeam: 'УНИКС Казань',
    score: [78, 74],
    minute: 35,
    status: 'LIVE',
    sport: 'basketball',
    source: 'Fonbet',
    stats: {
      possession: [52, 48],
      dangerousAttacks: [48, 44],
      attacks: [82, 79],
      shotsOnTarget: [28, 26],
      shotsOffTarget: [22, 20],
      corners: [0, 0],
      yellowCards: [14, 16],
      redCards: [0, 0],
      xg: [1.2, 1.1],
    },
    momentum: [15, 30, 20, 45, 55, 65],
    lastEvent: "35' 4-я четверть. Трёхочковый бросок ЦСКА! Перевес +4 очка",
    odds: { home: 1.45, draw: 14.0, away: 2.75, over25: 1.90 },
    history: {
      predictedIpt: 2.65,
    },
  },
  {
    id: 'm-bball-2',
    country: 'США',
    countryCode: '🇺🇸',
    league: 'NBA (National Basketball Association)',
    homeTeam: 'Boston Celtics',
    awayTeam: 'Los Angeles Lakers',
    score: [94, 88],
    minute: 38,
    status: 'LIVE',
    sport: 'basketball',
    source: 'Flashscore',
    stats: {
      possession: [53, 47],
      dangerousAttacks: [54, 49],
      attacks: [98, 92],
      shotsOnTarget: [34, 31],
      shotsOffTarget: [25, 23],
      corners: [0, 0],
      yellowCards: [12, 15],
      redCards: [0, 0],
      xg: [1.5, 1.3],
    },
    momentum: [40, 50, 60, 75, 80],
    lastEvent: "38' 4-я четверть. Прогруз на фору Celtics (-5.5) при темпе атак 112%",
    odds: { home: 1.32, draw: 15.0, away: 3.40, over25: 1.85 },
    oddsDrop: {
      market: 'HOME',
      marketName: 'П1 (Boston Celtics)',
      initialOdds: 1.65,
      currentOdds: 1.32,
      dropPercent: 20.0,
      moneyVolumePercent: 82,
      moneyVolumeAmountEur: 230000,
      bookmaker: 'Pinnacle / Betfair',
      detectedAtMinute: 32,
    },
    history: {
      predictedIpt: 2.80,
    },
  },
  {
    id: 'm-tennis-3',
    country: 'Международный',
    countryCode: '🌐',
    league: 'ATP Masters 1000',
    homeTeam: 'Даниил Медведев',
    awayTeam: 'Карлос Алькарас',
    score: [1, 1],
    minute: 85,
    status: 'LIVE',
    sport: 'tennis',
    source: 'Fonbet',
    stats: {
      possession: [50, 50],
      dangerousAttacks: [14, 16],
      attacks: [35, 38],
      shotsOnTarget: [8, 9],
      shotsOffTarget: [5, 4],
      corners: [0, 0],
      yellowCards: [0, 0],
      redCards: [0, 0],
      xg: [1.0, 1.0],
    },
    momentum: [20, -10, 30, 45, 60, 70],
    lastEvent: "85' 3-й сет (4:3). Брейк-поинт Медведева на подаче Алькараса",
    odds: { home: 2.10, draw: 1.0, away: 1.74, over25: 1.85 },
    history: {
      predictedIpt: 2.90,
    },
  },
  {
    id: 'm-tennis-2',
    country: 'Международный',
    countryCode: '🌐',
    league: 'WTA 1000',
    homeTeam: 'Арина Соболенко',
    awayTeam: 'Ига Свёнтек',
    score: [1, 0],
    minute: 55,
    status: 'LIVE',
    sport: 'tennis',
    source: 'Flashscore',
    stats: {
      possession: [51, 49],
      dangerousAttacks: [12, 10],
      attacks: [28, 25],
      shotsOnTarget: [7, 5],
      shotsOffTarget: [4, 3],
      corners: [0, 0],
      yellowCards: [0, 0],
      redCards: [0, 0],
      xg: [1.0, 1.0],
    },
    momentum: [35, 50, 65, 75],
    lastEvent: "55' 2-й сет (3:1). Эйс Соболенко, удержание первой подачи 84%",
    odds: { home: 1.48, draw: 1.0, away: 2.65, over25: 1.85 },
    history: {
      predictedIpt: 3.10,
    },
  },
  {
    id: 'm-vball-1',
    country: 'Россия',
    countryCode: '🇷🇺',
    league: 'Волейбол. Суперлига РФ',
    homeTeam: 'Зенит-Казань',
    awayTeam: 'Динамо Москва',
    score: [2, 1],
    minute: 65,
    status: 'LIVE',
    sport: 'volleyball',
    source: 'Fonbet',
    stats: {
      possession: [55, 45],
      dangerousAttacks: [28, 22],
      attacks: [62, 54],
      shotsOnTarget: [22, 18],
      shotsOffTarget: [8, 9],
      corners: [0, 0],
      yellowCards: [1, 2],
      redCards: [0, 0],
      xg: [1.0, 1.0],
    },
    momentum: [30, 45, 60, 70, 75],
    lastEvent: "65' 4-я партия (19:16). Блок Зенита, серия подач 4 очка подряд",
    odds: { home: 1.35, draw: 1.0, away: 3.15, over25: 1.80 },
    history: {
      predictedIpt: 2.85,
    },
  },
  {
    id: 'm-tt-1',
    country: 'Россия',
    countryCode: '🇷🇺',
    league: 'Настольный теннис. Лига Про РФ',
    homeTeam: 'Алексей Смирнов',
    awayTeam: 'Дмитрий Федоров',
    score: [2, 2],
    minute: 22,
    status: 'LIVE',
    sport: 'table_tennis',
    source: 'Fonbet',
    stats: {
      possession: [50, 50],
      dangerousAttacks: [18, 17],
      attacks: [34, 32],
      shotsOnTarget: [15, 14],
      shotsOffTarget: [5, 6],
      corners: [0, 0],
      yellowCards: [0, 0],
      redCards: [0, 0],
      xg: [1.0, 1.0],
    },
    momentum: [10, -15, 25, 40, 55],
    lastEvent: "22' Решающая 5-я партия (8:7). Топ-спин Смирнова по диагонали",
    odds: { home: 1.72, draw: 1.0, away: 2.05, over25: 1.85 },
    history: {
      predictedIpt: 2.70,
    },
  },
];

export default function App() {
  const { language, setLanguage, t } = useLanguage();
  const [matches, setMatches] = useState<Match[]>(() => {
    try {
      const savedConfig = localStorage.getItem('footbalmonitor_datasource_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (parsed.activeSource === 'simulated') {
          return INITIAL_MATCHES;
        }
      }
    } catch {}
    return [];
  });

  // Multi-user state management
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('footbalmonitor_users');
    let loadedUsers: UserProfile[] = DEFAULT_USERS;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedUsers = parsed;
        }
      } catch (e) {}
    }

    // CRITICAL: Ensure God Developer user is ALWAYS present in allUsers with role: 'god'
    const godTemplate = DEFAULT_USERS[0];
    const existingGodIdx = loadedUsers.findIndex(
      (u) =>
        u.role === 'god' ||
        u.id === 'user-god-developer' ||
        u.username === 'developer_god' ||
        String(u.username || '').toLowerCase().includes('god')
    );
    if (existingGodIdx === -1) {
      loadedUsers = [godTemplate, ...loadedUsers];
    } else {
      loadedUsers[existingGodIdx] = {
        ...godTemplate,
        ...loadedUsers[existingGodIdx],
        id: 'user-god-developer',
        username: 'developer_god',
        role: 'god',
        plan: 'GOD_MODE',
      };
    }

    // Sanitize any dummy mock tokens so they do not block real Telegram delivery
    return loadedUsers.map((u: UserProfile) => ({
      ...u,
      telegramBots: (u.telegramBots || []).map((b) => ({
        ...b,
        botToken:
          b.botToken &&
          (b.botToken.startsWith('7123456789') ||
            b.botToken.startsWith('7987654321') ||
            b.botToken.startsWith('7456123789') ||
            b.botToken.startsWith('7654321987') ||
            b.botToken.startsWith('7332211445'))
            ? ''
            : b.botToken,
        channelId:
          b.channelId &&
          (b.channelId.startsWith('-1001928374') ||
            b.channelId.startsWith('-1001999888') ||
            b.channelId.startsWith('-1001888777') ||
            b.channelId.startsWith('-1002000111') ||
            b.channelId.startsWith('-1002111333'))
            ? ''
            : b.channelId,
      })),
    }));
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem('footbalmonitor_current_user_id');
    if (saved) return saved;
    return DEFAULT_USERS[0].id;
  });

  // Authentication Gate state: User must log in to view the platform
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const authStatus = localStorage.getItem('footbalmonitor_authenticated');
    return authStatus === 'true';
  });

  // Dark / Light Theme switching state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('footbalmonitor_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    } catch {
      // ignore
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    }
    try {
      localStorage.setItem('footbalmonitor_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Mobile UX responsive states
  const [isMobileToolsDrawerOpen, setIsMobileToolsDrawerOpen] = useState<boolean>(false);
  const [mobileMatchViewMode, setMobileMatchViewMode] = useState<'list' | 'detail'>('list');

  const currentUser = useMemo(() => {
    const found = allUsers.find((u) => u.id === currentUserId);
    if (found) return found;
    const isGodId = currentUserId === 'user-god-developer' || currentUserId.toLowerCase().includes('god');
    if (isGodId) {
      return (
        allUsers.find(
          (u) =>
            u.role === 'god' ||
            u.id === 'user-god-developer' ||
            u.username === 'developer_god' ||
            String(u.username || '').toLowerCase().includes('god')
        ) || DEFAULT_USERS[0]
      );
    }
    return allUsers[0] || DEFAULT_USERS[0];
  }, [allUsers, currentUserId]);

  const isPaidUser = useMemo(() => isUserPaid(currentUser), [currentUser]);
  const isDeveloper = useMemo(() => isUserDeveloper(currentUser), [currentUser]);
  const [lockedPresetNotice, setLockedPresetNotice] = useState<FilterRule | null>(null);

  // Ads state with persistence
  const [ads, setAds] = useState<AdBannerItem[]>(() => {
    try {
      const saved = localStorage.getItem('footbalmonitor_ad_campaigns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_ADS;
  });

  const handleUpdateAds = (newAds: AdBannerItem[]) => {
    setAds(newAds);
    try {
      localStorage.setItem('footbalmonitor_ad_campaigns', JSON.stringify(newAds));
    } catch {}
  };

  const handleAdClick = useCallback((adId: string) => {
    setAds((prev) => {
      const target = prev.find((a) => a.id === adId);
      if (!target) return prev;
      const updated = prev.map((ad) => {
        if (ad.id === adId) {
          const currentClicks = ad.clicks || 0;
          const currentSpent = ad.spentRub || 0;
          const cpc = ad.cpcRub || 20;
          return {
            ...ad,
            clicks: currentClicks + 1,
            spentRub: currentSpent + cpc,
          };
        }
        return ad;
      });
      try {
        localStorage.setItem('footbalmonitor_ad_campaigns', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const handleAdImpression = useCallback((adId: string) => {
    setAds((prev) => {
      const target = prev.find((a) => a.id === adId);
      if (!target) return prev;
      const updated = prev.map((ad) => {
        if (ad.id === adId) {
          return {
            ...ad,
            impressions: (ad.impressions || 0) + 1,
          };
        }
        return ad;
      });
      try {
        localStorage.setItem('footbalmonitor_ad_campaigns', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const [dismissedTopBanner, setDismissedTopBanner] = useState<boolean>(false);
  const [dismissedLeftBanner, setDismissedLeftBanner] = useState<boolean>(false);
  const [dismissedRightBanner, setDismissedRightBanner] = useState<boolean>(false);

  const topAd = useMemo(() => {
    return (
      ads.find((a) => a.bannerType === 'top_billboard') ||
      ads.find((a) => a.bannerType === 'top_ribbon') ||
      ads[0]
    );
  }, [ads]);

  const leftAd = useMemo(() => {
    return (
      ads.find((a) => a.bannerType === 'skyscraper_left' || a.side === 'left') ||
      ads.find((a) => a.id === 'ad-skyscraper-left') ||
      ads[1] ||
      ads[0]
    );
  }, [ads]);

  const rightAd = useMemo(() => {
    return (
      ads.find((a) => a.bannerType === 'skyscraper_right' || a.side === 'right') ||
      ads.find((a) => a.id === 'ad-skyscraper-right') ||
      ads[2] ||
      ads[0]
    );
  }, [ads]);

  // Persistent filters isolated per user (Only run filters explicitly launched by the user)
  const [filters, setFilters] = useState<FilterRule[]>(() => {
    const uid = localStorage.getItem('footbalmonitor_current_user_id') || DEFAULT_USERS[0].id;
    const initialUser = DEFAULT_USERS.find((u) => u.id === uid) || DEFAULT_USERS[0];
    const isFree = initialUser.plan === 'FREE';
    const userSaved = localStorage.getItem(`footbalmonitor_filters_user_${uid}`);
    const migrationFlag = localStorage.getItem('footbalmonitor_user_launched_only_v2');

    if (userSaved) {
      try {
        const parsed = JSON.parse(userSaved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If user accidentally deleted all preset strategies, automatically restore system presets
          const hasPresets = parsed.some((p: FilterRule) => p.isPreset);
          const rawRules = hasPresets
            ? parsed
            : [...EXPANDED_DEFAULT_FILTERS, ...parsed.filter((p: FilterRule) => !p.isPreset)];

          if (isFree && uid !== 'user-god-developer' && !uid.includes('god')) {
            // For free accounts, show ONLY their own custom filters (starting from clean blank)
            const customOnly = rawRules.filter((p: FilterRule) => !p.isPreset);
            if (customOnly.length > 0) return customOnly;
            return [createCleanBlankFilter(uid)];
          }

          // Update strat-guest-two-quick to 75' rule if present
          const migratedSaved = rawRules.map((p: FilterRule) => {
            if (p.id === 'strat-guest-two-quick') {
              return {
                ...p,
                name: '⚡ Два быстрых гола в 1-м тайме (Сигнал 72-85\' без голов)',
                description: 'В 1-м тайме забито 2 быстрых гола подряд (разница ≤ 15 мин). Начиная с 72-75\' и до 85\' при отсутствии голов — сигнал на ТБ матча (поздний гол).',
                minMinute: 72,
                maxMinute: 85,
                scoreCondition: 'AWAY_LEAD' as const,
                minTotalGoals: 2,
                maxTotalGoals: 2,
                requireGuestTwoQuickGoals1H: true,
                requireNoGoalsSinceQuickGoals: true,
                targetMarket: 'ТБ матча (+1 гол после 75\')',
              };
            }
            if (p.id === 'strat-7') {
              return {
                ...p,
                name: '📐 Стратегия 7: Алгоритм на ТБ 2.5 (Сигнал на 70\' при непробитом ТБ 2.5)',
                description: 'Сигнал на 70-й минуте (70-75\'), когда в матче забито не более 2 голов (ТБ 2.5 ещё не пробит) при расчетном IPT > 2.70 или доматчевом кэфе ТБ 2.5 ≤ 1.90. Ставка на ТБ 2.5 / Поздний гол.',
                ruleType: 'LIVE' as const,
                minMinute: 70,
                maxMinute: 75,
                scoreCondition: 'TOTAL_UNDER_25' as const,
                maxTotalGoals: 2,
                minModelIpt: 2.70,
                maxOddsOver25: 1.90,
                targetMarket: 'Тотал больше 2.5 / Гол после 70-й мин',
              };
            }
            if (p.id === 'strat-smart-money-drop') {
              return {
                ...p,
                name: '📉 Прогруз линии / Smart Money: Падение кэфа ≥ 12% (Деньги ≥ 65%)',
                description: 'Отслеживание аномального прогруза денег крупными игроками (Steam Move): резкое падение коэффициента на исход от 12% при доле ставок от 65% всего пула рынка на бирже Betfair / Pinnacle.',
                minOddsDropPercent: 12,
                minMoneyVolumePercent: 65,
              };
            }
            if (p.id === 'strat-12') {
              return {
                ...p,
                name: '⏱️ Стратегия 12: Гол после перерыва (Серия ТБ 2.5 в 5/5 или 4/5)',
                description: 'Серия ТБ 2.5 пробивалась в 5 из 5 последних матчей команд вообще (допускается 4 из 5 для одной из двух команд). Сигнал приходит не раньше 65-й минуты матча, если во втором тайме ещё не был забит гол.',
                ruleType: 'LIVE' as const,
                minMinute: 65,
                maxMinute: 85,
                scoreCondition: 'ANY' as const,
                minOver25Streak: 5,
                requireOver25StreakAllowed4Of5: true,
                requireNoGoalsInSecondHalf: true,
                excludeYouthAndWomen: true,
                targetMarket: 'Гол во 2-м тайме / ТБ матча (+1 гол)',
              };
            }
            if (p.id === 'strat-over-steam') {
              return {
                ...p,
                name: '🔥 Аномальный прогруз ТБ 2.5 без изменения счёта',
                description: 'Слежение за падением кэфа без изменения счёта: например, счёт в 1-м тайме 2:0 и держится без голов, а рынок активно нагружает ТБ 2.5 с падением кэфа от 10% и объемом денег ≥65% без видимой смены обстановки.',
                ruleType: 'LIVE' as const,
                minMinute: 20,
                maxMinute: 85,
                scoreCondition: 'TOTAL_UNDER_25' as const,
                maxTotalGoals: 2,
                minOddsDropPercent: 10,
                minMoneyVolumePercent: 65,
                oddsDropMarket: 'OVER' as const,
                requireOddsDropWithoutScoreChange: true,
                targetMarket: 'Тотал больше 2.5 (ТБ) при прогрузе',
              };
            }
            return p;
          });

          // Sync updated preset parameters while preserving user state (enabled, botId, telegramEnabled)
          const syncedSaved = migratedSaved.map((p: FilterRule) => {
            const preset = EXPANDED_DEFAULT_FILTERS.find((dp) => dp.id === p.id);
            if (preset && (p.isPreset || preset.isPreset)) {
              return {
                ...preset,
                enabled: p.enabled,
                telegramEnabled: p.telegramEnabled,
                botId: p.botId,
                userId: p.userId ?? uid,
              };
            }
            return p;
          });

          // Merge in any newly added system preset strategies (e.g. strat-xg-deficit-75)
          const existingIds = new Set(syncedSaved.map((p: FilterRule) => p.id));
          const missingPresets = EXPANDED_DEFAULT_FILTERS.filter(
            (dp) => !existingIds.has(dp.id)
          ).map((dp) => ({
            ...dp,
            userId: uid,
            enabled: false,
            botId: DEFAULT_USERS[0].telegramBots.find((b) => b.isDefault)?.id,
          }));

          const combinedRaw = [...syncedSaved, ...missingPresets].map((f: FilterRule) => ({
            ...f,
            sport: (f.sport || inferSportFromRule(f) || 'football') as SportType,
          }));

          // Strict deduplication by ID: Never allow duplicate rule definitions in state!
          const dedupFiltersMap = new Map<string, FilterRule>();
          for (const f of combinedRaw) {
            if (!dedupFiltersMap.has(f.id)) {
              dedupFiltersMap.set(f.id, f);
            }
          }
          const combined = Array.from(dedupFiltersMap.values());

          if (!migrationFlag) {
            localStorage.setItem('footbalmonitor_user_launched_only_v2', 'true');
            // If previous session had massive bulk enabled, default to only filter #1 launched
            return combined.map((f: FilterRule, idx: number) => ({
              ...f,
              userId: uid,
              enabled: idx === 0,
            }));
          }
          return combined;
        }
      } catch (e) {}
    }

    localStorage.setItem('footbalmonitor_user_launched_only_v2', 'true');
    if (isFree && uid !== 'user-god-developer' && !uid.includes('god')) {
      return [createCleanBlankFilter(uid)];
    }
    return EXPANDED_DEFAULT_FILTERS.map((f, idx) => ({
      ...f,
      sport: (f.sport || inferSportFromRule(f) || 'football') as SportType,
      enabled: idx < 4 ? true : f.enabled !== false,
      userId: uid,
      botId: DEFAULT_USERS[0].telegramBots.find((b) => b.isDefault)?.id,
    }));
  });

  // Filter manager UI state
  const [activeFilterCategory, setActiveFilterCategory] = useState<FilterCategory>('all');
  const [filterSearchQuery, setFilterSearchQuery] = useState<string>('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [editingFilter, setEditingFilter] = useState<FilterRule | null>(null);
  const [backtestModalFilter, setBacktestModalFilter] = useState<FilterRule | null>(null);
  const [isBacktestModalOpen, setIsBacktestModalOpen] = useState<boolean>(false);
  const [isAISynthesizerOpen, setIsAISynthesizerOpen] = useState<boolean>(false);

  // Save users & current user id
  useEffect(() => {
    localStorage.setItem('footbalmonitor_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('footbalmonitor_current_user_id', currentUserId);
  }, [currentUserId]);

  // Save filters isolated to the active user
  useEffect(() => {
    if (currentUser?.id) {
      localStorage.setItem(`footbalmonitor_filters_user_${currentUser.id}`, JSON.stringify(filters));
    }
  }, [filters, currentUser?.id]);

  // Auto-recovery: if user accidentally deleted all filters or current filter list is empty,
  // immediately restore the full catalog of 50+ factory strategies so the user is never stuck
  useEffect(() => {
    if (filters.length === 0) {
      const defaultBot = currentUser?.telegramBots?.find((b) => b.isDefault) || currentUser?.telegramBots?.[0];
      const restored = EXPANDED_DEFAULT_FILTERS.map((f, idx) => ({
        ...f,
        userId: currentUser?.id || 'user-god-developer',
        botId: defaultBot?.id,
        enabled: idx < 4 ? true : f.enabled !== false,
        sport: (f.sport || inferSportFromRule(f) || 'football') as SportType,
      }));
      setFilters(restored);
      try {
        if (currentUser?.id) {
          localStorage.setItem(`footbalmonitor_filters_user_${currentUser.id}`, JSON.stringify(restored));
        }
        localStorage.setItem('footbalmonitor_filters', JSON.stringify(restored));
      } catch {}
    }
  }, [filters.length, currentUser?.id]);

  const [selectedMatchId, setSelectedMatchId] = useState<string>(() => {
    try {
      const savedConfig = localStorage.getItem('footbalmonitor_datasource_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (parsed.activeSource === 'simulated' && INITIAL_MATCHES.length > 0) {
          return INITIAL_MATCHES[0].id;
        }
      }
    } catch {}
    return '';
  });

  // Ensure selectedMatchId stays valid when matches array changes
  useEffect(() => {
    if (matches.length > 0) {
      if (!selectedMatchId || !matches.some((m) => m.id === selectedMatchId)) {
        setSelectedMatchId(matches[0].id);
      }
    }
  }, [matches, selectedMatchId]);

  const [inspectorOffset, setInspectorOffset] = useState<number>(0);
  const [inspectorAlignMode, setInspectorAlignMode] = useState<'opposite' | 'sticky' | 'top'>('opposite');
  const [isLargeScreen, setIsLargeScreen] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  const matchesGridRef = useRef<HTMLDivElement>(null);
  const inspectorRef = useRef<HTMLDivElement>(null);

  const [isMonitoringActive, setIsMonitoringActive] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'matches' | 'filters' | 'signals' | 'backtest' | 'telegram' | 'cabinet' | 'advertiser' | 'education'>('matches');
  const [filterViewMode, setFilterViewMode] = useState<'matrix' | 'cards' | 'prematch'>('matrix');
  const [selectedSport, setSelectedSport] = useState<SportType | 'all'>('football');
  const [signalsViewMode, setSignalsViewMode] = useState<'table' | 'cards'>('table');
  const [isStrategyAuditLogOpen, setIsStrategyAuditLogOpen] = useState<boolean>(false);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [matchQuickFilter, setMatchQuickFilter] = useState<'all' | 'live' | 'prematch' | 'over25' | 'odds_drop' | 'corners' | 'pressure'>('all');
  const [isShareResultModalOpen, setIsShareResultModalOpen] = useState<boolean>(false);
  const [shareResultMatch, setShareResultMatch] = useState<Match | null>(null);
  const [shareResultDataUrl, setShareResultDataUrl] = useState<string | null>(null);
  const [shareResultBlob, setShareResultBlob] = useState<Blob | null>(null);
  const [isGeneratingShareImage, setIsGeneratingShareImage] = useState<boolean>(false);

  // Window scroll listener for instant scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        setShowScrollTop(window.scrollY > 300);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Daily Prematch Analysis: Run once per day at startup or match refresh
  useEffect(() => {
    if (matches.length > 0 && filters.length > 0) {
      try {
        runDailyPrematchAnalysis(matches, filters);
      } catch {}
    }
  }, [matches.length, filters.length]);

  // Site Analytics & Yandex Metrika state
  const [analytics, setAnalytics] = useState<SiteAnalyticsData>(() => loadAndRegisterSiteVisit());

  // Initialize Yandex Metrika on startup
  useEffect(() => {
    if (analytics.yandexMetrikaCounterId) {
      initYandexMetrika(analytics.yandexMetrikaCounterId);
    }
  }, [analytics.yandexMetrikaCounterId]);

  // Redirect legacy telegram tab to personal cabinet
  useEffect(() => {
    if (activeTab === 'telegram') {
      setActiveTab('cabinet');
    }
  }, [activeTab]);
  
  // Persistent signals tracker state (Strictly genuine live signals, zero fake seeds, max 200)
  const [signals, setSignals] = useState<SignalAlert[]>(() => {
    const saved = localStorage.getItem('footbalmonitor_signals');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Remove any legacy synthetic seed alerts and keep max 200
          return parsed.filter((s: SignalAlert) => !s.id.startsWith('sig-seed-')).slice(0, 200);
        }
      } catch (e) {
        // fallback
      }
    }
    return [];
  });

  // Automatic cleanup of old signals in memory if count exceeds 200 (prevents storage quota & build crashes)
  useEffect(() => {
    if (signals.length > 200) {
      setSignals((prev) => (prev.length > 200 ? prev.slice(0, 200) : prev));
    }
  }, [signals.length]);

  // Save signals to localStorage safely (strictly capped to 200 with fail-safe quota recovery)
  useEffect(() => {
    const safeSlice = signals.slice(0, 200);
    try {
      localStorage.setItem('footbalmonitor_signals', JSON.stringify(safeSlice));
    } catch (e) {
      console.warn('Signals: local storage quota warning, auto-pruning to 100 to prevent crash');
      try {
        localStorage.setItem('footbalmonitor_signals', JSON.stringify(safeSlice.slice(0, 100)));
      } catch (err2) {
        console.error('Failed to save signals even after trimming', err2);
      }
    }
  }, [signals]);

  // Signal tracker UI filters
  const [signalOutcomeFilter, setSignalOutcomeFilter] = useState<'ALL' | 'WIN' | 'LOSS' | 'PENDING' | 'REFUND'>('ALL');
  const [signalSportFilter, setSignalSportFilter] = useState<SportType | 'all'>('all');
  const [signalSearchQuery, setSignalSearchQuery] = useState<string>('');

  // AI Match Analyst modal state
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
  const [aiTargetMatch, setAiTargetMatch] = useState<Match | null>(null);

  const handleOpenAIAnalyst = (targetMatch: Match) => {
    setAiTargetMatch(targetMatch);
    setIsAIModalOpen(true);
  };

  // Daily Telegram Report state
  const [sendingDailyReport, setSendingDailyReport] = useState<boolean>(false);
  const [dailyReportToast, setDailyReportToast] = useState<string | null>(null);

  // User Management & Cabinet Handlers
  const handleSelectUser = (newUser: UserProfile) => {
    // 1. Save current user's filters
    if (currentUser?.id) {
      localStorage.setItem(`footbalmonitor_filters_user_${currentUser.id}`, JSON.stringify(filters));
    }

    // Ensure selected user is in allUsers state
    setAllUsers((prev) => {
      const exists = prev.some((u) => u.id === newUser.id);
      if (!exists) {
        return [newUser, ...prev];
      }
      return prev.map((u) => (u.id === newUser.id ? { ...u, ...newUser } : u));
    });

    setCurrentUserId(newUser.id);
    localStorage.setItem('footbalmonitor_current_user_id', newUser.id);

    // If user has a default preferred data source, automatically switch activeSource to it
    if (newUser.defaultDataSource && newUser.defaultDataSource !== dataSourceConfig.activeSource) {
      setDataSourceConfig((prev) => {
        const updated = { ...prev, activeSource: newUser.defaultDataSource! };
        try {
          localStorage.setItem('footbalmonitor_datasource_config', JSON.stringify(updated));
        } catch {}
        return updated;
      });
      fetchLiveMatchesFromSource(newUser.defaultDataSource);
    }

    // 2. Load selected user's filters
    const isNewUserFree = newUser.plan === 'FREE';
    const userSaved = localStorage.getItem(`footbalmonitor_filters_user_${newUser.id}`);
    if (userSaved) {
      try {
        const parsed = JSON.parse(userSaved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasPresets = parsed.some((p: FilterRule) => p.isPreset);
          const rawRules = hasPresets
            ? parsed
            : [...EXPANDED_DEFAULT_FILTERS, ...parsed.filter((p: FilterRule) => !p.isPreset)];

          if (isNewUserFree && newUser.id !== 'user-god-developer' && !newUser.id.includes('god')) {
            // Free accounts only get their custom filters (starting from clean blank)
            const customOnly = rawRules.filter((p: FilterRule) => !p.isPreset);
            if (customOnly.length > 0) {
              setFilters(customOnly);
              return;
            }
            setFilters([createCleanBlankFilter(newUser.id)]);
            return;
          }

          const migrated = rawRules.map((p: FilterRule) => {
            if (p.id === 'strat-7') {
              return {
                ...p,
                name: '📐 Стратегия 7: Алгоритм на ТБ 2.5 (Сигнал на 70\' при непробитом ТБ 2.5)',
                description: 'Сигнал на 70-й минуте (70-75\'), когда в матче забито не более 2 голов (ТБ 2.5 ещё не пробит) при расчетном IPT > 2.70 или доматчевом кэфе ТБ 2.5 ≤ 1.90. Ставка на ТБ 2.5 / Поздний гол.',
                ruleType: 'LIVE' as const,
                minMinute: 70,
                maxMinute: 75,
                scoreCondition: 'TOTAL_UNDER_25' as const,
                maxTotalGoals: 2,
                minModelIpt: 2.70,
                maxOddsOver25: 1.90,
                targetMarket: 'Тотал больше 2.5 / Гол после 70-й мин',
              };
            }
            if (p.id === 'strat-smart-money-drop') {
              return {
                ...p,
                name: '📉 Прогруз линии / Smart Money: Падение кэфа ≥ 12% (Деньги ≥ 65%)',
                description: 'Отслеживание аномального прогруза денег крупными игроками (Steam Move): резкое падение коэффициента на исход от 12% при доле ставок от 65% всего пула рынка на бирже Betfair / Pinnacle.',
                minOddsDropPercent: 12,
                minMoneyVolumePercent: 65,
              };
            }
            return p;
          });
          setFilters(migrated);
          return;
        }
      } catch (e) {}
    }

    // Default filters for new user with default bot assignment
    if (isNewUserFree) {
      setFilters([createCleanBlankFilter(newUser.id)]);
      return;
    }

    const defaultBot = newUser.telegramBots.find((b) => b.isDefault) || newUser.telegramBots[0];
    const initialForUser = EXPANDED_DEFAULT_FILTERS.map((f) => ({
      ...f,
      userId: newUser.id,
      enabled: f.enabled !== false,
      botId: defaultBot?.id,
    }));
    setFilters(initialForUser);
  };

  const handleUpdateCurrentUser = (updated: UserProfile) => {
    setAllUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  const handleCreateUser = (newUser: UserProfile) => {
    setAllUsers((prev) => [...prev, newUser]);
    handleSelectUser(newUser);
  };

  const handleLogin = (user: UserProfile) => {
    handleSelectUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('footbalmonitor_authenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('footbalmonitor_authenticated');
  };

  const handleSendTestBotMessage = async (bot: TelegramBotProfile) => {
    if (!bot.botToken || !bot.channelId) {
      return { ok: false, error: 'Укажите Bot Token и Chat ID для проверки' };
    }
    const testText = `🤖 <b>Проверка связи с ботом FootbalMonitor Pro</b>\n\n` +
      `✅ Бот: <b>${bot.name}</b>\n` +
      `👤 Личный кабинет: <b>${currentUser.displayName}</b> (@${currentUser.username})\n` +
      `🕒 Время проверки: ${new Date().toLocaleTimeString('ru-RU')}\n` +
      `⚡ Статус: Бот успешно подключен и готов к привязке персональных фильтров!`;

    const res = await sendTelegramMessage(testText, true, {
      force: true,
      botToken: bot.botToken,
      chatId: bot.channelId,
    });
    return res;
  };

  // Ecosystem Modals state
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState<boolean>(false);
  const [isBankrollOpen, setIsBankrollOpen] = useState<boolean>(false);
  const [isOddsRadarOpen, setIsOddsRadarOpen] = useState<boolean>(false);
  const [isMomentumRadarOpen, setIsMomentumRadarOpen] = useState<boolean>(false);
  const [isVoiceAlertsEnabled, setIsVoiceAlertsEnabled] = useState<boolean>(() => voiceAnnouncer.isEnabled());
  const [isDataSourcesModalOpen, setIsDataSourcesModalOpen] = useState<boolean>(false);
  const [isProofOfWinOpen, setIsProofOfWinOpen] = useState<boolean>(false);
  const [isProofShareOpen, setIsProofShareOpen] = useState<boolean>(false);
  const [proofToShare, setProofToShare] = useState<ProofItem | null>(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [noviceSuccessToast, setNoviceSuccessToast] = useState<string | null>(null);

  // PWA standalone mode and installation modal states
  const [isInPwaStandalone, setIsInPwaStandalone] = useState<boolean>(() => isPwaStandalone());
  const [isPwaInstallModalOpen, setIsPwaInstallModalOpen] = useState<boolean>(false);

  // Web Push Notifications state
  const [isWebPushEnabled, setIsWebPushEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    return localStorage.getItem('sportsignal_web_push') === 'true' && Notification.permission === 'granted';
  });

  // Sound Profile state (Web Audio API: whistle, gong, bell, ping)
  const [alertSoundType, setAlertSoundType] = useState<AlertSoundType>(() => {
    try {
      const saved = localStorage.getItem('sportsignal_sound_type') as AlertSoundType;
      if (saved && ['whistle', 'gong', 'bell', 'ping'].includes(saved)) return saved;
    } catch {}
    return 'whistle';
  });

  const [isSoundSelectorOpen, setIsSoundSelectorOpen] = useState(false);

  // Telegram Mini App support & native haptics
  const isInTelegram = useMemo(() => isRunningInTelegram(), []);

  useEffect(() => {
    initTelegramWebApp();
  }, []);

  const triggerTgHaptic = useCallback((style: 'light' | 'medium' | 'heavy' = 'light') => {
    tgHaptic('impact', style);
  }, []);

  // Web Push Request & Test Handlers
  const handleToggleWebPush = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Ваш браузер не поддерживает Web Push уведомления.');
      return;
    }

    if (Notification.permission === 'granted') {
      const next = !isWebPushEnabled;
      setIsWebPushEnabled(next);
      localStorage.setItem('sportsignal_web_push', String(next));
      if (next) {
        new Notification('🔔 Web Push уведомления включены', {
          body: 'Теперь вы будете получать мгновенные пуши прямо в браузере при совпадении сигналов!',
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2310b981"><circle cx="12" cy="12" r="10"/></svg>',
        });
      }
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setIsWebPushEnabled(true);
        localStorage.setItem('sportsignal_web_push', 'true');
        new Notification('🔥 Web Push успешно подключен!', {
          body: 'Сигналы спортивного сканера будут приходить в браузер даже при свернутой вкладке.',
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2310b981"><circle cx="12" cy="12" r="10"/></svg>',
        });
      } else {
        alert('Разрешение на push-уведомления отклонено в настройках браузера.');
      }
    } catch (e) {
      console.error('Web Push error:', e);
    }
  };

  const handleTestWebPush = () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Уведомления не поддерживаются вашим устройством.');
      return;
    }
    if (Notification.permission !== 'granted') {
      handleToggleWebPush();
      return;
    }
    try {
      new Notification('🔥 Сигнал ТБ 2.5: Реал Мадрид vs Барселона (минута 68, кэф 1.95)!', {
        body: 'Штурм фаворита: ударов 14 (8 в створ), xG 2.45, навал в штрафной площади.',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2310b981"><circle cx="12" cy="12" r="10"/></svg>',
      });
      playAlertSound(alertSoundType, 0.35);
      triggerTgHaptic('medium');
    } catch (e) {
      alert('Не удалось отправить тестовый пуш. Проверьте разрешения браузера.');
    }
  };

  const triggerWebPushNotification = useCallback((title: string, body: string) => {
    if (!isWebPushEnabled || typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2310b981"><circle cx="12" cy="12" r="10"/></svg>',
        });
      } catch (err) {
        console.debug('Push notification trigger notice:', err);
      }
    }
  }, [isWebPushEnabled]);

  // Novice 1-Click: Enable TOP-3 Safe Strategies
  const handleActivateNoviceSafeTop3 = () => {
    triggerTgHaptic('heavy');
    playAlertSound('bell', 0.4);

    // Target top-3 safe strategies
    const targetSafeIds = ['f-1', 'f-4', 'f-2'];
    setFilters((prev) => {
      // Find matching or enable existing
      let hasTarget1 = false;
      let hasTarget2 = false;
      let hasTarget3 = false;

      const updated = prev.map((f) => {
        if (f.id === 'f-1' || f.name.includes('0:0') || f.name.includes('Доминирование')) {
          hasTarget1 = true;
          return { ...f, enabled: true };
        }
        if (f.id === 'f-4' || f.name.includes('1-м тайме') || f.name.includes('HT Over')) {
          hasTarget2 = true;
          return { ...f, enabled: true };
        }
        if (f.id === 'f-2' || f.name.includes('угловые') || f.name.includes('прессинг')) {
          hasTarget3 = true;
          return { ...f, enabled: true };
        }
        return f;
      });

      // If any of the 3 was not present in the user filters, pull from EXPANDED_DEFAULT_FILTERS
      const extras: FilterRule[] = [];
      if (!hasTarget1) {
        const found = EXPANDED_DEFAULT_FILTERS.find((df) => df.id === 'f-1');
        if (found) extras.push({ ...found, enabled: true });
      }
      if (!hasTarget2) {
        const found = EXPANDED_DEFAULT_FILTERS.find((df) => df.id === 'f-4');
        if (found) extras.push({ ...found, enabled: true });
      }
      if (!hasTarget3) {
        const found = EXPANDED_DEFAULT_FILTERS.find((df) => df.id === 'f-2');
        if (found) extras.push({ ...found, enabled: true });
      }

      return [...extras, ...updated];
    });

    setNoviceSuccessToast(
      '🚀 Активирован ТОП-3 безопасный набор для новичка: «Гол во 2Т», «HT Over 0.5 в 1Т» и «Шквал угловых»! Сканер запущен в live-работу.'
    );
    setTimeout(() => setNoviceSuccessToast(null), 6000);
  };

  const handleShareProof = (proof: ProofItem) => {
    setProofToShare(proof);
    setIsProofShareOpen(true);
  };

  // Telegram WebApp BackButton navigation sync
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tg = window.Telegram?.WebApp;
    if (!tg?.BackButton) return;

    const hasOpenModal =
      isFilterModalOpen ||
      isBacktestModalOpen ||
      isAISynthesizerOpen ||
      isMarketplaceOpen ||
      isBankrollOpen ||
      isOddsRadarOpen ||
      isProofOfWinOpen ||
      isProofShareOpen ||
      isLeaderboardOpen ||
      isDataSourcesModalOpen ||
      isAIModalOpen;

    if (hasOpenModal) {
      tg.BackButton.show();
      const handleTgBack = () => {
        setIsFilterModalOpen(false);
        setIsBacktestModalOpen(false);
        setIsAISynthesizerOpen(false);
        setIsMarketplaceOpen(false);
        setIsBankrollOpen(false);
        setIsOddsRadarOpen(false);
        setIsProofOfWinOpen(false);
        setIsProofShareOpen(false);
        setIsLeaderboardOpen(false);
        setIsDataSourcesModalOpen(false);
        setIsAIModalOpen(false);
      };
      tg.BackButton.onClick(handleTgBack);
      return () => {
        tg.BackButton.offClick(handleTgBack);
        tg.BackButton.hide();
      };
    } else {
      tg.BackButton.hide();
    }
  }, [
    isFilterModalOpen,
    isBacktestModalOpen,
    isAISynthesizerOpen,
    isMarketplaceOpen,
    isBankrollOpen,
    isOddsRadarOpen,
    isProofOfWinOpen,
    isProofShareOpen,
    isLeaderboardOpen,
    isDataSourcesModalOpen,
    isAIModalOpen,
  ]);

  // User Simulation Testing Agent modal state (sandboxed & non-intrusive)
  const [isSimulationAgentOpen, setIsSimulationAgentOpen] = useState<boolean>(false);

  // Rotating source pool for automatic 30-second failover when stats are not received
  const AUTO_FAILOVER_SOURCES: DataSourceType[] = useMemo(
    () => ['flashscore', 'fonbet', '1xbet', 'public-feed', 'sofascore', 'sstats'],
    []
  );
  const lastStatsReceivedTimestampRef = useRef<number>(Date.now());
  const latestKnownMatchesRef = useRef<Map<string, Match>>(new Map());

  // Data Sources configuration state
  const [isRefreshingMatches, setIsRefreshingMatches] = useState<boolean>(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const [dataSourceError, setDataSourceError] = useState<string | null>(null);
  const [dataSourceFallbackInfo, setDataSourceFallbackInfo] = useState<{
    fallbackUsed: boolean;
    requestedSource: string;
    actualSource: string;
    reason?: string;
  } | null>(null);

  const [dataSourceConfig, setDataSourceConfig] = useState<DataSourceConfig>(() => {
    const saved = localStorage.getItem('footbalmonitor_datasource_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const actSource = (parsed.activeSource && parsed.activeSource !== 'simulated')
            ? parsed.activeSource
            : 'flashscore';
          return {
            ...parsed,
            activeSource: actSource as DataSourceType,
            flashscore: parsed.flashscore || {
              enabled: true,
              includeOdds: true,
              maxMatches: 200,
            },
            sstats: parsed.sstats || {
              enabled: true,
              apiKey: '',
            },
            sofascore: parsed.sofascore || {
              enabled: true,
              useProxy: false,
            },
            theOddsApi: parsed.theOddsApi || {
              enabled: true,
              apiKey: '04a44aa5348608993b215482934717d6',
              sport: 'upcoming',
              regions: 'eu',
              markets: 'h2h,totals',
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
            autoRefresh: parsed.autoRefresh !== false,
            refreshIntervalSeconds: parsed.refreshIntervalSeconds || 25,
            autoFailover: parsed.autoFailover !== false,
          };
        }
      } catch (e) {}
    }
    return {
      activeSource: 'flashscore' as DataSourceType,
      flashscore: {
        enabled: true,
        includeOdds: true,
        maxMatches: 200,
      },
      sstats: {
        enabled: true,
        apiKey: '',
      },
      sofascore: {
        enabled: true,
        useProxy: false,
      },
      theOddsApi: {
        enabled: true,
        apiKey: '04a44aa5348608993b215482934717d6',
        sport: 'upcoming',
        regions: 'eu',
        markets: 'h2h,totals',
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
      refreshIntervalSeconds: 25,
      autoFailover: true,
    };
  });

  // Sound notifications state (Web Audio API alerts)
  const [isSoundAlertsEnabled, setIsSoundAlertsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('footbalmonitor_sound_alerts') !== 'false';
  });

  const toggleSoundAlerts = () => {
    setIsSoundAlertsEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('footbalmonitor_sound_alerts', String(next));
      } catch {}
      if (next) {
        // Confirmation test chime
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.25);
          }
        } catch {}
      }
      return next;
    });
  };

  // Tracked / Favorite Matches (отслеживание конкретных матчей по фильтрам)
  const [trackedMatchIds, setTrackedMatchIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('footbalmonitor_tracked_matches');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [filterTrackedOnly, setFilterTrackedOnly] = useState<boolean>(() => {
    try {
      return localStorage.getItem('footbalmonitor_filter_tracked_only') === 'true';
    } catch {
      return false;
    }
  });

  const toggleTrackMatch = (matchId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setTrackedMatchIds((prev) => {
      const isTracked = prev.includes(matchId);
      const next = isTracked ? prev.filter((id) => id !== matchId) : [...prev, matchId];
      try {
        localStorage.setItem('footbalmonitor_tracked_matches', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const toggleFilterTrackedOnly = () => {
    setFilterTrackedOnly((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('footbalmonitor_filter_tracked_only', String(next));
      } catch {}
      return next;
    });
  };

  // In-app updater states
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [availableUpdate, setAvailableUpdate] = useState<AppReleaseInfo | null>(null);

  // Auto-check for updates on launch
  useEffect(() => {
    checkAppUpdate().then((info) => {
      if (info && info.isNewer) {
        setAvailableUpdate(info);
      }
    });
  }, []);

  const playSignalSound = useCallback(() => {
    if (!isSoundAlertsEnabled) return;
    try {
      playAlertSound(alertSoundType, 0.35);
      triggerTgHaptic('medium');
    } catch {}
  }, [isSoundAlertsEnabled, alertSoundType, triggerTgHaptic]);

  // Save data source config to localStorage
  useEffect(() => {
    localStorage.setItem('footbalmonitor_datasource_config', JSON.stringify(dataSourceConfig));
  }, [dataSourceConfig]);

  // Fetch real matches from selected data source
  const fetchLiveMatchesFromSource = async (
    sourceType?: DataSourceType,
    sportOverride?: SportType | 'all'
  ) => {
    const src = sourceType || dataSourceConfig.activeSource;
    const targetSport = sportOverride !== undefined ? sportOverride : selectedSport;
    if (src === 'simulated') {
      setMatches(INITIAL_MATCHES);
      setLastFetchedAt(new Date().toLocaleTimeString('ru-RU'));
      return;
    }

    setIsRefreshingMatches(true);
    setDataSourceError(null);

    // Решение 2: Если выбран Sofascore и включен Браузерный Relay (без VPN и без блокировок Cloudflare)
    if (src === 'sofascore' && dataSourceConfig.sofascore?.browserRelayEnabled) {
      try {
        const relayResult = await fetchSofascoreFromBrowserRelay();
        if (relayResult.ok && relayResult.matches.length > 0) {
          setMatches((prev) => {
            const updated = relayResult.matches.map((newM: Match) => {
              const prevM = prev.find((m) => m.id === newM.id);
              return enrichMatchWithOddsTracker(newM, prevM);
            });
            let combinedPool: Match[];
            if (targetSport !== 'all') {
              const otherSports = prev.filter((m) => (m.sport || inferSportFromMatch(m)) !== targetSport);
              combinedPool = [...updated, ...otherSports];
            } else {
              combinedPool = updated;
            }
            const seen = new Set<string>();
            const deduped: Match[] = [];
            for (const m of combinedPool) {
              if (!seen.has(m.id)) {
                seen.add(m.id);
                deduped.push(m);
              }
            }
            try {
              saveMatchesToAccumulatedLiveDB(deduped);
            } catch {}
            return deduped;
          });
          if (!relayResult.matches.some((m: Match) => m.id === selectedMatchId)) {
            setSelectedMatchId(relayResult.matches[0].id);
          }
          setLastFetchedAt(new Date().toLocaleTimeString('ru-RU'));
          setDataSourceFallbackInfo(null);
          setIsRefreshingMatches(false);
          return;
        }
      } catch {
        // При неудаче браузерного relay продолжаем серверный опрос с автоматическим каскадным фоллбеком
      }
    }

    try {
      const nodeCodeMap: Record<string, string> = {
        flashscore: 'node_a',
        fonbet: 'node_b',
        '1xbet': 'node_c',
        'public-feed': 'node_d',
        sstats: 'node_e',
        sofascore: 'node_f',
      };

      // In stealth mode, do not expose provider names in query parameters
      let query = isDeveloper
        ? `?source=${src}&sport=${targetSport || 'all'}&nocache=1&dev=1`
        : `?src_code=${nodeCodeMap[src] || 'node_a'}&sport=${targetSport || 'all'}&nocache=1`;

      if (src === 'sstats' && dataSourceConfig.sstats?.apiKey) {
        query += `&sstats_key=${encodeURIComponent(dataSourceConfig.sstats.apiKey)}`;
      } else if (src === 'the-odds-api' && dataSourceConfig.theOddsApi?.apiKey) {
        query += `&odds_api_key=${encodeURIComponent(dataSourceConfig.theOddsApi.apiKey)}&odds_regions=${encodeURIComponent(dataSourceConfig.theOddsApi.regions || 'eu')}&odds_sport=${encodeURIComponent(dataSourceConfig.theOddsApi.sport || 'upcoming')}`;
      } else if (src === 'api-football' && dataSourceConfig.apiFootball?.apiKey) {
        query += `&api_key=${encodeURIComponent(dataSourceConfig.apiFootball.apiKey)}&provider=${dataSourceConfig.apiFootball.provider}&leagues=${encodeURIComponent(dataSourceConfig.apiFootball.leaguesFilter)}`;
      } else if (src === 'football-data' && dataSourceConfig.footballData?.apiToken) {
        query += `&football_data_token=${encodeURIComponent(dataSourceConfig.footballData.apiToken)}`;
      }

      // Query obfuscated telemetry endpoint
      const { ok, data, error: apiError } = await safeFetchJson<any>(`/api/telemetry/feed${query}`);
      if (ok && data && data.ok && Array.isArray(data.matches) && data.matches.length > 0) {
        // Record successful receipt of live statistics
        lastStatsReceivedTimestampRef.current = Date.now();

        setMatches((prev) => {
          const updated = data.matches.map((newM: Match) => {
            const prevM = prev.find((m) => m.id === newM.id);
            return enrichMatchWithOddsTracker(newM, prevM);
          });
          let combinedPool: Match[];
          if (targetSport !== 'all') {
            const otherSports = prev.filter((m) => !m.id.startsWith('m-') && (m.sport || inferSportFromMatch(m)) !== targetSport);
            combinedPool = [...updated, ...otherSports];
          } else {
            combinedPool = updated;
          }
          // Deduplicate incoming matches by id
          const seen = new Set<string>();
          const deduped: Match[] = [];
          for (const m of combinedPool) {
            if (!seen.has(m.id)) {
              seen.add(m.id);
              deduped.push(m);
            }
          }
          // Accumulate real live matches into database
          try {
            saveMatchesToAccumulatedLiveDB(deduped);
          } catch {}
          return deduped;
        });
        if (!data.matches.some((m: Match) => m.id === selectedMatchId)) {
          setSelectedMatchId(data.matches[0].id);
        }
        setLastFetchedAt(data.fetchedAt || new Date().toLocaleTimeString('ru-RU'));

        if (data.fallbackUsed && isDeveloper) {
          setDataSourceFallbackInfo({
            fallbackUsed: true,
            requestedSource: src,
            actualSource: data.actualSource || 'Резервный источник',
            reason: data.fallbackReason,
          });
        } else {
          setDataSourceFallbackInfo(null);
        }
      } else {
        // Check 30-second watchdog: if no statistics received in >30 seconds, auto-rotate source
        const elapsedSinceStats = Date.now() - lastStatsReceivedTimestampRef.current;
        if (elapsedSinceStats >= 30000 && dataSourceConfig.autoFailover) {
          const currIdx = AUTO_FAILOVER_SOURCES.indexOf(src);
          const nextSrc = AUTO_FAILOVER_SOURCES[(currIdx + 1) % AUTO_FAILOVER_SOURCES.length];
          console.warn(`[Auto-Failover 30s] Нет статистики из «${src}» уже ${Math.round(elapsedSinceStats / 1000)} сек. Автоматическое переключение на «${nextSrc}»`);
          setDataSourceConfig((prev) => ({ ...prev, activeSource: nextSrc }));
          lastStatsReceivedTimestampRef.current = Date.now();
          setTimeout(() => {
            fetchLiveMatchesFromSource(nextSrc, targetSport);
          }, 100);
        }

        if (data && data.matches && data.matches.length === 0) {
          setDataSourceError(`В потоке сейчас нет активных событий по критериям «${targetSport}».`);
        } else {
          setDataSourceError(isDeveloper ? (data?.error || apiError || 'Ошибка при получении матчей') : 'Синхронизация потока...');
        }
        setDataSourceFallbackInfo(null);
      }
    } catch (err: any) {
      const elapsedSinceStats = Date.now() - lastStatsReceivedTimestampRef.current;
      if (elapsedSinceStats >= 30000 && dataSourceConfig.autoFailover) {
        const currIdx = AUTO_FAILOVER_SOURCES.indexOf(src);
        const nextSrc = AUTO_FAILOVER_SOURCES[(currIdx + 1) % AUTO_FAILOVER_SOURCES.length];
        console.warn(`[Auto-Failover 30s] Ошибка соединения с «${src}». Автоматическое переключение на «${nextSrc}»`);
        setDataSourceConfig((prev) => ({ ...prev, activeSource: nextSrc }));
        lastStatsReceivedTimestampRef.current = Date.now();
        setTimeout(() => {
          fetchLiveMatchesFromSource(nextSrc, targetSport);
        }, 100);
      }
      setDataSourceError(isDeveloper ? `Сетевая ошибка: ${err?.message || err}` : 'Подключение к резервному узлу телеметрии...');
    } finally {
      setIsRefreshingMatches(false);
    }
  };

  const handleSelectSport = (sp: SportType | 'all') => {
    setSelectedSport(sp);
    fetchLiveMatchesFromSource(dataSourceConfig.activeSource, sp);
  };

  const handleManualSwitchDataSource = useCallback(
    async (source: DataSourceType) => {
      lastStatsReceivedTimestampRef.current = Date.now();
      setDataSourceConfig((prev) => {
        const updated = { ...prev, activeSource: source };
        try {
          localStorage.setItem('footbalmonitor_datasource_config', JSON.stringify(updated));
        } catch {
          // ignore storage error
        }
        return updated;
      });
      await fetchLiveMatchesFromSource(source, selectedSport);
      triggerTgHaptic('medium');
    },
    [selectedSport, triggerTgHaptic]
  );

  // Initial load of real matches across all sports
  useEffect(() => {
    if (dataSourceConfig.activeSource !== 'simulated') {
      fetchLiveMatchesFromSource(dataSourceConfig.activeSource, 'all');
    }
  }, [dataSourceConfig.activeSource]);

  // Periodic auto-refresh for real live matches across all sports
  useEffect(() => {
    if (dataSourceConfig.activeSource !== 'simulated' && dataSourceConfig.autoRefresh && isMonitoringActive) {
      const intervalMs = Math.max(15, dataSourceConfig.refreshIntervalSeconds || 25) * 1000;
      const timer = setInterval(() => {
        fetchLiveMatchesFromSource(dataSourceConfig.activeSource, 'all');
      }, intervalMs);
      return () => clearInterval(timer);
    }
  }, [dataSourceConfig.activeSource, dataSourceConfig.autoRefresh, dataSourceConfig.refreshIntervalSeconds, isMonitoringActive]);

  // Automatic source rotation watchdog: changes source every 30 seconds if statistics are not received
  useEffect(() => {
    if (!isMonitoringActive || !dataSourceConfig.autoFailover) return;
    const watchdogTimer = setInterval(() => {
      const elapsed = Date.now() - lastStatsReceivedTimestampRef.current;
      if (elapsed >= 30000) {
        setDataSourceConfig((prev) => {
          const currIdx = AUTO_FAILOVER_SOURCES.indexOf(prev.activeSource);
          const nextSrc = AUTO_FAILOVER_SOURCES[(currIdx + 1) % AUTO_FAILOVER_SOURCES.length];
          console.warn(`[Watchdog 30s] Статистика не поступала 30 секунд. Автоматическая ротация источника: ${prev.activeSource} ➔ ${nextSrc}`);
          lastStatsReceivedTimestampRef.current = Date.now();
          setTimeout(() => {
            fetchLiveMatchesFromSource(nextSrc, selectedSport);
          }, 50);
          return { ...prev, activeSource: nextSrc };
        });
      }
    }, 5000);
    return () => clearInterval(watchdogTimer);
  }, [isMonitoringActive, dataSourceConfig.autoFailover, selectedSport, AUTO_FAILOVER_SOURCES]);

  const handleAddMatchToLive = (newMatch: Match) => {
    setMatches((prev) => [newMatch, ...prev.filter((m) => m.id !== newMatch.id)]);
    setSelectedMatchId(newMatch.id);
  };

  // Update signal outcome (WIN, LOSS, REFUND, PENDING) with Telegram message rewrite
  const updateSignalOutcome = (signalId: string, outcome: SignalOutcome, oddsOverride?: number) => {
    setSignals((prev) => {
      const target = prev.find((s) => s.id === signalId);
      if (!target) return prev;

      const finalOdds = oddsOverride !== undefined ? oddsOverride : target.odds;
      const stake = target.stake || 1000;
      let profit: number | undefined = undefined;
      if (outcome === 'WIN') {
        profit = Number(((finalOdds - 1) * stake).toFixed(2));
      } else if (outcome === 'LOSS') {
        profit = -stake;
      } else if (outcome === 'REFUND') {
        profit = 0;
      }

      const match = matches.find((m) => m.id === target.matchId);
      const scoreToUse = target.finalScore || (match ? `${match.score[0]}:${match.score[1]}` : target.score);

      const finalStats = match?.stats
        ? {
            homeScore: match.score[0],
            awayScore: match.score[1],
            attacks: [match.stats.attacks[0], match.stats.attacks[1]] as [number, number],
            dangerousAttacks: [match.stats.dangerousAttacks[0], match.stats.dangerousAttacks[1]] as [number, number],
            shotsOnTarget: [match.stats.shotsOnTarget[0], match.stats.shotsOnTarget[1]] as [number, number],
            shotsOffTarget: [match.stats.shotsOffTarget[0], match.stats.shotsOffTarget[1]] as [number, number],
            corners: [match.stats.corners[0], match.stats.corners[1]] as [number, number],
            yellowCards: [match.stats.yellowCards[0], match.stats.yellowCards[1]] as [number, number],
            redCards: [match.stats.redCards[0], match.stats.redCards[1]] as [number, number],
            possession: [match.stats.possession[0], match.stats.possession[1]] as [number, number],
          }
        : target.finalStats;

      const scoreParts = scoreToUse.split(':').map((s) => parseInt(s.trim(), 10));
      const curScoreTuple: [number, number] = [
        isNaN(scoreParts[0]) ? 0 : scoreParts[0],
        isNaN(scoreParts[1]) ? 0 : scoreParts[1],
      ];
      const strategyMetricSnapshot = outcome !== 'PENDING'
        ? resolveStrategyMetric(target, curScoreTuple, finalStats)
        : target.strategyMetricSnapshot;

      const updatedSig: SignalAlert = {
        ...target,
        outcome,
        odds: finalOdds,
        profit,
        finalScore: scoreToUse,
        finalStats,
        strategyMetricSnapshot,
        resolvedAt: outcome !== 'PENDING' ? new Date().toLocaleTimeString('ru-RU') : undefined,
      };

      // Record final strategy resolution in audit log
      if (outcome !== 'PENDING') {
        try {
          logStrategyResolution(
            target.id,
            scoreToUse,
            finalStats,
            outcome,
            `Ручной/панельный расчет: ${outcome}`,
            profit
          );
        } catch {}
      }

      // Send result alert to Telegram and update original card
      if (
        target.sentToTelegram &&
        telegramConfig.autoUpdateOnFinish !== false &&
        outcome !== 'PENDING'
      ) {
        const resolvedHtml = formatResolvedTelegramAlert(
          updatedSig,
          scoreToUse,
          outcome,
          match
            ? {
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                league: match.league,
                country: match.country,
              }
            : undefined,
          finalStats
        );

        const botTokenToUse = target.botToken || telegramConfig.botToken;
        const chatIdToUse = target.chatId || telegramConfig.channelId;

        // 1. Edit original Telegram message card if messageId exists
        if (target.telegramMessageId) {
          editTelegramMessage(target.telegramMessageId, resolvedHtml, {
            botToken: botTokenToUse,
            chatId: chatIdToUse,
          }).catch(() => {});
        }

        // 2. Dispatch a fresh audible result notification alert to Telegram
        if (botTokenToUse && chatIdToUse) {
          sendTelegramMessage(resolvedHtml, false, {
            matchId: target.matchId,
            ruleId: target.ruleId,
            force: true,
            botToken: botTokenToUse,
            chatId: chatIdToUse,
            replyToMessageId: target.telegramMessageId,
          }).then((res) => {
            setSignals((curr) =>
              curr.map((s) =>
                s.id === signalId
                  ? {
                      ...s,
                      telegramEdited: true,
                      telegramEditedAt: new Date().toLocaleTimeString('ru-RU'),
                      telegramStatusText: `Результат доставлен в TG (${outcome === 'WIN' ? '✅ WIN' : '❌ LOSS'})`,
                    }
                  : s
              )
            );
          }).catch(() => {});
        }
      }

      return prev.map((s) => (s.id === signalId ? updatedSig : s));
    });
  };

  // Export signals to Excel / CSV with comprehensive financial bankroll metrics
  const handleExportSignalsCsv = () => {
    if (signals.length === 0) {
      alert('Список сигналов пуст. Дождитесь совпадения сигналов в реальном времени.');
      return;
    }
    triggerTgHaptic('light');
    exportSignalsToExcelCsv(signals, `sport_signals_history_${new Date().toISOString().slice(0, 10)}`);
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
          autoUpdateOnFinish: parsed.autoUpdateOnFinish ?? true,
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
      autoUpdateOnFinish: true,
    };
  });

  // Sent signals tracker to block duplicate alerts every minute
  const sentSignalsTrackerRef = useRef<Map<string, { lastSentAt: number; lastMinute: number; lastScore: string }>>((() => {
    const map = new Map<string, { lastSentAt: number; lastMinute: number; lastScore: string }>();
    try {
      const saved = localStorage.getItem('footbalmonitor_sent_signals_tracker');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach(([k, v]) => map.set(k, v));
        }
      }
    } catch (e) {
      // ignore
    }
    return map;
  })());
  const inFlightSendingRef = useRef<Set<string>>(new Set());

  // Keep tracker in sync with localStorage on updates
  const persistSentSignalsTracker = () => {
    try {
      localStorage.setItem(
        'footbalmonitor_sent_signals_tracker',
        JSON.stringify(Array.from(sentSignalsTrackerRef.current.entries()))
      );
    } catch (e) {
      // ignore
    }
  };

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

    const dropInfo = match.oddsDrop
      ? `📉 <b>Прогруз линии (Smart Money):</b> ${match.oddsDrop.marketName}\n` +
        `   • Падение кэфа: <b>-${match.oddsDrop.dropPercent}%</b> (${match.oddsDrop.initialOdds} ➔ ${match.oddsDrop.currentOdds})\n` +
        `   • Доля денег: <b>${match.oddsDrop.moneyVolumePercent}% пула</b>${match.oddsDrop.moneyVolumeAmountEur ? ` (≈ €${match.oddsDrop.moneyVolumeAmountEur.toLocaleString('ru-RU')})` : ''}\n` +
        `   • Биржа/Букмекер: <i>${match.oddsDrop.bookmaker || 'Betfair Exchange / Pinnacle'}</i>\n\n`
      : '';

    return `⚽ <b>СИГНАЛ ФИЛЬТРА: ${ruleName}</b>\n` +
      `🏆 <b>${match.countryCode} ${match.country} | ${match.league}</b>\n\n` +
      `⚔️ <b>${match.homeTeam} ${match.score[0]} : ${match.score[1]} ${match.awayTeam}</b> (<b>${match.minute}'</b>)\n\n` +
      dropInfo +
      `🔥 <b>Опасные атаки:</b> ${match.stats.dangerousAttacks[0]} - ${match.stats.dangerousAttacks[1]} [${dangSign}]\n` +
      `🎯 <b>Удары в створ:</b> ${match.stats.shotsOnTarget[0]} - ${match.stats.shotsOnTarget[1]} (Всего: ${totalShots})\n` +
      `🚩 <b>Угловые:</b> ${(match.stats?.corners?.[0] ?? 0)} - ${(match.stats?.corners?.[1] ?? 0)} (Всего: ${totalCorners})\n` +
      `📊 <b>xG:</b> ${match.stats?.xg ? `${(match.stats.xg[0] ?? 0).toFixed(2)} vs ${(match.stats.xg[1] ?? 0).toFixed(2)}` : 'н/д'}\n` +
      `⚡ <b>Владение мячом:</b> ${(match.stats?.possession?.[0] ?? 50)}% - ${(match.stats?.possession?.[1] ?? 50)}%\n\n` +
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
        // Synchronize default bot in allUsers
        setAllUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.id === currentUserId
              ? {
                  ...u,
                  telegramBots: (u.telegramBots || []).map((b) =>
                    b.isDefault
                      ? {
                          ...b,
                          botToken: token.trim(),
                          channelId: chat.trim(),
                          botUsername: data.bot.username ? `@${data.bot.username}` : b.botUsername,
                          status: 'verified' as const,
                          lastPing: new Date().toLocaleTimeString('ru-RU'),
                        }
                      : b
                  ),
                }
              : u
          )
        );
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

  const handleOpenShareResult = useCallback(async (matchToShare: Match) => {
    setIsGeneratingShareImage(true);
    triggerTgHaptic('light');
    try {
      const channelLabel = telegramBotInfo?.username
        ? `@${telegramBotInfo.username}`
        : telegramConfig.channelId?.startsWith('@')
        ? telegramConfig.channelId
        : 't.me/footbalmonitor';

      const { dataUrl, blob } = await generateMatchResultCanvas(matchToShare, {
        telegramChannel: channelLabel,
      });
      setShareResultMatch(matchToShare);
      setShareResultDataUrl(dataUrl);
      setShareResultBlob(blob);
      setIsShareResultModalOpen(true);
    } catch (err) {
      console.error('Error generating share result canvas:', err);
    } finally {
      setIsGeneratingShareImage(false);
    }
  }, [telegramBotInfo?.username, telegramConfig.channelId, triggerTgHaptic]);

  // Send message through backend API
  const sendTelegramMessage = async (
    text: string,
    isManualTest = false,
    options?: {
      matchId?: string;
      ruleId?: string;
      canonicalKey?: string;
      force?: boolean;
      botToken?: string;
      chatId?: string;
      replyToMessageId?: number;
    }
  ) => {
    const defaultBot = currentUser?.telegramBots?.find((b) => b.isDefault) || currentUser?.telegramBots?.[0];
    const token = (options?.botToken || telegramConfig.botToken || defaultBot?.botToken || '').trim();
    const chatId = (options?.chatId || telegramConfig.channelId || defaultBot?.channelId || '').trim();

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
          canonical_key: options?.canonicalKey,
          force: options?.force ?? isManualTest,
          dedup_mode: telegramConfig.deduplicationMode,
          cooldown_seconds: (telegramConfig.cooldownMinutes || 15) * 60,
          reply_to_message_id: options?.replyToMessageId,
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

  // Edit existing Telegram message via backend API (/api/telegram/edit)
  const editTelegramMessage = async (
    messageId: number,
    text: string,
    options?: { botToken?: string; chatId?: string }
  ): Promise<{ ok: boolean; error?: string }> => {
    const defaultBot = currentUser?.telegramBots?.find((b) => b.isDefault) || currentUser?.telegramBots?.[0];
    const token = (options?.botToken || telegramConfig.botToken || defaultBot?.botToken || '').trim();
    const chatId = (options?.chatId || telegramConfig.channelId || defaultBot?.channelId || '').trim();

    if (!token || !chatId) {
      return { ok: false, error: 'Заполните Bot Token и Chat ID' };
    }

    try {
      const res = await fetch('/api/telegram/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: messageId,
          text,
          chat_id: chatId,
          bot_token: token,
          parse_mode: telegramConfig.parseMode || 'HTML',
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        return { ok: true };
      } else {
        return { ok: false, error: data.error || 'Ошибка при редактировании сообщения' };
      }
    } catch (err: any) {
      return { ok: false, error: `Сетевая ошибка редактирования: ${err?.message || err}` };
    }
  };

  // Helper: extract all active configured Telegram bots for current user
  const getAllConfiguredBots = (): Array<{ id: string; name: string; botToken: string; channelId: string; isDefault?: boolean }> => {
    const list: Array<{ id: string; name: string; botToken: string; channelId: string; isDefault?: boolean }> = [];

    if (currentUser?.telegramBots && currentUser.telegramBots.length > 0) {
      currentUser.telegramBots.forEach((b) => {
        if (b.botToken && b.channelId && b.active !== false) {
          list.push({
            id: b.id,
            name: b.name || 'Telegram Bot',
            botToken: b.botToken.trim(),
            channelId: b.channelId.trim(),
            isDefault: b.isDefault,
          });
        }
      });
    }

    if (telegramConfig.botToken && telegramConfig.channelId) {
      const already = list.some(
        (b) => b.botToken === telegramConfig.botToken.trim() && b.channelId === telegramConfig.channelId.trim()
      );
      if (!already) {
        list.unshift({
          id: 'default',
          name: 'Основной бот',
          botToken: telegramConfig.botToken.trim(),
          channelId: telegramConfig.channelId.trim(),
          isDefault: true,
        });
      }
    }

    return list;
  };

  // Helper: get the EXACT real signals routed to a specific bot
  const getSignalsForSpecificBot = (bot: { id: string; botToken: string; channelId: string; isDefault?: boolean }) => {
    return signals.filter((sig) => {
      // 1. Explicit botId
      if (sig.botId && sig.botId === bot.id) return true;
      // 2. Direct token and chat match
      if (sig.botToken && sig.chatId && sig.botToken === bot.botToken && sig.chatId === bot.channelId) return true;
      // 3. Strategy assigned to this bot
      if (sig.ruleId) {
        const rule = filters.find((f) => f.id === sig.ruleId);
        if (rule?.botId === bot.id) return true;
        if (!rule?.botId && bot.isDefault) return true;
      }
      // 4. Default bot catches signals without a custom bot assignment
      if (bot.isDefault && (!sig.botId || sig.botId === 'default' || !sig.botToken)) return true;
      return false;
    });
  };

  const handleSendDailyReport = async (isAutoCron = false, specificBotId?: string) => {
    const configuredBots = getAllConfiguredBots();

    if (configuredBots.length === 0) {
      if (!isAutoCron) {
        setActiveTab('cabinet');
        alert('Пожалуйста, подключите вашего Telegram-бота в Личном кабинете.');
      }
      return;
    }

    const targetBots = specificBotId
      ? configuredBots.filter((b) => b.id === specificBotId)
      : configuredBots;

    setSendingDailyReport(true);
    try {
      const dateStr = new Date().toLocaleDateString('ru-RU');
      const botsPayload = targetBots.map((bot) => {
        const botSignals = getSignalsForSpecificBot(bot);
        return {
          bot_token: bot.botToken,
          chat_id: bot.channelId,
          bot_id: bot.id,
          bot_name: bot.name,
          signals: botSignals,
        };
      });

      const res = await fetch('/api/telegram/dispatch-daily-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bots: botsPayload,
          date_str: dateStr,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        const successCount = (data.results || []).filter((r: any) => r.ok).length;
        const msg = `✅ Суточный отчёт (23:59 МСК) отправлен в ${successCount} из ${targetBots.length} настроенных ботов! Отчёт сформирован строго из реальных сигналов каждого конкретного бота.`;
        setDailyReportToast(msg);
        setTimeout(() => setDailyReportToast(null), 6000);
      } else {
        if (!isAutoCron) {
          alert(`Ошибка отправки: ${data.error || 'Не удалось отправить отчёт'}`);
        }
      }
    } catch (e: any) {
      if (!isAutoCron) {
        alert(`Ошибка сети: ${e?.message || e}`);
      }
    } finally {
      setSendingDailyReport(false);
    }
  };

  // Automated 23:59 MSK Daily Report Scheduler (checks every 25 seconds)
  useEffect(() => {
    const checkMskDailyCron = () => {
      try {
        const now = new Date();
        // Calculate Moscow Time (UTC+3)
        const mskHours = (now.getUTCHours() + 3) % 24;
        const mskMinutes = now.getUTCMinutes();
        const mskDayKey = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
        const lastSentDay = localStorage.getItem('sportsignal_last_msk_daily_report_day');

        // Trigger at 23:59 MSK once per day
        if (mskHours === 23 && mskMinutes === 59 && lastSentDay !== mskDayKey) {
          localStorage.setItem('sportsignal_last_msk_daily_report_day', mskDayKey);
          console.log(`[Auto Cron 23:59 MSK] Dispatching daily reports to all configured bots for ${mskDayKey}`);
          handleSendDailyReport(true);
        }
      } catch (e) {
        console.warn('MSK Daily cron notice:', e);
      }
    };

    const cronInterval = setInterval(checkMskDailyCron, 25000);
    return () => clearInterval(cronInterval);
  }, [signals, filters, currentUser, telegramConfig]);

  // Rewrite Telegram message for a specific signal with outcome result
  const handleRewriteTelegramMessage = async (sig: SignalAlert, overrideOutcome?: SignalOutcome) => {
    if (!sig.telegramMessageId) {
      alert('У этого сигнала отсутствует Telegram Message ID для редактирования.');
      return;
    }

    const outcomeToUse = overrideOutcome || (sig.outcome === 'PENDING' ? 'WIN' : sig.outcome);
    const match = matches.find((m) => m.id === sig.matchId);
    const scoreToUse = sig.finalScore || (match ? `${match.score[0]}:${match.score[1]}` : sig.score);

    const stake = sig.stake || 1000;
    const profit =
      outcomeToUse === 'WIN'
        ? Number(((sig.odds - 1) * stake).toFixed(2))
        : outcomeToUse === 'LOSS'
        ? -stake
        : 0;

    const finalStats = match?.stats
      ? {
          homeScore: match.score[0],
          awayScore: match.score[1],
          attacks: [match.stats.attacks[0], match.stats.attacks[1]] as [number, number],
          dangerousAttacks: [match.stats.dangerousAttacks[0], match.stats.dangerousAttacks[1]] as [number, number],
          shotsOnTarget: [match.stats.shotsOnTarget[0], match.stats.shotsOnTarget[1]] as [number, number],
          shotsOffTarget: [match.stats.shotsOffTarget[0], match.stats.shotsOffTarget[1]] as [number, number],
          corners: [match.stats.corners[0], match.stats.corners[1]] as [number, number],
          yellowCards: [match.stats.yellowCards[0], match.stats.yellowCards[1]] as [number, number],
          redCards: [match.stats.redCards[0], match.stats.redCards[1]] as [number, number],
          possession: [match.stats.possession[0], match.stats.possession[1]] as [number, number],
        }
      : sig.finalStats;

    const scoreParts = scoreToUse.split(':').map((s) => parseInt(s.trim(), 10));
    const curScoreTuple: [number, number] = [
      isNaN(scoreParts[0]) ? 0 : scoreParts[0],
      isNaN(scoreParts[1]) ? 0 : scoreParts[1],
    ];
    const strategyMetricSnapshot = resolveStrategyMetric(sig, curScoreTuple, finalStats);

    const resolvedHtml = formatResolvedTelegramAlert(
      { ...sig, outcome: outcomeToUse, profit, finalStats, strategyMetricSnapshot },
      scoreToUse,
      outcomeToUse,
      match
        ? {
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            league: match.league,
            country: match.country,
          }
        : undefined,
      finalStats
    );

    const botTokenToUse = sig.botToken || telegramConfig.botToken;
    const chatIdToUse = sig.chatId || telegramConfig.channelId;

    const res = await editTelegramMessage(sig.telegramMessageId, resolvedHtml, {
      botToken: botTokenToUse,
      chatId: chatIdToUse,
    });
    if (res.ok) {
      setSignals((prev) =>
        prev.map((s) =>
          s.id === sig.id
            ? {
                ...s,
                outcome: outcomeToUse,
                profit,
                finalScore: scoreToUse,
                finalStats,
                strategyMetricSnapshot,
                telegramEdited: true,
                telegramEditedAt: new Date().toLocaleTimeString('ru-RU'),
                telegramStatusText: `Обновлено в TG (${outcomeToUse === 'WIN' ? '✅ WIN' : '❌ LOSS'})`,
              }
            : s
        )
      );
    } else {
      alert(`Не удалось переписать сообщение в Telegram: ${res.error}`);
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

          // Occasional goal during heavy pressure
          const homeScores = isHomePressuring && deltaShots > 0 && Math.random() > 0.92;
          const awayScores = !isHomePressuring && deltaShots > 0 && Math.random() > 0.94;
          const nextScore: [number, number] = [
            m.score[0] + (homeScores ? 1 : 0),
            m.score[1] + (awayScores ? 1 : 0),
          ];

          const updatedMatch: Match = {
            ...m,
            minute: nextMinute,
            status: nextMinute >= 90 ? 'FT' : m.status,
            score: nextScore,
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
          return enrichMatchWithOddsTracker(updatedMatch, m);
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [isMonitoringActive, dataSourceConfig.activeSource]);

  // Automated outcome evaluation and Telegram message rewriting on match completion or goal
  useEffect(() => {
    if (telegramConfig.autoUpdateOnFinish === false) return;

    // Keep memory cache of all seen matches updated
    matches.forEach((m) => latestKnownMatchesRef.current.set(m.id, m));

    const checkPendingSignals = () => {
      const histMatches = loadAccumulatedLiveMatches();

      signals.forEach((sig) => {
        if (sig.outcome !== 'PENDING') return;

        let match: Match | undefined = matches.find((m) => m.id === sig.matchId);
        let matchSourceType = 'live';

        if (!match) {
          match = latestKnownMatchesRef.current.get(sig.matchId);
          if (match) {
            matchSourceType = 'cached';
          } else {
            const foundHist = histMatches.find((h) => h.id === sig.matchId);
            if (foundHist) {
              const lastSnap = foundHist.snapshots[foundHist.snapshots.length - 1];
              match = {
                id: foundHist.id,
                homeTeam: foundHist.homeTeam,
                awayTeam: foundHist.awayTeam,
                league: foundHist.league,
                country: foundHist.country,
                countryCode: foundHist.countryCode,
                score: foundHist.finalScore,
                minute: lastSnap?.minute || 90,
                status: 'FT',
                stats: {
                  possession: lastSnap?.stats?.possession || [50, 50],
                  dangerousAttacks: lastSnap?.stats?.dangerousAttacks || [0, 0],
                  attacks: lastSnap?.stats?.attacks || [0, 0],
                  shotsOnTarget: lastSnap?.stats?.shotsOnTarget || [0, 0],
                  shotsOffTarget: lastSnap?.stats?.shotsOffTarget || [0, 0],
                  corners: foundHist.finalCorners || lastSnap?.stats?.corners || [0, 0],
                  yellowCards: foundHist.finalYellowCards || lastSnap?.stats?.yellowCards || [0, 0],
                  redCards: foundHist.finalRedCards || lastSnap?.stats?.redCards || [0, 0],
                  xg: lastSnap?.stats?.xg || [0, 0],
                },
                momentum: [],
                lastEvent: 'Матч завершён',
                odds: lastSnap?.odds ? {
                  home: lastSnap.odds.home || 2.0,
                  draw: lastSnap.odds.draw || 3.0,
                  away: lastSnap.odds.away || 2.0,
                  over25: lastSnap.odds.over25 || 1.85,
                } : { home: 2.0, draw: 3.0, away: 2.0, over25: 1.85 },
                source: 'Live Telemetry Core',
              };
              matchSourceType = 'accumulated_db';
            }
          }
        }

        if (!match) return;

        // Only genuine FT status or finished regulation time (>=92' for football, >=40' for basketball) marks a match as finished
        const isRegulationOver = match.sport === 'basketball' ? match.minute >= 40 : match.minute >= 92;
        const isFinished = match.status === 'FT' || (isRegulationOver && match.status !== 'LIVE');

        const evalRes = evaluateSignalOutcome(
          sig,
          match.score,
          isFinished,
          match.stats?.corners,
          match.stats,
          {
            matchStatus: isFinished ? 'FT' : match.status,
            minute: match.minute,
            firstHalfScore: match.history?.firstHalfScore,
          }
        );

        if (evalRes.shouldResolve) {
          // Record 1st-half score snapshot on match history if not yet recorded
          if ((match.status === 'HT' || match.minute >= 45) && !match.history?.firstHalfScore) {
            match.history = { ...match.history, firstHalfScore: [match.score[0], match.score[1]] };
          }

          const isHalfTimeRes = evalRes.note?.includes('1-й тайм') || evalRes.note?.includes('перерыв');
          const finalScoreStr = isHalfTimeRes && match.history?.firstHalfScore
            ? `${match.history.firstHalfScore[0]}:${match.history.firstHalfScore[1]}`
            : `${match.score[0]}:${match.score[1]}`;
          const stake = sig.stake || 1000;
          const profit =
            evalRes.outcome === 'WIN'
              ? Number(((sig.odds - 1) * stake).toFixed(2))
              : evalRes.outcome === 'LOSS'
              ? -stake
              : 0;

          const finalStats = {
            homeScore: match.score[0],
            awayScore: match.score[1],
            attacks: [match.stats.attacks[0], match.stats.attacks[1]] as [number, number],
            dangerousAttacks: [match.stats.dangerousAttacks[0], match.stats.dangerousAttacks[1]] as [number, number],
            shotsOnTarget: [match.stats.shotsOnTarget[0], match.stats.shotsOnTarget[1]] as [number, number],
            shotsOffTarget: [match.stats.shotsOffTarget[0], match.stats.shotsOffTarget[1]] as [number, number],
            corners: [match.stats.corners[0], match.stats.corners[1]] as [number, number],
            yellowCards: [match.stats.yellowCards[0], match.stats.yellowCards[1]] as [number, number],
            redCards: [match.stats.redCards[0], match.stats.redCards[1]] as [number, number],
            possession: [match.stats.possession[0], match.stats.possession[1]] as [number, number],
          };

          const scoreTuple: [number, number] = [match.score[0], match.score[1]];
          const strategyMetricSnapshot = resolveStrategyMetric(sig, scoreTuple, match.stats);

          // Audit Logging: Record final strategy results (goals, corners, cards) upon resolution
          try {
            logStrategyResolution(
              sig.id,
              finalScoreStr,
              finalStats,
              evalRes.outcome,
              evalRes.note,
              profit
            );
          } catch {}

          const updatedSignal: SignalAlert = {
            ...sig,
            outcome: evalRes.outcome,
            finalScore: finalScoreStr,
            profit,
            finalStats,
            strategyMetricSnapshot,
            resolvedAt: new Date().toLocaleTimeString('ru-RU'),
            resolutionNote: evalRes.note,
          };

          const botTokenToUse = sig.botToken || telegramConfig.botToken;
          const chatIdToUse = sig.chatId || telegramConfig.channelId;

          // Dispatch result to Telegram if signal was configured for Telegram
          if (sig.sentToTelegram && telegramConfig.autoSend && botTokenToUse && chatIdToUse) {
            const resolvedHtml = formatResolvedTelegramAlert(
              updatedSignal,
              finalScoreStr,
              evalRes.outcome,
              {
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                league: match.league,
                country: match.country,
              },
              match.stats
            );

            // 1. Edit original Telegram card if messageId exists
            if (sig.telegramMessageId) {
              editTelegramMessage(sig.telegramMessageId, resolvedHtml, {
                botToken: botTokenToUse,
                chatId: chatIdToUse,
              }).catch(() => {});
            }

            // 2. Dispatch a new result alert notification to Telegram (replies to original with sound/push)
            sendTelegramMessage(
              resolvedHtml,
              false,
              {
                matchId: sig.matchId,
                ruleId: sig.ruleId,
                force: true,
                botToken: botTokenToUse,
                chatId: chatIdToUse,
                replyToMessageId: sig.telegramMessageId,
              }
            ).then((res) => {
              setSignals((curr) =>
                curr.map((s) =>
                  s.id === sig.id
                    ? {
                        ...updatedSignal,
                        telegramEdited: true,
                        telegramEditedAt: new Date().toLocaleTimeString('ru-RU'),
                        telegramStatusText: `Результат доставлен в TG (${evalRes.outcome === 'WIN' ? '✅ WIN' : '❌ LOSS'})`,
                      }
                    : s
                )
              );
            }).catch(() => {});
          } else {
            setSignals((curr) => curr.map((s) => (s.id === sig.id ? updatedSignal : s)));
          }

          // In-app notifications: Web Push & Audio
          triggerWebPushNotification(
            `${evalRes.outcome === 'WIN' ? '✅ СИГНАЛ ЗАШЁЛ (WIN)' : '❌ СИГНАЛ НЕ ЗАШЁЛ'}: ${match.homeTeam} vs ${match.awayTeam}`,
            `Счёт: ${finalScoreStr}. Исход: ${evalRes.note || evalRes.outcome}`
          );
          if (evalRes.outcome === 'WIN') {
            playAlertSound('ping', 0.35);
          }

          // Update accumulated DB with match final score
          try {
            saveMatchesToAccumulatedLiveDB([match]);
          } catch {}
        }
      });
    };

    checkPendingSignals();
    const intervalTimer = setInterval(checkPendingSignals, 5000);
    return () => clearInterval(intervalTimer);
  }, [matches, telegramConfig.autoUpdateOnFinish]);

  // Check filter triggers and auto-send alerts with Anti-Spam deduplication
  // CRITICAL: ONLY run filters that are explicitly launched (enabled === true) by the current user!
  useEffect(() => {
    if (!isMonitoringActive) return;

    // Ensure active filters are strictly unique by id to avoid duplicate triggers
    const seenActiveRuleIds = new Set<string>();
    const activeLaunchedFilters = filters.filter((f) => {
      if (!f.enabled || (f.userId && f.userId !== currentUser?.id)) return false;
      if (seenActiveRuleIds.has(f.id)) return false;
      seenActiveRuleIds.add(f.id);
      return true;
    });
    if (activeLaunchedFilters.length === 0) return;

    // Periodic pruning: remove anti-spam tracker records older than 3 hours
    const nowTs = Date.now();
    for (const [key, track] of sentSignalsTrackerRef.current.entries()) {
      if (nowTs - track.lastSentAt > 3 * 3600 * 1000) {
        sentSignalsTrackerRef.current.delete(key);
      }
    }

    matches.forEach((match) => {
      // 🎯 User Requirement: Если включен режим отслеживания избранных матчей,
      // фильтры и сигналы работают ТОЛЬКО по избранным матчам!
      if (filterTrackedOnly && !trackedMatchIds.includes(match.id)) {
        return;
      }

      // 🛡️ CRITICAL GUARD: Never trigger alerts on demo/mock matches when in real live mode!
      const isMockMatch = match.id.startsWith('m-') || (match as any).isMock;
      if (isMockMatch && dataSourceConfig.activeSource !== 'simulated') {
        return;
      }

      // If in simulated demo mode, NEVER send automated messages to real Telegram bots
      // to avoid spamming the user's real channel with non-existent simulated games
      const isSimulatedMode = dataSourceConfig.activeSource === 'simulated';
      const allowTgInSim = Boolean((dataSourceConfig as any).allowTelegramInSimulation);

      const analysis = calculatePressureAnalysis(match);
      const matchSport = match.sport || inferSportFromMatch(match);
      const canonicalMatch = getCanonicalMatchKey(match);

      // Collect all matching active rules for this match in this evaluation pass
      const matchedRulesForMatch: FilterRule[] = [];
      activeLaunchedFilters.forEach((rule) => {
        const ruleSport = rule.sport || inferSportFromRule(rule);
        // Strict Sport Demarcation: Never trigger rules across different sports!
        if (ruleSport !== matchSport) return;

        const evalResult = evaluateFilterRule(match, rule);
        if (evalResult.matches) {
          matchedRulesForMatch.push(rule);
        }
      });

      if (matchedRulesForMatch.length === 0) return;

      // Group matching rules by same-event target cluster (e.g. Goal in 1H, Goal in 2H, Total Over, Corners, etc.)
      const rulesByCluster = new Map<StrategyTargetCluster, FilterRule[]>();
      matchedRulesForMatch.forEach((r) => {
        const { cluster } = getStrategyTargetCluster(r, match);
        const list = rulesByCluster.get(cluster) || [];
        list.push(r);
        rulesByCluster.set(cluster, list);
      });

      matchedRulesForMatch.forEach((rule) => {
        const { cluster, clusterNameRu, badgeLabel } = getStrategyTargetCluster(rule, match);
        const sameEventMatchedRules = rulesByCluster.get(cluster) || [rule];
        // 🎯 User Requirement: Супер-комбо возникает СТРОГО при совпадении >1 разных стратегий на ОДИН И ТОТ ЖЕ исход!
        const isCombo = sameEventMatchedRules.length > 1;
        const comboCount = sameEventMatchedRules.length;
        const comboStrategyNames = sameEventMatchedRules.map((r) => getStrategyCardDisplayName(r, isDeveloper, filters));
        const comboRuleIds = sameEventMatchedRules.map((r) => r.id);
        const comboConfidence = Math.min(99, 90 + comboCount * 3.0);
        const comboTargetCluster = cluster;
        const comboClusterName = clusterNameRu;

        const canonicalRuleKey = `${canonicalMatch}__rule_${rule.id}`;
        const matchTrackerKey = `canon_${canonicalMatch}`;
        const ruleTrackerKey = `match_${match.id}__rule_${rule.id}`;
        const currentScoreStr = `${match.score[0]}:${match.score[1]}`;

        let isDuplicateSuppressed = false;

        // Anti-spam & deduplication check across provider rotations and polling ticks
        if (
          inFlightSendingRef.current.has(canonicalRuleKey) ||
          inFlightSendingRef.current.has(ruleTrackerKey)
        ) {
          return;
        }

        const existingRuleTrack =
          sentSignalsTrackerRef.current.get(canonicalRuleKey) ||
          sentSignalsTrackerRef.current.get(ruleTrackerKey);

        if (telegramConfig.suppressDuplicates !== false) {
          if (telegramConfig.deduplicationMode === 'once-per-match') {
            if (existingRuleTrack) {
              isDuplicateSuppressed = true;
            }
          } else if (telegramConfig.deduplicationMode === 'cooldown') {
            const trackToCheck = existingRuleTrack;
            if (trackToCheck) {
              const minutesPassed = Math.abs(match.minute - trackToCheck.lastMinute);
              const msPassed = Date.now() - trackToCheck.lastSentAt;
              const cooldownMs = (telegramConfig.cooldownMinutes || 15) * 60 * 1000;
              if (minutesPassed < (telegramConfig.cooldownMinutes || 15) && msPassed < cooldownMs) {
                isDuplicateSuppressed = true;
              }
            }
          } else if (telegramConfig.deduplicationMode === 'score-change') {
            const trackToCheck = existingRuleTrack;
            if (trackToCheck && currentScoreStr === trackToCheck.lastScore) {
              isDuplicateSuppressed = true;
            }
          }
        }

        if (isDuplicateSuppressed) {
          return;
        }

        // Record into anti-spam memory under BOTH canonical and provider keys
        const trackRecord = {
          lastSentAt: Date.now(),
          lastMinute: match.minute,
          lastScore: currentScoreStr,
        };
        sentSignalsTrackerRef.current.set(canonicalRuleKey, trackRecord);
        sentSignalsTrackerRef.current.set(ruleTrackerKey, trackRecord);
        sentSignalsTrackerRef.current.set(matchTrackerKey, trackRecord);
        persistSentSignalsTracker();

        // Check if alert already recorded in current state list (deterministic per match + strategy)
        const isPrematch = getBetTypeForSignal(rule, match.minute, match) === 'PREMATCH' || match.status === 'PREMATCH';
        const alertId = isPrematch ? `${canonicalMatch}-${rule.id}-prematch-60` : `${canonicalMatch}-${rule.id}`;
        // Resolve real live bookmaker odds on the match at signal arrival
        const estimatedOdds = getRealSignalOdds(rule, match);

        // Determine unambiguous TB / TM betting action
        const betAction = detectBetActionBadge(rule.targetMarket, rule, match);
        const concreteMarketSuggestion = betAction.concreteBet;
        const targetAction = betAction.action;
        const targetLine = betAction.lineRecommendation;

        // Determine destination bot for this rule
        let targetBotToken = '';
        let targetChatId = '';
        let targetBotName = 'Основной бот';

        if (rule.customBotToken && rule.customChatId) {
          targetBotToken = rule.customBotToken.trim();
          targetChatId = rule.customChatId.trim();
          targetBotName = 'Кастомный бот';
        } else if (rule.botId) {
          const foundBot = currentUser?.telegramBots?.find((b) => b.id === rule.botId);
          if (foundBot && foundBot.botToken?.trim() && foundBot.channelId?.trim()) {
            targetBotToken = foundBot.botToken.trim();
            targetChatId = foundBot.channelId.trim();
            targetBotName = foundBot.name;
          }
        }

        if (!targetBotToken || !targetChatId) {
          const defaultBot = currentUser?.telegramBots?.find((b) => b.isDefault) || currentUser?.telegramBots?.[0];
          targetBotToken = (telegramConfig.botToken || defaultBot?.botToken || '').trim();
          targetChatId = (telegramConfig.channelId || defaultBot?.channelId || '').trim();
          targetBotName = defaultBot?.name || 'Основной бот';
        }

        const shouldSendTg =
          rule.telegramEnabled &&
          telegramConfig.autoSend &&
          !!targetBotToken &&
          !!targetChatId &&
          (!isSimulatedMode || allowTgInSim);

        const periodStr = isPrematch
          ? 'Прематч (за 1 час до матча)'
          : (match.minute <= 45 ? '1-й тайм' : (match.status === 'HT' ? 'Перерыв' : '2-й тайм'));

        const simPrefix = isSimulatedMode ? '🎮 [ДЕМО-СИМУЛЯЦИЯ]\n' : '';
        const displayRuleName = getStrategyCardDisplayName(rule, isDeveloper, filters);
        let cleanDisplay = displayRuleName.trim();
        cleanDisplay = cleanDisplay.replace(/^(?:стратегия\s*[:：]\s*)+(стратегия)/iu, '$1');
        cleanDisplay = cleanDisplay.replace(/(?:стратегия|strategy|strateji|strategia|策略)\s*[:：]?\s*\d{4,}/gi, '').trim();
        if (/^(?:\p{Emoji}|\s)*(?:стратегия)\s*[:：]?\s*$/iu.test(cleanDisplay) || !cleanDisplay) {
          const num = rule.id ? PRESET_STRATEGY_NUMBER_BY_ID[rule.id] : undefined;
          cleanDisplay = num !== undefined ? `Стратегия ${num}` : (rule.name || cleanDisplay);
        }
        const stratDisplay = /^(?:\p{Emoji}|\s)*(?:стратегия)/iu.test(cleanDisplay)
          ? cleanDisplay
          : `Стратегия: ${cleanDisplay}`;

        const comboPrefix = isCombo ? `⚡🔥 [СУПЕР-КОМБО: СИНЕРГИЯ ${comboCount} СТРАТЕГИЙ НА «${comboClusterName.toUpperCase()}» (${comboConfidence.toFixed(0)}%)]\n` : '';

        const signalMessage = isPrematch
          ? `${simPrefix}${comboPrefix}📋 [ПРЕДМАТЧЕВЫЙ СИГНАЛ ЗА 1 ЧАС] ${match.countryCode} ${match.country} | ${match.league}\n` +
            `⚔️ ${match.homeTeam} vs ${match.awayTeam} (⏳ Старт через ${match.startsInMinutes ?? 60} мин${match.startTime ? `, ${match.startTime}` : ''})\n` +
            `🔥 ЧТО БРАТЬ: ${betAction.actionBadge}\n` +
            `🎯 СТАВКА: ${concreteMarketSuggestion}\n` +
            `⏱ Анализ проведён за 1 час до свистка | ${stratDisplay}`
          : `${simPrefix}${comboPrefix}⚽ [СИГНАЛ] ${match.country} | ${match.league}\n${match.homeTeam} ${match.score[0]}:${match.score[1]} ${match.awayTeam} (${match.minute}')\n` +
            `🔥 ЧТО БРАТЬ: ${betAction.actionBadge}\n` +
            `🎯 СТАВКА: ${concreteMarketSuggestion} | Линия: ${targetLine}\n` +
            `🔥 Давление: ${analysis.pressureIndex}/100 | Оп. атаки ${match.stats.dangerousAttacks[0]}-${match.stats.dangerousAttacks[1]} | Удары в створ ${match.stats.shotsOnTarget[0]}-${match.stats.shotsOnTarget[1]} | Углы ${match.stats.corners[0]}-${match.stats.corners[1]}`;

        const newAlert: SignalAlert = {
          id: alertId,
          timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          matchId: match.id,
          matchName: `${match.homeTeam} vs ${match.awayTeam}`,
          league: match.league,
          country: match.country,
          sport: match.sport || 'football',
          minute: match.minute,
          period: periodStr,
          betType: isPrematch ? 'PREMATCH' : 'LIVE',
          score: currentScoreStr,
          initialScore: currentScoreStr,
          ruleId: rule.id,
          ruleName: displayRuleName,
          marketSuggestion: concreteMarketSuggestion,
          outcome: 'PENDING',
          odds: estimatedOdds,
          stake: 1000,
          botId: rule.botId,
          botName: targetBotName,
          botToken: targetBotToken,
          chatId: targetChatId,
          userId: currentUser?.id,
          // Combo & Action properties
          isCombo,
          comboCount,
          comboStrategyNames,
          comboRuleIds,
          comboConfidence,
          comboTargetCluster,
          comboClusterName,
          targetAction,
          targetLine,
          statsSnapshot: {
            homeScore: match.score[0],
            awayScore: match.score[1],
            attacks: [match.stats.attacks[0], match.stats.attacks[1]],
            dangerousAttacks: [match.stats.dangerousAttacks[0], match.stats.dangerousAttacks[1]],
            shotsOnTarget: [match.stats.shotsOnTarget[0], match.stats.shotsOnTarget[1]],
            shotsOffTarget: [match.stats.shotsOffTarget[0], match.stats.shotsOffTarget[1]],
            corners: [match.stats.corners[0], match.stats.corners[1]],
            yellowCards: [match.stats.yellowCards[0], match.stats.yellowCards[1]],
            redCards: [match.stats.redCards[0], match.stats.redCards[1]],
            possession: [match.stats.possession[0], match.stats.possession[1]],
          },
          strategyMetricSnapshot: getInitialStrategyMetric(rule, match),
          message: signalMessage,
          sentToTelegram: shouldSendTg,
          telegramStatusText: shouldSendTg ? `Отправка в TG (${targetBotName})...` : 'Локальный сигнал',
        };

        // Strategy Audit Logging: Record initial metrics (goals, corners, cards) at signal arrival
        try {
          logStrategyTrigger(newAlert, match, rule);
        } catch {}

        setSignals((prev) => {
          if (
            prev.some(
              (s) =>
                s.id === alertId ||
                (s.matchId === match.id && s.ruleId === rule.id) ||
                (getCanonicalMatchKey(s) === canonicalMatch && s.ruleId === rule.id)
            )
          ) {
            return prev;
          }
          playSignalSound();
          triggerWebPushNotification(
            isCombo
              ? `⚡🔥 СУПЕР-КОМБО (${comboCount} стратегий): ${match.homeTeam} vs ${match.awayTeam}`
              : `🔥 Сигнал ${displayRuleName}: ${match.homeTeam} vs ${match.awayTeam}`,
            `Минута ${match.minute}', счёт ${match.score[0]}:${match.score[1]}, кэф ${estimatedOdds.toFixed(2)}. ${betAction.actionBadge}: ${concreteMarketSuggestion}`
          );
          voiceAnnouncer.announceSignal({
            strategyName: isCombo ? `Супер комбо, ${comboCount} стратегий: ${displayRuleName}` : displayRuleName,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            minute: match.minute,
            score: match.score,
            market: concreteMarketSuggestion,
            odds: estimatedOdds,
          }, language);
          // Also persist this match to the accumulated live matches database (accumulated from scratch)
          try {
            saveMatchesToAccumulatedLiveDB([match]);
          } catch {}
          return [newAlert, ...prev].slice(0, 200);
        });

        // Dispatch Telegram alert outside of setSignals to avoid multiple dispatches during render
        if (shouldSendTg) {
          inFlightSendingRef.current.add(canonicalRuleKey);
          inFlightSendingRef.current.add(ruleTrackerKey);

          const comboCtx = isCombo
            ? {
                isCombo: true,
                comboCount,
                rules: sameEventMatchedRules,
                confidence: comboConfidence,
                targetCluster: comboTargetCluster,
                targetClusterName: comboClusterName,
              }
            : undefined;

          sendTelegramMessage(
            formatExtendedTelegramAlert(match, rule, analysis, undefined, isDeveloper, comboCtx),
            false,
            {
              matchId: match.id,
              ruleId: rule.id,
              canonicalKey: canonicalRuleKey,
              botToken: targetBotToken,
              chatId: targetChatId,
            }
          ).then((res) => {
            inFlightSendingRef.current.delete(canonicalRuleKey);
            inFlightSendingRef.current.delete(ruleTrackerKey);
            // Keep tracker intact so failed messages don't create an infinite spam loop every polling cycle
            persistSentSignalsTracker();
            setSignals((curr) =>
              curr.map((item) =>
                item.id === alertId
                  ? {
                      ...item,
                      sentToTelegram: res.ok && !res.duplicateSuppressed,
                      telegramStatusText: res.duplicateSuppressed
                        ? '🛡️ Дубликат подавлен'
                        : res.ok
                        ? (isCombo
                            ? `⚡ СУПЕР-КОМБО в TG (${targetBotName} #${res.messageId})`
                            : `Доставлено в TG (${targetBotName} #${res.messageId})`)
                        : (res.error || 'Ошибка отправки'),
                      telegramMessageId: res.messageId,
                    }
                  : item
              )
            );
          }).catch(() => {
            inFlightSendingRef.current.delete(canonicalRuleKey);
            inFlightSendingRef.current.delete(ruleTrackerKey);
            persistSentSignalsTracker();
          });
        }
      });
    });
  }, [
    isMonitoringActive,
    matches,
    filters,
    currentUser,
    telegramConfig.autoSend,
    telegramConfig.botToken,
    telegramConfig.channelId,
    telegramConfig.suppressDuplicates,
    telegramConfig.deduplicationMode,
    telegramConfig.cooldownMinutes,
    filterTrackedOnly,
    trackedMatchIds,
  ]);

  const selectedMatch = useMemo(() => {
    return matches.find((m) => m.id === selectedMatchId) || matches[0];
  }, [matches, selectedMatchId]);

  // Counts how many filters (active or preset) triggered on this match
  const getMatchTriggeredCount = useCallback(
    (match: Match) => {
      const matchSport = match.sport || inferSportFromMatch(match);
      const activeFilters = filters.filter(
        (f) =>
          f.enabled &&
          (!f.userId || f.userId === currentUser?.id) &&
          (f.sport || inferSportFromRule(f)) === matchSport
      );
      return activeFilters.filter((f) => evaluateFilterRule(match, f).matches).length;
    },
    [filters, currentUser?.id]
  );

  // Pre-calculate counts for the quick filter buttons under the search bar
  const quickFilterCounts = useMemo(() => {
    const baseMatches = matches.filter((m) => {
      if (filterTrackedOnly && !trackedMatchIds.includes(m.id)) return false;
      const mSport = m.sport || inferSportFromMatch(m);
      if (selectedSport !== 'all' && mSport !== selectedSport) return false;
      if (searchQuery.trim()) {
        return isMatchSearchMatch(m, searchQuery);
      }
      return true;
    });

    return {
      all: baseMatches.length,
      live: baseMatches.filter((m) => m.status === 'LIVE' || m.status === 'HT').length,
      prematch: baseMatches.filter((m) => m.status === 'PREMATCH').length,
      over25: baseMatches.filter((m) => {
        const currentGoals = (m.score[0] || 0) + (m.score[1] || 0);
        return (
          currentGoals >= 2 ||
          (m.odds?.over25 && m.odds.over25 <= 1.95) ||
          ((m.history?.homeOver25CountLast5 || 0) >= 3 || (m.history?.awayOver25CountLast5 || 0) >= 3)
        );
      }).length,
      odds_drop: baseMatches.filter((m) =>
        Boolean(m.oddsDrop || (m.marketFlows && m.marketFlows.length > 0) || m.history?.prematchInsiderDropReason)
      ).length,
      corners: baseMatches.filter((m) => ((m.stats.corners[0] || 0) + (m.stats.corners[1] || 0)) >= 6).length,
      pressure: baseMatches.filter((m) => {
        const dang = (m.stats.dangerousAttacks[0] || 0) + (m.stats.dangerousAttacks[1] || 0);
        const att = (m.stats.attacks[0] || 0) + (m.stats.attacks[1] || 0);
        return dang >= 25 || att >= 55;
      }).length,
    };
  }, [matches, selectedSport, filterTrackedOnly, trackedMatchIds, searchQuery]);

  const filteredMatches = useMemo(() => {
    // Ensure deduplication by unique match.id to prevent any React duplicate key warnings
    const seenIds = new Set<string>();
    const deduplicatedPool: Match[] = [];
    for (const m of matches) {
      if (!seenIds.has(m.id)) {
        seenIds.add(m.id);
        deduplicatedPool.push(m);
      }
    }

    const queried = deduplicatedPool.filter(
      (m) => {
        // User Requirement: Если включен фильтр только по отслеживаемым матчам, показывать только их!
        if (filterTrackedOnly && !trackedMatchIds.includes(m.id)) {
          return false;
        }

        const mSport = m.sport || inferSportFromMatch(m);
        if (selectedSport !== 'all' && mSport !== selectedSport) {
          return false;
        }

        // Search query filter: supports match ID (#m-1, id:m-1), team codes (ARS, CHE), team names, league, country
        if (searchQuery.trim() && !isMatchSearchMatch(m, searchQuery)) {
          return false;
        }

        // Quick filter buttons below search
        if (matchQuickFilter === 'live') {
          if (m.status !== 'LIVE' && m.status !== 'HT') return false;
        } else if (matchQuickFilter === 'prematch') {
          if (m.status !== 'PREMATCH') return false;
        } else if (matchQuickFilter === 'over25') {
          const currentGoals = (m.score[0] || 0) + (m.score[1] || 0);
          const hasOver25Odds = m.odds?.over25 && m.odds.over25 <= 1.95;
          const hasOver25History =
            (m.history?.homeOver25CountLast5 || 0) >= 3 || (m.history?.awayOver25CountLast5 || 0) >= 3;
          if (currentGoals < 2 && !hasOver25Odds && !hasOver25History) return false;
        } else if (matchQuickFilter === 'odds_drop') {
          const hasDrop = Boolean(
            m.oddsDrop ||
            (m.marketFlows && m.marketFlows.length > 0) ||
            m.history?.prematchInsiderDropReason
          );
          if (!hasDrop) return false;
        } else if (matchQuickFilter === 'corners') {
          const totalCorners = (m.stats.corners[0] || 0) + (m.stats.corners[1] || 0);
          if (totalCorners < 6) return false;
        } else if (matchQuickFilter === 'pressure') {
          const dang = (m.stats.dangerousAttacks[0] || 0) + (m.stats.dangerousAttacks[1] || 0);
          const att = (m.stats.attacks[0] || 0) + (m.stats.attacks[1] || 0);
          if (dang < 25 && att < 55) return false;
        }

        return true;
      }
    );

    // CRITICAL USER DIRECTIVE:
    // "Матчи в которых сработали фильтры должны находиться в верхнем списке всех матчей."
    return [...queried].sort((a, b) => {
      const aCount = getMatchTriggeredCount(a);
      const bCount = getMatchTriggeredCount(b);
      const aHasSignal = signals.some((s) => s.matchId === a.id);
      const bHasSignal = signals.some((s) => s.matchId === b.id);

      const aTriggered = aCount > 0 || aHasSignal;
      const bTriggered = bCount > 0 || bHasSignal;

      // 1. Matches where filters triggered MUST ALWAYS BE AT THE TOP!
      if (aTriggered && !bTriggered) return -1;
      if (!aTriggered && bTriggered) return 1;

      // 2. If both triggered, sort by number of triggered filters descending
      if (aTriggered && bTriggered) {
        if (aCount !== bCount) return bCount - aCount;
      }

      // 3. If a specific quick filter is active, sort by that metric
      if (matchQuickFilter === 'over25') {
        const goalsA = (a.score[0] || 0) + (a.score[1] || 0);
        const goalsB = (b.score[0] || 0) + (b.score[1] || 0);
        if (goalsB !== goalsA) return goalsB - goalsA;
      } else if (matchQuickFilter === 'odds_drop') {
        const dropA = Math.abs(a.oddsDrop?.dropPercent || 0);
        const dropB = Math.abs(b.oddsDrop?.dropPercent || 0);
        if (dropB !== dropA) return dropB - dropA;
      } else if (matchQuickFilter === 'corners') {
        const cA = (a.stats.corners[0] || 0) + (a.stats.corners[1] || 0);
        const cB = (b.stats.corners[0] || 0) + (b.stats.corners[1] || 0);
        if (cB !== cA) return cB - cA;
      } else if (matchQuickFilter === 'pressure') {
        const pA = (a.stats.dangerousAttacks[0] || 0) + (a.stats.dangerousAttacks[1] || 0);
        const pB = (b.stats.dangerousAttacks[0] || 0) + (b.stats.dangerousAttacks[1] || 0);
        if (pB !== pA) return pB - pA;
      }

      // 4. Status grouping: LIVE first, then PREMATCH, then FT
      const statusOrder: Record<string, number> = { LIVE: 0, HT: 1, PREMATCH: 2, FT: 3 };
      const aOrder = statusOrder[a.status] ?? 2;
      const bOrder = statusOrder[b.status] ?? 2;
      if (aOrder !== bOrder) return aOrder - bOrder;

      // 5. For PREMATCH matches: sort by startsInMinutes ascending (e.g. 60 min before 180 min)
      if (a.status === 'PREMATCH' && b.status === 'PREMATCH') {
        return (a.startsInMinutes ?? 999) - (b.startsInMinutes ?? 999);
      }

      // 6. For LIVE matches: sort by minute descending
      return (b.minute || 0) - (a.minute || 0);
    });
  }, [matches, searchQuery, matchQuickFilter, getMatchTriggeredCount, signals, selectedSport, filterTrackedOnly, trackedMatchIds]);

  // Screen resize watcher for desktop 2-column layout
  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate and align inspector column opposite the selected match card
  const updateInspectorPosition = useCallback((targetId?: string) => {
    if (typeof window === 'undefined' || window.innerWidth < 1024) {
      setInspectorOffset((prev) => (prev === 0 ? prev : 0));
      return;
    }

    if (inspectorAlignMode === 'top') {
      setInspectorOffset((prev) => (prev === 0 ? prev : 0));
      return;
    }

    const idToFind = targetId || selectedMatchId;
    if (!idToFind) return;

    const cardElement = document.getElementById(`match-card-${idToFind}`);
    const gridElement = matchesGridRef.current;

    if (cardElement && gridElement) {
      const gridRect = gridElement.getBoundingClientRect();
      const cardRect = cardElement.getBoundingClientRect();
      // Calculate distance from grid container top to the selected match card top
      const relativeTop = cardRect.top - gridRect.top;
      const targetOffset = Math.max(0, Math.round(relativeTop));
      setInspectorOffset((prev) => (prev === targetOffset ? prev : targetOffset));
    }
  }, [selectedMatchId, inspectorAlignMode]);

  // Keep inspector synchronized when activeTab is matches, list length changes, or filter updates
  useEffect(() => {
    if (activeTab !== 'matches') return;
    updateInspectorPosition();
    const rAf = requestAnimationFrame(() => updateInspectorPosition());
    const timer = setTimeout(() => updateInspectorPosition(), 50);
    return () => {
      cancelAnimationFrame(rAf);
      clearTimeout(timer);
    };
  }, [selectedMatchId, activeTab, filteredMatches.length, searchQuery, inspectorAlignMode, updateInspectorPosition]);

  // Handle selecting a match with instant position calculation and smooth alignment
  const handleSelectMatch = useCallback((matchId: string, shouldScrollIfHidden: boolean = false) => {
    setSelectedMatchId(matchId);
    setMobileMatchViewMode('detail');

    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      const cardElement = document.getElementById(`match-card-${matchId}`);
      const gridElement = matchesGridRef.current;
      if (cardElement && gridElement && inspectorAlignMode === 'opposite') {
        const gridRect = gridElement.getBoundingClientRect();
        const cardRect = cardElement.getBoundingClientRect();
        const relativeTop = cardRect.top - gridRect.top;
        setInspectorOffset(Math.max(0, Math.round(relativeTop)));

        // If card was clicked near the extreme edge of viewport, smoothly adjust
        if (shouldScrollIfHidden) {
          const viewportHeight = window.innerHeight;
          if (cardRect.top < 80 || cardRect.bottom > viewportHeight - 60) {
            cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      }
    } else {
      // On mobile/tablet (< 1024px), scroll to the statistics inspector smoothly
      setTimeout(() => {
        const inspectorCard = document.getElementById('match-inspector-card');
        inspectorCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  }, [inspectorAlignMode]);

  // Navigate directly to match tab, select target match, and scroll smoothly into view
  const handleNavigateToMatchFromSignal = useCallback((targetMatchId?: string, matchName?: string, signalObj?: SignalAlert) => {
    // 1. Reset match search so the target match is 100% visible in the list
    setSearchQuery('');

    // 2. Find the match in the current live matches collection
    let targetMatch = matches.find((m) => m.id === targetMatchId);
    if (!targetMatch && matchName) {
      const parts = matchName.split(' vs ');
      const homePart = parts[0]?.trim().toLowerCase();
      const awayPart = parts[1]?.trim().toLowerCase();
      targetMatch = matches.find((m) => {
        const h = m.homeTeam.toLowerCase();
        const a = m.awayTeam.toLowerCase();
        return (homePart && (h.includes(homePart) || homePart.includes(h))) ||
               (awayPart && (a.includes(awayPart) || awayPart.includes(a)));
      });
    }

    // 3. If the match wasn't in the active live collection (e.g. simulated signal or historical):
    // Construct a live match from the signal alert so the user ALWAYS gets directed to this exact match!
    if (!targetMatch && signalObj) {
      const parts = signalObj.matchName.split(' vs ');
      const home = parts[0]?.trim() || 'Хозяева';
      const away = parts[1]?.trim() || 'Гости';
      const scoreParts = (signalObj.score || '0:0').split(':');
      const s0 = parseInt(scoreParts[0], 10) || 0;
      const s1 = parseInt(scoreParts[1], 10) || 0;
      const snap = signalObj.statsSnapshot;

      targetMatch = {
        id: signalObj.matchId || `match-${signalObj.id}`,
        country: signalObj.country || 'Европа',
        countryCode: '⚽',
        league: signalObj.league || 'Live League',
        homeTeam: home,
        awayTeam: away,
        score: [s0, s1],
        minute: signalObj.minute || 65,
        status: 'LIVE',
        source: 'Public-Feed',
        stats: {
          possession: snap?.possession || [54, 46],
          dangerousAttacks: snap?.dangerousAttacks || [42, 28],
          attacks: snap?.attacks || [68, 49],
          shotsOnTarget: snap?.shotsOnTarget || [5, 2],
          shotsOffTarget: snap?.shotsOffTarget || [4, 3],
          corners: snap?.corners || [6, 3],
          yellowCards: snap?.yellowCards || [1, 2],
          redCards: snap?.redCards || [0, 0],
          xg: [1.35, 0.62],
        },
        momentum: [12, 18, 25, 20, 35, 45, 40, 55],
        lastEvent: `Сигнал по фильтру «${signalObj.ruleName}» на ${signalObj.minute}' мин`,
        odds: {
          home: 1.85,
          draw: 3.40,
          away: 4.20,
          over25: 1.72,
          over05: 1.15,
          over15: 1.38,
          under25: 2.10,
        },
      };

      setMatches((prev) => [targetMatch!, ...prev.filter((m) => m.id !== targetMatch!.id)]);
    } else if (!targetMatch && matches.length > 0) {
      targetMatch = matches[0];
    }

    if (!targetMatch) return;

    // 4. Switch to matches tab
    setActiveTab('matches');
    setSelectedMatchId(targetMatch.id);

    // 5. Scroll to match card & adjust inspector
    setTimeout(() => {
      handleSelectMatch(targetMatch!.id, true);
      const cardElement = document.getElementById(`match-card-${targetMatch!.id}`);
      if (cardElement) {
        cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 60);
  }, [matches, handleSelectMatch]);

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
    if (rule.isPreset && !isDeveloper) {
      setLockedPresetNotice(rule);
      return;
    }
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

  const handleRestoreAllStrategies = () => {
    const defaultBot = currentUser.telegramBots.find((b) => b.isDefault) || currentUser.telegramBots[0];
    const restored = EXPANDED_DEFAULT_FILTERS.map((f, idx) => ({
      ...f,
      userId: currentUser.id,
      botId: defaultBot?.id,
      enabled: idx < 4 ? true : f.enabled !== false,
      sport: (f.sport || inferSportFromRule(f) || 'football') as SportType,
    }));
    setFilters(restored);
    try {
      if (currentUser?.id) {
        localStorage.setItem(`footbalmonitor_filters_user_${currentUser.id}`, JSON.stringify(restored));
      }
      localStorage.setItem('footbalmonitor_filters', JSON.stringify(restored));
    } catch {}
  };

  const handleResetFilters = () => {
    handleRestoreAllStrategies();
  };

  const handleStopAllFilters = () => {
    setIsMonitoringActive(false);
    setFilters((prev) => {
      const updated = prev.map((f) => ({ ...f, enabled: false }));
      try {
        if (currentUser?.id) {
          localStorage.setItem(`footbalmonitor_filters_user_${currentUser.id}`, JSON.stringify(updated));
        }
        localStorage.setItem('footbalmonitor_filters', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleStartAllFilters = () => {
    setIsMonitoringActive(true);
    setFilters((prev) => {
      const updated = prev.map((f) => ({ ...f, enabled: true }));
      try {
        if (currentUser?.id) {
          localStorage.setItem(`footbalmonitor_filters_user_${currentUser.id}`, JSON.stringify(updated));
        }
        localStorage.setItem('footbalmonitor_filters', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearSignals = () => {
    setSignals([]);
    try {
      localStorage.setItem('footbalmonitor_signals', JSON.stringify([]));
      localStorage.removeItem('footbalmonitor_sent_signals');
    } catch {}
  };

  const handleExportFiltersJson = () => {
    const exportableFilters = isDeveloper
      ? filters
      : filters.map((f) => {
          if (!f.isPreset) return f;
          return {
            id: f.id,
            name: f.name,
            description: f.description,
            category: f.category,
            sport: f.sport,
            targetMarket: f.targetMarket,
            verifiedPassRate: f.verifiedPassRate,
            isTopStable: f.isTopStable,
            stabilityRank: f.stabilityRank,
            enabled: f.enabled,
            isPreset: true,
            _protected: 'Параметры и формулы скрыты разработчиком для защиты от копирования',
          };
        });
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportableFilters, null, 2));
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
    const textHtml = formatExtendedTelegramAlert(selectedMatch, activeRule, analysis, undefined, isDeveloper);
    const displayMsg = `🔔 [ТЕСТОВЫЙ ПУШ]\n${selectedMatch.countryCode} ${selectedMatch.country} | ${selectedMatch.league}\n${selectedMatch.homeTeam} ${selectedMatch.score[0]}:${selectedMatch.score[1]} ${selectedMatch.awayTeam} (${selectedMatch.minute}')\n` +
      `🔥 Давление: ${analysis.pressureIndex}/100 | Опасные атаки: ${selectedMatch.stats.dangerousAttacks[0]}-${selectedMatch.stats.dangerousAttacks[1]} | Удары в створ: ${selectedMatch.stats.shotsOnTarget[0]}-${selectedMatch.stats.shotsOnTarget[1]}`;

    const res = await sendTelegramMessage(textHtml, true);
    const currentScore = `${selectedMatch.score[0]}:${selectedMatch.score[1]}`;
    const ruleTitle = activeRule ? getStrategyCardDisplayName(activeRule, isDeveloper, filters) : 'Ручной';

    const testAlert: SignalAlert = {
      id: alertId,
      timestamp: new Date().toLocaleTimeString('ru-RU'),
      matchId: selectedMatch.id,
      matchName: `${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`,
      league: selectedMatch.league,
      country: selectedMatch.country,
      minute: selectedMatch.minute,
      period: selectedMatch.minute <= 45 ? '1-й тайм' : (selectedMatch.status === 'HT' ? 'Перерыв' : '2-й тайм'),
      score: currentScore,
      initialScore: currentScore,
      ruleId: activeRule?.id,
      ruleName: `Тестовый сигнал (${ruleTitle})`,
      marketSuggestion: activeRule?.targetMarket || 'ТБ 0.5',
      outcome: 'PENDING',
      odds: 1.85,
      stake: 1000,
      statsSnapshot: {
        homeScore: selectedMatch.score[0],
        awayScore: selectedMatch.score[1],
        attacks: [selectedMatch.stats.attacks[0], selectedMatch.stats.attacks[1]],
        dangerousAttacks: [selectedMatch.stats.dangerousAttacks[0], selectedMatch.stats.dangerousAttacks[1]],
        shotsOnTarget: [selectedMatch.stats.shotsOnTarget[0], selectedMatch.stats.shotsOnTarget[1]],
        shotsOffTarget: [selectedMatch.stats.shotsOffTarget[0], selectedMatch.stats.shotsOffTarget[1]],
        corners: [selectedMatch.stats.corners[0], selectedMatch.stats.corners[1]],
        yellowCards: [selectedMatch.stats.yellowCards[0], selectedMatch.stats.yellowCards[1]],
        redCards: [selectedMatch.stats.redCards[0], selectedMatch.stats.redCards[1]],
        possession: [selectedMatch.stats.possession[0], selectedMatch.stats.possession[1]],
      },
      strategyMetricSnapshot: getInitialStrategyMetric(activeRule || { targetMarket: 'ТБ 0.5' }, selectedMatch),
      message: displayMsg,
      sentToTelegram: res.ok,
      telegramStatusText: res.ok ? `Доставлено в TG (#${res.messageId}) - ожидает расчета` : (res.error || 'Ошибка отправки'),
      telegramMessageId: res.messageId,
    };
    try {
      logStrategyTrigger(testAlert, selectedMatch, activeRule);
    } catch {}
    setSignals((prev) => [testAlert, ...prev].slice(0, 200));
  };

  // Demo: send test signal and auto-rewrite it in Telegram after 3 seconds
  const [isDemoRewriting, setIsDemoRewriting] = useState(false);
  const triggerTestAndRewriteDemo = async () => {
    if (!selectedMatch) return;
    setIsDemoRewriting(true);
    const alertId = `demo-${Date.now()}`;
    const analysis = calculatePressureAnalysis(selectedMatch);
    const activeRule = filters.find((f) => f.enabled) || filters[0];
    const textHtml = formatExtendedTelegramAlert(selectedMatch, activeRule, analysis, undefined, isDeveloper);
    const currentScore = `${selectedMatch.score[0]}:${selectedMatch.score[1]}`;
    const ruleTitle = activeRule ? getStrategyCardDisplayName(activeRule, isDeveloper, filters) : 'ТБ';

    const res = await sendTelegramMessage(textHtml, true);
    if (!res.ok || !res.messageId) {
      setIsDemoRewriting(false);
      return;
    }

    const testAlert: SignalAlert = {
      id: alertId,
      timestamp: new Date().toLocaleTimeString('ru-RU'),
      matchId: selectedMatch.id,
      matchName: `${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`,
      league: selectedMatch.league,
      country: selectedMatch.country,
      minute: selectedMatch.minute,
      period: selectedMatch.minute <= 45 ? '1-й тайм' : (selectedMatch.status === 'HT' ? 'Перерыв' : '2-й тайм'),
      score: currentScore,
      initialScore: currentScore,
      ruleId: activeRule?.id,
      ruleName: `Демо переписывания (${ruleTitle})`,
      marketSuggestion: activeRule?.targetMarket || 'ТБ 0.5',
      outcome: 'PENDING',
      odds: 1.85,
      stake: 1000,
      statsSnapshot: {
        homeScore: selectedMatch.score[0],
        awayScore: selectedMatch.score[1],
        attacks: [selectedMatch.stats.attacks[0], selectedMatch.stats.attacks[1]],
        dangerousAttacks: [selectedMatch.stats.dangerousAttacks[0], selectedMatch.stats.dangerousAttacks[1]],
        shotsOnTarget: [selectedMatch.stats.shotsOnTarget[0], selectedMatch.stats.shotsOnTarget[1]],
        shotsOffTarget: [selectedMatch.stats.shotsOffTarget[0], selectedMatch.stats.shotsOffTarget[1]],
        corners: [selectedMatch.stats.corners[0], selectedMatch.stats.corners[1]],
        yellowCards: [selectedMatch.stats.yellowCards[0], selectedMatch.stats.yellowCards[1]],
        redCards: [selectedMatch.stats.redCards[0], selectedMatch.stats.redCards[1]],
        possession: [selectedMatch.stats.possession[0], selectedMatch.stats.possession[1]],
      },
      strategyMetricSnapshot: getInitialStrategyMetric(activeRule || { targetMarket: 'ТБ 0.5' }, selectedMatch),
      message: `🔔 Сигнал отправлен (#${res.messageId}). Ожидание завершения матча для переписывания...`,
      sentToTelegram: true,
      telegramStatusText: `Доставлено (#${res.messageId}) - перепишется через 3 сек...`,
      telegramMessageId: res.messageId,
    };
    try {
      logStrategyTrigger(testAlert, selectedMatch, activeRule);
    } catch {}
    setSignals((prev) => [testAlert, ...prev].slice(0, 200));

    // Simulate match completion and edit Telegram message after 3 seconds
    setTimeout(async () => {
      const finalScoreStr = `${selectedMatch.score[0] + 1}:${selectedMatch.score[1]}`;
      const finalCorners: [number, number] = [selectedMatch.stats.corners[0] + 2, selectedMatch.stats.corners[1] + 1];
      const finalYellowCards: [number, number] = [selectedMatch.stats.yellowCards[0] + 1, selectedMatch.stats.yellowCards[1] + 1];
      const simulatedFinalStats = {
        ...selectedMatch.stats,
        homeScore: selectedMatch.score[0] + 1,
        awayScore: selectedMatch.score[1],
        corners: finalCorners,
        yellowCards: finalYellowCards,
      };
      const scoreTuple: [number, number] = [selectedMatch.score[0] + 1, selectedMatch.score[1]];
      const resolvedMetricSnapshot = resolveStrategyMetric(testAlert, scoreTuple, simulatedFinalStats);

      try {
        logStrategyResolution(
          testAlert.id,
          finalScoreStr,
          simulatedFinalStats,
          'WIN',
          'Демо-резолюция: гол зафиксирован',
          850
        );
      } catch {}

      const resolvedHtml = formatResolvedTelegramAlert(
        { ...testAlert, outcome: 'WIN', profit: 850, finalScore: finalScoreStr, finalStats: simulatedFinalStats, strategyMetricSnapshot: resolvedMetricSnapshot },
        finalScoreStr,
        'WIN',
        {
          homeTeam: selectedMatch.homeTeam,
          awayTeam: selectedMatch.awayTeam,
          league: selectedMatch.league,
          country: selectedMatch.country,
        },
        simulatedFinalStats
      );

      const editRes = await editTelegramMessage(res.messageId!, resolvedHtml);
      setSignals((prev) =>
        prev.map((s) =>
          s.id === alertId
            ? {
                ...s,
                outcome: 'WIN',
                profit: 850,
                finalScore: finalScoreStr,
                finalStats: simulatedFinalStats,
                strategyMetricSnapshot: resolvedMetricSnapshot,
                resolvedAt: new Date().toLocaleTimeString('ru-RU'),
                resolutionNote: 'Матч завершен (FT) - ставка успешно сыграла!',
                telegramEdited: editRes.ok,
                telegramEditedAt: editRes.ok ? new Date().toLocaleTimeString('ru-RU') : undefined,
                telegramStatusText: editRes.ok
                  ? `Успешно переписано в TG: ✅ WIN (#${res.messageId})`
                  : 'Ошибка редактирования в TG',
              }
            : s
        )
      );
      setIsDemoRewriting(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header id="app-header" className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-3 sm:px-6 py-2.5 sm:py-3 sticky top-0 z-40">
        <div className="max-w-[1880px] mx-auto flex items-center justify-between gap-2">
          {/* Brand Logo & Status */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <AppLogo size="sm" animated={true} />
            <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 font-mono font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE SCANNER
            </span>
          </div>

          {/* Desktop Global Controls (hidden on mobile, cleanly aligned on lg+) */}
          <div className="hidden lg:flex items-center gap-2 flex-wrap justify-end">
            {/* Data Sources / Real Matches Trigger (Visible strictly for DEVELOPER; completely hidden for regular users) */}
            {isDeveloper ? (
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                <select
                  value={dataSourceConfig.activeSource}
                  onChange={(e) => {
                    const newSource = e.target.value as DataSourceType;
                    setDataSourceConfig((prev) => ({ ...prev, activeSource: newSource }));
                    fetchLiveMatchesFromSource(newSource);
                  }}
                  className="bg-transparent text-xs text-slate-200 font-medium px-2 py-1 border-none focus:ring-0 cursor-pointer hover:text-white"
                  title="Быстрое переключение активного источника live-данных (Панель разработчика)"
                >
                  <option value="public-feed" className="bg-slate-900 text-emerald-400">🌐 Глобальный Фид (Без VPN)</option>
                  <option value="fonbet" className="bg-slate-900 text-red-400">🔴 Фонбет Live (РФ Линия)</option>
                  <option value="1xbet" className="bg-slate-900 text-sky-400">🔷 1xBet Live</option>
                  <option value="flashscore" className="bg-slate-900 text-rose-400">⚡ Flashscore Live</option>
                  <option value="sstats" className="bg-slate-900 text-blue-400">📊 SStats.net API</option>
                  <option value="sofascore" className="bg-slate-900 text-amber-300">⚽ Sofascore (Relay)</option>
                  <option value="api-football" className="bg-slate-900 text-indigo-400">⚡ API-Football (v3)</option>
                  <option value="football-data" className="bg-slate-900 text-cyan-400">🏆 Football-Data.org</option>
                  <option value="webhook" className="bg-slate-900 text-purple-400">🔌 Webhook / Скрипты</option>
                  <option value="simulated" className="bg-slate-900 text-slate-400">🎮 Демо-генератор</option>
                </select>
                <button
                  id="open-datasources-btn"
                  onClick={() => setIsDataSourcesModalOpen(true)}
                  className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition"
                  title="Панель настройки источников"
                >
                  <Globe className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => fetchLiveMatchesFromSource()}
                  disabled={isRefreshingMatches}
                  className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition disabled:opacity-50"
                  title="Синхронизировать live-матчи"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingMatches ? 'animate-spin text-emerald-400' : ''}`} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300 font-semibold text-[11px]">LIVE ПОТОК</span>
                <button
                  onClick={() => fetchLiveMatchesFromSource()}
                  disabled={isRefreshingMatches}
                  className="p-0.5 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition disabled:opacity-50"
                  title="Синхронизировать события"
                >
                  <RefreshCw className={`h-3 w-3 ${isRefreshingMatches ? 'animate-spin text-emerald-400' : ''}`} />
                </button>
              </div>
            )}

            {/* User Simulation Testing Agent Button */}
            <button
              id="open-agent-simulator-btn"
              type="button"
              onClick={() => setIsSimulationAgentOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600/20 to-emerald-600/20 hover:from-cyan-600/30 hover:to-emerald-600/30 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition shadow-sm active:scale-95"
              title="Запустить агента-тестировщика сервиса (в роли пользователя, 0% влияния на систему)"
            >
              <Bot className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              <span className="hidden xl:inline">Тест ИИ-Агентом</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-200 font-mono">0% риска</span>
            </button>

            {/* In-App Update Button */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(true)}
                className={`p-1 rounded transition relative ${
                  availableUpdate?.isNewer
                    ? 'text-emerald-400 bg-emerald-500/20 hover:bg-emerald-500/30 ring-1 ring-emerald-500/50'
                    : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800'
                }`}
                title={
                  availableUpdate?.isNewer
                    ? `Доступно обновление v${availableUpdate.version}! Нажмите для установки в 1 клик`
                    : 'Центр обновлений приложения'
                }
              >
                <ArrowUpCircle className="h-3.5 w-3.5" />
                {availableUpdate?.isNewer && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>
              {availableUpdate?.isNewer && (
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(true)}
                  className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold hover:bg-emerald-500/30 transition flex items-center gap-1 animate-pulse"
                  title="Нажмите для установки обновления без переустановки"
                >
                  <ArrowUpCircle className="h-3 w-3" />
                  <span>v{availableUpdate.version}</span>
                </button>
              )}
            </div>

            {/* Language Switcher (RU, EN, TR, IT, ZH) */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setLanguage('ru')}
                className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                  language === 'ru' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Русский язык"
              >
                <span>🇷🇺</span>
                <span>RU</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                  language === 'en' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="English language"
              >
                <span>🇬🇧</span>
                <span>EN</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguage('tr')}
                className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                  language === 'tr' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Türkçe"
              >
                <span>🇹🇷</span>
                <span>TR</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguage('it')}
                className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                  language === 'it' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Italiano"
              >
                <span>🇮🇹</span>
                <span>IT</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguage('zh')}
                className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                  language === 'zh' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="中文 (Chinese)"
              >
                <span>🇨🇳</span>
                <span>ZH</span>
              </button>
            </div>

            {/* Telegram WebApp status badge */}
            {isInTelegram && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-500/15 border border-sky-400/40 text-sky-300 text-xs font-bold"
                title="Приложение запущено внутри Telegram WebApp (Mini App)"
              >
                <Smartphone className="h-3.5 w-3.5 text-sky-400" />
                <span>TWA Active</span>
              </div>
            )}

            {/* PWA App Install / Status Button */}
            {!isInPwaStandalone && (
              <button
                type="button"
                onClick={() => setIsPwaInstallModalOpen(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition shadow-sm ${
                  isPaidUser
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                }`}
                title={
                  isPaidUser
                    ? 'Установить мобильное PWA приложение на домашний экран'
                    : 'PWA приложение доступно только по подписке PRO или VIP'
                }
              >
                <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline">
                  {isPaidUser ? 'PWA' : 'PWA'}
                </span>
                {!isPaidUser && <Crown className="h-2.5 w-2.5 text-amber-400" />}
              </button>
            )}

            {/* Daily Telegram Performance Report */}
            <button
              id="send-daily-report-header-btn"
              onClick={() => handleSendDailyReport(false)}
              disabled={sendingDailyReport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/40 shadow-sm transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              title="Отправить суточный отчёт во все настроенные боты (по 23:59 МСК)"
            >
              <BarChart3 className={`h-3.5 w-3.5 text-blue-400 ${sendingDailyReport ? 'animate-pulse' : ''}`} />
              <span>{sendingDailyReport ? 'Отправка...' : t('sendDailyReport')}</span>
            </button>

            {/* Monitoring active toggle */}
            <button
              id="toggle-monitoring-btn"
              onClick={() => setIsMonitoringActive(!isMonitoringActive)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isMonitoringActive
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {isMonitoringActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{isMonitoringActive ? t('monitoringActive') : t('monitoringPaused')}</span>
            </button>

            {/* Web Push Notifications Toggle & Test */}
            <button
              id="toggle-web-push-btn"
              type="button"
              onClick={handleToggleWebPush}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                isWebPushEnabled
                  ? 'bg-blue-500/15 border-blue-500/40 text-blue-300 hover:bg-blue-500/25 shadow-sm'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title={
                isWebPushEnabled
                  ? 'Web Push активен'
                  : 'Web Push'
              }
            >
              {isWebPushEnabled ? (
                <BellRing className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
              ) : (
                <Bell className="h-3.5 w-3.5 text-slate-400" />
              )}
              <span className="hidden sm:inline font-mono">
                {isWebPushEnabled ? t('webPushActive') : t('webPushInactive')}
              </span>
            </button>

            {/* Innovation 2: Live Multilingual Voice & Audio Announcer */}
            <button
              id="toggle-voice-alerts-btn"
              type="button"
              onClick={() => {
                triggerTgHaptic('light');
                const nextVal = !isVoiceAlertsEnabled;
                setIsVoiceAlertsEnabled(nextVal);
                voiceAnnouncer.setEnabled(nextVal);
                if (nextVal) {
                  voiceAnnouncer.testVoice(language);
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                isVoiceAlertsEnabled
                  ? 'bg-purple-500/15 border-purple-500/40 text-purple-300 hover:bg-purple-500/25 shadow-sm'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Live Voice Alert Announcer"
            >
              <Volume2 className={`h-3.5 w-3.5 ${isVoiceAlertsEnabled ? 'text-purple-400 animate-pulse' : 'text-slate-400'}`} />
              <span className="hidden sm:inline font-mono">
                {isVoiceAlertsEnabled ? t('voiceActive') : t('voiceInactive')}
              </span>
            </button>

            {/* Audio Alerts & Sound Profile Selector */}
            <div className="relative">
              <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
                <button
                  id="toggle-sound-btn"
                  type="button"
                  onClick={toggleSoundAlerts}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold transition ${
                    isSoundAlertsEnabled
                      ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                      : 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25'
                  }`}
                >
                  {isSoundAlertsEnabled ? (
                    <Volume2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-rose-400" />
                  )}
                  <span className="hidden sm:inline font-mono">
                    {isSoundAlertsEnabled ? t('soundActive') : t('soundInactive')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSoundSelectorOpen(!isSoundSelectorOpen)}
                  className="px-1.5 border-l border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Выбрать профиль звука (Свисток, Гонг, Колокол, Радар)"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>

              {isSoundSelectorOpen && (
                <div className="absolute right-0 mt-1.5 w-60 p-2 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl z-50 text-xs space-y-1.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 px-1 text-[11px] text-slate-400">
                    <span className="font-bold text-white">Звуковое оповещение</span>
                    <button
                      type="button"
                      onClick={() => setIsSoundSelectorOpen(false)}
                      className="text-slate-500 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  {ALERT_SOUND_PROFILES.map((prof) => (
                    <button
                      key={prof.id}
                      type="button"
                      onClick={() => {
                        setAlertSoundType(prof.id);
                        localStorage.setItem('sportsignal_sound_type', prof.id);
                        playAlertSound(prof.id, 0.35);
                        triggerTgHaptic('light');
                        setIsSoundSelectorOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition ${
                        alertSoundType === prof.id
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'hover:bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{prof.icon}</span>
                        <div>
                          <div className="font-semibold text-xs leading-none">{prof.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{prof.desc}</div>
                        </div>
                      </div>
                      {alertSoundType === prof.id && (
                        <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      )}
                    </button>
                  ))}
                  <div className="pt-1 border-t border-slate-800 flex justify-between items-center px-1">
                    <button
                      type="button"
                      onClick={() => playAlertSound(alertSoundType, 0.4)}
                      className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 py-1"
                    >
                      ▶ Прослушать текущий
                    </button>
                    <button
                      type="button"
                      onClick={handleTestWebPush}
                      className="text-[10px] font-bold text-blue-400 hover:text-blue-300 py-1"
                    >
                      🔔 Тест Web Push
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Innovation 1: AI Match Momentum & Goal Radar */}
            <button
              id="open-momentum-radar-btn"
              onClick={() => {
                triggerTgHaptic('medium');
                setIsMomentumRadarOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-emerald-500/20 hover:from-emerald-600/35 hover:to-teal-600/35 text-emerald-300 border border-emerald-500/40 shadow-sm transition hover:scale-[1.02] active:scale-[0.98]"
              title="AI Радар Доминации и Оценка Гола"
            >
              <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              <span>{t('navMomentumRadar')}</span>
            </button>

            {/* Proof-of-Win Public Checker */}
            <button
              onClick={() => {
                triggerTgHaptic('medium');
                setIsProofOfWinOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm transition hover:scale-[1.02] active:scale-[0.98]"
              title="Proof-of-Win"
            >
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
              <span>{t('navProofOfWin')}</span>
            </button>

            {/* Leaderboard of creators */}
            <button
              onClick={() => {
                triggerTgHaptic('medium');
                setIsLeaderboardOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/40 shadow-sm transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Crown className="h-3.5 w-3.5 text-purple-400" />
              <span className="hidden xl:inline">{t('navLeaderboard')}</span>
            </button>

            {/* AI Analyst */}
            <button
              id="open-ai-analyst-header-btn"
              onClick={() => handleOpenAIAnalyst(selectedMatch || matches[0])}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-950/50 border border-indigo-400/30 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-200 animate-pulse" />
              <span>{t('navAiAnalyst')}</span>
            </button>

            {/* AI Synthesizer */}
            <button
              id="open-ai-synthesizer-header-btn"
              onClick={() => setIsAISynthesizerOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:opacity-90 text-white shadow-md shadow-emerald-950/50 border border-emerald-400/40 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>{t('navAiSynthesizer')}</span>
            </button>

            {/* Strategy Marketplace */}
            <button
              onClick={() => {
                triggerTgHaptic('medium');
                setIsMarketplaceOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-amber-400" />
              <span>{t('navMarketplace')}</span>
            </button>

            {/* Virtual Bankroll & Bet Tracker */}
            <button
              onClick={() => {
                triggerTgHaptic('medium');
                setIsBankrollOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Wallet className="h-3.5 w-3.5 text-emerald-400" />
              <span>{t('navBankroll')}</span>
            </button>

            {/* Odds Radar */}
            <button
              onClick={() => {
                triggerTgHaptic('medium');
                setIsOddsRadarOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
              <span>{t('navOddsRadar')}</span>
            </button>

            {/* User Cabinet */}
            <button
              onClick={() => setActiveTab('cabinet')}
              className={`px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5 text-xs font-bold ${
                currentUser.role === 'god'
                  ? 'bg-purple-950/80 border border-purple-500/50 text-purple-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>{currentUser.role === 'god' ? 'ROOT' : currentUser.displayName.split(' ')[0]}</span>
            </button>

            {/* Theme Toggle */}
            <button
              id="theme-quick-toggle-btn"
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-100 transition shadow-sm active:scale-95"
              title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-indigo-400" />}
            </button>

            {/* Logout */}
            <button
              id="header-logout-btn"
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg border border-slate-700 hover:border-red-500/60 bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition"
              title="Выйти"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Mobile Global Controls (Ultra-compact, reliable & neat on < lg) */}
          <div className="flex lg:hidden items-center gap-1.5 shrink-0">
            {/* Mobile Language Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px] font-bold">
              {(['ru', 'en', 'tr', 'it', 'zh'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`px-1.5 py-1 rounded transition ${
                    language === lang ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400'
                  }`}
                  title={lang.toUpperCase()}
                >
                  {lang === 'ru' ? '🇷🇺' : lang === 'en' ? '🇬🇧' : lang === 'tr' ? '🇹🇷' : lang === 'it' ? '🇮🇹' : '🇨🇳'}
                </button>
              ))}
            </div>

            {/* Monitoring toggle on mobile */}
            <button
              onClick={() => setIsMonitoringActive(!isMonitoringActive)}
              className={`px-2 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 min-h-[36px] ${
                isMonitoringActive
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title={isMonitoringActive ? 'Мониторинг активен' : 'Пауза'}
            >
              {isMonitoringActive ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px]">LIVE</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-slate-500" />
                  <span className="text-[11px]">ПАУЗА</span>
                </>
              )}
            </button>

            {/* Tools Drawer Toggle Button */}
            <button
              onClick={() => setIsMobileToolsDrawerOpen(true)}
              className="p-2 rounded-lg border text-xs font-bold flex items-center justify-center transition bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 min-h-[36px] min-w-[36px] active:scale-95"
              title="Панель инструментов"
            >
              <Menu className="h-4 w-4 text-emerald-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Sub-Header Navigation Tabs Bar (Desktop-only, sleek) */}
      <nav className="hidden lg:block border-b border-slate-800/80 bg-slate-950/95 sticky top-[49px] sm:top-[57px] z-30 px-2 sm:px-6 py-1.5 sm:py-2 backdrop-blur-md">
        <div className="max-w-[1880px] mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          <div className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
            <button
              onClick={() => {
                setActiveTab('matches');
                setMobileMatchViewMode('list');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'matches'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>{t('navLiveMatches')}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'matches' ? 'bg-black/30 text-emerald-200' : 'bg-slate-800 text-slate-400'
              }`}>
                {matches.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('filters')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'filters'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>{t('navStrategies')}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'filters' ? 'bg-black/30 text-emerald-200' : 'bg-slate-800 text-slate-400'
              }`}>
                {filters.filter((f) => f.enabled).length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('signals')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'signals'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>{t('navSignals')}</span>
              {signals.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                  {signals.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('backtest')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'backtest'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              <span>{t('navBacktest')}</span>
            </button>

            <button
              id="education-nav-btn"
              onClick={() => setActiveTab('education')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'education'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5 text-amber-400" />
              <span>{t('navEducation')}</span>
            </button>

            <button
              id="cabinet-nav-btn"
              onClick={() => setActiveTab('cabinet')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'cabinet'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <User className="h-3.5 w-3.5 text-emerald-400" />
              <span>{currentUser.role === 'god' ? 'GOD MODE' : t('navCabinet')}</span>
            </button>
          </div>

          {/* Quick Action Button: New Filter */}
          <div className="shrink-0 pl-2">
            <button
              id="create-filter-header-btn"
              onClick={() => {
                setEditingFilter(null);
                setIsFilterModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-950/50 transition active:scale-95 shrink-0"
              title="Создать фильтр"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('newFilter')}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Outer Layout Wrapper with Left & Right Flanking Ad Banners */}
      <div className="flex-1 w-full max-w-[1880px] mx-auto px-2 sm:px-4 lg:px-6 flex justify-center items-start gap-4 xl:gap-6 relative">
        {/* Left Skyscraper Banner (Desktop) */}
        {currentUser.adPreferences.showBanners && !dismissedLeftBanner && leftAd && (
          <aside
            id="ad-flank-left"
            className="hidden xl:block w-44 2xl:w-56 shrink-0 pt-6 sticky top-16 z-20"
          >
            <AdBanner
              ad={leftAd}
              variant="skyscraper"
              side="left"
              onDismiss={() => setDismissedLeftBanner(true)}
              onAdClick={handleAdClick}
              onAdImpression={handleAdImpression}
            />
          </aside>
        )}

        {/* Restore Left Banner pill if dismissed */}
        {dismissedLeftBanner && currentUser.adPreferences.showBanners && (
          <button
            onClick={() => setDismissedLeftBanner(false)}
            className="hidden xl:flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 bg-slate-900/95 border border-amber-500/40 px-2 py-1 rounded-r-lg fixed left-0 top-32 z-30 transition shadow-lg backdrop-blur-sm active:scale-95"
            title="Восстановить баннер слева"
          >
            <ChevronRight className="h-3 w-3" />
            <span className="font-bold">Баннер слева</span>
          </button>
        )}

        {/* Main Container */}
        <div className="flex-1 max-w-7xl w-full mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6 min-w-0 pb-24 lg:pb-6">
          {/* Top Billboard Ad Banner ("такой же баннер сверху") */}
          {currentUser.adPreferences.showBanners && !dismissedTopBanner && topAd && (
            <div id="ad-billboard-top" className="w-full">
              <AdBanner
                ad={topAd}
                variant="top_billboard"
                onDismiss={() => setDismissedTopBanner(true)}
                onAdClick={handleAdClick}
                onAdImpression={handleAdImpression}
              />
            </div>
          )}

          {/* Restore Top Banner button if dismissed */}
          {dismissedTopBanner && currentUser.adPreferences.showBanners && (
            <div className="flex justify-end">
              <button
                onClick={() => setDismissedTopBanner(false)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-slate-900/95 border border-amber-500/40 px-3 py-1 rounded-xl transition shadow-md active:scale-95"
                title="Восстановить верхний рекламный баннер"
              >
                <Flame className="h-3 w-3 text-amber-400" />
                <span>Восстановить верхний баннер</span>
              </button>
            </div>
          )}

          {/* Mobile partner promotions bar if banners are enabled */}
          {currentUser.adPreferences.showBanners && (
            <div className="xl:hidden flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5 min-w-0 truncate">
                <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Спецпредложения партнёров:</span>
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={leftAd.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 text-[11px] hover:bg-amber-500/30 transition flex items-center gap-1"
                >
                  <span>{leftAd.badge}</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
                <a
                  href={rightAd.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 text-[11px] hover:bg-indigo-500/30 transition flex items-center gap-1"
                >
                  <span>{rightAd.badge}</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            </div>
          )}

        {/* Developer GOD MODE Console (Visible only when Creator/God is logged in) */}
        {(currentUser.role === 'god' || currentUser.username === 'developer_god' || currentUser.plan === 'GOD_MODE') && (
          <GodModeConsole
            currentUser={currentUser}
            allUsers={allUsers}
            matches={matches}
            filters={filters}
            onSetMatches={setMatches}
            onSetFilters={setFilters}
            onUpdateCurrentUser={handleUpdateCurrentUser}
            dataSourceConfig={dataSourceConfig}
            onSwitchDataSource={handleManualSwitchDataSource}
            onOpenDataSourcesModal={() => setIsDataSourcesModalOpen(true)}
            onSendTestBroadcast={async (message: string) => {
              const res = await sendTelegramMessage(message, true, { force: true });
              if (!res.ok) {
                throw new Error(res.error || 'Ошибка отправки в Telegram');
              }
            }}
          />
        )}

        {/* Status Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          <div
            onClick={() => {
              if (isDeveloper) {
                setIsDataSourcesModalOpen(true);
              }
            }}
            className={`bg-slate-900/60 border border-slate-800 rounded-xl p-3 sm:p-4 flex items-center justify-between transition group ${
              isDeveloper ? 'hover:bg-slate-900/90 hover:border-cyan-500/40 cursor-pointer' : 'cursor-default'
            }`}
            title={isDeveloper ? "Нажмите, чтобы настроить источники линии" : "Поток телеметрии защищён и активен"}
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-400 group-hover:text-cyan-300 transition truncate">
                <span>{isDeveloper ? t('activeProvider') : 'Телеметрия эфира'}</span>
                {isDeveloper && <span className="text-[10px] text-cyan-400 font-mono">⚙ (Dev)</span>}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className={`h-2 w-2 rounded-full shrink-0 ${
                  dataSourceConfig.activeSource !== 'simulated' ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400 animate-ping'
                }`} />
                <span className="text-xs sm:text-sm font-semibold text-white truncate">
                  {isDeveloper ? (
                    dataSourceConfig.activeSource === 'fonbet'
                      ? '🔴 Фонбет Live'
                      : dataSourceConfig.activeSource === '1xbet'
                      ? '🔷 1xBet Live'
                      : dataSourceConfig.activeSource === 'public-feed'
                      ? '🌐 Public Feed'
                      : dataSourceConfig.activeSource === 'sofascore'
                      ? '⚽ Sofascore Live'
                      : dataSourceConfig.activeSource === 'sstats'
                      ? '📊 SStats API'
                      : dataSourceConfig.activeSource === 'api-football'
                      ? '⚡ API-Football'
                      : dataSourceConfig.activeSource === 'football-data'
                      ? '🏆 Football-Data'
                      : dataSourceConfig.activeSource === 'webhook'
                      ? '🔌 Webhook'
                      : dataSourceConfig.activeSource === 'simulated'
                      ? '🎮 Демо-генератор'
                      : '⚡ Flashscore'
                  ) : (
                    '🛰️ Live Telemetry Core'
                  )}
                </span>
              </div>
              {lastFetchedAt && (
                <div className="text-[9px] sm:text-[10px] text-slate-500 truncate">
                  {lastFetchedAt}
                </div>
              )}
            </div>
            <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400/50 group-hover:text-cyan-400 transition shrink-0 ml-1" />
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 sm:p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] sm:text-xs text-slate-400">{t('liveMatchesCount')}</span>
              <div className="text-lg sm:text-xl font-bold text-white">{matches.length}</div>
            </div>
            <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400/50 shrink-0 ml-1" />
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 sm:p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] sm:text-xs text-slate-400">{t('filtersCount')}</span>
              <div className="text-lg sm:text-xl font-bold text-emerald-400">{filters.filter((f) => f.enabled).length} / {filters.length}</div>
            </div>
            <Sliders className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400/50 shrink-0 ml-1" />
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 sm:p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] sm:text-xs text-slate-400 truncate flex items-center gap-1">
                <span>{t('tgChannel')}</span>
              </span>
              <div className="text-lg sm:text-xl font-bold text-blue-400">{telegramConfig.notificationsCount}</div>
            </div>
            <Send className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400/50 shrink-0 ml-1" />
          </div>
        </div>

        {/* God Mode: Плашка с ресурсами получения данных (Data Sources Resource Banner) */}
        {(currentUser.role === 'god' || isDeveloper) && (
          <div className="bg-gradient-to-r from-slate-950 via-purple-950/20 to-slate-900 border border-purple-500/40 rounded-2xl p-3 sm:p-4 shadow-xl space-y-3 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-purple-500/20">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="p-1.5 rounded-lg bg-purple-500/20 border border-purple-400/40 text-purple-300">
                  <Database className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-extrabold text-white tracking-wide">
                    🛰️ Ресурсы получения live-данных
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/30 text-purple-200 border border-purple-400/50">
                    GOD MODE
                  </span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[11px] text-cyan-300 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
                    <span>
                      {dataSourceConfig.activeSource === 'fonbet'
                        ? '🔴 Фонбет Live (РФ Линия)'
                        : dataSourceConfig.activeSource === '1xbet'
                        ? '🔷 1xBet Live (Роспись)'
                        : dataSourceConfig.activeSource === 'flashscore'
                        ? '⚡ Flashscore Live'
                        : dataSourceConfig.activeSource === 'sofascore'
                        ? '⚽ Sofascore (Relay)'
                        : dataSourceConfig.activeSource === 'sstats'
                        ? '📊 SStats API'
                        : dataSourceConfig.activeSource === 'public-feed'
                        ? '🌐 Public Feed (ESPN)'
                        : dataSourceConfig.activeSource === 'api-football'
                        ? '⚡ API-Football (v3)'
                        : dataSourceConfig.activeSource === 'football-data'
                        ? '🏆 Football-Data'
                        : dataSourceConfig.activeSource === 'webhook'
                        ? '🔌 Webhook'
                        : '🎮 Демо-генератор'}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      ({matches.length} матчей)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-lg font-mono border ${
                    dataSourceConfig.autoFailover
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                  title="Автоматическая ротация источника каждые 30 секунд при потере телеметрии"
                >
                  ⏱️ Сторож 30с: {dataSourceConfig.autoFailover ? 'ВКЛ' : 'ВЫКЛ'}
                </span>

                <button
                  type="button"
                  onClick={() => fetchLiveMatchesFromSource()}
                  disabled={isRefreshingMatches}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                  title="Принудительно синхронизировать текущую линию"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingMatches ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
                  <span>Обновить</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDataSourcesModalOpen(true)}
                  className="px-2.5 py-1 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                  title="Открыть полную панель ключей API и сетевой диагностики"
                >
                  <Globe className="h-3.5 w-3.5 text-purple-300" />
                  <span>Все настройки</span>
                </button>
              </div>
            </div>

            {/* Quick Clickable Source Chips / Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
              {[
                { id: 'flashscore', label: '⚡ Flashscore', tag: 'Парсер' },
                { id: 'fonbet', label: '🔴 Фонбет Live', tag: 'РФ Линия' },
                { id: '1xbet', label: '🔷 1xBet Live', tag: 'Роспись' },
                { id: 'sofascore', label: '⚽ Sofascore', tag: 'Relay' },
                { id: 'sstats', label: '📊 SStats API', tag: 'API' },
                { id: 'public-feed', label: '🌐 Public Feed', tag: 'ESPN' },
                { id: 'api-football', label: '⚡ API-Football', tag: 'v3' },
                { id: 'football-data', label: '🏆 Football-Data', tag: 'v4' },
                { id: 'webhook', label: '🔌 Webhook', tag: 'Ingest' },
                { id: 'simulated', label: '🎮 Демо', tag: 'Песочница' },
              ].map((src) => {
                const isActive = dataSourceConfig.activeSource === src.id;
                return (
                  <button
                    key={src.id}
                    type="button"
                    onClick={() => handleManualSwitchDataSource(src.id as DataSourceType)}
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? 'bg-cyan-500/25 border-cyan-400 text-white shadow-md shadow-cyan-950/40 ring-1 ring-cyan-400/50 font-bold'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:border-purple-500/50 hover:bg-slate-800/80'
                    }`}
                    title={`Переключить на ${src.label} (${src.tag})`}
                  >
                    {isActive ? (
                      <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-600 shrink-0" />
                    )}
                    <span>{src.label}</span>
                    <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${isActive ? 'bg-cyan-900/60 text-cyan-200' : 'bg-slate-950 text-slate-500'}`}>
                      {src.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Data Source Resiliency & Fallback Banner */}
        {dataSourceFallbackInfo && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping shrink-0" />
              <div>
                <span className="font-bold text-amber-300">Авто-отказоустойчивость: </span>
                <span>{dataSourceFallbackInfo.reason || `Основной источник недоступен. Автоматически подключен ${dataSourceFallbackInfo.actualSource}.`}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const newSource = (dataSourceFallbackInfo.actualSource.toLowerCase().includes('public') ? 'public-feed' : 'flashscore') as DataSourceType;
                  setDataSourceConfig((prev) => ({ ...prev, activeSource: newSource }));
                  setDataSourceFallbackInfo(null);
                }}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-lg font-semibold text-[11px] transition"
              >
                Закрепить этот источник
              </button>
              <button
                type="button"
                onClick={() => setIsDataSourcesModalOpen(true)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] transition"
              >
                ⚙️ Диагностика
              </button>
            </div>
          </div>
        )}

        {dataSourceError && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 space-y-2.5 text-xs text-rose-300">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-rose-200">Проблема с получением данных из внешнего источника</div>
                  <div className="mt-0.5 text-slate-300">{dataSourceError}</div>
                </div>
              </div>
              <button
                onClick={() => setDataSourceError(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-rose-500/20 transition"
              >
                ✕
              </button>
            </div>

            {isDeveloper && (
              <div className="pt-1 flex items-center gap-2 flex-wrap border-t border-rose-500/20">
                <span className="text-[11px] text-slate-400 font-semibold">Быстрое переключение на рабочий источник (Dev):</span>
                <button
                  type="button"
                  onClick={() => {
                    setDataSourceConfig((prev) => ({ ...prev, activeSource: 'flashscore' }));
                    fetchLiveMatchesFromSource('flashscore');
                    setDataSourceError(null);
                  }}
                  className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-lg font-bold text-[11px] transition"
                >
                  ⚡ Flashscore Live
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDataSourceConfig((prev) => ({ ...prev, activeSource: 'public-feed' }));
                    fetchLiveMatchesFromSource('public-feed');
                    setDataSourceError(null);
                  }}
                  className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 rounded-lg font-bold text-[11px] transition"
                >
                  🌐 Public Feed (Топ-Лиги)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDataSourceConfig((prev) => ({ ...prev, activeSource: 'simulated' }));
                    fetchLiveMatchesFromSource('simulated');
                    setDataSourceError(null);
                  }}
                  className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 rounded-lg font-bold text-[11px] transition"
                >
                  🎮 Демо-генератор
                </button>
                <button
                  type="button"
                  onClick={() => setIsDataSourcesModalOpen(true)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg font-medium text-[11px] transition"
                >
                  ⚙️ Все источники
                </button>
              </div>
            )}
          </div>
        )}

        {/* Novice Celebration Toast */}
        {noviceSuccessToast && (
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-400/50 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <div className="font-bold text-white text-xs sm:text-sm">
                  🚀 Пакет «ТОП-3 безопасные стратегии для новичка» активирован!
                </div>
                <div className="text-[11px] text-emerald-200/90 mt-0.5">
                  {noviceSuccessToast}
                </div>
              </div>
            </div>
            <button
              onClick={() => setNoviceSuccessToast(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              ✕
            </button>
          </div>
        )}

        {/* Live Proof-of-Win & Top-3 Algorithms Widget */}
        <div className="bg-gradient-to-br from-slate-900/95 via-slate-950/90 to-amber-950/20 border border-amber-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xl space-y-3.5 backdrop-blur-md">
          {/* Header row with badges and buttons */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                    {t('top3AlgorithmsTitle')}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {t('verifiedWinrate7d')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  100% честная статистика заходов без подделки данных. Делитесь победными карточками с коэффициентами в Telegram и VK!
                </p>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Novice 1-Click Button */}
              <button
                type="button"
                onClick={handleActivateNoviceSafeTop3}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 flex items-center gap-1.5 transition active:scale-95 border border-emerald-400/30"
                title="Включить в один клик ТОП-3 безопасные стратегии для новичка"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                <span>{t('noviceSafeTop3Btn')}</span>
              </button>

              {/* Open full Proof-of-Win audit modal */}
              <button
                type="button"
                onClick={() => {
                  triggerTgHaptic('medium');
                  setIsProofOfWinOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                <span>{t('proofOfWinCheckerBtn')}</span>
              </button>

              {/* Share in TG / VK button */}
              <button
                type="button"
                onClick={() => {
                  const sample = TOP_3_ALGORITHMS_WEEK[0];
                  handleShareProof({
                    id: sample.id,
                    strategyName: sample.name,
                    matchName: sample.recentSample.match,
                    league: 'Бундеслига • Топ-чемпионат',
                    minute: sample.recentSample.minute,
                    score: sample.recentSample.score,
                    market: sample.market,
                    odds: sample.recentSample.odds,
                    winRate: sample.winRate,
                    date: sample.recentSample.timeAgo,
                  });
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5 active:scale-95"
                title="Поделиться сигналом в Telegram / VK"
              >
                <Share2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>{t('shareCardBtn')}</span>
              </button>
            </div>
          </div>

          {/* Top 3 Algorithms Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
            {TOP_3_ALGORITHMS_WEEK.map((algo) => (
              <div
                key={algo.id}
                className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-amber-500/40 transition space-y-2 group shadow-sm"
              >
                <div className="flex items-center justify-between gap-1 text-xs">
                  <span className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                    <span className="text-amber-400 font-mono text-[11px] font-black">#{algo.rank}</span>
                    <span className="truncate">{algo.name}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-mono text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                    {algo.winRate}% WIN
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 line-clamp-1">
                  {t('marketLabel')}: <strong className="text-slate-300">{algo.market}</strong>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono p-1.5 rounded-xl bg-slate-900 border border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block text-[9px]">ROI</span>
                    <span className="font-bold text-emerald-400">+{algo.roi}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">Заходов</span>
                    <span className="font-bold text-slate-200">{algo.wonCount}/{algo.totalSignals}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">{t('streakLabel')}</span>
                    <span className="font-bold text-amber-300">{algo.streak} 🔥</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-slate-500 truncate text-[10px]">
                    {algo.recentSample.match}: {algo.recentSample.score}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleShareProof({
                        id: algo.id,
                        strategyName: algo.name,
                        matchName: algo.recentSample.match,
                        league: 'Топ-Лига',
                        minute: algo.recentSample.minute,
                        score: algo.recentSample.score,
                        market: algo.market,
                        odds: algo.recentSample.odds,
                        winRate: algo.winRate,
                        date: algo.recentSample.timeAgo,
                      })
                    }
                    className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 text-[10px] shrink-0"
                  >
                    <Share2 className="h-3 w-3" />
                    <span>Поделиться (кэф {algo.recentSample.odds})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Multi-Sport Switcher Bar (SportSignal AI) */}
        <div className="flex items-center justify-between gap-3 p-2 bg-slate-900/90 border border-slate-800 rounded-2xl backdrop-blur-md overflow-x-auto shadow-sm">
          <div className="flex items-center gap-1.5 flex-nowrap">
            {[
              { id: 'football', label: `⚽ ${t('sportFootball')}` },
              { id: 'hockey', label: `🏒 ${t('sportHockey')}` },
              { id: 'basketball', label: `🏀 ${t('sportBasketball')}` },
              { id: 'tennis', label: `🎾 ${t('sportTennis')}` },
              { id: 'volleyball', label: `🏐 ${t('sportVolleyball')}` },
              { id: 'table_tennis', label: `🏓 ${t('sportTableTennis')}` },
              { id: 'all', label: `🌐 ${t('sportAll')}` },
            ].map((sportItem) => {
              const isSelected = selectedSport === sportItem.id;
              const count = matches.filter((m) => sportItem.id === 'all' || (m.sport || inferSportFromMatch(m)) === sportItem.id).length;
              return (
                <button
                  key={sportItem.id}
                  type="button"
                  onClick={() => handleSelectSport(sportItem.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <span>{sportItem.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isSelected ? 'bg-black/30 text-emerald-200' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 pr-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium text-slate-400">{t('allSportsMonitored')}</span>
          </div>
        </div>

        {/* Tab 1: Live Matches & Detailed In-Play Analytics */}
        {activeTab === 'matches' && (
          <div id="matches-grid-container" ref={matchesGridRef} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative">
            {/* Matches list (5 cols) */}
            <div className={`${mobileMatchViewMode === 'detail' ? 'hidden' : 'block'} lg:block lg:col-span-5 space-y-3`}>
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="search-match-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition p-0.5 rounded"
                      title="Очистить поиск"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Индикатор количества найденных матчей в реальном времени с изолированным жизненным циклом и memoization */}
                <SearchMatchCounterBadge count={filteredMatches.length} language={language} />

                {/* Tracked matches only filter button */}
                <button
                  type="button"
                  onClick={toggleFilterTrackedOnly}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                    filterTrackedOnly
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm ring-1 ring-amber-500/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-300 hover:border-slate-700'
                  }`}
                  title={
                    filterTrackedOnly
                      ? 'Включен режим: фильтры и сигналы ТОЛЬКО по избранным матчам (нажмите для показа всех)'
                      : 'Фильтровать и получать сигналы только по избранным матчам'
                  }
                >
                  <Star className={`h-3.5 w-3.5 ${filterTrackedOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
                  <span className="hidden sm:inline">{t('favoritesFilter')}</span>
                  <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-slate-800 text-amber-300">
                    {trackedMatchIds.length}
                  </span>
                </button>

                {/* Sound Quick Toggle */}
                <button
                  type="button"
                  onClick={toggleSoundAlerts}
                  className={`p-2 rounded-lg border transition shrink-0 ${
                    isSoundAlertsEnabled
                      ? 'bg-slate-900 border-slate-800 text-emerald-400 hover:border-slate-700'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                  }`}
                  title={isSoundAlertsEnabled ? 'Звук включен (кликните для отключения)' : 'Звук выключен (кликните для включения)'}
                >
                  {isSoundAlertsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
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

              {/* Quick Search Chips & Active Search Mode Indicator */}
              <div className="flex items-center justify-between gap-2 px-1 text-[11px] text-slate-400">
                {searchQuery.trim() ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-500 font-medium">Фильтр:</span>
                    {searchQuery.startsWith('#') || searchQuery.toLowerCase().startsWith('id:') || /^m[-_]?\d+/i.test(searchQuery.trim()) ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono font-bold flex items-center gap-1 text-[10px]">
                        <Target className="h-3 w-3 text-emerald-400" />
                        ID: {searchQuery}
                      </span>
                    ) : searchQuery.trim().length <= 4 && /^[a-z0-9]+$/i.test(searchQuery.trim()) ? (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono font-bold flex items-center gap-1 text-[10px]">
                        <Hash className="h-3 w-3 text-cyan-400" />
                        Код: {searchQuery.trim().toUpperCase()}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[10px]">
                        &quot;{searchQuery.trim()}&quot;
                      </span>
                    )}
                    <span className="text-slate-500 text-[10px]">({filteredMatches.length})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                    <span className="text-[10px] text-slate-500 shrink-0 font-medium flex items-center gap-1">
                      <Hash className="h-3 w-3 text-slate-400" />
                      Поиск по коду/ID:
                    </span>
                    {[
                      { label: '#m-1', query: 'm-1', title: 'ID матча: m-1' },
                      { label: 'ARS', query: 'ARS', title: 'Код: Arsenal' },
                      { label: 'CHE', query: 'CHE', title: 'Код: Chelsea' },
                      { label: 'LIV', query: 'LIV', title: 'Код: Liverpool' },
                      { label: 'BAY', query: 'BAY', title: 'Код: Bayern Munich' },
                      { label: 'NAP', query: 'NAP', title: 'Код: Napoli' },
                      { label: 'RMA', query: 'RMA', title: 'Код: Real Madrid' },
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => {
                          triggerTgHaptic('light');
                          setSearchQuery(chip.query);
                        }}
                        className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-300 border border-slate-800 hover:border-slate-700 font-mono text-[10px] shrink-0 transition active:scale-95"
                        title={chip.title}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-[10px] text-slate-400 hover:text-emerald-400 font-medium shrink-0 ml-auto transition"
                  >
                    Сброс
                  </button>
                )}
              </div>

              {/* Quick Filter & Sort Buttons Panel directly below search-match-input */}
              <div
                id="matches-quick-filters-bar"
                className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar text-xs"
              >
                {[
                  {
                    id: 'all',
                    label: t('qfAll'),
                    icon: null,
                    count: quickFilterCounts.all,
                    activeClass: 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-950/50',
                  },
                  {
                    id: 'live',
                    label: t('qfLive'),
                    icon: Activity,
                    count: quickFilterCounts.live,
                    activeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/30',
                  },
                  {
                    id: 'prematch',
                    label: t('qfPrematch'),
                    icon: Clock,
                    count: quickFilterCounts.prematch,
                    activeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm ring-1 ring-blue-500/30',
                  },
                  {
                    id: 'over25',
                    label: t('qfOver25'),
                    icon: Flame,
                    count: quickFilterCounts.over25,
                    activeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm ring-1 ring-amber-500/30',
                  },
                  {
                    id: 'odds_drop',
                    label: t('qfOddsDrop'),
                    icon: TrendingDown,
                    count: quickFilterCounts.odds_drop,
                    activeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm ring-1 ring-rose-500/30',
                  },
                  {
                    id: 'corners',
                    label: t('qfCorners'),
                    icon: Flag,
                    count: quickFilterCounts.corners,
                    activeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm ring-1 ring-purple-500/30',
                  },
                  {
                    id: 'pressure',
                    label: t('qfPressure'),
                    icon: Zap,
                    count: quickFilterCounts.pressure,
                    activeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm ring-1 ring-cyan-500/30',
                  },
                ].map((btn) => {
                  const isSelected = matchQuickFilter === btn.id;
                  const Icon = btn.icon;
                  return (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => {
                        triggerTgHaptic('light');
                        // Автоматически очищаем поле поиска, чтобы избежать конфликтов фильтрации
                        if (searchQuery) {
                          setSearchQuery('');
                        }
                        setMatchQuickFilter(isSelected && btn.id !== 'all' ? 'all' : (btn.id as any));
                      }}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap active:scale-95 ${
                        isSelected
                          ? btn.activeClass
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                      title={`${btn.label}`}
                    >
                      {Icon && <Icon className={`h-3 w-3 ${isSelected ? 'animate-pulse' : ''}`} />}
                      <span>{btn.label}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                          isSelected
                            ? 'bg-black/40 text-white font-bold'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {btn.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Feed mode indicator bar */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${dataSourceConfig.activeSource !== 'simulated' ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
                  <span>
                    {isDeveloper ? (
                      <>
                        {t('feedActiveSource')}: <strong className="text-slate-200">{
                          dataSourceConfig.activeSource === 'fonbet' ? '🔴 Фонбет Live (Легальная РФ Линия • Реальный эфир)' :
                          dataSourceConfig.activeSource === '1xbet' ? '🔷 1xBet Live (Широкая роспись)' :
                          dataSourceConfig.activeSource === 'flashscore' ? '⚡ Flashscore Live (Парсер)' :
                          dataSourceConfig.activeSource === 'sstats' ? '📊 SStats.net API' :
                          dataSourceConfig.activeSource === 'sofascore' ? '⚽ Sofascore Live (Relay)' :
                          dataSourceConfig.activeSource === 'public-feed' ? '🌐 Реальный онлайн-фид (ESPN)' :
                          dataSourceConfig.activeSource === 'api-football' ? '⚡ API-Football (v3)' :
                          dataSourceConfig.activeSource === 'football-data' ? '🏆 Football-Data.org' :
                          dataSourceConfig.activeSource === 'webhook' ? '🔌 Пользовательский Webhook' : '🎮 Демо-симулятор'
                        }</strong>
                      </>
                    ) : (
                      <>
                        Линия: <strong className="text-slate-200">🛰️ Live Telemetry Core (Автоматическая балансировка)</strong>
                      </>
                    )}
                  </span>
                </div>
                {isDeveloper && (
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="text-[10px] text-purple-300 font-bold hidden sm:inline">[God Mode]</span>
                    <select
                      value={dataSourceConfig.activeSource}
                      onChange={(e) => handleManualSwitchDataSource(e.target.value as DataSourceType)}
                      className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-cyan-300 font-medium focus:outline-none focus:border-cyan-400 cursor-pointer"
                      title="Ручное переключение источника статистики (God Mode)"
                    >
                      <option value="flashscore">⚡ Flashscore</option>
                      <option value="sofascore">⚽ Sofascore</option>
                      <option value="fonbet">🔴 Фонбет</option>
                      <option value="1xbet">🔷 1xBet</option>
                      <option value="sstats">📊 SStats</option>
                      <option value="api-football">⚡ API-Football</option>
                      <option value="public-feed">🌐 Public Feed</option>
                      <option value="simulated">🎮 Демо</option>
                    </select>
                    <button
                      onClick={() => setIsDataSourcesModalOpen(true)}
                      className="text-cyan-400 hover:underline font-medium text-[10px] ml-1"
                    >
                      {t('feedChangeBtn')}
                    </button>
                  </div>
                )}
              </div>

              {/* Priority indicator banner: matches with triggered filters */}
              {(() => {
                const triggeredCount = filteredMatches.filter((m) => getMatchTriggeredCount(m) > 0).length;
                if (triggeredCount === 0) return null;
                return (
                  <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg px-3 py-2 flex items-center justify-between text-xs text-emerald-300">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span>
                        <strong>{triggeredCount} {triggeredCount === 1 ? 'match' : 'matches'}</strong> {t('priorityMatchesTop')}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                      {t('topOfListBadge')}
                    </span>
                  </div>
                );
              })()}

              <div className="space-y-2">
                {filteredMatches.map((match) => {
                  const isSelected = match.id === selectedMatchId;
                  const dangDiff = match.stats.dangerousAttacks[0] - match.stats.dangerousAttacks[1];
                  const isHighPressure = Math.abs(dangDiff) >= 25;
                  const analysis = calculatePressureAnalysis(match);
                  const matchSport = match.sport || inferSportFromMatch(match);
                  const { homeCode, awayCode, matchCode } = getMatchTeamCodes(match);
                  const matchingRules = filters.filter(
                    (f) =>
                      f.enabled &&
                      (!f.userId || f.userId === currentUser?.id) &&
                      (f.sport || inferSportFromRule(f)) === matchSport &&
                      evaluateFilterRule(match, f).matches
                  );

                  return (
                    <div
                      key={match.id}
                      id={`match-card-${match.id}`}
                      onClick={() => handleSelectMatch(match.id, true)}
                      className={`cursor-pointer rounded-xl border p-4 transition-all relative ${
                        isSelected
                          ? 'bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                          : trackedMatchIds.includes(match.id)
                          ? 'bg-slate-900/90 border-amber-500/50 hover:border-amber-500/80 shadow-lg shadow-amber-950/20'
                          : matchingRules.length > 0
                          ? 'bg-slate-900/80 border-emerald-500/40 hover:border-emerald-500/70 shadow-lg shadow-emerald-950/20'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Highlight badge for tracked match in favorites */}
                      {trackedMatchIds.includes(match.id) && (
                        <div className="mb-2.5 -mt-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-[11px] text-amber-300">
                          <span className="flex items-center gap-1.5 font-bold">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                            <span>{t('trackedMatchBanner')}</span>
                          </span>
                          <span className="text-[10px] font-mono font-bold bg-amber-950/80 text-amber-200 px-1.5 py-0.5 rounded border border-amber-500/40">
                            {t('favoritesBadge')}
                          </span>
                        </div>
                      )}

                      {/* Highlight badge for matches with triggered filters (at the top of list) */}
                      {matchingRules.length > 0 && (
                        <div className="mb-2.5 -mt-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-[11px] text-emerald-300">
                          <span className="flex items-center gap-1.5 font-bold truncate pr-2">
                            <Zap className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400 shrink-0 animate-pulse" />
                            <span className="shrink-0">{matchingRules.length === 1 ? t('triggeredFilterTitle') : t('triggeredFiltersTitle', { n: matchingRules.length })}</span>
                            <span className="text-emerald-100 font-semibold truncate">
                              {getStrategyCardDisplayName(matchingRules[0], isDeveloper, filters, language)}
                              {matchingRules.length > 1 ? ` +${matchingRules.length - 1}` : ''}
                            </span>
                          </span>
                          <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/90 px-1.5 py-0.5 rounded border border-emerald-500/40 shrink-0">
                            {t('topOfList')}
                          </span>
                        </div>
                      )}

                      {/* Prematch status banner (1-hour window indicator) */}
                      {match.status === 'PREMATCH' && (
                        <div className="mb-2 -mt-1 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-between text-[11px] text-sky-300">
                          <span className="flex items-center gap-1.5 font-semibold">
                            <Clock className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                            <span>
                              {match.startsInMinutes !== undefined && match.startsInMinutes <= 60
                                ? `${t('prematchAnalysis1h')} (${match.startsInMinutes} ${t('minute')})`
                                : t('prematchStartsIn', { min: match.startsInMinutes ?? 60 })}
                            </span>
                          </span>
                          {match.startTime && (
                            <span className="text-[10px] font-mono text-sky-300 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-500/20 shrink-0">
                              {t('matchStart', { time: match.startTime })}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span className="flex items-center gap-1.5 font-medium flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-emerald-300 border border-slate-700/60 shrink-0">
                            {matchSport === 'hockey' ? `🏒 ${t('sportHockey')}` :
                             matchSport === 'basketball' ? `🏀 ${t('sportBasketball')}` :
                             matchSport === 'tennis' ? `🎾 ${t('sportTennis')}` :
                             matchSport === 'volleyball' ? `🏐 ${t('sportVolleyball')}` :
                             matchSport === 'table_tennis' ? `🏓 ${t('sportTableTennis')}` : `⚽ ${t('sportFootball')}`}
                          </span>
                          <span>{match.countryCode}</span>
                          <span>{match.country}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-300 truncate max-w-[120px]">{match.league}</span>
                          <span className="text-slate-600">•</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerTgHaptic('light');
                              setSearchQuery(match.id);
                            }}
                            className="px-1.5 py-0.2 rounded bg-slate-800/90 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 font-mono text-[9px] font-bold border border-slate-700/60 transition"
                            title={`Нажмите для фильтрации списка по ID #${match.id}`}
                          >
                            #{match.id}
                          </button>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => toggleTrackMatch(match.id, e)}
                            className={`px-2 py-0.5 rounded border text-[10px] font-bold flex items-center gap-1 transition ${
                              trackedMatchIds.includes(match.id)
                                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50 shadow-sm'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-300 border-slate-700'
                            }`}
                            title={
                              trackedMatchIds.includes(match.id)
                                ? 'Favorites'
                                : 'Track'
                            }
                          >
                            <Star className={`h-2.5 w-2.5 ${trackedMatchIds.includes(match.id) ? 'fill-amber-400 text-amber-400' : ''}`} />
                            <span className="hidden sm:inline">{trackedMatchIds.includes(match.id) ? t('inFavorites') : t('favoriteTrack')}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAIAnalyst(match);
                            }}
                            className="px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold flex items-center gap-1 transition"
                            title="AI Analyst"
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
                            title="Create filter"
                          >
                            <Sliders className="h-2.5 w-2.5 text-emerald-400" />
                            {t('matchFilter')}
                          </button>
                          {match.status === 'PREMATCH' ? (
                            <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 font-mono font-bold text-[11px] border border-sky-500/30 flex items-center gap-1" title="Предматчевый статус: анализ за 1 час до начала">
                              <Clock className="h-2.5 w-2.5 text-sky-400" />
                              {match.startsInMinutes !== undefined ? `${match.startsInMinutes}м` : '60м'}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[11px] border border-emerald-500/20">
                              {match.status === 'FT' ? 'FT' : match.status === 'HT' ? 'HT' : `${match.minute}'`}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 font-mono">{match.source}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between my-2">
                        <div className="flex-1 space-y-1">
                          <div className="font-semibold text-sm text-white flex items-center justify-between pr-4">
                            <span className="flex items-center gap-1.5 truncate">
                              <span className="truncate">{match.homeTeam}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerTgHaptic('light');
                                  setSearchQuery(homeCode);
                                }}
                                className="text-[10px] font-mono font-bold text-slate-400 hover:text-cyan-300 bg-slate-800/90 hover:bg-cyan-950/60 px-1.5 py-0.2 rounded border border-slate-700/50 hover:border-cyan-500/40 transition shrink-0"
                                title={`Нажмите для фильтрации по коду команды ${homeCode}`}
                              >
                                {homeCode}
                              </button>
                            </span>
                            <span className="text-lg font-bold font-mono shrink-0">
                              {match.status === 'PREMATCH' ? '-' : match.score[0]}
                            </span>
                          </div>
                          <div className="font-semibold text-sm text-white flex items-center justify-between pr-4">
                            <span className="flex items-center gap-1.5 truncate">
                              <span className="truncate">{match.awayTeam}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerTgHaptic('light');
                                  setSearchQuery(awayCode);
                                }}
                                className="text-[10px] font-mono font-bold text-slate-400 hover:text-cyan-300 bg-slate-800/90 hover:bg-cyan-950/60 px-1.5 py-0.2 rounded border border-slate-700/50 hover:border-cyan-500/40 transition shrink-0"
                                title={`Нажмите для фильтрации по коду команды ${awayCode}`}
                              >
                                {awayCode}
                              </button>
                            </span>
                            <span className="text-lg font-bold font-mono shrink-0">
                              {match.status === 'PREMATCH' ? '-' : match.score[1]}
                            </span>
                          </div>
                        </div>

                        {/* Pressure badge */}
                        <div className="pl-3 border-l border-slate-800 flex flex-col items-center justify-center min-w-[65px]">
                          <span
                            className={`p-1.5 rounded-lg border text-xs font-bold font-mono flex items-center gap-1 ${
                              match.status === 'PREMATCH'
                                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                                : analysis.pressureIndex >= 75
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
                                : analysis.pressureIndex >= 50
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {match.status === 'PREMATCH' ? (
                              <>
                                <Clock className="h-3.5 w-3.5 text-sky-400" />
                                IPT {calculateMatchIPT(match).toFixed(1)}
                              </>
                            ) : (
                              <>
                                <Flame className="h-3.5 w-3.5" />
                                {analysis.pressureIndex}%
                              </>
                            )}
                          </span>
                          <span className="text-[9px] text-slate-400 mt-1 font-medium text-center">
                            {match.status === 'PREMATCH'
                              ? t('prematchAnalysis1h')
                              : analysis.goalProbability === 'EXTREME'
                              ? t('goalImminent')
                              : analysis.goalProbability === 'HIGH'
                              ? t('highPressure')
                              : analysis.goalProbability === 'MEDIUM'
                              ? t('mediumTempo')
                              : t('calmTempo')}
                          </span>
                        </div>
                      </div>

                      {/* Quick stat bar */}
                      {match.status === 'PREMATCH' ? (
                        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            1: <strong className="text-slate-200">@{match.odds?.home !== undefined ? match.odds.home.toFixed(2) : '-'}</strong> | 2: <strong className="text-slate-200">@{match.odds?.away !== undefined ? match.odds.away.toFixed(2) : '-'}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            {t('statOddsOver25')} <strong className="text-emerald-400 font-mono">@{match.odds?.over25 !== undefined ? match.odds.over25.toFixed(2) : '-'}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            IPT: <strong className="text-sky-300 font-mono">{calculateMatchIPT(match).toFixed(2)}</strong>
                          </span>
                        </div>
                      ) : (
                        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            {t('quickDangAttacks')} <strong className="text-slate-200">{match.stats.dangerousAttacks[0]} - {match.stats.dangerousAttacks[1]}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            {t('quickShots')} <strong className="text-slate-200">{match.stats.shotsOnTarget[0] + match.stats.shotsOffTarget[0]} - {match.stats.shotsOnTarget[1] + match.stats.shotsOffTarget[1]}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            {t('quickCorners')} <strong className="text-slate-200">{match.stats.corners[0]} - {match.stats.corners[1]}</strong>
                          </span>
                        </div>
                      )}

                      {/* Matching Filters badges on card */}
                      {matchingRules.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5 items-center">
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {t('triggeredFiltersOnMatch', { n: matchingRules.length })}
                          </span>
                          {matchingRules.map((rule) => (
                            <span
                              key={rule.id}
                              className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1"
                              title={rule.isPreset && !isDeveloper ? getStrategyCardDisplayName(rule, isDeveloper, filters, language) : rule.name}
                            >
                              {getStrategyCardDisplayName(rule, isDeveloper, filters, language)}
                              {rule.targetMarket && <span className="text-emerald-400/80 font-mono font-normal">[{rule.targetMarket}]</span>}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Dropping Odds / Smart Money Steam Move Badge on Card */}
                      {match.oddsDrop && (
                        <div className="mt-2 pt-2 border-t border-amber-500/25 flex items-center justify-between text-[11px] bg-amber-500/5 -mx-4 -mb-4 px-4 py-2 rounded-b-2xl">
                          <span className="flex items-center gap-1 text-amber-400 font-semibold truncate">
                            <TrendingDown className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">{t('oddsDropLabel')} {match.oddsDrop.marketName}</span>
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                            <span className="text-rose-400 font-bold bg-rose-500/10 px-1 py-0.5 rounded border border-rose-500/20">
                              -{match.oddsDrop.dropPercent}%
                            </span>
                            <span className="text-amber-300 font-bold bg-amber-500/15 px-1 py-0.5 rounded border border-amber-500/30">
                              {match.oddsDrop.moneyVolumePercent}% €
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Active selection indicator pointing right to statistics */}
                      {isSelected && isLargeScreen && inspectorAlignMode === 'opposite' && (
                        <div
                          className="hidden lg:flex absolute -right-3 top-5 z-10 h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/60 border-2 border-slate-900"
                          title="Статистика этого матча отображается прямо напротив"
                        >
                          <ChevronRight className="h-3.5 w-3.5 stroke-[3]" />
                        </div>
                      )}

                      {isSelected && (
                        <div className="mt-2.5 pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-400 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Crosshair className="h-3 w-3 text-emerald-400" />
                            <span>Статистика открыта напротив →</span>
                          </span>
                          <span className="lg:hidden text-[10px] text-slate-400">
                            (см. ниже в инспекторе)
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredMatches.length === 0 && (
                  <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                    <div className="text-3xl">
                      {filterTrackedOnly
                        ? '⭐'
                        : selectedSport === 'hockey' ? '🏒' :
                        selectedSport === 'basketball' ? '🏀' :
                        selectedSport === 'tennis' ? '🎾' :
                        selectedSport === 'volleyball' ? '🏐' :
                        selectedSport === 'table_tennis' ? '🏓' : '⚽'}
                    </div>
                    <div className="text-sm font-bold text-white">
                      {filterTrackedOnly
                        ? t('noTrackedMatches')
                        : selectedSport === 'all'
                        ? t('noMatchesSearch')
                        : `${t('noMatchesSearch')} (${
                            selectedSport === 'hockey' ? t('sportHockey') :
                            selectedSport === 'basketball' ? t('sportBasketball') :
                            selectedSport === 'tennis' ? t('sportTennis') :
                            selectedSport === 'volleyball' ? t('sportVolleyball') :
                            selectedSport === 'table_tennis' ? t('sportTableTennis') : t('sportFootball')
                          })`}
                    </div>
                    {filterTrackedOnly ? (
                      <button
                        type="button"
                        onClick={() => setFilterTrackedOnly(false)}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition"
                      >
                        {t('showAllMatches')}
                      </button>
                    ) : matchQuickFilter !== 'all' ? (
                      <button
                        type="button"
                        onClick={() => setMatchQuickFilter('all')}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-bold rounded-xl text-xs transition inline-flex items-center gap-1.5"
                      >
                        <span>Сбросить фильтр</span>
                        <span className="font-normal text-slate-400">
                          («{matchQuickFilter === 'live' ? 'Live' : matchQuickFilter === 'prematch' ? 'Прематч' : matchQuickFilter === 'over25' ? 'ТБ 2.5' : matchQuickFilter === 'odds_drop' ? 'Прогруз' : matchQuickFilter === 'corners' ? 'Угловые' : 'Штурм'}»)
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fetchLiveMatchesFromSource(dataSourceConfig.activeSource, selectedSport)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
                      >
                        🔄 {t('refreshMatches')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Match In-Depth Inspector (7 cols) */}
            <div
              id="match-inspector-column"
              ref={inspectorRef}
              style={
                isLargeScreen && inspectorAlignMode === 'opposite'
                  ? {
                      marginTop: `${inspectorOffset}px`,
                      transition: 'margin-top 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                    }
                  : isLargeScreen && inspectorAlignMode === 'sticky'
                  ? {
                      position: 'sticky',
                      top: '5.5rem',
                    }
                  : undefined
              }
              className={`${mobileMatchViewMode === 'list' ? 'hidden' : 'block'} lg:block lg:col-span-7 space-y-4`}
            >
              {selectedMatch && (
                <div id="match-inspector-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 sm:space-y-6 relative shadow-xl">
                  {/* Mobile Navigation Header: Back to Matches List */}
                  <div className="lg:hidden flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setMobileMatchViewMode('list')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 font-bold hover:bg-slate-700 active:scale-95 transition"
                    >
                      <ArrowLeft className="h-4 w-4 text-emerald-400" />
                      <span>{t('backToMatches')}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {selectedMatch.minute}'
                      </div>
                    </div>
                  </div>

                  {/* Position status & alignment bar (Desktop only) */}
                  <div className="hidden lg:flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2 text-slate-300 font-medium">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-slate-400">Панель:</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Crosshair className="h-3.5 w-3.5" />
                        {inspectorAlignMode === 'opposite' ? 'Напротив выбранного матча' : inspectorAlignMode === 'sticky' ? 'Закреплена (Sticky)' : 'Вверху страницы'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Button to quickly scroll back to the match card in the list */}
                      <button
                        type="button"
                        onClick={() => {
                          const card = document.getElementById(`match-card-${selectedMatch.id}`);
                          card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700 flex items-center gap-1 transition"
                        title="Прокрутить к карточке этого матча в списке"
                      >
                        <ArrowUp className="h-3 w-3 text-emerald-400" />
                        <span>К матчу в списке</span>
                      </button>

                      {/* Alignment modes */}
                      <div className="hidden sm:flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            setInspectorAlignMode('opposite');
                            updateInspectorPosition();
                          }}
                          className={`px-2 py-0.5 rounded-md font-medium transition ${
                            inspectorAlignMode === 'opposite'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          title="Статистика плавно позиционируется строго напротив выбранного матча"
                        >
                          Напротив
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setInspectorAlignMode('sticky');
                          }}
                          className={`px-2 py-0.5 rounded-md font-medium transition ${
                            inspectorAlignMode === 'sticky'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          title="Закрепить панель при прокрутке экрана"
                        >
                          Sticky
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setInspectorAlignMode('top');
                            setInspectorOffset(0);
                          }}
                          className={`px-2 py-0.5 rounded-md font-medium transition ${
                            inspectorAlignMode === 'top'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          title="Зафиксировать вверху"
                        >
                          Вверху
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Title Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                        <span className="text-base">{selectedMatch.countryCode}</span>
                        <span className="font-semibold text-slate-200">{selectedMatch.country}</span>
                        <span>•</span>
                        <span>{selectedMatch.league}</span>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(selectedMatch.id);
                            triggerTgHaptic('light');
                          }}
                          className="font-mono text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 px-1.5 py-0.5 rounded transition flex items-center gap-1"
                          title="Нажмите для копирования ID матча"
                        >
                          <Hash className="h-3 w-3" />
                          <span>ID: {selectedMatch.id}</span>
                        </button>
                        {(() => {
                          const { homeCode, awayCode, matchCode } = getMatchTeamCodes(selectedMatch);
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                setSearchQuery(matchCode);
                                triggerTgHaptic('light');
                              }}
                              className="font-mono text-[10px] font-bold text-cyan-300 hover:text-cyan-200 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 px-1.5 py-0.5 rounded transition flex items-center gap-1"
                              title="Нажмите для поиска по коду матча"
                            >
                              <Activity className="h-3 w-3" />
                              <span>{homeCode} vs {awayCode}</span>
                            </button>
                          );
                        })()}
                      </div>

                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <h2 className="text-xl sm:text-2xl font-black text-white break-words">
                          {selectedMatch.homeTeam} <span className="text-emerald-400">{selectedMatch.score[0]} : {selectedMatch.score[1]}</span> {selectedMatch.awayTeam}
                        </h2>
                        <button
                          id="match-inspector-share-result-btn"
                          type="button"
                          onClick={() => handleOpenShareResult(selectedMatch)}
                          disabled={isGeneratingShareImage}
                          className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shrink-0"
                          title="Поделиться брендированной карточкой счёта (Canvas API)"
                        >
                          {isGeneratingShareImage ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                          ) : (
                            <Share2 className="h-3.5 w-3.5 text-emerald-400" />
                          )}
                          <span>Поделиться счётом</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={(e) => toggleTrackMatch(selectedMatch.id, e)}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-[0.98] ${
                            trackedMatchIds.includes(selectedMatch.id)
                              ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50 shadow-sm'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border-slate-700'
                          }`}
                          title="Favorites"
                        >
                          <Star className={`h-3.5 w-3.5 ${trackedMatchIds.includes(selectedMatch.id) ? 'fill-amber-400 text-amber-400' : ''}`} />
                          <span className="truncate">{trackedMatchIds.includes(selectedMatch.id) ? t('inFavorites') : t('favoriteTrack')}</span>
                        </button>

                        <button
                          id="match-inspector-create-filter-btn"
                          onClick={() => handleCreateFilterFromMatch(selectedMatch)}
                          className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 hover:border-emerald-500/50 transition active:scale-[0.98]"
                          title="Create filter"
                        >
                          <Sliders className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{t('createFilterFromMatch')}</span>
                        </button>

                        <button
                          id="match-inspector-ai-btn"
                          onClick={() => handleOpenAIAnalyst(selectedMatch)}
                          className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-950/60 border border-indigo-400/30 transition hover:scale-[1.02] active:scale-[0.98]"
                          title="AI Analyst"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-indigo-200 animate-pulse shrink-0" />
                          <span className="truncate">{t('matchAiAnalyst')}</span>
                        </button>

                        <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                          {selectedMatch.minute} {t('minute')}
                        </div>
                      </div>
                      <div className="hidden sm:block text-[11px] text-slate-400">{t('activeProvider')}: {selectedMatch.source}</div>
                    </div>
                  </div>

                  {/* Last Match Event */}
                  {selectedMatch.lastEvent && (
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{t('lastKeyEvent')}</div>
                        <div className="text-xs text-slate-200 font-medium">{selectedMatch.lastEvent}</div>
                      </div>
                    </div>
                  )}

                  {/* Algorithmic Pressure & Filter Intelligence Inspector */}
                  {(() => {
                    const matchSport = selectedMatch.sport || inferSportFromMatch(selectedMatch);
                    const analysis = calculatePressureAnalysis(selectedMatch);
                    const userLaunchedFilters = filters.filter(
                      (f) =>
                        f.enabled &&
                        (!f.userId || f.userId === currentUser?.id) &&
                        (f.sport || inferSportFromRule(f)) === matchSport
                    );
                    const matchingRules = userLaunchedFilters.filter(
                      (f) => evaluateFilterRule(selectedMatch, f).matches
                    );
                    const evaluatedRules = userLaunchedFilters.map((rule) => ({
                      rule,
                      result: evaluateFilterRule(selectedMatch, rule),
                    }));

                    const sportLabel =
                      matchSport === 'hockey' ? '🏒 Хоккей' :
                      matchSport === 'basketball' ? '🏀 Баскетбол' :
                      matchSport === 'tennis' ? '🎾 Большой теннис' :
                      matchSport === 'volleyball' ? '🏐 Волейбол' :
                      matchSport === 'table_tennis' ? '🏓 Настольный теннис' : '⚽ Футбол';

                    return (
                      <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
                            <Cpu className="h-4 w-4 text-emerald-400" />
                            {t('pressureAnalysisTitle')} ({sportLabel})
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
                            {t('pressureGoalProbability')} {analysis.goalProbability} ({analysis.pressureIndex}/100)
                          </span>
                        </div>

                        {/* Pressure progress bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-400">{t('stormIndex')}</span>
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
                            <span>Фильтры для вида спорта «{sportLabel}»:</span>
                            <span className="text-emerald-400 font-mono font-bold">
                              {matchingRules.length} из {userLaunchedFilters.length} совпало
                            </span>
                          </div>
                          {userLaunchedFilters.length === 0 ? (
                            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center space-y-1.5">
                              <p className="text-xs text-slate-400 font-medium">Нет запущенных фильтров для вида спорта {sportLabel}</p>
                              <p className="text-[11px] text-slate-500">
                                Перейдите во вкладку «Фильтры» и активируйте стратегии для {sportLabel}.
                              </p>
                            </div>
                          ) : (
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
                                    <div className="font-semibold text-white text-[12px]">
                                      {rule.isPreset && !isDeveloper ? getStrategyCardDisplayName(rule, isDeveloper, filters) : rule.name}
                                    </div>
                                    {rule.targetMarket && (
                                      <div className="text-[10px] text-amber-400 font-mono">🎯 Исход: {rule.targetMarket}</div>
                                    )}
                                    {!result.matches && (!rule.isPreset || isDeveloper) && result.unmetCriteria && result.unmetCriteria.length > 0 && (
                                      <div className="text-[10px] text-slate-500 mt-0.5">
                                        Не выполнено: {result.unmetCriteria[0]}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {(!rule.isPreset || isDeveloper) ? (
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
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setLockedPresetNotice(rule);
                                      }}
                                      className="p-1 rounded bg-slate-850 hover:bg-slate-750 text-slate-400 hover:text-amber-300 border border-slate-700/60 transition"
                                      title="Параметры скрыты разработчиком"
                                    >
                                      <Lock className="h-3 w-3 text-amber-400" />
                                    </button>
                                  )}
                                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                                    result.matches ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                                  }`}>
                                    {result.matches ? 'СИГНАЛ' : 'НЕТ'}
                                  </span>
                                </div>
                              </div>
                            ))}
                            </div>
                          )}
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

                    {/* xG Model Summary */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="font-mono text-emerald-400 font-bold">{selectedMatch.stats.xg[0]} xG</span>
                        <span className="text-slate-400 font-normal">Ожидаемые голы (xG Баланс)</span>
                        <span className="font-mono text-blue-400 font-bold">{selectedMatch.stats.xg[1]} xG</span>
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

                  {/* Offensive Trend Intensity & Momentum Consistency Sparkline */}
                  <OffensiveTrendSparkline match={selectedMatch} />

                  {/* Recharts In-Depth xG Timeline & Attack Danger Dynamics */}
                  <MatchXgTimelineChart match={selectedMatch} />

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

                    {/* Dropping Odds & Money Flow (Smart Money Steam Moves) */}
                    {selectedMatch.oddsDrop && (
                      <div className="mt-3.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                            <TrendingDown className="h-4 w-4 text-amber-400" />
                            Прогруз линии / Smart Money (Steam Move)
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            {selectedMatch.oddsDrop.bookmaker || 'Биржа Betfair / Pinnacle'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <div className="text-[10px] text-slate-400">Исход с прогрузом</div>
                            <div className="text-xs font-bold text-white mt-0.5 truncate">{selectedMatch.oddsDrop.marketName}</div>
                          </div>
                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <div className="text-[10px] text-slate-400">Падение кэфа</div>
                            <div className="text-xs font-bold text-rose-400 font-mono mt-0.5">
                              -{selectedMatch.oddsDrop.dropPercent}% ({selectedMatch.oddsDrop.initialOdds} → {selectedMatch.oddsDrop.currentOdds})
                            </div>
                          </div>
                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <div className="text-[10px] text-slate-400">Доля денег в рынке</div>
                            <div className="text-xs font-bold text-amber-400 font-mono mt-0.5">
                              {selectedMatch.oddsDrop.moneyVolumePercent}% пула
                            </div>
                          </div>
                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <div className="text-[10px] text-slate-400">Объем ставок</div>
                            <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                              {selectedMatch.oddsDrop.moneyVolumeAmountEur
                                ? `€${selectedMatch.oddsDrop.moneyVolumeAmountEur.toLocaleString('ru-RU')}`
                                : 'Крупный пул'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span>Обнаружено на {selectedMatch.oddsDrop.detectedAtMinute || selectedMatch.minute}' мин</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFilter({
                                id: `custom-steam-${Date.now()}`,
                                name: `📉 Прогруз на ${selectedMatch.oddsDrop?.marketName}`,
                                description: `Отслеживание падения кэфа от ${selectedMatch.oddsDrop?.dropPercent}% при прогрузе денег от ${selectedMatch.oddsDrop?.moneyVolumePercent}%`,
                                category: 'odds_drop',
                                ruleType: 'LIVE',
                                enabled: true,
                                minMinute: 1,
                                maxMinute: 90,
                                scoreCondition: 'ANY',
                                minOddsDropPercent: selectedMatch.oddsDrop?.dropPercent,
                                minMoneyVolumePercent: selectedMatch.oddsDrop?.moneyVolumePercent,
                                oddsDropMarket: selectedMatch.oddsDrop?.market,
                                targetMarket: selectedMatch.oddsDrop?.marketName,
                                telegramEnabled: true,
                                color: 'amber',
                              });
                              setIsFilterModalOpen(true);
                            }}
                            className="text-amber-400 hover:text-amber-300 font-semibold underline flex items-center gap-1"
                          >
                            Создать фильтр под этот прогруз →
                          </button>
                        </div>
                      </div>
                    )}
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
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setFilterViewMode('matrix')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      filterViewMode === 'matrix'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Тактическая матрица</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterViewMode('cards')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      filterViewMode === 'cards'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span>Карточки ({filters.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterViewMode('prematch')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      filterViewMode === 'prematch'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Прематч дня</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('education')}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
                  title="Обучение: интерактивный гид по фильтрам, карточкам и песочница"
                >
                  <GraduationCap className="h-4 w-4 text-amber-400" />
                  <span>Гид & Обучение</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAISynthesizerOpen(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:opacity-90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 border border-emerald-400/30 transition active:scale-95"
                  title="ИИ-Синтезатор: перевести скриншот стратегии, текстовый файл или заметки в готовую карточку (без VPN)"
                >
                  <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                  <span>ИИ-Синтезатор карточек</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-extrabold font-mono">
                    VIP / MAX
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleActivateNoviceSafeTop3}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/40 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition active:scale-95"
                  title="Быстрый запуск для новичка: включить ТОП-3 безопасные стратегии с высокой проходимостью"
                >
                  <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                  <span>🚀 Я новичок: ТОП-3</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingFilter(createCleanBlankFilter(currentUser.id));
                    setIsFilterModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-teal-300 border border-teal-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                  title="Открыть абсолютно чистый бланк для настройки алгоритма с нуля"
                >
                  <FileText className="h-4 w-4 text-teal-400" />
                  Чистый бланк
                </button>

                <button
                  onClick={() => {
                    setEditingFilter(createCleanBlankFilter(currentUser.id));
                    setIsFilterModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  Создать алгоритм
                </button>

                <button
                  type="button"
                  onClick={handleStopAllFilters}
                  disabled={filters.filter((f) => f.enabled).length === 0}
                  className="px-3.5 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  title="Остановить все активные фильтры"
                >
                  <PowerOff className="h-3.5 w-3.5 text-rose-400" />
                  <span>Остановить все ({filters.filter((f) => f.enabled).length})</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartAllFilters}
                  disabled={filters.filter((f) => !f.enabled).length === 0}
                  className="px-3.5 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  title="Запустить все фильтры в работу"
                >
                  <Play className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400" />
                  <span>Запустить все</span>
                </button>

                <button
                  type="button"
                  onClick={handleRestoreAllStrategies}
                  title="Восстановить все 50+ заводских алгоритмов платформы"
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-cyan-600/20 hover:from-emerald-600/30 hover:to-cyan-600/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Восстановить все стратегии (50+)</span>
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

            {/* AI Synthesizer Callout Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-emerald-950/20 to-slate-950 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shrink-0">
                  <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      ИИ-Генератор карточек стратегий по фото, заметкам или файлу
                    </h4>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono border border-emerald-500/30 font-bold">
                      100% Без VPN в РФ
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Загрузите скриншот стратегии из Telegram, текстовый файл или опишите мысли своими словами — ИИ мгновенно настроит фильтр (Сбер GigaChat, YandexGPT или встроенный движок)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAISynthesizerOpen(true)}
                className="self-start md:self-center whitespace-nowrap px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition active:scale-95"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>Запустить ИИ-Синтез</span>
              </button>
            </div>

            {filterViewMode === 'matrix' ? (
              <ScannerMatrixFilterView
                filters={filters}
                onSaveFilter={handleSaveFilter}
                onDeleteFilter={handleDeleteFilter}
                onStopAllFilters={handleStopAllFilters}
                onStartAllFilters={handleStartAllFilters}
                isMonitoringActive={isMonitoringActive}
                onToggleMonitoring={() => setIsMonitoringActive(!isMonitoringActive)}
                userBots={currentUser?.telegramBots}
                currentUserId={currentUser?.id}
                liveMatches={matches}
                selectedSport={selectedSport}
                onOpenEducation={() => setActiveTab('education')}
                isPaidUser={isPaidUser}
                isDeveloper={isDeveloper}
                onUpgradePlan={() => setActiveTab('cabinet')}
                onRestoreAllStrategies={handleRestoreAllStrategies}
              />
            ) : filterViewMode === 'prematch' ? (
              <PrematchScannerView
                matches={matches}
                filters={filters}
                selectedSport={selectedSport}
                userBots={currentUser?.telegramBots}
                onOpenCreateFilter={(initial) => {
                  setEditingFilter({
                    id: `custom-prematch-${Date.now()}`,
                    name: initial?.name || 'Прематч: Анализ дня',
                    description: initial?.description || 'Отбор матчей по котировкам и сериям',
                    category: 'goals',
                    ruleType: 'PREMATCH',
                    sport: (selectedSport === 'all' ? 'football' : selectedSport) as SportType,
                    enabled: true,
                    minMinute: 0,
                    maxMinute: 10,
                    scoreCondition: 'ANY',
                    prematchAnalysisEnabled: true,
                    prematchAlertDailyTime: initial?.prematchAlertDailyTime || '10:00',
                    prematchMinOddsOver25: initial?.prematchMinOddsOver25 ?? 1.55,
                    prematchMaxOddsOver25: initial?.prematchMaxOddsOver25 ?? 1.95,
                    prematchH2hOver25MinHits: initial?.prematchH2hOver25MinHits ?? 3,
                    prematchTeam1Over25MinHits: 3,
                    prematchTeam2Over25MinHits: 3,
                    prematchNotifyOnceDaily: true,
                    targetMarket: initial?.targetMarket || 'ТБ 2.5',
                    telegramEnabled: true,
                    color: 'sky',
                  });
                  setIsFilterModalOpen(true);
                }}
                onSendTelegramAlert={async (text, botId) => {
                  await sendTelegramMessage(text, true, { botToken: botId });
                  return true;
                }}
              />
            ) : (
              <>
                {/* Quick Strategy Templates Banner */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  {isPaidUser
                    ? 'Быстрый старт: популярные шаблоны алгоритмов для настройки'
                    : 'Конструктор алгоритмов: создание с чистого бланка'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {isPaidUser
                    ? 'Кликните по шаблону для открытия конструктора с готовыми параметрами'
                    : 'На бесплатном тарифе настраивайте фильтр с чистого бланка (шаблоны входят в PRO/VIP)'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {/* Clean Slate Button for everyone, highlighted for free users */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingFilter(createCleanBlankFilter(currentUser.id));
                    setIsFilterModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                  title="Открыть чистый бланк и настроить собственный алгоритм с нуля"
                >
                  <FileText className="h-3.5 w-3.5 text-emerald-400" />
                  <span>📄 Чистый бланк (с нуля)</span>
                </button>

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
                  {
                    name: '📉 Smart Money / Прогруз',
                    desc: 'Падение кэфа ≥15%, пул ≥70%',
                    preset: {
                      name: '📉 Smart Money: Падение кэфа ≥15% (Деньги ≥70%)',
                      description: 'Фиксация крупного денежного прогруза на исход: резкое падение кэфа от 15% при доле денег от 70%',
                      category: 'odds_drop' as FilterCategory,
                      minMinute: 1,
                      maxMinute: 90,
                      scoreCondition: 'ANY' as ScoreCondition,
                      minOddsDropPercent: 15,
                      minMoneyVolumePercent: 70,
                      oddsDropMarket: 'ANY' as const,
                      targetMarket: 'Исход с прогрузом (Steam Move)',
                      color: 'amber',
                    },
                  },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (!isPaidUser) {
                        setEditingFilter(createCleanBlankFilter(currentUser.id));
                        setIsFilterModalOpen(true);
                        return;
                      }
                      if (!isDeveloper) {
                        // Для платных пользователей готовые шаблоны добавляются как защищённые пресеты в мониторинг (без открытия внутренних формул)
                        const cleanName = item.name.replace(/^[^\wа-яА-ЯёЁ]+/, '').trim();
                        const existing = filters.find((f) => f.name.includes(cleanName));
                        if (existing) {
                          setFilters((prev) => prev.map((f) => f.id === existing.id ? { ...f, enabled: true } : f));
                          setLockedPresetNotice(existing);
                        } else {
                          const newPreset: FilterRule = {
                            id: `preset-${Date.now()}`,
                            enabled: true,
                            telegramEnabled: true,
                            isPreset: true,
                            verifiedPassRate: '98% реальных матчей',
                            ...item.preset,
                            userId: currentUser.id,
                          };
                          setFilters((prev) => [newPreset, ...prev]);
                          setLockedPresetNotice(newPreset);
                        }
                        return;
                      }
                      setEditingFilter({
                        id: `custom-${Date.now()}`,
                        enabled: true,
                        telegramEnabled: true,
                        isPreset: false,
                        ...item.preset,
                      });
                      setIsFilterModalOpen(true);
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm ${
                      !isPaidUser
                        ? 'bg-slate-950/60 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-300 hover:border-amber-500/40'
                        : 'bg-slate-950 hover:bg-slate-800 border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-white'
                    }`}
                  >
                    {!isPaidUser && <Lock className="h-3 w-3 text-amber-400" />}
                    <span className="font-semibold">{item.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {!isPaidUser ? 'PRO' : `(${item.desc})`}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Filter Controller Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                  filters.filter((f) => f.enabled).length > 0
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-950/40'
                    : 'bg-slate-800/80 border-slate-700 text-slate-500'
                }`}>
                  {filters.filter((f) => f.enabled).length}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">
                      Запущено в мониторинг: {filters.filter((f) => f.enabled).length} из {filters.length} фильтров
                    </span>
                    {filters.filter((f) => f.enabled).length > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                        СИГНАЛЫ АКТИВНЫ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                        Остановлены
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Работают и отправляют сигналы только включенные вами фильтры. Выключенные фильтры не создают спама и не присылают уведомлений.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={handleStopAllFilters}
                  disabled={filters.filter((f) => f.enabled).length === 0}
                  className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Остановить все активные фильтры"
                >
                  <PowerOff className="h-3.5 w-3.5" />
                  Остановить все ({filters.filter((f) => f.enabled).length})
                </button>

                <button
                  type="button"
                  onClick={handleStartAllFilters}
                  disabled={filters.filter((f) => !f.enabled).length === 0}
                  className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Запустить все фильтры"
                >
                  <Play className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400" />
                  Запустить все
                </button>

                <button
                  onClick={() => setActiveFilterCategory((prev) => prev === 'top_stable' ? 'all' : 'top_stable')}
                  className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    activeFilterCategory === 'top_stable'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border-amber-300 font-extrabold shadow-md shadow-amber-950/40'
                      : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                  title="Показать только 5 самых стабильных стратегий по результатам реальных матчей"
                >
                  <Award className="h-3.5 w-3.5 text-amber-400" />
                  ТОП-5 Стабильных
                </button>

                <button
                  onClick={() => setActiveFilterCategory('active')}
                  className={`px-3 py-2 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                    activeFilterCategory === 'active'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-md shadow-emerald-950/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Только запущенные
                </button>

                {/* Export / Import Filters JSON */}
                <button
                  type="button"
                  onClick={handleExportFiltersJson}
                  className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  title="Экспортировать все стратегии в файл JSON"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Экспорт JSON</span>
                </button>

                <label
                  className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Импортировать сохраненные стратегии из файла JSON"
                >
                  <Upload className="h-3.5 w-3.5 text-sky-400" />
                  <span>Импорт JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportFiltersJson}
                  />
                </label>
              </div>
            </div>

            {/* Top 5 Stable Strategies Banner */}
            <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-yellow-950/30 border border-amber-500/40 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-amber-950/20">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/30 to-yellow-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
                  <Award className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-white tracking-tight">
                      🏆 5 самых стабильных стратегий по реальным матчам
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                      Проходимость 94–100%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Отобраны на основе ретроспективного анализа 1 200+ завершенных матчей (штурм угловых в концовке, фланговый штурм, прессинг 70-90'). Кэфы от 1.72 до 1.85.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setFilters((prev) =>
                      prev.map((f) => (f.isTopStable ? { ...f, enabled: true } : f))
                    );
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-amber-950/50 flex items-center gap-1.5 transition active:scale-95"
                >
                  <Play className="h-3.5 w-3.5 fill-slate-950" />
                  Запустить все ТОП-5
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilterCategory((prev) => prev === 'top_stable' ? 'all' : 'top_stable')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                    activeFilterCategory === 'top_stable'
                      ? 'bg-amber-500/30 text-amber-200 border-amber-400'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  {activeFilterCategory === 'top_stable' ? 'Показать все' : 'Показать ТОП-5'}
                </button>
              </div>
            </div>

            {/* Multi-Sport Switcher Bar for Strategies */}
            <div className="flex items-center justify-between gap-3 p-2 bg-slate-900/90 border border-slate-800 rounded-2xl backdrop-blur-md overflow-x-auto shadow-sm">
              <div className="flex items-center gap-1.5 flex-nowrap">
                {[
                  { id: 'all', label: '🌐 Все виды спорта' },
                  { id: 'football', label: '⚽ Футбол' },
                  { id: 'hockey', label: '🏒 Хоккей' },
                  { id: 'basketball', label: '🏀 Баскетбол' },
                  { id: 'tennis', label: '🎾 Большой теннис' },
                  { id: 'volleyball', label: '🏐 Волейбол' },
                  { id: 'table_tennis', label: '🏓 Настольный теннис' },
                ].map((sportItem) => {
                  const isSelected = selectedSport === sportItem.id;
                  const count = filters.filter((f) => sportItem.id === 'all' || (f.sport || 'football') === sportItem.id).length;
                  return (
                    <button
                      key={sportItem.id}
                      type="button"
                      onClick={() => setSelectedSport(sportItem.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
                        isSelected
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/50'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <span>{sportItem.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isSelected ? 'bg-black/30 text-emerald-200' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Filter Chips & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'all', label: t('catAll'), icon: '⚡' },
                    { id: 'top_stable', label: t('catTopStable'), icon: '🏆' },
                    { id: 'active', label: t('catActive'), icon: '🟢' },
                    { id: 'stopped', label: t('catStopped'), icon: '⚪' },
                    { id: 'goals', label: t('catGoals'), icon: '⚽' },
                    { id: 'corners', label: t('catCorners'), icon: '🚩' },
                    { id: 'comeback', label: t('catComeback'), icon: '🎯' },
                    { id: 'halftime', label: t('catHalftime'), icon: '⏱️' },
                    { id: 'pressure', label: t('catPressure'), icon: '🔥' },
                    { id: 'odds_drop', label: t('catOddsDrop'), icon: '📉' },
                    { id: 'cards', label: t('catCards'), icon: '🟥' },
                    { id: 'custom', label: t('catCustom'), icon: '🛠️' },
                  ] as Array<{ id: FilterCategory | 'top_stable'; label: string; icon: string }>
                ).map((cat) => {
                  const count =
                    cat.id === 'all'
                      ? filters.length
                      : cat.id === 'top_stable'
                      ? filters.filter((f) => f.isTopStable).length
                      : cat.id === 'active'
                      ? filters.filter((f) => f.enabled).length
                      : cat.id === 'stopped'
                      ? filters.filter((f) => !f.enabled).length
                      : cat.id === 'custom'
                      ? filters.filter((f) => !f.isPreset).length
                      : filters.filter((f) => f.category === cat.id).length;

                  const isSelected = activeFilterCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveFilterCategory(cat.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        isSelected
                          ? cat.id === 'top_stable'
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold shadow-md shadow-amber-950/40'
                            : 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40'
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
                  placeholder={t('searchFiltersPlaceholder')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Grid of Strategy Cards */}
            {(() => {
              const filteredList = filters.filter((rule) => {
                const matchSport =
                  selectedSport === 'all' || (rule.sport || 'football') === selectedSport;

                const matchCategory =
                  activeFilterCategory === 'all'
                    ? true
                    : (activeFilterCategory as string) === 'top_stable'
                    ? Boolean(rule.isTopStable)
                    : activeFilterCategory === 'active'
                    ? rule.enabled
                    : activeFilterCategory === 'stopped'
                    ? !rule.enabled
                    : activeFilterCategory === 'custom'
                    ? !rule.isPreset
                    : rule.category === activeFilterCategory;

                const cardTitle = getStrategyCardDisplayName(rule, isDeveloper, filters);
                const matchQuery =
                  !filterSearchQuery.trim() ||
                  cardTitle.toLowerCase().includes(filterSearchQuery.toLowerCase()) ||
                  (isDeveloper && rule.name.toLowerCase().includes(filterSearchQuery.toLowerCase())) ||
                  (isDeveloper && rule.description.toLowerCase().includes(filterSearchQuery.toLowerCase())) ||
                  (rule.targetMarket && rule.targetMarket.toLowerCase().includes(filterSearchQuery.toLowerCase()));

                return matchSport && matchCategory && matchQuery;
              });

              if (filteredList.length === 0) {
                return (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
                    <Filter className="h-10 w-10 text-slate-600 mx-auto" />
                    <div>
                      <h4 className="text-base font-bold text-white mb-1">
                        {filters.length === 0 ? 'Все стратегии были удалены' : t('noFiltersInCategory')}
                      </h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        {filters.length === 0
                          ? 'Нажмите кнопку ниже, чтобы вернуть полный каталог из 50+ заводских алгоритмов (ТБ, угловые, карточки, Smart Money, синергии).'
                          : 'В выбранной категории или строке поиска нет подходящих стратегий.'}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      {filters.length > 0 && (
                        <button
                          onClick={() => {
                            setActiveFilterCategory('all');
                            setFilterSearchQuery('');
                          }}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
                        >
                          {t('allStrategiesBtn')}
                        </button>
                      )}
                      <button
                        onClick={handleRestoreAllStrategies}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition active:scale-95"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Восстановить все стратегии (50+)</span>
                      </button>
                    </div>
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
                        className={`bg-slate-900 border rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all relative ${
                          filter.isTopStable ? 'ring-1 ring-amber-500/50 shadow-md shadow-amber-950/30' : ''
                        } ${
                          filter.enabled
                            ? hasLiveMatches
                              ? 'border-emerald-500/70 shadow-lg shadow-emerald-950/30'
                              : filter.isTopStable
                              ? 'border-amber-500/60 bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/15'
                              : 'border-slate-800 hover:border-slate-700'
                            : hasLiveMatches
                            ? 'border-amber-500/40 bg-slate-900/90'
                            : 'border-slate-800/60 opacity-60'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Top row */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {filter.sport && filter.sport !== 'football' && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  {filter.sport === 'hockey' ? `🏒 ${t('sportHockey')}` : filter.sport === 'basketball' ? `🏀 ${t('sportBasketball')}` : filter.sport === 'tennis' ? `🎾 ${t('sportTennis')}` : filter.sport === 'volleyball' ? `🏐 ${t('sportVolleyball')}` : `🏓 ${t('sportTableTennis')}`}
                                </span>
                              )}
                              {filter.category && (
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800/80 text-emerald-400 border border-emerald-500/20">
                                  {filter.category}
                                </span>
                              )}
                              {(!filter.isPreset || isDeveloper) ? (
                                <>
                                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                    {filter.ruleType === 'PREMATCH' ? 'PREMATCH' : `${filter.minMinute}' - ${filter.maxMinute}'`}
                                  </span>
                                  {filter.exactScore && (
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                      {t('exactScoreLabel', { score: filter.exactScore })}
                                    </span>
                                  )}
                                  {filter.exactTotalGoals !== undefined && (
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                      Ровно {filter.exactTotalGoals} г.
                                    </span>
                                  )}
                                  {filter.exactHomeGoals !== undefined && (
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                      К1: {filter.exactHomeGoals} г.
                                    </span>
                                  )}
                                  {filter.exactAwayGoals !== undefined && (
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                      К2: {filter.exactAwayGoals} г.
                                    </span>
                                  )}
                                  {filter.ruleType === 'PREMATCH' && (
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                      {filter.prematchAlertDailyTime || '10:00'} (1 р/день)
                                    </span>
                                  )}
                                  {filter.isPreset ? (
                                    <>
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono font-bold">
                                        👨‍💻 Dev Пресет
                                      </span>
                                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        {t('passRateLabel')} {filter.verifiedPassRate || '94–100%'}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                                      Авторский
                                    </span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                    <Lock className="h-2.5 w-2.5 text-amber-400" />
                                    {t('embeddedPlatformAlgorithm')}
                                  </span>
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    {t('passRateLabel')} {filter.verifiedPassRate || '94–100%'}
                                  </span>
                                </>
                              )}
                            </div>

                            <button
                              onClick={() =>
                                setFilters((prev) =>
                                  prev.map((f) => (f.id === filter.id ? { ...f, enabled: !f.enabled } : f))
                                )
                              }
                              className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
                                filter.enabled
                                  ? 'bg-emerald-500 text-slate-950 border border-emerald-400 hover:bg-emerald-400 shadow-md shadow-emerald-950/40'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                              }`}
                            >
                              {filter.enabled ? (
                                <>
                                  <span className="h-2 w-2 rounded-full bg-slate-950 animate-pulse" />
                                  {t('statusRunning')}
                                </>
                              ) : (
                                <>
                                  <Play className="h-3 w-3 text-emerald-400 fill-emerald-400" />
                                  {t('statusStart')}
                                </>
                              )}
                            </button>
                          </div>

                          {/* Rule Title & Target Market */}
                          <div>
                            {filter.isTopStable && (
                              <div className="mb-2.5 flex items-center justify-between gap-1.5 p-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-transparent border border-amber-500/40 shadow-sm">
                                <span className="flex items-center gap-1.5 text-xs font-black text-amber-300 uppercase tracking-wide">
                                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                                  ТОП-{filter.stabilityRank || 1} СТАБИЛЬНЫХ
                                </span>
                                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-amber-500/25 text-amber-200 border border-amber-400/40">
                                  {filter.verifiedPassRate || '100% реальных матчей'}
                                </span>
                              </div>
                            )}
                            <div>
                              <h3 className="text-base font-black text-white leading-tight tracking-wide">
                                {getStrategyCardDisplayName(filter, isDeveloper, filters, language)}
                              </h3>
                              {filter.isPreset && !isDeveloper && (
                                <span className="text-[10px] text-amber-300 font-semibold flex items-center gap-1 mt-0.5">
                                  <ShieldCheck className="h-3 w-3 text-amber-400" />
                                  {t('embeddedPlatformAlgorithm')}
                                </span>
                              )}
                            </div>
                            {(!filter.isPreset || isDeveloper) ? (
                              filter.description ? (
                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{filter.description}</p>
                              ) : null
                            ) : null}

                            {/* Expected forecast pick */}
                            <div className="mt-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                                <Target className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                <span>{t('expectedForecast')}</span>
                              </div>
                              <div className="text-xs sm:text-sm font-black text-amber-200">
                                {filter.targetMarket || 'Live Pick'}
                              </div>
                            </div>
                          </div>

                          {/* Live match indicator */}
                          <div className="pt-1 space-y-1.5">
                            {filter.enabled ? (
                              hasLiveMatches ? (
                                <div className="px-3 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 font-semibold space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 font-bold">
                                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                                      {t('triggeredJustNow', { n: matchingLiveMatches.length })}
                                    </span>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/25 text-emerald-200 border border-emerald-500/40 font-bold">
                                      {t('liveSignalBadge')}
                                    </span>
                                  </div>
                                  <div className="font-mono text-white text-xs pl-3.5 border-l-2 border-emerald-500/40">
                                    {matchingLiveMatches.map((m) => `${m.homeTeam} vs ${m.awayTeam} (${m.minute}', ${m.score[0]}:${m.score[1]})`).join(' • ')}
                                  </div>
                                </div>
                              ) : (
                                <div className="px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between">
                                  <span className="flex items-center gap-1.5">
                                    <Clock className="h-3 w-3 text-slate-400" />
                                    {t('waitingLiveCriteria')}
                                  </span>
                                  <span className="text-emerald-400 font-mono text-[9px]">{t('statusActiveBadge')}</span>
                                </div>
                              )
                            ) : (
                              <div className="px-2.5 py-1.5 rounded-lg bg-slate-950/40 border border-slate-800/60 text-[10px] text-slate-400 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <span className={`h-1.5 w-1.5 rounded-full ${hasLiveMatches ? 'bg-amber-400 animate-ping' : 'bg-slate-600'}`} />
                                  {hasLiveMatches ? (
                                    <span className="text-amber-300 font-bold">
                                      {t('triggeredInLiveMatches', { n: matchingLiveMatches.length })}
                                    </span>
                                  ) : (
                                    t('userStoppedStatus')
                                  )}
                                </span>
                                <span className="text-slate-500 font-mono text-[9px]">
                                  {hasLiveMatches ? t('readyForSignalStatus') : t('signalsDisabledStatus')}
                                </span>
                              </div>
                            )}

                            {/* Triggered signals history */}
                            {signals.filter((s) => s.ruleId === filter.id).length > 0 && (
                              <div className="px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300 flex items-center justify-between">
                                <span className="flex items-center gap-1.5 truncate">
                                  <Zap className="h-3 w-3 text-emerald-400 shrink-0" />
                                  <span className="text-slate-400">{t('triggeredSignalsHistory')}</span>
                                  <span className="text-white font-medium truncate">
                                    {signals
                                      .filter((s) => s.ruleId === filter.id)
                                      .slice(0, 2)
                                      .map((s) => `${s.matchName} (${s.minute}', ${s.score})`)
                                      .join(' • ')}
                                  </span>
                                </span>
                                <span className="text-emerald-400 font-mono text-[10px] shrink-0 font-bold ml-1">
                                  {signals.filter((s) => s.ruleId === filter.id).length}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Conditions Grid OR Protected Proprietary View */}
                          {filter.isPreset && !isDeveloper ? (
                            <div className="pt-1.5 space-y-2">
                              <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 space-y-2 shadow-sm">
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                  <div className="flex items-center gap-1 text-slate-400 truncate">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                    <span className="truncate">{t('passRateLabel')} <strong className="text-emerald-300 font-mono">{filter.verifiedPassRate || '96–100%'}</strong></span>
                                  </div>
                                  <div className="flex items-center gap-1 text-slate-400 truncate">
                                    <ShieldCheck className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                    <span className="truncate">{t('vipBuiltin')}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="pt-2 space-y-1.5 text-xs text-slate-300 font-mono bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
                              {filter.isPreset && isDeveloper && (
                                <div className="mb-1 p-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-between text-[11px] text-purple-300">
                                  <span className="font-bold flex items-center gap-1">{t('devFormulaOpen')}</span>
                                </div>
                              )}
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">{t('statMinutes')}</span>
                                <span className="font-bold text-sky-300">{filter.minMinute}' – {filter.maxMinute}'</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">{t('statScore')}</span>
                                <span className="font-bold text-slate-200">
                                  {filter.scoreCondition === '0-0'
                                    ? '0:0'
                                    : filter.scoreCondition === 'DRAW'
                                    ? t('scoreAnyDraw')
                                    : filter.scoreCondition === 'HOME_LEAD'
                                    ? t('scoreHomeLead')
                                    : filter.scoreCondition === 'AWAY_LEAD'
                                    ? t('scoreAwayLead')
                                    : filter.scoreCondition === 'ONE_GOAL_DIFF'
                                    ? t('scoreOneGoalDiff')
                                    : filter.scoreCondition === 'TOTAL_UNDER_25'
                                    ? t('scoreUnder25')
                                    : filter.scoreCondition === 'TOTAL_UNDER_2'
                                    ? t('scoreUnder2')
                                    : filter.scoreCondition === 'TOTAL_OVER_2'
                                    ? t('scoreOver2')
                                    : t('scoreAny')}
                                </span>
                              </div>

                              {filter.minDangerousAttacksDiff && (
                                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                  <span className="text-slate-500 font-sans">{t('statDangAttacksDiff')}</span>
                                  <span>≥ {filter.minDangerousAttacksDiff}</span>
                                </div>
                              )}
                              {filter.minTotalShots && (
                                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                  <span className="text-slate-500 font-sans">{t('statTotalShots')}</span>
                                  <span>≥ {filter.minTotalShots}</span>
                                </div>
                              )}
                              {filter.minShotsOnTargetTotal && (
                                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                  <span className="text-slate-500 font-sans">{t('statShotsOnTarget')}</span>
                                  <span>≥ {filter.minShotsOnTargetTotal}</span>
                                </div>
                              )}
                              {filter.minTotalCorners && (
                                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                  <span className="text-slate-500 font-sans">{t('statTotalCorners')}</span>
                                  <span>≥ {filter.minTotalCorners}</span>
                                </div>
                              )}
                              {filter.minPressureIndex && (
                                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                  <span className="text-slate-500 font-sans">{t('statPressure')}</span>
                                  <span className="text-rose-400 font-bold">≥ {filter.minPressureIndex}%</span>
                                </div>
                              )}
                              {filter.minXgTotal && (
                                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                  <span className="text-slate-500 font-sans">{t('statXgTotal')}</span>
                                  <span>≥ {filter.minXgTotal}</span>
                                </div>
                              )}
                              {filter.minXgOverScoreDiff && (
                                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                  <span className="text-slate-500 font-sans">{t('statXgAdvantage')}</span>
                                  <span className="text-amber-400 font-bold">≥ +{filter.minXgOverScoreDiff.toFixed(1)}</span>
                                </div>
                              )}
                              {filter.minAttacksDiff && (
                                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                  <span className="text-slate-500 font-sans">{t('statAttacksDiff')}</span>
                                  <span>≥ {filter.minAttacksDiff}</span>
                                </div>
                              )}
                              {filter.minShotsDiff && (
                                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                  <span className="text-slate-500 font-sans">{t('statShotsDiff')}</span>
                                  <span>≥ {filter.minShotsDiff}</span>
                                </div>
                              )}
                              {filter.maxOddsFavorite && (
                                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                  <span className="text-slate-500 font-sans">{t('statOddsFavorite')}</span>
                                  <span className="text-emerald-400 font-bold">≤ {filter.maxOddsFavorite.toFixed(2)}</span>
                                </div>
                              )}
                              {filter.minOddsDropPercent && (
                                <div className="flex justify-between border-b border-slate-800/60 pb-1 bg-amber-500/10 -mx-1 px-1 rounded">
                                  <span className="text-amber-400 font-sans flex items-center gap-1">
                                    <TrendingDown className="h-3 w-3" />
                                    {t('statOddsDrop')}
                                  </span>
                                  <span className="text-rose-400 font-bold">≥ {filter.minOddsDropPercent}%</span>
                              </div>
                            )}
                            {filter.minMoneyVolumePercent && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1 bg-amber-500/10 -mx-1 px-1 rounded">
                                <span className="text-amber-400 font-sans">Прогруз денег:</span>
                                <span className="text-amber-300 font-bold">≥ {filter.minMoneyVolumePercent}% пула</span>
                              </div>
                            )}
                            {filter.minMoneyLoadAmount && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Сумма прогруза:</span>
                                <span className="text-emerald-400 font-bold">≥ €{filter.minMoneyLoadAmount.toLocaleString('ru-RU')}</span>
                              </div>
                            )}
                            {filter.oddsDropMarket && filter.oddsDropMarket !== 'ANY' && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Целевой исход:</span>
                                <span className="text-sky-300 font-bold">{filter.oddsDropMarket}</span>
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
                            {filter.maxTotalGoals !== undefined && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Макс. тотал:</span>
                                <span className="text-amber-300 font-bold">≤ {filter.maxTotalGoals} (ТБ {filter.maxTotalGoals}.5 не пробит)</span>
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
                            {filter.requireGuestTwoQuickGoals1H && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Паттерн:</span>
                                <span className="text-amber-400 font-bold">2 быстрых гола в 1Т</span>
                              </div>
                            )}
                            {filter.requireNoGoalsSinceQuickGoals && (
                              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                                <span className="text-slate-500 font-sans">Сигнал на 75':</span>
                                <span className="text-emerald-400 font-bold">Строго без голов после них</span>
                              </div>
                            )}
                          </div>
                          )}
                        </div>

                        {/* Per-Filter Telegram Bot Assignment */}
                        <div className="pt-2.5 pb-1 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Bot className="h-3.5 w-3.5 text-cyan-400" />
                            <span className="text-[11px] font-medium">{t('botLabel')}</span>
                          </div>
                          <select
                            value={filter.customBotToken ? 'custom' : (filter.botId || '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFilters((prev) =>
                                prev.map((f) =>
                                  f.id === filter.id
                                    ? {
                                        ...f,
                                        botId: val === 'custom' ? undefined : (val || undefined),
                                        customBotToken: val === 'custom' ? (f.customBotToken || '') : undefined,
                                        customChatId: val === 'custom' ? (f.customChatId || '') : undefined,
                                      }
                                    : f
                                )
                              );
                            }}
                            className="bg-slate-950 border border-slate-700 hover:border-cyan-500 rounded-lg px-2 py-1 text-[11px] text-cyan-300 focus:outline-none focus:border-cyan-500 max-w-[170px] truncate font-medium"
                          >
                            <option value="">{t('defaultBot')}</option>
                            {currentUser.telegramBots.map((bot) => (
                              <option key={bot.id} value={bot.id}>
                                🤖 {bot.name}
                              </option>
                            ))}
                            {filter.customBotToken && <option value="custom">{t('customBot')}</option>}
                          </select>
                        </div>

                        {/* Card Controls Footer */}
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                          {/* Telegram Switch */}
                          <div className="flex items-center gap-1.5">
                            <Send className="h-3.5 w-3.5 text-blue-400" />
                            <span className="text-slate-400">{t('telegramLabel')}</span>
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
                              {filter.telegramEnabled ? t('switchOn') : t('switchOff')}
                            </button>
                          </div>

                          {/* Edit / Clone / Delete buttons */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setBacktestModalFilter(filter);
                                setIsBacktestModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-white font-medium text-xs flex items-center gap-1 border border-emerald-500/30 hover:border-emerald-500/60 transition shadow-sm"
                            >
                              <BarChart3 className="h-3 w-3 text-emerald-400" />
                              <span>{t('test1000Btn')}</span>
                            </button>

                            {(!filter.isPreset || isDeveloper) ? (
                              <button
                                onClick={() => {
                                  setEditingFilter(filter);
                                  setIsFilterModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs flex items-center gap-1 border border-slate-700 hover:border-emerald-500/40 transition"
                              >
                                <Sliders className="h-3 w-3 text-emerald-400" />
                                <span>{t('tuneBtn')}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setLockedPresetNotice(filter)}
                                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-amber-300 font-medium text-xs flex items-center gap-1 border border-slate-800 hover:border-amber-500/40 transition"
                              >
                                <Lock className="h-3 w-3 text-amber-400" />
                                <span>{t('paramsProtected')}</span>
                              </button>
                            )}

                            {(!filter.isPreset || isDeveloper) && (
                              <button
                                onClick={() => handleDuplicateFilter(filter)}
                                title="Дублировать фильтр"
                                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {(!filter.isPreset || isDeveloper) && (
                              <button
                                onClick={() => handleDeleteFilter(filter.id)}
                                title="Удалить фильтр"
                                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
              </>
            )}
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
            const matchesSport =
              signalSportFilter === 'all'
                ? true
                : (sig.sport || 'football') === signalSportFilter;
            const matchesSearch =
              !signalSearchQuery.trim() ||
              sig.matchName.toLowerCase().includes(signalSearchQuery.toLowerCase()) ||
              sig.ruleName.toLowerCase().includes(signalSearchQuery.toLowerCase()) ||
              sig.league.toLowerCase().includes(signalSearchQuery.toLowerCase());
            return matchesOutcome && matchesSport && matchesSearch;
          });

          return (
            <div className="space-y-6">
              {/* Header */}
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
                  <div className="flex flex-wrap items-center gap-2">
                    {/* View mode toggle: Cards vs Table */}
                    <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 shadow-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setSignalsViewMode('cards');
                          triggerTgHaptic('light');
                        }}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                          signalsViewMode === 'cards'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="Карточки Win Rate & ROI"
                      >
                        <Target className="h-3.5 w-3.5" />
                        <span>Карточки</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSignalsViewMode('table');
                          triggerTgHaptic('light');
                        }}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                          signalsViewMode === 'table'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="Интерактивная таблица сигналов и расчета"
                      >
                        <TableProperties className="h-3.5 w-3.5" />
                        <span>Таблица</span>
                      </button>
                    </div>

                    {/* Audit Strategy Execution Log Button */}
                    <button
                      type="button"
                      onClick={() => {
                        triggerTgHaptic('light');
                        setIsStrategyAuditLogOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95"
                      title="Аудит выполнения стратегий (фиксация ID сигнала, ID стратегии, голов, угловых, карточек на момент сигнала и по завершению)"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Аудит стратегий</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerTgHaptic('medium');
                        setIsProofOfWinOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                      title="Публичный чекер проходимости (Proof-of-Win)"
                    >
                      <Trophy className="h-3.5 w-3.5 text-amber-400" />
                      <span>Чекер Proof-of-Win</span>
                    </button>

                    <button
                      onClick={handleExportSignalsCsv}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                      title="Выгрузить историю сигналов за месяц в Excel (CSV) с детальным учетом банкролла"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Выгрузить в Excel (CSV)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearSignals}
                      disabled={signals.length === 0}
                      className="text-xs text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/30 transition active:scale-95 shadow-sm font-semibold"
                      title="Очистить все зафиксированные сигналы"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                      <span>Очистить сигналы ({signals.length})</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
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

                {/* Interactive 30-Day Bankroll Progress, Yield (ROI) & WinRate Chart (Recharts) */}
                <SignalsBankrollProgressChart signals={signals} initialBank={100000} flatStake={2000} />

                {/* Multi-Sport Selector Bar for Signals */}
                <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/80 border border-slate-800 rounded-xl overflow-x-auto text-xs">
                  {[
                    { id: 'all', label: 'Все виды спорта' },
                    { id: 'football', label: '⚽ Футбол' },
                    { id: 'hockey', label: '🏒 Хоккей' },
                    { id: 'basketball', label: '🏀 Баскетбол' },
                    { id: 'tennis', label: '🎾 Теннис' },
                    { id: 'volleyball', label: '🏐 Волейбол' },
                    { id: 'table_tennis', label: '🏓 Настольный' },
                  ].map((sp) => {
                    const isSelected = signalSportFilter === sp.id;
                    const count = signals.filter((s) => sp.id === 'all' || (s.sport || 'football') === sp.id).length;
                    return (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => setSignalSportFilter(sp.id as any)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-xs whitespace-nowrap transition flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <span>{sp.label}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                          isSelected ? 'bg-black/30 text-emerald-200' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
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

              {/* Signals Content: Table View or Cards View */}
              {signalsViewMode === 'table' ? (
                <ScannerSignalsTableView
                  signals={signals}
                  matches={matches}
                  isMonitoringActive={isMonitoringActive}
                  onToggleMonitoring={() => setIsMonitoringActive(!isMonitoringActive)}
                  onClearSignals={handleClearSignals}
                  onOpenAIAnalyst={(m) => handleOpenAIAnalyst(m)}
                  onSelectMatch={(m) => handleSelectMatch(m.id, true)}
                  onNavigateToMatch={(mId, mName, sig) => handleNavigateToMatchFromSignal(mId, mName, sig)}
                  onDeleteSignal={(id) => setSignals((prev) => prev.filter((s) => s.id !== id))}
                  onUpdateOutcome={(id, out) => updateSignalOutcome(id, out)}
                  onExportCsv={handleExportSignalsCsv}
                  onOpenAuditLog={() => setIsStrategyAuditLogOpen(true)}
                />
              ) : (
                <>
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
                      onClick={() => handleNavigateToMatchFromSignal(sig.matchId, sig.matchName, sig)}
                      className={`border ${
                        sig.isCombo
                          ? 'border-amber-500/60 bg-gradient-to-r from-amber-950/30 via-slate-900 to-indigo-950/30 shadow-lg shadow-amber-950/30 hover:border-amber-400'
                          : 'bg-slate-900 border-slate-800 hover:border-emerald-500/60 hover:bg-slate-900/90 shadow-sm hover:shadow-emerald-950/20'
                      } rounded-xl p-4 space-y-3 transition cursor-pointer group`}
                    >
                      {/* Super-Combo Top Banner */}
                      {sig.isCombo && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-emerald-500/20 border border-amber-500/40 text-xs">
                          <div className="flex items-center gap-2 font-bold text-amber-200 flex-wrap">
                            <span className="text-base animate-bounce">⚡🔥</span>
                            <span>СУПЕР-КОМБО: СОВПАДЕНИЕ {sig.comboCount || 2} СТРАТЕГИЙ</span>
                            {sig.comboClusterName && (
                              <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40 text-[10px] uppercase font-bold tracking-wider">
                                🎯 {sig.comboClusterName}
                              </span>
                            )}
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-100 text-[11px] font-mono font-bold border border-amber-400/50 self-start sm:self-auto">
                            🎯 ВЕРОЯТНОСТЬ {sig.comboConfidence || 96}% (СИНЕРГИЯ)
                          </span>
                        </div>
                      )}

                      {/* Top row: match minute, country, league, timestamp, telegram */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold font-mono">
                            {sig.minute}'
                          </span>
                          <span className="font-semibold text-white group-hover:text-emerald-300 transition">
                            {sig.country} • {sig.league}
                          </span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            {sig.timestamp}
                          </span>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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
                          <button
                            type="button"
                            onClick={() => handleNavigateToMatchFromSignal(sig.matchId, sig.matchName, sig)}
                            className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1 transition"
                            title="Перейти к лайв-матчу и статистике"
                          >
                            <ExternalLink className="h-3 w-3 text-emerald-400" />
                            <span>К матчу →</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleShareProof({
                                id: sig.id,
                                strategyName: sig.ruleName,
                                matchName: sig.matchName,
                                league: `${sig.country} • ${sig.league}`,
                                minute: sig.minute,
                                score: sig.score,
                                finalScore: sig.finalScore,
                                market: sig.marketSuggestion || 'ТБ / Live исход',
                                odds: sig.odds,
                                winRate: sig.outcome === 'WIN' ? 88.6 : 82.4,
                                date: sig.timestamp,
                              })
                            }
                            className="px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1 transition"
                            title="Поделиться сигналом в Telegram / VK (Proof-of-Win карточка)"
                          >
                            <Share2 className="h-3 w-3 text-amber-400" />
                            <span>Поделиться</span>
                          </button>
                          {sig.botName && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 font-mono font-medium">
                              <Bot className="h-3 w-3 text-cyan-400" />
                              {sig.botName}
                            </span>
                          )}
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
                            <span className="group-hover:text-emerald-400 transition flex items-center gap-1.5">
                              {sig.matchName}
                              <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition" />
                            </span>
                            <span className="font-mono text-sky-400">({sig.score})</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                            <span className="text-slate-500">Стратегия:</span>
                            <span className="text-slate-300 font-medium">{sig.ruleName}</span>

                            {/* Unambiguous ЧТО БРАТЬ Badge */}
                            {sig.targetAction === 'TM' || (sig.marketSuggestion || '').toLowerCase().includes('тм') ? (
                              <span className="px-2.5 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-black flex items-center gap-1 shadow-sm">
                                <span>🛡️</span>
                                <span>БРАТЬ: ТМ (ТОТАЛ МЕНЬШЕ)</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 text-[11px] font-black flex items-center gap-1 shadow-sm">
                                <span>🔥</span>
                                <span>БРАТЬ: ТБ (ТОТАЛ БОЛЬШЕ)</span>
                              </span>
                            )}

                            {sig.marketSuggestion && (
                              <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[11px] font-medium">
                                🎯 {sig.marketSuggestion}
                              </span>
                            )}
                          </div>

                          {/* List of coordinated strategies in combo */}
                          {sig.isCombo && sig.comboStrategyNames && sig.comboStrategyNames.length > 0 && (
                            <div className="mt-2 text-[11px] text-amber-300/90 bg-amber-950/20 rounded-lg p-2 border border-amber-500/20">
                              <div className="font-semibold text-amber-200 mb-1 flex items-center gap-1">
                                <span>⚡</span>
                                <span>Синхронно сработавшие стратегии ({sig.comboCount}):</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {sig.comboStrategyNames.map((stratName, sIdx) => (
                                  <span key={sIdx} className="px-2 py-0.5 rounded bg-slate-900/90 border border-amber-500/30 text-slate-300 text-[10px]">
                                    ✅ {stratName}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Interactive Outcome Marker */}
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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

                            {sig.telegramMessageId && sig.sentToTelegram && (
                              <button
                                type="button"
                                onClick={() => handleRewriteTelegramMessage(sig)}
                                title={
                                  sig.telegramEdited
                                    ? `Переписано в TG в ${sig.telegramEditedAt || ''}. Нажмите для повторного обновления.`
                                    : 'Переписать это сообщение в Telegram с текущим счётом и результатом матча'
                                }
                                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ml-1 ${
                                  sig.telegramEdited
                                    ? 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30'
                                    : 'bg-slate-800 hover:bg-sky-900/60 text-slate-300 hover:text-sky-200 border border-slate-700'
                                }`}
                              >
                                <Edit3 className="h-3 w-3 text-sky-400" />
                                {sig.telegramEdited ? 'Обновлено в TG ✏️' : 'Переписать в TG'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Strategy Target Metric: Initial vs Final (Corners, Cards, Goals) */}
                      {(() => {
                        const liveMatch = matches.find((m) => m.id === sig.matchId);
                        const curScore: [number, number] = liveMatch ? liveMatch.score : [0, 0];
                        const curStats = liveMatch?.stats || sig.finalStats;
                        const metric = sig.strategyMetricSnapshot || resolveStrategyMetric(sig, curScore, curStats);

                        return (
                          <div className="bg-slate-950/80 rounded-lg px-3 py-2 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="flex items-center flex-wrap gap-2">
                              <span className="text-sm">{metric.icon}</span>
                              <span className="text-slate-400 font-medium">
                                {metric.label} по стратегии:
                              </span>
                              <span className="font-mono text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                                Сигнал: <b className="text-amber-300">{metric.initialValueText}</b>
                              </span>
                              <span className="text-slate-600">➔</span>
                              <span className="font-mono text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                                {sig.outcome !== 'PENDING' ? 'Итог:' : 'Текущие:'}{' '}
                                <b
                                  className={
                                    sig.outcome === 'WIN'
                                      ? 'text-emerald-400'
                                      : sig.outcome === 'LOSS'
                                      ? 'text-rose-400'
                                      : 'text-sky-300'
                                  }
                                >
                                  {metric.finalValueText || (metric.finalTotal !== undefined ? `${metric.finalTotal}` : '—')}
                                </b>
                              </span>
                            </div>
                            {metric.deltaText && (
                              <div className="font-mono font-semibold text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 flex items-center gap-1 self-start sm:self-auto">
                                <span className={metric.delta && metric.delta > 0 ? 'text-emerald-400' : 'text-slate-300'}>
                                  {metric.deltaText}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Profit and Resolution Note */}
                      <div className="flex items-center justify-between text-xs bg-slate-950/70 px-3 py-2 rounded-lg border border-slate-800/80">
                        <div className="text-slate-400 flex flex-wrap items-center gap-2">
                          {sig.resolutionNote ? (
                            <span>📌 {sig.resolutionNote}</span>
                          ) : sig.outcome === 'WIN' ? (
                            <span className="text-emerald-400">Ставка рассчитана как выигрышная</span>
                          ) : sig.outcome === 'LOSS' ? (
                            <span className="text-rose-400">Ставка не зашла</span>
                          ) : (
                            <span className="text-amber-400/80">Матч продолжается / ожидает расчета</span>
                          )}

                          {sig.finalScore && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px] border border-slate-700">
                              FT: {sig.finalScore}
                            </span>
                          )}

                          {sig.telegramEdited && (
                            <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-medium border border-sky-500/30 flex items-center gap-1">
                              <CheckCircle2 className="h-2.5 w-2.5" /> Сообщение в TG переписано
                            </span>
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
                </>
              )}
            </div>
          </div>
        );
      })()}

        {/* Tab 4: Backtesting & ROI Laboratory */}
        {activeTab === 'backtest' && (
          <BacktestingView
            filters={filters}
            isDeveloper={isDeveloper}
            onSelectFilterToEdit={(rule) => {
              if (rule.isPreset && !isDeveloper) {
                setLockedPresetNotice(rule);
              } else {
                setEditingFilter(rule);
                setIsFilterModalOpen(true);
              }
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

                    {/* Auto-rewrite signal upon match completion */}
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                            <Edit3 className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-white flex items-center gap-2">
                              <span>Переписывать сигнал по завершению матча</span>
                              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-semibold border border-sky-500/30">
                                Результат в исходный пост
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              После окончания матча бот автоматически редактирует сообщение (<code>editMessageText</code>) со статусом ✅ СИГНАЛ ЗАШЁЛ (WIN) или ❌ НЕ ЗАШЁЛ (LOSS), добавляя итоговый счёт и расчёт профита.
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setTelegramConfig({
                              ...telegramConfig,
                              autoUpdateOnFinish: !telegramConfig.autoUpdateOnFinish,
                            })
                          }
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            telegramConfig.autoUpdateOnFinish ? 'bg-sky-500' : 'bg-slate-800'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              telegramConfig.autoUpdateOnFinish ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/60 text-[11px]">
                        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5">
                          <div className="font-semibold text-slate-200 flex items-center gap-1">
                            <span>1️⃣ Фиксация ID</span>
                          </div>
                          <p className="text-slate-400 mt-1 leading-snug">
                            При отправке сигнала бот сохраняет уникальный <code>message_id</code> в базу.
                          </p>
                        </div>
                        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5">
                          <div className="font-semibold text-slate-200 flex items-center gap-1">
                            <span>2️⃣ Анализ FT</span>
                          </div>
                          <p className="text-slate-400 mt-1 leading-snug">
                            По свистку об окончании матча проверяется рынок (ТБ/ТМ/П1) и факт голов.
                          </p>
                        </div>
                        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5">
                          <div className="font-semibold text-sky-300 flex items-center gap-1">
                            <span>3️⃣ Перезапись</span>
                          </div>
                          <p className="text-slate-400 mt-1 leading-snug">
                            Исходное сообщение бесшумно обновляется в канале без создания дублей.
                          </p>
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

                      <button
                        type="button"
                        onClick={triggerTestAndRewriteDemo}
                        disabled={isDemoRewriting || !telegramConfig.botToken || !telegramConfig.channelId}
                        className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-900/30"
                      >
                        <Sparkles className={`h-3.5 w-3.5 ${isDemoRewriting ? 'animate-spin' : ''}`} />
                        {isDemoRewriting ? 'Переписываем сообщение в TG...' : 'Тест: Сигнал ➔ Переписать в TG (3 сек)'}
                      </button>
                    </div>

                    {/* Daily Summary & Performance Report to Telegram (Task 2) */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-950 border border-blue-500/30 space-y-3.5 shadow-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-500/20 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-sm">
                            <BarChart3 className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white tracking-tight">
                              {t('reportCardTitle')}
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              {t('reportCardDesc')}
                            </p>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 shrink-0">
                          {t('reportCardAutoSchedule')}
                        </span>
                      </div>

                      {/* Quick Snapshot Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Всего сигналов</div>
                          <div className="text-base font-black text-white font-mono mt-0.5">
                            {signals.length}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                          <div className="text-[10px] uppercase font-bold text-emerald-400">Прошло (WIN)</div>
                          <div className="text-base font-black text-emerald-300 font-mono mt-0.5">
                            {signals.filter((s) => s.outcome === 'WIN').length}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30">
                          <div className="text-[10px] uppercase font-bold text-rose-400">Не прошло (LOSS)</div>
                          <div className="text-base font-black text-rose-300 font-mono mt-0.5">
                            {signals.filter((s) => s.outcome === 'LOSS').length}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30">
                          <div className="text-[10px] uppercase font-bold text-amber-400">Проходимость</div>
                          <div className="text-base font-black text-amber-300 font-mono mt-0.5">
                            {(() => {
                              const w = signals.filter((s) => s.outcome === 'WIN').length;
                              const l = signals.filter((s) => s.outcome === 'LOSS').length;
                              const res = w + l;
                              return res > 0 ? `${((w / res) * 100).toFixed(1)}%` : '100%';
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-blue-400" />
                          <span>Авто-отправка в каждый настроенный бот по умолчанию в <b>23:59 по МСК</b> (только реальные сигналы бота):</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSendDailyReport(false)}
                          disabled={sendingDailyReport}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-950/50 flex items-center justify-center gap-2 transition disabled:opacity-50 active:scale-95 shrink-0"
                          title="Отправить суточный отчёт во все настроенные боты прямо сейчас"
                        >
                          <Send className={`h-3.5 w-3.5 ${sendingDailyReport ? 'animate-pulse' : ''}`} />
                          <span>{sendingDailyReport ? 'Отправка...' : 'Отправить в боты сейчас (23:59 МСК)'}</span>
                        </button>
                      </div>
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

                      {/* PROMINENT RECOMMENDED OUTCOME IN TELEGRAM PREVIEW */}
                      <div className="bg-gradient-to-r from-emerald-950/90 via-[#18362b] to-emerald-950/90 p-3 rounded-xl border-2 border-emerald-400 my-2.5 shadow-lg shadow-emerald-950/70">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
                            🎯 РЕКОМЕНДОВАННЫЙ ИСХОД / СТАВКА:
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950/90 text-emerald-300 border border-emerald-500/40 font-bold">
                            Кэф ~1.85
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-black text-sm sm:text-base tracking-wide shadow flex items-center gap-1.5">
                            <span>🔥</span>
                            <span>{filters.find((f) => f.enabled)?.targetMarket || 'ТБ 0.5 ВО 2-М ТАЙМЕ'}</span>
                          </div>
                          <span className="text-[11px] text-emerald-300 font-semibold hidden sm:inline">
                            Точка входа: {selectedMatch?.minute || 75}'
                          </span>
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
                          📊 <strong>xG:</strong> {selectedMatch?.stats?.xg ? `${(selectedMatch.stats.xg[0] ?? 0).toFixed(2)} vs ${(selectedMatch.stats.xg[1] ?? 0).toFixed(2)}` : 'н/д'}
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

        {/* Tab 6: Personal Cabinet & Multi-Bot Management */}
        {activeTab === 'cabinet' && (
          <PersonalCabinetView
            currentUser={currentUser}
            allUsers={allUsers}
            userFilters={filters}
            ads={ads}
            currentTheme={theme}
            onToggleTheme={toggleTheme}
            onSetTheme={setTheme}
            onSelectUser={handleSelectUser}
            onUpdateCurrentUser={handleUpdateCurrentUser}
            onCreateUser={handleCreateUser}
            onSaveFilters={setFilters}
            onNavigateToFilters={() => setActiveTab('filters')}
            onOpenFilterModal={(f?: FilterRule) => {
              setEditingFilter(f || null);
              setIsFilterModalOpen(true);
            }}
            onSendTestBotMessage={handleSendTestBotMessage}
            onLogout={handleLogout}
            dataSourceConfig={dataSourceConfig}
            onSwitchDataSource={handleManualSwitchDataSource}
            onOpenDataSourcesModal={() => setIsDataSourcesModalOpen(true)}
            onRestoreAllStrategies={handleRestoreAllStrategies}
          />
        )}

        {/* Tab 7: Advertiser Cabinet & Yandex Metrika Analytics */}
        {activeTab === 'advertiser' && (
          <AdvertiserCabinetView
            analytics={analytics}
            onUpdateAnalytics={(updated) => setAnalytics(updated)}
            ads={ads}
            onUpdateAds={handleUpdateAds}
          />
        )}

        {/* Tab 8: Educational Interactive Guide for Beginners (Filters & Cards) */}
        {activeTab === 'education' && (
          <EducationGuideView
            onNavigateTab={(tab) => setActiveTab(tab)}
            onApplyPresetFilter={(preset) => {
              const newRule: FilterRule = {
                id: `custom-edu-${Date.now()}`,
                name: preset.name || 'Обучающий алгоритм',
                description: preset.description || 'Создан на основе интерактивного обучения',
                category: preset.category || 'goals',
                ruleType: preset.ruleType || 'LIVE',
                enabled: true,
                telegramEnabled: true,
                minMinute: preset.minMinute ?? 75,
                maxMinute: preset.maxMinute ?? 90,
                scoreCondition: preset.scoreCondition || 'ANY',
                minDangerousAttacksDiff: preset.minDangerousAttacksDiff,
                minTotalShots: preset.minTotalShots,
                minShotsOnTargetTotal: preset.minShotsOnTargetTotal,
                minXgTotal: preset.minXgTotal,
                targetMarket: preset.targetMarket,
                color: preset.color || 'emerald',
                userId: currentUser.id,
              };
              handleSaveFilter(newRule);
              setActiveTab('filters');
            }}
            onOpenFilterBuilder={(preset) => {
              if (preset) {
                setEditingFilter({
                  id: `custom-edu-${Date.now()}`,
                  name: preset.name || 'Новый алгоритм',
                  description: preset.description || 'Настроен по обучающему материалу',
                  category: preset.category || 'goals',
                  ruleType: preset.ruleType || 'LIVE',
                  enabled: true,
                  telegramEnabled: true,
                  minMinute: preset.minMinute ?? 75,
                  maxMinute: preset.maxMinute ?? 90,
                  scoreCondition: preset.scoreCondition || 'ANY',
                  minDangerousAttacksDiff: preset.minDangerousAttacksDiff,
                  minTotalShots: preset.minTotalShots,
                  minShotsOnTargetTotal: preset.minShotsOnTargetTotal,
                  minXgTotal: preset.minXgTotal,
                  targetMarket: preset.targetMarket,
                  color: preset.color || 'emerald',
                  userId: currentUser.id,
                });
              } else {
                setEditingFilter(null);
              }
              setIsFilterModalOpen(true);
            }}
          />
        )}

        {/* Filter Builder & Editor Modal */}
        <FilterBuilderModal
          isOpen={isFilterModalOpen}
          initialFilter={editingFilter}
          liveMatches={matches}
          userBots={currentUser.telegramBots}
          isPaidUser={isPaidUser}
          isDeveloper={isDeveloper}
          onUpgradePlan={() => {
            setIsFilterModalOpen(false);
            setActiveTab('cabinet');
          }}
          onOpenAISynthesizer={() => {
            setIsFilterModalOpen(false);
            setIsAISynthesizerOpen(true);
          }}
          onClose={() => {
            setIsFilterModalOpen(false);
            setEditingFilter(null);
          }}
          onSave={(savedRule) => {
            handleSaveFilter({
              ...savedRule,
              userId: currentUser.id,
            });
            setIsFilterModalOpen(false);
            setEditingFilter(null);
          }}
        />

        {/* Locked Built-in Preset Notice Modal (Защита параметров вшитых карточек от копирования) */}
        {lockedPresetNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-4 shadow-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
                <Lock className="h-7 w-7" />
              </div>

              <div className="space-y-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" />
                  Защита алгоритма разработчика
                </span>
                <h3 className="text-lg font-bold text-white">
                  {getStrategyCardDisplayName(lockedPresetNotice, isDeveloper, filters)}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Параметры и формула данной вшитой стратегии скрыты разработчиком для защиты от копирования. Вы можете полноценно использовать её по вашей подписке: запускать в мониторинг, получать сигналы в реальном времени и подключить Telegram-бота.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Статистика прохода:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {lockedPresetNotice.verifiedPassRate || '96–100% реальных матчей'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Целевой рынок:</span>
                  <span className="font-bold text-amber-300">
                    {lockedPresetNotice.targetMarket || 'Live исходы'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Статус в мониторинге:</span>
                  <span className="text-emerald-300 font-semibold">
                    {lockedPresetNotice.enabled ? '🟢 Запущен' : '⚪ Остановлен'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const rule = lockedPresetNotice;
                    setLockedPresetNotice(null);
                    setBacktestModalFilter(rule);
                    setIsBacktestModalOpen(true);
                  }}
                  className="w-full sm:w-auto flex-1 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Тест (1 000+ матчей)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLockedPresetNotice(null);
                    setEditingFilter(createCleanBlankFilter(currentUser.id));
                    setIsFilterModalOpen(true);
                  }}
                  className="w-full sm:w-auto flex-1 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Чистый бланк</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setLockedPresetNotice(null)}
                className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-300 font-medium transition"
              >
                Закрыть
              </button>
            </div>
          </div>
        )}

        {/* AI Strategy Synthesizer Modal (VIP / Max Plan Feature - No VPN) */}
        <AIStrategySynthesizerModal
          isOpen={isAISynthesizerOpen}
          onClose={() => setIsAISynthesizerOpen(false)}
          currentUser={currentUser}
          onSaveStrategy={(newRule, activateImmediately) => {
            const ruleWithUser: FilterRule = {
              ...newRule,
              userId: currentUser.id,
              enabled: activateImmediately !== undefined ? activateImmediately : true,
            };
            handleSaveFilter(ruleWithUser);
          }}
          onOpenInBuilder={(rule) => {
            setEditingFilter(rule);
            setIsFilterModalOpen(true);
          }}
          onUpgradePlan={() => {
            setActiveTab('cabinet');
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
            lastStatsReceivedTimestampRef.current = Date.now();
            setDataSourceConfig(newConfig);
            fetchLiveMatchesFromSource(newConfig.activeSource, selectedSport);
          }}
          activeMatchesCount={matches.length}
          onRefreshMatches={async () => {
            lastStatsReceivedTimestampRef.current = Date.now();
            await fetchLiveMatchesFromSource(dataSourceConfig.activeSource, selectedSport);
          }}
          isRefreshing={isRefreshingMatches}
          lastFetchedAt={lastFetchedAt}
        />

        {/* Single Filter Deep Backtest Modal (1000+ Matches & Live Accumulated) */}
        <FilterBacktestModal
          filter={backtestModalFilter}
          isOpen={isBacktestModalOpen}
          liveMatchesCount={matches.length}
          isDeveloper={isDeveloper}
          onClose={() => {
            setIsBacktestModalOpen(false);
            setBacktestModalFilter(null);
          }}
          onToggleEnableFilter={(filterId) => {
            setFilters((prev) =>
              prev.map((f) => (f.id === filterId ? { ...f, enabled: !f.enabled } : f))
            );
          }}
          onOpenEditFilter={(filterToEdit) => {
            if (filterToEdit.isPreset && !isDeveloper) {
              setLockedPresetNotice(filterToEdit);
              return;
            }
            setIsBacktestModalOpen(false);
            setEditingFilter(filterToEdit);
            setIsFilterModalOpen(true);
          }}
        />

        {/* Strategy Marketplace Modal */}
        <StrategyMarketplaceModal
          isOpen={isMarketplaceOpen}
          onClose={() => setIsMarketplaceOpen(false)}
          userFilters={filters}
          currentUserId={currentUser.id}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onImportStrategy={(newFilter) => {
            setFilters((prev) => [newFilter, ...prev]);
            alert(`Стратегия «${newFilter.name}» успешно добавлена в ваши алгоритмы!`);
          }}
        />

        {/* Proof of Win Public Audit Modal */}
        <ProofOfWinModal
          isOpen={isProofOfWinOpen}
          onClose={() => setIsProofOfWinOpen(false)}
          onShareProof={handleShareProof}
          onActivateTopStrategies={handleActivateNoviceSafeTop3}
        />

        {/* Strategy Execution Audit Log Modal */}
        <StrategyAuditLogModal
          isOpen={isStrategyAuditLogOpen}
          onClose={() => setIsStrategyAuditLogOpen(false)}
        />

        {/* Viral Proof-of-Win Share Card Modal */}
        <ProofOfWinShareModal
          isOpen={isProofShareOpen}
          onClose={() => {
            setIsProofShareOpen(false);
            setProofToShare(null);
          }}
          proof={proofToShare}
        />

        {/* Branded Canvas Match Result Share Modal */}
        {shareResultMatch && (
          <ShareResultModal
            isOpen={isShareResultModalOpen}
            onClose={() => setIsShareResultModalOpen(false)}
            match={shareResultMatch}
            imageDataUrl={shareResultDataUrl}
            imageBlob={shareResultBlob}
          />
        )}

        {/* Creators Gamification Leaderboard Modal */}
        <LeaderboardModal
          isOpen={isLeaderboardOpen}
          onClose={() => setIsLeaderboardOpen(false)}
          onOpenMarketplace={() => {
            setIsLeaderboardOpen(false);
            setIsMarketplaceOpen(true);
          }}
        />

        {/* Bankroll & Virtual Bet Tracker Modal */}
        <BankrollTrackerModal
          isOpen={isBankrollOpen}
          onClose={() => setIsBankrollOpen(false)}
        />

        {/* Odds Movement & Smart Money Radar Modal */}
        <OddsMovementRadarModal
          isOpen={isOddsRadarOpen}
          onClose={() => setIsOddsRadarOpen(false)}
          matches={matches}
          onRefreshMatches={() => fetchLiveMatchesFromSource()}
          isRefreshing={isRefreshingMatches}
          onCreateFilterFromAnomaly={(template) => {
            setEditingFilter({
              ...createCleanBlankFilter(currentUser.id),
              ...template,
            });
            setIsFilterModalOpen(true);
          }}
          onSendTelegramAlert={async (msg) => {
            const res = await sendTelegramMessage(msg, false);
            return res.ok;
          }}
        />

        {/* Innovation 1: AI Real-Time Momentum Radar & 10-Minute Goal Probability Modal */}
        <MatchMomentumRadarModal
          isOpen={isMomentumRadarOpen}
          onClose={() => setIsMomentumRadarOpen(false)}
          matches={matches}
          selectedMatch={selectedMatch}
          onSelectMatch={(m) => setSelectedMatchId(m.id)}
          filters={filters}
          onTriggerFilterAlert={async (filter, match) => {
            const analysis = calculatePressureAnalysis(match);
            const alertText = formatExtendedTelegramAlert(match, filter, analysis, undefined, isDeveloper);
            const res = await sendTelegramMessage(alertText, false);
            if (res.ok) {
              alert('Сигнал успешно отправлен в Telegram!');
            } else {
              alert(`Ошибка отправки: ${res.error}`);
            }
          }}
        />

        {/* PWA Paywall for Standalone Mode: "Pwa приложения могут пользоваться только подписчики у которых оплачена подписка" */}
        {isInPwaStandalone && !isPaidUser && !isDeveloper && (
          <PwaSubscriptionPaywall
            currentUser={currentUser}
            allUsers={allUsers}
            onSelectUser={(u) => setCurrentUserId(u.id)}
            onUpgradePlan={(newPlan) => {
              setAllUsers((prev) =>
                prev.map((u) =>
                  u.id === currentUser.id
                    ? {
                        ...u,
                        plan: newPlan,
                        role: newPlan === 'VIP_CLUB' ? 'vip' : 'pro',
                      }
                    : u
                )
              );
            }}
            onExitToBrowser={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete('source');
              url.searchParams.delete('mode');
              window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
              setIsInPwaStandalone(false);
            }}
          />
        )}

        {/* PWA Installation & Subscription Guidance Modal */}
        <PwaInstallModal
          isOpen={isPwaInstallModalOpen}
          onClose={() => setIsPwaInstallModalOpen(false)}
          isPaidUser={isPaidUser}
          currentUser={currentUser}
          onUpgradePlan={(newPlan) => {
            setAllUsers((prev) =>
              prev.map((u) =>
                u.id === currentUser.id
                  ? {
                      ...u,
                      plan: newPlan,
                      role: newPlan === 'VIP_CLUB' ? 'vip' : 'pro',
                    }
                  : u
              )
            );
          }}
        />

        {/* In-App Application Self-Update Modal */}
        <InAppUpdateModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          onUpdateAvailable={(release) => setAvailableUpdate(release)}
        />

        {/* User Simulation Testing Agent (Sandboxed & Non-Intrusive) */}
        <UserSimulationAgentModal
          isOpen={isSimulationAgentOpen}
          onClose={() => setIsSimulationAgentOpen(false)}
          currentUser={currentUser}
          allUsers={allUsers}
          matches={matches}
          filters={filters}
        />
      </div>

      {/* Restore Right Banner pill if dismissed */}
      {dismissedRightBanner && currentUser.adPreferences.showBanners && (
        <button
          onClick={() => setDismissedRightBanner(false)}
          className="hidden xl:flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 bg-slate-900/95 border border-indigo-500/40 px-2 py-1 rounded-l-lg fixed right-0 top-32 z-30 transition shadow-lg backdrop-blur-sm active:scale-95"
          title="Восстановить баннер справа"
        >
          <span className="font-bold">Баннер справа</span>
          <ChevronLeft className="h-3 w-3" />
        </button>
      )}

      {/* Right Skyscraper Banner (Desktop) */}
      {currentUser.adPreferences.showBanners && !dismissedRightBanner && rightAd && (
        <aside
          id="ad-flank-right"
          className="hidden xl:block w-44 2xl:w-56 shrink-0 pt-6 sticky top-16 z-20"
        >
          <AdBanner
            ad={rightAd}
            variant="skyscraper"
            side="right"
            onDismiss={() => setDismissedRightBanner(true)}
            onAdClick={handleAdClick}
            onAdImpression={handleAdImpression}
          />
        </aside>
      )}
    </div>

    {/* Application Footer: Advertiser Cabinet & Yandex Metrika Counter */}
    <AppFooter
      analytics={analytics}
      ads={ads}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      dataSourceName={
        isDeveloper
          ? dataSourceConfig.activeSource === 'fonbet'
            ? 'БК Фонбет Live (РФ)'
            : dataSourceConfig.activeSource === '1xbet'
            ? '1xBet Live'
            : dataSourceConfig.activeSource === 'flashscore'
            ? 'Flashscore Live'
            : dataSourceConfig.activeSource === 'public-feed'
            ? 'Глобальный Фид (ESPN)'
            : dataSourceConfig.activeSource === 'sofascore'
            ? 'Sofascore Relay'
            : dataSourceConfig.activeSource === 'sstats'
            ? 'SStats API'
            : dataSourceConfig.activeSource === 'api-football'
            ? 'API-Football (v3)'
            : dataSourceConfig.activeSource === 'simulated'
            ? 'Демо-симулятор'
            : 'Внешний Webhook'
          : 'Live Telemetry Core (Спутниковый поток)'
      }
      isMonitoringActive={isMonitoringActive}
      liveMatchesCount={matches.length}
      activeFiltersCount={filters.filter((f) => f.enabled).length}
      signalsCount={signals.length}
    />

    {/* Mobile Bottom Navigation Bar (Pattern 1 from Mobile Touch Guidelines) */}
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 shadow-2xl safe-area-bottom"
    >
      <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto px-1">
        <button
          type="button"
          onClick={() => {
            setActiveTab('matches');
            setMobileMatchViewMode('list');
          }}
          className={`flex flex-col items-center justify-center py-1 transition-colors min-h-[48px] relative ${
            activeTab === 'matches' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="h-5 w-5" />
          <span className="text-[10px] mt-1 tracking-tight">{t('statusLive')}</span>
          {matches.length > 0 && (
            <span className="absolute top-1 right-2 px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black font-mono">
              {matches.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('filters')}
          className={`flex flex-col items-center justify-center py-1 transition-colors min-h-[48px] relative ${
            activeTab === 'filters' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="h-5 w-5" />
          <span className="text-[10px] mt-1 tracking-tight">{t('navStrategies')}</span>
          <span className="absolute top-1 right-2 px-1.5 py-0.2 rounded-full bg-slate-800 text-emerald-300 text-[9px] font-mono">
            {filters.filter((f) => f.enabled).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('signals')}
          className={`flex flex-col items-center justify-center py-1 transition-colors min-h-[48px] relative ${
            activeTab === 'signals' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="h-5 w-5" />
          <span className="text-[10px] mt-1 tracking-tight">{t('navSignals')}</span>
          {signals.length > 0 && (
            <span className="absolute top-1 right-2 px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 text-[9px] font-bold">
              {signals.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cabinet')}
          className={`flex flex-col items-center justify-center py-1 transition-colors min-h-[48px] ${
            activeTab === 'cabinet' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-[10px] mt-1 tracking-tight">{t('navCabinet')}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsMobileToolsDrawerOpen(true)}
          className="flex flex-col items-center justify-center py-1 transition-colors min-h-[48px] text-slate-400 hover:text-emerald-400"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] mt-1 tracking-tight">Menu</span>
        </button>
      </div>
    </nav>

    {/* Mobile Tools & Services Slide-Over / Bottom Sheet */}
    {isMobileToolsDrawerOpen && (
      <div className="lg:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end animate-fadeIn">
        <div
          className="fixed inset-0"
          onClick={() => setIsMobileToolsDrawerOpen(false)}
        />
        <div className="relative bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl z-10 pb-8">
          {/* Grab Handle */}
          <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto" />

          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Инструменты и сервисы</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileToolsDrawerOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <button
              onClick={() => {
                setIsMobileToolsDrawerOpen(false);
                setIsDataSourcesModalOpen(true);
              }}
              className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5 text-slate-300 text-left active:scale-95 transition"
            >
              <Globe className="h-4 w-4 text-cyan-400 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-white text-xs">Источники данных</div>
                <div className="text-[10px] text-slate-400 truncate">{dataSourceConfig.activeSource}</div>
              </div>
            </button>

            {/* Innovation 1: AI Match Momentum & Goal Radar */}
            <button
              onClick={() => {
                setIsMobileToolsDrawerOpen(false);
                setIsMomentumRadarOpen(true);
              }}
              className="p-3 rounded-2xl bg-slate-950/80 border border-emerald-500/40 flex items-center gap-2.5 text-emerald-300 text-left active:scale-95 transition"
            >
              <Activity className="h-4 w-4 text-emerald-400 shrink-0 animate-pulse" />
              <div className="truncate">
                <div className="font-bold text-white text-xs">{t('navMomentumRadar')}</div>
                <div className="text-[10px] text-emerald-400 truncate">10m Goal Radar</div>
              </div>
            </button>

            <button
              onClick={() => {
                setIsMobileToolsDrawerOpen(false);
                handleSendDailyReport();
              }}
              className="p-3 rounded-2xl bg-slate-950/80 border border-blue-500/30 flex items-center gap-2.5 text-blue-300 text-left active:scale-95 transition"
            >
              <BarChart3 className="h-4 w-4 text-blue-400 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-white text-xs">{t('sendDailyReport')}</div>
                <div className="text-[10px] text-blue-400 truncate">Telegram</div>
              </div>
            </button>

            <button
              onClick={() => {
                setIsMobileToolsDrawerOpen(false);
                setIsAISynthesizerOpen(true);
              }}
              className="p-3 rounded-2xl bg-slate-950/80 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-300 text-left active:scale-95 transition"
            >
              <Sparkles className="h-4 w-4 text-amber-300 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-white text-xs">{t('navAiSynthesizer')}</div>
                <div className="text-[10px] text-emerald-400 truncate">AI Prompt / Photo</div>
              </div>
            </button>

            <button
              onClick={() => {
                setIsMobileToolsDrawerOpen(false);
                setIsMarketplaceOpen(true);
              }}
              className="p-3 rounded-2xl bg-slate-950/80 border border-amber-500/30 flex items-center gap-2.5 text-amber-300 text-left active:scale-95 transition"
            >
              <ShoppingBag className="h-4 w-4 text-amber-400 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-white text-xs">{t('navMarketplace')}</div>
                <div className="text-[10px] text-amber-400 truncate">Marketplace</div>
              </div>
            </button>

            <button
              onClick={() => {
                setIsMobileToolsDrawerOpen(false);
                setIsBankrollOpen(true);
              }}
              className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5 text-emerald-300 text-left active:scale-95 transition"
            >
              <Wallet className="h-4 w-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-white text-xs">{t('navBankroll')}</div>
                <div className="text-[10px] text-slate-400 truncate">Bankroll Tracker</div>
              </div>
            </button>

            <button
              onClick={() => {
                setIsMobileToolsDrawerOpen(false);
                setIsOddsRadarOpen(true);
              }}
              className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5 text-rose-300 text-left active:scale-95 transition"
            >
              <TrendingDown className="h-4 w-4 text-rose-400 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-white text-xs">{t('navOddsRadar')}</div>
                <div className="text-[10px] text-slate-400 truncate">Odds Drop Radar</div>
              </div>
            </button>

            <button
              onClick={() => {
                setIsMobileToolsDrawerOpen(false);
                setActiveTab('backtest');
              }}
              className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5 text-slate-300 text-left active:scale-95 transition"
            >
              <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-white text-xs">{t('navBacktest')}</div>
                <div className="text-[10px] text-slate-400 truncate">Backtesting Lab</div>
              </div>
            </button>

            <button
              onClick={() => {
                setIsMobileToolsDrawerOpen(false);
                setActiveTab('education');
              }}
              className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5 text-amber-300 text-left active:scale-95 transition"
            >
              <GraduationCap className="h-4 w-4 text-amber-400 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-white text-xs">{t('navEducation')}</div>
                <div className="text-[10px] text-amber-400 truncate">Guide & Sandbox</div>
              </div>
            </button>

            <button
              onClick={() => {
                setIsMobileToolsDrawerOpen(false);
                setActiveTab('cabinet');
              }}
              className="p-3 rounded-2xl bg-slate-950/80 border border-purple-500/30 flex items-center gap-2.5 text-purple-200 text-left active:scale-95 transition"
            >
              <User className="h-4 w-4 text-purple-400 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-white text-xs">{t('navCabinet')}</div>
                <div className="text-[10px] text-purple-300 truncate">{currentUser.displayName}</div>
              </div>
            </button>

            <button
              onClick={() => {
                setIsMobileToolsDrawerOpen(false);
                setIsProofOfWinOpen(true);
              }}
              className="p-3 rounded-2xl bg-slate-950/80 border border-amber-500/40 flex items-center gap-2.5 text-amber-300 text-left active:scale-95 transition"
            >
              <Trophy className="h-4 w-4 text-amber-400 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-white text-xs">{t('navProofOfWin')}</div>
                <div className="text-[10px] text-amber-300 truncate">Proof-of-Win</div>
              </div>
            </button>

            <button
              onClick={() => {
                setIsMobileToolsDrawerOpen(false);
                setIsStrategyAuditLogOpen(true);
              }}
              className="p-3 rounded-2xl bg-slate-950/80 border border-indigo-500/40 flex items-center gap-2.5 text-indigo-300 text-left active:scale-95 transition"
            >
              <ShieldCheck className="h-4 w-4 text-indigo-400 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-white text-xs">Аудит стратегий</div>
                <div className="text-[10px] text-indigo-300 truncate">Лог голов, ЖК, угловых</div>
              </div>
            </button>

            <button
              onClick={() => {
                setIsMobileToolsDrawerOpen(false);
                setIsLeaderboardOpen(true);
              }}
              className="p-3 rounded-2xl bg-slate-950/80 border border-purple-500/40 flex items-center gap-2.5 text-purple-300 text-left active:scale-95 transition"
            >
              <Crown className="h-4 w-4 text-purple-400 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-white text-xs">{t('navLeaderboard')}</div>
                <div className="text-[10px] text-purple-300 truncate">Creators</div>
              </div>
            </button>

            <button
              onClick={() => {
                setIsMobileToolsDrawerOpen(false);
                handleActivateNoviceSafeTop3();
              }}
              className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center gap-2.5 text-emerald-300 text-left active:scale-95 transition"
            >
              <Sparkles className="h-4 w-4 text-amber-300 shrink-0 animate-pulse" />
              <div className="truncate">
                <div className="font-bold text-white text-xs">{t('noviceSafeTop3Btn')}</div>
                <div className="text-[10px] text-emerald-300 truncate">1-Click Top 3</div>
              </div>
            </button>

            <button
              onClick={() => {
                handleToggleWebPush();
              }}
              className={`p-3 rounded-2xl bg-slate-950/80 border flex items-center gap-2.5 text-left active:scale-95 transition ${
                isWebPushEnabled ? 'border-blue-500/40 text-blue-300' : 'border-slate-800 text-slate-300'
              }`}
            >
              {isWebPushEnabled ? <BellRing className="h-4 w-4 text-blue-400 shrink-0" /> : <Bell className="h-4 w-4 text-slate-400 shrink-0" />}
              <div className="truncate">
                <div className="font-bold text-white text-xs">Web Push</div>
                <div className="text-[10px] text-slate-400 truncate">{isWebPushEnabled ? 'ВКЛЮЧЕН' : 'Отключен'}</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                toggleTheme();
              }}
              className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5 text-slate-300 text-left active:scale-95 transition"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400 shrink-0" /> : <Moon className="h-4 w-4 text-indigo-400 shrink-0" />}
              <div className="truncate">
                <div className="font-bold text-white text-xs">Тема оформления</div>
                <div className="text-[10px] text-slate-400 truncate">{theme === 'dark' ? 'Тёмная' : 'Светлая'}</div>
              </div>
            </button>

            <button
              onClick={() => {
                setIsMobileToolsDrawerOpen(false);
                handleLogout();
              }}
              className="col-span-2 p-3 rounded-2xl bg-red-950/30 border border-red-500/30 flex items-center justify-center gap-2 text-red-300 text-xs font-bold active:scale-95 transition"
            >
              <LogOut className="h-4 w-4" />
              <span>Выйти из аккаунта</span>
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Authentication Gate & Logo Splash Screen Modal */}
    <AuthGateModal
      isOpen={!isAuthenticated}
      allUsers={allUsers}
      onLogin={handleLogin}
      onRegisterUser={(newUser) => {
        handleCreateUser(newUser);
        handleLogin(newUser);
      }}
    />

    {/* Quick Scroll to Top Button */}
    {showScrollTop && (
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-20 lg:bottom-8 right-6 z-40 p-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-950/60 transition-all transform hover:scale-110 active:scale-95 border border-emerald-400/40 flex items-center justify-center animate-in fade-in duration-200"
        title="Быстрый возврат наверх"
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    )}
    </div>
  );
}
