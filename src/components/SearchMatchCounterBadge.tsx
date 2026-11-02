import React, { useState, useEffect, useRef, useMemo } from 'react';

export interface SearchMatchCounterBadgeProps {
  count: number;
  language: string;
}

// Hook for smooth count-up animation on numeric values
function useCountUp(targetValue: number, duration = 320): number {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const prevTargetRef = useRef(targetValue);
  const startValueRef = useRef(targetValue);
  const targetValueRef = useRef(targetValue);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Only trigger animation/state update if targetValue actually changed
    if (prevTargetRef.current === targetValue && displayValue === targetValue) {
      return;
    }
    prevTargetRef.current = targetValue;

    if (displayValue === targetValue) {
      startValueRef.current = targetValue;
      return;
    }

    startValueRef.current = displayValue;
    targetValueRef.current = targetValue;
    startTimeRef.current = null;

    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      // easeOutCubic: 1 - pow(1 - progress, 3)
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValueRef.current + (targetValueRef.current - startValueRef.current) * ease);

      // Only update state if the rounded integer value actually changed to minimize DOM repaints
      setDisplayValue((prev) => (prev === current ? prev : current));

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setDisplayValue((prev) => (prev === targetValueRef.current ? prev : targetValueRef.current));
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [targetValue, duration]);

  return displayValue;
}

export const SearchMatchCounterBadge: React.FC<SearchMatchCounterBadgeProps> = React.memo(
  function SearchMatchCounterBadge({ count, language }: SearchMatchCounterBadgeProps) {
    const animatedCount = useCountUp(count, 320);

    const formattedText = useMemo(() => {
      if (language === 'ru') {
        if (animatedCount % 10 === 1 && animatedCount % 100 !== 11) {
          return `Найден ${animatedCount} матч`;
        }
        if (
          animatedCount % 10 >= 2 &&
          animatedCount % 10 <= 4 &&
          (animatedCount % 100 < 10 || animatedCount % 100 >= 20)
        ) {
          return `Найдено ${animatedCount} матча`;
        }
        return `Найдено ${animatedCount} матчей`;
      }
      if (language === 'tr') {
        return `Bulunan ${animatedCount} maç`;
      }
      if (language === 'it') {
        return `${animatedCount} ${animatedCount === 1 ? 'partita trovata' : 'partite trovate'}`;
      }
      if (language === 'zh') {
        return `找到 ${animatedCount} 场比赛`;
      }
      return `Found ${animatedCount} ${animatedCount === 1 ? 'match' : 'matches'}`;
    }, [animatedCount, language]);

    return (
      <div
        id="search-match-counter-badge"
        className={`px-2.5 py-2 rounded-lg border transition-all duration-300 text-xs text-slate-300 shrink-0 whitespace-nowrap flex items-center gap-1.5 shadow-sm font-medium ${
          count > 0
            ? 'border-emerald-500/30 bg-emerald-950/20 shadow-emerald-950/30'
            : 'border-slate-800 bg-slate-900/95'
        }`}
        title="Количество матчей, соответствующих текущему поисковому запросу и фильтрам"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
            animatedCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
          }`}
        />
        <span className="text-slate-200 font-mono font-semibold transition-all duration-150 inline-block">
          {formattedText}
        </span>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Strict memoization comparison:
    // Only re-render when match count or language actually changes, avoiding any redundant DOM updates
    return prevProps.count === nextProps.count && prevProps.language === nextProps.language;
  }
);
