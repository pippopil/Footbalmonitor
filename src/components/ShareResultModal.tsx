import React, { useState } from 'react';
import { Match } from '../types';
import { X, Download, Share2, Copy, Check, Sparkles } from 'lucide-react';
import { tgHaptic } from '../utils/telegramWebApp';

interface ShareResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  imageDataUrl: string | null;
  imageBlob: Blob | null;
}

export const ShareResultModal: React.FC<ShareResultModalProps> = ({
  isOpen,
  onClose,
  match,
  imageDataUrl,
  imageBlob,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !imageDataUrl) return null;

  const fileName = `match-${match.id}-${match.homeTeam.toLowerCase().replace(/\s+/g, '_')}-vs-${match.awayTeam.toLowerCase().replace(/\s+/g, '_')}.png`;

  const handleDownload = () => {
    tgHaptic('impact', 'light');
    const link = document.createElement('a');
    link.download = fileName;
    link.href = imageDataUrl;
    link.click();
  };

  const handleCopyToClipboard = async () => {
    tgHaptic('impact', 'medium');
    try {
      if (imageBlob && navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({
            'image/png': imageBlob,
          }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        await navigator.clipboard.writeText(
          `⚽ ${match.homeTeam} ${match.score[0]}:${match.score[1]} ${match.awayTeam} (${match.minute}') • Footbalmonitor Pro Live Telemetry`
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
      handleDownload();
    }
  };

  const handleNativeShare = async () => {
    tgHaptic('impact', 'medium');
    if (navigator.share && imageBlob) {
      try {
        const file = new File([imageBlob], fileName, { type: 'image/png' });
        await navigator.share({
          title: `${match.homeTeam} vs ${match.awayTeam} (${match.score[0]}:${match.score[1]})`,
          text: `Телеметрия матча ${match.homeTeam} vs ${match.awayTeam} в реальном времени. Счёт: ${match.score[0]}:${match.score[1]} (${match.minute}').`,
          files: [file],
        });
        return;
      } catch {
        // Fallback to clipboard/download
      }
    }
    handleDownload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Брендированная карточка счёта</h3>
              <p className="text-xs text-slate-400">
                Сгенерировано через Canvas API для {match.homeTeam} vs {match.awayTeam}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Image Preview */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner group">
          <img
            src={imageDataUrl}
            alt={`${match.homeTeam} vs ${match.awayTeam} Score Overlay`}
            className="w-full h-auto object-contain"
          />
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-mono text-slate-300">
            1200 × 675 PNG
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleDownload}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition active:scale-[0.98]"
          >
            <Download className="h-4 w-4" />
            <span>Скачать PNG</span>
          </button>

          <button
            type="button"
            onClick={handleCopyToClipboard}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition active:scale-[0.98]"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-300 font-bold">Скопировано в буфер!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-slate-400" />
                <span>Скопировать картинку</span>
              </>
            )}
          </button>

          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-[0.98]"
              title="Поделиться в Telegram или социальных сетях"
            >
              <Share2 className="h-4 w-4 text-cyan-400" />
              <span>Поделиться</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
