import { Match, HistoricalMatch, HistoricalSnapshot } from '../types';

const STORAGE_KEY = 'footbalmonitor_live_accumulated_matches_v1';
const MAX_MATCHES_LIMIT = 80;
const MAX_SNAPSHOTS_PER_MATCH = 10;

// In-memory fallback cache so the app never loses data or crashes if localStorage quota is reached
let memoryCache: HistoricalMatch[] | null = null;

/**
 * Creates a compact snapshot containing only essential properties for backtesting
 */
function createCompactSnapshot(m: Match): HistoricalSnapshot {
  return {
    minute: m.minute || 1,
    score: [m.score[0], m.score[1]],
    stats: {
      possession: [m.stats.possession[0] || 50, m.stats.possession[1] || 50],
      dangerousAttacks: [m.stats.dangerousAttacks[0] || 0, m.stats.dangerousAttacks[1] || 0],
      attacks: [m.stats.attacks[0] || 0, m.stats.attacks[1] || 0],
      shotsOnTarget: [m.stats.shotsOnTarget[0] || 0, m.stats.shotsOnTarget[1] || 0],
      shotsOffTarget: [m.stats.shotsOffTarget[0] || 0, m.stats.shotsOffTarget[1] || 0],
      corners: [m.stats.corners[0] || 0, m.stats.corners[1] || 0],
      yellowCards: [m.stats.yellowCards[0] || 0, m.stats.yellowCards[1] || 0],
      redCards: [m.stats.redCards[0] || 0, m.stats.redCards[1] || 0],
      xg: [m.stats.xg[0] || 0, m.stats.xg[1] || 0],
    },
    odds: m.odds ? {
      home: m.odds.home,
      draw: m.odds.draw,
      away: m.odds.away,
      over25: m.odds.over25,
      under25: m.odds.under25,
      btts: m.odds.btts,
    } : undefined,
    oddsDrop: m.oddsDrop ? {
      market: m.oddsDrop.market,
      marketName: m.oddsDrop.marketName || '',
      initialOdds: m.oddsDrop.initialOdds || 0,
      currentOdds: m.oddsDrop.currentOdds || 0,
      dropPercent: m.oddsDrop.dropPercent || 0,
      moneyVolumePercent: m.oddsDrop.moneyVolumePercent || 0,
      moneyVolumeAmountEur: m.oddsDrop.moneyVolumeAmountEur,
      detectedAtMinute: m.oddsDrop.detectedAtMinute,
    } : undefined,
  };
}

/**
 * Converts a current live or finished Match into a lightweight HistoricalMatch format
 */
export function convertLiveMatchToHistorical(match: Match): HistoricalMatch {
  const finalCorners: [number, number] = [match.stats.corners[0] || 0, match.stats.corners[1] || 0];
  const finalYellowCards: [number, number] = [match.stats.yellowCards[0] || 0, match.stats.yellowCards[1] || 0];
  const finalRedCards: [number, number] = [match.stats.redCards[0] || 0, match.stats.redCards[1] || 0];
  const finalScore: [number, number] = [match.score[0] || 0, match.score[1] || 0];

  return {
    id: match.id,
    date: match.startTime || new Date().toISOString().slice(0, 10),
    league: match.league || 'Неизвестная лига',
    country: match.country || 'Мир',
    countryCode: match.countryCode || '🌐',
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    finalScore,
    finalCorners,
    finalYellowCards,
    finalRedCards,
    snapshots: [createCompactSnapshot(match)],
  };
}

/**
 * Load accumulated live matches safely from localStorage with in-memory caching
 */
export function loadAccumulatedLiveMatches(): HistoricalMatch[] {
  if (memoryCache && memoryCache.length > 0) {
    return memoryCache;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      memoryCache = parsed;
      return parsed;
    }
  } catch (err) {
    console.warn('Accumulated live matches: read failed, using empty list', err);
  }
  return [];
}

/**
 * Robust storage persistence with multi-level compression and QuotaExceededError protection
 */
function safePersistMatches(matches: HistoricalMatch[]): number {
  memoryCache = matches;

  // Level 1: store up to MAX_MATCHES_LIMIT (80)
  let payload = matches.slice(-MAX_MATCHES_LIMIT);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return payload.length;
  } catch (e1) {
    // Level 2: reduce to 40 matches, max 6 snapshots each, omit history
    try {
      payload = payload.slice(-40).map((m) => ({
        ...m,
        history: undefined,
        snapshots: m.snapshots.slice(-6),
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return payload.length;
    } catch (e2) {
      // Level 3: reduce to 20 matches, max 4 snapshots each
      try {
        payload = payload.slice(-20).map((m) => ({
          ...m,
          history: undefined,
          snapshots: m.snapshots.slice(-4),
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        return payload.length;
      } catch (e3) {
        // Level 4: reduce to 10 matches, only initial and latest snapshot
        try {
          payload = payload.slice(-10).map((m) => ({
            ...m,
            history: undefined,
            snapshots: m.snapshots.length > 2
              ? [m.snapshots[0], m.snapshots[m.snapshots.length - 1]]
              : m.snapshots,
          }));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
          return payload.length;
        } catch (e4) {
          // If browser storage is completely saturated by other keys, clean this key
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {}
          return memoryCache.length;
        }
      }
    }
  }
}

/**
 * Save / append matches to accumulated database.
 * Throttles snapshot additions to avoid exploding storage size.
 */
export function saveMatchesToAccumulatedLiveDB(incomingMatches: Match[]): number {
  if (!incomingMatches || incomingMatches.length === 0) return 0;

  try {
    const current = loadAccumulatedLiveMatches();
    const map = new Map<string, HistoricalMatch>();

    for (const m of current) {
      map.set(m.id, m);
    }

    for (const m of incomingMatches) {
      if (!m.id || !m.homeTeam || !m.awayTeam) continue;

      const existing = map.get(m.id);
      const newSnapshot = createCompactSnapshot(m);

      if (existing) {
        // Update final status
        existing.finalScore = [m.score[0] || 0, m.score[1] || 0];
        existing.finalCorners = [m.stats.corners[0] || 0, m.stats.corners[1] || 0];
        existing.finalYellowCards = [m.stats.yellowCards[0] || 0, m.stats.yellowCards[1] || 0];
        existing.finalRedCards = [m.stats.redCards[0] || 0, m.stats.redCards[1] || 0];

        // Check if snapshot should be recorded (throttling):
        // Record only if score changed, red card occurred, or >= 5 minutes passed since last snapshot
        const snaps = existing.snapshots;
        const lastSnap = snaps[snaps.length - 1];

        const scoreChanged = !lastSnap || lastSnap.score[0] !== m.score[0] || lastSnap.score[1] !== m.score[1];
        const redCardChanged = !lastSnap || (m.stats.redCards[0] + m.stats.redCards[1] > (lastSnap.stats.redCards[0] + lastSnap.stats.redCards[1]));
        const timeElapsed = !lastSnap || (m.minute - lastSnap.minute >= 5);
        const isSignificantMinute = m.minute === 45 || m.minute === 90;

        if (scoreChanged || redCardChanged || timeElapsed || isSignificantMinute) {
          if (lastSnap && lastSnap.minute === m.minute) {
            // Replace snapshot at same minute to keep latest state
            snaps[snaps.length - 1] = newSnapshot;
          } else {
            snaps.push(newSnapshot);
          }

          // Enforce max snapshots limit per match (keep first, middle samples, and latest)
          if (snaps.length > MAX_SNAPSHOTS_PER_MATCH) {
            existing.snapshots = [
              snaps[0],
              ...snaps.slice(-(MAX_SNAPSHOTS_PER_MATCH - 1)),
            ];
          }
        }
      } else {
        const hist = convertLiveMatchToHistorical(m);
        map.set(m.id, hist);
      }
    }

    const updatedList = Array.from(map.values());
    return safePersistMatches(updatedList);
  } catch (err) {
    console.warn('Accumulated live matches: safe update caught error', err);
    return memoryCache ? memoryCache.length : 0;
  }
}

/**
 * Clear the accumulated live matches database (reset from scratch)
 */
export function clearAccumulatedLiveDB(): void {
  memoryCache = [];
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear accumulated live matches', err);
  }
}
