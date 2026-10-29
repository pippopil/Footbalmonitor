/**
 * Centralized API client with safe JSON parsing and Android WebView origin bridge.
 * Prevents "Failed to execute 'json' on 'Response': Unexpected end of JSON input" errors.
 */

// Production server backend URL for standalone Android APK builds
export const REMOTE_API_SERVER = 'https://ais-pre-tf6cpzwar4yxolhgeymhaa-553599366768.us-east1.run.app';

/**
 * Determine if running inside Android WebView local assets
 */
export function isRunningInAndroidLocal(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'appassets.androidplatform.net' || window.location.protocol === 'file:';
}

/**
 * Resolve full API endpoint URL
 */
export function resolveApiUrl(path: string): string {
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  // If already full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // If in Android local assets, route API calls to the live remote server
  if (isRunningInAndroidLocal()) {
    return `${REMOTE_API_SERVER}${path}`;
  }

  // Otherwise in regular web/PWA browser, use relative path
  return path;
}

export interface SafeApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  status: number;
}

/**
 * Safely fetch and parse JSON, handling empty bodies, 204s, and HTML error pages.
 */
export async function safeFetchJson<T = any>(
  inputUrl: string,
  init?: RequestInit
): Promise<SafeApiResponse<T>> {
  const fullUrl = resolveApiUrl(inputUrl);

  try {
    const res = await fetch(fullUrl, {
      ...init,
      headers: {
        Accept: 'application/json, text/plain, */*',
        ...(init?.headers || {}),
      },
    });

    // Check for HTTP 204 No Content
    if (res.status === 204) {
      return { ok: true, data: undefined, status: 204 };
    }

    const text = await res.text();
    if (!text || !text.trim()) {
      if (res.ok) {
        return { ok: true, data: {} as T, status: res.status };
      }
      return {
        ok: false,
        error: `Сервер вернул пустой ответ (HTTP ${res.status})`,
        status: res.status,
      };
    }

    // Try parsing JSON
    try {
      const data = JSON.parse(text);
      if (!res.ok) {
        return {
          ok: false,
          data,
          error: data?.error || data?.message || `Ошибка сервера (HTTP ${res.status})`,
          status: res.status,
        };
      }
      return { ok: true, data, status: res.status };
    } catch {
      // Non-JSON response (e.g. HTML 404, 502 Bad Gateway)
      const sanitized = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150);
      return {
        ok: false,
        error: sanitized || `Ответ сервера не содержит данных JSON (HTTP ${res.status})`,
        status: res.status,
      };
    }
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Сетевая ошибка при обращении к серверу',
      status: 0,
    };
  }
}
