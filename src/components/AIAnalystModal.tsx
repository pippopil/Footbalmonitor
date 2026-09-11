import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  ShieldAlert,
  Gauge,
  CheckCircle2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { LiveMatch, PressureAnalysis, AIMatchAnalysis, TelegramConfig } from '../types';

interface AIAnalystModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: LiveMatch | null;
  pressureAnalysis?: PressureAnalysis;
  telegramConfig: TelegramConfig;
  onSendTelegramMessage?: (textHtml: string) => Promise<{ ok: boolean; messageId?: number; error?: string }>;
}

export const AIAnalystModal: React.FC<AIAnalystModalProps> = ({
  isOpen,
  onClose,
  match,
  pressureAnalysis,
  telegramConfig,
  onSendTelegramMessage,
}) => {
  const [analysis, setAnalysis] = useState<AIMatchAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendingToTg, setSendingToTg] = useState(false);
  const [tgStatus, setTgStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showTgPreview, setShowTgPreview] = useState(false);

  const fetchAIAnalysis = async () => {
    if (!match) return;
    setLoading(true);
    setError(null);
    setTgStatus(null);

    try {
      const response = await fetch('/api/ai/analyze-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match,
          pressureAnalysis,
        }),
      });

      const data = await response.json();
      if (data.ok && data.analysis) {
        setAnalysis(data.analysis);
      } else {
        setError(data.error || 'Не удалось получить анализ матча.');
      }
    } catch (err: any) {
      setError(`Ошибка соединения: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && match) {
      fetchAIAnalysis();
    } else {
      setAnalysis(null);
      setError(null);
      setTgStatus(null);
    }
  }, [isOpen, match?.id]);

  if (!isOpen || !match) return null;

  const handleSendToTelegram = async () => {
    if (!analysis) return;
    setSendingToTg(true);
    setTgStatus(null);

    try {
      if (onSendTelegramMessage) {
        const res = await onSendTelegramMessage(analysis.telegramFormattedText);
        if (res.ok) {
          setTgStatus(`✅ Разбор опубликован в Telegram (#${res.messageId || 'OK'})`);
        } else {
          setTgStatus(`❌ Ошибка: ${res.error || 'Не удалось отправить'}`);
        }
      } else {
        // Direct API call fallback
        const res = await fetch('/api/telegram/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: analysis.telegramFormattedText,
            bot_token: telegramConfig.botToken || undefined,
            chat_id: telegramConfig.channelId || undefined,
          }),
        });
        const data = await res.json();
        if (data.ok) {
          setTgStatus(`✅ Разбор опубликован в Telegram (#${data.messageId || 'OK'})`);
        } else {
          setTgStatus(`❌ Ошибка: ${data.error || 'Не удалось отправить'}`);
        }
      }
    } catch (err: any) {
      setTgStatus(`❌ Ошибка сети: ${err?.message || err}`);
    } finally {
      setSendingToTg(false);
    }
  };

  const handleCopyText = () => {
    if (!analysis) return;
    navigator.clipboard.writeText(analysis.telegramFormattedText.replace(/<[^>]*>?/gm, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getIntensityBadge = (level: string) => {
    switch (level) {
      case 'SIEGE':
        return {
          label: '🔥 ОСАДА ВОРОТ',
          classes: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse',
        };
      case 'HIGH_PRESSURE':
        return {
          label: '⚡ ВЫСОКОЕ ДАВЛЕНИЕ',
          classes: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
      case 'ACTIVE':
        return {
          label: '⚔️ АКТИВНАЯ ИГРА',
          classes: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        };
      default:
        return {
          label: '☕ СПОКОЙНЫЙ ТЕМП',
          classes: 'bg-slate-700/50 text-slate-300 border-slate-600',
        };
    }
  };

  return (
    <div
      id="ai-analyst-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="ai-analyst-modal-dialog"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border-b border-slate-800 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-inner">
              <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  AI-Аналитик матча
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                  {analysis?.source === 'gemini' ? 'Gemini 3.8 Flash' : 'AI Live Engine'}
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>{match.country} • {match.league}</span>
                <span className="text-slate-600">•</span>
                <span className="font-bold text-emerald-400 font-mono">{match.minute}'</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAIAnalysis}
              disabled={loading}
              title="Пересчитать анализ"
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Match Score Banner */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex-1 text-right pr-4">
              <div className="font-bold text-sm sm:text-base text-white">{match.homeTeam}</div>
              <div className="text-[11px] text-slate-500">
                Оп. атаки: {match.stats.dangerousAttacks[0]} • Удары в створ: {match.stats.shotsOnTarget[0]}
              </div>
            </div>

            <div className="px-4 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-center flex-shrink-0">
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 tracking-wider">
                {match.score[0]} : {match.score[1]}
              </div>
              <div className="text-[10px] font-mono text-slate-400">{match.minute}' минута</div>
            </div>

            <div className="flex-1 text-left pl-4">
              <div className="font-bold text-sm sm:text-base text-white">{match.awayTeam}</div>
              <div className="text-[11px] text-slate-500">
                Оп. атаки: {match.stats.dangerousAttacks[1]} • Удары в створ: {match.stats.shotsOnTarget[1]}
              </div>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="py-16 text-center space-y-4">
              <div className="relative inline-flex">
                <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-400 animate-spin" />
                <Sparkles className="w-5 h-5 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Квантовый AI-анализ матча...</p>
                <p className="text-xs text-slate-400 mt-1">
                  Обработка xG, динамики опасных атак, давления и расчет математического ожидания
                </p>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 flex items-start gap-3 text-rose-200">
              <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-semibold">Ошибка генерации анализа</div>
                <div>{error}</div>
                <button
                  onClick={fetchAIAnalysis}
                  className="mt-2 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-md font-medium text-[11px]"
                >
                  Попробовать снова
                </button>
              </div>
            </div>
          )}

          {/* Analysis Content */}
          {analysis && !loading && (
            <div className="space-y-6 animate-fadeIn">
              {/* Headline & Summary Card */}
              <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-xl p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                      getIntensityBadge(analysis.momentum.intensityLevel).classes
                    }`}
                  >
                    {getIntensityBadge(analysis.momentum.intensityLevel).label}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Сгенерировано в {analysis.generatedAt}
                  </span>
                </div>

                <div className="text-base sm:text-lg font-bold text-white leading-snug">
                  {analysis.headline}
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {analysis.summary}
                </p>

                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
                  <Gauge className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{analysis.momentum.pressureDescription}</span>
                </div>
              </div>

              {/* Goal Probability Model */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    Модель вероятности следующего гола
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-medium">
                    Ожидаемый тотал: <strong className="text-white">{analysis.probabilities.expectedTotalGoals}</strong>
                  </span>
                </div>

                {/* Probability Bar */}
                <div className="space-y-2">
                  <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                    <div
                      style={{ width: `${analysis.probabilities.nextGoalHome}%` }}
                      className="bg-emerald-500 transition-all duration-500 hover:opacity-90"
                      title={`${match.homeTeam}: ${analysis.probabilities.nextGoalHome}%`}
                    />
                    <div
                      style={{ width: `${analysis.probabilities.noMoreGoals}%` }}
                      className="bg-slate-600 transition-all duration-500 hover:opacity-90"
                      title={`Без голов: ${analysis.probabilities.noMoreGoals}%`}
                    />
                    <div
                      style={{ width: `${analysis.probabilities.nextGoalAway}%` }}
                      className="bg-sky-500 transition-all duration-500 hover:opacity-90"
                      title={`${match.awayTeam}: ${analysis.probabilities.nextGoalAway}%`}
                    />
                  </div>

                  <div className="grid grid-cols-3 text-center text-xs pt-1">
                    <div className="text-left">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5 align-middle" />
                      <span className="font-semibold text-white">{analysis.probabilities.nextGoalHome}%</span>
                      <div className="text-[11px] text-slate-400 truncate">{match.homeTeam}</div>
                    </div>
                    <div className="text-center">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-500 mr-1.5 align-middle" />
                      <span className="font-semibold text-slate-300">{analysis.probabilities.noMoreGoals}%</span>
                      <div className="text-[11px] text-slate-500">Без голов</div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-500 mr-1.5 align-middle" />
                      <span className="font-semibold text-white">{analysis.probabilities.nextGoalAway}%</span>
                      <div className="text-[11px] text-slate-400 truncate">{match.awayTeam}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommended Value Markets */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Рекомендуемые маркеты с перевесом (Value Bets)
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysis.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 space-y-2.5 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <span className="text-emerald-400">🎯</span>
                          <span>{rec.market}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            кэф ~{rec.oddsEstimate.toFixed(2)}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              rec.confidence === 'HIGH'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : rec.confidence === 'MEDIUM'
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {rec.confidence === 'HIGH'
                              ? 'ВЫСОКАЯ'
                              : rec.confidence === 'MEDIUM'
                              ? 'СРЕДНЯЯ'
                              : 'УМЕРЕННАЯ'}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {rec.reasoning}
                      </p>

                      <div className="text-[11px] text-emerald-400/90 font-mono bg-emerald-950/30 px-2.5 py-1 rounded border border-emerald-500/20">
                        ⚡ Edge: {rec.edge}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tactical note & Risk Factors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tactical Note */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>💡 Тактическая расстановка</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {analysis.tacticalNote}
                  </p>
                </div>

                {/* Key Risks */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                    <span>Факторы риска</span>
                  </div>
                  <ul className="space-y-1 text-xs text-slate-400">
                    {analysis.keyRisks.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Telegram Preview and Actions */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Send className="h-3.5 w-3.5 text-sky-400" />
                      Публикация разбора в Telegram
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {telegramConfig.channelId ? (
                        <span>Канал: <strong className="text-slate-300">{telegramConfig.channelId}</strong></span>
                      ) : (
                        <span className="text-amber-400">Канал не настроен в конфигураторе</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyText}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? 'Скопировано' : 'Копировать'}
                    </button>

                    <button
                      onClick={handleSendToTelegram}
                      disabled={sendingToTg || !telegramConfig.botToken || !telegramConfig.channelId}
                      className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-sky-950 transition"
                    >
                      <Send className={`h-3.5 w-3.5 ${sendingToTg ? 'animate-bounce' : ''}`} />
                      {sendingToTg ? 'Отправка...' : 'Отправить в Telegram'}
                    </button>
                  </div>
                </div>

                {tgStatus && (
                  <div className="text-xs p-2.5 rounded-lg bg-slate-900 border border-slate-700 font-mono">
                    {tgStatus}
                  </div>
                )}

                {/* Collapsible raw Telegram message */}
                <div className="pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => setShowTgPreview(!showTgPreview)}
                    className="text-[11px] text-slate-500 hover:text-slate-400 flex items-center gap-1 transition"
                  >
                    <span>Предпросмотр сообщения для Telegram</span>
                    {showTgPreview ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>

                  {showTgPreview && (
                    <div className="mt-2 p-3 bg-slate-900/90 border border-slate-800 rounded-lg text-xs font-mono text-slate-400 whitespace-pre-line leading-relaxed">
                      {analysis.telegramFormattedText}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            AI Match Analyst • Footbalmonitor v2.4
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition font-medium"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
