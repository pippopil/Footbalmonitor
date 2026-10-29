import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Save,
  Sliders,
  Send,
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  Target,
  Layers,
  AlertCircle,
  HelpCircle,
  Zap,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ShieldCheck,
  Scale,
  DollarSign,
  Calculator,
  TrendingUp,
  TrendingDown,
  Bot,
  FileText,
  Lock,
  Crown,
} from 'lucide-react';
import { FilterRule, Match, ScoreCondition, FilterCategory, TelegramBotProfile } from '../types';
import { evaluateFilterRule } from '../algorithms';
import { cleanPresetTitle, getStrategyCardDisplayName } from '../utils/filterDefaults';

interface FilterBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (filter: FilterRule) => void;
  initialFilter?: FilterRule | null;
  liveMatches: Match[];
  userBots?: TelegramBotProfile[];
  onOpenAISynthesizer?: () => void;
  isPaidUser?: boolean;
  isDeveloper?: boolean;
  onUpgradePlan?: () => void;
}

const STRATEGY_PRESETS = [
  {
    label: '🎯 Фаворит на 17\'',
    badge: 'Стр. 2',
    data: {
      name: '🎯 Стратегия 2: Фаворит + активность на 17-й минуте',
      description: 'К 17-й минуте: ≥5 ударов, ≥2 угловых. Доматч: кэф фаворита ≤1.50, кэф на ТБ 2.5 ≤1.60.',
      category: 'halftime' as FilterCategory,
      minMinute: 15,
      maxMinute: 22,
      scoreCondition: 'ANY' as ScoreCondition,
      minTotalShots: 5,
      minTotalCorners: 2,
      maxOddsFavorite: 1.50,
      maxOddsOver25: 1.60,
      targetMarket: 'Гол в 1-м тайме (ТБ 0.5 1Т)',
      color: 'emerald',
    },
  },
  {
    label: '⚽ А ГДЕ ЖЕ ГОЛ v2',
    badge: 'Стр. 4',
    data: {
      name: '⚽ Стратегия 4: А ГДЕ ЖЕ ГОЛ!!! v2.0 (0:0 на 60\')',
      description: 'Счет 0:0 к 60\'. Преимущество: удары ≥6, углы ≥5, атаки ≥10, оп.атаки ≥5. Без КК. Без молодежек и женских лиг.',
      category: 'goals' as FilterCategory,
      minMinute: 55,
      maxMinute: 65,
      scoreCondition: '0-0' as ScoreCondition,
      maxTotalGoals: 0,
      minShotsDiff: 6,
      minCornersDiff: 5,
      minAttacksDiff: 10,
      minDangerousAttacksDiff: 5,
      redCardCondition: 'NO_RED_CARDS' as const,
      excludeYouthAndWomen: true,
      requireNoZeroZeroLast5: true,
      targetMarket: 'ТБ 0.5 в матче / Гол фаворита',
      color: 'rose',
    },
  },
  {
    label: '🚩 Осада угловыми 55\'',
    badge: 'Стр. 5',
    data: {
      name: '🚩 Стратегия 5: Осада с угловых при 0:0 на 55\'',
      description: 'К 55-й минуте 0:0, перевес по угловым ≥5 и преимущество по ударам. Проход >90%. Без красных карточек.',
      category: 'corners' as FilterCategory,
      minMinute: 50,
      maxMinute: 60,
      scoreCondition: '0-0' as ScoreCondition,
      maxTotalGoals: 0,
      minCornersDiff: 5,
      minShotsDiff: 2,
      redCardCondition: 'NO_RED_CARDS' as const,
      targetMarket: 'ТБ 0.5 / ТБ 1.0 в матче',
      color: 'blue',
    },
  },
  {
    label: '📐 Стратегия 7 (ТБ 2.5 на 70\')',
    badge: 'Стр. 7',
    data: {
      name: '📐 Стратегия 7: Алгоритм на ТБ 2.5 (Сигнал на 70\' при непробитом ТБ 2.5)',
      description: 'Сигнал на 70-й минуте (70-75\'), когда ТБ 2.5 ещё не пробит (счёт ≤ 2 голов) при расчетном IPT > 2.70 или кэфе ТБ 2.5 ≤ 1.90.',
      category: 'goals' as FilterCategory,
      ruleType: 'LIVE' as const,
      minMinute: 70,
      maxMinute: 75,
      scoreCondition: 'TOTAL_UNDER_25' as ScoreCondition,
      maxTotalGoals: 2,
      minModelIpt: 2.70,
      maxOddsOver25: 1.90,
      targetMarket: 'Тотал больше 2.5 / Гол после 70-й мин',
      color: 'amber',
    },
  },
  {
    label: '⚡ Инд. тотал 1Т',
    badge: 'Стр. 8',
    data: {
      name: '⚡ Стратегия 8: Инд. тотал фаворита в 1-м тайме',
      description: 'Фаворит ≤1.70, ТБ 2.5 ≤1.70. В первые 10-25 минут при 0:0 фаворит нанес ≥2 ударов и активно атакует.',
      category: 'halftime' as FilterCategory,
      minMinute: 10,
      maxMinute: 28,
      scoreCondition: '0-0' as ScoreCondition,
      maxTotalGoals: 0,
      maxOddsFavorite: 1.70,
      maxOddsOver25: 1.70,
      minTotalShots: 2,
      targetMarket: 'ИТБ1/ИТБ2 > 0.5 в 1-м тайме',
      color: 'cyan',
    },
  },
  {
    label: '🇬🇧 ТБ 2.5 от англичан',
    badge: 'Стр. 16',
    data: {
      name: '🇬🇧 Стратегия 16: ТБ 2.5 от англичан (Коридор кэфов 1.50–1.67)',
      description: 'Кэф на ТБ 2.5 строго 1.50–1.67, кэф на Обе забьют ≤1.67 (при счёте ≤ 2 голов).',
      category: 'goals' as FilterCategory,
      minMinute: 0,
      maxMinute: 50,
      scoreCondition: 'TOTAL_UNDER_25' as ScoreCondition,
      maxTotalGoals: 2,
      minOddsOver25: 1.50,
      maxOddsOver25: 1.67,
      maxOddsBtts: 1.67,
      targetMarket: 'Тотал больше 2.5',
      color: 'emerald',
    },
  },
  {
    label: '🎼 Моцарт BTTS',
    badge: 'Стр. 14',
    data: {
      name: '🎼 Стратегия 14: Система Моцарта на Обе забьют (BTTS)',
      description: 'Котировки на Обе забьют в диапазоне 1.50–1.67 (пока обе команды не забили).',
      category: 'goals' as FilterCategory,
      minMinute: 0,
      maxMinute: 60,
      scoreCondition: 'BTTS_NO' as ScoreCondition,
      requireBttsNotHit: true,
      minOddsBtts: 1.50,
      maxOddsBtts: 1.67,
      targetMarket: 'Обе команды забьют (BTTS: Да)',
      color: 'blue',
    },
  },
  {
    label: '⏱️ После перерыва',
    badge: 'Стр. 12',
    data: {
      name: '⏱️ Стратегия 12: Гол после перерыва (Серия ТБ 2.5 в 5/5 или 4/5)',
      description: 'Серия ТБ 2.5 пробивалась в 5 из 5 последних матчей команд вообще (допускается 4 из 5 для одной из двух команд). Сигнал приходит не раньше 65-й минуты матча, если во втором тайме ещё не был забит гол.',
      category: 'goals' as FilterCategory,
      minMinute: 65,
      maxMinute: 85,
      scoreCondition: 'ANY' as ScoreCondition,
      minOver25Streak: 5,
      requireOver25StreakAllowed4Of5: true,
      requireNoGoalsInSecondHalf: true,
      excludeYouthAndWomen: true,
      targetMarket: 'Гол во 2-м тайме / ТБ матча (+1 гол)',
      color: 'purple',
    },
  },
  {
    label: '🔥 Штурм 75+\'',
    badge: 'Концовка',
    data: {
      name: '🔥 Штурм в концовке (75-90\')',
      description: 'Интенсивный навал в заключительные 15 минут матча при высокой активности',
      category: 'pressure' as FilterCategory,
      minMinute: 75,
      maxMinute: 90,
      scoreCondition: 'ANY' as ScoreCondition,
      minDangerousAttacksDiff: 18,
      minDangerousAttacksTotal: 45,
      minTotalShots: 10,
      minShotsOnTargetTotal: 4,
      minTotalCorners: 6,
      minPressureIndex: 65,
      targetMarket: 'ТБ 0.5 во 2-м тайме / Гол в концовке',
      color: 'rose',
    },
  },
  {
    label: '🎯 Камбэк фаворита',
    badge: 'Камбэк',
    data: {
      name: '🎯 Камбэк уступающего фаворита',
      description: 'Хозяева или топ-клуб уступают в 1 мяч при колоссальном перевесе по статистике',
      category: 'comeback' as FilterCategory,
      minMinute: 55,
      maxMinute: 88,
      scoreCondition: 'AWAY_LEAD' as ScoreCondition,
      minDangerousAttacksDiff: 24,
      minShotsOnTargetTotal: 5,
      minPossessionDiff: 15,
      minPressureIndex: 70,
      targetMarket: '1X (двойной шанс) / Гол Хозяев',
      color: 'amber',
    },
  },
  {
    label: '💣 Смертельные связки',
    badge: 'ТБ 3.5/4.5',
    data: {
      name: '💣 «Смертельные комбинации» (ТБ 3.5 / 4.5)',
      description: 'П1 ≤1.20 + ТБ 2.5 ≤1.45 + Ф1(-1.5) ≤1.50 или ОЗ ≤1.45 + ТБ 2.5 ≤1.55. Высокая результативность.',
      category: 'goals' as FilterCategory,
      minMinute: 0,
      maxMinute: 50,
      scoreCondition: 'ANY' as ScoreCondition,
      isDeadlyCombination: true,
      targetMarket: 'ТБ 3.5 / ТБ 4.5',
      color: 'rose',
    },
  },
  {
    label: '🚩 Корнер 80+\'',
    badge: 'Концовка',
    data: {
      name: '🚩 Корнер после 80-й минуты (Осада проигрывающего)',
      description: '80-87 мин, разница ровно в 1 мяч, угловых ≥8, проигрывающая команда подала больше угловых.',
      category: 'corners' as FilterCategory,
      minMinute: 80,
      maxMinute: 87,
      scoreCondition: 'ONE_GOAL_DIFF' as ScoreCondition,
      scoreDiffExactly1: true,
      losingTeamMoreCorners: true,
      minTotalCorners: 8,
      targetMarket: 'ТБ угловых в концовке (+1)',
      color: 'amber',
    },
  },
  {
    label: '🚩 Углы фаворита 2Т',
    badge: 'Фаворит',
    data: {
      name: '🚩 Угловые фаворита при проигрыше в 1-м тайме',
      description: 'Прематч фаворит (1.05–1.55) уступает после перерыва. Штурм во втором тайме вызовет серию угловых.',
      category: 'corners' as FilterCategory,
      minMinute: 45,
      maxMinute: 65,
      scoreCondition: 'ANY' as ScoreCondition,
      maxOddsFavorite: 1.55,
      favoriteLosing: true,
      excludeYouthAndWomen: true,
      targetMarket: 'ТБ угловых во 2-м тайме',
      color: 'blue',
    },
  },
  {
    label: '🔥 ТБ 3.5 по линии ≤ 2.00',
    badge: 'ТБ 3.5',
    data: {
      name: '🔥 ТБ 3.5 по линии ≤ 2.00 (Огненный тотал)',
      description: 'По линии ТБ 3.5 ≤ 2.00: гарантированный гол в 1-м тайме и 90% вероятность продолжения во 2-м.',
      category: 'goals' as FilterCategory,
      minMinute: 15,
      maxMinute: 40,
      scoreCondition: '0-0' as ScoreCondition,
      maxOddsOver35: 2.00,
      targetMarket: 'ТБ 0.5 в 1-м тайме / ТБ 2.5',
      color: 'emerald',
    },
  },
  {
    label: '👑 Ничья > 5.0 (Голы 1Т)',
    badge: 'Доминант',
    data: {
      name: '👑 Доминант: кэф на ничью > 5.0 (ТБ 1.5 1Т)',
      description: 'Кэф на ничью > 5.00 при фаворите ≤1.35. Фаворит забивает в 1Т, общий тотал матча > 3.5 с вероятностью 70-90%.',
      category: 'halftime' as FilterCategory,
      minMinute: 10,
      maxMinute: 38,
      scoreCondition: 'ANY' as ScoreCondition,
      minOddsDraw: 5.00,
      maxOddsFavorite: 1.35,
      targetMarket: 'ТБ 1.0/1.5 в 1Т / ТБ 3.5 матча',
      color: 'purple',
    },
  },
  {
    label: '⏱️ 0:0 при аутсайдере ≥ 5.5',
    badge: '2-й тайм',
    data: {
      name: '⏱️ Гол во 2Т: 0:0 к перерыву при слабом андердоге (≥5.5)',
      description: 'Кэф на аутсайдера ≥ 5.50, кэф ТБ 2.5 ≤ 1.50. Первый тайм закончился 0:0. Исключены женские и низшие лиги.',
      category: 'halftime' as FilterCategory,
      minMinute: 46,
      maxMinute: 65,
      scoreCondition: '0-0' as ScoreCondition,
      minOddsUnderdog: 5.50,
      maxOddsOver25: 1.50,
      excludeYouthAndWomen: true,
      targetMarket: 'Гол во 2-м тайме (ТБ 0.5 / 1.0)',
      color: 'cyan',
    },
  },
  {
    label: '🟥 Месть за КК',
    badge: 'Красная',
    data: {
      name: '🟥 Месть за удаление в крайнем матче',
      description: 'Команда получила КК в прошлой игре, но котируется фаворитом (кэф ≤ 3.20). Практически всегда забивает гол.',
      category: 'goals' as FilterCategory,
      minMinute: 0,
      maxMinute: 65,
      scoreCondition: 'ANY' as ScoreCondition,
      requireRedCardLastMatch: true,
      targetMarket: 'ИТБ команды > 0.5 / Гол в 1Т',
      color: 'rose',
    },
  },
  {
    label: '⚡ 2 быстрых гола в 1Т (на 75\')',
    badge: '72-85 мин',
    data: {
      name: '⚡ Два быстрых гола в 1-м тайме (Сигнал 72-85\' без голов)',
      description: 'В 1-м тайме забито 2 быстрых гола подряд (разница ≤ 15 мин). Начиная с 72-75\' и до 85\' при отсутствии голов — сигнал на ТБ матча (поздний гол).',
      category: 'comeback' as FilterCategory,
      minMinute: 72,
      maxMinute: 85,
      scoreCondition: 'ANY' as ScoreCondition,
      maxTotalGoals: 2,
      requireGuestTwoQuickGoals1H: true,
      requireNoGoalsSinceQuickGoals: true,
      targetMarket: 'ТБ матча (+1 гол после 75\')',
      color: 'amber',
    },
  },
  {
    label: '⚖️ Ничья при ТМ 2.5',
    badge: 'Ничья',
    data: {
      name: '⚖️ Оценка букмекера: ничья (X) при ТМ 2.5',
      description: 'Кэф на ТМ 2.5 < 1.60 при ничейном счёте. Букмекер ждёт ничью (кэф ≤ 3.00) или value bet (3.30–4.50).',
      category: 'custom' as FilterCategory,
      minMinute: 0,
      maxMinute: 75,
      scoreCondition: 'DRAW' as ScoreCondition,
      maxOddsUnder25: 1.60,
      targetMarket: 'Ничья (X) / ТМ 2.5',
      color: 'indigo',
    },
  },
  {
    label: '📊 Ценный ТБ 1.5',
    badge: 'Value',
    data: {
      name: '📊 Ценный ТБ 1.5 (Value Bet 1.20–1.29+)',
      description: 'Обе команды забивают ≥1.0 гол/матч. H2H ≥ 80% на ТБ 1.5. В последних 5 матчах обе забивали в ≥4 из них.',
      category: 'goals' as FilterCategory,
      minMinute: 0,
      maxMinute: 45,
      scoreCondition: 'ANY' as ScoreCondition,
      requireH2hOver15High: true,
      requireNoZeroZeroLast5: true,
      targetMarket: 'ТБ 1.5 (экспресс / ординар)',
      color: 'emerald',
    },
  },
  {
    label: '⚡ xG Дефицит 75\'',
    badge: 'xG ≥ 1.6',
    data: {
      name: '⚡ xG Дефицит 75\': Поздний гол (xG - Счёт ≥ 1.6)',
      description: 'Если к 75-й минуте суммарный xG команд на 1.60+ больше текущего счёта (накопленный недобор голов) — неизбежен гол в концовке.',
      category: 'goals' as FilterCategory,
      minMinute: 70,
      maxMinute: 88,
      scoreCondition: 'ANY' as ScoreCondition,
      minXgOverScoreDiff: 1.6,
      targetMarket: 'ТБ (Следующий гол) / Гол после 75\'',
      color: 'emerald',
    },
  },
  {
    label: '📉 Прогруз Smart Money',
    badge: 'Дроп ≥ 12%',
    data: {
      name: '📉 Прогруз линии / Smart Money: Падение кэфа ≥ 12% (Деньги ≥ 65%)',
      description: 'Резкое падение коэффициента на исход от 12% при аномальном притоке денег (от 65% всего пула ставок на бирже Betfair / Pinnacle).',
      category: 'odds_drop' as FilterCategory,
      minMinute: 1,
      maxMinute: 85,
      scoreCondition: 'ANY' as ScoreCondition,
      minOddsDropPercent: 12,
      minMoneyVolumePercent: 65,
      oddsDropMarket: 'ANY' as const,
      targetMarket: 'Исход с прогрузом денег (П1 / X / П2 / ТБ)',
      color: 'amber',
    },
  },
];

const TARGET_MARKET_SUGGESTIONS = [
  'ТБ 0.5 во 2-м тайме',
  'ТБ 0.5 в матче',
  'ТБ 1.5 в матче',
  'ТБ 2.5 в матче',
  '1X (двойной шанс)',
  'Победа 1 (П1)',
  'Обе забьют (ОЗ - Да)',
  'ТБ угловых',
  'ИТБ1 (0.5) голов',
  'Следующий гол',
];

const COLORS = [
  { name: 'emerald', bg: 'bg-emerald-500', label: 'Изумрудный' },
  { name: 'blue', bg: 'bg-blue-500', label: 'Синий' },
  { name: 'amber', bg: 'bg-amber-500', label: 'Янтарный' },
  { name: 'rose', bg: 'bg-rose-500', label: 'Рубиновый' },
  { name: 'purple', bg: 'bg-purple-500', label: 'Фиолетовый' },
  { name: 'cyan', bg: 'bg-cyan-500', label: 'Бирюзовый' },
];

export const createCleanBlankModalFormData = (): Partial<FilterRule> => ({
  id: `custom-${Date.now()}`,
  name: '',
  description: '',
  category: 'custom',
  enabled: true,
  minMinute: 0,
  maxMinute: 90,
  scoreCondition: 'ANY',
  exactScore: undefined,
  exactTotalGoals: undefined,
  exactHomeGoals: undefined,
  exactAwayGoals: undefined,
  minDangerousAttacksDiff: undefined,
  minDangerousAttacksTotal: undefined,
  minAttacksDiff: undefined,
  minAttacksTotal: undefined,
  minTotalShots: undefined,
  minShotsDiff: undefined,
  minShotsOnTargetTotal: undefined,
  minShotsOnTargetDiff: undefined,
  minTotalCorners: undefined,
  minCornersDiff: undefined,
  minPossessionDiff: undefined,
  minXgTotal: undefined,
  minXgDiff: undefined,
  minXgOverScoreDiff: undefined,
  minPressureIndex: undefined,
  maxPressureIndex: undefined,
  maxDangerousAttacksTotal: undefined,
  maxShotsOnTargetTotal: undefined,
  maxScoreDiff: undefined,
  redCardCondition: 'ANY',
  maxOddsFavorite: undefined,
  minOddsFavorite: undefined,
  maxOddsOver25: undefined,
  minOddsOver25: undefined,
  minOddsDropPercent: undefined,
  minMoneyVolumePercent: undefined,
  excludeYouthAndWomen: false,
  targetMarket: '',
  telegramEnabled: true,
  color: 'emerald',
  isPreset: false,
  botId: undefined,
  customBotToken: undefined,
  customChatId: undefined,
});

export const FilterBuilderModal: React.FC<FilterBuilderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialFilter,
  liveMatches,
  userBots = [],
  onOpenAISynthesizer,
  isPaidUser = false,
  isDeveloper = false,
  onUpgradePlan,
}) => {
  const [formData, setFormData] = useState<Partial<FilterRule>>(() => {
    if (initialFilter) return { ...initialFilter };
    return createCleanBlankModalFormData();
  });

  const [showLiveMatchesPreview, setShowLiveMatchesPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialFilter) {
        setFormData({ ...initialFilter });
      } else {
        setFormData(createCleanBlankModalFormData());
      }
      setShowLiveMatchesPreview(false);
    }
  }, [isOpen, initialFilter]);

  if (!isOpen) return null;

  // 🔒 Защита от копирования параметров вшитых стратегий обычными пользователями
  if (initialFilter?.isPreset && !isDeveloper) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-amber-950/40">
            <Lock className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              Вшитый алгоритм защищён разработчиком
            </span>
            <h3 className="text-xl font-black text-white">
              {getStrategyCardDisplayName(initialFilter, isDeveloper)}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Параметры и формулы данной вшитой стратегии скрыты разработчиком для предотвращения копирования. Вы можете полноценно запускать её в мониторинге, получать push-сигналы и уведомления в Telegram по вашей подписке.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Статистика прохода:</span>
              <span className="font-mono font-bold text-emerald-400">
                {initialFilter.verifiedPassRate || '96–100% реальных матчей'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Целевой рынок:</span>
              <span className="font-bold text-amber-300">{initialFilter.targetMarket || 'Live исходы'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Доступ к мониторингу:</span>
              <span className="text-emerald-400 font-semibold">Активен по подписке</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setFormData(createCleanBlankModalFormData());
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <FileText className="h-4 w-4" />
              <span>Создать свой фильтр (Чистый бланк)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Live test against current matches
  const testRule = formData as FilterRule;
  const matchResults = liveMatches.map((m) => ({
    match: m,
    result: evaluateFilterRule(m, testRule),
  }));
  const matchingResults = matchResults.filter((r) => r.result.matches);
  const matchingCount = matchingResults.length;

  const handleCleanSlate = () => {
    setFormData(createCleanBlankModalFormData());
  };

  const applyPreset = (presetData: Partial<FilterRule>) => {
    if (!isPaidUser) {
      if (onUpgradePlan) onUpgradePlan();
      return;
    }
    setFormData((prev) => ({
      ...prev,
      ...presetData,
      id: prev.id || `custom-${Date.now()}`,
      isPreset: false,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    const finalRule: FilterRule = {
      id: formData.id || `custom-${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description?.trim() || 'Пользовательский фильтр',
      category: (formData.category as FilterCategory) || 'custom',
      enabled: formData.enabled ?? true,
      minMinute: Number(formData.minMinute) || 0,
      maxMinute: Number(formData.maxMinute) || 90,
      scoreCondition: (formData.scoreCondition as ScoreCondition) || 'ANY',
      minDangerousAttacksDiff: formData.minDangerousAttacksDiff !== undefined && formData.minDangerousAttacksDiff !== null && String(formData.minDangerousAttacksDiff) !== ''
        ? Number(formData.minDangerousAttacksDiff)
        : undefined,
      minDangerousAttacksTotal: formData.minDangerousAttacksTotal !== undefined && formData.minDangerousAttacksTotal !== null && String(formData.minDangerousAttacksTotal) !== ''
        ? Number(formData.minDangerousAttacksTotal)
        : undefined,
      minTotalShots: formData.minTotalShots !== undefined && formData.minTotalShots !== null && String(formData.minTotalShots) !== ''
        ? Number(formData.minTotalShots)
        : undefined,
      minShotsOnTargetTotal: formData.minShotsOnTargetTotal !== undefined && formData.minShotsOnTargetTotal !== null && String(formData.minShotsOnTargetTotal) !== ''
        ? Number(formData.minShotsOnTargetTotal)
        : undefined,
      minShotsOnTargetDiff: formData.minShotsOnTargetDiff !== undefined && formData.minShotsOnTargetDiff !== null && String(formData.minShotsOnTargetDiff) !== ''
        ? Number(formData.minShotsOnTargetDiff)
        : undefined,
      minTotalCorners: formData.minTotalCorners !== undefined && formData.minTotalCorners !== null && String(formData.minTotalCorners) !== ''
        ? Number(formData.minTotalCorners)
        : undefined,
      minCornersDiff: formData.minCornersDiff !== undefined && formData.minCornersDiff !== null && String(formData.minCornersDiff) !== ''
        ? Number(formData.minCornersDiff)
        : undefined,
      minPossessionDiff: formData.minPossessionDiff !== undefined && formData.minPossessionDiff !== null && String(formData.minPossessionDiff) !== ''
        ? Number(formData.minPossessionDiff)
        : undefined,
      minXgTotal: formData.minXgTotal !== undefined && formData.minXgTotal !== null && String(formData.minXgTotal) !== ''
        ? Number(formData.minXgTotal)
        : undefined,
      minXgOverScoreDiff: formData.minXgOverScoreDiff !== undefined && formData.minXgOverScoreDiff !== null && String(formData.minXgOverScoreDiff) !== ''
        ? Number(formData.minXgOverScoreDiff)
        : undefined,
      minOddsDropPercent: formData.minOddsDropPercent !== undefined && formData.minOddsDropPercent !== null && String(formData.minOddsDropPercent) !== ''
        ? Number(formData.minOddsDropPercent)
        : undefined,
      minMoneyVolumePercent: formData.minMoneyVolumePercent !== undefined && formData.minMoneyVolumePercent !== null && String(formData.minMoneyVolumePercent) !== ''
        ? Number(formData.minMoneyVolumePercent)
        : undefined,
      minMoneyLoadAmount: formData.minMoneyLoadAmount !== undefined && formData.minMoneyLoadAmount !== null && String(formData.minMoneyLoadAmount) !== ''
        ? Number(formData.minMoneyLoadAmount)
        : undefined,
      oddsDropMarket: formData.oddsDropMarket || undefined,
      minPressureIndex: formData.minPressureIndex !== undefined && formData.minPressureIndex !== null && String(formData.minPressureIndex) !== ''
        ? Number(formData.minPressureIndex)
        : undefined,
      redCardCondition: formData.redCardCondition || 'ANY',
      targetMarket: formData.targetMarket?.trim() || undefined,
      telegramEnabled: formData.telegramEnabled ?? true,
      color: formData.color || 'emerald',
      isPreset: formData.isPreset ?? false,
      botId: formData.botId === 'custom' ? undefined : (formData.botId || undefined),
      customBotToken: formData.customBotToken?.trim() || undefined,
      customChatId: formData.customChatId?.trim() || undefined,
      scannerMatrix: formData.scannerMatrix,
      minOver25Streak: formData.minOver25Streak,
      requireOver25StreakAllowed4Of5: formData.requireOver25StreakAllowed4Of5,
      requireNoGoalsInSecondHalf: formData.requireNoGoalsInSecondHalf,
      requireOddsDropWithoutScoreChange: formData.requireOddsDropWithoutScoreChange,
      requirePrematchSuspiciousDrop: formData.requirePrematchSuspiciousDrop,
      excludeYouthAndWomen: formData.excludeYouthAndWomen,
      ruleType: formData.ruleType,
      prematchTimingMinutes: formData.prematchTimingMinutes,
      maxOddsFavorite: formData.maxOddsFavorite,
      minOddsFavorite: formData.minOddsFavorite,
      maxOddsOver25: formData.maxOddsOver25,
      minOddsOver25: formData.minOddsOver25,
      maxOddsOver35: formData.maxOddsOver35,
      maxOddsUnder25: formData.maxOddsUnder25,
      minOddsDraw: formData.minOddsDraw,
      maxOddsDraw: formData.maxOddsDraw,
      minOddsUnderdog: formData.minOddsUnderdog,
      maxOddsUnderdog: formData.maxOddsUnderdog,
      maxOddsBtts: formData.maxOddsBtts,
      minOddsBtts: formData.minOddsBtts,
      maxTotalGoals: formData.maxTotalGoals,
      requireBttsNotHit: formData.requireBttsNotHit,
      scoreDiffExactly1: formData.scoreDiffExactly1,
      losingTeamMoreCorners: formData.losingTeamMoreCorners,
      favoriteLosing: formData.favoriteLosing,
      requireGuestTwoQuickGoals1H: formData.requireGuestTwoQuickGoals1H,
      requireTwoQuickGoals1H: formData.requireTwoQuickGoals1H,
      requireNoGoalsSinceQuickGoals: formData.requireNoGoalsSinceQuickGoals,
      requireLastMatchConceded2Plus: formData.requireLastMatchConceded2Plus,
      requireNoZeroZeroLast5: formData.requireNoZeroZeroLast5,
      minModelIpt: formData.minModelIpt,
      requireRedCardLastMatch: formData.requireRedCardLastMatch,
      requireLateGoalsLastMatches: formData.requireLateGoalsLastMatches,
      requireH2hOver15High: formData.requireH2hOver15High,
      isDeadlyCombination: formData.isDeadlyCombination,
      sport: formData.sport || 'football',
      exactScore: formData.exactScore?.trim() || undefined,
      exactHomeGoals: formData.exactHomeGoals !== undefined && formData.exactHomeGoals !== null && String(formData.exactHomeGoals) !== ''
        ? Number(formData.exactHomeGoals)
        : undefined,
      exactAwayGoals: formData.exactAwayGoals !== undefined && formData.exactAwayGoals !== null && String(formData.exactAwayGoals) !== ''
        ? Number(formData.exactAwayGoals)
        : undefined,
      exactTotalGoals: formData.exactTotalGoals !== undefined && formData.exactTotalGoals !== null && String(formData.exactTotalGoals) !== ''
        ? Number(formData.exactTotalGoals)
        : undefined,
      prematchAnalysisEnabled: formData.prematchAnalysisEnabled ?? (formData.ruleType === 'PREMATCH'),
      prematchAlertDailyTime: formData.prematchAlertDailyTime || '10:00',
      prematchMinOddsHome: formData.prematchMinOddsHome !== undefined && String(formData.prematchMinOddsHome) !== '' ? Number(formData.prematchMinOddsHome) : undefined,
      prematchMaxOddsHome: formData.prematchMaxOddsHome !== undefined && String(formData.prematchMaxOddsHome) !== '' ? Number(formData.prematchMaxOddsHome) : undefined,
      prematchMinOddsDraw: formData.prematchMinOddsDraw !== undefined && String(formData.prematchMinOddsDraw) !== '' ? Number(formData.prematchMinOddsDraw) : undefined,
      prematchMaxOddsDraw: formData.prematchMaxOddsDraw !== undefined && String(formData.prematchMaxOddsDraw) !== '' ? Number(formData.prematchMaxOddsDraw) : undefined,
      prematchMinOddsAway: formData.prematchMinOddsAway !== undefined && String(formData.prematchMinOddsAway) !== '' ? Number(formData.prematchMinOddsAway) : undefined,
      prematchMaxOddsAway: formData.prematchMaxOddsAway !== undefined && String(formData.prematchMaxOddsAway) !== '' ? Number(formData.prematchMaxOddsAway) : undefined,
      prematchMinOddsOver25: formData.prematchMinOddsOver25 !== undefined && String(formData.prematchMinOddsOver25) !== '' ? Number(formData.prematchMinOddsOver25) : undefined,
      prematchMaxOddsOver25: formData.prematchMaxOddsOver25 !== undefined && String(formData.prematchMaxOddsOver25) !== '' ? Number(formData.prematchMaxOddsOver25) : undefined,
      prematchH2hMatchesCount: formData.prematchH2hMatchesCount !== undefined ? Number(formData.prematchH2hMatchesCount) : 5,
      prematchH2hOver25MinHits: formData.prematchH2hOver25MinHits !== undefined && String(formData.prematchH2hOver25MinHits) !== '' ? Number(formData.prematchH2hOver25MinHits) : undefined,
      prematchTeamRecentMatchesCount: formData.prematchTeamRecentMatchesCount !== undefined ? Number(formData.prematchTeamRecentMatchesCount) : 5,
      prematchTeam1Over25MinHits: formData.prematchTeam1Over25MinHits !== undefined && String(formData.prematchTeam1Over25MinHits) !== '' ? Number(formData.prematchTeam1Over25MinHits) : undefined,
      prematchTeam2Over25MinHits: formData.prematchTeam2Over25MinHits !== undefined && String(formData.prematchTeam2Over25MinHits) !== '' ? Number(formData.prematchTeam2Over25MinHits) : undefined,
      prematchNotifyOnceDaily: formData.prematchNotifyOnceDaily ?? true,
    };

    onSave(finalRule);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-2 sm:my-8 flex flex-col max-h-[96vh] sm:max-h-[92vh]">
        {/* Header */}
        <div className="p-3 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner shrink-0">
              <Sliders className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white truncate">
                  {initialFilter ? 'Настройка фильтра' : 'Создание фильтра'}
                </h2>
                {initialFilter?.isPreset ? (
                  <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium shrink-0">
                    Пресет
                  </span>
                ) : (
                  <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium shrink-0">
                    Авторский
                  </span>
                )}
              </div>
              <p className="hidden sm:block text-xs text-slate-400 mt-0.5 truncate">
                Задайте комбинацию порогов статистики, времени, счёта и индексов для авто-поиска ставок
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCleanSlate}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold transition active:scale-95 flex items-center gap-1 shadow-sm"
              title="Очистить все параметры и открыть чистый бланк"
            >
              <FileText className="h-3.5 w-3.5 text-teal-400" />
              <span className="hidden sm:inline">Чистый бланк</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 sm:p-2 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="bg-slate-950/90 px-4 sm:px-6 py-2.5 border-b border-slate-800/80 shrink-0 flex items-center justify-between gap-2 overflow-x-auto text-xs">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-slate-400 font-semibold text-[11px] shrink-0 flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              {isPaidUser ? 'Быстрые шаблоны:' : 'Режим настройки:'}
            </span>
            <div className="flex items-center gap-1.5 flex-nowrap flex-1">
              {/* Primary Clean Slate Button */}
              <button
                type="button"
                onClick={handleCleanSlate}
                className="whitespace-nowrap px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition active:scale-95 flex items-center gap-1.5 shadow-sm"
                title="Сбросить все параметры в чистый бланк"
              >
                <FileText className="h-3.5 w-3.5 text-emerald-400" />
                <span>📄 Чистый бланк (с нуля)</span>
              </button>

              {!isPaidUser && (
                <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-slate-800 text-[11px] text-slate-500">
                  <Lock className="h-3 w-3 text-amber-400" />
                  <span>Шаблоны PRO/VIP:</span>
                </div>
              )}

              {STRATEGY_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(preset.data)}
                  className={`whitespace-nowrap px-2.5 py-1 rounded-lg border text-[11px] font-medium transition active:scale-95 flex items-center gap-1 ${
                    !isPaidUser
                      ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-amber-500/40 hover:text-amber-300'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                  }`}
                  title={
                    !isPaidUser
                      ? `🔒 Готовый шаблон «${preset.data.name}» (Доступен на тарифах PRO и VIP)`
                      : `Заполнить форму параметрами «${preset.data.name}»`
                  }
                >
                  {!isPaidUser && <Lock className="h-2.5 w-2.5 text-amber-400" />}
                  <span>{preset.label}</span>
                  {!isPaidUser && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                      PRO
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isPaidUser && onUpgradePlan && (
              <button
                type="button"
                onClick={onUpgradePlan}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition flex items-center gap-1"
              >
                <Crown className="h-3 w-3 text-amber-400" />
                <span>Тариф PRO</span>
              </button>
            )}

            {onOpenAISynthesizer && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAISynthesizer();
                }}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/50 hover:to-teal-600/50 text-emerald-300 hover:text-white border border-emerald-500/40 text-[11px] font-bold transition active:scale-95 flex items-center gap-1.5 shadow-sm"
                title="Сгенерировать стратегию по скриншоту, файлу или тексту через ИИ"
              >
                <Sparkles className="h-3 w-3 text-amber-300 animate-pulse" />
                <span>ИИ-Синтез</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Content: If preset is selected by free account, show locked state */}
        {initialFilter?.isPreset && !isPaidUser ? (
          <div className="p-6 sm:p-10 space-y-6 text-center max-w-lg mx-auto my-auto flex-1 overflow-y-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-amber-950/40">
              <Lock className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1.5">
                <Crown className="h-3.5 w-3.5" />
                Готовая стратегия тарифов PRO & VIP
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white">{initialFilter.name}</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {initialFilter.description || 'Готовый авторский алгоритм сервиса с рассчитанной математической моделью.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left text-xs space-y-2.5 text-slate-300">
              <div className="text-amber-300 font-bold flex items-center gap-1.5 pb-1 border-b border-slate-800">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Разделение функционала:
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span><strong>Тариф FREE:</strong> создание и тонкая настройка любых собственных алгоритмов через <strong>чистый бланк</strong> (без ограничений по метрикам).</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span><strong>Тарифы PRO & VIP:</strong> готовые пресеты стратегий сервиса с рассчитанной моделью + расширенный мониторинг.</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCleanSlate}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition active:scale-95"
              >
                <FileText className="h-4 w-4" />
                <span>Создать фильтр с чистого бланка</span>
              </button>
              {onUpgradePlan && (
                <button
                  type="button"
                  onClick={onUpgradePlan}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 transition active:scale-95"
                >
                  <Crown className="h-4 w-4" />
                  <span>Разблокировать в тарифе PRO</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Form Body */
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
            {!isPaidUser && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-emerald-300">
                      Режим: Чистый бланк (Тариф FREE)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Вы настраиваете собственный авторский алгоритм с нуля. Готовые авторские шаблоны стратегий доступны на тарифах PRO и VIP.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCleanSlate}
                  className="self-start sm:self-center px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold shrink-0 transition"
                  title="Сбросить все поля к чистому бланку"
                >
                  Сбросить к чистому бланку
                </button>
              </div>
            )}
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                <span>Название фильтра / алгоритма <span className="text-rose-400">*</span></span>
                <span className="text-[10px] text-slate-500 font-normal">Будет отображаться в карточке и алертах</span>
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Пример: 🔥 Навал в концовке при ничьей (75-90')"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition shadow-inner"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-200">
                Описание стратегии (логика и смысл входа)
              </label>
              <input
                type="text"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Например: Когда фаворит запирает аутсайдера и наносит > 10 ударов..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition shadow-inner"
              />
            </div>

            {/* Sport Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200">Вид спорта</label>
              <select
                value={formData.sport || 'football'}
                onChange={(e) => setFormData({ ...formData, sport: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold focus:border-emerald-500 focus:outline-none"
              >
                <option value="football">⚽ Футбол</option>
                <option value="hockey">🏒 Хоккей</option>
                <option value="basketball">🏀 Баскетбол</option>
                <option value="tennis">🎾 Большой теннис</option>
                <option value="volleyball">🏐 Волейбол</option>
                <option value="table_tennis">🏓 Настольный теннис</option>
              </select>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200">Категория алгоритма</label>
              <select
                value={formData.category || 'custom'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as FilterCategory })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="goals">⚽ Голы / Шайбы / Очки (ТБ / ТМ)</option>
                <option value="corners">🚩 Угловые / Броски / Стандарты</option>
                <option value="comeback">🎯 Камбэк фаворита (1X / Фора)</option>
                <option value="halftime">⏱️ 1-й тайм / 1-й период / 1-я четверть</option>
                <option value="pressure">🔥 Индекс давления / Штурм</option>
                <option value="cards">🟥 Карточки / Штрафы / Удаления</option>
                <option value="odds_drop">📉 Прогруз Smart Money / Steam</option>
                <option value="custom">🛠️ Авторский / Пользовательский</option>
              </select>
            </div>

            {/* Target Market with suggestion pills */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                <span>Рекомендуемый исход / рынок ставки</span>
                <span className="text-[10px] text-slate-500">Авто-подстановка</span>
              </label>
              <input
                type="text"
                value={formData.targetMarket || ''}
                onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })}
                placeholder="Например: ТБ 0.5 во 2-м тайме"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {TARGET_MARKET_SUGGESTIONS.slice(0, 5).map((m, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData({ ...formData, targetMarket: m })}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition font-mono"
                  >
                    + {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Strategy Type: Live vs Prematch */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sliders className="h-4 w-4" />
              Режим работы стратегии (Лайв или Прематч)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, ruleType: 'LIVE' })}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  formData.ruleType !== 'PREMATCH'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-base">🔴</span>
                <div>
                  <div className="text-xs font-bold text-white">Лайв (во время матча)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Анализ по ходу игры в указанном диапазоне минут</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, ruleType: 'PREMATCH', minMinute: 0, maxMinute: 15, prematchTimingMinutes: 60 })}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  formData.ruleType === 'PREMATCH'
                    ? 'bg-sky-500/10 border-sky-500/50 text-sky-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-base">📋</span>
                <div>
                  <div className="text-xs font-bold text-white">Прематч (за 1 час до матча)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Анализ проводится ровно за 60 минут до свистка</div>
                </div>
              </button>
            </div>

            {formData.ruleType === 'PREMATCH' && (
              <div className="space-y-4 pt-2">
                <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/30 text-xs text-sky-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="h-4 w-4 text-sky-400 shrink-0" />
                    <span>Предматчевый фильтр: анализирует линии, котировки и H2H очные встречи до начала игры.</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-sky-500/20 px-2 py-0.5 rounded border border-sky-500/30">
                    ПРЕМАТЧ
                  </span>
                </div>

                {/* Daily Alert Time Picker */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      <span>Время отправки ежедневного сигнала:</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={formData.prematchAlertDailyTime || '10:00'}
                        onChange={(e) => setFormData({ ...formData, prematchAlertDailyTime: e.target.value })}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-mono font-bold focus:border-amber-400 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">1 раз в сутки</span>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.prematchNotifyOnceDaily ?? true}
                      onChange={(e) => setFormData({ ...formData, prematchNotifyOnceDaily: e.target.checked })}
                      className="w-3.5 h-3.5 rounded border-slate-700 text-sky-500"
                    />
                    <span>Отправлять сигнал строго один раз в день в указанное время</span>
                  </label>
                </div>

                {/* Prematch Odds Corridors: P1, X, P2, TB 2.5 */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    Коридоры предматчевых коэффициентов:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-emerald-400 font-bold block">П1 (мин - макс)</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.05"
                          placeholder="мин"
                          value={formData.prematchMinOddsHome ?? ''}
                          onChange={(e) => setFormData({ ...formData, prematchMinOddsHome: e.target.value ? Number(e.target.value) : undefined })}
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-white font-mono text-center"
                        />
                        <span className="text-slate-600 text-xs">-</span>
                        <input
                          type="number"
                          step="0.05"
                          placeholder="макс"
                          value={formData.prematchMaxOddsHome ?? ''}
                          onChange={(e) => setFormData({ ...formData, prematchMaxOddsHome: e.target.value ? Number(e.target.value) : undefined })}
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-white font-mono text-center"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-cyan-400 font-bold block">X Ничья (мин - макс)</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.05"
                          placeholder="мин"
                          value={formData.prematchMinOddsDraw ?? ''}
                          onChange={(e) => setFormData({ ...formData, prematchMinOddsDraw: e.target.value ? Number(e.target.value) : undefined })}
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-white font-mono text-center"
                        />
                        <span className="text-slate-600 text-xs">-</span>
                        <input
                          type="number"
                          step="0.05"
                          placeholder="макс"
                          value={formData.prematchMaxOddsDraw ?? ''}
                          onChange={(e) => setFormData({ ...formData, prematchMaxOddsDraw: e.target.value ? Number(e.target.value) : undefined })}
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-white font-mono text-center"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-blue-400 font-bold block">П2 (мин - макс)</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.05"
                          placeholder="мин"
                          value={formData.prematchMinOddsAway ?? ''}
                          onChange={(e) => setFormData({ ...formData, prematchMinOddsAway: e.target.value ? Number(e.target.value) : undefined })}
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-white font-mono text-center"
                        />
                        <span className="text-slate-600 text-xs">-</span>
                        <input
                          type="number"
                          step="0.05"
                          placeholder="макс"
                          value={formData.prematchMaxOddsAway ?? ''}
                          onChange={(e) => setFormData({ ...formData, prematchMaxOddsAway: e.target.value ? Number(e.target.value) : undefined })}
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-white font-mono text-center"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-amber-400 font-bold block">ТБ 2.5 (мин - макс)</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.05"
                          placeholder="мин"
                          value={formData.prematchMinOddsOver25 ?? ''}
                          onChange={(e) => setFormData({ ...formData, prematchMinOddsOver25: e.target.value ? Number(e.target.value) : undefined })}
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-white font-mono text-center"
                        />
                        <span className="text-slate-600 text-xs">-</span>
                        <input
                          type="number"
                          step="0.05"
                          placeholder="макс"
                          value={formData.prematchMaxOddsOver25 ?? ''}
                          onChange={(e) => setFormData({ ...formData, prematchMaxOddsOver25: e.target.value ? Number(e.target.value) : undefined })}
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-white font-mono text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* H2H and Last Matches Over 2.5 conditions */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider block">
                    Условия по очным встречам и последним 5-10 матчам:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-300 block">
                        Очные встречи (H2H):
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">ТБ 2.5 в ≥</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          placeholder="3"
                          value={formData.prematchH2hOver25MinHits ?? ''}
                          onChange={(e) => setFormData({ ...formData, prematchH2hOver25MinHits: e.target.value ? Number(e.target.value) : undefined })}
                          className="w-14 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-amber-300 font-mono text-center font-bold"
                        />
                        <span className="text-xs text-slate-400">из {formData.prematchH2hMatchesCount || 5} матчей</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-300 block">
                        Форма Команды 1 (Хозяева):
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">ТБ 2.5 в ≥</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          placeholder="3"
                          value={formData.prematchTeam1Over25MinHits ?? ''}
                          onChange={(e) => setFormData({ ...formData, prematchTeam1Over25MinHits: e.target.value ? Number(e.target.value) : undefined })}
                          className="w-14 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-emerald-300 font-mono text-center font-bold"
                        />
                        <span className="text-xs text-slate-400">из 5 последних</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-300 block">
                        Форма Команды 2 (Гости):
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">ТБ 2.5 в ≥</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          placeholder="3"
                          value={formData.prematchTeam2Over25MinHits ?? ''}
                          onChange={(e) => setFormData({ ...formData, prematchTeam2Over25MinHits: e.target.value ? Number(e.target.value) : undefined })}
                          className="w-14 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-blue-300 font-mono text-center font-bold"
                        />
                        <span className="text-xs text-slate-400">из 5 последних</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 1: Timing & Score Condition */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              1. Временной диапазон и условие счёта матча
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>Минута С:</span>
                  <span className="font-mono text-emerald-400 font-bold">{formData.minMinute ?? 60}'</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={formData.minMinute ?? 60}
                  onChange={(e) => setFormData({ ...formData, minMinute: Math.min(90, Math.max(0, Number(e.target.value))) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>Минута ПО:</span>
                  <span className="font-mono text-emerald-400 font-bold">{formData.maxMinute ?? 88}'</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="95"
                  value={formData.maxMinute ?? 88}
                  onChange={(e) => setFormData({ ...formData, maxMinute: Math.min(95, Math.max(0, Number(e.target.value))) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 block">Текущий счёт матча:</span>
                <select
                  value={formData.scoreCondition || 'ANY'}
                  onChange={(e) => setFormData({ ...formData, scoreCondition: e.target.value as ScoreCondition })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="ANY">Любой счёт (без ограничений)</option>
                  <option value="0-0">Строго 0:0 (без забитых голов)</option>
                  <option value="DRAW">Любая ничья (0:0, 1:1, 2:2...)</option>
                  <option value="ONE_GOAL_DIFF">Разница ровно в 1 мяч (1:0, 0:1, 2:1...)</option>
                  <option value="AWAY_LEAD">Гости ведут в счёте</option>
                  <option value="HOME_LEAD">Хозяева ведут в счёте</option>
                  <option value="TOTAL_UNDER_25">ТБ 2.5 не пробит (≤ 2 голов: 0:0, 1:0, 0:1, 1:1, 2:0, 0:2)</option>
                  <option value="TOTAL_UNDER_15">ТБ 1.5 не пробит (≤ 1 гол: 0:0, 1:0, 0:1)</option>
                  <option value="BTTS_NO">Обе забьют ещё не наступило (хотя бы у одной команды 0)</option>
                  <option value="TOTAL_UNDER_2">Низкий тотал (≤ 1 гол)</option>
                  <option value="TOTAL_OVER_2">Результативный матч (≥ 2 гола)</option>
                </select>
              </div>
            </div>

            {/* Выставление конкретного количества голов (Новая секция по запросу) */}
            <div className="pt-3 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" />
                  Выставление конкретного количества голов (строгое совпадение):
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Опционально (необязательно)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Exact Total Goals */}
                <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="flex justify-between items-center text-[10px] text-slate-300 font-semibold">
                    <span>Суммарно голов ровно:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {formData.exactTotalGoals !== undefined ? `${formData.exactTotalGoals} голов` : 'Любое'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[undefined, 0, 1, 2, 3, 4].map((cnt) => (
                      <button
                        key={String(cnt)}
                        type="button"
                        onClick={() => setFormData({ ...formData, exactTotalGoals: cnt })}
                        className={`flex-1 py-1 rounded text-[10px] font-bold transition ${
                          formData.exactTotalGoals === cnt
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        {cnt === undefined ? '—' : cnt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exact Home Goals */}
                <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="flex justify-between items-center text-[10px] text-slate-300 font-semibold">
                    <span>Голов Хозяев (К1):</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {formData.exactHomeGoals !== undefined ? `${formData.exactHomeGoals} гол.` : 'Любое'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[undefined, 0, 1, 2, 3].map((cnt) => (
                      <button
                        key={String(cnt)}
                        type="button"
                        onClick={() => setFormData({ ...formData, exactHomeGoals: cnt })}
                        className={`flex-1 py-1 rounded text-[10px] font-bold transition ${
                          formData.exactHomeGoals === cnt
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        {cnt === undefined ? '—' : cnt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exact Away Goals */}
                <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="flex justify-between items-center text-[10px] text-slate-300 font-semibold">
                    <span>Голов Гостей (К2):</span>
                    <span className="font-mono text-sky-400 font-bold">
                      {formData.exactAwayGoals !== undefined ? `${formData.exactAwayGoals} гол.` : 'Любое'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[undefined, 0, 1, 2, 3].map((cnt) => (
                      <button
                        key={String(cnt)}
                        type="button"
                        onClick={() => setFormData({ ...formData, exactAwayGoals: cnt })}
                        className={`flex-1 py-1 rounded text-[10px] font-bold transition ${
                          formData.exactAwayGoals === cnt
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        {cnt === undefined ? '—' : cnt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Exact Score Quick Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-slate-400 font-semibold">Быстрый точный счёт:</span>
                {['0:0', '1:0', '0:1', '1:1', '2:0', '0:2', '2:1', '1:2', '2:2', '3:1'].map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => {
                      const isCurrent = formData.exactScore === sc;
                      setFormData({
                        ...formData,
                        exactScore: isCurrent ? undefined : sc,
                        scoreCondition: 'ANY',
                      });
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                      formData.exactScore === sc
                        ? 'bg-purple-600 text-white border border-purple-400 shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {sc}
                  </button>
                ))}
                {formData.exactScore && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, exactScore: undefined })}
                    className="text-[10px] text-rose-400 hover:underline ml-1"
                  >
                    Очистить точный счёт
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Attack & Pressure Thresholds */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Flame className="h-4 w-4" />
              2. Давление, опасные атаки и темп игры
            </h3>
            <p className="text-[11px] text-slate-400">
              Поля, оставленные пустыми, не будут накладывать ограничений на фильтр.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Разница опасных атак (DA Diff):</span>
                  <span className="text-[10px] text-slate-500">|A - B| ≥</span>
                </label>
                <input
                  type="number"
                  placeholder="Напр. 20"
                  value={formData.minDangerousAttacksDiff ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minDangerousAttacksDiff: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Разница всех атак (Attacks Diff):</span>
                  <span className="text-[10px] text-sky-400 font-bold">Стр. 4: |A-B| ≥</span>
                </label>
                <input
                  type="number"
                  placeholder="Напр. 10"
                  value={formData.minAttacksDiff ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minAttacksDiff: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Сумма опасных атак:</span>
                  <span className="text-[10px] text-slate-500">A + B ≥</span>
                </label>
                <input
                  type="number"
                  placeholder="Напр. 50"
                  value={formData.minDangerousAttacksTotal ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minDangerousAttacksTotal: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Индекс давления (0-100%):</span>
                  <span className="text-[10px] text-amber-400 font-bold">Штурм ≥</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Напр. 60"
                  value={formData.minPressureIndex ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minPressureIndex: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Shots, xG & Corners */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Target className="h-4 w-4" />
              3. Удары, точность, стандарты (xG, угловые, КК)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">Всего ударов в матче (≥):</label>
                <input
                  type="number"
                  placeholder="Напр. 8"
                  value={formData.minTotalShots ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minTotalShots: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Разница всех ударов (≥):</span>
                  <span className="text-[10px] text-amber-400 font-bold">Стр. 4: |A-B| ≥</span>
                </label>
                <input
                  type="number"
                  placeholder="Напр. 6"
                  value={formData.minShotsDiff ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minShotsDiff: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">Ударов в створ (SOT ≥):</label>
                <input
                  type="number"
                  placeholder="Напр. 4"
                  value={formData.minShotsOnTargetTotal ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minShotsOnTargetTotal: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">Разница ударов в створ (≥):</label>
                <input
                  type="number"
                  placeholder="Напр. 3"
                  value={formData.minShotsOnTargetDiff ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minShotsOnTargetDiff: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">Всего угловых в матче (≥):</label>
                <input
                  type="number"
                  placeholder="Напр. 6"
                  value={formData.minTotalCorners ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minTotalCorners: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">Разница угловых (≥):</label>
                <input
                  type="number"
                  placeholder="Напр. 3"
                  value={formData.minCornersDiff ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minCornersDiff: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">Суммарный xG матча (≥):</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Напр. 1.2"
                  value={formData.minXgTotal ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minXgTotal: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Дефицит xG над счётом (≥):</span>
                  <span className="text-[10px] text-amber-400 font-mono">xG - Голы</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Напр. 1.6"
                  value={formData.minXgOverScoreDiff ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minXgOverScoreDiff: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">Перевес во владения (≥ %):</label>
                <input
                  type="number"
                  placeholder="Напр. 15"
                  value={formData.minPossessionDiff ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minPossessionDiff: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">Красные карточки (КК):</label>
                <select
                  value={formData.redCardCondition || 'ANY'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      redCardCondition: e.target.value as any,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                >
                  <option value="ANY">Любое состояние (не важно)</option>
                  <option value="HAS_RED_CARD">Обязательно есть удаление (10 vs 11)</option>
                  <option value="NO_RED_CARDS">Строго без красных карточек (11 vs 11)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Odds & Mathematical Models (Стратегии 2, 7, 8, 11, 14, 16) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Scale className="h-4 w-4" />
              4. Коэффициенты букмекеров и математические модели
            </h3>
            <p className="text-[11px] text-slate-400">
              Прематч коридоры котировок и расчётный взвешенный индекс результативности.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Кэф на фаворита (≤):</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Стр. 2, 8</span>
                </label>
                <input
                  type="number"
                  step="0.05"
                  placeholder="Напр. 1.50 или 1.70"
                  value={formData.maxOddsFavorite ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxOddsFavorite: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Кэф ТБ 2.5 ОТ (≥):</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Стр. 16</span>
                </label>
                <input
                  type="number"
                  step="0.05"
                  placeholder="Напр. 1.50"
                  value={formData.minOddsOver25 ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minOddsOver25: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Кэф ТБ 2.5 ДО (≤):</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Стр. 2, 16</span>
                </label>
                <input
                  type="number"
                  step="0.05"
                  placeholder="Напр. 1.67"
                  value={formData.maxOddsOver25 ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxOddsOver25: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Кэф «Обе забьют» ОТ (≥):</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Стр. 14</span>
                </label>
                <input
                  type="number"
                  step="0.05"
                  placeholder="Напр. 1.50"
                  value={formData.minOddsBtts ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minOddsBtts: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Кэф «Обе забьют» ДО (≤):</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Стр. 14, 16</span>
                </label>
                <input
                  type="number"
                  step="0.05"
                  placeholder="Напр. 1.67"
                  value={formData.maxOddsBtts ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxOddsBtts: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Тотал модели IPT &gt; (≥):</span>
                  <span className="text-[10px] text-amber-400 font-mono">Стр. 7 IPT</span>
                </label>
                <input
                  type="number"
                  step="0.05"
                  placeholder="Напр. 2.70"
                  value={formData.minModelIpt ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minModelIpt: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Кэф ТБ 3.5 по линии (≤):</span>
                  <span className="text-[10px] text-emerald-400 font-mono">ТБ 3.5 ≤ 2.0</span>
                </label>
                <input
                  type="number"
                  step="0.05"
                  placeholder="Напр. 2.00"
                  value={formData.maxOddsOver35 ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxOddsOver35: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Кэф ТМ 2.5 (≤):</span>
                  <span className="text-[10px] text-indigo-400 font-mono">Ничья ТМ</span>
                </label>
                <input
                  type="number"
                  step="0.05"
                  placeholder="Напр. 1.60"
                  value={formData.maxOddsUnder25 ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxOddsUnder25: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Кэф на ничью ОТ (≥):</span>
                  <span className="text-[10px] text-purple-400 font-mono">Доминант &gt; 5.0</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Напр. 5.00"
                  value={formData.minOddsDraw ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minOddsDraw: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Кэф на аутсайдера (≥):</span>
                  <span className="text-[10px] text-cyan-400 font-mono">Андердог ≥ 5.5</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Напр. 5.50"
                  value={formData.minOddsUnderdog ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minOddsUnderdog: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Smart Money & Dropping Odds Steam Moves */}
          <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <TrendingDown className="h-4 w-4 text-amber-400" />
                Отслеживание прогрузов денег и падения коэффициентов (Smart Money & Steam Moves)
              </h3>
              <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                Betfair / Pinnacle
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Фиксация аномального падения коэффициента в линии под давлением крупных сумм ставок (прогруз пула денег, инсайды и аналитический штурм).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Исход для прогруза:</span>
                  <span className="text-[10px] text-amber-400 font-mono">Рынок</span>
                </label>
                <select
                  value={formData.oddsDropMarket || 'ANY'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      oddsDropMarket: e.target.value as any,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                >
                  <option value="ANY">Любой исход (П1 / X / П2 / ТБ / ТМ)</option>
                  <option value="HOME">Победа 1 (Хозяева)</option>
                  <option value="DRAW">Ничья (X)</option>
                  <option value="AWAY">Победа 2 (Гости)</option>
                  <option value="OVER">Тотал Больше (ТБ)</option>
                  <option value="UNDER">Тотал Меньше (ТМ)</option>
                  <option value="BTTS">Обе забьют (ОЗ)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Мин. падение кэфа (≥ %):</span>
                  <span className="text-[10px] text-amber-400 font-mono">Дроп линии</span>
                </label>
                <input
                  type="number"
                  step="1"
                  placeholder="Напр. 15 (%)"
                  value={formData.minOddsDropPercent ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minOddsDropPercent: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Мин. доля денег (≥ %):</span>
                  <span className="text-[10px] text-amber-400 font-mono">Объем пула</span>
                </label>
                <input
                  type="number"
                  step="1"
                  placeholder="Напр. 70 (%)"
                  value={formData.minMoneyVolumePercent ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minMoneyVolumePercent: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Мин. сумма прогруза (€):</span>
                  <span className="text-[10px] text-amber-400 font-mono">Сумма ставок</span>
                </label>
                <input
                  type="number"
                  step="5000"
                  placeholder="Напр. 50000 (€)"
                  value={formData.minMoneyLoadAmount ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minMoneyLoadAmount: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Odds Drop without Score Change Toggle */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/90 border border-amber-500/30 cursor-pointer hover:border-amber-500/60 transition">
                <input
                  type="checkbox"
                  checked={formData.requireOddsDropWithoutScoreChange ?? false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requireOddsDropWithoutScoreChange: e.target.checked,
                    })
                  }
                  className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-950 border-slate-700"
                />
                <div className="text-[11px]">
                  <span className="font-semibold text-amber-300 block">
                    📉 Отслеживать падение кэфа БЕЗ изменения счёта (напр. 2:0 в 1Т держится, а ТБ 2.5 нагружают)
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    Фиксирует аномальный наплыв денег на ТБ или исход при стабильном счёте (≥8 минут без голов)
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 5: Reliability, Streaks & Special Strategy Signals */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              5. Фильтры надежности, специальные сценарии и паттерны
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={formData.excludeYouthAndWomen ?? false}
                  onChange={(e) => setFormData({ ...formData, excludeYouthAndWomen: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-950 border-slate-700"
                />
                <div className="text-[11px]">
                  <span className="font-semibold text-slate-200 block">Исключать молодёжные (U19–U23) и женские лиги</span>
                  <span className="text-slate-400 text-[10px]">Рекомендация для стратегий «А ГДЕ ЖЕ ГОЛ» и «После перерыва»</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={formData.requireNoZeroZeroLast5 ?? false}
                  onChange={(e) => setFormData({ ...formData, requireNoZeroZeroLast5: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-950 border-slate-700"
                />
                <div className="text-[11px]">
                  <span className="font-semibold text-slate-200 block">Не было 0:0 в последних 5 матчах команд</span>
                  <span className="text-slate-400 text-[10px]">Отсеивает «сухие» и непредсказуемые ничейные команды</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={formData.requireLastMatchConceded2Plus ?? false}
                  onChange={(e) => setFormData({ ...formData, requireLastMatchConceded2Plus: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-950 border-slate-700"
                />
                <div className="text-[11px]">
                  <span className="font-semibold text-slate-200 block">Обе команды проиграли и пропустили ≥2 в прошлой игре</span>
                  <span className="text-slate-400 text-[10px]">Стратегия 1 на быстрый гол в 1-м тайме</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={formData.isDeadlyCombination ?? false}
                  onChange={(e) => setFormData({ ...formData, isDeadlyCombination: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-slate-950 border-slate-700"
                />
                <div className="text-[11px]">
                  <span className="font-semibold text-rose-300 block">💣 «Смертельная комбинация» коэффициентов</span>
                  <span className="text-slate-400 text-[10px]">П1≤1.20 + ТБ2.5≤1.45 + Ф1(-1.5)≤1.50 или ОЗ≤1.45 + ТБ2.5≤1.55 (на ТБ 3.5/4.5)</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={formData.losingTeamMoreCorners ?? false}
                  onChange={(e) => setFormData({ ...formData, losingTeamMoreCorners: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 bg-slate-950 border-slate-700"
                />
                <div className="text-[11px]">
                  <span className="font-semibold text-amber-300 block">🚩 Проигрывающая команда подала больше угловых</span>
                  <span className="text-slate-400 text-[10px]">Стратегия на угловой после 80-й минуты при осаде ворот</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={formData.favoriteLosing ?? false}
                  onChange={(e) => setFormData({ ...formData, favoriteLosing: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-950 border-slate-700"
                />
                <div className="text-[11px]">
                  <span className="font-semibold text-blue-300 block">🚩 Прематч фаворит уступает в счёте</span>
                  <span className="text-slate-400 text-[10px]">Стратегия на угловые фаворита во 2-м тайме (отыгрыш фаворита)</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={formData.requireGuestTwoQuickGoals1H ?? false}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData({
                      ...formData,
                      requireGuestTwoQuickGoals1H: checked,
                      requireNoGoalsSinceQuickGoals: checked,
                      ...(checked ? { minMinute: 75, maxMinute: 77 } : {}),
                    });
                  }}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-950 border-slate-700"
                />
                <div className="text-[11px]">
                  <span className="font-semibold text-emerald-300 block">⚡ 2 быстрых гола в 1Т + отсутствие голов до 75'</span>
                  <span className="text-slate-400 text-[10px]">В 1Т забито 2 быстрых гола (≤15 мин), сигнал выдаётся строго на 75-й минуте при отсутствии голов после них</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={formData.requireRedCardLastMatch ?? false}
                  onChange={(e) => setFormData({ ...formData, requireRedCardLastMatch: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-slate-950 border-slate-700"
                />
                <div className="text-[11px]">
                  <span className="font-semibold text-rose-300 block">🟥 Красная карточка в крайнем матче (кэф ≤ 3.20)</span>
                  <span className="text-slate-400 text-[10px]">Стратегия «Месть за удаление»: команда мотивирована и забивает гол</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={formData.requireH2hOver15High ?? false}
                  onChange={(e) => setFormData({ ...formData, requireH2hOver15High: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-950 border-slate-700"
                />
                <div className="text-[11px]">
                  <span className="font-semibold text-cyan-300 block">📊 Личные встречи (H2H) ≥ 80% на ТБ 1.5</span>
                  <span className="text-slate-400 text-[10px]">Стратегия Value Bet на ТБ 1.5 с кэфом 1.20+</span>
                </div>
              </label>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-semibold text-slate-200">Серия матчей на ТБ 2.5 (≥ игр):</span>
                  <span className="text-[10px] text-purple-400 font-mono">Стр. 12 (5/5)</span>
                </div>
                <input
                  type="number"
                  placeholder="Напр. 5"
                  value={formData.minOver25Streak ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minOver25Streak: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={formData.requireOver25StreakAllowed4Of5 ?? false}
                  onChange={(e) => setFormData({ ...formData, requireOver25StreakAllowed4Of5: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-950 border-slate-700"
                />
                <div className="text-[11px]">
                  <span className="font-semibold text-purple-300 block">Допускается 4 из 5 матчей для одной команды</span>
                  <span className="text-slate-400 text-[10px]">Серия 5/5 вообще (не между собой); для одной из команд разрешено 4/5</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={formData.requireNoGoalsInSecondHalf ?? false}
                  onChange={(e) => setFormData({ ...formData, requireNoGoalsInSecondHalf: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-950 border-slate-700"
                />
                <div className="text-[11px]">
                  <span className="font-semibold text-purple-300 block">Во 2-м тайме ещё не забит гол (сигнал от 65')</span>
                  <span className="text-slate-400 text-[10px]">Сигнал только если счёт 2-го тайма 0:0 к 65+ минуте</span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 4: Color & Notifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <label className="text-xs font-semibold text-slate-300">Цветовой маркер фильтра</label>
              <div className="flex items-center gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: c.name })}
                    className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center transition ${
                      formData.color === c.name ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                    }`}
                    title={c.label}
                  >
                    {formData.color === c.name && <CheckCircle2 className="h-4 w-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5 text-sky-400" />
                    Уведомлять в Telegram
                  </div>
                  <div className="text-[11px] text-slate-400">Отправлять сигнал при срабатывании правила</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.telegramEnabled ?? true}
                  onChange={(e) => setFormData({ ...formData, telegramEnabled: e.target.checked })}
                  className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
              </div>

              {formData.telegramEnabled && (
                <div className="pt-3 border-t border-slate-800/80 space-y-3 animate-in fade-in duration-150">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Bot className="h-3.5 w-3.5 text-cyan-400" />
                      Привязка к Telegram-боту:
                    </label>
                    <select
                      value={formData.customBotToken ? 'custom' : (formData.botId || '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'custom') {
                          setFormData({
                            ...formData,
                            botId: 'custom',
                          });
                        } else {
                          setFormData({
                            ...formData,
                            botId: val || undefined,
                            customBotToken: undefined,
                            customChatId: undefined,
                          });
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                    >
                      <option value="">🤖 Основной бот по умолчанию</option>
                      {userBots.map((bot) => (
                        <option key={bot.id} value={bot.id}>
                          🤖 {bot.name} ({bot.channelId || 'чат не указан'})
                        </option>
                      ))}
                      <option value="custom">⚙️ Индивидуальный токен и чат для этого фильтра</option>
                    </select>
                  </div>

                  {(formData.botId === 'custom' || (formData.customBotToken && formData.customBotToken.length > 0)) && (
                    <div className="p-3 bg-slate-900/90 rounded-xl border border-cyan-500/30 space-y-2.5">
                      <div className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
                        <Bot className="h-3 w-3" />
                        Индивидуальные параметры бота для этого алгоритма:
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Bot Token:</label>
                          <input
                            type="text"
                            placeholder="7123456789:AA..."
                            value={formData.customBotToken || ''}
                            onChange={(e) => setFormData({ ...formData, customBotToken: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Chat ID / @канал:</label>
                          <input
                            type="text"
                            placeholder="-1001928374651"
                            value={formData.customChatId || ''}
                            onChange={(e) => setFormData({ ...formData, customChatId: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Live Simulator Preview Banner */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Тестирование на Live матчах:</strong> совпадает с{' '}
                  <span className="font-bold text-white underline">{matchingCount}</span> из {liveMatches.length} текущих событий
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowLiveMatchesPreview(!showLiveMatchesPreview)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition"
              >
                {showLiveMatchesPreview ? (
                  <>
                    <ChevronUp className="h-3 w-3" /> Скрыть список
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" /> Показать матчи ({matchingCount})
                  </>
                )}
              </button>
            </div>

            {showLiveMatchesPreview && (
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                {matchingResults.length > 0 ? (
                  matchingResults.map(({ match }, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-emerald-400 font-bold">{match.minute}'</span>
                        <span className="text-white font-semibold">{match.homeTeam} {match.score[0]}:{match.score[1]} {match.awayTeam}</span>
                        <span className="text-slate-400 text-[11px]">({match.league})</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        Оп. атаки {match.stats.dangerousAttacks[0]}-{match.stats.dangerousAttacks[1]}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-500 py-1 italic">
                    Ни один из текущих live матчей не удовлетворяет всем условиям. Попробуйте смягчить пороги или диапазон минут.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  id: formData.id,
                  name: 'Очищенный фильтр',
                  description: 'Пользовательский фильтр',
                  category: 'custom',
                  enabled: true,
                  minMinute: 0,
                  maxMinute: 90,
                  scoreCondition: 'ANY',
                  telegramEnabled: true,
                  color: 'emerald',
                  isPreset: false,
                });
              }}
              className="px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1.5 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Сбросить критерии
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-emerald-950/40 active:scale-95"
              >
                <Save className="h-4 w-4" />
                {initialFilter ? 'Сохранить изменения' : 'Создать и активировать'}
              </button>
            </div>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};
