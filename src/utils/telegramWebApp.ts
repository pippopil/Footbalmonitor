/**
 * Telegram WebApp (Mini App) Helper & Integration
 * Automatically detects and initializes when opened inside Telegram.
 */

export interface TelegramWebUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: {
          query_id?: string;
          user?: TelegramWebUser;
          auth_date?: string;
          hash?: string;
        };
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: Record<string, string>;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        isClosingConfirmationEnabled: boolean;
        BackButton: {
          isVisible: boolean;
          onClick(callback: () => void): void;
          offClick(callback: () => void): void;
          show(): void;
          hide(): void;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText(text: string): void;
          onClick(callback: () => void): void;
          offClick(callback: () => void): void;
          show(): void;
          hide(): void;
          enable(): void;
          disable(): void;
        };
        HapticFeedback: {
          impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
          notificationOccurred(type: 'error' | 'success' | 'warning'): void;
          selectionChanged(): void;
        };
        openLink(url: string, options?: { try_instant_view?: boolean }): void;
        openTelegramLink(url: string): void;
        shareToStory?(media_url: string, params?: any): void;
        ready(): void;
        expand(): void;
        close(): void;
        sendData(data: string): void;
      };
    };
  }
}

export function isRunningInTelegram(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.Telegram?.WebApp?.initData && window.Telegram.WebApp.initData.length > 0);
}

export function getTelegramUser(): TelegramWebUser | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
}

export function initTelegramWebApp(): void {
  if (typeof window === 'undefined') return;
  const tg = window.Telegram?.WebApp;
  if (!tg) return;

  try {
    tg.ready();
    tg.expand();
    // Set custom header and background styling to match dark theme
    if (tg.headerColor) tg.headerColor = '#020617';
    if (tg.backgroundColor) tg.backgroundColor = '#020617';
  } catch (err) {
    console.debug('Telegram WebApp init notice:', err);
  }
}

export function tgHaptic(
  type: 'impact' | 'notification' | 'selection',
  styleOrType: 'light' | 'medium' | 'heavy' | 'error' | 'success' | 'warning' = 'medium'
): void {
  if (typeof window === 'undefined') return;
  const haptic = window.Telegram?.WebApp?.HapticFeedback;
  if (!haptic) return;

  try {
    if (type === 'impact') {
      haptic.impactOccurred(styleOrType as any);
    } else if (type === 'notification') {
      haptic.notificationOccurred(styleOrType as any);
    } else if (type === 'selection') {
      haptic.selectionChanged();
    }
  } catch {}
}

export function openExternalUrl(url: string): void {
  if (typeof window === 'undefined') return;
  const tg = window.Telegram?.WebApp;
  if (tg && isRunningInTelegram()) {
    if (url.startsWith('https://t.me/')) {
      tg.openTelegramLink(url);
    } else {
      tg.openLink(url);
    }
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
