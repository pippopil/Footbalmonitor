import React, { useState } from 'react';
import {
  ShieldAlert,
  Terminal,
  Zap,
  Flame,
  Radio,
  Sliders,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Send,
  Lock,
  Unlock,
  CheckCircle2,
  Crown,
  Database,
  Eye,
  RotateCcw
} from 'lucide-react';
import { UserProfile, Match, FilterRule, DataSourceConfig, DataSourceType } from '../types';
import { EXPANDED_DEFAULT_FILTERS } from '../data/defaultFilters';

interface GodModeConsoleProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  matches: Match[];
  filters: FilterRule[];
  onSetMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  onSetFilters: React.Dispatch<React.SetStateAction<FilterRule[]>>;
  onUpdateCurrentUser: (updated: UserProfile) => void;
  onSendTestBroadcast: (message: string) => Promise<void>;
  dataSourceConfig?: DataSourceConfig;
  onSwitchDataSource?: (source: DataSourceType) => void;
  onOpenDataSourcesModal?: () => void;
}

export const GodModeConsole: React.FC<GodModeConsoleProps> = ({
  currentUser,
  allUsers,
  matches,
  filters,
  onSetMatches,
  onSetFilters,
  onUpdateCurrentUser,
  onSendTestBroadcast,
  dataSourceConfig,
  onSwitchDataSource,
  onOpenDataSourcesModal,
}) => {
  const [broadcastText, setBroadcastText] = useState('🚨 [GOD BROADCAST] Внимание! Зафиксирован 100% сигнал Smart Money на рынке Премьер-Лиги.');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (currentUser.role !== 'god' && currentUser.username !== 'developer_god' && currentUser.plan !== 'GOD_MODE') {
    return null;
  }

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // God action: unlock all bots and unlimited limits
  const handleBoostBalance = () => {
    onUpdateCurrentUser({
      ...currentUser,
      balanceRub: currentUser.balanceRub + 10000000,
    });
    showStatus('Баланс разработчика пополнен на +10,000,000 ₽');
  };

  // God action: activate all filters instantly
  const handleEnableAllFilters = () => {
    onSetFilters((prev) =>
      prev.map((f) => ({
        ...f,
        enabled: true,
      }))
    );
    showStatus(`Активированы ВСЕ стратегии и фильтры (${filters.length} шт.) для всех матчей`);
  };

  // God action: restore full catalog of 50+ preset strategies
  const handleRestoreAllPresetFilters = () => {
    const defaultBot = currentUser.telegramBots.find((b) => b.isDefault) || currentUser.telegramBots[0];
    const restored = EXPANDED_DEFAULT_FILTERS.map((f, idx) => ({
      ...f,
      userId: currentUser.id,
      botId: defaultBot?.id,
      enabled: idx < 4 ? true : f.enabled !== false,
    }));
    onSetFilters(restored);
    try {
      localStorage.setItem(`footbalmonitor_filters_user_${currentUser.id}`, JSON.stringify(restored));
      localStorage.setItem('footbalmonitor_filters', JSON.stringify(restored));
    } catch {}
    showStatus('Все 50+ заводских алгоритмов платформы успешно восстановлены!');
  };

  // God action: force match pressure to max
  const handleForceMaxPressure = () => {
    onSetMatches((prev) =>
      prev.map((m, idx) => {
        if (idx !== 0) return m;
        return {
          ...m,
          stats: {
            ...m.stats,
            dangerousAttacks: [92, 18],
            shotsOnTarget: [14, 2],
            corners: [11, 1],
            xg: [3.85, 0.42],
          },
          history: {
            ...(m.history || {}),
            predictedIpt: 3.45,
          },
          lastEvent: "⚡ [GOD MODE] Ручная стимуляция: максимальное давление (IPT 3.45, 92 оп. атаки, 14 в створ)",
        };
      })
    );
    showStatus('Матч #1 переведён в режим аномального давления и штурма ворот!');
  };

  // God action: simulate mega odds drop
  const handleInjectMegaOddsDrop = () => {
    onSetMatches((prev) =>
      prev.map((m, idx) => {
        if (idx !== 0) return m;
        return {
          ...m,
          odds: {
            ...m.odds,
            home: 1.35,
            over25: 1.45,
          },
          oddsDrop: {
            market: 'HOME',
            marketName: `П1 (${m.homeTeam})`,
            initialOdds: 2.25,
            currentOdds: 1.35,
            dropPercent: 40.0,
            moneyVolumePercent: 92,
            moneyVolumeAmountEur: 650000,
            bookmaker: 'Betfair Exchange / Pinnacle (VIP Syndicate)',
            detectedAtMinute: m.minute || 55,
          },
          lastEvent: "🚨 [GOD MODE] Вброс инсайдерского прогруза: -40.0% на П1 (650,000 € в рынке)",
        };
      })
    );
    showStatus('Инъекция супер-прогруза (-40% кэф, 92% пула) успешно внедрена в матч #1');
  };

  const handleSendGodBroadcast = async () => {
    if (!broadcastText.trim()) return;
    setIsBroadcasting(true);
    try {
      await onSendTestBroadcast(broadcastText);
      showStatus('Сообщение разослано по всем активным каналам Telegram!');
    } catch (e: any) {
      showStatus('Ошибка отправки: ' + (e?.message || e));
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-950/40 via-slate-950 to-slate-900 border-2 border-purple-500/50 rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/30 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-purple-900/50 border border-purple-300/40">
            <Zap className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                GOD MODE CONSOLE
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/30 text-purple-300 border border-purple-400/50">
                  Уровень доступа: «БОГ»
                </span>
              </h2>
            </div>
            <p className="text-xs text-purple-200/70">
              Полный контроль над сканером, базами данных матчей, коэффициентами, стратегиями и Telegram-рассылками
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-purple-400" />
            ROOT_OVERRIDE: ACTIVE
          </span>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-purple-950/80 border border-purple-500/60 rounded-xl text-xs text-purple-200 flex items-center gap-2 animate-fadeIn font-semibold shadow-lg">
          <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
        <div className="bg-slate-900/80 border border-purple-500/30 rounded-xl p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
              <DollarSign className="h-4 w-4 text-amber-400" />
              <span>Бесконечный Банк</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Пополнить баланс аккаунта разработчика на любую сумму
            </p>
          </div>
          <button
            onClick={handleBoostBalance}
            className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-md active:scale-95 flex items-center justify-center gap-1.5"
          >
            <DollarSign className="h-3.5 w-3.5" />
            +10,000,000 ₽ в банк
          </button>
        </div>

        <div className="bg-slate-900/80 border border-purple-500/30 rounded-xl p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
              <RotateCcw className="h-4 w-4 text-teal-400" />
              <span>Вернуть все стратегии</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Восстановить полный каталог 50+ заводских алгоритмов
            </p>
          </div>
          <button
            onClick={handleRestoreAllPresetFilters}
            className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-md active:scale-95 flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Вернуть все 50+
          </button>
        </div>

        <div className="bg-slate-900/80 border border-purple-500/30 rounded-xl p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
              <Sliders className="h-4 w-4 text-emerald-400" />
              <span>Все стратегии ON</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Мгновенно активировать все {filters.length} фильтров и стратегий
            </p>
          </div>
          <button
            onClick={handleEnableAllFilters}
            className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Unlock className="h-3.5 w-3.5" />
            Включить все {filters.length}
          </button>
        </div>

        <div className="bg-slate-900/80 border border-purple-500/30 rounded-xl p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
              <Flame className="h-4 w-4 text-red-400" />
              <span>Осада ворот (IPT 3.45)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Инициировать экстремальное давление для триггера сигналов
            </p>
          </div>
          <button
            onClick={handleForceMaxPressure}
            className="w-full py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-md active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Flame className="h-3.5 w-3.5" />
            Запустить Штурм
          </button>
        </div>

        <div className="bg-slate-900/80 border border-purple-500/30 rounded-xl p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              <span>Супер Smart Money</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Вбросить прогруз -40% на П1 с объёмом 650 000 €
            </p>
          </div>
          <button
            onClick={handleInjectMegaOddsDrop}
            className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-md active:scale-95 flex items-center justify-center gap-1.5"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Инъекция -40% кэфа
          </button>
        </div>
      </div>

      {/* God Mode Manual Data Provider Switcher */}
      <div className="bg-slate-900/90 border border-purple-500/40 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-purple-200 uppercase tracking-wider">
              Ручное переключение источников статистики (Data Providers)
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">Активный источник:</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              {dataSourceConfig?.activeSource || 'flashscore'}
            </span>
            {onOpenDataSourcesModal && (
              <button
                type="button"
                onClick={onOpenDataSourcesModal}
                className="text-[10px] text-purple-300 hover:text-white underline ml-1"
              >
                Все настройки
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          В режиме Создателя (God Mode) доступно принудительное ручное переключение источника спортивной телеметрии.
          Ротация источников не затронет баланс пользователей и настройки сохранённых фильтров.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'flashscore', label: '⚡ Flashscore', desc: 'Парсер мобильных зеркал' },
            { id: 'sofascore', label: '⚽ Sofascore', desc: 'Браузерный релей API' },
            { id: 'fonbet', label: '🔴 Фонбет Live', desc: 'Легальная линия РФ' },
            { id: '1xbet', label: '🔷 1xBet Live', desc: 'Широкая роспись' },
            { id: 'sstats', label: '📊 SStats.net', desc: 'Официальный API' },
            { id: 'api-football', label: '⚡ API-Football', desc: 'v3 Global Fixtures' },
            { id: 'public-feed', label: '🌐 Public Feed', desc: 'Открытый фид' },
            { id: 'simulated', label: '🎮 Демо-генератор', desc: 'Песочница' },
          ].map((src) => {
            const isActive = dataSourceConfig?.activeSource === src.id;
            return (
              <button
                key={src.id}
                type="button"
                onClick={() => {
                  if (onSwitchDataSource) {
                    onSwitchDataSource(src.id as DataSourceType);
                    showStatus(`Источник линии переключён на ${src.label}`);
                  }
                }}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  isActive
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-purple-500/40 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isActive ? 'text-cyan-300' : 'text-slate-200'}`}>
                    {src.label}
                  </span>
                  {isActive && <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />}
                </div>
                <span className="text-[10px] text-slate-500 mt-1">{src.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* God Mode Broadcast Control */}
      <div className="bg-slate-900/90 border border-purple-500/40 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-purple-300 flex items-center gap-2">
            <Radio className="h-4 w-4 text-purple-400" />
            Прямая трансляция сигнала Создателя во все подключенные Telegram каналы:
          </label>
          <span className="text-[10px] text-slate-400">
            Подключено ботов в профиле: {currentUser.telegramBots.length}
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={broadcastText}
            onChange={(e) => setBroadcastText(e.target.value)}
            className="flex-1 bg-slate-950 border border-purple-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
            placeholder="Текст экстренного сигнала..."
          />
          <button
            onClick={handleSendGodBroadcast}
            disabled={isBroadcasting}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition shadow-lg flex items-center gap-2 shrink-0 active:scale-95 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{isBroadcasting ? 'Отправка...' : 'God Broadcast'}</span>
          </button>
        </div>
      </div>

      {/* System Metrics Bar */}
      <div className="pt-2 border-t border-purple-500/20 flex flex-wrap items-center justify-between gap-4 text-xs text-purple-300/80 font-mono">
        <div className="flex items-center gap-4 flex-wrap">
          <span>СЕРВЕР: ONLINE</span>
          <span>ПОЛЬЗОВАТЕЛЕЙ: {allUsers.length}</span>
          <span>МАТЧЕЙ В СКАНЕРЕ: {matches.length}</span>
          <span>СТРАТЕГИЙ В ПАМЯТИ: {filters.length}</span>
          <span>АВТОРИЗАЦИЯ: GOD_KEY_ACTIVE</span>
        </div>
        <div className="text-[11px] text-amber-300 font-bold">
          ⚡ Безлимитные боты • Обход лимитов API • Полный доступ
        </div>
      </div>
    </div>
  );
};
