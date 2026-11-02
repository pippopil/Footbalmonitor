import React from 'react';
import {
  X,
  Rocket,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Play,
  Flame,
  Clock,
  Target,
  Bell,
} from 'lucide-react';
import { FilterRule } from '../types';

interface BeginnerOneClickModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivateSafeTrio: () => void;
}

export const SAFE_BEGINNER_STRATEGIES = [
  {
    icon: '⚽',
    name: 'Безопасный гол фаворита во 2-м тайме (65-85\')',
    desc: 'Фаворит давит, кэф на следующий гол или ТБ 1.5 от 1.65. Самый надежный паттерн с проходимостью >82%.',
    target: 'ТБ 0.5 во 2-м тайме / ТБ 1.5',
    avgOdds: '1.75 - 1.85',
    passRate: '82.4%',
  },
  {
    icon: '🚩',
    name: 'Угловые фаворита при осаде ворот (60-90\')',
    desc: 'Защищающаяся команда выносит мяч на угловые под шквалом атак. Высокий процент доезда без риска отмены гола по VAR.',
    target: 'Тотал больше угловых фаворита',
    avgOdds: '1.70 - 1.80',
    passRate: '88.6%',
  },
  {
    icon: '⏱️',
    name: 'Гол в 1-м тайме при активном старте (15-35\')',
    desc: 'Высокий темп ударов и опасных атак до перерыва при 0:0. Идеально для быстрых заходов.',
    target: 'ТБ 0.5 в 1-м тайме (HT Over)',
    avgOdds: '1.72 - 1.82',
    passRate: '79.1%',
  },
];

export const BeginnerOneClickModal: React.FC<BeginnerOneClickModalProps> = ({
  isOpen,
  onClose,
  onActivateSafeTrio,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-5 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400">
              <Rocket className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Быстрый старт: ТОП-3 безопасные стратегии
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Запуск в 1 клик без необходимости настраивать 15+ параметров
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

        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/30 border border-emerald-500/30 text-xs text-emerald-200/90 leading-relaxed space-y-1">
          <div className="font-bold text-white flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Отобрано аналитиками для новичков:</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Эти 3 алгоритма имеют наивысшую дистанционную проходимость и минимальную просадку банкролла. Сигналы начнут приходить сразу же, как только в live появятся подходящие матчи.
          </p>
        </div>

        {/* 3 Safe Cards list */}
        <div className="space-y-2.5">
          {SAFE_BEGINNER_STRATEGIES.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {item.passRate}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">{item.desc}</p>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Рынок: <strong className="text-amber-300">{item.target}</strong></span>
                <span>Кэф: <strong className="text-emerald-400">{item.avgOdds}</strong></span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              onActivateSafeTrio();
              onClose();
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:opacity-90 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/50 transition active:scale-95"
          >
            <Play className="h-4 w-4 fill-white" />
            <span>Включить ТОП-3 безопасные стратегии в 1 клик</span>
          </button>
        </div>
      </div>
    </div>
  );
};
