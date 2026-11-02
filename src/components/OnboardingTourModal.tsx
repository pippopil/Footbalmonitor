import React, { useState } from 'react';
import {
  Sparkles,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sliders,
  Bot,
  Activity,
  Zap,
} from 'lucide-react';

interface OnboardingTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: 'matches' | 'filters' | 'telegram' | 'backtest') => void;
}

export const OnboardingTourModal: React.FC<OnboardingTourModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Добро пожаловать в FootballMonitor!',
      subtitle: 'Платформа предиктивного анализа и умного сканирования live-матчей',
      icon: Sparkles,
      color: 'emerald',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            Система непрерывно отслеживает футбольные события (линия БК «Фонбет», Flashscore, биржи Betfair) и вычисляет перевес по опасным атакам, ударам, угловым и ожидаемым голам (xG).
          </p>
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
            <div className="font-bold text-emerald-400">Быстрый запуск за 3 простых шага:</div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-[10px]">1</span>
              <span>Включите или создайте авторскую стратегию</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-[10px]">2</span>
              <span>Подключите Telegram-бота от @BotFather</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-[10px]">3</span>
              <span>Получайте мгновенные сигналы с прогнозом</span>
            </div>
          </div>
        </div>
      ),
      actionText: 'Начать тур',
    },
    {
      title: 'Шаг 1: Стратегии и Матрица фильтров',
      subtitle: '50 предустановленных фильтров + Конструктор с чистого бланка',
      icon: Sliders,
      color: 'blue',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            Во вкладке <b>«Стратегии»</b> доступна готовая матрица: <i>«А ГДЕ ЖЕ ГОЛ!!!»</i>, <i>«Штурм угловых»</i>, <i>«Прогруз Smart Money»</i>, <i>«Камбэк фаворита»</i>.
          </p>
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>Возможности конструктора:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Фильтрация по минутам матча и текущему счёту</li>
              <li>Пороги разницы опасных атак и ударов в створ</li>
              <li>Коридоры коэффициентов букмекера (П1, X, П2, ТБ 2.5)</li>
              <li>Индекс давления (Pressure Index) и модель xG</li>
            </ul>
          </div>
        </div>
      ),
      actionText: 'Перейти к фильтрам',
      onAction: () => onNavigateTab('filters'),
    },
    {
      title: 'Шаг 2: Telegram-боты для каналов',
      subtitle: 'Автоматическая публикация сигналов в ваши чаты и каналы',
      icon: Bot,
      color: 'cyan',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            Вам не нужно сидеть у экрана 24/7. Бот моментально отправляет форматированные сообщения со статистикой матча, ссылкой на трансляцию и рекомендуемым рынком.
          </p>
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 space-y-1">
            <div className="font-bold">Как подключить за 1 минуту:</div>
            <div>1. Напишите <code>@BotFather</code> в Telegram и выполните <code>/newbot</code>.</div>
            <div>2. Вставьте Bot Token в настройках кабинета.</div>
            <div>3. Добавьте бота в канал как Администратора и нажмите «Тест».</div>
          </div>
        </div>
      ),
      actionText: 'Настроить бота',
      onAction: () => onNavigateTab('telegram'),
    },
    {
      title: 'Шаг 3: Лайв-сканер и Аналитика',
      subtitle: 'Реальные котировки, проверка исходов и бэктестинг',
      icon: Activity,
      color: 'emerald',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            Сканер отслеживает все матчи в прямом эфире. В разделе <b>«Сигналы»</b> система автоматически рассчитывает винрейт, чистую прибыль во флетах и проверяет зашел ли исход (WIN/LOSS).
          </p>
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[11px] font-bold text-white">Готовы к работе!</div>
              <div className="text-[10px] text-slate-400">Нажмите «Завершить» для перехода к лайв-мониторингу.</div>
            </div>
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          </div>
        </div>
      ),
      actionText: 'Открыть Лайв-сканер',
      onAction: () => onNavigateTab('matches'),
    },
  ];

  const current = steps[step];
  const IconComponent = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <IconComponent className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{current.title}</h3>
              <p className="text-xs text-slate-400">{current.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {current.content}

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-2 rounded-full transition-all ${
                  i === step ? 'w-6 bg-emerald-500' : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer controls */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Назад</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 transition"
            >
              Пропустить
            </button>
            <button
              onClick={() => {
                if (current.onAction) {
                  current.onAction();
                }
                if (step < steps.length - 1) {
                  setStep((s) => s + 1);
                } else {
                  onClose();
                }
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-emerald-950/50"
            >
              <span>{current.actionText}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
