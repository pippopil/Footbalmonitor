import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  tagline?: string;
  animated?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  tagline,
  animated = false,
}) => {
  const sizeMap = {
    sm: { box: 'w-8 h-8', svg: 22, text: 'text-base', sub: 'text-[9px]' },
    md: { box: 'w-10 h-10', svg: 26, text: 'text-lg', sub: 'text-[10px]' },
    lg: { box: 'w-16 h-16', svg: 42, text: 'text-2xl', sub: 'text-xs' },
    xl: { box: 'w-24 h-24', svg: 64, text: 'text-4xl', sub: 'text-sm' },
  };

  const dim = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Dynamic Emblem */}
      <div
        className={`relative ${dim.box} rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10 border border-emerald-500/40 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/60 overflow-hidden group`}
      >
        {/* Animated radar sweep background */}
        {animated && (
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 via-transparent to-cyan-500/10 animate-pulse pointer-events-none" />
        )}

        {/* Outer radial glow */}
        <div className="absolute inset-0 rounded-2xl bg-emerald-500/5 blur-[2px] group-hover:bg-emerald-500/15 transition-all" />

        <svg
          width={dim.svg}
          height={dim.svg}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            <linearGradient id="logo-emerald-grad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#34D399" />
              <stop offset="0.5" stopColor="#10B981" />
              <stop offset="1" stopColor="#065F46" />
            </linearGradient>
            <linearGradient id="logo-cyan-grad" x1="8" y1="12" x2="40" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38BDF8" />
              <stop offset="1" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="logo-gold-grad" x1="16" y1="16" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FBBF24" />
              <stop offset="1" stopColor="#D97706" />
            </linearGradient>
            <filter id="logo-neon-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#10B981" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Hexagonal Shield Outline (Tactical Security & Analysis) */}
          <path
            d="M24 4L40 11V25C40 34.5 33.2 41.5 24 44C14.8 41.5 8 34.5 8 25V11L24 4Z"
            stroke="url(#logo-emerald-grad)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            fill="#06121D"
            fillOpacity="0.85"
            filter="url(#logo-neon-glow)"
          />

          {/* Inner Geodesic Soccer Ball Pentagons */}
          {/* Central Pentagram */}
          <polygon
            points="24,17 29,21 27,26 21,26 19,21"
            fill="url(#logo-emerald-grad)"
            className="transition-colors"
          />

          {/* Ball Seam Lines extending to shield */}
          <path
            d="M24 17V12M29 21L34 20M27 26L31 31M21 26L17 31M19 21L14 20"
            stroke="#6EE7B7"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Pulse Waves / Radar Scan Rings at Bottom */}
          <path
            d="M14 36C17 38.5 20.3 39.8 24 40C27.7 39.8 31 38.5 34 36"
            stroke="url(#logo-cyan-grad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="1 3"
          />

          {/* Golden Pulse Node at Apex (Target Lock) */}
          <circle cx="24" cy="4" r="2.5" fill="url(#logo-gold-grad)" />
          <circle cx="24" cy="23.5" r="1.5" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Brand Title & Tagline */}
      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className={`font-black tracking-tight text-white ${dim.text} flex items-center shrink-0`}>
              SPORT<span className="text-emerald-400">SIGNAL</span>
            </span>
            <span className="hidden xs:inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
              AI PRO
            </span>
          </div>
          <span className={`hidden sm:block text-slate-400 font-medium truncate ${dim.sub}`}>
            {tagline || 'Мультиспортивная аналитика & ИИ-сканер стратегий'}
          </span>
        </div>
      )}
    </div>
  );
};
