import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Bot,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Lock,
  Cpu,
  Clock,
  X,
  FileCheck,
  Terminal,
  Search,
  Copy,
  Check,
  Filter,
  Download,
  ChevronDown,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Match, FilterRule, UserProfile, AgentSimulationResult, AgentSimulationStep, AgentLogEntry } from '../types';
import { runUserSimulationAgent } from '../services/userSimulationAgent';

interface UserSimulationAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  matches: Match[];
  filters: FilterRule[];
}

type TabType = 'steps' | 'logs';

export const UserSimulationAgentModal: React.FC<UserSimulationAgentModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  matches,
  filters,
}) => {
  const [selectedUser, setSelectedUser] = useState<UserProfile>(currentUser);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<AgentSimulationStep | null>(null);
  const [result, setResult] = useState<AgentSimulationResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('steps');
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);
  
  // Log viewer filters & state
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());

  const logsEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (autoScroll && activeTab === 'logs' && logsEndRef.current) {
      if (typeof logsEndRef.current.scrollIntoView === 'function') {
        logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [logs, activeTab, autoScroll]);

  // Keep selectedUser in sync if currentUser changes
  useEffect(() => {
    setSelectedUser(currentUser);
  }, [currentUser]);

  const handleStartSimulation = async () => {
    setIsRunning(true);
    setProgress(5);
    setResult(null);
    setLogs([]);
    setExpandedLogIds(new Set());

    try {
      const res = await runUserSimulationAgent({
        user: selectedUser,
        matches,
        filters,
        onStepUpdate: (step, pct) => {
          setCurrentStep(step);
          setProgress(pct);
        },
        onLog: (entry) => {
          setLogs((prev) => [...prev, entry]);
        },
      });
      setResult(res);
      if (res.logs && res.logs.length > 0) {
        setLogs(res.logs);
      }
      setProgress(100);
    } catch (e: any) {
      console.error('Agent simulation error:', e);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setProgress(0);
    setCurrentStep(null);
    setResult(null);
    setLogs([]);
    setExpandedLogIds(new Set());
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedLevel('ALL');
  };

  const toggleExpandLog = (id: string) => {
    setExpandedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Counts by status/type
  const counts = useMemo(() => {
    let success = 0;
    let warn = 0;
    let failed = 0;
    let info = 0;
    let debug = 0;

    for (const l of logs) {
      if (l.level === 'success') success++;
      else if (l.level === 'warn') warn++;
      else if (l.level === 'debug') debug++;
      else if ((l as any).level === 'failed' || (l as any).level === 'error') failed++;
      else info++;
    }

    return { total: logs.length, success, warn, failed, info, debug };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedCategory !== 'ALL' && log.category !== selectedCategory) {
        return false;
      }
      if (selectedLevel !== 'ALL') {
        if (selectedLevel === 'error' && (log.level === 'warn' || log.level === 'info' || log.level === 'success' || log.level === 'debug')) {
          return false;
        }
        if (selectedLevel !== 'error' && log.level !== selectedLevel) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchMsg = log.message.toLowerCase().includes(q);
        const matchCategory = log.category.toLowerCase().includes(q);
        const matchMeta = log.meta ? JSON.stringify(log.meta).toLowerCase().includes(q) : false;
        if (!matchMsg && !matchCategory && !matchMeta) {
          return false;
        }
      }
      return true;
    });
  }, [logs, selectedCategory, selectedLevel, searchQuery]);

  const handleCopyLogs = () => {
    const text = filteredLogs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.category}] [${l.level.toUpperCase()}] +${l.elapsedMs}ms: ${l.message}${
            l.meta ? ' ' + JSON.stringify(l.meta) : ''
          }`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categories: Array<{ id: string; label: string }> = [
    { id: 'ALL', label: 'Все категории' },
    { id: 'AUTH', label: 'AUTH' },
    { id: 'TELEMETRY', label: 'TELEMETRY' },
    { id: 'FILTER', label: 'FILTER' },
    { id: 'SANDBOX', label: 'SANDBOX' },
    { id: 'TELEGRAM', label: 'TELEGRAM' },
    { id: 'AUDIO', label: 'AUDIO' },
    { id: 'AUDIT', label: 'AUDIT' },
  ];

  if (!isOpen) return null;

  return (
    <div
      data-testid="simulation-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-950/50">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  ИИ-Агент Тестировщик (User Simulation Agent)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  SANDBOX 0% SIDE-EFFECTS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Имитирует действия реального пользователя, проверяя фильтры, телеметрию и сигналы без влияния на боевые данные.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Закрыть модальное окно"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Top Control Bar: User Persona + Actions */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-300">
                  Тестировать от лица роли / пользователя:
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  (Лимиты: Free = 1/1, Pro = 5/5, VIP = 10+/58)
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {allUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    data-testid={`user-persona-${u.id}`}
                    disabled={isRunning}
                    onClick={() => setSelectedUser(u)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border flex items-center gap-1.5 ${
                      selectedUser.id === u.id
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <span>{u.name || u.displayName || u.username}</span>
                    <span className="text-[10px] opacity-80 font-mono">({u.plan})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {result && !isRunning && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Сброс</span>
                </button>
              )}

              <button
                type="button"
                data-testid="start-agent-btn"
                disabled={isRunning}
                onClick={handleStartSimulation}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-lg shadow-emerald-950/50 transition flex items-center gap-2 disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <Activity className="h-4 w-4 animate-spin" />
                    <span>Идёт тестирование ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-white" />
                    <span>Запустить Агента</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {(isRunning || result) && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono flex items-center gap-1.5">
                  <Activity className={`h-3 w-3 ${isRunning ? 'text-cyan-400 animate-spin' : 'text-emerald-400'}`} />
                  <span>{isRunning ? 'Агент выполняет тесты песочницы...' : 'Диагностика успешно завершена'}</span>
                </span>
                <span className="font-mono font-bold text-emerald-400">{progress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* View Switcher Tabs (Steps Checklist vs Terminal Logs) */}
        <div className="flex items-center justify-between px-5 pt-3 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="tab-steps"
              onClick={() => setActiveTab('steps')}
              className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
                activeTab === 'steps'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCheck className="h-4 w-4" />
              <span>Шаги тестирования</span>
              {result?.steps && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300">
                  {result.steps.length}
                </span>
              )}
            </button>

            <button
              type="button"
              data-testid="tab-logs"
              onClick={() => setActiveTab('logs')}
              className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
                activeTab === 'logs'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="h-4 w-4" />
              <span>Лог-панель агента (Live Terminal)</span>
              {logs.length > 0 && (
                <span
                  data-testid="logs-count-badge"
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    isRunning ? 'bg-cyan-500/20 text-cyan-300 animate-pulse' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {logs.length}
                </span>
              )}
            </button>
          </div>

          <div className="pb-3 text-xs text-slate-500 font-mono hidden sm:flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Изоляция: 0% влияния на счета и бота</span>
          </div>
        </div>

        {/* Main Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'steps' ? (
            /* Tab 1: Steps & Summary */
            <div className="space-y-4">
              {/* Summary Card if Completed */}
              {result && (
                <div
                  data-testid="result-summary"
                  className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-emerald-400" />
                      <span className="font-bold text-white text-sm">Итоговый отчёт агента</span>
                    </div>
                    <span
                      data-testid="health-score"
                      className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    >
                      Здоровье системы: {result.healthScore}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{result.summary}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-center">
                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Матчей проверено</div>
                      <div className="text-sm font-bold text-white mt-0.5">{result.testedMatchesCount}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Фильтров в тесте</div>
                      <div className="text-sm font-bold text-white mt-0.5">{result.testedFiltersCount}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Сигналов в песочнице</div>
                      <div className="text-sm font-bold text-emerald-400 mt-0.5">
                        {result.signalsGeneratedInSandbox}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Время теста</div>
                      <div className="text-sm font-bold text-cyan-400 mt-0.5">{result.totalDurationMs} мс</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Steps List */}
              <div className="space-y-2">
                {(result?.steps || (currentStep ? [currentStep] : [])).length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-800 space-y-3">
                    <Bot className="h-10 w-10 text-slate-600 mx-auto" />
                    <div className="text-sm font-semibold text-slate-300">
                      Агент готов к тестированию функционала платформы
                    </div>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Нажмите кнопку «Запустить Агента» выше, чтобы провести пошаговую диагностику: авторизация,
                      квоты, тактические фильтры всех видов спорта, детекция сигналов и изоляция хранилища.
                    </p>
                  </div>
                ) : (
                  (result?.steps || (currentStep ? [currentStep] : [])).map((st) => {
                    const stepStyles = {
                      success: 'border-emerald-500/30 bg-emerald-950/10',
                      warning: 'border-amber-500/30 bg-amber-950/10',
                      failed: 'border-rose-500/30 bg-rose-950/10',
                      running: 'border-cyan-500/40 bg-cyan-950/20',
                      pending: 'border-slate-800 bg-slate-950',
                    }[st.status];

                    return (
                      <div
                        key={st.id}
                        data-testid={`step-${st.id}`}
                        className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 transition-colors ${stepStyles}`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="mt-0.5 shrink-0">
                            {st.status === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                            {st.status === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-400" />}
                            {st.status === 'failed' && <XCircle className="h-4 w-4 text-rose-400" />}
                            {st.status === 'running' && <Activity className="h-4 w-4 text-cyan-400 animate-spin" />}
                            {st.status === 'pending' && <Clock className="h-4 w-4 text-slate-500" />}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-200 flex items-center gap-2">
                              <span>{st.title}</span>
                              <span
                                className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-bold ${
                                  st.status === 'success'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : st.status === 'warning'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : st.status === 'failed'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : st.status === 'running'
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                              >
                                {st.status === 'success' ? 'УСПЕШНО' : st.status === 'warning' ? 'ПРЕДУПРЕЖДЕНИЕ' : st.status === 'failed' ? 'ОШИБКА' : st.status === 'running' ? 'ВЫПОЛНЯЕТСЯ' : 'ОЖИДАНИЕ'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{st.details}</div>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          {st.metric && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                              {st.metric}
                            </span>
                          )}
                          {st.durationMs > 0 && (
                            <div className="text-[10px] text-slate-500 font-mono mt-1">{st.durationMs} мс</div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* Tab 2: Dedicated Component Log Panel with Color Indication and Event Type Filtering */
            <div data-testid="log-terminal" className="space-y-3 flex flex-col h-full">
              {/* Event Type Counters Row (Цветовая индикация счетчиков) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setSelectedLevel('ALL')}
                  className={`p-2 rounded-xl border flex items-center justify-between transition ${
                    selectedLevel === 'ALL'
                      ? 'bg-slate-800 border-slate-600 text-white shadow-sm'
                      : 'bg-slate-950/80 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-[11px]">Все события</span>
                  <span className="font-bold bg-slate-900 px-1.5 py-0.5 rounded text-white">{counts.total}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedLevel('success')}
                  className={`p-2 rounded-xl border flex items-center justify-between transition ${
                    selectedLevel === 'success'
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-slate-950/80 border-slate-800/80 text-emerald-400/80 hover:text-emerald-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Успех</span>
                  </span>
                  <span className="font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">{counts.success}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedLevel('warn')}
                  className={`p-2 rounded-xl border flex items-center justify-between transition ${
                    selectedLevel === 'warn'
                      ? 'bg-amber-950/60 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-slate-950/80 border-slate-800/80 text-amber-400/80 hover:text-amber-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    <span>Внимание</span>
                  </span>
                  <span className="font-bold bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300">{counts.warn}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedLevel('error')}
                  className={`p-2 rounded-xl border flex items-center justify-between transition ${
                    selectedLevel === 'error'
                      ? 'bg-rose-950/60 border-rose-500 text-rose-300 shadow-sm'
                      : 'bg-slate-950/80 border-slate-800/80 text-rose-400/80 hover:text-rose-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <XCircle className="h-3.5 w-3.5 text-rose-400" />
                    <span>Ошибки</span>
                  </span>
                  <span className="font-bold bg-rose-500/20 px-1.5 py-0.5 rounded text-rose-300">{counts.failed}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedLevel('info')}
                  className={`p-2 rounded-xl border flex items-center justify-between transition ${
                    selectedLevel === 'info'
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-sm'
                      : 'bg-slate-950/80 border-slate-800/80 text-cyan-400/80 hover:text-cyan-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <Info className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Инфо</span>
                  </span>
                  <span className="font-bold bg-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-300">{counts.info}</span>
                </button>
              </div>

              {/* Filter & Search Bar */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                  {/* Search box */}
                  <div className="relative flex-1">
                    <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      data-testid="log-search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Поиск по тексту лога, категории или JSON-мета..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Actions & Level filter */}
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-mono"
                    >
                      <option value="ALL">Все типы событий</option>
                      <option value="success">🟢 Успешно (SUCCESS)</option>
                      <option value="warn">🟡 Предупреждения (WARN)</option>
                      <option value="error">🔴 Ошибки (FAILED)</option>
                      <option value="info">🔵 Инфо (INFO)</option>
                      <option value="debug">🟣 Отладка (DEBUG)</option>
                    </select>

                    <button
                      type="button"
                      data-testid="copy-logs-btn"
                      onClick={handleCopyLogs}
                      disabled={filteredLogs.length === 0}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5 disabled:opacity-40"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Скопировано</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Копировать</span>
                        </>
                      )}
                    </button>

                    <label className="text-[11px] text-slate-400 flex items-center gap-1 cursor-pointer select-none pl-1">
                      <input
                        type="checkbox"
                        checked={autoScroll}
                        onChange={(e) => setAutoScroll(e.target.checked)}
                        className="rounded border-slate-700 text-cyan-600 focus:ring-0 bg-slate-900"
                      />
                      <span>Автоскролл</span>
                    </label>
                  </div>
                </div>

                {/* Category Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition border ${
                        selectedCategory === cat.id
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Log Stream Window with Colorful Status Badges */}
              <div
                data-testid="log-list"
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] space-y-1.5 max-h-[460px] overflow-y-auto"
              >
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    {logs.length === 0
                      ? 'Логи отсутствуют. Запустите агента для генерации телеметрии.'
                      : 'Нет событий, соответствующих выбранному фильтру статуса или типу.'}
                  </div>
                ) : (
                  filteredLogs.map((log) => {
                    const isExpanded = expandedLogIds.has(log.id);

                    // Color indication for event levels (успех/предупреждение/ошибка/инфо)
                    const levelColors: Record<string, { badge: string; border: string; icon: React.ReactNode }> = {
                      info: {
                        badge: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60',
                        border: 'border-l-2 border-l-cyan-500',
                        icon: <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0" />,
                      },
                      success: {
                        badge: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60',
                        border: 'border-l-2 border-l-emerald-500',
                        icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />,
                      },
                      warn: {
                        badge: 'text-amber-400 bg-amber-950/60 border-amber-800/60',
                        border: 'border-l-2 border-l-amber-500',
                        icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />,
                      },
                      error: {
                        badge: 'text-rose-400 bg-rose-950/60 border-rose-800/60',
                        border: 'border-l-2 border-l-rose-500',
                        icon: <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />,
                      },
                      debug: {
                        badge: 'text-purple-400 bg-purple-950/60 border-purple-800/60',
                        border: 'border-l-2 border-l-purple-500',
                        icon: <Activity className="h-3.5 w-3.5 text-purple-400 shrink-0" />,
                      },
                    };

                    const currentStyle = levelColors[log.level] || levelColors.info;

                    const categoryColors: Record<string, string> = {
                      AUTH: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
                      TELEMETRY: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
                      FILTER: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                      SANDBOX: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
                      TELEGRAM: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
                      AUDIO: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                      AUDIT: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
                    };

                    return (
                      <div
                        key={log.id}
                        data-testid="log-entry"
                        className={`group p-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 transition-colors ${currentStyle.border}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            {/* Visual Status Icon */}
                            {currentStyle.icon}

                            {/* Timestamp & offset */}
                            <span className="text-slate-500 select-none">{log.timestamp}</span>
                            <span className="text-[10px] text-slate-500 bg-slate-950 px-1 rounded select-none">
                              +{log.elapsedMs}ms
                            </span>

                            {/* Level badge */}
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase border ${currentStyle.badge}`}
                            >
                              {log.level === 'warn' ? 'ВНИМАНИЕ' : log.level === 'success' ? 'УСПЕХ' : log.level.toUpperCase()}
                            </span>

                            {/* Category badge */}
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                                categoryColors[log.category] || 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {log.category}
                            </span>

                            {/* Message text */}
                            <span className="text-slate-200 break-words leading-relaxed">{log.message}</span>
                          </div>

                          {/* Meta toggle if available */}
                          {log.meta && (
                            <button
                              type="button"
                              onClick={() => toggleExpandLog(log.id)}
                              className="shrink-0 p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                              title="Показать / скрыть JSON метаданные"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-cyan-400" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Expanded JSON Inspector */}
                        {isExpanded && log.meta && (
                          <div className="mt-2 p-2 rounded bg-slate-950 border border-slate-800 text-[10px] text-cyan-300 overflow-x-auto">
                            <pre>{JSON.stringify(log.meta, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/90 text-xs">
          <div className="text-slate-400 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            <span>Песочница изолирована от рабочего хранилища и Telegram</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
