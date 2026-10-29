import React, { useMemo } from 'react';
import { Match } from '../types';
import { Flame, TrendingUp, Activity, ShieldCheck, Zap } from 'lucide-react';

interface OffensiveTrendSparklineProps {
  match: Match;
}

interface TrendPoint {
  minute: number;
  homeIntensity: number;
  awayIntensity: number;
  diff: number;
}

export const OffensiveTrendSparkline: React.FC<OffensiveTrendSparklineProps> = ({ match }) => {
  const currentMinute = Math.max(match.minute || 1, 10);
  const homeDang = match.stats?.dangerousAttacks?.[0] ?? 0;
  const awayDang = match.stats?.dangerousAttacks?.[1] ?? 0;
  const homeAttacks = match.stats?.attacks?.[0] ?? 0;
  const awayAttacks = match.stats?.attacks?.[1] ?? 0;

  // Generate synthetic rolling offensive momentum trend points based on match momentum and stats
  const trendData = useMemo<TrendPoint[]>(() => {
    const rawMom = match.momentum || [10, 25, 30, 45, 20, 60, 75];
    const intervals = Math.max(rawMom.length, 6);
    const step = Math.max(Math.floor(currentMinute / intervals), 5);

    const points: TrendPoint[] = [];
    let accHome = 0;
    let accAway = 0;

    for (let i = 0; i < intervals; i++) {
      const min = Math.min((i + 1) * step, currentMinute);
      const val = rawMom[i % rawMom.length] ?? 0;

      // Positive val favors home, negative favors away
      const homeBase = (homeDang / currentMinute) * step * 10;
      const awayBase = (awayDang / currentMinute) * step * 10;

      const homeShift = Math.max(homeBase + val * 0.4 + (i % 2 === 0 ? 5 : -3), 5);
      const awayShift = Math.max(awayBase - val * 0.3 + (i % 2 === 1 ? 6 : -2), 5);

      accHome += homeShift;
      accAway += awayShift;

      points.push({
        minute: min,
        homeIntensity: Math.round(homeShift),
        awayIntensity: Math.round(awayShift),
        diff: Math.round(homeShift - awayShift),
      });
    }

    return points;
  }, [match.momentum, currentMinute, homeDang, awayDang]);

  // Calculate momentum consistency score (0 - 100%)
  const { homeConsistency, awayConsistency, dominantTeam, recent15MinDiff } = useMemo(() => {
    if (trendData.length < 2) {
      return {
        homeConsistency: 70,
        awayConsistency: 60,
        dominantTeam: match.homeTeam,
        recent15MinDiff: 12,
      };
    }

    const homeVals = trendData.map((p) => p.homeIntensity);
    const awayVals = trendData.map((p) => p.awayIntensity);

    const calcVar = (arr: number[]) => {
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      const dev = Math.sqrt(arr.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / arr.length);
      const consistency = Math.max(10, Math.min(98, Math.round(100 - (dev / (mean || 1)) * 40)));
      return consistency;
    };

    const hCons = calcVar(homeVals);
    const aCons = calcVar(awayVals);

    const lastSlice = trendData.slice(-3);
    const lastDiff = lastSlice.reduce((sum, p) => sum + p.diff, 0);

    const dom = lastDiff >= 0 ? match.homeTeam : match.awayTeam;

    return {
      homeConsistency: hCons,
      awayConsistency: aCons,
      dominantTeam: dom,
      recent15MinDiff: Math.abs(lastDiff),
    };
  }, [trendData, match.homeTeam, match.awayTeam]);

  // SVG Sparkline geometry calculation
  const svgWidth = 500;
  const svgHeight = 120;
  const padding = 15;

  const maxVal = Math.max(...trendData.flatMap((p) => [p.homeIntensity, p.awayIntensity]), 40);
  const minVal = 0;

  const getX = (idx: number) => padding + (idx / Math.max(trendData.length - 1, 1)) * (svgWidth - padding * 2);
  const getY = (val: number) => svgHeight - padding - ((val - minVal) / (maxVal - minVal || 1)) * (svgHeight - padding * 2);

  // SVG path strings
  const homePoints = trendData.map((p, i) => `${getX(i)},${getY(p.homeIntensity)}`);
  const awayPoints = trendData.map((p, i) => `${getX(i)},${getY(p.awayIntensity)}`);

  const homePath = `M ${homePoints.join(' L ')}`;
  const awayPath = `M ${awayPoints.join(' L ')}`;

  const homeArea = `${homePath} L ${getX(trendData.length - 1)},${svgHeight - padding} L ${getX(0)},${svgHeight - padding} Z`;
  const awayArea = `${awayPath} L ${getX(trendData.length - 1)},${svgHeight - padding} L ${getX(0)},${svgHeight - padding} Z`;

  const homeRate = (homeAttacks / currentMinute).toFixed(1);
  const awayRate = (awayAttacks / currentMinute).toFixed(1);

  return (
    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Интенсивность атакующего тренда</span>
              <span className="text-[10px] font-normal text-slate-400 lowercase font-mono">(sparkline)</span>
            </h4>
            <p className="text-[10px] text-slate-400">
              Стабильность моментума давления по отрезкам матча
            </p>
          </div>
        </div>

        {/* Dominance Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-300">
          <Flame className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
          <span className="truncate max-w-[150px]">Штурм: {dominantTeam}</span>
          <span className="font-mono text-[10px] bg-emerald-950/80 px-1 py-0.2 rounded">
            +{recent15MinDiff} DA
          </span>
        </div>
      </div>

      {/* SVG Dual Sparkline Chart */}
      <div className="relative bg-slate-900/60 rounded-xl p-2 border border-slate-800/80">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-28 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="homeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="awayGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={padding}
            y1={svgHeight - padding}
            x2={svgWidth - padding}
            y2={svgHeight - padding}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
          <line
            x1={padding}
            y1={svgHeight / 2}
            x2={svgWidth - padding}
            y2={svgHeight / 2}
            stroke="rgba(255,255,255,0.04)"
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          {/* Area Fills */}
          <path d={awayArea} fill="url(#awayGrad)" />
          <path d={homeArea} fill="url(#homeGrad)" />

          {/* Lines */}
          <path
            d={awayPath}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={homePath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points on Home Line */}
          {trendData.map((p, i) => (
            <circle
              key={`home-pt-${i}`}
              cx={getX(i)}
              cy={getY(p.homeIntensity)}
              r="3.5"
              fill="#10b981"
              stroke="#0f172a"
              strokeWidth="1.5"
            />
          ))}

          {/* Data Points on Away Line */}
          {trendData.map((p, i) => (
            <circle
              key={`away-pt-${i}`}
              cx={getX(i)}
              cy={getY(p.awayIntensity)}
              r="3"
              fill="#06b6d4"
              stroke="#0f172a"
              strokeWidth="1.5"
            />
          ))}
        </svg>

        {/* Sparkline Axis Labels */}
        <div className="flex justify-between text-[10px] text-slate-500 font-mono px-2 pt-1">
          <span>0'</span>
          {trendData.slice(1, -1).map((p, i) => (
            <span key={i}>{p.minute}'</span>
          ))}
          <span className="text-emerald-400 font-bold">{currentMinute}' (Сейчас)</span>
        </div>
      </div>

      {/* Momentum Consistency & APM Summary Bar */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        {/* Home Team Consistency */}
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-bold flex items-center gap-1.5 truncate">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="truncate">{match.homeTeam}</span>
            </span>
            <span className="font-mono text-emerald-400 font-bold text-xs">{homeConsistency}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              style={{ width: `${homeConsistency}%` }}
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
            <span>Темп: {homeRate} атак/мин</span>
            <span className="text-emerald-300 font-medium">{homeConsistency >= 75 ? 'Устойчивый' : 'Волновой'}</span>
          </div>
        </div>

        {/* Away Team Consistency */}
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-bold flex items-center gap-1.5 truncate">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shrink-0" />
              <span className="truncate">{match.awayTeam}</span>
            </span>
            <span className="font-mono text-cyan-400 font-bold text-xs">{awayConsistency}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              style={{ width: `${awayConsistency}%` }}
              className="h-full bg-cyan-500 rounded-full transition-all duration-500"
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
            <span>Темп: {awayRate} атак/мин</span>
            <span className="text-cyan-300 font-medium">{awayConsistency >= 75 ? 'Устойчивый' : 'Волновой'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
