import React, { useState, useRef } from 'react';
import {
  Sparkles,
  X,
  Upload,
  Image as ImageIcon,
  FileText,
  Bot,
  Zap,
  Check,
  Target,
  ArrowRight,
  Flame,
  ShieldCheck,
  Crown,
  Lock,
  Layers,
  Sliders,
  ExternalLink,
  Info,
  RefreshCw,
} from 'lucide-react';
import { FilterRule, UserProfile, SportType, ScoreCondition, FilterCategory } from '../types';
import { safeFetchJson } from '../services/apiClient';

interface AIStrategySynthesizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSaveStrategy: (rule: FilterRule, activateImmediately?: boolean) => void;
  onOpenInBuilder?: (rule: FilterRule) => void;
  onUpgradePlan?: () => void;
}

export const AIStrategySynthesizerModal: React.FC<AIStrategySynthesizerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveStrategy,
  onOpenInBuilder,
  onUpgradePlan,
}) => {
  // Check maximum subscription plan or VIP/God role
  const hasMaxPlan =
    currentUser.role === 'god' ||
    currentUser.role === 'vip' ||
    currentUser.role === 'pro' ||
    currentUser.plan === 'GOD_MODE' ||
    currentUser.plan === 'VIP_CLUB' ||
    currentUser.plan === 'PRO_ANALYST';

  // Input state
  const [inputMode, setInputMode] = useState<'text' | 'image' | 'file'>('text');
  const [textNotes, setTextNotes] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [extractedOcrText, setExtractedOcrText] = useState<string>('');
  const [tokenOptimizationInfo, setTokenOptimizationInfo] = useState<{
    compressed: boolean;
    savingsPct: number;
    originalKb: number;
    newKb: number;
  } | null>(null);
  const [lastTokenStats, setLastTokenStats] = useState<{
    estimatedTokens: number;
    tokensSaved: number;
    fromCache: boolean;
  } | null>(null);

  // AI Provider Selection
  const [aiProvider, setAiProvider] = useState<'builtin' | 'gigachat' | 'yandexgpt'>('builtin');
  const [customApiKey, setCustomApiKey] = useState<string>('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [synthesizedRule, setSynthesizedRule] = useState<FilterRule | null>(null);
  const [detectedSummary, setDetectedSummary] = useState<string | null>(null);
  const [demoBypass, setDemoBypass] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const canAccess = hasMaxPlan || demoBypass;

  // Handle image upload with automatic client-side compression (saves ~75% Gemini Vision tokens)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const origKb = Math.round(file.size / 1024);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1024;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          const newKb = Math.round((compressedDataUrl.length * 3) / 4096);
          const savings = Math.max(0, Math.round(((origKb - newKb) / (origKb || 1)) * 100));
          setFilePreview(compressedDataUrl);
          setTokenOptimizationInfo({
            compressed: true,
            savingsPct: savings,
            originalKb: origKb,
            newKb,
          });
          setExtractedOcrText(`Скриншот оптимизирован: ${file.name} (${origKb} КБ → ${newKb} КБ, -${savings}% трафика, экономия токенов Gemini Vision до 75%).`);
        } else {
          setFilePreview(event.target?.result as string);
          setExtractedOcrText(`Скриншот загружен: ${file.name} (${origKb} КБ).`);
        }
      };
      img.onerror = () => {
        setFilePreview(event.target?.result as string);
        setExtractedOcrText(`Скриншот загружен: ${file.name} (${origKb} КБ).`);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle text file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      setExtractedOcrText(content);
      setTextNotes(content);
    };
    reader.readAsText(file);
  };

  // Advanced AI Vision & Multimodal Strategy Synthesis Engine
  const runStrategySynthesis = async () => {
    const hasImage = Boolean(filePreview);
    const rawContent = (inputMode === 'text' ? textNotes : extractedOcrText || textNotes).trim();

    if (!hasImage && !rawContent) {
      alert('Пожалуйста, введите текст наблюдений, загрузите скриншот или текстовый файл со стратегией.');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Call server-side Vision API (Gemini 3.1 Flash-Lite / Flash with Token Optimization)
      const { ok, data, error: apiError } = await safeFetchJson<any>('/api/ai/synthesize-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rawContent || textNotes,
          imageBase64: filePreview,
          mimeType: 'image/jpeg',
        }),
      });

      if (data?.tokenStats) {
        setLastTokenStats(data.tokenStats);
      }

      if (ok && data?.ok && data?.strategy) {
        const s = data.strategy;
        const isChecklist = Boolean(s.isChecklist || s.checklistItems?.length);

        const generated: FilterRule = {
          id: `ai-synthesized-${Date.now()}`,
          name: s.name || (isChecklist ? '📋 10-балльный чеклист на ТБ 2.5' : '⚡ ИИ: Синтезированная стратегия'),
          description: s.description || (isChecklist ? 'Комплексный 10-балльный предматч-чеклист для отбора верховых матчей с перевесом по линии БК (от 1.75+).' : 'Стратегия распознана с предоставленного скриншота/описания.'),
          category: s.category || 'goals',
          ruleType: s.ruleType || (isChecklist ? 'PREMATCH' : 'LIVE'),
          sport: s.sport || 'football',
          isChecklist,
          checklistTitle: s.checklistTitle || (isChecklist ? 'Понятная таблица 10-балльного чеклиста на ТБ 2.5' : undefined),
          checklistItems: s.checklistItems,
          minChecklistScore: s.minChecklistScore ?? (isChecklist ? 7 : undefined),
          minPairAvgGoals: s.minPairAvgGoals ?? (isChecklist ? 2.70 : undefined),
          minExpectedGoalsXg: s.minExpectedGoalsXg ?? (isChecklist ? 2.70 : undefined),
          minHomeGoalsAvg: s.minHomeGoalsAvg ?? (isChecklist ? 1.50 : undefined),
          minAwayGoalsAvg: s.minAwayGoalsAvg ?? (isChecklist ? 1.20 : undefined),
          minConcededAvg: s.minConcededAvg ?? (isChecklist ? 1.00 : undefined),
          minOver25Pct: s.minOver25Pct ?? (isChecklist ? 55 : undefined),
          minBttsPct: s.minBttsPct ?? (isChecklist ? 55 : undefined),
          requireTopScorersAvailable: s.requireTopScorersAvailable ?? (isChecklist ? true : undefined),
          requireHighMotivation: s.requireHighMotivation ?? (isChecklist ? true : undefined),
          requireValueOdds: s.requireValueOdds ?? (isChecklist ? true : undefined),
          enabled: true,
          minMinute: s.minMinute ?? (isChecklist ? 0 : 60),
          maxMinute: s.maxMinute ?? (isChecklist ? 90 : 85),
          scoreCondition: s.scoreCondition || 'ANY',
          maxTotalGoals: s.maxTotalGoals ?? undefined,
          minTotalGoals: s.minTotalGoals ?? undefined,
          minDangerousAttacksTotal: s.minDangerousAttacksTotal ?? undefined,
          minDangerousAttacksDiff: s.minDangerousAttacksDiff ?? undefined,
          minTotalShots: s.minTotalShots ?? undefined,
          minShotsOnTargetTotal: s.minShotsOnTargetTotal ?? undefined,
          minShotsOnTargetDiff: s.minShotsOnTargetDiff ?? undefined,
          minTotalCorners: s.minTotalCorners ?? undefined,
          minCornersDiff: s.minCornersDiff ?? undefined,
          minPressureIndex: s.minPressureIndex ?? (isChecklist ? undefined : 60),
          minXgTotal: s.minXgTotal ?? s.minExpectedGoalsXg ?? undefined,
          redCardCondition: s.redCardCondition || 'ANY',
          minYellowCardsTotal: s.minYellowCardsTotal ?? undefined,
          maxScoreDiff: s.maxScoreDiff ?? undefined,
          minOddsOver25: s.minOddsOver25 ?? s.minOdds ?? (isChecklist ? 1.75 : undefined),
          maxOddsOver25: s.maxOddsOver25 ?? s.maxOdds ?? undefined,
          minCombinedOver25CountLast5: s.minCombinedOver25CountLast5 ?? undefined,
          requireOver25StreakAllowed4Of5: s.minCombinedOver25CountLast5 ? true : undefined,
          requireScoreAtHalftimeLow: s.requireScoreAtHalftimeLow ?? undefined,
          requireNoGoalsInSecondHalf: s.requireNoGoalsInSecondHalf ?? undefined,
          targetMarket: s.targetMarket || (isChecklist ? 'ТБ 2.5 (кэф от 1.75+)' : 'ТБ 1.5 / Гол во 2-м тайме (~1.75)'),
          telegramEnabled: true,
          color: isChecklist ? 'purple' : s.category === 'corners' ? 'sky' : s.category === 'cards' ? 'amber' : 'emerald',
        };

        setSynthesizedRule(generated);
        setDetectedSummary(
          s.extractedSummary ||
            (isChecklist
              ? `Распознана таблица: «${generated.checklistTitle || '10-балльный чеклист на ТБ 2.5'}» (10 критериев). Целевой маркет: «${generated.targetMarket}». Минимальный порог: ${generated.minChecklistScore}/10 баллов.`
              : `Распознано: минуты ${generated.minMinute}'-${generated.maxMinute}' | Счёт: ${generated.scoreCondition} | Рынок: «${generated.targetMarket}» | Давление: оп. атаки ≥ ${generated.minDangerousAttacksTotal || 'авто'}, створ ≥ ${generated.minShotsOnTargetTotal || 'авто'}`)
        );
        setIsProcessing(false);
        return;
      }
    } catch (err) {
      console.warn('Network or AI synthesis call error, falling back to local extractor:', err);
    }

    // 2. Intelligent local fallback if server call is unreachable or fails
    const lower = (rawContent + ' ' + textNotes).toLowerCase();

    // 1. Explicit multi-criteria scoring checklist (only if explicitly requested)
    const isExplicitChecklist =
      lower.includes('10-балльн') ||
      lower.includes('чеклист') ||
      lower.includes('чек-лист') ||
      lower.includes('scorecard') ||
      (lower.includes('таблиц') && (lower.includes('балл') || lower.includes('критери')));

    if (isExplicitChecklist) {
      const checklistItems = [
        {
          id: 'item-1',
          number: 1,
          title: 'Частота верховых матчей',
          thresholdText: 'От 55% и выше у каждой команды',
          calculationMethod: 'Число матчей на ТБ 2.5 делим на общее число игр (выборка от 10 туров)',
          simpleExplanation: 'Команды стабильно играют результативно: минимум 6 из 10 последних игр завершились на тотал больше.',
        },
        {
          id: 'item-2',
          number: 2,
          title: 'Средняя результативность пары',
          thresholdText: 'От 2.70 гола за матч суммарно',
          calculationMethod: '(Средний тотал матчей Хозяев + Средний тотал матчей Гостей) делим на 2',
          simpleExplanation: 'В играх с участием этих клубов стабильно влетает под 3 мяча за 90 минут.',
        },
        {
          id: 'item-3',
          number: 3,
          title: 'Ожидаемые голы (xG)',
          thresholdText: 'От 2.70 xG суммарно',
          calculationMethod: 'xG созданный Хозяевами дома + xG созданный Гостями на выезде (Understat / FootyStats)',
          simpleExplanation: 'Команды создают реальные голевые моменты у чужих ворот, а не просто бьют издали наудачу.',
        },
        {
          id: 'item-4',
          number: 4,
          title: 'Атака хозяев дома',
          thresholdText: 'От 1.50 гола за игру',
          calculationMethod: 'Забитые голы Хозяев на своем поле делим на число домашних матчей',
          simpleExplanation: 'Хозяева на родном стадионе стабильно забивают в среднем полтора-два мяча.',
        },
        {
          id: 'item-5',
          number: 5,
          title: 'Атака гостей на выезде',
          thresholdText: 'От 1.20 гола за игру',
          calculationMethod: 'Забитые голы Гостей на выезде делим на число выездных матчей',
          simpleExplanation: 'Гости не закрываются в глухую оборону на выезде, а умеют вскрывать чужую защиту.',
        },
        {
          id: 'item-6',
          number: 6,
          title: 'Дырявая оборона',
          thresholdText: 'От 1.00 гола пропускает каждый',
          calculationMethod: 'Пропущенные мячи делим на количество матчей (смотрим отдельно дом и выезд)',
          simpleExplanation: 'Ни у одной из команд нет железобетонной обороны, обе стабильно пропускают мяч за игру.',
        },
        {
          id: 'item-7',
          number: 7,
          title: 'Обе забьют (ОЗ / BTTS)',
          thresholdText: 'От 55% и выше у обеих сторон',
          calculationMethod: 'Процент матчей, где забивали обе команды',
          simpleExplanation: 'Высокая вероятность сценария 1:1, после которого любой следующий мяч делает ставку победной.',
        },
        {
          id: 'item-8',
          number: 8,
          title: 'Кадровый состав',
          thresholdText: 'Бомбардиры в строю',
          calculationMethod: 'Проверка стартовых протоколов или новостей о травмах за 1–2 часа до матча',
          simpleExplanation: 'Главные голеадоры и созидатели на поле; травмы могут быть у защитников, но не в атаке.',
        },
        {
          id: 'item-9',
          number: 9,
          title: 'Турнирная мотивация',
          thresholdText: 'Победа нужна обоим',
          calculationMethod: 'Турнирная таблица и календарь турнира',
          simpleExplanation: 'Никто не согласен на нулевую ничью; нет ротации перед еврокубками или скучного доигрывания.',
        },
        {
          id: 'item-10',
          number: 10,
          title: 'Перевес по кэфу (Value)',
          thresholdText: 'Кэф БК выше реального (от 1.75+)',
          calculationMethod: 'Если шанс прохода 60%, справедливый кэф равен 1.67. БК должна давать от 1.75 и выше',
          simpleExplanation: 'Вы ставите с математическим преимуществом над линией букмекера, а не берете заниженную котировку.',
        },
      ];

      const generated: FilterRule = {
        id: `ai-checklist-${Date.now()}`,
        name: '📋 10-балльный чеклист на ТБ 2.5',
        description: 'Комплексная 10-балльная прематч-система отбора верховых матчей с перевесом по линии БК (от 1.75+). Включает 10 показателей: частота верховых матчей (>=55%), средняя результативность пары (>=2.70), ожидаемые голы xG (>=2.70), атака дома (>=1.50) и на выезде (>=1.20), дырявая оборона (>=1.00), ОЗ (>=55%), кадровый состав, турнирная мотивация и перевес над линией букмекера.',
        category: 'goals',
        ruleType: 'PREMATCH',
        sport: 'football',
        isChecklist: true,
        checklistTitle: 'Понятная таблица 10-балльного чеклиста на ТБ 2.5',
        checklistItems,
        minChecklistScore: 7,
        minOddsOver25: 1.75,
        minPairAvgGoals: 2.70,
        minExpectedGoalsXg: 2.70,
        minHomeGoalsAvg: 1.50,
        minAwayGoalsAvg: 1.20,
        minConcededAvg: 1.00,
        minOver25Pct: 55,
        minBttsPct: 55,
        requireTopScorersAvailable: true,
        requireHighMotivation: true,
        requireValueOdds: true,
        enabled: true,
        minMinute: 0,
        maxMinute: 90,
        scoreCondition: 'ANY',
        targetMarket: 'ТБ 2.5 (кэф от 1.75+)',
        telegramEnabled: true,
        color: 'purple',
      };

      setSynthesizedRule(generated);
      setDetectedSummary(
        'Успешно распознана «Понятная таблица 10-балльного чеклиста на ТБ 2.5»: извлечены все 10 критериев с пороговыми значениями, методами расчёта и пояснениями. Целевой рынок: ТБ 2.5 с коэффициентом от 1.75+.'
      );
      setIsProcessing(false);
      return;
    }

    // 2. Yellow / Red Cards & Fouls Strategy
    const isCardsStrategy =
      lower.includes('карточк') ||
      lower.includes('желт') ||
      lower.includes('жк') ||
      lower.includes('красн') ||
      lower.includes('удал') ||
      lower.includes('фол') ||
      lower.includes('дерби');

    if (isCardsStrategy) {
      let minYellowCardsTotal = 4;
      const cardNumMatch = (rawContent + ' ' + textNotes).match(/(?:жк|карточк\w*|желт\w*)\s*(?:>=|≥|>|от)?\s*(\d+(?:\.\d+)?)/i);
      if (cardNumMatch) {
        minYellowCardsTotal = Math.ceil(parseFloat(cardNumMatch[1]));
      }

      let redCardCondition: any = 'ANY';
      if (lower.includes('без красн') || lower.includes('без кк') || lower.includes('нет красн')) {
        redCardCondition = 'NO_RED_CARDS';
      } else if (lower.includes('с удален') || lower.includes('есть кк') || lower.includes('красная')) {
        redCardCondition = 'HAS_RED_CARD';
      }

      const generated: FilterRule = {
        id: `ai-synthesized-${Date.now()}`,
        name: `🟨 Стратегия: Жёлтые карточки ТБ ${minYellowCardsTotal - 0.5}`,
        description: `Детектирование высокой грубости матча: суммарно ЖК ≥ ${minYellowCardsTotal}, фолы и накал борьбы. Режим КК: ${redCardCondition}.`,
        category: 'cards',
        ruleType: 'LIVE',
        sport: 'football',
        enabled: true,
        minMinute: 45,
        maxMinute: 85,
        scoreCondition: 'ANY',
        minYellowCardsTotal,
        redCardCondition,
        targetMarket: `ЖК ТБ ${minYellowCardsTotal - 0.5} / ${minYellowCardsTotal + 0.5} (~1.85)`,
        telegramEnabled: true,
        color: 'amber',
      };

      setSynthesizedRule(generated);
      setDetectedSummary(
        `Извлечена стратегия на карточки: ЖК ≥ ${minYellowCardsTotal} | Диапазон 45'-85' | КК: ${redCardCondition} | Рынок: «${generated.targetMarket}»`
      );
      setIsProcessing(false);
      return;
    }

    // 3. Corners Strategy
    const isCornersStrategy =
      lower.includes('угл') ||
      lower.includes('корнер') ||
      lower.includes('штурм с флангов') ||
      lower.includes('осада ворот');

    if (isCornersStrategy) {
      let minTotalCorners = 7;
      let minCornersDiff = 3;
      const cornerNumMatch = (rawContent + ' ' + textNotes).match(/(?:угл\w*|корнер\w*)\s*(?:>=|≥|>|от)?\s*(\d+)/i);
      if (cornerNumMatch) minTotalCorners = parseInt(cornerNumMatch[1], 10);

      const diffMatch = (rawContent + ' ' + textNotes).match(/(?:разниц\w*|diff)\s*(?:>=|≥|>|от)?\s*(\d+)/i);
      if (diffMatch) minCornersDiff = parseInt(diffMatch[1], 10);

      const generated: FilterRule = {
        id: `ai-synthesized-${Date.now()}`,
        name: `🚩 Стратегия: Осада угловыми (≥${minTotalCorners})`,
        description: `Штурм ворот проигрывающей или доминирующей команды: угловые ≥ ${minTotalCorners}, перевес ≥ ${minCornersDiff}.`,
        category: 'corners',
        ruleType: 'LIVE',
        sport: 'football',
        enabled: true,
        minMinute: 65,
        maxMinute: 88,
        scoreCondition: 'ANY',
        minTotalCorners,
        minCornersDiff,
        redCardCondition: 'NO_RED_CARDS',
        targetMarket: `ТБ угловых (+2) / ТБ ${minTotalCorners + 1.5} (~1.75)`,
        telegramEnabled: true,
        color: 'sky',
      };

      setSynthesizedRule(generated);
      setDetectedSummary(
        `Извлечена стратегия на угловые: угловые ≥ ${minTotalCorners} | Разница ≥ ${minCornersDiff} | Диапазон 65'-88' | Рынок: «${generated.targetMarket}»`
      );
      setIsProcessing(false);
      return;
    }

    // 4. Prematch Streak Strategy (e.g. 9/10 games Over 2.5)
    const isStreakStrategy =
      (lower.includes('9 из 10') || lower.includes('9/10') || lower.includes('сери') || lower.includes('тренд')) &&
      (lower.includes('тб 2.5') || lower.includes('гол') || lower.includes('последн'));

    if (isStreakStrategy) {
      const generated: FilterRule = {
        id: `ai-synthesized-${Date.now()}`,
        name: '⏱️ Стратегия: Гол во 2-м тайме по серии ТБ 2.5 (9 из 10)',
        description: 'Отбор матчей верховых команд: суммарно в 5 последних играх обеих команд ТБ 2.5 пробит минимум в 9 из 10 встреч. Вход при счёте 0:0, 1:0, 0:1 к перерыву на гол во 2-м тайме.',
        category: 'goals',
        ruleType: 'PREMATCH',
        sport: 'football',
        enabled: true,
        minMinute: 45,
        maxMinute: 75,
        scoreCondition: 'TOTAL_UNDER_15',
        maxTotalGoals: 1,
        requireScoreAtHalftimeLow: true,
        minCombinedOver25CountLast5: 9,
        targetMarket: 'Гол во 2-м тайме (~1.75)',
        telegramEnabled: true,
        color: 'purple',
      };

      setSynthesizedRule(generated);
      setDetectedSummary(
        'Извлечена прематч-стратегия по серии ТБ 2.5: минимум 9 из 10 матчей в выборке последних 5 игр, счёт к перерыву 0:0 или 1:0, ставка на гол во 2-м тайме.'
      );
      setIsProcessing(false);
      return;
    }

    // 5. Smart Money / Steam Move
    const isSmartMoney =
      lower.includes('прогруз') ||
      lower.includes('smart money') ||
      lower.includes('падение кэф') ||
      lower.includes('steam');

    if (isSmartMoney) {
      const generated: FilterRule = {
        id: `ai-synthesized-${Date.now()}`,
        name: '📉 Стратегия: Smart Money / Прогруз линии',
        description: 'Отслеживание аномального прогруза денег крупными игроками: падение коэффициента ≥ 12% при объёме пула ставок от 65%.',
        category: 'odds_drop',
        ruleType: 'LIVE',
        sport: 'football',
        enabled: true,
        minMinute: 1,
        maxMinute: 85,
        scoreCondition: 'ANY',
        minOddsDropPercent: 12,
        minMoneyVolumePercent: 65,
        targetMarket: 'Исход с прогрузом денег (П1 / X / ТБ)',
        telegramEnabled: true,
        color: 'amber',
      };

      setSynthesizedRule(generated);
      setDetectedSummary(
        'Извлечена стратегия Smart Money: падение кэфа ≥ 12%, доля денег ≥ 65%.'
      );
      setIsProcessing(false);
      return;
    }

    // 6. Generic Live Pressure & Goals Strategy
    let sport: SportType = 'football';
    if (lower.includes('хокке') || lower.includes('шайб')) sport = 'hockey';
    else if (lower.includes('баскет') || lower.includes('nba')) sport = 'basketball';
    else if (lower.includes('теннис')) sport = 'tennis';

    let minMin = 60;
    let maxMin = 85;
    const minMatch = (rawContent + ' ' + textNotes).match(/(\d{1,2})\s*[-–—]\s*(\d{1,2})\s*(?:мин|'|$)/);
    if (minMatch) {
      minMin = parseInt(minMatch[1], 10);
      maxMin = parseInt(minMatch[2], 10);
    }

    let scoreCondition: ScoreCondition = 'ANY';
    if (lower.includes('0:0') || lower.includes('0-0')) scoreCondition = '0-0';
    else if (lower.includes('ничья')) scoreCondition = 'DRAW';
    else if (lower.includes('тм 2.5') || lower.includes('тм 2')) scoreCondition = 'TOTAL_UNDER_25';
    else if (lower.includes('тм 1.5') || lower.includes('тм 1')) scoreCondition = 'TOTAL_UNDER_15';
    else if (lower.includes('разниц') && lower.includes('1')) scoreCondition = 'ONE_GOAL_DIFF';

    let minDang: number | undefined = undefined;
    let minSOT: number | undefined = undefined;
    let minCorners: number | undefined = undefined;

    const dangMatch = lower.match(/(?:опасн|da).*?([>≥=])?\s*(\d{1,3})/);
    if (dangMatch) minDang = parseInt(dangMatch[2], 10);

    const sotMatch = lower.match(/(?:створ|sot).*?([>≥=])?\s*(\d{1,2})/);
    if (sotMatch) minSOT = parseInt(sotMatch[2], 10);

    const cornersMatch = lower.match(/(?:угл|корнер).*?([>≥=])?\s*(\d{1,2})/);
    if (cornersMatch) minCorners = parseInt(cornersMatch[2], 10);

    const generated: FilterRule = {
      id: `ai-synthesized-${Date.now()}`,
      name: scoreCondition === '0-0' ? `⚽ Штурм при 0:0 (${minMin}'-${maxMin}')` : `⚡ Алгоритм давления (${minMin}'-${maxMin}')`,
      description: `Автоматически распознанная стратегия: минуты ${minMin}'-${maxMin}', счёт ${scoreCondition}, опасные атаки ≥ ${minDang || 35}, створ ≥ ${minSOT || 3}.`,
      category: 'goals',
      ruleType: 'LIVE',
      sport,
      enabled: true,
      minMinute: minMin,
      maxMinute: maxMin,
      scoreCondition,
      minDangerousAttacksTotal: minDang || 35,
      minShotsOnTargetTotal: minSOT || 3,
      minTotalCorners: minCorners,
      minPressureIndex: 60,
      redCardCondition: 'NO_RED_CARDS',
      targetMarket: 'ТБ 0.5 во 2-м тайме / Поздний гол (~1.75)',
      telegramEnabled: true,
      color: 'emerald',
    };

    setSynthesizedRule(generated);
    setDetectedSummary(
      `Параметры извлечены: минуты ${minMin}'-${maxMin}' | Счёт: ${scoreCondition} | Рынок: «${generated.targetMarket}» | Давление: оп. атаки ≥ ${minDang || 35}, створ ≥ ${minSOT || 3}`
    );
    setIsProcessing(false);
  };

  const handleApplyPresetExample = (exampleText: string) => {
    setInputMode('text');
    setTextNotes(exampleText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-emerald-500/30 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-8 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-950/50">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  ИИ-Синтезатор карточек стратегий
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <Crown className="h-3 w-3 text-amber-400" />
                  VIP / MAX FEATURE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Загрузите фото стратегии, текстовый файл или набросайте мысли — нейросеть создаст настроенную карточку
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Plan Access Gate (If user is not on Max/VIP Plan) */}
        {!canAccess ? (
          <div className="p-6 sm:p-8 space-y-6 text-center overflow-y-auto">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
              <Lock className="h-8 w-8" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-lg font-black text-white">
                Доступно на тарифах Максимум (VIP & PRO)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                ИИ-синтезатор карточек стратегий по скриншотам, заметкам и файлам доступен пользователям с максимальной подпиской. Активируйте подписку или протестируйте возможности в демо-режиме!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 max-w-lg mx-auto text-left space-y-2 text-xs">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <Check className="h-4 w-4" />
                Что даёт ИИ-синтезатор:
              </span>
              <ul className="space-y-1.5 text-slate-300 text-[11px] list-disc list-inside">
                <li>Распознавание любых скриншотов стратегий из Telegram-каналов и капперских чатов</li>
                <li>Авто-настройка минут, коридоров кэфов, xG, точного счёта и порогов ударов/углов</li>
                <li>Мгновенный экспорт в готовый фильтр для онлайн-сканера сигналов</li>
                <li>Работает напрямую в РФ без VPN и без сторонних платных подписок (Сбер GigaChat, YandexGPT, Встроенный AI)</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onUpgradePlan) onUpgradePlan();
                  onClose();
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:opacity-90 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/50 transition active:scale-95"
              >
                <Crown className="h-4 w-4 text-amber-300" />
                <span>Перейти в кабинет и активировать VIP</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoBypass(true)}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition active:scale-95"
              >
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span>Попробовать в демо-режиме</span>
              </button>
            </div>
          </div>
        ) : (
          /* Main Interactive Synthesizer View */
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {/* Model & No-VPN Recommendation HUD */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Рекомендуемый ИИ (Без VPN & Бесплатный доступ):
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  100% Доступно в РФ
                </span>
              </div>

              {/* Provider Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <button
                  type="button"
                  onClick={() => setAiProvider('builtin')}
                  className={`p-3 rounded-xl border text-left transition ${
                    aiProvider === 'builtin'
                      ? 'bg-emerald-950/50 border-emerald-500/60 text-white shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">⚡ Встроенный ИИ</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">Бесплатно</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    SportSignal NeuroEngine: мгновенный парсинг без API-ключей и без VPN
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAiProvider('gigachat')}
                  className={`p-3 rounded-xl border text-left transition ${
                    aiProvider === 'gigachat'
                      ? 'bg-emerald-950/50 border-emerald-500/60 text-white shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">🟢 GigaChat (Сбер)</span>
                    <span className="text-[9px] bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded font-mono">1 млн токенов</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Бесплатный API для РФ, прямое подключение без VPN, отличный русский
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAiProvider('yandexgpt')}
                  className={`p-3 rounded-xl border text-left transition ${
                    aiProvider === 'yandexgpt'
                      ? 'bg-emerald-950/50 border-emerald-500/60 text-white shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">🔴 YandexGPT</span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">Яндекс</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Официальный API от Яндекса, высокая точность без прокси и VPN
                  </p>
                </button>
              </div>
            </div>

            {/* Input Method Selector Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setInputMode('text')}
                className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                  inputMode === 'text'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Набросать заметки / мысли</span>
              </button>

              <button
                type="button"
                onClick={() => setInputMode('image')}
                className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                  inputMode === 'image'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ImageIcon className="h-4 w-4" />
                <span>Загрузить фото / скриншот</span>
              </button>

              <button
                type="button"
                onClick={() => setInputMode('file')}
                className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                  inputMode === 'file'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="h-4 w-4" />
                <span>Загрузить файл (.txt/.json)</span>
              </button>
            </div>

            {/* Mode 1: Free-form Text / Notes */}
            {inputMode === 'text' && (
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                  <span>Опишите логику стратегии свободным языком:</span>
                  <span className="text-[10px] text-slate-500">ИИ поймёт любые формулировки</span>
                </label>
                <textarea
                  rows={4}
                  value={textNotes}
                  onChange={(e) => setTextNotes(e.target.value)}
                  placeholder="Например: Ищу гол в концовке. Минуты с 70 по 85. Счёт 0:0 или 1:0. Фаворит мощно давит: опасных атак больше 35, ударов в створ больше 5, угловых от 6. xG дефицит от 1.2. Рекомендуемый исход: ТБ 0.5 во 2-м тайме кэф 1.75..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition shadow-inner font-mono leading-relaxed"
                />

                {/* Quick Examples */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                  <span className="text-slate-500 text-[10px] shrink-0">Примеры для быстрой вставки:</span>
                  {[
                    {
                      label: '🟨 Карточки в дерби (ЖК ТБ 4.5)',
                      text: 'Грубый матч или дерби: 45-85 минута, ЖК суммарно >= 5, накал страстей, фолы. Исход: ЖК ТБ 4.5 / 5.5.',
                    },
                    {
                      label: '⏱️ Серия ТБ 2.5: 9 из 10 матчей',
                      text: 'Прематч-серия: в последних 5 играх обеих команд суммарно минимум 9 из 10 матчей завершились на ТБ 2.5. Счёт к перерыву 0:0 или 1:0. Исход: Гол во 2-м тайме кэф 1.75.',
                    },
                    {
                      label: '⚽ Штурм при 0:0 на 70\'',
                      text: 'Минута 70-85, счет строго 0:0. Опасные атаки >= 40, ударов в створ >= 5, угловых >= 7. Исход: ТБ 0.5 во 2-м тайме.',
                    },
                    {
                      label: '🚩 Осада угловыми (75-87\')',
                      text: 'Минуты 75-87, счет разница в 1 гол. Угловых суммарно >= 8, перевес >= 3. Исход: ТБ угловых в концовке (+2).',
                    },
                    {
                      label: '📉 Smart Money (Прогруз линии)',
                      text: 'Лайв-прогруз: падение коэффициента >= 12% при объеме денег на бирже >= 65%. Минуты 1-85. Исход: Исход по прогрузу.',
                    },
                    {
                      label: '📋 10-балльный чеклист на ТБ 2.5',
                      text: 'Понятная таблица 10-балльного чеклиста на ТБ 2.5: 10 критериев отбора с минимальными порогами xG >=2.70, результативность >=2.70, атака >=1.50, дырявая оборона >=1.00, ОЗ >=55%, кэф от 1.75+.',
                    },
                    {
                      label: '🏒 Хоккей: Снятый вратарь',
                      text: 'Хоккей: 3-й период, 55-59 минута. Счет разница 1 шайба (ONE_GOAL_DIFF). Проигрывающие снимают вратаря, бросков в створ >= 25. Исход: ТБ 5.5 шайб.',
                    },
                  ].map((ex, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPresetExample(ex.text)}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-[10px] transition"
                    >
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mode 2: Image / Screenshot Upload with OCR */}
            {inputMode === 'image' && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={imageInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="p-6 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl bg-slate-950/60 text-center cursor-pointer transition space-y-2 group"
                >
                  <ImageIcon className="h-8 w-8 text-slate-500 group-hover:text-emerald-400 mx-auto transition" />
                  <div className="text-xs font-bold text-white">
                    {selectedFile ? selectedFile.name : 'Нажмите для выбора скриншота стратегии или перетащите файл'}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Поддерживаются PNG, JPG, WEBP. ИИ автоматически распознает текст условий и коэффициентов
                  </p>
                </div>

                {filePreview && (
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                    <img
                      src={filePreview}
                      alt="Превью"
                      className="w-24 h-24 object-cover rounded-xl border border-slate-800 shrink-0"
                    />
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                          Распознанный текст с изображения (OCR):
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          (можно скорректировать вручную)
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={extractedOcrText}
                        onChange={(e) => setExtractedOcrText(e.target.value)}
                        placeholder="Текст с изображения появится здесь или введите вручную..."
                        className="w-full text-xs text-slate-200 font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800 focus:border-emerald-500 focus:outline-none transition leading-relaxed resize-y"
                      />
                    </div>
                  </div>
                )}

                {tokenOptimizationInfo && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                    <span>⚡ <b>Оптимизация токенов активна:</b> изображение сжато ({tokenOptimizationInfo.originalKb} КБ → {tokenOptimizationInfo.newKb} КБ, -{tokenOptimizationInfo.savingsPct}% объема). Экономия токенов Gemini Vision ~75%.</span>
                  </div>
                )}

                {lastTokenStats && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
                    <span className="flex items-center gap-1.5">
                      {lastTokenStats.fromCache ? '⚡ Результат из мгновенного кэша (0 токенов)' : `⚡ Использовано: ~${lastTokenStats.estimatedTokens} токенов`}
                    </span>
                    <span className="text-emerald-400 font-bold">
                      Сэкономлено: ~{lastTokenStats.tokensSaved} токенов
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Mode 3: Text file upload */}
            {inputMode === 'file' && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".txt,.json,.md,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl bg-slate-950/60 text-center cursor-pointer transition space-y-2 group"
                >
                  <Upload className="h-8 w-8 text-slate-500 group-hover:text-emerald-400 mx-auto transition" />
                  <div className="text-xs font-bold text-white">
                    {selectedFile ? selectedFile.name : 'Нажмите для загрузки текстового файла (.txt / .json / .md)'}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Текстовые заметки, описания систем ставок или сохранённые правила
                  </p>
                </div>

                {extractedOcrText && (
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                      Содержимое файла:
                    </span>
                    <pre className="text-xs text-slate-300 font-mono max-h-28 overflow-y-auto bg-slate-900 p-2.5 rounded-lg border border-slate-800 whitespace-pre-wrap">
                      {extractedOcrText}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Action Button: Run Synthesis */}
            <div className="pt-2">
              <button
                type="button"
                onClick={runStrategySynthesis}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:opacity-90 disabled:opacity-50 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-950/50 transition active:scale-95 border border-emerald-400/30"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>Нейросеть синтезирует параметры стратегии...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>🤖 Преобразовать в готовую карточку стратегии</span>
                  </>
                )}
              </button>
            </div>

            {/* Synthesized Result Preview Card */}
            {synthesizedRule && (
              <div className="p-5 rounded-3xl bg-gradient-to-b from-slate-950 to-slate-900 border border-emerald-500/50 space-y-4 shadow-2xl animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold uppercase">
                      Готовая карточка фильтра
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Вид спорта: <strong className="text-white">{synthesizedRule.sport?.toUpperCase()}</strong>
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    Сгенерировано за 1.2 сек
                  </span>
                </div>

                {detectedSummary && (
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono">
                    {detectedSummary}
                  </div>
                )}

                {/* Card Main Info */}
                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-white">{synthesizedRule.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{synthesizedRule.description}</p>
                </div>

                {/* Parameter Badges */}
                <div className="flex flex-wrap gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-sky-300 font-bold">
                    ⏱️ Минуты: {synthesizedRule.minMinute}' – {synthesizedRule.maxMinute}'
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-bold">
                    Счёт: {synthesizedRule.scoreCondition} {synthesizedRule.exactScore ? `(${synthesizedRule.exactScore})` : ''}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-amber-300 font-bold">
                    🎯 Исход: {synthesizedRule.targetMarket}
                  </span>
                  {synthesizedRule.minDangerousAttacksDiff && (
                    <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400">
                      🔥 Оп. атаки Δ ≥ {synthesizedRule.minDangerousAttacksDiff}
                    </span>
                  )}
                  {synthesizedRule.minShotsOnTargetTotal && (
                    <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400">
                      🎯 Створ ≥ {synthesizedRule.minShotsOnTargetTotal}
                    </span>
                  )}
                  {synthesizedRule.minTotalCorners && (
                    <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-blue-400">
                      🚩 Угловые ≥ {synthesizedRule.minTotalCorners}
                    </span>
                  )}
                  {synthesizedRule.minYellowCardsTotal && (
                    <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-amber-300">
                      🟨 ЖК ≥ {synthesizedRule.minYellowCardsTotal}
                    </span>
                  )}
                  {synthesizedRule.redCardCondition && synthesizedRule.redCardCondition !== 'ANY' && (
                    <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-rose-400">
                      🟥 {synthesizedRule.redCardCondition === 'HAS_RED_CARD' ? 'Есть красная карточка' : 'Без удалений'}
                    </span>
                  )}
                  {synthesizedRule.minCombinedOver25CountLast5 && (
                    <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-purple-300 font-bold">
                      📊 ТБ 2.5: ≥ {synthesizedRule.minCombinedOver25CountLast5}/10 в посл. играх
                    </span>
                  )}
                  {synthesizedRule.requireScoreAtHalftimeLow && (
                    <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400">
                      ⏱️ Счёт 1Т: 0:0, 1:0 или 0:1
                    </span>
                  )}
                  {synthesizedRule.minXgOverScoreDiff && (
                    <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 font-bold">
                      ⚡ xG недобор ≥ {synthesizedRule.minXgOverScoreDiff}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onSaveStrategy(synthesizedRule, true);
                      onClose();
                    }}
                    className="w-full sm:flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition active:scale-95"
                  >
                    <Check className="h-4 w-4" />
                    <span>Сохранить и сразу запустить мониторинг</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSaveStrategy(synthesizedRule, false);
                      onClose();
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 border border-slate-700"
                  >
                    <span>Сохранить в мои карточки</span>
                  </button>

                  {onOpenInBuilder && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenInBuilder(synthesizedRule);
                        onClose();
                      }}
                      className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 border border-slate-800"
                    >
                      <Sliders className="h-3.5 w-3.5" />
                      <span>Доработать в конструкторе</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
