import React, { useState, useEffect } from 'react';
import {
  Globe,
  Zap,
  Database,
  Radio,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Key,
  Copy,
  Terminal,
  Server,
  Activity,
  Trash2,
  ExternalLink,
  Shield,
  Check,
} from 'lucide-react';
import { DataSourceConfig, DataSourceType, DataSourceStatus } from '../types';

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
  const [activeTab, setActiveTab] = useState<DataSourceType>(config.activeSource);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<DataSourceStatus | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [codeLanguage, setCodeLanguage] = useState<'python' | 'curl' | 'node'>('python');

  // Local draft state for inputs
  const [draftConfig, setDraftConfig] = useState<DataSourceConfig>(config);

  useEffect(() => {
    setDraftConfig(config);
    setActiveTab(config.activeSource);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const webhookUrl = `${currentOrigin}/api/feed/ingest`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleTestConnection = async (sourceType: DataSourceType) => {
    setIsTesting(true);
    setTestStatus(null);

    try {
      let body: any = { source: sourceType };
      if (sourceType === 'sstats') {
        body.sstatsKey = draftConfig.sstats?.apiKey;
      } else if (sourceType === 'api-football') {
        body.apiKey = draftConfig.apiFootball.apiKey;
        body.provider = draftConfig.apiFootball.provider;
      } else if (sourceType === 'football-data') {
        body.token = draftConfig.footballData.apiToken;
      }

      const res = await fetch('/api/datasources/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
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
          latencyMs: data.latencyMs,
          error: data.error || 'Ошибка проверки соединения',
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
    onUpdateConfig(updated);
    setTimeout(() => {
      onRefreshMatches();
    }, 150);
  };

  const handleClearWebhookFeed = async () => {
    try {
      await fetch('/api/feed/ingest', { method: 'DELETE' });
      onRefreshMatches();
    } catch (e) {
      console.error(e);
    }
  };

  const pythonSnippet = `import requests
import json

# Footbalmonitor Webhook Ingestion
WEBHOOK_URL = "${webhookUrl}"
SECRET_KEY = "${draftConfig.webhook.secretKey || 'footbalmonitor_secret_key_2026'}"

# Формат передаваемого live-матча
live_match = {
    "id": "match_unique_id_101",
    "homeTeam": "Arsenal",
    "awayTeam": "Manchester City",
    "score": [1, 1],
    "minute": 67,
    "status": "LIVE",
    "country": "England",
    "league": "Premier League",
    "stats": {
        "possession": [58, 42],
        "dangerousAttacks": [64, 38],
        "attacks": [112, 74],
        "shotsOnTarget": [7, 3],
        "shotsOffTarget": [5, 2],
        "corners": [8, 2],
        "yellowCards": [2, 3],
        "redCards": [0, 0],
        "xg": [1.84, 0.92]
    },
    "momentum": [10, 25, 40, 55, 65, 75]
}

headers = {
    "Content-Type": "application/json",
    "x-webhook-secret": SECRET_KEY
}

# Отправка единичного матча или списка [live_match, ...]
response = requests.post(WEBHOOK_URL, json=live_match, headers=headers)
print("Статус:", response.status_code, response.json())`;

  const nodeSnippet = `// Node.js Ingestion Script
const WEBHOOK_URL = "${webhookUrl}";
const SECRET_KEY = "${draftConfig.webhook.secretKey || 'footbalmonitor_secret_key_2026'}";

async function pushLiveMatch() {
  const match = {
    id: "match_" + Date.now(),
    homeTeam: "Real Madrid",
    awayTeam: "Barcelona",
    score: [2, 1],
    minute: 78,
    status: "LIVE",
    country: "Spain",
    league: "La Liga",
    stats: {
      possession: [54, 46],
      dangerousAttacks: [78, 62],
      attacks: [120, 95],
      shotsOnTarget: [8, 5],
      shotsOffTarget: [4, 3],
      corners: [7, 4],
      yellowCards: [3, 2],
      redCards: [0, 0],
      xg: [2.15, 1.40]
    },
    momentum: [15, 30, 45, 60, 50, 70]
  };

  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": SECRET_KEY
    },
    body: JSON.stringify(match)
  });

  const data = await res.json();
  console.log("Ingested:", data);
}

pushLiveMatch();`;

  const curlSnippet = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${draftConfig.webhook.secretKey || 'footbalmonitor_secret_key_2026'}" \\
  -d '{
    "homeTeam": "Bayern Munich",
    "awayTeam": "Borussia Dortmund",
    "score": [2, 0],
    "minute": 54,
    "status": "LIVE",
    "country": "Germany",
    "league": "Bundesliga",
    "stats": {
      "possession": [62, 38],
      "dangerousAttacks": [55, 24],
      "attacks": [94, 48],
      "shotsOnTarget": [6, 2],
      "shotsOffTarget": [4, 1],
      "corners": [6, 1],
      "yellowCards": [1, 2],
      "redCards": [0, 0],
      "xg": [1.95, 0.40]
    }
  }'`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Подключение источников реальных данных
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  LIVE ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Интеграция с официальными спортивными API, открытыми фидами и собственными парсерами
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
              <span className={`h-2 w-2 rounded-full ${config.activeSource === 'simulated' ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
              <span className="text-white">
                {config.activeSource === 'flashscore' && '⚡ Flashscore Live (Парсер)'}
                {config.activeSource === 'sstats' && '📊 SStats.net API (Smart Tables)'}
                {config.activeSource === 'sofascore' && '⚽ Sofascore Live'}
                {config.activeSource === 'public-feed' && '🌐 Открытый Live-Фид (Топ-Лиги)'}
                {config.activeSource === 'api-football' && '⚡ API-Football (v3)'}
                {config.activeSource === 'football-data' && '🏆 Football-Data.org'}
                {config.activeSource === 'webhook' && '🔌 Пользовательский Webhook'}
                {config.activeSource === 'simulated' && '🎮 Локальный Демо-генератор'}
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
              <option value={30}>30 сек</option>
              <option value={60}>60 сек</option>
            </select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/90 px-4 sm:px-5 overflow-x-auto gap-1 py-1.5 scrollbar-none">
          <button
            onClick={() => setActiveTab('flashscore')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'flashscore'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Zap className="h-4 w-4 text-rose-400" />
            <span>1. Flashscore Live</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-500/20 text-rose-300 font-bold">Парсер</span>
          </button>

          <button
            onClick={() => setActiveTab('sstats')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'sstats'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Database className="h-4 w-4 text-blue-400" />
            <span>2. SStats.net API</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-500/20 text-blue-300">Smart Tables</span>
          </button>

          <button
            onClick={() => setActiveTab('sofascore')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'sofascore'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="h-4 w-4 text-amber-400" />
            <span>3. Sofascore Live</span>
          </button>

          <button
            onClick={() => setActiveTab('webhook')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'webhook'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="h-4 w-4 text-cyan-400" />
            <span>4. Webhook / Скрипты</span>
          </button>

          <button
            onClick={() => setActiveTab('public-feed')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'public-feed'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>5. Открытый Фид</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300">Топ-Лиги</span>
          </button>

          <button
            onClick={() => setActiveTab('api-football')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'api-football'
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Server className="h-4 w-4" />
            <span>6. API-Football</span>
          </button>

          <button
            onClick={() => setActiveTab('football-data')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'football-data'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Radio className="h-4 w-4" />
            <span>7. Football-Data</span>
          </button>

          <button
            onClick={() => setActiveTab('simulated')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'simulated'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>8. Демо</span>
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

          {/* TAB: FLASHSCORE LIVE PARSER */}
          {activeTab === 'flashscore' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Flashscore Live Parser (flashscore.mobi)</span>
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
                    <span className="font-semibold text-slate-300">Настройки парсера Flashscore:</span>
                    <span className="text-[11px] text-slate-400">Источник: https://flashscore.mobi/?s=2</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-slate-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draftConfig.flashscore?.includeOdds ?? true}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setDraftConfig((prev) => ({
                            ...prev,
                            flashscore: { ...(prev.flashscore || { enabled: true, maxMatches: 150 }), includeOdds: val },
                          }));
                        }}
                        className="rounded border-slate-700 bg-slate-800 text-rose-500"
                      />
                      <span>Рассчитывать коэффициенты 1X2 и тоталы для стратегий</span>
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                  <button
                    onClick={() => handleTestConnection('flashscore')}
                    disabled={isTesting}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition"
                  >
                    <Activity className={`h-4 w-4 ${isTesting ? 'animate-spin text-rose-400' : 'text-slate-400'}`} />
                    <span>{isTesting ? 'Парсинг Flashscore...' : 'Проверить парсер Flashscore'}</span>
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
                        <span>Flashscore активен</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        <span>Включить Flashscore как основной</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SSTATS.NET (SMART TABLES) */}
          {activeTab === 'sstats' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>SStats.net Football API (Smart Tables)</span>
                        <a
                          href="https://sstats.net"
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          sstats.net <ExternalLink className="h-3 w-3" />
                        </a>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Официальная футбольная статистика и коэффициенты букмекеров со сквозными ID матчей Flashscore.
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
                    Live + Odds
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      API-Ключ SStats.net (необязательно для базового фида):
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={draftConfig.sstats?.apiKey || ''}
                        onChange={(e) =>
                          setDraftConfig((prev) => ({
                            ...prev,
                            sstats: { ...(prev.sstats || { enabled: true }), apiKey: e.target.value },
                          }))
                        }
                        placeholder="Оставьте пустым или введите персональный ApiKey..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs font-mono pr-16"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-[11px] px-1.5 py-0.5 rounded bg-slate-800"
                      >
                        {showApiKey ? 'Скрыть' : 'Показать'}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Эндпоинт: <code className="text-blue-400">api.sstats.net/games/live</code>
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-semibold text-slate-200">Преимущества SStats:</div>
                    <ul className="text-slate-400 list-disc list-inside space-y-0.5 text-[11px]">
                      <li>Прямая связка с Flashscore ID (идеально для бэктестов)</li>
                      <li>Точные линии букмекеров: 1X2, ТБ 2.5, Обе забьют</li>
                      <li>Опасные атаки, удары и владение мячом</li>
                    </ul>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                  <button
                    onClick={() => handleTestConnection('sstats')}
                    disabled={isTesting}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition"
                  >
                    <Activity className={`h-4 w-4 ${isTesting ? 'animate-spin text-blue-400' : 'text-slate-400'}`} />
                    <span>{isTesting ? 'Подключение к SStats...' : 'Проверить SStats API'}</span>
                  </button>

                  <button
                    onClick={() => handleApplyAndActivate('sstats')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                      config.activeSource === 'sstats'
                        ? 'bg-blue-600 text-white cursor-default'
                        : 'bg-blue-500 hover:bg-blue-400 text-white font-extrabold shadow-lg shadow-blue-950/50'
                    }`}
                  >
                    {config.activeSource === 'sstats' ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>SStats.net активен</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        <span>Включить SStats.net</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SOFASCORE LIVE */}
          {activeTab === 'sofascore' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⚽</span>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Sofascore Live API & Скрипт</span>
                        <a
                          href="https://www.sofascore.com"
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                        >
                          sofascore.com <ExternalLink className="h-3 w-3" />
                        </a>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Официальный live-фид событий и инцидентов Sofascore. При блокировке Cloudflare можно запустить готовый Python-скрипт.
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                    Sofascore
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-2">
                  <div className="font-semibold text-slate-200">Запуск автономного парсера Sofascore на вашем ПК:</div>
                  <div className="bg-slate-950 p-2.5 rounded font-mono text-[11px] text-amber-300 flex items-center justify-between">
                    <span>python scripts/sofascore_collector.py</span>
                    <button
                      onClick={() => copyToClipboard('python scripts/sofascore_collector.py', 'sofacmd')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                    >
                      {copiedCode === 'sofacmd' ? 'Скопировано!' : 'Копировать'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Скрипт автоматически опрашивает Sofascore каждые 15 секунд и передает все live-матчи прямо в интерфейс Footbalmonitor.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                  <button
                    onClick={() => handleTestConnection('sofascore')}
                    disabled={isTesting}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition"
                  >
                    <Activity className={`h-4 w-4 ${isTesting ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
                    <span>{isTesting ? 'Проверка Sofascore...' : 'Проверить Sofascore API'}</span>
                  </button>

                  <button
                    onClick={() => handleApplyAndActivate('sofascore')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                      config.activeSource === 'sofascore'
                        ? 'bg-amber-600 text-white cursor-default'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow-lg shadow-amber-950/50'
                    }`}
                  >
                    {config.activeSource === 'sofascore' ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Sofascore активен</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        <span>Включить Sofascore</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: PUBLIC LIVE FEED */}
          {activeTab === 'public-feed' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🌐</span>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Открытый Live-Фид топовых европейских чемпионатов
                      </h4>
                      <p className="text-xs text-slate-400">
                        Мгновенное подключение к реальным матчам без регистрации, платных подписок и API-ключей
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                    Готов к работе
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400">Охват лиг:</div>
                    <div className="text-slate-200 font-semibold mt-1">
                      АПЛ, Ла Лига, Серия А, Бундеслига, Лига 1, Лига Чемпионов
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400">Метрики в эфире:</div>
                    <div className="text-slate-200 font-semibold mt-1">
                      Счет, минута, удары в створ, владение %, угловые, карточки, xG
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400">Частота обновления:</div>
                    <div className="text-emerald-400 font-semibold mt-1">
                      Реальное время (кэш 15 секунд)
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                  <button
                    onClick={() => handleTestConnection('public-feed')}
                    disabled={isTesting}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition"
                  >
                    <Activity className={`h-4 w-4 ${isTesting ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
                    <span>{isTesting ? 'Тестирование...' : 'Проверить доступность фида'}</span>
                  </button>

                  <button
                    onClick={() => handleApplyAndActivate('public-feed')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                      config.activeSource === 'public-feed'
                        ? 'bg-emerald-600 text-white cursor-default'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow-lg shadow-emerald-950/50'
                    }`}
                  >
                    {config.activeSource === 'public-feed' ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Источник активен</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        <span>Включить как основной источник</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: API-FOOTBALL */}
          {activeTab === 'api-football' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>API-Football (v3 API-Sports / RapidAPI)</span>
                      <a
                        href="https://www.api-football.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        Официальный сайт <ExternalLink className="h-3 w-3" />
                      </a>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Золотой стандарт профессионального лайв-мониторинга: 900+ мировых лиг, точные опасные атаки, карточки, угловые и xG.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                    Pro Data
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Provider selection */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">Провайдер API:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setDraftConfig((prev) => ({
                            ...prev,
                            apiFootball: { ...prev.apiFootball, provider: 'api-sports' },
                          }))
                        }
                        className={`p-2.5 rounded-lg border text-left font-medium transition ${
                          draftConfig.apiFootball.provider === 'api-sports'
                            ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                        }`}
                      >
                        <div className="font-bold">API-Sports (Direct)</div>
                        <div className="text-[10px] opacity-75">v3.football.api-sports.io</div>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDraftConfig((prev) => ({
                            ...prev,
                            apiFootball: { ...prev.apiFootball, provider: 'rapidapi' },
                          }))
                        }
                        className={`p-2.5 rounded-lg border text-left font-medium transition ${
                          draftConfig.apiFootball.provider === 'rapidapi'
                            ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                        }`}
                      >
                        <div className="font-bold">RapidAPI Hub</div>
                        <div className="text-[10px] opacity-75">api-football-v1.p.rapidapi.com</div>
                      </button>
                    </div>
                  </div>

                  {/* Leagues filter */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      Фильтр ID лиг (опционально):
                    </label>
                    <input
                      type="text"
                      placeholder="Например: 39, 140, 135, 78 (или пусто для всех)"
                      value={draftConfig.apiFootball.leaguesFilter}
                      onChange={(e) =>
                        setDraftConfig((prev) => ({
                          ...prev,
                          apiFootball: { ...prev.apiFootball, leaguesFilter: e.target.value },
                        }))
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <div className="text-[10px] text-slate-500 mt-1">
                      39 = EPL, 140 = La Liga, 135 = Serie A, 78 = Bundesliga
                    </div>
                  </div>
                </div>

                {/* API Key input */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between text-xs">
                    <span>Ключ API-Football:</span>
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-slate-400 hover:text-slate-200 text-[11px]"
                    >
                      {showApiKey ? 'Скрыть' : 'Показать'}
                    </button>
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="Вставьте ваш API Key от api-football..."
                      value={draftConfig.apiFootball.apiKey}
                      onChange={(e) =>
                        setDraftConfig((prev) => ({
                          ...prev,
                          apiFootball: { ...prev.apiFootball, apiKey: e.target.value },
                        }))
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 pr-10"
                    />
                    <Key className="absolute right-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Ключ сохраняется локально и передается на сервер только для защищенных запросов к API.
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-slate-800">
                  <button
                    onClick={() => handleTestConnection('api-football')}
                    disabled={isTesting || !draftConfig.apiFootball.apiKey.trim()}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition"
                  >
                    <Activity className={`h-4 w-4 ${isTesting ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
                    <span>{isTesting ? 'Проверка...' : 'Проверить ключ и лимиты'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onUpdateConfig(draftConfig);
                      handleApplyAndActivate('api-football');
                    }}
                    disabled={!draftConfig.apiFootball.apiKey.trim()}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition disabled:opacity-50 ${
                      config.activeSource === 'api-football'
                        ? 'bg-indigo-600 text-white cursor-default'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/60'
                    }`}
                  >
                    {config.activeSource === 'api-football' ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Источник активен</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        <span>Сохранить и активировать API-Football</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FOOTBALL-DATA.ORG */}
          {activeTab === 'football-data' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Football-Data.org (API v4)</span>
                      <a
                        href="https://www.football-data.org/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                      >
                        Получить токен <ExternalLink className="h-3 w-3" />
                      </a>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Популярный сервис с бесплатным планом для европейских высших лиг.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                    Free / Tier 1
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 text-xs">
                    Токен доступа X-Auth-Token:
                  </label>
                  <input
                    type="password"
                    placeholder="Вставьте ваш токен от football-data.org..."
                    value={draftConfig.footballData.apiToken}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        footballData: { ...prev.footballData, apiToken: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <button
                    onClick={() => handleTestConnection('football-data')}
                    disabled={isTesting || !draftConfig.footballData.apiToken.trim()}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition"
                  >
                    <Activity className={`h-4 w-4 ${isTesting ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
                    <span>{isTesting ? 'Проверка...' : 'Проверить токен'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onUpdateConfig(draftConfig);
                      handleApplyAndActivate('football-data');
                    }}
                    disabled={!draftConfig.footballData.apiToken.trim()}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition disabled:opacity-50 ${
                      config.activeSource === 'football-data'
                        ? 'bg-amber-600 text-white cursor-default'
                        : 'bg-amber-600 hover:bg-amber-500 text-white'
                    }`}
                  >
                    {config.activeSource === 'football-data' ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Источник активен</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        <span>Сохранить и активировать Football-Data</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOM WEBHOOK / JSON INGESTION */}
          {activeTab === 'webhook' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Собственный Webhook Ingestion API</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                        POST /api/feed/ingest
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Подключите любой собственный парсер (Flashscore, SofaScore, Telegram бот или Python скрипт), который отправляет live-матчи прямо в Footbalmonitor!
                    </p>
                  </div>

                  <button
                    onClick={handleClearWebhookFeed}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-900/30 text-slate-400 hover:text-rose-300 text-xs flex items-center gap-1 border border-slate-700 transition"
                    title="Очистить принятые матчи"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Очистить фид</span>
                  </button>
                </div>

                {/* Webhook URL bar with 1-click copy */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-xs">
                    Ваш персональный Webhook URL для отправки матчей:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={webhookUrl}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 select-all"
                    />
                    <button
                      onClick={() => copyToClipboard(webhookUrl, 'url')}
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
                    >
                      {copiedCode === 'url' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedCode === 'url' ? 'Скопировано!' : 'Копировать'}</span>
                    </button>
                  </div>
                </div>

                {/* Secret Key input */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-xs">
                    Секретный ключ (Header: <code className="text-cyan-300">x-webhook-secret</code>):
                  </label>
                  <input
                    type="text"
                    value={draftConfig.webhook.secretKey}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        webhook: { ...prev.webhook, secretKey: e.target.value },
                      }))
                    }
                    placeholder="footbalmonitor_secret_key_2026"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Quick Local Runner Box */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <div className="font-semibold text-xs text-white flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-cyan-400" />
                    <span>Готовые фоновые демоны-парсеры для вашего ПК (папка Footbalmonitor2):</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-mono text-rose-300 text-[11px]">python scripts/flashscore_collector.py</div>
                        <div className="text-[10px] text-slate-400">Парсер Flashscore Live (каждые 15 сек)</div>
                      </div>
                      <button
                        onClick={() => copyToClipboard('python scripts/flashscore_collector.py', 'fs_run')}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] shrink-0 font-medium"
                      >
                        {copiedCode === 'fs_run' ? '✓ Готово' : 'Копировать'}
                      </button>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-mono text-amber-300 text-[11px]">python scripts/sofascore_collector.py</div>
                        <div className="text-[10px] text-slate-400">Парсер Sofascore Live (каждые 15 сек)</div>
                      </div>
                      <button
                        onClick={() => copyToClipboard('python scripts/sofascore_collector.py', 'sofa_run')}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] shrink-0 font-medium"
                      >
                        {copiedCode === 'sofa_run' ? '✓ Готово' : 'Копировать'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ready-to-copy code snippets */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-300">Готовый код интеграции:</span>
                      <div className="flex gap-1 bg-slate-900 p-0.5 rounded border border-slate-800 text-[11px]">
                        <button
                          onClick={() => setCodeLanguage('python')}
                          className={`px-2 py-0.5 rounded font-semibold ${
                            codeLanguage === 'python' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Python
                        </button>
                        <button
                          onClick={() => setCodeLanguage('node')}
                          className={`px-2 py-0.5 rounded font-semibold ${
                            codeLanguage === 'node' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Node.js
                        </button>
                        <button
                          onClick={() => setCodeLanguage('curl')}
                          className={`px-2 py-0.5 rounded font-semibold ${
                            codeLanguage === 'curl' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          cURL
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const snippet =
                          codeLanguage === 'python' ? pythonSnippet : codeLanguage === 'node' ? nodeSnippet : curlSnippet;
                        copyToClipboard(snippet, 'code');
                      }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                    >
                      {copiedCode === 'code' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedCode === 'code' ? 'Код скопирован!' : 'Скопировать весь скрипт'}</span>
                    </button>
                  </div>

                  <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 leading-relaxed">
                    <code>
                      {codeLanguage === 'python' && pythonSnippet}
                      {codeLanguage === 'node' && nodeSnippet}
                      {codeLanguage === 'curl' && curlSnippet}
                    </code>
                  </pre>
                </div>

                <div className="pt-2 flex items-center justify-end border-t border-slate-800">
                  <button
                    onClick={() => {
                      onUpdateConfig(draftConfig);
                      handleApplyAndActivate('webhook');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                      config.activeSource === 'webhook'
                        ? 'bg-cyan-600 text-white cursor-default'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                    }`}
                  >
                    {config.activeSource === 'webhook' ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Webhook активен как основной источник</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        <span>Переключить сканер на Webhook Ingestion</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SIMULATED / DEMO */}
          {activeTab === 'simulated' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎮</span>
                    <div>
                      <h4 className="text-sm font-bold text-white">Автономный Демо-генератор матчей</h4>
                      <p className="text-xs text-slate-400">
                        Генерирует динамические live-матчи для локального тестирования стратегий, фильтров и сигналов без внешних сетей
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end border-t border-slate-800">
                  <button
                    onClick={() => handleApplyAndActivate('simulated')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                      config.activeSource === 'simulated'
                        ? 'bg-purple-600 text-white cursor-default'
                        : 'bg-purple-600 hover:bg-purple-500 text-white'
                    }`}
                  >
                    {config.activeSource === 'simulated' ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Демо-режим активен</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        <span>Включить демо-генератор</span>
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
            <span>Все ключи шифруются и не передаются третьим лицам</span>
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
