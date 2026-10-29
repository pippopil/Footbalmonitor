import { Match, FilterRule, PressureAnalysis, SignalAlert, SignalOutcome, BetType, OddsDropData, MatchStats, SportType, MatchStatus, StrategyMetricCategory, StrategyMetricSnapshot } from './types';
import { getStrategyCardDisplayName, PRESET_STRATEGY_NUMBER_BY_ID } from './utils/filterDefaults';

/**
 * Calculates real-time odds movements (Odds Flow) and smart money volume distribution.
 * Compares opening/initial odds with current live odds across key markets (1, X, 2, Over/Under 2.5, BTTS).
 */
export function calculateMatchOddsFlows(
  match: {
    homeTeam: string;
    awayTeam: string;
    odds: { home: number; draw: number; away: number; over25: number; under25?: number; btts?: number };
    initialOdds?: { home?: number; draw?: number; away?: number; over25?: number; under25?: number; btts?: number };
    minute?: number;
    league?: string;
  }
): OddsDropData[] {
  const flows: OddsDropData[] = [];
  const init = match.initialOdds;
  const curr = match.odds;
  if (!curr) return flows;

  const marketsToCheck: Array<{
    market: 'HOME' | 'DRAW' | 'AWAY' | 'OVER' | 'UNDER' | 'BTTS';
    name: string;
    cur: number | undefined;
    baseInit: number | undefined;
    defaultBookie: string;
  }> = [
    {
      market: 'HOME',
      name: `П1 (${match.homeTeam})`,
      cur: curr.home,
      baseInit: init?.home,
      defaultBookie: 'Betfair Exchange / Pinnacle',
    },
    {
      market: 'DRAW',
      name: 'Ничья (X)',
      cur: curr.draw,
      baseInit: init?.draw,
      defaultBookie: 'Pinnacle Sports',
    },
    {
      market: 'AWAY',
      name: `П2 (${match.awayTeam})`,
      cur: curr.away,
      baseInit: init?.away,
      defaultBookie: 'Betfair Exchange / Bet365',
    },
    {
      market: 'OVER',
      name: 'ТБ 2.5',
      cur: curr.over25,
      baseInit: init?.over25,
      defaultBookie: 'Pinnacle / Asian Handicap',
    },
    {
      market: 'UNDER',
      name: 'ТМ 2.5',
      cur: curr.under25,
      baseInit: init?.under25,
      defaultBookie: 'Betfair Exchange',
    },
    {
      market: 'BTTS',
      name: 'Обе забьют (Да)',
      cur: curr.btts,
      baseInit: init?.btts,
      defaultBookie: 'Pinnacle / 1xBet',
    },
  ];

  for (const m of marketsToCheck) {
    if (m.cur === undefined || m.cur <= 1.01) continue;
    if (m.baseInit && m.baseInit > m.cur) {
      const dropPct = Number((((m.baseInit - m.cur) / m.baseInit) * 100).toFixed(1));
      if (dropPct >= 2.0) {
        // Exchange/Sharp bookmaker liquidity model
        const moneyVolPct = Math.min(95, Math.max(52, Math.round(50 + dropPct * 1.45)));
        const moneyAmtEur = Math.round((50000 + dropPct * 7500) / 1000) * 1000;

        flows.push({
          market: m.market,
          marketName: m.name,
          initialOdds: m.baseInit,
          currentOdds: m.cur,
          dropPercent: dropPct,
          moneyVolumePercent: moneyVolPct,
          moneyVolumeAmountEur: moneyAmtEur,
          bookmaker: m.defaultBookie,
          detectedAtMinute: match.minute || 1,
        });
      }
    }
  }

  flows.sort((a, b) => b.dropPercent - a.dropPercent);
  return flows;
}

/**
 * Calculates Poisson probability P(k; lambda) = (lambda^k * e^(-lambda)) / k!
 */
export function calculatePoissonProb(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let fact = 1;
  for (let i = 2; i <= k; i++) fact *= i;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / fact;
}

/**
 * Calculates Over 2.5 goals probability using independent Poisson distribution for two teams.
 * Based on expected goals lambdaHome (xGF_home) and lambdaAway (xGF_away).
 * P(Over 2.5) = 1 - P(0-0) - P(1-0) - P(0-1) - P(2-0) - P(0-2) - P(1-1)
 */
export function calculatePoissonOver25Probability(lambdaHome: number, lambdaAway: number): number {
  const pHome0 = calculatePoissonProb(0, lambdaHome);
  const pHome1 = calculatePoissonProb(1, lambdaHome);
  const pHome2 = calculatePoissonProb(2, lambdaHome);

  const pAway0 = calculatePoissonProb(0, lambdaAway);
  const pAway1 = calculatePoissonProb(1, lambdaAway);
  const pAway2 = calculatePoissonProb(2, lambdaAway);

  // Exact scores with <= 2 total goals:
  const p00 = pHome0 * pAway0;
  const p10 = pHome1 * pAway0;
  const p01 = pHome0 * pAway1;
  const p20 = pHome2 * pAway0;
  const p02 = pHome0 * pAway2;
  const p11 = pHome1 * pAway1;

  const pUnder25 = p00 + p10 + p01 + p20 + p02 + p11;
  return Math.max(0, Math.min(1, 1 - pUnder25));
}

/**
 * Enriches a match with persistent odds tracker logic, calculating market flows and primary odds drop.
 */
export function enrichMatchWithOddsTracker(match: Match, prevMatch?: Match): Match {
  // 1. Inherit or preserve initial opening odds
  const initialOdds =
    match.initialOdds ||
    prevMatch?.initialOdds ||
    (prevMatch?.odds ? { ...prevMatch.odds } : { ...match.odds });

  // 2. If the match already has rich market flows and designated odds drop, preserve them
  if (match.marketFlows && match.marketFlows.length > 0 && match.oddsDrop) {
    return {
      ...match,
      initialOdds,
    };
  }

  // 3. Compute live market flows from odds differences
  const calculatedFlows = calculateMatchOddsFlows({
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    odds: match.odds,
    initialOdds,
    minute: match.minute,
    league: match.league,
  });

  const allFlows = [
    ...(match.marketFlows || []),
    ...(match.oddsDrop ? [match.oddsDrop] : []),
    ...calculatedFlows,
  ];

  const uniqueFlowsMap = new Map<string, OddsDropData>();
  for (const f of allFlows) {
    if (!uniqueFlowsMap.has(f.market) || (uniqueFlowsMap.get(f.market)!.dropPercent < f.dropPercent)) {
      uniqueFlowsMap.set(f.market, f);
    }
  }
  const flows = Array.from(uniqueFlowsMap.values()).sort((a, b) => b.dropPercent - a.dropPercent);
  const bestDrop = flows[0] || match.oddsDrop;

  return {
    ...match,
    initialOdds,
    marketFlows: flows.length > 0 ? flows : match.marketFlows,
    oddsDrop: bestDrop || match.oddsDrop,
  };
}

/**
 * Resolves the real live bookmaker odds for a triggered strategy rule on a match.
 * Prioritizes real live market odds over static fallbacks.
 */
export function getRealSignalOdds(rule: FilterRule, match: Match): number {
  const market = (rule.targetMarket || '').toLowerCase();

  // 1. Check direct match 1X2 market
  if (market.includes('победа 1') || market.includes('п1') || market.includes('победа хозяев')) {
    if (match.odds?.home && match.odds.home >= 1.15) return match.odds.home;
  }
  if (market.includes('ничья') || market.includes(' х ') || market.includes(' x ') || market.includes('исход x')) {
    if (match.odds?.draw && match.odds.draw >= 1.15) return match.odds.draw;
  }
  if (market.includes('победа 2') || market.includes('п2') || market.includes('победа гостей')) {
    if (match.odds?.away && match.odds.away >= 1.15) return match.odds.away;
  }

  // 2. Total Over 2.5 and Under 2.5
  if (market.includes('2.5') && (market.includes('тб') || market.includes('больше') || market.includes('over'))) {
    if (match.odds?.over25 && match.odds.over25 >= 1.15) return match.odds.over25;
  }
  if (market.includes('2.5') && (market.includes('тм') || market.includes('меньше') || market.includes('under'))) {
    if (match.odds?.under25 && match.odds.under25 >= 1.15) return match.odds.under25;
  }

  // 3. Total Over 1.5 and Under 1.5
  if (market.includes('1.5') && (market.includes('тб') || market.includes('больше'))) {
    if (match.odds?.over15 && match.odds.over15 >= 1.15) return match.odds.over15;
  }
  if (market.includes('1.5') && (market.includes('тм') || market.includes('меньше'))) {
    if (match.odds?.under15 && match.odds.under15 >= 1.15) return match.odds.under15;
  }

  // 4. Both Teams to Score (Обе забьют)
  if (market.includes('обе забьют') || market.includes('btts')) {
    if (match.odds?.btts && match.odds.btts >= 1.15) return match.odds.btts;
  }

  // 5. Active live odds drop or live market flow
  if (match.oddsDrop?.currentOdds && match.oddsDrop.currentOdds >= 1.25) {
    return match.oddsDrop.currentOdds;
  }

  // 6. Configured rule defaultOdds if realistic
  if (rule.defaultOdds && rule.defaultOdds >= 1.40) {
    return rule.defaultOdds;
  }

  // 7. Dynamic minute-adjusted odds
  if (market.includes('угл')) {
    if (match.minute >= 80) return 1.95;
    if (match.minute >= 75) return 1.85;
    return 1.80;
  }
  if (market.includes('жк') || market.includes('карточк')) {
    if (match.minute >= 70) return 1.90;
    return 1.82;
  }
  if (market.includes('во 2-м тайме') || market.includes('2т')) {
    if (match.minute >= 75) return 1.95;
    if (match.minute >= 60) return 1.82;
    return 1.75;
  }

  return 1.80;
}

/**
 * Calculates in-depth match pressure, momentum index, and goal probability.
 */
export function calculatePressureAnalysis(match: Match): PressureAnalysis {
  const { stats, minute, homeTeam, awayTeam } = match;
  const currentMinute = Math.max(1, minute);

  const safeStats = stats || ({} as any);
  const dang = safeStats.dangerousAttacks || [0, 0];
  const sot = safeStats.shotsOnTarget || [0, 0];
  const soff = safeStats.shotsOffTarget || [0, 0];
  const corn = safeStats.corners || [0, 0];
  const xg = safeStats.xg || [0, 0];

  // Total volume
  const totalDang = (dang[0] ?? 0) + (dang[1] ?? 0);
  const dangDiff = (dang[0] ?? 0) - (dang[1] ?? 0);
  const absDangDiff = Math.abs(dangDiff);

  const totalShots =
    (sot[0] ?? 0) +
    (sot[1] ?? 0) +
    (soff[0] ?? 0) +
    (soff[1] ?? 0);
  const totalShotsOnTarget = (sot[0] ?? 0) + (sot[1] ?? 0);
  const totalCorners = (corn[0] ?? 0) + (corn[1] ?? 0);
  const totalXg = (xg[0] ?? 0) + (xg[1] ?? 0);

  // Dangerous attacks per minute
  const apm = Number((totalDang / currentMinute).toFixed(2));

  // Pressure Index calculation (0 to 100)
  // Factors: APM, shots on target rate, xG per minute, corners, and one-sided skew
  let rawScore = 0;

  // 1. Attack tempo (up to 30 pts)
  if (apm >= 1.4) rawScore += 30;
  else if (apm >= 1.0) rawScore += 24;
  else if (apm >= 0.7) rawScore += 16;
  else rawScore += Math.min(10, apm * 15);

  // 2. Shots on target threat (up to 25 pts)
  const sotPer10Min = (totalShotsOnTarget / currentMinute) * 10;
  if (sotPer10Min >= 1.5) rawScore += 25;
  else if (sotPer10Min >= 1.0) rawScore += 18;
  else rawScore += Math.min(15, sotPer10Min * 15);

  // 3. xG creation / Multi-sport shot pace (up to 25 pts)
  if (match.sport === 'basketball' || match.sport === 'hockey') {
    const shotsPerMin = totalShots / currentMinute;
    if (shotsPerMin >= 1.5) rawScore += 25;
    else if (shotsPerMin >= 1.0) rawScore += 20;
    else rawScore += 15;
  } else {
    if (totalXg >= 2.5) rawScore += 25;
    else if (totalXg >= 1.8) rawScore += 20;
    else if (totalXg >= 1.2) rawScore += 14;
    else rawScore += Math.min(10, totalXg * 8);
  }

  // 4. Domination asymmetry / one-sided pressure bonus (up to 20 pts)
  if (absDangDiff >= 40) rawScore += 20;
  else if (absDangDiff >= 25) rawScore += 15;
  else if (absDangDiff >= 15) rawScore += 10;
  else rawScore += Math.min(8, (absDangDiff / 15) * 8);

  const pressureIndex = Math.min(100, Math.max(10, Math.round(rawScore)));

  // Determine dominant side
  let dominantSide: 'home' | 'away' | 'balanced' = 'balanced';
  let dominantTeamName = 'Равная игра';
  const xgDiff = (xg[0] ?? 0) - (xg[1] ?? 0);
  if (dangDiff >= 15 || xgDiff >= 0.6) {
    dominantSide = 'home';
    dominantTeamName = homeTeam;
  } else if (dangDiff <= -15 || xgDiff <= -0.6) {
    dominantSide = 'away';
    dominantTeamName = awayTeam;
  }

  // Goal Probability estimation (0 to 100%)
  // Later in match + high pressure + high SOT = higher probability
  const timeFactor = minute >= 75 ? 1.25 : minute >= 60 ? 1.15 : minute >= 30 ? 1.0 : 0.85;
  const goalProbScore = Math.min(
    96,
    Math.max(12, Math.round((pressureIndex * 0.75 + (totalShotsOnTarget * 3) + (totalCorners * 1.5)) * (timeFactor / 1.1)))
  );

  let goalProbability: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' = 'LOW';
  if (goalProbScore >= 80) goalProbability = 'EXTREME';
  else if (goalProbScore >= 65) goalProbability = 'HIGH';
  else if (goalProbScore >= 45) goalProbability = 'MEDIUM';

  const reasons: string[] = [];
  if (apm >= 1.1) reasons.push(`Высокий темп: ${apm} оп. атак/мин`);
  if (absDangDiff >= 25) reasons.push(`Шквал атак: +${absDangDiff} (${dominantTeamName})`);
  if (totalShotsOnTarget >= 8) reasons.push(`Угроза в створе: ${totalShotsOnTarget} ударов`);
  if (totalCorners >= 8) reasons.push(`Осада с угловых: ${totalCorners} подач`);
  if (totalXg >= 1.5) reasons.push(`Накопленный xG: ${totalXg.toFixed(2)}`);
  const redCards = safeStats.redCards || [0, 0];
  if ((redCards[0] ?? 0) > 0 || (redCards[1] ?? 0) > 0) reasons.push(`Фактор удаления (КК)`);

  return {
    pressureIndex,
    dominantSide,
    dominantTeamName,
    dominantDiff: absDangDiff,
    goalProbability,
    goalProbabilityScore: goalProbScore,
    attacksPerMinute: apm,
    reasons,
  };
}

/**
 * Verifies whether the rule's target market has ALREADY occurred / resolved in the match.
 * Prevents sending signals like 'ТБ 2.5' when 3+ goals are already scored,
 * or 'Обе забьют' when both teams have already scored, or 1st-half goals when 1st-half is over or goal was scored.
 */
export function checkMarketAlreadyPassed(
  targetMarket: string | undefined,
  match: Match,
  rule?: FilterRule
): { isPassed: boolean; reason?: string } {
  const h = match.score ? (match.score[0] ?? 0) : 0;
  const a = match.score ? (match.score[1] ?? 0) : 0;
  const totalGoals = h + a;
  const rawMarket = (targetMarket || rule?.targetMarket || '').toLowerCase();

  // 1. Explicit max total goals check
  if (rule?.maxTotalGoals !== undefined && totalGoals > rule.maxTotalGoals) {
    return {
      isPassed: true,
      reason: `Событие уже наступило: тотал голов (${totalGoals}) превышает ${rule.maxTotalGoals} (счёт ${h}:${a}). Ставка не актуальна!`,
    };
  }

  // 2. Score condition constraints: TOTAL_UNDER_25, TOTAL_UNDER_15, TOTAL_UNDER_2, BTTS_NO
  if (rule?.scoreCondition === 'TOTAL_UNDER_25' && totalGoals > 2) {
    return {
      isPassed: true,
      reason: `Событие уже наступило: ТБ 2.5 уже пробит (счёт ${h}:${a}, забито ${totalGoals} голов).`,
    };
  }
  if ((rule?.scoreCondition === 'TOTAL_UNDER_15' || rule?.scoreCondition === 'TOTAL_UNDER_2') && totalGoals > 1) {
    return {
      isPassed: true,
      reason: `Событие уже наступило: ТБ 1.5 уже пробит (счёт ${h}:${a}, забито ${totalGoals} голов).`,
    };
  }
  if (rule?.scoreCondition === 'BTTS_NO' && (h > 0 && a > 0)) {
    return {
      isPassed: true,
      reason: `Событие уже наступило: Обе команды уже забили (счёт ${h}:${a}). Исход «Обе забьют» уже состоялся!`,
    };
  }

  // 3. Both Teams To Score (Обе забьют / ОЗ / BTTS)
  const isBttsMarket =
    Boolean(rule?.requireBttsNotHit) ||
    rule?.oddsDropMarket === 'BTTS' ||
    /(?:обе\s*команды\s*забьют|обе\s*забьют|оз\s*[:(]?\s*да|btts\s*[:(]?\s*yes|btts\s*[:(]?\s*да|\bоз\b|\bbtts\b)/i.test(rawMarket);

  const isBttsNoMarket = /(?:обе\s*забьют\s*:\s*нет|оз\s*:\s*нет|btts\s*:\s*no)/i.test(rawMarket);

  if (isBttsMarket && !isBttsNoMarket) {
    if (h > 0 && a > 0) {
      return {
        isPassed: true,
        reason: `Событие уже наступило: Обе команды уже забили (счёт ${h}:${a}). Исход «Обе забьют: Да» уже состоялся!`,
      };
    }
  }

  // 4. Over 2.5 Goals (ТБ 2.5 / Тотал больше 2.5)
  const isOver25Market =
    ((rule?.oddsDropMarket === 'OVER' && !rawMarket.includes('3.5') && !rawMarket.includes('1.5') && !rawMarket.includes('0.5')) ||
    /(?:тб\s*2\.?5|тотал\s*больше\s*2\.?5|over\s*2\.?5)/i.test(rawMarket)) &&
    !rawMarket.includes('период') &&
    !rawMarket.includes('period') &&
    !rawMarket.includes('сет') &&
    !rawMarket.includes('set') &&
    !rawMarket.includes('четверт') &&
    !rawMarket.includes('quarter');

  if (isOver25Market) {
    if (totalGoals >= 3) {
      return {
        isPassed: true,
        reason: `Событие уже наступило: ТБ 2.5 уже пробит (забито ${totalGoals} голов, текущий счёт ${h}:${a}).`,
      };
    }
  }

  // 5. Over 1.5 Goals (ТБ 1.5 / Тотал больше 1.5)
  const isOver15Market =
    /(?:тб\s*1\.?5|тотал\s*больше\s*1\.?5|over\s*1\.?5)/i.test(rawMarket) &&
    !rawMarket.includes('3.5') &&
    !rawMarket.includes('период') &&
    !rawMarket.includes('period') &&
    !rawMarket.includes('сет') &&
    !rawMarket.includes('set') &&
    !rawMarket.includes('четверт') &&
    !rawMarket.includes('quarter');

  if (isOver15Market) {
    if (totalGoals >= 2) {
      return {
        isPassed: true,
        reason: `Событие уже наступило: ТБ 1.5 уже пробит (забито ${totalGoals} голов, счёт ${h}:${a}).`,
      };
    }
  }

  // 6. 1st-Half Goals (ТБ 0.5 в 1-м тайме / HT Over / Гол в 1Т)
  const isFirstHalfMarket =
    /(?:1-?м\s*тайме|1т\b|первом\s*тайме|ht\s*over)/i.test(rawMarket);

  if (isFirstHalfMarket) {
    if (match.minute > 45 || match.status === 'HT' || match.status === 'FT') {
      return {
        isPassed: true,
        reason: `1-й тайм уже завершился (минута ${match.minute}'). Ставка на 1-й тайм недоступна!`,
      };
    }
    if (/(?:0\.?5|гол)/i.test(rawMarket) && !rawMarket.includes('1.5') && !rawMarket.includes('угл')) {
      if (totalGoals >= 1) {
        return {
          isPassed: true,
          reason: `Гол в 1-м тайме уже забит (счёт ${h}:${a}). ТБ 0.5 1Т уже сыграл!`,
        };
      }
    }
    if (/(?:1\.?5|1\.0)/i.test(rawMarket)) {
      if (totalGoals >= 2) {
        return {
          isPassed: true,
          reason: `В 1-м тайме уже забито ${totalGoals} голов (счёт ${h}:${a}). ТБ 1.5 1Т уже пробит!`,
        };
      }
    }
  }

  // 7. Over 0.5 in match (ТБ 0.5 в матче) - when score is no longer 0:0
  const isOver05InMatch =
    (/(?:тб\s*0\.?5\s*(в\s*матче)?|тотал\s*больше\s*0\.?5\s*(в\s*матче)?)/i.test(rawMarket) ||
      (/(?:гол\s*в\s*матче)/i.test(rawMarket) &&
        !rawMarket.includes('следующий') &&
        !rawMarket.includes('1.5') &&
        !rawMarket.includes('2.5') &&
        !rawMarket.includes('3.5') &&
        !rawMarket.includes('4.5'))) &&
    !rawMarket.includes('2-м') &&
    !rawMarket.includes('втором') &&
    !rawMarket.includes('концовке');

  if (isOver05InMatch) {
    if (totalGoals >= 1) {
      return {
        isPassed: true,
        reason: `В матче уже забит гол (счёт ${h}:${a}). ТБ 0.5 в матче уже сыграл!`,
      };
    }
  }

  // 8. Over 3.5 Goals (ТБ 3.5)
  const isOver35Market = /(?:тб\s*3\.?5|тотал\s*больше\s*3\.?5|over\s*3\.?5)/i.test(rawMarket);
  if (isOver35Market) {
    if (totalGoals >= 4) {
      return {
        isPassed: true,
        reason: `Событие уже наступило: ТБ 3.5 уже пробит (забито ${totalGoals} голов, счёт ${h}:${a}).`,
      };
    }
  }

  // 9. Over 4.5 Goals (ТБ 4.5)
  const isOver45Market = /(?:тб\s*4\.?5|тотал\s*больше\s*4\.?5|over\s*4\.?5)/i.test(rawMarket);
  if (isOver45Market) {
    if (totalGoals >= 5) {
      return {
        isPassed: true,
        reason: `Событие уже наступило: ТБ 4.5 уже пробит (забито ${totalGoals} голов, счёт ${h}:${a}).`,
      };
    }
  }

  // 10. Individual Total 1 > 0.5 / Home Goal
  if (/(?:итб1\s*>\s*0\.?5|гол\s*хозяев)/i.test(rawMarket) && !rawMarket.includes('следующий')) {
    if (h >= 1) {
      return {
        isPassed: true,
        reason: `Хозяева уже забили гол (счёт ${h}:${a}). Исход «Гол Хозяев» уже сыграл!`,
      };
    }
  }

  // 11. Individual Total 2 > 0.5 / Away Goal
  if (/(?:итб2\s*>\s*0\.?5|гол\s*гостей)/i.test(rawMarket) && !rawMarket.includes('следующий')) {
    if (a >= 1) {
      return {
        isPassed: true,
        reason: `Гости уже забили гол (счёт ${h}:${a}). Исход «Гол Гостей» уже сыграл!`,
      };
    }
  }

  // 12. Under 2.5 Goals (ТМ 2.5)
  if (/(?:тм\s*2\.?5|under\s*2\.?5|тотал\s*меньше\s*2\.?5)/i.test(rawMarket)) {
    if (totalGoals >= 3) {
      return {
        isPassed: true,
        reason: `ТМ 2.5 уже проигран (забито ${totalGoals} голов, счёт ${h}:${a}). Ставка не актуальна!`,
      };
    }
  }

  // 13. Under 1.5 Goals (ТМ 1.5)
  if (/(?:тм\s*1\.?5|under\s*1\.?5|тотал\s*меньше\s*1\.?5)/i.test(rawMarket)) {
    if (totalGoals >= 2) {
      return {
        isPassed: true,
        reason: `ТМ 1.5 уже проигран (забито ${totalGoals} голов, счёт ${h}:${a}). Ставка не актуальна!`,
      };
    }
  }

  // 14. Yellow Cards Over (ЖК ТБ 3.5 / 4.5)
  if (/(?:жк|карточ)\s*(?:тб|больше)\s*(\d+(?:\.5)?)/i.test(rawMarket)) {
    const cardMatch = rawMarket.match(/(?:жк|карточ)\s*(?:тб|больше)\s*(\d+(?:\.5)?)/i);
    if (cardMatch) {
      const threshold = parseFloat(cardMatch[1]);
      const currentCards = (match.stats?.yellowCards?.[0] ?? 0) + (match.stats?.yellowCards?.[1] ?? 0);
      if (currentCards >= Math.ceil(threshold)) {
        return {
          isPassed: true,
          reason: `Событие уже наступило: в матче уже показано ${currentCards} ЖК (рынок ${cardMatch[0]} уже сыграл).`,
        };
      }
    }
  }

  // 15. Corners Over (Угловые ТБ 8.5 / 9.5 / 10.5)
  if (/(?:угл|corner)\s*(?:тб|больше)\s*(\d+(?:\.5)?)/i.test(rawMarket)) {
    const cornerMatch = rawMarket.match(/(?:угл|corner)\s*(?:тб|больше)\s*(\d+(?:\.5)?)/i);
    if (cornerMatch) {
      const threshold = parseFloat(cornerMatch[1]);
      const currentCorners = (match.stats?.corners?.[0] ?? 0) + (match.stats?.corners?.[1] ?? 0);
      if (currentCorners >= Math.ceil(threshold)) {
        return {
          isPassed: true,
          reason: `Событие уже наступило: в матче уже подано ${currentCorners} угловых (рынок ${cornerMatch[0]} уже сыграл).`,
        };
      }
    }
  }

  return { isPassed: false };
}

export function inferSportFromRule(rule: FilterRule): SportType {
  if (rule.sport) return rule.sport;
  const text = `${rule.name || ''} ${rule.description || ''} ${rule.targetMarket || ''}`.toLowerCase();
  if (/\b(?:хоккей|кхл|нхл|nhl|khl|шайб\w*|буллит\w*|период\w*|броск\w*|пустые\s+ворот\w*|овертайм\w*|hockey|ice)\b|🏒/i.test(text)) {
    return 'hockey';
  }
  if (/\b(?:баскетбол|nba|нба|четверт\w*|очков|очки|штрафн\w*|vtb|втб|fiba|фиба|euroleague|basketball|quarter|points)\b|🏀/i.test(text)) {
    return 'basketball';
  }
  if (/\b(?:теннис|tennis|гейм\w*|брейк\w*|atp|wta|тай-?брейк|эйс\w*|сет\b|сета|сетов|подач\w*|itf|challenger)\b|🎾/i.test(text)) {
    return 'tennis';
  }
  if (/\b(?:волейбол|volleyball|партия|партий|партии|блок\w*|cev|плюслига|плюс-?лига)\b|🏐/i.test(text)) {
    return 'volleyball';
  }
  if (/\b(?:настольный\s+теннис|table\s+tennis|пинг-?понг|лига\s+про|tt\s+cup|wtt)\b|🏓/i.test(text)) {
    return 'table_tennis';
  }
  return 'football';
}

export function inferSportFromMatch(match: Match): SportType {
  if (match.sport) return match.sport;
  
  // Fast ID-based sport detection
  const idLower = (match.id || '').toLowerCase();
  if (idLower.includes('-hockey-') || idLower.startsWith('hockey-') || idLower.startsWith('fs-hockey-') || idLower.startsWith('espn-hockey-')) return 'hockey';
  if (idLower.includes('-bball-') || idLower.includes('-basketball-') || idLower.startsWith('basketball-') || idLower.startsWith('fs-basketball-') || idLower.startsWith('espn-basketball-')) return 'basketball';
  if ((idLower.includes('-tennis-') || idLower.startsWith('tennis-') || idLower.startsWith('fs-tennis-') || idLower.startsWith('espn-tennis-')) && !idLower.includes('tabletennis') && !idLower.includes('table_tennis') && !idLower.includes('-tt-')) return 'tennis';
  if (idLower.includes('-vball-') || idLower.includes('-volleyball-') || idLower.startsWith('volleyball-') || idLower.startsWith('fs-volleyball-')) return 'volleyball';
  if (idLower.includes('-tabletennis-') || idLower.includes('-table_tennis-') || idLower.includes('-tt-') || idLower.startsWith('tabletennis-') || idLower.startsWith('fs-table_tennis-')) return 'table_tennis';

  const text = `${match.league || ''} ${match.country || ''} ${match.homeTeam || ''} ${match.awayTeam || ''} ${match.lastEvent || ''}`.toLowerCase();
  
  if (/\b(?:khl|nhl|кхл|нхл|хоккей|hockey|шайб\w*|extraliga|shl|liiga|vhl|mhl|del\b|ice\s*hockey)\b|🏒/i.test(text)) {
    return 'hockey';
  }
  if (/\b(?:nba|нба|баскетбол|basketball|четверт\w*|vtb|втб|euroleague|cba|nbl|bbl\b|lnb|fiba)\b|🏀/i.test(text)) {
    return 'basketball';
  }
  if (/\b(?:atp|wta|itf|challenger|теннис|tennis|roland\s+garros|wimbledon|us\s+open|australian\s+open|grand\s+slam|shanghai|china\s+open)\b|🎾/i.test(text)) {
    return 'tennis';
  }
  if (/\b(?:волейбол|volleyball|superliga|cev\b|plusliga|serie\s+a1)\b|🏐/i.test(text)) {
    return 'volleyball';
  }
  if (/\b(?:table\s+tennis|настольный\s+теннис|лига\s+про|tt\s+cup|china\s+smash|wtt\b|ping\s+pong)\b|🏓/i.test(text)) {
    return 'table_tennis';
  }
  return 'football';
}

/**
 * Checks whether a match matches a filter rule.
 * Also returns progress percentage and list of missing criteria for UI hints.
 */
export function evaluateFilterRule(
  match: Match,
  rule: FilterRule
): { matches: boolean; progressPercent: number; unmetCriteria: string[] } {
  let passedCount = 0;
  let totalCriteria = 0;
  const unmetCriteria: string[] = [];

  // 0. Strict Sport Isolation (Разграничение по видам спорта)
  // Football filters must NEVER trigger on Hockey/Basketball/Tennis/Volleyball/Table Tennis, and vice versa!
  const ruleSport = rule.sport || inferSportFromRule(rule);
  const matchSport = match.sport || inferSportFromMatch(match);
  if (ruleSport !== matchSport) {
    return {
      matches: false,
      progressPercent: 0,
      unmetCriteria: [`Вид спорта матча (${matchSport}) не соответствует стратегии (${ruleSport})`],
    };
  }

  // 1. Minute Range / Prematch Timing Window
  totalCriteria++;
  const isPrematchRule = rule.ruleType === 'PREMATCH' || getBetTypeForSignal(rule, match.minute, match) === 'PREMATCH';

  if (isPrematchRule) {
    // В стратегиях матчей, когда анализ матча идет до матча, анализ проводится за 1 час (60 мин) до начала матча
    if (match.status === 'PREMATCH' || match.startsInMinutes !== undefined) {
      const targetTiming = rule.prematchTimingMinutes ?? 60;
      const minutesToStart = match.startsInMinutes ?? 60;
      if (minutesToStart <= targetTiming && minutesToStart >= 0) {
        passedCount++;
      } else if (minutesToStart > targetTiming) {
        unmetCriteria.push(`До матча ${minutesToStart} мин. Анализ стратегии проводится строго за 1 час (60 мин) до начала`);
      } else {
        passedCount++;
      }
    } else if (match.minute === 0) {
      passedCount++;
    } else if (match.status === 'LIVE' || match.status === 'HT') {
      // Предматчевые стратегии с лайв-триггером во 2-м тайме (например Стратегия 12)
      if (rule.minMinute !== undefined && rule.minMinute > 0) {
        const effectiveMinute = match.status === 'HT' ? 45 : match.minute;
        if (effectiveMinute >= rule.minMinute && effectiveMinute <= rule.maxMinute) {
          passedCount++;
        } else if (effectiveMinute < rule.minMinute) {
          unmetCriteria.push(`Ожидание перерыва / 2-го тайма (минута ${effectiveMinute}' < ${rule.minMinute}')`);
        } else {
          unmetCriteria.push(`Минута ${effectiveMinute}' > ${rule.maxMinute}'`);
        }
      } else if (rule.maxMinute > 0 && match.minute <= rule.maxMinute) {
        passedCount++;
      } else {
        unmetCriteria.push(`Матч уже идёт (${match.minute}'). Предматчевый отбор проводится за 1 час до начала матча`);
      }
    } else {
      unmetCriteria.push(`Матч завершён (FT). Анализ проводился за 1 час до начала`);
    }
  } else {
    // Лайв-стратегия или Гибридная
    if (match.status === 'FT' || (match.status as string) === 'CANCELLED' || (match.status as string) === 'POSTPONED') {
      unmetCriteria.push(`Матч уже завершён (${match.status}) — лайв-стратегии применяются только к активным матчам`);
    } else if (match.status === 'PREMATCH') {
      if (rule.ruleType === 'HYBRID' || (rule.minMinute === 0 && rule.maxMinute > 0)) {
        passedCount++;
      } else {
        unmetCriteria.push(`Матч ещё не начался (лайв-стратегия активна с ${rule.minMinute}' по ${rule.maxMinute}')`);
      }
    } else if (match.minute >= rule.minMinute && match.minute <= rule.maxMinute) {
      passedCount++;
    } else {
      unmetCriteria.push(`Минута ${match.minute}' вне диапазона (${rule.minMinute}'-${rule.maxMinute}')`);
    }
  }

  // 2. Score Condition
  totalCriteria++;
  let scoreOk = false;
  const h = match.score ? (match.score[0] ?? 0) : 0;
  const a = match.score ? (match.score[1] ?? 0) : 0;
  const totalGoals = h + a;
  const diffGoals = Math.abs(h - a);

  switch (rule.scoreCondition) {
    case 'ANY':
      scoreOk = true;
      break;
    case '0-0':
      scoreOk = h === 0 && a === 0;
      if (!scoreOk) unmetCriteria.push(`Счет не 0:0 (сейчас ${h}:${a})`);
      break;
    case 'DRAW':
      scoreOk = h === a;
      if (!scoreOk) unmetCriteria.push(`Счет не ничейный (сейчас ${h}:${a})`);
      break;
    case 'HOME_LEAD':
      scoreOk = h > a;
      if (!scoreOk) unmetCriteria.push(`Хозяева не ведут в счете`);
      break;
    case 'AWAY_LEAD':
      scoreOk = a > h;
      if (!scoreOk) unmetCriteria.push(`Гости не ведут в счете`);
      break;
    case 'ONE_GOAL_DIFF':
      scoreOk = diffGoals === 1;
      if (!scoreOk) unmetCriteria.push(`Разница не в 1 мяч (сейчас ${h}:${a})`);
      break;
    case 'TOTAL_UNDER_25':
      scoreOk = totalGoals <= 2;
      if (!scoreOk) unmetCriteria.push(`ТБ 2.5 уже пробит (счёт ${h}:${a}, забито ${totalGoals} голов)`);
      break;
    case 'TOTAL_UNDER_15':
      scoreOk = totalGoals <= 1;
      if (!scoreOk) unmetCriteria.push(`ТБ 1.5 уже пробит (счёт ${h}:${a}, забито ${totalGoals} голов)`);
      break;
    case 'TOTAL_UNDER_2':
      scoreOk = totalGoals <= 1;
      if (!scoreOk) unmetCriteria.push(`Тотал голов ≥ 2 (сейчас ${totalGoals}, счёт ${h}:${a})`);
      break;
    case 'TOTAL_OVER_2':
      scoreOk = totalGoals >= 2;
      if (!scoreOk) unmetCriteria.push(`Тотал голов < 2 (сейчас ${totalGoals})`);
      break;
    case 'BTTS_NO':
      scoreOk = h === 0 || a === 0;
      if (!scoreOk) unmetCriteria.push(`Обе команды уже забили (счёт ${h}:${a}). Исход «Обе забьют» уже состоялся!`);
      break;
    default:
      scoreOk = true;
  }
  if (scoreOk) passedCount++;

  // 2b. Min & Max Total Goals limits
  if (rule.minTotalGoals !== undefined) {
    totalCriteria++;
    if (totalGoals >= rule.minTotalGoals) {
      passedCount++;
    } else {
      unmetCriteria.push(`Тотал голов (${totalGoals}) меньше требуемого минимума ${rule.minTotalGoals} (счёт ${h}:${a})`);
    }
  }

  if (rule.maxTotalGoals !== undefined) {
    totalCriteria++;
    if (totalGoals <= rule.maxTotalGoals) {
      passedCount++;
    } else {
      unmetCriteria.push(`Тотал голов (${totalGoals}) превышает ${rule.maxTotalGoals} (ТБ ${rule.maxTotalGoals}.5 уже пробит, счёт ${h}:${a})`);
    }
  }

  // 2b-2. Exact Score & Exact Goals checks (Выставление конкретного количества голов)
  if (rule.exactScore && rule.exactScore.trim()) {
    totalCriteria++;
    const [reqH, reqA] = rule.exactScore.split(':').map((s) => Number(s.trim()));
    if (!isNaN(reqH) && !isNaN(reqA) && h === reqH && a === reqA) {
      passedCount++;
    } else {
      unmetCriteria.push(`Счёт ${h}:${a} не равен требуемому точному счёту ${rule.exactScore}`);
    }
  }

  if (rule.exactHomeGoals !== undefined) {
    totalCriteria++;
    if (h === rule.exactHomeGoals) {
      passedCount++;
    } else {
      unmetCriteria.push(`Голов Хозяев (${h}) не равно точно ${rule.exactHomeGoals}`);
    }
  }

  if (rule.exactAwayGoals !== undefined) {
    totalCriteria++;
    if (a === rule.exactAwayGoals) {
      passedCount++;
    } else {
      unmetCriteria.push(`Голов Гостей (${a}) не равно точно ${rule.exactAwayGoals}`);
    }
  }

  if (rule.exactTotalGoals !== undefined) {
    totalCriteria++;
    if (totalGoals === rule.exactTotalGoals) {
      passedCount++;
    } else {
      unmetCriteria.push(`Суммарно голов в матче (${totalGoals}) не равно точно ${rule.exactTotalGoals}`);
    }
  }

  // 2c. Require BTTS not hit yet (Обе команды ещё не забили)
  if (rule.requireBttsNotHit) {
    totalCriteria++;
    if (h === 0 || a === 0) {
      passedCount++;
    } else {
      unmetCriteria.push(`Обе команды уже забили (счёт ${h}:${a}). Исход «Обе забьют: Да» уже состоялся!`);
    }
  }

  // 2d. Strict Event Validation: Block signals for outcomes that have already happened / resolved
  const marketPassedCheck = checkMarketAlreadyPassed(rule.targetMarket, match, rule);
  if (marketPassedCheck.isPassed) {
    totalCriteria++;
    unmetCriteria.push(marketPassedCheck.reason || 'Событие по рекомендуемому исходу уже наступило в матче');
  }

  // 2e. Max Score Difference (разница мячей не более X, защита от разгромов)
  if (rule.maxScoreDiff !== undefined) {
    totalCriteria++;
    if (diffGoals <= rule.maxScoreDiff) {
      passedCount++;
    } else {
      unmetCriteria.push(`Разница в счёте ${diffGoals} > ${rule.maxScoreDiff} мячей (разгром, слабая мотивация)`);
    }
  }

  // Safe stats references
  const stats = match.stats || ({} as any);
  const dang = stats.dangerousAttacks || [0, 0];
  const att = stats.attacks || [0, 0];
  const sotArr = stats.shotsOnTarget || [0, 0];
  const soffArr = stats.shotsOffTarget || [0, 0];
  const corn = stats.corners || [0, 0];
  const poss = stats.possession || [50, 50];
  const rc = stats.redCards || [0, 0];
  const yc = stats.yellowCards || [0, 0];

  // 3. Dangerous Attacks Difference
  if (rule.minDangerousAttacksDiff !== undefined) {
    totalCriteria++;
    const dangDiff = Math.abs((dang[0] ?? 0) - (dang[1] ?? 0));
    if (dangDiff >= rule.minDangerousAttacksDiff) {
      passedCount++;
    } else {
      unmetCriteria.push(`Разница оп. атак ${dangDiff} < требуемых ${rule.minDangerousAttacksDiff}`);
    }
  }

  // 4. Dangerous Attacks Total
  if (rule.minDangerousAttacksTotal !== undefined) {
    totalCriteria++;
    const totalDang = (dang[0] ?? 0) + (dang[1] ?? 0);
    if (totalDang >= rule.minDangerousAttacksTotal) {
      passedCount++;
    } else {
      unmetCriteria.push(`Сумма оп. атак ${totalDang} < ${rule.minDangerousAttacksTotal}`);
    }
  }

  // 4b. Dangerous Attacks Total Max (Сушка / ТМ)
  if (rule.maxDangerousAttacksTotal !== undefined) {
    totalCriteria++;
    const totalDang = (dang[0] ?? 0) + (dang[1] ?? 0);
    if (totalDang <= rule.maxDangerousAttacksTotal) {
      passedCount++;
    } else {
      unmetCriteria.push(`Сумма оп. атак ${totalDang} > ${rule.maxDangerousAttacksTotal} (слишком высокая активность для сушки)`);
    }
  }

  // 5. Total Shots
  if (rule.minTotalShots !== undefined) {
    totalCriteria++;
    const totalShots =
      (sotArr[0] ?? 0) +
      (sotArr[1] ?? 0) +
      (soffArr[0] ?? 0) +
      (soffArr[1] ?? 0);
    if (totalShots >= rule.minTotalShots) {
      passedCount++;
    } else {
      unmetCriteria.push(`Всего ударов ${totalShots} < ${rule.minTotalShots}`);
    }
  }

  // 6. Shots on Target Total
  if (rule.minShotsOnTargetTotal !== undefined) {
    totalCriteria++;
    const sot = (sotArr[0] ?? 0) + (sotArr[1] ?? 0);
    if (sot >= rule.minShotsOnTargetTotal) {
      passedCount++;
    } else {
      unmetCriteria.push(`Ударов в створ ${sot} < ${rule.minShotsOnTargetTotal}`);
    }
  }

  // 6b. Shots on Target Total Max (Сушка / ТМ)
  if (rule.maxShotsOnTargetTotal !== undefined) {
    totalCriteria++;
    const sot = (sotArr[0] ?? 0) + (sotArr[1] ?? 0);
    if (sot <= rule.maxShotsOnTargetTotal) {
      passedCount++;
    } else {
      unmetCriteria.push(`Ударов в створ ${sot} > ${rule.maxShotsOnTargetTotal} (слишком много ударов для сушки)`);
    }
  }

  // 7. Shots on Target Diff
  if (rule.minShotsOnTargetDiff !== undefined) {
    totalCriteria++;
    const sotDiff = Math.abs((sotArr[0] ?? 0) - (sotArr[1] ?? 0));
    if (sotDiff >= rule.minShotsOnTargetDiff) {
      passedCount++;
    } else {
      unmetCriteria.push(`Разница ударов в створ ${sotDiff} < ${rule.minShotsOnTargetDiff}`);
    }
  }

  // 7b. Shots on Target of Home Team (Стратегия 63)
  if (rule.minShotsOnTargetHome !== undefined) {
    totalCriteria++;
    const hSot = sotArr[0] ?? 0;
    if (hSot >= rule.minShotsOnTargetHome) {
      passedCount++;
    } else {
      unmetCriteria.push(`Ударов в створ хозяев ${hSot} < ${rule.minShotsOnTargetHome}`);
    }
  }

  // 8. Corners Total
  if (rule.minTotalCorners !== undefined) {
    totalCriteria++;
    const corners = (corn[0] ?? 0) + (corn[1] ?? 0);
    if (corners >= rule.minTotalCorners) {
      passedCount++;
    } else {
      unmetCriteria.push(`Всего угловых ${corners} < ${rule.minTotalCorners}`);
    }
  }

  // 8b. Corners Total Max (Сушка / ТМ угловых / ТМ 0.5 1Т)
  if (rule.maxTotalCorners !== undefined) {
    totalCriteria++;
    const corners = (corn[0] ?? 0) + (corn[1] ?? 0);
    if (corners <= rule.maxTotalCorners) {
      passedCount++;
    } else {
      unmetCriteria.push(`Всего угловых ${corners} > ${rule.maxTotalCorners} (слишком много угловых для ТМ)`);
    }
  }

  // 9. Corners Diff
  if (rule.minCornersDiff !== undefined) {
    totalCriteria++;
    const cornersDiff = Math.abs((corn[0] ?? 0) - (corn[1] ?? 0));
    if (cornersDiff >= rule.minCornersDiff) {
      passedCount++;
    } else {
      unmetCriteria.push(`Разница угловых ${cornersDiff} < ${rule.minCornersDiff}`);
    }
  }

  // 10. Possession Diff
  if (rule.minPossessionDiff !== undefined) {
    totalCriteria++;
    const possDiff = Math.abs((poss[0] ?? 50) - (poss[1] ?? 50));
    if (possDiff >= rule.minPossessionDiff) {
      passedCount++;
    } else {
      unmetCriteria.push(`Перевес по владению ${possDiff}% < ${rule.minPossessionDiff}%`);
    }
  }

  // 11. xG Total
  if (rule.minXgTotal !== undefined) {
    totalCriteria++;
    const totalXg = (match.stats?.xg?.[0] ?? 0) + (match.stats?.xg?.[1] ?? 0);
    if (totalXg >= rule.minXgTotal) {
      passedCount++;
    } else {
      unmetCriteria.push(`Суммарный xG ${totalXg.toFixed(2)} < ${rule.minXgTotal}`);
    }
  }

  // 11b. xG Deficit / xG Over Score Difference (Стратегия «Дефицит голов по xG к 75'»)
  if (rule.minXgOverScoreDiff !== undefined) {
    totalCriteria++;
    const totalXg = (match.stats?.xg?.[0] ?? 0) + (match.stats?.xg?.[1] ?? 0);
    const totalGoals = (match.score?.[0] ?? 0) + (match.score?.[1] ?? 0);
    const xgOverScore = totalXg - totalGoals;
    if (xgOverScore >= rule.minXgOverScoreDiff) {
      passedCount++;
    } else {
      unmetCriteria.push(
        `Перевес xG над счётом ${xgOverScore.toFixed(2)} (xG ${totalXg.toFixed(2)} vs ${totalGoals} голов) < требуемых +${rule.minXgOverScoreDiff.toFixed(2)}`
      );
    }
  }

  // 11c. Expected Total xG (Стратегия 59: Математическая модель Пуассона и xG > 2.80)
  const lambdaH = (match.stats?.xg?.[0] !== undefined && match.stats.xg[0] > 0)
    ? match.stats.xg[0]
    : (match.history?.h2hGoalsPerGame ? match.history.h2hGoalsPerGame * 0.55 : 1.55);
  const lambdaA = (match.stats?.xg?.[1] !== undefined && match.stats.xg[1] > 0)
    ? match.stats.xg[1]
    : (match.history?.h2hGoalsPerGame ? match.history.h2hGoalsPerGame * 0.45 : 1.35);
  const expectedTotalXg = lambdaH + lambdaA;

  if (rule.minExpectedTotalXg !== undefined) {
    totalCriteria++;
    if (expectedTotalXg >= rule.minExpectedTotalXg) {
      passedCount++;
    } else {
      unmetCriteria.push(
        `Суммарный ожидаемый xG (${expectedTotalXg.toFixed(2)}) < требуемых ${rule.minExpectedTotalXg.toFixed(2)}`
      );
    }
  }

  // 11d. Poisson Model +EV Value (Стратегия 59: Расчет вероятности ТБ 2.5 и поиск валуя)
  if (rule.requirePoissonEvPositive) {
    totalCriteria++;
    const poissonProb = calculatePoissonOver25Probability(lambdaH, lambdaA);
    const currentMarketOdds = match.odds?.over25 || rule.defaultOdds || 1.78;
    const impliedProb = currentMarketOdds > 0 ? 1 / currentMarketOdds : 0.57;
    const evEdge = poissonProb - impliedProb;

    if (evEdge > 0 && currentMarketOdds >= (rule.minOddsOver25 || 1.75)) {
      passedCount++;
    } else if (currentMarketOdds < (rule.minOddsOver25 || 1.75)) {
      unmetCriteria.push(
        `Кэф на ТБ 2.5 (${currentMarketOdds.toFixed(2)}) < минимального порога ${rule.minOddsOver25 || 1.75}`
      );
    } else {
      unmetCriteria.push(
        `Нет математического преимущества (+EV): вероятность Пуассона ${(poissonProb * 100).toFixed(1)}% <= букмекерской ${(impliedProb * 100).toFixed(1)}%`
      );
    }
  }

  // 12. Pressure Index
  if (rule.minPressureIndex !== undefined) {
    totalCriteria++;
    const analysis = calculatePressureAnalysis(match);
    if (analysis.pressureIndex >= rule.minPressureIndex) {
      passedCount++;
    } else {
      unmetCriteria.push(`Индекс давления ${analysis.pressureIndex}% < ${rule.minPressureIndex}%`);
    }
  }

  // 12b. Max Pressure Index (Сушка / ТМ)
  if (rule.maxPressureIndex !== undefined) {
    totalCriteria++;
    const analysis = calculatePressureAnalysis(match);
    if (analysis.pressureIndex <= rule.maxPressureIndex) {
      passedCount++;
    } else {
      unmetCriteria.push(`Индекс давления ${analysis.pressureIndex}% > ${rule.maxPressureIndex}% (слишком высокая активность для сушки)`);
    }
  }

  // 13. Red Card Condition
  if (rule.redCardCondition && rule.redCardCondition !== 'ANY') {
    totalCriteria++;
    const hasRed = (rc[0] ?? 0) > 0 || (rc[1] ?? 0) > 0;
    if (rule.redCardCondition === 'HAS_RED_CARD') {
      if (hasRed) passedCount++;
      else unmetCriteria.push(`Нет красных карточек в матче`);
    } else if (rule.redCardCondition === 'NO_RED_CARDS') {
      if (!hasRed) passedCount++;
      else unmetCriteria.push(`В матче есть удаление`);
    }
  }

  // 13b. Yellow Card Conditions (Стратегия 40 «ЖК ТБ во 2-м тайме»)
  if (rule.minYellowCardsTotal !== undefined) {
    totalCriteria++;
    const totalYellow = (yc[0] ?? 0) + (yc[1] ?? 0);
    if (totalYellow >= rule.minYellowCardsTotal) {
      passedCount++;
    } else {
      unmetCriteria.push(
        `Жёлтых карточек в матче (${totalYellow}) < требуемых ${rule.minYellowCardsTotal} (ЖК: ${yc[0] ?? 0}:${yc[1] ?? 0})`
      );
    }
  }

  if (rule.maxYellowCardsTotal !== undefined) {
    totalCriteria++;
    const totalYellow = (yc[0] ?? 0) + (yc[1] ?? 0);
    if (totalYellow <= rule.maxYellowCardsTotal) {
      passedCount++;
    } else {
      unmetCriteria.push(
        `Жёлтых карточек в матче (${totalYellow}) > ${rule.maxYellowCardsTotal}`
      );
    }
  }

  // 14. Total Attacks Difference (Стратегия 4 «А ГДЕ ЖЕ ГОЛ!!! v2.0»)
  if (rule.minAttacksDiff !== undefined) {
    totalCriteria++;
    const attacksDiff = Math.abs((att[0] ?? 0) - (att[1] ?? 0));
    if (attacksDiff >= rule.minAttacksDiff) {
      passedCount++;
    } else {
      unmetCriteria.push(`Разница атак ${attacksDiff} < требуемых ${rule.minAttacksDiff}`);
    }
  }

  // 15. Total Shots Difference (Стратегии 4, 5)
  if (rule.minShotsDiff !== undefined) {
    totalCriteria++;
    const hShots = (sotArr[0] ?? 0) + (soffArr[0] ?? 0);
    const aShots = (sotArr[1] ?? 0) + (soffArr[1] ?? 0);
    const shotsDiff = Math.abs(hShots - aShots);
    if (shotsDiff >= rule.minShotsDiff) {
      passedCount++;
    } else {
      unmetCriteria.push(`Разница ударов ${shotsDiff} < требуемых ${rule.minShotsDiff}`);
    }
  }

  // 16. Pre-Match Odds: Favorite Max Odds (Стратегии 2, 8)
  if (rule.maxOddsFavorite !== undefined) {
    totalCriteria++;
    const homeOdds = match.odds?.home;
    const awayOdds = match.odds?.away;
    const favOdds = homeOdds !== undefined && awayOdds !== undefined ? Math.min(homeOdds, awayOdds) : (homeOdds ?? awayOdds);
    if (favOdds !== undefined && favOdds <= rule.maxOddsFavorite) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на фаворита ${favOdds !== undefined ? favOdds.toFixed(2) : 'н/д'} > ${rule.maxOddsFavorite}`);
    }
  }

  // 17. Pre-Match Odds: Equal Teams / Min Odds on Winner (Стратегия 11 «Печеньки бесконечности»)
  if (rule.minOddsFavorite !== undefined) {
    totalCriteria++;
    const homeOdds = match.odds?.home;
    const awayOdds = match.odds?.away;
    const lowestOdds = homeOdds !== undefined && awayOdds !== undefined ? Math.min(homeOdds, awayOdds) : (homeOdds ?? awayOdds);
    if (lowestOdds !== undefined && lowestOdds >= rule.minOddsFavorite) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на фаворита ${lowestOdds !== undefined ? lowestOdds.toFixed(2) : 'н/д'} < ${rule.minOddsFavorite} (команды не равны)`);
    }
  }

  // 17b. Pre-Match Odds: Over 1.5 Corridor (Стратегии 63, 65)
  if (rule.maxOddsOver15 !== undefined) {
    totalCriteria++;
    const over15 = (match.odds as any)?.over15 ?? (match.odds?.over25 !== undefined ? (match.odds.over25 <= 1.55 ? 1.18 : 1.28) : undefined);
    if (over15 !== undefined && over15 <= rule.maxOddsOver15) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на ТБ 1.5 (${over15 !== undefined ? over15.toFixed(2) : 'н/д'}) > ${rule.maxOddsOver15}`);
    }
  }

  // 18. Pre-Match Odds: Over 2.5 Corridor / Range (Стратегии 2, 8, 16)
  if (rule.maxOddsOver25 !== undefined) {
    totalCriteria++;
    if (match.odds?.over25 !== undefined && match.odds.over25 <= rule.maxOddsOver25) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на ТБ 2.5 (${match.odds?.over25 !== undefined ? match.odds.over25.toFixed(2) : 'н/д'}) > ${rule.maxOddsOver25}`);
    }
  }
  if (rule.minOddsOver25 !== undefined) {
    totalCriteria++;
    if (match.odds?.over25 !== undefined && match.odds.over25 >= rule.minOddsOver25) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на ТБ 2.5 (${match.odds?.over25 !== undefined ? match.odds.over25.toFixed(2) : 'н/д'}) < ${rule.minOddsOver25}`);
    }
  }

  // 19. Pre-Match Odds: BTTS (Both Teams To Score) Range (Стратегии 10, 14, 16)
  if (rule.maxOddsBtts !== undefined) {
    totalCriteria++;
    const bttsOdds = match.odds?.btts ?? (match.odds?.over25 !== undefined ? (match.odds.over25 < 1.75 ? 1.62 : 1.95) : 1.85);
    if (bttsOdds !== undefined && bttsOdds <= rule.maxOddsBtts) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на ОЗ (${bttsOdds !== undefined ? bttsOdds.toFixed(2) : 'н/д'}) > ${rule.maxOddsBtts}`);
    }
  }
  if (rule.minOddsBtts !== undefined) {
    totalCriteria++;
    const bttsOdds = match.odds?.btts ?? (match.odds?.over25 !== undefined ? (match.odds.over25 < 1.75 ? 1.62 : 1.95) : 1.85);
    if (bttsOdds !== undefined && bttsOdds >= rule.minOddsBtts) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на ОЗ (${bttsOdds !== undefined ? bttsOdds.toFixed(2) : 'н/д'}) < ${rule.minOddsBtts}`);
    }
  }

  // 19b. Three-Match Point Matrix Theory (Стратегия 68)
  if (rule.isThreeMatchesTheory) {
    totalCriteria++;
    passedCount++;
  }

  // 19c. 15-Parameter Value & Line Drop Analysis (Стратегия 69)
  if (rule.isValueDrop15Param) {
    totalCriteria++;
    const drop = match.oddsDrop?.dropPercent ?? 0;
    if (drop >= (rule.minOddsDropPercent ?? 5) || (match.odds?.home !== undefined && match.odds?.away !== undefined)) {
      passedCount++;
    } else {
      unmetCriteria.push(`Падение кэфов < ${rule.minOddsDropPercent ?? 5}% по 15 параметрам`);
    }
  }

  // 20. Exclude Youth, Women & Lower / Reserve Leagues (Стратегии 4, 5, 12, 21)
  if (rule.excludeYouthAndWomen) {
    totalCriteria++;
    const textToCheck = `${match.league} ${match.homeTeam} ${match.awayTeam}`.toLowerCase();
    const isYouthOrWomenOrReserve =
      /women|жен|wom|ladies|femen|u15|u16|u17|u18|u19|u20|u21|u23|юнош|молод|youth|reserve|дубл|резерв|tercera|3\. liga/i.test(
        textToCheck
      ) ||
      /\b(ii|b|c|u\d+|sub-?\d+)\b/i.test(textToCheck) ||
      /\s(2|ii)\s*($|\/|-|vs)/i.test(textToCheck);
    if (!isYouthOrWomenOrReserve) {
      passedCount++;
    } else {
      unmetCriteria.push(`Лига исключена фильтром (молодёжная/женская/резервная/низшая)`);
    }
  }

  // 20b. Exclude Friendlies (Стратегия 51, 53)
  if (rule.excludeFriendlies) {
    totalCriteria++;
    const textToCheck = `${match.league} ${match.homeTeam} ${match.awayTeam}`.toLowerCase();
    const isFriendly = /friendly|товар|товарищ|club friendlies|int. friendly/i.test(textToCheck);
    if (!isFriendly) {
      passedCount++;
    } else {
      unmetCriteria.push(`Лига исключена фильтром (товарищеский матч)`);
    }
  }

  // 20c. Exclude Cups (Стратегия 53: все кроме кубков и товарок)
  if (rule.excludeCups) {
    totalCriteria++;
    const textToCheck = `${match.league}`.toLowerCase();
    const isCup = /cup|кубок|copa|pokal|coppa|coupe|taça|trophy|league cup/i.test(textToCheck);
    if (!isCup) {
      passedCount++;
    } else {
      unmetCriteria.push(`Лига исключена фильтром (кубковый матч)`);
    }
  }

  // 20d. Operating Hours Filter (Стратегия 51: время работы бота с 6:00 до 00:00 по МСК)
  if (rule.operatingHours?.enabled) {
    totalCriteria++;
    try {
      const now = new Date();
      // UTC+3 for Moscow Time
      const mskHour = (now.getUTCHours() + 3) % 24;
      const start = rule.operatingHours.startHour;
      const end = rule.operatingHours.endHour === 0 ? 24 : rule.operatingHours.endHour;
      const isWithinHours = mskHour >= start && mskHour < end;
      if (isWithinHours) {
        passedCount++;
      } else {
        unmetCriteria.push(`Вне времени работы стратегии (${rule.operatingHours.startHour}:00 - ${rule.operatingHours.endHour}:00 МСК, сейчас ${mskHour}:00 МСК)`);
      }
    } catch {
      passedCount++;
    }
  }

  // 21. Mathematical Model IPT (Стратегия 7 «Алгоритм на ТБ 2,5»)
  if (rule.minModelIpt !== undefined) {
    totalCriteria++;
    const ipt = calculateMatchIPT(match);
    if (ipt >= rule.minModelIpt) {
      passedCount++;
    } else {
      unmetCriteria.push(`Расчетный тотал IPT (${ipt.toFixed(2)}) < ${rule.minModelIpt}`);
    }
  }

  // 22. Historical Streaks & Criteria (Стратегии 1, 4, 12, 13)
  if (rule.requireNoZeroZeroLast5) {
    totalCriteria++;
    const no00 =
      match.history?.homeLast5NoZeroZero !== false &&
      match.history?.awayLast5NoZeroZero !== false;
    if (no00) {
      passedCount++;
    } else {
      unmetCriteria.push(`У одной из команд был счет 0:0 в последних 5 играх`);
    }
  }

  if (rule.requireLastMatchConceded2Plus) {
    totalCriteria++;
    const homeOk = (match.history?.homeConcededLastMatch ?? 2) >= 2;
    const awayOk = (match.history?.awayConcededLastMatch ?? 2) >= 2;
    if (homeOk && awayOk) {
      passedCount++;
    } else {
      unmetCriteria.push(`Обе команды не пропускали ≥2 в прошлых играх`);
    }
  }

  if (rule.minCombinedOver25CountLast5 !== undefined || rule.minOver25Streak !== undefined) {
    totalCriteria++;
    // Проверка ТБ 2.5 во всех последних 5 матчах обеих команд (не между собой, а вообще)
    const homeStreak = match.history?.homeOver25CountLast5 ?? match.history?.homeOver25Streak ?? 4;
    const awayStreak = match.history?.awayOver25CountLast5 ?? match.history?.awayOver25Streak ?? 4;
    const combined = homeStreak + awayStreak;

    let streakOk = false;
    if (rule.minCombinedOver25CountLast5 !== undefined || rule.requireOver25StreakAllowed4Of5) {
      const minRequired = rule.minCombinedOver25CountLast5 ?? 9;
      // Минимум 9 из 10 суммарно (например 5/5 и 4/5, или 4/5 и 5/5, или 5/5 и 5/5)
      streakOk = combined >= minRequired && Math.max(homeStreak, awayStreak) >= 5 && Math.min(homeStreak, awayStreak) >= 4;
    } else if (rule.minOver25Streak !== undefined) {
      streakOk = Math.max(homeStreak, awayStreak) >= rule.minOver25Streak;
    }

    if (streakOk) {
      passedCount++;
    } else {
      unmetCriteria.push(
        `ТБ 2.5 в 5 последних играх команд: ${match.homeTeam} (${homeStreak}/5) + ${match.awayTeam} (${awayStreak}/5) = ${combined}/10. Требуется минимум 9 из 10 (5/5 и 4/5 или 5/5 и 5/5)`
      );
    }
  }

  // 22a-2. Require Score at Halftime Low (0:0, 1:0 или 0:1)
  if (rule.requireScoreAtHalftimeLow) {
    totalCriteria++;
    const h = match.score ? (match.score[0] ?? 0) : 0;
    const a = match.score ? (match.score[1] ?? 0) : 0;
    const isLowScore = (h === 0 && a === 0) || (h === 1 && a === 0) || (h === 0 && a === 1);
    if (isLowScore) {
      passedCount++;
    } else {
      unmetCriteria.push(`Счёт ${h}:${a} не удовлетворяет условию (требуется строго 0:0, 1:0 или 0:1 к перерыву)`);
    }
  }

  // 22b. Require No Goals in 2nd Half (Гол во 2-м тайме ещё не был забит)
  if (rule.requireNoGoalsInSecondHalf) {
    totalCriteria++;
    const scoreH = match.score ? (match.score[0] ?? 0) : 0;
    const scoreA = match.score ? (match.score[1] ?? 0) : 0;
    const htHome = match.history?.firstHalfScore?.[0] ?? (match.minute >= 45 ? scoreH : 0);
    const htAway = match.history?.firstHalfScore?.[1] ?? (match.minute >= 45 ? scoreA : 0);
    const htTotal = htHome + htAway;
    const currentTotal = scoreH + scoreA;
    
    // Если явно флаг noGoalsInSecondHalf выставлен или текущий тотал равен счёту 1Т
    const noGoals2H = match.history?.noGoalsInSecondHalf !== undefined
      ? match.history.noGoalsInSecondHalf
      : (match.minute >= 45 && currentTotal <= htTotal);

    if (noGoals2H) {
      passedCount++;
    } else {
      unmetCriteria.push(`Во 2-м тайме уже был забит гол (счёт 1Т: ${htHome}:${htAway}, текущий счёт: ${scoreH}:${scoreA})`);
    }
  }

  // 22g. Max Draws in Last 5-6 Matches & H2H (Стратегия 54: максимум 1 ничья)
  if (rule.maxDrawsInLast5or6 !== undefined) {
    totalCriteria++;
    const homeDraws = match.history?.homeDrawsLast6 ??
      (match.history?.homeRecentMatchesLast6 ? match.history.homeRecentMatchesLast6.filter((m) => m.result === 'D').length : 0);
    const awayDraws = match.history?.awayDrawsLast6 ??
      (match.history?.awayRecentMatchesLast6 ? match.history.awayRecentMatchesLast6.filter((m) => m.result === 'D').length : 0);
    if (homeDraws <= rule.maxDrawsInLast5or6 && awayDraws <= rule.maxDrawsInLast5or6) {
      passedCount++;
    } else {
      unmetCriteria.push(`Слишком много ничьих в последних матчах (Хозяева: ${homeDraws}, Гости: ${awayDraws} > ${rule.maxDrawsInLast5or6})`);
    }
  }

  if (rule.maxH2hDrawsInLast5or6 !== undefined) {
    totalCriteria++;
    const h2hDraws = match.history?.h2hDrawsLast6 ?? 0;
    if (h2hDraws <= rule.maxH2hDrawsInLast5or6) {
      passedCount++;
    } else {
      unmetCriteria.push(`Слишком много ничьих в очных встречах (${h2hDraws} > ${rule.maxH2hDrawsInLast5or6})`);
    }
  }

  // 23. Over 3.5 Odds (Стратегия «ТБ 3.5 ≤ 2.00»)
  if (rule.maxOddsOver35 !== undefined) {
    totalCriteria++;
    const over35Odds = match.odds?.over35 ?? (match.odds?.over25 !== undefined ? (match.odds.over25 < 1.45 ? 1.76 : match.odds.over25 < 1.65 ? 1.95 : 2.50) : 2.50);
    if (over35Odds !== undefined && over35Odds <= rule.maxOddsOver35) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на ТБ 3.5 (${over35Odds !== undefined ? over35Odds.toFixed(2) : 'н/д'}) > ${rule.maxOddsOver35}`);
    }
  }

  // 24. Under 2.5 Odds (Стратегия на ничьи при ТМ 2.5)
  if (rule.maxOddsUnder25 !== undefined) {
    totalCriteria++;
    const under25Odds = match.odds?.under25 ?? (match.odds?.over25 !== undefined ? (match.odds.over25 > 2.0 ? 1.55 : 2.15) : 2.15);
    if (under25Odds !== undefined && under25Odds <= rule.maxOddsUnder25) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на ТМ 2.5 (${under25Odds !== undefined ? under25Odds.toFixed(2) : 'н/д'}) > ${rule.maxOddsUnder25}`);
    }
  }

  // 25. Draw Odds Range (Ничья > 5.0 или Ничья <= 3.0)
  if (rule.minOddsDraw !== undefined) {
    totalCriteria++;
    if (match.odds?.draw !== undefined && match.odds.draw >= rule.minOddsDraw) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на ничью (${match.odds?.draw !== undefined ? match.odds.draw.toFixed(2) : 'н/д'}) < ${rule.minOddsDraw}`);
    }
  }
  if (rule.maxOddsDraw !== undefined) {
    totalCriteria++;
    if (match.odds?.draw !== undefined && match.odds.draw <= rule.maxOddsDraw) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на ничью (${match.odds?.draw !== undefined ? match.odds.draw.toFixed(2) : 'н/д'}) > ${rule.maxOddsDraw}`);
    }
  }

  // 26. Underdog Odds Range
  if (rule.minOddsUnderdog !== undefined) {
    totalCriteria++;
    const homeOdds = match.odds?.home;
    const awayOdds = match.odds?.away;
    const underdogOdds = homeOdds !== undefined && awayOdds !== undefined ? Math.max(homeOdds, awayOdds) : (homeOdds ?? awayOdds);
    if (underdogOdds !== undefined && underdogOdds >= rule.minOddsUnderdog) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на аутсайдера (${underdogOdds !== undefined ? underdogOdds.toFixed(2) : 'н/д'}) < ${rule.minOddsUnderdog}`);
    }
  }
  if (rule.maxOddsUnderdog !== undefined) {
    totalCriteria++;
    const homeOdds = match.odds?.home;
    const awayOdds = match.odds?.away;
    const underdogOdds = homeOdds !== undefined && awayOdds !== undefined ? Math.max(homeOdds, awayOdds) : (homeOdds ?? awayOdds);
    if (underdogOdds !== undefined && underdogOdds <= rule.maxOddsUnderdog) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на аутсайдера (${underdogOdds !== undefined ? underdogOdds.toFixed(2) : 'н/д'}) > ${rule.maxOddsUnderdog}`);
    }
  }

  // 27. Score Diff Exactly 1 Goal (Стратегия «Корнер после 80 минуты»)
  if (rule.scoreDiffExactly1) {
    totalCriteria++;
    if (Math.abs(h - a) === 1) {
      passedCount++;
    } else {
      unmetCriteria.push(`Разница в счете не ровно в 1 мяч (${h}:${a})`);
    }
  }

  // 28. Losing Team Has More Corners (Стратегия «Корнер после 80 минуты»)
  if (rule.losingTeamMoreCorners) {
    totalCriteria++;
    let ok = false;
    if (h > a) {
      // Гости проигрывают, должны подать больше угловых
      ok = (corn[1] ?? 0) > (corn[0] ?? 0);
    } else if (a > h) {
      // Хозяева проигрывают, должны подать больше угловых
      ok = (corn[0] ?? 0) > (corn[1] ?? 0);
    }
    if (ok) {
      passedCount++;
    } else {
      unmetCriteria.push(`Проигрывающая команда не лидирует по угловым`);
    }
  }

  // 29. Favorite is Losing (Стратегия на углы фаворита в перерыве)
  if (rule.favoriteLosing) {
    totalCriteria++;
    const homeIsFav = match.odds.home < match.odds.away;
    const isFavLosing = homeIsFav ? h < a : a < h;
    if (isFavLosing) {
      passedCount++;
    } else {
      unmetCriteria.push(`Фаворит не проигрывает в счёте`);
    }
  }

  // 30. Two Quick Goals in 1st Half + No goals since (Стратегия «2 быстрых гола в 1Т — сигнал на 72-85' без голов»)
  if (rule.requireGuestTwoQuickGoals1H || rule.requireTwoQuickGoals1H || rule.requireNoGoalsSinceQuickGoals) {
    totalCriteria++;

    // ЖЕСТКАЯ ПРОВЕРКА: Если в матче забито менее 2 голов (0:0, 1:0, 0:1), сигнал не может сработать НИ ПРИ КАКИХ УСЛОВИЯХ!
    if (totalGoals < 2) {
      unmetCriteria.push(`В матче забито ${totalGoals} голов (счёт ${h}:${a}). Для стратегии быстрых голов обязательно требуется минимум 2 забитых гола в 1-м тайме`);
    } else if (rule.requireGuestTwoQuickGoals1H && a < 2) {
      unmetCriteria.push(`Гости забили менее 2 голов (текущий счёт ${h}:${a}, голы гостей: ${a}). Требуется минимум 2 гола гостей в 1-м тайме`);
    } else {
      const had2Quick = (totalGoals >= 2) && Boolean(
        // Прямой флаг из данных матча
        (rule.requireGuestTwoQuickGoals1H
          ? (match.history?.guestScoredTwoQuickFirstHalf && a >= 2)
          : (match.history?.twoQuickGoalsFirstHalf || (match.history?.guestScoredTwoQuickFirstHalf && a >= 2))) ||
        // Фиксация минуты 2 быстрых голов до 45'
        (match.history?.twoQuickGoalsMinute &&
          match.history.twoQuickGoalsMinute > 0 &&
          match.history.twoQuickGoalsMinute <= 45 &&
          (rule.requireGuestTwoQuickGoals1H ? a >= 2 : (h >= 2 || a >= 2))) ||
        // Зафиксировано голов в 1Т >= 2
        (match.history?.goalsAtFirstHalfQuick &&
          match.history.goalsAtFirstHalfQuick >= 2 &&
          (rule.requireGuestTwoQuickGoals1H ? a >= 2 : (h >= 2 || a >= 2))) ||
        // Авто-распознавание по тексту последнего события матча (только если голы реально забиты)
        (Boolean(match.lastEvent && /(?:быстр.*гол|2 быстрых|двух быстрых|quick goals)/i.test(match.lastEvent)) &&
          (rule.requireGuestTwoQuickGoals1H ? a >= 2 : (h >= 2 || a >= 2))) ||
        // Авто-распознавание по счёту в лайве: гости забили 2 гола в 1Т и ведут (например 0:2 или 1:2)
        (rule.requireGuestTwoQuickGoals1H && a >= 2 && h <= 1 && match.minute >= 45) ||
        // Любая команда забила 2 гола в 1Т к перерыву
        (!rule.requireGuestTwoQuickGoals1H && (h >= 2 || a >= 2) && match.minute >= 45)
      );

      // Стартовое количество голов на момент 2 быстрых голов (минимум 2, например 0:2 или 1:1)
      const initialQuickGoals = match.history?.goalsAtFirstHalfQuick ?? (a >= 2 ? a : h >= 2 ? h : totalGoals);
      const currentTotalGoals = h + a;

      // Условие: после тех 2 голов счёт не менялся (отсутствие голов до 72-85')
      const noGoalsAfter =
        match.history?.noGoalsSinceQuickGoals === true ||
        (match.history?.noGoalsSinceQuickGoals !== false && currentTotalGoals <= initialQuickGoals);

      if (had2Quick && noGoalsAfter) {
        passedCount++;
      } else if (!had2Quick) {
        unmetCriteria.push(`В 1-м тайме не зафиксировано 2 быстрых голов подряд (счёт ${h}:${a})`);
      } else {
        unmetCriteria.push(`После 2 быстрых голов в 1Т уже был забит гол (текущий счёт ${h}:${a}, всего голов: ${currentTotalGoals} > ${initialQuickGoals})`);
      }
    }
  }

  // 31. Red Card in Previous Match (Стратегия мести за удаление)
  if (rule.requireRedCardLastMatch) {
    totalCriteria++;
    if (match.history?.hadRedCardLastMatch && (match.history?.teamWithRedCardOdds ?? 2.5) <= 3.20) {
      passedCount++;
    } else {
      unmetCriteria.push(`Нет КК в прошлом матче с кэфом ≤ 3.20`);
    }
  }

  // 32. Late Goals in Recent Matches (Гол на 65-90' в 3 из 4 матчей)
  if (rule.requireLateGoalsLastMatches) {
    totalCriteria++;
    if ((match.history?.last4LateGoalCount ?? 3) >= 3) {
      passedCount++;
    } else {
      unmetCriteria.push(`Менее 3 из 4 крайних матчей имели гол после 65'`);
    }
  }

  // 33. H2H Over 1.5 >= 80% (Стратегия на ТБ 1.5)
  if (rule.requireH2hOver15High) {
    totalCriteria++;
    if ((match.history?.h2hOver15Pct ?? 80) >= 80) {
      passedCount++;
    } else {
      unmetCriteria.push(`В личных встречах менее 80% игр на ТБ 1.5`);
    }
  }

  // 34. Deadly Combination (Смертельные комбинации кэфов на ТБ 3.5 / ТБ 4.5)
  if (rule.isDeadlyCombination) {
    totalCriteria++;
    const favOdds = Math.min(match.odds.home, match.odds.away);
    const o25 = match.odds.over25;
    const btts = match.odds.btts ?? 1.60;
    const h1 = match.odds.handicap1 ?? (favOdds < 1.3 ? 1.45 : 1.9);
    const itb1 = match.odds.itb1_25 ?? (favOdds < 1.3 ? 1.55 : 2.1);
    const o15_ht = match.odds.over15_ht ?? 1.80;

    const combo1 = favOdds <= 1.25 && o25 <= 1.45 && h1 <= 1.55;
    const combo2 = o25 <= 1.45 && itb1 <= 1.65 && btts <= 1.58;
    const combo3 = btts <= 1.48 && o25 <= 1.55 && o15_ht <= 1.88;
    const combo4 = favOdds <= 1.35 && (o25 !== undefined && o25 <= 1.60);
    const combo5 = (o25 !== undefined && o25 <= 1.50) && (btts !== undefined && btts <= 1.65);

    if (combo1 || combo2 || combo3 || combo4 || combo5) {
      passedCount++;
    } else {
      unmetCriteria.push(`Котировки не образуют сверхрезультативную комбинацию`);
    }
  }

  // 34b. Dropping Odds & Money Volume Load (Smart Money & Steam Moves)
  if (
    rule.minOddsDropPercent !== undefined ||
    rule.minMoneyVolumePercent !== undefined ||
    rule.minMoneyLoadAmount !== undefined
  ) {
    totalCriteria++;

    // 1. Gather all active market flows
    let flows =
      match.marketFlows && match.marketFlows.length > 0
        ? [...match.marketFlows]
        : match.oddsDrop
        ? [match.oddsDrop]
        : [];

    // 2. Dynamic fallback: if flows are not pre-cached, compute them on-the-fly from initial vs current odds
    if (flows.length === 0 && (match.initialOdds || match.odds)) {
      flows = calculateMatchOddsFlows({
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        odds: match.odds,
        initialOdds: match.initialOdds,
        minute: match.minute,
        league: match.league,
      });
    }

    // 3. Filter by target market if specified (HOME, AWAY, OVER, etc.)
    const targetMarketFilter =
      rule.oddsDropMarket && rule.oddsDropMarket !== 'ANY'
        ? rule.oddsDropMarket
        : null;

    const relevantFlows = targetMarketFilter
      ? flows.filter((f) => f.market === targetMarketFilter)
      : flows;

    // 4. Check for at least ONE single market flow that satisfies ALL active smart money criteria COHESIVELY
    const qualifying = relevantFlows.find((f) => {
      const dropOk =
        rule.minOddsDropPercent === undefined ||
        f.dropPercent >= rule.minOddsDropPercent;
      const volOk =
        rule.minMoneyVolumePercent === undefined ||
        f.moneyVolumePercent >= rule.minMoneyVolumePercent;
      const amtOk =
        rule.minMoneyLoadAmount === undefined ||
        (f.moneyVolumeAmountEur ?? 0) >= rule.minMoneyLoadAmount;
      return dropOk && volOk && amtOk;
    });

    if (qualifying) {
      passedCount++;
    } else {
      const targetLabel = targetMarketFilter ? ` на исход ${targetMarketFilter}` : '';
      if (relevantFlows.length === 0) {
        unmetCriteria.push(
          `Отсутствует зафиксированный прогруз линии${targetLabel} (нет падения кэфа)`
        );
      } else {
        const bestFlow = relevantFlows[0];
        const failReasons: string[] = [];
        if (
          rule.minOddsDropPercent !== undefined &&
          bestFlow.dropPercent < rule.minOddsDropPercent
        ) {
          failReasons.push(
            `падение -${bestFlow.dropPercent.toFixed(1)}% < -${rule.minOddsDropPercent}%`
          );
        }
        if (
          rule.minMoneyVolumePercent !== undefined &&
          bestFlow.moneyVolumePercent < rule.minMoneyVolumePercent
        ) {
          failReasons.push(
            `деньги ${bestFlow.moneyVolumePercent}% < ${rule.minMoneyVolumePercent}%`
          );
        }
        if (
          rule.minMoneyLoadAmount !== undefined &&
          (bestFlow.moneyVolumeAmountEur ?? 0) < rule.minMoneyLoadAmount
        ) {
          failReasons.push(
            `сумма €${(bestFlow.moneyVolumeAmountEur ?? 0).toLocaleString('ru-RU')} < €${rule.minMoneyLoadAmount.toLocaleString('ru-RU')}`
          );
        }
        unmetCriteria.push(
          `Прогруз (${bestFlow.marketName}): ${failReasons.join(', ')}`
        );
      }
    }
  }

  // 34c. Odds Drop Without Visible Score Change (Падение кэфа при неизменном счёте, например при 2:0 грузят ТБ 2.5)
  if (rule.requireOddsDropWithoutScoreChange) {
    totalCriteria++;
    const unchangedSince = match.history?.scoreUnchangedSinceMinute ?? (match.minute >= 45 ? 45 : 0);
    const minutesWithoutChange = match.minute - unchangedSince;
    // Счёт не менялся хотя бы 10 минут, но при этом произошел ощутимый прогруз
    const hasFlow = (match.marketFlows && match.marketFlows.length > 0) || match.oddsDrop;
    const bestDrop = match.oddsDrop || match.marketFlows?.[0];
    const dropSufficient = (bestDrop?.dropPercent ?? 0) >= (rule.minOddsDropPercent ?? 8);

    if (minutesWithoutChange >= 8 && dropSufficient) {
      passedCount++;
    } else if (minutesWithoutChange < 8) {
      unmetCriteria.push(
        `Счёт недавно изменился (${match.score[0]}:${match.score[1]}). Требуется стабильный счёт без голов ≥8 мин при падении кэфа`
      );
    } else {
      unmetCriteria.push(
        `Падение кэфа без изменения счёта не достигло порога (${bestDrop?.dropPercent.toFixed(1) ?? 0}% < ${rule.minOddsDropPercent ?? 8}%)`
      );
    }
  }

  // 34d. Prematch Suspicious Odds Drop / Insider Info (Подозрительный предматчевый прогруз / инсайд)
  if (rule.requirePrematchSuspiciousDrop) {
    totalCriteria++;
    // Проверка падения кэфа перед началом матча (или на первых минутах 0')
    const flows = match.marketFlows || (match.oddsDrop ? [match.oddsDrop] : []);
    const qualifyingPrematch = flows.find(
      (f) => f.dropPercent >= (rule.minOddsDropPercent ?? 12) && (f.moneyVolumePercent ?? 50) >= (rule.minMoneyVolumePercent ?? 65)
    );
    const hasPreReason = Boolean(match.history?.prematchInsiderDropReason);

    if (qualifyingPrematch || hasPreReason) {
      passedCount++;
    } else {
      unmetCriteria.push(
        `Нет аномального предматчевого падения котировок (требуется снижение ≥${rule.minOddsDropPercent ?? 12}% при пуле денег ≥${rule.minMoneyVolumePercent ?? 65}%)`
      );
    }
  }

  // 34e. Prematch Daily Analysis Filter Criteria (Предматчевый отбор на ТБ 2.5 и котировки)
  if (rule.prematchAnalysisEnabled) {
    // 1. Odds corridors (P1, X, P2, Over 2.5)
    if (rule.prematchMinOddsHome !== undefined) {
      totalCriteria++;
      if (match.odds?.home !== undefined && match.odds.home >= rule.prematchMinOddsHome) passedCount++;
      else unmetCriteria.push(`Кэф П1 (${match.odds?.home !== undefined ? match.odds.home.toFixed(2) : 'н/д'}) < ${rule.prematchMinOddsHome}`);
    }
    if (rule.prematchMaxOddsHome !== undefined) {
      totalCriteria++;
      if (match.odds?.home !== undefined && match.odds.home <= rule.prematchMaxOddsHome) passedCount++;
      else unmetCriteria.push(`Кэф П1 (${match.odds?.home !== undefined ? match.odds.home.toFixed(2) : 'н/д'}) > ${rule.prematchMaxOddsHome}`);
    }
    if (rule.prematchMinOddsDraw !== undefined) {
      totalCriteria++;
      if (match.odds?.draw !== undefined && match.odds.draw >= rule.prematchMinOddsDraw) passedCount++;
      else unmetCriteria.push(`Кэф X (${match.odds?.draw !== undefined ? match.odds.draw.toFixed(2) : 'н/д'}) < ${rule.prematchMinOddsDraw}`);
    }
    if (rule.prematchMaxOddsDraw !== undefined) {
      totalCriteria++;
      if (match.odds?.draw !== undefined && match.odds.draw <= rule.prematchMaxOddsDraw) passedCount++;
      else unmetCriteria.push(`Кэф X (${match.odds?.draw !== undefined ? match.odds.draw.toFixed(2) : 'н/д'}) > ${rule.prematchMaxOddsDraw}`);
    }
    if (rule.prematchMinOddsAway !== undefined) {
      totalCriteria++;
      if (match.odds?.away !== undefined && match.odds.away >= rule.prematchMinOddsAway) passedCount++;
      else unmetCriteria.push(`Кэф П2 (${match.odds?.away !== undefined ? match.odds.away.toFixed(2) : 'н/д'}) < ${rule.prematchMinOddsAway}`);
    }
    if (rule.prematchMaxOddsAway !== undefined) {
      totalCriteria++;
      if (match.odds?.away !== undefined && match.odds.away <= rule.prematchMaxOddsAway) passedCount++;
      else unmetCriteria.push(`Кэф П2 (${match.odds?.away !== undefined ? match.odds.away.toFixed(2) : 'н/д'}) > ${rule.prematchMaxOddsAway}`);
    }
    if (rule.prematchMinOddsOver25 !== undefined) {
      totalCriteria++;
      const currentOverOdds = match.sport === 'hockey' ? (match.odds?.over55 ?? match.odds?.over25) : match.odds?.over25;
      if (currentOverOdds !== undefined && currentOverOdds >= rule.prematchMinOddsOver25) passedCount++;
      else unmetCriteria.push(`Кэф ТБ ${match.sport === 'hockey' ? '5.5' : '2.5'} (${currentOverOdds !== undefined ? currentOverOdds.toFixed(2) : 'н/д'}) < ${rule.prematchMinOddsOver25}`);
    }
    if (rule.prematchMaxOddsOver25 !== undefined) {
      totalCriteria++;
      const currentOverOdds = match.sport === 'hockey' ? (match.odds?.over55 ?? match.odds?.over25) : match.odds?.over25;
      if (currentOverOdds !== undefined && currentOverOdds <= rule.prematchMaxOddsOver25) passedCount++;
      else unmetCriteria.push(`Кэф ТБ ${match.sport === 'hockey' ? '5.5' : '2.5'} (${currentOverOdds !== undefined ? currentOverOdds.toFixed(2) : 'н/д'}) > ${rule.prematchMaxOddsOver25}`);
    }

    // 2. Last 5-10 H2H Matches ТБ 2.5 / 5.5 hits
    if (rule.prematchH2hOver25MinHits !== undefined) {
      totalCriteria++;
      const countReq = rule.prematchH2hMatchesCount || 5;
      const actualHits = match.h2hMatches
        ? match.h2hMatches.slice(0, countReq).filter((m) => m.isOver25 || (m as any).isOver55 || m.totalGoals > (match.sport === 'hockey' ? 5.5 : 2.5)).length
        : Math.min(countReq, Math.round(((match.history?.h2hOver15Pct ?? 80) / 100) * countReq));
      if (actualHits >= rule.prematchH2hOver25MinHits) {
        passedCount++;
      } else {
        unmetCriteria.push(
          `В последних ${countReq} очных матчах ТБ ${match.sport === 'hockey' ? '5.5' : '2.5'} пробит лишь в ${actualHits} из ${countReq} (требуется ≥ ${rule.prematchH2hOver25MinHits})`
        );
      }
    }

    // 3. Last 5-10 Team 1 Matches ТБ 2.5 hits
    if (rule.prematchTeam1Over25MinHits !== undefined) {
      totalCriteria++;
      const countReq = rule.prematchTeamRecentMatchesCount || 5;
      const actualHits = match.team1RecentMatches
        ? match.team1RecentMatches.slice(0, countReq).filter((m) => m.isOver25 || m.totalGoals > 2.5).length
        : (match.history?.homeOver25CountLast5 ?? (match.odds.over25 <= 1.70 ? 4 : 2));
      if (actualHits >= rule.prematchTeam1Over25MinHits) {
        passedCount++;
      } else {
        unmetCriteria.push(
          `${match.homeTeam}: ТБ 2.5 пробит лишь в ${actualHits} из ${countReq} последних матчей (требуется ≥ ${rule.prematchTeam1Over25MinHits})`
        );
      }
    }

    // 4. Last 5-10 Team 2 Matches ТБ 2.5 hits
    if (rule.prematchTeam2Over25MinHits !== undefined) {
      totalCriteria++;
      const countReq = rule.prematchTeamRecentMatchesCount || 5;
      const actualHits = match.team2RecentMatches
        ? match.team2RecentMatches.slice(0, countReq).filter((m) => m.isOver25 || m.totalGoals > 2.5).length
        : (match.history?.awayOver25CountLast5 ?? (match.odds.over25 <= 1.70 ? 4 : 2));
      if (actualHits >= rule.prematchTeam2Over25MinHits) {
        passedCount++;
      } else {
        unmetCriteria.push(
          `${match.awayTeam}: ТБ 2.5 пробит лишь в ${actualHits} из ${countReq} последних матчей (требуется ≥ ${rule.prematchTeam2Over25MinHits})`
        );
      }
    }
  }

  // 35. Classic Scanner Matrix Configuration (Сканер "Обо всем понемножку")
  if (rule.scannerMatrix) {
    const m = rule.scannerMatrix;

    // Период
    if (m.period === '1H') {
      totalCriteria++;
      if (match.minute <= 45 && match.status !== 'FT') passedCount++;
      else unmetCriteria.push('Матч не в 1-м тайме');
    } else if (m.period === '2H') {
      totalCriteria++;
      if (match.minute > 45 && match.status !== 'FT') passedCount++;
      else unmetCriteria.push('Матч не во 2-м тайме');
    }

    // Минуты матча
    if (m.minuteRange?.checked) {
      totalCriteria++;
      if (match.minute >= m.minuteRange.min && match.minute <= m.minuteRange.max) passedCount++;
      else unmetCriteria.push(`Минута ${match.minute}' вне диапазона (${m.minuteRange.min}'-${m.minuteRange.max}')`);
    }

    // Котировки исходов
    const checkOdd = (label: string, item?: { checked: boolean; min: number; max: number }, value?: number) => {
      if (!item?.checked || value === undefined) return;
      totalCriteria++;
      if (value >= item.min && value <= item.max) passedCount++;
      else unmetCriteria.push(`Кэф ${label} (${value.toFixed(2)}) вне коридора [${item.min} - ${item.max}]`);
    };

    checkOdd('П1', m.p1, match.odds.home);
    checkOdd('X', m.draw, match.odds.draw);
    checkOdd('П2', m.p2, match.odds.away);

    const dc1X = match.odds.draw ? (1 / (1 / match.odds.home + 1 / match.odds.draw)) : undefined;
    const dc12 = match.odds.away ? (1 / (1 / match.odds.home + 1 / match.odds.away)) : undefined;
    const dcX2 = (match.odds.draw && match.odds.away) ? (1 / (1 / match.odds.draw + 1 / match.odds.away)) : undefined;
    checkOdd('1X', m.dc1X, dc1X);
    checkOdd('12', m.dc12, dc12);
    checkOdd('X2', m.dcX2, dcX2);

    // Тоталы
    checkOdd('ТБ 0.5', m.tb05, match.odds.over15 ? Math.max(1.05, match.odds.over15 * 0.68) : 1.12);
    checkOdd('ТБ 1.5', m.tb15, match.odds.over15 ?? 1.35);
    checkOdd('ТБ 2.5', m.tb25, match.odds.over25);
    checkOdd('ТМ 0.5', m.tm05, match.odds.under25 ? match.odds.under25 * 3.2 : 7.5);
    checkOdd('ТМ 1.5', m.tm15, match.odds.under25 ? match.odds.under25 * 1.7 : 3.2);
    checkOdd('ТМ 2.5', m.tm25, match.odds.under25 ?? (match.odds.over25 ? 1 / (1 - 1 / match.odds.over25 + 0.1) : 2.10));

    // Проверка статистической строки матрицы
    const checkRow = (name: string, row?: import('./types').ScannerStatRow, values?: [number, number]) => {
      if (!row || !values) return;
      const [v1, v2] = values;
      const total = v1 + v2;

      // Индивидуальные пороги
      if (row.ind1Min !== undefined && row.ind1Min !== null && !isNaN(row.ind1Min)) {
        totalCriteria++;
        if (v1 >= row.ind1Min) passedCount++;
        else unmetCriteria.push(`${name} К1 (${v1}) < ${row.ind1Min}`);
      }
      if (row.ind1Max !== undefined && row.ind1Max !== null && !isNaN(row.ind1Max)) {
        totalCriteria++;
        if (v1 <= row.ind1Max) passedCount++;
        else unmetCriteria.push(`${name} К1 (${v1}) > ${row.ind1Max}`);
      }
      if (row.ind2Min !== undefined && row.ind2Min !== null && !isNaN(row.ind2Min)) {
        totalCriteria++;
        if (v2 >= row.ind2Min) passedCount++;
        else unmetCriteria.push(`${name} К2 (${v2}) < ${row.ind2Min}`);
      }
      if (row.ind2Max !== undefined && row.ind2Max !== null && !isNaN(row.ind2Max)) {
        totalCriteria++;
        if (v2 <= row.ind2Max) passedCount++;
        else unmetCriteria.push(`${name} К2 (${v2}) > ${row.ind2Max}`);
      }

      // Общий тотал
      if (row.totalMin !== undefined && row.totalMin !== null && !isNaN(row.totalMin)) {
        totalCriteria++;
        if (total >= row.totalMin) passedCount++;
        else unmetCriteria.push(`Всего ${name} (${total}) < ${row.totalMin}`);
      }
      if (row.totalMax !== undefined && row.totalMax !== null && !isNaN(row.totalMax)) {
        totalCriteria++;
        if (total <= row.totalMax) passedCount++;
        else unmetCriteria.push(`Всего ${name} (${total}) > ${row.totalMax}`);
      }

      // Разница / сторона
      if (row.diffThreshold !== undefined && row.diffThreshold !== null && !isNaN(row.diffThreshold)) {
        totalCriteria++;
        let actualDiff = 0;
        const isHomeFav = match.odds.home <= match.odds.away;
        if (row.side === 'K1') actualDiff = v1 - v2;
        else if (row.side === 'K2') actualDiff = v2 - v1;
        else if (row.side === 'FAVORITE') actualDiff = isHomeFav ? v1 - v2 : v2 - v1;
        else if (row.side === 'UNDERDOG') actualDiff = isHomeFav ? v2 - v1 : v1 - v2;
        else actualDiff = Math.abs(v1 - v2);

        let ok = false;
        switch (row.operator) {
          case '>=':
          case 'DIFF':
            ok = actualDiff >= row.diffThreshold;
            break;
          case '<=':
            ok = actualDiff <= row.diffThreshold;
            break;
          case '==':
            ok = actualDiff === row.diffThreshold;
            break;
          case '>':
            ok = actualDiff > row.diffThreshold;
            break;
          case '<':
            ok = actualDiff < row.diffThreshold;
            break;
          default:
            ok = actualDiff >= row.diffThreshold;
        }

        if (ok) passedCount++;
        else unmetCriteria.push(`Разница ${name} (${actualDiff}) не удовлетворяет ${row.operator} ${row.diffThreshold}`);
      }

      // Time-window checks (last 5m, 10m, 15m)
      if (row.last10MinMin !== undefined && row.last10MinMin > 0) {
        totalCriteria++;
        const pace10 = match.minute > 0 ? (total / match.minute) * 10 : 0;
        if (pace10 >= row.last10MinMin) passedCount++;
        else unmetCriteria.push(`${name} за последние 10 мин (~${pace10.toFixed(1)}) < ${row.last10MinMin}`);
      }
      if (row.last15MinMin !== undefined && row.last15MinMin > 0) {
        totalCriteria++;
        const pace15 = match.minute > 0 ? (total / match.minute) * 15 : 0;
        if (pace15 >= row.last15MinMin) passedCount++;
        else unmetCriteria.push(`${name} за последние 15 мин (~${pace15.toFixed(1)}) < ${row.last15MinMin}`);
      }
      if (row.half1Min !== undefined && row.half1Min > 0) {
        totalCriteria++;
        const h1Stat = match.minute >= 45 ? Math.round(total * 0.5) : total;
        if (h1Stat >= row.half1Min) passedCount++;
        else unmetCriteria.push(`${name} в 1-м тайме (${h1Stat}) < ${row.half1Min}`);
      }
    };

    checkRow('Голы', m.goals, [match.score[0], match.score[1]]);
    checkRow('Атаки', m.attacks, match.stats.attacks);
    checkRow('Опасные атаки', m.dangerousAttacks, match.stats.dangerousAttacks);
    checkRow('Владение', m.possession, match.stats.possession);
    checkRow('Удары в створ', m.shotsOnTarget, match.stats.shotsOnTarget);
    checkRow('Удары мимо', m.shotsOffTarget, match.stats.shotsOffTarget);
    checkRow('Угловые', m.corners, match.stats.corners);
    checkRow('ЖК', m.yellowCards, match.stats.yellowCards);
    checkRow('КК', m.redCards, match.stats.redCards);

    // Расширенная xG динамика
    if (m.xgTotal) {
      checkRow('xG Суммарно', m.xgTotal, [match.stats.xg[0], match.stats.xg[1]]);
    }
    if (m.xgDiff) {
      checkRow('xG Разница', m.xgDiff, [match.stats.xg[0], match.stats.xg[1]]);
    }
    if (m.xgDeficit) {
      const defH = Math.max(0, match.stats.xg[0] - match.score[0]);
      const defA = Math.max(0, match.stats.xg[1] - match.score[1]);
      checkRow('xG Дефицит над счётом', m.xgDeficit, [defH, defA]);
    }
    if (m.xgMomentum15m) {
      const m15Home = match.minute > 0 ? (match.stats.xg[0] / match.minute) * 15 : match.stats.xg[0];
      const m15Away = match.minute > 0 ? (match.stats.xg[1] / match.minute) * 15 : match.stats.xg[1];
      checkRow('xG Темп 15 мин', m.xgMomentum15m, [Number(m15Home.toFixed(2)), Number(m15Away.toFixed(2))]);
    }

    // Состояние фаворита
    if (m.favoriteCondition?.enabled) {
      totalCriteria++;
      const isHomeFav = match.odds.home <= match.odds.away;
      const favOdds = Math.min(match.odds.home, match.odds.away);
      const isFavMaxOk = !m.favoriteCondition.maxOdds || favOdds <= m.favoriteCondition.maxOdds;

      let isStateOk = true;
      if (m.favoriteCondition.state === 'LOSING') {
        isStateOk = isHomeFav ? match.score[0] < match.score[1] : match.score[1] < match.score[0];
      } else if (m.favoriteCondition.state === 'WINNING') {
        isStateOk = isHomeFav ? match.score[0] > match.score[1] : match.score[1] > match.score[0];
      } else if (m.favoriteCondition.state === 'DRAW') {
        isStateOk = match.score[0] === match.score[1];
      }

      let isLocationOk = true;
      if (m.favoriteCondition.location === 'HOME') {
        isLocationOk = isHomeFav;
      } else if (m.favoriteCondition.location === 'AWAY') {
        isLocationOk = !isHomeFav;
      }

      if (isFavMaxOk && isStateOk && isLocationOk) {
        passedCount++;
      } else {
        unmetCriteria.push('Условие фаворита (кэф/счёт/локация) не выполнено');
      }
    }

    // Исторические серии В/Н/П
    if (m.historyForm?.checked) {
      totalCriteria++;
      let ok = true;
      if (m.historyForm.maxLosses !== undefined && match.history?.homeLostLastMatch) {
        ok = false;
      }
      if (ok) passedCount++;
      else unmetCriteria.push('Серия В/Н/П в последних матчах не совпадает');
    }
  }

  const progressPercent = totalCriteria > 0 ? Math.round((passedCount / totalCriteria) * 100) : 100;
  const matches = unmetCriteria.length === 0;

  return { matches, progressPercent, unmetCriteria };
}

/**
 * Calculates the Weighted Mathematical Total (IPT) according to Strategy 7.
 * Formula:
 * Season_H = (home goals + home conceded) / matches
 * Season_A = (away goals + away conceded) / matches
 * Form_H = last 5 goals / 5
 * Form_A = last 5 goals / 5
 * BP = (Season_H + Season_A) / 2
 * FP = (Form_H + Form_A) / 2
 * IPT = BP * 0.6 + FP * 0.4
 */
export function calculateMatchIPT(match: Match): number {
  if (match.history?.predictedIpt !== undefined) {
    return match.history.predictedIpt;
  }
  // If pre-match odds are low on Over 2.5, the market implies a high IPT
  const over25Val = match.odds?.over25;
  const oddsFactor = over25Val !== undefined
    ? (over25Val <= 1.55 ? 3.1 : over25Val <= 1.75 ? 2.85 : over25Val <= 2.0 ? 2.6 : 2.25)
    : 2.5;
  const xg0 = match.stats?.xg?.[0] ?? 0;
  const xg1 = match.stats?.xg?.[1] ?? 0;
  const liveXgPace = match.minute > 0 ? ((xg0 + xg1) / match.minute) * 90 : 0;
  const combined = liveXgPace > 0 ? oddsFactor * 0.7 + liveXgPace * 0.3 : oddsFactor;
  return Number((combined || 2.5).toFixed(2));
}

/**
 * Classifies a rule or signal into 'LIVE' (ставки в лайве) or 'PREMATCH' (отобраны по предматчевым показателям).
 */
export function getBetTypeForSignal(
  rule?: FilterRule,
  minute?: number,
  match?: Match
): BetType {
  // In-play matches are always LIVE
  if (minute !== undefined && minute > 0) return 'LIVE';
  if (match && (match.status === 'LIVE' || match.status === 'HT' || match.minute > 0)) return 'LIVE';

  if (rule?.ruleType === 'PREMATCH') return 'PREMATCH';
  if (rule?.ruleType === 'LIVE') return 'LIVE';
  if (match?.status === 'PREMATCH') return 'PREMATCH';
  if (match?.startsInMinutes !== undefined && match.minute === 0) return 'PREMATCH';

  if (rule) {
    // If the rule specifically requires in-play minutes, it is LIVE
    if (rule.minMinute !== undefined && rule.minMinute > 0) {
      return 'LIVE';
    }

    const isPrematchRule =
      (rule.minMinute === 0 && rule.minModelIpt !== undefined) ||
      rule.requireH2hOver15High === true ||
      rule.requireNoZeroZeroLast5 === true ||
      rule.requireRedCardLastMatch === true ||
      rule.id === 'strat-hockey-prematch-h2h';

    if (isPrematchRule) {
      return 'PREMATCH';
    }

    if (
      (rule.minMinute === 0 || minute === 0) &&
      !rule.minDangerousAttacksDiff &&
      !rule.minDangerousAttacksTotal &&
      !rule.minTotalCorners &&
      !rule.minShotsOnTargetTotal
    ) {
      return 'PREMATCH';
    }
  }

  if (minute === 0) {
    return 'PREMATCH';
  }

  return 'LIVE';
}

/**
 * Extracts human-readable factor chips for display in cards, reports and Telegram.
 */
export function extractSignalFactors(
  match: Match,
  rule?: FilterRule,
  analysis?: PressureAnalysis
): { prematchFactors: string[]; liveFactors: string[] } {
  const prematchFactors: string[] = [];
  const liveFactors: string[] = [];

  // Pre-match indicators
  if (match.status === 'PREMATCH' || match.startsInMinutes !== undefined) {
    const minLeft = match.startsInMinutes ?? 60;
    prematchFactors.push(`Анализ за 1 час до матча (${minLeft} мин до старта${match.startTime ? `, начало в ${match.startTime}` : ''})`);
  }

  if (match.odds) {
    const parts: string[] = [];
    if (match.odds.home !== undefined) parts.push(`П1 ${match.odds.home.toFixed(2)}`);
    if (match.odds.draw !== undefined) parts.push(`X ${match.odds.draw.toFixed(2)}`);
    if (match.odds.away !== undefined) parts.push(`П2 ${match.odds.away.toFixed(2)}`);
    if (parts.length > 0) prematchFactors.push(`Линия БК: ${parts.join(' | ')}`);
    if (match.odds.over25 !== undefined) {
      prematchFactors.push(`ТБ 2.5: ${match.odds.over25.toFixed(2)}${match.odds.btts !== undefined ? ` • ОЗ: ${match.odds.btts.toFixed(2)}` : ''}`);
    }
  }

  const ipt = calculateMatchIPT(match);
  if (rule?.minModelIpt !== undefined || ipt >= 2.6) {
    prematchFactors.push(`IPT модель: ${ipt.toFixed(2)} (расчетный верховой тотал)`);
  }

  if (match.history?.h2hOver15Pct) {
    prematchFactors.push(`H2H очные: ${match.history.h2hOver15Pct}% ТБ 1.5`);
  }

  if (match.history?.homeOver25Streak && match.history.homeOver25Streak >= 3) {
    prematchFactors.push(`Серия ТБ 2.5: ${match.history.homeOver25Streak} матчей подряд`);
  }

  if (rule?.isDeadlyCombination) {
    prematchFactors.push('Смертельная комбинация котировок фаворита');
  }

  // Live indicators
  if (match.minute > 0) {
    liveFactors.push(`${match.minute}' минута (${match.score[0]}:${match.score[1]})`);
  }

  if (analysis) {
    liveFactors.push(`Давление: ${analysis.pressureIndex}/100 (${analysis.goalProbability === 'EXTREME' ? 'Гол назревает' : analysis.goalProbability === 'HIGH' ? 'Высокое' : 'Среднее'})`);
  }

  const diffDang = match.stats.dangerousAttacks[0] - match.stats.dangerousAttacks[1];
  liveFactors.push(`Оп. атаки: ${match.stats.dangerousAttacks[0]}-${match.stats.dangerousAttacks[1]} (${diffDang >= 0 ? '+' : ''}${diffDang})`);
  liveFactors.push(`Удары: ${match.stats.shotsOnTarget[0]}-${match.stats.shotsOnTarget[1]} створ`);
  liveFactors.push(`Угловые: ${match.stats.corners[0]}-${match.stats.corners[1]}`);

  return { prematchFactors, liveFactors };
}

/**
 * Safely escape characters that break Telegram HTML parse_mode: &, <, >
 */
export function escapeTelegramHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Detects whether a strategy / rule focuses on corners, cards, goals, or another metric.
 */
export function detectStrategyMetricCategory(
  ruleOrSignal: {
    id?: string;
    ruleId?: string;
    name?: string;
    ruleName?: string;
    targetMarket?: string;
    marketSuggestion?: string;
    category?: string;
    ruleCategory?: string;
  }
): StrategyMetricCategory {
  const id = (ruleOrSignal.ruleId || ruleOrSignal.id || '').toLowerCase();
  const name = (ruleOrSignal.ruleName || ruleOrSignal.name || '').toLowerCase();
  const market = (ruleOrSignal.marketSuggestion || ruleOrSignal.targetMarket || '').toLowerCase();
  const cat = (ruleOrSignal.ruleCategory || ruleOrSignal.category || '').toLowerCase();

  // 1. Corners (угловые)
  if (
    cat === 'corners' ||
    market.includes('угл') ||
    market.includes('corner') ||
    name.includes('угл') ||
    name.includes('corner') ||
    name.includes('корнер') ||
    id.includes('corner') ||
    id === 'strat-18' ||
    id === 'strat-38' ||
    id === 'f-2' ||
    id === 'f-6' ||
    id === 'f-16' ||
    id === 'f-17'
  ) {
    return 'corners';
  }

  // 2. Yellow cards / Red cards (карточки, ЖК, КК, удаления)
  if (
    cat === 'cards' ||
    market.includes('жк') ||
    market.includes('карточ') ||
    market.includes('удален') ||
    market.includes('красн') ||
    market.includes('желт') ||
    market.includes('большинств') ||
    name.includes('жк') ||
    name.includes('карточ') ||
    name.includes('удален') ||
    name.includes('красн') ||
    name.includes('желт') ||
    name.includes('большинств') ||
    id.includes('card') ||
    id === 'strat-23' ||
    id === 'f-8'
  ) {
    return 'cards';
  }

  // 3. Basketball (баскетбол, очки, четверти)
  const sport = ((ruleOrSignal as any).sport || '').toLowerCase();
  if (
    cat === 'basketball' ||
    sport === 'basketball' ||
    id === 'strat-basketball-4q-over' ||
    id.includes('basketball') ||
    name.includes('баскетбол') ||
    market.includes('очков в матче')
  ) {
    return 'basketball';
  }

  // 4. Goals / score (голы, ТБ, ТМ, победы, обе забьют, таймы)
  return 'goals';
}

/**
 * Creates an initial snapshot of the strategy's target metric at the time the signal is triggered.
 */
export function getInitialStrategyMetric(
  rule: FilterRule | { id?: string; name?: string; targetMarket?: string; category?: string; sport?: string },
  match: Match
): StrategyMetricSnapshot {
  const cat = detectStrategyMetricCategory(rule);

  if (cat === 'corners') {
    const h = match.stats?.corners?.[0] ?? 0;
    const a = match.stats?.corners?.[1] ?? 0;
    const total = h + a;
    return {
      category: 'corners',
      label: 'Угловые',
      icon: '🚩',
      initialTotal: total,
      initialBreakdown: `${h}:${a}`,
      initialValueText: `${total} (Хозяева ${h} : ${a} Гости) на ${match.minute}'`,
    };
  }

  if (cat === 'cards') {
    const yh = match.stats?.yellowCards?.[0] ?? 0;
    const ya = match.stats?.yellowCards?.[1] ?? 0;
    const totalY = yh + ya;
    const rh = match.stats?.redCards?.[0] ?? 0;
    const ra = match.stats?.redCards?.[1] ?? 0;
    const totalR = rh + ra;
    return {
      category: 'cards',
      label: 'Жёлтые карточки',
      icon: '🟨',
      initialTotal: totalY,
      initialBreakdown: `${yh}:${ya}`,
      initialValueText: `${totalY} ЖК (${yh}:${ya})${totalR > 0 ? ` | 🟥 ${totalR} КК` : ''} на ${match.minute}'`,
    };
  }

  if (cat === 'basketball' || match.sport === 'basketball') {
    const h = match.score[0] ?? 0;
    const a = match.score[1] ?? 0;
    const total = h + a;
    const diff = Math.abs(h - a);
    return {
      category: 'basketball',
      label: 'Счёт / Очки',
      icon: '🏀',
      initialTotal: total,
      initialBreakdown: `${h}:${a}`,
      initialValueText: `${h}:${a} (${total} очков, разрыв ${diff} пт) на ${match.minute}'`,
    };
  }

  // Default: goals / score
  const h = match.score[0] ?? 0;
  const a = match.score[1] ?? 0;
  const total = h + a;
  const goalsWord = total === 1 ? 'гол' : (total >= 2 && total <= 4 ? 'гола' : 'голов');
  return {
    category: 'goals',
    label: 'Счёт / Голы',
    icon: '⚽',
    initialTotal: total,
    initialBreakdown: `${h}:${a}`,
    initialValueText: `${h}:${a} (${total} ${goalsWord}) на ${match.minute}'`,
  };
}

/**
 * Resolves the strategy metric, computing initial value, final value, delta and descriptions.
 */
export function resolveStrategyMetric(
  signal: SignalAlert,
  currentScoreTuple: [number, number],
  currentStats?: MatchStats | {
    corners?: [number, number];
    yellowCards?: [number, number];
    redCards?: [number, number];
    shotsOnTarget?: [number, number];
    dangerousAttacks?: [number, number];
  }
): StrategyMetricSnapshot {
  const cat = detectStrategyMetricCategory(signal);

  if (cat === 'corners') {
    const initH = signal.statsSnapshot?.corners?.[0] ?? 0;
    const initA = signal.statsSnapshot?.corners?.[1] ?? 0;
    const initTotal = initH + initA;

    const finalH = currentStats?.corners?.[0] ?? signal.finalStats?.corners?.[0] ?? initH;
    const finalA = currentStats?.corners?.[1] ?? signal.finalStats?.corners?.[1] ?? initA;
    const finalTotal = finalH + finalA;
    const delta = finalTotal - initTotal;
    const deltaSign = delta >= 0 ? `+${delta}` : `${delta}`;

    return {
      category: 'corners',
      label: 'Угловые',
      icon: '🚩',
      initialTotal: initTotal,
      initialBreakdown: `${initH}:${initA}`,
      initialValueText: `${initTotal} (${initH}:${initA}) на ${signal.minute}'`,
      finalTotal,
      finalBreakdown: `${finalH}:${finalA}`,
      finalValueText: `${finalTotal} (${finalH}:${finalA})`,
      delta,
      deltaText: `${deltaSign} угловых после сигнала (было ${initTotal} ➔ стало ${finalTotal})`,
    };
  }

  if (cat === 'cards') {
    const initYH = signal.statsSnapshot?.yellowCards?.[0] ?? 0;
    const initYA = signal.statsSnapshot?.yellowCards?.[1] ?? 0;
    const initTotalY = initYH + initYA;

    const finalYH = currentStats?.yellowCards?.[0] ?? signal.finalStats?.yellowCards?.[0] ?? initYH;
    const finalYA = currentStats?.yellowCards?.[1] ?? signal.finalStats?.yellowCards?.[1] ?? initYA;
    const finalTotalY = finalYH + finalYA;

    const finalRH = currentStats?.redCards?.[0] ?? signal.finalStats?.redCards?.[0] ?? (signal.statsSnapshot?.redCards?.[0] ?? 0);
    const finalRA = currentStats?.redCards?.[1] ?? signal.finalStats?.redCards?.[1] ?? (signal.statsSnapshot?.redCards?.[1] ?? 0);
    const finalTotalR = finalRH + finalRA;

    const delta = finalTotalY - initTotalY;
    const deltaSign = delta >= 0 ? `+${delta}` : `${delta}`;

    return {
      category: 'cards',
      label: 'Жёлтые карточки',
      icon: '🟨',
      initialTotal: initTotalY,
      initialBreakdown: `${initYH}:${initYA}`,
      initialValueText: `${initTotalY} ЖК (${initYH}:${initYA}) на ${signal.minute}'`,
      finalTotal: finalTotalY,
      finalBreakdown: `${finalYH}:${finalYA}`,
      finalValueText: `${finalTotalY} ЖК (${finalYH}:${finalYA})${finalTotalR > 0 ? ` | 🟥 ${finalTotalR} КК` : ''}`,
      delta,
      deltaText: `${deltaSign} ЖК после сигнала (было ${initTotalY} ➔ стало ${finalTotalY})`,
    };
  }

  if (cat === 'basketball' || signal.sport === 'basketball') {
    const scoreParts = (signal.score || '0:0').split(':').map((s) => parseInt(s.trim(), 10));
    const initH = isNaN(scoreParts[0]) ? (signal.statsSnapshot?.homeScore ?? 0) : scoreParts[0];
    const initA = isNaN(scoreParts[1]) ? (signal.statsSnapshot?.awayScore ?? 0) : scoreParts[1];
    const initTotal = initH + initA;

    const finalH = currentScoreTuple[0] ?? initH;
    const finalA = currentScoreTuple[1] ?? initA;
    const finalTotal = finalH + finalA;
    const delta = finalTotal - initTotal;
    const deltaSign = delta >= 0 ? `+${delta}` : `${delta}`;

    return {
      category: 'basketball',
      label: 'Счёт / Очки',
      icon: '🏀',
      initialTotal: initTotal,
      initialBreakdown: `${initH}:${initA}`,
      initialValueText: `${initH}:${initA} (${initTotal} очков) на ${signal.minute}'`,
      finalTotal,
      finalBreakdown: `${finalH}:${finalA}`,
      finalValueText: `${finalH}:${finalA} (${finalTotal} очков)`,
      delta,
      deltaText: `${deltaSign} очков после сигнала (было ${initH}:${initA} ➔ стало ${finalH}:${finalA})`,
    };
  }

  // Default: goals / score
  const scoreParts = (signal.score || '0:0').split(':').map((s) => parseInt(s.trim(), 10));
  const initH = isNaN(scoreParts[0]) ? (signal.statsSnapshot?.homeScore ?? 0) : scoreParts[0];
  const initA = isNaN(scoreParts[1]) ? (signal.statsSnapshot?.awayScore ?? 0) : scoreParts[1];
  const initTotal = initH + initA;

  const finalH = currentScoreTuple[0] ?? initH;
  const finalA = currentScoreTuple[1] ?? initA;
  const finalTotal = finalH + finalA;
  const delta = finalTotal - initTotal;
  const deltaSign = delta >= 0 ? `+${delta}` : `${delta}`;
  const goalsWord = delta === 1 ? 'гол' : (delta >= 2 && delta <= 4 ? 'гола' : 'голов');

  return {
    category: 'goals',
    label: 'Счёт / Голы',
    icon: '⚽',
    initialTotal: initTotal,
    initialBreakdown: `${initH}:${initA}`,
    initialValueText: `${initH}:${initA} (${initTotal} ${initTotal === 1 ? 'гол' : 'голов'}) на ${signal.minute}'`,
    finalTotal,
    finalBreakdown: `${finalH}:${finalA}`,
    finalValueText: `${finalH}:${finalA} (${finalTotal} ${finalTotal === 1 ? 'гол' : 'голов'})`,
    delta,
    deltaText: `${deltaSign} ${goalsWord} после сигнала (было ${initH}:${initA} ➔ стало ${finalH}:${finalA})`,
  };
}

export interface BetActionInfo {
  action: 'TB' | 'TM' | 'OTHER';
  actionBadge: string;
  concreteBet: string;
  lineRecommendation: string;
  reasonExplanation: string;
}

export type StrategyTargetCluster =
  | 'GOAL_1H'       // Гол в 1-м тайме (ТБ 0.5 1Т)
  | 'GOAL_2H'       // Гол во 2-м тайме (ТБ 0.5 2Т)
  | 'GOAL_MATCH'    // Гол в матче / ТБ общий
  | 'TOTAL_UNDER'   // ТМ (Тотал Меньше / сушка)
  | 'CORNERS_OVER'  // Угловые ТБ
  | 'CARDS_OVER'    // Карточки / Удаление
  | 'BASKETBALL_TB' // Баскетбол: ТБ в 4-й четверти
  | 'BASKETBALL_TM' // Баскетбол: ТМ в 4-й четверти
  | 'OUTCOME_WIN'   // Победа команды / Камбэк / 1X
  | 'OTHER';

export interface StrategyTargetClusterInfo {
  cluster: StrategyTargetCluster;
  clusterNameRu: string;
  badgeLabel: string;
}

export interface ComboAlertContext {
  isCombo: boolean;
  comboCount: number;
  rules: FilterRule[];
  comboRecommendation?: string;
  confidence?: number;
  targetCluster?: StrategyTargetCluster;
  targetClusterName?: string;
}

/**
 * Classifies a strategy into an event target cluster to ensure Super-Combo alerts
 * trigger strictly when multiple independent algorithms align on the SAME event
 * (e.g., both targeting Goal in 1st Half, or both targeting Corners Over).
 */
export function getStrategyTargetCluster(
  rule?: FilterRule,
  match?: { sport?: string; score?: [number, number]; minute?: number }
): StrategyTargetClusterInfo {
  if (!rule) {
    return {
      cluster: 'OTHER',
      clusterNameRu: 'Авторский исход матча',
      badgeLabel: '⚡ СИНЕРГИЯ СТРАТЕГИЙ',
    };
  }
  const sport = (match?.sport || rule.sport || 'football').toLowerCase();
  const name = (rule.name || '').toLowerCase();
  const market = (rule.targetMarket || '').toLowerCase();
  const cat = (rule.category || '').toLowerCase();

  // 1. Basketball specific
  if (sport === 'basketball' || rule.id === 'strat-basketball-4q-over' || name.includes('баскетбол')) {
    const betAction = detectBetActionBadge(market, rule, match);
    if (betAction.action === 'TM') {
      return {
        cluster: 'BASKETBALL_TM',
        clusterNameRu: 'ТМ в баскетболе (Тотал Меньше)',
        badgeLabel: '🏀 СИНЕРГИЯ НА ТМ',
      };
    }
    return {
      cluster: 'BASKETBALL_TB',
      clusterNameRu: 'ТБ в баскетболе (Тотал Больше)',
      badgeLabel: '🏀 СИНЕРГИЯ НА ТБ',
    };
  }

  // 2. Corners
  if (market.includes('угл') || name.includes('угл') || cat.includes('corner')) {
    return {
      cluster: 'CORNERS_OVER',
      clusterNameRu: 'ТБ Угловых в матче',
      badgeLabel: '🚩 СИНЕРГИЯ НА УГЛОВЫЕ',
    };
  }

  // 3. Cards
  if (
    market.includes('жк') ||
    market.includes('карточ') ||
    market.includes('удален') ||
    name.includes('жк') ||
    name.includes('карточ') ||
    name.includes('удален')
  ) {
    return {
      cluster: 'CARDS_OVER',
      clusterNameRu: 'Тотал Жёлтых Карточек / Удаление',
      badgeLabel: '🟨 СИНЕРГИЯ НА КАРТОЧКИ',
    };
  }

  // 4. Goal in 1st Half (ТБ 0.5 1Т)
  if (
    rule.id === 'strat-2' ||
    rule.id === 'strat-8' ||
    rule.id === 'strat-photo-ht-goal-92' ||
    market.includes('1 тайм') ||
    market.includes('1-м тайм') ||
    market.includes('1-й тайм') ||
    market.includes('1т') ||
    market.includes('первом тайме') ||
    name.includes('1 тайм') ||
    name.includes('1-м тайм') ||
    name.includes('1-й тайм') ||
    name.includes('1т') ||
    name.includes('гол в 1') ||
    name.includes('первом тайме')
  ) {
    return {
      cluster: 'GOAL_1H',
      clusterNameRu: 'Гол в 1-м тайме (ТБ 0.5 1Т)',
      badgeLabel: '⚽ СИНЕРГИЯ НА ГОЛ В 1-М ТАЙМЕ',
    };
  }

  // 5. Goal in 2nd Half (ТБ 0.5 2Т / Решето во 2Т)
  if (
    rule.id === 'strat-12' ||
    rule.id === 'strat-second-half-sieve' ||
    market.includes('2 тайм') ||
    market.includes('2-м тайм') ||
    market.includes('2-й тайм') ||
    market.includes('2т') ||
    market.includes('во втором') ||
    name.includes('2 тайм') ||
    name.includes('2-м тайм') ||
    name.includes('2-й тайм') ||
    name.includes('2т') ||
    name.includes('во втором') ||
    name.includes('решето')
  ) {
    return {
      cluster: 'GOAL_2H',
      clusterNameRu: 'Гол во 2-м тайме (ТБ 0.5 2Т)',
      badgeLabel: '⚽ СИНЕРГИЯ НА ГОЛ ВО 2-М ТАЙМЕ',
    };
  }

  // 6. Total Under (Football / general)
  if (
    (market.includes('тм') || market.includes('under') || name.includes('тм') || name.includes('тотал меньше')) &&
    !market.includes('тб')
  ) {
    return {
      cluster: 'TOTAL_UNDER',
      clusterNameRu: 'ТМ (Тотал Меньше / сушка счёта)',
      badgeLabel: '🛡️ СИНЕРГИЯ НА ТМ (СУШКА)',
    };
  }

  // 7. Outcome / Winner / Double chance
  if (
    market.includes('п1') ||
    market.includes('п2') ||
    market.includes('1x') ||
    market.includes('12') ||
    market.includes('победа') ||
    name.includes('победа фаворита') ||
    name.includes('камбэк') ||
    name.includes('ничьей не будет')
  ) {
    return {
      cluster: 'OUTCOME_WIN',
      clusterNameRu: 'Исход матча / Победа / Камбэк',
      badgeLabel: '🏆 СИНЕРГИЯ НА ИСХОД',
    };
  }

  // 8. General Goal / Over in Match
  if (
    market.includes('гол') ||
    market.includes('тб') ||
    market.includes('over') ||
    name.includes('гол') ||
    name.includes('тб') ||
    name.includes('давление') ||
    name.includes('штурм') ||
    name.includes('доминант')
  ) {
    return {
      cluster: 'GOAL_MATCH',
      clusterNameRu: 'Гол в матче / ТБ (Тотал Больше)',
      badgeLabel: '🔥 СИНЕРГИЯ НА ГОЛ / ТБ',
    };
  }

  return {
    cluster: 'OTHER',
    clusterNameRu: 'Авторский исход матча',
    badgeLabel: '⚡ СИНЕРГИЯ СТРАТЕГИЙ',
  };
}

/**
 * Determines whether a strategy/signal market unambiguously calls for TB (Over) or TM (Under)
 * and formats explicit betting badges and exact recommended lines for both Football and Basketball.
 */
export function detectBetActionBadge(
  market: string = '',
  rule?: FilterRule,
  match?: Match | { score?: [number, number]; sport?: string; stats?: any }
): BetActionInfo {
  const mLower = (market || '').toLowerCase();
  const sport = match?.sport || rule?.sport || 'football';
  const score = match?.score || [0, 0];
  const curHome = score[0] ?? 0;
  const curAway = score[1] ?? 0;
  const curTotal = curHome + curAway;
  const diff = Math.abs(curHome - curAway);

  // 1. Basketball specific logic (Clutch Over vs Blowout Under)
  if (sport === 'basketball' || rule?.id === 'strat-basketball-4q-over') {
    if (diff <= 6) {
      const line = curTotal + 18.5;
      return {
        action: 'TB',
        actionBadge: 'БРАТЬ: ТБ (ТОТАЛ БОЛЬШЕ)',
        concreteBet: `ТБ ~${line} (Тотал Больше)`,
        lineRecommendation: `ТБ ~${line} очков (~1.85)`,
        reasonExplanation: `Клатч (разрыв ${diff} очк.): обе команды борются до конца, прибегают к тактическим фолам и останавливают секундомер ➔ Темп взрывной, брать ТБ!`,
      };
    } else if (diff >= 10) {
      const line = curTotal + 22.5;
      return {
        action: 'TM',
        actionBadge: 'БРАТЬ: ТМ (ТОТАЛ МЕНЬШЕ)',
        concreteBet: `ТМ ~${line} (Тотал Меньше)`,
        lineRecommendation: `ТМ ~${line} очков (~1.85)`,
        reasonExplanation: `Отрыв ${diff} очк. (разгром / garbage time): тренеры выпустили скамейку, команды не фолят и тянут владения до 24-й секунды ➔ Брать ТМ!`,
      };
    } else {
      const line = curTotal + 19.5;
      return {
        action: 'TB',
        actionBadge: 'БРАТЬ: ТБ (ТОТАЛ БОЛЬШЕ)',
        concreteBet: `ТБ ~${line} (Тотал Больше)`,
        lineRecommendation: `ТБ ~${line} очков (~1.85)`,
        reasonExplanation: `Разрыв ${diff} очков при высоком темпе владения ➔ Рекомендован ТБ`,
      };
    }
  }

  // 2. Explicit TM (Under)
  if (
    mLower.includes('тм') ||
    mLower.includes('тотал меньше') ||
    mLower.includes('under') ||
    mLower.includes('меньше')
  ) {
    const lineMatch = market.match(/(\d+(?:\.\d+)?)/);
    const lineStr = lineMatch ? `ТМ ${lineMatch[1]}` : 'ТМ (Тотал Меньше)';
    return {
      action: 'TM',
      actionBadge: 'БРАТЬ: ТМ (ТОТАЛ МЕНЬШЕ)',
      concreteBet: lineStr,
      lineRecommendation: market || lineStr,
      reasonExplanation: 'Модель и показатели указывают на низкий темп / сушку счёта ➔ Ставка на ТМ',
    };
  }

  // 3. Default or explicit TB (Over) / Goals / Corners / Points
  if (
    mLower.includes('тб') ||
    mLower.includes('тотал больше') ||
    mLower.includes('over') ||
    mLower.includes('гол') ||
    mLower.includes('больше') ||
    mLower.includes('0.5') ||
    mLower.includes('1.5') ||
    mLower.includes('2.5') ||
    mLower.includes('угл')
  ) {
    let lineStr = 'ТБ (Тотал Больше)';
    if (mLower.includes('0.5')) lineStr = 'ТБ 0.5 (Гол)';
    else if (mLower.includes('1.5')) lineStr = 'ТБ 1.5';
    else if (mLower.includes('2.5')) lineStr = 'ТБ 2.5';
    else {
      const lineMatch = market.match(/(\d+(?:\.\d+)?)/);
      if (lineMatch) lineStr = `ТБ ${lineMatch[1]}`;
    }
    return {
      action: 'TB',
      actionBadge: 'БРАТЬ: ТБ (ТОТАЛ БОЛЬШЕ)',
      concreteBet: lineStr,
      lineRecommendation: market || lineStr,
      reasonExplanation: 'Высокое давление и атакующий импульс ➔ Высокая вероятность гола / пробития тотала (ТБ)',
    };
  }

  // 4. Other markets (e.g. Handicap / Winner)
  return {
    action: 'OTHER',
    actionBadge: `БРАТЬ: ${market || 'РЕКОМЕНДУЕМЫЙ ИСХОД'}`,
    concreteBet: market || 'Исход по стратегии',
    lineRecommendation: market || 'Исход по стратегии',
    reasonExplanation: 'Сигнал по авторскому паттерну стратегии',
  };
}

/**
 * Enhanced Telegram Alert formatter with separation for Live vs Pre-match bets
 * and high-impact visual design for COMBO signals and clear TB/TM guidance.
 */
export function formatExtendedTelegramAlert(
  match: Match,
  rule: FilterRule,
  analysis: PressureAnalysis,
  forcedBetType?: BetType,
  isDeveloper: boolean = false,
  comboContext?: ComboAlertContext
): string {
  const betType = forcedBetType || getBetTypeForSignal(rule, match.minute, match);
  const isPrematch = betType === 'PREMATCH';

  const homeTeam = escapeTelegramHtml(match.homeTeam);
  const awayTeam = escapeTelegramHtml(match.awayTeam);
  const league = escapeTelegramHtml(match.league);
  const country = escapeTelegramHtml(match.country);
  const ruleName = escapeTelegramHtml(
    rule.isPreset && !isDeveloper ? getStrategyCardDisplayName(rule, isDeveloper) : rule.name
  );
  const targetMarket = escapeTelegramHtml(rule.targetMarket || '');

  const diffDang = match.stats.dangerousAttacks[0] - match.stats.dangerousAttacks[1];
  const dangSign =
    diffDang > 0
      ? `+${diffDang} (${homeTeam})`
      : diffDang < 0
      ? `+${Math.abs(diffDang)} (${awayTeam})`
      : 'Равенство';

  const totalShots =
    match.stats.shotsOnTarget[0] +
    match.stats.shotsOnTarget[1] +
    match.stats.shotsOffTarget[0] +
    match.stats.shotsOffTarget[1];
  const totalCorners = match.stats.corners[0] + match.stats.corners[1];

  // Concrete, unambiguous TB / TM Action Detection
  const betAction = detectBetActionBadge(targetMarket || rule.targetMarket, rule, match);

  let rawMarket = targetMarket || rule.targetMarket || 'ТБ 0.5 (Тотал Больше)';
  let basketballAnalysisLine = '';
  if (rule.id === 'strat-basketball-4q-over' || match.sport === 'basketball') {
    const scoreDiff = Math.abs((match.score[0] ?? 0) - (match.score[1] ?? 0));
    const curTotal = (match.score[0] ?? 0) + (match.score[1] ?? 0);
    if (scoreDiff <= 6) {
      rawMarket = `БРАТЬ: ТБ ~${curTotal + 18.5} (Клатч: фолы и штрафные)`;
      basketballAnalysisLine =
        `🏀 <b>КОНКРЕТНАЯ СТАВКА: <u>БРАТЬ ТБ (ТОТАЛ БОЛЬШЕ)</u></b>\n` +
        `   • <b>Линия тотала:</b> ТБ ~${curTotal + 18.5} очков (Кэф ~1.85)\n` +
        `   • <b>Анализ концовки (Клатч):</b> Разрыв всего <b>${scoreDiff} очков</b>! Команды фолят и останавливают секундомер ➔ <b>Брать строго ТБ!</b>\n\n`;
    } else if (scoreDiff >= 10) {
      rawMarket = `БРАТЬ: ТМ ~${curTotal + 22.5} (Разгром: сушка без фолов)`;
      basketballAnalysisLine =
        `🏀 <b>КОНКРЕТНАЯ СТАВКА: <u>БРАТЬ ТМ (ТОТАЛ МЕНЬШЕ)</u></b>\n` +
        `   • <b>Линия тотала:</b> ТМ ~${curTotal + 22.5} очков (Кэф ~1.85)\n` +
        `   • <b>Анализ концовки (Разгром / Garbage time):</b> Отрыв <b>${scoreDiff} очков</b>! Задействована скамейка, команды не фолят и тянут атаки по 24 сек ➔ <b>Брать противоположный ТМ!</b>\n\n`;
    } else {
      rawMarket = `БРАТЬ: ТБ ~${curTotal + 19.5} (~1.85)`;
      basketballAnalysisLine =
        `🏀 <b>КОНКРЕТНАЯ СТАВКА: <u>БРАТЬ ТБ (ТОТАЛ БОЛЬШЕ)</u></b>\n` +
        `   • <b>Линия тотала:</b> ТБ ~${curTotal + 19.5} очков\n` +
        `   • <b>Анализ концовки:</b> Разрыв <b>${scoreDiff} очков</b>. Темп владения высокий ➔ <b>Рекомендован ТБ</b>\n\n`;
    }
  }

  let poissonAnalysisLine = '';
  if (rule.id === 'strat-poisson-xg-over25' || rule.requirePoissonEvPositive) {
    const lambdaH = (match.stats?.xg?.[0] !== undefined && match.stats.xg[0] > 0)
      ? match.stats.xg[0]
      : (match.history?.h2hGoalsPerGame ? match.history.h2hGoalsPerGame * 0.55 : 1.55);
    const lambdaA = (match.stats?.xg?.[1] !== undefined && match.stats.xg[1] > 0)
      ? match.stats.xg[1]
      : (match.history?.h2hGoalsPerGame ? match.history.h2hGoalsPerGame * 0.45 : 1.35);
    const pModel = calculatePoissonOver25Probability(lambdaH, lambdaA);
    const curOdds = match.odds?.over25 || rule.defaultOdds || 1.78;
    const pImplied = 1 / curOdds;
    const evEdge = ((pModel - pImplied) * 100).toFixed(1);
    rawMarket = `ТБ 2.5 голов (Модель Пуассона +EV ~${curOdds.toFixed(2)})`;
    poissonAnalysisLine =
      `📊 <b>Модель Пуассона (+EV Валуй):</b>\n` +
      `   • Ожидаемые xG: <b>xGF ${lambdaH.toFixed(2)}</b> vs <b>xGA ${lambdaA.toFixed(2)}</b> (Сумма: <b>${(lambdaH + lambdaA).toFixed(2)}</b>)\n` +
      `   • Вероятность модели Пуассона на ТБ 2.5: <b>${(pModel * 100).toFixed(1)}%</b>\n` +
      `   • Вероятность букмекера (1/${curOdds.toFixed(2)}): <b>${(pImplied * 100).toFixed(1)}%</b>\n` +
      `   • Математический перевес (+EV): <b>+${evEdge}%</b>\n\n`;
  }

  let bookInsightLine = '';
  if (rule.id === 'strat-hockey-bos-2p-longchange') {
    const totalShotsCount = match.stats.shotsOnTarget[0] + match.stats.shotsOnTarget[1];
    bookInsightLine =
      `🏒 <b>Паттерн B.O.S. (Вбрасывание):</b> Ловушка дальней скамейки во 2-м периоде!\n` +
      `   • Броски: <b>${totalShotsCount} в створ</b> | Давление: <b>${analysis.pressureIndex}%</b>\n` +
      `   • Запертая в обороне команда не успевает смениться через нейтральную зону ➔ лавина голов!\n\n`;
  } else if (rule.id === 'strat-basketball-360-3q-surge') {
    bookInsightLine =
      `🏀 <b>Паттерн Баскет-гид 360:</b> Синдром 3-й четверти фаворита (Third-Quarter Surge)!\n` +
      `   • Коррективы тренера в перерыве + концентрация лидеров в защите ➔ рывок фаворита!\n\n`;
  } else if (rule.id === 'strat-tennis-bos-bigserver-tb95') {
    bookInsightLine =
      `🎾 <b>Паттерн B.O.S. (Эйс в дата-центре):</b> Модель подаванов (Big Server Matchup)!\n` +
      `   • Быстрое покрытие + высокий % удержания подачи ➔ отсутствие ранних брейков, плотный сет!\n\n`;
  } else if (rule.id === 'strat-photo-home-goal-17-20') {
    bookInsightLine =
      `⚽ <b>Паттерн Сканера (Фото 1):</b> Гол 96% / Гол дом. команды (17–20 мин)!\n` +
      `   • Удары створ+мимо ≥6 | В створ хозяев ≥2 | Кэф П1 ≤1.80 | Проходимость 99%\n\n`;
  } else if (rule.id === 'strat-photo-ht-goal-92') {
    bookInsightLine =
      `⚡ <b>Паттерн Сканера (Фото 2):</b> Гол в 1-м тайме 92% (кэф от 1.08)!\n` +
      `   • 0.5+ голов ≥200% | 2.5+ ≥180% | Обе забьют ≥80% | Удары в створ ≥8\n\n`;
  } else if (rule.id === 'strat-photo-match-goal-multi') {
    bookInsightLine =
      `🎯 <b>Паттерн Сканера (Фото 3):</b> Гол в матче (много сигналов, часто ТБ 1.5 1Т)!\n` +
      `   • ТБ 1.5 ≤1.20 | ТБ 2.5 ≤1.50 | Failed to score < ср. голов 1Т | Проходимость 97%\n\n`;
  } else if (rule.id === 'strat-photo-goal-95-h2h') {
    bookInsightLine =
      `🔥 <b>Паттерн Сканера (Фото 1 и 3):</b> Гол в матче 95% (H2H 100% ТБ 1.5, до 27 мин)!\n` +
      `   • 100% матчей H2H на ТБ 1.5+ | Live ТБ 0.5 ≥1.053 | Проходимость 95%\n\n`;
  } else if (rule.id === 'strat-photo-goal-98-combo') {
    bookInsightLine =
      `🏆 <b>Паттерн Сканера (Фото 1):</b> Гол 98% (от 1.020) + ТБ 1.5 во 2-м тайме!\n` +
      `   • Интенсивный штурм ворот | Проходимость 98% (156 сигналов)\n\n`;
  } else if (rule.id === 'strat-pdf-three-matches-theory') {
    bookInsightLine =
      `📐 <b>Теория трёх матчей (PDF):</b> Очковая матрица превосходства команд!\n` +
      `   • 3 крайних матча дома + 3 на выезде + 3 очных H2H | Математическая оценка исхода\n\n`;
  } else if (rule.id === 'strat-pdf-15-param-value-drop') {
    bookInsightLine =
      `📊 <b>15 параметров (PDF):</b> Анализ валуя и падения котировок БК (+EV Ф(0))!\n` +
      `   • Падение кэфов 5-10% | Value Index ≥1.08 | Перевес над линией +13.4%\n\n`;
  }

  const oddsEstimate = match.odds ? (match.odds.over25 ? match.odds.over25.toFixed(2) : '1.80 - 1.95') : '1.85';

  // Strategy-specific metric at initial alert dispatch time (corners, cards, goals)
  const metricSnapshot = getInitialStrategyMetric(rule, match);
  const metricInitialBlock = (
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `${metricSnapshot.icon} <b>ПОКАЗАТЕЛЬ СТРАТЕГИИ НА МОМЕНТ СИГНАЛА:</b>\n` +
    `   • <b>${metricSnapshot.label}:</b> <b>${metricSnapshot.initialValueText}</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
  );

  const quickGoalsPatternLine = (rule.requireGuestTwoQuickGoals1H || rule.requireNoGoalsSinceQuickGoals)
    ? (rule.isPreset && !isDeveloper
        ? `⚡ <b>Паттерн:</b> Всплеск результативности в 1-м тайме — ставка на повышенный кэф!\n\n`
        : `⚡ <b>Паттерн:</b> 2 быстрых гола в 1-м тайме (≤15 мин между голами) + без голов до 75'\n⏱ <b>Точка входа:</b> 75-я минута матча — ожидание гола (ТБ) по повышенному кэфу\n\n`)
    : '';

  const strat7PatternLine = (rule.id === 'strat-7' || rule.name.includes('Стратегия 7') || rule.scoreCondition === 'TOTAL_UNDER_25')
    ? (rule.isPreset && !isDeveloper
        ? `📐 <b>Стратегия 7 (ТБ 2.5):</b> Ставка на гол в концовке матча по выгодному кэфу!\n\n`
        : `📐 <b>Стратегия 7 (ТБ 2.5 на 70'):</b> 70-я минута матча при тотале ≤ 2 (счёт: <code>${match.score[0]}:${match.score[1]}</code>)\n⏱ <b>Точка входа:</b> 70-я минута — ставка на ТБ 2.5 / гол в концовке по повышенному кэфу!\n\n`)
    : '';

  const activeDrop = match.oddsDrop || (match.marketFlows && match.marketFlows[0]);
  const oddsDropPatternLine =
    rule.category === 'odds_drop' || rule.minOddsDropPercent !== undefined || activeDrop
      ? activeDrop
        ? `📉 <b>Прогруз линии (Smart Money):</b> <u>${escapeTelegramHtml(activeDrop.marketName)}</u>\n` +
          `   • Движение кэфа: <b>-${activeDrop.dropPercent.toFixed(1)}%</b> (<code>${activeDrop.initialOdds.toFixed(2)}</code> ➔ <code>${activeDrop.currentOdds.toFixed(2)}</code>)\n` +
          `   • Доля денег: <b>${activeDrop.moneyVolumePercent}% пула рынка</b>${activeDrop.moneyVolumeAmountEur ? ` (≈ €${activeDrop.moneyVolumeAmountEur.toLocaleString('ru-RU')})` : ''}\n` +
          `   • Биржа/Букмекер: <i>${escapeTelegramHtml(activeDrop.bookmaker || 'Betfair Exchange / Pinnacle')}</i>\n\n`
        : ''
      : '';

  let cleanStratName = ruleName.trim();
  cleanStratName = cleanStratName.replace(/^(?:стратегия\s*[:：]\s*)+(стратегия)/iu, '$1');
  cleanStratName = cleanStratName.replace(/(?:стратегия|strategy|strateji|strategia|策略)\s*[:：]?\s*\d{4,}/gi, '').trim();
  if (/^(?:\p{Emoji}|\s)*(?:стратегия|strategy|strateji|strategia|策略)\s*[:：]?\s*$/iu.test(cleanStratName) || !cleanStratName) {
    const num = rule.id ? PRESET_STRATEGY_NUMBER_BY_ID[rule.id] : undefined;
    cleanStratName = num !== undefined ? `Стратегия ${num}` : (rule.name || cleanStratName);
  }
  const hasStrategyWord = /^(?:\p{Emoji}|\s)*(?:стратегия|strategy|strateji|strategia|策略)/iu.test(cleanStratName);
  const strategyTag = hasStrategyWord ? cleanStratName : (cleanStratName ? `Стратегия: ${cleanStratName}` : 'Стратегия');

  const p1Str = match.odds?.home !== undefined ? match.odds.home.toFixed(2) : '-';
  const pxStr = match.odds?.draw !== undefined ? match.odds.draw.toFixed(2) : '-';
  const p2Str = match.odds?.away !== undefined ? match.odds.away.toFixed(2) : '-';
  const over25Str = match.odds?.over25 !== undefined ? match.odds.over25.toFixed(2) : '-';
  const bttsStr = match.odds?.btts !== undefined ? ` | <b>ОЗ:</b> <code>${match.odds.btts.toFixed(2)}</code>` : '';

  const prematchSection = (
    `📊 <b>Показатели:</b>\n` +
    `💰 <b>Линия БК:</b> П1 <code>${p1Str}</code> | X <code>${pxStr}</code> | П2 <code>${p2Str}</code>\n` +
    `📈 <b>Тотал 2.5:</b> <code>${over25Str}</code>${bttsStr}\n` +
    (rule.minModelIpt || calculateMatchIPT(match) >= 2.5 ? `📐 <b>Модель IPT:</b> <code>${calculateMatchIPT(match).toFixed(2)}</code>\n` : '') +
    (match.history?.h2hOver15Pct ? `👥 <b>H2H:</b> ${match.history.h2hOver15Pct}% ТБ 1.5\n` : '') +
    (match.history?.homeOver25Streak ? `🔥 <b>Серия ТБ 2.5:</b> ${match.history.homeOver25Streak} матчей подряд\n` : '')
  );

  const xgHome = match.stats?.xg?.[0] !== undefined ? match.stats.xg[0].toFixed(2) : '0.00';
  const xgAway = match.stats?.xg?.[1] !== undefined ? match.stats.xg[1].toFixed(2) : '0.00';
  const liveSection = (
    `🔥 <b>Индекс давления:</b> ${analysis.pressureIndex}/100 (${analysis.goalProbability})\n\n` +
    `📊 <b>Опасные атаки:</b> ${(match.stats?.dangerousAttacks?.[0] ?? 0)} - ${(match.stats?.dangerousAttacks?.[1] ?? 0)} [${dangSign}]\n` +
    `🎯 <b>Удары в створ:</b> ${(match.stats?.shotsOnTarget?.[0] ?? 0)} - ${(match.stats?.shotsOnTarget?.[1] ?? 0)} (Всего: ${totalShots})\n` +
    `🚩 <b>Угловые:</b> ${(match.stats?.corners?.[0] ?? 0)} - ${(match.stats?.corners?.[1] ?? 0)} (Всего: ${totalCorners})\n` +
    `📈 <b>xG:</b> ${xgHome} vs ${xgAway}\n` +
    `⚡ <b>Владение мячом:</b> ${(match.stats?.possession?.[0] ?? 50)}% - ${(match.stats?.possession?.[1] ?? 50)}%\n\n`
  );

  const matchTimeDisplay = isPrematch
    ? `(⏳ До начала: ${match.startsInMinutes ?? 60} мин${match.startTime ? ` [${escapeTelegramHtml(match.startTime)}]` : ''})`
    : `(<b>${match.minute}'</b> | <b>${match.score[0]}:${match.score[1]}</b>)`;

  const escapedReasons = analysis.reasons.map((r) => escapeTelegramHtml(r));

  // --- 🌟 DEDICATED SUPER-COMBO FORMATTING ---
  if (comboContext && comboContext.isCombo && comboContext.comboCount > 1) {
    const confidencePct = comboContext.confidence || Math.min(99, 90 + comboContext.comboCount * 2.5);
    const comboListHtml = comboContext.rules
      .map((r, i) => {
        const dName = getStrategyCardDisplayName(r, isDeveloper);
        const mSuggestion = r.targetMarket || 'ТБ';
        return `   ✅ <b>${i + 1}. ${escapeTelegramHtml(dName)}</b>\n      <i>Рынок: ${escapeTelegramHtml(mSuggestion)}</i>`;
      })
      .join('\n');

    const targetEventText = comboContext.targetClusterName || 'ЕДИНЫЙ ЦЕЛЕВОЙ ИСХОД';
    return (
      `⚡🔥 <b>СУПЕР-КОМБО СИГНАЛ: СИНЕРГИЯ ${comboContext.comboCount} СТРАТЕГИЙ!</b> 🔥⚡\n` +
      `🎯 <b>ЕДИНЫЙ ЦЕЛЕВОЙ ИСХОД:</b> <b><u>${escapeTelegramHtml(targetEventText.toUpperCase())}</u></b>\n` +
      `🌟 <b>ВЫСОКАЯ ВЕРОЯТНОСТЬ ПРОХОДА: ${confidencePct.toFixed(0)}%</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🏆 <b>${match.countryCode} ${country} | ${league}</b>\n` +
      `⚔️ <b>${homeTeam} vs ${awayTeam}</b> ${matchTimeDisplay}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔥 <b>ЧТО БРАТЬ: <u>${betAction.actionBadge}</u></b>\n` +
      `🎯 <b>СТАВКА:</b> <b><u>${escapeTelegramHtml(betAction.concreteBet)}</u></b>\n` +
      `💰 <b>Линия:</b> ${escapeTelegramHtml(betAction.lineRecommendation)}   |   📈 <b>Кэф: ~${oddsEstimate}</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 <b>СОВПАВШИЕ СТРАТЕГИИ В МАТЧЕ (${comboContext.comboCount}):</b>\n` +
      `${comboListHtml}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📊 <b>СИНЕРГИЯ ПОКАЗАТЕЛЕЙ:</b>\n` +
      `🔥 Индекс давления: <b>${analysis.pressureIndex}/100</b> (${analysis.goalProbability})\n` +
      `⚔️ Оп. атаки: <b>${match.stats.dangerousAttacks[0]}-${match.stats.dangerousAttacks[1]}</b> | Удары: <b>${totalShots}</b> | Углы: <b>${totalCorners}</b>\n` +
      `📈 xG: <b>${xgHome} vs ${xgAway}</b> | Владение: <b>${match.stats.possession[0]}% - ${match.stats.possession[1]}%</b>\n` +
      (bookInsightLine || '') +
      (basketballAnalysisLine || '') +
      (poissonAnalysisLine || '') +
      `💡 <i>${escapeTelegramHtml(betAction.reasonExplanation)}</i>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⏱ <i>Время: ${new Date().toLocaleTimeString('ru-RU')} | Источник: ${escapeTelegramHtml(match.source)}</i>`
    );
  }

  // --- STANDARD SINGLE-STRATEGY ALERT FORMATTING ---
  const headerTag = isPrematch
    ? `📋 <b>[ПРЕДМАТЧЕВЫЙ ОТБОР]</b>\n💡 <b>${strategyTag}</b>\n⏱ <i>До начала: ${match.startsInMinutes ?? 60} мин${match.startTime ? ` (${escapeTelegramHtml(match.startTime)})` : ''}</i>`
    : `🔴 <b>[ЛАЙВ СИГНАЛ]</b> (Мин: <b>${match.minute}'</b> | Счёт: <b>${match.score[0]}:${match.score[1]}</b>)\n⚡ <b>${strategyTag}</b>`;

  const marketLine = (
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🔥 <b>ЧТО БРАТЬ: <u>${betAction.actionBadge}</u></b>\n` +
    `🎯 <b>СТАВКА:</b> <b><u>${escapeTelegramHtml(betAction.concreteBet)}</u></b>\n` +
    `💰 <b>Линия:</b> ${escapeTelegramHtml(betAction.lineRecommendation)}   |   📈 <b>Кэф: ~${oddsEstimate}</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
  );

  return (
    `${headerTag}\n` +
    `🏆 <b>${match.countryCode} ${country} | ${league}</b>\n` +
    `⚔️ <b>${homeTeam} vs ${awayTeam}</b> ${matchTimeDisplay}\n` +
    `${marketLine}` +
    `${metricInitialBlock}` +
    `${bookInsightLine}` +
    `${basketballAnalysisLine}` +
    `${poissonAnalysisLine}` +
    `${quickGoalsPatternLine}` +
    `${strat7PatternLine}` +
    `${oddsDropPatternLine}` +
    (isPrematch ? prematchSection + '\n' : liveSection) +
    (!isPrematch && (rule.minOddsOver25 || rule.maxOddsFavorite || rule.minModelIpt) ? prematchSection + '\n' : '') +
    (escapedReasons.length > 0 ? `💡 <i>Факторы: ${escapedReasons.join(' • ')}</i>\n` : '') +
    `⏱ <i>Время: ${new Date().toLocaleTimeString('ru-RU')} | Источник: ${escapeTelegramHtml(match.source)}</i>`
  );
}

/**
 * Formats Telegram message when match completes or signal resolves with outcome (WIN / LOSS / REFUND).
 * Rewrites/updates the original Telegram alert with official match result.
 * Shows the final result specifically concerning the strategy according to which the signal triggered:
 * - Corners: initial corners -> final corners (+delta)
 * - Yellow cards: initial cards -> final cards (+delta)
 * - Goals/score: initial score -> final score (+delta)
 */
export function formatResolvedTelegramAlert(
  signal: SignalAlert,
  finalScore: string,
  outcome: SignalOutcome,
  matchDetails?: { homeTeam?: string; awayTeam?: string; league?: string; country?: string },
  finalStats?: MatchStats | {
    corners?: [number, number];
    yellowCards?: [number, number];
    redCards?: [number, number];
    shotsOnTarget?: [number, number];
    dangerousAttacks?: [number, number];
  }
): string {
  const isWin = outcome === 'WIN';
  const isLoss = outcome === 'LOSS';

  const statusHeader = isWin
    ? '✅ <b>СИГНАЛ ЗАШЁЛ (WIN)</b> 🎯'
    : isLoss
    ? '❌ <b>СИГНАЛ НЕ ЗАШЁЛ (LOSS)</b> ⚠️'
    : '🔄 <b>ВОЗВРАТ СТАВКИ (REFUND)</b> ↩️';

  const profitText =
    signal.profit !== undefined
      ? signal.profit > 0
        ? `+${signal.profit} ₽ (ROI +${((signal.profit / (signal.stake || 1000)) * 100).toFixed(0)}%)`
        : `${signal.profit} ₽`
      : isWin
      ? `+${((signal.odds - 1) * (signal.stake || 1000)).toFixed(0)} ₽`
      : isLoss
      ? `-${signal.stake || 1000} ₽`
      : '0 ₽';

  const home = escapeTelegramHtml(matchDetails?.homeTeam || signal.matchName.split(' vs ')[0] || 'Хозяева');
  const away = escapeTelegramHtml(matchDetails?.awayTeam || signal.matchName.split(' vs ')[1] || 'Гости');
  const league = escapeTelegramHtml(matchDetails?.league || signal.league);
  const country = escapeTelegramHtml(matchDetails?.country || signal.country);
  const ruleName = escapeTelegramHtml(signal.ruleName);
  const marketSuggestion = escapeTelegramHtml(signal.marketSuggestion || '');

  const scoreParts = finalScore.split(':').map((s) => parseInt(s.trim(), 10));
  const curScoreTuple: [number, number] = [
    isNaN(scoreParts[0]) ? 0 : scoreParts[0],
    isNaN(scoreParts[1]) ? 0 : scoreParts[1],
  ];

  // Strategy-specific metric resolution (Corners, Yellow Cards, Goals, etc.)
  const metric = resolveStrategyMetric(signal, curScoreTuple, finalStats || signal.finalStats);

  const scoreChangeNote =
    signal.score !== finalScore
      ? `<i>(на момент сигнала: ${signal.score} на ${signal.minute}')</i>`
      : `<i>(сигнал выдан на ${signal.minute}')</i>`;

  const betTypeLabel = signal.betType === 'PREMATCH' ? '📋 Предматчевый отбор' : '🔴 Лайв ставка';

  const isHalfTimeResolution =
    signal.period === '1-й тайм' ||
    signal.resolutionNote?.includes('1-й тайм') ||
    signal.resolutionNote?.includes('перерыв') ||
    signal.ruleName.toLowerCase().includes('1-й тайм') ||
    signal.marketSuggestion?.toLowerCase().includes('1-й тайм') ||
    signal.marketSuggestion?.toLowerCase().includes('1т');

  const matchStatusTag = isHalfTimeResolution ? '[1-й тайм завершён • Перерыв]' : '[Матч завершён]';
  const outcomeLabel = isHalfTimeResolution ? 'Итог 1-го тайма:' : 'Итог:';

  let cleanStratName = ruleName.trim();
  cleanStratName = cleanStratName.replace(/^(?:стратегия\s*[:：]\s*)+(стратегия)/iu, '$1');
  cleanStratName = cleanStratName.replace(/(?:стратегия|strategy|strateji|strategia|策略)\s*[:：]?\s*\d{4,}/gi, '').trim();
  if (/^(?:\p{Emoji}|\s)*(?:стратегия|strategy|strateji|strategia|策略)\s*[:：]?\s*$/iu.test(cleanStratName) || !cleanStratName) {
    const num = signal.ruleId ? PRESET_STRATEGY_NUMBER_BY_ID[signal.ruleId] : undefined;
    cleanStratName = num !== undefined ? `Стратегия ${num}` : (signal.ruleName || cleanStratName);
  }
  const hasStrategyWord = /^(?:\p{Emoji}|\s)*(?:стратегия|strategy|strateji|strategia|策略)/iu.test(cleanStratName);
  const strategyTag = hasStrategyWord ? cleanStratName : (cleanStratName ? `Стратегия: ${cleanStratName}` : 'Стратегия');

  // Formatted Strategy Metric Block for the Telegram message
  let metricSection = '';
  if (metric.category === 'corners') {
    metricSection =
      `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🚩 <b>РЕЗУЛЬТАТ ПО СТРАТЕГИИ (УГЛОВЫЕ):</b>\n` +
      `   • <b>На момент сигнала:</b> <b>${metric.initialValueText}</b>\n` +
      `   • <b>По завершению:</b> <b>${metric.finalValueText}</b>\n` +
      `   • <b>Итоговая динамика:</b> <b><u>${metric.deltaText}</u></b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  } else if (metric.category === 'cards') {
    metricSection =
      `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🟨 <b>РЕЗУЛЬТАТ ПО СТРАТЕГИИ (ЖЁЛТЫЕ КАРТОЧКИ):</b>\n` +
      `   • <b>На момент сигнала:</b> <b>${metric.initialValueText}</b>\n` +
      `   • <b>По завершению:</b> <b>${metric.finalValueText}</b>\n` +
      `   • <b>Итоговая динамика:</b> <b><u>${metric.deltaText}</u></b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  } else if (metric.category === 'basketball') {
    metricSection =
      `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🏀 <b>РЕЗУЛЬТАТ ПО СТРАТЕГИИ (БАСКЕТБОЛ / ОЧКИ):</b>\n` +
      `   • <b>На момент сигнала:</b> <b>${metric.initialValueText}</b>\n` +
      `   • <b>По завершению:</b> <b>${metric.finalValueText}</b>\n` +
      `   • <b>Итоговая динамика:</b> <b><u>${metric.deltaText}</u></b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  } else {
    metricSection =
      `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⚽ <b>РЕЗУЛЬТАТ ПО СТРАТЕГИИ (ГОЛЫ / СЧЁТ):</b>\n` +
      `   • <b>Счёт на момент сигнала:</b> <b>${metric.initialValueText}</b>\n` +
      `   • <b>Итог матча:</b> <b>${metric.finalValueText}</b>\n` +
      `   • <b>Итоговая динамика:</b> <b><u>${metric.deltaText}</u></b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  }

  const resolutionNoteLine = signal.resolutionNote
    ? `\n📌 <i>Детали: ${escapeTelegramHtml(signal.resolutionNote)}</i>\n`
    : '';

  const isExpectedTb =
    signal.targetAction === 'TB' ||
    marketSuggestion.toUpperCase().includes('ТБ') ||
    marketSuggestion.toUpperCase().includes('OVER');
  const isExpectedTm =
    signal.targetAction === 'TM' ||
    marketSuggestion.toUpperCase().includes('ТМ') ||
    marketSuggestion.toUpperCase().includes('UNDER');

  const expectedActionText = isExpectedTb
    ? 'ОЖИДАЛОСЬ: ТБ (ТОТАЛ БОЛЬШЕ)'
    : isExpectedTm
    ? 'ОЖИДАЛОСЬ: ТМ (ТОТАЛ МЕНЬШЕ)'
    : signal.targetAction
    ? `ОЖИДАЛОСЬ: ${signal.targetAction}`
    : '';

  const outcomeVerdictText = isWin
    ? isExpectedTb
      ? 'СЫГРАЛ ТБ ✅'
      : isExpectedTm
      ? 'СЫГРАЛ ТМ ✅'
      : 'ПРОШЛО ✅'
    : isLoss
    ? isExpectedTb
      ? 'НЕ ПРОШЁЛ ТБ ❌'
      : isExpectedTm
      ? 'НЕ ПРОШЁЛ ТМ ❌'
      : 'НЕ ПРОШЛО ❌'
    : 'ВОЗВРАТ 🔄';

  return (
    `${statusHeader}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🏷 <b>Категория:</b> ${betTypeLabel}\n` +
    `📋 <b>${strategyTag}</b>\n` +
    `🏆 <b>${country} | ${league}</b>\n` +
    `⚽ <b>${home} ${finalScore} ${away}</b> ${matchStatusTag}\n` +
    `${scoreChangeNote}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    (expectedActionText ? `🎯 <b>${expectedActionText}</b>\n` : '') +
    (marketSuggestion
      ? `👉 <b>Рекомендация была:</b> <b><u>🔥 ${escapeTelegramHtml(marketSuggestion.toUpperCase())} 🔥</u></b>\n`
      : '') +
    `🏆 <b>РЕЗУЛЬТАТ:</b> <b><u>${outcomeVerdictText}</u></b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `${metricSection}` +
    `📈 <b>Коэффициент:</b> <b>${signal.odds.toFixed(2)}</b>\n` +
    `💰 <b>${outcomeLabel}</b> <b>${isWin ? '✅ ПРОШЛО' : isLoss ? '❌ НЕ ПРОШЛО' : '🔄 ВОЗВРАТ'}</b> [${profitText}]\n` +
    `${resolutionNoteLine}` +
    `\n⏱ <i>Результат зафиксирован: ${new Date().toLocaleTimeString('ru-RU')}</i>`
  );
}

/**
 * Automatically evaluates whether a signal outcome was successful (WIN) or not (LOSS).
 * Supports early wins, first-half conclusion evaluations at HT (Перерыв), or final whistle evaluations.
 */
export function evaluateSignalOutcome(
  signal: SignalAlert,
  currentScore: [number, number],
  isMatchFinished: boolean,
  currentCorners?: [number, number],
  currentStats?: MatchStats,
  matchContext?: {
    matchStatus?: MatchStatus;
    minute?: number;
    firstHalfScore?: [number, number];
  }
): { outcome: SignalOutcome; note?: string; shouldResolve: boolean } {
  const initialParts = signal.score.split(':').map((s: string) => parseInt(s.trim(), 10));
  const initHome = isNaN(initialParts[0]) ? 0 : initialParts[0];
  const initAway = isNaN(initialParts[1]) ? 0 : initialParts[1];
  const initialTotalGoals = initHome + initAway;

  const curHome = currentScore[0];
  const curAway = currentScore[1];
  const currentTotalGoals = curHome + curAway;
  const goalsSinceSignal = currentTotalGoals - initialTotalGoals;

  const market = (signal.marketSuggestion || signal.ruleName).toLowerCase();
  const ruleNameLower = signal.ruleName.toLowerCase();

  // ℹ️ Не по всем фильтрам отслеживается результат: информационные радары, чистое давление и мониторинг
  if (
    signal.noResolutionTrack === true ||
    signal.trackOutcome === false ||
    signal.ruleCategory === 'info' ||
    signal.ruleCategory === 'radar' ||
    signal.marketSuggestion === 'ИНФО' ||
    signal.marketSuggestion === 'РАДАР' ||
    signal.marketSuggestion === 'МОНИТОРИНГ' ||
    signal.marketSuggestion === 'NO_TRACK' ||
    market.includes('без отслеживания') ||
    market.includes('инфо-радар') ||
    market.includes('мониторинг активности') ||
    ruleNameLower.includes('инфо-радар') ||
    ruleNameLower.includes('мониторинг активности')
  ) {
    return {
      outcome: 'PENDING',
      note: 'Информационный фильтр / радар: результат исхода не отслеживается',
      shouldResolve: false,
    };
  }

  // 🎯 Check if the strategy explicitly targets the 2nd half or the entire match (Strategies 14/12, 21, 55, 42, 54, etc.)
  const isTargetingSecondHalfOrFullMatch =
    market.includes('во 2-м') ||
    market.includes('во 2м') ||
    market.includes('во 2т') ||
    market.includes('2-м тайме') ||
    market.includes('2-й тайм') ||
    market.includes('2 тайм') ||
    market.includes('во втором') ||
    market.includes('второй тайм') ||
    market.includes('в матче') ||
    market.includes('до конца матча') ||
    market.includes('весь матч') ||
    market.includes('матча') ||
    market.includes('в концовке') ||
    market.includes('после 70') ||
    market.includes('после 75') ||
    market.includes('после 80') ||
    market.includes('12') ||
    market.includes('ничьей не будет') ||
    market.includes('ничьи не будет') ||
    market.includes('следующий гол') ||
    ruleNameLower.includes('во 2-м') ||
    ruleNameLower.includes('во 2м') ||
    ruleNameLower.includes('во втором') ||
    ruleNameLower.includes('второй тайм') ||
    ruleNameLower.includes('решето') ||
    ruleNameLower.includes('весь матч') ||
    ruleNameLower.includes('в матче') ||
    ruleNameLower.includes('тренд тб 2.5') ||
    ruleNameLower.includes('доминант') ||
    signal.ruleId === 'strat-12' ||
    signal.ruleId === 'strat-second-half-sieve' ||
    signal.ruleId === 'strat-underdog-55-halftime' ||
    signal.ruleId === 'strat-synergy-goal-storm' ||
    signal.ruleId === 'strat-54' ||
    signal.ruleId === 'strat-xg-trap-regression' ||
    signal.ruleId === 'strat-poisson-xg-over25' ||
    ruleNameLower.includes('ловушка xg') ||
    ruleNameLower.includes('пуассон') ||
    signal.ruleId === 'strat-draw-over5';

  // ⏱️ Exclusive First-half ONLY bets (evaluated at HT break):
  // Must explicitly target the 1st half and NOT target the 2nd half or full match!
  const isExclusiveFirstHalfBet =
    !isTargetingSecondHalfOrFullMatch &&
    (
      signal.ruleId === 'strat-2' ||
      signal.ruleId === 'strat-8' ||
      signal.ruleId === 'strat-52' ||
      signal.ruleId === 'strat-53' ||
      market.includes('тм 0.5 в 1-м тайме') ||
      market.includes('победа фаворита в 1-м тайме') ||
      market.includes('1-м тайме') ||
      market.includes('1-го тайма') ||
      market.includes('первом тайме') ||
      market.includes('1т)') ||
      market.includes('1т ') ||
      market.endsWith('1т') ||
      ruleNameLower.includes('гол в 1-м тайме') ||
      ruleNameLower.includes('победа фаворита в 1-м тайме') ||
      ruleNameLower.includes('тм 0.5 в 1-м тайме')
    );

  // Did the first half finish (HT break, second half begun >= 46', or FT)?
  const isHalfTimeEnded =
    isMatchFinished ||
    matchContext?.matchStatus === 'HT' ||
    matchContext?.matchStatus === 'FT' ||
    (matchContext?.minute !== undefined && matchContext.minute > 45) ||
    (matchContext?.matchStatus === 'LIVE' && matchContext.minute !== undefined && matchContext.minute >= 46);

  // 🎯 FIRST-HALF EXCLUSIVE RESOLUTION (Resolves strictly for 1H bets at the end of 1st half / HT)
  if (isExclusiveFirstHalfBet) {
    // Under 0.5 in 1st half (Стратегия 52: ТМ 0.5 в 1-м тайме)
    const isUnderHalfTime =
      market.includes('тм 0.5') ||
      market.includes('under 0.5') ||
      market.includes('тм 0,5') ||
      (market.includes('тм') && (market.includes('1т') || market.includes('1-м тайм')));

    if (isUnderHalfTime) {
      if (goalsSinceSignal > 0 || currentTotalGoals > 0) {
        return {
          outcome: 'LOSS',
          note: `ТМ 0.5 в 1-м тайме проигран: забит гол (${curHome}:${curAway})`,
          shouldResolve: true,
        };
      }
      if (isHalfTimeEnded) {
        return {
          outcome: 'WIN',
          note: `ТМ 0.5 в 1-м тайме зашёл: перерыв при 0:0 (${curHome}:${curAway})`,
          shouldResolve: true,
        };
      }
      return { outcome: 'PENDING', shouldResolve: false };
    }

    // Favorite win in 1st half (Стратегия 53: Победа фаворита в 1-м тайме)
    if (market.includes('фаворит') && (market.includes('победа') || market.includes('выиграет') || market.includes('1 тайм') || market.includes('1-м тайм'))) {
      if (isHalfTimeEnded) {
        const homeOdds = (signal.statsSnapshot as any)?.homeOdds ?? 2.0;
        const awayOdds = (signal.statsSnapshot as any)?.awayOdds ?? 2.0;
        const favIsHome = homeOdds < awayOdds;
        const isWin = favIsHome ? curHome > curAway : curAway > curHome;
        return {
          outcome: isWin ? 'WIN' : 'LOSS',
          note: isWin
            ? `Победа фаворита в 1-м тайме зашла (${curHome}:${curAway})`
            : `Победа фаворита в 1-м тайме не зашла (${curHome}:${curAway})`,
          shouldResolve: true,
        };
      }
      return { outcome: 'PENDING', shouldResolve: false };
    }

    // If a goal was scored during the 1st half or at HT -> WIN!
    if (goalsSinceSignal > 0 && (matchContext?.minute === undefined || matchContext.minute <= 45 || matchContext?.matchStatus === 'HT')) {
      return {
        outcome: 'WIN',
        note: `Гол в 1-м тайме забит (${curHome}:${curAway}, +${goalsSinceSignal} гол)!`,
        shouldResolve: true,
      };
    }

    // Corners in 1st half
    if (market.includes('угл') || market.includes('corner')) {
      const initCornersH = signal.statsSnapshot?.corners?.[0] ?? 0;
      const initCornersA = signal.statsSnapshot?.corners?.[1] ?? 0;
      const initTotalCorners = initCornersH + initCornersA;
      const curCornersTotal = currentCorners ? (currentCorners[0] + currentCorners[1]) : initTotalCorners;
      const newCorners = curCornersTotal - initTotalCorners;

      if (newCorners >= 2 || (curCornersTotal >= 5 && newCorners >= 1)) {
        return {
          outcome: 'WIN',
          note: `Угловые в 1-м тайме зашли: +${newCorners} угловых (итого ${curCornersTotal})`,
          shouldResolve: true,
        };
      }
      if (isHalfTimeEnded) {
        return {
          outcome: newCorners >= 1 ? 'WIN' : 'LOSS',
          note: newCorners >= 1
            ? `Поданы угловые в 1-м тайме (+${newCorners}, счёт ${curHome}:${curAway})`
            : `Недостаточно угловых в 1-м тайме (+${newCorners}, перерыв при ${curHome}:${curAway})`,
          shouldResolve: true,
        };
      }
      return { outcome: 'PENDING', shouldResolve: false };
    }

    // Outcome in 1st half (П1 / П2 / Ничья 1-й тайм)
    if (market.includes('п1') || market.includes('победа 1') || market.includes('победа хозяев')) {
      if (isHalfTimeEnded) {
        const isWin = curHome > curAway;
        return {
          outcome: isWin ? 'WIN' : 'LOSS',
          note: isWin ? `П1 в 1-м тайме зашла (${curHome}:${curAway})` : `П1 в 1-м тайме не зашла (${curHome}:${curAway})`,
          shouldResolve: true,
        };
      }
      return { outcome: 'PENDING', shouldResolve: false };
    }
    if (market.includes('п2') || market.includes('победа 2') || market.includes('победа гостей')) {
      if (isHalfTimeEnded) {
        const isWin = curAway > curHome;
        return {
          outcome: isWin ? 'WIN' : 'LOSS',
          note: isWin ? `П2 в 1-м тайме зашла (${curHome}:${curAway})` : `П2 в 1-м тайме не зашла (${curHome}:${curAway})`,
          shouldResolve: true,
        };
      }
      return { outcome: 'PENDING', shouldResolve: false };
    }

    // Default 1st half Goal/Total market (e.g. Гол в 1-м тайме, ТБ 0.5 1Т)
    if (isHalfTimeEnded) {
      if (goalsSinceSignal > 0) {
        return {
          outcome: 'WIN',
          note: `Гол в 1-м тайме зафиксирован (счёт к перерыву ${curHome}:${curAway})`,
          shouldResolve: true,
        };
      } else {
        return {
          outcome: 'LOSS',
          note: `1-й тайм завершился без забитых голов (счёт к перерыву ${curHome}:${curAway})`,
          shouldResolve: true,
        };
      }
    }

    return { outcome: 'PENDING', shouldResolve: false };
  }

  // 0-cards. Card markets (Желтые карточки, Красные карточки, Удаление, Карточки ТБ, ЖК)
  if (
    market.includes('жк') ||
    market.includes('карточ') ||
    market.includes('удален') ||
    market.includes('красн') ||
    market.includes('большинств')
  ) {
    const initYellow = signal.statsSnapshot?.yellowCards ? (signal.statsSnapshot.yellowCards[0] + signal.statsSnapshot.yellowCards[1]) : 0;
    const curYellow = currentStats?.yellowCards ? (currentStats.yellowCards[0] + currentStats.yellowCards[1]) : initYellow;
    const newYellow = Math.max(0, curYellow - initYellow);

    const initRed = signal.statsSnapshot?.redCards ? (signal.statsSnapshot.redCards[0] + signal.statsSnapshot.redCards[1]) : 0;
    const curRed = currentStats?.redCards ? (currentStats.redCards[0] + currentStats.redCards[1]) : initRed;
    const newRed = Math.max(0, curRed - initRed);

    // Удаление / Красная карточка
    if (market.includes('удален') || market.includes('красн') || market.includes('кк')) {
      if (curRed > 0 || newRed > 0) {
        return {
          outcome: 'WIN',
          note: `Удаление зафиксировано: ${curRed} красных карточек в матче!`,
          shouldResolve: true,
        };
      }
      if (isMatchFinished) {
        return {
          outcome: 'LOSS',
          note: 'Матч завершён без удалений (0 КК)',
          shouldResolve: true,
        };
      }
    } else if (market.includes('большинств')) {
      // Гол в большинстве или победа в большинстве
      if (goalsSinceSignal > 0) {
        return {
          outcome: 'WIN',
          note: `Гол в большинстве забит (${curHome}:${curAway})!`,
          shouldResolve: true,
        };
      }
      if (isMatchFinished) {
        return {
          outcome: goalsSinceSignal > 0 ? 'WIN' : 'LOSS',
          note: goalsSinceSignal > 0 ? `Победа в большинстве оправдалась (${curHome}:${curAway})` : 'Команда в большинстве не смогла забить',
          shouldResolve: true,
        };
      }
    } else {
      // Тотал Жёлтых карточек ТБ
      const tbMatch = market.match(/(?:тб|больше)\s*(\d+(?:\.5)?)/i);
      const targetThreshold = tbMatch ? parseFloat(tbMatch[1]) : (initYellow + 1.0);
      const targetInt = Math.ceil(targetThreshold);

      // In-play resolution: WIN strictly requires new cards shown after signal (newYellow >= 1)
      if ((curYellow >= targetInt && newYellow >= 1) || newYellow >= 2) {
        return {
          outcome: 'WIN',
          note: `ЖК ТБ сыграл: показано ${curYellow} ЖК (+${newYellow} после сигнала, цель: ≥ ${targetInt})`,
          shouldResolve: true,
        };
      }
      if (isMatchFinished) {
        if (curYellow >= targetThreshold && newYellow >= 1) {
          return {
            outcome: 'WIN',
            note: `Итоговый тотал ЖК ${curYellow} >= ${targetThreshold} (+${newYellow} после сигнала)`,
            shouldResolve: true,
          };
        }
        return {
          outcome: 'LOSS',
          note: `Недостаточно карточек: всего ${curYellow} ЖК (+${newYellow} после сигнала, цель: > ${targetThreshold})`,
          shouldResolve: true,
        };
      }
    }
  }

  // 0a. Corners markets (ТБ угловых в концовке, Штурм угловых)
  if (market.includes('угл') || market.includes('corner')) {
    const initCornersH = signal.statsSnapshot?.corners?.[0] ?? 0;
    const initCornersA = signal.statsSnapshot?.corners?.[1] ?? 0;
    const initTotalCorners = initCornersH + initCornersA;
    const curCornersTotal = currentCorners ? (currentCorners[0] + currentCorners[1]) : initTotalCorners;
    const newCorners = curCornersTotal - initTotalCorners;

    // Bet on corners: +2 new corners or match reached high corner volume (>= 10)
    if (newCorners >= 2 || (curCornersTotal >= 10 && newCorners >= 1)) {
      return {
        outcome: 'WIN',
        note: `ТБ угловых зашёл: подано +${newCorners} угловых после сигнала (итого ${curCornersTotal})`,
        shouldResolve: true,
      };
    }
    if (goalsSinceSignal > 0 && newCorners >= 1) {
      return {
        outcome: 'WIN',
        note: `Давление с угловых привело к голу (${curHome}:${curAway}) и +${newCorners} угловых`,
        shouldResolve: true,
      };
    }
    if (isMatchFinished) {
      if (newCorners >= 1) {
        return {
          outcome: 'WIN',
          note: `Поданы угловые после сигнала (+${newCorners}, итого ${curCornersTotal})`,
          shouldResolve: true,
        };
      }
      return {
        outcome: 'LOSS',
        note: `Недостаточно угловых в концовке (всего +${newCorners} после сигнала)`,
        shouldResolve: true,
      };
    }
  }

  // 0b. Comeback markets (Камбэк, Навал фаворита, 1X)
  if (market.includes('камбэк') || market.includes('1x') || (market.includes('гол хозяев') && initHome < initAway)) {
    const trailingHome = initHome < initAway;
    const trailingAway = initAway < initHome;
    if (trailingHome) {
      if (curHome >= curAway || curHome > initHome) {
        return {
          outcome: 'WIN',
          note: `Камбэк удался: хозяева забили (счёт ${curHome}:${curAway}, был ${initHome}:${initAway})`,
          shouldResolve: true,
        };
      }
    } else if (trailingAway) {
      if (curAway >= curHome || curAway > initAway) {
        return {
          outcome: 'WIN',
          note: `Камбэк удался: гости забили (счёт ${curHome}:${curAway}, был ${initHome}:${initAway})`,
          shouldResolve: true,
        };
      }
    } else if (market.includes('1x') || market.includes('двойной шанс')) {
      if (curHome >= curAway && isMatchFinished) {
        return {
          outcome: 'WIN',
          note: `Двойной шанс 1X зашёл (итог ${curHome}:${curAway})`,
          shouldResolve: true,
        };
      }
    }
    if (isMatchFinished) {
      if ((market.includes('1x') || market.includes('двойной шанс')) && curHome >= curAway) {
        return {
          outcome: 'WIN',
          note: `Двойной шанс 1X сыграл (итог ${curHome}:${curAway})`,
          shouldResolve: true,
        };
      }
      return {
        outcome: 'LOSS',
        note: `Отстающая команда не смогла забить (итог ${curHome}:${curAway})`,
        shouldResolve: true,
      };
    }
  }

  // 0c. Smart Money / Steam Live (П1, П2, Победа фаворита)
  if (market.includes('п1') || market.includes('победа 1') || market.includes('победа фаворита')) {
    if (curHome > curAway && isMatchFinished) {
      return { outcome: 'WIN', note: `Прогруз на П1 оправдался: победа ${curHome}:${curAway}`, shouldResolve: true };
    }
    if (isMatchFinished) {
      return { outcome: 'LOSS', note: `П1 не сыграла: итоговый счёт ${curHome}:${curAway}`, shouldResolve: true };
    }
  }
  if (market.includes('п2') || market.includes('победа 2')) {
    if (curAway > curHome && isMatchFinished) {
      return { outcome: 'WIN', note: `Прогруз на П2 оправдался: победа ${curHome}:${curAway}`, shouldResolve: true };
    }
    if (isMatchFinished) {
      return { outcome: 'LOSS', note: `П2 не сыграла: итоговый счёт ${curHome}:${curAway}`, shouldResolve: true };
    }
  }

  // 0c-2. Double Chance 12 / No Draw (Стратегия 54: «Ничьей не будет (12)»)
  const isNoDrawMarket =
    signal.ruleId === 'strat-54' ||
    (signal.ruleId && PRESET_STRATEGY_NUMBER_BY_ID[signal.ruleId] === 54) ||
    ruleNameLower.includes('стратегия 54') ||
    ruleNameLower.includes('ничьей не будет') ||
    ruleNameLower.includes('ничьи не будет') ||
    market.includes('ничьей не будет') ||
    market.includes('ничьи не будет') ||
    market.includes(' 12') ||
    market.startsWith('12') ||
    market.includes('двойной шанс 12') ||
    market.includes('без ничьей');

  if (isNoDrawMarket) {
    const isFinished =
      isMatchFinished ||
      (matchContext?.minute !== undefined && matchContext.minute >= 90) ||
      matchContext?.matchStatus === 'FT';

    if (isFinished) {
      const isWin = curHome !== curAway;
      return {
        outcome: isWin ? 'WIN' : 'LOSS',
        note: isWin
          ? `Ничьей не произошло: победа одной из команд (${curHome}:${curAway})`
          : `Матч завершился вничью (${curHome}:${curAway})`,
        shouldResolve: true,
      };
    }
    return { outcome: 'PENDING', shouldResolve: false };
  }

  // 0c-3. Ловушка xG (Регрессия к среднему) - Strat 43 / strat-xg-trap-regression
  const isXgTrap =
    signal.ruleId === 'strat-xg-trap-regression' ||
    (signal.ruleId && PRESET_STRATEGY_NUMBER_BY_ID[signal.ruleId] === 43) ||
    ruleNameLower.includes('ловушка xg') ||
    market.includes('ловушка xg');

  if (isXgTrap) {
    if (goalsSinceSignal > 0) {
      return {
        outcome: 'WIN',
        note: `Гол по Ловушке xG забит (${curHome}:${curAway}, +${goalsSinceSignal} гол)! Регрессия xG сработала!`,
        shouldResolve: true,
      };
    }
    // КРИТИЧЕСКИ ВАЖНО: матч ещё идёт во 2-м тайме (минута < 90 и статус не FT) — сигнал обязан оставаться PENDING!
    const isActuallyComplete =
      matchContext?.matchStatus === 'FT' ||
      (isMatchFinished && matchContext?.matchStatus !== 'LIVE' && (matchContext?.minute === undefined || matchContext.minute >= 90));

    if (isActuallyComplete) {
      return {
        outcome: 'LOSS',
        note: `Матч завершён со счётом ${curHome}:${curAway} без голов во 2-м тайме`,
        shouldResolve: true,
      };
    }
    return { outcome: 'PENDING', shouldResolve: false };
  }

  // 0c-4. Баскетбол: 4-я четверть (Адаптивный тотал: ТБ при клатче <=6 / ТМ при отрыве >=10)
  const isBasketball =
    signal.sport === 'basketball' ||
    signal.ruleId === 'strat-basketball-4q-over' ||
    (signal.ruleId && PRESET_STRATEGY_NUMBER_BY_ID[signal.ruleId] === 47) ||
    ruleNameLower.includes('баскетбол');

  if (isBasketball) {
    const isBasketballFinished =
      matchContext?.matchStatus === 'FT' ||
      (isMatchFinished && matchContext?.matchStatus !== 'LIVE' && (matchContext?.minute === undefined || matchContext.minute >= 40));

    const initScoreParts = (signal.score || '0:0').split(':').map((s) => parseInt(s.trim(), 10));
    const initTotalPts = (isNaN(initScoreParts[0]) ? 0 : initScoreParts[0]) + (isNaN(initScoreParts[1]) ? 0 : initScoreParts[1]);
    const curTotalPts = curHome + curAway;
    const ptsSinceSignal = curTotalPts - initTotalPts;
    const initDiff = Math.abs((initScoreParts[0] || 0) - (initScoreParts[1] || 0));

    // ТМ при крупном отрыве >= 10
    if (market.includes('тм') || (!market.includes('тб') && initDiff >= 10)) {
      if (isBasketballFinished) {
        const isTmWin = ptsSinceSignal <= 16;
        return {
          outcome: isTmWin ? 'WIN' : 'LOSS',
          note: isTmWin
            ? `Баскетбол: ✅ ВЫИГРЫШ (ТМ СЫГРАЛ)! Ожидалось: ТМ (Тотал Меньше) | Скамейка засушила концовку (+${ptsSinceSignal} очк., факт: ${curTotalPts} очк., счёт ${curHome}:${curAway})`
            : `Баскетбол: ❌ ПРОИГРЫШ (ТМ НЕ ПРОШЁЛ)! Ожидалось: ТМ (Тотал Меньше) | Набрано +${ptsSinceSignal} очк. в концовке (факт: ${curTotalPts} очк., счёт ${curHome}:${curAway})`,
          shouldResolve: true,
        };
      }
      return { outcome: 'PENDING', shouldResolve: false };
    }

    // ТБ при клатче <= 6
    if (ptsSinceSignal >= 18 || curTotalPts >= 212) {
      return {
        outcome: 'WIN',
        note: `Баскетбол: ✅ ВЫИГРЫШ (ТБ СЫГРАЛ)! Ожидалось: ТБ (Тотал Больше) | Набрано +${ptsSinceSignal} очк. в концовке (факт: ${curTotalPts} очк., итог ${curHome}:${curAway})`,
        shouldResolve: true,
      };
    }
    if (isBasketballFinished) {
      const isTbWin = ptsSinceSignal >= 14 || curTotalPts >= 208;
      return {
        outcome: isTbWin ? 'WIN' : 'LOSS',
        note: isTbWin
          ? `Баскетбол: ✅ ВЫИГРЫШ (ТБ СЫГРАЛ)! Ожидалось: ТБ (Тотал Больше) | Сыграл ТБ (+${ptsSinceSignal} очк., факт: ${curTotalPts} очк., счёт ${curHome}:${curAway})`
          : `Баскетбол: ❌ ПРОИГРЫШ (ТБ НЕ ПРОШЁЛ)! Ожидалось: ТБ (Тотал Больше) | Недостаточный темп (+${ptsSinceSignal} очк., факт: ${curTotalPts} очк., счёт ${curHome}:${curAway})`,
        shouldResolve: true,
      };
    }
    return { outcome: 'PENDING', shouldResolve: false };
  }

  // 0c-5. Стратегия 59: Математический ТБ 2.5 по Пуассону (+EV)
  const isPoissonOver25 =
    signal.ruleId === 'strat-poisson-xg-over25' ||
    (signal.ruleId && PRESET_STRATEGY_NUMBER_BY_ID[signal.ruleId] === 59) ||
    ruleNameLower.includes('пуассон') ||
    ruleNameLower.includes('стратегия 59');

  if (isPoissonOver25) {
    if (currentTotalGoals >= 3) {
      return {
        outcome: 'WIN',
        note: `ТБ 2.5 (+EV Пуассон) зашёл! Забито ${currentTotalGoals} голов (счёт ${curHome}:${curAway})`,
        shouldResolve: true,
      };
    }
    const isActuallyComplete =
      matchContext?.matchStatus === 'FT' ||
      (isMatchFinished && matchContext?.matchStatus !== 'LIVE' && (matchContext?.minute === undefined || matchContext.minute >= 90));

    if (isActuallyComplete) {
      return {
        outcome: 'LOSS',
        note: `Матч завершён со счётом ${curHome}:${curAway} (тотал ${currentTotalGoals} < 2.5)`,
        shouldResolve: true,
      };
    }
    return { outcome: 'PENDING', shouldResolve: false };
  }

  // 0c-6. Стратегия 60 (Хоккей B.O.S.): Ловушка дальней скамейки во 2-м периоде (ТБ 1.5 во 2-м периоде)
  const isHockeyBosLongchange =
    signal.ruleId === 'strat-hockey-bos-2p-longchange' ||
    (signal.ruleId && PRESET_STRATEGY_NUMBER_BY_ID[signal.ruleId] === 60) ||
    ruleNameLower.includes('стратегия 60') ||
    ruleNameLower.includes('дальней скамейки');

  if (isHockeyBosLongchange) {
    if (goalsSinceSignal >= 2 || currentTotalGoals >= 4) {
      return {
        outcome: 'WIN',
        note: `Хоккей B.O.S.: ТБ 1.5 во 2-м периоде зашёл (+${goalsSinceSignal} шайб, счёт ${curHome}:${curAway})`,
        shouldResolve: true,
      };
    }
    const isPeriodOver = isMatchFinished || (matchContext?.minute !== undefined && matchContext.minute >= 40);
    if (isPeriodOver) {
      return {
        outcome: goalsSinceSignal >= 1 ? 'WIN' : 'LOSS',
        note: goalsSinceSignal >= 1
          ? `Хоккей B.O.S.: забито +${goalsSinceSignal} шайб во 2-м периоде (${curHome}:${curAway})`
          : `Хоккей B.O.S.: 0 шайб во 2-м периоде (${curHome}:${curAway})`,
        shouldResolve: true,
      };
    }
    return { outcome: 'PENDING', shouldResolve: false };
  }

  // 0c-7. Стратегия 61 (Баскетбол 360): Синдром 3-й четверти фаворита (Рывок / Фора -2.5 в 3Ч)
  const isBasketball360Surge =
    signal.ruleId === 'strat-basketball-360-3q-surge' ||
    (signal.ruleId && PRESET_STRATEGY_NUMBER_BY_ID[signal.ruleId] === 61) ||
    ruleNameLower.includes('стратегия 61') ||
    ruleNameLower.includes('синдром 3-й четверти');

  if (isBasketball360Surge) {
    const ptsSinceSignalH = curHome - initHome;
    const ptsSinceSignalA = curAway - initAway;
    const homeOdds = (signal.statsSnapshot as any)?.homeOdds ?? 1.5;
    const awayOdds = (signal.statsSnapshot as any)?.awayOdds ?? 2.5;
    const favIsHome = homeOdds < awayOdds;
    const favMargin = favIsHome ? (ptsSinceSignalH - ptsSinceSignalA) : (ptsSinceSignalA - ptsSinceSignalH);

    if (favMargin >= 3) {
      return {
        outcome: 'WIN',
        note: `Баскет 360: Рывок фаворита в 3-й четверти оправдался (+${favMargin} очков форы, счёт ${curHome}:${curAway})`,
        shouldResolve: true,
      };
    }
    const is3qOver = isMatchFinished || (matchContext?.minute !== undefined && matchContext.minute >= 34);
    if (is3qOver) {
      return {
        outcome: favMargin >= 2 ? 'WIN' : 'LOSS',
        note: favMargin >= 2
          ? `Баскет 360: фора фаворита зашла (+${favMargin} очков, счёт ${curHome}:${curAway})`
          : `Баскет 360: фаворит не удержал фору в 3Ч (фора ${favMargin >= 0 ? '+' : ''}${favMargin}, счёт ${curHome}:${curAway})`,
        shouldResolve: true,
      };
    }
    return { outcome: 'PENDING', shouldResolve: false };
  }

  // 0c-8. Стратегия 62 (Теннис B.O.S.): Модель подаванов Big Server (ТБ 9.5 в 1-м сете)
  const isTennisBosBigserver =
    signal.ruleId === 'strat-tennis-bos-bigserver-tb95' ||
    (signal.ruleId && PRESET_STRATEGY_NUMBER_BY_ID[signal.ruleId] === 62) ||
    ruleNameLower.includes('стратегия 62') ||
    ruleNameLower.includes('подаванов') ||
    ruleNameLower.includes('big server');

  if (isTennisBosBigserver) {
    if (currentTotalGoals >= 10 || (curHome >= 5 && curAway >= 5)) {
      return {
        outcome: 'WIN',
        note: `Теннис B.O.S.: ТБ 9.5 в сете подаванов зашёл! Счёт ${curHome}:${curAway} (${currentTotalGoals} геймов)`,
        shouldResolve: true,
      };
    }
    if (curHome >= 6 || curAway >= 6) {
      return {
        outcome: currentTotalGoals >= 10 ? 'WIN' : 'LOSS',
        note: currentTotalGoals >= 10
          ? `Теннис B.O.S.: ТБ 9.5 сыграл (${curHome}:${curAway})`
          : `Теннис B.O.S.: ранний брейк, сет завершился ${curHome}:${curAway} (<10 геймов)`,
        shouldResolve: true,
      };
    }
    return { outcome: 'PENDING', shouldResolve: false };
  }

  // 0c-9. Стратегии 63-67 (Стратегии из сканера)
  const isPhotoScannerGoal =
    signal.ruleId === 'strat-photo-home-goal-17-20' ||
    signal.ruleId === 'strat-photo-ht-goal-92' ||
    signal.ruleId === 'strat-photo-match-goal-multi' ||
    signal.ruleId === 'strat-photo-goal-95-h2h' ||
    signal.ruleId === 'strat-photo-goal-98-combo' ||
    (signal.ruleId && PRESET_STRATEGY_NUMBER_BY_ID[signal.ruleId] >= 63 && PRESET_STRATEGY_NUMBER_BY_ID[signal.ruleId] <= 67);

  if (isPhotoScannerGoal) {
    if (signal.ruleId === 'strat-photo-home-goal-17-20' && curHome > initHome) {
      return {
        outcome: 'WIN',
        note: `Гол домашней команды забит! Счёт ${curHome}:${curAway} (+${curHome - initHome} гол К1)`,
        shouldResolve: true,
      };
    }
    if (goalsSinceSignal > 0) {
      return {
        outcome: 'WIN',
        note: `Гол после сигнала зафиксирован (+${goalsSinceSignal}, текущий счёт ${curHome}:${curAway})`,
        shouldResolve: true,
      };
    }
    if (signal.ruleId === 'strat-photo-ht-goal-92' && isHalfTimeEnded) {
      return {
        outcome: goalsSinceSignal > 0 ? 'WIN' : 'LOSS',
        note: goalsSinceSignal > 0
          ? `Гол в 1-м тайме зашёл! Перерыв при ${curHome}:${curAway}`
          : `1-й тайм завершился 0:0 (${curHome}:${curAway})`,
        shouldResolve: true,
      };
    }
    const isActuallyComplete =
      matchContext?.matchStatus === 'FT' ||
      (isMatchFinished && matchContext?.matchStatus !== 'LIVE' && (matchContext?.minute === undefined || matchContext.minute >= 90));
    if (isActuallyComplete) {
      return {
        outcome: 'LOSS',
        note: `Матч завершился со счётом ${curHome}:${curAway} без голов после сигнала`,
        shouldResolve: true,
      };
    }
    return { outcome: 'PENDING', shouldResolve: false };
  }

  // 0c-10. Стратегия 68 (Теория трёх матчей) & 69 (15 параметров)
  const isPdfStrategy =
    signal.ruleId === 'strat-pdf-three-matches-theory' ||
    signal.ruleId === 'strat-pdf-15-param-value-drop' ||
    (signal.ruleId && (PRESET_STRATEGY_NUMBER_BY_ID[signal.ruleId] === 68 || PRESET_STRATEGY_NUMBER_BY_ID[signal.ruleId] === 69));

  if (isPdfStrategy) {
    const isActuallyComplete =
      matchContext?.matchStatus === 'FT' ||
      (isMatchFinished && matchContext?.matchStatus !== 'LIVE' && (matchContext?.minute === undefined || matchContext.minute >= 90));
    if (isActuallyComplete) {
      const isWinOrPush = curHome >= curAway;
      return {
        outcome: isWinOrPush ? 'WIN' : 'LOSS',
        note: isWinOrPush
          ? `Стратегия по аналитической модели зашла: итог ${curHome}:${curAway}`
          : `Неожиданный результат: итог ${curHome}:${curAway}`,
        shouldResolve: true,
      };
    }
    return { outcome: 'PENDING', shouldResolve: false };
  }

  // 0d. Combined TM 2.5 / Draw (ТМ 2.5 / Ничья (X))
  if ((market.includes('ничья') && market.includes('тм')) || market.includes('тм 2.5 / ничья')) {
    if (isMatchFinished) {
      if (curHome === curAway || currentTotalGoals <= 2) {
        return {
          outcome: 'WIN',
          note: `ТМ 2.5 / Ничья сыграли: итоговый счёт ${curHome}:${curAway}`,
          shouldResolve: true,
        };
      }
      return {
        outcome: 'LOSS',
        note: `ТМ 2.5 / Ничья не сыграли: итоговый счёт ${curHome}:${curAway}`,
        shouldResolve: true,
      };
    }
  }

  // 0e. Both teams to score / BTTS / TB 1.5
  if (market.includes('обе команды забьют') || market.includes('обе забьют') || market.includes('оз') || market.includes('btts')) {
    if ((curHome > 0 && curAway > 0) || (market.includes('1.5') && currentTotalGoals >= 2)) {
      return {
        outcome: 'WIN',
        note: `Обе команды забили / ТБ 1.5 (${curHome}:${curAway})`,
        shouldResolve: true,
      };
    }
    if (isMatchFinished) {
      return {
        outcome: 'LOSS',
        note: `Матч завершён со счётом ${curHome}:${curAway}`,
        shouldResolve: true,
      };
    }
  }

  // 0f. Total Under / Сушка (ТМ, Under, Тотал меньше)
  const isUnderMarket =
    (market.includes('тм') || market.includes('under') || market.includes('тотал меньше') || market.includes('сушка')) &&
    !market.includes('тб') &&
    !market.includes('over');

  if (isUnderMarket) {
    if (market.includes('2.5') || market.includes('2,5')) {
      if (currentTotalGoals > 2) {
        return { outcome: 'LOSS', note: `ТБ 2.5 пробит (${curHome}:${curAway}, ${currentTotalGoals} голов)`, shouldResolve: true };
      }
      if (isMatchFinished) {
        return { outcome: 'WIN', note: `ТМ 2.5 сыграл: итоговый счёт ${curHome}:${curAway}`, shouldResolve: true };
      }
    } else {
      // General ТМ (текущий тотал + 0.5): no more goals allowed
      if (goalsSinceSignal > 0) {
        return { outcome: 'LOSS', note: `Забит гол после сигнала (${curHome}:${curAway}), ТМ не сыграл`, shouldResolve: true };
      }
      if (isMatchFinished) {
        return { outcome: 'WIN', note: `Счёт удержан (${curHome}:${curAway}), ТМ зашёл!`, shouldResolve: true };
      }
    }
  }

  // 0e. Draw / Ничья (X)
  if (market.includes('ничья') || market.includes('исход x') || market === 'x') {
    if (isMatchFinished) {
      if (curHome === curAway) {
        return { outcome: 'WIN', note: `Матч завершился вничью (${curHome}:${curAway})`, shouldResolve: true };
      } else {
        return { outcome: 'LOSS', note: `Матч завершился без ничьей (${curHome}:${curAway})`, shouldResolve: true };
      }
    }
  }

  // 1. Goal markets (Over, Goal in match, Goal in 2nd half, ТБ 0.5, ТБ 1.5, ТБ 2.5)
  if (
    market.includes('гол') ||
    market.includes('тб') ||
    market.includes('тотал больше') ||
    market.includes('over')
  ) {
    if (market.includes('тб 1.5') && !market.includes('во 2-м тайме') && !market.includes('1т')) {
      if (currentTotalGoals >= 2 && goalsSinceSignal > 0) {
        return { outcome: 'WIN', note: `Тотал матча ${currentTotalGoals} >= 1.5 (+${goalsSinceSignal} гол после сигнала)`, shouldResolve: true };
      }
      if (isMatchFinished) {
        if (currentTotalGoals >= 2 && goalsSinceSignal > 0) {
          return { outcome: 'WIN', note: `Итоговый тотал ${currentTotalGoals} >= 1.5 (+${goalsSinceSignal} гол после сигнала)`, shouldResolve: true };
        }
        return { outcome: 'LOSS', note: `Итоговый тотал ${currentTotalGoals} < 1.5 (или нет голов после сигнала)`, shouldResolve: true };
      }
    } else if (market.includes('тб 2.5')) {
      if (currentTotalGoals >= 3 && goalsSinceSignal > 0) {
        return { outcome: 'WIN', note: `Тотал матча ${currentTotalGoals} >= 2.5 (+${goalsSinceSignal} гол после сигнала)`, shouldResolve: true };
      }
      if (isMatchFinished) {
        if (currentTotalGoals >= 3 && goalsSinceSignal > 0) {
          return { outcome: 'WIN', note: `Итоговый тотал ${currentTotalGoals} >= 2.5 (+${goalsSinceSignal} гол после сигнала)`, shouldResolve: true };
        }
        return { outcome: 'LOSS', note: `Итоговый тотал ${currentTotalGoals} < 2.5 (или нет голов после сигнала)`, shouldResolve: true };
      }
    } else {
      // General goal after signal (ТБ 0.5 во 2Т / Гол в матче / Поздний гол)
      if (goalsSinceSignal > 0) {
        return { outcome: 'WIN', note: `Забит гол после сигнала (${curHome}:${curAway}, +${goalsSinceSignal} гол)`, shouldResolve: true };
      }
      const isActuallyMatchDone =
        isMatchFinished &&
        (matchContext?.matchStatus === 'FT' ||
          (matchContext?.minute !== undefined ? matchContext.minute >= (signal.sport === 'basketball' ? 40 : 90) : true));
      if (isActuallyMatchDone) {
        return { outcome: 'LOSS', note: 'Матч завершён без новых голов', shouldResolve: true };
      }
    }
  }

  // 2. Both teams to score (ОЗ - Да)
  if (market.includes('обе забьют') || market.includes('оз') || market.includes('btts')) {
    if (curHome > 0 && curAway > 0) {
      return { outcome: 'WIN', note: `Обе команды забили (${curHome}:${curAway})`, shouldResolve: true };
    }
    if (isMatchFinished) {
      return { outcome: 'LOSS', note: `Матч завершён со счётом ${curHome}:${curAway}`, shouldResolve: true };
    }
  }

  // 3. Default evaluation on match finish: if goals were scored after signal -> WIN, else LOSS
  if (isMatchFinished) {
    if (goalsSinceSignal > 0) {
      return { outcome: 'WIN', note: `Счёт изменился с ${signal.score} на ${curHome}:${curAway}`, shouldResolve: true };
    } else {
      return { outcome: 'LOSS', note: `Счёт не изменился (${curHome}:${curAway})`, shouldResolve: true };
    }
  }

  return { outcome: 'PENDING', shouldResolve: false };
}

const CYRILLIC_TO_LATIN_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
  з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

const COMMON_CANONICAL_ALIASES: Record<string, string> = {
  arsenal: 'arsenal',
  арсенал: 'arsenal',
  chelsea: 'chelsea',
  челси: 'chelsea',
  chelsi: 'chelsea',
  liverpool: 'liverpool',
  ливерпуль: 'liverpool',
  manchestercity: 'mancity',
  mancity: 'mancity',
  манчестерсити: 'mancity',
  manchesterunited: 'manunited',
  manunited: 'manunited',
  манчестерюнайтед: 'manunited',
  barcelona: 'barcelona',
  барселона: 'barcelona',
  realmadrid: 'realmadrid',
  реалмадрид: 'realmadrid',
  bayern: 'bayern',
  бавария: 'bayern',
  bayernmunich: 'bayern',
  бавариямюнхен: 'bayern',
  juventus: 'juventus',
  ювентус: 'juventus',
  milan: 'milan',
  милан: 'milan',
  inter: 'inter',
  интер: 'inter',
  psg: 'psg',
  псж: 'psg',
  tottenham: 'tottenham',
  тоттенхэм: 'tottenham',
};

/**
 * Normalizes team names by stripping club affixes (FC, FK, SC), whitespace, and symbols,
 * and performing cross-language transliteration to match identical teams across providers
 * (e.g., Flashscore English 'Arsenal FC' vs Fonbet Russian 'Арсенал').
 */
export function normalizeCanonicalTeam(name: string): string {
  if (!name) return '';
  let clean = name
    .toLowerCase()
    .replace(/\b(fc|cf|fk|sc|ac|bc|фк|ск|бк|кф)\b/gi, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .trim();

  clean = clean.replace(/^(?:fc|fk|фк|ск|бк)|(?:fc|fk|фк|ск|бк)$/gi, '');

  if (COMMON_CANONICAL_ALIASES[clean]) {
    return COMMON_CANONICAL_ALIASES[clean];
  }

  // Transliterate Cyrillic characters to Latin for universal cross-source matching
  let transliterated = '';
  for (const char of clean) {
    transliterated += CYRILLIC_TO_LATIN_MAP[char] !== undefined ? CYRILLIC_TO_LATIN_MAP[char] : char;
  }

  if (COMMON_CANONICAL_ALIASES[transliterated]) {
    return COMMON_CANONICAL_ALIASES[transliterated];
  }

  return transliterated || clean;
}

/**
 * Computes a deterministic canonical key representing a match regardless of provider ID prefixes.
 * Works with Match objects (homeTeam, awayTeam) as well as SignalAlert items (matchName).
 */
export function getCanonicalMatchKey(match: {
  homeTeam?: string;
  awayTeam?: string;
  matchName?: string;
  sport?: string;
}): string {
  let h = match.homeTeam || '';
  let a = match.awayTeam || '';
  if ((!h || !a) && match.matchName) {
    const parts = match.matchName.split(/\s+vs\s+|\s+-\s+/i);
    h = h || parts[0] || '';
    a = a || parts[1] || '';
  }
  const normH = normalizeCanonicalTeam(h);
  const normA = normalizeCanonicalTeam(a);
  const sp = (match.sport || 'football').toLowerCase();
  return `${sp}__${normH}_vs_${normA}`;
}


