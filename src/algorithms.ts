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

  const progressPercent = totalCriteria > 0 ? Math.round((passedCount / totalCriteria) * 100) : 100;
  const matches = unmetCriteria.length === 0;

  return { matches, progressPercent, unmetCriteria };
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
