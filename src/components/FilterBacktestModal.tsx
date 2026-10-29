import React, { useState, useMemo } from 'react';
import {
  X,
  TrendingUp,
  Award,
  CheckCircle2,
  XCircle,
  BarChart3,
  Percent,
  Play,
  Download,
  Filter,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
  Trophy,
  Radio,
  Trash2,
  RefreshCw,
  Globe,
  Sliders,
} from 'lucide-react';
import { FilterRule, BacktestResult, HistoricalMatch } from '../types';
import { LARGE_HISTORICAL_MATCHES, getHistoricalMatchesByDatasetSize } from '../data/largeHistoricalDatabase';
import { loadAccumulatedLiveMatches, clearAccumulatedLiveDB } from '../services/liveMatchesDatabase';
import { runBacktest } from '../backtestEngine';
import { cleanPresetTitle, getStrategyCardDisplayName } from '../utils/filterDefaults';

interface FilterBacktestModalProps {
  filter: FilterRule | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleEnableFilter?: (filterId: string) => void;
  onOpenEditFilter?: (filter: FilterRule) => void;
  liveMatchesCount?: number;
  isDeveloper?: boolean;
}

export const FilterBacktestModal: React.FC<FilterBacktestModalProps> = ({
  filter,
  isOpen,
  onClose,
  onToggleEnableFilter,
  onOpenEditFilter,
  liveMatchesCount = 0,
  isDeveloper = false,
}) => {
  // Mode: 'archive' (1000+ historical dataset) or 'live_accumulated' (accumulated from scratch on current matches)
  const [dataMode, setDataMode] = useState<'archive' | 'live_accumulated'>('archive');
  const [datasetSize, setDatasetSize] = useState<'quick50' | 'standard1200' | 'deep2500'>('standard1200');
  const [stakeAmount, setStakeAmount] = useState<number>(1000);
  const [outcomeTab, setOutcomeTab] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'signals' | 'leagues'>('signals');
  const [accumulatedRefreshKey, setAccumulatedRefreshKey] = useState<number>(0);

  // Live accumulated matches from local DB
  const liveAccumulatedMatches = useMemo(() => {
    return loadAccumulatedLiveMatches();
  }, [accumulatedRefreshKey, isOpen]);

  const dataset: HistoricalMatch[] = useMemo(() => {
    if (dataMode === 'live_accumulated') {
      return liveAccumulatedMatches;
    }
    return getHistoricalMatchesByDatasetSize(datasetSize);
  }, [dataMode, datasetSize, liveAccumulatedMatches]);

  const result: BacktestResult = useMemo(() => {
    if (!filter) {
      return {
        ruleId: '',
        ruleName: '',
        targetMarket: '',
        totalMatchesScanned: 0,
        totalSignals: 0,
        wins: 0,
        losses: 0,
        refunds: 0,
        winRate: 0,
        totalProfit: 0,
        roi: 0,
        avgOdds: 1.70,
        maxDrawdown: 0,
        profitFactor: 0,
        signals: [],
        leagueStats: [],
        equityCurve: [],
      };
    }
    return runBacktest(filter, dataset);
  }, [filter, dataset]);

  if (!isOpen || !filter) return null;

  const filteredSignals = outcomeTab === 'ALL'
    ? result.signals
    : result.signals.filter((s) => s.outcome === outcomeTab);

  const isHighPerformance = result.winRate >= 80;

  // Equity Curve SVG
  const svgWidth = 650;
  const svgHeight = 160;
  const padding = 25;
  const curveData = result.equityCurve;
  const minProfit = Math.min(0, ...curveData.map((d) => d.cumulativeProfit));
  const maxProfit = Math.max(2, ...curveData.map((d) => d.cumulativeProfit));
  const rangeProfit = maxProfit - minProfit || 1;

  const getX = (index: number) => {
    if (curveData.length <= 1) return padding;
    return padding + (index / (curveData.length - 1)) * (svgWidth - padding * 2);
  };

  const getY = (val: number) => {
    const norm = (val - minProfit) / rangeProfit;
    return svgHeight - padding - norm * (svgHeight - padding * 2);
  };

  const zeroY = getY(0);

  const pointsPath = curveData.length > 0
    ? curveData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)},${getY(d.cumulativeProfit)}`).join(' ')
    : '';

  const areaPath = curveData.length > 0
    ? `${pointsPath} L ${getX(curveData.length - 1)},${zeroY} L ${getX(0)},${zeroY} Z`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white truncate">
                  {filter.isPreset && !isDeveloper ? getStrategyCardDisplayName(filter, isDeveloper) : filter.name}
                </h2>
                {isHighPerformance && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <ShieldCheck className="h-3 w-3" />
                    Win Rate &gt; 80%
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                Индивидуальное тестирование на базе {result.totalMatchesScanned} матчей • Расчет по лигам и проходимости
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Database Mode Switch: Live Accumulated from scratch vs 1000+ Historical Array */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">Источник массива для теста:</span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setDataMode('live_accumulated')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    dataMode === 'live_accumulated'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-950/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Radio className="h-3.5 w-3.5" />
                  <span>База Live-сигналов ({liveAccumulatedMatches.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDataMode('archive')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    dataMode === 'archive'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-950/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Архивная база (1 200+)</span>
                </button>
              </div>
            </div>

            {dataMode === 'live_accumulated' ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                <div className="text-slate-400 text-[11px] leading-relaxed">
                  🟢 <strong className="text-amber-300">Накопительный режим с нуля:</strong> данные пишутся в реальном времени из текущих матчей. Сохранено <strong className="text-white font-mono">{liveAccumulatedMatches.length}</strong> матчей.
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setAccumulatedRefreshKey((k) => k + 1)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Обновить
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearAccumulatedLiveDB();
                      setAccumulatedRefreshKey((k) => k + 1);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-500/30 hover:bg-rose-900/50 text-rose-300 text-[11px] font-medium flex items-center gap-1 transition"
                  >
                    <Trash2 className="h-3 w-3" />
                    Сбросить с нуля
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400 mr-1">Глубина архива:</span>
                  {(
                    [
                      { id: 'standard1200', label: '1 200 матчей' },
                      { id: 'deep2500', label: '2 500 матчей' },
                      { id: 'quick50', label: '180 матчей' },
                    ] as const
                  ).map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDatasetSize(d.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                        datasetSize === d.id
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                          : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">Флет ставки:</span>
                  <input
                    type="number"
                    min={100}
                    step={500}
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(Math.max(100, Number(e.target.value) || 1000))}
                    className="w-20 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-white text-right font-mono"
                  />
                  <span className="text-slate-500 text-[11px]">₽</span>
                </div>
              </div>
            )}
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-4 rounded-xl border ${isHighPerformance ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-slate-950/70 border-slate-800'}`}>
              <div className="text-[11px] text-slate-400 font-medium">Проходимость (Win Rate)</div>
              <div className="text-2xl font-bold font-mono mt-1 flex items-baseline gap-1">
                <span className={result.winRate >= 80 ? 'text-emerald-400 font-black' : result.winRate >= 65 ? 'text-sky-400' : 'text-amber-400'}>
                  {result.winRate}%
                </span>
                <span className="text-xs text-slate-500 font-normal">
                  ({result.wins}/{result.wins + result.losses})
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {result.winRate >= 80 ? '🔥 Премиум проход (>80%)' : 'Рабочая проходимость'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Средний коэффициент</div>
              <div className="text-2xl font-bold font-mono mt-1 text-white">
                ~{result.avgOdds.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Рынок: {filter.targetMarket || 'ТБ / Победа'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Доходность (ROI)</div>
              <div className="text-2xl font-bold font-mono mt-1">
                <span className={result.roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {result.roi >= 0 ? `+${result.roi}%` : `${result.roi}%`}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Сигналов: {result.totalSignals} из {result.totalMatchesScanned}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Чистый профит (PnL)</div>
              <div className="text-2xl font-bold font-mono mt-1">
                <span className={result.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {result.totalProfit >= 0 ? `+${(result.totalProfit * stakeAmount).toLocaleString('ru-RU')}` : `${(result.totalProfit * stakeAmount).toLocaleString('ru-RU')}`} ₽
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {result.totalProfit >= 0 ? '+' : ''}{result.totalProfit.toFixed(1)} флетов (флет {stakeAmount} ₽)
              </div>
            </div>
          </div>

          {/* Equity Curve SVG Chart */}
          {result.equityCurve.length > 2 && (
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  Кривая доходности стратегии (Equity Curve)
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  Профит фактор: {result.profitFactor === 999 ? '∞' : result.profitFactor} • Макс. просадка: -{result.maxDrawdown} фл.
                </span>
              </div>

              <div className="relative w-full h-[160px] overflow-hidden pt-2">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id={`grad-modal-${filter.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Zero line */}
                  <line
                    x1={padding}
                    y1={zeroY}
                    x2={svgWidth - padding}
                    y2={zeroY}
                    stroke="#334155"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  {/* Area */}
                  {areaPath && <path d={areaPath} fill={`url(#grad-modal-${filter.id})`} />}
                  {/* Stroke */}
                  {pointsPath && <path d={pointsPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                </svg>
              </div>
            </div>
          )}

          {/* Sub-Tabs: Signals list vs Leagues Breakdown */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('signals')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    activeSubTab === 'signals'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Target className="h-3.5 w-3.5 text-emerald-400" />
                  Сработавшие сигналы ({result.totalSignals})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('leagues')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    activeSubTab === 'leagues'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Trophy className="h-3.5 w-3.5 text-amber-400" />
                  Статистика по лигам ({result.leagueStats?.length || 0})
                </button>
              </div>

              {activeSubTab === 'signals' && (
                <div className="flex items-center gap-1 text-xs">
                  {(
                    [
                      { id: 'ALL', label: `Все (${result.totalSignals})` },
                      { id: 'WIN', label: `✅ Зашли (${result.wins})` },
                      { id: 'LOSS', label: `❌ Не зашли (${result.losses})` },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setOutcomeTab(tab.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                        outcomeTab === tab.id
                          ? 'bg-slate-800 text-white font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* TAB CONTENT: League Statistics Ranking */}
            {activeSubTab === 'leagues' && (
              <div className="space-y-3">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-300 flex items-center justify-between">
                  <span>🏆 Рейтинг лиг по лучшей проходимости прогнозов для <strong>«{filter.isPreset && !isDeveloper ? getStrategyCardDisplayName(filter, isDeveloper) : filter.name}»</strong></span>
                  <span className="text-[11px] text-slate-400">Сортировка: Win Rate % ↓</span>
                </div>

                {(!result.leagueStats || result.leagueStats.length === 0) ? (
                  <div className="p-8 text-center text-xs text-slate-500 rounded-xl border border-slate-800 bg-slate-950/50">
                    Нет данных по лигам для этой стратегии в текущей выборке
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-semibold uppercase bg-slate-950/80">
                          <th className="py-2.5 px-3">Ранг</th>
                          <th className="py-2.5 px-3">Лига</th>
                          <th className="py-2.5 px-3 text-center">Сигналов</th>
                          <th className="py-2.5 px-3 text-center">Проход (W/L)</th>
                          <th className="py-2.5 px-3 text-center">Win Rate</th>
                          <th className="py-2.5 px-3 text-center">Ср. Кэф</th>
                          <th className="py-2.5 px-3 text-right">Профит (фл)</th>
                          <th className="py-2.5 px-3 text-right">ROI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {result.leagueStats.map((l, index) => {
                          const isTopTier = l.winRate >= 80;
                          return (
                            <tr
                              key={l.league}
                              className={`hover:bg-slate-800/30 transition ${
                                index === 0 ? 'bg-emerald-950/10' : ''
                              }`}
                            >
                              <td className="py-2.5 px-3 font-mono font-bold">
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-white flex items-center gap-1.5">
                                <Globe className="h-3 w-3 text-slate-500" />
                                <span>{l.league}</span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                                {l.totalSignals}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono">
                                <span className="text-emerald-400 font-bold">{l.wins}W</span> / <span className="text-rose-400 font-bold">{l.losses}L</span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-xs ${
                                    isTopTier
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : l.winRate >= 65
                                      ? 'bg-sky-500/20 text-sky-300'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {l.winRate}%
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-slate-200">
                                ~{l.avgOdds.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold">
                                <span className={l.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                  {l.profit >= 0 ? `+${l.profit}` : l.profit} фл.
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono">
                                <span className={l.roi >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                  {l.roi >= 0 ? `+${l.roi}%` : `${l.roi}%`}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: Signals List */}
            {activeSubTab === 'signals' && (
              <div className="max-h-[280px] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/70 divide-y divide-slate-800/80">
                {filteredSignals.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    {dataMode === 'live_accumulated'
                      ? 'В накопительной базе Live-сигналов пока нет записей. Включите стратегию в сканере, и сигналы будут автоматически фиксироваться!'
                      : 'Нет сигналов в этой категории'}
                  </div>
                ) : (
                  filteredSignals.slice(0, 60).map((sig) => (
                    <div key={sig.id} className="p-3 text-xs flex items-center justify-between gap-3 hover:bg-slate-900/60 transition">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white">{sig.matchName}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-sky-300 font-medium">
                            {sig.league}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                            {sig.minute}' мин (счёт: {sig.scoreAtSignal.join(':')})
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Итог: {sig.finalScore.join(':')}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {sig.reason}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="font-mono font-bold text-slate-200">
                            кэф {sig.odds.toFixed(2)}
                          </div>
                          <div className="text-[10px] font-mono">
                            {sig.profit > 0 ? (
                              <span className="text-emerald-400 font-bold">+{(sig.profit * stakeAmount).toFixed(0)} ₽</span>
                            ) : (
                              <span className="text-rose-400 font-bold">-{(Math.abs(sig.profit) * stakeAmount).toFixed(0)} ₽</span>
                            )}
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                            sig.outcome === 'WIN'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {sig.outcome === 'WIN' ? 'WIN ✅' : 'LOSS ❌'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            {activeSubTab === 'signals' && filteredSignals.length > 60 && (
              <p className="text-[11px] text-slate-500 text-center">
                Показаны первые 60 сигналов из {filteredSignals.length} найденных в базе
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950/70 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Статус стратегии:</span>
            <span className={`font-bold ${filter.enabled ? 'text-emerald-400' : 'text-slate-500'}`}>
              {filter.enabled ? '🟢 Запущена в сканере' : '⚪ Остановлена'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenEditFilter && (!filter.isPreset || isDeveloper) && (
              <button
                onClick={() => {
                  onClose();
                  onOpenEditFilter(filter);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                Настроить фильтр
              </button>
            )}

            {onToggleEnableFilter && (
              <button
                onClick={() => {
                  onToggleEnableFilter(filter.id);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  filter.enabled
                    ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40'
                }`}
              >
                {filter.enabled ? 'Остановить стратегию' : 'Запустить в Live'}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
