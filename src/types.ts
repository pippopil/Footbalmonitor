export type SportType = 'football' | 'hockey' | 'basketball' | 'volleyball' | 'tennis' | 'table_tennis';

export interface RecentMatchRecord {
  date: string;
  opponent: string;
  isHome: boolean;
  score: [number, number];
  totalGoals: number;
  isOver25: boolean;
  league?: string;
}

export interface MatchStats {
  possession: [number, number];
  dangerousAttacks: [number, number];
  attacks: [number, number];
  shotsOnTarget: [number, number];
  shotsOffTarget: [number, number];
  corners: [number, number];
  yellowCards: [number, number];
  redCards: [number, number];
  xg: [number, number];
}

export type MatchStatus = 'LIVE' | 'HT' | 'FT' | 'PREMATCH';

export interface Match {
  id: string;
  country: string;
  countryCode: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamCode?: string;
  awayTeamCode?: string;
  matchCode?: string;
  score: [number, number];
  minute: number;
  status: MatchStatus;
  sport?: SportType;
  source: 'Flashscore' | 'Sofascore' | 'SStats' | 'API-Football' | 'Football-Data' | 'The-Odds-API' | 'Custom-Webhook' | 'Public-Feed' | 'Fonbet' | '1xBet' | 'Live Telemetry Core' | string;
  startTime?: string;
  startsInMinutes?: number;
  prematchAnalysisConducted?: boolean;
  h2hMatches?: RecentMatchRecord[];
  team1RecentMatches?: RecentMatchRecord[];
  team2RecentMatches?: RecentMatchRecord[];
  stats: MatchStats;
  momentum: number[];
  lastEvent: string;
  odds: {
    home: number;
    draw: number;
    away: number;
    over25: number;
    over05?: number;
    over15?: number;
    under05?: number;
    under15?: number;
    btts?: number;
    over35?: number;
    over45?: number;
    under45?: number;
    over55?: number;
    under55?: number;
    under25?: number;
    handicap1?: number;
    handicap2?: number;
    itb1_25?: number;
    itb2_25?: number;
    over15_ht?: number;
  };
  initialOdds?: {
    home?: number;
    draw?: number;
    away?: number;
    over25?: number;
    under25?: number;
    btts?: number;
    over15?: number;
    under15?: number;
  };
  oddsDrop?: OddsDropData;
  marketFlows?: OddsDropData[];
  history?: {
    homeConcededLastMatch?: number;
    awayConcededLastMatch?: number;
    homeLostLastMatch?: boolean;
    awayLostLastMatch?: boolean;
    homeLast5NoZeroZero?: boolean;
    awayLast5NoZeroZero?: boolean;
    homeOver25Streak?: number;
    awayOver25Streak?: number;
    homeOver25CountLast5?: number; // Количество матчей на ТБ 2.5 из 5 последних (например 5 или 4)
    awayOver25CountLast5?: number; // Количество матчей на ТБ 2.5 из 5 последних (например 5 или 4)
    firstHalfScore?: [number, number]; // Счёт по итогам 1-го тайма (например [2, 0])
    noGoalsInSecondHalf?: boolean; // Были ли забиты голы во втором тайме
    scoreUnchangedSinceMinute?: number; // Минута, с которой счёт не менялся (например с 45-й минуты)
    prematchInsiderDropReason?: string; // Причина подозрительного предматчевого прогруза (инсайд / новости / травмы)
    predictedIpt?: number;
    hadRedCardLastMatch?: boolean;
    teamWithRedCardOdds?: number;
    homeLast6LossesMax1?: boolean;
    h2hOver15Pct?: number;
    bothScoredLast5Count?: number;
    last4LateGoalCount?: number;
    guestScoredTwoQuickFirstHalf?: boolean;
    twoQuickGoalsFirstHalf?: boolean;
    goalsAtFirstHalfQuick?: number;
    noGoalsSinceQuickGoals?: boolean;
    twoQuickGoalsMinute?: number;
    homeRecentMatchesLast6?: Array<{
      opponent: string;
      score: [number, number];
      isHome: boolean;
      result: 'W' | 'D' | 'L';
      date?: string;
      over25?: boolean;
      tournament?: string;
    }>;
    awayRecentMatchesLast6?: Array<{
      opponent: string;
      score: [number, number];
      isHome: boolean;
      result: 'W' | 'D' | 'L';
      date?: string;
      over25?: boolean;
      tournament?: string;
    }>;
    homeDrawsLast6?: number; // Количество ничьих хозяев в последних 6 матчах
    awayDrawsLast6?: number; // Количество ничьих гостей в последних 6 матчах
    h2hDrawsLast6?: number;  // Количество ничьих в личных встречах за 5-6 матчей
    h2hGoalsPerGame?: number; // Среднее количество голов за игру в очных встречах (GPG)
  };
}

export interface OddsDropData {
  market: 'HOME' | 'DRAW' | 'AWAY' | 'OVER' | 'UNDER' | 'BTTS';
  marketName: string;            // e.g. "Победа 1 (Napoli)" или "ТБ 2.5"
  initialOdds: number;           // Начальный коэффициент (на открытии линии)
  currentOdds: number;           // Текущий коэффициент
  dropPercent: number;           // Процент падения коэффициента, например 20.0%
  moneyVolumePercent: number;    // Доля прогруженных денег в процентах, например 78%
  moneyVolumeAmountEur?: number; // Абсолютный объем прогруза в евро, например 142 000 €
  bookmaker?: string;            // Биржа/букмекер, например "Betfair Exchange / Pinnacle"
  detectedAtMinute?: number;     // Минута обнаружения прогруза
}

export type LiveMatch = Match;

export type ScoreCondition =
  | 'ANY'
  | 'DRAW'
  | '0-0'
  | 'HOME_LEAD'
  | 'AWAY_LEAD'
  | 'ONE_GOAL_DIFF'
  | 'TOTAL_UNDER_2'
  | 'TOTAL_OVER_2'
  | 'TOTAL_UNDER_25'
  | 'TOTAL_UNDER_15'
  | 'BTTS_NO';

export type FilterCategory =
  | 'all'
  | 'top_stable'
  | 'active'
  | 'stopped'
  | 'goals'
  | 'corners'
  | 'pressure'
  | 'comeback'
  | 'halftime'
  | 'cards'
  | 'odds_drop'
  | 'custom';

export type BetType = 'LIVE' | 'PREMATCH';

export interface ChecklistItem {
  id: string;
  number: number;
  title: string;              // Название показателя (например, "Частота верховых матчей")
  thresholdText: string;      // Минимальный порог (например, "От 55% и выше у каждой команды")
  calculationMethod: string;  // Как посчитать / Где смотреть
  simpleExplanation: string;  // Что это значит простыми словами
  passed?: boolean;           // Пройден ли критерий для выбранного матча
  actualValue?: string | number; // Фактическое значение для матча
}

export interface FilterRule {
  id: string;
  name: string;
  description: string;
  category?: FilterCategory | string;
  ruleType?: 'LIVE' | 'PREMATCH' | 'HYBRID' | string; // Тип стратегии: Лайв или Предматчевый отбор
  sport?: SportType; // Вид спорта (football, hockey, basketball, volleyball, tennis, table_tennis)
  prematchTimingMinutes?: number; // За сколько минут до матча проводить анализ (по умолчанию 60 мин / 1 час)
  enabled: boolean;
  minMinute: number;
  maxMinute: number;
  scoreCondition: ScoreCondition | string;

  // Топовые стабильные стратегии по реальным матчам
  isTopStable?: boolean;
  stabilityRank?: number;
  verifiedPassRate?: string;

  // Точные параметры счёта и количества голов (по запросу пользователя)
  exactScore?: string;              // Например '0:0', '1:0', '1:1', '2:1'
  exactHomeGoals?: number;          // Точное количество голов Хозяев (К1) = N
  exactAwayGoals?: number;          // Точное количество голов Гостей (К2) = N
  exactTotalGoals?: number;         // Точный суммарный тотал голов = N (например ровно 2)

  // Предматчевый анализ и ежедневный сигнал (Daily Prematch Digest)
  prematchAnalysisEnabled?: boolean;
  prematchAlertDailyTime?: string;        // Время отправки ежедневного сигнала (например '10:00', '12:30')
  prematchMinOddsHome?: number;           // Коридор кэфов П1 мин
  prematchMaxOddsHome?: number;           // Коридор кэфов П1 макс
  prematchMinOddsDraw?: number;           // Коридор кэфов Х (ничья) мин
  prematchMaxOddsDraw?: number;           // Коридор кэфов Х (ничья) макс
  prematchMinOddsAway?: number;           // Коридор кэфов П2 мин
  prematchMaxOddsAway?: number;           // Коридор кэфов П2 макс
  prematchMinOddsOver25?: number;         // Коридор кэфов ТБ 2.5 мин
  prematchMaxOddsOver25?: number;         // Коридор кэфов ТБ 2.5 макс
  prematchH2hMatchesCount?: number;       // Сколько последних очных матчей учитывать (5 или 10)
  prematchH2hOver25MinHits?: number;      // В скольких из них пробит ТБ 2.5 (например >= 3 из 5)
  prematchTeamRecentMatchesCount?: number;// Сколько последних матчей команд с другими учитывать (5 или 10)
  prematchTeam1Over25MinHits?: number;    // В скольких матчах К1 пробит ТБ 2.5
  prematchTeam2Over25MinHits?: number;    // В скольких матчах К2 пробит ТБ 2.5
  prematchNotifyOnceDaily?: boolean;      // Отправлять строго 1 раз в сутки

  minDangerousAttacksDiff?: number;
  minDangerousAttacksTotal?: number;
  minAttacksDiff?: number;
  minAttacksTotal?: number;
  minTotalShots?: number;
  minShotsDiff?: number;
  minShotsOnTargetTotal?: number;
  minShotsOnTargetDiff?: number;
  minTotalCorners?: number;
  minCornersDiff?: number;
  minPossessionDiff?: number;
  minXgTotal?: number;
  minXgDiff?: number;
  minXgOverScoreDiff?: number; // Дефицит xG над счётом: (xG[0] + xG[1]) - (score[0] + score[1]) >= X (например 1.60)
  minExpectedTotalXg?: number; // Суммарный ожидаемый xG команд по модели Пуассона (например > 2.80)
  requirePoissonEvPositive?: boolean; // Требовать положительное математическое ожидание (+EV) по модели Пуассона
  minPressureIndex?: number;
  maxPressureIndex?: number; // Максимальный индекс давления (для сушки/ТМ <= 40%)
  maxDangerousAttacksTotal?: number; // Максимум суммарных оп. атак (для сушки/ТМ <= 45)
  maxShotsOnTargetTotal?: number; // Максимум ударов в створ (для сушки/ТМ <= 4)
  maxScoreDiff?: number; // Максимальная разница в счёте (исключение разгромов, <= 2 или <= 1)
  redCardCondition?: 'ANY' | 'NO_RED_CARDS' | 'HAS_RED_CARD';
  minYellowCardsTotal?: number; // Минимальный тотал жёлтых карточек в матче (например >= 3)
  maxYellowCardsTotal?: number; // Максимальный тотал жёлтых карточек

  // Коэффициенты и прематч (Стратегии 2, 8, 11, 14, 16 + новые)
  maxOddsFavorite?: number; // Кэф на фаворита <= X (например <= 1.50 или <= 1.70)
  minOddsFavorite?: number; // Равные команды: мин кэф на победу >= X (например >= 1.90)
  maxOddsOver15?: number;   // Кэф на ТБ 1.5 <= X (например <= 1.20)
  maxOddsOver25?: number;   // Кэф на ТБ 2.5 <= X (например <= 1.60 или <= 1.67)
  minOddsOver25?: number;   // Кэф на ТБ 2.5 >= X (например >= 1.50)
  maxOddsOver35?: number;   // Кэф на ТБ 3.5 <= X (например <= 2.00)
  maxOddsUnder25?: number;  // Кэф на ТМ 2.5 <= X (например <= 1.60)
  minOddsDraw?: number;     // Кэф на ничью >= X (например >= 3.70 или >= 5.00)
  maxOddsDraw?: number;     // Кэф на ничью <= X (например <= 3.00)
  minOddsUnderdog?: number; // Кэф на аутсайдера >= X (например >= 5.50)
  maxOddsUnderdog?: number; // Кэф на аутсайдера <= X (например <= 4.20)
  maxOddsBtts?: number;     // Кэф на Обе забьют <= X (например <= 1.67)
  minOddsBtts?: number;     // Кэф на Обе забьют >= X (например >= 1.50)
  minShotsOnTargetHome?: number; // Удары в створ хозяев >= X (например >= 2)
  isThreeMatchesTheory?: boolean; // Теория трёх матчей (очковая модель)
  isValueDrop15Param?: boolean;   // Анализ по 15 параметрам и падение линии БК

  // Отслеживание прогрузов и падения коэффициентов (Smart Money & Steam Moves)
  minOddsDropPercent?: number;       // Мин. падение коэффициента в % (например, >= 15%)
  minMoneyVolumePercent?: number;    // Мин. процент прогруза денег на исход (например, >= 70%)
  minMoneyLoadAmount?: number;       // Мин. сумма прогруза в EUR (например, >= 50000 €)
  oddsDropMarket?: 'ANY' | 'HOME' | 'DRAW' | 'AWAY' | 'OVER' | 'UNDER' | 'BTTS'; // Целевой исход прогруза

  // Игровой сценарий и угловые
  minTotalGoals?: number;             // Минимальный тотал голов в матче (например, >= 2 для быстрых голов)
  maxTotalGoals?: number;             // Максимальный тотал голов в матче (например, <= 2 для непробитого ТБ 2.5)
  requireBttsNotHit?: boolean;        // Обе забьют ещё не наступило (хотя бы одна команда не забила: 0:0, 1:0, 0:1, 2:0 и т.д.)
  scoreDiffExactly1?: boolean;        // Разница в счёте ровно 1 гол (1:0, 2:1, 0:1, 1:2)
  losingTeamMoreCorners?: boolean;    // Проигрывающая команда подала больше угловых (Корнер после 80')
  favoriteLosing?: boolean;           // Фаворит матча проигрывает (для угловых фаворита)
  requireGuestTwoQuickGoals1H?: boolean; // 2 быстрых гола подряд (разница <=15 мин) в 1Т
  requireTwoQuickGoals1H?: boolean;      // 2 быстрых гола в 1Т (любая команда или гости)
  requireNoGoalsSinceQuickGoals?: boolean; // Отсутствие голов после 2 быстрых голов (счёт без изменений до 75')

  maxTotalCorners?: number; // Максимальный тотал угловых в матче (для ТМ угловых или засухи <= 3)

  // Лиги и фильтры исключений (Стратегии 4, 12, 14, 51, 52, 53)
  excludeYouthAndWomen?: boolean; // Исключать молодежки U19-U23, женские лиги и низшие дивизионы
  excludeFriendlies?: boolean;    // Исключать товарищеские матчи
  excludeCups?: boolean;          // Исключать кубковые матчи
  operatingHours?: {              // Часы работы стратегии (например с 6:00 до 00:00 по МСК)
    enabled: boolean;
    startHour: number;
    endHour: number;
    timezone?: string;
  };
  leagueKeywords?: string[];      // Белый список ключевых слов лиг (например 'Premier', 'Bundesliga')

  // История матчей, серии и математические модели (Стратегии 1, 4, 5, 7, 12, 13 + новые)
  requireLastMatchConceded2Plus?: boolean; // Обе команды проиграли и пропустили >=2 в прошлом матче
  requireNoZeroZeroLast5?: boolean;        // В последних 5 матчах команд не было 0:0
  minOver25Streak?: number;                // Серия матчей на ТБ 2.5 у команд (например >= 5)
  requireOver25StreakAllowed4Of5?: boolean; // Допускается 4 из 5 матчей для одной команды (минимум 5/5 у одной и 4/5 у другой, либо 5/5 у обоих)
  minCombinedOver25CountLast5?: number;    // Суммарно ТБ 2.5 в последних 5 матчах обеих команд (>= 9 из 10: 5/5 и 4/5, или 5/5 и 5/5)
  requireScoreAtHalftimeLow?: boolean;     // Счёт в 1-м тайме / к перерыву строго 0:0, 1:0 или 0:1
  requireNoGoalsInSecondHalf?: boolean;    // Во 2-м тайме ещё не было забито ни одного гола
  minModelIpt?: number;                    // Взвешенный математический тотал IPT > X (Стратегия 7, порог 2.70)
  requireRedCardLastMatch?: boolean;       // Команда получила КК в крайнем матче (кэф на неё <= 3.20)
  requireLateGoalsLastMatches?: boolean;   // В 3 из 4 последних матчей был гол на 65-90'
  requireH2hOver15High?: boolean;          // В личных встречах >= 80% матчей на ТБ 1.5
  isDeadlyCombination?: boolean;           // «Смертельная комбинация» коэффициентов на ТБ 3.5 / 4.5
  requireOddsDropWithoutScoreChange?: boolean; // Падение кэфа без изменения счёта (например счёт 2:0 и все грузят ТБ 2.5 при неизменном счёте)
  requirePrematchSuspiciousDrop?: boolean; // Подозрительный предматчевый прогруз / инсайд (резкое падение кэфа до начала матча)
  maxDrawsInLast5or6?: number;             // Максимум ничьих у команд в последних 5-6 матчах (Стратегия 54: <= 1)
  maxH2hDrawsInLast5or6?: number;          // Максимум ничьих в личных встречах за 5-6 матчей (Стратегия 54: <= 1)

  // 10-балльные чеклисты и скоринговые системы (Чеклист на ТБ 2.5, скоринг)
  isChecklist?: boolean;               // Является ли стратегия чеклистом / скоринговой моделью
  checklistTitle?: string;             // Название чеклиста (например "10-балльный чеклист на ТБ 2.5")
  checklistItems?: ChecklistItem[];    // Пункты чеклиста с порогами и формулами
  minChecklistScore?: number;          // Минимальный порог баллов для квалификации (например 7 или 8 из 10)
  minHomeGoalsAvg?: number;            // Атака хозяев дома (от 1.50 гола за матч)
  minAwayGoalsAvg?: number;            // Атака гостей на выезде (от 1.20 гола за матч)
  minConcededAvg?: number;             // Дырявая оборона (пропускает от 1.00 гола каждый)
  minPairAvgGoals?: number;            // Средняя результативность пары (от 2.70 гола суммарно)
  minExpectedGoalsXg?: number;         // Ожидаемые голы xG суммарно (от 2.70 xG)
  minOver25Pct?: number;               // Частота верховых матчей у каждой команды (% от 55% или 6 из 10)
  minBttsPct?: number;                 // Обе забьют % у обеих сторон (от 55%)
  requireTopScorersAvailable?: boolean;// Кадровый состав: бомбардиры в строю
  requireHighMotivation?: boolean;     // Турнирная мотивация: победа нужна обоим
  requireValueOdds?: boolean;          // Перевес по кэфу (Value): кэф БК выше справедливого (от 1.75+)

  targetMarket?: string;
  defaultOdds?: number; // Базовый коэффициент входа в стратегию (>= 1.70)
  telegramEnabled: boolean;
  color: string;
  isPreset?: boolean;
  requiredPlan?: 'FREE' | 'PRO_ANALYST' | 'VIP_CLUB' | 'GOD_MODE';
  noResolutionTrack?: boolean; // Не по всем фильтрам отслеживается результат (информационные радары)
  trackOutcome?: boolean;

  // Синергии и комбинации взаимодополняющих стратегий (Combo / Ensemble)
  isSynergy?: boolean;
  synergyParentRuleIds?: string[];
  synergyWinRateGain?: string; // e.g. "+12.4% прирост проходимости"

  // Привязка бота к фильтру (пользовательский бот или кастомные реквизиты)
  botId?: string;             // ID привязанного бота из личного кабинета (например, 'bot-main', 'bot-corners')
  customBotToken?: string;    // Индивидуальный токен бота для этого конкретного фильтра
  customChatId?: string;      // Индивидуальный chat_id / @канал для этого конкретного фильтра
  userId?: string;            // ID владельца фильтра

  // Матрица параметров сканера (Обо всем понемножку)
  scannerMatrix?: ScannerMatrixConfig;
}

export type StatSideChoice = 'K1' | 'K2' | '12' | 'FAVORITE' | 'UNDERDOG';

export interface ScannerStatRow {
  side: StatSideChoice;
  operator: '>=' | '<=' | '==' | '>' | '<' | 'DIFF';
  diffThreshold?: number;
  ind1Min?: number;
  ind1Max?: number;
  ind2Min?: number;
  ind2Max?: number;
  totalMin?: number;
  totalMax?: number;
  // Dynamic time-window stats
  last5MinMin?: number;
  last10MinMin?: number;
  last15MinMin?: number;
  half1Min?: number;
  half2Min?: number;
}

export interface ScannerOddsItem {
  checked: boolean;
  min: number;
  max: number;
}

export interface HistoricalStreakConfig {
  checked: boolean;
  matchesCount: number; // e.g. 5, 6, 10
  targetSide: 'K1' | 'K2' | 'ANY' | 'FAVORITE';
  minWins?: number;
  maxLosses?: number;
  minDraws?: number;
  minGoalsScored?: number;
  maxGoalsConceded?: number;
  bothTeamsScoredHits?: number;
  over25Hits?: number;
  zeroZeroCount?: number;
}

export interface ScannerMatrixConfig {
  // Исходы
  p1: ScannerOddsItem;
  draw: ScannerOddsItem;
  p2: ScannerOddsItem;
  dc1X: ScannerOddsItem;
  dc12: ScannerOddsItem;
  dcX2: ScannerOddsItem;

  // Период и сыгранные минуты
  period: 'ALL' | '1H' | '2H';
  minuteRange: {
    checked: boolean;
    min: number;
    max: number;
  };

  // Добавленное время
  addedTime1H?: { checked: boolean; min: number; max: number };
  addedTime2H?: { checked: boolean; min: number; max: number };

  // Лиги и фильтрация турниров
  excludedLeagues?: string[];
  includedLeagueGroups?: string[]; // Championship, Cups, Friendly, Juniors, Women, Europe

  // Тоталы матча и 1-го тайма
  tb05: ScannerOddsItem;
  tb15: ScannerOddsItem;
  tb25: ScannerOddsItem;
  tm05: ScannerOddsItem;
  tm15: ScannerOddsItem;
  tm25: ScannerOddsItem;
  tb15_1h?: ScannerOddsItem;
  tm15_1h?: ScannerOddsItem;
  bttsYes?: ScannerOddsItem;
  bttsNo?: ScannerOddsItem;

  // Фаворит состояние
  favoriteCondition?: {
    enabled: boolean;
    maxOdds?: number;
    state?: 'LOSING' | 'WINNING' | 'DRAW' | 'ANY';
    location?: 'HOME' | 'AWAY' | 'ANY';
  };

  // 9 статистических строк + интенсивность
  goals: ScannerStatRow;
  attacks: ScannerStatRow;
  dangerousAttacks: ScannerStatRow;
  possession: ScannerStatRow;
  shotsOnTarget: ScannerStatRow;
  shotsOffTarget: ScannerStatRow;
  corners: ScannerStatRow;
  yellowCards: ScannerStatRow;
  redCards: ScannerStatRow;

  // Интенсивность за последние 10 мин и за матч
  intensity10m?: ScannerStatRow;
  intensityMatch?: ScannerStatRow;

  // Исторические серии последних N матчей (H2H, Форма, Тоталы)
  historyForm?: HistoricalStreakConfig;
  historyGoals?: HistoricalStreakConfig;
  historyTotals?: HistoricalStreakConfig;

  // Расширенная xG динамика и ожидаемые голы
  xgTotal?: ScannerStatRow;
  xgDiff?: ScannerStatRow;
  xgDeficit?: ScannerStatRow; // xG - Голы
  xgMomentum15m?: ScannerStatRow; // xG темп за последние 15 минут
}

export type SignalOutcome = 'WIN' | 'LOSS' | 'PENDING' | 'REFUND';

export type StrategyMetricCategory = 'corners' | 'cards' | 'goals' | 'basketball' | 'other';

export interface StrategyMetricSnapshot {
  category: StrategyMetricCategory;
  label: string;
  icon: string;
  initialValueText: string;
  initialTotal: number;
  initialBreakdown?: string;
  finalValueText?: string;
  finalTotal?: number;
  finalBreakdown?: string;
  delta?: number;
  deltaText?: string;
}

export interface SignalAlert {
  id: string;
  timestamp: string;
  matchId: string;
  matchName: string;
  league: string;
  country: string;
  sport?: SportType;
  minute: number;
  score: string;
  period?: string; // 1-й тайм, 2-й тайм, Перерыв
  statsSnapshot?: {
    homeScore: number;
    awayScore: number;
    attacks: [number, number];
    dangerousAttacks: [number, number];
    shotsOnTarget: [number, number];
    shotsOffTarget: [number, number];
    corners: [number, number];
    yellowCards: [number, number];
    redCards: [number, number];
    possession?: [number, number];
  };
  finalStats?: {
    homeScore?: number;
    awayScore?: number;
    attacks?: [number, number];
    dangerousAttacks?: [number, number];
    shotsOnTarget?: [number, number];
    shotsOffTarget?: [number, number];
    corners?: [number, number];
    yellowCards?: [number, number];
    redCards?: [number, number];
    possession?: [number, number];
  };
  strategyMetricSnapshot?: StrategyMetricSnapshot;
  ruleId?: string;
  ruleName: string;
  ruleCategory?: string;
  message: string;
  sentToTelegram: boolean;
  telegramStatusText?: string;
  telegramMessageId?: number;
  marketSuggestion?: string;
  noResolutionTrack?: boolean;
  trackOutcome?: boolean;
  // Информация о боте, отправившем сигнал
  botId?: string;
  botName?: string;
  botToken?: string;
  chatId?: string;
  userId?: string;
  // Live vs Pre-match bet separation
  betType?: BetType;
  prematchFactors?: string[];
  liveFactors?: string[];
  // Tracker & ROI fields
  outcome: SignalOutcome;
  odds: number;
  stake: number;
  profit?: number;
  finalScore?: string;
  initialScore?: string;
  resolvedAt?: string;
  resolutionNote?: string;
  // Super-Combo & Synergy properties (Same-event multi-strategy alignment)
  isCombo?: boolean;
  comboCount?: number;
  comboStrategyNames?: string[];
  comboRuleIds?: string[];
  comboRecommendation?: string;
  comboConfidence?: number;
  comboTargetCluster?: string;
  comboClusterName?: string;
  // Clear TB / TM action
  targetAction?: 'TB' | 'TM' | 'OTHER';
  targetLine?: string;
  telegramEdited?: boolean;
  telegramEditedAt?: string;
}

export interface StrategyExecutionAuditLog {
  id: string;
  signalId: string;
  strategyId: string;
  strategyNumber?: number;
  strategyName: string;
  strategyCategory: string;
  matchId: string;
  matchName: string;
  league: string;
  country: string;
  sport: SportType;
  targetMarket?: string;
  odds: number;
  status: 'TRIGGERED' | 'RESOLVED';
  outcome: SignalOutcome;
  triggeredAt: string;
  resolvedAt?: string;

  // В момент поступления сигнала
  initialMinute: number;
  initialScore: string;
  initialGoals: { home: number; away: number; total: number };
  initialCorners: { home: number; away: number; total: number };
  initialYellowCards: { home: number; away: number; total: number };
  initialRedCards: { home: number; away: number; total: number };

  // По завершению матча
  finalMinute?: number;
  finalScore?: string;
  finalGoals?: { home: number; away: number; total: number };
  finalCorners?: { home: number; away: number; total: number };
  finalYellowCards?: { home: number; away: number; total: number };
  finalRedCards?: { home: number; away: number; total: number };

  // Динамика (прирост от момента сигнала до свистка)
  deltaGoals: number;
  deltaCorners: number;
  deltaYellowCards: number;
  deltaRedCards: number;

  metricSummary?: string;
  resolutionNote?: string;
  profit?: number;
}

export type DeduplicationMode = 'once-per-match' | 'cooldown' | 'score-change' | 'disabled';

export interface TelegramBotProfile {
  id: string;
  name: string;                // Название: например, "⚽ Основной канал (Live)", "🚩 Бот Угловых"
  botToken: string;           // HTTP API Token от @BotFather
  channelId: string;          // Chat ID или @username канала
  isDefault?: boolean;        // Бот по умолчанию для всех новых правил
  active: boolean;            // Включен / выключен
  botUsername?: string;       // @Username бота после проверки
  status?: 'verified' | 'error' | 'untested';
  lastPing?: string;
  createdAt: string;
}

export type UserPlan = 'FREE' | 'PRO_ANALYST' | 'VIP_CLUB' | 'GOD_MODE';

export interface UserSubscriptionDetails {
  plan: UserPlan;
  isTrial: boolean;
  trialStartedAt?: string;
  trialExpiresAt?: string;
  startedAt: string;
  expiresAt: string;
  daysRemaining: number;
  paymentMethod: 'SBP' | 'TPAY' | 'SBERPAY' | 'CRYPTO_USDT' | 'CRYPTO_TON' | 'STRIPE' | 'TRIAL' | 'FREE';
  amountPaidRub: number;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'TRIAL_ACTIVE';
  notified3DaysLeft?: boolean;
  deviceFingerprint?: string;
}

export interface UserProfile {
  id: string;
  name?: string;
  username: string;
  displayName: string;
  email: string;
  passwordHash?: string;
  avatarUrl?: string;
  role: 'user' | 'pro' | 'admin' | 'vip' | 'god';
  plan: UserPlan;
  planExpiresAt?: string;
  subscriptionDetails?: UserSubscriptionDetails;
  deviceFingerprint?: string;
  registeredAt: string;
  balanceRub: number;
  telegramBots: TelegramBotProfile[];
  notificationSound: boolean;
  theme?: 'dark' | 'light' | 'system';
  adPreferences: {
    showBanners: boolean;
    compactAds: boolean;
  };
  stats: {
    totalSignalsGenerated: number;
    winRate: number;
    favoriteLeague?: string;
    signalsToday: number;
  };
  preferredDataSources?: DataSourceType[];
  defaultDataSource?: DataSourceType;
}

export interface AdBannerItem {
  id: string;
  title: string;
  badge: string;
  description: string;
  bonusText?: string;
  promoCode?: string;
  ctaText: string;
  ctaUrl: string;
  bannerType: 'top_ribbon' | 'top_billboard' | 'in_feed' | 'sidebar' | 'skyscraper_left' | 'skyscraper_right' | 'skyscraper';
  partnerName: string;
  bgGradient: string;
  active: boolean;
  features?: string[];
  side?: 'left' | 'right';
  impressions?: number;
  clicks?: number;
  conversions?: number;
  spentRub?: number;
  cpcRub?: number;
  dailyBudgetRub?: number;
  status?: 'ACTIVE' | 'PAUSED' | 'MODERATION';
}

export interface SiteAnalyticsData {
  totalVisits: number;
  uniqueVisitors: number;
  pageViews: number;
  todayVisits: number;
  todayUniques: number;
  onlineNow: number;
  avgTimeOnSiteSec: number;
  bounceRate: number;
  yandexMetrikaCounterId: string;
  isYandexMetrikaConnected: boolean;
  historyDays: Array<{
    date: string;
    visits: number;
    uniques: number;
    pageViews: number;
  }>;
  sourcesBreakdown: Array<{
    source: string;
    percentage: number;
    visits: number;
  }>;
  devicesBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
}

export interface AdvertiserCampaign {
  id: string;
  name: string;
  advertiserName: string;
  contactEmail: string;
  telegramContact?: string;
  adSlot: 'top_billboard' | 'skyscraper_left' | 'skyscraper_right' | 'in_feed' | 'sidebar';
  targetUrl: string;
  title: string;
  promoCode?: string;
  bonusText?: string;
  status: 'ACTIVE' | 'PAUSED' | 'MODERATION' | 'DRAFT';
  impressions: number;
  clicks: number;
  ctr: number;
  spentRub: number;
  budgetRub: number;
  startDate: string;
  endDate?: string;
}

export interface TelegramConfig {
  botToken: string;
  channelId: string;
  notificationsCount: number;
  lastPing: string;
  autoSend: boolean;
  silentMode: boolean;
  parseMode: 'HTML' | 'Markdown';
  suppressDuplicates: boolean;
  deduplicationMode: DeduplicationMode;
  cooldownMinutes: number;
  blockedDuplicatesCount?: number;
  autoUpdateOnFinish?: boolean;
}

export interface PressureAnalysis {
  pressureIndex: number; // 0 - 100
  dominantSide: 'home' | 'away' | 'balanced';
  dominantTeamName: string;
  dominantDiff: number;
  goalProbability: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  goalProbabilityScore: number; // 0 - 100%
  attacksPerMinute: number;
  reasons: string[];
}

export interface HistoricalSnapshot {
  minute: number;
  score: [number, number];
  stats: MatchStats;
  odds?: { home: number; draw: number; away: number; over25: number; under25?: number; btts?: number };
  oddsDrop?: OddsDropData;
  marketFlows?: OddsDropData[];
}

export interface HistoricalMatch {
  id: string;
  sport?: SportType;
  date: string;
  league: string;
  country: string;
  countryCode: string;
  homeTeam: string;
  awayTeam: string;
  finalScore: [number, number];
  finalCorners: [number, number];
  finalYellowCards: [number, number];
  finalRedCards: [number, number];
  snapshots: HistoricalSnapshot[];
  history?: Match['history'];
}

export interface BacktestSignal {
  id: string;
  matchId: string;
  matchName: string;
  league: string;
  date: string;
  minute: number;
  scoreAtSignal: [number, number];
  finalScore: [number, number];
  finalCorners: [number, number];
  ruleId: string;
  ruleName: string;
  targetMarket: string;
  odds: number;
  outcome: SignalOutcome;
  profit: number; // in units (e.g. +0.85 or -1.0)
  reason: string;
  statsAtSignal: MatchStats;
}

export interface LeagueStats {
  league: string;
  country: string;
  totalSignals: number;
  wins: number;
  losses: number;
  refunds: number;
  winRate: number; // 0 - 100%
  profit: number; // in units
  roi: number; // in %
  avgOdds: number;
}

export interface BacktestResult {
  ruleId: string;
  ruleName: string;
  targetMarket: string;
  totalMatchesScanned: number;
  totalSignals: number;
  wins: number;
  losses: number;
  refunds: number;
  winRate: number; // 0 - 100%
  totalProfit: number; // in units
  roi: number; // in %
  avgOdds: number;
  maxDrawdown: number;
  profitFactor: number;
  signals: BacktestSignal[];
  leagueStats?: LeagueStats[];
  equityCurve: Array<{
    step: number;
    profit: number;
    cumulativeProfit: number;
    matchName: string;
    outcome: SignalOutcome;
  }>;
}

export interface AIMatchAnalysis {
  matchId: string;
  generatedAt: string;
  headline: string;
  summary: string;
  momentum: {
    dominantSide: 'home' | 'away' | 'balanced';
    dominantTeam: string;
    pressureDescription: string;
    intensityLevel: 'CALM' | 'ACTIVE' | 'HIGH_PRESSURE' | 'SIEGE';
  };
  probabilities: {
    nextGoalHome: number;
    nextGoalAway: number;
    noMoreGoals: number;
    expectedTotalGoals: string;
  };
  recommendations: Array<{
    market: string;
    oddsEstimate: number;
    confidence: 'LOW' | 'MEDIUM' | 'HIGH';
    reasoning: string;
    edge: string;
  }>;
  keyRisks: string[];
  tacticalNote: string;
  telegramFormattedText: string;
  source: 'gemini' | 'gemini-lite' | 'heuristic';
  tokenStats?: {
    estimatedTokens: number;
    tokensSaved: number;
    fromCache: boolean;
    mode: 'eco' | 'standard' | 'local';
  };
}

export type DataSourceType =
  | 'flashscore'
  | 'fonbet'
  | '1xbet'
  | 'sstats'
  | 'sofascore'
  | 'the-odds-api'
  | 'webhook'
  | 'public-feed'
  | 'api-football'
  | 'football-data'
  | 'simulated';

export interface DataSourceConfig {
  activeSource: DataSourceType;
  flashscore: {
    enabled: boolean;
    includeOdds: boolean;
    maxMatches: number;
    mirror?: string;
  };
  fonbet?: {
    enabled: boolean;
    includeOdds: boolean;
    autoFailover: boolean;
  };
  '1xbet'?: {
    enabled: boolean;
    includeOdds: boolean;
    autoFailover: boolean;
  };
  sstats: {
    enabled: boolean;
    apiKey?: string;
  };
  sofascore: {
    enabled: boolean;
    useProxy: boolean;
    browserRelayEnabled?: boolean; // Прямой опрос Sofascore из браузера клиента (без VPN и без блокировок Cloudflare)
  };
  theOddsApi: {
    enabled: boolean;
    apiKey: string;
    sport: string; // 'upcoming' or specific league like 'soccer_epl'
    regions: string; // 'eu', 'uk', 'us'
    markets: string; // 'h2h,totals'
    remainingRequests?: number;
  };
  apiFootball: {
    enabled: boolean;
    apiKey: string;
    provider: 'api-sports' | 'rapidapi';
    leaguesFilter: string; // comma-separated league IDs e.g. "39,140,135,78,61"
  };
  footballData: {
    enabled: boolean;
    apiToken: string;
    plan: 'free' | 'tier1';
  };
  webhook: {
    enabled: boolean;
    secretKey: string;
    lastIngestedAt?: string;
    ingestedCount: number;
  };
  publicFeed: {
    enabled: boolean;
  };
  autoRefresh: boolean;
  refreshIntervalSeconds: number;
  autoFailover?: boolean; // Автоматическое переключение на резервный источник при отказе
  preferredFallback?: DataSourceType;
}

export interface DataSourceHealthItem {
  id: DataSourceType;
  name: string;
  status: 'online' | 'blocked' | 'error' | 'no_games' | 'requires_auth';
  latencyMs?: number;
  matchesCount: number;
  message?: string;
  error?: string;
  isFallbackCandidate: boolean;
}

export interface DataSourceHealthReport {
  ok: boolean;
  timestamp: string;
  activeSource: DataSourceType;
  fallbackActive: boolean;
  actualSource?: DataSourceType;
  sources: DataSourceHealthItem[];
  recommendedSource: DataSourceType;
}

export interface DataSourceStatus {
  source: DataSourceType;
  configured: boolean;
  status: 'connected' | 'error' | 'idle' | 'testing';
  lastSync?: string;
  matchesCount: number;
  latencyMs?: number;
  quotaInfo?: string;
  message?: string;
  error?: string;
}

// -------------------------------------------------------------
// Strategy Marketplace
// -------------------------------------------------------------
export interface StrategyMarketplaceItem {
  id: string;
  title: string;
  author: string;
  authorBadge: 'PRO' | 'VERIFIED' | 'COMMUNITY' | 'ELITE';
  rating: number; // 4.5 - 5.0
  reviewsCount: number;
  downloadsCount: number;
  winRate: number; // e.g. 78.4
  roi: number; // e.g. +24.6%
  totalSignals: number;
  avgOdds: number;
  description: string;
  tags: string[];
  sport: 'football' | 'hockey' | 'basketball' | 'tennis' | 'all';
  filterTemplate: FilterRule;
  verifiedAt: string;
  isOfficial?: boolean;
  priceType?: 'free' | 'paid';
  priceRub?: number;
  sellerTelegram?: string;
}

// -------------------------------------------------------------
// Virtual Bankroll & Bet Tracker
// -------------------------------------------------------------
export type BetOutcome = 'WIN' | 'LOSS' | 'VOID' | 'PENDING';

export interface VirtualBetRecord {
  id: string;
  timestamp: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  filterName: string;
  market: string; // e.g. "ТБ 1.5", "ИТБ1 (1.0)", "П1", "Угловые ТБ 9.5"
  odds: number;
  stake: number;
  outcome: BetOutcome;
  profit: number; // stake * (odds - 1) if WIN, -stake if LOSS, 0 if VOID
  closingScore?: [number, number];
  note?: string;
}

export interface BankrollSettings {
  initialBank: number;
  currentBank: number;
  currency: 'RUB' | 'USD' | 'EUR' | 'USDT';
  betStrategy: 'FLAT_AMOUNT' | 'FLAT_PERCENT' | 'KELLY';
  flatAmount: number;
  flatPercent: number; // e.g. 2%
}

// -------------------------------------------------------------
// Odds Movement & Dropping Odds Radar
// -------------------------------------------------------------
export interface OddsAnomalyItem {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  minute: number;
  score: [number, number];
  market: string; // e.g. "П1", "ТБ 2.5", "Обе забьют"
  openingOdds: number;
  currentOdds: number;
  dropPercentage: number; // e.g. -24.5%
  pressureScore: number; // Index of attacks / momentum
  anomalyType: 'DROPPING_ODDS' | 'SMART_MONEY' | 'VALUE_DIVERGENCE';
  explanation: string;
  detectedAt: string;
}

// -------------------------------------------------------------
// Referral Program
// -------------------------------------------------------------
// -------------------------------------------------------------
export interface AgentLogEntry {
  id: string;
  timestamp: string;
  elapsedMs: number;
  level: 'info' | 'success' | 'warn' | 'debug';
  category: 'AUTH' | 'TELEMETRY' | 'FILTER' | 'SANDBOX' | 'TELEGRAM' | 'AUDIO' | 'AUDIT';
  message: string;
  meta?: any;
}

export interface AgentSimulationStep {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'success' | 'warning' | 'failed';
  durationMs: number;
  details: string;
  metric?: string;
}

export interface AgentSimulationResult {
  overallStatus: 'SUCCESS' | 'WARNING' | 'FAILED';
  healthScore: number; // 0 - 100%
  completedAt: string;
  totalDurationMs: number;
  steps: AgentSimulationStep[];
  logs: AgentLogEntry[];
  testedMatchesCount: number;
  testedFiltersCount: number;
  signalsGeneratedInSandbox: number;
  zeroImpactVerified: boolean;
  summary: string;
}

