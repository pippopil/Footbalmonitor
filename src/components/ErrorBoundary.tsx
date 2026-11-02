import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // If quota exceeded, automatically run cache eviction to free space immediately
    if (error?.name === 'QuotaExceededError' || error?.message?.includes('quota') || error?.message?.includes('exceeded the quota')) {
      try {
        localStorage.removeItem('footbalmonitor_live_accumulated_matches_v1');
        localStorage.removeItem('footbalmonitor_sent_signals_tracker');
        // Prune old prematch caches
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.startsWith('footbalmonitor_daily_prematch_cache_')) {
            localStorage.removeItem(k);
          }
        }
      } catch {}
    }
  }

  public handleReset = () => {
    // If it was a storage error, perform deep cleanup before retry
    if (this.state.error?.name === 'QuotaExceededError' || this.state.error?.message?.includes('quota')) {
      try {
        localStorage.removeItem('footbalmonitor_live_accumulated_matches_v1');
        localStorage.removeItem('footbalmonitor_sent_signals_tracker');
      } catch {}
    }
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      const isQuota =
        this.state.error?.name === 'QuotaExceededError' ||
        this.state.error?.message?.includes('quota') ||
        this.state.error?.message?.includes('exceeded the quota');

      return (
        <div className="p-6 m-4 bg-slate-900 border border-rose-500/40 rounded-2xl shadow-xl text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {isQuota
                ? 'Превышен лимит локальной памяти браузера (LocalStorage Quota)'
                : (this.props.fallbackTitle || 'Произошла непредвиденная ошибка в модуле')}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {isQuota
                ? 'Временные кэши логов и телеметрии автоматически очищены. Нажмите кнопку ниже для продолжения работы.'
                : 'Остальная часть системы продолжает работать автономно. Вы можете перезагрузить этот блок.'}
            </p>
            {this.state.error?.message && (
              <pre className="mt-3 p-2 bg-slate-950 rounded-lg text-[11px] text-rose-300 font-mono overflow-x-auto max-w-lg mx-auto text-left">
                {this.state.error.message}
              </pre>
            )}
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition active:scale-95 shadow-md"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{isQuota ? 'Восстановить работу' : 'Попробовать снова'}</span>
            </button>
            {isQuota && (
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('footbalmonitor_live_accumulated_matches_v1');
                    localStorage.removeItem('footbalmonitor_sent_signals_tracker');
                    window.location.reload();
                  } catch {}
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition active:scale-95"
              >
                Перезагрузить страницу
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
