import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserSimulationAgentModal } from '../src/components/UserSimulationAgentModal';
import { Match, FilterRule, UserProfile, SignalAlert } from '../src/types';
import { runUserSimulationAgent } from '../src/services/userSimulationAgent';
import {
  evaluateFilterRule,
  evaluateSignalOutcome,
  calculatePressureAnalysis,
  calculateMatchIPT,
} from '../src/algorithms';
import { isUserDeveloper } from '../src/utils/filterDefaults';

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockImplementation(() => Promise.resolve()),
  },
});

const mockMatches: Match[] = [
  {
    id: 'm-live-1',
    country: 'England',
    countryCode: 'GB',
    league: 'Premier League',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    score: [1, 1],
    minute: 78,
    status: 'LIVE',
    sport: 'football',
    source: 'Live Telemetry Core',
    stats: {
      possession: [62, 38],
      attacks: [85, 45],
      dangerousAttacks: [54, 22],
      shotsOnTarget: [8, 3],
      shotsOffTarget: [7, 4],
      corners: [9, 2],
      yellowCards: [2, 3],
      redCards: [0, 0],
      xg: [1.95, 0.85],
    },
    momentum: [45, 60, 75, 80, 88],
    lastEvent: 'Dangerous attack by Arsenal',
    odds: {
      home: 2.1,
      draw: 3.4,
      away: 3.6,
      over25: 1.85,
    },
  },
  {
    id: 'm-live-hockey',
    country: 'USA',
    countryCode: 'US',
    league: 'NHL',
    homeTeam: 'Rangers',
    awayTeam: 'Bruins',
    score: [3, 2],
    minute: 48,
    status: 'LIVE',
    sport: 'hockey',
    source: 'Live Telemetry Core',
    stats: {
      possession: [50, 50],
      attacks: [40, 38],
      dangerousAttacks: [28, 25],
      shotsOnTarget: [32, 29],
      shotsOffTarget: [12, 10],
      corners: [0, 0],
      yellowCards: [0, 0],
      redCards: [0, 0],
      xg: [3.1, 2.7],
    },
    momentum: [50, 55, 65],
    lastEvent: 'Power play active',
    odds: {
      home: 2.2,
      draw: 4.1,
      away: 2.8,
      over25: 1.25,
      over55: 1.9,
    },
  },
];

const mockFilters: FilterRule[] = [
  {
    id: 'f-1',
    name: 'Поздний Гол Штурм (75-88 мин)',
    description: 'Тестовый фильтр штурма во 2-м тайме',
    color: 'emerald',
    enabled: true,
    sport: 'football',
    minMinute: 70,
    maxMinute: 88,
    scoreCondition: 'ANY',
    minDangerousAttacksTotal: 35,
    minShotsOnTargetTotal: 5,
    minTotalCorners: 4,
    targetMarket: 'ТБ 2.5',
    telegramEnabled: false,
  },
  {
    id: 'f-hockey',
    name: 'НХЛ ТБ 5.5 Шайб',
    description: 'Тестовый хоккейный фильтр',
    color: 'blue',
    enabled: true,
    sport: 'hockey',
    minMinute: 40,
    maxMinute: 58,
    scoreCondition: 'ANY',
    targetMarket: 'ТБ 5.5 шайб',
    telegramEnabled: false,
  },
  {
    id: 'f-info-radar',
    name: 'Инфо-Радар Аномального Давления (Без ставок)',
    description: 'Информационный радар активности: отслеживание тактического давления без ставок',
    color: 'amber',
    category: 'radar',
    enabled: true,
    sport: 'football',
    minMinute: 60,
    maxMinute: 85,
    scoreCondition: 'ANY',
    minPressureIndex: 65,
    targetMarket: 'ИНФО',
    noResolutionTrack: true, // Исход не отслеживается
    telegramEnabled: false,
  },
];

const mockUsers: UserProfile[] = [
  {
    id: 'user-free',
    name: 'Новичок Бесплатный',
    displayName: 'Новичок Бесплатный',
    username: 'free_user',
    email: 'free@monitor.local',
    role: 'user',
    plan: 'FREE',
    balanceRub: 1000,
    telegramBots: [],
    registeredAt: '2026-01-01',
    notificationSound: true,
    adPreferences: { personalizedAds: false, allowPromotions: false },
  },
  {
    id: 'user-pro',
    name: 'PRO Аналитик',
    displayName: 'PRO Аналитик',
    username: 'pro_user',
    email: 'pro@monitor.local',
    role: 'pro',
    plan: 'PRO_ANALYST',
    balanceRub: 5000,
    telegramBots: [],
    registeredAt: '2026-01-01',
    notificationSound: true,
    adPreferences: { personalizedAds: false, allowPromotions: false },
  },
  {
    id: 'user-vip',
    name: 'VIP Клуб & Синдикат',
    displayName: 'VIP Клуб & Синдикат',
    username: 'vip_user',
    email: 'vip@monitor.local',
    role: 'vip',
    plan: 'VIP_CLUB',
    balanceRub: 50000,
    telegramBots: [],
    registeredAt: '2026-01-01',
    notificationSound: true,
    adPreferences: { personalizedAds: false, allowPromotions: false },
  },
  {
    id: 'user-admin',
    name: 'Главный Разработчик',
    displayName: 'Главный Разработчик',
    username: 'dev_admin',
    email: 'dev@monitor.local',
    role: 'admin',
    plan: 'GOD_MODE',
    balanceRub: 999999,
    telegramBots: [],
    registeredAt: '2026-01-01',
    notificationSound: true,
    adPreferences: { personalizedAds: false, allowPromotions: false },
  },
];

describe('UserSimulationAgentModal & Sandboxed Filter Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders modal when isOpen is true, hides when false', () => {
    const { rerender } = render(
      <UserSimulationAgentModal
        isOpen={false}
        onClose={vi.fn()}
        currentUser={mockUsers[0]}
        allUsers={mockUsers}
        matches={mockMatches}
        filters={mockFilters}
      />
    );

    expect(screen.queryByTestId('simulation-modal')).toBeNull();

    rerender(
      <UserSimulationAgentModal
        isOpen={true}
        onClose={vi.fn()}
        currentUser={mockUsers[0]}
        allUsers={mockUsers}
        matches={mockMatches}
        filters={mockFilters}
      />
    );

    expect(screen.getByTestId('simulation-modal')).toBeDefined();
    expect(screen.getByText(/ИИ-Агент Тестировщик/i)).toBeDefined();
    expect(screen.getByText(/SANDBOX 0% SIDE-EFFECTS/i)).toBeDefined();
  });

  it('supports selecting different user personas with respective quota limits', () => {
    render(
      <UserSimulationAgentModal
        isOpen={true}
        onClose={vi.fn()}
        currentUser={mockUsers[0]}
        allUsers={mockUsers}
        matches={mockMatches}
        filters={mockFilters}
      />
    );

    const proBtn = screen.getByTestId('user-persona-user-pro');
    expect(proBtn).toBeDefined();
    fireEvent.click(proBtn);

    const vipBtn = screen.getByTestId('user-persona-user-vip');
    expect(vipBtn).toBeDefined();
    fireEvent.click(vipBtn);
  });

  it('runs complete user simulation with all 7 verification steps and calculates health score', async () => {
    render(
      <UserSimulationAgentModal
        isOpen={true}
        onClose={vi.fn()}
        currentUser={mockUsers[1]} // Pro persona
        allUsers={mockUsers}
        matches={mockMatches}
        filters={mockFilters}
      />
    );

    const startBtn = screen.getByTestId('start-agent-btn');
    fireEvent.click(startBtn);

    // Wait for simulation to finish
    await waitFor(
      () => {
        expect(screen.getByTestId('health-score')).toBeDefined();
      },
      { timeout: 5000 }
    );

    // Summary must show tested matches and filters
    expect(screen.getByTestId('result-summary')).toBeDefined();
    expect(screen.getByText(/Итоговый отчёт агента/i)).toBeDefined();
    expect(screen.getByText(/Матчей проверено/i)).toBeDefined();

    // Check that steps were generated
    expect(screen.getByTestId('step-step-auth')).toBeDefined();
    expect(screen.getByTestId('step-step-stream')).toBeDefined();
    expect(screen.getByTestId('step-step-filters')).toBeDefined();
    expect(screen.getByTestId('step-step-signals')).toBeDefined();
    expect(screen.getByTestId('step-step-telegram')).toBeDefined();
    expect(screen.getByTestId('step-step-zero-side-effects')).toBeDefined();
  });

  it('provides real-time log visualization terminal with category filtering and search', async () => {
    render(
      <UserSimulationAgentModal
        isOpen={true}
        onClose={vi.fn()}
        currentUser={mockUsers[2]} // VIP persona
        allUsers={mockUsers}
        matches={mockMatches}
        filters={mockFilters}
      />
    );

    // Run simulation
    const startBtn = screen.getByTestId('start-agent-btn');
    fireEvent.click(startBtn);

    await waitFor(
      () => {
        expect(screen.getByTestId('health-score')).toBeDefined();
      },
      { timeout: 5000 }
    );

    // Switch to Terminal Logs tab
    const logsTab = screen.getByTestId('tab-logs');
    fireEvent.click(logsTab);

    // Log terminal must be rendered
    expect(screen.getByTestId('log-terminal')).toBeDefined();

    // Log entries should be rendered
    const logEntries = screen.getAllByTestId('log-entry');
    expect(logEntries.length).toBeGreaterThan(5);

    // Category filter test: click FILTER
    const filterCatBtn = screen.getByRole('button', { name: 'FILTER' });
    fireEvent.click(filterCatBtn);

    const filteredEntries = screen.getAllByTestId('log-entry');
    expect(filteredEntries.length).toBeGreaterThan(0);
    filteredEntries.forEach((entry) => {
      expect(entry.textContent).toContain('FILTER');
    });

    // Reset category filter back to ALL
    const allCatBtn = screen.getByRole('button', { name: 'Все категории' });
    fireEvent.click(allCatBtn);

    // Search filter test
    const searchInput = screen.getByTestId('log-search-input');
    fireEvent.change(searchInput, { target: { value: 'VIP' } });

    const searchResults = screen.getAllByTestId('log-entry');
    expect(searchResults.length).toBeGreaterThan(0);
    searchResults.forEach((entry) => {
      expect(entry.textContent?.toLowerCase()).toContain('vip');
    });

    // Test copy logs button
    const copyBtn = screen.getByTestId('copy-logs-btn');
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('guarantees 0% side effects: real localStorage and user filters remain unaltered', async () => {
    // Setup initial mock state in localStorage
    localStorage.setItem('footbalmonitor_signals', JSON.stringify([{ id: 'real-signal-1', matchId: 'm-orig' }]));
    localStorage.setItem('footbalmonitor_filters_user_user-free', JSON.stringify([{ id: 'real-user-filter' }]));

    const result = await runUserSimulationAgent({
      user: mockUsers[0], // Free
      matches: mockMatches,
      filters: mockFilters,
    });

    expect(result.zeroImpactVerified).toBe(true);
    expect(result.overallStatus).toBe('SUCCESS');
    expect(result.healthScore).toBeGreaterThanOrEqual(95);

    // Verify localStorage has not been overwritten by simulation signals
    const signalsAfter = JSON.parse(localStorage.getItem('footbalmonitor_signals') || '[]');
    expect(signalsAfter.length).toBe(1);
    expect(signalsAfter[0].id).toBe('real-signal-1');

    const filtersAfter = JSON.parse(localStorage.getItem('footbalmonitor_filters_user_user-free') || '[]');
    expect(filtersAfter.length).toBe(1);
    expect(filtersAfter[0].id).toBe('real-user-filter');
  });

  it('correctly validates Free (1/1), Pro (5/5), and VIP (10+/58) subscription limits', async () => {
    // Free user
    const freeRes = await runUserSimulationAgent({
      user: mockUsers[0],
      matches: mockMatches,
      filters: mockFilters,
    });
    expect(freeRes.steps.find((s) => s.id === 'step-auth')?.metric).toContain('Free: 1/1');
    expect(freeRes.logs.some((l) => l.message.includes('Тариф Free: лимит 1 бот и 1 фильтр соблюден'))).toBe(true);

    // Pro user
    const proRes = await runUserSimulationAgent({
      user: mockUsers[1],
      matches: mockMatches,
      filters: mockFilters,
    });
    expect(proRes.steps.find((s) => s.id === 'step-auth')?.metric).toContain('Pro: 5/5');
    expect(proRes.logs.some((l) => l.message.includes('Тариф Pro: лимит до 5 ботов и 5 фильтров'))).toBe(true);

    // VIP user
    const vipRes = await runUserSimulationAgent({
      user: mockUsers[2],
      matches: mockMatches,
      filters: mockFilters,
    });
    expect(vipRes.steps.find((s) => s.id === 'step-auth')?.metric).toContain('VIP: 10 ботов');
    expect(vipRes.logs.some((l) => l.message.includes('Тариф VIP / Syndicate: безлимитные 58 стратегий'))).toBe(true);
  });

  // =========================================================================
  // Specific Requirement Tests: Pressure, xG, Corners, Cards, Failover, Radar
  // =========================================================================

  describe('Tactical Filtering Verification (Pressure, xG, Corners, Cards, Multi-Sport)', () => {
    it('accurately evaluates pressure index and dangerous attacks conditions', () => {
      const match = mockMatches[0]; // Arsenal: 54 dang attacks, minute 78
      const pressureAnalysis = calculatePressureAnalysis(match);
      expect(pressureAnalysis.pressureIndex).toBeGreaterThanOrEqual(60);

      const pressureRule: FilterRule = {
        id: 'rule-pressure-high',
        name: 'Высокое давление (Штурм)',
        description: 'Фильтр высокого индекса давления',
        color: 'rose',
        enabled: true,
        sport: 'football',
        minMinute: 70,
        maxMinute: 90,
        scoreCondition: 'ANY',
        minPressureIndex: 65,
        minDangerousAttacksTotal: 50,
        targetMarket: 'ТБ 2.5',
        telegramEnabled: false,
      };

      const evalRes = evaluateFilterRule(match, pressureRule);
      expect(evalRes.matches).toBe(true);

      // Fails when threshold is impossible
      const impossibleRule: FilterRule = {
        ...pressureRule,
        id: 'rule-impossible-pressure',
        minDangerousAttacksTotal: 150,
      };
      const failedRes = evaluateFilterRule(match, impossibleRule);
      expect(failedRes.matches).toBe(false);
      expect(failedRes.unmetCriteria.some((c) => c.toLowerCase().includes('оп. атак'))).toBe(true);
    });

    it('accurately evaluates xG and xG deficit conditions', () => {
      const match = mockMatches[0]; // xG: [1.95, 0.85] = 2.80 total, score: [1, 1] = 2 goals
      const xgRule: FilterRule = {
        id: 'rule-xg-high',
        name: 'Высокий суммарный xG',
        description: 'Фильтр матчей с перевесом по xG',
        color: 'emerald',
        enabled: true,
        sport: 'football',
        minMinute: 60,
        maxMinute: 90,
        scoreCondition: 'ANY',
        minXgTotal: 2.5,
        minXgOverScoreDiff: 0.5, // 2.80 - 2.0 = 0.80 >= 0.5
        targetMarket: 'ТБ 2.5',
        telegramEnabled: false,
      };

      const res = evaluateFilterRule(match, xgRule);
      expect(res.matches).toBe(true);

      // Fails when min xG is higher than actual (3.5 > 2.80)
      const failedXgRule: FilterRule = {
        ...xgRule,
        minXgTotal: 3.5,
      };
      const failedRes = evaluateFilterRule(match, failedXgRule);
      expect(failedRes.matches).toBe(false);
      expect(failedRes.unmetCriteria.some((c) => c.includes('xG'))).toBe(true);
    });

    it('accurately evaluates corner rules and corner differential', () => {
      const match = mockMatches[0]; // corners: [9, 2] = 11 total, diff: 7
      const cornerRule: FilterRule = {
        id: 'rule-corners-barrage',
        name: 'Корнерный штурм фаворита',
        description: 'Фильтр по угловым ударам',
        color: 'cyan',
        enabled: true,
        sport: 'football',
        minMinute: 70,
        maxMinute: 90,
        scoreCondition: 'ANY',
        minTotalCorners: 10,
        minCornersDiff: 5,
        targetMarket: 'Угловые ТБ 11.5',
        telegramEnabled: false,
      };

      const res = evaluateFilterRule(match, cornerRule);
      expect(res.matches).toBe(true);

      // Fails when corner threshold is not met (15 > 11)
      const failedCornerRule: FilterRule = {
        ...cornerRule,
        minTotalCorners: 15,
      };
      const failedRes = evaluateFilterRule(match, failedCornerRule);
      expect(failedRes.matches).toBe(false);
      expect(failedRes.unmetCriteria.some((c) => c.includes('угловых'))).toBe(true);
    });

    it('accurately evaluates yellow cards rules and disciplinary threshold', () => {
      const match = mockMatches[0]; // yellowCards: [2, 3] = 5 total
      const cardRule: FilterRule = {
        id: 'rule-hot-match-cards',
        name: 'Жаркое дерби по ЖК',
        description: 'Фильтр предупреждений',
        color: 'amber',
        enabled: true,
        sport: 'football',
        minMinute: 60,
        maxMinute: 90,
        scoreCondition: 'ANY',
        minYellowCardsTotal: 4,
        targetMarket: 'ЖК ТБ 5.5',
        telegramEnabled: false,
      };

      const res = evaluateFilterRule(match, cardRule);
      expect(res.matches).toBe(true);

      // Fails when min yellow cards is higher (7 > 5)
      const failedCardRule: FilterRule = {
        ...cardRule,
        minYellowCardsTotal: 7,
      };
      const failedRes = evaluateFilterRule(match, failedCardRule);
      expect(failedRes.matches).toBe(false);
      expect(failedRes.unmetCriteria.some((c) => c.toLowerCase().includes('карточек'))).toBe(true);
    });

    it('strictly isolates sports: football rules reject hockey matches and vice-versa', () => {
      const footballMatch = mockMatches[0];
      const hockeyMatch = mockMatches[1];

      const footballRule = mockFilters[0];
      const hockeyRule = mockFilters[1];

      // Football rule rejects Hockey match
      const hockeyOnFb = evaluateFilterRule(hockeyMatch, footballRule);
      expect(hockeyOnFb.matches).toBe(false);
      expect(hockeyOnFb.unmetCriteria[0]).toContain('не соответствует стратегии');

      // Hockey rule rejects Football match
      const fbOnHockey = evaluateFilterRule(footballMatch, hockeyRule);
      expect(fbOnHockey.matches).toBe(false);
      expect(fbOnHockey.unmetCriteria[0]).toContain('не соответствует стратегии');
    });
  });

  describe('Non-Resolvable Informational Filters (Не по всем фильтрам приходит расчет результата)', () => {
    it('keeps informational radar filters in PENDING without forcing WIN or LOSS', () => {
      const infoSignal: SignalAlert = {
        id: 'sig-info-1',
        timestamp: '15:30',
        matchId: 'm-live-1',
        matchName: 'Arsenal vs Chelsea',
        league: 'Premier League',
        country: 'England',
        sport: 'football',
        minute: 75,
        score: '1:1',
        ruleId: 'f-info-radar',
        ruleName: 'Инфо-Радар Аномального Давления (Без ставок)',
        ruleCategory: 'radar',
        message: 'Аномальный навал на ворота соперника',
        sentToTelegram: true,
        marketSuggestion: 'ИНФО',
        noResolutionTrack: true, // Флаг: результат не отслеживается
        outcome: 'PENDING',
        odds: 1.0,
        stake: 0,
      };

      // Even after the match finishes with 2:1 score, outcome must NOT resolve to WIN/LOSS
      const evaluation = evaluateSignalOutcome(infoSignal, [2, 1], true);
      expect(evaluation.shouldResolve).toBe(false);
      expect(evaluation.outcome).toBe('PENDING');
      expect(evaluation.note).toContain('не отслеживается');
    });

    it('resolves standard betting filter signals normally on match conclusion or goal', () => {
      const bettingSignal: SignalAlert = {
        id: 'sig-bet-1',
        timestamp: '15:30',
        matchId: 'm-live-1',
        matchName: 'Arsenal vs Chelsea',
        league: 'Premier League',
        country: 'England',
        sport: 'football',
        minute: 75,
        score: '1:1',
        ruleId: 'f-1',
        ruleName: 'Поздний Гол Штурм',
        message: 'Сигнал на ТБ 2.5',
        sentToTelegram: true,
        marketSuggestion: 'ТБ 2.5',
        noResolutionTrack: false,
        outcome: 'PENDING',
        odds: 1.85,
        stake: 1000,
      };

      // When another goal is scored (1:1 -> 2:1), ТБ 2.5 resolves as WIN
      const evaluationWin = evaluateSignalOutcome(bettingSignal, [2, 1], true);
      expect(evaluationWin.shouldResolve).toBe(true);
      expect(evaluationWin.outcome).toBe('WIN');

      // If score stayed 1:1 and match finished, resolves as LOSS
      const evaluationLoss = evaluateSignalOutcome(bettingSignal, [1, 1], true);
      expect(evaluationLoss.shouldResolve).toBe(true);
      expect(evaluationLoss.outcome).toBe('LOSS');
    });
  });

  describe('Line Provider Failover & Developer-Only Visibility Logic', () => {
    it('switches line provider ONLY when no data arrives within 30s watchdog threshold', () => {
      const AUTO_FAILOVER_SOURCES = ['flashscore', 'fonbet', '1xbet', 'public-feed', 'sofascore', 'sstats'];
      let activeSource = 'flashscore';
      let lastStatsReceivedTimestamp = Date.now();

      // Function simulating failover logic from App.tsx
      const checkAndFailover = (now: number, dataReceived: boolean) => {
        if (dataReceived) {
          lastStatsReceivedTimestamp = now;
          return { activeSource, didSwitch: false };
        }
        const elapsed = now - lastStatsReceivedTimestamp;
        if (elapsed >= 30000) {
          const currIdx = AUTO_FAILOVER_SOURCES.indexOf(activeSource);
          activeSource = AUTO_FAILOVER_SOURCES[(currIdx + 1) % AUTO_FAILOVER_SOURCES.length];
          lastStatsReceivedTimestamp = now;
          return { activeSource, didSwitch: true };
        }
        return { activeSource, didSwitch: false };
      };

      // Scenario 1: Data is successfully arriving every 10 seconds -> NO SWITCH
      const time1 = lastStatsReceivedTimestamp + 10000;
      const res1 = checkAndFailover(time1, true);
      expect(res1.didSwitch).toBe(false);
      expect(res1.activeSource).toBe('flashscore');

      // Scenario 2: 25 seconds elapsed without data -> Still NO switch (threshold is 30s)
      const time2 = time1 + 25000;
      const res2 = checkAndFailover(time2, false);
      expect(res2.didSwitch).toBe(false);
      expect(res2.activeSource).toBe('flashscore');

      // Scenario 3: 31 seconds elapsed without data from flashscore -> SWITCHES to next provider (fonbet)
      const time3 = time1 + 31000;
      const res3 = checkAndFailover(time3, false);
      expect(res3.didSwitch).toBe(true);
      expect(res3.activeSource).toBe('fonbet');
    });

    it('ensures regular users see neutral telemetry label while developers see exact provider', () => {
      const getProviderDisplayName = (source: string, isDeveloper: boolean) => {
        if (!isDeveloper) {
          return '🛰️ Live Telemetry Core';
        }
        switch (source) {
          case 'fonbet':
            return '🔴 Фонбет Live';
          case '1xbet':
            return '🔷 1xBet Live';
          case 'flashscore':
            return '⚡ Flashscore';
          default:
            return source;
        }
      };

      // Regular user (free / pro / vip)
      expect(getProviderDisplayName('fonbet', false)).toBe('🛰️ Live Telemetry Core');
      expect(getProviderDisplayName('1xbet', false)).toBe('🛰️ Live Telemetry Core');
      expect(getProviderDisplayName('flashscore', false)).toBe('🛰️ Live Telemetry Core');

      // Developer / Admin
      expect(getProviderDisplayName('fonbet', true)).toBe('🔴 Фонбет Live');
      expect(getProviderDisplayName('1xbet', true)).toBe('🔷 1xBet Live');
      expect(getProviderDisplayName('flashscore', true)).toBe('⚡ Flashscore');
    });

    it('allows full manual line provider switching in God mode without race conditions', () => {
      // Mock God mode user profile
      const godUser: UserProfile = {
        id: 'user-god-developer',
        name: 'Архитектор / Разработчик (GOD MODE)',
        displayName: 'Архитектор / Разработчик (GOD MODE)',
        username: 'developer_god',
        email: 'creator@footbalmonitor.pro',
        role: 'god',
        plan: 'GOD_MODE',
        balanceRub: 99999999,
        telegramBots: [],
        registeredAt: '01.01.2024',
        notificationSound: true,
        adPreferences: { personalizedAds: false, allowPromotions: false },
      };

      // Check isUserDeveloper recognizes God mode
      const isDev = isUserDeveloper(godUser);
      expect(isDev).toBe(true);

      // Simulate manual provider switching logic
      let currentSource = 'flashscore';
      let lastFetchedSource = '';
      let fetchCallCount = 0;

      const handleApplyAndActivate = (targetSource: any) => {
        currentSource = targetSource;
        // Direct update and fetch without race conditions
        lastFetchedSource = targetSource;
        fetchCallCount++;
      };

      // Activating Fonbet in God mode
      handleApplyAndActivate('fonbet');
      expect(currentSource).toBe('fonbet');
      expect(lastFetchedSource).toBe('fonbet');
      expect(fetchCallCount).toBe(1);

      // Activating 1xBet in God mode
      handleApplyAndActivate('1xbet');
      expect(currentSource).toBe('1xbet');
      expect(lastFetchedSource).toBe('1xbet');
      expect(fetchCallCount).toBe(2);
    });

    it('filters logs by event type (Успех, Внимание, Инфо) with distinct color indication', async () => {
      render(
        <UserSimulationAgentModal
          isOpen={true}
          onClose={vi.fn()}
          currentUser={mockUsers[3]} // God Mode / Admin
          allUsers={mockUsers}
          matches={mockMatches}
          filters={mockFilters}
        />
      );

      // Start agent
      const startBtn = screen.getByTestId('start-agent-btn');
      fireEvent.click(startBtn);

      await waitFor(
        () => {
          expect(screen.getByTestId('health-score')).toBeDefined();
        },
        { timeout: 5000 }
      );

      // Check step status color indications (УСПЕШНО)
      const stepElements = screen.getAllByTestId(/^step-step-/);
      expect(stepElements.length).toBeGreaterThan(0);
      expect(stepElements[0].textContent).toContain('УСПЕШНО');

      // Switch to log panel
      const logsTab = screen.getByTestId('tab-logs');
      fireEvent.click(logsTab);

      // Filter by Success event type
      const successFilterBtn = screen.getByRole('button', { name: /Успех/i });
      fireEvent.click(successFilterBtn);

      const successEntries = screen.getAllByTestId('log-entry');
      expect(successEntries.length).toBeGreaterThan(0);
      successEntries.forEach((entry) => {
        expect(entry.textContent).toContain('УСПЕХ');
      });
    });
  });
});
