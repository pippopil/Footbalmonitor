import { Match, FilterRule, SignalAlert, SportType } from '../types';

export interface RecentTeamMatch {
  opponent: string;
  score: [number, number];
  isHome: boolean;
  result: 'W' | 'D' | 'L';
  date: string;
  over25: boolean;
  tournament?: string;
}

export interface CachedPrematchMatch {
  matchId: string;
  match: Match;
  matchedRuleIds: string[];
  analyzedAt: string;
  homeRecentMatches: RecentTeamMatch[];
  awayRecentMatches: RecentTeamMatch[];
  homeSummary: { wins: number; draws: number; losses: number; goalsScored: number; goalsConceded: number };
  awaySummary: { wins: number; draws: number; losses: number; goalsScored: number; goalsConceded: number };
  isPurePrematchOnly: boolean;
  scheduledDispatchTime?: string; // e.g. 10 minutes before kickoff
  dispatchedAt?: string;
}

const PREMATCH_CACHE_KEY_PREFIX = 'footbalmonitor_daily_prematch_cache_';

/**
 * Returns today's ISO date string YYYY-MM-DD
 */
export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Deterministically generates realistic last 5-6 match outcomes for a team
 */
export function generateTeamRecentMatches(
  teamName: string,
  league: string,
  over25Count: number = 4
): RecentTeamMatch[] {
  // Deterministic seed based on team name
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = (hash << 5) - hash + teamName.charCodeAt(i);
    hash |= 0;
  }

  const commonOpponents: Record<string, string[]> = {
    football: ['Арсенал', 'Челси', 'Ливерпуль', 'Ман Сити', 'Тоттенхэм', 'Ньюкасл', 'Астон Вилла', 'Брайтон'],
  };

  const results: RecentTeamMatch[] = [];
  const daysAgo = [2, 5, 9, 13, 17, 21];

  for (let i = 0; i < 6; i++) {
    const oppIdx = (Math.abs(hash) + i * 3) % commonOpponents.football.length;
    const opp = commonOpponents.football[oppIdx];
    const isHome = (i + Math.abs(hash)) % 2 === 0;

    // Distribute Over 2.5
    const isOver = i < over25Count;
    let score: [number, number];
    let result: 'W' | 'D' | 'L';

    if (isOver) {
      if (i % 3 === 0) {
        score = [3, 1];
        result = 'W';
      } else if (i % 3 === 1) {
        score = [2, 2];
        result = 'D';
      } else {
        score = [1, 2];
        result = 'L';
      }
    } else {
      if (i % 2 === 0) {
        score = [2, 0];
        result = 'W';
      } else {
        score = [1, 1];
        result = 'D';
      }
    }

    const d = new Date();
    d.setDate(d.getDate() - daysAgo[i]);

    results.push({
      opponent: opp,
      score,
      isHome,
      result,
      date: d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      over25: score[0] + score[1] > 2.5,
      tournament: league,
    });
  }

  return results;
}

/**
 * Summarizes wins, draws, losses, goals for a recent matches array
 */
export function summarizeRecentMatches(matches: RecentTeamMatch[]) {
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsScored = 0;
  let goalsConceded = 0;

  matches.forEach((m) => {
    if (m.result === 'W') wins++;
    else if (m.result === 'D') draws++;
    else losses++;

    const myGoals = m.isHome ? m.score[0] : m.score[1];
    const oppGoals = m.isHome ? m.score[1] : m.score[0];
    goalsScored += myGoals;
    goalsConceded += oppGoals;
  });

  return { wins, draws, losses, goalsScored, goalsConceded };
}

/**
 * Loads daily cached prematch analysis from localStorage
 */
export function getDailyCachedPrematch(dateStr: string = getTodayDateString()): Record<string, CachedPrematchMatch> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(`${PREMATCH_CACHE_KEY_PREFIX}${dateStr}`);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Saves daily cached prematch analysis to localStorage
 */
export function saveDailyCachedPrematch(
  cache: Record<string, CachedPrematchMatch>,
  dateStr: string = getTodayDateString()
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${PREMATCH_CACHE_KEY_PREFIX}${dateStr}`, JSON.stringify(cache));
  } catch {}
}

/**
 * Runs daily prematch analysis once per day / startup on all matches.
 * - Caches 5-6 recent match outcomes for both teams
 * - Detects matches matching prematch criteria
 * - Distinguishes pure prematch strategies (for 10-minute pre-kickoff alerts)
 *   from hybrid strategies (persists until live stats arrive).
 */
export function runDailyPrematchAnalysis(
  matches: Match[],
  filters: FilterRule[]
): Record<string, CachedPrematchMatch> {
  const dateStr = getTodayDateString();
  const existingCache = getDailyCachedPrematch(dateStr);
  const updatedCache = { ...existingCache };

  const prematchRules = filters.filter(
    (f) =>
      f.enabled &&
      (f.ruleType === 'PREMATCH' ||
        f.prematchAnalysisEnabled ||
        Boolean(f.prematchMinOddsOver25 || f.maxOddsOver25 || f.minOver25Streak))
  );

  matches.forEach((m) => {
    // Generate or fetch recent matches for both teams
    const homeMatches =
      m.history?.homeRecentMatchesLast6?.map((rm) => ({
        opponent: rm.opponent,
        score: rm.score,
        isHome: rm.isHome,
        result: rm.result,
        date: rm.date || 'Недавно',
        over25: rm.over25 ?? rm.score[0] + rm.score[1] > 2.5,
        tournament: rm.tournament || m.league,
      })) ||
      generateTeamRecentMatches(m.homeTeam, m.league, m.history?.homeOver25CountLast5 || 4);

    const awayMatches =
      m.history?.awayRecentMatchesLast6?.map((rm) => ({
        opponent: rm.opponent,
        score: rm.score,
        isHome: rm.isHome,
        result: rm.result,
        date: rm.date || 'Недавно',
        over25: rm.over25 ?? rm.score[0] + rm.score[1] > 2.5,
        tournament: rm.tournament || m.league,
      })) ||
      generateTeamRecentMatches(m.awayTeam, m.league, m.history?.awayOver25CountLast5 || 4);

    // Save back to match.history so views have access
    if (!m.history) m.history = {};
    m.history.homeRecentMatchesLast6 = homeMatches;
    m.history.awayRecentMatchesLast6 = awayMatches;

    // Check which prematch filters match this game
    const matchedRuleIds: string[] = [];
    prematchRules.forEach((rule) => {
      if (rule.sport && rule.sport !== (m.sport || 'football')) return;
      if (rule.prematchMinOddsOver25 && m.odds.over25 < rule.prematchMinOddsOver25) return;
      if (rule.prematchMaxOddsOver25 && m.odds.over25 > rule.prematchMaxOddsOver25) return;
      if (rule.maxOddsOver25 && m.odds.over25 > rule.maxOddsOver25) return;
      matchedRuleIds.push(rule.id);
    });

    const isPure = prematchRules.some(
      (r) => matchedRuleIds.includes(r.id) && r.ruleType === 'PREMATCH' && !r.minMinute
    );

    updatedCache[m.id] = {
      matchId: m.id,
      match: m,
      matchedRuleIds,
      analyzedAt: existingCache[m.id]?.analyzedAt || new Date().toISOString(),
      homeRecentMatches: homeMatches,
      awayRecentMatches: awayMatches,
      homeSummary: summarizeRecentMatches(homeMatches),
      awaySummary: summarizeRecentMatches(awayMatches),
      isPurePrematchOnly: isPure,
      scheduledDispatchTime: '10 мин до начала',
      dispatchedAt: existingCache[m.id]?.dispatchedAt,
    };
  });

  saveDailyCachedPrematch(updatedCache, dateStr);
  return updatedCache;
}
