import React, { useState, useEffect } from 'react';
import {
  Globe,
  Zap,
  Radio,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Shield,
  Check,
} from 'lucide-react';
import { DataSourceConfig, DataSourceType, DataSourceStatus } from '../types';
import { safeFetchJson } from '../services/apiClient';

interface DataSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DataSourceConfig;
  onUpdateConfig: (newConfig: DataSourceConfig) => void;
  activeMatchesCount: number;
  onRefreshMatches: () => Promise<void>;
  isRefreshing: boolean;
  lastFetchedAt: string | null;
}

export const DataSourcesModal: React.FC<DataSourcesModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  activeMatchesCount,
  onRefreshMatches,
  isRefreshing,
  lastFetchedAt,
}) => {
  const [activeTab, setActiveTab] = useState<DataSourceType>(config.activeSource || 'flashscore');
  const [testStatus, setTestStatus] = useState<DataSourceStatus | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  // Local draft state for inputs
  const [draftConfig, setDraftConfig] = useState<DataSourceConfig>(config);

  useEffect(() => {
    setDraftConfig(config);
    if (config.activeSource) {
      setActiveTab(config.activeSource);
    }
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async (sourceType: DataSourceType) => {
    setIsTesting(true);
    setTestStatus(null);

    try {
      const { ok, data, error: apiError } = await safeFetchJson<any>('/api/datasources/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: sourceType }),
      });

      if (ok && data && data.ok) {
        setTestStatus({
          source: sourceType,
          configured: true,
          status: 'connected',
          matchesCount: data.matchesFound || 0,
          latencyMs: data.latencyMs,
          quotaInfo: data.remainingQuota,
          message: data.message,
        });
      } else {
        setTestStatus({
          source: sourceType,
          configured: false,
          status: 'error',
          matchesCount: 0,
          latencyMs: data?.latencyMs,
          error: data?.error || apiError || 'Ошибка проверки соединения',
        });
      }
    } catch (err: any) {
      setTestStatus({
        source: sourceType,
        configured: false,
        status: 'error',
        matchesCount: 0,
        error: `Сетевая ошибка: ${err?.message || err}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleApplyAndActivate = (sourceType: DataSourceType) => {
    const updated: DataSourceConfig = {
      ...draftConfig,
      activeSource: sourceType,
    };
    setDraftConfig(updated);
    onUpdateConfig(updated);
    onRefreshMatches();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Источники получения live-данных</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  3 провайдера
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Официальные провайдеры спортивной телеметрии: Flashscore, Фонбет и 1xBet
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRefreshMatches()}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
              title="Запросить свежие live-данные прямо сейчас"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
              <span>{isRefreshing ? 'Синхронизация...' : 'Обновить сейчас'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Global Active Status Banner */}
        <div className="bg-slate-950/80 px-5 py-3 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-slate-400">Активный источник:</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white">
                {config.activeSource === 'fonbet' && '🔴 Фонбет Live (Легальная РФ Линия • Реальный эфир)'}
                {config.activeSource === '1xbet' && '🔷 1xBet Live (Широкая роспись коэффициентов)'}
                {config.activeSource === 'flashscore' && '⚡ Flashscore Live (Мобильный парсер)'}
              </span>
            </div>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">
              В эфире матчей: <strong className="text-emerald-400">{activeMatchesCount}</strong>
            </span>
            {lastFetchedAt && (
              <>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">
                  Обновлено: <strong className="text-slate-200">{lastFetchedAt}</strong>
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={draftConfig.autoRefresh}
                onChange={(e) => {
                  const val = e.target.checked;
                  setDraftConfig((prev) => ({ ...prev, autoRefresh: val }));
                  onUpdateConfig({ ...draftConfig, autoRefresh: val });
                }}
                className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0 focus:ring-offset-0"
              />
              <span>Авто-опрос каждые</span>
            </label>
            <select
              value={draftConfig.refreshIntervalSeconds}
              onChange={(e) => {
                const sec = Number(e.target.value);
                setDraftConfig((prev) => ({ ...prev, refreshIntervalSeconds: sec }));
                onUpdateConfig({ ...draftConfig, refreshIntervalSeconds: sec });
              }}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-white"
            >
              <option value={15}>15 сек</option>
              <option value={25}>25 сек</option>
              <option value={30}>30 сек</option>
              <option value={60}>60 сек</option>
            </select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/90 px-4 sm:px-5 overflow-x-auto gap-2 py-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('flashscore')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'flashscore'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Zap className="h-4 w-4 text-rose-400" />
            <span>1. Flashscore Live</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-500/20 text-rose-300 font-bold">Multi-Mirror</span>
          </button>

          <button
            onClick={() => setActiveTab('fonbet')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'fonbet'
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Radio className="h-4 w-4 text-red-400" />
            <span>2. БК Фонбет Live</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-500/20 text-red-300 font-bold">РФ Линия</span>
          </button>

          <button
            onClick={() => setActiveTab('1xbet')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === '1xbet'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Zap className="h-4 w-4 text-sky-400" />
            <span>3. 1xBet Live</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-sky-500/20 text-sky-300 font-bold">Кэфы & Роспись</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Test Status Feedback Banner */}
          {testStatus && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                testStatus.status === 'connected'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              {testStatus.status === 'connected' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs space-y-1">
                <div className="font-bold text-sm">
                  {testStatus.status === 'connected' ? 'Соединение успешно установлено!' : 'Ошибка подключения'}
                </div>
                <div>{testStatus.message || testStatus.error}</div>
                {testStatus.latencyMs !== undefined && (
                  <div className="text-[11px] opacity-80">
                    Пинг: {testStatus.latencyMs} мс {testStatus.quotaInfo && `• Квота: ${testStatus.quotaInfo}`}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: FLASHSCORE LIVE PARSER */}
          {activeTab === 'flashscore' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Flashscore Live Parser (flashscore.mobi / flashscore.com)</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                          Без лимитов
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Прямой мобильный парсер Flashscore: захватывает все идущие матчи мира, минуты, счет, инциденты и коэффициенты в реальном времени.
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                    Рекомендуемый
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400">Охват матчей:</div>
                    <div className="text-slate-200 font-semibold mt-1">
                      100-250+ одновременно идущих матчей по всему миру
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400">Метрики в лайве:</div>
                    <div className="text-slate-200 font-semibold mt-1">
                      Минута, тайм, счет, опасные атаки, удары в створ, угловые, кэфы 1X2
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400">Лимиты & Ключи:</div>
                    <div className="text-emerald-400 font-semibold mt-1">
                      Полностью бесплатно, без API-ключей и ограничений
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-semibold">Включение коэффициентов Flashscore Odds:</label>
                    <input
                      type="checkbox"
                      checked={draftConfig.flashscore?.includeOdds ?? true}
                      onChange={(e) =>
                        setDraftConfig((prev) => ({
                          ...prev,
                          flashscore: { ...prev.flashscore, includeOdds: e.target.checked },
                        }))
                      }
                      className="rounded border-slate-700 bg-slate-800 text-rose-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <button
                    onClick={() => handleTestConnection('flashscore')}
                    disabled={isTesting}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition"
                  >
                    <Activity className={`h-4 w-4 ${isTesting ? 'animate-spin text-rose-400' : 'text-slate-400'}`} />
                    <span>{isTesting ? 'Проверка...' : 'Проверить соединение с Flashscore'}</span>
                  </button>

                  <button
                    onClick={() => handleApplyAndActivate('flashscore')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                      config.activeSource === 'flashscore'
                        ? 'bg-rose-600 text-white cursor-default'
                        : 'bg-rose-500 hover:bg-rose-400 text-white font-extrabold shadow-lg shadow-rose-950/50'
                    }`}
                  >
                    {config.activeSource === 'flashscore' ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Flashscore Live активен</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        <span>Включить Flashscore Live</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FONBET LIVE */}
          {activeTab === 'fonbet' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🔴</span>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>БК Фонбет Live (Легальная линия РФ)</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                          100% Онлайн
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Официальная live-роспись букмекерской конторы Фонбет: футбол, хоккей КХЛ/НХЛ, баскетбол, теннис, волейбол, настольный теннис.
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30">
                    РФ Линия
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400">Виды спорта:</div>
                    <div className="text-slate-200 font-semibold mt-1">
                      Футбол, Хоккей, Баскетбол, Теннис, Волейбол, Настольный теннис
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400">Котировки & Роспись:</div>
                    <div className="text-slate-200 font-semibold mt-1">
                      П1 / X / П2, форы, тоталы голов/шайб/геймов в лайве
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400">Стабильность:</div>
                    <div className="text-emerald-400 font-semibold mt-1">
                      Работает без VPN, без капчи и без блокировок
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <button
                    onClick={() => handleTestConnection('fonbet')}
                    disabled={isTesting}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition"
                  >
                    <Activity className={`h-4 w-4 ${isTesting ? 'animate-spin text-red-400' : 'text-slate-400'}`} />
                    <span>{isTesting ? 'Опрос линии...' : 'Проверить подключение к Фонбет'}</span>
                  </button>

                  <button
                    onClick={() => handleApplyAndActivate('fonbet')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                      config.activeSource === 'fonbet'
                        ? 'bg-red-600 text-white cursor-default'
                        : 'bg-red-500 hover:bg-red-400 text-white font-extrabold shadow-lg shadow-red-950/50'
                    }`}
                  >
                    {config.activeSource === 'fonbet' ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Фонбет Live активен</span>
                      </>
                    ) : (
                      <>
                        <Radio className="h-4 w-4" />
                        <span>Включить Фонбет Live</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 1XBET LIVE */}
          {activeTab === '1xbet' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🔷</span>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>1xBet / 1хСтавка Live Feed</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                          Широкая роспись
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Глубокая роспись рынков: угловые, карточки, фолы, удары в створ и ранние коэффициенты на все мировые события.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400">Охват:</div>
                    <div className="text-slate-200 font-semibold mt-1">Футбол, Хоккей, Баскетбол, Теннис</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400">Метрики:</div>
                    <div className="text-slate-200 font-semibold mt-1">Минута, счёт, кэфы 1X2, тоталы</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400">Статус шлюза:</div>
                    <div className="text-cyan-400 font-semibold mt-1">Прямой live-фид активен</div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                  <button
                    onClick={() => handleTestConnection('1xbet')}
                    disabled={isTesting}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition"
                  >
                    <Activity className={`h-4 w-4 ${isTesting ? 'animate-spin text-sky-400' : 'text-slate-400'}`} />
                    <span>{isTesting ? 'Проверка...' : 'Проверить 1xBet'}</span>
                  </button>

                  <button
                    onClick={() => handleApplyAndActivate('1xbet')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                      config.activeSource === '1xbet'
                        ? 'bg-sky-600 text-white cursor-default'
                        : 'bg-sky-500 hover:bg-sky-400 text-white font-extrabold shadow-lg shadow-sky-950/50'
                    }`}
                  >
                    {config.activeSource === '1xbet' ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>1xBet активен</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        <span>Включить 1xBet Live</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span>Прямые защищенные каналы связи с Flashscore, Фонбет и 1xBet</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
