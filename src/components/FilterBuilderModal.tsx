import React, { useState } from 'react';
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
  AlertCircle
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

  React.useEffect(() => {
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
    }
  }, [isOpen, initialFilter]);

  if (!isOpen) return null;

  // Live test against current matches
  const testRule = formData as FilterRule;
  const matchResults = liveMatches.map((m) => ({
    match: m,
    result: evaluateFilterRule(m, testRule),
  }));
  const matchingCount = matchResults.filter((r) => r.result.matches).length;

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
      minDangerousAttacksDiff: formData.minDangerousAttacksDiff ? Number(formData.minDangerousAttacksDiff) : undefined,
      minDangerousAttacksTotal: formData.minDangerousAttacksTotal ? Number(formData.minDangerousAttacksTotal) : undefined,
      minTotalShots: formData.minTotalShots ? Number(formData.minTotalShots) : undefined,
      minShotsOnTargetTotal: formData.minShotsOnTargetTotal ? Number(formData.minShotsOnTargetTotal) : undefined,
      minShotsOnTargetDiff: formData.minShotsOnTargetDiff ? Number(formData.minShotsOnTargetDiff) : undefined,
      minTotalCorners: formData.minTotalCorners ? Number(formData.minTotalCorners) : undefined,
      minCornersDiff: formData.minCornersDiff ? Number(formData.minCornersDiff) : undefined,
      minPossessionDiff: formData.minPossessionDiff ? Number(formData.minPossessionDiff) : undefined,
      minXgTotal: formData.minXgTotal ? Number(formData.minXgTotal) : undefined,
      minPressureIndex: formData.minPressureIndex ? Number(formData.minPressureIndex) : undefined,
      redCardCondition: formData.redCardCondition || 'ANY',
      targetMarket: formData.targetMarket?.trim() || undefined,
      telegramEnabled: formData.telegramEnabled ?? true,
      color: formData.color || 'emerald',
      isPreset: formData.isPreset ?? false,
    };

    onSave(finalRule);
    onClose();
  };

  const colors = [
    { name: 'emerald', bg: 'bg-emerald-500', label: 'Зеленый' },
    { name: 'blue', bg: 'bg-blue-500', label: 'Синий' },
    { name: 'amber', bg: 'bg-amber-500', label: 'Оранжевый' },
    { name: 'rose', bg: 'bg-rose-500', label: 'Розовый' },
    { name: 'purple', bg: 'bg-purple-500', label: 'Фиолетовый' },
    { name: 'cyan', bg: 'bg-cyan-500', label: 'Бирюзовый' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {initialFilter ? 'Редактирование алгоритма' : 'Конструктор нового фильтра'}
              </h2>
              <p className="text-xs text-slate-400">
                Задайте комбинацию порогов статистики, времени и счёта для поиска ставок
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Название алгоритма</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Пример: 🔥 Давление навал (75-90')"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Описание логики</label>
              <input
                type="text"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Когда фаворит давит с разницей опасных атак > 25..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 focus:border-sky-500 focus:outline-none"
              />
            </div>

            {/* Category & Target Market */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Категория стратегии</label>
              <select
                value={formData.category || 'goals'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as FilterCategory })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
              >
                <option value="goals">⚽ Голы (ТБ / ТМ / Обе забьют)</option>
                <option value="corners">🚩 Угловые (Осада / Тотал угловых)</option>
                <option value="comeback">🎯 Камбэк фаворита</option>
                <option value="halftime">⏱️ 1-й тайм (HT Over)</option>
                <option value="pressure">⚡ Индекс давления</option>
                <option value="cards">🟥 Карточки / Удаления</option>
                <option value="custom">🛠️ Пользовательский</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Рекомендуемый исход / рынок</label>
              <input
                type="text"
                value={formData.targetMarket || ''}
                onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })}
                placeholder="Например: ТБ 0.5 во 2-м тайме или 1X"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Timing & Score Condition */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Временной интервал и текущий счет
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Минута матча С:</label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={formData.minMinute ?? 60}
                  onChange={(e) => setFormData({ ...formData, minMinute: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Минута матча ПО:</label>
                <input
                  type="number"
                  min="0"
                  max="95"
                  value={formData.maxMinute ?? 88}
                  onChange={(e) => setFormData({ ...formData, maxMinute: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Условие счёта:</label>
                <select
                  value={formData.scoreCondition || 'ANY'}
                  onChange={(e) => setFormData({ ...formData, scoreCondition: e.target.value as ScoreCondition })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
                >
                  <option value="ANY">Любой счёт</option>
                  <option value="0-0">Строго 0:0 (без голов)</option>
                  <option value="DRAW">Любая ничья (0:0, 1:1, 2:2...)</option>
                  <option value="ONE_GOAL_DIFF">Разница ровно в 1 мяч</option>
                  <option value="AWAY_LEAD">Гости ведут в счёте</option>
                  <option value="HOME_LEAD">Хозяева ведут в счёте</option>
                  <option value="TOTAL_UNDER_2">Тотал голов ≤ 1</option>
                  <option value="TOTAL_OVER_2">Тотал голов ≥ 2</option>
                </select>
              </div>
            </div>
          </div>

          {/* Statistical Thresholds */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" />
              Статистические критерии (пустые поля игнорируются)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Разница опасных атак (≥):</label>
                <input
                  type="number"
                  placeholder="Напр. 25"
                  value={formData.minDangerousAttacksDiff ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minDangerousAttacksDiff: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Сумма оп. атак (≥):</label>
                <input
                  type="number"
                  placeholder="Напр. 50"
                  value={formData.minDangerousAttacksTotal ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minDangerousAttacksTotal: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Всего ударов (≥):</label>
                <input
                  type="number"
                  placeholder="Напр. 10"
                  value={formData.minTotalShots ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minTotalShots: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Ударов в створ всего (≥):</label>
                <input
                  type="number"
                  placeholder="Напр. 5"
                  value={formData.minShotsOnTargetTotal ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minShotsOnTargetTotal: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Всего угловых (≥):</label>
                <input
                  type="number"
                  placeholder="Напр. 7"
                  value={formData.minTotalCorners ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minTotalCorners: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Разница угловых (≥):</label>
                <input
                  type="number"
                  placeholder="Напр. 4"
                  value={formData.minCornersDiff ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minCornersDiff: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Суммарный xG (≥):</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Напр. 1.5"
                  value={formData.minXgTotal ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minXgTotal: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Индекс давления (0-100 ≥):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Напр. 60"
                  value={formData.minPressureIndex ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minPressureIndex: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Фактор удалений (КК):</label>
                <select
                  value={formData.redCardCondition || 'ANY'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      redCardCondition: e.target.value as any,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
                >
                  <option value="ANY">Не важно</option>
                  <option value="HAS_RED_CARD">Есть красная карточка</option>
                  <option value="NO_RED_CARDS">Без красных карточек</option>
                </select>
              </div>
            </div>
          </div>

          {/* Color & Telegram Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Цветовой маркер</label>
              <div className="flex items-center gap-2">
                {colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: c.name })}
                    className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center transition ${
                      formData.color === c.name ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    {formData.color === c.name && <CheckCircle2 className="h-4 w-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Send className="h-3.5 w-3.5 text-sky-400" />
                  Отправлять в Telegram
                </div>
                <div className="text-[11px] text-slate-400">Пушить сигнал в канал/чат</div>
              </div>
              <input
                type="checkbox"
                checked={formData.telegramEnabled ?? true}
                onChange={(e) => setFormData({ ...formData, telegramEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 bg-slate-900 border-slate-700"
              />
            </div>
          </div>

          {/* Live Simulator Preview Banner */}
          <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-sky-300">
              <Sparkles className="h-4 w-4 text-sky-400 shrink-0" />
              <span>
                <strong>Тестирование на текущих матчах:</strong> совпадает с{' '}
                <span className="font-bold text-white underline">{matchingCount}</span> из {liveMatches.length} live
                матчей прямо сейчас
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                matchingCount > 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400'
              }`}
            >
              {matchingCount > 0 ? '✓ Готов к триггеру' : 'Ожидание матчей'}
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-md shadow-sky-900/30"
            >
              <Save className="h-4 w-4" />
              {initialFilter ? 'Сохранить изменения' : 'Создать алгоритм'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
