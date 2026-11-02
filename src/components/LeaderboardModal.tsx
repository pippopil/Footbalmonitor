import React, { useState } from 'react';
import {
  X,
  Trophy,
  Crown,
  Award,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Users,
  CheckCircle2,
  Gift,
  Star,
  ExternalLink,
} from 'lucide-react';

export interface CreatorLeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  handle: string;
  badge: 'Elite Verified Creator' | 'Master Analyst' | 'Pro Capper' | 'Rising Star';
  roi: number;
  winRate: number;
  totalSignals: number;
  subscribersCount: number;
  topStrategyName: string;
  monthlyReward: string;
  isCurrentUser?: boolean;
}

const LEADERBOARD_DATA: CreatorLeaderboardEntry[] = [
  {
    rank: 1,
    id: 'creator-1',
    name: 'Александр В. (Syndicate_PRO)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    handle: '@syndicate_pro',
    badge: 'Elite Verified Creator',
    roi: 38.4,
    winRate: 89.2,
    totalSignals: 246,
    subscribersCount: 1420,
    topStrategyName: '🔥 Штурм в концовке 75-90\'',
    monthlyReward: '👑 Вечный VIP-доступ + 70% роялти с подписок',
  },
  {
    rank: 2,
    id: 'creator-2',
    name: 'Дмитрий К. (NeuralBets_AI)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    handle: '@neural_bets',
    badge: 'Master Analyst',
    roi: 31.8,
    winRate: 86.5,
    totalSignals: 198,
    subscribersCount: 980,
    topStrategyName: '⚽ xG Дефицит при 0:0 на 70\'',
    monthlyReward: '⭐ VIP на 60 дней + статус Master',
  },
  {
    rank: 3,
    id: 'creator-3',
    name: 'Максим С. (PressureHunter)',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    handle: '@pressure_hunter',
    badge: 'Pro Capper',
    roi: 26.5,
    winRate: 84.1,
    totalSignals: 164,
    subscribersCount: 750,
    topStrategyName: '🚩 Серия угловых и прессинг',
    monthlyReward: '💎 PRO на 30 дней',
  },
  {
    rank: 4,
    id: 'creator-4',
    name: 'Илья М. (SmartMoney_Radar)',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    handle: '@smart_money_ru',
    badge: 'Rising Star',
    roi: 22.1,
    winRate: 82.8,
    totalSignals: 112,
    subscribersCount: 420,
    topStrategyName: '📉 Прогруз денег ≥75% (Steam Move)',
    monthlyReward: '🎁 Бонус 10 000 RUB в банкролл',
  },
  {
    rank: 5,
    id: 'creator-5',
    name: 'Елена Т. (Halftime_Sniper)',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    handle: '@ht_sniper',
    badge: 'Rising Star',
    roi: 19.4,
    winRate: 81.4,
    totalSignals: 95,
    subscribersCount: 310,
    topStrategyName: '⏱️ Быстрый гол в 1-м тайме',
    monthlyReward: '🎁 Бонус 5 000 RUB в банкролл',
  },
];

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMarketplace?: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  onOpenMarketplace,
}) => {
  const [period, setPeriod] = useState<'month' | 'all_time'>('month');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-5 sm:p-7 max-w-2xl w-full space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/40 text-amber-400">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Лидерборд авторов & Зал славы
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-black px-2 py-0.5 rounded-full border border-amber-500/40 uppercase">
                  ГЕЙМИФИКАЦИЯ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Рейтинг лучших создателей алгоритмов с подтвержденным ROI
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

        {/* Monthly Grand Prize Callout Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-yellow-950/30 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 shrink-0">
              <Gift className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block">
                🏆 Награда победителю месяца (ТОП-1 по ROI):
              </span>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                Статус «Elite Verified Creator», пожизненная VIP-подписка и размещение стратегии на главной витрине маркетплейса с 70% отчислений!
              </p>
            </div>
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="space-y-2.5">
          {LEADERBOARD_DATA.map((entry) => (
            <div
              key={entry.id}
              className={`p-3.5 sm:p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                entry.rank === 1
                  ? 'bg-gradient-to-r from-amber-950/30 via-slate-950 to-slate-950 border-amber-500/50 shadow-md shadow-amber-950/30'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`h-8 w-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                    entry.rank === 1
                      ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-amber-950/50'
                      : entry.rank === 2
                      ? 'bg-slate-300 text-slate-950'
                      : entry.rank === 3
                      ? 'bg-amber-700 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  #{entry.rank}
                </span>

                <img
                  src={entry.avatar}
                  alt={entry.name}
                  className="h-10 w-10 rounded-xl object-cover border border-slate-700 shrink-0"
                />

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-bold text-white">{entry.name}</h4>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold uppercase ${
                        entry.badge === 'Elite Verified Creator'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : entry.badge === 'Master Analyst'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      }`}
                    >
                      {entry.badge}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                    <span>{entry.handle}</span>
                    <span>• Стратегия: <strong className="text-slate-200">{entry.topStrategyName}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                <div className="text-right">
                  <div className="text-xs font-mono font-black text-emerald-400">
                    ROI +{entry.roi}%
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Винрейт: <strong className="text-white">{entry.winRate}%</strong> ({entry.totalSignals} сигналов)
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-slate-400 text-[11px]">
            Хотите попасть в лидерборд? Создайте свою стратегию и опубликуйте в Маркетплейсе
          </span>
          {onOpenMarketplace && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenMarketplace();
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-emerald-950/40 shrink-0"
            >
              <span>В Маркетплейс стратегий</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
