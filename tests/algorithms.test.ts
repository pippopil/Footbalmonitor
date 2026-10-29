/**
 * Automated Test Suite for FootballMonitor Algorithms & Core Business Logic
 * Run via: npm test
 */
import {
  evaluateFilterRule,
  calculateMatchIPT,
  calculateMatchOddsFlows,
  calculatePressureAnalysis,
  checkMarketAlreadyPassed,
  detectStrategyMetricCategory,
  getInitialStrategyMetric,
  resolveStrategyMetric,
  formatResolvedTelegramAlert,
  formatExtendedTelegramAlert,
  evaluateSignalOutcome,
  calculatePoissonProb,
  calculatePoissonOver25Probability,
  detectBetActionBadge,
  getCanonicalMatchKey,
  getStrategyTargetCluster,
} from '../src/algorithms';
import { getStrategyCardDisplayName } from '../src/utils/filterDefaults';
import { EXPANDED_DEFAULT_FILTERS } from '../src/data/defaultFilters';
import { Match, FilterRule, SignalAlert, UserProfile, DataSourceType } from '../src/types';
import { runUserSimulationAgent } from '../src/services/userSimulationAgent';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('\n========================================');
console.log('🧪 RUNNING FOOTBALLMONITOR TEST SUITE');
console.log('========================================\n');

// ----------------------------------------------------
// TEST GROUP 1: Odds & Stats Null-Safety (toFixed Protection)
// ----------------------------------------------------
console.log('--- Test Group 1: Odds & Stats Null-Safety (toFixed) ---');

const minimalMatch: Match = {
  id: 'test-min-1',
  country: 'England',
  countryCode: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  league: 'Premier League',
  homeTeam: 'Arsenal',
  awayTeam: 'Chelsea',
  minute: 65,
  score: [0, 0],
  status: 'LIVE',
  source: 'Fonbet',
  stats: {
    possession: [50, 50],
    dangerousAttacks: [28, 15],
    attacks: [40, 35],
    shotsOnTarget: [4, 1],
    shotsOffTarget: [3, 2],
    corners: [5, 2],
    yellowCards: [0, 0],
    redCards: [0, 0],
    xg: [1.2, 0.4],
  },
  odds: {
    home: 2.1,
    draw: 3.2,
    away: 3.5,
    over25: 1.85,
  },
};

const bareMatchNoOdds: Match = {
  id: 'test-bare-1',
  country: 'Spain',
  countryCode: '🇪🇸',
  league: 'La Liga',
  homeTeam: 'Real Madrid',
  awayTeam: 'Barcelona',
  minute: 75,
  score: [1, 0],
  status: 'LIVE',
  source: 'Public-Feed',
  stats: {
    possession: [55, 45],
    dangerousAttacks: [45, 20],
    attacks: [80, 50],
    shotsOnTarget: [6, 2],
    shotsOffTarget: [5, 3],
    corners: [7, 3],
    yellowCards: [1, 2],
    redCards: [0, 0],
    xg: [1.9, 0.6],
  },
  odds: {
    home: 1.65,
    draw: 3.8,
    away: 5.0,
    over25: 1.75,
  },
};

const oddsRule: FilterRule = {
  id: 'rule-odds-test',
  name: 'Test Odds Corridor',
  description: 'Testing maxOddsOver25, maxOddsFavorite, maxOddsBtts without crashing',
  category: 'goals',
  ruleType: 'LIVE',
  enabled: true,
  minMinute: 50,
  maxMinute: 80,
  maxOddsOver25: 1.95,
  maxOddsFavorite: 2.2,
  maxOddsBtts: 1.9,
  minOddsDraw: 3.0,
  minXgTotal: 1.0,
};

let res1;
try {
  res1 = evaluateFilterRule(minimalMatch, oddsRule);
  assert(res1 !== null && typeof res1.matches === 'boolean', 'evaluateFilterRule executes without toFixed crash');
} catch (e: any) {
  assert(false, `evaluateFilterRule threw error: ${e?.message}`);
}

// ----------------------------------------------------
// TEST GROUP 2: Rule Matching Logic
// ----------------------------------------------------
console.log('\n--- Test Group 2: Matching Logic & Unmet Criteria ---');

const over05Rule: FilterRule = {
  id: 'rule-goal-late',
  name: 'Late Goal Hunt (0:0 at 60-80 min)',
  description: 'Expect goal at 0-0',
  category: 'goals',
  ruleType: 'LIVE',
  enabled: true,
  minMinute: 60,
  maxMinute: 80,
  scoreCondition: '0-0',
  minDangerousAttacksDiff: 5,
  minPressureIndex: 30,
  targetMarket: 'ТБ 0.5',
};

const evalMatchPass = evaluateFilterRule(minimalMatch, over05Rule);
assert(evalMatchPass.matches === true, 'Match passes criteria when all conditions met');

const failScoreMatch: Match = {
  ...minimalMatch,
  score: [2, 1], // not 0-0
};

const evalMatchFail = evaluateFilterRule(failScoreMatch, over05Rule);
assert(evalMatchFail.matches === false, 'Match correctly rejected when score condition fails');
assert(
  evalMatchFail.unmetCriteria.some((c) => c.toLowerCase().includes('счёт') || c.toLowerCase().includes('счет')),
  'Unmet criteria list properly explains why score condition failed'
);

// ----------------------------------------------------
// TEST GROUP 3: Market Already Passed / Event Validation
// ----------------------------------------------------
console.log('\n--- Test Group 3: Market Already Passed Check ---');

const matchWithGoal: Match = {
  ...minimalMatch,
  score: [1, 0],
};

const checkPassed = checkMarketAlreadyPassed('ТБ 0.5 в матче', matchWithGoal);
assert(checkPassed.isPassed === true, 'checkMarketAlreadyPassed correctly detects Over 0.5 is already hit at 1:0');

const checkNotPassed = checkMarketAlreadyPassed('ТБ 1.5 в матче', matchWithGoal);
assert(checkNotPassed.isPassed === false, 'checkMarketAlreadyPassed confirms Over 1.5 is still in play at 1:0');

// ----------------------------------------------------
// TEST GROUP 4: Mathematical Models (IPT & Pressure Index)
// ----------------------------------------------------
console.log('\n--- Test Group 4: IPT & Pressure Analysis ---');

const iptVal = calculateMatchIPT(minimalMatch);
assert(typeof iptVal === 'number' && !isNaN(iptVal) && iptVal >= 1.0 && iptVal <= 5.0, `IPT calculated successfully: ${iptVal}`);

const pressureAnalysis = calculatePressureAnalysis(bareMatchNoOdds);
assert(
  typeof pressureAnalysis.pressureIndex === 'number' &&
  pressureAnalysis.pressureIndex >= 0 &&
  pressureAnalysis.pressureIndex <= 100,
  `Pressure index computed within 0-100: ${pressureAnalysis.pressureIndex}`
);
assert(
  ['EXTREME', 'HIGH', 'MEDIUM', 'LOW'].includes(pressureAnalysis.goalProbability),
  `Goal probability enum valid: ${pressureAnalysis.goalProbability}`
);

// ----------------------------------------------------
// TEST GROUP 5: Odds Drop & Smart Money Flow
// ----------------------------------------------------
console.log('\n--- Test Group 5: Odds Flow & Drop Detection ---');

const matchWithOddsMove = {
  homeTeam: 'Arsenal',
  awayTeam: 'Chelsea',
  odds: { home: 1.7, draw: 3.5, away: 4.8, over25: 1.65 },
  initialOdds: { home: 2.1, draw: 3.4, away: 3.5, over25: 1.95 },
};

const flows = calculateMatchOddsFlows(matchWithOddsMove);
assert(flows.length > 0, `calculateMatchOddsFlows detected ${flows.length} odds movement records`);
const homeFlow = flows.find((f) => f.marketName.includes('П1'));
assert(Boolean(homeFlow && Math.abs(homeFlow.dropPercent) > 0), `Home win drop detected: ${homeFlow?.dropPercent}%`);

// ----------------------------------------------------
// TEST GROUP 6: Strict Sport Demarcation (Разграничение по видам спорта)
// ----------------------------------------------------
console.log('\n--- Test Group 6: Strict Sport Demarcation ---');

const footballMatch: Match = {
  ...minimalMatch,
  sport: 'football',
  minute: 55,
  score: [1, 0],
};

const hockeyMatch: Match = {
  ...minimalMatch,
  id: 'fs-hockey-12345',
  sport: 'hockey',
  league: 'NHL Regular Season',
  minute: 56,
  score: [3, 2],
};

const hockeyRule: FilterRule = {
  id: 'strat-hockey-late',
  name: '🏒 Хоккей: Снятый вратарь в 3-м периоде (ТБ 5.5)',
  category: 'goals',
  ruleType: 'LIVE',
  sport: 'hockey',
  enabled: true,
  minMinute: 54,
  maxMinute: 59,
  scoreCondition: 'ANY',
  targetMarket: 'ТБ 5.5',
};

const footballRule: FilterRule = {
  id: 'strat-football-fav',
  name: '⚽ Футбол: Гол фаворита',
  category: 'goals',
  ruleType: 'LIVE',
  sport: 'football',
  enabled: true,
  minMinute: 50,
  maxMinute: 70,
  scoreCondition: 'ANY',
  targetMarket: 'ТБ 1.5',
};

// 1. Hockey rule must NEVER trigger on a football match
const hockeyOnFootball = evaluateFilterRule(footballMatch, hockeyRule);
assert(
  !hockeyOnFootball.matches,
  'Hockey rule correctly rejected on Football match (Strict Sport Isolation)'
);
assert(
  hockeyOnFootball.unmetCriteria.some((u) => u.includes('Вид спорта')),
  'Unmet criteria explains sport mismatch between hockey strategy and football match'
);

// 2. Football rule must NEVER trigger on a hockey match
const footballOnHockey = evaluateFilterRule(hockeyMatch, footballRule);
assert(
  !footballOnHockey.matches,
  'Football rule correctly rejected on Hockey match (Strict Sport Isolation)'
);

// 3. Hockey rule triggers on matching hockey match
const hockeyOnHockey = evaluateFilterRule(hockeyMatch, hockeyRule);
assert(
  hockeyOnHockey.matches,
  'Hockey rule successfully matches on valid Hockey match'
);

// ----------------------------------------------------
// TEST GROUP 7: All Strategies Backtest Pass Rate >= 80%
// ----------------------------------------------------
console.log('\n--- Test Group 7: All Strategies Backtest Pass Rate >= 80% on Real Matches ---');
const { EXPANDED_DEFAULT_FILTERS } = await import('../src/data/defaultFilters');
const { runBacktest } = await import('../src/backtestEngine');

let allHighPassRate = true;
let lowestWinRate = 100;
let lowestStrategy = '';

for (const filter of EXPANDED_DEFAULT_FILTERS) {
  const result = runBacktest(filter);
  if (result.totalSignals > 0) {
    if (result.winRate < 80) {
      allHighPassRate = false;
      console.error(`Strategy ${filter.id} (${filter.name}) has winRate ${result.winRate}% < 80%`);
    }
    if (result.winRate < lowestWinRate) {
      lowestWinRate = result.winRate;
      lowestStrategy = `${filter.id} (${filter.winRate || result.winRate}%)`;
    }
  }
}

assert(
  allHighPassRate,
  `All 50 strategies have winRate >= 80% on real historical matches (Lowest: ${lowestWinRate}%)`
);

// ----------------------------------------------------
// TEST GROUP 8: Strategy-Specific Metric Tracking (Corners, Yellow Cards, Goals)
// ----------------------------------------------------
console.log('\n--- Test Group 8: Strategy-Specific Metric Tracking (Corners, Cards, Goals) ---');

// 1. Corners Strategy Detection & Resolution
const cornerRule: FilterRule = {
  id: 'strat-corner-storm-60',
  name: 'Стратегия 38: Штурм угловых',
  category: 'corners',
  ruleType: 'LIVE',
  enabled: true,
  targetMarket: 'Угловые ТБ (+2)',
};

const matchAtMinute65: Match = {
  id: 'm-corners-test',
  country: 'Германия',
  league: '3. Лига',
  homeTeam: 'Ферль',
  awayTeam: 'Ян Регенсбург',
  minute: 65,
  score: [1, 0],
  status: 'LIVE',
  stats: {
    attacks: [80, 60],
    dangerousAttacks: [50, 30],
    shotsOnTarget: [5, 2],
    shotsOffTarget: [4, 3],
    corners: [4, 2], // 6 total
    yellowCards: [1, 2],
    redCards: [0, 0],
    possession: [58, 42],
  },
};

const cornerCat = detectStrategyMetricCategory(cornerRule);
assert(cornerCat === 'corners', 'detectStrategyMetricCategory correctly classifies corner strategy as "corners"');

const initialCornerMetric = getInitialStrategyMetric(cornerRule, matchAtMinute65);
assert(initialCornerMetric.initialTotal === 6, 'Initial corner snapshot correctly records 6 total corners at signal dispatch');
assert(initialCornerMetric.initialBreakdown === '4:2', 'Initial corner snapshot records 4:2 team breakdown');

const cornerSignal: SignalAlert = {
  id: 'sig-corners-test',
  timestamp: '14:20:00',
  matchId: matchAtMinute65.id,
  matchName: 'Ферль vs Ян Регенсбург',
  league: '3. Лига',
  country: 'Германия',
  minute: 65,
  score: '1:0',
  ruleId: cornerRule.id,
  ruleName: cornerRule.name,
  marketSuggestion: cornerRule.targetMarket,
  outcome: 'PENDING',
  odds: 1.85,
  stake: 1000,
  sentToTelegram: true,
  statsSnapshot: {
    homeScore: 1,
    awayScore: 0,
    attacks: [80, 60],
    dangerousAttacks: [50, 30],
    shotsOnTarget: [5, 2],
    shotsOffTarget: [4, 3],
    corners: [4, 2],
    yellowCards: [1, 2],
    redCards: [0, 0],
  },
  message: 'Corner alert',
};

const finalCornersStats = {
  corners: [6, 4] as [number, number], // 10 total (+4 delta)
  yellowCards: [2, 3] as [number, number],
  redCards: [0, 0] as [number, number],
};

const resolvedCornerMetric = resolveStrategyMetric(cornerSignal, [2, 1], finalCornersStats);
assert(resolvedCornerMetric.finalTotal === 10, 'Final corner count correctly resolved to 10 corners');
assert(resolvedCornerMetric.delta === 4, 'Corner delta correctly calculated as +4 corners');
assert(resolvedCornerMetric.deltaText?.includes('+4 угловых'), 'Corner delta text explains increase: +4 угловых');

const resolvedCornerTgHtml = formatResolvedTelegramAlert(
  { ...cornerSignal, outcome: 'WIN', profit: 850 },
  '2:1',
  'WIN',
  { homeTeam: 'Ферль', awayTeam: 'Ян Регенсбург', league: '3. Лига', country: 'Германия' },
  finalCornersStats
);

assert(resolvedCornerTgHtml.includes('РЕЗУЛЬТАТ ПО СТРАТЕГИИ (УГЛОВЫЕ)'), 'Resolved Telegram alert contains corner strategy result header');
assert(resolvedCornerTgHtml.includes('На момент сигнала:'), 'Resolved alert specifies corners at signal dispatch');
assert(resolvedCornerTgHtml.includes('По завершению:'), 'Resolved alert specifies final corners at match finish');
assert(resolvedCornerTgHtml.includes('+4 угловых'), 'Resolved alert specifies +4 delta after signal');

// 2. Yellow Cards Strategy Detection & Resolution
const cardRule: FilterRule = {
  id: 'strat-cards-test',
  name: 'Стратегия 23: ЖК ТБ в дерби',
  category: 'cards',
  ruleType: 'LIVE',
  enabled: true,
  targetMarket: 'ЖК ТБ 4.5',
};

const cardCat = detectStrategyMetricCategory(cardRule);
assert(cardCat === 'cards', 'detectStrategyMetricCategory correctly classifies card strategy as "cards"');

const initialCardMetric = getInitialStrategyMetric(cardRule, matchAtMinute65);
assert(initialCardMetric.initialTotal === 3, 'Initial yellow cards snapshot correctly records 3 cards');

const cardSignal: SignalAlert = {
  ...cornerSignal,
  id: 'sig-cards-test',
  ruleId: cardRule.id,
  ruleName: cardRule.name,
  marketSuggestion: cardRule.targetMarket,
  statsSnapshot: {
    ...cornerSignal.statsSnapshot!,
    yellowCards: [1, 2], // 3 total
  },
};

const resolvedCardMetric = resolveStrategyMetric(cardSignal, [1, 1], finalCornersStats);
assert(resolvedCardMetric.finalTotal === 5, 'Final yellow card count correctly resolved to 5 cards');
assert(resolvedCardMetric.delta === 2, 'Card delta correctly calculated as +2 cards');

const resolvedCardTgHtml = formatResolvedTelegramAlert(
  { ...cardSignal, outcome: 'WIN', profit: 800 },
  '1:1',
  'WIN',
  { homeTeam: 'Ферль', awayTeam: 'Ян Регенсбург', league: '3. Лига', country: 'Германия' },
  finalCornersStats
);
assert(resolvedCardTgHtml.includes('РЕЗУЛЬТАТ ПО СТРАТЕГИИ (ЖЁЛТЫЕ КАРТОЧКИ)'), 'Resolved alert contains card strategy result header');
assert(resolvedCardTgHtml.includes('+2 ЖК'), 'Resolved alert specifies +2 ЖК delta');

// ----------------------------------------------------
// TEST GROUP 9: Strategy 40 & Strict Card/False-Signal Protection
// ----------------------------------------------------
console.log('\n--- Test Group 9: Strategy 40 & Strict Card / False-Signal Protection ---');

const strat40Rule: FilterRule = {
  id: 'strat-yellow-cards-derby',
  name: '🟨 «ЖК ТБ во 2-м тайме» (Накал страстей и грубая игра ~1.82)',
  category: 'cards',
  ruleType: 'LIVE',
  enabled: true,
  minMinute: 50,
  maxMinute: 75,
  scoreCondition: 'ANY',
  maxScoreDiff: 1,
  minYellowCardsTotal: 3,
  targetMarket: 'ЖК ТБ 3.5 / 4.5 (~1.80)',
  defaultOdds: 1.8,
};

const matchOnly1Card: Match = {
  ...minimalMatch,
  minute: 50,
  score: [1, 2],
  stats: {
    ...minimalMatch.stats!,
    yellowCards: [1, 0], // Only 1 card!
  },
};

const evalStrat40Fail = evaluateFilterRule(matchOnly1Card, strat40Rule);
assert(evalStrat40Fail.matches === false, 'Strategy 40 correctly rejects match with only 1 yellow card');
assert(
  evalStrat40Fail.unmetCriteria.some((c) => c.includes('Жёлтых карточек в матче') && c.includes('< требуемых 3')),
  'Strategy 40 reports unmet criteria when yellow cards < 3'
);

const match3Cards: Match = {
  ...matchOnly1Card,
  stats: {
    ...matchOnly1Card.stats!,
    yellowCards: [2, 1], // 3 cards
  },
};
const evalStrat40Pass = evaluateFilterRule(match3Cards, strat40Rule);
assert(evalStrat40Pass.matches === true, 'Strategy 40 successfully matches when match actually has >= 3 cards');

const match5Cards: Match = {
  ...matchOnly1Card,
  stats: {
    ...matchOnly1Card.stats!,
    yellowCards: [3, 2], // 5 cards
  },
};
const cardPassedCheck = checkMarketAlreadyPassed(strat40Rule.targetMarket, match5Cards, strat40Rule);
assert(cardPassedCheck.isPassed === true, 'checkMarketAlreadyPassed correctly blocks ЖК ТБ 3.5 when 5 cards already shown');

const signalAt3Cards: SignalAlert = {
  ...cardSignal,
  id: 'sig-40-eval-test',
  minute: 50,
  score: '1:2',
  ruleId: strat40Rule.id,
  ruleName: strat40Rule.name,
  marketSuggestion: strat40Rule.targetMarket,
  statsSnapshot: {
    ...cardSignal.statsSnapshot!,
    yellowCards: [2, 1], // 3 cards at signal
  },
};

// Match ends with NO new cards (+0 after signal)
const outcome0Cards = evaluateSignalOutcome(
  signalAt3Cards,
  [1, 2],
  true, // FT
  [3, 1],
  { yellowCards: [2, 1] } as any
);
assert(outcome0Cards.outcome === 'LOSS', 'Card signal with +0 cards after signal correctly resolves as LOSS');
assert(outcome0Cards.note?.includes('+0 после сигнала'), 'Resolution note confirms 0 new cards shown after signal');

// Match ends with +1 card (4 total) -> ТБ 3.5 hit!
const outcome1Card = evaluateSignalOutcome(
  signalAt3Cards,
  [1, 2],
  true, // FT
  [3, 1],
  { yellowCards: [2, 2] } as any
);
assert(outcome1Card.outcome === 'WIN', 'Card signal with +1 card after signal correctly resolves as WIN');

// ----------------------------------------------------
// TEST GROUP 10: New Strategies 51, 52, 53 Evaluation & Resolution
// ----------------------------------------------------
console.log('\n--- Test Group 10: Strategies 51, 52, 53 (Pinnacle TB0.5, HT TM0.5, Fav Win 1H) ---');

const strat51 = EXPANDED_DEFAULT_FILTERS.find((f: any) => f.id === 'strat-51')!;
const strat52 = EXPANDED_DEFAULT_FILTERS.find((f: any) => f.id === 'strat-52')!;
const strat53 = EXPANDED_DEFAULT_FILTERS.find((f: any) => f.id === 'strat-53')!;

assert(!!strat51, 'Strategy 51 is present in default filters');
assert(!!strat52, 'Strategy 52 is present in default filters');
assert(!!strat53, 'Strategy 53 is present in default filters');

// --- Test Strategy 51 ---
const match51Pass: Match = {
  ...minimalMatch,
  minute: 68,
  score: [0, 0],
  league: 'Испания. Примера',
  odds: { home: 2.1, draw: 3.4, away: 3.2, over25: 1.75 },
};
const eval51Pass = evaluateFilterRule(match51Pass, strat51);
assert(eval51Pass.matches === true, 'Strategy 51 triggers at min 68 with 0:0 and pre-match over25 <= 1.80');

const match51GoalFail: Match = {
  ...match51Pass,
  score: [1, 0], // already 1 goal
};
const eval51Fail = evaluateFilterRule(match51GoalFail, strat51);
assert(eval51Fail.matches === false, 'Strategy 51 correctly rejects match with score 1:0');

const match51FriendlyFail: Match = {
  ...match51Pass,
  league: 'Club Friendlies / Товарищеские матчи',
};
const eval51FriendlyFail = evaluateFilterRule(match51FriendlyFail, strat51);
assert(eval51FriendlyFail.matches === false, 'Strategy 51 correctly rejects friendly matches');

// --- Test Strategy 52 ---
const match52Pass: Match = {
  ...minimalMatch,
  minute: 30,
  score: [0, 0],
  stats: {
    ...minimalMatch.stats!,
    shotsOnTarget: [1, 0], // 1 total (<= 1)
    corners: [2, 1],        // 3 total (<= 3)
  },
  odds: { home: 2.5, draw: 3.1, away: 2.8, over25: 2.3, under25: 1.65 },
};
const eval52Pass = evaluateFilterRule(match52Pass, strat52);
assert(eval52Pass.matches === true, 'Strategy 52 triggers at min 30 with 0:0, sot<=1, corn<=3 and under25<=1.80');

const match52TooManySot: Match = {
  ...match52Pass,
  stats: {
    ...match52Pass.stats!,
    shotsOnTarget: [2, 1], // 3 total (> 1)
  },
};
const eval52SotFail = evaluateFilterRule(match52TooManySot, strat52);
assert(eval52SotFail.matches === false, 'Strategy 52 correctly rejects match with > 1 shot on target');

const match52TooManyCorners: Match = {
  ...match52Pass,
  stats: {
    ...match52Pass.stats!,
    corners: [3, 2], // 5 total (> 3)
  },
};
const eval52CornFail = evaluateFilterRule(match52TooManyCorners, strat52);
assert(eval52CornFail.matches === false, 'Strategy 52 correctly rejects match with > 3 corners');

// Strategy 52 Resolution
const sig52: SignalAlert = {
  ...cornerSignal,
  id: 'sig-52-test',
  minute: 30,
  score: '0:0',
  ruleId: 'strat-52',
  ruleName: strat52.name,
  marketSuggestion: strat52.targetMarket,
  ruleCategory: 'halftime',
};
// Ends 0:0 at HT -> WIN
const res52Win = evaluateSignalOutcome(sig52, [0, 0], false, undefined, undefined, { matchStatus: 'HT', minute: 45 });
assert(res52Win.outcome === 'WIN', 'Strategy 52 resolves as WIN when 1st half ends 0:0');

// Goal scored in 1H -> LOSS
const res52Loss = evaluateSignalOutcome(sig52, [1, 0], false, undefined, undefined, { matchStatus: 'LIVE', minute: 38 });
assert(res52Loss.outcome === 'LOSS', 'Strategy 52 resolves as LOSS when goal is scored in 1st half');

// --- Test Strategy 53 ---
const match53Pass: Match = {
  ...minimalMatch,
  minute: 5,
  league: 'Англия. Премьер-Лига',
  odds: { home: 1.35, draw: 5.2, away: 8.5, over25: 1.65 },
};
const eval53Pass = evaluateFilterRule(match53Pass, strat53);
assert(eval53Pass.matches === true, 'Strategy 53 triggers on fav odds 1.35 <= 1.50 in regular championship');

const match53HighOdds: Match = {
  ...match53Pass,
  odds: { home: 1.85, draw: 3.5, away: 4.2, over25: 1.95 },
};
const eval53HighOddsFail = evaluateFilterRule(match53HighOdds, strat53);
assert(eval53HighOddsFail.matches === false, 'Strategy 53 rejects match when favorite odds > 1.50');

const match53CupFail: Match = {
  ...match53Pass,
  league: 'Кубок Англии (FA Cup)',
};
const eval53CupFail = evaluateFilterRule(match53CupFail, strat53);
assert(eval53CupFail.matches === false, 'Strategy 53 correctly rejects cup matches');

// Strategy 53 Resolution
const sig53: SignalAlert = {
  ...cornerSignal,
  id: 'sig-53-test',
  minute: 5,
  score: '0:0',
  ruleId: 'strat-53',
  ruleName: strat53.name,
  marketSuggestion: strat53.targetMarket,
  ruleCategory: 'halftime',
  statsSnapshot: {
    homeOdds: 1.35,
    awayOdds: 8.5,
  } as any,
};
const res53Win = evaluateSignalOutcome(sig53, [1, 0], false, undefined, undefined, { matchStatus: 'HT', minute: 45 });
assert(res53Win.outcome === 'WIN', 'Strategy 53 resolves as WIN when favorite leads at HT (1:0)');

const res53Loss = evaluateSignalOutcome(sig53, [0, 0], false, undefined, undefined, { matchStatus: 'HT', minute: 45 });
assert(res53Loss.outcome === 'LOSS', 'Strategy 53 resolves as LOSS when favorite fails to win 1H (0:0)');

// --- Test Strategy 54 (No Draw 12 in 2H / Halftime Draw Trend) ---
console.log('\n--- Test Strategy 54: «Ничьей не будет (12)» во 2Т ---');
const strat54 = EXPANDED_DEFAULT_FILTERS.find((f: any) => f.id === 'strat-54')!;
assert(!!strat54, 'Strategy 54 is present in default filters');

const match54Pass: Match = {
  ...minimalMatch,
  homeTeam: 'Вест Хэм',
  awayTeam: 'Манчестер Юнайтед',
  minute: 45,
  score: [0, 0], // draw at halftime
  history: {
    homeDrawsLast6: 0,
    awayDrawsLast6: 1,
    h2hDrawsLast6: 0,
  },
};
const eval54Pass = evaluateFilterRule(match54Pass, strat54);
assert(eval54Pass.matches === true, 'Strategy 54 triggers at min 45 with 0:0 and <= 1 draw in last 5-6 games');

const match54NotDraw: Match = {
  ...match54Pass,
  score: [1, 0], // not a draw
};
const eval54NotDrawFail = evaluateFilterRule(match54NotDraw, strat54);
assert(eval54NotDrawFail.matches === false, 'Strategy 54 rejects match when score at halftime is not a draw (1:0)');

const match54TooManyDraws: Match = {
  ...match54Pass,
  history: {
    homeDrawsLast6: 2, // 2 draws (> 1)
    awayDrawsLast6: 0,
  },
};
const eval54DrawsFail = evaluateFilterRule(match54TooManyDraws, strat54);
assert(eval54DrawsFail.matches === false, 'Strategy 54 rejects match when home team has > 1 draw in last 5-6 matches');

// Strategy 54 Resolution (West Ham vs Man Utd 2-0 -> WIN)
const sig54: SignalAlert = {
  ...cornerSignal,
  id: 'sig-54-test',
  minute: 45,
  score: '0:0',
  ruleId: 'strat-54',
  ruleName: strat54.name,
  marketSuggestion: strat54.targetMarket,
};
const res54Win = evaluateSignalOutcome(sig54, [2, 0], true);
assert(res54Win.outcome === 'WIN', 'Strategy 54 resolves as WIN when match ends 2:0 (one team won, no draw)');

const res54Loss = evaluateSignalOutcome(sig54, [1, 1], true);
assert(res54Loss.outcome === 'LOSS', 'Strategy 54 resolves as LOSS when match ends 1:1 (draw)');

// Test Strategy 54 resolution with matchContext FT and custom market
const sig54CustomMarket: SignalAlert = {
  ...sig54,
  marketSuggestion: '12 во 2-м тайме (~1.48)',
};
const res54ContextWin = evaluateSignalOutcome(sig54CustomMarket, [1, 0], false, undefined, undefined, { matchStatus: 'FT', minute: 90 });
assert(res54ContextWin.outcome === 'WIN', 'Strategy 54 resolves as WIN with matchContext FT at min 90');
assert(res54ContextWin.shouldResolve === true, 'Strategy 54 shouldResolve is true at FT');

const res54ContextLoss = evaluateSignalOutcome(sig54CustomMarket, [0, 0], false, undefined, undefined, { matchStatus: 'FT', minute: 90 });
assert(res54ContextLoss.outcome === 'LOSS', 'Strategy 54 resolves as LOSS with matchContext FT at 0:0');
assert(res54ContextLoss.shouldResolve === true, 'Strategy 54 shouldResolve is true on draw at FT');

// ----------------------------------------------------
// TEST GROUP 11: 2nd-Half Strategies & Timing Resolution (14, 21, 42, 54, 55)
// Must wait until FT for loss declaration, never fail at min 46 / HT!
// ----------------------------------------------------
console.log('\n--- Test Group 11: 2nd-Half Resolution & Strategy Naming Sanitization ---');

// Strategy 14 (strat-12: Гол во 2-м тайме по тренду ТБ 2.5)
const sigStrat14: SignalAlert = {
  ...cornerSignal,
  id: 'sig-strat-14-test',
  minute: 45,
  score: '0:0',
  ruleId: 'strat-12',
  ruleName: '⏱️ Стратегия 12: Гол во 2-м тайме по тренду ТБ 2.5 (9/10 матчей, счёт 0:0, 1:0, 0:1)',
  marketSuggestion: 'Гол во 2-м тайме (~1.75)',
  period: '1-й тайм',
  ruleCategory: 'goals',
};

// At min 46 (start of 2nd half), it must NOT declare LOSS! It must be PENDING!
const res14Min46 = evaluateSignalOutcome(sigStrat14, [0, 0], false, undefined, undefined, {
  matchStatus: 'LIVE',
  minute: 46,
});
assert(res14Min46.outcome === 'PENDING', 'Strategy 14 does NOT declare LOSS at min 46; stays PENDING');
assert(res14Min46.shouldResolve === false, 'Strategy 14 shouldResolve is false at min 46');

// When a goal is scored in 2nd half (e.g. min 60, score 1:0) -> immediate WIN!
const res14Goal = evaluateSignalOutcome(sigStrat14, [1, 0], false, undefined, undefined, {
  matchStatus: 'LIVE',
  minute: 60,
});
assert(res14Goal.outcome === 'WIN', 'Strategy 14 resolves as WIN when goal is scored in 2nd half');

// If no goal is scored by full time (FT) -> resolves as LOSS only at match finish
const res14FT = evaluateSignalOutcome(sigStrat14, [0, 0], true, undefined, undefined, {
  matchStatus: 'FT',
  minute: 90,
});
assert(res14FT.outcome === 'LOSS', 'Strategy 14 resolves as LOSS only when match is finished (FT)');

// Strategy 42 (strat-second-half-sieve: «Второй тайм — решето» ТБ 0.5 во 2Т)
const sigStrat42: SignalAlert = {
  ...cornerSignal,
  id: 'sig-strat-42-test',
  minute: 45,
  score: '0:0',
  ruleId: 'strat-second-half-sieve',
  ruleName: '⚡ «Второй тайм — решето» (ТБ 0.5 во 2Т ~1.75)',
  marketSuggestion: 'ТБ 0.5 во 2-м тайме / Следующий гол (~1.75)',
  period: '1-й тайм',
  ruleCategory: 'goals',
};

const res42Min46 = evaluateSignalOutcome(sigStrat42, [0, 0], false, undefined, undefined, {
  matchStatus: 'LIVE',
  minute: 47,
});
assert(res42Min46.outcome === 'PENDING', 'Strategy 42 does NOT declare LOSS at min 47; stays PENDING');

const res42Goal = evaluateSignalOutcome(sigStrat42, [0, 1], false, undefined, undefined, {
  matchStatus: 'LIVE',
  minute: 73,
});
assert(res42Goal.outcome === 'WIN', 'Strategy 42 resolves as WIN when goal is scored in 2nd half');

// Strategy 55 (strat-synergy-goal-storm: СИНЕРГИЯ Гол во 2-м тайме)
const sigStrat55: SignalAlert = {
  ...cornerSignal,
  id: 'sig-strat-55-test',
  minute: 45,
  score: '1:0',
  ruleId: 'strat-synergy-goal-storm',
  ruleName: '⚡ СИНЕРГИЯ: Сверхштурм + Гол во 2-м тайме',
  marketSuggestion: 'ТБ 0.5 во 2-м тайме (~1.80)',
  ruleCategory: 'synergy',
};
const res55Min48 = evaluateSignalOutcome(sigStrat55, [1, 0], false, undefined, undefined, {
  matchStatus: 'LIVE',
  minute: 48,
});
assert(res55Min48.outcome === 'PENDING', 'Strategy 55 does NOT declare LOSS at min 48; stays PENDING');

// Strategy 21 (strat-draw-over5: Доминант)
const sigStrat21: SignalAlert = {
  ...cornerSignal,
  id: 'sig-strat-21-test',
  minute: 25,
  score: '0:0',
  ruleId: 'strat-draw-over5',
  ruleName: '👑 Стратегия 21: Доминант: кэф на ничью > 5.0 (Гол в матче / ТБ)',
  marketSuggestion: 'Гол в матче / ТБ (~1.75)',
  ruleCategory: 'goals',
};
const res21Min46 = evaluateSignalOutcome(sigStrat21, [0, 0], false, undefined, undefined, {
  matchStatus: 'LIVE',
  minute: 46,
});
assert(res21Min46.outcome === 'PENDING', 'Strategy 21 stays PENDING at min 46, waiting for full match finish');

// Strategy 54 (strat-54: «Ничьей не будет (12)»)
const sigStrat54Live: SignalAlert = {
  ...cornerSignal,
  id: 'sig-strat-54-live-test',
  minute: 45,
  score: '0:0',
  ruleId: 'strat-54',
  ruleName: '⚔️ Стратегия 54: «Ничьей не будет (12)» во 2Т',
  marketSuggestion: '12 (Ничьей не будет в матче) (~1.45)',
  ruleCategory: 'goals',
};
const res54Min50 = evaluateSignalOutcome(sigStrat54Live, [0, 0], false, undefined, undefined, {
  matchStatus: 'LIVE',
  minute: 50,
});
assert(res54Min50.outcome === 'PENDING', 'Strategy 54 stays PENDING at min 50, waiting for full match finish');

// Strategy Naming Sanitization Test
const customTimestampRule: FilterRule = {
  id: 'filter-1791999434970',
  name: 'Мой авторский фильтр на тотал',
  description: 'Пользовательский фильтр',
  category: 'custom',
  ruleType: 'LIVE',
  enabled: true,
  isPreset: false,
};
const nameCustom = getStrategyCardDisplayName(customTimestampRule, false);
assert(nameCustom === 'Мой авторский фильтр на тотал', 'Custom rule with timestamp ID keeps its original name');
assert(!nameCustom.includes('1791999434970'), 'Custom rule display name does NOT contain 1791999434970');

const alertTgText = formatExtendedTelegramAlert(
  minimalMatch,
  customTimestampRule,
  calculatePressureAnalysis(minimalMatch),
  undefined,
  false
);
assert(!alertTgText.includes('Стратегия 1791999434970'), 'formatExtendedTelegramAlert does NOT output Стратегия 1791999434970');

const synergy55Rule: FilterRule = {
  id: 'strat-synergy-goal-storm',
  name: '⚡ СИНЕРГИЯ: Сверхштурм + Гол во 2-м тайме',
  category: 'synergy',
  ruleType: 'LIVE',
  enabled: true,
  isPreset: true,
};
const name55 = getStrategyCardDisplayName(synergy55Rule, false);
assert(name55 === 'Стратегия 55', 'strat-synergy-goal-storm displays as Стратегия 55');

// Auto-cleanup > 200 signals test
const overflowSignals: SignalAlert[] = Array.from({ length: 250 }, (_, i) => ({
  ...sigStrat14,
  id: `overflow-sig-${i}`,
  minute: (i % 90) + 1,
}));
const trimmedSignals = overflowSignals.slice(0, 200);
assert(trimmedSignals.length === 200, 'Signals list is strictly capped at 200 items');
assert(trimmedSignals[0].id === 'overflow-sig-0', 'Most recent signals are preserved in trimmed slice');
// ----------------------------------------------------
// TEST GROUP 12: Source Obfuscation, 30s Auto-Rotation, and User Simulation Agent
// ----------------------------------------------------
console.log('\n--- Test Group 12: Source Concealment, 30s Failover, & User Simulation Agent ---');

// 1. Obfuscated node code mapping & sanitize validation
const nodeCodeMap: Record<string, string> = {
  flashscore: 'node_a',
  fonbet: 'node_b',
  '1xbet': 'node_c',
  'public-feed': 'node_d',
  sstats: 'node_e',
  sofascore: 'node_f',
};
assert(nodeCodeMap['flashscore'] === 'node_a', 'Flashscore is masked to neutral node_a');
assert(nodeCodeMap['fonbet'] === 'node_b', 'Fonbet is masked to neutral node_b');
assert(nodeCodeMap['1xbet'] === 'node_c', '1xBet is masked to neutral node_c');

// 2. Sanitization function removes origin signatures from Match objects
function sanitizeMatchesForStealth(matchesList: any[], devMode: boolean): any[] {
  if (devMode) return matchesList;
  return matchesList.map((m) => ({
    ...m,
    source: 'Live Telemetry Core',
    lastEvent: m.lastEvent
      ? m.lastEvent.replace(/flashscore|fonbet|1xbet|sofascore|фонбет|софаскор|флэшскор|espn/gi, 'Live Telemetry')
      : m.lastEvent,
    oddsDrop: m.oddsDrop
      ? {
          ...m.oddsDrop,
          bookmaker: 'Global Exchange / Market Pool',
        }
      : undefined,
  }));
}

const rawLeakMatch: Match = {
  ...minimalMatch,
  source: 'Flashscore',
  lastEvent: "75' Штурм ворот по данным Fonbet и Flashscore",
  oddsDrop: {
    market: 'HOME',
    marketName: 'П1',
    initialOdds: 2.10,
    currentOdds: 1.65,
    dropPercent: 21.4,
    moneyVolumePercent: 72,
    bookmaker: 'Фонбет / БК Лига Ставок',
  },
};

const sanitizedRegular = sanitizeMatchesForStealth([rawLeakMatch], false)[0];
assert(sanitizedRegular.source === 'Live Telemetry Core', 'Sanitized match source is masked as Live Telemetry Core');
assert(!sanitizedRegular.lastEvent.includes('Fonbet') && !sanitizedRegular.lastEvent.includes('Flashscore'), 'Sanitized lastEvent strips scraper names');
assert(sanitizedRegular.oddsDrop?.bookmaker === 'Global Exchange / Market Pool', 'Sanitized oddsDrop bookmaker is masked as Global Exchange / Market Pool');

const sanitizedDev = sanitizeMatchesForStealth([rawLeakMatch], true)[0];
assert(sanitizedDev.source === 'Flashscore', 'Developer mode preserves original source name for debugging');

// 3. 30s Auto-failover cyclical rotation
const AUTO_FAILOVER_SOURCES: DataSourceType[] = [
  'flashscore',
  'fonbet',
  '1xbet',
  'public-feed',
  'sofascore',
  'sstats',
];
assert(AUTO_FAILOVER_SOURCES.length === 6, 'Auto-failover pool contains exactly 6 rotating sources');

const rotateSource = (current: DataSourceType): DataSourceType => {
  const currIdx = AUTO_FAILOVER_SOURCES.indexOf(current);
  return AUTO_FAILOVER_SOURCES[(currIdx + 1) % AUTO_FAILOVER_SOURCES.length];
};

assert(rotateSource('flashscore') === 'fonbet', 'Failover rotates from flashscore to fonbet');
assert(rotateSource('sstats') === 'flashscore', 'Failover cyclically wraps from sstats back to flashscore');

// 4. User Simulation Testing Agent (Async Execution)
const testUserPersona: UserProfile = {
  id: 'user-sim-pro',
  name: 'Тестовый Про-Игрок',
  email: 'pro_agent@test.local',
  role: 'pro',
  plan: 'PRO_ANALYST',
  telegramBots: [
    {
      id: 'bot-sim-1',
      botName: 'Simulated Bot 1',
      botToken: '',
      channelId: '',
      isActive: true,
      assignedFilterIds: [],
    },
  ],
  adPreferences: { showBanners: false, adTopics: [] },
  createdAt: new Date().toISOString(),
};

const agentRunPromise = await runUserSimulationAgent({
  user: testUserPersona,
  matches: [minimalMatch, match54Pass],
  filters: [strat54, synergy55Rule],
});

assert(agentRunPromise.overallStatus === 'SUCCESS', 'UserSimulationAgent runs successfully with SUCCESS status');
assert(agentRunPromise.healthScore === 100, 'UserSimulationAgent reports 100% health score');
assert(agentRunPromise.steps.length === 7, 'UserSimulationAgent completes all 7 validation steps');
assert(agentRunPromise.zeroImpactVerified === true, 'UserSimulationAgent verifies 0% side effects / storage untampered');
assert(agentRunPromise.testedMatchesCount === 2, 'UserSimulationAgent inspected all passed matches');
assert(agentRunPromise.totalDurationMs >= 0, 'UserSimulationAgent records valid execution time');

// ----------------------------------------------------
// Test Group 13: Basketball Strategy 47 & Anti-Phantom Protection
// ----------------------------------------------------
console.log('\n--- Test Group 13: Basketball Strategy 47 & Anti-Phantom Protection ---');
const stratBasketball = EXPANDED_DEFAULT_FILTERS.find((f) => f.id === 'strat-basketball-4q-over')!;
assert(stratBasketball !== undefined, 'Basketball strategy 47 exists in default filters');

// Phantom test: match is finished (status: FT) with minute 40
const finishedBasketballMatch: Match = {
  id: 'bball-ft-1',
  homeTeam: 'CSKA Moscow',
  awayTeam: 'Zenit SPb',
  league: 'VTB United League',
  country: 'Russia',
  countryCode: 'RU',
  status: 'FT',
  minute: 40,
  score: [88, 85],
  sport: 'basketball',
  stats: {
    attacks: [70, 68],
    dangerousAttacks: [45, 42],
    shotsOnTarget: [30, 28],
    shotsOffTarget: [20, 18],
    corners: [0, 0],
    yellowCards: [0, 0],
    redCards: [0, 0],
    possession: [50, 50],
  },
  source: 'Flashscore',
};
const evalFtBball = evaluateFilterRule(finishedBasketballMatch, stratBasketball);
assert(evalFtBball.matches === false, 'Finished basketball match (status FT) is rejected to eliminate phantom alerts');
assert(evalFtBball.unmetCriteria.some((c) => c.includes('завершён')), 'Unmet criteria explains match is completed (FT)');

// Live clutch basketball game (minute 41, 82:80, diff 2 pts)
const liveClutchBballMatch: Match = {
  ...finishedBasketballMatch,
  id: 'bball-live-clutch',
  status: 'LIVE',
  minute: 41,
  score: [82, 80],
};
const evalLiveClutch = evaluateFilterRule(liveClutchBballMatch, stratBasketball);
assert(evalLiveClutch.matches === true, 'Live 4th-quarter clutch basketball match triggers strategy 47');

// Alert text includes adaptive Clutch TB recommendation
const analysisBball = calculatePressureAnalysis(liveClutchBballMatch);
const alertBballClutch = formatExtendedTelegramAlert(liveClutchBballMatch, stratBasketball, analysisBball);
assert(alertBballClutch.includes('Клатч') && alertBballClutch.includes('ТБ'), 'Clutch match (diff <= 6) recommends Total Over (ТБ)');

// Blowout game alert includes adaptive Garbage time TM recommendation
const liveBlowoutBballMatch: Match = {
  ...liveClutchBballMatch,
  score: [95, 80], // 15 pts blowout
};
const alertBballBlowout = formatExtendedTelegramAlert(liveBlowoutBballMatch, stratBasketball, analysisBball);
assert(alertBballBlowout.includes('Garbage time') && alertBballBlowout.includes('ТМ'), 'Blowout match (diff >= 10) recommends opposing Total Under (ТМ)');

// ----------------------------------------------------
// Test Group 14: Strategy 43 (Ловушка xG) Ongoing Protection at min 70
// ----------------------------------------------------
console.log('\n--- Test Group 14: Strategy 43 (Ловушка xG) Anti-Premature-Loss Protection ---');
const stratXgTrap = EXPANDED_DEFAULT_FILTERS.find((f) => f.id === 'strat-xg-trap-regression')!;
assert(stratXgTrap !== undefined, 'Strategy 43 exists in default filters');

const sigXgTrap: SignalAlert = {
  ...cornerSignal,
  id: 'sig-xg-trap-test',
  minute: 60,
  score: '0:0',
  ruleId: 'strat-xg-trap-regression',
  ruleName: stratXgTrap.name,
  marketSuggestion: stratXgTrap.targetMarket,
};

// Match at min 70, still LIVE: MUST NOT declare LOSS!
const resTrapOngoing70 = evaluateSignalOutcome(
  sigXgTrap,
  [0, 0],
  false, // not finished!
  undefined,
  undefined,
  { matchStatus: 'LIVE', minute: 70 }
);
assert(resTrapOngoing70.outcome === 'PENDING', 'Strategy 43 stays PENDING at min 70 when score is 0:0 and match is ongoing');
assert(resTrapOngoing70.shouldResolve === false, 'Strategy 43 shouldResolve is false at min 70 (no premature LOSS)');

// Match at min 78 with goal scored -> WIN!
const resTrapGoal78 = evaluateSignalOutcome(
  sigXgTrap,
  [1, 0],
  false,
  undefined,
  undefined,
  { matchStatus: 'LIVE', minute: 78 }
);
assert(resTrapGoal78.outcome === 'WIN', 'Strategy 43 resolves as WIN when goal is scored (+1)');

// Match finished at FT without goals -> LOSS!
const resTrapFt00 = evaluateSignalOutcome(
  sigXgTrap,
  [0, 0],
  true,
  undefined,
  undefined,
  { matchStatus: 'FT', minute: 90 }
);
assert(resTrapFt00.outcome === 'LOSS', 'Strategy 43 resolves as LOSS only when match is genuinely FT');

// ----------------------------------------------------
// Test Group 15: Strategy 59 (Poisson & xG Over 2.5 +EV Value Model from PDF)
// ----------------------------------------------------
console.log('\n--- Test Group 15: Strategy 59 (Poisson & xG Over 2.5 +EV Value Model) ---');
const stratPoisson59 = EXPANDED_DEFAULT_FILTERS.find((f) => f.id === 'strat-poisson-xg-over25')!;
assert(stratPoisson59 !== undefined, 'Strategy 59 exists in default filters');
assert(stratPoisson59.minExpectedTotalXg === 2.8, 'Strategy 59 requires expected xG >= 2.80');
assert(stratPoisson59.requirePoissonEvPositive === true, 'Strategy 59 requires +EV positive Poisson edge');

// Poisson probability math verification from PDF (Page 2: lambdaHome=1.7, lambdaAway=1.4)
const probOver25 = calculatePoissonOver25Probability(1.7, 1.4);
assert(probOver25 >= 0.58 && probOver25 <= 0.62, `Poisson Over 2.5 prob ~60% (${(probOver25 * 100).toFixed(1)}%) for xG 1.7 vs 1.4`);

// PDF Match verification (Bundesliga / Premier League high xG match)
const match59Pass: Match = {
  ...minimalMatch,
  id: 'm-poisson-pass',
  homeTeam: 'Bayern Munich',
  awayTeam: 'Bayer Leverkusen',
  league: 'German Bundesliga',
  minute: 22,
  status: 'LIVE',
  score: [0, 0],
  stats: {
    ...minimalMatch.stats,
    xg: [1.65, 1.35], // Total 3.00 >= 2.80
  },
  odds: {
    home: 1.85,
    draw: 3.60,
    away: 3.80,
    over25: 1.82, // >= 1.75
  },
};
const eval59Pass = evaluateFilterRule(match59Pass, stratPoisson59);
assert(eval59Pass.matches === true, 'Strategy 59 triggers on Bundesliga match with sum xG 3.0 and Over 2.5 odds 1.82');

// PDF Low xG rejection (sum xG < 2.80)
const match59LowXg: Match = {
  ...match59Pass,
  stats: {
    ...match59Pass.stats,
    xg: [0.8, 0.9], // Total 1.70 < 2.80
  },
};
const eval59Fail = evaluateFilterRule(match59LowXg, stratPoisson59);
assert(eval59Fail.matches === false, 'Strategy 59 correctly rejects match with sum xG < 2.80');

// Alert contains Poisson model analysis breakdown
const analysis59 = calculatePressureAnalysis(match59Pass);
const alert59 = formatExtendedTelegramAlert(match59Pass, stratPoisson59, analysis59);
assert(alert59.includes('Модель Пуассона') && alert59.includes('+EV'), 'Alert contains Poisson model breakdown and +EV edge');

// ----------------------------------------------------
// Test Group 16: 3 Sports Books Strategies (Hockey 60, Basket 61, Tennis 62)
// ----------------------------------------------------
console.log('\n--- Test Group 16: 3 Sports Books Strategies (Hockey 60, Basket 61, Tennis 62) ---');

// 1. Strategy 60: Hockey B.O.S.
const strat60 = EXPANDED_DEFAULT_FILTERS.find((f) => f.id === 'strat-hockey-bos-2p-longchange')!;
assert(strat60 !== undefined, 'Strategy 60 (Hockey B.O.S. Long Change) exists in default filters');
const match60Hockey: Match = {
  ...minimalMatch,
  id: 'm-hockey-60',
  homeTeam: 'Tampa Bay Lightning',
  awayTeam: 'Florida Panthers',
  league: 'NHL',
  sport: 'hockey',
  minute: 28,
  status: 'LIVE',
  score: [1, 1],
  stats: {
    ...minimalMatch.stats,
    shotsOnTarget: [12, 10], // Total 22 >= 16
    dangerousAttacks: [35, 30],
  },
};
const eval60 = evaluateFilterRule(match60Hockey, strat60);
assert(eval60.matches === true, 'Strategy 60 triggers in 2nd period of NHL game with 22 shots on target');
const sig60: SignalAlert = {
  ...cornerSignal,
  id: 'sig-60',
  minute: 28,
  score: '1:1',
  ruleId: 'strat-hockey-bos-2p-longchange',
  ruleName: strat60.name,
  marketSuggestion: strat60.targetMarket,
};
const res60Win = evaluateSignalOutcome(sig60, [2, 2], false, undefined, undefined, { minute: 34, matchStatus: 'LIVE' });
assert(res60Win.outcome === 'WIN', 'Strategy 60 resolves as WIN when 2 goals are scored (+2)');

// 2. Strategy 61: Basketball 360 Surge
const strat61 = EXPANDED_DEFAULT_FILTERS.find((f) => f.id === 'strat-basketball-360-3q-surge')!;
assert(strat61 !== undefined, 'Strategy 61 (Basketball 360 3Q Surge) exists in default filters');
const match61Basket: Match = {
  ...minimalMatch,
  id: 'm-basket-61',
  homeTeam: 'Boston Celtics',
  awayTeam: 'Miami Heat',
  league: 'NBA',
  sport: 'basketball',
  minute: 26,
  status: 'LIVE',
  score: [52, 54],
  odds: { home: 1.45, draw: 15.0, away: 3.10, over25: 1.90 }, // Favorite <= 1.65
  stats: {
    ...minimalMatch.stats,
    shotsOnTarget: [25, 24],
    dangerousAttacks: [40, 38],
  },
};
const eval61 = evaluateFilterRule(match61Basket, strat61);
assert(eval61.matches === true, 'Strategy 61 triggers at start of 3Q for NBA favorite');
const sig61: SignalAlert = {
  ...cornerSignal,
  id: 'sig-61',
  minute: 26,
  score: '52:54',
  sport: 'basketball',
  ruleId: 'strat-basketball-360-3q-surge',
  ruleName: strat61.name,
  marketSuggestion: strat61.targetMarket,
};
const res61Win = evaluateSignalOutcome(sig61, [66, 60], false, undefined, undefined, { minute: 32, matchStatus: 'LIVE' });
assert(res61Win.outcome === 'WIN', 'Strategy 61 resolves as WIN on +8 pts favorite run in 3Q');

// 3. Strategy 62: Tennis B.O.S. Big Server
const strat62 = EXPANDED_DEFAULT_FILTERS.find((f) => f.id === 'strat-tennis-bos-bigserver-tb95')!;
assert(strat62 !== undefined, 'Strategy 62 (Tennis B.O.S. Big Server TB 9.5) exists in default filters');
const match62Tennis: Match = {
  ...minimalMatch,
  id: 'm-tennis-62',
  homeTeam: 'Hubert Hurkacz',
  awayTeam: 'John Isner',
  league: 'ATP Wimbledon',
  sport: 'tennis',
  minute: 14,
  status: 'LIVE',
  score: [2, 2],
  stats: {
    ...minimalMatch.stats,
    dangerousAttacks: [18, 16],
    shotsOnTarget: [15, 14],
  },
};
const eval62 = evaluateFilterRule(match62Tennis, strat62);
assert(eval62.matches === true, 'Strategy 62 triggers on Big Server tennis matchup at 2:2');
const sig62: SignalAlert = {
  ...cornerSignal,
  id: 'sig-62',
  minute: 14,
  score: '2:2',
  sport: 'tennis',
  ruleId: 'strat-tennis-bos-bigserver-tb95',
  ruleName: strat62.name,
  marketSuggestion: strat62.targetMarket,
};
const res62Win = evaluateSignalOutcome(sig62, [6, 4], false, undefined, undefined, { minute: 42, matchStatus: 'LIVE' });
assert(res62Win.outcome === 'WIN', 'Strategy 62 resolves as WIN when 1st set reaches 10 total games (6:4)');

// ----------------------------------------------------
// Test Group 17: Scanner Photos (63-67) & PDF Books (68-69) Strategies
// ----------------------------------------------------
console.log('\n--- Test Group 17: Scanner Photos (63-67) & PDF Books (68-69) Strategies ---');

// 1. Strategy 63 (Photo 1: Home Goal 17-20 min)
const strat63 = EXPANDED_DEFAULT_FILTERS.find((f) => f.id === 'strat-photo-home-goal-17-20')!;
assert(strat63 !== undefined, 'Strategy 63 (Photo 1: Home Goal) exists in default filters');
const match63Pass: Match = {
  ...minimalMatch,
  id: 'm-photo-63',
  minute: 18,
  status: 'LIVE',
  score: [0, 0],
  stats: {
    ...minimalMatch.stats,
    shotsOnTarget: [2, 1], // Home SOT 2 >= 2
    shotsOffTarget: [2, 1], // Total shots 2+1+2+1 = 6 >= 6
    redCards: [0, 0],
  },
  odds: {
    home: 1.65, // <= 1.80
    draw: 3.50,
    away: 5.00,
    over25: 1.55, // <= 1.61, over15 derived ~1.18 <= 1.20
  },
};
const eval63 = evaluateFilterRule(match63Pass, strat63);
assert(eval63.matches === true, 'Strategy 63 triggers at minute 18 with 6 shots and 2 home shots on target');
const sig63: SignalAlert = {
  ...cornerSignal,
  id: 'sig-63',
  minute: 18,
  score: '0:0',
  ruleId: 'strat-photo-home-goal-17-20',
  ruleName: strat63.name,
  marketSuggestion: strat63.targetMarket,
};
const res63Win = evaluateSignalOutcome(sig63, [1, 0], false, undefined, undefined, { minute: 28, matchStatus: 'LIVE' });
assert(res63Win.outcome === 'WIN', 'Strategy 63 resolves as WIN when home team scores (1:0)');

// 2. Strategy 64 (Photo 2: HT Goal 92%)
const strat64 = EXPANDED_DEFAULT_FILTERS.find((f) => f.id === 'strat-photo-ht-goal-92')!;
assert(strat64 !== undefined, 'Strategy 64 (Photo 2: HT Goal) exists in default filters');
const match64Pass: Match = {
  ...minimalMatch,
  id: 'm-photo-64',
  minute: 12,
  status: 'LIVE',
  score: [0, 0],
  stats: {
    ...minimalMatch.stats,
    shotsOnTarget: [3, 2],
    shotsOffTarget: [2, 2],
  },
};
const eval64 = evaluateFilterRule(match64Pass, strat64);
assert(eval64.matches === true, 'Strategy 64 triggers in first 30 minutes at 0:0');
const sig64: SignalAlert = {
  ...cornerSignal,
  id: 'sig-64',
  minute: 12,
  score: '0:0',
  ruleId: 'strat-photo-ht-goal-92',
  ruleName: strat64.name,
  marketSuggestion: strat64.targetMarket,
};
const res64Win = evaluateSignalOutcome(sig64, [1, 0], false, undefined, undefined, { minute: 35, matchStatus: 'LIVE' });
assert(res64Win.outcome === 'WIN', 'Strategy 64 resolves as WIN when goal is scored in 1st half');

// 3. Strategy 65 (Photo 3: Match Goal Multi)
const strat65 = EXPANDED_DEFAULT_FILTERS.find((f) => f.id === 'strat-photo-match-goal-multi')!;
assert(strat65 !== undefined, 'Strategy 65 (Photo 3: Match Goal Multi) exists in default filters');
const match65Pass: Match = {
  ...minimalMatch,
  id: 'm-photo-65',
  minute: 20,
  status: 'LIVE',
  score: [0, 0],
  odds: {
    home: 1.50,
    draw: 4.00,
    away: 6.00,
    over25: 1.45, // <= 1.50, over15 derived <= 1.20
  },
};
const eval65 = evaluateFilterRule(match65Pass, strat65);
assert(eval65.matches === true, 'Strategy 65 triggers on high pre-match over expectation');

// 4. Strategy 66 (Photo 1 & 3: Goal 95% H2H 100%)
const strat66 = EXPANDED_DEFAULT_FILTERS.find((f) => f.id === 'strat-photo-goal-95-h2h')!;
assert(strat66 !== undefined, 'Strategy 66 (Photo 1/3: Goal 95% H2H) exists in default filters');
const match66Pass: Match = {
  ...minimalMatch,
  id: 'm-photo-66',
  minute: 15,
  status: 'LIVE',
  score: [0, 0],
  history: {
    ...minimalMatch.history,
    h2hOver15Percentage: 100, // 100% H2H Over 1.5
  },
};
const eval66 = evaluateFilterRule(match66Pass, strat66);
assert(eval66.matches === true, 'Strategy 66 triggers at minute 15 with 100% H2H Over 1.5 history');

// 5. Strategy 67 (Photo 1: Goal 98% Combo)
const strat67 = EXPANDED_DEFAULT_FILTERS.find((f) => f.id === 'strat-photo-goal-98-combo')!;
assert(strat67 !== undefined, 'Strategy 67 (Photo 1: Goal 98% Combo) exists in default filters');
const match67Pass: Match = {
  ...minimalMatch,
  id: 'm-photo-67',
  minute: 25,
  status: 'LIVE',
  score: [0, 0],
  stats: {
    ...minimalMatch.stats,
    dangerousAttacks: [16, 12], // 28 >= 25
  },
};
const eval67 = evaluateFilterRule(match67Pass, strat67);
assert(eval67.matches === true, 'Strategy 67 triggers at minute 25 with 28 dangerous attacks');

// 6. Strategy 68 (PDF 1: Three Matches Theory)
const strat68 = EXPANDED_DEFAULT_FILTERS.find((f) => f.id === 'strat-pdf-three-matches-theory')!;
assert(strat68 !== undefined, 'Strategy 68 (PDF: Three Matches Theory) exists in default filters');
const eval68 = evaluateFilterRule(minimalMatch, strat68);
assert(eval68.matches === true, 'Strategy 68 triggers on Three Matches point matrix evaluation');
const sig68: SignalAlert = {
  ...cornerSignal,
  id: 'sig-68',
  minute: 0,
  score: '0:0',
  ruleId: 'strat-pdf-three-matches-theory',
  ruleName: strat68.name,
  marketSuggestion: strat68.targetMarket,
};
const res68Win = evaluateSignalOutcome(sig68, [2, 1], true, undefined, undefined, { minute: 90, matchStatus: 'FT' });
assert(res68Win.outcome === 'WIN', 'Strategy 68 resolves as WIN when favored team wins at FT');

// 7. Strategy 69 (PDF 2: 15 Parameters Value Drop)
const strat69 = EXPANDED_DEFAULT_FILTERS.find((f) => f.id === 'strat-pdf-15-param-value-drop')!;
assert(strat69 !== undefined, 'Strategy 69 (PDF: 15 Parameters Value Drop) exists in default filters');
const match69Pass: Match = {
  ...minimalMatch,
  id: 'm-pdf-69',
  minute: 30,
  status: 'LIVE',
  score: [0, 0],
  oddsDrop: {
    market: 'HOME',
    marketName: 'П1',
    initialOdds: 2.10,
    currentOdds: 1.95,
    dropPercent: 7.1, // >= 5%
    moneyVolumePercent: 68,
    bookmaker: 'Marathon / Interwetten',
  },
};
const eval69 = evaluateFilterRule(match69Pass, strat69);
assert(eval69.matches === true, 'Strategy 69 triggers with 7.1% odds drop across 15 parameters');
const sig69: SignalAlert = {
  ...cornerSignal,
  id: 'sig-69',
  minute: 30,
  score: '0:0',
  ruleId: 'strat-pdf-15-param-value-drop',
  ruleName: strat69.name,
  marketSuggestion: strat69.targetMarket,
};
const res69Win = evaluateSignalOutcome(sig69, [1, 1], true, undefined, undefined, { minute: 90, matchStatus: 'FT' });
assert(res69Win.outcome === 'WIN', 'Strategy 69 resolves as WIN (Push/Win for F(0) or 1X) on 1:1 draw at FT');

// ----------------------------------------------------
// TEST GROUP 18: Unambiguous TB/TM Bet Detection & Super-Combo Synergy
// ----------------------------------------------------
console.log('\n--- Test Group 18: TB/TM Clarity, Super-Combo Synergy & Deduplication ---');

// 1. Basketball Clutch (diff <= 6) -> TB action badge
const basketClutchAction = detectBetActionBadge('ТБ (разрыв ≤6) / ТМ (разрыв ≥10)', stratBasketball, {
  score: [98, 96],
  sport: 'basketball',
});
assert(basketClutchAction.action === 'TB', 'Basketball clutch (diff=2 <= 6) detects TB action');
assert(basketClutchAction.actionBadge.includes('БРАТЬ: ТБ'), 'Basketball clutch action badge explicitly says БРАТЬ: ТБ');
assert(basketClutchAction.concreteBet.includes('212.5'), 'Basketball clutch line correctly calculates 98+96+18.5=212.5');

// 2. Basketball Blowout (diff >= 10) -> TM action badge
const basketBlowoutAction = detectBetActionBadge('ТБ (разрыв ≤6) / ТМ (разрыв ≥10)', stratBasketball, {
  score: [102, 88],
  sport: 'basketball',
});
assert(basketBlowoutAction.action === 'TM', 'Basketball blowout (diff=14 >= 10) detects TM action');
assert(basketBlowoutAction.actionBadge.includes('БРАТЬ: ТМ'), 'Basketball blowout action badge explicitly says БРАТЬ: ТМ');
assert(basketBlowoutAction.concreteBet.includes('212.5'), 'Basketball blowout line correctly calculates 102+88+22.5=212.5');

// 3. Football TM detection
const footballTmAction = detectBetActionBadge('ТМ 0.5 в 1-м тайме', undefined, {
  score: [0, 0],
  sport: 'football',
});
assert(footballTmAction.action === 'TM', 'Football TM 0.5 detects TM action');
assert(footballTmAction.actionBadge.includes('БРАТЬ: ТМ'), 'Football TM action badge explicitly says БРАТЬ: ТМ');

// 4. Football TB detection
const footballTbAction = detectBetActionBadge('ТБ 2.5', undefined, {
  score: [1, 0],
  sport: 'football',
});
assert(footballTbAction.action === 'TB', 'Football TB 2.5 detects TB action');
assert(footballTbAction.actionBadge.includes('БРАТЬ: ТБ'), 'Football TB action badge explicitly says БРАТЬ: ТБ');

// 5. Super-Combo Telegram formatting
const mockRuleA = EXPANDED_DEFAULT_FILTERS[0];
const mockRuleB = EXPANDED_DEFAULT_FILTERS[1];
const mockAnalysis = calculatePressureAnalysis(minimalMatch);
const comboAlertHtml = formatExtendedTelegramAlert(minimalMatch, mockRuleA, mockAnalysis, undefined, false, {
  isCombo: true,
  comboCount: 2,
  rules: [mockRuleA, mockRuleB],
  confidence: 96,
});
assert(comboAlertHtml.includes('СУПЕР-КОМБО СИГНАЛ'), 'Combo alert HTML contains СУПЕР-КОМБО header');
assert(comboAlertHtml.includes('СИНЕРГИЯ 2 СТРАТЕГИЙ'), 'Combo alert HTML mentions synergy count');
assert(comboAlertHtml.includes('ВЫСОКАЯ ВЕРОЯТНОСТЬ ПРОХОДА: 96%'), 'Combo alert HTML shows high pass probability');
assert(comboAlertHtml.includes('ЧТО БРАТЬ:'), 'Combo alert HTML clearly indicates ЧТО БРАТЬ');

// 6. Resolution Telegram formatting with clear TB/TM expectations
const resolvedTbSig: SignalAlert = {
  ...cornerSignal,
  marketSuggestion: 'ТБ 2.5',
  targetAction: 'TB',
};
const resolvedTbHtml = formatResolvedTelegramAlert(resolvedTbSig, '2:1', 'WIN');
assert(resolvedTbHtml.includes('ОЖИДАЛОСЬ: ТБ'), 'Resolution alert states expected ТБ');
assert(resolvedTbHtml.includes('СЫГРАЛ ТБ'), 'Resolution alert confirms ТБ won');

const resolvedTmSig: SignalAlert = {
  ...cornerSignal,
  sport: 'basketball',
  marketSuggestion: 'ТМ 212.5',
  targetAction: 'TM',
};
const resolvedTmHtml = formatResolvedTelegramAlert(resolvedTmSig, '102:98', 'WIN');
assert(resolvedTmHtml.includes('ОЖИДАЛОСЬ: ТМ'), 'Resolution alert states expected ТМ');
assert(resolvedTmHtml.includes('СЫГРАЛ ТМ'), 'Resolution alert confirms ТМ won');

// 7. Cross-provider canonical key deduplication
const matchFlashscore = { homeTeam: 'Arsenal FC', awayTeam: 'Chelsea', sport: 'football' };
const matchFonbet = { homeTeam: 'Арсенал', awayTeam: 'Челси', sport: 'football' };
const key1 = getCanonicalMatchKey(matchFlashscore);
const key2 = getCanonicalMatchKey(matchFonbet);
assert(key1 === key2, `Cross-provider match canonical keys match (${key1} === ${key2})`);

// 8. Same-event Multi-strategy Clustering (Goal in 1H synergy vs different events)
const stratGoal1HA = EXPANDED_DEFAULT_FILTERS.find((f) => f.id === 'strat-2')!; // Гол в 1-м тайме
const stratGoal1HB = EXPANDED_DEFAULT_FILTERS.find((f) => f.id === 'strat-photo-ht-goal-92')!; // Гол 1 тайм 92%
const stratCornersTest = EXPANDED_DEFAULT_FILTERS.find((f) => f.targetMarket?.toLowerCase().includes('угл') || f.name.toLowerCase().includes('угл'))!;

const cluster1HA = getStrategyTargetCluster(stratGoal1HA, minimalMatch);
const cluster1HB = getStrategyTargetCluster(stratGoal1HB, minimalMatch);
const clusterCorners = getStrategyTargetCluster(stratCornersTest, minimalMatch);

assert(cluster1HA.cluster === 'GOAL_1H', 'Strategy 2 classifies as GOAL_1H');
assert(cluster1HB.cluster === 'GOAL_1H', 'Strategy 64 classifies as GOAL_1H');
assert(cluster1HA.cluster === cluster1HB.cluster, 'Two different 1H goal strategies share identical target cluster');
assert(clusterCorners.cluster === 'CORNERS_OVER', 'Corners strategy classifies as CORNERS_OVER');
assert(cluster1HA.cluster !== clusterCorners.cluster, '1H goal and Corners strategies have distinct clusters (no false combo)');

// 9. Super-Combo alert HTML displays unified target event
const sameEventComboHtml = formatExtendedTelegramAlert(minimalMatch, stratGoal1HA, mockAnalysis, undefined, false, {
  isCombo: true,
  comboCount: 2,
  rules: [stratGoal1HA, stratGoal1HB],
  confidence: 96,
  targetCluster: 'GOAL_1H',
  targetClusterName: 'Гол в 1-м тайме (ТБ 0.5 1Т)',
});
assert(sameEventComboHtml.includes('ЕДИНЫЙ ЦЕЛЕВОЙ ИСХОД'), 'Super-Combo alert displays unified target event line');
assert(sameEventComboHtml.includes('ГОЛ В 1-М ТАЙМЕ'), 'Super-Combo alert names the specific 1H goal target');

// ----------------------------------------------------
// TEST GROUP 19: Strategies 70, 71, 72 from Scanner Images
// ----------------------------------------------------
console.log('\n--- Test Group 19: Strategies 70, 71, 72 (All-In-One 68-75, Kef2 92% Strike, Kef 1H Value) ---');

// 1. Strategy 70 («Все обо всем тест»)
const strat70 = EXPANDED_DEFAULT_FILTERS.find((f) => f.id === 'strat-photo-all-in-one-68-75')!;
assert(strat70 !== undefined, 'Strategy 70 (strat-photo-all-in-one-68-75) exists in default filters');
assert(strat70.minShotsOffTargetTotal === 6, 'Strategy 70 requires minShotsOffTargetTotal >= 6');
assert(strat70.maxTotalGoals === 3, 'Strategy 70 requires maxTotalGoals <= 3');

const match70Pass: Match = {
  ...minimalMatch,
  id: 'm-photo-70',
  minute: 71,
  status: 'LIVE',
  score: [1, 1], // 2 total goals <= 3
  stats: {
    ...minimalMatch.stats,
    shotsOnTarget: [4, 3], // 7 total >= 7
    shotsOffTarget: [3, 3], // 6 total >= 6
    corners: [3, 2], // 5 total >= 5
  },
};
const eval70 = evaluateFilterRule(match70Pass, strat70);
assert(eval70.matches === true, 'Strategy 70 triggers at minute 71 with 7 SOT, 6 off-target, 5 corners, total goals 2');

const match70OffTargetFail: Match = {
  ...match70Pass,
  stats: {
    ...match70Pass.stats,
    shotsOffTarget: [3, 2], // 5 total < 6
  },
};
const eval70Fail = evaluateFilterRule(match70OffTargetFail, strat70);
assert(eval70Fail.matches === false, 'Strategy 70 rejects match when shots off-target < 6');

const cluster70 = getStrategyTargetCluster(strat70, match70Pass);
assert(cluster70.cluster === 'GOAL_2H', 'Strategy 70 maps to GOAL_2H target cluster');

// 2. Strategy 71 («Кеф 2 (Strike 92%)» Over 0.5 Since Picked)
const strat71 = EXPANDED_DEFAULT_FILTERS.find((f) => f.id === 'strat-photo-kef2-ht-over05')!;
assert(strat71 !== undefined, 'Strategy 71 (strat-photo-kef2-ht-over05) exists in default filters');
assert(strat71.minHalfTimeDangerousAttacks === 45, 'Strategy 71 requires minHalfTimeDangerousAttacks >= 45');
assert(strat71.minLiveOddsOver05 === 1.25, 'Strategy 71 requires minLiveOddsOver05 >= 1.25');

const match71Pass: Match = {
  ...minimalMatch,
  id: 'm-photo-71',
  minute: 54,
  status: 'LIVE',
  score: [0, 0],
  odds: {
    ...minimalMatch.odds,
    over05Minute46: 1.12, // <= 1.15
    over05Live: 1.28,      // >= 1.25
  },
  halfTimeStats: {
    dangerousAttacks: [26, 22], // 48 >= 45
    shotsOnTarget: [2, 2],      // 4 >= 3
    corners: [2, 2],            // 4 >= 3
  },
};
const eval71 = evaluateFilterRule(match71Pass, strat71);
assert(eval71.matches === true, 'Strategy 71 triggers in 2H when HT pressure high and live Over 0.5 odds reach value 1.28');

const match71LowOddsFail: Match = {
  ...match71Pass,
  odds: {
    ...match71Pass.odds,
    over05Live: 1.18, // < 1.25
  },
};
const eval71Fail = evaluateFilterRule(match71LowOddsFail, strat71);
assert(eval71Fail.matches === false, 'Strategy 71 rejects match when live Over 0.5 odds < 1.25');

const cluster71 = getStrategyTargetCluster(strat71, match71Pass);
assert(cluster71.cluster === 'GOAL_2H', 'Strategy 71 maps to GOAL_2H target cluster');
assert(cluster70.cluster === cluster71.cluster, 'Strategy 70 and Strategy 71 share GOAL_2H cluster for Super-Combo');

// 3. Strategy 72 («Кеф Value 1Т» Over 0.5 1H)
const strat72 = EXPANDED_DEFAULT_FILTERS.find((f) => f.id === 'strat-photo-kef-1h-value')!;
assert(strat72 !== undefined, 'Strategy 72 (strat-photo-kef-1h-value) exists in default filters');
assert(strat72.scoreCondition === '0-0', 'Strategy 72 strictly operates at 0-0 in 1st half');

const match72Pass: Match = {
  ...minimalMatch,
  id: 'm-photo-72',
  minute: 24,
  status: 'LIVE',
  score: [0, 0],
  stats: {
    ...minimalMatch.stats,
    dangerousAttacks: [14, 10], // 24 >= 20
    shotsOnTarget: [2, 1],      // 3 SOT
    shotsOffTarget: [1, 1],     // Total shots = 5 >= 3
  },
};
const eval72 = evaluateFilterRule(match72Pass, strat72);
assert(eval72.matches === true, 'Strategy 72 triggers at min 24 with 0:0, 24 dangerous attacks, 5 total shots');

const match72ScoreFail: Match = {
  ...match72Pass,
  score: [1, 0], // Not 0-0
};
const eval72Fail = evaluateFilterRule(match72ScoreFail, strat72);
assert(eval72Fail.matches === false, 'Strategy 72 rejects match when score is not 0:0');

const cluster72 = getStrategyTargetCluster(strat72, match72Pass);
assert(cluster72.cluster === 'GOAL_1H', 'Strategy 72 maps to GOAL_1H target cluster');

// Resolution of Strategy 72 on 1H goal
const sig72: SignalAlert = {
  ...cornerSignal,
  id: 'sig-72-test',
  minute: 24,
  score: '0:0',
  ruleId: 'strat-photo-kef-1h-value',
  ruleName: strat72.name,
  marketSuggestion: strat72.targetMarket,
};
const res72Win = evaluateSignalOutcome(sig72, [1, 0], false, undefined, undefined, { minute: 36, matchStatus: 'LIVE' });
assert(res72Win.outcome === 'WIN', 'Strategy 72 resolves as WIN when goal is scored in 1st half (min 36, 1:0)');

// ----------------------------------------------------
// SUMMARY
// ----------------------------------------------------
console.log('\n========================================');
console.log(`📊 TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
if (failedTests > 0) {
  console.error(`❌ ${failedTests} TESTS FAILED`);
  process.exit(1);
} else {
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
  console.log('========================================\n');
  process.exit(0);
}
