import { Match, MatchStats } from '../src/types';

// In-memory store for webhook ingested matches
interface IngestedStore {
  matches: Map<string, Match>;
  lastIngestedAt: string | null;
  totalReceived: number;
}

const webhookStore: IngestedStore = {
  matches: new Map(),
  lastIngestedAt: null,
  totalReceived: 0,
};

// Cache for external API calls to avoid burning user rate limits
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const apiCache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 15000; // 15 seconds cache

function getCached<T>(key: string): T | null {
  const entry = apiCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data as T;
  }
  return null;
}

function setCached<T>(key: string, data: T) {
  apiCache.set(key, { data, timestamp: Date.now() });
}

// -------------------------------------------------------------
// STATS & ODDS ESTIMATION GENERATORS
// -------------------------------------------------------------
export function generateLiveStatsForMatch(minute: number, scoreHome: number, scoreAway: number): MatchStats {
  const m = Math.max(1, Math.min(95, minute));
  const diff = scoreHome - scoreAway;

  // Losing team pushes harder
  const homeAdv = diff < 0 ? 1.2 : diff > 0 ? 0.85 : 1.05;
  const awayAdv = diff > 0 ? 1.2 : diff < 0 ? 0.85 : 0.95;

  const dangH = Math.max(0, Math.round(m * 0.7 * homeAdv));
  const dangA = Math.max(0, Math.round(m * 0.65 * awayAdv));

  const attH = Math.round(dangH * 1.5);
  const attA = Math.round(dangA * 1.5);

  const sotH = Math.max(scoreHome, Math.round(m * 0.08 * homeAdv) + scoreHome);
  const sotA = Math.max(scoreAway, Math.round(m * 0.07 * awayAdv) + scoreAway);

  const soffH = Math.max(0, Math.round(m * 0.06));
  const soffA = Math.max(0, Math.round(m * 0.05));

  const cornH = Math.max(0, Math.round(m * 0.07 * homeAdv));
  const cornA = Math.max(0, Math.round(m * 0.06 * awayAdv));

  const totalDang = dangH + dangA;
  const possH = totalDang > 0 ? Math.min(75, Math.max(25, Math.round((dangH / totalDang) * 100))) : 50;
  const possA = 100 - possH;

  const yellowH = m > 30 ? (m > 70 ? 2 : 1) : 0;
  const yellowA = m > 35 ? (m > 75 ? 2 : 1) : 0;

  const xgH = Number((scoreHome * 0.75 + sotH * 0.12).toFixed(2));
  const xgA = Number((scoreAway * 0.75 + sotA * 0.12).toFixed(2));

  return {
    possession: [possH, possA],
    dangerousAttacks: [dangH, dangA],
    attacks: [attH, attA],
    shotsOnTarget: [sotH, sotA],
    shotsOffTarget: [soffH, soffA],
    corners: [cornH, cornA],
    yellowCards: [yellowH, yellowA],
    redCards: [0, 0],
    xg: [xgH, xgA],
  };
}

export function estimateOddsFromScoreAndTime(
  scoreHome: number,
  scoreAway: number,
  minute: number
): { home: number; draw: number; away: number; over25: number; under25?: number } {
  const m = Math.max(1, Math.min(90, minute));
  const totalGoals = scoreHome + scoreAway;
  const diff = scoreHome - scoreAway;

  let home = 2.2;
  let draw = 3.2;
  let away = 3.4;

  if (diff > 0) {
    home = Number((1.1 + (90 - m) * 0.01).toFixed(2));
    draw = Number((3.5 + m * 0.05).toFixed(2));
    away = Number((5.0 + m * 0.1).toFixed(2));
  } else if (diff < 0) {
    away = Number((1.15 + (90 - m) * 0.01).toFixed(2));
    draw = Number((3.5 + m * 0.05).toFixed(2));
    home = Number((5.5 + m * 0.1).toFixed(2));
  } else {
    // Tied score: draw odds decrease as match nears end
    draw = Number(Math.max(1.3, (3.2 - (m / 90) * 1.7)).toFixed(2));
    home = Number((2.4 + (m / 90) * 1.5).toFixed(2));
    away = Number((2.8 + (m / 90) * 1.8).toFixed(2));
  }

  let over25 = 1.9;
  let under25 = 1.9;
  if (totalGoals >= 3) {
    over25 = 1.05;
    under25 = 8.5;
  } else if (totalGoals === 2) {
    over25 = Number(Math.max(1.15, 1.45 + (m / 90) * 1.2).toFixed(2));
    under25 = Number(Math.max(1.2, 2.6 - (m / 90) * 1.2).toFixed(2));
  } else {
    over25 = Number(Math.min(12, 1.9 + (m / 90) * 5.0).toFixed(2));
    under25 = Number(Math.max(1.05, 1.9 - (m / 90) * 0.8).toFixed(2));
  }

  return { home, draw, away, over25, under25 };
}

// -------------------------------------------------------------
// 1. FLASHSCORE LIVE PARSER (flashscore.mobi live feed)
// -------------------------------------------------------------
export async function fetchFlashscoreLiveMatches(options?: {
  maxMatches?: number;
}): Promise<{ ok: boolean; matches: Match[]; error?: string }> {
  const cacheKey = 'flashscore_live_matches';
  const cached = getCached<Match[]>(cacheKey);
  if (cached && cached.length > 0) {
    return { ok: true, matches: cached };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch('https://flashscore.mobi/?s=2', {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { ok: false, matches: [], error: `Flashscore вернул HTTP ${res.status}` };
    }

    const html = await res.text();
    const matches: Match[] = [];

    // Sections are separated by <h4>...</h4>
    const sections = html.split('<h4>');
    for (const sec of sections.slice(1)) {
      const headerEnd = sec.indexOf('</h4>');
      if (headerEnd === -1) continue;

      const rawHeader = sec.slice(0, headerEnd).replace(/<[^>]+>/g, '').trim();
      const parts = rawHeader.split(':', 2);
      const countryRaw = parts[0]?.trim() || 'World';
      const leagueRaw = (parts[1] || rawHeader).replace(/Standings/gi, '').trim();
      const flag = getCountryFlag(countryRaw);

      const body = sec.slice(headerEnd + 5);
      // Pattern: <span class="live">31'</span>TeamA - TeamB <a href="/match/x031Kvfe/?s=2" class="live">0-0</a>
      const matchRegex = /<span class="live">(.*?)<\/span>(.*?)\s*<a href="\/match\/([A-Za-z0-9]+)\/[^"]*" class="live">(.*?)<\/a>/gs;
      let matchExec;

      while ((matchExec = matchRegex.exec(body)) !== null) {
        const rawMinute = matchExec[1].replace(/<[^>]+>/g, '').trim();
        const rawTeams = matchExec[2].replace(/<[^>]+>/g, '').trim();
        const matchId = matchExec[3].trim();
        const rawScore = matchExec[4].replace(/<[^>]+>/g, '').trim();

        const teamParts = rawTeams.split(' - ');
        const homeTeam = teamParts[0]?.trim() || 'Хозяева';
        const awayTeam = teamParts[1]?.trim() || 'Гости';

        const scoreParts = rawScore.split('-');
        const scoreHome = parseInt(scoreParts[0]?.trim() || '0', 10) || 0;
        const scoreAway = parseInt(scoreParts[1]?.trim() || '0', 10) || 0;

        let minute = 1;
        let status: 'LIVE' | 'HT' | 'FT' = 'LIVE';

        if (/half\s*time|ht|перерыв/i.test(rawMinute)) {
          minute = 45;
          status = 'HT';
        } else if (/fin|ft|заверш/i.test(rawMinute)) {
          minute = 90;
          status = 'FT';
        } else {
          const mMatch = rawMinute.match(/(\d+)/);
          minute = mMatch ? Math.min(90, parseInt(mMatch[1], 10)) : 1;
        }

        const stats = generateLiveStatsForMatch(minute, scoreHome, scoreAway);
        const odds = estimateOddsFromScoreAndTime(scoreHome, scoreAway, minute);

        matches.push({
          id: `fs-${matchId}`,
          country: countryRaw,
          countryCode: flag,
          league: leagueRaw || 'League',
          homeTeam,
          awayTeam,
          score: [scoreHome, scoreAway],
          minute,
          status,
          source: 'Flashscore',
          stats,
          momentum: [
            Math.floor(stats.dangerousAttacks[0] * 0.3),
            Math.floor(stats.dangerousAttacks[0] * 0.6),
            Math.floor(stats.dangerousAttacks[0] * 0.8),
            stats.dangerousAttacks[0] - stats.dangerousAttacks[1],
          ],
          lastEvent: `${minute}' [Flashscore Live] ${homeTeam} ${scoreHome}:${scoreAway} ${awayTeam}`,
          odds,
        });

        if (options?.maxMatches && matches.length >= options.maxMatches) {
          break;
        }
      }

      if (options?.maxMatches && matches.length >= options.maxMatches) {
        break;
      }
    }

    if (matches.length > 0) {
      setCached(cacheKey, matches);
      return { ok: true, matches };
    }

    return { ok: false, matches: [], error: 'Матчи не найдены в фиде Flashscore' };
  } catch (err: any) {
    return { ok: false, matches: [], error: `Ошибка парсинга Flashscore: ${err?.message || err}` };
  }
}

// -------------------------------------------------------------
// 2. SSTATS.NET LIVE API (Smart Tables / SStats)
// -------------------------------------------------------------
export async function fetchSstatsLiveMatches(options?: {
  apiKey?: string;
  maxMatches?: number;
}): Promise<{ ok: boolean; matches: Match[]; error?: string }> {
  const cacheKey = 'sstats_live_matches';
  const cached = getCached<Match[]>(cacheKey);
  if (cached && cached.length > 0) {
    return { ok: true, matches: cached };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'Footbalmonitor/2.4 (SStats Consumer)',
    };
    if (options?.apiKey) {
      headers['ApiKey'] = options.apiKey.trim();
    }

    const res = await fetch('https://api.sstats.net/Ls/List?Live=true', {
      signal: controller.signal,
      headers,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { ok: false, matches: [], error: `SStats API вернул HTTP ${res.status}` };
    }

    const data = (await res.json()) as any;
    if (data.status !== 'OK' || !Array.isArray(data.data)) {
      return { ok: false, matches: [], error: data.message || 'Ошибка формата ответа SStats' };
    }

    const matches: Match[] = [];
    for (const item of data.data) {
      const homeTeam = item.homeTeam?.name || 'Хозяева';
      const awayTeam = item.awayTeam?.name || 'Гости';
      const league = item.season?.league?.name || 'League';
      const country = item.season?.league?.country?.name || 'World';
      const flag = getCountryFlag(country);

      const homeScore = Number(item.homeResult ?? 0);
      const awayScore = Number(item.awayResult ?? 0);

      let minute = 50;
      let status: 'LIVE' | 'HT' | 'FT' = 'LIVE';
      if (item.status === 12) {
        minute = 25;
      } else if (item.status === 46 || item.status === 42) {
        minute = 45;
        status = 'HT';
      } else if (item.status === 13) {
        minute = 70;
      } else if (item.status === 3 || item.status === 10 || item.status === 11) {
        minute = 90;
        status = 'FT';
      }

      const stats = generateLiveStatsForMatch(minute, homeScore, awayScore);
      const odds = estimateOddsFromScoreAndTime(homeScore, awayScore, minute);

      matches.push({
        id: `sstats-${item.id}`,
        country,
        countryCode: flag,
        league,
        homeTeam,
        awayTeam,
        score: [homeScore, awayScore],
        minute,
        status,
        source: 'SStats',
        stats,
        momentum: [10, 15, -5, 20, 25],
        lastEvent: `${minute}' [SStats Live] ${homeTeam} ${homeScore}:${awayScore} ${awayTeam}`,
        odds,
      });

      if (options?.maxMatches && matches.length >= options.maxMatches) {
        break;
      }
    }

    if (matches.length > 0) {
      setCached(cacheKey, matches);
      return { ok: true, matches };
    }

    return { ok: false, matches: [], error: 'В данный момент в SStats нет активных live-матчей' };
  } catch (err: any) {
    return { ok: false, matches: [], error: `Ошибка соединения с SStats: ${err?.message || err}` };
  }
}

// -------------------------------------------------------------
// 3. SOFASCORE LIVE PARSER & FALLBACK
// -------------------------------------------------------------
export async function fetchSofascoreLiveMatches(): Promise<{ ok: boolean; matches: Match[]; error?: string }> {
  const cacheKey = 'sofascore_live_matches';
  const cached = getCached<Match[]>(cacheKey);
  if (cached && cached.length > 0) {
    return { ok: true, matches: cached };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);
    const res = await fetch('https://api.sofascore.com/api/v1/sport/football/events/live', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://www.sofascore.com/',
        'Origin': 'https://www.sofascore.com',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      // If Cloudflare blocks server IP, fallback gracefully or use Flashscore
      return {
        ok: false,
        matches: [],
        error: `Sofascore вернул HTTP ${res.status} (Cloudflare). Рекомендуется выбрать Flashscore или SStats, либо запустить локальный скрипт scripts/sofascore_collector.py на вашем ПК.`,
      };
    }

    const data = (await res.json()) as any;
    const events = data.events || [];
    const matches: Match[] = [];

    for (const ev of events) {
      const homeTeam = ev.homeTeam?.name || 'Home';
      const awayTeam = ev.awayTeam?.name || 'Away';
      const league = ev.tournament?.name || 'League';
      const country = ev.tournament?.category?.name || 'World';
      const flag = getCountryFlag(country);

      const homeScore = ev.homeScore?.current ?? 0;
      const awayScore = ev.awayScore?.current ?? 0;
      const minute = ev.time?.played ? Math.min(90, Math.floor(ev.time.played / 60)) : 45;

      const stats = generateLiveStatsForMatch(minute, homeScore, awayScore);
      const odds = estimateOddsFromScoreAndTime(homeScore, awayScore, minute);

      matches.push({
        id: `sofa-${ev.id}`,
        country,
        countryCode: flag,
        league,
        homeTeam,
        awayTeam,
        score: [homeScore, awayScore],
        minute,
        status: ev.status?.type === 'inprogress' ? 'LIVE' : ev.status?.type === 'finished' ? 'FT' : 'HT',
        source: 'Sofascore',
        stats,
        momentum: [5, 15, -10, 25, 30],
        lastEvent: `${minute}' [Sofascore] ${homeTeam} ${homeScore}:${awayScore} ${awayTeam}`,
        odds,
      });
    }

    if (matches.length > 0) {
      setCached(cacheKey, matches);
      return { ok: true, matches };
    }

    return { ok: false, matches: [], error: 'Матчи в Sofascore не найдены' };
  } catch (err: any) {
    return { ok: false, matches: [], error: `Ошибка Sofascore: ${err?.message || err}` };
  }
}

// -------------------------------------------------------------
// 4. PUBLIC LIVE SPORTS FEED (ESPN / Open Football Scoreboards)
// -------------------------------------------------------------
const PUBLIC_LEAGUE_ENDPOINTS: Array<{ league: string; country: string; flag: string; url: string }> = [
  {
    league: 'Premier League',
    country: 'England',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard',
  },
  {
    league: 'LaLiga EA Sports',
    country: 'Spain',
    flag: '🇪🇸',
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard',
  },
  {
    league: 'Serie A',
    country: 'Italy',
    flag: '🇮🇹',
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ita.1/scoreboard',
  },
  {
    league: 'Bundesliga',
    country: 'Germany',
    flag: '🇩🇪',
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/scoreboard',
  },
  {
    league: 'Ligue 1',
    country: 'France',
    flag: '🇫🇷',
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/fra.1/scoreboard',
  },
  {
    league: 'UEFA Champions League',
    country: 'Europe',
    flag: '🇪🇺',
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard',
  },
];

export async function fetchPublicLiveMatches(): Promise<{ matches: Match[]; sourceCount: number }> {
  const cacheKey = 'public_live_matches';
  const cached = getCached<Match[]>(cacheKey);
  if (cached) {
    return { matches: cached, sourceCount: cached.length };
  }

  const results: Match[] = [];

  const requests = PUBLIC_LEAGUE_ENDPOINTS.map(async (item) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(item.url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Footbalmonitor/2.4' },
      });
      clearTimeout(timeoutId);

      if (!res.ok) return;
      const data = await res.json() as any;

      const events = data.events || [];
      for (const ev of events) {
        const statusType = ev.status?.type?.name; // e.g. "STATUS_IN_PROGRESS", "STATUS_HALFTIME", "STATUS_SCHEDULED", "STATUS_FINAL"
        const clock = ev.status?.displayClock || '';
        
        let minute = 0;
        if (statusType === 'STATUS_HALFTIME') {
          minute = 45;
        } else if (statusType === 'STATUS_FINAL') {
          minute = 90;
        } else if (clock) {
          const plusMatch = clock.match(/(\d+)\+(\d+)/);
          if (plusMatch) {
            minute = Math.min(90, parseInt(plusMatch[1], 10));
          } else {
            const numMatch = clock.match(/(\d+)/);
            minute = numMatch ? Math.min(90, parseInt(numMatch[1], 10)) : (statusType === 'STATUS_IN_PROGRESS' ? 55 : 0);
          }
        } else if (statusType === 'STATUS_IN_PROGRESS') {
          minute = 55;
        }

        const competition = ev.competitions?.[0];
        if (!competition) continue;

        const competitors = competition.competitors || [];
        const homeComp = competitors.find((c: any) => c.homeAway === 'home') || competitors[0];
        const awayComp = competitors.find((c: any) => c.homeAway === 'away') || competitors[1];
        if (!homeComp || !awayComp) continue;

        const homeScore = parseInt(homeComp.score || '0', 10);
        const awayScore = parseInt(awayComp.score || '0', 10);

        // Effective minute for stats calculation (min 15 so pre-match games have meaningful metrics)
        const calcMinute = Math.max(15, Math.min(90, minute || 30));

        // Parse detailed in-game statistics if present
        const homeStatsRaw = homeComp.statistics || [];
        const awayStatsRaw = awayComp.statistics || [];

        const getStat = (statsArray: any[], name: string, fallback: number) => {
          const s = statsArray.find((item: any) => item.name === name || item.label?.toLowerCase() === name.toLowerCase());
          if (!s) return fallback;
          const val = parseFloat(s.displayValue || s.value || '0');
          return isNaN(val) ? fallback : val;
        };

        const possessionHome = Math.round(getStat(homeStatsRaw, 'possessionPct', 52));
        const possessionAway = 100 - possessionHome;

        const shotsHome = Math.round(getStat(homeStatsRaw, 'shotsTotal', Math.max(3, Math.floor(calcMinute * 0.14))));
        const shotsAway = Math.round(getStat(awayStatsRaw, 'shotsTotal', Math.max(2, Math.floor(calcMinute * 0.11))));

        const shotsOnTargetHome = Math.round(getStat(homeStatsRaw, 'shotsOnTarget', Math.max(1, Math.floor(shotsHome * 0.4))));
        const shotsOnTargetAway = Math.round(getStat(awayStatsRaw, 'shotsOnTarget', Math.max(1, Math.floor(shotsAway * 0.38))));

        const cornersHome = Math.round(getStat(homeStatsRaw, 'wonCorners', Math.max(1, Math.floor(calcMinute * 0.08))));
        const cornersAway = Math.round(getStat(awayStatsRaw, 'wonCorners', Math.max(0, Math.floor(calcMinute * 0.06))));

        const yellowHome = Math.round(getStat(homeStatsRaw, 'yellowCards', Math.floor(calcMinute * 0.025)));
        const yellowAway = Math.round(getStat(awayStatsRaw, 'yellowCards', Math.floor(calcMinute * 0.03)));

        const redHome = Math.round(getStat(homeStatsRaw, 'redCards', 0));
        const redAway = Math.round(getStat(awayStatsRaw, 'redCards', 0));

        // Derived attacks & dangerous attacks based on real in-game possession & shots
        const attacksHome = Math.round(calcMinute * 1.3 * (possessionHome / 50));
        const attacksAway = Math.round(calcMinute * 1.3 * (possessionAway / 50));
        const dangAttacksHome = Math.round(attacksHome * 0.55 + shotsHome * 2);
        const dangAttacksAway = Math.round(attacksAway * 0.52 + shotsAway * 2);

        const xgHome = Number(((shotsOnTargetHome * 0.28) + ((shotsHome - shotsOnTargetHome) * 0.05) + (homeScore * 0.65)).toFixed(2));
        const xgAway = Number(((shotsOnTargetAway * 0.28) + ((shotsAway - shotsOnTargetAway) * 0.05) + (awayScore * 0.65)).toFixed(2));

        const matchStatus: 'LIVE' | 'HT' | 'FT' =
          statusType === 'STATUS_HALFTIME' ? 'HT' :
          statusType === 'STATUS_FINAL' ? 'FT' : 'LIVE';

        // Safe positive European odds
        const rawHomeOdds = 1.55 + (awayScore - homeScore) * 0.4;
        const rawAwayOdds = 2.80 + (homeScore - awayScore) * 0.5;
        const homeOdds = Number(Math.max(1.08, rawHomeOdds).toFixed(2));
        const awayOdds = Number(Math.max(1.08, rawAwayOdds).toFixed(2));

        // Momentum line calculation
        const momentumVal = Math.min(85, Math.max(-85, Math.round((dangAttacksHome - dangAttacksAway) * 1.5 + (shotsOnTargetHome - shotsOnTargetAway) * 8)));
        const momentum = [-15, 10, -5, 20, 15, momentumVal - 10, momentumVal + 5, momentumVal];

        results.push({
          id: `espn-${ev.id}`,
          country: item.country,
          countryCode: item.flag,
          league: item.league,
          homeTeam: homeComp.team?.displayName || homeComp.team?.name || 'Home Team',
          awayTeam: awayComp.team?.displayName || awayComp.team?.name || 'Away Team',
          score: [homeScore, awayScore],
          minute: minute,
          status: matchStatus,
          source: 'Public-Feed',
          stats: {
            possession: [possessionHome, possessionAway],
            dangerousAttacks: [dangAttacksHome, dangAttacksAway],
            attacks: [attacksHome, attacksAway],
            shotsOnTarget: [shotsOnTargetHome, shotsOnTargetAway],
            shotsOffTarget: [Math.max(0, shotsHome - shotsOnTargetHome), Math.max(0, shotsAway - shotsOnTargetAway)],
            corners: [cornersHome, cornersAway],
            yellowCards: [yellowHome, yellowAway],
            redCards: [redHome, redAway],
            xg: [xgHome, xgAway],
          },
          momentum,
          lastEvent: `${minute}' ${ev.status?.type?.detail || 'Матч тура'} • ${homeComp.team?.shortDisplayName || 'H'} vs ${awayComp.team?.shortDisplayName || 'A'}`,
          odds: {
            home: homeOdds,
            draw: 3.2,
            away: awayOdds,
            over25: 1.85,
            over35: 2.90,
            under25: 1.95,
          },
        });
      }
    } catch (err) {
      // Individual league failure safe guard
    }
  });

  await Promise.allSettled(requests);

  if (results.length > 0) {
    setCached(cacheKey, results);
  }

  return { matches: results, sourceCount: results.length };
}

// -------------------------------------------------------------
// 2. API-FOOTBALL INTEGRATION (v3 API-Sports / RapidAPI)
// -------------------------------------------------------------
export async function fetchApiFootballMatches(config: {
  apiKey: string;
  provider: 'api-sports' | 'rapidapi';
  leaguesFilter?: string;
}): Promise<{ ok: boolean; matches: Match[]; error?: string; remainingQuota?: string }> {
  const { apiKey, provider, leaguesFilter } = config;

  if (!apiKey) {
    return { ok: false, matches: [], error: 'Ключ API-Football не указан.' };
  }

  const cacheKey = `apifootball_${provider}_${apiKey.slice(-5)}_${leaguesFilter || 'all'}`;
  const cached = getCached<Match[]>(cacheKey);
  if (cached) {
    return { ok: true, matches: cached };
  }

  try {
    let url = provider === 'rapidapi'
      ? 'https://api-football-v1.p.rapidapi.com/v3/fixtures?live=all'
      : 'https://v3.football.api-sports.io/fixtures?live=all';

    if (leaguesFilter && leaguesFilter.trim()) {
      url += `&league=${encodeURIComponent(leaguesFilter.trim())}`;
    }

    const headers: Record<string, string> = provider === 'rapidapi'
      ? {
          'x-rapidapi-key': apiKey.trim(),
          'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
        }
      : {
          'x-apisports-key': apiKey.trim(),
        };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeoutId);

    const remainingQuota = res.headers.get('x-ratelimit-requests-remaining') || undefined;

    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, matches: [], error: `Ошибка API-Football (${res.status}): ${errText}` };
    }

    const data = await res.json() as any;

    if (data.errors && Object.keys(data.errors).length > 0) {
      const errKeys = Object.entries(data.errors).map(([k, v]) => `${k}: ${v}`).join(', ');
      return { ok: false, matches: [], error: `API-Football вернул ошибку: ${errKeys}` };
    }

    const responseItems = data.response || [];
    const matches: Match[] = [];

    for (const item of responseItems) {
      const f = item.fixture;
      const league = item.league;
      const teams = item.teams;
      const goals = item.goals;

      const elapsed = f.status?.elapsed || 1;
      const statusShort = f.status?.short; // '1H', '2H', 'HT', 'FT', etc.
      const status: 'LIVE' | 'HT' | 'FT' = statusShort === 'HT' ? 'HT' : statusShort === 'FT' ? 'FT' : 'LIVE';

      // Statistics estimation or raw values if available
      const statsHome = item.statistics?.[0]?.statistics || [];
      const statsAway = item.statistics?.[1]?.statistics || [];

      const getVal = (statsArr: any[], type: string, fallback: number) => {
        const found = statsArr.find((s: any) => s.type === type);
        if (!found || found.value === null) return fallback;
        const n = parseInt(String(found.value).replace('%', ''), 10);
        return isNaN(n) ? fallback : n;
      };

      const possHome = getVal(statsHome, 'Ball Possession', 50);
      const possAway = 100 - possHome;
      const sotHome = getVal(statsHome, 'Shots on Goal', Math.max(1, Math.floor(elapsed * 0.08)));
      const sotAway = getVal(statsAway, 'Shots on Goal', Math.max(1, Math.floor(elapsed * 0.07)));
      const soffHome = getVal(statsHome, 'Shots off Goal', Math.max(1, Math.floor(elapsed * 0.06)));
      const soffAway = getVal(statsAway, 'Shots off Goal', Math.max(1, Math.floor(elapsed * 0.05)));
      const cornersHome = getVal(statsHome, 'Corner Kicks', Math.max(0, Math.floor(elapsed * 0.06)));
      const cornersAway = getVal(statsAway, 'Corner Kicks', Math.max(0, Math.floor(elapsed * 0.05)));
      const yellowHome = getVal(statsHome, 'Yellow Cards', 1);
      const yellowAway = getVal(statsAway, 'Yellow Cards', 1);
      const redHome = getVal(statsHome, 'Red Cards', 0);
      const redAway = getVal(statsAway, 'Red Cards', 0);

      const attacksHome = Math.round(elapsed * 1.2 * (possHome / 50));
      const attacksAway = Math.round(elapsed * 1.2 * (possAway / 50));
      const dangHome = Math.round(attacksHome * 0.58 + sotHome * 2);
      const dangAway = Math.round(attacksAway * 0.55 + sotAway * 2);

      const xgHome = Number(((sotHome * 0.26) + ((goals.home || 0) * 0.6)).toFixed(2));
      const xgAway = Number(((sotAway * 0.26) + ((goals.away || 0) * 0.6)).toFixed(2));

      matches.push({
        id: `apifootball-${f.id}`,
        country: league.country || 'International',
        countryCode: getCountryFlag(league.country),
        league: league.name || 'League',
        homeTeam: teams.home.name || 'Home',
        awayTeam: teams.away.name || 'Away',
        score: [goals.home || 0, goals.away || 0],
        minute: elapsed,
        status,
        source: 'API-Football',
        stats: {
          possession: [possHome, possAway],
          dangerousAttacks: [dangHome, dangAway],
          attacks: [attacksHome, attacksAway],
          shotsOnTarget: [sotHome, sotAway],
          shotsOffTarget: [soffHome, soffAway],
          corners: [cornersHome, cornersAway],
          yellowCards: [yellowHome, yellowAway],
          redCards: [redHome, redAway],
          xg: [xgHome, xgAway],
        },
        momentum: [10, -5, 15, 20, 30, dangHome - dangAway, (dangHome - dangAway) + 5, Math.min(80, Math.max(-80, dangHome - dangAway))],
        lastEvent: `${elapsed}' ${f.status?.long || 'Матч в эфире'}`,
        odds: {
          home: 1.85,
          draw: 3.3,
          away: 4.1,
          over25: 1.9,
        },
      });
    }

    if (matches.length > 0) {
      setCached(cacheKey, matches);
    }

    return { ok: true, matches, remainingQuota };
  } catch (err: any) {
    return { ok: false, matches: [], error: `Сетевая ошибка при запросе к API-Football: ${err?.message || err}` };
  }
}

// -------------------------------------------------------------
// 3. FOOTBALL-DATA.ORG INTEGRATION
// -------------------------------------------------------------
export async function fetchFootballDataMatches(apiToken: string): Promise<{ ok: boolean; matches: Match[]; error?: string }> {
  if (!apiToken) {
    return { ok: false, matches: [], error: 'Токен Football-Data.org не указан.' };
  }

  const cacheKey = `footballdata_${apiToken.slice(-5)}`;
  const cached = getCached<Match[]>(cacheKey);
  if (cached) {
    return { ok: true, matches: cached };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch('https://api.football-data.org/v4/matches', {
      headers: { 'X-Auth-Token': apiToken.trim() },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, matches: [], error: `Football-Data error (${res.status}): ${text}` };
    }

    const data = await res.json() as any;
    const items = data.matches || [];
    const matches: Match[] = [];

    for (const m of items) {
      // Keep in-play or recently finished
      const isLive = m.status === 'IN_PLAY' || m.status === 'PAUSED';
      const isFinished = m.status === 'FINISHED';
      if (!isLive && !isFinished) continue;

      const elapsed = m.minute || (m.status === 'PAUSED' ? 45 : 65);
      const homeScore = m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? 0;
      const awayScore = m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? 0;

      const dangH = Math.round(elapsed * 0.75 + homeScore * 5);
      const dangA = Math.round(elapsed * 0.65 + awayScore * 5);
      const sotH = Math.max(1, Math.floor(elapsed * 0.08) + homeScore);
      const sotA = Math.max(1, Math.floor(elapsed * 0.06) + awayScore);

      matches.push({
        id: `fd-${m.id}`,
        country: m.area?.name || 'Europe',
        countryCode: getCountryFlag(m.area?.name),
        league: m.competition?.name || 'League',
        homeTeam: m.homeTeam?.name || 'Home',
        awayTeam: m.awayTeam?.name || 'Away',
        score: [homeScore, awayScore],
        minute: elapsed,
        status: m.status === 'PAUSED' ? 'HT' : m.status === 'FINISHED' ? 'FT' : 'LIVE',
        source: 'Football-Data',
        stats: {
          possession: [52, 48],
          dangerousAttacks: [dangH, dangA],
          attacks: [Math.round(dangH * 1.7), Math.round(dangA * 1.7)],
          shotsOnTarget: [sotH, sotA],
          shotsOffTarget: [Math.max(1, sotH - 1), Math.max(1, sotA - 1)],
          corners: [Math.max(1, Math.floor(elapsed * 0.07)), Math.max(1, Math.floor(elapsed * 0.05))],
          yellowCards: [1, 2],
          redCards: [0, 0],
          xg: [Number((sotH * 0.25).toFixed(2)), Number((sotA * 0.25).toFixed(2))],
        },
        momentum: [5, 10, -5, 15, dangH - dangA],
        lastEvent: `${elapsed}' ${m.status === 'PAUSED' ? 'Перерыв' : 'В игре'}`,
        odds: { home: 2.1, draw: 3.2, away: 3.5, over25: 1.95 },
      });
    }

    if (matches.length > 0) {
      setCached(cacheKey, matches);
    }

    return { ok: true, matches };
  } catch (err: any) {
    return { ok: false, matches: [], error: `Ошибка соединения с Football-Data: ${err?.message || err}` };
  }
}

// -------------------------------------------------------------
// 4. CUSTOM WEBHOOK / JSON INGESTION ENGINE
// -------------------------------------------------------------
export function ingestMatchesFromWebhook(
  payload: any,
  secretHeader?: string,
  expectedSecret?: string
): { ok: boolean; count: number; error?: string } {
  if (expectedSecret && expectedSecret.trim().length > 0) {
    if (secretHeader !== expectedSecret.trim()) {
      return { ok: false, count: 0, error: 'Неверный x-webhook-secret авторизации.' };
    }
  }

  const items: any[] = Array.isArray(payload) ? payload : payload.matches ? payload.matches : [payload];
  let addedCount = 0;

  for (const raw of items) {
    if (!raw.homeTeam || !raw.awayTeam) continue;

    const id = String(raw.id || `wh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    const score: [number, number] = Array.isArray(raw.score)
      ? [Number(raw.score[0] || 0), Number(raw.score[1] || 0)]
      : [Number(raw.homeScore || 0), Number(raw.awayScore || 0)];

    const minute = Number(raw.minute || 1);
    const rawStats = raw.stats || {};

    const stats: MatchStats = {
      possession: Array.isArray(rawStats.possession) ? [rawStats.possession[0] || 50, rawStats.possession[1] || 50] : [50, 50],
      dangerousAttacks: Array.isArray(rawStats.dangerousAttacks) ? [rawStats.dangerousAttacks[0] || 0, rawStats.dangerousAttacks[1] || 0] : [Math.round(minute * 0.7), Math.round(minute * 0.6)],
      attacks: Array.isArray(rawStats.attacks) ? [rawStats.attacks[0] || 0, rawStats.attacks[1] || 0] : [Math.round(minute * 1.3), Math.round(minute * 1.2)],
      shotsOnTarget: Array.isArray(rawStats.shotsOnTarget) ? [rawStats.shotsOnTarget[0] || 0, rawStats.shotsOnTarget[1] || 0] : [Math.max(1, score[0]), Math.max(1, score[1])],
      shotsOffTarget: Array.isArray(rawStats.shotsOffTarget) ? [rawStats.shotsOffTarget[0] || 0, rawStats.shotsOffTarget[1] || 0] : [2, 2],
      corners: Array.isArray(rawStats.corners) ? [rawStats.corners[0] || 0, rawStats.corners[1] || 0] : [3, 2],
      yellowCards: Array.isArray(rawStats.yellowCards) ? [rawStats.yellowCards[0] || 0, rawStats.yellowCards[1] || 0] : [1, 1],
      redCards: Array.isArray(rawStats.redCards) ? [rawStats.redCards[0] || 0, rawStats.redCards[1] || 0] : [0, 0],
      xg: Array.isArray(rawStats.xg) ? [Number(rawStats.xg[0] || 0), Number(rawStats.xg[1] || 0)] : [Number((score[0] * 0.75 + 0.3).toFixed(2)), Number((score[1] * 0.75 + 0.3).toFixed(2))],
    };

    const match: Match = {
      id,
      country: raw.country || 'Custom Feed',
      countryCode: raw.countryCode || '🌐',
      league: raw.league || 'Custom Ingest League',
      homeTeam: String(raw.homeTeam),
      awayTeam: String(raw.awayTeam),
      score,
      minute,
      status: raw.status === 'HT' || raw.status === 'FT' ? raw.status : 'LIVE',
      source: 'Custom-Webhook',
      stats,
      momentum: Array.isArray(raw.momentum) ? raw.momentum : [10, 20, 15, 35, 40],
      lastEvent: raw.lastEvent || `${minute}' Получено через Webhook Ingestion`,
      odds: {
        home: Number(raw.odds?.home || 2.1),
        draw: Number(raw.odds?.draw || 3.2),
        away: Number(raw.odds?.away || 3.4),
        over25: Number(raw.odds?.over25 || 1.85),
      },
    };

    webhookStore.matches.set(id, match);
    addedCount++;
  }

  webhookStore.lastIngestedAt = new Date().toLocaleTimeString('ru-RU');
  webhookStore.totalReceived += addedCount;

  return { ok: true, count: addedCount };
}

export function getIngestedMatches(): { matches: Match[]; lastIngestedAt: string | null; totalReceived: number } {
  return {
    matches: Array.from(webhookStore.matches.values()),
    lastIngestedAt: webhookStore.lastIngestedAt,
    totalReceived: webhookStore.totalReceived,
  };
}

export function clearIngestedMatches(): { ok: boolean } {
  webhookStore.matches.clear();
  return { ok: true };
}

// -------------------------------------------------------------
// HELPERS
// -------------------------------------------------------------
function getCountryFlag(countryName?: string): string {
  if (!countryName) return '⚽';
  const c = countryName.toLowerCase();
  if (c.includes('england')) return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
  if (c.includes('spain')) return '🇪🇸';
  if (c.includes('italy')) return '🇮🇹';
  if (c.includes('germany')) return '🇩🇪';
  if (c.includes('france')) return '🇫🇷';
  if (c.includes('brazil')) return '🇧🇷';
  if (c.includes('portugal')) return '🇵🇹';
  if (c.includes('netherlands')) return '🇳🇱';
  if (c.includes('russia')) return '🇷🇺';
  if (c.includes('turkey')) return '🇹🇷';
  if (c.includes('europe') || c.includes('uefa')) return '🇪🇺';
  return '🌐';
}
