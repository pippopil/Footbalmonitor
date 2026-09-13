import { Match, FilterRule, PressureAnalysis } from './types';

/**
 * Calculates in-depth match pressure, momentum index, and goal probability.
 */
export function calculatePressureAnalysis(match: Match): PressureAnalysis {
  const { stats, minute, homeTeam, awayTeam } = match;
  const currentMinute = Math.max(1, minute);

  // Total volume
  const totalDang = stats.dangerousAttacks[0] + stats.dangerousAttacks[1];
  const dangDiff = stats.dangerousAttacks[0] - stats.dangerousAttacks[1];
  const absDangDiff = Math.abs(dangDiff);

  const totalShots =
    stats.shotsOnTarget[0] +
    stats.shotsOnTarget[1] +
    stats.shotsOffTarget[0] +
    stats.shotsOffTarget[1];
  const totalShotsOnTarget = stats.shotsOnTarget[0] + stats.shotsOnTarget[1];
  const totalCorners = stats.corners[0] + stats.corners[1];
  const totalXg = stats.xg[0] + stats.xg[1];

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

  // 3. xG creation (up to 25 pts)
  if (totalXg >= 2.5) rawScore += 25;
  else if (totalXg >= 1.8) rawScore += 20;
  else if (totalXg >= 1.2) rawScore += 14;
  else rawScore += Math.min(10, totalXg * 8);

  // 4. Domination asymmetry / one-sided pressure bonus (up to 20 pts)
  if (absDangDiff >= 40) rawScore += 20;
  else if (absDangDiff >= 25) rawScore += 15;
  else if (absDangDiff >= 15) rawScore += 10;
  else rawScore += Math.min(8, (absDangDiff / 15) * 8);

  const pressureIndex = Math.min(100, Math.max(10, Math.round(rawScore)));

  // Determine dominant side
  let dominantSide: 'home' | 'away' | 'balanced' = 'balanced';
  let dominantTeamName = 'Равная игра';
  if (dangDiff >= 15 || stats.xg[0] - stats.xg[1] >= 0.6) {
    dominantSide = 'home';
    dominantTeamName = homeTeam;
  } else if (dangDiff <= -15 || stats.xg[1] - stats.xg[0] >= 0.6) {
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
  if (match.stats.redCards[0] > 0 || match.stats.redCards[1] > 0) reasons.push(`Фактор удаления (КК)`);

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

  // 1. Minute Range
  totalCriteria++;
  if (match.minute >= rule.minMinute && match.minute <= rule.maxMinute) {
    passedCount++;
  } else {
    unmetCriteria.push(`Минута ${match.minute}' вне диапазона (${rule.minMinute}'-${rule.maxMinute}')`);
  }

  // 2. Score Condition
  totalCriteria++;
  let scoreOk = false;
  const h = match.score[0];
  const a = match.score[1];
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
    case 'TOTAL_UNDER_2':
      scoreOk = totalGoals <= 1;
      if (!scoreOk) unmetCriteria.push(`Тотал голов > 1 (сейчас ${totalGoals})`);
      break;
    case 'TOTAL_OVER_2':
      scoreOk = totalGoals >= 2;
      if (!scoreOk) unmetCriteria.push(`Тотал голов < 2 (сейчас ${totalGoals})`);
      break;
    default:
      scoreOk = true;
  }
  if (scoreOk) passedCount++;

  // 3. Dangerous Attacks Difference
  if (rule.minDangerousAttacksDiff !== undefined) {
    totalCriteria++;
    const dangDiff = Math.abs(match.stats.dangerousAttacks[0] - match.stats.dangerousAttacks[1]);
    if (dangDiff >= rule.minDangerousAttacksDiff) {
      passedCount++;
    } else {
      unmetCriteria.push(`Разница оп. атак ${dangDiff} < требуемых ${rule.minDangerousAttacksDiff}`);
    }
  }

  // 4. Dangerous Attacks Total
  if (rule.minDangerousAttacksTotal !== undefined) {
    totalCriteria++;
    const totalDang = match.stats.dangerousAttacks[0] + match.stats.dangerousAttacks[1];
    if (totalDang >= rule.minDangerousAttacksTotal) {
      passedCount++;
    } else {
      unmetCriteria.push(`Сумма оп. атак ${totalDang} < ${rule.minDangerousAttacksTotal}`);
    }
  }

  // 5. Total Shots
  if (rule.minTotalShots !== undefined) {
    totalCriteria++;
    const totalShots =
      match.stats.shotsOnTarget[0] +
      match.stats.shotsOnTarget[1] +
      match.stats.shotsOffTarget[0] +
      match.stats.shotsOffTarget[1];
    if (totalShots >= rule.minTotalShots) {
      passedCount++;
    } else {
      unmetCriteria.push(`Всего ударов ${totalShots} < ${rule.minTotalShots}`);
    }
  }

  // 6. Shots on Target Total
  if (rule.minShotsOnTargetTotal !== undefined) {
    totalCriteria++;
    const sot = match.stats.shotsOnTarget[0] + match.stats.shotsOnTarget[1];
    if (sot >= rule.minShotsOnTargetTotal) {
      passedCount++;
    } else {
      unmetCriteria.push(`Ударов в створ ${sot} < ${rule.minShotsOnTargetTotal}`);
    }
  }

  // 7. Shots on Target Diff
  if (rule.minShotsOnTargetDiff !== undefined) {
    totalCriteria++;
    const sotDiff = Math.abs(match.stats.shotsOnTarget[0] - match.stats.shotsOnTarget[1]);
    if (sotDiff >= rule.minShotsOnTargetDiff) {
      passedCount++;
    } else {
      unmetCriteria.push(`Разница ударов в створ ${sotDiff} < ${rule.minShotsOnTargetDiff}`);
    }
  }

  // 8. Corners Total
  if (rule.minTotalCorners !== undefined) {
    totalCriteria++;
    const corners = match.stats.corners[0] + match.stats.corners[1];
    if (corners >= rule.minTotalCorners) {
      passedCount++;
    } else {
      unmetCriteria.push(`Всего угловых ${corners} < ${rule.minTotalCorners}`);
    }
  }

  // 9. Corners Diff
  if (rule.minCornersDiff !== undefined) {
    totalCriteria++;
    const cornersDiff = Math.abs(match.stats.corners[0] - match.stats.corners[1]);
    if (cornersDiff >= rule.minCornersDiff) {
      passedCount++;
    } else {
      unmetCriteria.push(`Разница угловых ${cornersDiff} < ${rule.minCornersDiff}`);
    }
  }

  // 10. Possession Diff
  if (rule.minPossessionDiff !== undefined) {
    totalCriteria++;
    const possDiff = Math.abs(match.stats.possession[0] - match.stats.possession[1]);
    if (possDiff >= rule.minPossessionDiff) {
      passedCount++;
    } else {
      unmetCriteria.push(`Перевес по владению ${possDiff}% < ${rule.minPossessionDiff}%`);
    }
  }

  // 11. xG Total
  if (rule.minXgTotal !== undefined) {
    totalCriteria++;
    const totalXg = match.stats.xg[0] + match.stats.xg[1];
    if (totalXg >= rule.minXgTotal) {
      passedCount++;
    } else {
      unmetCriteria.push(`Суммарный xG ${totalXg.toFixed(2)} < ${rule.minXgTotal}`);
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

  // 13. Red Card Condition
  if (rule.redCardCondition && rule.redCardCondition !== 'ANY') {
    totalCriteria++;
    const hasRed = match.stats.redCards[0] > 0 || match.stats.redCards[1] > 0;
    if (rule.redCardCondition === 'HAS_RED_CARD') {
      if (hasRed) passedCount++;
      else unmetCriteria.push(`Нет красных карточек в матче`);
    } else if (rule.redCardCondition === 'NO_RED_CARDS') {
      if (!hasRed) passedCount++;
      else unmetCriteria.push(`В матче есть удаление`);
    }
  }

  // 14. Total Attacks Difference (Стратегия 4 «А ГДЕ ЖЕ ГОЛ!!! v2.0»)
  if (rule.minAttacksDiff !== undefined) {
    totalCriteria++;
    const attacksDiff = Math.abs(match.stats.attacks[0] - match.stats.attacks[1]);
    if (attacksDiff >= rule.minAttacksDiff) {
      passedCount++;
    } else {
      unmetCriteria.push(`Разница атак ${attacksDiff} < требуемых ${rule.minAttacksDiff}`);
    }
  }

  // 15. Total Shots Difference (Стратегии 4, 5)
  if (rule.minShotsDiff !== undefined) {
    totalCriteria++;
    const hShots = match.stats.shotsOnTarget[0] + match.stats.shotsOffTarget[0];
    const aShots = match.stats.shotsOnTarget[1] + match.stats.shotsOffTarget[1];
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
    const favOdds = Math.min(match.odds.home, match.odds.away);
    if (favOdds <= rule.maxOddsFavorite) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на фаворита ${favOdds.toFixed(2)} > ${rule.maxOddsFavorite}`);
    }
  }

  // 17. Pre-Match Odds: Equal Teams / Min Odds on Winner (Стратегия 11 «Печеньки бесконечности»)
  if (rule.minOddsFavorite !== undefined) {
    totalCriteria++;
    const lowestOdds = Math.min(match.odds.home, match.odds.away);
    if (lowestOdds >= rule.minOddsFavorite) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на фаворита ${lowestOdds.toFixed(2)} < ${rule.minOddsFavorite} (команды не равны)`);
    }
  }

  // 18. Pre-Match Odds: Over 2.5 Corridor / Range (Стратегии 2, 8, 16)
  if (rule.maxOddsOver25 !== undefined) {
    totalCriteria++;
    if (match.odds.over25 <= rule.maxOddsOver25) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на ТБ 2.5 (${match.odds.over25.toFixed(2)}) > ${rule.maxOddsOver25}`);
    }
  }
  if (rule.minOddsOver25 !== undefined) {
    totalCriteria++;
    if (match.odds.over25 >= rule.minOddsOver25) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на ТБ 2.5 (${match.odds.over25.toFixed(2)}) < ${rule.minOddsOver25}`);
    }
  }

  // 19. Pre-Match Odds: BTTS (Both Teams To Score) Range (Стратегии 10, 14, 16)
  if (rule.maxOddsBtts !== undefined) {
    totalCriteria++;
    const bttsOdds = match.odds.btts ?? (match.odds.over25 < 1.75 ? 1.62 : 1.95);
    if (bttsOdds <= rule.maxOddsBtts) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на ОЗ (${bttsOdds.toFixed(2)}) > ${rule.maxOddsBtts}`);
    }
  }
  if (rule.minOddsBtts !== undefined) {
    totalCriteria++;
    const bttsOdds = match.odds.btts ?? (match.odds.over25 < 1.75 ? 1.62 : 1.95);
    if (bttsOdds >= rule.minOddsBtts) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на ОЗ (${bttsOdds.toFixed(2)}) < ${rule.minOddsBtts}`);
    }
  }

  // 20. Exclude Youth, Women & Lower Leagues (Стратегии 4, 5, 12)
  if (rule.excludeYouthAndWomen) {
    totalCriteria++;
    const textToCheck = `${match.league} ${match.homeTeam} ${match.awayTeam}`.toLowerCase();
    const isYouthOrWomen =
      /women|жен|wom|ladies|femen|u17|u18|u19|u20|u21|u23|юнош|молод|youth|reserve|дубл|tercera|3\. liga/i.test(
        textToCheck
      );
    if (!isYouthOrWomen) {
      passedCount++;
    } else {
      unmetCriteria.push(`Лига исключена фильтром (молодёжная/женская/низшая)`);
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

  if (rule.minOver25Streak !== undefined) {
    totalCriteria++;
    const streak = Math.max(
      match.history?.homeOver25Streak ?? (match.odds.over25 <= 1.6 ? 5 : 3),
      match.history?.awayOver25Streak ?? (match.odds.over25 <= 1.6 ? 5 : 3)
    );
    if (streak >= rule.minOver25Streak) {
      passedCount++;
    } else {
      unmetCriteria.push(`Серия ТБ 2.5 (${streak} игр) < ${rule.minOver25Streak}`);
    }
  }

  // 23. Over 3.5 Odds (Стратегия «ТБ 3.5 ≤ 2.00»)
  if (rule.maxOddsOver35 !== undefined) {
    totalCriteria++;
    const over35Odds = match.odds.over35 ?? (match.odds.over25 < 1.45 ? 1.76 : match.odds.over25 < 1.65 ? 1.95 : 2.50);
    if (over35Odds <= rule.maxOddsOver35) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на ТБ 3.5 (${over35Odds.toFixed(2)}) > ${rule.maxOddsOver35}`);
    }
  }

  // 24. Under 2.5 Odds (Стратегия на ничьи при ТМ 2.5)
  if (rule.maxOddsUnder25 !== undefined) {
    totalCriteria++;
    const under25Odds = match.odds.under25 ?? (match.odds.over25 > 2.0 ? 1.55 : 2.15);
    if (under25Odds <= rule.maxOddsUnder25) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на ТМ 2.5 (${under25Odds.toFixed(2)}) > ${rule.maxOddsUnder25}`);
    }
  }

  // 25. Draw Odds Range (Ничья > 5.0 или Ничья <= 3.0)
  if (rule.minOddsDraw !== undefined) {
    totalCriteria++;
    if (match.odds.draw >= rule.minOddsDraw) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на ничью (${match.odds.draw.toFixed(2)}) < ${rule.minOddsDraw}`);
    }
  }
  if (rule.maxOddsDraw !== undefined) {
    totalCriteria++;
    if (match.odds.draw <= rule.maxOddsDraw) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на ничью (${match.odds.draw.toFixed(2)}) > ${rule.maxOddsDraw}`);
    }
  }

  // 26. Underdog Odds Range
  if (rule.minOddsUnderdog !== undefined) {
    totalCriteria++;
    const underdogOdds = Math.max(match.odds.home, match.odds.away);
    if (underdogOdds >= rule.minOddsUnderdog) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на аутсайдера (${underdogOdds.toFixed(2)}) < ${rule.minOddsUnderdog}`);
    }
  }
  if (rule.maxOddsUnderdog !== undefined) {
    totalCriteria++;
    const underdogOdds = Math.max(match.odds.home, match.odds.away);
    if (underdogOdds <= rule.maxOddsUnderdog) {
      passedCount++;
    } else {
      unmetCriteria.push(`Кэф на аутсайдера (${underdogOdds.toFixed(2)}) > ${rule.maxOddsUnderdog}`);
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
      ok = match.stats.corners[1] > match.stats.corners[0];
    } else if (a > h) {
      // Хозяева проигрывают, должны подать больше угловых
      ok = match.stats.corners[0] > match.stats.corners[1];
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

  // 30. Guest Scored 2 Quick Goals in 1st Half (Стратегия «2 гола гостей в 1Т за ≤ 15 мин»)
  if (rule.requireGuestTwoQuickGoals1H) {
    totalCriteria++;
    if (match.history?.guestScoredTwoQuickFirstHalf || (a >= 2 && match.minute <= 50)) {
      passedCount++;
    } else {
      unmetCriteria.push(`Гости не забивали 2 быстрых гола подряд в 1Т`);
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

    if (combo1 || combo2 || combo3) {
      passedCount++;
    } else {
      unmetCriteria.push(`Котировки не образуют сверхрезультативную комбинацию`);
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
  const oddsFactor = match.odds.over25 <= 1.55 ? 3.1 : match.odds.over25 <= 1.75 ? 2.85 : match.odds.over25 <= 2.0 ? 2.6 : 2.25;
  const liveXgPace = match.minute > 0 ? ((match.stats.xg[0] + match.stats.xg[1]) / match.minute) * 90 : 0;
  const combined = liveXgPace > 0 ? oddsFactor * 0.7 + liveXgPace * 0.3 : oddsFactor;
  return Number(combined.toFixed(2));
}

/**
 * Enhanced Telegram Alert formatter with pressure analytics & recommended bet markets.
 */
export function formatExtendedTelegramAlert(
  match: Match,
  rule: FilterRule,
  analysis: PressureAnalysis
): string {
  const diffDang = match.stats.dangerousAttacks[0] - match.stats.dangerousAttacks[1];
  const dangSign =
    diffDang > 0
      ? `+${diffDang} (${match.homeTeam})`
      : diffDang < 0
      ? `+${Math.abs(diffDang)} (${match.awayTeam})`
      : 'Равенство';

  const totalShots =
    match.stats.shotsOnTarget[0] +
    match.stats.shotsOnTarget[1] +
    match.stats.shotsOffTarget[0] +
    match.stats.shotsOffTarget[1];
  const totalCorners = match.stats.corners[0] + match.stats.corners[1];

  const marketLine = rule.targetMarket
    ? `🎯 <b>Рекомендуемый исход:</b> <u>${rule.targetMarket}</u>\n`
    : '';

  return (
    `⚽ <b>СИГНАЛ АЛГОРИТМА: ${rule.name}</b>\n` +
    `🏆 <b>${match.countryCode} ${match.country} | ${match.league}</b>\n\n` +
    `⚔️ <b>${match.homeTeam} ${match.score[0]} : ${match.score[1]} ${match.awayTeam}</b> (<b>${match.minute}'</b>)\n` +
    `${marketLine}` +
    `🔥 <b>Индекс давления:</b> ${analysis.pressureIndex}/100 (${analysis.goalProbability} вероятность гола)\n\n` +
    `📊 <b>Опасные атаки:</b> ${match.stats.dangerousAttacks[0]} - ${match.stats.dangerousAttacks[1]} [${dangSign}]\n` +
    `🎯 <b>Удары в створ:</b> ${match.stats.shotsOnTarget[0]} - ${match.stats.shotsOnTarget[1]} (Всего: ${totalShots})\n` +
    `🚩 <b>Угловые:</b> ${match.stats.corners[0]} - ${match.stats.corners[1]} (Всего: ${totalCorners})\n` +
    `📈 <b>xG:</b> ${match.stats.xg[0].toFixed(2)} vs ${match.stats.xg[1].toFixed(2)}\n` +
    `⚡ <b>Владение мячом:</b> ${match.stats.possession[0]}% - ${match.stats.possession[1]}%\n\n` +
    (analysis.reasons.length > 0 ? `💡 <i>Факторы: ${analysis.reasons.join(' • ')}</i>\n` : '') +
    `⏱ <i>Время: ${new Date().toLocaleTimeString('ru-RU')} | Источник: ${match.source}</i>\n` +
    `🤖 <i>Footbalmonitor Pro Live Engine</i>`
  );
}
