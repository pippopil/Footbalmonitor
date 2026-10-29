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
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 m-4 bg-slate-900 border border-rose-500/40 rounded-2xl shadow-xl text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {this.props.fallbackTitle || 'Произошла непредвиденная ошибка в модуле'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Остальная часть системы продолжает работать автономно. Вы можете перезагрузить этот блок.
            </p>
            {this.state.error?.message && (
              <pre className="mt-3 p-2 bg-slate-950 rounded-lg text-[11px] text-rose-300 font-mono overflow-x-auto max-w-lg mx-auto text-left">
                {this.state.error.message}
              </pre>
            )}
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition active:scale-95 shadow-md"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Попробовать снова</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
