import { Match } from '../types';

/**
 * Standard team codes and tickers for top global sports teams (football, hockey, basketball, etc.)
 * Supports English, original language, and Cyrillic names.
 */
export const KNOWN_TEAM_CODES: Record<string, string> = {
  // English Premier League
  'arsenal': 'ARS',
  'арсенал': 'ARS',
  'chelsea': 'CHE',
  'челси': 'CHE',
  'liverpool': 'LIV',
  'ливерпуль': 'LIV',
  'manchester city': 'MCI',
  'man city': 'MCI',
  'манчестер сити': 'MCI',
  'ман сити': 'MCI',
  'manchester united': 'MUN',
  'man utd': 'MUN',
  'манчестер юнайтед': 'MUN',
  'ман юнайтед': 'MUN',
  'aston villa': 'AVL',
  'астон вилла': 'AVL',
  'tottenham': 'TOT',
  'tottenham hotspur': 'TOT',
  'тоттенхэм': 'TOT',
  'newcastle': 'NEW',
  'newcastle united': 'NEW',
  'ньюкасл': 'NEW',
  'everton': 'EVE',
  'эвертон': 'EVE',
  'brighton': 'BHA',
  'brighton & hove albion': 'BHA',
  'брайтон': 'BHA',
  'west ham': 'WHU',
  'west ham united': 'WHU',
  'вест хэм': 'WHU',
  'brentford': 'BRE',
  'брентфорд': 'BRE',
  'crystal palace': 'CRY',
  'кристал пэлас': 'CRY',
  'fulham': 'FUL',
  'фулхэм': 'FUL',
  'bournemouth': 'BOU',
  'борнмут': 'BOU',
  'wolverhampton': 'WOL',
  'wolves': 'WOL',
  'вулверхэмптон': 'WOL',
  'nottingham forest': 'NFO',
  'ноттингем форест': 'NFO',
  'leicester city': 'LEI',
  'leicester': 'LEI',
  'лестер': 'LEI',
  'southampton': 'SOU',
  'саутгемптон': 'SOU',
  'ipswich town': 'IPS',
  'ipswich': 'IPS',
  'ипсвич': 'IPS',

  // Spanish La Liga
  'real madrid': 'RMA',
  'реал мадрид': 'RMA',
  'реал': 'RMA',
  'barcelona': 'BAR',
  'fc barcelona': 'BAR',
  'барселона': 'BAR',
  'atletico madrid': 'ATM',
  'atletico': 'ATM',
  'атлетико мадрид': 'ATM',
  'атлетико': 'ATM',
  'valencia': 'VAL',
  'валенсия': 'VAL',
  'sevilla': 'SEV',
  'севилья': 'SEV',
  'real sociedad': 'RSO',
  'реал сосьедад': 'RSO',
  'athletic bilbao': 'ATH',
  'athletic club': 'ATH',
  'атлетик бильбао': 'ATH',
  'villarreal': 'VIL',
  'вильярреал': 'VIL',
  'real betis': 'BET',
  'betis': 'BET',
  'реал бетис': 'BET',
  'бетис': 'BET',
  'girona': 'GIR',
  'жирона': 'GIR',
  'getafe': 'GET',
  'хетафе': 'GET',
  'celta vigo': 'CEL',
  'celta': 'CEL',
  'сельта': 'CEL',
  'mallorca': 'MLL',
  'мальорка': 'MLL',
  'osasuna': 'OSA',
  'осасуна': 'OSA',
  'las palmas': 'LPA',
  'лас-пальмас': 'LPA',
  'rayo vallecano': 'RAY',
  'райо вальекано': 'RAY',
  'alaves': 'ALA',
  'алавес': 'ALA',
  'espanyol': 'ESP',
  'эспаньол': 'ESP',

  // Italian Serie A
  'napoli': 'NAP',
  'наполи': 'NAP',
  'cagliari': 'CAG',
  'кальяри': 'CAG',
  'juventus': 'JUV',
  'ювентус': 'JUV',
  'inter': 'INT',
  'inter milan': 'INT',
  'интер': 'INT',
  'milan': 'MIL',
  'ac milan': 'MIL',
  'милан': 'MIL',
  'roma': 'ROM',
  'as roma': 'ROM',
  'рома': 'ROM',
  'lazio': 'LAZ',
  'лацио': 'LAZ',
  'atalanta': 'ATA',
  'аталанта': 'ATA',
  'fiorentina': 'FIO',
  'фиорентина': 'FIO',
  'bologna': 'BOL',
  'болонья': 'BOL',
  'torino': 'TOR',
  'торино': 'TOR',
  'udinese': 'UDI',
  'удинезе': 'UDI',
  'genoa': 'GEN',
  'дженoa': 'GEN',
  'monza': 'MON',
  'монца': 'MON',
  'parma': 'PAR',
  'парма': 'PAR',
  'verona': 'VER',
  'hellas verona': 'VER',
  'верона': 'VER',
  'empoli': 'EMP',
  'эмполи': 'EMP',
  'como': 'COM',
  'комо': 'COM',
  'venezia': 'VEN',
  'венеция': 'VEN',
  'lecce': 'LEC',
  'лечче': 'LEC',

  // German Bundesliga
  'bayern munich': 'BAY',
  'bayern': 'BAY',
  'бавария': 'BAY',
  'hoffenheim': 'TSG',
  'tsg hoffenheim': 'TSG',
  'хоффенхайм': 'TSG',
  'borussia dortmund': 'BVB',
  'dortmund': 'BVB',
  'боруссия дортмунд': 'BVB',
  'дортмунд': 'BVB',
  'rb leipzig': 'RBL',
  'leipzig': 'RBL',
  'рб лейпциг': 'RBL',
  'лейпциг': 'RBL',
  'bayer leverkusen': 'B04',
  'leverkusen': 'B04',
  'байер': 'B04',
  'байер леверкузен': 'B04',
  'stuttgart': 'VFB',
  'штутгарт': 'VFB',
  'eintracht frankfurt': 'SGE',
  'frankfurt': 'SGE',
  'айнтрахт франкфурт': 'SGE',
  'wolfsburg': 'WOB',
  'вольфсбург': 'WOB',
  'borussia monchengladbach': 'BMG',
  'gladbach': 'BMG',
  'боруссия м': 'BMG',
  'freiburg': 'SCF',
  'фрайбург': 'SCF',
  'augsburg': 'FCA',
  'аугсбург': 'FCA',
  'werder bremen': 'SVW',
  'werder': 'SVW',
  'вердер': 'SVW',
  'mainz': 'M05',
  'mainz 05': 'M05',
  'майнц': 'M05',
  'union berlin': 'FCU',
  'унион берлин': 'FCU',
  'heidenheim': 'HDH',
  'хайденхайм': 'HDH',
  'st pauli': 'STP',
  'st. pauli': 'STP',
  'санкт-паули': 'STP',
  'bochum': 'BOC',
  'бохум': 'BOC',
  'holstein kiel': 'KSV',
  'хольштайн киль': 'KSV',

  // French Ligue 1
  'paris saint-germain': 'PSG',
  'paris saint germain': 'PSG',
  'psg': 'PSG',
  'псж': 'PSG',
  'пари сен-жермен': 'PSG',
  'monaco': 'ASM',
  'as monaco': 'ASM',
  'монако': 'ASM',
  'marseille': 'OM',
  'olympique marseille': 'OM',
  'марсель': 'OM',
  'lyon': 'OL',
  'olympique lyon': 'OL',
  'лион': 'OL',
  'lille': 'LOSC',
  'лилль': 'LOSC',
  'rennes': 'REN',
  'ренн': 'REN',
  'lens': 'RCL',
  'ланс': 'RCL',
  'nice': 'OGCN',
  'ницца': 'OGCN',

  // Other Top Clubs
  'benfica': 'SLB',
  'бенфика': 'SLB',
  'sporting': 'SCP',
  'sporting cp': 'SCP',
  'спортинг': 'SCP',
  'porto': 'FCP',
  'порту': 'FCP',
  'ajax': 'AJX',
  'аякс': 'AJX',
  'psv': 'PSV',
  'псв': 'PSV',
  'feyenoord': 'FEY',
  'фейеноорд': 'FEY',
  'flamengo': 'FLA',
  'фламенго': 'FLA',
  'palmeiras': 'PAL',
  'палмейрас': 'PAL',
  'santos': 'SAN',
  'сантос': 'SAN',
  'corinthians': 'COR',
  'коринтианс': 'COR',
  'sao paulo': 'SAO',
  'сан-паулу': 'SAO',
  'boca juniors': 'BOC',
  'бока хуниорс': 'BOC',
  'river plate': 'RIV',
  'ривер плейт': 'RIV',
  'galatasaray': 'GS',
  'галатасарай': 'GS',
  'fenerbahce': 'FB',
  'фенербахче': 'FB',
  'besiktas': 'BJK',
  'бешикташ': 'BJK',
  'celtic': 'CEL',
  'селтик': 'CEL',
  'rangers': 'RAN',
  'рейнджерс': 'RAN',

  // Russian / CIS & KHL / Hockey
  'зенит': 'ZEN',
  'zenit': 'ZEN',
  'спартак': 'SPA',
  'spartak': 'SPA',
  'цска': 'CSK',
  'цска москва': 'CSK',
  'cska': 'CSK',
  'cska moscow': 'CSK',
  'динамо': 'DYN',
  'динамо москва': 'DYN',
  'dynamo': 'DYN',
  'dynamo moscow': 'DYN',
  'локомотив': 'LOK',
  'lokomotiv': 'LOK',
  'краснодар': 'KRA',
  'krasnodar': 'KRA',
  'ска': 'SKA',
  'ска санкт-петербург': 'SKA',
  'ska': 'SKA',
  'ska saint petersburg': 'SKA',
  'ак барс': 'AKB',
  'ak bars': 'AKB',
  'авангард': 'AVG',
  'avangard': 'AVG',
  'салават юлаев': 'SAL',
  'salavat yulaev': 'SAL',
  'металлург': 'MMG',
  'metallurg': 'MMG',
};

/**
 * Common prefixes and noise words stripped when generating ticker abbreviations.
 */
const STRIP_WORDS = new Set([
  'fc', 'fk', 'cf', 'sc', 'afc', 'ac', 'bk', 'bc', 'hc', 'hk',
  'фк', 'хк', 'бк', 'кф', 'ск', 'afc', 'ssc', 'as', 'us', 'sv', 'vfb', 'tsv',
]);

/**
 * Deterministically generates a 3-character uppercase ticker code for any team name.
 */
export function generateTeamCode(teamName: string): string {
  if (!teamName || !teamName.trim()) return 'UNK';

  const clean = teamName
    .trim()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const words = clean.split(/\s+/).filter((w) => w && !STRIP_WORDS.has(w.toLowerCase()));

  if (words.length >= 3) {
    return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  }

  if (words.length === 2) {
    const w1 = words[0];
    const w2 = words[1];
    // e.g. "Aston Villa" -> AVL, "Real Madrid" -> RMA
    if (w1.length >= 2 && w2.length >= 1) {
      return (w1[0] + w2[0] + (w2[1] || w1[1])).toUpperCase();
    }
    return (w1.slice(0, 2) + w2.slice(0, 1)).toUpperCase();
  }

  const single = words[0] || clean;
  if (single.length >= 3) {
    return single.slice(0, 3).toUpperCase();
  }

  return single.toUpperCase().padEnd(3, 'X');
}

/**
 * Resolves the 3-letter ticker code for a team name.
 */
export function getTeamCode(teamName: string, explicitCode?: string): string {
  if (explicitCode && explicitCode.trim()) {
    return explicitCode.trim().toUpperCase();
  }
  if (!teamName) return 'UNK';

  const normalized = teamName.trim().toLowerCase();
  if (KNOWN_TEAM_CODES[normalized]) {
    return KNOWN_TEAM_CODES[normalized];
  }

  // Check without FC/FK
  const stripped = normalized
    .replace(/^(fc|fk|ac|as|фк|хк|бк)\s+/i, '')
    .replace(/\s+(fc|fk)$/i, '')
    .trim();

  if (KNOWN_TEAM_CODES[stripped]) {
    return KNOWN_TEAM_CODES[stripped];
  }

  return generateTeamCode(teamName);
}

/**
 * Returns home code, away code, and hyphenated match code for a match.
 */
export function getMatchTeamCodes(match: {
  homeTeam: string;
  awayTeam: string;
  homeTeamCode?: string;
  awayTeamCode?: string;
}): {
  homeCode: string;
  awayCode: string;
  matchCode: string;
} {
  const homeCode = getTeamCode(match.homeTeam, match.homeTeamCode);
  const awayCode = getTeamCode(match.awayTeam, match.awayTeamCode);
  const matchCode = `${homeCode}-${awayCode}`;
  return { homeCode, awayCode, matchCode };
}

export type SearchMatchType = 'id' | 'team_code' | 'match_code' | 'team_name' | 'league' | 'country';

export interface MatchSearchResult {
  matches: boolean;
  matchType?: SearchMatchType;
  matchedTerm?: string;
}

/**
 * Normalizes query string for match ID comparisons.
 * Extracts raw ID from `#m-1`, `id:m-1`, `id : m-1`, `ID=m-1`, etc.
 */
function extractMatchIdQuery(rawQuery: string): string {
  const q = rawQuery.trim().toLowerCase();
  if (q.startsWith('#')) return q.slice(1).trim();
  if (q.startsWith('id:')) return q.slice(3).trim();
  if (q.startsWith('id=')) return q.slice(3).trim();
  if (q.startsWith('id :')) return q.slice(4).trim();
  return q;
}

/**
 * Checks if a match satisfies a single search token.
 */
function tokenMatchesMatch(match: Match, token: string): boolean {
  if (!token) return true;
  const t = token.toLowerCase();

  // 1. Direct Match ID checks
  const matchIdLower = match.id.toLowerCase();
  const idQuery = extractMatchIdQuery(t);

  // Exact ID match: "m-1", "#m-1", "id:m-1"
  if (matchIdLower === idQuery) return true;
  // Substring match in ID
  if (matchIdLower.includes(idQuery)) return true;
  // Alphanumeric strip: user typed "m1" for "m-1"
  const strippedMatchId = matchIdLower.replace(/[^a-z0-9]/g, '');
  const strippedQuery = idQuery.replace(/[^a-z0-9]/g, '');
  if (strippedQuery && strippedMatchId === strippedQuery) return true;

  // 2. Team Codes check
  const { homeCode, awayCode, matchCode } = getMatchTeamCodes(match);
  const homeCodeLower = homeCode.toLowerCase();
  const awayCodeLower = awayCode.toLowerCase();
  const matchCodeLower = matchCode.toLowerCase();

  // Check prefix "code:ARS" or "tag:CHE"
  if (t.startsWith('code:') || t.startsWith('tag:')) {
    const codeQuery = t.replace(/^(code:|tag:)/, '').trim();
    if (codeQuery) {
      return homeCodeLower === codeQuery || awayCodeLower === codeQuery || matchCodeLower.includes(codeQuery);
    }
  }

  // Exact code match or hyphenated match code: "ARS", "CHE", "ARS-CHE", "ARSCHE"
  if (homeCodeLower === t || awayCodeLower === t) return true;
  if (matchCodeLower === t || matchCodeLower.replace('-', '') === t.replace(/[-\s/_vs.]/g, '')) return true;

  // 3. Team Names
  if (match.homeTeam.toLowerCase().includes(t)) return true;
  if (match.awayTeam.toLowerCase().includes(t)) return true;

  // 4. League & Country
  if (match.league.toLowerCase().includes(t)) return true;
  if (match.country.toLowerCase().includes(t)) return true;

  return false;
}

/**
 * Evaluates whether a match meets the search query in the Live View.
 * Supports:
 * - Match ID: 'm-1', '#m-1', 'id:m-1', 'm1'
 * - Unique Team Codes: 'ARS', 'CHE', 'ARS-CHE', 'code:ARS'
 * - Standard Team Names: 'Arsenal', 'Chelsea'
 * - League, Country, and multi-word tokenized search: 'ARS vs CHE', 'm-1 Live'
 */
export function isMatchSearchMatch(match: Match, rawQuery: string): boolean {
  if (!rawQuery || !rawQuery.trim()) return true;

  const trimmed = rawQuery.trim();

  // Single fast check for exact ID search
  const cleanIdQuery = extractMatchIdQuery(trimmed);
  if (cleanIdQuery && match.id.toLowerCase() === cleanIdQuery) {
    return true;
  }

  // Check team code exact match
  const { homeCode, awayCode, matchCode } = getMatchTeamCodes(match);
  const upperTrimmed = trimmed.toUpperCase();
  if (upperTrimmed === homeCode || upperTrimmed === awayCode || upperTrimmed === matchCode) {
    return true;
  }

  // Check match code variations (e.g. "ARS vs CHE", "ARS/CHE", "ARS CHE", "ARS-CHE")
  const normalizedMatchCodeQuery = trimmed.replace(/\s+(vs|v|-|\/)\s+/gi, '-').toUpperCase();
  if (normalizedMatchCodeQuery === matchCode) {
    return true;
  }

  // Multi-token evaluation: all space-separated tokens must match something in the match
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 1) {
    return tokenMatchesMatch(match, tokens[0]);
  }

  // If user typed e.g. "Arsenal Chelsea" or "m-1 ARS" or "LIV AVL"
  return tokens.every((token) => tokenMatchesMatch(match, token));
}

/**
 * Detects the specific reason a match was matched (for UI pills/badges).
 */
export function getMatchSearchReason(match: Match, rawQuery: string): SearchMatchType | null {
  if (!rawQuery || !rawQuery.trim()) return null;
  const t = rawQuery.trim().toLowerCase();
  const idQuery = extractMatchIdQuery(t);

  if (match.id.toLowerCase() === idQuery || (idQuery && match.id.toLowerCase().includes(idQuery))) {
    return 'id';
  }

  const { homeCode, awayCode, matchCode } = getMatchTeamCodes(match);
  const upper = rawQuery.trim().toUpperCase();
  if (upper === homeCode || upper === awayCode) {
    return 'team_code';
  }
  if (upper === matchCode || upper === matchCode.replace('-', '')) {
    return 'match_code';
  }

  if (match.homeTeam.toLowerCase().includes(t) || match.awayTeam.toLowerCase().includes(t)) {
    return 'team_name';
  }

  if (match.league.toLowerCase().includes(t)) return 'league';
  if (match.country.toLowerCase().includes(t)) return 'country';

  return null;
}
