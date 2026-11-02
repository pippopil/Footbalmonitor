import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SignalAlert, Match, SignalOutcome, SportType } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { resolveStrategyMetric } from '../algorithms';
import {
  Play,
  Square,
  Trash2,
  Search,
  Sparkles,
  Send,
  ExternalLink,
  Bot,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Target,
  ShieldCheck,
} from 'lucide-react';

export interface ScannerSignalsTableViewProps {
  signals: SignalAlert[];
  matches?: Match[];
  isMonitoringActive?: boolean;
  onToggleMonitoring?: () => void;
  onClearSignals: () => void;
  onOpenAIAnalyst?: (match: Match) => void;
  onSelectMatch?: (match: Match) => void;
  onNavigateToMatch?: (matchId: string, matchName: string, signal: SignalAlert) => void;
  onDeleteSignal?: (id: string) => void;
  onUpdateOutcome?: (signalId: string, outcome: SignalOutcome) => void;
  onExportCsv?: () => void;
  onOpenAuditLog?: () => void;
}

export const ScannerSignalsTableView: React.FC<ScannerSignalsTableViewProps> = ({
  signals,
  matches = [],
  isMonitoringActive = true,
  onToggleMonitoring,
  onClearSignals,
  onOpenAIAnalyst,
  onSelectMatch,
  onNavigateToMatch,
  onDeleteSignal,
  onUpdateOutcome,
  onExportCsv,
  onOpenAuditLog,
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'ALL' | '1H' | '2H' | 'HT'>('ALL');
  const [sportFilter, setSportFilter] = useState<SportType | 'ALL'>('ALL');
  const [filterNameChoice, setFilterNameChoice] = useState<string>('ALL');

  // Distinct filter names for quick filtering
  const distinctFilterNames = Array.from(new Set(signals.map((s) => s.ruleName).filter(Boolean)));

  const filteredSignals = signals.filter((sig) => {
    // Sport match
    if (sportFilter !== 'ALL' && (sig.sport || 'football') !== sportFilter) {
      return false;
    }

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${sig.matchName} ${sig.league} ${sig.country} ${sig.ruleName} ${sig.marketSuggestion || ''}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    // Period match
    if (periodFilter !== 'ALL') {
      if (periodFilter === '1H') {
        if (sig.period?.includes('2') || sig.minute > 45) return false;
      } else if (periodFilter === '2H') {
        if (!sig.period?.includes('2') && sig.minute <= 45) return false;
      } else if (periodFilter === 'HT') {
        if (sig.period !== 'Перерыв') return false;
      }
    }

    // Filter name match
    if (filterNameChoice !== 'ALL' && sig.ruleName !== filterNameChoice) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-3">
      {/* Top Action & Status Bar (Exact controls from Screenshot 1) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          {/* STOP / START Button */}
          <button
            onClick={() => onToggleMonitoring && onToggleMonitoring()}
            className={`px-5 py-2 rounded-lg font-black text-xs uppercase tracking-wider flex items-center gap-2 transition active:scale-95 shadow-md ${
              isMonitoringActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40 animate-pulse-slow'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
            }`}
          >
            {isMonitoringActive ? (
              <>
                <Square className="h-4 w-4 fill-white" />
                <span>{t('scannerStopBtn')}</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>{t('scannerStartBtn')}</span>
              </>
            )}
          </button>

          {/* CLEAR TABLE Button */}
          <button
            onClick={() => {
              if (signals.length === 0) return;
              onClearSignals();
            }}
            disabled={signals.length === 0}
            className="px-4 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-40 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95"
            title="Clear all recorded signals"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-400" />
            <span>{t('scannerClearBtn')}</span>
          </button>

          {onExportCsv && (
            <button
              onClick={onExportCsv}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 border border-slate-700"
              title="CSV"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>
          )}

          {onOpenAuditLog && (
            <button
              onClick={onOpenAuditLog}
              className="px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              title="Журнал аудита выполнения стратегий (голы, угловые, карты в момент сигнала и по завершению)"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              <span>Аудит</span>
            </button>
          )}

          {/* Live signals counter with auto-cleanup indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-400 font-medium">{t('scannerSignalsCount')}:</span>
            <span className="font-bold font-mono text-emerald-400">{signals.length}</span>
            <span className="text-[10px] text-slate-500 font-mono">/ 200</span>
          </div>

          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 font-medium"
            title="Автоматическая очистка старых сигналов при превышении 200 для защиты LocalStorage и стабильности сборки"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Автоочистка &gt; 200</span>
          </div>
        </div>

        {/* Search and Period Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sport selector */}
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
            {[
              { id: 'ALL', label: t('scannerAllSports') },
              { id: 'football', label: '⚽' },
              { id: 'hockey', label: '🏒' },
              { id: 'basketball', label: '🏀' },
              { id: 'tennis', label: '🎾' },
              { id: 'volleyball', label: '🏐' },
              { id: 'table_tennis', label: '🏓' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setSportFilter(item.id as any)}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                  sportFilter === item.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={item.id}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Period selector */}
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
            {[
              { id: 'ALL', label: t('scannerPeriodAll') },
              { id: '1H', label: t('scannerPeriod1H') },
              { id: '2H', label: t('scannerPeriod2H') },
              { id: 'HT', label: t('scannerPeriodHT') },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setPeriodFilter(item.id as any)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                  periodFilter === item.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Filter name dropdown */}
          {distinctFilterNames.length > 0 && (
            <select
              value={filterNameChoice}
              onChange={(e) => setFilterNameChoice(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 max-w-[150px] truncate"
            >
              <option value="ALL">{t('catAll')}</option>
              {distinctFilterNames.map((fn) => (
                <option key={fn} value={fn}>
                  {fn}
                </option>
              ))}
            </select>
          )}

          {/* Search box */}
          <div className="relative min-w-[190px]">
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* High-density Signals Table (Matches Screenshot 1) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto max-h-[720px] scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
            <thead className="sticky top-0 z-20 bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-2.5 text-center font-bold w-12">#</th>
                <th className="py-2.5 px-3 font-bold">{t('colFilter')}</th>
                <th className="py-2.5 px-3 font-bold">{t('colCountry')}</th>
                <th className="py-2.5 px-3 font-bold">{t('colLeague')}</th>
                <th className="py-2.5 px-2.5 text-center font-bold">{t('colPeriod')}</th>
                <th className="py-2.5 px-2 text-center font-bold">{t('colTime')}</th>
                <th className="py-2.5 px-3 font-bold">{t('colHome')}</th>
                <th className="py-2.5 px-3 font-bold">{t('colAway')}</th>
                <th className="py-2.5 px-2 text-center font-bold text-emerald-400">К1</th>
                <th className="py-2.5 px-2 text-center font-bold text-blue-400">К2</th>
                <th className="py-2.5 px-2 text-center font-bold">{t('colAttacks')}</th>
                <th className="py-2.5 px-2 text-center font-bold">{t('colDangAttacks')}</th>
                <th className="py-2.5 px-2 text-center font-bold">{t('colShots')}</th>
                <th className="py-2.5 px-2 text-center font-bold">{t('colCorners')}</th>
                <th className="py-2.5 px-2 text-center font-bold">{t('colCards')}</th>
                <th className="py-2.5 px-3 font-bold text-amber-400">{t('colOutcome')}</th>
                <th className="py-2.5 px-3 font-bold text-emerald-400 whitespace-nowrap">{t('colStrategyMetricResult')}</th>
                <th className="py-2.5 px-3 font-bold text-center text-emerald-400">{t('colBetStatus')}</th>
                <th className="py-2.5 px-3 font-bold">{t('colTelegram')}</th>
                <th className="py-2.5 px-2.5 text-center font-bold">{t('colLoggedAt')}</th>
                <th className="py-2.5 px-2.5 text-center font-bold">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredSignals.length === 0 ? (
                <tr>
                  <td colSpan={21} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Filter className="h-7 w-7 text-slate-600" />
                      <span>{t('noSignalsRecorded')}</span>
                      <span className="text-[11px] text-slate-600">
                        {isMonitoringActive
                          ? t('scannerPromptActive')
                          : t('scannerPromptStopped')}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence initial={false}>
                  {filteredSignals.map((sig, idx) => {
                    const matchObj =
                      matches.find((m) => m.id === sig.matchId || sig.matchName.includes(m.homeTeam)) ||
                      matches[0];

                    const homeTeam = sig.matchName.split(' vs ')[0] || 'Хозяева';
                    const awayTeam = sig.matchName.split(' vs ')[1] || 'Гости';

                    const scores = sig.score.split(':');
                    const homeScore = sig.statsSnapshot?.homeScore ?? (scores[0] || '0');
                    const awayScore = sig.statsSnapshot?.awayScore ?? (scores[1] || '0');

                    const attacks = sig.statsSnapshot?.attacks ?? matchObj?.stats.attacks ?? [0, 0];
                    const dangAttacks =
                      sig.statsSnapshot?.dangerousAttacks ?? matchObj?.stats.dangerousAttacks ?? [0, 0];
                    const sot =
                      sig.statsSnapshot?.shotsOnTarget ?? matchObj?.stats.shotsOnTarget ?? [0, 0];
                    const corners = sig.statsSnapshot?.corners ?? matchObj?.stats.corners ?? [0, 0];
                    const yc = sig.statsSnapshot?.yellowCards ?? matchObj?.stats.yellowCards ?? [0, 0];
                    const rc = sig.statsSnapshot?.redCards ?? matchObj?.stats.redCards ?? [0, 0];

                    const periodLabel =
                      sig.period ||
                      (sig.minute <= 45
                        ? '1-й тайм'
                        : sig.minute <= 48 && sig.minute >= 45
                        ? 'Перерыв'
                        : '2-й тайм');

                    // Reverse sequential index (e.g. 52, 53, 54 like in Screenshot 1)
                    const signalIndex = signals.length - idx;

                    const navigateToThisMatch = () => {
                      if (onNavigateToMatch) {
                        onNavigateToMatch(sig.matchId, sig.matchName, sig);
                      } else if (onSelectMatch && matchObj) {
                        onSelectMatch(matchObj);
                      }
                    };

                    return (
                      <motion.tr
                        key={sig.id}
                        layout="position"
                        initial={{ opacity: 0, y: -16, backgroundColor: 'rgba(16, 185, 129, 0.28)' }}
                        animate={{ opacity: 1, y: 0, backgroundColor: 'rgba(16, 185, 129, 0)' }}
                        exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
                        transition={{
                          type: 'spring',
                          stiffness: 420,
                          damping: 32,
                          mass: 0.8,
                          backgroundColor: { duration: 2.5, ease: 'easeOut' },
                        }}
                        className="hover:bg-slate-800/60 transition cursor-pointer group"
                        onClick={navigateToThisMatch}
                        title="Нажмите на строку для мгновенного перехода к данному матчу"
                      >
                        {/* # Number */}
                        <td className="py-2.5 px-2.5 text-center font-mono text-[11px] text-slate-400 group-hover:text-white">
                          <div className="flex items-center justify-center gap-1">
                            {idx === 0 && (
                              <span className="relative flex h-2 w-2" title="Новейший сигнал">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                            )}
                            <span>{signalIndex}</span>
                          </div>
                        </td>

                      {/* Filter Name */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-bold text-white group-hover:text-emerald-400 transition">
                          {sig.ruleName || 'NoName'}
                        </span>
                      </td>

                      {/* Country */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-300">
                        {sig.country}
                      </td>

                      {/* League */}
                      <td className="py-2.5 px-3 max-w-[170px] truncate text-slate-300" title={sig.league}>
                        {sig.league}
                      </td>

                      {/* Period */}
                      <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            periodLabel.includes('1')
                              ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                              : periodLabel.includes('2')
                              ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                              : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          }`}
                        >
                          {periodLabel}
                        </span>
                      </td>

                      {/* Minute */}
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-400 whitespace-nowrap">
                        {sig.minute}'
                      </td>

                      {/* Home Team */}
                      <td className="py-2.5 px-3 font-semibold text-white max-w-[150px] truncate" title={homeTeam}>
                        {homeTeam}
                      </td>

                      {/* Away Team */}
                      <td className="py-2.5 px-3 font-semibold text-white max-w-[150px] truncate" title={awayTeam}>
                        {awayTeam}
                      </td>

                      {/* Home Score */}
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-400 text-sm">
                        {homeScore}
                      </td>

                      {/* Away Score */}
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-blue-400 text-sm">
                        {awayScore}
                      </td>

                      {/* Attacks */}
                      <td className="py-2.5 px-2 text-center font-mono text-slate-300 whitespace-nowrap">
                        {attacks[0]}:{attacks[1]}
                      </td>

                      {/* Dangerous Attacks */}
                      <td className="py-2.5 px-2 text-center font-mono text-amber-300 whitespace-nowrap font-bold">
                        {dangAttacks[0]}:{dangAttacks[1]}
                      </td>

                      {/* Shots on Target */}
                      <td className="py-2.5 px-2 text-center font-mono text-rose-300 whitespace-nowrap font-bold">
                        {sot[0]}:{sot[1]}
                      </td>

                      {/* Corners */}
                      <td className="py-2.5 px-2 text-center font-mono text-cyan-300 whitespace-nowrap">
                        {corners[0]}:{corners[1]}
                      </td>

                      {/* Yellow / Red Cards */}
                      <td className="py-2.5 px-2 text-center font-mono text-[11px] whitespace-nowrap">
                        <span className="text-yellow-400">{yc[0] + yc[1]}</span>
                        {rc[0] + rc[1] > 0 && (
                          <span className="text-rose-400 font-bold ml-1">/ {rc[0] + rc[1]}🟥</span>
                        )}
                      </td>

                      {/* Market Suggestion & Action */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {sig.isCombo && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/25 to-purple-500/25 text-amber-200 border border-amber-400/40 text-[10px] font-black w-fit animate-pulse">
                              ⚡ СУПЕР-КОМБО ({sig.comboCount})
                            </span>
                          )}
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-black text-xs shadow-sm border ${
                            sig.targetAction === 'TM' || (sig.marketSuggestion || '').toLowerCase().includes('тм')
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          }`}>
                            <span className="text-xs">
                              {sig.targetAction === 'TM' || (sig.marketSuggestion || '').toLowerCase().includes('тм') ? '🛡️' : '🔥'}
                            </span>
                            <span className="tracking-wide">
                              {sig.targetAction === 'TM' || (sig.marketSuggestion || '').toLowerCase().includes('тм')
                                ? 'БРАТЬ ТМ: '
                                : sig.targetAction === 'TB' || (sig.marketSuggestion || '').toLowerCase().includes('тб')
                                ? 'БРАТЬ ТБ: '
                                : ''}
                              {sig.marketSuggestion || 'ТБ 0.5'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Конечный результат по стратегии (угловые / желтые / голы) */}
                      {(() => {
                        const curScore: [number, number] = matchObj ? matchObj.score : [0, 0];
                        const curStats = matchObj?.stats || sig.finalStats;
                        const metric = sig.strategyMetricSnapshot || resolveStrategyMetric(sig, curScore, curStats);

                        return (
                          <td className="py-2.5 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5 text-[11px]">
                                <span className="text-sm shrink-0">{metric.icon}</span>
                                <span className="text-slate-400 font-medium">{metric.label}:</span>
                                <span
                                  className="font-mono text-amber-300 font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-[11px]"
                                  title="Значение на момент выдачи сигнала"
                                >
                                  {metric.initialValueText}
                                </span>
                                <span className="text-slate-500 font-black">➔</span>
                                <span
                                  className={`font-mono font-bold px-1.5 py-0.5 rounded border text-[11px] ${
                                    sig.outcome === 'WIN'
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                      : sig.outcome === 'LOSS'
                                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                      : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                                  }`}
                                  title={sig.outcome !== 'PENDING' ? 'Конечный результат по завершению матча' : 'Текущее значение (матч в игре)'}
                                >
                                  {sig.outcome !== 'PENDING' ? 'Финал: ' : 'Сейчас: '}
                                  {metric.finalValueText || (metric.finalTotal !== undefined ? `${metric.finalTotal}` : '—')}
                                </span>
                              </div>
                              {metric.deltaText && (
                                <div className="text-[10px] font-mono text-slate-400 pl-5">
                                  <span className={metric.delta && metric.delta > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                                    {metric.deltaText}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })()}

                      {/* Bet Outcome (Зашел / Минус / Возврат / В игре) */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onUpdateOutcome?.(sig.id, 'WIN')}
                            title="Отметить ставку как выигранную"
                            className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                              sig.outcome === 'WIN'
                                ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                                : 'bg-slate-800 text-slate-400 hover:text-emerald-300'
                            }`}
                          >
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            <span>Зашел</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateOutcome?.(sig.id, 'LOSS')}
                            title="Отметить ставку как проигранную"
                            className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                              sig.outcome === 'LOSS'
                                ? 'bg-rose-500 text-white font-black shadow-sm'
                                : 'bg-slate-800 text-slate-400 hover:text-rose-300'
                            }`}
                          >
                            <XCircle className="h-2.5 w-2.5" />
                            <span>Минус</span>
                          </button>
                          {sig.outcome === 'REFUND' ? (
                            <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 text-[10px] font-bold">
                              Возврат
                            </span>
                          ) : sig.outcome === 'PENDING' ? (
                            <span className="text-[10px] text-amber-400 font-mono">
                              ⏳ В игре
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Telegram / Bot Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1 border ${
                              sig.sentToTelegram
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            <Send className="h-2.5 w-2.5" />
                            <span>{sig.sentToTelegram ? 'Отправлен' : 'Локально'}</span>
                          </span>
                          {sig.botName && (
                            <span className="text-[10px] text-cyan-300 font-mono flex items-center gap-0.5" title={sig.botName}>
                              <Bot className="h-3 w-3 text-cyan-400" />
                              <span className="max-w-[75px] truncate">{sig.botName}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Captured Time */}
                      <td className="py-2.5 px-2.5 text-center font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {sig.timestamp}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-2.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          {onOpenAIAnalyst && matchObj && (
                            <button
                              type="button"
                              onClick={() => onOpenAIAnalyst(matchObj)}
                              className="p-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition"
                              title="Открыть AI-анализ этого матча"
                            >
                              <Sparkles className="h-3 w-3 text-indigo-400" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={navigateToThisMatch}
                            className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 transition shadow-sm"
                            title="Перейти к данному матчу"
                          >
                            <ExternalLink className="h-3 w-3 text-emerald-400" />
                            <span className="hidden sm:inline">К матчу</span>
                          </button>
                          {onDeleteSignal && (
                            <button
                              type="button"
                              onClick={() => onDeleteSignal(sig.id)}
                              className="p-1 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
                              title="Удалить запись сигнала"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
