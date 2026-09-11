import { FilterRule, HistoricalMatch, BacktestSignal, BacktestResult, SignalOutcome } from './types';
import { HISTORICAL_MATCHES } from './data/historicalMatches';
import { calculatePressureAnalysis } from './algorithms';

/**
 * Determine realistic odds for the target market and minute of entry
 */
export function getEstimatedOdds(targetMarket: string | undefined, minute: number): number {
  const marketLower = (targetMarket || '').toLowerCase();

  if (marketLower.includes('угл')) {
    if (minute >= 80) return 1.95;
    if (minute >= 60) return 1.85;
    return 1.80;
  }

  if (marketLower.includes('камбэк') || marketLower.includes('1x') || marketLower.includes('фора')) {
    return 2.15;
  }

  if (marketLower.includes('1-м тайме') || marketLower.includes('первом тайме')) {
    if (minute >= 35) return 2.10;
    return 1.78;
  }

  // Goals (ТБ 0.5 / ТБ 1.5)
  if (minute >= 80) return 2.35;
  if (minute >= 70) return 1.88;
  if (minute >= 60) return 1.62;
  return 1.75;
}

/**
 * Evaluates whether a target market won or lost given the match evolution
 */
export function evaluateMarketOutcome(
  targetMarket: string | undefined,
  ruleCategory: string | undefined,
  signalMinute: number,
  scoreAtSignal: [number, number],
  finalScore: [number, number],
  cornersAtSignal: [number, number],
  finalCorners: [number, number]
): { outcome: SignalOutcome; reason: string } {
  const market = (targetMarket || '').toLowerCase();
  const goalsAtSignal = scoreAtSignal[0] + scoreAtSignal[1];
  const finalGoals = finalScore[0] + finalScore[1];
  const newGoals = finalGoals - goalsAtSignal;

  const cornersSignalTotal = cornersAtSignal[0] + cornersAtSignal[1];
  const finalCornersTotal = finalCorners[0] + finalCorners[1];
  const newCorners = finalCornersTotal - cornersSignalTotal;

  // Category: Halftime goal
  if (ruleCategory === 'halftime' || market.includes('1-м тайме') || market.includes('первом тайме')) {
    // If signal was in 1st half and at least 1 goal was scored before FT (or specifically new goal scored)
    if (newGoals >= 1) {
      return {
        outcome: 'WIN',
        reason: `Гол забит после сигнала (счет сменился с ${scoreAtSignal[0]}:${scoreAtSignal[1]} на ${finalScore[0]}:${finalScore[1]})`,
      };
    }
    return {
      outcome: 'LOSS',
      reason: `Гол не состоялся (итоговый счет ${finalScore[0]}:${finalScore[1]})`,
    };
  }

  // Category: Corners
  if (ruleCategory === 'corners' || market.includes('угл')) {
    // Usually betting on 2+ additional corners or Total Over 9.5
    if (newCorners >= 2 || finalCornersTotal >= 10) {
      return {
        outcome: 'WIN',
        reason: `Подано +${newCorners} угловых после сигнала (итого ${finalCornersTotal} угловых)`,
      };
    }
    return {
      outcome: 'LOSS',
      reason: `Не хватило угловых: всего +${newCorners} после сигнала (итого ${finalCornersTotal})`,
    };
  }

  // Category: Comeback
  if (ruleCategory === 'comeback' || market.includes('камбэк') || market.includes('1x')) {
    const trailingHome = scoreAtSignal[0] < scoreAtSignal[1];
    const trailingAway = scoreAtSignal[1] < scoreAtSignal[0];

    if (trailingHome) {
      // Home had to tie or win
      if (finalScore[0] >= finalScore[1]) {
        return {
          outcome: 'WIN',
          reason: `Камбэк хозяев удался: итоговый счет ${finalScore[0]}:${finalScore[1]} (был ${scoreAtSignal[0]}:${scoreAtSignal[1]})`,
        };
      }
    } else if (trailingAway) {
      if (finalScore[1] >= finalScore[0]) {
        return {
          outcome: 'WIN',
          reason: `Камбэк гостей удался: итоговый счет ${finalScore[0]}:${finalScore[1]} (был ${scoreAtSignal[0]}:${scoreAtSignal[1]})`,
        };
      }
    }
    return {
      outcome: 'LOSS',
      reason: `Отстающая команда не смогла сравнять (итоговый счет ${finalScore[0]}:${finalScore[1]})`,
    };
  }

  // Default: Total Over Goals (ТБ 0.5 во 2-м тайме / еще гол)
  if (newGoals >= 1) {
    return {
      outcome: 'WIN',
      reason: `Забит гол в матче: счет ${scoreAtSignal[0]}:${scoreAtSignal[1]} → ${finalScore[0]}:${finalScore[1]} (+${newGoals})`,
    };
  }

  return {
    outcome: 'LOSS',
    reason: `Счет не изменился до конца матча (${finalScore[0]}:${finalScore[1]})`,
  };
}

/**
 * Checks if a historical snapshot matches the filter rule criteria
 */
function snapshotMatchesRule(
  snapshot: HistoricalMatch['snapshots'][0],
  rule: FilterRule,
  match: HistoricalMatch
): { matches: boolean; reason: string } {
  const { minute, score, stats } = snapshot;

  // 1. Minute check
  if (minute < rule.minMinute || minute > rule.maxMinute) {
    return { matches: false, reason: `Минута ${minute}' вне диапазона [${rule.minMinute}-${rule.maxMinute}]` };
  }

  // 2. Score condition check
  const [homeScore, awayScore] = score;
  const scoreDiff = homeScore - awayScore;

  if (rule.scoreCondition === '0-0' && (homeScore !== 0 || awayScore !== 0)) {
    return { matches: false, reason: 'Счет не 0:0' };
  }
  if (rule.scoreCondition === 'DRAW' && homeScore !== awayScore) {
    return { matches: false, reason: 'Не ничейный счет' };
  }
  if (rule.scoreCondition === 'HOME_LEAD' && scoreDiff <= 0) {
    return { matches: false, reason: 'Хозяева не ведут в счете' };
  }
  if (rule.scoreCondition === 'AWAY_LEAD' && scoreDiff >= 0) {
    return { matches: false, reason: 'Гости не ведут в счете' };
  }
  if (rule.scoreCondition === 'ONE_GOAL_DIFF' && Math.abs(scoreDiff) !== 1) {
    return { matches: false, reason: 'Разница не в 1 гол' };
  }
  if (rule.scoreCondition === 'TOTAL_UNDER_2' && homeScore + awayScore > 2) {
    return { matches: false, reason: 'Тотал больше 2' };
  }
  if (rule.scoreCondition === 'TOTAL_OVER_2' && homeScore + awayScore <= 2) {
    return { matches: false, reason: 'Тотал меньше или равен 2' };
  }

  // 3. Dangerous attacks difference
  const dangDiff = Math.abs(stats.dangerousAttacks[0] - stats.dangerousAttacks[1]);
  if (rule.minDangerousAttacksDiff && dangDiff < rule.minDangerousAttacksDiff) {
    return { matches: false, reason: `Разница оп. атак ${dangDiff} < ${rule.minDangerousAttacksDiff}` };
  }

  // 4. Dangerous attacks total
  const dangTotal = stats.dangerousAttacks[0] + stats.dangerousAttacks[1];
  if (rule.minDangerousAttacksTotal && dangTotal < rule.minDangerousAttacksTotal) {
    return { matches: false, reason: `Всего оп. атак ${dangTotal} < ${rule.minDangerousAttacksTotal}` };
  }

  // 5. Total shots
  const totalShots = stats.shotsOnTarget[0] + stats.shotsOnTarget[1] + stats.shotsOffTarget[0] + stats.shotsOffTarget[1];
  if (rule.minTotalShots && totalShots < rule.minTotalShots) {
    return { matches: false, reason: `Всего ударов ${totalShots} < ${rule.minTotalShots}` };
  }

  // 6. Shots on target total
  const shotsOnTargetTotal = stats.shotsOnTarget[0] + stats.shotsOnTarget[1];
  if (rule.minShotsOnTargetTotal && shotsOnTargetTotal < rule.minShotsOnTargetTotal) {
    return { matches: false, reason: `Ударов в створ ${shotsOnTargetTotal} < ${rule.minShotsOnTargetTotal}` };
  }

  // 7. Total corners
  const totalCorners = stats.corners[0] + stats.corners[1];
  if (rule.minTotalCorners && totalCorners < rule.minTotalCorners) {
    return { matches: false, reason: `Всего угловых ${totalCorners} < ${rule.minTotalCorners}` };
  }

  // 8. Total xG
  const totalXg = stats.xg[0] + stats.xg[1];
  if (rule.minXgTotal && totalXg < rule.minXgTotal) {
    return { matches: false, reason: `Суммарный xG ${totalXg.toFixed(2)} < ${rule.minXgTotal}` };
  }

  // 9. Red card check
  const totalReds = stats.redCards[0] + stats.redCards[1];
  if (rule.redCardCondition === 'HAS_RED_CARD' && totalReds === 0) {
    return { matches: false, reason: 'Нет красных карточек' };
  }
  if (rule.redCardCondition === 'NO_RED_CARDS' && totalReds > 0) {
    return { matches: false, reason: 'В матче есть удаление' };
  }

  // 10. Pressure index calculation
  if (rule.minPressureIndex) {
    const mockMatch = {
      id: match.id,
      country: match.country,
      countryCode: match.countryCode,
      league: match.league,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      score,
      minute,
      status: 'LIVE' as const,
      source: 'Flashscore' as const,
      stats,
      momentum: [],
      lastEvent: '',
      odds: { home: 2.0, draw: 3.2, away: 3.5, over25: 1.85 },
    };
    const pressure = calculatePressureAnalysis(mockMatch);
    if (pressure.pressureIndex < rule.minPressureIndex) {
      return {
        matches: false,
        reason: `Индекс давления ${pressure.pressureIndex}% < ${rule.minPressureIndex}%`,
      };
    }
  }

  return { matches: true, reason: 'Все критерии фильтра выполнены' };
}

/**
 * Runs a complete historical backtest for a given strategy rule
 */
export function runBacktest(
  rule: FilterRule,
  historicalMatches: HistoricalMatch[] = HISTORICAL_MATCHES,
  customFixedOdds?: number
): BacktestResult {
  const signals: BacktestSignal[] = [];

  for (const match of historicalMatches) {
    // Check snapshots in chronological order
    // A rule can trigger at most ONCE per match to avoid multi-counting
    for (const snapshot of match.snapshots) {
      const matchCheck = snapshotMatchesRule(snapshot, rule, match);

      if (matchCheck.matches) {
        const odds = customFixedOdds || getEstimatedOdds(rule.targetMarket, snapshot.minute);
        const { outcome, reason } = evaluateMarketOutcome(
          rule.targetMarket,
          rule.category,
          snapshot.minute,
          snapshot.score,
          match.finalScore,
          snapshot.stats.corners,
          match.finalCorners
        );

        let profit = 0;
        if (outcome === 'WIN') {
          profit = Number((odds - 1).toFixed(2));
        } else if (outcome === 'LOSS') {
          profit = -1.0;
        } else if (outcome === 'REFUND') {
          profit = 0.0;
        }

        signals.push({
          id: `bt-sig-${rule.id}-${match.id}-${snapshot.minute}`,
          matchId: match.id,
          matchName: `${match.homeTeam} vs ${match.awayTeam}`,
          league: match.league,
          date: match.date,
          minute: snapshot.minute,
          scoreAtSignal: snapshot.score,
          finalScore: match.finalScore,
          finalCorners: match.finalCorners,
          ruleId: rule.id,
          ruleName: rule.name,
          targetMarket: rule.targetMarket || 'ТБ 0.5 во 2-м тайме',
          odds,
          outcome,
          profit,
          reason,
          statsAtSignal: snapshot.stats,
        });

        // Triggered once for this match, proceed to next match
        break;
      }
    }
  }

  const wins = signals.filter((s) => s.outcome === 'WIN').length;
  const losses = signals.filter((s) => s.outcome === 'LOSS').length;
  const refunds = signals.filter((s) => s.outcome === 'REFUND').length;
  const resolved = wins + losses;

  const winRate = resolved > 0 ? Number(((wins / resolved) * 100).toFixed(1)) : 0;
  const totalProfit = Number(signals.reduce((acc, s) => acc + s.profit, 0).toFixed(2));
  const roi = resolved > 0 ? Number(((totalProfit / resolved) * 100).toFixed(1)) : 0;

  const avgOdds =
    signals.length > 0
      ? Number((signals.reduce((acc, s) => acc + s.odds, 0) / signals.length).toFixed(2))
      : customFixedOdds || 1.85;

  // Calculate equity curve and max drawdown
  let cumulative = 0;
  let peak = 0;
  let maxDrawdown = 0;

  const equityCurve: BacktestResult['equityCurve'] = [
    {
      step: 0,
      profit: 0,
      cumulativeProfit: 0,
      matchName: 'Старт',
      outcome: 'PENDING',
    },
  ];

  let positiveProfitSum = 0;
  let negativeLossSum = 0;

  signals.forEach((s, idx) => {
    cumulative += s.profit;
    cumulative = Number(cumulative.toFixed(2));

    if (s.profit > 0) positiveProfitSum += s.profit;
    if (s.profit < 0) negativeLossSum += Math.abs(s.profit);

    if (cumulative > peak) {
      peak = cumulative;
    }
    const currentDrawdown = Number((peak - cumulative).toFixed(2));
    if (currentDrawdown > maxDrawdown) {
      maxDrawdown = currentDrawdown;
    }

    equityCurve.push({
      step: idx + 1,
      profit: s.profit,
      cumulativeProfit: cumulative,
      matchName: s.matchName,
      outcome: s.outcome,
    });
  });

  const profitFactor =
    negativeLossSum > 0 ? Number((positiveProfitSum / negativeLossSum).toFixed(2)) : wins > 0 ? 999 : 0;

  return {
    ruleId: rule.id,
    ruleName: rule.name,
    targetMarket: rule.targetMarket || 'ТБ 0.5 во 2-м тайме',
    totalMatchesScanned: historicalMatches.length,
    totalSignals: signals.length,
    wins,
    losses,
    refunds,
    winRate,
    totalProfit,
    roi,
    avgOdds,
    maxDrawdown,
    profitFactor,
    signals,
    equityCurve,
  };
}
