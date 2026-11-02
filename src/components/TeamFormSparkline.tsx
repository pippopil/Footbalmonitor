import React, { useMemo } from 'react';
import { Match } from '../types';
import { getTeamRecentForm, getTeamWinStreak } from '../algorithms';
import { Flame, Trophy, TrendingUp } from 'lucide-react';

interface TeamFormSparklineProps {
  match: Match;
  compact?: boolean;
}

export const TeamFormSparkline: React.FC<TeamFormSparklineProps> = ({ match, compact = false }) => {
  const homeForm = useMemo(() => getTeamRecentForm(match, 'home', 5), [match]);
  const awayForm = useMemo(() => getTeamRecentForm(match, 'away', 5), [match]);
  const homeStreak = useMemo(() => getTeamWinStreak(match, 'home'), [match]);
  const awayStreak = useMemo(() => getTeamWinStreak(match, 'away'), [match]);

  const outcomeScore = (result: 'W' | 'D' | 'L'): number => {
    switch (result) {
      case 'W':
        return 3;
      case 'D':
        return 2;
      case 'L':
        return 1;
      default:
        return 2;
    }
  };

  const renderSparklineSvg = (form: Array<'W' | 'D' | 'L'>, colorScheme: 'emerald' | 'blue') => {
    const width = 110;
    const height = 26;
    const paddingX = 8;
    const paddingY = 5;

    const stepX = (width - paddingX * 2) / Math.max(form.length - 1, 1);
    const scaleY = (val: number) => {
      // val from 1 (Loss) to 3 (Win)
      // normalized to height - paddingY (bottom) down to paddingY (top)
      const ratio = (val - 1) / 2; // 0 to 1
      return height - paddingY - ratio * (height - paddingY * 2);
    };

    const points = form.map((res, idx) => ({
      x: paddingX + idx * stepX,
      y: scaleY(outcomeScore(res)),
      result: res,
    }));

    const pathD = points.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    const strokeColor = colorScheme === 'emerald' ? '#10b981' : '#38bdf8';
    const fillColor = colorScheme === 'emerald' ? 'url(#green-glow)' : 'url(#blue-glow)';

    return (
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="green-glow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="blue-glow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Shaded Area */}
        <path d={areaD} fill={fillColor} />
        {/* Sparkline Path */}
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Coordinate Points */}
        {points.map((pt, i) => {
          const ptColor =
            pt.result === 'W' ? '#10b981' : pt.result === 'D' ? '#f59e0b' : '#f43f5e';
          return (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={i === points.length - 1 ? 3 : 2}
              fill={ptColor}
              stroke="#0f172a"
              strokeWidth="1.5"
            />
          );
        })}
      </svg>
    );
  };

  const renderBadge = (res: 'W' | 'D' | 'L', idx: number) => {
    const config =
      res === 'W'
        ? { label: 'В', bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/40', title: 'Победа' }
        : res === 'D'
        ? { label: 'Н', bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/40', title: 'Ничья' }
        : { label: 'П', bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/40', title: 'Поражение' };

    return (
      <span
        key={idx}
        title={config.title}
        className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold font-mono border ${config.bg} ${config.text} ${config.border} shadow-sm shrink-0`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] space-y-1.5">
      <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-1">
        <span className="flex items-center gap-1 text-slate-400">
          <TrendingUp className="h-3 w-3 text-emerald-400" />
          <span>Динамика формы (последние 5 матчей):</span>
        </span>
        {(homeStreak >= 2 || awayStreak >= 2) && (
          <span className="flex items-center gap-1 font-mono text-[10px] text-amber-300 font-bold bg-amber-500/15 px-1.5 py-0.2 rounded border border-amber-500/30">
            <Flame className="h-3 w-3 text-amber-400 fill-amber-400" />
            {homeStreak >= 2 && awayStreak >= 2
              ? `Серии: К1 ${homeStreak}W | К2 ${awayStreak}W`
              : homeStreak >= 2
              ? `${match.homeTeam.slice(0, 8)}: ${homeStreak} победы подряд`
              : `${match.awayTeam.slice(0, 8)}: ${awayStreak} победы подряд`}
          </span>
        )}
      </div>

      {/* Home Team Row */}
      <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-bold text-slate-300 truncate max-w-[95px] sm:max-w-[120px]">
            {match.homeTeam}
          </span>
          {homeStreak >= 3 && (
            <span
              className="text-[9px] font-bold text-emerald-300 bg-emerald-500/20 px-1 py-0.2 rounded border border-emerald-500/40 shrink-0 flex items-center gap-0.5"
              title={`Победная серия: ${homeStreak} матчей подряд`}
            >
              <Trophy className="h-2.5 w-2.5 text-emerald-400" />
              {homeStreak}W
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Sparkline Graphic */}
          <div className="hidden sm:block opacity-90">{renderSparklineSvg(homeForm, 'emerald')}</div>
          {/* Badges W/D/L */}
          <div className="flex items-center gap-0.5">
            {homeForm.map((res, i) => renderBadge(res, i))}
          </div>
        </div>
      </div>

      {/* Away Team Row */}
      <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-bold text-slate-300 truncate max-w-[95px] sm:max-w-[120px]">
            {match.awayTeam}
          </span>
          {awayStreak >= 3 && (
            <span
              className="text-[9px] font-bold text-sky-300 bg-sky-500/20 px-1 py-0.2 rounded border border-sky-500/40 shrink-0 flex items-center gap-0.5"
              title={`Победная серия: ${awayStreak} матчей подряд`}
            >
              <Trophy className="h-2.5 w-2.5 text-sky-400" />
              {awayStreak}W
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Sparkline Graphic */}
          <div className="hidden sm:block opacity-90">{renderSparklineSvg(awayForm, 'blue')}</div>
          {/* Badges W/D/L */}
          <div className="flex items-center gap-0.5">
            {awayForm.map((res, i) => renderBadge(res, i))}
          </div>
        </div>
      </div>
    </div>
  );
};
