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
} from 'lucide-react';
import { FilterRule, Match, ScoreCondition, FilterCategory } from '../types';
import { evaluateFilterRule } from '../algorithms';

interface FilterBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (filter: FilterRule) => void;
  initialFilter?: FilterRule | null;
  liveMatches: Match[];
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
      minCornersDiff: 5,
      minShotsDiff: 2,
      redCardCondition: 'NO_RED_CARDS' as const,
      targetMarket: 'ТБ 0.5 / ТБ 1.0 в матче',
      color: 'blue',
    },
  },
  {
    label: '📐 Модель IPT > 2.70',
    badge: 'Стр. 7',
    data: {
      name: '📐 Стратегия 7: Математическая модель IPT > 2.70 (ТБ 2.5)',
      description: 'Взвешенный сезонный и формовой тотал IPT = (BP * 0.6 + FP * 0.4) > 2.70. Прогнозирование ТБ 2.5.',
      category: 'goals' as FilterCategory,
      minMinute: 0,
      maxMinute: 45,
      scoreCondition: 'ANY' as ScoreCondition,
      minModelIpt: 2.70,
      maxOddsOver25: 1.90,
      targetMarket: 'Тотал больше 2.5',
      color: 'amber',
    },
  },
  {
    label: '⚡ Инд. тотал 1Т',
    badge: 'Стр. 8',
    data: {
      name: '⚡ Стратегия 8: Инд. тотал фаворита в 1-м тайме',
      description: 'Фаворит ≤1.70, ТБ 2.5 ≤1.70. В первые 10-25 минут фаворит нанес ≥2 ударов и активно атакует.',
      category: 'halftime' as FilterCategory,
      minMinute: 10,
      maxMinute: 28,
      scoreCondition: '0-0' as ScoreCondition,
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
      description: 'Кэф на ТБ 2.5 строго 1.50–1.67, кэф на Обе забьют ≤1.67. Математическая закономерность верхового матча.',
      category: 'goals' as FilterCategory,
      minMinute: 0,
      maxMinute: 50,
      scoreCondition: 'ANY' as ScoreCondition,
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
      description: 'Котировки на Обе забьют в диапазоне 1.50–1.67 в результативных лигах.',
      category: 'goals' as FilterCategory,
      minMinute: 0,
      maxMinute: 60,
      scoreCondition: 'ANY' as ScoreCondition,
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
      name: '⏱️ Стратегия 12: Гол после перерыва (Серия ТБ 2.5 5/5)',
      description: 'Команды с серией ТБ 2.5 (5/5). В 1-м тайме забито ≤ 2 голов. 46-68 минута матча.',
      category: 'goals' as FilterCategory,
      minMinute: 46,
      maxMinute: 68,
      scoreCondition: 'TOTAL_UNDER_2' as ScoreCondition,
      minOver25Streak: 5,
      excludeYouthAndWomen: true,
      targetMarket: 'Гол во 2-м тайме / ТБ 1.5',
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
    label: '⚡ 2 быстрых гола гостей',
    badge: 'Гости',
    data: {
      name: '⚡ Два быстрых гола гостей в 1-м тайме (ТБ матча)',
      description: 'Гости забили 2 гола подряд с разницей ≤ 15 мин в 1-м тайме. В матче будет ещё минимум 1 гол.',
      category: 'comeback' as FilterCategory,
      minMinute: 35,
      maxMinute: 65,
      scoreCondition: 'ANY' as ScoreCondition,
      requireGuestTwoQuickGoals1H: true,
      targetMarket: 'ТБ матча (+1 гол во 2-м тайме)',
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

export const FilterBuilderModal: React.FC<FilterBuilderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialFilter,
  liveMatches,
}) => {
  const [formData, setFormData] = useState<Partial<FilterRule>>(() => {
    if (initialFilter) return { ...initialFilter };
    return {
      id: `custom-${Date.now()}`,
      name: 'Новый авторский фильтр',
      description: 'Пользовательский алгоритм мониторинга аномалий',
      category: 'custom',
      enabled: true,
      minMinute: 60,
      maxMinute: 88,
      scoreCondition: 'ANY',
      minDangerousAttacksDiff: 20,
      minTotalShots: 8,
      minShotsOnTargetTotal: 4,
      minTotalCorners: 6,
      minXgTotal: 1.2,
      minPressureIndex: 55,
      redCardCondition: 'ANY',
      targetMarket: 'ТБ 0.5 во 2-м тайме',
      telegramEnabled: true,
      color: 'emerald',
      isPreset: false,
    };
  });

  const [showLiveMatchesPreview, setShowLiveMatchesPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialFilter) {
        setFormData({ ...initialFilter });
      } else {
        setFormData({
          id: `custom-${Date.now()}`,
          name: 'Новый авторский фильтр',
          description: 'Пользовательский алгоритм мониторинга аномалий',
          category: 'custom',
          enabled: true,
          minMinute: 60,
          maxMinute: 88,
          scoreCondition: 'ANY',
          minDangerousAttacksDiff: 20,
          minTotalShots: 8,
          minShotsOnTargetTotal: 4,
          minTotalCorners: 6,
          minXgTotal: 1.2,
          minPressureIndex: 55,
          redCardCondition: 'ANY',
          targetMarket: 'ТБ 0.5 во 2-м тайме',
          telegramEnabled: true,
          color: 'emerald',
          isPreset: false,
        });
      }
      setShowLiveMatchesPreview(false);
    }
  }, [isOpen, initialFilter]);

  if (!isOpen) return null;

  // Live test against current matches
  const testRule = formData as FilterRule;
  const matchResults = liveMatches.map((m) => ({
    match: m,
    result: evaluateFilterRule(m, testRule),
  }));
  const matchingResults = matchResults.filter((r) => r.result.matches);
  const matchingCount = matchingResults.length;

  const applyPreset = (presetData: Partial<FilterRule>) => {
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
      minPressureIndex: formData.minPressureIndex !== undefined && formData.minPressureIndex !== null && String(formData.minPressureIndex) !== ''
        ? Number(formData.minPressureIndex)
        : undefined,
      redCardCondition: formData.redCardCondition || 'ANY',
      targetMarket: formData.targetMarket?.trim() || undefined,
      telegramEnabled: formData.telegramEnabled ?? true,
      color: formData.color || 'emerald',
      isPreset: formData.isPreset ?? false,
    };

    onSave(finalRule);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-4 sm:my-8 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {initialFilter ? 'Настройка алгоритма фильтрации' : 'Создание нового пользовательского фильтра'}
                </h2>
                {initialFilter?.isPreset ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                    Заводской пресет
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                    Авторский
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Задайте комбинацию порогов статистики, времени, счёта и индексов для авто-поиска ставок
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="bg-slate-950/90 px-4 sm:px-6 py-2.5 border-b border-slate-800/80 shrink-0 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 font-semibold text-[11px] shrink-0 flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            Быстрые шаблоны:
          </span>
          <div className="flex items-center gap-1.5 flex-nowrap">
            {STRATEGY_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(preset.data)}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-[11px] font-medium transition active:scale-95 flex items-center gap-1"
                title={`Заполнить форму параметрами «${preset.data.name}»`}
              >
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
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

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200">Категория алгоритма</label>
              <select
                value={formData.category || 'custom'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as FilterCategory })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="goals">⚽ Голы (ТБ / ТМ / Обе забьют)</option>
                <option value="corners">🚩 Угловые (Осада / Тотал угловых)</option>
                <option value="comeback">🎯 Камбэк фаворита (1X / Фора 0)</option>
                <option value="halftime">⏱️ 1-й тайм (HT Over / Гол до перерыва)</option>
                <option value="pressure">🔥 Индекс давления / Штурм</option>
                <option value="cards">🟥 Карточки / Удаления (КК)</option>
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
                  <option value="TOTAL_UNDER_2">Низкий тотал (≤ 1 гол)</option>
                  <option value="TOTAL_OVER_2">Результативный матч (≥ 2 гола)</option>
                </select>
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
                  onChange={(e) => setFormData({ ...formData, requireGuestTwoQuickGoals1H: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-950 border-slate-700"
                />
                <div className="text-[11px]">
                  <span className="font-semibold text-emerald-300 block">⚡ Два быстрых гола гостей в 1-м тайме (≤15 мин)</span>
                  <span className="text-slate-400 text-[10px]">Паттерн верхового матча: продолжение голов во 2-м тайме</span>
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

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Send className="h-3.5 w-3.5 text-sky-400" />
                  Уведомлять в Telegram
                </div>
                <div className="text-[11px] text-slate-400">Отправлять сигнал при срабатывании</div>
              </div>
              <input
                type="checkbox"
                checked={formData.telegramEnabled ?? true}
                onChange={(e) => setFormData({ ...formData, telegramEnabled: e.target.checked })}
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
              />
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
      </div>
    </div>
  );
};
