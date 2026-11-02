import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  Sliders,
  Target,
  Flame,
  Zap,
  Play,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Layers,
  Bot,
  MessageSquare,
  Shield,
  Activity,
  BarChart3,
  Calendar,
  LayoutGrid,
  SlidersHorizontal,
  ChevronRight,
  Check,
  RotateCcw,
  BookOpen,
  Info,
  DollarSign,
  Search,
} from 'lucide-react';
import { FilterRule, SportType } from '../types';

interface EducationGuideViewProps {
  onNavigateTab: (tab: 'matches' | 'filters' | 'signals' | 'telegram') => void;
  onApplyPresetFilter?: (preset: Partial<FilterRule>) => void;
  onOpenFilterBuilder?: (preset?: Partial<FilterRule>) => void;
}

export const EducationGuideView: React.FC<EducationGuideViewProps> = ({
  onNavigateTab,
  onApplyPresetFilter,
  onOpenFilterBuilder,
}) => {
  // Navigation inside the education view
  const [activeSection, setActiveSection] = useState<
    'how-to-setup' | 'simulator' | 'cards' | 'filters' | 'matrix-vs-cards' | 'strategies' | 'glossary' | 'quiz'
  >('how-to-setup');

  // Interactive Card inspector state
  const [highlightedCardElement, setHighlightedCardElement] = useState<string>('attacks');

  // Interactive Simulator state
  const [simMinute, setSimMinute] = useState<number>(76);
  const [simHomeScore, setSimHomeScore] = useState<number>(0);
  const [simAwayScore, setSimAwayScore] = useState<number>(0);
  const [simDangerousAttacks, setSimDangerousAttacks] = useState<number>(54);
  const [simDangerousAttacksAway, setSimDangerousAttacksAway] = useState<number>(18);
  const [simShotsOnTarget, setSimShotsOnTarget] = useState<number>(6);
  const [simXgHome, setSimXgHome] = useState<number>(1.85);
  const [simOddsOver05, setSimOddsOver05] = useState<number>(1.78);
  const [selectedSimStrategy, setSelectedSimStrategy] = useState<'late_goal' | 'dominance_zero' | 'smart_money'>('late_goal');

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number | null>>({
    1: null,
    2: null,
    3: null,
  });
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  // Evaluate simulator against chosen strategy
  const simEvaluation = React.useMemo(() => {
    if (selectedSimStrategy === 'late_goal') {
      const isMinuteMet = simMinute >= 72 && simMinute <= 88;
      const isScoreMet = (simHomeScore + simAwayScore) <= 2;
      const isAttacksMet = (simDangerousAttacks - simDangerousAttacksAway) >= 15;
      const isShotsMet = simShotsOnTarget >= 4;
      const allPassed = isMinuteMet && isScoreMet && isAttacksMet && isShotsMet;

      return {
        strategyName: '🔥 Поздний гол в концовке (75\'+)',
        targetMarket: 'Тотал больше 0.5 во 2-м тайме (Гол после 75\')',
        estimatedOdds: simOddsOver05,
        allPassed,
        criteria: [
          { label: 'Минута матча (72\' - 88\')', current: `${simMinute}'`, met: isMinuteMet, tip: 'Команды устали, разрывы в линиях' },
          { label: 'Счёт не более 2 голов (ТБ 2.5 не пробит)', current: `${simHomeScore}:${simAwayScore}`, met: isScoreMet, tip: 'Счёт напряженный' },
          { label: 'Перевес по опасным атакам (≥ 15)', current: `+${simDangerousAttacks - simDangerousAttacksAway}`, met: isAttacksMet, tip: 'Одна команда непрерывно штурмует' },
          { label: 'Удары фаворита в створ (≥ 4)', current: `${simShotsOnTarget}`, met: isShotsMet, tip: 'Мяч летит в створ ворот' },
        ],
      };
    } else if (selectedSimStrategy === 'dominance_zero') {
      const isMinuteMet = simMinute >= 60 && simMinute <= 85;
      const isScoreMet = simHomeScore === 0 && simAwayScore === 0;
      const isXgMet = simXgHome >= 1.4;
      const isAttacksMet = simDangerousAttacks >= 45;
      const allPassed = isMinuteMet && isScoreMet && isXgMet && isAttacksMet;

      return {
        strategyName: '⚽ Сухое доминирование при 0:0',
        targetMarket: 'Гол Хозяев / ТБ 0.5 в матче',
        estimatedOdds: 1.65,
        allPassed,
        criteria: [
          { label: 'Минута матча (60\' - 85\')', current: `${simMinute}'`, met: isMinuteMet, tip: '2-й тайм, времени всё меньше' },
          { label: 'Счёт строго 0:0', current: `${simHomeScore}:${simAwayScore}`, met: isScoreMet, tip: 'Фаворит ещё не распечатал ворота' },
          { label: 'Накопленный xG хозяев (≥ 1.40)', current: `${simXgHome.toFixed(2)}`, met: isXgMet, tip: 'Моментов создано на 1-2 гола' },
          { label: 'Опасные атаки хозяев (≥ 45)', current: `${simDangerousAttacks}`, met: isAttacksMet, tip: 'Постоянное присутствие в штрафной' },
        ],
      };
    } else {
      // smart money
      const isMinuteMet = simMinute >= 15 && simMinute <= 85;
      const isDropMet = true;
      const isAttacksMet = simDangerousAttacks > simDangerousAttacksAway;
      const allPassed = isMinuteMet && isDropMet && isAttacksMet;

      return {
        strategyName: '📉 Smart Money: Аномальный денежный прогруз',
        targetMarket: 'Победа Хозяев (П1) / Прогруженный исход',
        estimatedOdds: 1.70,
        allPassed,
        criteria: [
          { label: 'Любая минута активной игры (15\' - 85\')', current: `${simMinute}'`, met: isMinuteMet, tip: 'Достаточно времени для реализации' },
          { label: 'Падение коэффициента биржи (≥ 15%)', current: '-22.4%', met: isDropMet, tip: 'Крупный синдикат грузит банк' },
          { label: 'Объем денег в пуле (≥ 65%)', current: '78% денег (€195,000)', met: true, tip: 'Рынок уверен в исходе' },
        ],
      };
    }
  }, [
    selectedSimStrategy,
    simMinute,
    simHomeScore,
    simAwayScore,
    simDangerousAttacks,
    simDangerousAttacksAway,
    simShotsOnTarget,
    simXgHome,
    simOddsOver05,
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Hero Banner with welcoming visual style */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950/40 to-slate-950 border border-emerald-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-60 h-60 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
              <GraduationCap className="h-4 w-4 text-emerald-400" />
              <span>ШКОЛА БЕТТИНГА И АНАЛИТИКИ • ДЛЯ НОВИЧКОВ</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Как работают <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">фильтры</span> и <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-300">карточки</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Простыми словами и наглядными примерами: как искусственный интеллект и сканеры находят прибыльные ситуации в сотнях матчей без вашего круглосуточного сидения у экрана.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setActiveSection('simulator')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition active:scale-95"
            >
              <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
              <span>Открыть интерактивный тренажер</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('matches')}
              className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-sm flex items-center justify-center gap-2 transition"
            >
              <span>К реальным матчам →</span>
            </button>
          </div>
        </div>

        {/* 3 Main Pillars Mini-cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 font-bold">
              1
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Карточка — это датчик</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Показывает точную температуру игры в live: опасные атаки, удары, xG и график давления.
              </p>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 shrink-0 font-bold">
              2
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Фильтр — это робот-сторож</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Смотрит сотни матчей одновременно. Как только условие совпало — шлёт вам сигнал.
              </p>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 font-bold">
              3
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Сигнал — готовое действие</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Telegram-сообщение с подсказкой: на что ставить, какой кэф и почему эта ставка выгодна.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {[
          { id: 'how-to-setup', label: '🎯 Как настраивать фильтр (Инструкция)', badge: 'По шагам' },
          { id: 'simulator', label: '🎮 Интерактивный тренажер', badge: 'Попробуй сам!' },
          { id: 'cards', label: '🃏 Анатомия Карточки матча', badge: null },
          { id: 'filters', label: '⚙️ Как работают фильтры', badge: null },
          { id: 'matrix-vs-cards', label: '⚔️ Карточки vs Матрица', badge: 'Разница' },
          { id: 'strategies', label: '💡 4 Топ-Стратегии', badge: 'Для старта' },
          { id: 'glossary', label: '📖 Словарь новичка', badge: null },
          { id: 'quiz', label: '❓ Проверь себя (Квиз)', badge: 'Тест' },
        ].map((tab) => {
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/50'
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive ? 'bg-black/30 text-amber-300' : 'bg-slate-800 text-emerald-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SECTION 0: STEP-BY-STEP SETUP GUIDE (Ultra clear for beginners) */}
      {activeSection === 'how-to-setup' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8">
            <div className="max-w-3xl space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <SlidersHorizontal className="h-4 w-4" />
                ПОШАГОВАЯ ИНСТРУКЦИЯ (ОТ А ДО Я)
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Как правильно настроить фильтр за 3 шага
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Настройка фильтра — это не высшая математика. Вы просто говорите роботу: <i>«Найди мне матч, где на 75-й минуте счет 0:0, а фаворит непрерывно бьет по воротам, и пришли мне алерт в Telegram»</i>.
              </p>
            </div>

            {/* 3 Step Visual Flow */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Step 1 Card */}
              <div className="bg-slate-950 border border-emerald-500/40 rounded-3xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 font-black text-base flex items-center justify-center border border-emerald-500/40">
                    1
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-emerald-400 font-bold border border-slate-800">
                    ТАЙМИНГ & СЧЁТ
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">
                  Шаг 1: Задаём время и счёт
                </h3>
                <div className="space-y-2 text-xs text-slate-300">
                  <p>
                    <b>Минуты (70' – 88'):</b> Не сканируйте весь матч (1-90'). В начале матча кэф на гол мизерный (1.10). К 75-й минуте кэф вырастает до <b>1.80 – 2.20</b>!
                  </p>
                  <p>
                    <b>Счёт (0:0 или ≤ 2 голов):</b> Нам нужны напряженные матчи, где победа висит на волоске. При счете 4:0 команды бросают играть.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800/80 text-[11px] text-emerald-300 font-mono">
                  💡 Настройка: Минуты: 70–88' | Счёт: 0-0 или ТБ 2.5 не пробит
                </div>
              </div>

              {/* Step 2 Card */}
              <div className="bg-slate-950 border border-sky-500/40 rounded-3xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-300 font-black text-base flex items-center justify-center border border-sky-500/40">
                    2
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-sky-400 font-bold border border-slate-800">
                    ДАВЛЕНИЕ (LIVE)
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">
                  Шаг 2: Выставляем штурм ворот
                </h3>
                <div className="space-y-2 text-xs text-slate-300">
                  <p>
                    <b>Что такое К1 и К2?</b><br />
                    • <b>К1</b> = Команда 1 (Хозяева поля)<br />
                    • <b>К2</b> = Команда 2 (Гости)<br />
                    • <b>Разница (К1 - К2)</b> = преимущество одной команды над другой.
                  </p>
                  <p>
                    <b>Опасные атаки (≥ 15 за 15 мин):</b> Это значит, что фаворит запер соперника в штрафной и наносит шквал прострелов прямо сейчас.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800/80 text-[11px] text-sky-300 font-mono">
                  💡 Настройка: Опасные атаки К1 за 15 мин ≥ 12 | Удары в створ ≥ 4
                </div>
              </div>

              {/* Step 3 Card */}
              <div className="bg-slate-950 border border-amber-500/40 rounded-3xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 font-black text-base flex items-center justify-center border border-amber-500/40">
                    3
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-amber-400 font-bold border border-slate-800">
                    ИСХОД & TELEGRAM
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">
                  Шаг 3: На что ставить и куда слать
                </h3>
                <div className="space-y-2 text-xs text-slate-300">
                  <p>
                    <b>Целевой исход:</b> Напишите в поле понятную для себя фразу, например <i>«ТБ 0.5 во 2-м тайме»</i> или <i>«Гол фаворита после 75'»</i>.
                  </p>
                  <p>
                    <b>Telegram Бот:</b> Привяжите вашего бота в 1 клик, чтобы не сидеть у монитора — сигнал со всеми цифрами придёт на телефон за 0.3 сек.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800/80 text-[11px] text-amber-300 font-mono">
                  💡 Настройка: Исход: ТБ 0.5 во 2Т | Бот: @SportSignal_bot
                </div>
              </div>
            </div>

            {/* Visual breakdown of fields in BetLab interface */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Info className="h-5 w-5 text-emerald-400" />
                Шпаргалка: Что означает каждое поле в новом конструкторе BetLab
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-emerald-400">⏱️ Минута матча (От / До)</div>
                  <p className="text-slate-300 leading-relaxed">
                    Диапазон времени, в который фильтр имеет право отправить сигнал. Например, если указать 70–85', то на 69' минуте бот промолчит, а ровно на 70' проверит все условия.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-emerald-400">⚽ Счёт (0:0, Ничья, ТБ 2.5 не пробит)</div>
                  <p className="text-slate-300 leading-relaxed">
                    Условие текущего счёта. Если вы ищете гол в сухом матче, выбирайте «0:0». Если ищете победный гол в равной игре — «Любая ничья» (0:0, 1:1, 2:2).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-sky-400">🔥 Опасные атаки (Разница К1 - К2)</div>
                  <p className="text-slate-300 leading-relaxed">
                    Показывает перевес фаворита. Если у хозяев 55 опасных атак, а у гостей 20 — разница составляет <b>+35</b>. Это колоссальное давление, гол витает в воздухе!
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-purple-400">📊 Модель xG (Ожидаемые голы)</div>
                  <p className="text-slate-300 leading-relaxed">
                    Математический вес созданных моментов. Если xG ≥ 1.5, а на табло 0:0 — значит команда создала верных моментов на полтора гола, мяч обязательно зайдет в сетку.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-950 to-emerald-950/60 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-base font-bold text-white">
                  Готовы настроить свой первый фильтр?
                </div>
                <p className="text-xs text-slate-400">
                  Перейдите в конструктор матрицы или воспользуйтесь готовыми карточками.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigateTab('filters')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition active:scale-95"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Открыть конструктор BetLab →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: INTERACTIVE SIMULATOR (Sandbox for beginners) */}
      {activeSection === 'simulator' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                  <Flame className="h-4 w-4" />
                  Живая симуляция
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Интерактивная песочница: Почувствуй работу фильтра своими руками
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Двигайте ползунки минуты, атак и счета ниже. Посмотрите, в какой именно момент фильтр сработает и сформирует сигнал в Telegram!
                </p>
              </div>

              {/* Strategy selector for simulation */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start md:self-center shrink-0">
                {[
                  { id: 'late_goal', label: '🔥 Гол 75\'+' },
                  { id: 'dominance_zero', label: '⚽ 0:0 Фаворит' },
                  { id: 'smart_money', label: '📉 Smart Money' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSimStrategy(s.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      selectedSimStrategy === s.id
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Interactive Grid: Left Controls (Sliders), Right Output (Visual Card & Telegram Alert) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Sliders & Knobs (6 cols) */}
              <div className="lg:col-span-6 space-y-5 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-emerald-400" />
                    Управление параметрами матча
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setSimMinute(78);
                      setSimHomeScore(0);
                      setSimAwayScore(0);
                      setSimDangerousAttacks(58);
                      setSimDangerousAttacksAway(18);
                      setSimShotsOnTarget(6);
                      setSimXgHome(1.85);
                      setSimOddsOver05(1.82);
                    }}
                    className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Сбросить к идеалу
                  </button>
                </div>

                {/* Slider 1: Minute */}
                <div className="space-y-1.5 bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-300">Минута матча (Live таймер)</span>
                    <span className="font-mono font-bold text-sky-400 text-sm px-2 py-0.5 rounded bg-sky-950/60 border border-sky-500/30">
                      {simMinute}' МИН
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="90"
                    value={simMinute}
                    onChange={(e) => setSimMinute(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>1' свисток</span>
                    <span>45' перерыв</span>
                    <span className="text-amber-400 font-bold">75' золотая зона</span>
                    <span>90' финал</span>
                  </div>
                </div>

                {/* Score Controls */}
                <div className="space-y-1.5 bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-300">Текущий счёт в матче</span>
                    <span className="font-mono font-black text-amber-300 text-base">
                      {simHomeScore} : {simAwayScore}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs">
                      <span className="text-slate-400">Хозяева:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSimHomeScore(Math.max(0, simHomeScore - 1))}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold w-4 text-center">{simHomeScore}</span>
                        <button
                          type="button"
                          onClick={() => setSimHomeScore(simHomeScore + 1)}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs">
                      <span className="text-slate-400">Гости:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSimAwayScore(Math.max(0, simAwayScore - 1))}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold w-4 text-center">{simAwayScore}</span>
                        <button
                          type="button"
                          onClick={() => setSimAwayScore(simAwayScore + 1)}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dangerous Attacks difference */}
                <div className="space-y-1.5 bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-300">Опасные атаки Хозяев (Штурм)</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {simDangerousAttacks} оп. атак (Разница: +{simDangerousAttacks - simDangerousAttacksAway})
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={simDangerousAttacks}
                    onChange={(e) => setSimDangerousAttacks(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>10 (вялая игра)</span>
                    <span>35 (равная игра)</span>
                    <span className="text-rose-400 font-bold">55+ (тотальный навал)</span>
                  </div>
                </div>

                {/* Shots on Target */}
                <div className="space-y-1.5 bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-300">Удары в створ фаворита</span>
                    <span className="font-mono font-bold text-amber-300 text-sm">
                      {simShotsOnTarget} в створ
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    value={simShotsOnTarget}
                    onChange={(e) => setSimShotsOnTarget(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* xG Model */}
                <div className="space-y-1.5 bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-300">Ожидаемые голы (xG Модель)</span>
                    <span className="font-mono font-bold text-purple-400 text-sm">
                      xG {simXgHome.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3.5"
                    step="0.05"
                    value={simXgHome}
                    onChange={(e) => setSimXgHome(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              </div>

              {/* Right Column: Visual Result Card & Instant Alert (6 cols) */}
              <div className="lg:col-span-6 space-y-4">
                {/* Result Status Banner */}
                <div
                  className={`p-4 rounded-2xl border transition-all duration-300 ${
                    simEvaluation.allPassed
                      ? 'bg-gradient-to-r from-emerald-950/90 via-emerald-900/50 to-slate-950 border-emerald-400 shadow-xl shadow-emerald-950/70'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 font-bold ${
                          simEvaluation.allPassed
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/50 animate-bounce'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {simEvaluation.allPassed ? '✓' : '⏳'}
                      </div>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Статус фильтра «{simEvaluation.strategyName}»
                        </div>
                        <div
                          className={`text-base font-black ${
                            simEvaluation.allPassed ? 'text-emerald-300' : 'text-slate-300'
                          }`}
                        >
                          {simEvaluation.allPassed
                            ? '🟢 СИГНАЛ СРАБОТАЛ! УСЛОВИЯ ВЫПОЛНЕНЫ'
                            : '🟡 ОЖИДАНИЕ: Некоторые условия ещё не сошлись'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Checklist of conditions */}
                  <div className="mt-4 space-y-2 border-t border-slate-800/80 pt-3">
                    {simEvaluation.criteria.map((c, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs transition ${
                          c.met
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-200'
                            : 'bg-slate-900/60 border border-slate-800/80 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {c.met ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border border-slate-600 flex items-center justify-center text-[9px] text-slate-500">
                              ✕
                            </div>
                          )}
                          <span className="font-semibold text-slate-200">{c.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 hidden sm:inline">{c.tip}</span>
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                              c.met
                                ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {c.current}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulated Telegram Message Notification */}
                <div className="bg-[#17212b] border border-[#242f3d] rounded-2xl p-4 text-slate-200 text-xs shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-[#242f3d]/80 pb-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center text-[10px] font-bold text-white">
                        FM
                      </div>
                      <span className="font-bold text-sky-400">SportSignal Alert Bot (Telegram)</span>
                    </div>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {simEvaluation.allPassed ? 'МГНОВЕННО' : 'ЖДЕТ'}
                    </span>
                  </div>

                  {simEvaluation.allPassed ? (
                    <div className="space-y-2 text-slate-200 leading-relaxed">
                      <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <Flame className="h-4 w-4 text-amber-400 animate-pulse" />
                        СИГНАЛ: {simEvaluation.strategyName}
                      </div>
                      <div className="bg-[#1f2b38] p-2.5 rounded-xl border border-[#2b3a4a] flex items-center justify-between">
                        <div className="font-bold text-white text-sm">
                          Arsenal <span className="text-emerald-400">{simHomeScore}:{simAwayScore}</span> Chelsea
                        </div>
                        <span className="text-xs font-mono text-emerald-300 font-bold">
                          {simMinute}' МИН
                        </span>
                      </div>

                      {/* Prominent Target Market Box */}
                      <div className="bg-gradient-to-r from-emerald-950 via-[#193d2c] to-emerald-950 p-3 rounded-xl border-2 border-emerald-400 shadow-md">
                        <div className="text-[10px] uppercase font-bold text-emerald-300 flex items-center justify-between">
                          <span>🎯 РЕКОМЕНДУЕМАЯ СТАВКА:</span>
                          <span className="font-mono font-bold text-amber-300">Кэф ~1.80</span>
                        </div>
                        <div className="text-sm font-black text-white mt-1">
                          {simEvaluation.targetMarket}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-300 space-y-0.5 pt-1">
                        <div>🔥 Опасные атаки: {simDangerousAttacks} - {simDangerousAttacksAway} (+{simDangerousAttacks - simDangerousAttacksAway})</div>
                        <div>🎯 Удары в створ: {simShotsOnTarget} - 1</div>
                        <div>📊 Модель xG: {simXgHome.toFixed(2)} vs 0.40</div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-2 text-slate-400">
                      <p className="text-xs font-medium">
                        Бот молчит — условия стратегии ещё не наступили.
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Подвиньте ползунок минуты к <b className="text-slate-300">75'</b> и опасные атаки к <b className="text-slate-300">55+</b>, чтобы увидеть появление сигнала!
                      </p>
                    </div>
                  )}
                </div>

                {/* Apply Button */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenFilterBuilder) {
                        onOpenFilterBuilder({
                          name: simEvaluation.strategyName,
                          minMinute: 72,
                          maxMinute: 88,
                          minDangerousAttacksDiff: 15,
                          targetMarket: simEvaluation.targetMarket,
                        });
                      }
                      onNavigateTab('filters');
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition active:scale-95"
                  >
                    <Check className="h-4 w-4" />
                    <span>Создать этот фильтр в реальной панели</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: ANATOMY OF A MATCH CARD */}
      {activeSection === 'cards' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 uppercase tracking-wider">
                <Target className="h-4 w-4" />
                Инфографика карточки
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Анатомия карточки матча: что означают показатели
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Кликните по любому элементу карточки ниже, чтобы прочитать, как профессиональные игроки используют эту цифру для оценки гола.
              </p>
            </div>

            {/* Interactive Visual Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Visual Mockup Card with click pins (7 cols) */}
              <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl relative space-y-4">
                {/* Header row */}
                <div
                  onClick={() => setHighlightedCardElement('league')}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    highlightedCardElement === 'league'
                      ? 'bg-sky-500/20 border-sky-400 ring-2 ring-sky-500/40'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏴󠁧󠁢󠁥󠁮󠁧󠁿</span>
                      <span className="font-bold text-white">Premier League</span>
                      <span className="text-slate-500">• 28-й тур</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[10px]">
                      LIVE
                    </span>
                  </div>
                </div>

                {/* Score & Minute row */}
                <div
                  onClick={() => setHighlightedCardElement('score')}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    highlightedCardElement === 'score'
                      ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-500/40'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-black text-white">
                        Arsenal <span className="text-amber-400 font-mono">1 : 1</span> Chelsea
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">Хозяева vs Гости</div>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold text-xs">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                        74' МИНУТА
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">2-й тайм (Концовка)</div>
                    </div>
                  </div>
                </div>

                {/* Dangerous Attacks & Pressure Momentum */}
                <div
                  onClick={() => setHighlightedCardElement('attacks')}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    highlightedCardElement === 'attacks'
                      ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-500/40'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-emerald-400" />
                      Опасные атаки (Штурм ворот)
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      64 : 22 (+42 у фаворита!)
                    </span>
                  </div>
                  {/* Visual attack ratio bar */}
                  <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div style={{ width: '74%' }} className="bg-emerald-500 h-full" />
                    <div style={{ width: '26%' }} className="bg-slate-600 h-full" />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                    <span>Arsenal (74% прессинга)</span>
                    <span>Chelsea (26%)</span>
                  </div>
                </div>

                {/* xG Model & Shots */}
                <div
                  onClick={() => setHighlightedCardElement('xg')}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    highlightedCardElement === 'xg'
                      ? 'bg-purple-500/20 border-purple-400 ring-2 ring-purple-500/40'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-slate-400 font-semibold">Модель xG (Ожидаемые голы)</div>
                      <div className="text-base font-black text-purple-300 font-mono mt-0.5">
                        2.15 vs 0.72
                      </div>
                      <div className="text-[10px] text-slate-500">Наиграли на 2+ гола</div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-semibold">Удары в створ (Всего)</div>
                      <div className="text-base font-black text-amber-300 font-mono mt-0.5">
                        8 в створ (из 15)
                      </div>
                      <div className="text-[10px] text-slate-500">Постоянные сейвы вратаря</div>
                    </div>
                  </div>
                </div>

                {/* Smart Money & Odds */}
                <div
                  onClick={() => setHighlightedCardElement('odds')}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    highlightedCardElement === 'odds'
                      ? 'bg-rose-500/20 border-rose-400 ring-2 ring-rose-500/40'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <div className="text-rose-400 font-bold flex items-center gap-1">
                        <TrendingDown className="h-4 w-4" />
                        Прогруз Smart Money (Биржа Betfair)
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        Кэф на П1 упал с <span className="line-through text-slate-500">2.15</span> до <b className="text-emerald-400">1.62</b> (-24.6%)
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold text-[10px] border border-rose-500/30">
                        78% пула рынка (€184k)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Detailed Explanations for selected element (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                {highlightedCardElement === 'attacks' && (
                  <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-5 space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                      <Flame className="h-3.5 w-3.5" />
                      Опасные атаки (Самый важный датчик)
                    </div>
                    <h3 className="text-base font-black text-white">
                      Почему опасные атаки важнее владения мячом?
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Владение мячом часто бывает «стерильным» — команда просто катает мяч между защитниками на своей половине.
                    </p>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                      <div className="font-bold text-emerald-400">Правило профи:</div>
                      <p className="text-slate-300 text-[11px]">
                        <b>Опасная атака</b> фиксируется, только когда мяч вошёл в финальную треть поля и несёт угрозу штрафной.
                        Если разница опасных атак превышает <b>+15-20</b> за тайм — это верный признак скорого гола!
                      </p>
                    </div>
                  </div>
                )}

                {highlightedCardElement === 'score' && (
                  <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-5 space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold">
                      <Target className="h-3.5 w-3.5" />
                      Счёт и Минута (Золотое окно)
                    </div>
                    <h3 className="text-base font-black text-white">
                      Тайминг: почему 70-85' минута — лучшая для ставок?
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      К 70-й минуте коэффициенты букмекера на тотал больше взлетают до максимума (1.70 - 2.10).
                      При этом команды устают, теряют концентрацию в обороне, а тренеры выпускают свежих нападающих.
                    </p>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                      <div className="font-bold text-amber-400">Статистика:</div>
                      <p className="text-slate-300 text-[11px]">
                        Более <b>28% всех голов</b> в топ-лигах забиваются именно после 75-й минуты матча. Фильтр ловит эти моменты автоматически!
                      </p>
                    </div>
                  </div>
                )}

                {highlightedCardElement === 'xg' && (
                  <div className="bg-slate-950 border border-purple-500/40 rounded-2xl p-5 space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold">
                      <Activity className="h-3.5 w-3.5" />
                      Модель xG (Ожидаемые голы)
                    </div>
                    <h3 className="text-base font-black text-white">
                      Что такое xG и как на нём зарабатывать?
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <b>xG (Expected Goals)</b> — это математическая оценка каждого удара: какова вероятность, что из этой точки влетит гол (от 0.01 до 0.99).
                    </p>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                      <div className="font-bold text-purple-400">Секрет аномалии:</div>
                      <p className="text-slate-300 text-[11px]">
                        Если у команды xG = <b>2.15</b>, а на табло всё ещё <b>0:0</b> — значит, фавориту просто катастрофически не везло (штанги, сейвы). По закону больших чисел гол обязательно будет!
                      </p>
                    </div>
                  </div>
                )}

                {highlightedCardElement === 'odds' && (
                  <div className="bg-slate-950 border border-rose-500/40 rounded-2xl p-5 space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-bold">
                      <TrendingDown className="h-3.5 w-3.5" />
                      Прогруз Smart Money (Умные деньги)
                    </div>
                    <h3 className="text-base font-black text-white">
                      Что такое Steam Move и падение кэфа?
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Когда профессиональные беттинг-синдикаты вливают сотни тысяч евро на один исход, биржа вынуждена резко понижать коэффициент, чтобы уравновесить риски.
                    </p>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                      <div className="font-bold text-rose-400">Как это использовать:</div>
                      <p className="text-slate-300 text-[11px]">
                        Фильтр отслеживает падение кэфа от <b>12-15%</b> при объеме ставок от <b>65% пула</b>. Вы входите в сделку по следам умных денег.
                      </p>
                    </div>
                  </div>
                )}

                {highlightedCardElement === 'league' && (
                  <div className="bg-slate-950 border border-sky-500/40 rounded-2xl p-5 space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 text-xs font-bold">
                      <Shield className="h-3.5 w-3.5" />
                      Лиги и отбор чемпионатов
                    </div>
                    <h3 className="text-base font-black text-white">
                      Почему важно отсекать сомнительные лиги?
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      В молодёжных первенствах (U19/U21) и низших дивизионах статистика часто запаздывает или выдает шум.
                    </p>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                      <div className="font-bold text-sky-400">Настройка фильтра:</div>
                      <p className="text-slate-300 text-[11px]">
                        В наших алгоритмах по умолчанию включена галочка <b>«Без молодежек и женских лиг»</b> — чтобы сигналы приходили только по надежным турнирам с высокой ликвидностью.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: HOW FILTERS WORK (Step-by-step pipeline) */}
      {activeSection === 'filters' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Sliders className="h-4 w-4" />
                Принцип работы
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Как фильтр превращает сырые данные в сигнал за 1 секунду
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Вам больше не нужно просматривать десятки вкладок Flashscore или БК. Робот делает это каждую секунду по алгоритму:
              </p>
            </div>

            {/* Step-by-step 4-step flowchart */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {/* Step 1 */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 relative">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-black text-base border border-sky-500/30">
                  1
                </div>
                <h3 className="text-sm font-bold text-white">Сканирование 500+ матчей</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Каждую секунду движок собирает данные из Flashscore, Sofascore и бирж ставок по всем активным матчам планеты.
                </p>
                <div className="text-[10px] text-sky-400 font-mono bg-sky-950/40 p-2 rounded-lg border border-sky-500/20">
                  🌐 500+ игр одновременно
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 relative">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-base border border-amber-500/30">
                  2
                </div>
                <h3 className="text-sm font-bold text-white">Сверка с вашим правилом</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Проверяются все заданные пороги: совпала ли минута (например 75'+), счёт (0:0), разница атак (≥20) и xG.
                </p>
                <div className="text-[10px] text-amber-400 font-mono bg-amber-950/40 p-2 rounded-lg border border-amber-500/20">
                  ⚙️ 15+ математических триггеров
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 relative">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-base border border-purple-500/30">
                  3
                </div>
                <h3 className="text-sm font-bold text-white">Исключение шума (Анти-дубль)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Если сигнал по этому матчу уже отправлялся — система не спамит вас повторно. Защита от дублей бережёт ваше внимание.
                </p>
                <div className="text-[10px] text-purple-400 font-mono bg-purple-950/40 p-2 rounded-lg border border-purple-500/20">
                  🛡️ Строго 1 сигнал на матч
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-5 space-y-3 relative shadow-lg shadow-emerald-950/40">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-base shadow">
                  4
                </div>
                <h3 className="text-sm font-bold text-white">Сигнал в Telegram</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  В ваш личный Telegram или канал прилетает сообщение с названием команды, минутой, статистикой и рекомендованной ставкой.
                </p>
                <div className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/30">
                  📱 Доставка за 0.3 секунды
                </div>
              </div>
            </div>

            {/* Simple Analogy for Beginners */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 shrink-0">
                <Info className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">
                  Простая аналогия: Сигнализация в автомобиле
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Представьте датчик удара в машине: пока всё спокойно, сигнализация молчит. Но как только кто-то задел бампер с определенной силой — раздаётся звуковой сигнал. Фильтр в ставках устроен точно так же: он спит, пока игра скучная, и мгновенно «будит» вас, когда в матче назрел идеальный голевой момент!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: CARDS VS MATRIX (Which one to use?) */}
      {activeSection === 'matrix-vs-cards' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase tracking-wider">
                <Layers className="h-4 w-4" />
                Сравнение режимов
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Режим Карточек vs Тактическая Матрица: что выбрать?
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                В нашей платформе есть два способа работы с фильтрами. Для новичков и для опытных игроков:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option A: Cards */}
              <div className="bg-slate-950 border border-emerald-500/40 rounded-3xl p-6 space-y-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                    <LayoutGrid className="h-3.5 w-3.5" />
                    РЕЖИМ КАРТОЧЕК (Идеально для новичка)
                  </div>
                  <span className="text-xs font-bold text-emerald-400">1 Клик</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-black text-white">
                    Готовые проверенные стратегии
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Здесь уже заложены 8 классических заводских алгоритмов (Штурм 75'+, Сухой фаворит 0:0, Smart Money, Осада угловыми).
                  </p>
                </div>

                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span><b>Не нужно разбираться в математике</b> — всё настроено</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span><b>Кнопка «ЗАПУСТИТЬ»</b> сразу включает алерты</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span><b>Понятный русский язык</b> каждого параметра</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab('filters')}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <span>Перейти к карточкам фильтров →</span>
                </button>
              </div>

              {/* Option B: Matrix */}
              <div className="bg-slate-950 border border-sky-500/40 rounded-3xl p-6 space-y-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-bold">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    ТАКТИЧЕСКАЯ МАТРИЦА (Уровень PRO / BetLab)
                  </div>
                  <span className="text-xs font-bold text-sky-400">Конструктор</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-black text-white">
                    Гибкий сканер показателей
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Для тех, кто хочет настраивать отдельные пороги для Хозяев (К1), Гостей (К2), Фаворита, дельты и окна за последние 15 минут.
                  </p>
                </div>

                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0" />
                    <span><b>Точные пороги</b> для каждого параметра (удары, углы, xG)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0" />
                    <span><b>Анализ серий</b> (например ТБ 2.5 в 4 из 5 последних очных)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0" />
                    <span><b>Интерактивная доска поля</b> с зонами ударов</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab('filters')}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition border border-slate-700"
                >
                  <span>Открыть тактическую матрицу →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: 4 TOP STRATEGIES FOR BEGINNERS */}
      {activeSection === 'strategies' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Sparkles className="h-4 w-4" />
                Практическое руководство
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                4 классические стратегии: на чём зарабатывают новички
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Эти 4 паттерна доказали свою эффективность на дистанции в тысячах матчей. Нажмите на любой, чтобы активировать его в 1 клик.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strat 1 */}
              <div className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 space-y-4 transition flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/30">
                      🔥 СТРАТЕГИЯ №1
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">ROI ~+14.8%</span>
                  </div>
                  <h3 className="text-base font-bold text-white">Поздний гол в концовке (75-90')</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <b>Условие:</b> 75-я минута матча, счёт 0:0, 1:0 или 1:1 (разница не более 1 мяча), опасные атаки фаворита растут лавинообразно.
                  </p>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-[11px] text-amber-300 font-mono">
                    🎯 Целевая ставка: ТБ 0.5 во 2-м тайме / Гол после 75' (Кэф 1.75 - 2.10)
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenFilterBuilder) {
                      onOpenFilterBuilder({
                        name: '🔥 Штурм в концовке (75-90\')',
                        minMinute: 75,
                        maxMinute: 90,
                        minDangerousAttacksDiff: 18,
                        targetMarket: 'ТБ 0.5 во 2-м тайме',
                      });
                    }
                    onNavigateTab('filters');
                  }}
                  className="w-full py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white font-bold text-xs border border-emerald-500/40 transition flex items-center justify-center gap-1.5"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Запустить этот алгоритм</span>
                </button>
              </div>

              {/* Strat 2 */}
              <div className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 space-y-4 transition flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                      ⚽ СТРАТЕГИЯ №2
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">ROI ~+12.2%</span>
                  </div>
                  <h3 className="text-base font-bold text-white">Сухое доминирование при 0:0</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <b>Условие:</b> 60-я минута, счёт 0:0. Явный фаворит нанёс более 8 ударов, xG превышает 1.40, но мяч упорно не идёт в сетку.
                  </p>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-[11px] text-amber-300 font-mono">
                    🎯 Целевая ставка: Победа фаворита (П1) / ТБ 0.5 в матче
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenFilterBuilder) {
                      onOpenFilterBuilder({
                        name: '⚽ Сухое доминирование при 0:0',
                        minMinute: 60,
                        maxMinute: 85,
                        scoreCondition: '0-0',
                        minXgTotal: 1.4,
                        targetMarket: 'ТБ 0.5 в матче',
                      });
                    }
                    onNavigateTab('filters');
                  }}
                  className="w-full py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white font-bold text-xs border border-emerald-500/40 transition flex items-center justify-center gap-1.5"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Запустить этот алгоритм</span>
                </button>
              </div>

              {/* Strat 3 */}
              <div className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 space-y-4 transition flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 font-bold text-xs border border-sky-500/30">
                      🚩 СТРАТЕГИЯ №3
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">ROI ~+9.5%</span>
                  </div>
                  <h3 className="text-base font-bold text-white">Осада угловыми (Тотал больше угловых)</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <b>Условие:</b> Атакующая команда проигрывает и осаждает штрафную фланговыми прострелами. Защитники выбивают мяч на угловой раз за разом.
                  </p>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-[11px] text-amber-300 font-mono">
                    🎯 Целевая ставка: Индивидуальный тотал угловых фаворита (ИТБ)
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenFilterBuilder) {
                      onOpenFilterBuilder({
                        name: '🚩 Серия угловых и осада ворот',
                        minMinute: 65,
                        maxMinute: 90,
                        minTotalCorners: 8,
                        targetMarket: 'Тотал больше угловых',
                      });
                    }
                    onNavigateTab('filters');
                  }}
                  className="w-full py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white font-bold text-xs border border-emerald-500/40 transition flex items-center justify-center gap-1.5"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Запустить этот алгоритм</span>
                </button>
              </div>

              {/* Strat 4 */}
              <div className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 space-y-4 transition flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
                      📉 СТРАТЕГИЯ №4
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">ROI ~+16.4%</span>
                  </div>
                  <h3 className="text-base font-bold text-white">Smart Money / Денежный прогруз</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <b>Условие:</b> Падение кэфа на исход от 15% на бирже ставок при доле денег более 70% всего пула. Рынок точно знает инсайд или исход.
                  </p>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-[11px] text-amber-300 font-mono">
                    🎯 Целевая ставка: Исход, куда вливаются миллионы (Steam move)
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenFilterBuilder) {
                      onOpenFilterBuilder({
                        name: '📉 Smart Money: Падение кэфа ≥15%',
                        minOddsDropPercent: 15,
                        minMoneyVolumePercent: 70,
                        targetMarket: 'Исход с прогрузом (Steam Move)',
                      });
                    }
                    onNavigateTab('filters');
                  }}
                  className="w-full py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white font-bold text-xs border border-emerald-500/40 transition flex items-center justify-center gap-1.5"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Запустить этот алгоритм</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: GLOSSARY FOR BEGINNERS */}
      {activeSection === 'glossary' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                <BookOpen className="h-4 w-4" />
                Словарь беттинга
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Термины и сокращения простым языком
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Забудьте сложный сленг. Вот что на самом деле означают основные буквы и цифры в нашем сервисе:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  term: 'ТБ (Тотал Больше)',
                  short: 'ТБ 2.5 / ТБ 0.5',
                  desc: 'Ставка на то, что голов будет БОЛЬШЕ указанного числа. Например, ТБ 2.5 выигрывает, если забито 3 гола и более (2:1, 3:0). Половинка (.5) нужна, чтобы не было возврата.',
                  icon: '📈',
                  color: 'emerald',
                },
                {
                  term: 'ТМ (Тотал Меньше)',
                  short: 'ТМ 2.5 / ТМ 3.5',
                  desc: 'Ставка на то, что игра будет «сухой». ТМ 2.5 выигрывает при счете 0:0, 1:0, 0:1, 1:1, 2:0 или 0:2 (строго 2 гола или меньше).',
                  icon: '📉',
                  color: 'sky',
                },
                {
                  term: 'xG (Expected Goals)',
                  short: 'Ожидаемые голы',
                  desc: 'Умная модель качества моментов. Показывает, сколько голов команда ДОЛЖНА БЫЛА забить по логике созданных опасных моментов, независимо от удачи.',
                  icon: '📊',
                  color: 'purple',
                },
                {
                  term: 'Коэффициент (Кэф)',
                  short: '1.85 / 2.10',
                  desc: 'Множитель вашего выигрыша. Поставили 1 000 ₽ с кэфом 1.85 — при выигрыше получаете 1 850 ₽ (чистая прибыль 850 ₽).',
                  icon: '💰',
                  color: 'amber',
                },
                {
                  term: 'Валуй (Value Bet)',
                  short: 'Ценная ставка',
                  desc: 'Ситуация, когда реальная вероятность события выше, чем заложил букмекер в свой коэффициент. Именно на дистанции валуев зарабатывают профессионалы.',
                  icon: '💎',
                  color: 'teal',
                },
                {
                  term: 'Smart Money / Прогруз',
                  short: 'Steam Move',
                  desc: 'Резкое падение коэффициента из-за крупного объема денег, поставленного профи. Если кэф упал с 2.20 до 1.65 — значит, знающие люди грузят банк.',
                  icon: '⚡',
                  color: 'rose',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {item.short}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{item.term}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 7: QUIZ / TEST YOUR KNOWLEDGE */}
      {activeSection === 'quiz' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <GraduationCap className="h-4 w-4" />
                Интерактивный тест
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Проверь себя: готов ли ты к поиску сигналов?
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Ответьте на 3 простых вопроса. Если ответите правильно — вы готовы настроить свой первый победный фильтр!
              </p>
            </div>

            {/* Questions list */}
            <div className="space-y-5 max-w-3xl">
              {/* Question 1 */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="text-xs font-bold text-emerald-400">Вопрос 1 из 3</div>
                <h3 className="text-sm font-bold text-white">
                  Матч на 76-й минуте. Счёт 0:0. Фаворит нанёс 14 опасных атак за последние 15 минут, а xG равен 1.95. Что это значит?
                </h3>
                <div className="space-y-2 pt-1 text-xs">
                  {[
                    { id: 0, text: 'Игра вялая, лучше закрыть матч' },
                    { id: 1, text: 'Фаворит тотально давит, гол в концовке назрел (идеально для ставки на ТБ 0.5)' },
                    { id: 2, text: 'Нужно ставить на то, что голов точно не будет' },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        quizAnswers[1] === opt.id
                          ? 'bg-emerald-500/20 border-emerald-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="q1"
                        checked={quizAnswers[1] === opt.id}
                        onChange={() => setQuizAnswers({ ...quizAnswers, 1: opt.id })}
                        className="accent-emerald-500"
                      />
                      <span>{opt.text}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Question 2 */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="text-xs font-bold text-emerald-400">Вопрос 2 из 3</div>
                <h3 className="text-sm font-bold text-white">
                  Что такое «Smart Money» и падение коэффициента биржи от 15%?
                </h3>
                <div className="space-y-2 pt-1 text-xs">
                  {[
                    { id: 0, text: 'Случайный технический сбой на сайте букмекера' },
                    { id: 1, text: 'Крупные игроки и синдикаты загрузили крупную сумму денег на этот исход' },
                    { id: 2, text: 'Матч отменён судьей' },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        quizAnswers[2] === opt.id
                          ? 'bg-emerald-500/20 border-emerald-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="q2"
                        checked={quizAnswers[2] === opt.id}
                        onChange={() => setQuizAnswers({ ...quizAnswers, 2: opt.id })}
                        className="accent-emerald-500"
                      />
                      <span>{opt.text}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Question 3 */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="text-xs font-bold text-emerald-400">Вопрос 3 из 3</div>
                <h3 className="text-sm font-bold text-white">
                  Нужно ли вам сидеть перед монитором и самому следить за 500 матчами?
                </h3>
                <div className="space-y-2 pt-1 text-xs">
                  {[
                    { id: 0, text: 'Да, придётся открывать все матчи вручную' },
                    { id: 1, text: 'Нет, наш фильтр сам сканирует матчи и присылает готовый алерт прямо в Telegram' },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        quizAnswers[3] === opt.id
                          ? 'bg-emerald-500/20 border-emerald-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="q3"
                        checked={quizAnswers[3] === opt.id}
                        onChange={() => setQuizAnswers({ ...quizAnswers, 3: opt.id })}
                        className="accent-emerald-500"
                      />
                      <span>{opt.text}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Check button & results */}
              {!quizSubmitted ? (
                <button
                  type="button"
                  disabled={quizAnswers[1] === null || quizAnswers[2] === null || quizAnswers[3] === null}
                  onClick={() => setQuizSubmitted(true)}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-sm shadow-lg shadow-emerald-950/60 transition active:scale-95"
                >
                  Проверить мои ответы
                </button>
              ) : (
                <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-base">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>Отличный результат! Все 3 ответа верны (3 из 3)!</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Вы полностью поняли логику работы фильтров и карточек. Теперь вы знаете, как ловить поздние голы, навалы и прогрузы рынка без потери времени.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => onNavigateTab('filters')}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                    >
                      <span>Перейти к запуску фильтров →</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('matches')}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
                    >
                      <span>Смотреть live-матчи прямо сейчас</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
