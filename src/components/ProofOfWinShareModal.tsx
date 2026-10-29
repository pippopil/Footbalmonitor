import React, { useRef, useState } from 'react';
import {
  X,
  Share2,
  Send,
  Download,
  Copy,
  Check,
  Trophy,
  Zap,
  TrendingUp,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import html2canvas from 'html2canvas';

export interface ProofItem {
  id: string;
  strategyName: string;
  matchName: string;
  league: string;
  minute: number;
  score: string;
  finalScore?: string;
  market: string;
  odds: number;
  winRate: number;
  profitRub?: number;
  date: string;
}

interface ProofOfWinShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  proof: ProofItem | null;
}

export const ProofOfWinShareModal: React.FC<ProofOfWinShareModalProps> = ({
  isOpen,
  onClose,
  proof,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);

  if (!isOpen || !proof) return null;

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://sportsignal.ai';
  const shareText = `🔥 ПОБЕДА ПО СИГНАЛУ СПОРТИВНОГО СКАНЕРА!\n⚽ ${proof.matchName} (${proof.league})\n⏱️ Минута: ${proof.minute}' | Счёт: ${proof.score}\n🎯 Исход: ${proof.market}\n📈 Кэф: ${proof.odds.toFixed(2)} ✅ ЗАШЛО!\n🏆 Стратегия: «${proof.strategyName}» (Винрейт ${proof.winRate}%)\n\n🚀 Следи за матчами в реальном времени: ${appUrl}`;

  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareVK = () => {
    const url = `https://vk.com/share.php?url=${encodeURIComponent(appUrl)}&title=${encodeURIComponent('Победа по сигналу SportSignal AI')}&comment=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleDownloadCardImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsExportingImage(true);
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#020617',
        scale: 2,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `win_signal_${proof.matchName.replace(/\s+/g, '_')}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export card image:', err);
      alert('Не удалось сформировать изображение. Скопируйте текст сигнала кнопкой выше.');
    } finally {
      setIsExportingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-5 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5">
                <span>Виральная карточка Proof-of-Win</span>
                <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
              </h3>
              <p className="text-xs text-slate-400">Поделитесь подтвержденным заходом в соцсетях и чатах</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Visual Shareable Card Snapshot */}
        <div
          ref={cardRef}
          className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 border-2 border-emerald-500/50 shadow-xl relative overflow-hidden space-y-4"
        >
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Card Header */}
          <div className="flex items-center justify-between gap-2 relative">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black">
                <Trophy className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  SportSignal AI • Proof of Win
                </span>
                <span className="text-xs font-black text-white">Верифицированный сигнал</span>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-sm">
              <Check className="h-3 w-3" />
              100% ВЫИГРЫШ
            </span>
          </div>

          {/* Match Details */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 relative">
            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span className="truncate max-w-[200px]">{proof.league}</span>
              <span className="font-mono text-emerald-400 font-bold">{proof.minute}' минута</span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-white tracking-tight">
              {proof.matchName}
            </h4>
            <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-slate-800">
              <span className="text-slate-400">Счёт: <strong className="text-white">{proof.finalScore || proof.score}</strong></span>
              <span className="text-emerald-400 font-bold">Счёт на момент сигнала: {proof.score}</span>
            </div>
          </div>

          {/* Bet / Market Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs relative">
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Целевой исход</span>
              <span className="text-sm font-black text-amber-300 truncate block mt-0.5">
                {proof.market}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Коэффициент захода</span>
              <span className="text-sm font-black text-emerald-400 font-mono block mt-0.5">
                Кэф {proof.odds.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Strategy Meta & Branding Watermark */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] relative">
            <div className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span className="truncate max-w-[170px]">{proof.strategyName}</span>
              <span className="font-mono text-emerald-300 font-bold">({proof.winRate}%)</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-500">
              t.me/FootbalMonitorGodBot
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleShareTelegram}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-950/40 transition active:scale-95"
            >
              <Send className="h-4 w-4" />
              <span>В Telegram чат / канал</span>
            </button>

            <button
              type="button"
              onClick={handleShareVK}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-950/40 transition active:scale-95"
            >
              <Share2 className="h-4 w-4" />
              <span>Поделиться во ВКонтакте</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 border border-slate-700 transition"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-slate-400" />}
              <span>{copied ? 'Текст скопирован!' : 'Скопировать текст прогноза'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCardImage}
              disabled={isExportingImage}
              className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 border border-emerald-500/40 transition disabled:opacity-50"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span>{isExportingImage ? 'Создание PNG...' : 'Скачать картинку (PNG)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
