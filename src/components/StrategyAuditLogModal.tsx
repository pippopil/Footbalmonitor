import React, { useState, useEffect } from 'react';
import { StrategyExecutionAuditLog, SignalOutcome } from '../types';
import {
  getStrategyAuditLogs,
  clearStrategyAuditLogs,
  exportStrategyAuditLogsToCSV,
  exportStrategyAuditLogsToJSON,
} from '../services/strategyAuditLogger';
import {
  X,
  FileSpreadsheet,
  Download,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  TrendingUp,
  Activity,
  Filter,
} from 'lucide-react';

interface StrategyAuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StrategyAuditLogModal: React.FC<StrategyAuditLogModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<StrategyExecutionAuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('ALL');
  const [selectedOutcome, setSelectedOutcome] = useState<'ALL' | SignalOutcome>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLogs = () => {
    setIsRefreshing(true);
    const localLogs = getStrategyAuditLogs();
    setLogs(localLogs);

    // Also fetch fresh logs from backend
    fetch('/api/strategy-audit-logs?limit=500')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.logs) && data.logs.length > 0) {
          // Merge with local logs by signalId
          const map = new Map<string, StrategyExecutionAuditLog>();
          [...localLogs, ...data.logs].forEach((l) => map.set(l.signalId, l));
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
          );
          setLogs(merged);
        }
      })
      .catch(() => {})
      .finally(() => setIsRefreshing(false));
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Distinct strategy names for dropdown
  const distinctStrategies = Array.from(
    new Set(
      logs.map((l) =>
        JSON.stringify({
          id: l.strategyId,
          num: l.strategyNumber,
          name: l.strategyName,
        })
      )
    )
  ).map((s) => JSON.parse(s));

  // Filtered logs
  const filteredLogs = logs.filter((log) => {
    if (selectedOutcome !== 'ALL' && log.outcome !== selectedOutcome) return false;
    if (selectedStrategyId !== 'ALL' && log.strategyId !== selectedStrategyId) return false;
    if (selectedCategory !== 'ALL' && log.strategyCategory !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const text = `${log.matchName} ${log.league} ${log.strategyName} ${log.signalId} ${log.strategyId}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  // Analytics metrics
  const totalCount = logs.length;
  const resolvedCount = logs.filter((l) => l.status === 'RESOLVED').length;
  const winsCount = logs.filter((l) => l.outcome === 'WIN').length;
  const lossesCount = logs.filter((l) => l.outcome === 'LOSS').length;
  const winRate = resolvedCount > 0 ? Math.round((winsCount / resolvedCount) * 100) : 0;

  // Average deltas across resolved signals
  const resolvedLogs = logs.filter((l) => l.status === 'RESOLVED');
  const avgDeltaGoals = resolvedLogs.length > 0
    ? (resolvedLogs.reduce((acc, l) => acc + (l.deltaGoals || 0), 0) / resolvedLogs.length).toFixed(1)
    : '0.0';
  const avgDeltaCorners = resolvedLogs.length > 0
    ? (resolvedLogs.reduce((acc, l) => acc + (l.deltaCorners || 0), 0) / resolvedLogs.length).toFixed(1)
    : '0.0';
  const avgDeltaCards = resolvedLogs.length > 0
    ? (resolvedLogs.reduce((acc, l) => acc + (l.deltaYellowCards || 0), 0) / resolvedLogs.length).toFixed(1)
    : '0.0';

  const handleClear = () => {
    if (window.confirm('Очистить весь журнал аудита выполнения стратегий?')) {
      clearStrategyAuditLogs();
      setLogs([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-7xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                Журнал аудита выполнения стратегий
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  {filteredLogs.length} / {totalCount} записей
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Фиксация ID сигнала, ID стратегии, значений голов, угловых и карточек на момент сигнала и по завершению матча
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadLogs}
              title="Обновить журнал"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-3 sm:p-4 bg-slate-950/50 border-b border-slate-800/80">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
            <div className="text-[10px] uppercase font-bold text-slate-400">Всего сигналов</div>
            <div className="text-lg font-black text-white">{totalCount}</div>
            <div className="text-[10px] text-slate-500">Зафиксировано</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
            <div className="text-[10px] uppercase font-bold text-slate-400">Завершено (FT)</div>
            <div className="text-lg font-black text-emerald-400">{resolvedCount}</div>
            <div className="text-[10px] text-slate-500">В архиве</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
            <div className="text-[10px] uppercase font-bold text-slate-400">Проходимость</div>
            <div className={`text-lg font-black ${winRate >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {winRate}%
            </div>
            <div className="text-[10px] text-slate-500">
              {winsCount}W / {lossesCount}L
            </div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
            <div className="text-[10px] uppercase font-bold text-slate-400">Ср. Δ Голов</div>
            <div className="text-lg font-black text-cyan-400">+{avgDeltaGoals}</div>
            <div className="text-[10px] text-slate-500">После сигнала</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
            <div className="text-[10px] uppercase font-bold text-slate-400">Ср. Δ Угловых</div>
            <div className="text-lg font-black text-indigo-400">+{avgDeltaCorners}</div>
            <div className="text-[10px] text-slate-500">После сигнала</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
            <div className="text-[10px] uppercase font-bold text-slate-400">Ср. Δ ЖК</div>
            <div className="text-lg font-black text-amber-400">+{avgDeltaCards}</div>
            <div className="text-[10px] text-slate-500">После сигнала</div>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-3 sm:p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Поиск по матчу, стратегии, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Strategy Filter */}
            <select
              value={selectedStrategyId}
              onChange={(e) => setSelectedStrategyId(e.target.value)}
              className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Все стратегии ({distinctStrategies.length})</option>
              {distinctStrategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.num ? `[#${s.num}] ` : ''}{s.name.slice(0, 32)}
                </option>
              ))}
            </select>

            {/* Outcome Filter */}
            <select
              value={selectedOutcome}
              onChange={(e) => setSelectedOutcome(e.target.value as any)}
              className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Все исходы</option>
              <option value="WIN">✅ WIN (Прошло)</option>
              <option value="LOSS">❌ LOSS (Не прошло)</option>
              <option value="PENDING">⏳ PENDING (В игре)</option>
              <option value="REFUND">🔄 REFUND (Возврат)</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Все типы метрик</option>
              <option value="cards">🟨 Карточки (ЖК/КК)</option>
              <option value="corners">🚩 Угловые</option>
              <option value="goals">⚽ Голы / Счёт</option>
            </select>
          </div>

          {/* Export & Clear Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportStrategyAuditLogsToCSV(filteredLogs)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition"
              title="Экспортировать в CSV файл"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV (Excel)</span>
            </button>
            <button
              onClick={() => exportStrategyAuditLogsToJSON(filteredLogs)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition"
              title="Экспортировать в JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-1.5 rounded-lg bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition"
              title="Очистить весь журнал аудита"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Очистить</span>
            </button>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="flex-1 overflow-auto">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
              <ShieldCheck className="w-12 h-12 text-slate-600 mb-3" />
              <div className="text-base font-bold text-slate-300">Журнал аудита пока пуст</div>
              <p className="text-xs text-slate-500 max-w-md mt-1">
                Система автоматически регистрирует каждую сработавшую стратегию с точным срезом голов, угловых и карточек на момент сигнала и по завершению матча.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead className="bg-slate-950/80 sticky top-0 border-b border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400 z-10">
                <tr>
                  <th className="py-3 px-3">ID Сигнала & Время</th>
                  <th className="py-3 px-3">Стратегия</th>
                  <th className="py-3 px-3">Матч & Турнир</th>
                  <th className="py-3 px-3 bg-slate-900/60 text-cyan-300">
                    На момент сигнала (Вход)
                  </th>
                  <th className="py-3 px-3 bg-slate-900/90 text-emerald-300">
                    По завершению (FT)
                  </th>
                  <th className="py-3 px-3 bg-amber-950/20 text-amber-300">
                    Динамика (Δ прирост)
                  </th>
                  <th className="py-3 px-3 text-center">Исход</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredLogs.map((log) => {
                  const isWin = log.outcome === 'WIN';
                  const isLoss = log.outcome === 'LOSS';
                  const isPending = log.outcome === 'PENDING';

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-800/40 transition font-sans group"
                    >
                      {/* Signal ID & Time */}
                      <td className="py-3 px-3 align-top font-mono text-[11px]">
                        <div className="font-bold text-slate-200">
                          {log.signalId.slice(0, 16)}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {log.triggeredAt.includes('T')
                            ? new Date(log.triggeredAt).toLocaleTimeString('ru-RU')
                            : log.triggeredAt}
                          {log.initialMinute > 0 && ` (${log.initialMinute}')`}
                        </div>
                        <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                          {log.sport ? log.sport.toUpperCase() : 'FOOTBALL'}
                        </div>
                      </td>

                      {/* Strategy */}
                      <td className="py-3 px-3 align-top">
                        <div className="flex items-center gap-1.5">
                          {log.strategyNumber && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black text-[10px] border border-amber-500/30">
                              #{log.strategyNumber}
                            </span>
                          )}
                          <span className="font-bold text-slate-100 text-xs line-clamp-1">
                            {log.strategyName}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          ID: <span className="text-slate-300">{log.strategyId}</span>
                        </div>
                        <div className="text-[10px] text-amber-400/90 font-medium mt-0.5 line-clamp-1">
                          Рынок: {log.targetMarket || 'ТБ'} | Кэф: {log.odds?.toFixed(2) || '1.80'}
                        </div>
                      </td>

                      {/* Match & League */}
                      <td className="py-3 px-3 align-top">
                        <div className="font-bold text-slate-100 text-xs">
                          {log.matchName}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {log.country} | {log.league}
                        </div>
                      </td>

                      {/* Initial state at signal moment */}
                      <td className="py-3 px-3 align-top bg-slate-900/40 text-[11px]">
                        <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                          <span>⚽ Счёт:</span>
                          <span className="font-mono bg-cyan-950/60 px-1 rounded border border-cyan-800/40">
                            {log.initialScore}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({log.initialGoals.total} гол.)
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-indigo-300 mt-1 font-mono">
                          <span>🚩 Угловые:</span>
                          <span className="font-bold">
                            {log.initialCorners.total} ({log.initialCorners.home}:{log.initialCorners.away})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-amber-300 mt-1 font-mono">
                          <span>🟨 ЖК:</span>
                          <span className="font-bold">
                            {log.initialYellowCards.total} ({log.initialYellowCards.home}:{log.initialYellowCards.away})
                          </span>
                          {log.initialRedCards.total > 0 && (
                            <span className="text-rose-400 ml-1">
                              🟥 {log.initialRedCards.total} КК
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Final state at FT */}
                      <td className="py-3 px-3 align-top bg-slate-900/70 text-[11px]">
                        {log.status === 'RESOLVED' && log.finalGoals ? (
                          <>
                            <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                              <span>⚽ FT:</span>
                              <span className="font-mono bg-emerald-950/60 px-1 rounded border border-emerald-800/40">
                                {log.finalScore || `${log.finalGoals.home}:${log.finalGoals.away}`}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ({log.finalGoals.total} гол.)
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-indigo-300 mt-1 font-mono">
                              <span>🚩 Угловые:</span>
                              <span className="font-bold">
                                {log.finalCorners?.total ?? '-'} ({log.finalCorners?.home ?? 0}:{log.finalCorners?.away ?? 0})
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-amber-300 mt-1 font-mono">
                              <span>🟨 ЖК:</span>
                              <span className="font-bold">
                                {log.finalYellowCards?.total ?? '-'} ({log.finalYellowCards?.home ?? 0}:{log.finalYellowCards?.away ?? 0})
                              </span>
                              {(log.finalRedCards?.total ?? 0) > 0 && (
                                <span className="text-rose-400 ml-1">
                                  🟥 {log.finalRedCards?.total} КК
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-slate-500 italic py-2 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                            Ожидание завершения матча...
                          </div>
                        )}
                      </td>

                      {/* Dynamics / Deltas */}
                      <td className="py-3 px-3 align-top bg-amber-950/10 text-[11px] font-mono">
                        {log.status === 'RESOLVED' ? (
                          <div className="space-y-1">
                            <div className={`font-bold flex items-center gap-1 ${log.deltaGoals > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                              <span>⚽</span>
                              <span>
                                {log.deltaGoals >= 0 ? `+${log.deltaGoals}` : log.deltaGoals} голов
                              </span>
                            </div>
                            <div className={`font-bold flex items-center gap-1 ${log.deltaCorners > 0 ? 'text-indigo-400' : 'text-slate-400'}`}>
                              <span>🚩</span>
                              <span>
                                {log.deltaCorners >= 0 ? `+${log.deltaCorners}` : log.deltaCorners} угловых
                              </span>
                            </div>
                            <div className={`font-bold flex items-center gap-1 ${log.deltaYellowCards > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                              <span>🟨</span>
                              <span>
                                {log.deltaYellowCards >= 0 ? `+${log.deltaYellowCards}` : log.deltaYellowCards} ЖК
                              </span>
                            </div>
                            {log.deltaRedCards > 0 && (
                              <div className="font-bold text-rose-400 flex items-center gap-1">
                                <span>🟥</span>
                                <span>+{log.deltaRedCards} КК</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Счёт в динамике</span>
                        )}
                      </td>

                      {/* Outcome Badge & Resolution Details */}
                      <td className="py-3 px-3 align-top text-center">
                        {isWin && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5" /> WIN
                          </span>
                        )}
                        {isLoss && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm">
                            <XCircle className="w-3.5 h-3.5" /> LOSS
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3 h-3" /> В игре
                          </span>
                        )}
                        {log.resolutionNote && (
                          <div className="text-[10px] text-slate-400 font-sans mt-1 max-w-[150px] mx-auto text-left line-clamp-2" title={log.resolutionNote}>
                            {log.resolutionNote}
                          </div>
                        )}
                        {log.profit !== undefined && (
                          <div className={`text-[10px] font-mono font-bold mt-0.5 ${log.profit > 0 ? 'text-emerald-400' : log.profit < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                            {log.profit > 0 ? `+${log.profit} ₽` : `${log.profit} ₽`}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Логирование активно: фиксация данных на момент сигнала и по завершению матча для аудита</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
