import React, { useState } from 'react';
import {
  Smartphone,
  Crown,
  X,
  CheckCircle2,
  Share,
  PlusSquare,
  Sparkles,
  Download,
  AlertCircle,
} from 'lucide-react';
import { promptPwaInstallation } from '../utils/pwaManager';
import { UserProfile, UserPlan } from '../types';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPaidUser: boolean;
  currentUser: UserProfile;
  onUpgradePlan: (plan: UserPlan) => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({
  isOpen,
  onClose,
  isPaidUser,
  currentUser,
  onUpgradePlan,
}) => {
  const [installStatus, setInstallStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    const outcome = await promptPwaInstallation();
    if (outcome === 'accepted') {
      setInstallStatus('Установка начата! Приложение добавлено на ваш главный экран.');
      setTimeout(onClose, 2500);
    } else if (outcome === 'dismissed') {
      setInstallStatus('Установка отклонена.');
    } else {
      setInstallStatus('Используйте меню браузера: «Установить приложение» или «На экран Домой».');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-slate-900 to-teal-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
          <Smartphone className="h-8 w-8" />
        </div>

        {/* Titles */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <Sparkles className="h-3 w-3" />
            Прогрессивное веб-приложение
          </div>
          <h3 className="text-xl font-black text-white">
            Установка PWA SportSignal AI
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isPaidUser
              ? 'Установите приложение на экран вашего смартфона или ПК для мгновенных пушей и полноэкранной работы.'
              : 'PWA-приложением могут пользоваться только подписчики с оплаченным тарифом PRO или VIP.'}
          </p>
        </div>

        {/* Content based on Paid Status */}
        {isPaidUser ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Подписка активна ({currentUser.plan})</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Вам доступен полный функционал: фоновые Web Push, автономный режим без браузерных панелей и мгновенные сигналы по всем 50 вшитым стратегиям.
              </p>
            </div>

            {/* Platform Instructions */}
            <div className="space-y-2 text-left text-xs">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>📱 iOS (iPhone / iPad):</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span>1. Нажмите иконку «Поделиться»</span>
                  <Share className="h-3 w-3 text-cyan-400 shrink-0" />
                  <span>в Safari</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span>2. Выберите пункт «На экран "Домой"»</span>
                  <PlusSquare className="h-3 w-3 text-emerald-400 shrink-0" />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>🤖 Android & Chrome:</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Нажмите кнопку ниже или выберите в меню «Установить приложение».
                </div>
              </div>
            </div>

            {installStatus && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs text-center font-bold">
                {installStatus}
              </div>
            )}

            <button
              type="button"
              onClick={handleNativeInstall}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>Установить PWA на устройство</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left space-y-2 text-xs">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <Crown className="h-4 w-4 text-amber-400" />
                <span>Требуется платная подписка</span>
              </div>
              <p className="text-amber-200/90 text-[11px] leading-relaxed">
                PWA приложения могут пользоваться только подписчики у которых оплачена подписка. Перейдите на тариф PRO или VIP, чтобы разблокировать доступ к мобильному приложению.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onUpgradePlan('PRO_ANALYST');
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition active:scale-95"
              >
                <Crown className="h-3.5 w-3.5 fill-slate-950" />
                <span>Оформить тариф PRO (590 ₽)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onUpgradePlan('VIP_CLUB');
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition active:scale-95"
              >
                <Crown className="h-3.5 w-3.5 fill-slate-950" />
                <span>Оформить тариф VIP (1 490 ₽)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
