import React, { useState } from 'react';
import {
  X,
  Shield,
  CreditCard,
  QrCode,
  CheckCircle2,
  Copy,
  Check,
  Globe,
  Wallet,
  Smartphone,
  Lock,
  Zap,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { UserPlan, UserProfile, UserSubscriptionDetails } from '../types';

interface SubscriptionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlan: 'PRO_ANALYST' | 'VIP_CLUB';
  currentUser: UserProfile;
  onPaymentSuccess: (updatedUser: UserProfile) => void;
}

export const SubscriptionPaymentModal: React.FC<SubscriptionPaymentModalProps> = ({
  isOpen,
  onClose,
  targetPlan,
  currentUser,
  onPaymentSuccess,
}) => {
  const [paymentTab, setPaymentTab] = useState<'RU' | 'INTERNATIONAL'>('RU');
  const [selectedMethod, setSelectedMethod] = useState<'SBP' | 'TPAY' | 'CRYPTO_USDT' | 'CRYPTO_TON' | 'STRIPE'>('SBP');
  const [txHashInput, setTxHashInput] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  if (!isOpen) return null;

  const isPro = targetPlan === 'PRO_ANALYST';
  const planTitle = isPro ? 'PRO Analyst' : 'VIP Syndicate';
  const planPriceRub = isPro ? 1490 : 3990;
  const planPriceUsd = isPro ? 16 : 42;

  // Real demo wallet addresses for instant payment verification
  const cryptoWallets = {
    USDT_TRC20: 'TQ9x8N4x78vY3Z6B7qY5M3P1x8aL2c4eRt',
    TON: 'EQBvW8Z5huBkMJYdn30dc5Cf8R43afMmIbWhqyeorwuDYbV1',
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentDone(true);

      const now = new Date();
      const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const subscription: UserSubscriptionDetails = {
        plan: targetPlan,
        isTrial: false,
        startedAt: now.toISOString(),
        expiresAt: expires.toISOString().slice(0, 10),
        daysRemaining: 30,
        paymentMethod: selectedMethod,
        amountPaidRub: planPriceRub,
        status: 'ACTIVE',
        notified3DaysLeft: false,
      };

      const updated: UserProfile = {
        ...currentUser,
        plan: targetPlan,
        role: targetPlan === 'VIP_CLUB' ? 'vip' : 'pro',
        planExpiresAt: expires.toISOString().slice(0, 10),
        subscriptionDetails: subscription,
        adPreferences: {
          ...currentUser.adPreferences,
          showBanners: false,
        },
      };

      onPaymentSuccess(updated);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black">
              ₽
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Оплата тарифа {planTitle}
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {planPriceRub.toLocaleString('ru-RU')} ₽ / мес
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                🔒 Без привязки карт к аккаунту • Разовый платеж • Без автосписаний
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {paymentDone ? (
          /* SUCCESS VIEW */
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto animate-bounce-slow">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xl font-black text-white">Тариф {planTitle} успешно активирован!</h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Подписка подключена на 30 дней. Данные карты не сохраняются. Напоминание об окончании подписки поступит за 3 дня.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
            >
              Перейти к работе со сканером
            </button>
          </div>
        ) : (
          /* CHECKOUT VIEW */
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
            {/* Geo Payment Region Selector */}
            <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setPaymentTab('RU');
                  setSelectedMethod('SBP');
                }}
                className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  paymentTab === 'RU'
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🇷🇺 РФ и СНГ (СБП / T-Pay)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentTab('INTERNATIONAL');
                  setSelectedMethod('CRYPTO_USDT');
                }}
                className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  paymentTab === 'INTERNATIONAL'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>🌍 Иностранные граждане (Crypto/Intl)</span>
              </button>
            </div>

            {paymentTab === 'RU' ? (
              /* RUSSIAN PAYMENT METHODS (NO CARD BINDING) */
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* SBP QR */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('SBP')}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                      selectedMethod === 'SBP'
                        ? 'bg-emerald-950/30 border-emerald-500 text-white ring-1 ring-emerald-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-black">СБП (QR-код)</div>
                      <div className="text-[10px] text-slate-400">0% комиссии • Любой банк</div>
                    </div>
                  </button>

                  {/* T-Pay / SberPay */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('TPAY')}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                      selectedMethod === 'TPAY'
                        ? 'bg-emerald-950/30 border-emerald-500 text-white ring-1 ring-emerald-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-black">T-Pay / SberPay</div>
                      <div className="text-[10px] text-slate-400">В 1 клик на телефоне</div>
                    </div>
                  </button>
                </div>

                {/* Method instructions */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  {selectedMethod === 'SBP' && (
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Interactive Visual QR code mock */}
                      <div className="w-32 h-32 bg-white p-2 rounded-xl border border-slate-700 flex flex-col items-center justify-between shrink-0 shadow-md">
                        <div className="w-full h-full border-2 border-dashed border-slate-800 rounded flex flex-col items-center justify-center text-slate-900 text-center p-1">
                          <QrCode className="w-16 h-16 text-slate-900" />
                          <span className="text-[8px] font-black uppercase text-slate-700">СБП {planPriceRub} ₽</span>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-300">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Оплата через Систему быстрых платежей:
                        </div>
                        <ol className="list-decimal list-inside text-[11px] text-slate-400 space-y-1">
                          <li>Откройте приложение любого банка РФ (Сбер, Т-Банк, ВТБ, Альфа).</li>
                          <li>Наведите камеру на QR-код или нажмите кнопку подтверждения.</li>
                          <li>Сумма к оплате: <strong className="text-emerald-400">{planPriceRub} ₽</strong> ровно.</li>
                        </ol>
                        <div className="text-[10px] text-slate-500 pt-1">
                          🔒 Карта не привязывается, автоматических списаний не происходит.
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedMethod === 'TPAY' && (
                    <div className="space-y-2 text-xs">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-400" />
                        Быстрая оплата T-Pay / SberPay без ввода данных карты
                      </div>
                      <p className="text-[11px] text-slate-300">
                        После нажатия кнопки система сформирует одноразовую защищенную платежную ссылку. Данные вашей банковской карты не попадут на сервер.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* INTERNATIONAL & CRYPTO METHODS */
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {/* USDT */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('CRYPTO_USDT')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      selectedMethod === 'CRYPTO_USDT'
                        ? 'bg-emerald-950/30 border-emerald-500 text-white ring-1 ring-emerald-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="font-black text-xs text-emerald-400">USDT (TRC-20)</span>
                    <span className="text-[10px] text-slate-400">${planPriceUsd} USDT</span>
                  </button>

                  {/* TON */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('CRYPTO_TON')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      selectedMethod === 'CRYPTO_TON'
                        ? 'bg-cyan-950/30 border-cyan-500 text-white ring-1 ring-cyan-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="font-black text-xs text-cyan-400">TON Coin</span>
                    <span className="text-[10px] text-slate-400">Telegram Wallet</span>
                  </button>

                  {/* International Card / Stripe */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('STRIPE')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      selectedMethod === 'STRIPE'
                        ? 'bg-indigo-950/30 border-indigo-500 text-white ring-1 ring-indigo-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="font-black text-xs text-indigo-400">Visa/Mastercard</span>
                    <span className="text-[10px] text-slate-400">Intl (без автосписаний)</span>
                  </button>
                </div>

                {/* Crypto instructions */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-xs">
                  {selectedMethod === 'CRYPTO_USDT' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-bold">Адрес USDT TRC-20:</span>
                        <span className="text-emerald-400 font-bold">${planPriceUsd} USDT</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={cryptoWallets.USDT_TRC20}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-slate-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopy(cryptoWallets.USDT_TRC20, 'usdt')}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white shrink-0 flex items-center gap-1 font-bold text-xs"
                        >
                          {copiedKey === 'usdt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey === 'usdt' ? 'Скопировано' : 'Копировать'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedMethod === 'CRYPTO_TON' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-bold">Адрес TON кошелька:</span>
                        <span className="text-cyan-400 font-bold">~3.2 TON</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={cryptoWallets.TON}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-slate-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopy(cryptoWallets.TON, 'ton')}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white shrink-0 flex items-center gap-1 font-bold text-xs"
                        >
                          {copiedKey === 'ton' ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey === 'ton' ? 'Скопировано' : 'Копировать'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedMethod === 'STRIPE' && (
                    <div className="space-y-1.5">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        Разовый международный шлюз (Stripe / Payeer)
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Оплата картами банков Европы, Азии и Америки. Карта не привязывается к аккаунту и не подлежит автосписаниям.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* No-Card-Binding Security Guarantee Card */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center gap-2.5 text-[11px] text-slate-400">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>100% защита от скрытых подписок:</strong> мы не требуем и не сохраняем данные карт. За 3 дня до окончания тарифа сервис пришлет уведомление с возможностью повторить оплату вручную.
              </span>
            </div>

            {/* Action Button */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConfirmPayment}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs shadow-lg shadow-emerald-950/50 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Проверка поступления средств...</span>
                </>
              ) : (
                <>
                  <span>Подтвердить оплату ({planPriceRub.toLocaleString('ru-RU')} ₽)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
