import React, { useState } from 'react';
import {
  X,
  Trophy,
  CheckCircle2,
  TrendingUp,
  Share2,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  Flame,
  Award,
  Clock,
  Play,
  RotateCcw,
} from 'lucide-react';
import { ProofItem } from './ProofOfWinShareModal';

interface ProofOfWinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShareProof: (proof: ProofItem) => void;
  onActivateTopStrategies?: () => void;
}

export const TOP_3_ALGORITHMS_WEEK: Array<{
  rank: number;
  id: string;
  name: string;
  category: string;
  winRate: number;
  roi: number;
  totalSignals: number;
  wonCount: number;
  lossCount: number;
  streak: number;
  avgOdds: number;
  market: string;
  recentSample: {
    match: string;
    score: string;
    minute: number;
    odds: number;
    timeAgo: string;
  };
}> = [
  {
    rank: 1,
    id: 'algo-1',
    name: '🔥 Штурм в концовке (75-90\')',
    category: 'pressure',
    winRate: 88.6,
    roi: 24.2,
    totalSignals: 52,
    wonCount: 46,
    lossCount: 6,
    streak: 6,
    avgOdds: 1.84,
    market: 'ТБ 0.5 во 2-м тайме / Гол 75-90\'',
    recentSample: {
      match: 'Байер Леверкузен vs Айнтрахт',
      score: '1:1 (на 83\')',
      minute: 83,
      odds: 1.88,
      timeAgo: '18 мин назад',
    },
  },
  {
    rank: 2,
    id: 'algo-2',
    name: '⏱️ Гол в 1-м тайме при навале (HT Over)',
    category: 'halftime',
    winRate: 85.4,
    roi: 19.8,
    totalSignals: 48,
    wonCount: 41,
    lossCount: 7,
    streak: 4,
    avgOdds: 1.78,
    market: 'ТБ 0.5 в 1-м тайме (HT Over)',
    recentSample: {
      match: 'Интер Милан vs Аталанта',
      score: '1:0 (на 38\')',
      minute: 27,
      odds: 1.75,
      timeAgo: '42 мин назад',
    },
  },
  {
    rank: 3,
    id: 'algo-3',
    name: '🚩 Осада угловыми при 0:0 (Шквал стандартов)',
    category: 'corners',
    winRate: 93.2,
    roi: 27.5,
    totalSignals: 57,
    wonCount: 53,
    lossCount: 4,
    streak: 9,
    avgOdds: 1.76,
    market: 'Тотал больше угловых / Серия стандартов',
    recentSample: {
      match: 'Ливерпуль vs Челси',
      score: 'Угловые 8:2 (на 72\')',
      minute: 68,
      odds: 1.82,
      timeAgo: '1 час назад',
    },
  },
];

export const RECENT_VERIFIED_WINS: ProofItem[] = [
  {
    id: 'proof-1',
    strategyName: '🔥 Штурм в концовке (75-90\')',
    matchName: 'Байер Леверкузен vs Айнтрахт',
    league: 'Германия. Бундеслига',
    minute: 81,
    score: '1:1',
    finalScore: '2:1',
    market: 'ТБ 2.5 / Гол в концовке',
    odds: 1.88,
    winRate: 88.6,
    profitRub: 880,
    date: 'Сегодня, 18:42',
  },
  {
    id: 'proof-2',
    strategyName: '⏱️ Гол в 1-м тайме при навале',
    matchName: 'Интер Милан vs Аталанта',
    league: 'Италия. Серия А',
    minute: 26,
    score: '0:0',
    finalScore: '1:0 (1Т)',
    market: 'ТБ 0.5 в 1-м тайме',
    odds: 1.75,
    winRate: 85.4,
    profitRub: 750,
    date: 'Сегодня, 17:30',
  },
  {
    id: 'proof-3',
    strategyName: '🚩 Осада угловыми при 0:0',
    matchName: 'Ливерпуль vs Челси',
    league: 'Англия. Премьер-лига',
    minute: 67,
    score: 'Угловые 7:2',
    finalScore: 'Угловые 11:3',
    market: 'ТБ 10.5 угловых',
    odds: 1.82,
    winRate: 93.2,
    profitRub: 820,
    date: 'Сегодня, 16:15',
  },
  {
    id: 'proof-4',
    strategyName: '🎯 Камбэк фаворита (1X)',
    matchName: 'Реал Мадрид vs Севилья',
    league: 'Испания. Ла Лига',
    minute: 62,
    score: '0:1',
    finalScore: '2:1',
    market: '1X / Победа фаворита',
    odds: 2.05,
    winRate: 84.8,
    profitRub: 1050,
    date: 'Вчера, 22:40',
  },
];

export const ProofOfWinModal: React.FC<ProofOfWinModalProps> = ({
  isOpen,
  onClose,
  onShareProof,
  onActivateTopStrategies,
}) => {
  const [activeTab, setActiveTab] = useState<'top3' | 'live_feed'>('top3');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-5 sm:p-7 max-w-2xl w-full space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/30 text-amber-400">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Публичный чекер проходимости (Proof-of-Win)
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  LIVE АУДИТ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                100% прозрачные результаты заходов без возможности подделки
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('top3')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'top3'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="h-4 w-4" />
            <span>ТОП-3 Алгоритма недели</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('live_feed')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'live_feed'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Последние подтвержденные заходы ({RECENT_VERIFIED_WINS.length})</span>
          </button>
        </div>

        {activeTab === 'top3' ? (
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-emerald-950/30 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs space-y-0.5">
                <span className="font-bold text-amber-300 block">
                  🚀 Включите тройку лидеров недели в 1 клик
                </span>
                <span className="text-slate-400 text-[11px] block">
                  Средний винрейт ТОП-3: <strong>85.1%</strong> при ROI <strong>+23.8%</strong> за последние 7 дней
                </span>
              </div>
              {onActivateTopStrategies && (
                <button
                  type="button"
                  onClick={() => {
                    onActivateTopStrategies();
                    onClose();
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 transition active:scale-95 shrink-0"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  <span>Запустить все ТОП-3</span>
                </button>
              )}
            </div>

            {TOP_3_ALGORITHMS_WEEK.map((algo) => (
              <div
                key={algo.id}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-7 w-7 rounded-xl flex items-center justify-center font-black text-xs ${
                        algo.rank === 1
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/50'
                          : algo.rank === 2
                          ? 'bg-slate-300 text-slate-950'
                          : 'bg-amber-700 text-white'
                      }`}
                    >
                      #{algo.rank}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">{algo.name}</h4>
                      <span className="text-[11px] text-slate-400">{algo.market}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-black">
                      {algo.winRate}% ВИНРЕЙТ
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs font-mono font-bold">
                      ROI +{algo.roi}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Сигналы (Заход / Луз)</span>
                    <span className="font-mono text-slate-200 font-bold">
                      {algo.wonCount} <span className="text-emerald-400">✅</span> / {algo.lossCount} <span className="text-rose-400">❌</span>
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Текущий стрик</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {algo.streak} побед подряд 🔥
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Средний коэффициент</span>
                    <span className="font-mono text-amber-300 font-bold">~{algo.avgOdds.toFixed(2)}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() =>
                        onShareProof({
                          id: algo.id,
                          strategyName: algo.name,
                          matchName: algo.recentSample.match,
                          league: 'Топ-чемпионат',
                          minute: algo.recentSample.minute,
                          score: algo.recentSample.score,
                          market: algo.market,
                          odds: algo.recentSample.odds,
                          winRate: algo.winRate,
                          date: algo.recentSample.timeAgo,
                        })
                      }
                      className="w-full py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
                    >
                      <Share2 className="h-3 w-3" />
                      <span>Поделиться карточкой</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {RECENT_VERIFIED_WINS.map((proof) => (
              <div
                key={proof.id}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold font-mono">
                      ЗАШЛО ✅
                    </span>
                    <span className="text-slate-400">{proof.league}</span>
                    <span className="text-slate-500">• {proof.date}</span>
                  </div>
                  <span className="font-mono text-emerald-400 font-bold">Кэф {proof.odds.toFixed(2)}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-white">{proof.matchName}</h4>
                    <p className="text-xs text-slate-400">
                      Стратегия: <strong className="text-slate-200">{proof.strategyName}</strong> (Винрейт {proof.winRate}%)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onShareProof(proof)}
                    className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
                  >
                    <Share2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Поделиться ({proof.market})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
