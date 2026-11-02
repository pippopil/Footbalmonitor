import {
  FilterRule,
  ScannerMatrixConfig,
  ScannerStatRow,
  HistoricalStreakConfig,
  UserProfile,
} from '../types';

export const createDefaultStatRow = (): ScannerStatRow => ({
  side: '12',
  operator: '>=',
  diffThreshold: undefined,
  ind1Min: undefined,
  ind1Max: undefined,
  ind2Min: undefined,
  ind2Max: undefined,
  totalMin: undefined,
  totalMax: undefined,
  last5MinMin: undefined,
  last10MinMin: undefined,
  last15MinMin: undefined,
  half1Min: undefined,
  half2Min: undefined,
});

export const createDefaultHistoryConfig = (): HistoricalStreakConfig => ({
  checked: false,
  matchesCount: 6,
  targetSide: 'ANY',
  minWins: undefined,
  maxLosses: undefined,
  minDraws: undefined,
  minGoalsScored: undefined,
  maxGoalsConceded: undefined,
  bothTeamsScoredHits: undefined,
  over25Hits: undefined,
  zeroZeroCount: undefined,
});

/**
 * 100% чистый бланк матрицы тактического сканера:
 * Никаких предустановленных порогов атак, ударов, угловых или минут!
 */
export const createCleanBlankMatrix = (): ScannerMatrixConfig => ({
  p1: { checked: false, min: 1.0, max: 2.0 },
  draw: { checked: false, min: 1.0, max: 3.5 },
  p2: { checked: false, min: 1.0, max: 4.0 },
  dc1X: { checked: false, min: 1.0, max: 1.5 },
  dc12: { checked: false, min: 1.0, max: 1.5 },
  dcX2: { checked: false, min: 1.0, max: 1.5 },

  period: 'ALL',
  minuteRange: { checked: false, min: 0, max: 90 },

  addedTime1H: { checked: false, min: 1, max: 5 },
  addedTime2H: { checked: false, min: 2, max: 8 },

  includedLeagueGroups: ['championship', 'cups', 'europe', 'nations'],
  excludedLeagues: [],

  favoriteCondition: {
    enabled: false,
    maxOdds: 1.65,
    state: 'ANY',
    location: 'ANY',
  },

  tb05: { checked: false, min: 1.0, max: 2.5 },
  tb15: { checked: false, min: 1.0, max: 2.5 },
  tb25: { checked: false, min: 1.0, max: 2.5 },
  tm05: { checked: false, min: 1.0, max: 2.5 },
  tm15: { checked: false, min: 1.0, max: 2.5 },
  tm25: { checked: false, min: 1.0, max: 2.5 },
  tb15_1h: { checked: false, min: 1.0, max: 2.5 },
  tm15_1h: { checked: false, min: 1.0, max: 2.5 },
  bttsYes: { checked: false, min: 1.45, max: 2.2 },
  bttsNo: { checked: false, min: 1.5, max: 2.5 },

  goals: createDefaultStatRow(),
  attacks: createDefaultStatRow(),
  dangerousAttacks: createDefaultStatRow(),
  possession: createDefaultStatRow(),
  shotsOnTarget: createDefaultStatRow(),
  shotsOffTarget: createDefaultStatRow(),
  corners: createDefaultStatRow(),
  yellowCards: createDefaultStatRow(),
  redCards: createDefaultStatRow(),

  intensity10m: createDefaultStatRow(),
  intensityMatch: createDefaultStatRow(),

  historyForm: createDefaultHistoryConfig(),
  historyGoals: createDefaultHistoryConfig(),
  historyTotals: createDefaultHistoryConfig(),

  xgTotal: createDefaultStatRow(),
  xgDiff: createDefaultStatRow(),
  xgDeficit: createDefaultStatRow(),
  xgMomentum15m: createDefaultStatRow(),
});

/**
 * 100% чистый бланк правила фильтра (для создания авторских фильтров с нуля)
 */
export const createCleanBlankFilter = (userId?: string): FilterRule => ({
  id: `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  name: 'Мой авторский фильтр',
  description: 'Пользовательский алгоритм лайв-сканера (чистый бланк)',
  category: 'custom',
  ruleType: 'LIVE',
  sport: 'football',
  enabled: false,
  minMinute: 0,
  maxMinute: 90,
  scoreCondition: 'ANY',
  targetMarket: '',
  telegramEnabled: true,
  color: 'emerald',
  isPreset: false,
  requiredPlan: 'FREE',
  userId: userId || undefined,
  scannerMatrix: createCleanBlankMatrix(),
  exactScore: undefined,
  exactTotalGoals: undefined,
  exactHomeGoals: undefined,
  exactAwayGoals: undefined,
  minDangerousAttacksDiff: undefined,
  minDangerousAttacksTotal: undefined,
  minAttacksDiff: undefined,
  minAttacksTotal: undefined,
  minTotalShots: undefined,
  minShotsDiff: undefined,
  minShotsOnTargetTotal: undefined,
  minShotsOnTargetDiff: undefined,
  minTotalCorners: undefined,
  minCornersDiff: undefined,
  minPossessionDiff: undefined,
  minXgTotal: undefined,
  minXgDiff: undefined,
  minXgOverScoreDiff: undefined,
  minPressureIndex: undefined,
  maxPressureIndex: undefined,
  maxDangerousAttacksTotal: undefined,
  maxShotsOnTargetTotal: undefined,
  maxScoreDiff: undefined,
  redCardCondition: 'ANY',
  maxOddsFavorite: undefined,
  minOddsFavorite: undefined,
  maxOddsOver25: undefined,
  minOddsOver25: undefined,
  minOddsDropPercent: undefined,
  minMoneyVolumePercent: undefined,
  excludeYouthAndWomen: false,
});

/**
 * Проверка наличия платной подписки (PRO, VIP, GOD_MODE)
 */
export const isUserPaid = (user?: UserProfile | null): boolean => {
  if (!user) return false;
  return (
    user.plan === 'GOD_MODE' ||
    user.plan === 'VIP_CLUB' ||
    user.plan === 'PRO_ANALYST' ||
    user.role === 'god' ||
    user.role === 'pro' ||
    user.role === 'vip'
  );
};

/**
 * Проверка прав разработчика / создателя платформы
 * Только разработчик имеет доступ к просмотру внутренних формул, порогов и редактированию вшитых алгоритмов.
 * Для всех обычных пользователей параметры скрыты для защиты от копирования.
 */
export const isUserDeveloper = (user?: UserProfile | null): boolean => {
  if (!user) return false;
  const roleLower = String(user.role || '').toLowerCase();
  const planUpper = String(user.plan || '').toUpperCase();
  const usernameLower = String(user.username || '').toLowerCase();
  const idLower = String(user.id || '').toLowerCase();
  return (
    roleLower === 'god' ||
    roleLower === 'admin' ||
    planUpper === 'GOD_MODE' ||
    planUpper.includes('GOD') ||
    usernameLower.includes('god') ||
    usernameLower === 'developer_god' ||
    idLower.includes('god')
  );
};

/**
 * Очищает название вшитой стратегии от раскрытия внутренних параметров
 * (минуты, точный счёт, пороги атак/кэфов в скобках), чтобы пользователи видели чистое название алгоритма.
 */
export const cleanPresetTitle = (name: string): string => {
  if (!name) return '';
  return name
    // Убираем скобки с минутами или условиями, например: (60-85 мин), (55-88 мин), (HT Over 0.5 / 18-38 мин), (0:0 на 50-68'), (Деньги ≥ 65%)
    .replace(/\s*\([^)]*(?:мин|'|секунд|\d+:\d+|≥|<=|>=|%|кэф|коридор|прогруз|счёт|тотал|падение)[^)]*\)/gi, '')
    // Убираем указания минут прямо в тексте (на 50-68', на 17-й минуте, на 70' и т.д.)
    .replace(/\s+на\s+\d+[-–]\d+['мин]*/gi, '')
    .replace(/\s+на\s+\d+[-–]?й?\s+минуте/gi, '')
    .replace(/\s+после\s+\d+[-–]?й?\s+минуты/gi, '')
    // Убираем счёт в скобках или тексте типа 0:0
    .replace(/\s+при\s+ничьей\s+0:0/gi, ' при ничьей')
    .replace(/\s+при\s+0:0/gi, '')
    .replace(/\s+при\s+0:1/gi, '')
    .replace(/\s+при\s+1:1/gi, '')
    .replace(/\s*≥\s*\d+%?/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

export const PRESET_STRATEGY_NUMBER_BY_ID: Record<string, number> = {
  'f-1': 1,
  'f-2': 2,
  'f-3': 3,
  'f-4': 4,
  'f-5': 5,
  'f-6': 6,
  'f-7': 7,
  'f-8': 8,
  'strat-2': 9,
  'strat-4': 10,
  'strat-5': 11,
  'strat-7': 12,
  'strat-8': 13,
  'strat-12': 14,
  'strat-16': 15,
  'strat-14': 16,
  'strat-deadly-combo': 17,
  'strat-corners-80': 18,
  'strat-corners-fav-losing': 19,
  'strat-over35-odds20': 20,
  'strat-draw-over5': 21,
  'strat-underdog-55-halftime': 22,
  'strat-red-card-revenge': 23,
  'strat-guest-two-quick': 24,
  'strat-draw-under25': 25,
  'strat-tb15-value': 26,
  'strat-xg-deficit-75': 27,
  'strat-smart-money-drop': 28,
  'strat-favorite-steam': 29,
  'strat-over-steam': 30,
  'strat-prematch-insider-drop': 31,
  'strat-top-fav-65': 32,
  'strat-comeback-fav-60': 33,
  'strat-corner-assault-75': 34,
  'strat-xg-dominance-11': 35,
  'strat-smart-money-steam-live': 36,
  'strat-late-assault': 37,
  'strat-corner-storm-60': 38,
  'strat-red-card-live': 39,
  'strat-yellow-cards-derby': 40,
  'strat-concrete-bus': 41,
  'strat-second-half-sieve': 42,
  'strat-xg-trap-regression': 43,
  'strat-tempo-fade-tm': 44,
  'strat-hockey-late-assault': 45,
  'strat-hockey-prematch-h2h': 46,
  'strat-basketball-4q-over': 47,
  'strat-tennis-set2-comeback': 48,
  'strat-volleyball-tight-set': 49,
  'strat-table-tennis-deciding': 50,
  'strat-51': 51,
  'strat-52': 52,
  'strat-53': 53,
  'strat-54': 54,
  'strat-synergy-goal-storm': 55,
  'strat-synergy-cards-derby': 56,
  'strat-synergy-late-corners': 57,
  'strat-synergy-smart-comeback': 58,
  'strat-poisson-xg-over25': 59,
  'strat-hockey-bos-2p-longchange': 60,
  'strat-basketball-360-3q-surge': 61,
  'strat-tennis-bos-bigserver-tb95': 62,
  'strat-photo-home-goal-17-20': 63,
  'strat-photo-ht-goal-92': 64,
  'strat-photo-match-goal-multi': 65,
  'strat-photo-goal-95-h2h': 66,
  'strat-photo-goal-98-combo': 67,
  'strat-pdf-three-matches-theory': 68,
  'strat-pdf-15-param-value-drop': 69,
  'strat-photo-all-in-one-68-75': 70,
  'strat-photo-kef2-ht-over05': 71,
  'strat-photo-kef-1h-value': 72,
};

/**
 * Возвращает отображаемое название карточки:
 * Для разработчика (isDeveloper) — полное оригинальное название алгоритма со всеми деталями.
 * Для обычных пользователей (пользователи видят только "Стратегия 1", "Стратегия 2", "Стратегия 3"...) — строго номер стратегии.
 * Для авторских карточек пользователя (!rule.isPreset) — их собственное название.
 */
export const getStrategyCardDisplayName = (
  rule: FilterRule,
  isDeveloper: boolean = false,
  allFilters?: FilterRule[],
  lang?: string
): string => {
  if (!rule) return '';
  // Пользовательские авторские фильтры сохраняют свое собственное название без принудительной нумерации
  if (!rule.isPreset) return rule.name;

  // Разработчик видит стратегию полностью со всеми формулами и метками
  if (isDeveloper) return rule.name;

  const currentLang = lang || (typeof localStorage !== 'undefined' ? localStorage.getItem('footbalmonitor_lang') : null) || 'ru';
  const prefixMap: Record<string, string> = {
    ru: 'Стратегия',
    en: 'Strategy',
    tr: 'Strateji',
    it: 'Strategia',
    zh: '策略',
  };
  const prefix = prefixMap[currentLang] || 'Стратегия';

  // 1. Быстрый и надёжный поиск по словарю официальных ID пресетов (Стратегия 1 .. 58)
  if (rule.id && PRESET_STRATEGY_NUMBER_BY_ID[rule.id] !== undefined) {
    return `${prefix} ${PRESET_STRATEGY_NUMBER_BY_ID[rule.id]}`;
  }

  // 2. Стандартные ID вида f-1, f-2 ...
  const matchF = rule.id?.match(/^f-(\d+)$/i);
  if (matchF) {
    return `${prefix} ${matchF[1]}`;
  }

  // 3. Если в названии уже есть "Стратегия N" (строго число <= 100, исключая временные метки Date.now())
  const matchPresetNum = rule.name?.match(/Стратегия\s+(\d{1,3})(?:[^\d]|$)/i);
  if (matchPresetNum) {
    const num = parseInt(matchPresetNum[1], 10);
    if (num >= 1 && num <= 100) {
      return `${prefix} ${num}`;
    }
  }

  // 4. Поиск по переданному или сохраненному списку пресетов
  if (allFilters && allFilters.length > 0) {
    const presetIndex = allFilters.filter((f) => f.isPreset).findIndex((f) => f.id === rule.id);
    if (presetIndex !== -1) {
      return `${prefix} ${presetIndex + 1}`;
    }
  }

  // 5. Поиск цифр в id (strat-12, card-22, etc.), строго число 1..100 (никогда не таймстемп)
  const matchIdNum = rule.id?.match(/(?:strat|filter|preset|card)[-_](\d{1,3})(?:[^\d]|$)/i);
  if (matchIdNum) {
    const num = parseInt(matchIdNum[1], 10);
    if (num >= 1 && num <= 100) {
      return `${prefix} ${num}`;
    }
  }

  // 6. Аккуратный возврат чистого названия пресета вместо фантомных номеров
  return cleanPresetTitle(rule.name) || rule.name;
};
