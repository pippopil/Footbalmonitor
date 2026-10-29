import React, { useState, useMemo } from 'react';
import { Match, FilterRule, SportType, TelegramBotProfile } from '../types';
import {
  Calendar,
  Clock,
  Send,
  Copy,
  Check,
  Flame,
  TrendingUp,
  Sparkles,
  BarChart3,
  Search,
  Filter,
  RefreshCw,
  Sliders,
  ChevronRight,
  ShieldAlert,
  Plus,
  Bell,
  Play,
  Share2,
  ExternalLink,
  Target,
  Layers,
} from 'lucide-react';
import { generateTeamRecentMatches, summarizeRecentMatches } from '../services/prematchScheduler';

interface PrematchScannerViewProps {
  matches: Match[];
  filters: FilterRule[];
  selectedSport?: SportType | 'all';
  userBots?: TelegramBotProfile[];
  onOpenCreateFilter?: (initial?: Partial<FilterRule>) => void;
  onSendTelegramAlert?: (text: string, botId?: string) => Promise<boolean> | boolean;
}

export const PrematchScannerView: React.FC<PrematchScannerViewProps> = ({
  matches,
  filters,
  selectedSport = 'all',
  userBots = [],
  onOpenCreateFilter,
  onSendTelegramAlert,
}) => {
  const [activeSportTab, setActiveSportTab] = useState<SportType | 'all'>(selectedSport);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sentAlertId, setSentAlertId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedBotId, setSelectedBotId] = useState<string>('');

  // Extract all active or prematch-enabled filters
  const prematchFilters = useMemo(() => {
    return filters.filter(
      (f) =>
        f.enabled &&
        (f.ruleType === 'PREMATCH' ||
          f.prematchAnalysisEnabled ||
          Boolean(
            f.prematchMinOddsOver25 ||
              f.prematchMaxOddsOver25 ||
              f.prematchH2hOver25MinHits ||
              f.prematchTeam1Over25MinHits ||
              f.maxOddsOver25 ||
              f.minOver25Streak ||
              f.requireH2hOver15High
          ))
    );
  }, [filters]);

  // Today's matches analysis & matching against prematch filters
  const prematchMatchResults = useMemo(() => {
    const list: Array<{
      id: string;
      match: Match;
      matchedStrategies: FilterRule[];
      h2hOver25Count: number;
      h2hTotalMatches: number;
      team1RecentOver25Count: number;
      team2RecentOver25Count: number;
      confidencePct: number;
      scheduledAlertTime: string;
    }> = [];

    matches.forEach((m) => {
      // Sport check
      const matchSport = m.sport || 'football';
      if (activeSportTab !== 'all' && matchSport !== activeSportTab) {
        return;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const str = `${m.homeTeam} ${m.awayTeam} ${m.league} ${m.country}`.toLowerCase();
        if (!str.includes(q)) return;
      }

      // H2H & Recent matches stats (все последние матчи обеих команд, не очные!)
      const h2hTotal = 5;
      const h2hPct = m.history?.h2hOver15Pct ?? (m.odds.over25 <= 1.65 ? 80 : 60);
      const h2hOver25Count = Math.round((h2hPct / 100) * h2hTotal);
      const team1RecentOver25Count = m.history?.homeOver25CountLast5 ?? 4;
      const team2RecentOver25Count = m.history?.awayOver25CountLast5 ?? 4;
      const combinedRecentOver25 = team1RecentOver25Count + team2RecentOver25Count;

      // Evaluate against prematch rules
      const triggered = prematchFilters.filter((rule) => {
        // Sport check
        if (rule.sport && rule.sport !== matchSport) return false;

        // Specific strategy selection filter in UI
        if (selectedStrategyId !== 'all' && rule.id !== selectedStrategyId) {
          return false;
        }

        // Odds corridors
        if (rule.prematchMinOddsHome !== undefined && m.odds.home < rule.prematchMinOddsHome) return false;
        if (rule.prematchMaxOddsHome !== undefined && m.odds.home > rule.prematchMaxOddsHome) return false;
        if (rule.prematchMinOddsDraw !== undefined && m.odds.draw < rule.prematchMinOddsDraw) return false;
        if (rule.prematchMaxOddsDraw !== undefined && m.odds.draw > rule.prematchMaxOddsDraw) return false;
        if (rule.prematchMinOddsAway !== undefined && m.odds.away < rule.prematchMinOddsAway) return false;
        if (rule.prematchMaxOddsAway !== undefined && m.odds.away > rule.prematchMaxOddsAway) return false;
        if (rule.prematchMinOddsOver25 !== undefined && m.odds.over25 < rule.prematchMinOddsOver25) return false;
        if (rule.prematchMaxOddsOver25 !== undefined && m.odds.over25 > rule.prematchMaxOddsOver25) return false;

        // Combined Over 2.5 in last 5 matches of both teams (>= 9 out of 10 matches total)
        if (rule.minCombinedOver25CountLast5 !== undefined && combinedRecentOver25 < rule.minCombinedOver25CountLast5) {
          return false;
        }
        if (rule.requireOver25StreakAllowed4Of5) {
          if (combinedRecentOver25 < 9 || Math.max(team1RecentOver25Count, team2RecentOver25Count) < 5 || Math.min(team1RecentOver25Count, team2RecentOver25Count) < 4) {
            return false;
          }
        }

        // H2H Over 2.5 hits
        if (rule.prematchH2hOver25MinHits !== undefined && h2hOver25Count < rule.prematchH2hOver25MinHits) return false;
        if (rule.prematchTeam1Over25MinHits !== undefined && team1RecentOver25Count < rule.prematchTeam1Over25MinHits) return false;
        if (rule.prematchTeam2Over25MinHits !== undefined && team2RecentOver25Count < rule.prematchTeam2Over25MinHits) return false;

        // Legacy bounds
        if (rule.maxOddsOver25 !== undefined && m.odds.over25 > rule.maxOddsOver25) return false;
        if (rule.minOddsOver25 !== undefined && m.odds.over25 < rule.minOddsOver25) return false;
        if (rule.maxOddsFavorite !== undefined && Math.min(m.odds.home, m.odds.away) > rule.maxOddsFavorite) return false;

        return true;
      });

      if (triggered.length > 0) {
        const scheduledTime = triggered.find((t) => t.prematchAlertDailyTime)?.prematchAlertDailyTime || '10:00';
        const confidencePct = Math.min(95, 75 + triggered.length * 5 + (h2hOver25Count >= 4 ? 10 : 0));

        list.push({
          id: `prematch-${m.id}`,
          match: m,
          matchedStrategies: triggered,
          h2hOver25Count,
          h2hTotalMatches: h2hTotal,
          team1RecentOver25Count,
          team2RecentOver25Count,
          confidencePct,
          scheduledAlertTime: scheduledTime,
        });
      }
    });

    return list;
  }, [matches, prematchFilters, activeSportTab, searchQuery, selectedStrategyId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const buildTelegramAlertText = (item: typeof prematchMatchResults[0]) => {
    const { match, matchedStrategies, h2hOver25Count, h2hTotalMatches, team1RecentOver25Count, team2RecentOver25Count } = item;
    const stratNames = matchedStrategies.map((s) => `«${s.name}»`).join(', ');
    const kickoff = match.startTime || 'Сегодня в 19:30 UTC';

    return `📋 *ПРЕДМАТЧЕВЫЙ СИГНАЛ ДНЯ*\n` +
      `⚡ *Стратегия:* ${stratNames}\n` +
      `🏆 *Лига:* ${match.countryCode} ${match.league}\n` +
      `⚽ *Матч:* ${match.homeTeam} vs ${match.awayTeam}\n` +
      `⏰ *Начало:* ${kickoff}\n\n` +
      `📊 *Коэффициенты Линии:*\n` +
      `• П1: *${match.odds?.home !== undefined ? match.odds.home.toFixed(2) : '-'}* | X: *${match.odds?.draw !== undefined ? match.odds.draw.toFixed(2) : '-'}* | П2: *${match.odds?.away !== undefined ? match.odds.away.toFixed(2) : '-'}*\n` +
      `• ТБ 2.5: *${match.odds?.over25 !== undefined ? match.odds.over25.toFixed(2) : '-'}*\n\n` +
      `📈 *Статистика серий и H2H:*\n` +
      `• Очные встречи: ТБ 2.5 в *${h2hOver25Count} из ${h2hTotalMatches}* матчей (${Math.round((h2hOver25Count / h2hTotalMatches) * 100)}%)\n` +
      `• Форма ${match.homeTeam}: *${team1RecentOver25Count} из 5* на ТБ 2.5\n` +
      `• Форма ${match.awayTeam}: *${team2RecentOver25Count} из 5* на ТБ 2.5\n\n` +
      `🎯 *Рекомендация:* ${matchedStrategies[0]?.targetMarket || 'Тотал больше 2.5'}\n` +
      `🤖 *SportSignal AI* | Сигнал отправлен строго 1 раз в сутки`;
  };

  const handleCopyAlert = (item: typeof prematchMatchResults[0]) => {
    const text = buildTelegramAlertText(item);
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendTelegram = async (item: typeof prematchMatchResults[0]) => {
    const text = buildTelegramAlertText(item);
    if (onSendTelegramAlert) {
      await onSendTelegramAlert(text, selectedBotId || undefined);
    }
    setSentAlertId(item.id);
    setTimeout(() => setSentAlertId(null), 3000);
  };

  const handleSendAllDailyDigest = async () => {
    if (prematchMatchResults.length === 0) return;
    const header = `📋 *ЕЖЕДНЕВНЫЙ ПРЕДМАТЧЕВЫЙ ДАЙДЖЕСТ OMNISPORT AI*\n📅 *Дата:* ${new Date().toLocaleDateString('ru-RU')}\n🎯 *Всего совпадений:* ${prematchMatchResults.length} матчей\n\n` +
      `───────────────\n\n`;

    const body = prematchMatchResults.map((item, idx) => {
      const { match, matchedStrategies } = item;
      return `${idx + 1}. *${match.homeTeam} — ${match.awayTeam}* (${match.league})\n` +
        `   🏆 Стратегия: ${matchedStrategies[0]?.name}\n` +
        `   ⏰ Начало: ${match.startTime || 'Сегодня'}\n` +
        `   📊 Кэф ТБ 2.5: ${match.odds?.over25 !== undefined ? match.odds.over25.toFixed(2) : '-'} | Очные ТБ: ${item.h2hOver25Count}/${item.h2hTotalMatches}\n`;
    }).join('\n');

    const fullText = header + body;
    if (onSendTelegramAlert) {
      await onSendTelegramAlert(fullText, selectedBotId || undefined);
    }
    setSentAlertId('all-digest');
    setTimeout(() => setSentAlertId(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Prematch Intelligence Engine */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-sky-500/30 p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-12 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-lg shadow-sky-950/50">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black tracking-wide text-white">
                    Предматчевый анализ & Дайджест дня
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 text-[11px] font-mono font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    DAILY DISPATCHER
                  </span>
                </div>
                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed mt-1">
                  Анализ котировок П1/X/П2/ТБ 2.5, серий H2H за последние 5–10 очных матчей и автоматическая отправка ежедневных сигналов в установленное пользователем время
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleSendAllDailyDigest}
              disabled={prematchMatchResults.length === 0}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-950/50 transition active:scale-95 border border-sky-400/30"
            >
              <Send className="h-3.5 w-3.5 fill-current" />
              <span>{sentAlertId === 'all-digest' ? 'Дайджест отправлен!' : 'Отправить весь дайджест в Telegram'}</span>
            </button>

            {onOpenCreateFilter && (
              <button
                type="button"
                onClick={() =>
                  onOpenCreateFilter({
                    ruleType: 'PREMATCH',
                    name: '📋 Прематч: ТБ 2.5 по очным встречам',
                    description: 'ТБ 2.5 пробит в >= 3 из 5 очных матчей и кэф на ТБ 2.5 в коридоре 1.55-1.95',
                    prematchAnalysisEnabled: true,
                    prematchAlertDailyTime: '10:00',
                    prematchMinOddsOver25: 1.55,
                    prematchMaxOddsOver25: 1.95,
                    prematchH2hOver25MinHits: 3,
                    targetMarket: 'Тотал больше 2.5',
                  })
                }
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>Создать предматч-фильтр</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleRefresh}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition active:scale-95"
              title="Обновить предматчевую базу"
            >
              <RefreshCw className={`h-4 w-4 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Schedule HUD info */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Clock className="h-4 w-4 text-amber-400" />
              <span>Время ежедневной рассылки:</span>
              <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                10:00 (МСК) • 1 раз в сутки
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
              <span>Активных прематч-стратегий:</span>
              <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                {prematchFilters.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Матчей с сигналом на сегодня:</span>
            <span className="font-mono font-extrabold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/30">
              {prematchMatchResults.length} матчей
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Sport switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'Все виды' },
            { id: 'football', label: '⚽ Футбол' },
            { id: 'hockey', label: '🏒 Хоккей' },
            { id: 'basketball', label: '🏀 Баскетбол' },
            { id: 'tennis', label: '🎾 Теннис' },
          ].map((sp) => (
            <button
              key={sp.id}
              type="button"
              onClick={() => setActiveSportTab(sp.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                activeSportTab === sp.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {sp.label}
            </button>
          ))}
        </div>

        {/* Strategy filter & Search query */}
        <div className="flex items-center gap-2">
          {prematchFilters.length > 0 && (
            <select
              value={selectedStrategyId}
              onChange={(e) => setSelectedStrategyId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 font-medium focus:border-sky-500 focus:outline-none max-w-[200px]"
            >
              <option value="all">Все стратегии ({prematchFilters.length})</option>
              {prematchFilters.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          )}

          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Поиск команды или лиги..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none w-48 sm:w-60"
            />
          </div>
        </div>
      </div>

      {/* List of Today's Upcoming Matches with Triggered Prematch Signals */}
      {prematchMatchResults.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prematchMatchResults.map((item) => {
            const { match, matchedStrategies, h2hOver25Count, h2hTotalMatches, team1RecentOver25Count, team2RecentOver25Count, confidencePct } = item;
            const primaryStrategy = matchedStrategies[0];

            return (
              <div
                key={item.id}
                className="bg-gradient-to-b from-slate-900 to-slate-950 border border-sky-500/30 rounded-3xl p-5 shadow-xl hover:border-sky-500/60 transition space-y-4 relative overflow-hidden"
              >
                {/* Accent glow corner */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />

                {/* Strategy Trigger Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      <Target className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <div className="text-[10px] text-sky-400 font-mono font-bold uppercase tracking-wider">
                        Сработавшая стратегия
                      </div>
                      <div className="text-xs font-bold text-white truncate max-w-[240px]">
                        {primaryStrategy?.name}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-mono block">Уверенность</span>
                    <span className="text-xs font-black font-mono text-emerald-400">
                      {confidencePct}%
                    </span>
                  </div>
                </div>

                {/* Match Info & Kickoff */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-medium">
                      <span>{match.countryCode}</span>
                      <span>{match.league}</span>
                    </span>
                    <span className="flex items-center gap-1 font-mono text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                      <Clock className="h-3 w-3" />
                      <span>{match.startTime || 'Сегодня'}</span>
                    </span>
                  </div>

                  <div className="text-base font-black text-white flex items-center justify-between pt-1">
                    <span>{match.homeTeam}</span>
                    <span className="text-slate-600 text-xs px-2 font-mono">VS</span>
                    <span>{match.awayTeam}</span>
                  </div>
                </div>

                {/* Odds Bar */}
                <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-2 rounded-2xl border border-slate-800/80 text-center">
                  <div>
                    <span className="text-[9px] text-slate-500 block">П1</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {match.odds?.home !== undefined ? match.odds.home.toFixed(2) : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">Ничья (X)</span>
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {match.odds?.draw !== undefined ? match.odds.draw.toFixed(2) : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">П2</span>
                    <span className="text-xs font-mono font-bold text-blue-400">
                      {match.odds?.away !== undefined ? match.odds.away.toFixed(2) : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-amber-400/80 font-bold block">ТБ 2.5</span>
                    <span className="text-xs font-mono font-black text-amber-300">
                      {match.odds?.over25 !== undefined ? match.odds.over25.toFixed(2) : '-'}
                    </span>
                  </div>
                </div>

                {/* H2H & Recent Matches Stat Breakdown */}
                {(() => {
                  const homeMatches =
                    match.history?.homeRecentMatchesLast6 ||
                    generateTeamRecentMatches(match.homeTeam, match.league, team1RecentOver25Count);
                  const awayMatches =
                    match.history?.awayRecentMatchesLast6 ||
                    generateTeamRecentMatches(match.awayTeam, match.league, team2RecentOver25Count);
                  const homeSum = summarizeRecentMatches(homeMatches as any);
                  const awaySum = summarizeRecentMatches(awayMatches as any);
                  const isPurePrematch = primaryStrategy?.ruleType === 'PREMATCH' && !primaryStrategy?.minMinute;

                  return (
                    <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5 text-xs">
                      {/* Strategy Dispatch Timing Badge */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                        <span className="text-[11px] text-slate-400 font-medium">Режим отправки:</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-sky-400" />
                          {isPurePrematch
                            ? '⏱️ Сигнал за 10 мин до матча'
                            : '⏳ Ожидание лайв-статистики (кэш сохранен)'}
                        </span>
                      </div>

                      {/* H2H Row */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Очные встречи (H2H):</span>
                        <span className="font-mono font-bold text-amber-300">
                          ТБ 2.5 в {h2hOver25Count} из {h2hTotalMatches} ({Math.round((h2hOver25Count / h2hTotalMatches) * 100)}%)
                        </span>
                      </div>

                      {/* Team 1 Recent 6 Matches */}
                      <div className="space-y-1 pt-1 border-t border-slate-900">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-200">{match.homeTeam} (крайние 6 матчей):</span>
                          <span className="text-[10px] text-emerald-400 font-mono font-bold">
                            {homeSum.wins}W - {homeSum.draws}D - {homeSum.losses}L ({homeSum.goalsScored}:{homeSum.goalsConceded} гол.)
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                          {homeMatches.map((rm, idx) => (
                            <div
                              key={idx}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border flex items-center gap-1 shrink-0 ${
                                rm.result === 'W'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : rm.result === 'D'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              }`}
                              title={`${rm.isHome ? 'Дома' : 'В гостях'} против ${rm.opponent}: счёт ${rm.score[0]}:${rm.score[1]}`}
                            >
                              <span>{rm.result}</span>
                              <span className="text-slate-300">{rm.score[0]}:{rm.score[1]}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Team 2 Recent 6 Matches */}
                      <div className="space-y-1 pt-1 border-t border-slate-900">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-200">{match.awayTeam} (крайние 6 матчей):</span>
                          <span className="text-[10px] text-sky-400 font-mono font-bold">
                            {awaySum.wins}W - {awaySum.draws}D - {awaySum.losses}L ({awaySum.goalsScored}:{awaySum.goalsConceded} гол.)
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                          {awayMatches.map((rm, idx) => (
                            <div
                              key={idx}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border flex items-center gap-1 shrink-0 ${
                                rm.result === 'W'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : rm.result === 'D'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              }`}
                              title={`${rm.isHome ? 'Дома' : 'В гостях'} против ${rm.opponent}: счёт ${rm.score[0]}:${rm.score[1]}`}
                            >
                              <span>{rm.result}</span>
                              <span className="text-slate-300">{rm.score[0]}:{rm.score[1]}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Total Over Streak */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80">
                        <span className="text-slate-300 font-medium">Суммарно ТБ 2.5 (все игры):</span>
                        <span
                          className={`font-mono px-2 py-0.5 rounded text-[11px] font-bold ${
                            team1RecentOver25Count + team2RecentOver25Count >= 9
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'text-slate-400 bg-slate-900'
                          }`}
                        >
                          {team1RecentOver25Count + team2RecentOver25Count}/10
                          {team1RecentOver25Count + team2RecentOver25Count >= 9 &&
                            (team1RecentOver25Count === 5 && team2RecentOver25Count === 5
                              ? ' 🔥 Идеал (5/5 + 5/5)'
                              : ' ✅ Мин. (5/5 + 4/5)')}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Action Buttons */}
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendTelegram(item)}
                    className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-sky-950/40"
                  >
                    <Send className="h-3.5 w-3.5 fill-current" />
                    <span>{sentAlertId === item.id ? 'Сигнал отправлен!' : 'В Telegram'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyAlert(item)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 border border-slate-700"
                    title="Скопировать сигнал"
                  >
                    {copiedId === item.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedId === item.id ? 'Скопировано' : 'Копировать'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
          <Calendar className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">
            Нет матчей, подходящих под критерии предматчевых стратегий
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Попробуйте расширить коридор коэффициентов ТБ 2.5 или снизить требования к числу очных матчей (H2H)
          </p>
        </div>
      )}
    </div>
  );
};
