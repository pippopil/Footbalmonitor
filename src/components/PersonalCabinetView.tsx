import React, { useState } from 'react';
import {
  User,
  Bot,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Send,
  Eye,
  EyeOff,
  Shield,
  Crown,
  Wallet,
  TrendingUp,
  Activity,
  Layers,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Users,
  Settings,
  Bell,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Zap,
  Scale,
  Flame,
  ArrowRight,
  LogOut,
  Gift,
  Share2,
  FileText,
  Clock,
  Database,
  Globe,
  Star,
  RotateCcw,
} from 'lucide-react';
import { UserProfile, TelegramBotProfile, FilterRule, AdBannerItem, DataSourceType, DataSourceConfig } from '../types';
import { SubscriptionPaymentModal } from './SubscriptionPaymentModal';

interface PersonalCabinetViewProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onUpdateCurrentUser: (updated: UserProfile) => void;
  onCreateUser: (newUser: UserProfile) => void;
  userFilters: FilterRule[];
  onNavigateToFilters: () => void;
  onSendTestBotMessage: (bot: TelegramBotProfile) => Promise<{ ok: boolean; messageId?: number; error?: string }>;
  ads?: AdBannerItem[];
  onSaveFilters?: (filters: FilterRule[]) => void;
  onOpenFilterModal?: (filter?: FilterRule) => void;
  currentTheme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onSetTheme?: (theme: 'dark' | 'light') => void;
  onLogout?: () => void;
  dataSourceConfig?: DataSourceConfig;
  onSwitchDataSource?: (source: DataSourceType) => void;
  onOpenDataSourcesModal?: () => void;
  onRestoreAllStrategies?: () => void;
}

export const PersonalCabinetView: React.FC<PersonalCabinetViewProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  onUpdateCurrentUser,
  onCreateUser,
  userFilters,
  onNavigateToFilters,
  onSendTestBotMessage,
  ads = [],
  onSaveFilters,
  onOpenFilterModal,
  currentTheme = 'dark',
  onToggleTheme,
  onSetTheme,
  onLogout,
  dataSourceConfig,
  onSwitchDataSource,
  onOpenDataSourcesModal,
  onRestoreAllStrategies,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'bots' | 'plans' | 'datasources' | 'ads' | 'users' | 'profile' | 'referral'>('bots');
  const [dataSourceSavedToast, setDataSourceSavedToast] = useState<string | null>(null);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [testingBotId, setTestingBotId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ botId: string; ok: boolean; message: string } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [paymentModalPlan, setPaymentModalPlan] = useState<'PRO_ANALYST' | 'VIP_CLUB' | null>(null);

  // Subscription days remaining and 3-day reminder calculation
  const daysLeft = React.useMemo(() => {
    if (currentUser.plan === 'FREE' || currentUser.role === 'god') return null;
    const expiryStr = currentUser.subscriptionDetails?.expiresAt || currentUser.planExpiresAt;
    if (!expiryStr) return null;
    const expiryDate = new Date(expiryStr);
    const diffTime = expiryDate.getTime() - Date.now();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [currentUser.plan, currentUser.planExpiresAt, currentUser.subscriptionDetails]);

  // New Bot Form State
  const [isAddingBot, setIsAddingBot] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [newBotToken, setNewBotToken] = useState('');
  const [newBotChatId, setNewBotChatId] = useState('');
  const [newBotIsDefault, setNewBotIsDefault] = useState(false);

  // Edit Bot State
  const [editingBotId, setEditingBotId] = useState<string | null>(null);
  const [confirmDeleteBotId, setConfirmDeleteBotId] = useState<string | null>(null);

  // New User Form State
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPlan, setNewUserPlan] = useState<'FREE' | 'PRO_ANALYST' | 'VIP_CLUB'>('PRO_ANALYST');

  // Max bots allowed based on user tier (FREE = 1 bot, PRO = 5 bots, VIP = 15 bots, GOD = 999 bots)
  const maxBotsAllowed = React.useMemo(() => {
    if (currentUser.role === 'god' || currentUser.plan === 'GOD_MODE') return 999;
    if (currentUser.plan === 'FREE') return 1;
    if (currentUser.plan === 'PRO_ANALYST') return 5;
    return 15; // VIP_CLUB
  }, [currentUser.plan, currentUser.role]);

  // Count filters bound to each bot
  const botFilterCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    const defaultBot = currentUser.telegramBots.find((b) => b.isDefault) || currentUser.telegramBots[0];

    userFilters.forEach((f) => {
      if (f.botId) {
        counts[f.botId] = (counts[f.botId] || 0) + 1;
      } else if (f.customBotToken) {
        counts['custom'] = (counts['custom'] || 0) + 1;
      } else if (defaultBot) {
        counts[defaultBot.id] = (counts[defaultBot.id] || 0) + 1;
      }
    });
    return counts;
  }, [userFilters, currentUser.telegramBots]);

  // Handle Add Bot
  const handleAddBot = (e: React.FormEvent) => {
    e.preventDefault();

    // Check plan bot limit
    if (currentUser.telegramBots.length >= maxBotsAllowed) {
      if (currentUser.plan === 'FREE') {
        setShowUpgradeModal(true);
        return;
      } else {
        alert(`На вашем тарифе (${currentUser.plan}) доступно подключение до ${maxBotsAllowed} ботов. Для дальнейшего расширения перейдите на VIP.`);
        return;
      }
    }

    if (!newBotName.trim() || !newBotToken.trim() || !newBotChatId.trim()) {
      alert('Заполните название бота, токен от @BotFather и Chat ID / @канал.');
      return;
    }

    const newBot: TelegramBotProfile = {
      id: `bot-${Date.now()}`,
      name: newBotName.trim(),
      botToken: newBotToken.trim(),
      channelId: newBotChatId.trim(),
      isDefault: newBotIsDefault || currentUser.telegramBots.length === 0,
      active: true,
      status: 'untested',
      createdAt: new Date().toLocaleDateString('ru-RU'),
    };

    let updatedBots = [...currentUser.telegramBots];
    if (newBot.isDefault) {
      updatedBots = updatedBots.map((b) => ({ ...b, isDefault: false }));
    }
    updatedBots.push(newBot);

    onUpdateCurrentUser({
      ...currentUser,
      telegramBots: updatedBots,
    });

    setNewBotName('');
    setNewBotToken('');
    setNewBotChatId('');
    setNewBotIsDefault(false);
    setIsAddingBot(false);
  };

  // Handle Delete Bot without modal confirm blocking iframe
  const handleDeleteBot = (botId: string) => {
    const updated = currentUser.telegramBots.filter((b) => b.id !== botId);
    if (updated.length > 0 && !updated.some((b) => b.isDefault)) {
      updated[0].isDefault = true;
    }

    const updatedUser = {
      ...currentUser,
      telegramBots: updated,
    };

    onUpdateCurrentUser(updatedUser);

    // Also unbind any filters attached to this bot and persist
    if (onSaveFilters && userFilters.some((f) => f.botId === botId)) {
      const updatedFilters = userFilters.map((f) =>
        f.botId === botId ? { ...f, botId: undefined } : f
      );
      onSaveFilters(updatedFilters);
    }

    setConfirmDeleteBotId(null);
  };

  // Set Default Bot
  const handleSetDefaultBot = (botId: string) => {
    const updated = currentUser.telegramBots.map((b) => ({
      ...b,
      isDefault: b.id === botId,
    }));
    onUpdateCurrentUser({
      ...currentUser,
      telegramBots: updated,
    });
  };

  // Test Telegram Bot
  const handleTestBot = async (bot: TelegramBotProfile) => {
    setTestingBotId(bot.id);
    setTestResult(null);

    try {
      const res = await onSendTestBotMessage(bot);
      if (res.ok) {
        setTestResult({
          botId: bot.id,
          ok: true,
          message: `Успешно отправлено в Telegram! Message ID: #${res.messageId}`,
        });
        // Update verified status
        const updatedBots = currentUser.telegramBots.map((b) =>
          b.id === bot.id ? { ...b, status: 'verified' as const, lastPing: new Date().toLocaleTimeString('ru-RU') } : b
        );
        onUpdateCurrentUser({ ...currentUser, telegramBots: updatedBots });
      } else {
        setTestResult({
          botId: bot.id,
          ok: false,
          message: res.error || 'Ошибка проверки Telegram',
        });
      }
    } catch (err: any) {
      setTestResult({
        botId: bot.id,
        ok: false,
        message: err?.message || 'Сетевая ошибка',
      });
    } finally {
      setTestingBotId(null);
    }
  };

  // Handle Create User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      username: newUserName.trim().toLowerCase().replace(/\s+/g, '_'),
      displayName: newUserName.trim(),
      email: newUserEmail.trim() || `${newUserName.trim().toLowerCase()}@footbalmonitor.pro`,
      role: newUserPlan === 'VIP_CLUB' ? 'vip' : newUserPlan === 'PRO_ANALYST' ? 'pro' : 'user',
      plan: newUserPlan,
      registeredAt: new Date().toLocaleDateString('ru-RU'),
      balanceRub: newUserPlan === 'VIP_CLUB' ? 100000 : 25000,
      notificationSound: true,
      adPreferences: {
        showBanners: newUserPlan === 'FREE',
        compactAds: true,
      },
      telegramBots: [
        {
          id: `bot-def-${Date.now()}`,
          name: '🤖 Основной Telegram-бот',
          botToken: '',
          channelId: '',
          isDefault: true,
          active: true,
          status: 'untested',
          createdAt: new Date().toLocaleDateString('ru-RU'),
        },
      ],
      stats: {
        totalSignalsGenerated: 0,
        winRate: 0,
        signalsToday: 0,
      },
    };

    onCreateUser(newUser);
    setIsCreatingUser(false);
    setNewUserName('');
    setNewUserEmail('');
  };

  const handleTogglePreferredDataSource = (sourceId: DataSourceType) => {
    const currentList = currentUser.preferredDataSources || ['flashscore', 'public-feed', 'sofascore'];
    const exists = currentList.includes(sourceId);
    let updatedList: DataSourceType[];
    if (exists) {
      if (currentList.length === 1) {
        alert('В списке предпочтительных должен оставаться хотя бы один источник.');
        return;
      }
      updatedList = currentList.filter((s) => s !== sourceId);
    } else {
      updatedList = [...currentList, sourceId];
    }

    let updatedDefault = currentUser.defaultDataSource || 'flashscore';
    if (!updatedList.includes(updatedDefault)) {
      updatedDefault = updatedList[0];
    }

    const updatedUser: UserProfile = {
      ...currentUser,
      preferredDataSources: updatedList,
      defaultDataSource: updatedDefault,
    };
    onUpdateCurrentUser(updatedUser);
    setDataSourceSavedToast(`Список избранных источников обновлен (${updatedList.length} выбрано)`);
    setTimeout(() => setDataSourceSavedToast(null), 3000);
  };

  const handleSetDefaultDataSource = (sourceId: DataSourceType) => {
    const currentList = currentUser.preferredDataSources || ['flashscore', 'public-feed', 'sofascore'];
    const updatedList = currentList.includes(sourceId) ? currentList : [...currentList, sourceId];

    const updatedUser: UserProfile = {
      ...currentUser,
      preferredDataSources: updatedList,
      defaultDataSource: sourceId,
    };
    onUpdateCurrentUser(updatedUser);
    if (onSwitchDataSource) {
      onSwitchDataSource(sourceId);
    }
    setDataSourceSavedToast(`Основной источник по умолчанию установлен: ${sourceId}`);
    setTimeout(() => setDataSourceSavedToast(null), 3500);
  };

  const renderDataSourcesSection = () => {
    const preferredList = currentUser.preferredDataSources || ['flashscore', 'public-feed', 'sofascore'];
    const currentDefault = currentUser.defaultDataSource || (preferredList[0] || 'flashscore');

    const PROVIDERS: Array<{
      id: DataSourceType;
      name: string;
      tag: string;
      icon: string;
      desc: string;
      latency: string;
      badge: string;
      badgeColor: string;
    }> = [
      {
        id: 'flashscore',
        name: 'Flashscore Live',
        tag: 'Парсер мобильных зеркал',
        icon: '⚡',
        desc: 'Быстрый парсинг мобильных зеркал Flashscore / Flashres. Минимальная задержка, все футбольные лиги мира.',
        latency: '~150 ms',
        badge: 'Рекомендуется',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      },
      {
        id: 'fonbet',
        name: 'Фонбет Live (РФ Линия)',
        tag: 'Легальная линия РФ',
        icon: '🔴',
        desc: 'Официальная live-роспись БК Фонбет с реальными коэффициентами на исходы, тоталы и форы в реальном времени.',
        latency: '~120 ms',
        badge: 'Точные кэфы',
        badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
      },
      {
        id: '1xbet',
        name: '1xBet Live',
        tag: 'Широкая роспись',
        icon: '🔷',
        desc: 'Глубокая роспись статистики: детальные удары в створ, опасные атаки, угловые и желтые карточки в лайве.',
        latency: '~180 ms',
        badge: 'Угловые & ЖК',
        badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      },
      {
        id: 'sofascore',
        name: 'Sofascore Live',
        tag: 'Relay без VPN',
        icon: '⚽',
        desc: 'Браузерный релей без блокировок. Мгновенные расчетные xG, тепловые карты атак и динамика опасности.',
        latency: '~210 ms',
        badge: 'xG Модель',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      },
      {
        id: 'sstats',
        name: 'SStats.net API',
        tag: 'Официальный API',
        icon: '📊',
        desc: 'Профессиональный коммерческий REST API спортивной статистики. Гарантированный SLA 99.9% и стабильность.',
        latency: '~90 ms',
        badge: 'API Key',
        badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      },
      {
        id: 'public-feed',
        name: 'Public Feed (ESPN)',
        tag: 'Открытый фид',
        icon: '🌐',
        desc: 'Бесплатный публичный поток данных топ-чемпионатов Европы (АПЛ, Ла Лига, Серия А, Бундеслига, ЛЧ).',
        latency: '~250 ms',
        badge: 'Без VPN',
        badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      },
      {
        id: 'api-football',
        name: 'API-Football (v3)',
        tag: 'RapidAPI Fixtures',
        icon: '⚡',
        desc: 'Полнофункциональный шлюз API-Football v3 с расширенной росписью событий и таймлайном матча.',
        latency: '~140 ms',
        badge: 'v3 Global',
        badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      },
      {
        id: 'football-data',
        name: 'Football-Data.org',
        tag: 'Европейский реестр',
        icon: '🏆',
        desc: 'Синхронизация с официальными матчами и турнирными таблицами европейских футбольных ассоциаций.',
        latency: '~220 ms',
        badge: 'UEFA Focus',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      },
      {
        id: 'webhook',
        name: 'Пользовательский Webhook',
        tag: 'Ingest API / Скрипты',
        icon: '🔌',
        desc: 'Прием входящих JSON-пакетов от ваших собственных парсеров или серверов (POST /api/feed/ingest).',
        latency: '< 50 ms',
        badge: 'Кастомный',
        badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
      },
      {
        id: 'simulated',
        name: 'Демо-генератор',
        tag: 'Тестовая песочница',
        icon: '🎮',
        desc: 'Генератор реалистичных матчей для безопасного тестирования сигналов, отладки ботов и проверки стратегий.',
        latency: 'Локально',
        badge: 'Песочница',
        badgeColor: 'bg-slate-700/40 text-slate-400 border-slate-600/40',
      },
    ];

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white">
                  Предпочтительные источники данных (Data Providers)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {preferredList.length} активно в профиле
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Отметьте любимые провайдеры телеметрии и назначьте основной источник. При авторизации профиль автоматически загрузит выбранную линию.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenDataSourcesModal && (
              <button
                type="button"
                onClick={onOpenDataSourcesModal}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
              >
                <Globe className="h-3.5 w-3.5 text-cyan-400" />
                <span>Диагностика & Ключи</span>
              </button>
            )}
          </div>
        </div>

        {dataSourceSavedToast && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-fadeIn font-semibold shadow-lg">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{dataSourceSavedToast}</span>
          </div>
        )}

        {/* Current Default Banner */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-xl">
              {PROVIDERS.find((p) => p.id === currentDefault)?.icon || '🛰️'}
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Основной источник по умолчанию для вашего профиля:</div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{PROVIDERS.find((p) => p.id === currentDefault)?.name || currentDefault}</span>
                <span className="px-2 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  По умолчанию
                </span>
                {dataSourceConfig?.activeSource === currentDefault && (
                  <span className="px-2 py-0.2 rounded text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                    Сейчас в эфире
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Сохраняется в профиле <strong className="text-slate-200">{currentUser.displayName}</strong>
          </div>
        </div>

        {/* Providers Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {PROVIDERS.map((provider) => {
            const isPreferred = preferredList.includes(provider.id);
            const isDefault = currentDefault === provider.id;
            const isCurrentlyActiveInScanner = dataSourceConfig?.activeSource === provider.id;

            return (
              <div
                key={provider.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  isDefault
                    ? 'bg-gradient-to-br from-slate-900 via-cyan-950/20 to-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-500/40'
                    : isPreferred
                    ? 'bg-slate-900/90 border-slate-700 hover:border-slate-600'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-70 hover:opacity-100 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{provider.icon}</span>
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-1.5">
                          <span>{provider.name}</span>
                          {isDefault && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                              ★ Основной
                            </span>
                          )}
                          {isCurrentlyActiveInScanner && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              В эфире
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {provider.tag} • Задержка {provider.latency}
                        </div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${provider.badgeColor}`}>
                      {provider.badge}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {provider.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleTogglePreferredDataSource(provider.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                      isPreferred
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                    title={isPreferred ? 'Убрать из избранных' : 'Добавить в избранные'}
                  >
                    {isPreferred ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>В избранном</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        <span>В избранное</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    {!isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultDataSource(provider.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-600/30 text-slate-300 hover:text-cyan-200 border border-slate-700 hover:border-cyan-500/40 text-xs font-semibold transition"
                        title="Назначить источником по умолчанию для профиля"
                      >
                        Сделать основным
                      </button>
                    )}
                    {onSwitchDataSource && !isCurrentlyActiveInScanner && (
                      <button
                        type="button"
                        onClick={() => {
                          onSwitchDataSource(provider.id);
                          setDataSourceSavedToast(`Линия сканера переключена на ${provider.name}`);
                          setTimeout(() => setDataSourceSavedToast(null), 3000);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition"
                        title="Переключить сканер на этот источник сейчас"
                      >
                        Включить сейчас
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div id="personal-cabinet-container" className="space-y-6">
      {/* User Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold text-xl border-2 border-emerald-400/40">
                  {currentUser.displayName.charAt(0)}
                </div>
              )}
              {currentUser.plan === 'VIP_CLUB' && (
                <div className="absolute -top-1.5 -right-1.5 p-1 bg-amber-500 rounded-full text-slate-950 shadow">
                  <Crown className="h-3.5 w-3.5" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {currentUser.displayName}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase flex items-center gap-1 ${
                    currentUser.role === 'god' || currentUser.plan === 'GOD_MODE'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-sm shadow-purple-950/60'
                      : currentUser.plan === 'VIP_CLUB'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : currentUser.plan === 'PRO_ANALYST'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {currentUser.role === 'god' ? (
                    <>
                      <Zap className="h-3 w-3 text-purple-400" />
                      <span>GOD MODE (Разработчик)</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-3 w-3" />
                      <span>
                        {currentUser.plan === 'VIP_CLUB'
                          ? 'VIP Syndicate'
                          : currentUser.plan === 'PRO_ANALYST'
                          ? 'PRO Analyst'
                          : 'Free Tier'}
                      </span>
                    </>
                  )}
                </span>
                <span className="text-xs text-slate-500">@{currentUser.username}</span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                <span>Email: <strong className="text-slate-200">{currentUser.email}</strong></span>
                <span>Регистрация: <strong className="text-slate-200">{currentUser.registeredAt}</strong></span>
                <span>
                  {currentUser.role === 'god' ? 'Банк Создателя: ' : 'Демо-банк: '}
                  <strong className="text-emerald-400">
                    {currentUser.balanceRub.toLocaleString('ru-RU')} ₽
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics & User Switcher Trigger */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2 text-center">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Винрейт</div>
              <div className="text-sm font-bold text-emerald-400">{currentUser.stats.winRate}%</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2 text-center">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Сигналов</div>
              <div className="text-sm font-bold text-slate-200">{currentUser.stats.totalSignalsGenerated}</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2 text-center">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Ботов в сети</div>
              <div className="text-sm font-bold text-cyan-400">{currentUser.telegramBots.length}</div>
            </div>

            <a
              href="/docs/INVESTMENT_DECK_AND_CARDS_MANUAL.doc"
              download="INVESTMENT_DECK_AND_CARDS_MANUAL.doc"
              className="px-3.5 py-2 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              title="Скачать инвест-меморандум, финансовую модель и паспорт всех 50 карточек (.doc для печати)"
            >
              <FileText className="h-3.5 w-3.5 text-emerald-400" />
              <span>Инвест-документ (.doc)</span>
            </a>

            <button
              onClick={() => setActiveSubTab('users')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
            >
              <Users className="h-3.5 w-3.5 text-cyan-400" />
              <span>Сменить профиль</span>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                title="Выйти из аккаунта и заблокировать интерфейс"
              >
                <LogOut className="h-3.5 w-3.5 text-red-400" />
                <span>Выйти</span>
              </button>
            )}
          </div>
        </div>

        {/* Isolation Guarantee Notice */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              <strong>Изолированное пространство:</strong> Ваши фильтры ({userFilters.length} шт.) и боты настроены только для аккаунта <strong>{currentUser.displayName}</strong> и не влияют на других пользователей.
            </span>
          </div>
          <button
            onClick={onNavigateToFilters}
            className="text-emerald-400 hover:text-emerald-300 font-bold underline text-xs shrink-0"
          >
            Перейти к фильтрам →
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('bots')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
            activeSubTab === 'bots'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Bot className="h-4 w-4" />
          <span>Мои Telegram-боты ({currentUser.telegramBots.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('datasources')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
            activeSubTab === 'datasources'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/40'
              : 'bg-slate-900/60 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30'
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Источники данных ({currentUser.preferredDataSources?.length || 3})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('plans')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
            activeSubTab === 'plans'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Shield className="h-4 w-4 text-emerald-400" />
          <span>Тарифы: FREE vs PRO</span>
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
            activeSubTab === 'users'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Пользователи и профили ({allUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ads')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
            activeSubTab === 'ads'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>Реклама & Партнёры</span>
        </button>

        <button
          onClick={() => setActiveSubTab('profile')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
            activeSubTab === 'profile'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Настройки</span>
        </button>

        <button
          onClick={() => setActiveSubTab('referral')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
            activeSubTab === 'referral'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-950/40'
              : 'bg-slate-900/60 text-amber-400 hover:text-amber-300 border border-amber-500/30'
          }`}
        >
          <Gift className="h-4 w-4" />
          <span>Приведи друга (Бонусы)</span>
        </button>
      </div>

      {/* SUB-TAB 1: TELEGRAM BOTS MANAGEMENT */}
      {activeSubTab === 'bots' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Bot className="h-5 w-5 text-cyan-400" />
                Сетка привязанных Telegram-ботов
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentUser.plan === 'FREE'
                  ? 'Тариф FREE: подключение 1 бота с мгновенной отправкой без задержек. В PRO доступно до 5 ботов.'
                  : 'Тариф PRO: вы можете подключить до 5 ботов и распределить разные стратегии по отдельным каналам.'}
              </p>
            </div>

            <button
              onClick={() => {
                if (currentUser.telegramBots.length >= maxBotsAllowed) {
                  if (currentUser.plan === 'FREE') {
                    setShowUpgradeModal(true);
                    return;
                  } else {
                    alert(`На вашем тарифе (${currentUser.plan}) доступно подключение до ${maxBotsAllowed} ботов. Для расширения сетки перейдите на VIP.`);
                    return;
                  }
                }
                setIsAddingBot(!isAddingBot);
              }}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition active:scale-95 shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>{isAddingBot ? 'Закрыть форму' : '+ Добавить бота'}</span>
            </button>
          </div>

          {/* Strategy Recovery Banner if user deleted all strategies */}
          {userFilters.length === 0 && onRestoreAllStrategies && (
            <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <RotateCcw className="h-4 w-4 text-amber-400" />
                  <span>У вас не сохранено ни одной стратегии (были случайно удалены)</span>
                </div>
                <p className="text-xs text-slate-300">
                  Вы можете в 1 клик восстановить полный заводской каталог платформы из 50+ проверенных алгоритмов (ТБ, карточки, угловые, камбэки, Smart Money).
                </p>
              </div>
              <button
                type="button"
                onClick={onRestoreAllStrategies}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shrink-0 active:scale-95 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Восстановить все 50+ стратегий</span>
              </button>
            </div>
          )}

          {/* Plan & Bot Capacity Notice */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/70 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${currentUser.plan === 'FREE' ? 'bg-slate-800 text-slate-300' : 'bg-emerald-500/20 text-emerald-400'}`}>
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white">
                    Подключено ботов: <strong className="text-emerald-400">{currentUser.telegramBots.length} из {maxBotsAllowed}</strong>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    currentUser.plan === 'FREE'
                      ? 'bg-slate-800 text-slate-300 border border-slate-700'
                      : currentUser.plan === 'PRO_ANALYST'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {currentUser.plan === 'FREE' ? 'Тариф FREE (1 бот)' : currentUser.plan === 'PRO_ANALYST' ? 'Тариф PRO (до 5 ботов)' : 'Тариф VIP (до 15 ботов)'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> 0 секунд задержки
                  </span>
                  <span>— мгновенная отправка сигналов в реальном времени! Полный функционал фильтров в ручном режиме.</span>
                </p>
              </div>
            </div>

            {currentUser.plan === 'FREE' ? (
              <button
                type="button"
                onClick={() => setActiveSubTab('plans')}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md transition active:scale-95 shrink-0 flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>До 5 ботов на разные фильтры (PRO) →</span>
              </button>
            ) : (
              <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl shrink-0">
                ⭐ PRO-режим: до 5 ботов активны
              </span>
            )}
          </div>

          {/* Test Result Notification */}
          {testResult && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                testResult.ok
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {testResult.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
              <button
                onClick={() => setTestResult(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {/* Add Bot Form */}
          {isAddingBot && (
            <form
              onSubmit={handleAddBot}
              className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-5 space-y-4 shadow-xl shadow-cyan-950/20 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="h-4 w-4 text-cyan-400" />
                  Подключение нового Telegram бота
                </h3>
                <span className="text-[11px] text-slate-400">
                  Создайте бота в @BotFather за 1 минуту
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Название бота / канала:
                  </label>
                  <input
                    type="text"
                    value={newBotName}
                    onChange={(e) => setNewBotName(e.target.value)}
                    placeholder="Например: 🚩 Угловые & Тоталы VIP"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    required
                  />
                  <p className="text-[10px] text-slate-500">
                    Понятное имя для выбора в настройках фильтров
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Bot Token (@BotFather):
                  </label>
                  <input
                    type="text"
                    value={newBotToken}
                    onChange={(e) => setNewBotToken(e.target.value)}
                    placeholder="7123456789:AAEjK..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    required
                  />
                  <p className="text-[10px] text-slate-500">
                    Токен доступа HTTP API бота
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Chat ID или @канал:
                  </label>
                  <input
                    type="text"
                    value={newBotChatId}
                    onChange={(e) => setNewBotChatId(e.target.value)}
                    placeholder="-1001928374651 или @my_bets_channel"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    required
                  />
                  <p className="text-[10px] text-slate-500">
                    Бот должен быть администратором канала
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={newBotIsDefault}
                    onChange={(e) => setNewBotIsDefault(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-cyan-600 focus:ring-0"
                  />
                  <span>Сделать этого бота основным по умолчанию</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingBot(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                  >
                    Сохранить бота
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Bots Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentUser.telegramBots.map((bot) => {
              const filterCount = botFilterCounts[bot.id] || 0;
              const isDefault = bot.isDefault;
              const isMasked = !showTokens[bot.id];

              return (
                <div
                  key={bot.id}
                  className={`bg-slate-900/80 border rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all ${
                    isDefault
                      ? 'border-emerald-500/60 shadow-lg shadow-emerald-950/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-white text-sm">
                            {bot.name}
                          </h3>
                          {isDefault && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                              По умолчанию
                            </span>
                          )}
                        </div>
                        {bot.botUsername && (
                          <span className="text-[11px] text-cyan-400 font-mono">
                            {bot.botUsername}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {confirmDeleteBotId === bot.id ? (
                          <div className="flex items-center gap-1 bg-rose-950/80 p-1 rounded-xl border border-rose-500/50 animate-in fade-in">
                            <button
                              type="button"
                              onClick={() => handleDeleteBot(bot.id)}
                              className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] transition active:scale-95"
                              title="Подтвердить удаление карточки бота"
                            >
                              Да, удалить
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteBotId(null)}
                              className="px-1.5 py-0.5 rounded-lg text-slate-400 hover:text-white text-[10px] transition"
                            >
                              Отмена
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteBotId(bot.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                            title="Удалить бота"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bot Credentials Box */}
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">Chat / Channel ID:</span>
                        <span className="font-mono text-slate-200 text-[11px] font-bold">
                          {bot.channelId || 'Не указан'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">Bot Token:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-300 text-[11px]">
                            {bot.botToken
                              ? isMasked
                                ? `${bot.botToken.slice(0, 5)}...${bot.botToken.slice(-4)}`
                                : bot.botToken
                              : 'Не настроен'}
                          </span>
                          {bot.botToken && (
                            <button
                              type="button"
                              onClick={() =>
                                setShowTokens((prev) => ({ ...prev, [bot.id]: !prev[bot.id] }))
                              }
                              className="text-slate-500 hover:text-slate-300"
                              title={isMasked ? 'Показать токен' : 'Скрыть токен'}
                            >
                              {isMasked ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[11px]">
                        <span className="text-slate-500">Привязано фильтров:</span>
                        <span className="font-bold text-emerald-400">
                          {filterCount} шт.
                        </span>
                      </div>

                      {/* Attached Filter Cards with direct Delete buttons */}
                      {(() => {
                        const boundFilters = userFilters.filter((f) => f.botId === bot.id);
                        if (boundFilters.length === 0) return null;
                        return (
                          <div className="pt-2 border-t border-slate-900 space-y-1.5">
                            <span className="text-[10px] text-slate-500 block font-medium">Привязанные стратегии:</span>
                            <div className="space-y-1.5">
                              {boundFilters.map((bf) => (
                                <div
                                  key={bf.id}
                                  className="flex items-center justify-between p-1.5 px-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] group"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${bf.enabled ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                                    <span className="truncate text-slate-200 font-semibold">{bf.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (onSaveFilters) {
                                          onSaveFilters(userFilters.filter((f) => f.id !== bf.id));
                                        }
                                      }}
                                      className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                                      title="Удалить карточку стратегии"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTestBot(bot)}
                        disabled={testingBotId === bot.id || !bot.botToken || !bot.channelId}
                        className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-50 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                      >
                        {testingBotId === bot.id ? (
                          <RefreshCw className="h-3 w-3 animate-spin text-cyan-400" />
                        ) : (
                          <Send className="h-3 w-3 text-cyan-400" />
                        )}
                        <span>Тест связи</span>
                      </button>

                      {!isDefault && (
                        <button
                          onClick={() => handleSetDefaultBot(bot.id)}
                          className="px-3 py-1.5 bg-slate-800/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-medium transition"
                          title="Сделать основным ботом для новых фильтров"
                        >
                          Сделать дефолтным
                        </button>
                      )}
                    </div>

                    <button
                      onClick={onNavigateToFilters}
                      className="w-full text-center text-[11px] text-slate-400 hover:text-emerald-400 transition"
                    >
                      Настроить фильтры для этого бота →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB: DATA SOURCES CONFIGURATION */}
      {activeSubTab === 'datasources' && renderDataSourcesSection()}

      {/* SUB-TAB: PLANS & ACCESS MODEL */}
      {activeSubTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-400" />
                Тарифные планы и модель доступа
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Честная модель: 0 сек задержки и полный ручной конструктор на тарифе FREE. До 5 ботов на разные стратегии и Ad-Free на тарифе PRO.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <span>Текущий тариф:</span>
              <strong className="text-emerald-400 font-extrabold uppercase">
                {currentUser.plan === 'FREE'
                  ? 'FREE (1 бот)'
                  : currentUser.plan === 'PRO_ANALYST'
                  ? 'PRO Analyst (до 5 ботов)'
                  : 'VIP Club'}
              </strong>
            </div>
          </div>

          {/* Core Product Guarantee Strip */}
          <div className="p-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Zap className="h-5 w-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-white">Принцип мгновенной доставки (0 секунд задержки):</span>
                <p className="text-slate-300 text-[11px] mt-0.5">
                  Мы принципиально <strong>не делаем искусственных задержек</strong> даже на бесплатном тарифе! Сигнал отправляется мгновенно в момент срабатывания триггера, чтобы вы успевали совершить ставку по выгодному коэффициенту.
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[11px] border border-emerald-500/30">
                Ping ~150ms
              </span>
            </div>
          </div>

          {/* Subscription Status & 3-Day Expiry Warning Banner */}
          {currentUser.plan !== 'FREE' && currentUser.role !== 'god' && (
            <div className="space-y-3">
              {daysLeft !== null && daysLeft <= 3 && (
                <div className="p-4 rounded-2xl border border-amber-500/60 bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-950 text-xs shadow-xl animate-pulse-slow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-black text-amber-300 text-sm flex items-center gap-2">
                          ⚠️ Внимание: подписка истекает через {daysLeft <= 0 ? 'менее 24 часов' : `${daysLeft} дн.`}!
                          {currentUser.subscriptionDetails?.isTrial && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                              Пробный период (Trial)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Срок действия истекает {currentUser.planExpiresAt || currentUser.subscriptionDetails?.expiresAt}. После окончания тарифа аккаунт автоматически перейдет на базовый FREE (1 бот). Вы можете продлить подписку в один клик без автосписаний.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPaymentModalPlan(currentUser.plan === 'VIP_CLUB' ? 'VIP_CLUB' : 'PRO_ANALYST')}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shrink-0 shadow-lg transition active:scale-95 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                      <span>Продлить подписку</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Active Subscription Details Card */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                    ✓
                  </div>
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>Активная подписка: {currentUser.plan === 'PRO_ANALYST' ? 'PRO Analyst' : 'VIP Syndicate'}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                        {daysLeft !== null && daysLeft > 0 ? `Осталось ${daysLeft} дн.` : 'Активна'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Действует до: <strong className="text-slate-300">{currentUser.planExpiresAt || currentUser.subscriptionDetails?.expiresAt || '2026-12-31'}</strong> • 🔒 Карта не сохраняется
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setPaymentModalPlan(currentUser.plan === 'VIP_CLUB' ? 'VIP_CLUB' : 'PRO_ANALYST')}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-bold text-xs transition"
                >
                  Продлить / Сменить тариф
                </button>
              </div>
            </div>
          )}

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* PLAN 1: FREE */}
            <div
              className={`rounded-2xl p-5 border flex flex-col justify-between transition relative ${
                currentUser.plan === 'FREE'
                  ? 'bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-950/30 ring-1 ring-emerald-500/40'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-extrabold uppercase border border-slate-700">
                    Базовый доступ
                  </span>
                  {currentUser.plan === 'FREE' && (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Активен
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white">FREE</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Полный функционал для каждого игрока без скрытых платежей
                  </p>
                </div>

                <div className="py-2 border-y border-slate-800/80">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">0 ₽</span>
                    <span className="text-xs text-slate-400">/ навсегда</span>
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Полный функционал фильтров в ручном режиме:</strong> все 20+ метрик (xG, удары, опасные атаки, угловые, давление, прогрузы коэффициентов Smart Money, камбэки).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>0 секунд задержки:</strong> моментальная отправка сигналов в Telegram без замедления.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>1 Telegram-бот:</strong> отправка в личный чат или ваш канал.</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-400">
                    <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Рекламная поддержка:</strong> показ проверенных фрибетов и акций легальных БК РФ (Единый ЦУПИС, 18+).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Неограниченный бэктестинг стратегий по базе матчей.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-800">
                {currentUser.plan === 'FREE' ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-slate-800/70 border border-slate-700 text-slate-400 text-xs font-bold cursor-default"
                  >
                    ✓ Ваш текущий тариф
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onUpdateCurrentUser({
                        ...currentUser,
                        plan: 'FREE',
                        role: 'user',
                        adPreferences: {
                          ...currentUser.adPreferences,
                          showBanners: true,
                        },
                      });
                      alert('Переключено на бесплатный тариф FREE. Лимит: 1 бот, реклама включена.');
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition active:scale-95"
                  >
                    Переключить на FREE (Тест)
                  </button>
                )}
              </div>
            </div>

            {/* PLAN 2: PRO ANALYST (BEST VALUE) */}
            <div
              className={`rounded-2xl p-5 border flex flex-col justify-between transition relative ${
                currentUser.plan === 'PRO_ANALYST'
                  ? 'bg-gradient-to-b from-slate-900 to-emerald-950/20 border-emerald-500 shadow-xl shadow-emerald-950/40 ring-2 ring-emerald-500/50'
                  : 'bg-slate-900 border-amber-500/40 shadow-lg hover:border-amber-500/70'
              }`}
            >
              {/* Highlight badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1">
                <Flame className="h-3 w-3" />
                <span>Хит выбора</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase border border-emerald-500/30">
                    Для профи & капперов
                  </span>
                  {currentUser.plan === 'PRO_ANALYST' && (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Активен
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-1.5">
                    <span>PRO Analyst</span>
                    <Sparkles className="h-4 w-4 text-amber-400" />
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Мульти-боты под разные стратегии и работа без отвлекающей рекламы
                  </p>
                </div>

                <div className="py-2 border-y border-slate-800/80">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-emerald-400">1 490 ₽</span>
                    <span className="text-xs text-slate-400">/ месяц</span>
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-200">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong className="text-amber-300">До 5 Telegram-ботов одновременно:</strong> привязывайте отдельные боты под разные фильтры (например: Бот угловых, Бот камбэков, Бот Smart Money, Бот голов во 2-м тайме, Бот карточек).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong className="text-emerald-300">Полное отключение рекламы (Ad-Free):</strong> чистый интерфейс без баннеров для максимальной концентрации.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>0 секунд задержки:</strong> приоритетные выделенные очереди отправки при пиковой нагрузке выходных.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Неограниченное число активных фильтров и правил.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Приоритетная техническая поддержка в Telegram.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-800">
                {currentUser.plan === 'PRO_ANALYST' ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold cursor-default"
                  >
                    ✓ Ваш текущий тариф
                  </button>
                ) : (
                  <button
                    onClick={() => setPaymentModalPlan('PRO_ANALYST')}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>Активировать PRO (1 490 ₽)</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* PLAN 3: VIP SYNDICATE */}
            <div
              className={`rounded-2xl p-5 border flex flex-col justify-between transition relative ${
                currentUser.plan === 'VIP_CLUB'
                  ? 'bg-slate-900 border-amber-500 shadow-xl shadow-amber-950/30 ring-1 ring-amber-500/40'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase border border-amber-500/30">
                    Для синдикатов
                  </span>
                  {currentUser.plan === 'VIP_CLUB' && (
                    <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Активен
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-1.5">
                    <span>VIP Syndicate</span>
                    <Crown className="h-4 w-4 text-amber-400" />
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Для закрытых сообществ, каналов и алгоритмических команд
                  </p>
                </div>

                <div className="py-2 border-y border-slate-800/80">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-amber-400">3 990 ₽</span>
                    <span className="text-xs text-slate-400">/ месяц</span>
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>До 15 Telegram-ботов</strong> для распределения по сеткам каналов.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Персональный Webhook API:</strong> получение потока сигналов в ваши скрипты.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Доступ в закрытый VIP-чат:</strong> готовые пресеты с винрейтом 80%+.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Полное отключение рекламы.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-800">
                {currentUser.plan === 'VIP_CLUB' ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-amber-600/20 border border-amber-500/40 text-amber-300 text-xs font-bold cursor-default"
                  >
                    ✓ Ваш текущий тариф
                  </button>
                ) : (
                  <button
                    onClick={() => setPaymentModalPlan('VIP_CLUB')}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold text-xs transition active:scale-95"
                  >
                    Подключить VIP (3 990 ₽)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Russian Legislation Compliance Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                Правовой статус и соответствие законодательству Российской Федерации
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-xs text-slate-300">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-emerald-400" />
                  244-ФЗ (Об азартных играх)
                </span>
                <p className="text-[11px] text-slate-400">
                  Сервис является исключительно информационно-аналитическим программным комплексом. Не принимает ставки, не организует пари и не выплачивает выигрыши.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  38-ФЗ «О рекламе» (ст. 27)
                </span>
                <p className="text-[11px] text-slate-400">
                  Все рекламные баннеры маркируются идентификаторами (erid) через ОРД. Сотрудничество ведется исключительно с лицензированными БК Единого ЦУПИС (ЕРАИ), строго 18+.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                  152-ФЗ (Персональные данные)
                </span>
                <p className="text-[11px] text-slate-400">
                  Безопасное хранение данных пользователей, регистрация через email/Telegram и политика конфиденциальности в строгом соответствии с законами РФ.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: USERS & PROFILE SWITCHER */}
      {activeSubTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-400" />
                Профили и многопользовательский режим
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Переключайтесь между пользователями или создайте новый аккаунт. Каждый пользователь сохраняет свои фильтры и боты изолированно.
              </p>
            </div>

            <button
              onClick={() => setIsCreatingUser(!isCreatingUser)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>{isCreatingUser ? 'Отмена' : '+ Новый пользователь'}</span>
            </button>
          </div>

          {/* Create User Form */}
          {isCreatingUser && (
            <form
              onSubmit={handleCreateUser}
              className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 space-y-4 shadow-xl"
            >
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-emerald-400" />
                Регистрация нового пользователя
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Имя пользователя:</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Например: Роман Спортивный"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Email:</label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="roman@footbalmonitor.pro"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Тарифный план:</label>
                  <select
                    value={newUserPlan}
                    onChange={(e: any) => setNewUserPlan(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="FREE">Free Tier (Базовый)</option>
                    <option value="PRO_ANALYST">PRO Analyst (Рекомендуемый)</option>
                    <option value="VIP_CLUB">VIP Syndicate (Максимальный)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingUser(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
                >
                  Создать аккаунт
                </button>
              </div>
            </form>
          )}

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...allUsers]
              .sort((a, b) => {
                const aIsGod = a.role === 'god' || a.id === 'user-god-developer' || a.username === 'developer_god';
                const bIsGod = b.role === 'god' || b.id === 'user-god-developer' || b.username === 'developer_god';
                if (aIsGod && !bIsGod) return -1;
                if (!aIsGod && bIsGod) return 1;
                return 0;
              })
              .map((user) => {
                const isCurrent = user.id === currentUser.id;
                const isGod = user.role === 'god' || user.id === 'user-god-developer' || user.username === 'developer_god';

                return (
                  <div
                    key={user.id}
                    className={`border rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all ${
                      isGod
                        ? isCurrent
                          ? 'border-purple-400 bg-gradient-to-br from-purple-950/60 via-slate-900 to-slate-950 shadow-xl shadow-purple-950/50 ring-1 ring-purple-400/40'
                          : 'border-purple-500/40 bg-gradient-to-br from-purple-950/30 via-slate-900 to-slate-950 hover:border-purple-400'
                        : isCurrent
                        ? 'border-emerald-500 bg-slate-900/90 shadow-lg shadow-emerald-950/40'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.displayName}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                            />
                          ) : (
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                              isGod ? 'bg-purple-600/30 border border-purple-400/40' : 'bg-slate-800'
                            }`}>
                              {isGod ? '⚡' : user.displayName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-1.5">
                              {user.displayName}
                            </div>
                            <div className="text-[11px] text-slate-400">@{user.username}</div>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isGod
                              ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50'
                              : user.plan === 'VIP_CLUB'
                              ? 'bg-amber-500/20 text-amber-300'
                              : user.plan === 'PRO_ANALYST'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isGod ? '⚡ GOD MODE' : user.plan}
                        </span>
                      </div>

                      <div className="bg-slate-950/70 rounded-xl p-3 space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Ботов настроено:</span>
                          <strong className="text-slate-200">{user.telegramBots.length}</strong>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>{isGod ? 'Банк Создателя:' : 'Демо-банк:'}</span>
                          <strong className={isGod ? 'text-amber-400' : 'text-emerald-400'}>
                            {user.balanceRub.toLocaleString('ru-RU')} ₽
                          </strong>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Винрейт сигналов:</span>
                          <strong className="text-slate-200">{user.stats.winRate}%</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectUser(user)}
                      disabled={isCurrent}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition ${
                        isCurrent
                          ? isGod
                            ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50 cursor-default'
                            : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                          : isGod
                          ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-950/40'
                          : 'bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white'
                      }`}
                    >
                      {isCurrent ? (isGod ? '✓ Активный аккаунт Создателя' : '✓ Активный аккаунт') : (isGod ? '⚡ Войти в аккаунт Создателя (God)' : 'Войти в этот аккаунт')}
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ADVERTISING & PARTNERS SLOTS */}
      {activeSubTab === 'ads' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                Плашки для рекламы и партнёрские предложения
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Настройки показа рекламных плашек и эксклюзивные бонусы от проверенных партнеров платформы
              </p>
            </div>
          </div>

          {/* Ad Visibility Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">
              Настройка отображения плашек в интерфейсе:
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    Показывать рекламные баннеры (вверху, слева и справа)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Отображение верхнего промо-баннера, боковых баннеров-небоскребов слева/справа и карточек партнёров
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={currentUser.adPreferences.showBanners}
                  onChange={(e) =>
                    onUpdateCurrentUser({
                      ...currentUser,
                      adPreferences: {
                        ...currentUser.adPreferences,
                        showBanners: e.target.checked,
                      },
                    })
                  }
                  className="rounded bg-slate-900 border-slate-700 text-emerald-600 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    Компактный режим плашек
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Минимизирует высоту баннеров для максимального фокуса на статистике матчей
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={currentUser.adPreferences.compactAds}
                  onChange={(e) =>
                    onUpdateCurrentUser({
                      ...currentUser,
                      adPreferences: {
                        ...currentUser.adPreferences,
                        compactAds: e.target.checked,
                      },
                    })
                  }
                  className="rounded bg-slate-900 border-slate-700 text-emerald-600 h-4 w-4"
                />
              </label>
            </div>
          </div>

          {/* Partner Bonuses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/40">
                  Партнёр Winline
                </span>
                <span className="text-xs text-slate-400">18+ Лицензия Единого ЦУПИС</span>
              </div>
              <h4 className="font-bold text-white text-base">
                Фрибет 15 000 ₽ без условий отыгрыша
              </h4>
              <p className="text-xs text-slate-300">
                Зарегистрируйтесь по специальной ссылке и введите промокод <code className="text-amber-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded">FOOTMONITOR2026</code> для начисления фрибета на любой футбольный матч.
              </p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400">FOOTMONITOR2026</span>
                <a
                  href="https://winline.ru"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1"
                >
                  <span>Забрать фрибет</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-950/30 via-slate-900 to-slate-900 border border-blue-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-[10px] border border-blue-500/40">
                  Telegram VIP Сетка
                </span>
                <span className="text-xs text-slate-400">Индивидуальные боты</span>
              </div>
              <h4 className="font-bold text-white text-base">
                Закрытый VIP-канал с xG-сигналами 84%+
              </h4>
              <p className="text-xs text-slate-300">
                Возможность подключить прямой вебхук к вашему персональному боту для мгновенной публикации сигналов прямо в ваш Telegram-канал без задержек.
              </p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-400">TELEGRAM_PRO</span>
                <a
                  href="https://t.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1"
                >
                  <span>Подключить VIP</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: GENERAL PROFILE SETTINGS */}
      {activeSubTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings className="h-5 w-5 text-emerald-400" />
              Параметры профиля
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Отображаемое имя:</label>
                <input
                  type="text"
                  value={currentUser.displayName}
                  onChange={(e) =>
                    onUpdateCurrentUser({ ...currentUser, displayName: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Email:</label>
                <input
                  type="email"
                  value={currentUser.email}
                  onChange={(e) =>
                    onUpdateCurrentUser({ ...currentUser, email: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Theme Switcher Setting */}
            <div className="pt-4 border-t border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-200">Тема оформления интерфейса:</label>
                  <div className="text-[11px] text-slate-400">
                    Выберите комфортную для глаз цветовую гамму приложения
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-semibold text-emerald-400">
                  {currentTheme === 'dark' ? '🌙 Тёмная тема' : '☀️ Светлая тема'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                <button
                  type="button"
                  onClick={() => {
                    onSetTheme?.('dark');
                    onUpdateCurrentUser({ ...currentUser, theme: 'dark' });
                  }}
                  className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition shadow-sm ${
                    currentTheme === 'dark'
                      ? 'bg-slate-800 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Moon className="h-4 w-4 text-sky-400" />
                  <span>Тёмная (Dark Night)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSetTheme?.('light');
                    onUpdateCurrentUser({ ...currentUser, theme: 'light' });
                  }}
                  className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition shadow-sm ${
                    currentTheme === 'light'
                      ? 'bg-slate-800 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Sun className="h-4 w-4 text-amber-400" />
                  <span>Светлая (Clean Light)</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentUser.notificationSound}
                  onChange={(e) =>
                    onUpdateCurrentUser({ ...currentUser, notificationSound: e.target.checked })
                  }
                  className="rounded bg-slate-950 border-slate-700 text-emerald-600 h-4 w-4"
                />
                <span>Звуковые оповещения при поступлении новых сигналов</span>
              </label>
            </div>

            {/* Strategy Management Block */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-200 block">Библиотека торговых стратегий:</label>
                  <div className="text-[11px] text-slate-400">
                    Активно в вашем профиле: <strong className="text-emerald-400">{userFilters.length} стратегий</strong>
                    {userFilters.length === 0 && (
                      <span className="text-rose-400 ml-1.5 font-bold">(все стратегии были удалены)</span>
                    )}
                  </div>
                </div>
                {onRestoreAllStrategies && (
                  <button
                    type="button"
                    onClick={onRestoreAllStrategies}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-cyan-600/20 hover:from-emerald-600/30 hover:to-cyan-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Восстановить все 50+ стратегий</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Preferred Data Providers Settings */}
          {renderDataSourcesSection()}
        </div>
      )}

      {/* SUB-TAB 6: REFERRAL PROGRAM (ПРИВЕДИ ДРУГА) */}
      {activeSubTab === 'referral' && (
        <div className="space-y-6">
          {/* Hero Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-orange-500/10 border border-amber-500/30 relative overflow-hidden shadow-xl">
            <div className="max-w-2xl">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-3 inline-flex items-center gap-1.5">
                <Gift className="h-3.5 w-3.5" /> Партнёрская программа
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
                Приглашайте друзей и получайте бесплатный PRO-доступ и доход
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                Поделитесь персональной ссылкой с коллегами, капперами или в своих Telegram-каналах. Ваш друг получит <strong>3 дня PRO-доступа бесплатно</strong>, а вы — <strong>+7 дней подписки</strong> или <strong>20% с каждой его оплаты</strong> на свой баланс!
              </p>

              {/* Referral Link Box */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl">
                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 font-mono text-xs text-amber-300 truncate">
                  https://footbalmonitor.pro/?ref={currentUser.username || 'user'}_pro
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `https://footbalmonitor.pro/?ref=${currentUser.username || 'user'}_pro`
                    );
                    setCopiedReferral(true);
                    setTimeout(() => setCopiedReferral(false), 2000);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-md shadow-amber-950/30 active:scale-95 shrink-0"
                >
                  {copiedReferral ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copiedReferral ? 'Скопировано!' : 'Скопировать ссылку'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Metrics 4 Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium mb-1">Приглашено друзей</div>
              <div className="text-2xl font-black text-white">7 чел.</div>
              <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> +2 на этой неделе
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium mb-1">Активных подписок</div>
              <div className="text-2xl font-black text-amber-400">4 чел.</div>
              <div className="text-[10px] text-slate-500 mt-1">Оплачивают тариф PRO</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium mb-1">Бонусных дней PRO</div>
              <div className="text-2xl font-black text-emerald-400">+28 дней</div>
              <div className="text-[10px] text-slate-500 mt-1">Начислено автоматически</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium mb-1">Вознаграждение к выводу</div>
              <div className="text-2xl font-black text-cyan-300">2 980 ₽</div>
              <div className="text-[10px] text-slate-500 mt-1">20% от всех оплат</div>
            </div>
          </div>

          {/* Referral steps guide */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" /> Как это работает:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="font-bold text-amber-400 mb-1">1. Отправьте ссылку</div>
                <p className="text-slate-400">
                  Поделитесь вашей ссылкой или промокодом <code>{currentUser.username}_pro</code> с друзьями в Telegram или соцсетях.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="font-bold text-emerald-400 mb-1">2. Друг пробует PRO</div>
                <p className="text-slate-400">
                  При регистрации друг сразу получает 3 дня полного тарифа PRO без ограничений и привязки карты.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="font-bold text-cyan-400 mb-1">3. Получайте прибыль</div>
                <p className="text-slate-400">
                  За каждую оплату друга вы получаете +7 дней продления своего аккаунта или 20% деньгами на баланс.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade to PRO Modal (When user on FREE tries to exceed 1 bot limit) */}
      {showUpgradeModal && (
        <div
          id="upgrade-to-pro-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowUpgradeModal(false)}
        >
          <div
            className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Подключение до 5 ботов доступно в PRO
                  </h3>
                  <span className="text-xs text-slate-400">
                    Лимит тарифа FREE: 1 активный Telegram-бот
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800 space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2 text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>На тарифе FREE:</strong> вам уже доступен <strong>полный функционал фильтров в ручном режиме</strong>, 1 бот и <strong>мгновенные сигналы без задержек (0 сек)</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2 text-amber-300">
                <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>В тарифе PRO (1 490 ₽/мес):</strong> вы можете подключить <strong>до 5 Telegram-ботов</strong>, чтобы направить разные стратегии (угловые, камбэки, Smart Money, голы) в отдельные каналы + <strong>полное отключение рекламы</strong>.
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowUpgradeModal(false);
                  setPaymentModalPlan('PRO_ANALYST');
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/40 transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>Перейти на PRO (1 490 ₽)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
              >
                Остаться на FREE (1 бот)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Payment & Checkout Modal (No card binding) */}
      {paymentModalPlan && (
        <SubscriptionPaymentModal
          isOpen={Boolean(paymentModalPlan)}
          onClose={() => setPaymentModalPlan(null)}
          targetPlan={paymentModalPlan}
          currentUser={currentUser}
          onPaymentSuccess={(updated) => {
            onUpdateCurrentUser(updated);
            setPaymentModalPlan(null);
          }}
        />
      )}
    </div>
  );
};
