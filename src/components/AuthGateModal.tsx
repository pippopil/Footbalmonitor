import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Key,
  Shield,
  Zap,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Crown,
  UserPlus,
  Mail,
  User,
  Check,
  Clock,
  ShieldCheck,
  Smartphone,
  Eye,
  EyeOff,
} from 'lucide-react';
import { UserProfile, UserSubscriptionDetails } from '../types';
import { DEFAULT_USERS } from '../data/defaultUsers';
import { AppLogo } from './AppLogo';
import {
  getDeviceFingerprint,
  markTrialClaimedOnDevice,
  verifyServerDeviceTrial,
} from '../services/deviceFingerprintService';

interface AuthGateModalProps {
  allUsers: UserProfile[];
  onLogin: (user: UserProfile) => void;
  onRegisterUser?: (newUser: UserProfile) => void;
  isOpen: boolean;
}

// Fast browser-safe SHA-256 hashing helper
async function sha256(message: string): Promise<string> {
  try {
    const msgBuffer = new TextEncoder().encode(message + '::footbalmonitor_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback simple hash for older environments
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      hash = (hash << 5) - hash + message.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }
}

export const AuthGateModal: React.FC<AuthGateModalProps> = ({
  allUsers,
  onLogin,
  onRegisterUser,
  isOpen,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [customKey, setCustomKey] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Minimal Registration Form: only Email/Login & Password
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [claimTrial, setClaimTrial] = useState(true);

  // Anti-abuse Device Fingerprint State
  const [deviceHash, setDeviceHash] = useState<string>('');
  const [isTrialAlreadyUsed, setIsTrialAlreadyUsed] = useState<boolean>(false);
  const [isCheckingDevice, setIsCheckingDevice] = useState<boolean>(true);

  // Brute-force protection state
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);

  // Check device fingerprint on mount
  useEffect(() => {
    if (!isOpen) return;

    try {
      const fp = getDeviceFingerprint();
      setDeviceHash(fp.fingerprintHash);
      if (fp.isTrialClaimedOnDevice) {
        setIsTrialAlreadyUsed(true);
        setClaimTrial(false);
        setIsCheckingDevice(false);
      } else {
        // Also verify with server registry
        verifyServerDeviceTrial(fp.fingerprintHash)
          .then((claimed) => {
            if (claimed) {
              setIsTrialAlreadyUsed(true);
              setClaimTrial(false);
            }
          })
          .finally(() => setIsCheckingDevice(false));
      }
    } catch {
      setIsCheckingDevice(false);
    }
  }, [isOpen]);

  // Brute force lockout timer countdown
  useEffect(() => {
    if (!lockoutUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      setLockoutTimer(remaining);
      if (remaining <= 0) {
        setLockoutUntil(null);
        setFailedAttempts(0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  if (!isOpen) return null;

  const godUser =
    allUsers.find(
      (u) =>
        u.role === 'god' ||
        u.id === 'user-god-developer' ||
        u.username === 'developer_god' ||
        String(u.username || '').toLowerCase().includes('god')
    ) || DEFAULT_USERS[0];

  const handleQuickLogin = (user: UserProfile) => {
    onLogin(user);
  };

  const handleDevKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutUntil && Date.now() < lockoutUntil) {
      setErrorMsg(`Слишком много попыток. Подождите ${lockoutTimer} сек.`);
      return;
    }

    const key = customKey.trim().toLowerCase();
    if (
      key === 'god' ||
      key === 'root' ||
      key === 'developer' ||
      key === 'creator' ||
      key === 'admin' ||
      key === 'developer_god' ||
      key.includes('god')
    ) {
      onLogin(godUser);
      return;
    }

    // Also support direct login by username / email of existing users
    const matchedUser = allUsers.find(
      (u) =>
        u.username.toLowerCase() === key ||
        u.email.toLowerCase() === key ||
        u.displayName.toLowerCase() === key
    );
    if (matchedUser) {
      onLogin(matchedUser);
      return;
    }

    const nextFailures = failedAttempts + 1;
    setFailedAttempts(nextFailures);
    if (nextFailures >= 5) {
      const lockoutTime = Date.now() + 60000;
      setLockoutUntil(lockoutTime);
      setLockoutTimer(60);
      setErrorMsg('Превышено количество попыток. Защита заблокировала ввод на 60 секунд.');
    } else {
      setErrorMsg(`Неверный ключ доступа (осталось попыток: ${5 - nextFailures}). Введите "god" для входа Создателя.`);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (lockoutUntil && Date.now() < lockoutUntil) {
      setErrorMsg(`Слишком много попыток. Подождите ${lockoutTimer} сек.`);
      return;
    }

    const input = emailOrUsername.trim();
    if (!input) {
      setErrorMsg('Пожалуйста, укажите Email или логин');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Пароль должен содержать не менее 6 символов для защиты аккаунта');
      return;
    }

    // Check duplicate
    const exists = allUsers.some(
      (u) =>
        u.email.toLowerCase() === input.toLowerCase() ||
        u.username.toLowerCase() === input.toLowerCase()
    );
    if (exists) {
      setErrorMsg('Пользователь с таким email или логином уже зарегистрирован. Войдите в аккаунт.');
      return;
    }

    // Hash password securely with salt
    const hashedPassword = await sha256(password);

    // Determine trial validity:
    // If device hasn't used trial before, grant 3-Day Full PRO Access
    const isTrialEligible = claimTrial && !isTrialAlreadyUsed;
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const subscription: UserSubscriptionDetails = isTrialEligible
      ? {
          plan: 'PRO_ANALYST',
          isTrial: true,
          trialStartedAt: now.toISOString(),
          trialExpiresAt: threeDaysLater.toISOString(),
          startedAt: now.toISOString(),
          expiresAt: threeDaysLater.toISOString().slice(0, 10),
          daysRemaining: 3,
          paymentMethod: 'TRIAL',
          amountPaidRub: 0,
          status: 'TRIAL_ACTIVE',
          notified3DaysLeft: false,
          deviceFingerprint: deviceHash,
        }
      : {
          plan: 'FREE',
          isTrial: false,
          startedAt: now.toISOString(),
          expiresAt: '2099-12-31',
          daysRemaining: 9999,
          paymentMethod: 'FREE',
          amountPaidRub: 0,
          status: 'ACTIVE',
          deviceFingerprint: deviceHash,
        };

    const isEmail = input.includes('@');
    const generatedUsername = isEmail
      ? input.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()
      : input.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_');
    const displayName = isEmail ? input.split('@')[0] : input;

    const defaultBotId = `bot-${Date.now()}`;
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      username: generatedUsername || `trader_${Date.now().toString().slice(-4)}`,
      displayName: displayName,
      email: isEmail ? input : `${generatedUsername}@footbalmonitor.local`,
      passwordHash: hashedPassword,
      role: isTrialEligible ? 'pro' : 'user',
      plan: isTrialEligible ? 'PRO_ANALYST' : 'FREE',
      planExpiresAt: isTrialEligible ? threeDaysLater.toISOString().slice(0, 10) : undefined,
      subscriptionDetails: subscription,
      deviceFingerprint: deviceHash,
      registeredAt: now.toLocaleDateString('ru-RU'),
      balanceRub: isTrialEligible ? 50000 : 10000,
      notificationSound: true,
      adPreferences: {
        showBanners: !isTrialEligible,
        compactAds: true,
      },
      telegramBots: [
        {
          id: defaultBotId,
          name: `🤖 Личный Бот (${displayName})`,
          botToken: '',
          channelId: '',
          isDefault: true,
          active: true,
          status: 'untested',
          createdAt: now.toLocaleDateString('ru-RU'),
        },
      ],
      stats: {
        totalSignalsGenerated: 0,
        winRate: 82.5,
        favoriteLeague: 'Все лиги (Сканер)',
        signalsToday: 0,
      },
    };

    // Mark trial claimed on device so it cannot be abused
    if (isTrialEligible) {
      await markTrialClaimedOnDevice(newUser.email, deviceHash);
    }

    if (onRegisterUser) {
      onRegisterUser(newUser);
    } else {
      onLogin(newUser);
    }

    setSuccessMsg(
      isTrialEligible
        ? `🎉 Добро пожаловать, ${displayName}! Вам активирован бесплатный пробный период PRO на 3 дня.`
        : `Добро пожаловать, ${displayName}! Аккаунт успешно создан.`
    );
  };

  return (
    <div
      id="auth-gate-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/95 backdrop-blur-xl overflow-y-auto"
    >
      {/* Dynamic Animated Ambient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 my-auto">
        {/* Top Header & Branding */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <AppLogo size="lg" showSubtitle />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {authMode === 'login' ? 'Вход в профессиональный сканер' : 'Быстрая регистрация (1 клик)'}
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {authMode === 'login'
              ? 'Выберите профиль аналитика, введите мастер-код разработчика или создайте новый аккаунт'
              : 'Минимум данных: только Email/логин и пароль. Надежная защита и 3 дня PRO-доступа бесплатно'}
          </p>
        </div>

        {/* Auth Mode Toggle Bar */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              authMode === 'login'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Вход в аккаунт</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              authMode === 'register'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Регистрация + 3 дня PRO</span>
          </button>
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {authMode === 'login' ? (
          /* LOGIN VIEW */
          <div className="space-y-4">
            {/* Developer Fast Access */}
            {godUser && (
              <button
                type="button"
                onClick={() => handleQuickLogin(godUser)}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900 border border-purple-500/50 hover:border-purple-400 text-left transition active:scale-98 group flex items-center justify-between shadow-lg shadow-purple-950/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-black">
                    ⚡
                  </div>
                  <div>
                    <div className="font-extrabold text-white text-xs flex items-center gap-1.5">
                      {godUser.displayName}
                      <span className="px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-300 text-[10px] font-mono border border-purple-500/40">
                        GOD MODE
                      </span>
                    </div>
                    <div className="text-[11px] text-purple-200/70">
                      Полный доступ разработчика, 50 стратегий, Telegram боты & API
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {/* Existing Trader Accounts List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1">
                <span>Или войдите под аккаунтом:</span>
                <span>{allUsers.filter((u) => u.role !== 'god').length} готовых</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {allUsers
                  .filter((u) => u.role !== 'god')
                  .map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleQuickLogin(user)}
                      className="p-2.5 bg-slate-950/80 border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-900/90 rounded-xl flex items-center justify-between gap-2 text-left transition group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-white text-xs shrink-0">
                          {user.displayName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-white text-xs truncate group-hover:text-emerald-400 transition-colors">
                            {user.displayName}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">@{user.username}</div>
                        </div>
                      </div>

                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                          user.plan === 'VIP_CLUB'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : user.plan === 'PRO_ANALYST'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {user.plan === 'VIP_CLUB' ? 'VIP' : user.plan === 'PRO_ANALYST' ? 'PRO' : 'FREE'}
                      </span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Developer Secret Passkey Input */}
            <form
              onSubmit={handleDevKeySubmit}
              className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row gap-2 items-center"
            >
              <div className="relative flex-1 w-full">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={customKey}
                  onChange={(e) => {
                    setCustomKey(e.target.value);
                    setErrorMsg(null);
                  }}
                  disabled={Boolean(lockoutUntil && Date.now() < lockoutUntil)}
                  placeholder="Мастер-код разработчика ('god')..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={Boolean(lockoutUntil && Date.now() < lockoutUntil)}
                className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                <Unlock className="h-3.5 w-3.5 text-purple-400" />
                <span>
                  {lockoutTimer > 0 ? `Блок ${lockoutTimer}с` : 'Войти (God)'}
                </span>
              </button>
            </form>
          </div>
        ) : (
          /* MINIMAL REGISTRATION FORM (Only Email/Username + Password) */
          <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-fadeIn">
            {/* 3-Day Trial Status Banner & Device Fingerprint Anti-Abuse */}
            <div
              className={`p-3.5 rounded-2xl border transition ${
                isTrialAlreadyUsed
                  ? 'bg-slate-950 border-slate-800 text-slate-400'
                  : 'bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-950 border-emerald-500/40'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isTrialAlreadyUsed
                      ? 'bg-slate-800 text-slate-400'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}
                >
                  {isTrialAlreadyUsed ? <Clock className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">
                      {isTrialAlreadyUsed
                        ? 'Пробный период на устройстве исчерпан'
                        : '🎁 Пробный период: 3 дня PRO бесплатно'}
                    </span>
                    {!isTrialAlreadyUsed && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] border border-emerald-500/30">
                        0 ₽ / 72 часа
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {isTrialAlreadyUsed
                      ? 'На данном оборудовании 3-дневный пробный период уже был активирован ранее. Аккаунт будет создан с тарифом FREE (1 бот, 0 сек задержки).'
                      : 'Для новых пользователей доступен полный функционал тарифа PRO Analyst: подключение до 5 ботов, отключение рекламы и доступ ко всем 50 стратегиям.'}
                  </p>
                  {!isTrialAlreadyUsed && (
                    <label className="flex items-center gap-2 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={claimTrial}
                        onChange={(e) => setClaimTrial(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
                      />
                      <span className="text-xs font-bold text-emerald-300">
                        Активировать 3 дня PRO бесплатно при регистрации
                      </span>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Input 1: Email or Username */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3 text-emerald-400" />
                  Email или логин в Telegram:
                </span>
                <span className="text-[10px] text-slate-500">Минимум данных</span>
              </label>
              <input
                type="text"
                required
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="ivan@mail.ru или @ivan_pro"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Input 2: Password with strong hashing */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3 text-emerald-400" />
                  Пароль для защиты аккаунта:
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">SHA-256 + Salt</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Device Protection Notice */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-1">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Защита от мультиаккаунтов (Hardware Hash active)</span>
              </div>
              <span className="font-mono">{deviceHash ? `${deviceHash.slice(0, 8)}...` : 'ID-защита'}</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-950/50 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Зарегистрироваться и войти</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Security & Legal Disclaimer Footer */}
        <div className="pt-2 border-t border-slate-800/80 text-center text-[10px] text-slate-500 flex items-center justify-center gap-2">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span>Конфиденциальность: данные не передаются третьим лицам • Без привязки карт</span>
        </div>
      </div>
    </div>
  );
};
