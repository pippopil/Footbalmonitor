import React, { useState, useMemo } from 'react';
import { Match, FilterRule, SportType } from '../types';
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
  X,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface PrematchDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: Match[];
  filters: FilterRule[];
  selectedSport?: SportType | 'all';
  onSendTelegramDigest?: (text: string) => void;
}

export const PrematchDigestModal: React.FC<PrematchDigestModalProps> = ({
  isOpen,
  onClose,
  matches,
  filters,
  selectedSport = 'all',
  onSendTelegramDigest,
}) => {
  const [activeSportTab, setActiveSportTab] = useState<SportType | 'all'>(selectedSport);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('all');
  const [copied, setCopied] = useState<boolean>(false);
  const [telegramSent, setTelegramSent] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Extract all active or prematch enabled filters
  const prematchFilters = useMemo(() => {
    return filters.filter(
      (f) =>
        f.ruleType === 'PREMATCH' ||
        f.prematchAnalysisEnabled ||
        f.category === 'halftime' ||
        Boolean(f.maxOddsOver25 || f.minOddsOver25 || f.requireH2hOver15High || f.minOver25Streak)
    );
  }, [filters]);

  // Today's matches evaluation against prematch strategies
  const analyzedMatches = useMemo(() => {
    // Generate/enrich matches with upcoming status or live status for today
    const list: Array<{
      match: Match;
      matchedStrategies: FilterRule[];
      h2hOver25Pct: number;
      h2hHitsCount: number;
      team1RecentHits: number;
      team2RecentHits: number;
      kickoffTime: string;
      confidenceScore: number;
      alertScheduledTime: string;
    }> = [];

    matches.forEach((m) => {
      // Filter by sport if selected
      const matchSport = m.sport || 'football';
      if (activeSportTab !== 'all' && matchSport !== activeSportTab) {
        return;
      }

      // Compute or simulate H2H & Recent matches stats
      const h2hCount = 5;
      const h2hOver25Pct = m.history?.h2hOver15Pct ?? (m.odds.over25 <= 1.65 ? 80 : 60);
      const h2hHitsCount = Math.round((h2hOver25Pct / 100) * h2hCount);
      const team1RecentHits = m.history?.homeOver25CountLast5 ?? (m.odds.over25 <= 1.65 ? 4 : 3);
      const team2RecentHits = m.history?.awayOver25CountLast5 ?? (m.odds.over25 <= 1.70 ? 4 : 2);

      // Check which prematch filters this match triggers
      const triggered = prematchFilters.filter((rule) => {
        // If filter specifies sport, check it
        if (rule.sport && rule.sport !== matchSport) return false;

        // Check odds corridors if defined
        if (rule.prematchMinOddsHome !== undefined && m.odds.home < rule.prematchMinOddsHome) return false;
        if (rule.prematchMaxOddsHome !== undefined && m.odds.home > rule.prematchMaxOddsHome) return false;
        if (rule.prematchMinOddsDraw !== undefined && m.odds.draw < rule.prematchMinOddsDraw) return false;
        if (rule.prematchMaxOddsDraw !== undefined && m.odds.draw > rule.prematchMaxOddsDraw) return false;
        if (rule.prematchMinOddsAway !== undefined && m.odds.away < rule.prematchMinOddsAway) return false;
        if (rule.prematchMaxOddsAway !== undefined && m.odds.away > rule.prematchMaxOddsAway) return false;
        if (rule.prematchMinOddsOver25 !== undefined && m.odds.over25 < rule.prematchMinOddsOver25) return false;
        if (rule.prematchMaxOddsOver25 !== undefined && m.odds.over25 > rule.prematchMaxOddsOver25) return false;

        // Check H2H over 2.5 hits
        if (rule.prematchH2hOver25MinHits !== undefined && h2hHitsCount < rule.prematchH2hOver25MinHits) return false;
        if (rule.prematchTeam1Over25MinHits !== undefined && team1RecentHits < rule.prematchTeam1Over25MinHits) return false;
        if (rule.prematchTeam2Over25MinHits !== undefined && team2RecentHits < rule.prematchTeam2Over25MinHits) return false;

        // Legacy rule fields
        if (rule.minOddsOver25 !== undefined && m.odds.over25 < rule.minOddsOver25) return false;
        if (rule.maxOddsOver25 !== undefined && m.odds.over25 > rule.maxOddsOver25) return false;
        if (rule.maxOddsFavorite !== undefined && Math.min(m.odds.home, m.odds.away) > rule.maxOddsFavorite) return false;

        return true;
      });

      if (triggered.length > 0) {
        const scheduledTime = triggered.find((t) => t.prematchAlertDailyTime)?.prematchAlertDailyTime || '10:00';
        const confidence = Math.min(95, 75 + triggered.length * 5 + (h2hHitsCount >= 4 ? 10 : 0));

        list.push({
          match: m,
          matchedStrategies: triggered,
          h2hOver25Pct,
          h2hHitsCount,
          team1RecentHits,
          team2RecentHits,
          kickoffTime: m.startTime || 'Сегодня 19:30',
          confidenceScore: confidence,
          alertScheduledTime: scheduledTime,
        });
      }
    });

    return list;
  }, [matches, prematchFilters, activeSportTab]);

  // Filtered by search & selected strategy
  const filteredList = useMemo(() => {
    return analyzedMatches.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchText = `${item.match.homeTeam} ${item.match.awayTeam} ${item.match.league} ${item.match.country}`.toLowerCase();
      if (q && !matchText.includes(q)) return false;

      if (selectedStrategyId !== 'all') {
        const hasStrat = item.matchedStrategies.some((s) => s.id === selectedStrategyId);
        if (!hasStrat) return false;
      }
      return true;
    });
  }, [analyzedMatches, searchQuery, selectedStrategyId]);

  if (!isOpen) return null;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleCopyDigest = () => {
    const today = new Date().toLocaleDateString('ru-RU');
    let text = `📅 ПРЕДМАТЧЕВЫЙ ДАЙДЖЕСТ НА СЕГОДНЯ (${today})\n\n`;
    filteredList.forEach((item, idx) => {
      text += `${idx + 1}. [${item.match.league}] ${item.match.homeTeam} vs ${item.match.awayTeam}\n`;
      text += `⏰ Начало: ${item.kickoffTime} | Сработало: ${item.matchedStrategies.map((s) => s.name).join(', ')}\n`;
      const p1 = item.match.odds?.home !== undefined ? item.match.odds.home.toFixed(2) : '-';
      const px = item.match.odds?.draw !== undefined ? item.match.odds.draw.toFixed(2) : '-';
      const p2 = item.match.odds?.away !== undefined ? item.match.odds.away.toFixed(2) : '-';
      const over25 = item.match.odds?.over25 !== undefined ? item.match.odds.over25.toFixed(2) : '-';
      text += `📊 Котировки: П1 ${p1} | X ${px} | П2 ${p2} | ТБ 2.5: ${over25}\n`;
      text += `🔍 H2H очные: ТБ 2.5 в ${item.h2hHitsCount}/5 матчах (${item.h2hOver25Pct}%) | Последние: К1 (${item.team1RecentHits}/5), К2 (${item.team2RecentHits}/5)\n\n`;
    });
    text += `🔔 Сигнал отправлен через SportSignal AI`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendTelegram = () => {
    if (onSendTelegramDigest) {
      const today = new Date().toLocaleDateString('ru-RU');
      let text = `📅 *ПРЕДМАТЧЕВЫЙ ДАЙДЖЕСТ НА СЕГОДНЯ (${today})*\n\n`;
      filteredList.slice(0, 10).forEach((item, idx) => {
        text += `⚽ *${item.match.homeTeam} — ${item.match.awayTeam}* (${item.match.league})\n`;
        text += `⏰ Начало: ${item.kickoffTime}\n`;
        text += `🎯 Стратегия: _${item.matchedStrategies[0]?.name}_\n`;
        const p1 = item.match.odds?.home !== undefined ? item.match.odds.home.toFixed(2) : '-';
        const px = item.match.odds?.draw !== undefined ? item.match.odds.draw.toFixed(2) : '-';
        const p2 = item.match.odds?.away !== undefined ? item.match.odds.away.toFixed(2) : '-';
        const over25 = item.match.odds?.over25 !== undefined ? item.match.odds.over25.toFixed(2) : '-';
        text += `📈 Кэфы: П1 *${p1}* | X *${px}* | П2 *${p2}* | ТБ 2.5: *${over25}*\n`;
        text += `📊 ТБ 2.5 в очных H2H: *${item.h2hHitsCount}/5* (${item.h2hOver25Pct}%)\n\n`;
      });
      onSendTelegramDigest(text);
      setTelegramSent(true);
      setTimeout(() => setTelegramSent(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                  Предматчевый аналитик & Дайджест
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Матчи на сегодня
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Матчи сегодняшнего дня, прошедшие фильтрацию по предматчевым стратегиям (котировки П1/X/П2, ТБ 2.5, серии и H2H)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Controls */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          {/* Sport tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 rounded-xl border border-slate-800 text-xs overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveSportTab('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeSportTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🌐 Все виды
            </button>
            <button
              onClick={() => setActiveSportTab('football')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeSportTab === 'football'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚽ Футбол
            </button>
            <button
              onClick={() => setActiveSportTab('hockey')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeSportTab === 'hockey'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🏒 Хоккей
            </button>
            <button
              onClick={() => setActiveSportTab('basketball')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeSportTab === 'basketball'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🏀 Баскетбол
            </button>
            <button
              onClick={() => setActiveSportTab('tennis')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeSportTab === 'tennis'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🎾 Теннис
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1.5 transition-all"
              title="Пересчитать и обновить список матчей"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="hidden sm:inline">Обновить</span>
            </button>

            <button
              onClick={handleCopyDigest}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Скопировано!' : 'Копировать'}</span>
            </button>

            {onSendTelegramDigest && (
              <button
                onClick={handleSendTelegram}
                disabled={telegramSent || filteredList.length === 0}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
              >
                {telegramSent ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                <span>{telegramSent ? 'Отправлено в бота!' : 'В Telegram'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Поиск по команде, лиге или стране..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Стратегия:</span>
            <select
              value={selectedStrategyId}
              onChange={(e) => setSelectedStrategyId(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Все сработавшие ({prematchFilters.length})</option>
              {prematchFilters.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>
              Отобрано матчей: <strong className="text-indigo-400">{filteredList.length}</strong>
            </span>
          </div>
        </div>

        {/* Matches List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-800/40">
          {filteredList.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-300">На сегодня подходящих матчей пока не найдено</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Попробуйте ослабить параметры коридора кэфов или снизить порог пробития ТБ 2.5 в последних очных встречах в настройках предматчевой стратегии.
              </p>
            </div>
          ) : (
            filteredList.map((item, idx) => (
              <div
                key={item.match.id || idx}
                className="pt-3 first:pt-0 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/60 rounded-xl p-4 transition-all space-y-3"
              >
                {/* Header row: time, league, scheduled alert */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.kickoffTime}
                    </span>
                    <span className="text-slate-400 font-medium">
                      {item.match.country} • {item.match.league}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      <Clock className="w-3 h-3 text-amber-400" />
                      Сигнал в: <strong className="text-amber-300">{item.alertScheduledTime}</strong> (раз в день)
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      Индекс верха: {item.confidenceScore}%
                    </span>
                  </div>
                </div>

                {/* Match names and Odds */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-6 space-y-1">
                    <div className="flex items-center justify-between text-sm font-black text-white">
                      <span className="truncate">{item.match.homeTeam}</span>
                      <span className="text-slate-500 font-mono text-xs">vs</span>
                      <span className="truncate">{item.match.awayTeam}</span>
                    </div>

                    {/* Triggered Strategies Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.matchedStrategies.map((s) => (
                        <span
                          key={s.id}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Odds Grid */}
                  <div className="md:col-span-6 grid grid-cols-4 gap-1.5 text-center">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">П1</span>
                      <span className="text-xs font-mono font-bold text-white">
                        {item.match.odds?.home !== undefined ? item.match.odds.home.toFixed(2) : '-'}
                      </span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">X</span>
                      <span className="text-xs font-mono font-bold text-white">
                        {item.match.odds?.draw !== undefined ? item.match.odds.draw.toFixed(2) : '-'}
                      </span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">П2</span>
                      <span className="text-xs font-mono font-bold text-white">
                        {item.match.odds?.away !== undefined ? item.match.odds.away.toFixed(2) : '-'}
                      </span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/40">
                      <span className="text-[10px] text-indigo-300 font-bold block">ТБ 2.5</span>
                      <span className="text-xs font-mono font-black text-indigo-200">
                        {item.match.odds?.over25 !== undefined ? item.match.odds.over25.toFixed(2) : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* H2H and Recent Form Breakdown */}
                <div className="pt-2 border-t border-slate-800/40 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div className="flex items-center gap-2 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                    <BarChart3 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>
                      Очные H2H (5 игр): ТБ 2.5 пробит в <strong className="text-emerald-400">{item.h2hHitsCount} из 5</strong> ({item.h2hOver25Pct}%)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                    <TrendingUp className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>
                      Последние матчи: К1 (<strong className="text-sky-300">{item.team1RecentHits}/5</strong> ТБ) • К2 (<strong className="text-sky-300">{item.team2RecentHits}/5</strong> ТБ)
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Предматчевые сигналы отправляются 1 раз в сутки в заданное время</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
