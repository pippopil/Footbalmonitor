import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Award,
  BarChart3,
  Percent,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Zap,
  Target,
  Scale,
  Calendar,
  Layers,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { FilterRule, BacktestResult } from '../types';
import { HISTORICAL_MATCHES } from '../data/historicalMatches';
import { runBacktest } from '../backtestEngine';

interface BacktestingViewProps {
  filters: FilterRule[];
  onSelectFilterToEdit?: (filter: FilterRule) => void;
}

export const BacktestingView: React.FC<BacktestingViewProps> = ({ filters, onSelectFilterToEdit }) => {
  const [selectedFilterId, setSelectedFilterId] = useState<string>(filters[0]?.id || 'f1');
  const [stakeAmount, setStakeAmount] = useState<number>(1000);
  const [oddsMode, setOddsMode] = useState<'dynamic' | 'fixed'>('dynamic');
  const [fixedOdds, setFixedOdds] = useState<number>(1.85);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Active filter
  const activeRule = useMemo(() => {
    return filters.find((f) => f.id === selectedFilterId) || filters[0];
  }, [filters, selectedFilterId]);

  // Backtest result for selected filter
  const backtestResult = useMemo<BacktestResult>(() => {
    if (!activeRule) {
      return {
        ruleId: 'none',
        ruleName: 'Нет стратегии',
        targetMarket: '',
        totalMatchesScanned: HISTORICAL_MATCHES.length,
        totalSignals: 0,
        wins: 0,
        losses: 0,
        refunds: 0,
        winRate: 0,
        totalProfit: 0,
        roi: 0,
        avgOdds: 0,
        maxDrawdown: 0,
        profitFactor: 0,
        signals: [],
        equityCurve: [],
      };
    }
    return runBacktest(activeRule, HISTORICAL_MATCHES, oddsMode === 'fixed' ? fixedOdds : undefined);
  }, [activeRule, oddsMode, fixedOdds]);

  // Comparison matrix for all filters
  const allFiltersComparison = useMemo(() => {
    return filters.map((f) => {
      const res = runBacktest(f, HISTORICAL_MATCHES, oddsMode === 'fixed' ? fixedOdds : undefined);
      return {
        filter: f,
        result: res,
      };
    }).sort((a, b) => b.result.roi - a.result.roi);
  }, [filters, oddsMode, fixedOdds]);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
    }, 400);
  };

  const filteredSignals = useMemo(() => {
    if (outcomeFilter === 'ALL') return backtestResult.signals;
    return backtestResult.signals.filter((s) => s.outcome === outcomeFilter);
  }, [backtestResult.signals, outcomeFilter]);

  // Equity Curve SVG calculation
  const svgWidth = 700;
  const svgHeight = 220;
  const padding = 35;

  const curveData = backtestResult.equityCurve;
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
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Лаборатория бэктестинга и трекер ROI
                  <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live Engine v2
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Исторический прогон на {HISTORICAL_MATCHES.length} матчах с расчетом вероятности захода, профита и просадки
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-emerald-950/40 disabled:opacity-50"
            >
              {isSimulating ? (
                <RotateCcw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-white" />
              )}
              {isSimulating ? 'Прогон базы...' : 'Пересчитать бэктест'}
            </button>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Strategy Selector */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-medium flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-sky-400" />
              Тестируемая стратегия:
            </label>
            <select
              value={selectedFilterId}
              onChange={(e) => setSelectedFilterId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium focus:border-sky-500 focus:outline-none"
            >
              {filters.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} {f.targetMarket ? `(${f.targetMarket})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Odds Mode */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-medium flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5 text-amber-400" />
              Модель коэффициентов:
            </label>
            <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setOddsMode('dynamic')}
                className={`flex-1 py-1 rounded text-[11px] font-medium transition ${
                  oddsMode === 'dynamic'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Динамический
              </button>
              <button
                type="button"
                onClick={() => setOddsMode('fixed')}
                className={`flex-1 py-1 rounded text-[11px] font-medium transition ${
                  oddsMode === 'fixed'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Фикс. ({fixedOdds.toFixed(2)})
              </button>
            </div>
          </div>

          {/* Fixed odds adjustment if in fixed mode */}
          {oddsMode === 'fixed' ? (
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium flex items-center gap-1.5">
                <span>🎯</span> Размер фикс. кэфа:
              </label>
              <input
                type="number"
                step="0.05"
                min="1.10"
                max="5.00"
                value={fixedOdds}
                onChange={(e) => setFixedOdds(parseFloat(e.target.value) || 1.85)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono focus:border-sky-500 focus:outline-none"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                База данных матчей:
              </label>
              <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-mono text-[11px] flex items-center justify-between">
                <span>Топ-лиги Европы</span>
                <span className="text-emerald-400 font-bold">{HISTORICAL_MATCHES.length} матчей</span>
              </div>
            </div>
          )}

          {/* Stake Amount */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-medium flex items-center gap-1.5">
              <span>💰</span> Размер флета (ставка):
            </label>
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 focus-within:border-sky-500">
              <input
                type="number"
                step="100"
                min="100"
                max="100000"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(Math.max(10, parseInt(e.target.value) || 1000))}
                className="w-full bg-transparent text-white font-mono focus:outline-none"
              />
              <span className="text-slate-500 text-[11px]">₽ / unit</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Win Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Percent className="h-3 w-3 text-sky-400" />
            Проходимость (Win Rate)
          </div>
          <div className="text-2xl font-bold font-mono mt-1 text-white flex items-baseline gap-1">
            <span
              className={
                backtestResult.winRate >= 65
                  ? 'text-emerald-400'
                  : backtestResult.winRate >= 50
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }
            >
              {backtestResult.winRate}%
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {backtestResult.wins} побед / {backtestResult.losses} поражений
          </div>
        </div>

        {/* ROI */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            Доходность (ROI)
          </div>
          <div className="text-2xl font-bold font-mono mt-1 flex items-baseline gap-1">
            <span
              className={
                backtestResult.roi > 0
                  ? 'text-emerald-400'
                  : backtestResult.roi < 0
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }
            >
              {backtestResult.roi > 0 ? `+${backtestResult.roi}%` : `${backtestResult.roi}%`}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Возврат на инвестиции</div>
        </div>

        {/* Profit PnL */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Award className="h-3 w-3 text-amber-400" />
            Чистый профит (PnL)
          </div>
          <div className="text-2xl font-bold font-mono mt-1 text-white">
            <span className={backtestResult.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {backtestResult.totalProfit >= 0 ? `+${backtestResult.totalProfit}` : backtestResult.totalProfit}
            </span>
            <span className="text-xs text-slate-500 font-sans ml-1">флетов</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            {backtestResult.totalProfit >= 0 ? '+' : ''}
            {(backtestResult.totalProfit * stakeAmount).toLocaleString('ru-RU')} ₽
          </div>
        </div>

        {/* Signals Found */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Zap className="h-3 w-3 text-sky-400" />
            Сработало сигналов
          </div>
          <div className="text-2xl font-bold font-mono mt-1 text-white">
            {backtestResult.totalSignals}
            <span className="text-xs text-slate-500 font-normal ml-1 font-sans">
              / {backtestResult.totalMatchesScanned}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            В {((backtestResult.totalSignals / (backtestResult.totalMatchesScanned || 1)) * 100).toFixed(0)}% матчей
          </div>
        </div>

        {/* Avg Odds */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Target className="h-3 w-3 text-amber-400" />
            Средний кэф
          </div>
          <div className="text-2xl font-bold font-mono mt-1 text-amber-300">
            {backtestResult.avgOdds.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Маркет: {backtestResult.targetMarket || 'ТБ'}
          </div>
        </div>

        {/* Max Drawdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Scale className="h-3 w-3 text-rose-400" />
            Макс. просадка
          </div>
          <div className="text-2xl font-bold font-mono mt-1 text-rose-400">
            -{backtestResult.maxDrawdown.toFixed(2)}
            <span className="text-xs text-slate-500 font-sans ml-1">фл.</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            -{(backtestResult.maxDrawdown * stakeAmount).toLocaleString('ru-RU')} ₽
          </div>
        </div>
      </div>

      {/* Equity Curve (Bankroll Growth Chart) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Кривая динамики банка (Equity Curve)
            </h3>
            <p className="text-xs text-slate-400">
              Пошаговый баланс при фиксированной ставке 1 флет на каждый сработавший сигнал
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Победа (+{(backtestResult.avgOdds - 1).toFixed(2)} фл.)
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              Поражение (-1.00 фл.)
            </span>
          </div>
        </div>

        {/* SVG Chart Container */}
        <div className="relative bg-slate-950/80 border border-slate-800/80 rounded-xl p-2 overflow-hidden">
          {curveData.length <= 1 ? (
            <div className="h-44 flex items-center justify-center text-slate-500 text-xs">
              Нет сигналов по выбранным критериям фильтра в исторической базе.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-48 select-none"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                <line
                  x1={padding}
                  y1={zeroY}
                  x2={svgWidth - padding}
                  y2={zeroY}
                  stroke="#334155"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />

                {/* Area under curve */}
                <path d={areaPath} fill="url(#profitGrad)" />

                {/* Line */}
                <path
                  d={pointsPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points */}
                {curveData.map((d, i) => {
                  if (i === 0) return null;
                  const cx = getX(i);
                  const cy = getY(d.cumulativeProfit);
                  const isHovered = hoveredPointIndex === i;
                  return (
                    <g key={i} onMouseEnter={() => setHoveredPointIndex(i)} onMouseLeave={() => setHoveredPointIndex(null)}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 6 : 4}
                        className={
                          d.outcome === 'WIN'
                            ? 'fill-emerald-400 stroke-slate-950 stroke-2 cursor-pointer'
                            : 'fill-rose-400 stroke-slate-950 stroke-2 cursor-pointer'
                        }
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* Hovered point tooltip */}
          {hoveredPointIndex !== null && curveData[hoveredPointIndex] && (
            <div className="absolute top-3 left-6 bg-slate-900/95 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 shadow-xl pointer-events-none backdrop-blur">
              <div className="font-bold text-white">{curveData[hoveredPointIndex].matchName}</div>
              <div className="text-[11px] text-slate-400">
                Шаг #{hoveredPointIndex} • Исход:{' '}
                <span
                  className={
                    curveData[hoveredPointIndex].outcome === 'WIN'
                      ? 'text-emerald-400 font-bold'
                      : 'text-rose-400 font-bold'
                  }
                >
                  {curveData[hoveredPointIndex].outcome === 'WIN' ? 'ВЫИГРЫШ' : 'ПРОИГРЫШ'}
                </span>
              </div>
              <div className="font-mono text-emerald-300 text-xs mt-1">
                Баланс: {curveData[hoveredPointIndex].cumulativeProfit >= 0 ? '+' : ''}
                {curveData[hoveredPointIndex].cumulativeProfit} флетов (
                {(curveData[hoveredPointIndex].cumulativeProfit * stakeAmount).toLocaleString('ru-RU')} ₽)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Two Columns: Signal Details Table (Left) & All Strategies Comparison (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Signals Table (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Target className="h-4 w-4 text-sky-400" />
                Сработавшие сигналы в бэктесте ({filteredSignals.length})
              </h3>
              <p className="text-xs text-slate-400">
                Детальный расклад каждого матча, минуты входа и результата ставки
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setOutcomeFilter('ALL')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  outcomeFilter === 'ALL'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Все ({backtestResult.signals.length})
              </button>
              <button
                type="button"
                onClick={() => setOutcomeFilter('WIN')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  outcomeFilter === 'WIN'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ✅ Победы ({backtestResult.wins})
              </button>
              <button
                type="button"
                onClick={() => setOutcomeFilter('LOSS')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  outcomeFilter === 'LOSS'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ❌ Минусы ({backtestResult.losses})
              </button>
            </div>
          </div>

          {filteredSignals.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs bg-slate-950/50 rounded-lg border border-slate-800/60">
              По данным критериям сигналов не найдено.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-semibold uppercase">
                    <th className="py-2.5 px-3">Матч и лига</th>
                    <th className="py-2.5 px-3">Мин. входа</th>
                    <th className="py-2.5 px-3">Счет (вход → итог)</th>
                    <th className="py-2.5 px-3">Маркет</th>
                    <th className="py-2.5 px-3 text-center">Кэф</th>
                    <th className="py-2.5 px-3 text-center">Исход</th>
                    <th className="py-2.5 px-3 text-right">Профит</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSignals.map((sig) => (
                    <tr key={sig.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{sig.matchName}</div>
                        <div className="text-[10px] text-slate-500">{sig.league} • {sig.date}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-sky-400 font-mono font-bold">
                          {sig.minute}'
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono text-slate-200">
                          {sig.scoreAtSignal[0]}:{sig.scoreAtSignal[1]}
                          <span className="text-slate-500 mx-1.5">→</span>
                          <span className="font-bold text-emerald-400">
                            {sig.finalScore[0]}:{sig.finalScore[1]}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">Углы: {sig.finalCorners[0] + sig.finalCorners[1]}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[11px]">
                          {sig.targetMarket}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-semibold text-amber-300">
                        {sig.odds.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            sig.outcome === 'WIN'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                          }`}
                        >
                          {sig.outcome === 'WIN' ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              ВЫИГРЫШ
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                              ПРОИГРЫШ
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span className={sig.profit > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {sig.profit > 0 ? `+${sig.profit}` : sig.profit} фл.
                        </span>
                        <div className="text-[10px] text-slate-500 font-normal">
                          {sig.profit > 0 ? '+' : ''}
                          {(sig.profit * stakeAmount).toLocaleString('ru-RU')} ₽
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: All Strategies Leaderboard (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-400" />
              Рейтинг всех стратегий
            </h3>
            <p className="text-xs text-slate-400">
              Сравнение доходности фильтров на одинаковой базе матчей
            </p>
          </div>

          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
            {allFiltersComparison.map((item, idx) => {
              const isSelected = item.filter.id === selectedFilterId;
              const { result, filter } = item;
              return (
                <div
                  key={filter.id}
                  onClick={() => setSelectedFilterId(filter.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    isSelected
                      ? 'bg-slate-800/80 border-sky-500 shadow-md'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-xs text-white leading-tight">
                          {filter.name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {filter.targetMarket || 'Рынок голов'}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        result.roi > 0
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : result.roi < 0
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {result.roi > 0 ? `+${result.roi}%` : `${result.roi}%`} ROI
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2 border-t border-slate-800/80 text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Win Rate:</span>
                      <span className="font-mono font-bold text-slate-200">{result.winRate}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Сигналов:</span>
                      <span className="font-mono text-slate-300">
                        {result.wins}W / {result.losses}L
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block text-[10px]">Профит:</span>
                      <span
                        className={`font-mono font-bold ${
                          result.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {result.totalProfit >= 0 ? `+${result.totalProfit}` : result.totalProfit} фл.
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {onSelectFilterToEdit && (
            <button
              type="button"
              onClick={() => onSelectFilterToEdit(activeRule)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              Редактировать параметры стратегии
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
