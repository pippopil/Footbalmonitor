import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Star,
  Download,
  CheckCircle2,
  TrendingUp,
  Percent,
  Search,
  Filter as FilterIcon,
  ShieldCheck,
  UserCheck,
  Award,
  PlusCircle,
  ExternalLink,
  Flame,
  ArrowUpRight,
  Zap,
  Trophy,
} from 'lucide-react';
import { FilterRule, StrategyMarketplaceItem } from '../types';
import { createCleanBlankFilter } from '../utils/filterDefaults';

interface StrategyMarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userFilters: FilterRule[];
  onImportStrategy: (filter: FilterRule) => void;
  currentUserId: string;
  onOpenLeaderboard?: () => void;
}

export const INITIAL_MARKETPLACE_ITEMS: StrategyMarketplaceItem[] = [
  {
    id: 'mkt-1',
    title: '🔥 Поздний штурм фаворита (80%+ заходов)',
    author: 'Александр Громов (ProTrader)',
    authorBadge: 'ELITE',
    rating: 4.95,
    reviewsCount: 312,
    downloadsCount: 1840,
    winRate: 89.4,
    roi: 31.8,
    totalSignals: 420,
    avgOdds: 1.88,
    description: 'Сигнал на поздний гол фаворита в интервале 68–86 минут, если фаворит проигрывает в 1 мяч или ничья, а темп атак превышает 1.8 APM.',
    tags: ['ТБ 1.5/2.5', 'Фаворит', 'Поздний гол', 'Live Давление'],
    sport: 'football',
    verifiedAt: '28 сентября 2026',
    isOfficial: true,
    filterTemplate: {
      ...createCleanBlankFilter('system'),
      id: '',
      name: '🔥 Поздний штурм фаворита',
      minMinute: 68,
      maxMinute: 86,
      scoreCondition: 'ONE_GOAL_DIFF',
      minDangerousAttacksDiff: 18,
      minShotsOnTargetDiff: 5,
      minOddsFavorite: 1.65,
      maxOddsFavorite: 2.25,
      enabled: true,
      description: 'Импортировано из Маркетплейса: стратегия позднего дожима от Александра Громова',
    },
  },
  {
    id: 'mkt-2',
    title: '🛡️ Бетонный автобус (ТМ 2.5 / Сушка счёта)',
    author: 'Tactical Analyst Lab',
    authorBadge: 'VERIFIED',
    rating: 4.88,
    reviewsCount: 189,
    downloadsCount: 950,
    winRate: 86.5,
    roi: 24.1,
    totalSignals: 310,
    avgOdds: 1.76,
    description: 'Идеальная стратегия на тотал меньше: счёт 0:0 или 1:0, нулевая динамика, менее 0.7 атак в минуту и отсутствие ударов в створ во 2 тайме.',
    tags: ['ТМ 2.5', 'Сушка', 'Затухание темпа', 'Низкий тотал'],
    sport: 'football',
    verifiedAt: '25 сентября 2026',
    isOfficial: true,
    filterTemplate: {
      ...createCleanBlankFilter('system'),
      id: '',
      name: '🛡️ Бетонный автобус (ТМ)',
      minMinute: 55,
      maxMinute: 80,
      scoreCondition: 'DRAW',
      maxShotsOnTargetTotal: 3,
      maxDangerousAttacksTotal: 35,
      minOddsOver25: 1.60,
      maxOddsOver25: 2.10,
      enabled: true,
      description: 'Импортировано из Маркетплейса: сушка матча от Tactical Lab',
    },
  },
  {
    id: 'mkt-3',
    title: '⚡ Угловой шторм (10+ корнеров)',
    author: 'Corners Pro Bot',
    authorBadge: 'PRO',
    rating: 4.82,
    reviewsCount: 144,
    downloadsCount: 1120,
    winRate: 84.8,
    roi: 22.4,
    totalSignals: 512,
    avgOdds: 1.92,
    description: 'Ловит матчи с фланговым давлением: от 3 угловых за последние 15 минут при заблокированных прострелах и плотной обороне.',
    tags: ['Угловые', 'Фланги', 'ТБ угловых', 'Корнеры'],
    sport: 'football',
    verifiedAt: '26 сентября 2026',
    filterTemplate: {
      ...createCleanBlankFilter('system'),
      id: '',
      name: '⚡ Угловой шторм',
      minMinute: 60,
      maxMinute: 85,
      minTotalCorners: 7,
      minDangerousAttacksDiff: 12,
      minOddsFavorite: 1.70,
      maxOddsFavorite: 2.30,
      enabled: true,
      description: 'Импортировано из Маркетплейса: стратегия на угловые',
    },
  },
  {
    id: 'mkt-4',
    title: '🎯 Ловушка xG & Камбэк доминатора',
    author: 'SmartStats Syndicate',
    authorBadge: 'ELITE',
    rating: 4.91,
    reviewsCount: 220,
    downloadsCount: 1430,
    winRate: 88.0,
    roi: 28.5,
    totalSignals: 275,
    avgOdds: 2.10,
    description: 'Команда доминирует по xG (> 1.80 против < 0.40), нанесла 8+ ударов, но уступает 0:1 из-за случайного рикошета. Высокий валуй на гол фаворита.',
    tags: ['xG Модель', 'Камбэк', 'Валуй', 'Фаворит'],
    sport: 'football',
    verifiedAt: '29 сентября 2026',
    isOfficial: true,
    filterTemplate: {
      ...createCleanBlankFilter('system'),
      id: '',
      name: '🎯 Ловушка xG & Камбэк',
      minMinute: 50,
      maxMinute: 75,
      minShotsOnTargetDiff: 4,
      minDangerousAttacksDiff: 15,
      minOddsFavorite: 1.80,
      maxOddsFavorite: 2.60,
      enabled: true,
      description: 'Импортировано из Маркетплейса: аномалия xG',
    },
  },
  {
    id: 'mkt-5',
    title: '🏒 Хоккей: Осада в 3-м периоде',
    author: 'PuckMaster AI',
    authorBadge: 'VERIFIED',
    rating: 4.79,
    reviewsCount: 88,
    downloadsCount: 640,
    winRate: 83.5,
    roi: 19.8,
    totalSignals: 190,
    avgOdds: 1.85,
    description: 'Штурм ворот в третьем периоде при разрыве в 1 шайбу или снятом вратаре. Высочайшая частота бросков в створ.',
    tags: ['Хоккей', '3-й период', 'ТБ шайб', 'Пустые ворота'],
    sport: 'hockey',
    verifiedAt: '24 сентября 2026',
    filterTemplate: {
      ...createCleanBlankFilter('system'),
      id: '',
      name: '🏒 Хоккей: Осада в 3-м периоде',
      minMinute: 48,
      maxMinute: 59,
      scoreCondition: 'ONE_GOAL_DIFF',
      minShotsOnTargetDiff: 6,
      minOddsFavorite: 1.65,
      maxOddsFavorite: 2.20,
      enabled: true,
      description: 'Импортировано из Маркетплейса: хоккейная стратегия',
    },
  },
];

export const StrategyMarketplaceModal: React.FC<StrategyMarketplaceModalProps> = ({
  isOpen,
  onClose,
  userFilters,
  onImportStrategy,
  currentUserId,
  onOpenLeaderboard,
}) => {
  const [items, setItems] = useState<StrategyMarketplaceItem[]>(() => {
    try {
      const saved = localStorage.getItem('footbalmonitor_marketplace_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_MARKETPLACE_ITEMS;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'roi' | 'winRate' | 'popular'>('roi');
  const [importedIds, setImportedIds] = useState<Record<string, boolean>>({});
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [selectedFilterToPublish, setSelectedFilterToPublish] = useState<string>('');
  const [publishDescription, setPublishDescription] = useState('');
  const [publishPriceType, setPublishPriceType] = useState<'free' | 'paid'>('free');
  const [publishPriceRub, setPublishPriceRub] = useState<number>(490);
  const [publishTelegram, setPublishTelegram] = useState('');
  const [publishSuccess, setPublishSuccess] = useState(false);

  const saveItemsToStorage = (updated: StrategyMarketplaceItem[]) => {
    setItems(updated);
    try {
      localStorage.setItem('footbalmonitor_marketplace_items', JSON.stringify(updated));
    } catch {}
  };

  if (!isOpen) return null;

  const filteredItems = items
    .filter((item) => {
      const matchSport = selectedSport === 'all' || item.sport === selectedSport;
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSport && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'roi') return b.roi - a.roi;
      if (sortBy === 'winRate') return b.winRate - a.winRate;
      if (sortBy === 'popular') return b.downloadsCount - a.downloadsCount;
      return b.rating - a.rating;
    });

  const handleImport = (item: StrategyMarketplaceItem) => {
    const importedFilter: FilterRule = {
      ...item.filterTemplate,
      id: `filter-imported-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${item.title.split(' ')[0]} ${item.title.split(' ')[1] || ''} (Импорт)`,
      userId: currentUserId,
      enabled: true,
      isPreset: false,
    };
    onImportStrategy(importedFilter);
    setImportedIds((prev) => ({ ...prev, [item.id]: true }));
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    const sourceFilter = userFilters.find((f) => f.id === selectedFilterToPublish);
    if (!sourceFilter) return;

    const newItem: StrategyMarketplaceItem = {
      id: `user-pub-${Date.now()}`,
      title: sourceFilter.name,
      author: 'Вы (Авторский алгоритм)',
      authorBadge: 'COMMUNITY',
      rating: 5.0,
      reviewsCount: 1,
      downloadsCount: 1,
      winRate: 88.5,
      roi: 25.0,
      totalSignals: 45,
      avgOdds: 1.82,
      description: publishDescription || 'Авторский алгоритм, созданный в конструкторе фильтров.',
      tags: ['Сообщество', 'Авторский фильтр', sourceFilter.sport || 'football'],
      sport: (sourceFilter.sport as any) || 'football',
      verifiedAt: 'Сегодня',
      filterTemplate: sourceFilter,
      priceType: publishPriceType,
      priceRub: publishPriceType === 'paid' ? publishPriceRub : 0,
      sellerTelegram: publishTelegram.trim(),
    };

    const updated = [newItem, ...items];
    saveItemsToStorage(updated);
    setPublishSuccess(true);
    setTimeout(() => {
      setPublishSuccess(false);
      setIsPublishOpen(false);
      setSelectedFilterToPublish('');
      setPublishDescription('');
      setPublishPriceType('free');
      setPublishPriceRub(490);
      setPublishTelegram('');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Маркетплейс стратегий и алгоритмов</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Сообщество
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Каталог проверенных авторских фильтров от топ-капперов и аналитиков с публичным Win Rate и ROI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenLeaderboard && (
              <button
                type="button"
                onClick={onOpenLeaderboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition shadow-sm"
                title="Открыть лидерборд и рейтинг создателей месяца"
              >
                <Trophy className="h-4 w-4 text-amber-400" />
                <span className="hidden sm:inline">Рейтинг авторов</span>
              </button>
            )}
            <button
              onClick={() => setIsPublishOpen(!isPublishOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Опубликовать свой</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Publish Drawer Form */}
        {isPublishOpen && (
          <div className="px-6 py-4 bg-slate-950/90 border-b border-emerald-500/20 animate-in slide-in-from-top duration-200">
            <div className="max-w-2xl">
              <h3 className="text-sm font-bold text-emerald-400 mb-1 flex items-center gap-2">
                <SparklesIcon className="h-4 w-4" /> Публикация вашей стратегии в каталог
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                Выберите один из ваших сохраненных фильтров, чтобы поделиться им с сообществом платформы.
              </p>
              <form onSubmit={handlePublish} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Выберите ваш фильтр:
                    </label>
                    <select
                      value={selectedFilterToPublish}
                      onChange={(e) => setSelectedFilterToPublish(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Выберите фильтр --</option>
                      {userFilters.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Описание и рекомендации (под какой маркет):
                    </label>
                    <input
                      type="text"
                      value={publishDescription}
                      onChange={(e) => setPublishDescription(e.target.value)}
                      placeholder="Например: Ставка на ТБ 1.5, если фаворит давит во 2 тайме"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Price & Contact Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Тип доступа / Продажа:
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPublishPriceType('free')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                          publishPriceType === 'free'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                            : 'bg-slate-900 text-slate-400 border-slate-700'
                        }`}
                      >
                        Бесплатно
                      </button>
                      <button
                        type="button"
                        onClick={() => setPublishPriceType('paid')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                          publishPriceType === 'paid'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            : 'bg-slate-900 text-slate-400 border-slate-700'
                        }`}
                      >
                        Платная (PRO)
                      </button>
                    </div>
                  </div>

                  {publishPriceType === 'paid' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Стоимость (руб):
                      </label>
                      <input
                        type="number"
                        min="100"
                        step="50"
                        value={publishPriceRub}
                        onChange={(e) => setPublishPriceRub(Number(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Ваш контакт в Telegram:
                    </label>
                    <input
                      type="text"
                      value={publishTelegram}
                      onChange={(e) => setPublishTelegram(e.target.value)}
                      placeholder="@username для связи"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={!selectedFilterToPublish || publishSuccess}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    {publishSuccess ? <CheckCircle2 className="h-4 w-4" /> : <UploadIcon className="h-4 w-4" />}
                    <span>{publishSuccess ? 'Опубликовано!' : 'Опубликовать стратегию'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublishOpen(false)}
                    className="px-3 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Поиск по названию, автору, тегам..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              {[
                { id: 'all', label: 'Все виды' },
                { id: 'football', label: '⚽ Футбол' },
                { id: 'hockey', label: '🏒 Хоккей' },
              ].map((sp) => (
                <button
                  key={sp.id}
                  onClick={() => setSelectedSport(sp.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    selectedSport === sp.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sp.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Сортировка:</span>
            {[
              { id: 'roi', label: 'По ROI %' },
              { id: 'winRate', label: 'По винрейту' },
              { id: 'popular', label: 'По популярности' },
              { id: 'rating', label: 'По оценкам' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id as any)}
                className={`px-2.5 py-1 rounded-lg transition font-medium ${
                  sortBy === s.id
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Marketplace Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const isImported = Boolean(importedIds[item.id]);
              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition flex flex-col justify-between group shadow-sm hover:shadow-lg hover:shadow-black/20"
                >
                  <div>
                    {/* Top Row: Author & Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-300">{item.author}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                            item.authorBadge === 'ELITE'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : item.authorBadge === 'VERIFIED'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {item.authorBadge}
                        </span>
                        {item.priceType === 'paid' ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            💰 PRO • {item.priceRub} ₽
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            Бесплатно
                          </span>
                        )}
                        {item.sellerTelegram && (
                          <span className="text-[9px] text-cyan-400 font-mono">
                            {item.sellerTelegram}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        <span>{item.rating.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-500 font-normal">({item.reviewsCount})</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition mb-2">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Key Stats Bar */}
                    <div className="grid grid-cols-4 gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-center mb-3">
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium">Винрейт</div>
                        <div className="text-xs font-bold text-emerald-400">{item.winRate}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium">ROI дистанции</div>
                        <div className="text-xs font-bold text-amber-400">+{item.roi}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium">Ср. коэффициент</div>
                        <div className="text-xs font-bold text-cyan-300">{item.avgOdds}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium">Сигналов</div>
                        <div className="text-xs font-bold text-slate-300">{item.totalSignals}</div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {item.tags.map((t, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-900 text-slate-400 border border-slate-800"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Download className="h-3.5 w-3.5" />
                      <span>{item.downloadsCount} установок</span>
                    </div>

                    <button
                      onClick={() => handleImport(item)}
                      disabled={isImported}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                        isImported
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 hover:shadow-amber-500/20 active:scale-95'
                      }`}
                    >
                      {isImported ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Импортировано</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          <span>Импортировать в свои</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info note */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              Все стратегии проходят проверку на дистанции в бэктестере (минимум 150+ событий) для защиты от поддельных результатов.
            </span>
          </div>
          <span className="text-slate-500 hidden sm:inline">Экосистема Footbalmonitor Community</span>
        </div>
      </div>
    </div>
  );
};

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function UploadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}
