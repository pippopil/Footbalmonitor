import React, { useState, useEffect, useMemo } from 'react';
import {
  FilterRule,
  ScannerMatrixConfig,
  ScannerStatRow,
  HistoricalStreakConfig,
  TelegramBotProfile,
  Match,
  SportType,
  StatSideChoice,
} from '../types';
import { evaluateFilterRule } from '../algorithms';
import {
  Play,
  Square,
  RotateCcw,
  Plus,
  Save,
  Trash2,
  SlidersHorizontal,
  Flame,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Check,
  Zap,
  Target,
  ShieldAlert,
  Percent,
  Layers,
  Sparkles,
  HelpCircle,
  BarChart3,
  Radar,
  ArrowRight,
  Eye,
  Crosshair,
  Trophy,
  History,
  Timer,
  ChevronDown,
  ChevronUp,
  Sliders,
  Filter,
  Globe,
  Share2,
  Bookmark,
  Award,
  Cpu,
  RefreshCw,
  Search,
  CheckSquare,
  Crown,
  GraduationCap,
  Copy,
  Send,
  AlertCircle,
  X,
  CheckCircle2,
  Info,
  FileText,
  Lock,
  ArrowLeft,
  PowerOff,
} from 'lucide-react';
import {
  createCleanBlankMatrix,
  createDefaultStatRow,
  createDefaultHistoryConfig,
  cleanPresetTitle,
  getStrategyCardDisplayName,
} from '../utils/filterDefaults';

interface ScannerMatrixFilterViewProps {
  filters: FilterRule[];
  onSaveFilter: (rule: FilterRule) => void;
  onDeleteFilter: (id: string) => void;
  onStopAllFilters?: () => void;
  onStartAllFilters?: () => void;
  isMonitoringActive: boolean;
  onToggleMonitoring: () => void;
  userBots?: TelegramBotProfile[];
  currentUserId?: string;
  liveMatches?: Match[];
  selectedSport?: SportType | 'all';
  onOpenEducation?: () => void;
  isPaidUser?: boolean;
  isDeveloper?: boolean;
  onUpgradePlan?: () => void;
  onRestoreAllStrategies?: () => void;
}

const LEAGUE_GROUPS_CATALOG = [
  { id: 'championship', label: 'Championship / Высшие лиги', icon: '🏆' },
  { id: 'cups', label: 'Cups / Национальные кубки', icon: '🍷' },
  { id: 'womens', label: "Women's Football / Женский футбол", icon: '👩' },
  { id: 'friendlies', label: 'Friendlies / Товарищеские матчи', icon: '🤝' },
  { id: 'juniors', label: 'Juniors & U18-U23 / Молодежные турниры', icon: '👶' },
  { id: 'europe', label: 'Europa League & Champions / Еврокубки', icon: '⭐' },
  { id: 'nations', label: 'Nations League / Сборные страны', icon: '🌍' },
];

const LEAGUES_PRESETS_LIST = [
  'Австралия. Виктория. Женщины. Nike Cup',
  'Австралия. Виктория. Женщины. До 20 лет',
  'Австралия. Виктория. Кубок Докерти',
  'Австралия. Виктория. Национальная Премьер-лига',
  'Австралия. Виктория. Национальная Премьер-лига-2',
  'Австралия. Виктория. Национальная Премьер-лига-3',
  'Австралия. До 20 лет. Новый Южный Уэльс',
  'Австралия. До 23 лет. Виктория. Премьер-лига',
  'Австралия. До 23 лет. Квинсленд',
  'Англия. Премьер-лига (EPL)',
  'Испания. Ла Лига',
  'Германия. Бундеслига',
  'Италия. Серия А',
  'Франция. Лига 1',
  'Россия. РПЛ',
];

export const ScannerMatrixFilterView: React.FC<ScannerMatrixFilterViewProps> = ({
  filters,
  onSaveFilter,
  onDeleteFilter,
  onStopAllFilters,
  onStartAllFilters,
  isMonitoringActive,
  onToggleMonitoring,
  userBots = [],
  currentUserId,
  liveMatches = [],
  selectedSport = 'football',
  onOpenEducation,
  isPaidUser = false,
  isDeveloper = false,
  onUpgradePlan,
  onRestoreAllStrategies,
}) => {
  // Split custom filters vs ready-made presets
  const customFilters = useMemo(() => filters.filter((f) => !f.isPreset), [filters]);
  const presetFilters = useMemo(() => filters.filter((f) => f.isPreset), [filters]);

  // Currently selected filter ID for editing:
  // For free accounts, default to their custom filter or null (clean blank)
  const [selectedFilterId, setSelectedFilterId] = useState<string | null>(() => {
    if (!isPaidUser) {
      const firstCustom = filters.find((f) => !f.isPreset);
      return firstCustom ? firstCustom.id : null;
    }
    return filters.length > 0 ? filters[0].id : null;
  });

  // Filter Basic Info: pristine clean blank defaults
  const [filterName, setFilterName] = useState<string>('');
  const [filterDesc, setFilterDesc] = useState<string>('');
  const [targetMarket, setTargetMarket] = useState<string>('');
  const [selectedBotId, setSelectedBotId] = useState<string>('');
  const [telegramEnabled, setTelegramEnabled] = useState<boolean>(true);
  const [matrixSport, setMatrixSport] = useState<SportType>(
    selectedSport === 'all' ? 'football' : selectedSport
  );

  const [activeStepTab, setActiveStepTab] = useState<'time_score' | 'stats' | 'odds' | 'history' | 'leagues' | 'telegram'>('time_score');

  // Matrix configuration state: 100% clean blank matrix
  const [matrix, setMatrix] = useState<ScannerMatrixConfig>(createCleanBlankMatrix());
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'list' | 'editor' | 'live'>('editor');

  // Exact score selection: default ANY (no arbitrary restrictions)
  const [scoreConditionChoice, setScoreConditionChoice] = useState<string>('ANY');
  const [exactScoreInput, setExactScoreInput] = useState<string>('');
  const [exactTotalGoals, setExactTotalGoals] = useState<number | undefined>(undefined);
  const [exactHomeGoals, setExactHomeGoals] = useState<number | undefined>(undefined);
  const [exactAwayGoals, setExactAwayGoals] = useState<number | undefined>(undefined);

  // Filter list search query in left sidebar
  const [filterSearchQuery, setFilterSearchQuery] = useState<string>('');
  const [leagueSearchQuery, setLeagueSearchQuery] = useState<string>('');

  // Auto-notification helper
  const showNotice = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  // Load selected filter into form
  useEffect(() => {
    if (!selectedFilterId) {
      setFilterName('');
      setFilterDesc('');
      setTargetMarket('');
      setSelectedBotId('');
      setTelegramEnabled(true);
      setScoreConditionChoice('ANY');
      setExactScoreInput('');
      setExactTotalGoals(undefined);
      setExactHomeGoals(undefined);
      setExactAwayGoals(undefined);
      setMatrix(createCleanBlankMatrix());
      return;
    }
    const found = filters.find((f) => f.id === selectedFilterId);
    if (found) {
      setFilterName(found.name);
      setFilterDesc(found.description || '');
      setTargetMarket(found.targetMarket || '');
      setSelectedBotId(found.botId || '');
      setTelegramEnabled(found.telegramEnabled ?? true);
      if (found.sport) setMatrixSport(found.sport);

      setScoreConditionChoice(found.scoreCondition || 'ANY');
      setExactScoreInput(found.exactScore || '');
      setExactTotalGoals(found.exactTotalGoals ?? found.maxTotalGoals);
      setExactHomeGoals(found.exactHomeGoals);
      setExactAwayGoals(found.exactAwayGoals);

      if (found.scannerMatrix) {
        setMatrix(JSON.parse(JSON.stringify(found.scannerMatrix)));
      } else {
        const m = createCleanBlankMatrix();
        if (found.minMinute !== undefined || found.maxMinute !== undefined) {
          m.minuteRange = {
            checked: true,
            min: found.minMinute ?? 0,
            max: found.maxMinute ?? 90,
          };
        }
        if (found.minDangerousAttacksDiff) {
          m.dangerousAttacks = {
            ...m.dangerousAttacks,
            side: 'K1',
            diffThreshold: found.minDangerousAttacksDiff,
            operator: '>=',
          };
        }
        if (found.minShotsOnTargetTotal) {
          m.shotsOnTarget = {
            ...m.shotsOnTarget,
            totalMin: found.minShotsOnTargetTotal,
            operator: '>=',
          };
        }
        if (found.minTotalCorners) {
          m.corners = {
            ...m.corners,
            totalMin: found.minTotalCorners,
            operator: '>=',
          };
        }
        setMatrix(m);
      }
    }
  }, [selectedFilterId, filters]);

  // Build FilterRule object from current state
  const buildCurrentRule = (id: string): FilterRule => {
    const existing = filters.find((f) => f.id === id);

    return {
      id,
      name: filterName.trim() || 'Мой авторский фильтр',
      description: filterDesc.trim() || 'Пользовательский алгоритм лайв-сканера',
      category: 'custom',
      sport: matrixSport,
      enabled: existing?.enabled ?? true,
      minMinute: matrix.minuteRange.checked ? matrix.minuteRange.min : 0,
      maxMinute: matrix.minuteRange.checked ? matrix.minuteRange.max : 90,
      scoreCondition: (scoreConditionChoice as any) || 'ANY',
      targetMarket: targetMarket.trim() || '',
      telegramEnabled,
      botId: selectedBotId || undefined,
      userId: currentUserId,
      color: 'emerald',
      isPreset: false,
      scannerMatrix: matrix,
      exactScore: exactScoreInput.trim() || undefined,
      exactTotalGoals,
      exactHomeGoals,
      exactAwayGoals,
      maxTotalGoals: exactTotalGoals,
      minDangerousAttacksDiff: matrix.dangerousAttacks.diffThreshold,
      minDangerousAttacksTotal: matrix.dangerousAttacks.totalMin,
      minTotalCorners: matrix.corners.totalMin,
      minXgTotal: matrix.xgTotal?.totalMin,
      minXgOverScoreDiff: matrix.xgDeficit?.totalMin,
    };
  };

  const handleSave = () => {
    const id = selectedFilterId || `matrix-${Date.now()}`;
    const rule = buildCurrentRule(id);
    onSaveFilter(rule);
    if (!selectedFilterId) setSelectedFilterId(id);
    showNotice(`Стратегия «${rule.name}» успешно сохранена!`);
  };

  const handleCleanBlank = () => {
    setSelectedFilterId(null);
    setFilterName('');
    setFilterDesc('');
    setTargetMarket('');
    setSelectedBotId('');
    setTelegramEnabled(true);
    setScoreConditionChoice('ANY');
    setExactScoreInput('');
    setExactTotalGoals(undefined);
    setExactHomeGoals(undefined);
    setExactAwayGoals(undefined);
    setMatrix(createCleanBlankMatrix());
    setActiveStepTab('time_score');
    setMobileTab('editor');
    showNotice('📄 Открыт чистый бланк. Настройте авторские параметры с нуля!');
  };

  const handleCreateNew = () => {
    handleCleanBlank();
  };

  const handleDuplicate = () => {
    if (!selectedFilterId) return;
    const newId = `matrix-${Date.now()}`;
    const cloned = buildCurrentRule(newId);
    cloned.name = `${cloned.name} (Копия)`;
    onSaveFilter(cloned);
    setSelectedFilterId(newId);
    setMobileTab('editor');
    showNotice(`Создана копия «${cloned.name}»`);
  };

  const handleDelete = (idToDelete: string) => {
    onDeleteFilter(idToDelete);
    const remaining = filters.filter((f) => f.id !== idToDelete);
    setSelectedFilterId(remaining.length > 0 ? remaining[0].id : null);
    showNotice('Стратегия успешно удалена');
  };

  const updateStatRow = (key: keyof ScannerMatrixConfig, patch: Partial<ScannerStatRow>) => {
    setMatrix((prev) => ({
      ...prev,
      [key]: {
        ...((prev[key] as ScannerStatRow) || createDefaultStatRow()),
        ...patch,
      },
    }));
  };

  // Preview synthetic rule against active live matches
  const currentSyntheticRule = useMemo<FilterRule>(() => {
    return buildCurrentRule('preview-matrix-id');
  }, [
    filterName,
    filterDesc,
    matrix,
    matrixSport,
    scoreConditionChoice,
    exactScoreInput,
    exactTotalGoals,
    exactHomeGoals,
    exactAwayGoals,
    targetMarket,
  ]);

  // Live evaluation of matches with matching details
  const liveEvaluationResults = useMemo(() => {
    if (!liveMatches || liveMatches.length === 0) return [];

    return liveMatches
      .filter((m) => (m.sport || 'football') === matrixSport)
      .map((m) => {
        const evaluation = evaluateFilterRule(m, currentSyntheticRule);
        return {
          match: m,
          evaluation,
        };
      });
  }, [liveMatches, currentSyntheticRule, matrixSport]);

  const matchingMatches = liveEvaluationResults.filter((r) => r.evaluation.matches);
  const partialMatches = liveEvaluationResults.filter((r) => !r.evaluation.matches);

  // Find current selected rule object
  const selectedRule = useMemo(() => {
    if (!selectedFilterId) return null;
    return filters.find((f) => f.id === selectedFilterId) || null;
  }, [filters, selectedFilterId]);

  // Is the currently selected rule a preset on a free account?
  const isPresetSelectedByFreeUser = !isPaidUser && !!selectedRule?.isPreset;
  // Is the currently selected rule a preset on a paid account for non-developers (parameters hidden from copy)?
  const isPresetProtectedForUser = isPaidUser && !!selectedRule?.isPreset && !isDeveloper;

  // Filtered lists for left sidebar: split custom vs preset for clean separation
  const filteredCustomList = useMemo(() => {
    const list = filters.filter((f) => !f.isPreset);
    if (!filterSearchQuery.trim()) return list;
    return list.filter(
      (f) =>
        f.name.toLowerCase().includes(filterSearchQuery.toLowerCase()) ||
        (f.targetMarket && f.targetMarket.toLowerCase().includes(filterSearchQuery.toLowerCase()))
    );
  }, [filters, filterSearchQuery]);

  const filteredPresetList = useMemo(() => {
    const list = filters.filter((f) => f.isPreset);
    if (!filterSearchQuery.trim()) return list;
    return list.filter(
      (f) =>
        f.name.toLowerCase().includes(filterSearchQuery.toLowerCase()) ||
        (f.targetMarket && f.targetMarket.toLowerCase().includes(filterSearchQuery.toLowerCase()))
    );
  }, [filters, filterSearchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header Banner: BetLab Style Pro Studio */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-emerald-500/30 p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-16 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent border border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-950/50">
              <SlidersHorizontal className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  Конструктор фильтров & Сканер сигналов Pro
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-black uppercase">
                  BETLAB FORMAT
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Пошаговая настройка алгоритмов: время матча, точный счёт, пороги live-атак (К1/К2, за 15 мин), прогруз Smart Money и фильтр лиг.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {onOpenEducation && (
              <button
                type="button"
                onClick={onOpenEducation}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-2 transition active:scale-95 shadow-sm"
                title="Открыть подробный обучающий гид по настройке фильтров"
              >
                <GraduationCap className="h-4 w-4 text-amber-400" />
                <span>Гид по настройке</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCleanBlank}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-500/40 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              title="Открыть абсолютно чистый бланк и настроить фильтр с нуля"
            >
              <FileText className="h-4 w-4 text-teal-400" />
              <span>Чистый бланк</span>
            </button>

            <button
              type="button"
              onClick={handleCreateNew}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 transition active:scale-95 shadow-lg shadow-emerald-950/50"
            >
              <Plus className="h-4 w-4" />
              <span>+ Новый фильтр</span>
            </button>

            <button
              onClick={onToggleMonitoring}
              type="button"
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition active:scale-95 shadow-lg ${
                isMonitoringActive
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 shadow-rose-950/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50 border border-emerald-400/40'
              }`}
            >
              {isMonitoringActive ? (
                <>
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>Сканер активен</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Запустить сканер</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold px-4 py-3 rounded-2xl flex items-center gap-2 shadow-lg animate-fade-in">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Mobile Column Switcher (Visible on < lg screens only) */}
      <div className="lg:hidden flex items-center bg-slate-900/90 border border-slate-800 rounded-2xl p-1 gap-1 shadow-md">
        <button
          type="button"
          onClick={() => setMobileTab('list')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            mobileTab === 'list'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Список ({filters.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('editor')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            mobileTab === 'editor'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Редактор</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('live')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            mobileTab === 'live'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Radar className="h-3.5 w-3.5" />
          <span>Радар ({matchingMatches.length})</span>
        </button>
      </div>

      {/* 3-Column Professional Layout (Left: Strategies list, Center: Step-by-step editor, Right: Live scanner check) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Strategies list (3 cols) */}
        <div className={`${mobileTab === 'list' ? 'block' : 'hidden'} lg:block lg:col-span-3 space-y-3 bg-slate-950/90 border border-slate-800 rounded-3xl p-4 shadow-xl`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-emerald-400" />
              {isPaidUser ? `Все фильтры (${filters.length})` : `Мои фильтры (${customFilters.length})`}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {onRestoreAllStrategies && (
                <button
                  type="button"
                  onClick={onRestoreAllStrategies}
                  className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition text-[11px] font-bold flex items-center gap-1"
                  title="Восстановить все 50+ заводских стратегий платформы"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Вернуть 50+</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleCleanBlank}
                className="px-2 py-1 rounded-lg bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 border border-teal-500/30 transition text-[11px] font-bold flex items-center gap-1"
                title="Создать фильтр с чистого бланка"
              >
                <FileText className="h-3 w-3" />
                <span>Бланк</span>
              </button>
              <button
                type="button"
                onClick={handleCreateNew}
                className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition text-xs font-bold"
                title="Создать новую стратегию"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Search & Bulk State Controls */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              {onStopAllFilters && (
                <button
                  type="button"
                  onClick={onStopAllFilters}
                  disabled={filters.filter((f) => f.enabled).length === 0}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[11px] font-bold flex items-center justify-center gap-1 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Остановить все активные стратегии"
                >
                  <PowerOff className="h-3 w-3 text-rose-400" />
                  <span>Стоп все ({filters.filter((f) => f.enabled).length})</span>
                </button>
              )}
              {onStartAllFilters && (
                <button
                  type="button"
                  onClick={onStartAllFilters}
                  disabled={filters.filter((f) => !f.enabled).length === 0}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center justify-center gap-1 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Запустить все стратегии"
                >
                  <Play className="h-3 w-3 text-emerald-400 fill-emerald-400" />
                  <span>Старт все</span>
                </button>
              )}
            </div>

            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Поиск фильтров..."
                value={filterSearchQuery}
                onChange={(e) => setFilterSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Strategies List */}
          <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
            {/* 1. Custom User Filters (Clean Blank / User Created) */}
            <div className="space-y-1.5">
              {!isPaidUser && (
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Авторские фильтры ({filteredCustomList.length})
                </div>
              )}

              {filteredCustomList.length === 0 ? (
                <div
                  onClick={handleCleanBlank}
                  className="p-3.5 rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer text-center space-y-1 transition"
                >
                  <FileText className="h-4 w-4 text-emerald-400 mx-auto" />
                  <div className="text-xs font-bold text-emerald-300">Чистый бланк активен</div>
                  <div className="text-[10px] text-slate-400">Настройте условия справа и нажмите «Сохранить»</div>
                </div>
              ) : (
                filteredCustomList.map((f) => {
                  const isSelected = f.id === selectedFilterId;
                  const matchesCount = liveMatches.filter((m) => evaluateFilterRule(m, f).matches).length;

                  return (
                    <div
                      key={f.id}
                      onClick={() => {
                        setSelectedFilterId(f.id);
                        setMobileTab('editor');
                      }}
                      className={`p-3 rounded-2xl border cursor-pointer transition text-xs space-y-2 ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-white text-xs leading-snug line-clamp-2">
                          {f.name}
                        </div>
                        {/* Active toggle */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSaveFilter({ ...f, enabled: !f.enabled });
                          }}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase shrink-0 transition ${
                            f.enabled
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                          title={f.enabled ? 'Остановить фильтр' : 'Включить фильтр'}
                        >
                          {f.enabled ? 'ON' : 'OFF'}
                        </button>
                      </div>

                      {f.targetMarket && (
                        <div className="text-[10px] text-amber-300 font-mono flex items-center gap-1">
                          <Target className="h-3 w-3 shrink-0" />
                          <span className="truncate">{f.targetMarket}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                        <span className="font-mono">
                          {f.minMinute ?? 0}' – {f.maxMinute ?? 90}' мин
                        </span>
                        {matchesCount > 0 ? (
                          <span className="font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded font-mono">
                            🔥 {matchesCount} LIVE
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono">0 LIVE</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {filteredPresetList.length === 0 && onRestoreAllStrategies && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2">
                <div className="text-xs font-bold text-amber-300">Базовые стратегии не найдены или удалены</div>
                <button
                  type="button"
                  onClick={onRestoreAllStrategies}
                  className="w-full py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Восстановить все 50+ стратегий</span>
                </button>
              </div>
            )}

            {/* 2. Ready-Made Presets: Locked on FREE accounts, Unlocked on PAID */}
            {filteredPresetList.length > 0 && (
              <div className="space-y-1.5 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  <span className="flex items-center gap-1.5">
                    {!isPaidUser ? <Lock className="h-3 w-3 text-amber-400" /> : <Sparkles className="h-3 w-3 text-amber-400" />}
                    Готовые стратегии ({filteredPresetList.length})
                  </span>
                  {!isPaidUser && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                      PRO/VIP
                    </span>
                  )}
                </div>

                {filteredPresetList.map((f) => {
                  const isSelected = f.id === selectedFilterId;
                  const matchesCount = liveMatches.filter((m) => evaluateFilterRule(m, f).matches).length;

                  return (
                    <div
                      key={f.id}
                      onClick={() => {
                        setSelectedFilterId(f.id);
                        setMobileTab('editor');
                      }}
                      className={`p-3 rounded-2xl border cursor-pointer transition text-xs space-y-2 ${
                        isSelected
                          ? !isPaidUser
                            ? 'bg-amber-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                            : 'bg-emerald-500/15 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                          : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-white text-xs leading-snug line-clamp-2">
                          {f.isPreset && !isDeveloper ? getStrategyCardDisplayName(f, isDeveloper, filters) : f.name}
                        </div>
                        {isPaidUser ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSaveFilter({ ...f, enabled: !f.enabled });
                            }}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase shrink-0 transition ${
                              f.enabled
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {f.enabled ? 'ON' : 'OFF'}
                          </button>
                        ) : (
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase shrink-0 bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1"
                            title="Готовая стратегия доступна на тарифах PRO и VIP"
                          >
                            <Lock className="h-2.5 w-2.5" />
                            <span>PRO</span>
                          </span>
                        )}
                      </div>

                      {f.targetMarket && (
                        <div className="text-[10px] text-amber-300/90 font-mono flex items-center gap-1">
                          <Target className="h-3 w-3 shrink-0" />
                          <span className="truncate">{f.targetMarket}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                        {f.isPreset && !isDeveloper ? (
                          <span className="text-amber-300 font-medium flex items-center gap-1">
                            <Lock className="h-2.5 w-2.5 text-amber-400" />
                            <span>Вшитый VIP</span>
                          </span>
                        ) : (
                          <span className="font-mono">
                            {f.minMinute ?? 0}' – {f.maxMinute ?? 90}' мин
                          </span>
                        )}
                        {matchesCount > 0 ? (
                          <span className="font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded font-mono">
                            🔥 {matchesCount} LIVE
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono">0 LIVE</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* CENTER COLUMN: BetLab Step-by-Step Editor (6 cols) */}
        <div className={`${mobileTab === 'editor' ? 'block' : 'hidden'} lg:block lg:col-span-6 space-y-4 bg-slate-950/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl`}>
          {/* Mobile column sub-nav for editor */}
          <div className="lg:hidden flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setMobileTab('list')}
              className="flex items-center gap-1 text-slate-300 hover:text-white font-bold"
            >
              <ArrowLeft className="h-4 w-4 text-emerald-400" />
              <span>К списку</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('live')}
              className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30"
            >
              <span>В Live ({matchingMatches.length}) →</span>
            </button>
          </div>
          {isPresetSelectedByFreeUser ? (
            /* Locked Screen for Ready-Made Presets on Free Accounts */
            <div className="p-6 sm:p-8 space-y-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-amber-950/40">
                <Lock className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1.5">
                  <Crown className="h-3.5 w-3.5" />
                  Готовая стратегия тарифов PRO & VIP
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {selectedRule ? (selectedRule.isPreset && !isDeveloper ? getStrategyCardDisplayName(selectedRule, isDeveloper, filters) : selectedRule.name) : ''}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                  Вшитый алгоритм платформы. Формула и параметры защищены разработчиком от копирования. Доступен для запуска в тарифах PRO и VIP.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left text-xs space-y-2.5 max-w-md mx-auto text-slate-300">
                <div className="font-bold text-white flex items-center gap-1.5 pb-1 border-b border-slate-800">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  Возможности тарифов:
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span><strong>Тариф FREE:</strong> настройка собственных фильтров с чистого бланка по 20+ метрикам.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span><strong>Тарифы PRO & VIP:</strong> доступ ко всей библиотеке готовых авторских алгоритмов сервиса + до 5-15 ботов.</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCleanBlank}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition active:scale-95"
                >
                  <FileText className="h-4 w-4" />
                  <span>Создать свой фильтр (Чистый бланк)</span>
                </button>
                {onUpgradePlan && (
                  <button
                    type="button"
                    onClick={onUpgradePlan}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 transition active:scale-95"
                  >
                    <Crown className="h-4 w-4" />
                    <span>Разблокировать в тарифе PRO</span>
                  </button>
                )}
              </div>
            </div>
          ) : isPresetProtectedForUser && selectedRule ? (
            /* Protected Screen for Ready-Made Presets on Paid Accounts (Parameters hidden from non-developers) */
            <div className="p-6 sm:p-8 space-y-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-amber-950/40">
                <Lock className="h-8 w-8" />
              </div>

              <div className="space-y-2 max-w-lg mx-auto">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Вшитый алгоритм защищён разработчиком
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {selectedRule.isPreset && !isDeveloper ? getStrategyCardDisplayName(selectedRule, isDeveloper, filters) : selectedRule.name}
                </h3>
                <div className="mt-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left space-y-1">
                  <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5" />
                    <span>Ожидаемый прогноз по карточке:</span>
                  </div>
                  <div className="text-sm font-black text-amber-200">
                    {selectedRule.targetMarket || 'Live исход / Тотал'}
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pt-1">
                  Вшитый алгоритм платформы. Формула и параметры защищены разработчиком от копирования. Алгоритм активен для мониторинга в вашей подписке.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto text-left">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Статистика прохода</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    {selectedRule.verifiedPassRate || '96–100%'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Целевой исход</span>
                  <span className="text-xs font-black text-amber-300 truncate block mt-0.5">
                    {selectedRule.targetMarket || 'Live рынок'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Статус работы</span>
                  <span className={`text-xs font-bold block mt-0.5 ${selectedRule.enabled ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {selectedRule.enabled ? '🟢 Запущен в Live' : '⚪ Остановлен'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left text-xs text-amber-200/90 max-w-xl mx-auto space-y-2 leading-relaxed">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  Защита параметров от копирования
                </div>
                <p className="text-[11px] text-slate-300">
                  Числовые пороги атак, коэффициенты, xG и веса тактической матрицы скрыты разработчиком для предотвращения копирования стратегии. Алгоритм полностью доступен для использования по вашей подписке: запускайте его в мониторинг, получайте мгновенные push-сигналы и подключайте Telegram-бота.
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Telegram-бот:</span>
                    <select
                      value={selectedRule.botId || ''}
                      onChange={(e) => onSaveFilter({ ...selectedRule, botId: e.target.value || undefined })}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none"
                    >
                      <option value="">По умолчанию</option>
                      {userBots.map((b) => (
                        <option key={b.id} value={b.id}>
                          🤖 {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSaveFilter({ ...selectedRule, telegramEnabled: !selectedRule.telegramEnabled })}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                      selectedRule.telegramEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Telegram: {selectedRule.telegramEnabled ? 'ВКЛ' : 'ВЫКЛ'}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onSaveFilter({ ...selectedRule, enabled: !selectedRule.enabled })}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition active:scale-95 shadow-lg ${
                    selectedRule.enabled
                      ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                  }`}
                >
                  {selectedRule.enabled ? (
                    <>
                      <PowerOff className="h-4 w-4 text-rose-400" />
                      <span>Остановить мониторинг</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-white" />
                      <span>Запустить в мониторинг</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCleanBlank}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-2 transition"
                >
                  <FileText className="h-4 w-4 text-emerald-400" />
                  <span>Создать свой фильтр (Чистый бланк)</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {selectedRule?.isPreset && isDeveloper && (
                <div className="mb-3 p-3 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-between text-xs font-mono text-purple-300">
                  <span className="font-bold flex items-center gap-1.5">
                    <span>👨‍💻 Режим разработчика (GOD MODE)</span>
                  </span>
                  <span className="text-[11px] text-purple-400">
                    Вшитая стратегия: формулы и матричные веса открыты для калибровки
                  </span>
                </div>
              )}
              {/* Editor Header: Name & Target Market with Clean Blank button */}
              <div className="space-y-3 pb-4 border-b border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    placeholder="Введите название фильтра (например: Гол на 75-й минуте)..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleCleanBlank}
                      className="px-2.5 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 transition text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      title="Очистить все параметры в чистый бланк с нуля"
                    >
                      <FileText className="h-3.5 w-3.5 text-teal-400" />
                      <span className="hidden sm:inline">Чистый бланк</span>
                    </button>
                    {(!selectedRule?.isPreset || isDeveloper) && (
                      <button
                        type="button"
                        onClick={handleDuplicate}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
                        title="Клонировать эту стратегию"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {selectedFilterId && (
                      <button
                        type="button"
                        onClick={() => handleDelete(selectedFilterId)}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 border border-slate-800 transition"
                        title="Удалить стратегию"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      🎯 Целевой исход (на что делать ставку):
                    </label>
                    <input
                      type="text"
                      value={targetMarket}
                      onChange={(e) => setTargetMarket(e.target.value)}
                      placeholder="Например: ТБ 0.5 во 2-м тайме / Победа фаворита"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      📱 Telegram бот для уведомлений:
                    </label>
                    <select
                      value={selectedBotId}
                      onChange={(e) => setSelectedBotId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="">Бот по умолчанию (Главный канал)</option>
                      {userBots.map((b) => (
                        <option key={b.id} value={b.id}>
                          🤖 {b.name} (@{b.botToken.slice(0, 10)}...)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

          {/* BetLab Navigation Tabs (Step-by-step workflow) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-slate-800">
            {[
              { id: 'time_score', label: '⏱️ Время и Счёт' },
              { id: 'stats', label: '📊 Live-Статистика' },
              { id: 'odds', label: '💰 Кэфы & Smart Money' },
              { id: 'history', label: '📜 Серии & H2H' },
              { id: 'leagues', label: '🌍 Лиги & Турниры' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveStepTab(tab.id as any)}
                className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  activeStepTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: ВРЕМЯ И СЧЁТ (BetLab Time & Score block) */}
          {activeStepTab === 'time_score' && (
            <div className="space-y-4 pt-1">
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-sky-400" />
                    Минуты матча (Интервал сканирования):
                  </span>
                  <span className="font-mono font-bold text-sky-400 text-sm bg-sky-950/80 px-2 py-0.5 rounded border border-sky-500/30">
                    {matrix.minuteRange.min}' – {matrix.minuteRange.max}' мин
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold">От минуты:</label>
                    <input
                      type="number"
                      min="0"
                      max="90"
                      value={matrix.minuteRange.min}
                      onChange={(e) =>
                        setMatrix({
                          ...matrix,
                          minuteRange: { ...matrix.minuteRange, min: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold">До минуты:</label>
                    <input
                      type="number"
                      min="0"
                      max="90"
                      value={matrix.minuteRange.max}
                      onChange={(e) =>
                        setMatrix({
                          ...matrix,
                          minuteRange: { ...matrix.minuteRange, max: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                {/* Quick Minute Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-500 font-semibold">Быстрый выбор:</span>
                  {[
                    { label: '70-88\' (Концовка)', min: 70, max: 88 },
                    { label: '75-90\' (Штурм)', min: 75, max: 90 },
                    { label: '15-40\' (1-й тайм)', min: 15, max: 40 },
                    { label: '50-70\' (Старт 2Т)', min: 50, max: 70 },
                    { label: '0-90\' (Весь матч)', min: 0, max: 90 },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setMatrix({
                          ...matrix,
                          minuteRange: { checked: true, min: p.min, max: p.max },
                        })
                      }
                      className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-[10px] text-slate-300 border border-slate-800 transition"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Score condition tags */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Условие текущего счёта в матче:</span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Выбрано: {scoreConditionChoice}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { id: 'TOTAL_UNDER_25', label: 'ТБ 2.5 не пробит', desc: '≤ 2 голов' },
                    { id: '0-0', label: 'Строго 0:0', desc: 'Сухая игра' },
                    { id: 'DRAW', label: 'Любая ничья', desc: '0:0, 1:1, 2:2' },
                    { id: 'ONE_GOAL_DIFF', label: 'Разница в 1 гол', desc: '1:0, 2:1, 0:1' },
                    { id: 'HOME_LEAD', label: 'К1 (Хозяева) ведут', desc: 'Побеждают' },
                    { id: 'AWAY_LEAD', label: 'К2 (Гости) ведут', desc: 'Побеждают' },
                    { id: 'TOTAL_UNDER_2', label: 'ТМ 2.5', desc: '≤ 2 голов' },
                    { id: 'ANY', label: 'Любой счёт', desc: 'Без ограничений' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setScoreConditionChoice(s.id)}
                      className={`p-2 rounded-xl border text-left transition ${
                        scoreConditionChoice === s.id
                          ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-xs">{s.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{s.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Maximum total goals input */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-300">Максимум голов в матче (тотал ≤):</span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={exactTotalGoals ?? ''}
                    onChange={(e) =>
                      setExactTotalGoals(e.target.value === '' ? undefined : Number(e.target.value))
                    }
                    placeholder="2 (не более 2 голов)"
                    className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white text-center font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE-СТАТИСТИКА (BetLab Stats Matrix) */}
          {activeStepTab === 'stats' && (
            <div className="space-y-3 pt-1">
              <div className="text-xs text-slate-400 pb-1">
                Настройте пороги по ключевым показателям игры. Система проверит их автоматически:
              </div>

              {/* 1. Dangerous Attacks */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-emerald-400" />
                    Опасные атаки (Главный индикатор гола)
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    {matrix.dangerousAttacks.side === 'K1' ? 'К1 (Хозяева)' : 'Обе команды'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400">Сторона:</label>
                    <select
                      value={matrix.dangerousAttacks.side}
                      onChange={(e) => updateStatRow('dangerousAttacks', { side: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
                    >
                      <option value="K1">К1 (Хозяева)</option>
                      <option value="K2">К2 (Гости)</option>
                      <option value="12">Сумма (К1+К2)</option>
                      <option value="FAVORITE">Фаворит матча</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Разница (К1 - К2) ≥:</label>
                    <input
                      type="number"
                      placeholder="Например: 15"
                      value={matrix.dangerousAttacks.diffThreshold ?? ''}
                      onChange={(e) =>
                        updateStatRow('dangerousAttacks', {
                          diffThreshold: e.target.value === '' ? undefined : Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Всего за матч ≥:</label>
                    <input
                      type="number"
                      placeholder="Например: 45"
                      value={matrix.dangerousAttacks.totalMin ?? ''}
                      onChange={(e) =>
                        updateStatRow('dangerousAttacks', {
                          totalMin: e.target.value === '' ? undefined : Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Shots on target */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-amber-400" />
                    Удары в створ ворот
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400">Ударов в створ всего (≥):</label>
                    <input
                      type="number"
                      placeholder="Например: 4"
                      value={matrix.shotsOnTarget.totalMin ?? ''}
                      onChange={(e) =>
                        updateStatRow('shotsOnTarget', {
                          totalMin: e.target.value === '' ? undefined : Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Разница ударов в створ (≥):</label>
                    <input
                      type="number"
                      placeholder="Например: 3"
                      value={matrix.shotsOnTarget.diffThreshold ?? ''}
                      onChange={(e) =>
                        updateStatRow('shotsOnTarget', {
                          diffThreshold: e.target.value === '' ? undefined : Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Corners */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-sky-400" />
                    Угловые удары (Стандарты)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400">Угловых всего (≥):</label>
                    <input
                      type="number"
                      placeholder="Например: 6"
                      value={matrix.corners.totalMin ?? ''}
                      onChange={(e) =>
                        updateStatRow('corners', {
                          totalMin: e.target.value === '' ? undefined : Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Разница угловых (≥):</label>
                    <input
                      type="number"
                      placeholder="Например: 3"
                      value={matrix.corners.diffThreshold ?? ''}
                      onChange={(e) =>
                        updateStatRow('corners', {
                          diffThreshold: e.target.value === '' ? undefined : Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 4. xG Model */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-purple-400" />
                    Модель xG (Ожидаемые голы)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400">Суммарный xG матча (≥):</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="1.4"
                      value={matrix.xgTotal?.totalMin ?? ''}
                      onChange={(e) =>
                        updateStatRow('xgTotal', {
                          totalMin: e.target.value === '' ? undefined : Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">xG дефицит над счётом (≥):</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="+1.0"
                      value={matrix.xgDeficit?.totalMin ?? ''}
                      onChange={(e) =>
                        updateStatRow('xgDeficit', {
                          totalMin: e.target.value === '' ? undefined : Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: КОЭФФИЦИЕНТЫ И SMART MONEY */}
          {activeStepTab === 'odds' && (
            <div className="space-y-4 pt-1">
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <TrendingDown className="h-4 w-4 text-rose-400" />
                  Smart Money: Денежный прогруз биржи (Steam Move)
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400">Падение кэфа от (%):</label>
                    <input
                      type="number"
                      placeholder="15 (%)"
                      value={matrix.favoriteCondition?.maxOdds ? 15 : ''}
                      onChange={() => {}}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Доля денег в пуле (≥ %):</label>
                    <input
                      type="number"
                      placeholder="65 (% пула)"
                      defaultValue={65}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Odds corridors */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="font-bold text-white text-xs">Коридоры коэффициентов:</div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400">Кэф на ТБ 2.5 (максимум):</label>
                    <input
                      type="number"
                      step="0.05"
                      placeholder="1.95"
                      defaultValue={1.95}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Кэф на фаворита (максимум):</label>
                    <input
                      type="number"
                      step="0.05"
                      placeholder="1.70"
                      defaultValue={1.70}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: СЕРИИ & H2H */}
          {activeStepTab === 'history' && (
            <div className="space-y-4 pt-1">
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <History className="h-4 w-4 text-indigo-400" />
                  Исторические серии и очные встречи (H2H)
                </div>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-emerald-500" />
                    <span>Серия ТБ 2.5 в очных матчах (минимум 4 из 5)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-emerald-500" />
                    <span>Серия без счёта 0:0 за последние 5 туров</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <input type="checkbox" className="accent-emerald-500" />
                    <span>Два быстрых гола в 1-м тайме (паттерн гола после 75')</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ЛИГИ & ТУРНИРЫ */}
          {activeStepTab === 'leagues' && (
            <div className="space-y-4 pt-1">
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-teal-400" />
                  Фильтр лиг и чемпионатов
                </div>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-emerald-500" />
                    <span>Исключить молодёжные первенства (U18, U19, U21, Reserves)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-emerald-500" />
                    <span>Исключить женский футбол</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-emerald-500" />
                    <span>Включить топ-чемпионаты Европы (EPL, La Liga, Serie A, Bundesliga, RPL)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Save Action Bar */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400">
              {matchingMatches.length > 0 ? (
                <span className="text-emerald-400 font-bold">
                  🟢 Прямо сейчас совпадает: {matchingMatches.length} live-матчей
                </span>
              ) : (
                '⏳ Ожидание наступления условий в live'
              )}
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleCleanBlank}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-500/40 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                title="Очистить все параметры в чистый бланк"
              >
                <FileText className="h-4 w-4 text-teal-400" />
                <span>Чистый бланк</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition active:scale-95"
              >
                <Save className="h-4 w-4" />
                <span>Сохранить и запустить</span>
              </button>
            </div>
          </div>
          </>
          )}
        </div>

        {/* RIGHT COLUMN: Live Match Scanner & Real-Time Test (3 cols) */}
        <div className={`${mobileTab === 'live' ? 'block' : 'hidden'} lg:block lg:col-span-3 space-y-4 bg-slate-950/90 border border-slate-800 rounded-3xl p-4 shadow-xl`}>
          {/* Mobile column sub-nav for live radar */}
          <div className="lg:hidden flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setMobileTab('editor')}
              className="flex items-center gap-1 text-slate-300 hover:text-white font-bold"
            >
              <ArrowLeft className="h-4 w-4 text-emerald-400" />
              <span>В редактор</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('list')}
              className="text-slate-400 hover:text-white"
            >
              К списку
            </button>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <Radar className="h-4 w-4 text-emerald-400 animate-spin-slow" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Подходящие матчи Live
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {matchingMatches.length} / {liveEvaluationResults.length} совпало
            </span>
          </div>

          <div className="text-[11px] text-slate-400 leading-relaxed">
            Показывает в реальном времени, какие матчи прямо сейчас проходят по вашему фильтру:
          </div>

          {/* Matches List */}
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {matchingMatches.length > 0 ? (
              matchingMatches.map(({ match, evaluation }) => (
                <div
                  key={match.id}
                  className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/50 text-xs space-y-2 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">
                      {match.homeTeam} <span className="text-emerald-400">{match.score[0]}:{match.score[1]}</span> {match.awayTeam}
                    </span>
                    <span className="font-mono text-emerald-400 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded text-[10px]">
                      {match.minute}'
                    </span>
                  </div>

                  <div className="text-[10px] text-emerald-300 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Все условия выполнены! Сигнал готов</span>
                  </div>

                  <div className="text-[10px] text-slate-400 pt-1 border-t border-emerald-500/30 font-mono">
                    Оп. атаки: {match.stats?.dangerousAttacks?.[0] ?? 0}-{match.stats?.dangerousAttacks?.[1] ?? 0} | xG: {(match.stats?.xg?.[0] ?? 0).toFixed(2)}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1.5 text-slate-400">
                <div className="text-xs font-bold text-slate-300">Нет 100% совпадений</div>
                <p className="text-[10px] text-slate-500">
                  Матчи ниже почти подошли, но им не хватило нескольких показателей:
                </p>
              </div>
            )}

            {/* Partial matches */}
            {partialMatches.slice(0, 4).map(({ match, evaluation }) => (
              <div
                key={match.id}
                className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-xs space-y-1.5 opacity-90"
              >
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-semibold truncate max-w-[140px]">
                    {match.homeTeam} vs {match.awayTeam}
                  </span>
                  <span className="font-mono text-slate-400 text-[10px]">{match.minute}' ({match.score[0]}:{match.score[1]})</span>
                </div>

                {evaluation.unmetCriteria && evaluation.unmetCriteria.length > 0 && (
                  <div className="text-[10px] text-amber-400 font-medium">
                    ⚠️ Ждём: {evaluation.unmetCriteria[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
