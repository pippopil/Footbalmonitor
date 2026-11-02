import React, { useState, useEffect, useRef } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Gift,
  Sparkles,
  X,
  ShieldAlert,
  Zap,
  Flame,
  Bot,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { AdBannerItem } from '../types';
import { reachGoal } from '../services/analyticsService';

interface AdBannerProps {
  ad: AdBannerItem;
  variant?: 'top_ribbon' | 'top_billboard' | 'in_feed' | 'sidebar' | 'skyscraper';
  side?: 'left' | 'right';
  onDismiss?: () => void;
  onAdClick?: (adId: string) => void;
  onAdImpression?: (adId: string) => void;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  ad,
  variant = 'top_ribbon',
  side = 'left',
  onDismiss,
  onAdClick,
  onAdImpression,
}) => {
  const [copied, setCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const recordedAdIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (onAdImpression && recordedAdIdRef.current !== ad.id) {
      recordedAdIdRef.current = ad.id;
      onAdImpression(ad.id);
    }
  }, [ad.id, onAdImpression]);

  const handleCtaClick = () => {
    reachGoal('click_ad_banner', { adId: ad.id, partner: ad.partnerName, slot: variant });
    if (onAdClick) {
      onAdClick(ad.id);
    }
  };

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ad.promoCode) return;
    navigator.clipboard.writeText(ad.promoCode);
    setCopied(true);
    reachGoal('copy_ad_promo', { adId: ad.id, promo: ad.promoCode });
    if (onAdClick) {
      onAdClick(ad.id);
    }
    setTimeout(() => setCopied(false), 2000);
  };

  // Top Billboard (Rich horizontal banner at the top)
  if (variant === 'top_billboard') {
    if (isCollapsed) {
      return (
        <div
          id={`ad-billboard-${ad.id}-collapsed`}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 text-xs shadow-lg backdrop-blur-sm"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] tracking-wider uppercase border border-amber-500/40 flex items-center gap-1 shrink-0">
              <Flame className="h-2.5 w-2.5 text-amber-400" />
              {ad.badge}
            </span>
            <span className="font-bold text-slate-200 truncate">{ad.title}</span>
            {ad.bonusText && (
              <span className="hidden sm:inline px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-extrabold border border-emerald-500/30 shrink-0">
                {ad.bonusText}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsCollapsed(false)}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1 transition active:scale-95"
              title="Развернуть верхний баннер"
            >
              <span>Развернуть</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
                title="Скрыть баннер"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        id={`ad-billboard-${ad.id}`}
        className="w-full rounded-2xl border border-amber-500/35 hover:border-amber-500/50 bg-gradient-to-r from-amber-950/45 via-slate-900/95 to-slate-950 p-4 sm:p-5 shadow-xl relative overflow-hidden backdrop-blur-sm group transition"
      >
        {/* Top meta strip */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-[10px] tracking-wider uppercase border border-amber-500/40 flex items-center gap-1.5 shadow-sm">
              <Flame className="h-3 w-3 text-amber-400 animate-pulse" />
              <span>{ad.badge}</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <ShieldAlert className="h-3 w-3 text-slate-500" />
              <span>{ad.partnerName}</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition"
              title="Свернуть баннер"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition"
                title="Скрыть баннер"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Left / Info block */}
          <div className="lg:col-span-8 space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-amber-400 leading-tight">
                {ad.title}
              </h3>
              {ad.bonusText && (
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-extrabold text-xs">
                  {ad.bonusText}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              {ad.description}
            </p>

            {/* Feature tags */}
            {ad.features && ad.features.length > 0 && (
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap pt-1">
                {ad.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-lg"
                  >
                    <CheckCircle2 className="h-3 w-3 text-amber-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right / Actions block */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-center gap-2.5 pt-2 lg:pt-0 lg:border-l lg:border-slate-800/80 lg:pl-5">
            {ad.promoCode && (
              <div className="w-full sm:w-auto lg:w-full">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                  Промокод партнёра:
                </div>
                <button
                  onClick={handleCopyCode}
                  title="Нажмите для копирования промокода"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center justify-between gap-2 transition active:scale-95 shadow-inner"
                >
                  <span className="tracking-wide text-amber-300">{ad.promoCode}</span>
                  {copied ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-sans">
                      <Check className="h-3.5 w-3.5" />
                      Скопирован!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-slate-400 font-sans">
                      <Copy className="h-3.5 w-3.5" />
                      Скопировать
                    </span>
                  )}
                </button>
              </div>
            )}

            <div className="w-full sm:w-auto lg:w-full space-y-1">
              <a
                href={ad.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleCtaClick}
                className="w-full py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-950/60 transition active:scale-95"
              >
                <span>{ad.ctaText}</span>
                <ExternalLink className="h-4 w-4" />
              </a>
              <div className="text-[9px] text-center text-slate-500 font-medium">
                18+ Реклама. Лицензия Единого ЦУПИС № 14
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'top_ribbon') {
    return (
      <div
        id={`ad-ribbon-${ad.id}`}
        className="w-full bg-gradient-to-r from-amber-950/40 via-slate-900 to-emerald-950/30 border-b border-amber-500/25 px-4 py-2 text-xs relative z-40"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] tracking-wider uppercase border border-amber-500/30 flex items-center gap-1 shrink-0">
              <Sparkles className="h-2.5 w-2.5" />
              {ad.badge}
            </span>
            <span className="font-semibold text-slate-100 truncate">
              {ad.title}
            </span>
            <span className="text-slate-400 hidden md:inline truncate">
              — {ad.description}
            </span>

            {ad.bonusText && (
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 shrink-0">
                {ad.bonusText}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
            {ad.promoCode && (
              <button
                onClick={handleCopyCode}
                title="Нажмите, чтобы скопировать промокод"
                className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-mono font-bold flex items-center gap-1.5 transition active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-300">Скопирован!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-slate-400" />
                    <span>{ad.promoCode}</span>
                  </>
                )}
              </button>
            )}

            <a
              href={ad.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 shadow-sm transition active:scale-95"
            >
              <span>{ad.ctaText}</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded transition"
                title="Скрыть рекламу"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'in_feed') {
    return (
      <div
        id={`ad-feed-${ad.id}`}
        className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-900 via-blue-950/20 to-slate-900 p-4 relative overflow-hidden shadow-lg shadow-blue-950/30 transition hover:border-blue-500/50 group"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-[10px] tracking-wide uppercase border border-blue-500/30 flex items-center gap-1">
                <Zap className="h-2.5 w-2.5 text-blue-400" />
                {ad.badge}
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" />
                {ad.partnerName} • Реклама 18+
              </span>
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-blue-200 transition">
              {ad.title}
            </h4>
            <p className="text-xs text-slate-400 line-clamp-2">
              {ad.description}
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
            {ad.bonusText && (
              <span className="text-xs font-bold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                {ad.bonusText}
              </span>
            )}
            <div className="flex items-center gap-2">
              {ad.promoCode && (
                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 border border-slate-700 flex items-center gap-1 transition active:scale-95"
                  title="Скопировать промокод"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-slate-400" />}
                  <span>{ad.promoCode}</span>
                </button>
              )}
              <a
                href={ad.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-blue-900/40 transition active:scale-95"
              >
                <span>{ad.ctaText}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Skyscraper (Left or Right vertical banner)
  if (variant === 'skyscraper') {
    const isLeft = side === 'left' || ad.bannerType === 'skyscraper_left' || ad.side === 'left';
    
    if (isCollapsed) {
      return (
        <button
          onClick={() => setIsCollapsed(false)}
          className={`group flex items-center gap-1.5 p-2 rounded-xl border text-[11px] font-bold shadow-lg transition active:scale-95 ${
            isLeft
              ? 'bg-amber-950/60 hover:bg-amber-900/80 border-amber-500/40 text-amber-300'
              : 'bg-indigo-950/60 hover:bg-indigo-900/80 border-indigo-500/40 text-indigo-300'
          }`}
          title="Развернуть рекламный блок"
        >
          {isLeft ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          <span className="truncate">{ad.badge || 'Партнёр'}</span>
        </button>
      );
    }

    const borderColor = isLeft ? 'border-amber-500/35 hover:border-amber-500/60' : 'border-indigo-500/35 hover:border-indigo-500/60';
    const glowColor = isLeft ? 'from-amber-500/10 via-slate-900/90 to-slate-950' : 'from-indigo-500/10 via-slate-900/90 to-slate-950';
    const accentText = isLeft ? 'text-amber-400' : 'text-indigo-400';
    const badgeBg = isLeft ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
    const btnBg = isLeft
      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-950/50'
      : 'bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white shadow-indigo-950/50';

    return (
      <div
        id={`ad-skyscraper-${side}-${ad.id}`}
        className={`w-full rounded-2xl border ${borderColor} bg-gradient-to-b ${glowColor} p-4 space-y-3.5 shadow-xl transition relative overflow-hidden backdrop-blur-sm group`}
      >
        {/* Top bar with badge and close */}
        <div className="flex items-center justify-between gap-1">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 ${badgeBg}`}>
            {isLeft ? <Flame className="h-2.5 w-2.5 text-amber-400" /> : <Bot className="h-2.5 w-2.5 text-cyan-400" />}
            <span>{ad.badge}</span>
          </span>

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition"
              title="Свернуть"
            >
              {isLeft ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition"
                title="Скрыть рекламу"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Partner Name & Subheader */}
        <div>
          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1">
            <ShieldAlert className="h-2.5 w-2.5" />
            <span>{ad.partnerName}</span>
          </div>
          <h3 className={`text-sm 2xl:text-base font-black leading-tight mt-1 ${accentText}`}>
            {ad.title}
          </h3>
          {ad.bonusText && (
            <div className="mt-1.5 inline-block px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-extrabold text-xs">
              {ad.bonusText}
            </div>
          )}
        </div>

        {/* Short description */}
        <p className="text-[11px] leading-relaxed text-slate-300">
          {ad.description}
        </p>

        {/* Feature bullets if present */}
        {ad.features && ad.features.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
            {ad.features.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                <CheckCircle2 className={`h-3 w-3 mt-0.5 shrink-0 ${accentText}`} />
                <span className="leading-tight">{feat}</span>
              </div>
            ))}
          </div>
        )}

        {/* Promo code copy box */}
        {ad.promoCode && (
          <div className="pt-1">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
              Промокод:
            </div>
            <button
              onClick={handleCopyCode}
              title="Нажмите, чтобы скопировать промокод"
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center justify-between transition active:scale-95 shadow-inner"
            >
              <span>{ad.promoCode}</span>
              {copied ? (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <Check className="h-3 w-3" />
                  Копия
                </span>
              ) : (
                <Copy className="h-3 w-3 text-slate-400 group-hover:text-white transition" />
              )}
            </button>
          </div>
        )}

        {/* Primary CTA button */}
        <div className="pt-1">
          <a
            href={ad.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleCtaClick}
            className={`w-full py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition active:scale-95 ${btnBg}`}
          >
            <span>{ad.ctaText}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <div className="text-[9px] text-center text-slate-500 mt-1.5 font-medium">
            18+ Реклама. Лицензия Единого ЦУПИС
          </div>
        </div>
      </div>
    );
  }

  // Sidebar variant
  return (
    <div
      id={`ad-sidebar-${ad.id}`}
      className="rounded-xl border border-emerald-500/25 bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 p-3.5 space-y-2 relative"
    >
      <div className="flex items-center justify-between text-[10px] text-slate-400">
        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
          {ad.badge}
        </span>
        <span>{ad.partnerName}</span>
      </div>

      <div className="text-xs font-bold text-slate-100">
        {ad.title}
      </div>
      <p className="text-[11px] text-slate-400">
        {ad.description}
      </p>

      <div className="flex items-center justify-between pt-1">
        {ad.promoCode ? (
          <button
            onClick={handleCopyCode}
            className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 hover:text-white"
          >
            {copied ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : <Copy className="h-2.5 w-2.5" />}
            <span>{ad.promoCode}</span>
          </button>
        ) : (
          <span className="text-[11px] text-emerald-400 font-bold">{ad.bonusText}</span>
        )}

        <a
          href={ad.ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
        >
          <span>{ad.ctaText}</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
};

