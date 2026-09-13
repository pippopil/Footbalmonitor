import React, { useState, useMemo } from 'react';
import {
  FlaskConical,
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  Send,
  Sparkles,
  Sliders,
  ChevronRight,
  TrendingUp,
  Target,
  Flame,
  Shield,
  Activity,
  PlusCircle,
  RotateCcw,
  Check,
} from 'lucide-react';
import { Match, FilterRule } from '../types';
import { calculatePressureAnalysis, evaluateFilterRule, formatExtendedTelegramAlert } from '../algorithms';
import { getEstimatedOdds } from '../backtestEngine';

interface RealMatchTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMatches: Match[];
  filters: FilterRule[];
  onSendTelegramAlert?: (match: Match, rule: FilterRule) => Promise<{ ok: boolean; messageId?: number; error?: string }>;
  onOpenAIAnalyst?: (match: Match) => void;
  onAddMatchToLive?: (newMatch: Match) => void;
}

export const RealMatchTesterModal: React.FC<RealMatchTesterModalProps> = ({
  isOpen,
  onClose,
  currentMatches,
  filters,
  onSendTelegramAlert,
  onOpenAIAnalyst,
  onAddMatchToLive,
}) => {
  if (!isOpen) return null;

  // Selected base match or manual mode
  const [selectedMatchId, setSelectedMatchId] = useState<string>(currentMatches[0]?.id || 'custom');

  // Test match form state
  const [matchData, setMatchData] = useState<Match>(() => {
    return currentMatches[0] || {
      id: `test-match-${Date.now()}`,
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
        possession: [62, 38],
        dangerousAttacks: [58, 26],
        attacks: [102, 54],
        shotsOnTarget: [7, 2],
        shotsOffTarget: [6, 3],
        corners: [8, 2],
        yellowCards: [1, 2],
        redCards: [0, 0],
        xg: [1.85, 0.65],
      },
      momentum: [20, 35, 50, 70, 85],
      lastEvent: "67' Опасный удар фаворита в створ",
      odds: {
        home: 1.65,
        draw: 3.60,
        away: 5.50,
        over25: 1.62,
        over35: 2.10,
        under25: 2.20,
        btts: 1.65,
        handicap1: 1.55,
        itb1_25: 1.70,
      },
      history: {
        homeConcededLastMatch: 2,
        awayConcededLastMatch: 2,
        homeLostLastMatch: true,
        awayLostLastMatch: true,
        homeLast5NoZeroZero: true,
        awayLast5NoZeroZero: true,
        h2hOver15Pct: 85,
        predictedIpt: 2.95,
      },
    };
  });

  // When user picks an existing match from the select box
  const handleSelectPredefinedMatch = (id: string) => {
    setSelectedMatchId(id);
    const found = currentMatches.find((m) => m.id === id);
    if (found) {
      setMatchData(JSON.parse(JSON.stringify(found)));
    }
  };

  // Run evaluation against all filters
  const evaluationResults = useMemo(() => {
    return filters.map((rule) => {
      const res = evaluateFilterRule(matchData, rule);
      const estOdds = getEstimatedOdds(rule.targetMarket, matchData.minute);
      return {
        rule,
        ...res,
        estimatedOdds: estOdds,
      };
    });
  }, [matchData, filters]);

  const matchingRules = useMemo(() => {
    return evaluationResults.filter((r) => r.matches);
  }, [evaluationResults]);

  const nearMatchingRules = useMemo(() => {
    return evaluationResults.filter((r) => !r.matches && r.progressPercent >= 60);
  }, [evaluationResults]);

  const pressure = useMemo(() => {
    return calculatePressureAnalysis(matchData);
  }, [matchData]);

  // Sending status
  const [sendingRuleId, setSendingRuleId] = useState<string | null>(null);
  const [sendSuccessMsg, setSendSuccessMsg] = useState<string | null>(null);

  const handleTestSendAlert = async (rule: FilterRule) => {
    if (!onSendTelegramAlert) return;
    setSendingRuleId(rule.id);
    setSendSuccessMsg(null);
    try {
      const res = await onSendTelegramAlert(matchData, rule);
      if (res.ok) {
        setSendSuccessMsg(`✅ Сигнал по фильтру «${rule.name}» успешно отправлен в Telegram!`);
      } else {
        setSendSuccessMsg(`❌ Ошибка отправки: ${res.error || 'Неизвестная ошибка'}`);
      }
    } catch (e: any) {
      setSendSuccessMsg(`❌ Сетевая ошибка: ${e?.message || e}`);
    } finally {
      setSendingRuleId(null);
      setTimeout(() => setSendSuccessMsg(null), 5000);
    }
  };

  const handlePushToLiveQueue = () => {
    if (onAddMatchToLive) {
      onAddMatchToLive({
        ...matchData,
        id: `manual-${Date.now()}`,
      });
      setSendSuccessMsg('✅ Матч добавлен в Live-ленту мониторинга!');
      setTimeout(() => setSendSuccessMsg(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Лаборатория тестирования реальных матчей</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  LIVE TEST ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Проверьте любой реальный матч из БК или Flashscore на срабатывание всех {filters.length} стратегий
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Status Message */}
          {sendSuccessMsg && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
              sendSuccessMsg.startsWith('✅') ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
            }`}>
              <span>{sendSuccessMsg}</span>
              <button onClick={() => setSendSuccessMsg(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
          )}

          {/* Step 1: Pick Match or Enter Manual Stats */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span>1. Выберите реальный матч тура или настройте параметры</span>
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={selectedMatchId}
                  onChange={(e) => handleSelectPredefinedMatch(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="custom">-- Ручной ввод / Свой матч --</option>
                  {currentMatches.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.countryCode} {m.homeTeam} {m.score[0]}:{m.score[1]} {m.awayTeam} ({m.minute}') [{m.league}]
                    </option>
                  ))}
                </select>
                {onAddMatchToLive && (
                  <button
                    onClick={handlePushToLiveQueue}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                    title="Добавить этот матч в общий мониторинг приложения"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    В Live-ленту
                  </button>
                )}
              </div>
            </div>

            {/* Quick interactive parameters grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
              {/* Teams & Score */}
              <div className="col-span-2 space-y-1">
                <label className="text-[11px] text-slate-400 font-medium">Команды и лига</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    value={matchData.homeTeam}
                    onChange={(e) => setMatchData({ ...matchData, homeTeam: e.target.value })}
                    placeholder="Хозяева"
                    className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 font-semibold"
                  />
                  <input
                    type="text"
                    value={matchData.awayTeam}
                    onChange={(e) => setMatchData({ ...matchData, awayTeam: e.target.value })}
                    placeholder="Гости"
                    className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 font-semibold"
                  />
                </div>
              </div>

              {/* Minute */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-medium">Минута матча</label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={matchData.minute}
                  onChange={(e) => setMatchData({ ...matchData, minute: parseInt(e.target.value, 10) || 1 })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-emerald-400 font-mono font-bold"
                />
              </div>

              {/* Score */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-medium">Счет (1 : 2)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    value={matchData.score[0]}
                    onChange={(e) => setMatchData({ ...matchData, score: [parseInt(e.target.value, 10) || 0, matchData.score[1]] })}
                    className="w-1/2 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white font-mono font-bold text-center"
                  />
                  <span>:</span>
                  <input
                    type="number"
                    min={0}
                    value={matchData.score[1]}
                    onChange={(e) => setMatchData({ ...matchData, score: [matchData.score[0], parseInt(e.target.value, 10) || 0] })}
                    className="w-1/2 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white font-mono font-bold text-center"
                  />
                </div>
              </div>

              {/* Dangerous Attacks */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-medium">Опасные атаки</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    value={matchData.stats.dangerousAttacks[0]}
                    onChange={(e) => setMatchData({
                      ...matchData,
                      stats: {
                        ...matchData.stats,
                        dangerousAttacks: [parseInt(e.target.value, 10) || 0, matchData.stats.dangerousAttacks[1]],
                      },
                    })}
                    className="w-1/2 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-amber-400 font-mono text-center"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    min={0}
                    value={matchData.stats.dangerousAttacks[1]}
                    onChange={(e) => setMatchData({
                      ...matchData,
                      stats: {
                        ...matchData.stats,
                        dangerousAttacks: [matchData.stats.dangerousAttacks[0], parseInt(e.target.value, 10) || 0],
                      },
                    })}
                    className="w-1/2 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-amber-400 font-mono text-center"
                  />
                </div>
              </div>

              {/* Shots on target */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-medium">Удары в створ</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    value={matchData.stats.shotsOnTarget[0]}
                    onChange={(e) => setMatchData({
                      ...matchData,
                      stats: {
                        ...matchData.stats,
                        shotsOnTarget: [parseInt(e.target.value, 10) || 0, matchData.stats.shotsOnTarget[1]],
                      },
                    })}
                    className="w-1/2 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-blue-400 font-mono text-center"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    min={0}
                    value={matchData.stats.shotsOnTarget[1]}
                    onChange={(e) => setMatchData({
                      ...matchData,
                      stats: {
                        ...matchData.stats,
                        shotsOnTarget: [matchData.stats.shotsOnTarget[0], parseInt(e.target.value, 10) || 0],
                      },
                    })}
                    className="w-1/2 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-blue-400 font-mono text-center"
                  />
                </div>
              </div>

              {/* Corners */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-medium">Угловые (1 : 2)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    value={matchData.stats.corners[0]}
                    onChange={(e) => setMatchData({
                      ...matchData,
                      stats: {
                        ...matchData.stats,
                        corners: [parseInt(e.target.value, 10) || 0, matchData.stats.corners[1]],
                      },
                    })}
                    className="w-1/2 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-purple-400 font-mono text-center"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    min={0}
                    value={matchData.stats.corners[1]}
                    onChange={(e) => setMatchData({
                      ...matchData,
                      stats: {
                        ...matchData.stats,
                        corners: [matchData.stats.corners[0], parseInt(e.target.value, 10) || 0],
                      },
                    })}
                    className="w-1/2 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-purple-400 font-mono text-center"
                  />
                </div>
              </div>

              {/* Odds P1 & P2 */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-medium">Кэф П1 / П2</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.05"
                    value={matchData.odds.home}
                    onChange={(e) => setMatchData({
                      ...matchData,
                      odds: { ...matchData.odds, home: parseFloat(e.target.value) || 1.5 },
                    })}
                    className="w-1/2 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-center"
                  />
                  <span>/</span>
                  <input
                    type="number"
                    step="0.05"
                    value={matchData.odds.away}
                    onChange={(e) => setMatchData({
                      ...matchData,
                      odds: { ...matchData.odds, away: parseFloat(e.target.value) || 3.0 },
                    })}
                    className="w-1/2 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-center"
                  />
                </div>
              </div>

              {/* Odds Draw */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-medium">Кэф Ничья (X)</label>
                <input
                  type="number"
                  step="0.1"
                  value={matchData.odds.draw}
                  onChange={(e) => setMatchData({
                    ...matchData,
                    odds: { ...matchData.odds, draw: parseFloat(e.target.value) || 3.2 },
                  })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-center"
                />
              </div>

              {/* Odds TB 2.5 & TB 3.5 */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-medium">ТБ 2.5 / ТБ 3.5</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.05"
                    value={matchData.odds.over25}
                    onChange={(e) => setMatchData({
                      ...matchData,
                      odds: { ...matchData.odds, over25: parseFloat(e.target.value) || 1.8 },
                    })}
                    className="w-1/2 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-center"
                  />
                  <span>/</span>
                  <input
                    type="number"
                    step="0.05"
                    value={matchData.odds.over35 || 2.5}
                    onChange={(e) => setMatchData({
                      ...matchData,
                      odds: { ...matchData.odds, over35: parseFloat(e.target.value) || 2.5 },
                    })}
                    className="w-1/2 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-center"
                  />
                </div>
              </div>

              {/* Red cards */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-medium">Красные карточки</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    value={matchData.stats.redCards[0]}
                    onChange={(e) => setMatchData({
                      ...matchData,
                      stats: {
                        ...matchData.stats,
                        redCards: [parseInt(e.target.value, 10) || 0, matchData.stats.redCards[1]],
                      },
                    })}
                    className="w-1/2 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-rose-400 font-mono text-center"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    min={0}
                    value={matchData.stats.redCards[1]}
                    onChange={(e) => setMatchData({
                      ...matchData,
                      stats: {
                        ...matchData.stats,
                        redCards: [matchData.stats.redCards[0], parseInt(e.target.value, 10) || 0],
                      },
                    })}
                    className="w-1/2 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-rose-400 font-mono text-center"
                  />
                </div>
              </div>

              {/* Pressure readout */}
              <div className="space-y-1 flex flex-col justify-end">
                <div className="bg-slate-900 border border-slate-800 rounded p-1.5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Flame className="h-3 w-3 text-amber-400" />
                    Давление:
                  </span>
                  <span className="font-mono font-bold text-amber-400 text-xs">
                    {pressure.pressureIndex}/100
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Instant Results Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-400 font-medium">Сработало на 100% (СИГНАЛЫ)</span>
                <div className="text-2xl font-bold text-emerald-300 mt-1">
                  {matchingRules.length} <span className="text-xs font-normal text-slate-400">из {filters.length} фильтров</span>
                </div>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>

            <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-amber-400 font-medium">Близки к сигналу (≥ 60%)</span>
                <div className="text-2xl font-bold text-amber-300 mt-1">
                  {nearMatchingRules.length} <span className="text-xs font-normal text-slate-400">стратегий</span>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-amber-400" />
            </div>

            <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-indigo-400 font-medium">AI-Анализ матча</span>
                <div className="text-xs text-slate-300 mt-1">
                  {pressure.dominantSide !== 'balanced'
                    ? `Доминирует ${pressure.dominantTeamName}`
                    : 'Равная плотная борьба'}
                </div>
              </div>
              {onOpenAIAnalyst && (
                <button
                  onClick={() => onOpenAIAnalyst(matchData)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Запустить
                </button>
              )}
            </div>
          </div>

          {/* Step 3: Triggered Filters Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Сработавшие стратегии в этом матче ({matchingRules.length})</span>
            </h3>

            {matchingRules.length === 0 ? (
              <div className="p-6 rounded-xl border border-slate-800 bg-slate-950/40 text-center space-y-2">
                <AlertTriangle className="h-8 w-8 text-slate-500 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">Ни один фильтр не сработал на 100% при этих параметрах</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Измените минуту, счёт, количество опасных атак или котировки выше, чтобы увидеть, как алгоритмы реагируют на изменение игрового сценария.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {matchingRules.map(({ rule, estimatedOdds }) => (
                  <div
                    key={rule.id}
                    className="bg-slate-950/70 border border-emerald-500/40 rounded-xl p-4 space-y-3 shadow-md shadow-emerald-950/20"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="font-bold text-sm text-white">{rule.name}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{rule.description}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[11px]">
                        100% MATCH
                      </span>
                    </div>

                    <div className="bg-slate-900/80 rounded-lg p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Целевой маркет:</span>
                        <span className="font-bold text-amber-300">{rule.targetMarket || 'ТБ / Победа'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Расчетный кэф:</span>
                        <span className="font-bold text-emerald-400 font-mono">~{estimatedOdds.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500">
                        Мин: {rule.minMinute}'–{rule.maxMinute}' • Счет: {rule.scoreCondition}
                      </span>
                      {onSendTelegramAlert && (
                        <button
                          onClick={() => handleTestSendAlert(rule)}
                          disabled={sendingRuleId === rule.id}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                        >
                          <Send className="h-3 w-3" />
                          <span>{sendingRuleId === rule.id ? 'Отправка...' : 'В Telegram'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 4: Near Matches with Missing Criteria Breakdown */}
          {nearMatchingRules.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-400" />
                <span>Близкие стратегии и недостающие параметры ({nearMatchingRules.length})</span>
              </h3>

              <div className="space-y-2">
                {nearMatchingRules.slice(0, 6).map(({ rule, progressPercent, unmetCriteria }) => (
                  <div
                    key={rule.id}
                    className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{rule.name}</span>
                        <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                          {progressPercent}%
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-rose-400 font-medium">Не выполнено:</span>
                        {unmetCriteria.map((c, idx) => (
                          <span key={idx} className="bg-rose-500/10 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/20 text-[10px]">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="w-full sm:w-32 bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Источник матча: <strong className="text-slate-200 font-mono">{matchData.source}</strong></span>
            <span>•</span>
            <span>Параметры оцениваются по {filters.length} фильтрам</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
