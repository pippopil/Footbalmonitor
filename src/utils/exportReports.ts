/**
 * Signal History & Financial Bankroll Export to Excel (CSV)
 * Exports full signal backlog with UTF-8 BOM for 100% compatibility with MS Excel.
 */

import { SignalAlert } from '../types';

export function exportSignalsToExcelCsv(signals: SignalAlert[], filenamePrefix = 'signals_history'): void {
  if (!signals || signals.length === 0) {
    alert('Нет сигналов для экспорта в Excel');
    return;
  }

  // Header row
  const headers = [
    '№',
    'Дата и время',
    'Матч (Хозяева vs Гости)',
    'Лига / Турнир',
    'Вид спорта',
    'Минута',
    'Счёт на момент сигнала',
    'Итоговый счёт',
    'Стратегия / Фильтр',
    'Целевой рынок (Исход)',
    'Коэффициент',
    'Статус исхода',
    'Сумма ставки (RUB)',
    'Чистая прибыль (RUB)',
    'ROI (%)',
  ];

  const escapeField = (val: any): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = signals.map((sig, idx) => {
    const outcomeLabel =
      sig.outcome === 'WIN'
        ? 'ВЫИГРЫШ (WIN)'
        : sig.outcome === 'LOSS'
        ? 'ПРОИГРЫШ (LOSS)'
        : sig.outcome === 'REFUND'
        ? 'ВОЗВРАТ (REFUND)'
        : 'В ИГРЕ (PENDING)';

    const stake = sig.stake || 1000;
    const profit = sig.profit !== undefined ? sig.profit : sig.outcome === 'WIN' ? (sig.odds - 1) * stake : sig.outcome === 'LOSS' ? -stake : 0;
    const roi = stake > 0 ? ((profit / stake) * 100).toFixed(1) + '%' : '0%';

    return [
      idx + 1,
      sig.timestamp || new Date().toLocaleString('ru-RU'),
      sig.matchName || 'Матч',
      sig.league || 'Лига',
      sig.sport || 'Футбол',
      sig.minute !== undefined ? `${sig.minute}'` : '-',
      sig.score || '0:0',
      sig.finalScore || sig.score || '-',
      (sig as any).filterName || sig.ruleName || 'Стратегия',
      sig.marketSuggestion || (sig as any).targetMarket || 'ТБ',
      sig.odds ? sig.odds.toFixed(2) : '1.80',
      outcomeLabel,
      stake,
      profit,
      roi,
    ].map(escapeField).join(';');
  });

  // UTF-8 BOM (\uFEFF) ensures Excel opens Russian letters correctly
  const csvContent = '\uFEFF' + [headers.map(escapeField).join(';'), ...rows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `${filenamePrefix}_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
