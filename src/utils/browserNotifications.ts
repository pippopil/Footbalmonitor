/**
 * Web Push Notification API utility
 * Dispatches real native browser notifications when live filter signals trigger.
 */

export interface BrowserPushOptions {
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  silent?: boolean;
}

export function isBrowserNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getBrowserNotificationPermission(): NotificationPermission {
  if (!isBrowserNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (!isBrowserNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return false;
  }
}

export function sendBrowserPushNotification(
  title: string,
  options: BrowserPushOptions
): Notification | null {
  if (!isBrowserNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const notification = new Notification(title, {
      body: options.body,
      icon:
        options.icon ||
        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2310b981"><circle cx="12" cy="12" r="10"/><path d="m13 2-2 10h4l-2 10 7-12h-4l3-8z" fill="%23ffffff"/></svg>',
      badge: options.badge || '/favicon.ico',
      tag: options.tag || `signal-${Date.now()}`,
      silent: options.silent ?? false,
      data: options.data,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (err) {
    console.error('Failed to dispatch browser notification:', err);
    return null;
  }
}
