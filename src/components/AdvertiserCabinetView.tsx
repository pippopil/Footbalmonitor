import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  MousePointerClick,
  DollarSign,
  Plus,
  Play,
  Pause,
  Edit2,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Layers,
  Calendar,
  CheckCircle2,
  Clock,
  Target,
  FileSpreadsheet,
  Download,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Percent,
} from 'lucide-react';
import { AdBannerItem, SiteAnalyticsData, AdvertiserCampaign } from '../types';
import { reachGoal, saveSiteAnalytics } from '../services/analyticsService';

interface AdvertiserCabinetViewProps {
  analytics: SiteAnalyticsData;
  onUpdateAnalytics: (updated: SiteAnalyticsData) => void;
  ads: AdBannerItem[];
  onUpdateAds: (ads: AdBannerItem[]) => void;
  onOpenCampaignModal?: () => void;
}

export const AdvertiserCabinetView: React.FC<AdvertiserCabinetViewProps> = ({
  analytics,
  onUpdateAnalytics,
  ads,
  onUpdateAds,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'audiences' | 'metrika' | 'pricing'>('overview');
  const [metrikaCounterInput, setMetrikaCounterInput] = useState(analytics.yandexMetrikaCounterId || '');
  const [metrikaSavedMsg, setMetrikaSavedMsg] = useState(false);

  // New Campaign Form State
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignPartner, setCampaignPartner] = useState('');
  const [campaignBadge, setCampaignBadge] = useState('Партнёр');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [campaignCtaText, setCampaignCtaText] = useState('Перейти');
  const [campaignCtaUrl, setCampaignCtaUrl] = useState('https://');
  const [campaignPromoCode, setCampaignPromoCode] = useState('');
  const [campaignBonusText, setCampaignBonusText] = useState('');
  const [campaignSlot, setCampaignSlot] = useState<AdBannerItem['bannerType']>('top_billboard');
  const [campaignDailyBudget, setCampaignDailyBudget] = useState(3000);
  const [campaignCpc, setCampaignCpc] = useState(20);

  // Calculate totals across ads
  const totalImpressions = ads.reduce((acc, a) => acc + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((acc, a) => acc + (a.clicks || 0), 0);
  const totalConversions = ads.reduce((acc, a) => acc + (a.conversions || 0), 0);
  const totalSpentRub = ads.reduce((acc, a) => acc + (a.spentRub || 0), 0);
  const overallCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
  const overallCr = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : '0.00';

  const handleSaveMetrika = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...analytics,
      yandexMetrikaCounterId: metrikaCounterInput.trim(),
      isYandexMetrikaConnected: Boolean(metrikaCounterInput.trim()),
    };
    onUpdateAnalytics(updated);
    saveSiteAnalytics(updated);
    setMetrikaSavedMsg(true);
    setTimeout(() => setMetrikaSavedMsg(false), 3000);
  };

  const handleToggleAdStatus = (adId: string) => {
    const updated = ads.map((ad) => {
      if (ad.id === adId) {
        const nextStatus = ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        return { ...ad, status: nextStatus as any, active: nextStatus === 'ACTIVE' };
      }
      return ad;
    });
    onUpdateAds(updated);
  };

  const handleDeleteAd = (adId: string) => {
    const updated = ads.filter((ad) => ad.id !== adId);
    onUpdateAds(updated);
  };

  const handleCreateCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignTitle.trim() || !campaignCtaUrl.trim()) {
      alert('Пожалуйста, заполните заголовок и целевую ссылку');
      return;
    }

    const newAd: AdBannerItem = {
      id: `custom-campaign-${Date.now()}`,
      title: campaignTitle.trim(),
      partnerName: campaignPartner.trim() || 'Рекламодатель',
      badge: campaignBadge.trim() || 'ПАРТНЁР',
      description: campaignDescription.trim() || 'Эксклюзивное предложение для пользователей платформы',
      ctaText: campaignCtaText.trim() || 'Перейти на сайт',
      ctaUrl: campaignCtaUrl.trim(),
      promoCode: campaignPromoCode.trim() || undefined,
      bonusText: campaignBonusText.trim() || undefined,
      bannerType: campaignSlot,
      side: campaignSlot === 'skyscraper_left' ? 'left' : campaignSlot === 'skyscraper_right' ? 'right' : undefined,
      bgGradient:
        campaignSlot === 'skyscraper_right'
          ? 'from-indigo-600/25 via-purple-600/20 to-slate-900'
          : 'from-amber-600/25 via-slate-900/90 to-emerald-950/40',
      active: true,
      status: 'ACTIVE',
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spentRub: 0,
      cpcRub: campaignCpc,
      dailyBudgetRub: campaignDailyBudget,
    };

    onUpdateAds([newAd, ...ads]);
    reachGoal('create_ad_campaign', { slot: campaignSlot, title: campaignTitle });

    // Reset form
    setCampaignTitle('');
    setCampaignPartner('');
    setCampaignDescription('');
    setCampaignPromoCode('');
    setCampaignBonusText('');
    setIsCreatingCampaign(false);
  };

  const exportStatsCsv = () => {
    const headers = ['ID', 'Партнёр', 'Заголовок', 'Слот', 'Показы', 'Клики', 'CTR %', 'Конверсии', 'CR %', 'Расход (₽)', 'Статус'];
    const rows = ads.map((a) => {
      const ctr = a.impressions ? ((a.clicks || 0) / a.impressions * 100).toFixed(2) : '0';
      const cr = a.clicks ? ((a.conversions || 0) / a.clicks * 100).toFixed(2) : '0';
      return [
        `"${a.id}"`,
        `"${a.partnerName}"`,
        `"${a.title.replace(/"/g, '""')}"`,
        `"${a.bannerType}"`,
        a.impressions || 0,
        a.clicks || 0,
        `${ctr}%`,
        a.conversions || 0,
        `${cr}%`,
        a.spentRub || 0,
        a.status || (a.active ? 'ACTIVE' : 'PAUSED'),
      ].join(';');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `footbalmonitor_ads_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-[11px] uppercase tracking-wider border border-amber-500/40 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-amber-400" />
                Кабинет Рекламодателя & Партнёрки
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE Счётчик активен
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Размещение рекламы, статистика аудитории и метрика
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Управляйте рекламными плашками (верхний билборд, боковые небоскрёбы, нативные карточки в ленте матчей),
              отслеживайте показы, клики, CTR и подключайте официальный счётчик Яндекс.Метрики.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={exportStatsCsv}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition"
              title="Скачать отчёт по всем кампаниям в CSV"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              <span>Экспорт CSV</span>
            </button>
            <button
              onClick={() => setIsCreatingCampaign(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/40 flex items-center gap-1.5 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>Создать кампанию</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Ribbon: Traffic & Ad Performance */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Total Unique Visitors */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Уникальные (Всего)</span>
            <Users className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-white font-mono">
            {analytics.uniqueVisitors.toLocaleString('ru-RU')}
          </div>
          <div className="text-[10px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>+{analytics.todayUniques} сегодня</span>
          </div>
        </div>

        {/* Total Site Visits / Sessions */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Визиты (Сессии)</span>
            <Eye className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-xl font-black text-white font-mono">
            {analytics.totalVisits.toLocaleString('ru-RU')}
          </div>
          <div className="text-[10px] text-cyan-400 flex items-center gap-1">
            <span>+{analytics.todayVisits} сегодня</span>
          </div>
        </div>

        {/* Live Users Online */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Онлайн прямо сейчас</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono flex items-center gap-1.5">
            <span>{analytics.onlineNow}</span>
            <span className="text-xs text-slate-400 font-normal">чел.</span>
          </div>
          <div className="text-[10px] text-slate-400">
            Ср. время: {Math.round(analytics.avgTimeOnSiteSec / 60)} мин.
          </div>
        </div>

        {/* Ad Impressions */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Показов баннеров</span>
            <Layers className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-xl font-black text-white font-mono">
            {totalImpressions.toLocaleString('ru-RU')}
          </div>
          <div className="text-[10px] text-slate-400">
            На 5 рекламных слотах
          </div>
        </div>

        {/* Ad Clicks & CTR */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Клики & CTR</span>
            <MousePointerClick className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-xl font-black text-purple-400 font-mono">
            {totalClicks.toLocaleString('ru-RU')}
          </div>
          <div className="text-[10px] text-purple-300 font-bold">
            CTR: {overallCtr}% (Конв.: {overallCr}%)
          </div>
        </div>

        {/* Ad Spend / Revenue */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Освоено бюджета</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono">
            {totalSpentRub.toLocaleString('ru-RU')} ₽
          </div>
          <div className="text-[10px] text-slate-400">
            CPC ~20 ₽ за клик
          </div>
        </div>
      </div>

      {/* Inner Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'overview'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Сводка & Графики посещаемости</span>
        </button>

        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'campaigns'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Кампании и Рекламные Слоты ({ads.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audiences')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'audiences'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Аудитория и Источники</span>
        </button>

        <button
          onClick={() => setActiveTab('metrika')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'metrika'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Target className="h-4 w-4 text-red-400" />
          <span>Яндекс.Метрика & Счётчик</span>
          {analytics.isYandexMetrikaConnected && (
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'pricing'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <DollarSign className="h-4 w-4 text-emerald-400" />
          <span>Тарифы на размещение</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & TRAFFIC CHARTS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Historical Traffic 7-Day Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  Динамика посещаемости и уникальных пользователей (7 дней)
                </h3>
                <p className="text-xs text-slate-400">
                  Показывает соотношение общих визитов (сессий) и уникальных посетителей платформы
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-cyan-500" />
                  <span className="text-slate-300 font-medium">Визиты</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-emerald-500" />
                  <span className="text-slate-300 font-medium">Уникальные пользователи</span>
                </div>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="pt-4 grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 border-b border-slate-800 pb-3">
              {analytics.historyDays.map((day, idx) => {
                const maxVal = Math.max(...analytics.historyDays.map((d) => d.visits), 2000);
                const visitHeightPct = Math.round((day.visits / maxVal) * 100);
                const uniqueHeightPct = Math.round((day.uniques / maxVal) * 100);

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                      {/* Visits Bar */}
                      <div
                        style={{ height: `${visitHeightPct}%` }}
                        className="w-1/2 bg-cyan-500/80 hover:bg-cyan-400 rounded-t-md transition relative"
                        title={`${day.date}: ${day.visits} визитов`}
                      >
                        <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-950 text-cyan-300 text-[10px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/40 z-20 whitespace-nowrap shadow-lg">
                          {day.visits}
                        </div>
                      </div>

                      {/* Unique Users Bar */}
                      <div
                        style={{ height: `${uniqueHeightPct}%` }}
                        className="w-1/2 bg-emerald-500/80 hover:bg-emerald-400 rounded-t-md transition relative"
                        title={`${day.date}: ${day.uniques} уникальных`}
                      >
                        <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-950 text-emerald-300 text-[10px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/40 z-20 whitespace-nowrap shadow-lg">
                          {day.uniques}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-200">
                      {day.date}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-slate-400 text-[11px]">Среднесуточный охват:</span>
                <div className="text-base font-bold text-white font-mono">
                  ~{Math.round(analytics.historyDays.reduce((a, b) => a + b.uniques, 0) / 7)} уников / сутки
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-slate-400 text-[11px]">Глубина просмотра:</span>
                <div className="text-base font-bold text-emerald-400 font-mono">
                  {(analytics.pageViews / (analytics.totalVisits || 1)).toFixed(1)} стр. / сессию
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-slate-400 text-[11px]">Отказы (Bounce Rate):</span>
                <div className="text-base font-bold text-cyan-400 font-mono">
                  {analytics.bounceRate}% (Отличный показатель)
                </div>
              </div>
            </div>
          </div>

          {/* Quick Ad Slots Performance Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-amber-400" />
                Текущие рекламные места в интерфейсе
              </h3>
              <button
                onClick={() => setActiveTab('campaigns')}
                className="text-xs text-amber-400 hover:underline font-bold"
              >
                Все кампании ({ads.length}) →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ads.map((ad) => {
                const ctr = ad.impressions ? ((ad.clicks || 0) / ad.impressions * 100).toFixed(2) : '0';
                return (
                  <div
                    key={ad.id}
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-3 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono text-[10px] border border-slate-700">
                        {ad.bannerType}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ad.status === 'ACTIVE' || ad.active
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {ad.status || (ad.active ? 'ACTIVE' : 'PAUSED')}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-1">{ad.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{ad.partnerName}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-900 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Показы</span>
                        <span className="font-bold text-white font-mono">{(ad.impressions || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Клики</span>
                        <span className="font-bold text-purple-400 font-mono">{(ad.clicks || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">CTR</span>
                        <span className="font-bold text-emerald-400 font-mono">{ctr}%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">Бюджет: {ad.dailyBudgetRub || 3000} ₽/сут</span>
                      <button
                        onClick={() => handleToggleAdStatus(ad.id)}
                        className="text-slate-400 hover:text-white text-[11px] underline"
                      >
                        {ad.status === 'ACTIVE' || ad.active ? 'Приостановить' : 'Возобновить'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL CAMPAIGNS & SLOTS MANAGEMENT */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div>
              <h3 className="text-base font-bold text-white">
                Управление рекламными кампаниями и креативами
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Добавляйте новые баннеры, меняйте промокоды, ссылки и отслеживайте статистику каждого места
              </p>
            </div>
            <button
              onClick={() => setIsCreatingCampaign(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Создать баннер</span>
            </button>
          </div>

          {/* New Campaign Creation Modal / Panel */}
          {isCreatingCampaign && (
            <form
              onSubmit={handleCreateCampaignSubmit}
              className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-6 space-y-4 shadow-2xl animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Новая рекламная кампания
                </h4>
                <button
                  type="button"
                  onClick={() => setIsCreatingCampaign(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ✕ Закрыть
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Заголовок баннера (УТП) *</label>
                  <input
                    type="text"
                    required
                    value={campaignTitle}
                    onChange={(e) => setCampaignTitle(e.target.value)}
                    placeholder="Например: ФРИБЕТ ДО 15 000 ₽ НОВЫМ ИГРОКАМ"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Название партнёра / Бренда *</label>
                  <input
                    type="text"
                    required
                    value={campaignPartner}
                    onChange={(e) => setCampaignPartner(e.target.value)}
                    placeholder="Например: Winline, Fonbet, Telegram VIP"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Рекламный слот размещения *</label>
                  <select
                    value={campaignSlot}
                    onChange={(e) => setCampaignSlot(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="top_billboard">Верхний широкий Билборд (Top Billboard)</option>
                    <option value="skyscraper_left">Левый Небоскрёб (Skyscraper Left, 160x600)</option>
                    <option value="skyscraper_right">Правый Небоскрёб (Skyscraper Right, 160x600)</option>
                    <option value="in_feed">Нативная плашка внутри списка матчей</option>
                    <option value="sidebar">Боковой блок в инспекторе матча</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Целевая ссылка перехода (с UTM-метками) *</label>
                  <input
                    type="url"
                    required
                    value={campaignCtaUrl}
                    onChange={(e) => setCampaignCtaUrl(e.target.value)}
                    placeholder="https://partner.com/?utm_source=footbalmonitor"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Промокод (если есть)</label>
                  <input
                    type="text"
                    value={campaignPromoCode}
                    onChange={(e) => setCampaignPromoCode(e.target.value)}
                    placeholder="FOOTMONITOR2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono uppercase focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Бонусная плашка</label>
                  <input
                    type="text"
                    value={campaignBonusText}
                    onChange={(e) => setCampaignBonusText(e.target.value)}
                    placeholder="Без депозита 15 000 ₽"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Текст на кнопке</label>
                  <input
                    type="text"
                    value={campaignCtaText}
                    onChange={(e) => setCampaignCtaText(e.target.value)}
                    placeholder="Забрать бонус"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Дневной бюджет (₽)</label>
                  <input
                    type="number"
                    min="500"
                    step="500"
                    value={campaignDailyBudget}
                    onChange={(e) => setCampaignDailyBudget(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Описание / Текст баннера</label>
                <textarea
                  rows={2}
                  value={campaignDescription}
                  onChange={(e) => setCampaignDescription(e.target.value)}
                  placeholder="Официальный лицензированный партнёр. Моментальные выплаты на карты РФ."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingCampaign(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition"
                >
                  Запустить кампанию
                </button>
              </div>
            </form>
          )}

          {/* Campaigns Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Кампания / Партнёр</th>
                    <th className="p-3.5">Слот</th>
                    <th className="p-3.5 text-right">Показы</th>
                    <th className="p-3.5 text-right">Клики</th>
                    <th className="p-3.5 text-right">CTR</th>
                    <th className="p-3.5 text-right">Конверсии</th>
                    <th className="p-3.5 text-right">Расход</th>
                    <th className="p-3.5 text-center">Статус</th>
                    <th className="p-3.5 text-center">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-medium">
                  {ads.map((ad) => {
                    const ctr = ad.impressions ? ((ad.clicks || 0) / ad.impressions * 100).toFixed(2) : '0';
                    const cr = ad.clicks ? ((ad.conversions || 0) / ad.clicks * 100).toFixed(2) : '0';

                    return (
                      <tr key={ad.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-white max-w-xs truncate">{ad.title}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>{ad.partnerName}</span>
                            {ad.promoCode && (
                              <code className="text-amber-400 bg-slate-950 px-1 py-0.2 rounded font-mono text-[10px]">
                                {ad.promoCode}
                              </code>
                            )}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 font-mono text-[10px] border border-slate-800">
                            {ad.bannerType}
                          </span>
                        </td>

                        <td className="p-3.5 text-right font-mono text-white">
                          {(ad.impressions || 0).toLocaleString('ru-RU')}
                        </td>

                        <td className="p-3.5 text-right font-mono text-purple-400 font-bold">
                          {(ad.clicks || 0).toLocaleString('ru-RU')}
                        </td>

                        <td className="p-3.5 text-right font-mono text-emerald-400 font-bold">
                          {ctr}%
                        </td>

                        <td className="p-3.5 text-right font-mono text-cyan-400">
                          {ad.conversions || 0} ({cr}%)
                        </td>

                        <td className="p-3.5 text-right font-mono text-white">
                          {(ad.spentRub || 0).toLocaleString('ru-RU')} ₽
                        </td>

                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              ad.status === 'ACTIVE' || ad.active
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {ad.status || (ad.active ? 'ACTIVE' : 'PAUSED')}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleToggleAdStatus(ad.id)}
                              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                              title={ad.active ? 'Поставить на паузу' : 'Возобновить показ'}
                            >
                              {ad.active ? <Pause className="h-3.5 w-3.5 text-amber-400" /> : <Play className="h-3.5 w-3.5 text-emerald-400" />}
                            </button>
                            <a
                              href={ad.ctaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400 transition"
                              title="Открыть целевую ссылку"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <button
                              onClick={() => handleDeleteAd(ad.id)}
                              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition"
                              title="Удалить кампанию"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIENCE & TRAFFIC SOURCES */}
      {activeTab === 'audiences' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Traffic Sources */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
              Источники трафика платформы
            </h3>
            <p className="text-xs text-slate-400">
              Откуда приходят игроки, капперы и футбольные аналитики
            </p>

            <div className="space-y-3 pt-2">
              {analytics.sourcesBreakdown.map((src, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{src.source}</span>
                    <span className="font-mono text-cyan-400 font-bold">{src.percentage}% ({src.visits.toLocaleString()} визитов)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${src.percentage}%` }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Devices & Platforms */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-400" />
              Устройства и платформы аудитории
            </h3>
            <p className="text-xs text-slate-400">
              Распределение по типу клиентских устройств
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {analytics.devicesBreakdown.mobile}%
                </span>
                <span className="text-xs text-slate-300 font-bold block">Смартфоны</span>
                <span className="text-[10px] text-slate-500 block">iOS & Android</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
                <span className="text-2xl font-black text-cyan-400 font-mono">
                  {analytics.devicesBreakdown.desktop}%
                </span>
                <span className="text-xs text-slate-300 font-bold block">Компьютеры</span>
                <span className="text-[10px] text-slate-500 block">Windows, macOS</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
                <span className="text-2xl font-black text-purple-400 font-mono">
                  {analytics.devicesBreakdown.tablet}%
                </span>
                <span className="text-xs text-slate-300 font-bold block">Планшеты</span>
                <span className="text-[10px] text-slate-500 block">iPad, Galaxy Tab</span>
              </div>
            </div>

            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3.5 text-xs text-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong>Платёжеспособная целевая аудитория:</strong> 92% пользователей заходят ежедневно во время футбольных матчей топ-лиг (АПЛ, Ла Лига, Серия А, РПЛ) и активно используют Telegram-уведомления и ставки в БК.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: YANDEX METRIKA SETTINGS */}
      {activeTab === 'metrika' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold text-[10px] border border-red-500/30">
                  Яндекс.Метрика
                </span>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Интеграция tag.js активна
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                Подключение официального счётчика Яндекс.Метрики
              </h3>
              <p className="text-xs text-slate-400">
                Введите номер вашего счётчика Яндекс.Метрики для передачи полной статистики визитов, целей и вебвизора в ваш аккаунт Яндекса
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveMetrika} className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4 max-w-xl">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200">
                Номер счётчика Яндекс.Метрики (Counter ID):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={metrikaCounterInput}
                  onChange={(e) => setMetrikaCounterInput(e.target.value)}
                  placeholder="Например: 98765432"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Сохранить
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Номер можно скопировать в личном кабинете <a href="https://metrika.yandex.ru" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline">metrika.yandex.ru</a>
              </p>
            </div>

            {metrikaSavedMsg && (
              <div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs border border-emerald-500/30 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4" />
                <span>Номер счётчика успешно сохранён и подключён к коду отслеживания!</span>
              </div>
            )}
          </form>

          {/* Integration instructions */}
          <div className="border-t border-slate-800 pt-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Какие события и цели автоматически фиксируются:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-white block">hit (Просмотр страницы)</span>
                <span className="text-slate-400 text-[11px]">Фиксирует каждый заход и уникального посетителя в реальном времени.</span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-purple-400 block">click_ad_banner (Клик по рекламе)</span>
                <span className="text-slate-400 text-[11px]">Цель в Метрике при переходе по ссылке партнёра или копировании промокода.</span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-400 block">telegram_signal_push (Сигнал в TG)</span>
                <span className="text-slate-400 text-[11px]">Срабатывание фильтра и отправка уведомления в Telegram-бота игрока.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PRICING & AD PACKAGES */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-xl font-black text-white">Пакеты размещения для рекламодателей</h3>
            <p className="text-xs text-slate-400">
              Бронирование лучших мест с максимальной отдачей и лояльной аудиторией ставок на спорт
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Starter */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold text-[10px]">
                  СТАРТОВЫЙ
                </span>
                <h4 className="text-lg font-bold text-white">Нативная плашка в ленте</h4>
                <div className="text-2xl font-black text-white font-mono">
                  15 000 ₽ <span className="text-xs font-normal text-slate-400">/ 14 дней</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-2">
                  <li className="flex items-center gap-2">✓ Интеграция между матчами лайва</li>
                  <li className="flex items-center gap-2">✓ До 25 000 гарантированных показов</li>
                  <li className="flex items-center gap-2">✓ Промокод с функцией 1-click копирования</li>
                  <li className="flex items-center gap-2">✓ Детальная статистика в этом кабинете</li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setCampaignSlot('in_feed');
                  setIsCreatingCampaign(true);
                  setActiveTab('campaigns');
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
              >
                Выбрать этот слот
              </button>
            </div>

            {/* Pro / Top Billboard */}
            <div className="bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-500/50 rounded-2xl p-6 space-y-4 flex flex-col justify-between relative shadow-xl">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                ХИТ ПРОДАЖ
              </span>

              <div className="space-y-3">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                  МАКСИМАЛЬНЫЙ CTR (7.4%)
                </span>
                <h4 className="text-lg font-bold text-white">Верхний Главный Билборд</h4>
                <div className="text-2xl font-black text-amber-400 font-mono">
                  35 000 ₽ <span className="text-xs font-normal text-slate-400">/ месяц</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-2">
                  <li className="flex items-center gap-2">✓ 1-я позиция над всеми фильтрами и матчами</li>
                  <li className="flex items-center gap-2">✓ 100% охват всех посетителей платформы</li>
                  <li className="flex items-center gap-2">✓ До 70 000+ целевых показов</li>
                  <li className="flex items-center gap-2">✓ Подсветка брендированным градиентом</li>
                  <li className="flex items-center gap-2">✓ Привязка UTM-меток и трекинг целей</li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setCampaignSlot('top_billboard');
                  setIsCreatingCampaign(true);
                  setActiveTab('campaigns');
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition"
              >
                Забронировать Билборд
              </button>
            </div>

            {/* VIP Syndicate Skyscraper */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[10px] border border-indigo-500/30">
                  ДЛЯ БУКМЕКЕРОВ & VIP
                </span>
                <h4 className="text-lg font-bold text-white">Боковые Небоскрёбы (Слева и Справа)</h4>
                <div className="text-2xl font-black text-indigo-400 font-mono">
                  50 000 ₽ <span className="text-xs font-normal text-slate-400">/ месяц</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-2">
                  <li className="flex items-center gap-2">✓ Фиксированное закрепление при скролле</li>
                  <li className="flex items-center gap-2">✓ Постоянная видимость на всех мониторах</li>
                  <li className="flex items-center gap-2">✓ Прямые переходы на регистрацию в БК</li>
                  <li className="flex items-center gap-2">✓ Персональный менеджер и еженедельный отчёт</li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setCampaignSlot('skyscraper_left');
                  setIsCreatingCampaign(true);
                  setActiveTab('campaigns');
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
              >
                Выбрать Небоскрёб
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
