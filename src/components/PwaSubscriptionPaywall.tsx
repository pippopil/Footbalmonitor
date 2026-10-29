import React, { useState } from 'react';
import {
  Smartphone,
  Crown,
  Lock,
  CheckCircle2,
  Sparkles,
  Zap,
  BellRing,
  Globe,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { UserProfile, UserPlan } from '../types';

interface PwaSubscriptionPaywallProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onUpgradePlan: (newPlan: UserPlan) => void;
  onExitToBrowser: () => void;
}

export const PwaSubscriptionPaywall: React.FC<PwaSubscriptionPaywallProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  onUpgradePlan,
  onExitToBrowser,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'PRO_ANALYST' | 'VIP_CLUB'>('PRO_ANALYST');
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState<boolean>(false);

  const handleActivate = () => {
    setIsActivating(true);
    setTimeout(() => {
      onUpgradePlan(selectedPlan);
      setIsActivating(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col justify-between overflow-y-auto p-4 sm:p-6 md:p-10 font-sans">
      {/* Background glow effects */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 -mt-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 -mb-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="relative max-w-2xl w-full mx-auto flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-950/50">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-black text-white tracking-wide flex items-center gap-1.5">
              <span>SportSignal AI</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                PWA APP
              </span>
            </div>
            <div className="text-[11px] text-slate-400">Автономное мобильное приложение</div>
          </div>
        </div>

        <button
          type="button"
          onClick={onExitToBrowser}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 py-1 px-2.5 rounded-lg bg-slate-900 border border-slate-800 transition"
          title="Открыть в браузере"
        >
          <Globe className="h-3.5 w-3.5 text-cyan-400" />
          <span>Браузерная версия</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="relative max-w-xl w-full mx-auto my-auto py-6 sm:py-8 space-y-6 text-center">
        {/* Lock & Crown Badge */}
        <div className="relative inline-block mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-emerald-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-2xl shadow-amber-950/50">
            <Smartphone className="h-10 w-10 text-emerald-400" />
          </div>
          <div className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-amber-500 text-slate-950 shadow-lg border border-amber-300">
            <Crown className="h-4 w-4" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-black uppercase tracking-wider">
            <Crown className="h-3.5 w-3.5" />
            Доступ только для подписчиков
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            PWA приложение доступно по платной подписке
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            Автономным PWA-приложением на домашнем экране могут пользоваться только подписчики с активным тарифом <strong className="text-amber-300">PRO</strong> или <strong className="text-emerald-300">VIP</strong>.
          </p>
        </div>

        {/* Current User Status */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold">
              {currentUser.username[0].toUpperCase()}
            </div>
            <div>
              <div className="text-white font-bold">{currentUser.username}</div>
              <div className="text-[11px] text-slate-400">
                Текущий статус: <span className="text-amber-400 font-bold">{currentUser.plan} (Бесплатный)</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSwitchingAccount(!isSwitchingAccount)}
            className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>Сменить</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {/* Account Switcher Dropdown */}
        {isSwitchingAccount && (
          <div className="p-3 rounded-2xl bg-slate-900 border border-cyan-500/40 text-left space-y-2 animate-in fade-in duration-150">
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Выберите аккаунт с активной подпиской:
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {allUsers.map((u) => {
                const isPaid = u.plan === 'PRO_ANALYST' || u.plan === 'VIP_CLUB' || u.plan === 'GOD_MODE' || u.role === 'god';
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      onSelectUser(u);
                      setIsSwitchingAccount(false);
                    }}
                    className={`w-full p-2 rounded-xl text-xs flex items-center justify-between transition ${
                      u.id === currentUser.id
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-white'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{u.username}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isPaid ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {u.plan}
                      </span>
                    </div>
                    {isPaid && <span className="text-[10px] text-emerald-400 font-bold">✓ Есть доступ</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left text-xs">
          <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-start gap-2.5">
            <Smartphone className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-white">Полноэкранный режим</div>
              <div className="text-[11px] text-slate-400">Работа как нативное приложение без рамок браузера</div>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-start gap-2.5">
            <BellRing className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-white">Web Push в фоне</div>
              <div className="text-[11px] text-slate-400">Сигналы доставляются даже при закрытом экране</div>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-white">Все 50 вшитых стратегий</div>
              <div className="text-[11px] text-slate-400">Готовые проверенные алгоритмы с проходом 96–100%</div>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-start gap-2.5">
            <Zap className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-white">До 5-15 Telegram-ботов</div>
              <div className="text-[11px] text-slate-400">Мгновенная отправка сигналов прямо в ваш Telegram</div>
            </div>
          </div>
        </div>

        {/* Plan Selection Cards */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div
            onClick={() => setSelectedPlan('PRO_ANALYST')}
            className={`p-4 rounded-2xl border cursor-pointer transition relative ${
              selectedPlan === 'PRO_ANALYST'
                ? 'bg-emerald-500/15 border-emerald-500/60 shadow-lg ring-1 ring-emerald-500/40'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300">ТАРИФ PRO</span>
              <CheckCircle2 className={`h-4 w-4 ${selectedPlan === 'PRO_ANALYST' ? 'text-emerald-400' : 'text-slate-600'}`} />
            </div>
            <div className="text-lg font-black text-white mt-1">590 ₽ <span className="text-xs font-normal text-slate-400">/ мес</span></div>
            <div className="text-[11px] text-slate-400 mt-1">Все 50 стратегий + 5 ботов + PWA</div>
          </div>

          <div
            onClick={() => setSelectedPlan('VIP_CLUB')}
            className={`p-4 rounded-2xl border cursor-pointer transition relative ${
              selectedPlan === 'VIP_CLUB'
                ? 'bg-amber-500/15 border-amber-500/60 shadow-lg ring-1 ring-amber-500/40'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">ТАРИФ VIP</span>
              <CheckCircle2 className={`h-4 w-4 ${selectedPlan === 'VIP_CLUB' ? 'text-amber-400' : 'text-slate-600'}`} />
            </div>
            <div className="text-lg font-black text-white mt-1">1 490 ₽ <span className="text-xs font-normal text-slate-400">/ мес</span></div>
            <div className="text-[11px] text-slate-400 mt-1">Максимальный доступ + 15 ботов</div>
          </div>
        </div>

        {/* Activate Button */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={handleActivate}
            disabled={isActivating}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 transition active:scale-95 disabled:opacity-50"
          >
            {isActivating ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Активация подписки...
              </span>
            ) : (
              <>
                <Crown className="h-4 w-4 text-slate-950 fill-slate-950" />
                <span>Активировать {selectedPlan === 'PRO_ANALYST' ? 'PRO' : 'VIP'} и войти в PWA</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onExitToBrowser}
            className="w-full py-2.5 text-xs text-slate-400 hover:text-white transition font-medium"
          >
            ← Продолжить в бесплатной браузерной версии (с ограничениями)
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="relative max-w-2xl w-full mx-auto text-center text-[11px] text-slate-500 pt-3 border-t border-slate-800">
        SportSignal AI • PWA Standalone Engine • Мгновенная активация без привязки карты в демо-режиме
      </div>
    </div>
  );
};
