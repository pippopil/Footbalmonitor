// src/i18n/translations.ts
// Complete Multilingual Dictionaries for SportSignal AI (RU, EN, TR, IT, ZH)

export type Language = 'ru' | 'en' | 'tr' | 'it' | 'zh';

export interface Translations {
  // Navigation & Tabs
  navLiveMatches: string;
  navStrategies: string;
  navBacktest: string;
  navPrematch: string;
  navGuide: string;
  navMatrix: string;
  navCabinet: string;
  navDataSources: string;
  navSettings: string;
  navSignals: string;
  navEducation: string;
  navProofOfWin: string;
  navLeaderboard: string;
  navAiAnalyst: string;
  navAiSynthesizer: string;
  navMarketplace: string;
  navBankroll: string;
  navOddsRadar: string;
  navMomentumRadar: string;
  navVoiceAlerts: string;
  newFilter: string;

  // Header & Controls
  monitoringActive: string;
  monitoringPaused: string;
  sendDailyReport: string;
  dailyReportSent: string;
  telegramBot: string;
  searchPlaceholder: string;
  searchFiltersPlaceholder: string;
  matchIdLabel: string;
  teamCodeLabel: string;
  matchIdCopied: string;
  refreshMatches: string;
  activeProvider: string;
  liveMatchesCount: string;
  filtersCount: string;
  tgChannel: string;
  webPushActive: string;
  webPushInactive: string;
  soundActive: string;
  soundInactive: string;
  voiceActive: string;
  voiceInactive: string;
  favoritesFilter: string;
  downloadApkBtn: string;

  // Sports
  sportAll: string;
  sportFootball: string;
  sportHockey: string;
  sportBasketball: string;
  sportTennis: string;
  sportVolleyball: string;
  sportTableTennis: string;
  allSportsMonitored: string;

  // Top Stable Strategies & Proof of Win
  topStableFilter: string;
  topStableBadge: string;
  topStableRunAll: string;
  topStableTitle: string;
  topStableDesc: string;
  top3AlgorithmsTitle: string;
  verifiedWinrate7d: string;
  noviceSafeTop3Btn: string;
  proofOfWinCheckerBtn: string;
  shareCardBtn: string;
  marketLabel: string;
  streakLabel: string;

  // Strategy Categories & Status
  catAll: string;
  catTopStable: string;
  catActive: string;
  catStopped: string;
  catGoals: string;
  catCorners: string;
  catComeback: string;
  catHalftime: string;
  catPressure: string;
  catOddsDrop: string;
  catCards: string;
  catCustom: string;

  // Strategy Card Actions & Labels
  btnStart: string;
  btnRunning: string;
  btnEdit: string;
  btnDelete: string;
  btnBacktest: string;
  btnAiAnalyze: string;
  btnNewStrategy: string;
  btnStopAll: string;
  btnOnlyRunning: string;
  expectedForecast: string;
  embeddedPlatformAlgorithm: string;
  passRateLabel: string;
  statusRunning: string;
  statusStart: string;
  test1000Btn: string;
  tuneBtn: string;
  paramsProtected: string;
  duplicateBtn: string;
  deleteBtn: string;
  telegramLabel: string;
  botLabel: string;

  // Match Status & Stats
  statusLive: string;
  statusHalftime: string;
  statusFinished: string;
  minute: string;
  dangerousAttacks: string;
  shotsOnTarget: string;
  corners: string;
  cards: string;
  possession: string;
  pressureIndex: string;

  // Innovation 1: Momentum Radar
  momentumRadarTitle: string;
  momentumRadarDesc: string;
  goalProbability10m: string;
  fairOddsEdge: string;
  momentumPressureIndex: string;
  matchMomentumWave: string;

  // Daily Telegram Report
  reportTitle: string;
  reportSignalsTotal: string;
  reportPassed: string;
  reportFailed: string;
  reportRefund: string;
  reportWinRate: string;
  reportProfit: string;
  reportRoi: string;
  reportTopStrategies: string;
  reportOnDemandSuccess: string;
  reportCardTitle: string;
  reportCardDesc: string;
  reportCardAutoSchedule: string;
  reportCardSendNow: string;

  // Match Cards & Feed Keys
  trackedMatchBanner: string;
  inPersonalTracking: string;
  favoritesBadge: string;
  triggeredFilterTitle: string;
  triggeredFiltersTitle: string;
  topOfList: string;
  prematchAnalysis1h: string;
  prematchStartsIn: string;
  matchStart: string;
  favoriteTrack: string;
  inFavorites: string;
  matchAiAnalyst: string;
  matchFilter: string;
  createFilterFromMatch: string;
  goalImminent: string;
  highPressure: string;
  mediumTempo: string;
  calmTempo: string;
  quickDangAttacks: string;
  quickShots: string;
  quickCorners: string;
  triggeredFiltersOnMatch: string;
  oddsDropLabel: string;
  showAllMatches: string;
  noTrackedMatches: string;
  noMatchesSearch: string;
  backToMatches: string;
  lastKeyEvent: string;
  pressureAnalysisTitle: string;
  pressureGoalProbability: string;
  stormIndex: string;

  // Strategy Cards & Details Keys
  waitingLiveCriteria: string;
  statusActiveBadge: string;
  userStoppedStatus: string;
  readyForSignalStatus: string;
  signalsDisabledStatus: string;
  triggeredInLiveMatches: string;
  triggeredSignalsHistory: string;
  triggeredJustNow: string;
  liveSignalBadge: string;
  customBot: string;
  defaultBot: string;
  switchOn: string;
  switchOff: string;
  allStrategiesBtn: string;
  noFiltersInCategory: string;
  devFormulaOpen: string;
  statMinutes: string;
  statScore: string;
  statShotsDiff: string;
  statDangAttacksDiff: string;
  statTotalShots: string;
  statShotsOnTarget: string;
  statTotalCorners: string;
  statPressure: string;
  statXgTotal: string;
  statXgAdvantage: string;
  statAttacksDiff: string;
  statOddsFavorite: string;
  statOddsDrop: string;
  statMoneyVolume: string;
  statMoneyAmount: string;
  statTargetOutcome: string;
  statOddsOver25: string;
  statOddsBtts: string;
  statModelIpt: string;
  statMaxTotal: string;
  statLeagues: string;
  statStreakOver25: string;
  statSquads: string;
  statRedCard: string;
  statPattern: string;
  statSignal75: string;
  scoreAnyDraw: string;
  scoreHomeLead: string;
  scoreAwayLead: string;
  scoreOneGoalDiff: string;
  scoreUnder25: string;
  scoreUnder2: string;
  scoreOver2: string;
  scoreAny: string;
  squadsStrict11v11: string;
  squadsMustHaveRedCard: string;
  leaguesExcludeYouthWomen: string;
  vipBuiltin: string;
  exactScoreLabel: string;
  exactGoalsLabel: string;
  // Quick Filters
  qfAll: string;
  qfLive: string;
  qfPrematch: string;
  qfOver25: string;
  qfOddsDrop: string;
  qfCorners: string;
  qfPressure: string;

  // Match Periods
  period1stHalf: string;
  periodHalftime: string;
  period2ndHalf: string;
  periodPrematch: string;
  periodFinished: string;

  // Scanner Table & Controls
  scannerStartBtn: string;
  scannerStopBtn: string;
  scannerClearBtn: string;
  scannerSignalsCount: string;
  scannerAllSports: string;
  scannerPeriodAll: string;
  scannerPeriod1H: string;
  scannerPeriod2H: string;
  scannerPeriodHT: string;
  colFilter: string;
  colCountry: string;
  colLeague: string;
  colPeriod: string;
  colTime: string;
  colHome: string;
  colAway: string;
  colAttacks: string;
  colDangAttacks: string;
  colShots: string;
  colCorners: string;
  colCards: string;
  colOutcome: string;
  colStrategyMetricResult: string;
  colBetStatus: string;
  colTelegram: string;
  colLoggedAt: string;
  colActions: string;
  noSignalsRecorded: string;
  scannerPromptActive: string;
  scannerPromptStopped: string;

  // Update Center & Modals
  updateCenterTitle: string;
  updateCenterDesc: string;
  currentVersionLabel: string;
  latestReleaseLabel: string;
  versionInstalledDesc: string;
  versionOnServerDesc: string;
  checkingUpdatesText: string;
  updateAvailableBanner: string;
  updateReadyInstallDesc: string;
  appUpToDateBanner: string;
  btnDownloadApkDirect: string;
  btnOtaSyncLive: string;

  // Feed & Priority
  feedActiveSource: string;
  feedChangeBtn: string;
  clearSearchTooltip: string;
  refreshMatchesTooltip: string;
  soundOnTooltip: string;
  soundOffTooltip: string;
  priorityMatchesTop: string;
  topOfListBadge: string;
  shareSignalTooltip: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  ru: {
    navLiveMatches: 'Лайв Матчи',
    navStrategies: 'Стратегии и фильтры',
    navBacktest: 'Бэктест лаборатория',
    navPrematch: 'Прематч дайджест',
    navGuide: 'Гид новичка',
    navMatrix: 'Матрица фильтров',
    navCabinet: 'Личный кабинет',
    navDataSources: 'Источники данных',
    navSettings: 'Настройки',
    navSignals: 'Сигналы сканера',
    navEducation: 'Обучение',
    navProofOfWin: 'Proof-of-Win',
    navLeaderboard: 'Рейтинг авторов',
    navAiAnalyst: 'AI-Аналитик',
    navAiSynthesizer: 'ИИ-Синтезатор',
    navMarketplace: 'Маркетплейс',
    navBankroll: 'Банкролл-трекер',
    navOddsRadar: 'Радар кэфов',
    navMomentumRadar: 'Радар доминации',
    navVoiceAlerts: 'Голосовой диктор',
    newFilter: 'Новый фильтр',

    monitoringActive: 'Мониторинг активен',
    monitoringPaused: 'На паузе',
    sendDailyReport: 'Суточный отчёт',
    dailyReportSent: 'Отчёт отправлен в Telegram!',
    telegramBot: 'Телеграм Бот',
    searchPlaceholder: 'Поиск по команде, лиге, ID матча (#m-1) или коду (ARS, CHE)...',
    searchFiltersPlaceholder: 'Поиск по фильтрам и рынкам...',
    matchIdLabel: 'ID матча',
    teamCodeLabel: 'Код команды',
    matchIdCopied: 'ID матча скопирован!',
    refreshMatches: 'Обновить live',
    activeProvider: 'Провайдер линии',
    liveMatchesCount: 'Матчей в live',
    filtersCount: 'Активных стратегий',
    tgChannel: 'Канал сигналов',
    webPushActive: 'Push: ВКЛ',
    webPushInactive: 'Web Push',
    soundActive: 'Звук: ВКЛ',
    soundInactive: 'Звук: ВЫКЛ',
    voiceActive: 'Голос: ВКЛ',
    voiceInactive: 'Голос: ВЫКЛ',
    favoritesFilter: 'Избранное',
    downloadApkBtn: 'Скачать APK',

    sportAll: 'Все виды спорта',
    sportFootball: 'Футбол',
    sportHockey: 'Хоккей',
    sportBasketball: 'Баскетбол',
    sportTennis: 'Теннис',
    sportVolleyball: 'Волейбол',
    sportTableTennis: 'Настольный теннис',
    allSportsMonitored: 'Все спортивные потоки синхронизированы',

    topStableFilter: 'ТОП-3 Стабильных (98%+)',
    topStableBadge: 'УЛЬТРА-СТАБИЛЬНЫЙ',
    topStableRunAll: 'Запустить все ТОП-3',
    topStableTitle: 'Топ-3 Ультра-стабильных алгоритма',
    topStableDesc: 'Алгоритмы с подтвержденной проходимостью от 80% до 100% на дистанции реальных матчей.',
    top3AlgorithmsTitle: 'Топ-3 Ультра-стабильных алгоритма недели',
    verifiedWinrate7d: 'Проходимость за 7 дней подтверждена',
    noviceSafeTop3Btn: 'Топ-3 Безопасных',
    proofOfWinCheckerBtn: 'Proof-of-Win аудит',
    shareCardBtn: 'Поделиться',
    marketLabel: 'Целевой исход',
    streakLabel: 'Серия побед',

    catAll: 'Все стратегии',
    catTopStable: 'Топ стабильные (80%+)',
    catActive: 'В работе',
    catStopped: 'Остановлены',
    catGoals: 'Голы (ТБ/ТМ)',
    catCorners: 'Угловые',
    catComeback: 'Камбеки и фавориты',
    catHalftime: '1-й Тайм (HT)',
    catPressure: 'Штурм и прессинг',
    catOddsDrop: 'Падение кэфов и прогрузы',
    catCards: 'ЖК и удаления',
    catCustom: 'Пользовательские',

    btnStart: 'Запустить',
    btnRunning: 'В работе',
    btnEdit: 'Настроить',
    btnDelete: 'Удалить',
    btnBacktest: 'Тест 1000 матчей',
    btnAiAnalyze: 'AI Разбор',
    btnNewStrategy: 'Создать стратегию',
    btnStopAll: 'Остановить все',
    btnOnlyRunning: 'Только активные',
    expectedForecast: 'Какой прогноз ожидается',
    embeddedPlatformAlgorithm: 'Вшитый алгоритм платформы',
    passRateLabel: 'Проход:',
    statusRunning: 'В работе',
    statusStart: 'Запустить',
    test1000Btn: 'Тест 1000',
    tuneBtn: 'Настроить',
    paramsProtected: 'Параметры защищены',
    duplicateBtn: 'Копировать',
    deleteBtn: 'Удалить',
    telegramLabel: 'Telegram:',
    botLabel: 'Бот:',

    statusLive: 'Лайв',
    statusHalftime: 'Перерыв',
    statusFinished: 'Завершен',
    minute: 'мин',
    dangerousAttacks: 'Опасные атаки',
    shotsOnTarget: 'Удары в створ',
    corners: 'Угловые',
    cards: 'Карточки',
    possession: 'Владение мячом',
    pressureIndex: 'Индекс давления',

    momentumRadarTitle: 'AI Радар Доминации и Оценка Гола',
    momentumRadarDesc: 'Динамическая xG-волна давления и расчет вероятности гола в ближайшие 10 минут',
    goalProbability10m: 'Гол в след. 10 минут',
    fairOddsEdge: 'Перевес над линией (+EV)',
    momentumPressureIndex: 'Доминация команд',
    matchMomentumWave: '15-минутная волна атак',

    reportTitle: 'Суточный отчёт по сигналам',
    reportSignalsTotal: 'Всего сигналов за сутки',
    reportPassed: 'Успешных (WIN)',
    reportFailed: 'Не зашедших (LOSS)',
    reportRefund: 'Возвратов (PUSH)',
    reportWinRate: 'Проходимость (Винрейт)',
    reportProfit: 'Чистый профит (флетов)',
    reportRoi: 'ROI от оборота',
    reportTopStrategies: 'Топ стратегий за сутки',
    reportOnDemandSuccess: 'Суточный отчёт успешно сформирован и отправлен в Telegram!',
    reportCardTitle: 'Суточный отчёт эффективности',
    reportCardDesc: 'Полная сводка проходимости, ROI и винрейта всех сработавших стратегий за последние 24 часа с отправкой в ваш Telegram-канал.',
    reportCardAutoSchedule: '⏰ Автоматическая рассылка: каждый день в 23:59',
    reportCardSendNow: 'Отправить суточный отчёт в Telegram сейчас',

    trackedMatchBanner: '⭐ Матч на персональном отслеживании',
    inPersonalTracking: 'Избранное',
    favoritesBadge: 'Избранное',
    triggeredFilterTitle: 'Сработал фильтр:',
    triggeredFiltersTitle: 'Сработало фильтров ({n}):',
    topOfList: 'Вверху списка ⬆',
    prematchAnalysis1h: 'Анализ за 1 час до матча',
    prematchStartsIn: 'До начала {min} мин',
    matchStart: 'Старт {time}',
    favoriteTrack: 'Следить',
    inFavorites: 'В избранном',
    matchAiAnalyst: 'AI-Аналитик',
    matchFilter: 'Фильтр',
    createFilterFromMatch: 'Фильтр по матчу',
    goalImminent: 'Гол назревает',
    highPressure: 'Высокое давл.',
    mediumTempo: 'Средний темп',
    calmTempo: 'Спокойно',
    quickDangAttacks: 'Оп. атаки:',
    quickShots: 'Удары:',
    quickCorners: 'Углы:',
    triggeredFiltersOnMatch: 'Сработали ({n}):',
    oddsDropLabel: 'Прогруз:',
    showAllMatches: 'Показать все матчи',
    noTrackedMatches: 'Нет выбранных матчей на отслеживании',
    noMatchesSearch: 'Нет активных матчей по вашему поисковому запросу',
    backToMatches: '← К списку матчей',
    lastKeyEvent: 'Последнее ключевое событие',
    pressureAnalysisTitle: 'Алгоритмический анализ давления и вероятность гола',
    pressureGoalProbability: 'Вероятность гола:',
    stormIndex: 'Индекс штурма (Pressure Index)',

    waitingLiveCriteria: 'В работе • Ожидание критериев в live',
    statusActiveBadge: 'Активна',
    userStoppedStatus: 'Остановлен пользователем',
    readyForSignalStatus: 'Готов к сигналу',
    signalsDisabledStatus: 'Сигналы отключены',
    triggeredInLiveMatches: '⚡ Отрабатывает в {n} live-матчах! Включите для алертов',
    triggeredSignalsHistory: 'Отработала в сигналах:',
    triggeredJustNow: 'Отработала прямо сейчас ({n}):',
    liveSignalBadge: 'LIVE СИГНАЛ',
    customBot: '⚙️ Кастомный бот',
    defaultBot: '🤖 По умолчанию',
    switchOn: 'ВКЛ',
    switchOff: 'ВЫКЛ',
    allStrategiesBtn: 'Показать все стратегии',
    noFiltersInCategory: 'В этой категории или по вашему запросу нет фильтров.',
    devFormulaOpen: '👨‍💻 Режим разработчика (Формула открыта)',
    statMinutes: 'Минуты:',
    statScore: 'Счёт:',
    statShotsDiff: 'Разница ударов:',
    statDangAttacksDiff: 'Разница оп. атак:',
    statTotalShots: 'Всего ударов:',
    statShotsOnTarget: 'Удары в створ:',
    statTotalCorners: 'Всего угловых:',
    statPressure: 'Индекс давления:',
    statXgTotal: 'Суммарный xG:',
    statXgAdvantage: 'xG перевес над счётом:',
    statAttacksDiff: 'Разница атак:',
    statOddsFavorite: 'Кэф фаворита:',
    statOddsDrop: 'Падение кэфа:',
    statMoneyVolume: 'Прогруз денег:',
    statMoneyAmount: 'Сумма прогруза:',
    statTargetOutcome: 'Целевой исход:',
    statOddsOver25: 'Кэф ТБ 2.5:',
    statOddsBtts: 'Кэф ОЗ:',
    statModelIpt: 'Модель IPT:',
    statMaxTotal: 'Макс. тотал:',
    statLeagues: 'Лиги:',
    statStreakOver25: 'Серия ТБ 2.5:',
    statSquads: 'Составы:',
    statRedCard: 'Красная карточка:',
    statPattern: 'Паттерн:',
    statSignal75: 'Сигнал на 75\':',
    scoreAnyDraw: 'Любая ничья',
    scoreHomeLead: 'Хозяева ведут',
    scoreAwayLead: 'Гости ведут',
    scoreOneGoalDiff: 'Разница в 1 гол',
    scoreUnder25: 'ТБ 2.5 не пробит (≤ 2)',
    scoreUnder2: 'ТМ 2.5 (≤ 2)',
    scoreOver2: 'ТБ 2.5',
    scoreAny: 'Любой',
    squadsStrict11v11: 'Строго 11 vs 11',
    squadsMustHaveRedCard: 'Обязательно (10 vs 11)',
    leaguesExcludeYouthWomen: 'Без молодежек/женских',
    vipBuiltin: 'Вшитый VIP',
    exactScoreLabel: 'Счёт {score}',
    exactGoalsLabel: 'Ровно {n} г.',
    qfAll: 'Все',
    qfLive: 'Live',
    qfPrematch: 'Прематч',
    qfOver25: 'ТБ 2.5',
    qfOddsDrop: 'Прогруз',
    qfCorners: 'Угловые',
    qfPressure: 'Штурм',

    period1stHalf: '1-й тайм',
    periodHalftime: 'Перерыв',
    period2ndHalf: '2-й тайм',
    periodPrematch: 'Прематч (за 1 час)',
    periodFinished: 'Завершен',

    scannerStartBtn: '[ СТАРТ ]',
    scannerStopBtn: '[ СТОП ]',
    scannerClearBtn: '[ ОЧИСТИТЬ ТАБЛИЦУ ]',
    scannerSignalsCount: 'Сигналов в базе',
    scannerAllSports: 'Все виды',
    scannerPeriodAll: 'Все',
    scannerPeriod1H: '1Т',
    scannerPeriod2H: '2Т',
    scannerPeriodHT: 'HT',
    colFilter: 'Фильтр',
    colCountry: 'Страна',
    colLeague: 'Лига',
    colPeriod: 'Период',
    colTime: 'Время',
    colHome: 'Хозяева',
    colAway: 'Гости',
    colAttacks: 'Атаки',
    colDangAttacks: 'Оп. ат.',
    colShots: 'Удары (ств)',
    colCorners: 'Углы',
    colCards: 'ЖК/КК',
    colOutcome: 'Исход',
    colStrategyMetricResult: 'Конечный результат по стратегии',
    colBetStatus: 'Статус ставки',
    colTelegram: 'Telegram / Бот',
    colLoggedAt: 'Фиксация',
    colActions: 'Действия',
    noSignalsRecorded: 'Нет зафиксированных сигналов в текущей сессии',
    scannerPromptActive: 'Сканер запущен: при срабатывании фильтра новая строка сразу появится здесь',
    scannerPromptStopped: 'Нажмите [ СТАРТ ] для запуска сканирования live-матчей',

    updateCenterTitle: 'Центр обновлений SportSignal',
    updateCenterDesc: 'Обновление мобильного приложения и веб-версии',
    currentVersionLabel: 'Текущая версия',
    latestReleaseLabel: 'Последний релиз',
    versionInstalledDesc: 'Установлена в приложении',
    versionOnServerDesc: 'На сервере GitHub',
    checkingUpdatesText: 'Проверка доступных обновлений...',
    updateAvailableBanner: 'Доступна новая сборка {name}!',
    updateReadyInstallDesc: 'Вы можете установить её прямо сейчас одним нажатием без необходимости удалять приложение.',
    appUpToDateBanner: 'У вас установлена актуальная версия!',
    btnDownloadApkDirect: 'Скачать и установить APK',
    btnOtaSyncLive: 'Мгновенная синхронизация OTA',

    feedActiveSource: 'Источник',
    feedChangeBtn: 'Сменить / Настроить →',
    clearSearchTooltip: 'Очистить поиск',
    refreshMatchesTooltip: 'Обновить live-матчи',
    soundOnTooltip: 'Звук включен (кликните для отключения)',
    soundOffTooltip: 'Звук выключен (кликните для включения)',
    priorityMatchesTop: 'со сработавшими фильтрами подняты в верхний список',
    topOfListBadge: 'Вверху списка ⬆',
    shareSignalTooltip: 'Поделиться сигналом',
  },

  en: {
    navLiveMatches: 'Live Matches',
    navStrategies: 'Strategies & Filters',
    navBacktest: 'Backtest Lab',
    navPrematch: 'Prematch Digest',
    navGuide: 'Beginner Guide',
    navMatrix: 'Filter Matrix',
    navCabinet: 'Personal Cabinet',
    navDataSources: 'Data Sources',
    navSettings: 'Settings',
    navSignals: 'Scanner Signals',
    navEducation: 'Education',
    navProofOfWin: 'Proof-of-Win',
    navLeaderboard: 'Creators Ranking',
    navAiAnalyst: 'AI Analyst',
    navAiSynthesizer: 'AI Synthesizer',
    navMarketplace: 'Marketplace',
    navBankroll: 'Bankroll Tracker',
    navOddsRadar: 'Odds Radar',
    navMomentumRadar: 'Momentum Radar',
    navVoiceAlerts: 'Voice Announcer',
    newFilter: 'New Strategy',

    monitoringActive: 'Monitoring Active',
    monitoringPaused: 'Paused',
    sendDailyReport: 'Daily Report',
    dailyReportSent: 'Daily report sent to Telegram!',
    telegramBot: 'Telegram Bot',
    searchPlaceholder: 'Search by team, league, match ID (#m-1) or code (ARS, CHE)...',
    searchFiltersPlaceholder: 'Search filters and markets...',
    matchIdLabel: 'Match ID',
    teamCodeLabel: 'Team Code',
    matchIdCopied: 'Match ID copied!',
    refreshMatches: 'Refresh Live',
    activeProvider: 'Data Provider',
    liveMatchesCount: 'Live Matches',
    filtersCount: 'Active Strategies',
    tgChannel: 'Signal Channel',
    webPushActive: 'Push: ON',
    webPushInactive: 'Web Push',
    soundActive: 'Sound: ON',
    soundInactive: 'Sound: OFF',
    voiceActive: 'Voice: ON',
    voiceInactive: 'Voice: OFF',
    favoritesFilter: 'Favorites',
    downloadApkBtn: 'Download APK',

    sportAll: 'All Sports',
    sportFootball: 'Football',
    sportHockey: 'Ice Hockey',
    sportBasketball: 'Basketball',
    sportTennis: 'Tennis',
    sportVolleyball: 'Volleyball',
    sportTableTennis: 'Table Tennis',
    allSportsMonitored: 'All live feeds synchronized',

    topStableFilter: 'TOP-3 Ultra-Stable (80%+)',
    topStableBadge: 'ULTRA STABLE',
    topStableRunAll: 'Run All TOP-3',
    topStableTitle: 'Top-3 Ultra-Stable Algorithms',
    topStableDesc: 'Algorithms with verified pass rate from 80% to 100% across real live matches.',
    top3AlgorithmsTitle: 'Top-3 Ultra-Stable Algorithms of the Week',
    verifiedWinrate7d: 'Verified 7-Day Win Rate',
    noviceSafeTop3Btn: 'Top-3 Safe',
    proofOfWinCheckerBtn: 'Proof-of-Win Audit',
    shareCardBtn: 'Share Card',
    marketLabel: 'Target Market',
    streakLabel: 'Win Streak',

    catAll: 'All Strategies',
    catTopStable: 'Top Stable (80%+)',
    catActive: 'Active',
    catStopped: 'Stopped',
    catGoals: 'Goals (Over/Under)',
    catCorners: 'Corners',
    catComeback: 'Comebacks & Favorites',
    catHalftime: '1st Half (HT)',
    catPressure: 'Siege & Pressure',
    catOddsDrop: 'Odds Drops & Money Load',
    catCards: 'Cards & Red Cards',
    catCustom: 'Custom Created',

    btnStart: 'Start',
    btnRunning: 'Running',
    btnEdit: 'Configure',
    btnDelete: 'Delete',
    btnBacktest: 'Test 1000 Matches',
    btnAiAnalyze: 'AI Breakdown',
    btnNewStrategy: 'New Strategy',
    btnStopAll: 'Stop All',
    btnOnlyRunning: 'Running Only',
    expectedForecast: 'Expected Pick',
    embeddedPlatformAlgorithm: 'Built-in Platform Algorithm',
    passRateLabel: 'Pass Rate:',
    statusRunning: 'Running',
    statusStart: 'Start',
    test1000Btn: 'Test 1000',
    tuneBtn: 'Configure',
    paramsProtected: 'Parameters Protected',
    duplicateBtn: 'Duplicate',
    deleteBtn: 'Delete',
    telegramLabel: 'Telegram:',
    botLabel: 'Bot:',

    statusLive: 'Live',
    statusHalftime: 'HT',
    statusFinished: 'FT',
    minute: 'min',
    dangerousAttacks: 'Dangerous Attacks',
    shotsOnTarget: 'Shots on Target',
    corners: 'Corners',
    cards: 'Cards',
    possession: 'Possession',
    pressureIndex: 'Pressure Index',

    momentumRadarTitle: 'AI Match Momentum & Goal Radar',
    momentumRadarDesc: 'Real-time dynamic xG pressure curve and 10-minute goal probability scoring',
    goalProbability10m: 'Goal Next 10 Min',
    fairOddsEdge: 'Value Edge (+EV)',
    momentumPressureIndex: 'Team Dominance',
    matchMomentumWave: '15-Minute Attack Wave',

    reportTitle: 'Daily Signal Performance Report',
    reportSignalsTotal: 'Total 24h Signals',
    reportPassed: 'Won Signals (WIN)',
    reportFailed: 'Lost Signals (LOSS)',
    reportRefund: 'Pushed (REFUND)',
    reportWinRate: 'Verified Win Rate',
    reportProfit: 'Net Units Profit',
    reportRoi: 'Turnover ROI',
    reportTopStrategies: 'Best Performing Strategies',
    reportOnDemandSuccess: 'Daily report generated and delivered to Telegram!',
    reportCardTitle: 'Daily Efficiency & ROI Report',
    reportCardDesc: 'Full 24-hour summary of strike rate, ROI, and net yield across all triggered strategies delivered directly to your Telegram channel.',
    reportCardAutoSchedule: '⏰ Scheduled delivery: every day at 23:59',
    reportCardSendNow: 'Send Daily Report to Telegram Now',

    trackedMatchBanner: '⭐ Match on personal tracking watchlist',
    inPersonalTracking: 'Watchlist',
    favoritesBadge: 'Favorites',
    triggeredFilterTitle: 'Triggered Strategy:',
    triggeredFiltersTitle: 'Triggered Strategies ({n}):',
    topOfList: 'Top of List ⬆',
    prematchAnalysis1h: 'Analysis 1h Before Kickoff',
    prematchStartsIn: 'Kickoff in {min} min',
    matchStart: 'Start {time}',
    favoriteTrack: 'Watch',
    inFavorites: 'In Watchlist',
    matchAiAnalyst: 'AI Analyst',
    matchFilter: 'Filter',
    createFilterFromMatch: 'Filter From Match',
    goalImminent: 'Goal Imminent',
    highPressure: 'High Pressure',
    mediumTempo: 'Medium Tempo',
    calmTempo: 'Calm',
    quickDangAttacks: 'Dang. Attacks:',
    quickShots: 'Shots:',
    quickCorners: 'Corners:',
    triggeredFiltersOnMatch: 'Triggered ({n}):',
    oddsDropLabel: 'Steam Move:',
    showAllMatches: 'Show All Matches',
    noTrackedMatches: 'No matches in your watchlist',
    noMatchesSearch: 'No active matches match your query',
    backToMatches: '← Back to Matches',
    lastKeyEvent: 'Last Key Event',
    pressureAnalysisTitle: 'Algorithmic Pressure & In-Play Goal Probability',
    pressureGoalProbability: 'Goal Probability:',
    stormIndex: 'Siege Pressure Index',

    waitingLiveCriteria: 'Active • Waiting for live criteria',
    statusActiveBadge: 'Active',
    userStoppedStatus: 'Stopped by User',
    readyForSignalStatus: 'Ready for Signal',
    signalsDisabledStatus: 'Signals Muted',
    triggeredInLiveMatches: '⚡ Triggered in {n} live matches! Enable for alerts',
    triggeredSignalsHistory: 'Triggered in History:',
    triggeredJustNow: 'Triggered right now ({n}):',
    liveSignalBadge: 'LIVE SIGNAL',
    customBot: '⚙️ Custom Bot',
    defaultBot: '🤖 Default',
    switchOn: 'ON',
    switchOff: 'OFF',
    allStrategiesBtn: 'Show All Strategies',
    noFiltersInCategory: 'No strategies found in this category or search.',
    devFormulaOpen: '👨‍💻 Developer Mode (Formula Unlocked)',
    statMinutes: 'Minutes:',
    statScore: 'Score:',
    statShotsDiff: 'Shots Diff:',
    statDangAttacksDiff: 'Dang. Attacks Diff:',
    statTotalShots: 'Total Shots:',
    statShotsOnTarget: 'Shots on Target:',
    statTotalCorners: 'Total Corners:',
    statPressure: 'Pressure Index:',
    statXgTotal: 'Combined xG:',
    statXgAdvantage: 'xG Lead Over Score:',
    statAttacksDiff: 'Attacks Diff:',
    statOddsFavorite: 'Favorite Odds:',
    statOddsDrop: 'Odds Drop:',
    statMoneyVolume: 'Smart Money Pool:',
    statMoneyAmount: 'Volume Stake:',
    statTargetOutcome: 'Target Market:',
    statOddsOver25: 'Over 2.5 Odds:',
    statOddsBtts: 'BTTS Odds:',
    statModelIpt: 'IPT Model:',
    statMaxTotal: 'Max Total Goals:',
    statLeagues: 'Leagues:',
    statStreakOver25: 'Over 2.5 Streak:',
    statSquads: 'Squads:',
    statRedCard: 'Red Card:',
    statPattern: 'Pattern:',
    statSignal75: '75\' Signal:',
    scoreAnyDraw: 'Any Draw',
    scoreHomeLead: 'Home Leading',
    scoreAwayLead: 'Away Leading',
    scoreOneGoalDiff: '1 Goal Difference',
    scoreUnder25: 'Under 2.5 (≤ 2 goals)',
    scoreUnder2: 'Under 2.0 (≤ 2)',
    scoreOver2: 'Over 2.5',
    scoreAny: 'Any Score',
    squadsStrict11v11: 'Strictly 11 vs 11',
    squadsMustHaveRedCard: 'Mandatory Red Card (10 vs 11)',
    leaguesExcludeYouthWomen: 'Exclude Youth / Women',
    vipBuiltin: 'VIP Built-in',
    exactScoreLabel: 'Score {score}',
    exactGoalsLabel: 'Exact {n} goals',
    qfAll: 'All',
    qfLive: 'Live',
    qfPrematch: 'Prematch',
    qfOver25: 'Over 2.5',
    qfOddsDrop: 'Odds Drop',
    qfCorners: 'Corners',
    qfPressure: 'Assault',

    period1stHalf: '1st Half',
    periodHalftime: 'Halftime',
    period2ndHalf: '2nd Half',
    periodPrematch: 'Prematch (1h before)',
    periodFinished: 'Full Time',

    scannerStartBtn: '[ START ]',
    scannerStopBtn: '[ STOP ]',
    scannerClearBtn: '[ CLEAR TABLE ]',
    scannerSignalsCount: 'Signals in DB',
    scannerAllSports: 'All Sports',
    scannerPeriodAll: 'All',
    scannerPeriod1H: '1H',
    scannerPeriod2H: '2H',
    scannerPeriodHT: 'HT',
    colFilter: 'Filter',
    colCountry: 'Country',
    colLeague: 'League',
    colPeriod: 'Period',
    colTime: 'Time',
    colHome: 'Home',
    colAway: 'Away',
    colAttacks: 'Attacks',
    colDangAttacks: 'Dang. Att.',
    colShots: 'Shots (on)',
    colCorners: 'Corners',
    colCards: 'YC/RC',
    colOutcome: 'Outcome',
    colStrategyMetricResult: 'Strategy Final Result',
    colBetStatus: 'Bet Status',
    colTelegram: 'Telegram / Bot',
    colLoggedAt: 'Logged At',
    colActions: 'Actions',
    noSignalsRecorded: 'No signals recorded in current session',
    scannerPromptActive: 'Scanner running: matching filters will appear here immediately',
    scannerPromptStopped: 'Click [ START ] to launch live match scanning',

    updateCenterTitle: 'SportSignal Update Center',
    updateCenterDesc: 'Mobile app and web client updates',
    currentVersionLabel: 'Current Version',
    latestReleaseLabel: 'Latest Release',
    versionInstalledDesc: 'Installed in application',
    versionOnServerDesc: 'On GitHub server',
    checkingUpdatesText: 'Checking for available updates...',
    updateAvailableBanner: 'New build {name} is available!',
    updateReadyInstallDesc: 'You can update right now with 1 click without reinstalling the app.',
    appUpToDateBanner: 'Your app is up to date!',
    btnDownloadApkDirect: 'Download & Install APK',
    btnOtaSyncLive: 'Instant OTA Sync',

    feedActiveSource: 'Source',
    feedChangeBtn: 'Change / Configure →',
    clearSearchTooltip: 'Clear search',
    refreshMatchesTooltip: 'Refresh live matches',
    soundOnTooltip: 'Sound ON (click to mute)',
    soundOffTooltip: 'Sound OFF (click to unmute)',
    priorityMatchesTop: 'with triggered filters pushed to top of the list',
    topOfListBadge: 'Top of list ⬆',
    shareSignalTooltip: 'Share signal',
  },

  tr: {
    navLiveMatches: 'Canlı Maçlar',
    navStrategies: 'Stratejiler & Filtreler',
    navBacktest: 'Backtest Laboratuvarı',
    navPrematch: 'Maç Önü Analiz',
    navGuide: 'Başlangıç Rehberi',
    navMatrix: 'Filtre Matrisi',
    navCabinet: 'Kullanıcı Paneli',
    navDataSources: 'Veri Kaynakları',
    navSettings: 'Ayarlar',
    navSignals: 'Tarayıcı Sinyalleri',
    navEducation: 'Eğitim',
    navProofOfWin: 'Kazanç Kanıtı',
    navLeaderboard: 'Stratejist Sıralaması',
    navAiAnalyst: 'AI Analist',
    navAiSynthesizer: 'AI Sentezleyici',
    navMarketplace: 'Pazaryeri',
    navBankroll: 'Kasa Takibi',
    navOddsRadar: 'Oran Radarı',
    navMomentumRadar: 'Momentum Radarı',
    navVoiceAlerts: 'Sesli Spiker',
    newFilter: 'Yeni Strateji',

    monitoringActive: 'Canlı İzleme Aktif',
    monitoringPaused: 'Duraklatıldı',
    sendDailyReport: 'Günlük Rapor',
    dailyReportSent: 'Günlük rapor Telegrama gönderildi!',
    telegramBot: 'Telegram Botu',
    searchPlaceholder: 'Takım, lig, maç ID (#m-1) veya kod ara (ARS, CHE)...',
    searchFiltersPlaceholder: 'Filtre ve marketlerde ara...',
    matchIdLabel: 'Maç ID',
    teamCodeLabel: 'Takım Kodu',
    matchIdCopied: 'Maç ID kopyalandı!',
    refreshMatches: 'Yenile',
    activeProvider: 'Veri Sağlayıcı',
    liveMatchesCount: 'Canlı Maçlar',
    filtersCount: 'Aktif Stratejiler',
    tgChannel: 'Sinyal Kanalı',
    webPushActive: 'Push: AÇIK',
    webPushInactive: 'Web Push',
    soundActive: 'Ses: AÇIK',
    soundInactive: 'Ses: KAPALI',
    voiceActive: 'Sesli: AÇIK',
    voiceInactive: 'Sesli: KAPALI',
    favoritesFilter: 'Favoriler',
    downloadApkBtn: 'APK İndir',

    sportAll: 'Tüm Sporlar',
    sportFootball: 'Futbol',
    sportHockey: 'Buz Hokeyi',
    sportBasketball: 'Basketbol',
    sportTennis: 'Tenis',
    sportVolleyball: 'Voleybol',
    sportTableTennis: 'Masa Tenisi',
    allSportsMonitored: 'Tüm canlı yayınlar senkronize',

    topStableFilter: 'TOP-3 Ultra Kararlı (%80+)',
    topStableBadge: 'ULTRA KARARLI',
    topStableRunAll: 'Tüm TOP-3ü Başlat',
    topStableTitle: 'En Kararlı 3 Algoritma',
    topStableDesc: 'Gerçek canlı maçlarda %80 ile %100 arasında doğrulanmış başarı oranına sahip algoritmalar.',
    top3AlgorithmsTitle: 'Haftanın En Kararlı 3 Algoritması',
    verifiedWinrate7d: '7 Günlük Doğrulanmış Başarı',
    noviceSafeTop3Btn: 'Güvenli TOP-3',
    proofOfWinCheckerBtn: 'Kazanç Denetimi',
    shareCardBtn: 'Paylaş',
    marketLabel: 'Hedef Market',
    streakLabel: 'Seri',

    catAll: 'Tüm Stratejiler',
    catTopStable: 'En Kararlı (%80+)',
    catActive: 'Çalışıyor',
    catStopped: 'Durduruldu',
    catGoals: 'Goller (Üst/Alt)',
    catCorners: 'Kornerler',
    catComeback: 'Geri Dönüş & Favori',
    catHalftime: 'İlk Yarı (IY)',
    catPressure: 'Baskı & Kuşatma',
    catOddsDrop: 'Düşen Oran & Para Girişi',
    catCards: 'Kartlar & Kırmızı',
    catCustom: 'Özel Stratejiler',

    btnStart: 'Başlat',
    btnRunning: 'Çalışıyor',
    btnEdit: 'Düzenle',
    btnDelete: 'Sil',
    btnBacktest: '1000 Maç Test Et',
    btnAiAnalyze: 'AI Analizi',
    btnNewStrategy: 'Yeni Strateji',
    btnStopAll: 'Hepsini Durdur',
    btnOnlyRunning: 'Sadece Aktifler',
    expectedForecast: 'Beklenen Tahmin',
    embeddedPlatformAlgorithm: 'Yerleşik Sistem Algoritması',
    passRateLabel: 'Başarı:',
    statusRunning: 'Çalışıyor',
    statusStart: 'Başlat',
    test1000Btn: '1000 Test',
    tuneBtn: 'Ayarla',
    paramsProtected: 'Parametreler Korunuyor',
    duplicateBtn: 'Kopyala',
    deleteBtn: 'Sil',
    telegramLabel: 'Telegram:',
    botLabel: 'Bot:',

    statusLive: 'Canlı',
    statusHalftime: 'İY',
    statusFinished: 'MS',
    minute: 'dk',
    dangerousAttacks: 'Tehlikeli Atak',
    shotsOnTarget: 'İsabetli Şut',
    corners: 'Korner',
    cards: 'Kart',
    possession: 'Topla Oynama',
    pressureIndex: 'Baskı Endeksi',

    momentumRadarTitle: 'AI Baskı ve Gol Olasılık Radarı',
    momentumRadarDesc: 'Dinamik xG baskı eğrisi ve önümüzdeki 10 dakikada gol olasılığı analizi',
    goalProbability10m: 'Gelecek 10 Dk Gol',
    fairOddsEdge: 'Değerli Oran (+EV)',
    momentumPressureIndex: 'Takım Baskısı',
    matchMomentumWave: '15 Dakikalık Atak Dalgası',

    reportTitle: 'Günlük Sinyal Performans Raporu',
    reportSignalsTotal: '24 Saatlik Toplam Sinyal',
    reportPassed: 'Başarılı (KAZANÇ)',
    reportFailed: 'Kayıp (KAYIP)',
    reportRefund: 'İade (İADE)',
    reportWinRate: 'Doğrulanmış Başarı Oranı',
    reportProfit: 'Net Birim Kazanç',
    reportRoi: 'Ciro ROI',
    reportTopStrategies: 'En İyi Performans Gösterenler',
    reportOnDemandSuccess: 'Günlük rapor oluşturuldu ve Telegrama iletildi!',
    reportCardTitle: 'Günlük Verimlilik ve ROI Raporu',
    reportCardDesc: 'Tüm tetiklenen stratejilerin 24 saatlik başarı, ROI ve net kazanç özeti Telegram kanalınıza iletilir.',
    reportCardAutoSchedule: '⏰ Otomatik gönderim: her gün 23:59',
    reportCardSendNow: 'Günlük Raporu Hemen Telegrama Gönder',

    trackedMatchBanner: '⭐ Özel takip listesindeki maç',
    inPersonalTracking: 'Takipte',
    favoritesBadge: 'Favoriler',
    triggeredFilterTitle: 'Tetiklenen Strateji:',
    triggeredFiltersTitle: 'Tetiklenen Stratejiler ({n}):',
    topOfList: 'Listenin Başında ⬆',
    prematchAnalysis1h: 'Başlamadan 1 Saat Önce Analiz',
    prematchStartsIn: 'Başlamaya {min} dk',
    matchStart: 'Başlangıç {time}',
    favoriteTrack: 'Takip Et',
    inFavorites: 'Takipte',
    matchAiAnalyst: 'AI Analist',
    matchFilter: 'Filtre',
    createFilterFromMatch: 'Maçtan Filtre Oluştur',
    goalImminent: 'Gol Yakın',
    highPressure: 'Yüksek Baskı',
    mediumTempo: 'Orta Tempo',
    calmTempo: 'Sakin',
    quickDangAttacks: 'Teh. Atak:',
    quickShots: 'Şut:',
    quickCorners: 'Korner:',
    triggeredFiltersOnMatch: 'Tetiklendi ({n}):',
    oddsDropLabel: 'Para Yüklemesi:',
    showAllMatches: 'Tüm Maçları Göster',
    noTrackedMatches: 'Takip listesinde maç bulunmuyor',
    noMatchesSearch: 'Aramanızla eşleşen canlı maç yok',
    backToMatches: '← Maç Listesine Dön',
    lastKeyEvent: 'Son Önemli Olay',
    pressureAnalysisTitle: 'Algoritmik Baskı ve Canlı Gol Olasılığı',
    pressureGoalProbability: 'Gol Olasılığı:',
    stormIndex: 'Kuşatma Baskı Endeksi',

    waitingLiveCriteria: 'Çalışıyor • Canlı kriterler bekleniyor',
    statusActiveBadge: 'Aktif',
    userStoppedStatus: 'Kullanıcı Durdurdu',
    readyForSignalStatus: 'Sinyale Hazır',
    signalsDisabledStatus: 'Sinyaller Kapalı',
    triggeredInLiveMatches: '⚡ {n} canlı maçta tetiklendi! Alarmları açın',
    triggeredSignalsHistory: 'Geçmiş Sinyaller:',
    triggeredJustNow: 'Şu anda tetiklendi ({n}):',
    liveSignalBadge: 'CANLI SİNYAL',
    customBot: '⚙️ Özel Bot',
    defaultBot: '🤖 Varsayılan',
    switchOn: 'AÇIK',
    switchOff: 'KAPALI',
    allStrategiesBtn: 'Tüm Stratejileri Göster',
    noFiltersInCategory: 'Bu kategoride veya aramada strateji bulunamadı.',
    devFormulaOpen: '👨‍💻 Geliştirici Modu (Formül Açık)',
    statMinutes: 'Dakika:',
    statScore: 'Skor:',
    statShotsDiff: 'Şut Farkı:',
    statDangAttacksDiff: 'Teh. Atak Farkı:',
    statTotalShots: 'Toplam Şut:',
    statShotsOnTarget: 'İsabetli Şut:',
    statTotalCorners: 'Toplam Korner:',
    statPressure: 'Baskı Endeksi:',
    statXgTotal: 'Toplam xG:',
    statXgAdvantage: 'xG Skora Üstünlüğü:',
    statAttacksDiff: 'Atak Farkı:',
    statOddsFavorite: 'Favori Oranı:',
    statOddsDrop: 'Oran Düşüşü:',
    statMoneyVolume: 'Akıllı Para Hacmi:',
    statMoneyAmount: 'Yüklenen Miktar:',
    statTargetOutcome: 'Hedef Market:',
    statOddsOver25: '2.5 Üst Oranı:',
    statOddsBtts: 'KG Var Oranı:',
    statModelIpt: 'IPT Modeli:',
    statMaxTotal: 'Maks Toplam Gol:',
    statLeagues: 'Ligler:',
    statStreakOver25: '2.5 Üst Serisi:',
    statSquads: 'Kadro Durumu:',
    statRedCard: 'Kırmızı Kart:',
    statPattern: 'Model:',
    statSignal75: '75. Dk Sinyali:',
    scoreAnyDraw: 'Herhangi Beraberlik',
    scoreHomeLead: 'Ev Sahibi Önde',
    scoreAwayLead: 'Deplasman Önde',
    scoreOneGoalDiff: '1 Gol Farkı',
    scoreUnder25: '2.5 Alt (≤ 2 gol)',
    scoreUnder2: '2.0 Alt (≤ 2)',
    scoreOver2: '2.5 Üst',
    scoreAny: 'Herhangi Skor',
    squadsStrict11v11: 'Tam Kadro 11 vs 11',
    squadsMustHaveRedCard: 'Kırmızı Kart Şart (10 vs 11)',
    leaguesExcludeYouthWomen: 'Genç / Kadın Hariç',
    vipBuiltin: 'VIP Yerleşik',
    exactScoreLabel: 'Skor {score}',
    exactGoalsLabel: 'Tam {n} gol',
    qfAll: 'Tümü',
    qfLive: 'Canlı',
    qfPrematch: 'Maç Öncesi',
    qfOver25: 'Üst 2.5',
    qfOddsDrop: 'Oran Düşüşü',
    qfCorners: 'Kornerler',
    qfPressure: 'Baskı',

    period1stHalf: '1. Yarı',
    periodHalftime: 'Devre Arası',
    period2ndHalf: '2. Yarı',
    periodPrematch: 'Maç Öncesi (1 saat)',
    periodFinished: 'Bitti',

    scannerStartBtn: '[ BAŞLAT ]',
    scannerStopBtn: '[ DURDUR ]',
    scannerClearBtn: '[ TABLOYU TEMİZLE ]',
    scannerSignalsCount: 'Veritabanındaki sinyaller',
    scannerAllSports: 'Tüm Sporlar',
    scannerPeriodAll: 'Tümü',
    scannerPeriod1H: '1Y',
    scannerPeriod2H: '2Y',
    scannerPeriodHT: 'DA',
    colFilter: 'Filtre',
    colCountry: 'Ülke',
    colLeague: 'Lig',
    colPeriod: 'Periyot',
    colTime: 'Zaman',
    colHome: 'Ev Sahibi',
    colAway: 'Deplasman',
    colAttacks: 'Hücumlar',
    colDangAttacks: 'Tehlikeli',
    colShots: 'Şutlar (isabet)',
    colCorners: 'Korner',
    colCards: 'Sarı/Kırmızı',
    colOutcome: 'Tahmin',
    colStrategyMetricResult: 'Strateji Nihai Sonucu',
    colBetStatus: 'Bahis Durumu',
    colTelegram: 'Telegram / Bot',
    colLoggedAt: 'Kayıt Zamanı',
    colActions: 'İşlemler',
    noSignalsRecorded: 'Mevcut oturumda kaydedilmiş sinyal yok',
    scannerPromptActive: 'Tarayıcı aktif: eşleşen filtreler hemen burada görünecektir',
    scannerPromptStopped: 'Canlı maç taramasını başlatmak için [ BAŞLAT ] butonuna tıklayın',

    updateCenterTitle: 'SportSignal Güncelleme Merkezi',
    updateCenterDesc: 'Mobil uygulama ve web sürümü güncellemeleri',
    currentVersionLabel: 'Mevcut Sürüm',
    latestReleaseLabel: 'En Son Sürüm',
    versionInstalledDesc: 'Uygulamada yüklü',
    versionOnServerDesc: 'GitHub sunucusunda',
    checkingUpdatesText: 'Güncellemeler denetleniyor...',
    updateAvailableBanner: 'Yeni sürüm {name} mevcut!',
    updateReadyInstallDesc: 'Uygulamayı yeniden yüklemeden tek tıkla hemen güncelleyebilirsiniz.',
    appUpToDateBanner: 'Uygulamanız güncel!',
    btnDownloadApkDirect: 'APK İndir ve Yükle',
    btnOtaSyncLive: 'Anında OTA Senkronizasyonu',

    feedActiveSource: 'Kaynak',
    feedChangeBtn: 'Değiştir / Yapılandır →',
    clearSearchTooltip: 'Aramayı temizle',
    refreshMatchesTooltip: 'Canlı maçları yenile',
    soundOnTooltip: 'Ses AÇIK (kapatmak için tıklayın)',
    soundOffTooltip: 'Ses KAPALI (açmak için tıklayın)',
    priorityMatchesTop: 'tetiklenen filtrelerle listenin en üstüne taşındı',
    topOfListBadge: 'Listenin Başı ⬆',
    shareSignalTooltip: 'Sinyali paylaş',
  },

  it: {
    navLiveMatches: 'Partite Live',
    navStrategies: 'Strategie & Filtri',
    navBacktest: 'Laboratorio Backtest',
    navPrematch: 'Digest Prematch',
    navGuide: 'Guida Principianti',
    navMatrix: 'Matrice Filtri',
    navCabinet: 'Area Personale',
    navDataSources: 'Fonti Dati',
    navSettings: 'Impostazioni',
    navSignals: 'Segnali Scanner',
    navEducation: 'Formazione',
    navProofOfWin: 'Proof-of-Win',
    navLeaderboard: 'Classifica Autori',
    navAiAnalyst: 'Analista AI',
    navAiSynthesizer: 'Sintetizzatore AI',
    navMarketplace: 'Marketplace',
    navBankroll: 'Gestione Bankroll',
    navOddsRadar: 'Radar Quote',
    navMomentumRadar: 'Radar Dominio',
    navVoiceAlerts: 'Speaker Vocale',
    newFilter: 'Nuova Strategia',

    monitoringActive: 'Monitoraggio Attivo',
    monitoringPaused: 'In Pausa',
    sendDailyReport: 'Report Giornaliero',
    dailyReportSent: 'Report giornaliero inviato su Telegram!',
    telegramBot: 'Bot Telegram',
    searchPlaceholder: 'Cerca squadra, lega, ID partita (#m-1) o codice (ARS, CHE)...',
    searchFiltersPlaceholder: 'Cerca filtri e mercati...',
    matchIdLabel: 'ID Partita',
    teamCodeLabel: 'Codice Squadra',
    matchIdCopied: 'ID partita copiato!',
    refreshMatches: 'Aggiorna Live',
    activeProvider: 'Fornitore Dati',
    liveMatchesCount: 'Partite Live',
    filtersCount: 'Strategie Attive',
    tgChannel: 'Canale Segnali',
    webPushActive: 'Push: ATTIVO',
    webPushInactive: 'Web Push',
    soundActive: 'Suono: ON',
    soundInactive: 'Suono: OFF',
    voiceActive: 'Voce: ON',
    voiceInactive: 'Voce: OFF',
    favoritesFilter: 'Preferiti',
    downloadApkBtn: 'Scarica APK',

    sportAll: 'Tutti gli Sport',
    sportFootball: 'Calcio',
    sportHockey: 'Hockey su Ghiaccio',
    sportBasketball: 'Basket',
    sportTennis: 'Tennis',
    sportVolleyball: 'Pallavolo',
    sportTableTennis: 'Tennistavolo',
    allSportsMonitored: 'Tutti i flussi live sincronizzati',

    topStableFilter: 'TOP-3 Ultra-Stabili (80%+)',
    topStableBadge: 'ULTRA STABILE',
    topStableRunAll: 'Avvia Tutte le TOP-3',
    topStableTitle: 'Top-3 Algoritmi Ultra-Stabili',
    topStableDesc: 'Algoritmi con tasso di successo certificato dall 80% al 100% su partite reali.',
    top3AlgorithmsTitle: 'Top-3 Algoritmi Ultra-Stabili della Settimana',
    verifiedWinrate7d: 'Win Rate a 7 Giorni Verificato',
    noviceSafeTop3Btn: 'Top-3 Sicuri',
    proofOfWinCheckerBtn: 'Audit Proof-of-Win',
    shareCardBtn: 'Condividi',
    marketLabel: 'Mercato Obiettivo',
    streakLabel: 'Striscia Vincente',

    catAll: 'Tutte le Strategie',
    catTopStable: 'Top Stabili (80%+)',
    catActive: 'Attive',
    catStopped: 'Fermate',
    catGoals: 'Gol (Over/Under)',
    catCorners: 'Calci d Angolo',
    catComeback: 'Rimonte & Favorite',
    catHalftime: '1° Tempo (HT)',
    catPressure: 'Pressione & Assedio',
    catOddsDrop: 'Crollo Quote & Flusso Denaro',
    catCards: 'Cartellini & Espulsioni',
    catCustom: 'Personalizzate',

    btnStart: 'Avvia',
    btnRunning: 'In Esecuzione',
    btnEdit: 'Configura',
    btnDelete: 'Elimina',
    btnBacktest: 'Testa 1000 Partite',
    btnAiAnalyze: 'Analisi AI',
    btnNewStrategy: 'Nuova Strategia',
    btnStopAll: 'Ferma Tutte',
    btnOnlyRunning: 'Solo Attive',
    expectedForecast: 'Pronostico Atteso',
    embeddedPlatformAlgorithm: 'Algoritmo Integrato della Piattaforma',
    passRateLabel: 'Successo:',
    statusRunning: 'In Esecuzione',
    statusStart: 'Avvia',
    test1000Btn: 'Test 1000',
    tuneBtn: 'Configura',
    paramsProtected: 'Parametri Protetti',
    duplicateBtn: 'Duplica',
    deleteBtn: 'Elimina',
    telegramLabel: 'Telegram:',
    botLabel: 'Bot:',

    statusLive: 'Live',
    statusHalftime: 'Intervallo',
    statusFinished: 'Finale',
    minute: 'min',
    dangerousAttacks: 'Attacchi Pericolosi',
    shotsOnTarget: 'Tiri in Porta',
    corners: 'Calci d Angolo',
    cards: 'Cartellini',
    possession: 'Possesso Palla',
    pressureIndex: 'Indice di Pressione',

    momentumRadarTitle: 'AI Radar Dominio e Probabilità Gol',
    momentumRadarDesc: 'Curva di pressione xG dinamica in tempo reale e stima gol nei prossimi 10 minuti',
    goalProbability10m: 'Gol Prossimi 10 Min',
    fairOddsEdge: 'Valore Atteso (+EV)',
    momentumPressureIndex: 'Dominio Squadre',
    matchMomentumWave: 'Onda d Attacco a 15 Minuti',

    reportTitle: 'Report Prestazioni Segnali 24h',
    reportSignalsTotal: 'Segnali Totali Nelle 24h',
    reportPassed: 'Vincenti (WIN)',
    reportFailed: 'Perdenti (LOSS)',
    reportRefund: 'Rimborsati (PUSH)',
    reportWinRate: 'Percentuale Vittorie Verificata',
    reportProfit: 'Profitto Netto in Unità',
    reportRoi: 'ROI sul Volume',
    reportTopStrategies: 'Strategie Migliori',
    reportOnDemandSuccess: 'Report generato con successo e inviato su Telegram!',
    reportCardTitle: 'Report Giornaliero Rendimento & ROI',
    reportCardDesc: 'Riepilogo completo di winrate, ROI e profitto netto di tutte le strategie attivate nelle ultime 24 ore recapitato sul tuo canale Telegram.',
    reportCardAutoSchedule: '⏰ Invio programmato: ogni giorno alle 23:59',
    reportCardSendNow: 'Invia Report Subito su Telegram',

    trackedMatchBanner: '⭐ Partita nella lista di monitoraggio personale',
    inPersonalTracking: 'Monitorata',
    favoritesBadge: 'Preferiti',
    triggeredFilterTitle: 'Strategia Attivata:',
    triggeredFiltersTitle: 'Strategie Attivate ({n}):',
    topOfList: 'In Cima alla Lista ⬆',
    prematchAnalysis1h: 'Analisi a 1 Ora dal Calcio d Inizio',
    prematchStartsIn: 'Inizio tra {min} min',
    matchStart: 'Inizio {time}',
    favoriteTrack: 'Segui',
    inFavorites: 'Nei Preferiti',
    matchAiAnalyst: 'Analista AI',
    matchFilter: 'Filtro',
    createFilterFromMatch: 'Crea Filtro da Partita',
    goalImminent: 'Gol Imminente',
    highPressure: 'Pressione Alta',
    mediumTempo: 'Ritmo Medio',
    calmTempo: 'Tranquillo',
    quickDangAttacks: 'Att. Pericolosi:',
    quickShots: 'Tiri:',
    quickCorners: 'Angoli:',
    triggeredFiltersOnMatch: 'Attivati ({n}):',
    oddsDropLabel: 'Flusso Denaro:',
    showAllMatches: 'Mostra Tutte le Partite',
    noTrackedMatches: 'Nessuna partita nei preferiti',
    noMatchesSearch: 'Nessuna partita corrisponde alla ricerca',
    backToMatches: '← Torna all elenco partite',
    lastKeyEvent: 'Ultimo Evento Chiave',
    pressureAnalysisTitle: 'Analisi Algoritmica Pressione e Probabilità Gol',
    pressureGoalProbability: 'Probabilità Gol:',
    stormIndex: 'Indice di Assedio (Pressure)',

    waitingLiveCriteria: 'Attiva • In attesa criteri in live',
    statusActiveBadge: 'Attiva',
    userStoppedStatus: 'Fermata dall utente',
    readyForSignalStatus: 'Pronta al segnale',
    signalsDisabledStatus: 'Segnali disattivati',
    triggeredInLiveMatches: '⚡ Attiva in {n} partite live! Attiva per ricevere alert',
    triggeredSignalsHistory: 'Attivata nello storico:',
    triggeredJustNow: 'Attivata proprio ora ({n}):',
    liveSignalBadge: 'SEGNALE LIVE',
    customBot: '⚙️ Bot Personalizzato',
    defaultBot: '🤖 Predefinito',
    switchOn: 'ON',
    switchOff: 'OFF',
    allStrategiesBtn: 'Mostra Tutte le Strategie',
    noFiltersInCategory: 'Nessuna strategia trovata in questa categoria.',
    devFormulaOpen: '👨‍💻 Modalità Sviluppatore (Formula Visibile)',
    statMinutes: 'Minuti:',
    statScore: 'Punteggio:',
    statShotsDiff: 'Diff. Tiri:',
    statDangAttacksDiff: 'Diff. Att. Pericolosi:',
    statTotalShots: 'Tiri Totali:',
    statShotsOnTarget: 'Tiri in Porta:',
    statTotalCorners: 'Calci d Angolo:',
    statPressure: 'Indice di Pressione:',
    statXgTotal: 'xG Combinato:',
    statXgAdvantage: 'Vantaggio xG su Risultato:',
    statAttacksDiff: 'Diff. Attacchi:',
    statOddsFavorite: 'Quota Favorita:',
    statOddsDrop: 'Crollo Quota:',
    statMoneyVolume: 'Flusso Volume:',
    statMoneyAmount: 'Importo Puntato:',
    statTargetOutcome: 'Esito Target:',
    statOddsOver25: 'Quota Over 2.5:',
    statOddsBtts: 'Quota Gol/Gol:',
    statModelIpt: 'Modello IPT:',
    statMaxTotal: 'Totale Gol Massimo:',
    statLeagues: 'Campionati:',
    statStreakOver25: 'Striscia Over 2.5:',
    statSquads: 'Formazioni:',
    statRedCard: 'Cartellino Rosso:',
    statPattern: 'Schema:',
    statSignal75: 'Segnale al 75\':',
    scoreAnyDraw: 'Qualsiasi Pareggio',
    scoreHomeLead: 'Casa in Vantaggio',
    scoreAwayLead: 'Ospiti in Vantaggio',
    scoreOneGoalDiff: 'Differenza di 1 Gol',
    scoreUnder25: 'Under 2.5 (≤ 2 gol)',
    scoreUnder2: 'Under 2.0 (≤ 2)',
    scoreOver2: 'Over 2.5',
    scoreAny: 'Qualsiasi Risultato',
    squadsStrict11v11: 'Rigorosamente 11 vs 11',
    squadsMustHaveRedCard: 'Espulsione Obbligatoria (10 vs 11)',
    leaguesExcludeYouthWomen: 'Escludi Giovanili / Femminili',
    vipBuiltin: 'VIP Integrato',
    exactScoreLabel: 'Punteggio {score}',
    exactGoalsLabel: 'Esattamente {n} gol',
    qfAll: 'Tutte',
    qfLive: 'Live',
    qfPrematch: 'Prematch',
    qfOver25: 'Over 2.5',
    qfOddsDrop: 'Calo Quote',
    qfCorners: 'Calci d\'angolo',
    qfPressure: 'Assalto',

    period1stHalf: '1° Tempo',
    periodHalftime: 'Intervallo',
    period2ndHalf: '2° Tempo',
    periodPrematch: 'Prematch (1 ora prima)',
    periodFinished: 'Terminata',

    scannerStartBtn: '[ AVVIA ]',
    scannerStopBtn: '[ FERMA ]',
    scannerClearBtn: '[ SVUOTA TABELLA ]',
    scannerSignalsCount: 'Segnali salvati',
    scannerAllSports: 'Tutti gli sport',
    scannerPeriodAll: 'Tutti',
    scannerPeriod1H: '1T',
    scannerPeriod2H: '2T',
    scannerPeriodHT: 'INT',
    colFilter: 'Filtro',
    colCountry: 'Paese',
    colLeague: 'Lega',
    colPeriod: 'Periodo',
    colTime: 'Tempo',
    colHome: 'Casa',
    colAway: 'Ospiti',
    colAttacks: 'Attacchi',
    colDangAttacks: 'Att. Peric.',
    colShots: 'Tiri (in porta)',
    colCorners: 'Angoli',
    colCards: 'Gialli/Rossi',
    colOutcome: 'Esito',
    colStrategyMetricResult: 'Risultato Finale Strategia',
    colBetStatus: 'Stato scommessa',
    colTelegram: 'Telegram / Bot',
    colLoggedAt: 'Ora segnale',
    colActions: 'Azioni',
    noSignalsRecorded: 'Nessun segnale registrato nella sessione corrente',
    scannerPromptActive: 'Scanner attivo: i nuovi segnali compariranno qui all\'istante',
    scannerPromptStopped: 'Clicca [ AVVIA ] per scansionare le partite live',

    updateCenterTitle: 'Centro Aggiornamenti SportSignal',
    updateCenterDesc: 'Aggiornamenti app mobile e web',
    currentVersionLabel: 'Versione Corrente',
    latestReleaseLabel: 'Ultima Versione',
    versionInstalledDesc: 'Installata nell\'app',
    versionOnServerDesc: 'Sul server GitHub',
    checkingUpdatesText: 'Verifica aggiornamenti in corso...',
    updateAvailableBanner: 'Nuova build {name} disponibile!',
    updateReadyInstallDesc: 'Puoi aggiornare all\'istante con un click senza dover reinstallare l\'app.',
    appUpToDateBanner: 'L\'app è aggiornata all\'ultima versione!',
    btnDownloadApkDirect: 'Scarica e Installa APK',
    btnOtaSyncLive: 'Sincronizzazione Rapida OTA',

    feedActiveSource: 'Fonte',
    feedChangeBtn: 'Modifica / Configura →',
    clearSearchTooltip: 'Cancella ricerca',
    refreshMatchesTooltip: 'Aggiorna partite live',
    soundOnTooltip: 'Audio ATTIVO (clicca per disattivare)',
    soundOffTooltip: 'Audio DISATTIVATO (clicca per attivare)',
    priorityMatchesTop: 'con filtri attivati spostate in cima alla lista',
    topOfListBadge: 'In cima ⬆',
    shareSignalTooltip: 'Condividi segnale',
  },

  zh: {
    navLiveMatches: '实时比赛',
    navStrategies: '策略与过滤器',
    navBacktest: '历史回测实验室',
    navPrematch: '赛前情报精选',
    navGuide: '新手入门指南',
    navMatrix: '矩阵过滤器',
    navCabinet: '个人中心',
    navDataSources: '数据源管理',
    navSettings: '系统设置',
    navSignals: '扫描器信号',
    navEducation: '实战教程',
    navProofOfWin: '胜率真实认证',
    navLeaderboard: '策略作者榜单',
    navAiAnalyst: 'AI 比赛分析师',
    navAiSynthesizer: 'AI 策略合成器',
    navMarketplace: '策略交易集市',
    navBankroll: '资金账户追踪',
    navOddsRadar: '赔率异常雷达',
    navMomentumRadar: '场面压迫雷达',
    navVoiceAlerts: '实时语音播报',
    newFilter: '新建策略',

    monitoringActive: '全量监控进行中',
    monitoringPaused: '已暂停监控',
    sendDailyReport: '生成今日战报',
    dailyReportSent: '每日战报已成功推送至 Telegram！',
    telegramBot: 'Telegram 机器人',
    searchPlaceholder: '搜索球队、联赛、比赛ID (#m-1) 或代码 (ARS, CHE)...',
    searchFiltersPlaceholder: '搜索策略规则与投注盘口...',
    matchIdLabel: '比赛ID',
    teamCodeLabel: '球队代码',
    matchIdCopied: '比赛ID已复制！',
    refreshMatches: '刷新实时数据',
    activeProvider: '活跃数据提供商',
    liveMatchesCount: '当前滚球比赛数',
    filtersCount: '运行中策略数',
    tgChannel: '官方信号频道',
    webPushActive: '网页推送：已开启',
    webPushInactive: '网页推送通知',
    soundActive: '声音提醒：开启',
    soundInactive: '声音提醒：静音',
    voiceActive: '语音播报：开启',
    voiceInactive: '语音播报：关闭',
    favoritesFilter: '我的收藏',
    downloadApkBtn: '下载安卓 APK',

    sportAll: '全部体育项目',
    sportFootball: '足球',
    sportHockey: '冰球',
    sportBasketball: '篮球',
    sportTennis: '网球',
    sportVolleyball: '排球',
    sportTableTennis: '乒乓球',
    allSportsMonitored: '所有赛事实时流已全面同步',

    topStableFilter: 'TOP-3 极稳策略 (80%+)',
    topStableBadge: '超稳胜率标杆',
    topStableRunAll: '一键运行所有 TOP-3',
    topStableTitle: 'Top-3 超稳高胜率策略',
    topStableDesc: '在真实比赛大数据沉淀下，胜率稳定在 80% 至 100% 的标杆模型。',
    top3AlgorithmsTitle: '本周 Top-3 极高稳定性量化算法',
    verifiedWinrate7d: '过去 7 天胜率经链上真实验证',
    noviceSafeTop3Btn: '新手安全 TOP-3',
    proofOfWinCheckerBtn: '真实胜率审计',
    shareCardBtn: '分享卡片',
    marketLabel: '目标盘口',
    streakLabel: '连红场次',

    catAll: '所有策略分类',
    catTopStable: '极稳推荐 (80%+)',
    catActive: '运行中',
    catStopped: '已暂停',
    catGoals: '进球数 (大小球)',
    catCorners: '角球模型',
    catComeback: '逆风翻盘与豪门',
    catHalftime: '半场绝杀 (HT)',
    catPressure: '强力围攻与压制',
    catOddsDrop: '赔率跳水与资金砸盘',
    catCards: '红黄牌与罚下',
    catCustom: '自定义模型',

    btnStart: '启动策略',
    btnRunning: '运行监控中',
    btnEdit: '配置规则',
    btnDelete: '删除策略',
    btnBacktest: '1000 场回测验证',
    btnAiAnalyze: 'AI 深度拆解',
    btnNewStrategy: '新建策略',
    btnStopAll: '暂停所有',
    btnOnlyRunning: '仅查看运行中',
    expectedForecast: '预期建议预测',
    embeddedPlatformAlgorithm: '平台内置核心算法',
    passRateLabel: '历史胜率：',
    statusRunning: '运行中',
    statusStart: '启动',
    test1000Btn: '千场回测',
    tuneBtn: '调优',
    paramsProtected: '核心参数已保护',
    duplicateBtn: '复制策略',
    deleteBtn: '删除',
    telegramLabel: 'Telegram 提醒：',
    botLabel: '指定机器人：',

    statusLive: '滚球中',
    statusHalftime: '中场休息',
    statusFinished: '已完场',
    minute: '分钟',
    dangerousAttacks: '危险进攻次数',
    shotsOnTarget: '射正球门次数',
    corners: '角球次数',
    cards: '红黄牌数',
    possession: '控球率',
    pressureIndex: '攻防压迫指数',

    momentumRadarTitle: 'AI 攻防势头与进球雷达',
    momentumRadarDesc: '动态 xG 压迫波形图与未来 10 分钟进球概率定量评估',
    goalProbability10m: '未来 10 分钟进球概率',
    fairOddsEdge: '机构赔率价值溢价 (+EV)',
    momentumPressureIndex: '双方法定压制指数',
    matchMomentumWave: '近 15 分钟连续攻势波形',

    reportTitle: '24 小时信号执行表现战报',
    reportSignalsTotal: '全天总信号发生数',
    reportPassed: '成功收米 (WIN)',
    reportFailed: '未打出 (LOSS)',
    reportRefund: '走盘退款 (PUSH)',
    reportWinRate: '整体真实胜率 (Win Rate)',
    reportProfit: '净收益单位 (Units)',
    reportRoi: '流水投资回报率 ROI',
    reportTopStrategies: '24 小时表现最佳策略',
    reportOnDemandSuccess: '每日战报已成功生成并即时推送至 Telegram 频道！',
    reportCardTitle: '每日效率与收益战报',
    reportCardDesc: '自动汇总结算过去 24 小时内所有触发策略的胜率、ROI 及盈利明细，并一键推送到您的 Telegram 频道。',
    reportCardAutoSchedule: '⏰ 每日定时自动推送：23:59',
    reportCardSendNow: '立即发送今日战报至 Telegram',

    trackedMatchBanner: '⭐ 重点特别关注与监控赛事',
    inPersonalTracking: '特别监控',
    favoritesBadge: '我的关注',
    triggeredFilterTitle: '命中策略：',
    triggeredFiltersTitle: '已触发策略 ({n})：',
    topOfList: '置顶显示 ⬆',
    prematchAnalysis1h: '开赛前 1 小时精细化分析',
    prematchStartsIn: '距离开赛还有 {min} 分钟',
    matchStart: '开球时间 {time}',
    favoriteTrack: '特别关注',
    inFavorites: '已关注',
    matchAiAnalyst: 'AI 赛事分析',
    matchFilter: '过滤',
    createFilterFromMatch: '依本场生成策略',
    goalImminent: '破门在即',
    highPressure: '高压围攻',
    mediumTempo: '节奏适中',
    calmTempo: '场面平稳',
    quickDangAttacks: '危攻：',
    quickShots: '射门：',
    quickCorners: '角球：',
    triggeredFiltersOnMatch: '已命中 ({n})：',
    oddsDropLabel: '主力资金砸盘：',
    showAllMatches: '显示所有比赛',
    noTrackedMatches: '您目前未添加任何特别关注的比赛',
    noMatchesSearch: '未找到符合条件的实时滚球赛事',
    backToMatches: '← 返回赛事列表',
    lastKeyEvent: '最近重大事件',
    pressureAnalysisTitle: '算法压迫指数与进球实时概率',
    pressureGoalProbability: '进球概率：',
    stormIndex: '全场围攻指数 (Pressure Index)',

    waitingLiveCriteria: '运行中 • 实时监测符合条件的赛事',
    statusActiveBadge: '运行中',
    userStoppedStatus: '用户已手动暂停',
    readyForSignalStatus: '信号准备就绪',
    signalsDisabledStatus: '推送已静音',
    triggeredInLiveMatches: '⚡ 正在 {n} 场滚球比赛中生效！请开启推送以接收预警',
    triggeredSignalsHistory: '历史触发记录：',
    triggeredJustNow: '刚刚命中信号 ({n})：',
    liveSignalBadge: '实时滚球信号',
    customBot: '⚙️ 自定义机器人',
    defaultBot: '🤖 默认系统机器人',
    switchOn: '开启',
    switchOff: '关闭',
    allStrategiesBtn: '查看全部策略',
    noFiltersInCategory: '该分类或搜索关键词下暂无策略。',
    devFormulaOpen: '👨‍💻 开发者模式（算法公式已解锁）',
    statMinutes: '比赛时间：',
    statScore: '当前比分：',
    statShotsDiff: '射门差值：',
    statDangAttacksDiff: '危攻差值：',
    statTotalShots: '总射门：',
    statShotsOnTarget: '射正球门：',
    statTotalCorners: '总角球：',
    statPressure: '压迫指数：',
    statXgTotal: '双方累计 xG：',
    statXgAdvantage: 'xG 领先比分：',
    statAttacksDiff: '总进攻差值：',
    statOddsFavorite: '主力胜赔：',
    statOddsDrop: '赔率跌幅：',
    statMoneyVolume: '资金池主力占比：',
    statMoneyAmount: '单向砸盘金额：',
    statTargetOutcome: '推荐盘口：',
    statOddsOver25: '大 2.5 赔率：',
    statOddsBtts: '双飞/双方进球赔率：',
    statModelIpt: 'IPT 模型评分：',
    statMaxTotal: '最高进球封顶：',
    statLeagues: '参赛联赛：',
    statStreakOver25: '大球连续走势：',
    statSquads: '双方在场人数：',
    statRedCard: '红牌要求：',
    statPattern: '战术走势特征：',
    statSignal75: '75 分钟特殊信号：',
    scoreAnyDraw: '任何平局',
    scoreHomeLead: '主队领先',
    scoreAwayLead: '客队领先',
    scoreOneGoalDiff: '相差 1 球',
    scoreUnder25: '大 2.5 未打出 (≤ 2球)',
    scoreUnder2: '小 2.0 (≤ 2球)',
    scoreOver2: '大 2.5',
    scoreAny: '任意比分',
    squadsStrict11v11: '严格 11 对 11',
    squadsMustHaveRedCard: '必须有红牌 (10 对 11)',
    leaguesExcludeYouthWomen: '排除青年队/女足',
    vipBuiltin: '平台内置 VIP',
    exactScoreLabel: '精确比分 {score}',
    exactGoalsLabel: '整场恰好 {n} 球',
    qfAll: '全部',
    qfLive: '滚球',
    qfPrematch: '赛前',
    qfOver25: '大 2.5',
    qfOddsDrop: '赔率骤降',
    qfCorners: '角球',
    qfPressure: '高压进攻',

    period1stHalf: '上半场',
    periodHalftime: '半场休息',
    period2ndHalf: '下半场',
    periodPrematch: '赛前（提前1小时）',
    periodFinished: '全场完赛',

    scannerStartBtn: '[ 启动 ]',
    scannerStopBtn: '[ 停止 ]',
    scannerClearBtn: '[ 清空表格 ]',
    scannerSignalsCount: '数据库信号数',
    scannerAllSports: '全部运动',
    scannerPeriodAll: '全部',
    scannerPeriod1H: '上',
    scannerPeriod2H: '下',
    scannerPeriodHT: '中',
    colFilter: '策略',
    colCountry: '国家',
    colLeague: '联赛',
    colPeriod: '阶段',
    colTime: '时间',
    colHome: '主队',
    colAway: '客队',
    colAttacks: '进攻',
    colDangAttacks: '危险进攻',
    colShots: '射门(射正)',
    colCorners: '角球',
    colCards: '黄/红牌',
    colOutcome: '推荐项',
    colStrategyMetricResult: '策略最终结果',
    colBetStatus: '注单结果',
    colTelegram: '电报机器人',
    colLoggedAt: '触发时间',
    colActions: '操作',
    noSignalsRecorded: '当前会话暂无记录信号',
    scannerPromptActive: '扫描器运行中：策略触发后将即时显示在此处',
    scannerPromptStopped: '点击 [ 启动 ] 开始实时滚球监控',

    updateCenterTitle: 'SportSignal 更新中心',
    updateCenterDesc: '移动端与Web客户端更新',
    currentVersionLabel: '当前版本',
    latestReleaseLabel: '最新发布',
    versionInstalledDesc: '已安装至本应用',
    versionOnServerDesc: 'GitHub 服务器端',
    checkingUpdatesText: '正在检查可用更新...',
    updateAvailableBanner: '发现新版本 {name}！',
    updateReadyInstallDesc: '无需重新卸载安装，点击即可一键无缝更新。',
    appUpToDateBanner: '当前已是最新版本！',
    btnDownloadApkDirect: '下载并安装 APK',
    btnOtaSyncLive: 'OTA 即时热重载',

    feedActiveSource: '数据源',
    feedChangeBtn: '更改 / 配置 →',
    clearSearchTooltip: '清空搜索',
    refreshMatchesTooltip: '刷新滚球比赛',
    soundOnTooltip: '声音已开启（点击静音）',
    soundOffTooltip: '声音已关闭（点击开启）',
    priorityMatchesTop: '已触发策略并置顶显示',
    topOfListBadge: '置顶 ⬆',
    shareSignalTooltip: '分享信号',
  },
};
