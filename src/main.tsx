import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { LanguageProvider } from './i18n/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Register PWA service worker safely (only on web http/https, never on file: or unsupported scheme)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

const rootElement = document.getElementById('root');
if (rootElement) {
  (window as any).__REACT_MOUNTED__ = true;
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary fallbackTitle="Ошибка запуска приложения SportSignal AI">
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}
