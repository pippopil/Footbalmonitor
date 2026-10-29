import React from 'react';
import {
  Sparkles,
  BarChart3,
  ExternalLink,
  Shield,
  Activity,
  Layers,
  Send,
  User,
  Radio,
  Clock,
  TrendingUp,
  ChevronRight,
  GraduationCap,
  Download,
  Smartphone,
} from 'lucide-react';
import { SiteAnalyticsData, AdBannerItem } from '../types';
import { AppLogo } from './AppLogo';
import { useLanguage } from '../i18n/LanguageContext';

interface AppFooterProps {
  analytics: SiteAnalyticsData;
  ads: AdBannerItem[];
  activeTab: string;
  onSelectTab: (tab: 'matches' | 'filters' | 'signals' | 'backtest' | 'telegram' | 'cabinet' | 'advertiser' | 'education') => void;
  dataSourceName: string;
  isMonitoringActive: boolean;
  liveMatchesCount: number;
  activeFiltersCount: number;
  signalsCount: number;
}

export const AppFooter: React.FC<AppFooterProps> = ({
  analytics,
  ads,
  activeTab,
  onSelectTab,
  dataSourceName,
  isMonitoringActive,
  liveMatchesCount,
  activeFiltersCount,
  signalsCount,
}) => {
  const { t } = useLanguage();

  const handleOpenAdvertiser = () => {
    onSelectTab('advertiser');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNavigate = (tab: 'matches' | 'filters' | 'signals' | 'backtest' | 'telegram' | 'cabinet' | 'advertiser' | 'education') => {
    onSelectTab(tab);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer id="app-footer" className="mt-8 border-t border-slate-800 bg-slate-950/95 text-slate-300">
      {/* Top Banner & Quick Advertiser Bar */}
      <div className="border-b border-slate-800/80 bg-gradient-to-r from-amber-950/20 via-slate-900/60 to-emerald-950/20 px-4 py-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Кабинет Рекламодателя & Партнёрская сеть</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                  Реклама & PR
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Размещение рекламных баннеров Top, Skyscraper и карточек матчей с гарантированным охватом беттинг-аудитории.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              id="footer-open-advertiser-btn"
              onClick={handleOpenAdvertiser}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/40 border border-amber-400/40 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Раздел для рекламодателей & Аналитика</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Brand & Scanner Status */}
          <div className="space-y-4">
            <AppLogo size="sm" animated={false} />
            <p className="text-xs text-slate-400 leading-relaxed">
              Профессиональный аналитический сканер live-матчей и доматчевых линий. Отслеживание аномальных прогрузов коэффициентов, xG-индексов и автоматическая доставка сигналов в Telegram.
            </p>
            <div className="space-y-2 pt-1 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">{t('activeProvider')}:</span>
                <span className="font-semibold text-emerald-400 font-mono">{dataSourceName}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Статус сканера:</span>
                <span className="flex items-center gap-1.5 font-semibold text-xs font-mono">
                  {isMonitoringActive ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-emerald-400">{t('monitoringActive')}</span>
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      <span className="text-amber-400">{t('monitoringPaused')}</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: Minimal Discreet Counter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Счётчик
              </h4>
            </div>

            {/* Ultra-compact minimal counter badge */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Онлайн:
                </span>
                <span className="font-bold text-emerald-400">{analytics.onlineNow}</span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Визитов:</span>
                <span className="font-bold text-slate-200">{analytics.todayUniques}</span>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <button
                  onClick={handleOpenAdvertiser}
                  className="w-full py-1.5 px-2 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-amber-500/30 text-[11px] font-bold transition flex items-center justify-center gap-1"
                >
                  <span>Все метрики в кабинете рекламодателя →</span>
                </button>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 leading-tight">
              Минимальный счётчик. Полная аналитика посещений и Яндекс.Метрика — в кабинете рекламодателя.
            </p>
          </div>

          {/* Column 3: Platform Navigation */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-sky-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Разделы платформы
              </h4>
            </div>

            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => handleNavigate('matches')}
                  className={`flex items-center justify-between w-full p-1.5 rounded-lg hover:bg-slate-900 transition text-left ${
                    activeTab === 'matches' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5" />
                    <span>{t('navLiveMatches')}</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                    {liveMatchesCount}
                  </span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigate('filters')}
                  className={`flex items-center justify-between w-full p-1.5 rounded-lg hover:bg-slate-900 transition text-left ${
                    activeTab === 'filters' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5" />
                    <span>{t('navStrategies')}</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                    {activeFiltersCount}
                  </span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigate('signals')}
                  className={`flex items-center justify-between w-full p-1.5 rounded-lg hover:bg-slate-900 transition text-left ${
                    activeTab === 'signals' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Radio className="h-3.5 w-3.5" />
                    <span>{t('navSignals')}</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                    {signalsCount}
                  </span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigate('backtest')}
                  className={`flex items-center justify-between w-full p-1.5 rounded-lg hover:bg-slate-900 transition text-left ${
                    activeTab === 'backtest' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>{t('navBacktest')}</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-[10px] font-mono text-emerald-300 font-bold">
                    ROI
                  </span>
                </button>
              </li>

              <li>
                <button
                  onClick={() => handleNavigate('education')}
                  className={`flex items-center justify-between w-full p-1.5 rounded-lg hover:bg-slate-900 transition text-left ${
                    activeTab === 'education' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <GraduationCap className="h-3.5 w-3.5 text-amber-400" />
                    <span>{t('navEducation')}</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                    ГИД
                  </span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigate('cabinet')}
                  className={`flex items-center justify-between w-full p-1.5 rounded-lg hover:bg-slate-900 transition text-left ${
                    activeTab === 'cabinet' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    <span>{t('navCabinet')}</span>
                  </span>
                  <span className="text-[10px] text-purple-400 font-mono">ROOT</span>
                </button>
              </li>
              <li className="pt-1">
                <a
                  href="https://github.com/pippopil/WebFootbalFiltr/releases/latest/download/SportSignal-latest.apk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition text-left text-xs font-bold"
                >
                  <span className="flex items-center gap-2">
                    <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{t('downloadApkBtn')}</span>
                  </span>
                  <Download className="h-3.5 w-3.5 text-emerald-400 animate-bounce" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Commercial & Contacts */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Реклама и сотрудничество
              </h4>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3">
              <div className="text-xs text-slate-300">
                Целевая аудитория профессиональных капперов, трейдеров котировок и спортивных аналитиков.
              </div>
              <div className="space-y-1.5 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span>Форматы: Top Billboard, Skyscraper, Карточки</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Прозрачная статистика показов, кликов и CTR</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                  <span>Интеграция с Яндекс.Метрикой и пикселями</span>
                </div>
              </div>

              <button
                onClick={handleOpenAdvertiser}
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>Управление кампаниями</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              <span>Защита от спама и фрод-трафика активна</span>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} <span className="text-slate-300 font-semibold">SportSignal AI Pro</span>. Все права защищены.
          </div>
          <div className="text-center sm:text-right text-[11px]">
            Статистика, вероятности и сигналы носят сугубо информационно-аналитический характер. Платформа не организует азартные игры.
          </div>
        </div>
      </div>
    </footer>
  );
};
