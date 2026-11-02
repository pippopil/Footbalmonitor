import { StrategyExecutionAuditLog, SignalAlert, Match, FilterRule, SignalOutcome, SportType } from '../types';
import { PRESET_STRATEGY_NUMBER_BY_ID } from '../utils/filterDefaults';

const STORAGE_KEY = 'footbalmonitor_strategy_audit_logs';

/**
 * Loads cached strategy execution audit logs from localStorage.
 */
export function getStrategyAuditLogs(): StrategyExecutionAuditLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to load strategy audit logs from localStorage:', err);
    return [];
  }
}

/**
 * Saves strategy execution audit logs to localStorage and optionally syncs with server.
 */
function saveStrategyAuditLogs(logs: StrategyExecutionAuditLog[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Keep last 500 audit logs to prevent storage exhaustion
    const sliced = logs.slice(0, 500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sliced));
  } catch (err) {
    console.warn('Failed to save strategy audit logs to localStorage:', err);
  }
}

/**
 * Syncs an audit log entry with the backend API for persistent storage.
 */
async function syncAuditLogWithServer(log: StrategyExecutionAuditLog): Promise<void> {
  try {
    await fetch('/api/strategy-audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
  } catch {
    // Best effort background sync
  }
}

/**
 * Logs the initial execution of a strategy at the exact moment the signal is triggered.
 * Records:
 * - Signal ID & Strategy ID
 * - Numbers for Goals, Corners, Yellow Cards, Red Cards at signal dispatch
 */
export function logStrategyTrigger(
  signal: SignalAlert,
  match: Match,
  rule?: FilterRule
): StrategyExecutionAuditLog {
  const currentLogs = getStrategyAuditLogs();

  // Deduplicate: avoid duplicate log for exact same signalId
  const existingIdx = currentLogs.findIndex((l) => l.signalId === signal.id);
  if (existingIdx !== -1) {
    return currentLogs[existingIdx];
  }

  // Parse initial score and goals
  const scoreParts = (signal.score || `${match.score[0]}:${match.score[1]}`)
    .split(':')
    .map((s) => parseInt(s.trim(), 10));
  const initHomeGoals = isNaN(scoreParts[0]) ? (match.score[0] ?? 0) : scoreParts[0];
  const initAwayGoals = isNaN(scoreParts[1]) ? (match.score[1] ?? 0) : scoreParts[1];
  const initTotalGoals = initHomeGoals + initAwayGoals;

  // Parse initial corners
  const initCornH = signal.statsSnapshot?.corners?.[0] ?? match.stats?.corners?.[0] ?? 0;
  const initCornA = signal.statsSnapshot?.corners?.[1] ?? match.stats?.corners?.[1] ?? 0;
  const initTotalCorners = initCornH + initCornA;

  // Parse initial yellow cards
  const initYellowH = signal.statsSnapshot?.yellowCards?.[0] ?? match.stats?.yellowCards?.[0] ?? 0;
  const initYellowA = signal.statsSnapshot?.yellowCards?.[1] ?? match.stats?.yellowCards?.[1] ?? 0;
  const initTotalYellow = initYellowH + initYellowA;

  // Parse initial red cards
  const initRedH = signal.statsSnapshot?.redCards?.[0] ?? match.stats?.redCards?.[0] ?? 0;
  const initRedA = signal.statsSnapshot?.redCards?.[1] ?? match.stats?.redCards?.[1] ?? 0;
  const initTotalRed = initRedH + initRedA;

  const stratId = rule?.id || signal.ruleId || 'custom-rule';
  const stratNum = PRESET_STRATEGY_NUMBER_BY_ID[stratId];

  const auditEntry: StrategyExecutionAuditLog = {
    id: `audit_${signal.id}`,
    signalId: signal.id,
    strategyId: stratId,
    strategyNumber: stratNum,
    strategyName: rule?.name || signal.ruleName,
    strategyCategory: rule?.category || signal.ruleCategory || 'general',
    matchId: match.id,
    matchName: signal.matchName || `${match.homeTeam} vs ${match.awayTeam}`,
    league: match.league,
    country: match.country,
    sport: (match.sport || signal.sport || 'football') as SportType,
    targetMarket: signal.marketSuggestion || rule?.targetMarket,
    odds: signal.odds || 1.8,
    status: 'TRIGGERED',
    outcome: signal.outcome || 'PENDING',
    triggeredAt: signal.timestamp || new Date().toISOString(),

    // Moment of signal dispatch numbers
    initialMinute: signal.minute || match.minute,
    initialScore: `${initHomeGoals}:${initAwayGoals}`,
    initialGoals: {
      home: initHomeGoals,
      away: initAwayGoals,
      total: initTotalGoals,
    },
    initialCorners: {
      home: initCornH,
      away: initCornA,
      total: initTotalCorners,
    },
    initialYellowCards: {
      home: initYellowH,
      away: initYellowA,
      total: initTotalYellow,
    },
    initialRedCards: {
      home: initRedH,
      away: initRedA,
      total: initTotalRed,
    },

    // Zero delta initially
    deltaGoals: 0,
    deltaCorners: 0,
    deltaYellowCards: 0,
    deltaRedCards: 0,
    metricSummary: signal.strategyMetricSnapshot?.initialValueText,
  };

  const updatedLogs = [auditEntry, ...currentLogs];
  saveStrategyAuditLogs(updatedLogs);
  syncAuditLogWithServer(auditEntry);

  return auditEntry;
}

/**
 * Logs the completion and final result of a strategy upon match finish or resolution.
 * Updates the audit record with:
 * - Final Score & Goals
 * - Final Corners
 * - Final Yellow Cards & Red Cards
 * - Resulting Deltas (+X goals, +Y corners, +Z cards after signal)
 * - Final Outcome (WIN, LOSS, REFUND)
 */
export function logStrategyResolution(
  signalId: string,
  finalScore: string,
  finalStats?: {
    corners?: [number, number];
    yellowCards?: [number, number];
    redCards?: [number, number];
    homeScore?: number;
    awayScore?: number;
  },
  outcome?: SignalOutcome,
  resolutionNote?: string,
  profit?: number
): StrategyExecutionAuditLog | null {
  const currentLogs = getStrategyAuditLogs();
  const existingIdx = currentLogs.findIndex((l) => l.signalId === signalId);
  if (existingIdx === -1) {
    return null;
  }

  const existing = currentLogs[existingIdx];

  // Parse final goals
  const scoreParts = finalScore.split(':').map((s) => parseInt(s.trim(), 10));
  const finalHomeGoals = !isNaN(scoreParts[0])
    ? scoreParts[0]
    : (finalStats?.homeScore ?? existing.initialGoals.home);
  const finalAwayGoals = !isNaN(scoreParts[1])
    ? scoreParts[1]
    : (finalStats?.awayScore ?? existing.initialGoals.away);
  const finalTotalGoals = finalHomeGoals + finalAwayGoals;

  // Parse final corners
  const finalCornH = finalStats?.corners?.[0] ?? existing.finalCorners?.home ?? existing.initialCorners.home;
  const finalCornA = finalStats?.corners?.[1] ?? existing.finalCorners?.away ?? existing.initialCorners.away;
  const finalTotalCorners = finalCornH + finalCornA;

  // Parse final yellow cards
  const finalYellowH = finalStats?.yellowCards?.[0] ?? existing.finalYellowCards?.home ?? existing.initialYellowCards.home;
  const finalYellowA = finalStats?.yellowCards?.[1] ?? existing.finalYellowCards?.away ?? existing.initialYellowCards.away;
  const finalTotalYellow = finalYellowH + finalYellowA;

  // Parse final red cards
  const finalRedH = finalStats?.redCards?.[0] ?? existing.finalRedCards?.home ?? existing.initialRedCards.home;
  const finalRedA = finalStats?.redCards?.[1] ?? existing.finalRedCards?.away ?? existing.initialRedCards.away;
  const finalTotalRed = finalRedH + finalRedA;

  // Deltas from signal moment to final whistle
  const deltaGoals = finalTotalGoals - existing.initialGoals.total;
  const deltaCorners = finalTotalCorners - existing.initialCorners.total;
  const deltaYellowCards = finalTotalYellow - existing.initialYellowCards.total;
  const deltaRedCards = finalTotalRed - existing.initialRedCards.total;

  const resolvedAt = new Date().toISOString();
  const resolvedOutcome = outcome || existing.outcome;

  const updatedEntry: StrategyExecutionAuditLog = {
    ...existing,
    status: 'RESOLVED',
    outcome: resolvedOutcome,
    resolvedAt,
    finalMinute: 90,
    finalScore: `${finalHomeGoals}:${finalAwayGoals}`,
    finalGoals: {
      home: finalHomeGoals,
      away: finalAwayGoals,
      total: finalTotalGoals,
    },
    finalCorners: {
      home: finalCornH,
      away: finalCornA,
      total: finalTotalCorners,
    },
    finalYellowCards: {
      home: finalYellowH,
      away: finalYellowA,
      total: finalTotalYellow,
    },
    finalRedCards: {
      home: finalRedH,
      away: finalRedA,
      total: finalTotalRed,
    },
    deltaGoals,
    deltaCorners,
    deltaYellowCards,
    deltaRedCards,
    resolutionNote: resolutionNote || existing.resolutionNote,
    profit: profit !== undefined ? profit : existing.profit,
  };

  currentLogs[existingIdx] = updatedEntry;
  saveStrategyAuditLogs(currentLogs);
  syncAuditLogWithServer(updatedEntry);

  return updatedEntry;
}

/**
 * Clears all strategy execution audit logs from localStorage and server.
 */
export function clearStrategyAuditLogs(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    fetch('/api/strategy-audit-logs', { method: 'DELETE' }).catch(() => {});
  }
}

/**
 * Exports strategy audit logs to a downloadable CSV file.
 */
export function exportStrategyAuditLogsToCSV(logs: StrategyExecutionAuditLog[]): void {
  if (typeof window === 'undefined') return;

  const headers = [
    'ID записи',
    'ID сигнала',
    'ID стратегии',
    'Номер стратегии',
    'Название стратегии',
    'Категория',
    'Матч',
    'Лига',
    'Страна',
    'Вид спорта',
    'Рынок',
    'Кэф',
    'Статус',
    'Исход',
    'Время сигнала',
    'Минута сигнала',
    'Счет на момент сигнала',
    'Голы на момент сигнала (Х-Г-Всего)',
    'Угловые на момент сигнала (Х-Г-Всего)',
    'ЖК на момент сигнала (Х-Г-Всего)',
    'КК на момент сигнала (Х-Г-Всего)',
    'Время завершения',
    'Финальный счет',
    'Финальные голы (Х-Г-Всего)',
    'Финальные угловые (Х-Г-Всего)',
    'Финальные ЖК (Х-Г-Всего)',
    'Финальные КК (Х-Г-Всего)',
    'Δ Голов после сигнала',
    'Δ Угловых после сигнала',
    'Δ ЖК после сигнала',
    'Δ КК после сигнала',
    'Примечание аудита',
    'Прибыль (RUB)',
  ];

  const rows = logs.map((l) => [
    `"${l.id}"`,
    `"${l.signalId}"`,
    `"${l.strategyId}"`,
    l.strategyNumber || '',
    `"${(l.strategyName || '').replace(/"/g, '""')}"`,
    `"${l.strategyCategory || ''}"`,
    `"${(l.matchName || '').replace(/"/g, '""')}"`,
    `"${(l.league || '').replace(/"/g, '""')}"`,
    `"${(l.country || '').replace(/"/g, '""')}"`,
    `"${l.sport || ''}"`,
    `"${(l.targetMarket || '').replace(/"/g, '""')}"`,
    l.odds || '',
    l.status,
    l.outcome,
    `"${l.triggeredAt}"`,
    l.initialMinute,
    `"${l.initialScore}"`,
    `"${l.initialGoals.home}-${l.initialGoals.away}-${l.initialGoals.total}"`,
    `"${l.initialCorners.home}-${l.initialCorners.away}-${l.initialCorners.total}"`,
    `"${l.initialYellowCards.home}-${l.initialYellowCards.away}-${l.initialYellowCards.total}"`,
    `"${l.initialRedCards.home}-${l.initialRedCards.away}-${l.initialRedCards.total}"`,
    `"${l.resolvedAt || ''}"`,
    `"${l.finalScore || ''}"`,
    l.finalGoals ? `"${l.finalGoals.home}-${l.finalGoals.away}-${l.finalGoals.total}"` : '""',
    l.finalCorners ? `"${l.finalCorners.home}-${l.finalCorners.away}-${l.finalCorners.total}"` : '""',
    l.finalYellowCards ? `"${l.finalYellowCards.home}-${l.finalYellowCards.away}-${l.finalYellowCards.total}"` : '""',
    l.finalRedCards ? `"${l.finalRedCards.home}-${l.finalRedCards.away}-${l.finalRedCards.total}"` : '""',
    l.deltaGoals,
    l.deltaCorners,
    l.deltaYellowCards,
    l.deltaRedCards,
    `"${(l.resolutionNote || '').replace(/"/g, '""')}"`,
    l.profit ?? '',
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `strategy_execution_audit_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports strategy audit logs to a downloadable JSON file.
 */
export function exportStrategyAuditLogsToJSON(logs: StrategyExecutionAuditLog[]): void {
  if (typeof window === 'undefined') return;

  const jsonContent = JSON.stringify(logs, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `strategy_execution_audit_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
