import { describe, it, expect } from 'vitest';
import {
  KNOWN_TEAM_CODES,
  generateTeamCode,
  getTeamCode,
  getMatchTeamCodes,
  isMatchSearchMatch,
  getMatchSearchReason,
} from '../src/utils/teamCodes';
import { Match } from '../src/types';

describe('Match Search Bar & Team Code Identification System', () => {
  const sampleMatches: Match[] = [
    {
      id: 'm-1',
      country: 'England',
      countryCode: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      league: 'Premier League',
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      score: [1, 1],
      minute: 68,
      status: 'LIVE',
      source: 'Flashscore',
      stats: {
        possession: [58, 42],
        dangerousAttacks: [64, 38],
        attacks: [112, 74],
        shotsOnTarget: [7, 3],
        shotsOffTarget: [6, 2],
        corners: [8, 2],
        yellowCards: [2, 3],
        redCards: [0, 0],
        xg: [1.82, 0.94],
      },
      momentum: [15, 30, 45, 60, -20, 55, 70, 65],
      lastEvent: "67' Опасный удар",
      odds: { home: 1.65, draw: 3.4, away: 5.5, over25: 1.62 },
    },
    {
      id: 'm-8',
      country: 'Germany',
      countryCode: '🇩🇪',
      league: 'Bundesliga',
      homeTeam: 'Bayern Munich',
      awayTeam: 'Hoffenheim',
      score: [1, 0],
      minute: 28,
      status: 'LIVE',
      source: 'Flashscore',
      stats: {
        possession: [74, 26],
        dangerousAttacks: [42, 11],
        attacks: [65, 20],
        shotsOnTarget: [5, 1],
        shotsOffTarget: [4, 1],
        corners: [5, 1],
        yellowCards: [0, 1],
        redCards: [0, 0],
        xg: [1.62, 0.15],
      },
      momentum: [65, 80, 85, 90],
      lastEvent: "27' Удар в перекладину",
      odds: { home: 1.18, draw: 7.5, away: 14.0, over25: 1.38 },
    },
    {
      id: 'm-9',
      country: 'England',
      countryCode: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      league: 'Premier League',
      homeTeam: 'Liverpool',
      awayTeam: 'Aston Villa',
      score: [1, 2],
      minute: 82,
      status: 'LIVE',
      source: 'Flashscore',
      stats: {
        possession: [65, 35],
        dangerousAttacks: [78, 28],
        attacks: [126, 54],
        shotsOnTarget: [8, 3],
        shotsOffTarget: [7, 2],
        corners: [10, 3],
        yellowCards: [2, 3],
        redCards: [0, 0],
        xg: [2.35, 1.1],
      },
      momentum: [50, 70, 80, 85, 92, 95],
      lastEvent: "81' Сейв вратаря",
      odds: { home: 1.55, draw: 3.9, away: 5.8, over25: 1.6 },
    },
  ];

  describe('Team Code Resolution', () => {
    it('resolves known team codes for top clubs', () => {
      expect(getTeamCode('Arsenal')).toBe('ARS');
      expect(getTeamCode('Chelsea')).toBe('CHE');
      expect(getTeamCode('Bayern Munich')).toBe('BAY');
      expect(getTeamCode('Hoffenheim')).toBe('TSG');
      expect(getTeamCode('Liverpool')).toBe('LIV');
      expect(getTeamCode('Aston Villa')).toBe('AVL');
      expect(getTeamCode('Napoli')).toBe('NAP');
      expect(getTeamCode('Real Madrid')).toBe('RMA');
      expect(getTeamCode('Barcelona')).toBe('BAR');
      expect(getTeamCode('Juventus')).toBe('JUV');
    });

    it('resolves Cyrillic team names to standard tickers', () => {
      expect(getTeamCode('Арсенал')).toBe('ARS');
      expect(getTeamCode('Челси')).toBe('CHE');
      expect(getTeamCode('Бавария')).toBe('BAY');
      expect(getTeamCode('Ливерпуль')).toBe('LIV');
      expect(getTeamCode('Манчестер Сити')).toBe('MCI');
    });

    it('generates deterministic ticker code for arbitrary club names', () => {
      const code = generateTeamCode('Borussia Monchengladbach');
      expect(code.length).toBeGreaterThanOrEqual(2);
      expect(code).toBe(code.toUpperCase());

      const code2 = generateTeamCode('FC Midtjylland');
      expect(code2.length).toBeGreaterThanOrEqual(2);
    });

    it('builds composite match codes correctly', () => {
      const codes = getMatchTeamCodes(sampleMatches[0]);
      expect(codes.homeCode).toBe('ARS');
      expect(codes.awayCode).toBe('CHE');
      expect(codes.matchCode).toBe('ARS-CHE');
    });
  });

  describe('Match ID Search', () => {
    it('locates match by exact ID', () => {
      expect(isMatchSearchMatch(sampleMatches[0], 'm-1')).toBe(true);
      expect(isMatchSearchMatch(sampleMatches[1], 'm-1')).toBe(false);
      expect(getMatchSearchReason(sampleMatches[0], 'm-1')).toBe('id');
    });

    it('locates match by hash prefix #ID', () => {
      expect(isMatchSearchMatch(sampleMatches[0], '#m-1')).toBe(true);
      expect(isMatchSearchMatch(sampleMatches[1], '#m-1')).toBe(false);
      expect(isMatchSearchMatch(sampleMatches[1], '#m-8')).toBe(true);
    });

    it('locates match by id: prefix query', () => {
      expect(isMatchSearchMatch(sampleMatches[0], 'id:m-1')).toBe(true);
      expect(isMatchSearchMatch(sampleMatches[1], 'id: m-8')).toBe(true);
      expect(isMatchSearchMatch(sampleMatches[2], 'id:m-9')).toBe(true);
    });

    it('locates match by simplified alphanumeric number query (m1, 1)', () => {
      expect(isMatchSearchMatch(sampleMatches[0], 'm1')).toBe(true);
      expect(isMatchSearchMatch(sampleMatches[1], 'm8')).toBe(true);
    });
  });

  describe('Unique Team Code Search', () => {
    it('locates match by 3-letter home team code', () => {
      expect(isMatchSearchMatch(sampleMatches[0], 'ARS')).toBe(true);
      expect(isMatchSearchMatch(sampleMatches[1], 'ARS')).toBe(false);
      expect(getMatchSearchReason(sampleMatches[0], 'ARS')).toBe('team_code');
    });

    it('locates match by 3-letter away team code', () => {
      expect(isMatchSearchMatch(sampleMatches[0], 'CHE')).toBe(true);
      expect(isMatchSearchMatch(sampleMatches[1], 'CHE')).toBe(false);
      expect(getMatchSearchReason(sampleMatches[0], 'CHE')).toBe('team_code');
    });

    it('locates match with lowercase team codes', () => {
      expect(isMatchSearchMatch(sampleMatches[0], 'ars')).toBe(true);
      expect(isMatchSearchMatch(sampleMatches[0], 'che')).toBe(true);
      expect(isMatchSearchMatch(sampleMatches[1], 'bay')).toBe(true);
      expect(isMatchSearchMatch(sampleMatches[2], 'liv')).toBe(true);
    });

    it('locates match by hyphenated match code (ARS-CHE)', () => {
      expect(isMatchSearchMatch(sampleMatches[0], 'ARS-CHE')).toBe(true);
      expect(isMatchSearchMatch(sampleMatches[1], 'ARS-CHE')).toBe(false);
      expect(isMatchSearchMatch(sampleMatches[1], 'BAY-TSG')).toBe(true);
    });

    it('locates match by "vs" formatted code (ARS vs CHE, LIV vs AVL)', () => {
      expect(isMatchSearchMatch(sampleMatches[0], 'ARS vs CHE')).toBe(true);
      expect(isMatchSearchMatch(sampleMatches[2], 'LIV vs AVL')).toBe(true);
    });

    it('supports code: query prefix', () => {
      expect(isMatchSearchMatch(sampleMatches[0], 'code:ARS')).toBe(true);
      expect(isMatchSearchMatch(sampleMatches[0], 'code:CHE')).toBe(true);
      expect(isMatchSearchMatch(sampleMatches[1], 'code:BAY')).toBe(true);
    });
  });

  describe('Standard and Multi-Token Search', () => {
    it('maintains compatibility with team name search', () => {
      expect(isMatchSearchMatch(sampleMatches[0], 'Arsenal')).toBe(true);
      expect(isMatchSearchMatch(sampleMatches[0], 'Chelsea')).toBe(true);
      expect(isMatchSearchMatch(sampleMatches[1], 'Bayern')).toBe(true);
    });

    it('maintains compatibility with league and country search', () => {
      expect(isMatchSearchMatch(sampleMatches[0], 'Premier League')).toBe(true);
      expect(isMatchSearchMatch(sampleMatches[1], 'Bundesliga')).toBe(true);
      expect(isMatchSearchMatch(sampleMatches[1], 'Germany')).toBe(true);
    });

    it('supports multi-token combined search (e.g. ID and team code)', () => {
      expect(isMatchSearchMatch(sampleMatches[0], 'm-1 ARS')).toBe(true);
      expect(isMatchSearchMatch(sampleMatches[0], '#m-1 Chelsea')).toBe(true);
      expect(isMatchSearchMatch(sampleMatches[2], 'Premier LIV')).toBe(true);
    });

    it('returns true for empty or whitespace query', () => {
      expect(isMatchSearchMatch(sampleMatches[0], '')).toBe(true);
      expect(isMatchSearchMatch(sampleMatches[0], '   ')).toBe(true);
    });
  });
});
