import React, { useState, useEffect, useMemo } from 'react';
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
  Layers
} from 'lucide-react';

interface MatchStats {
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

interface Match {
  id: string;
  country: string;
  countryCode: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  score: [number, number];
  minute: number;
  status: 'LIVE' | 'HT' | 'FINISHED';
  stats: MatchStats;
  momentum: number[]; // -100 to 100
  lastEvent?: string;
  source: 'Flashscore' | 'SStats' | 'Sofascore';
  odds: {
    home: number;
    draw: number;
    away: number;
    over25: number;
  };
}

interface FilterRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  minMinute: number;
  maxMinute: number;
  minDangerousAttacksDiff?: number;
  minTotalShots?: number;
  minTotalCorners?: number;
  scoreCondition: 'ANY' | 'DRAW' | '0-0' | 'HOME_LEAD' | 'AWAY_LEAD';
  minXgTotal?: number;
  telegramEnabled: boolean;
  color: string;
}

interface SignalAlert {
  id: string;
  timestamp: string;
  matchId: string;
  matchName: string;
  league: string;
  country: string;
  minute: number;
  score: string;
  ruleName: string;
  message: string;
  sentToTelegram: boolean;
}

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
    odds: { home: 1.65, draw: 3.4, away: 5.5, over25: 1.72 },
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
    odds: { home: 1.44, draw: 3.8, away: 8.5, over25: 1.95 },
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
    odds: { home: 1.85, draw: 3.75, away: 4.1, over25: 1.35 },
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
    odds: { home: 2.1, draw: 2.45, away: 4.8, over25: 2.15 },
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
    odds: { home: 2.3, draw: 3.1, away: 3.2, over25: 2.05 },
  },
];

const DEFAULT_FILTERS: FilterRule[] = [
  {
    id: 'f-1',
    name: '🔥 Доминирование при ничьей 0:0 (60-80 мин)',
    description: 'Команда давит с опасными атаками >50 при счете 0:0 во втором тайме',
    enabled: true,
    minMinute: 60,
    maxMinute: 85,
    minDangerousAttacksDiff: 30,
    minTotalShots: 8,
    scoreCondition: '0-0',
    minXgTotal: 1.5,
    telegramEnabled: true,
    color: 'emerald',
  },
  {
    id: 'f-2',
    name: '⚡ Высокий прессинг и угловые (70+ мин)',
    description: 'Высокая интенсивность угловых и опасных атак в концовке',
    enabled: true,
    minMinute: 70,
    maxMinute: 90,
    minTotalCorners: 8,
    minTotalShots: 12,
    scoreCondition: 'ANY',
    telegramEnabled: true,
    color: 'blue',
  },
  {
    id: 'f-3',
    name: '🎯 Фаворит отыгрывается (1 мяч отставания)',
    description: 'Команда хозяев проигрывает в 1 мяч при мощном перевесе по атакам',
    enabled: true,
    minMinute: 55,
    maxMinute: 88,
    minDangerousAttacksDiff: 25,
    scoreCondition: 'AWAY_LEAD',
    telegramEnabled: true,
    color: 'amber',
  },
];

export default function App() {
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const [filters, setFilters] = useState<FilterRule[]>(DEFAULT_FILTERS);
  const [selectedMatchId, setSelectedMatchId] = useState<string>(INITIAL_MATCHES[0].id);
  const [isMonitoringActive, setIsMonitoringActive] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'matches' | 'filters' | 'telegram' | 'signals'>('matches');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [signals, setSignals] = useState<SignalAlert[]>([]);
  const [telegramConfig, setTelegramConfig] = useState({
    botToken: '6892401248:AAF9...kLpX8',
    channelId: '@footbalmonitor_live',
    notificationsCount: 14,
    lastPing: 'только что',
  });
  const [telegramStatus, setTelegramStatus] = useState<'connected' | 'testing' | 'error'>('connected');

  // Simulation: live ticking
  useEffect(() => {
    if (!isMonitoringActive) return;

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

  // Check filter triggers
  useEffect(() => {
    matches.forEach((match) => {
      filters.filter((f) => f.enabled).forEach((rule) => {
        const inMinuteRange = match.minute >= rule.minMinute && match.minute <= rule.maxMinute;
        if (!inMinuteRange) return;

        let scoreMatch = true;
        if (rule.scoreCondition === '0-0') {
          scoreMatch = match.score[0] === 0 && match.score[1] === 0;
        } else if (rule.scoreCondition === 'DRAW') {
          scoreMatch = match.score[0] === match.score[1];
        } else if (rule.scoreCondition === 'AWAY_LEAD') {
          scoreMatch = match.score[1] > match.score[0];
        } else if (rule.scoreCondition === 'HOME_LEAD') {
          scoreMatch = match.score[0] > match.score[1];
        }

        if (!scoreMatch) return;

        const dangDiff = Math.abs(match.stats.dangerousAttacks[0] - match.stats.dangerousAttacks[1]);
        if (rule.minDangerousAttacksDiff && dangDiff < rule.minDangerousAttacksDiff) return;

        const totalShots =
          match.stats.shotsOnTarget[0] +
          match.stats.shotsOnTarget[1] +
          match.stats.shotsOffTarget[0] +
          match.stats.shotsOffTarget[1];
        if (rule.minTotalShots && totalShots < rule.minTotalShots) return;

        const totalCorners = match.stats.corners[0] + match.stats.corners[1];
        if (rule.minTotalCorners && totalCorners < rule.minTotalCorners) return;

        // Found match! Let's check if alert already recorded for this minute
        const alertId = `${match.id}-${rule.id}-${match.minute}`;
        setSignals((prev) => {
          if (prev.some((s) => s.id === alertId)) return prev;
          const newAlert: SignalAlert = {
            id: alertId,
            timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            matchId: match.id,
            matchName: `${match.homeTeam} vs ${match.awayTeam}`,
            league: match.league,
            country: match.country,
            minute: match.minute,
            score: `${match.score[0]}:${match.score[1]}`,
            ruleName: rule.name,
            message: `⚽ [СИГНАЛ] ${match.country} | ${match.league}\n${match.homeTeam} ${match.score[0]}:${match.score[1]} ${match.awayTeam} (${match.minute}')\n🔥 Давление: Оп. атаки ${match.stats.dangerousAttacks[0]}-${match.stats.dangerousAttacks[1]} | Удары в створ ${match.stats.shotsOnTarget[0]}-${match.stats.shotsOnTarget[1]} | Углы ${match.stats.corners[0]}-${match.stats.corners[1]}`,
            sentToTelegram: rule.telegramEnabled,
          };
          return [newAlert, ...prev].slice(0, 50);
        });
      });
    });
  }, [matches, filters]);

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

  const triggerTestSignal = () => {
    if (!selectedMatch) return;
    const testAlert: SignalAlert = {
      id: `manual-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('ru-RU'),
      matchId: selectedMatch.id,
      matchName: `${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`,
      league: selectedMatch.league,
      country: selectedMatch.country,
      minute: selectedMatch.minute,
      score: `${selectedMatch.score[0]}:${selectedMatch.score[1]}`,
      ruleName: 'Ручной тестовый сигнал (Flashscore / Telegram)',
      message: `🔔 [ТЕСТОВЫЙ СИГНАЛ]\n${selectedMatch.countryCode} ${selectedMatch.country} | ${selectedMatch.league}\n${selectedMatch.homeTeam} ${selectedMatch.score[0]}:${selectedMatch.score[1]} ${selectedMatch.awayTeam} (${selectedMatch.minute}')\n📊 Опасные атаки: ${selectedMatch.stats.dangerousAttacks[0]}-${selectedMatch.stats.dangerousAttacks[1]} | Удары: ${selectedMatch.stats.shotsOnTarget[0]}-${selectedMatch.stats.shotsOnTarget[1]}`,
      sentToTelegram: true,
    };
    setSignals((prev) => [testAlert, ...prev]);
    setTelegramStatus('testing');
    setTimeout(() => {
      setTelegramStatus('connected');
      setTelegramConfig((c) => ({ ...c, notificationsCount: c.notificationsCount + 1 }));
    }, 1000);
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
        <div className="flex items-center gap-3">
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
            {isMonitoringActive ? 'Парсинг активен' : 'Пауза мониторинга'}
          </button>

          <button
            id="send-test-signal-btn"
            onClick={triggerTestSignal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            Тест в Telegram
          </button>

          <div className="h-4 w-px bg-slate-800" />

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
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400">Провайдеры данных</span>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-sm font-semibold text-white">Flashscore + SStats</span>
              </div>
            </div>
            <Activity className="h-6 w-6 text-emerald-400/50" />
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
              <span className="text-xs text-slate-400">Отправлено в канал</span>
              <div className="text-xl font-bold text-blue-400">{telegramConfig.notificationsCount} алертов</div>
            </div>
            <Send className="h-6 w-6 text-blue-400/50" />
          </div>
        </div>

        {/* Tab 1: Live Matches & Detailed In-Play Analytics */}
        {activeTab === 'matches' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Matches list (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
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
              </div>

              <div className="space-y-2">
                {filteredMatches.map((match) => {
                  const isSelected = match.id === selectedMatchId;
                  const dangDiff = match.stats.dangerousAttacks[0] - match.stats.dangerousAttacks[1];
                  const isHighPressure = Math.abs(dangDiff) >= 25;

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
                        <div className="flex items-center gap-2">
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
                        {isHighPressure && (
                          <div className="pl-3 border-l border-slate-800 flex flex-col items-center justify-center">
                            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              <Flame className="h-4 w-4 animate-bounce" />
                            </span>
                            <span className="text-[10px] text-amber-400 mt-1 font-mono font-bold">
                              +{Math.abs(dangDiff)} ОА
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Quick stat bar */}
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          Опасные атаки: <strong className="text-slate-200">{match.stats.dangerousAttacks[0]} - {match.stats.dangerousAttacks[1]}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          Удары: <strong className="text-slate-200">{match.stats.shotsOnTarget[0] + match.stats.shotsOffTarget[0]} - {match.stats.shotsOnTarget[1] + match.stats.shotsOffTarget[1]}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          Углы: <strong className="text-slate-200">{match.stats.corners[0]} - {match.stats.corners[1]}</strong>
                        </span>
                      </div>
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

                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                        {selectedMatch.minute} МИНУТА
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">Синхронизация: {selectedMatch.source} API</div>
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

        {/* Tab 2: Filter Engine */}
        {activeTab === 'filters' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Стратегии и фильтры сигналов</h2>
                <p className="text-xs text-slate-400">Настройка алгоритмов отслеживания аномалий и автоматической отправки сигналов</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filters.map((filter) => (
                <div key={filter.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {filter.minMinute}' - {filter.maxMinute}'
                      </span>
                      <button
                        onClick={() =>
                          setFilters((prev) =>
                            prev.map((f) => (f.id === filter.id ? { ...f, enabled: !f.enabled } : f))
                          )
                        }
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition ${
                          filter.enabled
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {filter.enabled ? 'Активен' : 'Отключен'}
                      </button>
                    </div>

                    <h3 className="text-sm font-bold text-white">{filter.name}</h3>
                    <p className="text-xs text-slate-400">{filter.description}</p>

                    <div className="pt-2 space-y-1.5 text-xs text-slate-300 font-mono">
                      <div className="flex justify-between border-b border-slate-800/60 pb-1">
                        <span className="text-slate-500 font-sans">Условие счета:</span>
                        <span>{filter.scoreCondition}</span>
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
                      {filter.minTotalCorners && (
                        <div className="flex justify-between border-b border-slate-800/60 pb-1">
                          <span className="text-slate-500 font-sans">Всего угловых:</span>
                          <span>≥ {filter.minTotalCorners}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Send className="h-3.5 w-3.5 text-blue-400" />
                      Telegram:
                    </span>
                    <button
                      onClick={() =>
                        setFilters((prev) =>
                          prev.map((f) => (f.id === filter.id ? { ...f, telegramEnabled: !f.telegramEnabled } : f))
                        )
                      }
                      className={`font-semibold ${filter.telegramEnabled ? 'text-emerald-400' : 'text-slate-500'}`}
                    >
                      {filter.telegramEnabled ? 'ВКЛ' : 'ВЫКЛ'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Signal Feed */}
        {activeTab === 'signals' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Лента сработавших сигналов ({signals.length})</h2>
                <p className="text-xs text-slate-400">История автоматических триггеров и отправленных уведомлений</p>
              </div>
              {signals.length > 0 && (
                <button
                  onClick={() => setSignals([])}
                  className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Очистить журнал
                </button>
              )}
            </div>

            {signals.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center space-y-3">
                <Bell className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-400">Пока нет зафиксированных сигналов в текущей сессии.</p>
                <button
                  onClick={triggerTestSignal}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                >
                  Отправить тестовый сигнал
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {signals.map((sig) => (
                  <div key={sig.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold font-mono">
                          {sig.minute}'
                        </span>
                        <span className="font-semibold text-white">{sig.country} • {sig.league}</span>
                        <span className="text-slate-500 font-mono text-[11px]">{sig.timestamp}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                        <Send className="h-3 w-3" />
                        {sig.sentToTelegram ? 'Отправлено в TG' : 'Локально'}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-white">{sig.matchName} ({sig.score})</div>
                    <div className="text-xs text-slate-400 font-mono bg-slate-950 p-3 rounded-lg whitespace-pre-line border border-slate-800/80">
                      {sig.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Telegram Settings & Preview */}
        {activeTab === 'telegram' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Config Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-400" />
                Настройки Telegram бота
              </h2>
              <p className="text-xs text-slate-400">
                Конфигурация параметров для отправки форматированных сигналов в канал или группу
              </p>

              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Bot Token</label>
                  <input
                    type="password"
                    value={telegramConfig.botToken}
                    onChange={(e) => setTelegramConfig({ ...telegramConfig, botToken: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Chat / Channel ID</label>
                  <input
                    type="text"
                    value={telegramConfig.channelId}
                    onChange={(e) => setTelegramConfig({ ...telegramConfig, channelId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={triggerTestSignal}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Проверить отправку
                  </button>
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Соединение установлено
                  </span>
                </div>
              </div>
            </div>

            {/* Telegram Message Preview Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
              <h2 className="text-base font-bold text-white">Предпросмотр сообщения в Telegram</h2>
              <div className="bg-[#17212b] border border-[#232e3c] rounded-xl p-4 text-slate-200 text-xs font-sans space-y-2 shadow-inner">
                <div className="flex items-center justify-between border-b border-[#242f3d] pb-2 text-[11px] text-sky-400 font-semibold">
                  <span>Footbalmonitor Alert Bot</span>
                  <span className="text-slate-500">14:15</span>
                </div>
                <div className="font-bold text-white text-sm">
                  🇪🇸 Spain | LaLiga EA Sports
                </div>
                <div className="font-semibold text-emerald-400">
                  Real Madrid 0 : 0 Valencia (74')
                </div>
                <div className="text-slate-300 text-xs leading-relaxed">
                  🔥 <strong>Давление:</strong> Опасные атаки 82 - 19 (+63)<br />
                  🎯 <strong>Удары:</strong> В створ 9 - 1 (Всего 17 - 3)<br />
                  ⛳ <strong>Угловые:</strong> 11 - 1<br />
                  📊 <strong>xG:</strong> 2.15 vs 0.22<br />
                  📈 <strong>Коэффициент ТБ 0.5:</strong> 1.55
                </div>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-[#242f3d]">
                  Триггер: Доминирование при ничьей 0:0 (60-80 мин)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
