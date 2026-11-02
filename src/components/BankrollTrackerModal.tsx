import React, { useState, useEffect } from 'react';
import {
  X,
  Wallet,
  TrendingUp,
  Percent,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  FileSpreadsheet,
  Settings2,
  DollarSign,
  Info,
} from 'lucide-react';
import { BankrollSettings, VirtualBetRecord, BetOutcome } from '../types';

interface BankrollTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_BANKROLL_SETTINGS: BankrollSettings = {
  initialBank: 100000,
  currentBank: 118450,
  currency: 'RUB',
  betStrategy: 'FLAT_PERCENT',
  flatAmount: 2000,
  flatPercent: 2,
};

const INITIAL_BET_RECORDS: VirtualBetRecord[] = [
  {
    id: 'bet-1',
    timestamp: '30.09.2026 14:15',
    matchId: 'm-sample-1',
    homeTeam: 'Манчестер Сити',
    awayTeam: 'Эвертон',
    league: 'АПЛ',
    filterName: '🔥 Поздний штурм фаворита',
    market: 'ТБ 1.5 гола',
    odds: 1.85,
    stake: 2000,
    outcome: 'WIN',
    profit: 1700,
    closingScore: [2, 0],
    note: 'Гол на 79 минуте после осады',
  },
  {
    id: 'bet-2',
    timestamp: '30.09.2026 13:40',
    matchId: 'm-sample-2',
    homeTeam: 'Реал Мадрид',
    awayTeam: 'Мальорка',
    league: 'Ла Лига',
    filterName: '🎯 Ловушка xG & Камбэк',
    market: 'ИТБ1 (1.0)',
    odds: 1.95,
    stake: 2000,
    outcome: 'WIN',
    profit: 1900,
    closingScore: [2, 1],
    note: 'Сравняли и дожали в концовке',
  },
  {
    id: 'bet-3',
    timestamp: '29.09.2026 21:00',
    matchId: 'm-sample-3',
    homeTeam: 'Интер',
    awayTeam: 'Ювентус',
    league: 'Серия А',
    filterName: '🛡️ Бетонный автобус',
    market: 'ТМ 2.5',
    odds: 1.72,
    stake: 2000,
    outcome: 'WIN',
    profit: 1440,
    closingScore: [1, 0],
    note: 'Сухой второй тайм без ударов',
  },
  {
    id: 'bet-4',
    timestamp: '29.09.2026 18:30',
    matchId: 'm-sample-4',
    homeTeam: 'Боруссия Дортмунд',
    awayTeam: 'Штутгарт',
    league: 'Бундеслига',
    filterName: '⚡ Угловой шторм',
    market: 'Угловые ТБ 9.5',
    odds: 1.88,
    stake: 2000,
    outcome: 'LOSS',
    profit: -2000,
    closingScore: [1, 1],
    note: 'Остановились на 9 угловых',
  },
];

export const BankrollTrackerModal: React.FC<BankrollTrackerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [settings, setSettings] = useState<BankrollSettings>(() => {
    try {
      const saved = localStorage.getItem('footbalmonitor_bankroll_settings');
      return saved ? JSON.parse(saved) : DEFAULT_BANKROLL_SETTINGS;
    } catch {
      return DEFAULT_BANKROLL_SETTINGS;
    }
  });

  const [bets, setBets] = useState<VirtualBetRecord[]>(() => {
    try {
      const saved = localStorage.getItem('footbalmonitor_virtual_bets');
      return saved ? JSON.parse(saved) : INITIAL_BET_RECORDS;
    } catch {
      return INITIAL_BET_RECORDS;
    }
  });

  const [isAddingBet, setIsAddingBet] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // New bet form
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [league, setLeague] = useState('');
  const [market, setMarket] = useState('ТБ 1.5');
  const [filterName, setFilterName] = useState('Пользовательский сигнал');
  const [odds, setOdds] = useState('1.85');
  const [customStake, setCustomStake] = useState('');
  const [outcome, setOutcome] = useState<BetOutcome>('WIN');
  const [note, setNote] = useState('');

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem('footbalmonitor_bankroll_settings', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('footbalmonitor_virtual_bets', JSON.stringify(bets));
    } catch {}
  }, [bets]);

  if (!isOpen) return null;

  // Analytics computation
  const totalBets = bets.length;
  const wins = bets.filter((b) => b.outcome === 'WIN').length;
  const losses = bets.filter((b) => b.outcome === 'LOSS').length;
  const voids = bets.filter((b) => b.outcome === 'VOID').length;
  const resolvedBets = wins + losses;
  const winRate = resolvedBets > 0 ? Number(((wins / resolvedBets) * 100).toFixed(1)) : 0;

  const totalStaked = bets.reduce((sum, b) => sum + (b.outcome !== 'PENDING' ? b.stake : 0), 0);
  const totalProfit = bets.reduce((sum, b) => sum + b.profit, 0);
  const roi = totalStaked > 0 ? Number(((totalProfit / totalStaked) * 100).toFixed(1)) : 0;
  const currentBank = settings.initialBank + totalProfit;

  const formatCurrency = (val: number) => {
    const sym = settings.currency === 'RUB' ? '₽' : settings.currency === 'USD' ? '$' : settings.currency === 'EUR' ? '€' : 'USDT';
    return `${val.toLocaleString('ru-RU')} ${sym}`;
  };

  const handleAddBet = (e: React.FormEvent) => {
    e.preventDefault();
    const numOdds = parseFloat(odds) || 1.85;
    const computedStake = customStake
      ? parseFloat(customStake)
      : settings.betStrategy === 'FLAT_PERCENT'
      ? Math.round((currentBank * settings.flatPercent) / 100)
      : settings.flatAmount;

    let profit = 0;
    if (outcome === 'WIN') {
      profit = Math.round(computedStake * (numOdds - 1));
    } else if (outcome === 'LOSS') {
      profit = -computedStake;
    }

    const newBet: VirtualBetRecord = {
      id: `bet-${Date.now()}`,
      timestamp: new Date().toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      matchId: `manual-${Date.now()}`,
      homeTeam: homeTeam || 'Команда 1',
      awayTeam: awayTeam || 'Команда 2',
      league: league || 'Товарищеский',
      filterName: filterName || 'Сигнал',
      market,
      odds: numOdds,
      stake: computedStake,
      outcome,
      profit,
      note,
    };

    setBets((prev) => [newBet, ...prev]);
    setIsAddingBet(false);
    setHomeTeam('');
    setAwayTeam('');
    setNote('');
  };

  const handleDeleteBet = (id: string) => {
    setBets((prev) => prev.filter((b) => b.id !== id));
  };

  const handleUpdateOutcome = (id: string, newOutcome: BetOutcome) => {
    setBets((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        let profit = 0;
        if (newOutcome === 'WIN') profit = Math.round(b.stake * (b.odds - 1));
        else if (newOutcome === 'LOSS') profit = -b.stake;
        return { ...b, outcome: newOutcome, profit };
      })
    );
  };

  const exportCSV = () => {
    const headers = ['Дата', 'Матч', 'Лига', 'Стратегия', 'Маркет', 'Коэффициент', 'Ставка', 'Исход', 'Прибыль', 'Заметка'];
    const rows = bets.map((b) => [
      b.timestamp,
      `"${b.homeTeam} - ${b.awayTeam}"`,
      `"${b.league}"`,
      `"${b.filterName}"`,
      `"${b.market}"`,
      b.odds,
      b.stake,
      b.outcome,
      b.profit,
      `"${b.note || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Footbalmonitor_Bet_Tracker_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Трекер виртуального банка и сигналов</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Аудит доходности
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Полностью виртуальный аудит эффективности: учет заходов по алгоритмам, расчет реального ROI и кривой капитала
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              title="Настройки банка"
            >
              <Settings2 className="h-4 w-4" />
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Экспорт в Excel (CSV)"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span className="hidden sm:inline">Экспорт CSV</span>
            </button>
            <button
              onClick={() => setIsAddingBet(!isAddingBet)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Зафиксировать ставку</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Bankroll Settings Drawer */}
        {isSettingsOpen && (
          <div className="px-6 py-4 bg-slate-950/95 border-b border-slate-800 animate-in slide-in-from-top duration-200">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-emerald-400" /> Параметры мани-менеджмента
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Начальный банк:
                </label>
                <input
                  type="number"
                  value={settings.initialBank}
                  onChange={(e) =>
                    setSettings({ ...settings, initialBank: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Валюта:</label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="RUB">RUB (₽)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USDT">USDT</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Стратегия ставки:
                </label>
                <select
                  value={settings.betStrategy}
                  onChange={(e) => setSettings({ ...settings, betStrategy: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="FLAT_PERCENT">Фиксированный % (Флет)</option>
                  <option value="FLAT_AMOUNT">Фиксированная сумма</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  {settings.betStrategy === 'FLAT_PERCENT' ? 'Процент от банка (%):' : 'Размер ставки:'}
                </label>
                <input
                  type="number"
                  value={
                    settings.betStrategy === 'FLAT_PERCENT'
                      ? settings.flatPercent
                      : settings.flatAmount
                  }
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    if (settings.betStrategy === 'FLAT_PERCENT') {
                      setSettings({ ...settings, flatPercent: val });
                    } else {
                      setSettings({ ...settings, flatAmount: val });
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Add Bet Form */}
        {isAddingBet && (
          <form
            onSubmit={handleAddBet}
            className="px-6 py-4 bg-slate-950/90 border-b border-emerald-500/20 animate-in slide-in-from-top duration-200"
          >
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Хозяева</label>
                <input
                  type="text"
                  placeholder="Команда 1"
                  required
                  value={homeTeam}
                  onChange={(e) => setHomeTeam(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Гости</label>
                <input
                  type="text"
                  placeholder="Команда 2"
                  required
                  value={awayTeam}
                  onChange={(e) => setAwayTeam(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Маркет / Исход</label>
                <input
                  type="text"
                  placeholder="ТБ 1.5"
                  value={market}
                  onChange={(e) => setMarket(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Коэффициент</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="1.85"
                  value={odds}
                  onChange={(e) => setOdds(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Исход</label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                >
                  <option value="WIN">✅ Заход (WIN)</option>
                  <option value="LOSS">❌ Проигрыш (LOSS)</option>
                  <option value="VOID">⚪ Возврат (VOID)</option>
                  <option value="PENDING">⏳ В игре (PENDING)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Своя сумма (опц.)</label>
                <input
                  type="number"
                  placeholder="По флету"
                  value={customStake}
                  onChange={(e) => setCustomStake(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <input
                type="text"
                placeholder="Заметка к ставке (на какой минуте зашел сигнал, почему взяли исход)..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="max-w-md bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Сохранить в аудит
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingBet(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Отмена
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Analytics Top Cards */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium mb-0.5">Текущий банк</div>
              <div className="text-base font-bold text-white">{formatCurrency(currentBank)}</div>
              <div className="text-[10px] text-slate-500">Начальный: {formatCurrency(settings.initialBank)}</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium mb-0.5">Чистая прибыль (P&L)</div>
              <div
                className={`text-base font-bold flex items-center gap-1 ${
                  totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {totalProfit >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                <span>{totalProfit >= 0 ? `+${formatCurrency(totalProfit)}` : formatCurrency(totalProfit)}</span>
              </div>
              <div className="text-[10px] text-slate-500">По всем ставкам</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium mb-0.5">ROI дистанции</div>
              <div
                className={`text-base font-bold ${
                  roi >= 0 ? 'text-amber-400' : 'text-rose-400'
                }`}
              >
                {roi >= 0 ? `+${roi}%` : `${roi}%`}
              </div>
              <div className="text-[10px] text-slate-500">Оборот: {formatCurrency(totalStaked)}</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium mb-0.5">Винрейт заходов</div>
              <div className="text-base font-bold text-cyan-300">{winRate}%</div>
              <div className="text-[10px] text-slate-500">
                {wins}W / {losses}L ({resolvedBets} решено)
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 col-span-2 sm:col-span-1">
              <div className="text-[11px] text-slate-400 font-medium mb-0.5">Текущий размер ставки</div>
              <div className="text-base font-bold text-indigo-300">
                {settings.betStrategy === 'FLAT_PERCENT'
                  ? `${formatCurrency(Math.round((currentBank * settings.flatPercent) / 100))} (${settings.flatPercent}%)`
                  : formatCurrency(settings.flatAmount)}
              </div>
              <div className="text-[10px] text-slate-500">Стратегия: Флет</div>
            </div>
          </div>
        </div>

        {/* Bet Log Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400 bg-slate-900/60 font-semibold">
                    <th className="px-4 py-3">Дата / Время</th>
                    <th className="px-4 py-3">Матч и Лига</th>
                    <th className="px-4 py-3">Алгоритм</th>
                    <th className="px-4 py-3">Маркет / Исход</th>
                    <th className="px-4 py-3">Кэф</th>
                    <th className="px-4 py-3">Ставка</th>
                    <th className="px-4 py-3">Исход</th>
                    <th className="px-4 py-3 text-right">Прибыль</th>
                    <th className="px-4 py-3 text-center">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {bets.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-slate-500 text-xs">
                        Журнал виртуальных ставок пуст. Нажмите «Зафиксировать ставку» выше, чтобы начать аудит.
                      </td>
                    </tr>
                  ) : (
                    bets.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-900/40 transition">
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-400">{b.timestamp}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">
                            {b.homeTeam} — {b.awayTeam}
                          </div>
                          <div className="text-[10px] text-slate-500">{b.league}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-300 font-medium">{b.filterName}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700/60 font-semibold text-cyan-300 text-[11px]">
                            {b.market}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-amber-300">{b.odds.toFixed(2)}</td>
                        <td className="px-4 py-3 font-mono">{formatCurrency(b.stake)}</td>
                        <td className="px-4 py-3">
                          <select
                            value={b.outcome}
                            onChange={(e) => handleUpdateOutcome(b.id, e.target.value as any)}
                            className={`rounded-lg px-2 py-1 text-[11px] font-bold border transition ${
                              b.outcome === 'WIN'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : b.outcome === 'LOSS'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                : b.outcome === 'VOID'
                                ? 'bg-slate-800 text-slate-300 border-slate-700'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            <option value="WIN">WIN</option>
                            <option value="LOSS">LOSS</option>
                            <option value="VOID">VOID</option>
                            <option value="PENDING">PENDING</option>
                          </select>
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono font-bold ${
                            b.profit > 0
                              ? 'text-emerald-400'
                              : b.profit < 0
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {b.profit > 0 ? `+${formatCurrency(b.profit)}` : formatCurrency(b.profit)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteBet(b.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition"
                            title="Удалить запись"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer legal and info notice */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              <strong>100% Легально и Безопасно:</strong> Данный трекер оперирует исключительно виртуальными демонстрационными средствами для математического тестирования алгоритмов без риска реальных денег.
            </span>
          </div>
          <span className="text-slate-500 hidden sm:inline">Footbalmonitor Bankroll Auditor</span>
        </div>
      </div>
    </div>
  );
};
