import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, CheckCircle2, AlertCircle, Sparkles, ExternalLink, X, Smartphone, ArrowUpCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  CURRENT_APP_VERSION,
  checkAppUpdate,
  AppReleaseInfo,
  startInAppUpdate,
  performOtaReload,
  DIRECT_APK_DOWNLOAD_URL,
} from '../services/appUpdateService';

interface InAppUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateAvailable?: (release: AppReleaseInfo) => void;
}

export const InAppUpdateModal: React.FC<InAppUpdateModalProps> = ({
  isOpen,
  onClose,
  onUpdateAvailable,
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState<boolean>(false);
  const [release, setRelease] = useState<AppReleaseInfo | null>(null);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [checkedAt, setCheckedAt] = useState<string>('');

  const loadUpdateInfo = async () => {
    setLoading(true);
    const info = await checkAppUpdate();
    setRelease(info);
    setCheckedAt(new Date().toLocaleTimeString('ru-RU'));
    setLoading(false);

    if (info && info.isNewer && onUpdateAvailable) {
      onUpdateAvailable(info);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUpdateInfo();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownload = () => {
    setDownloading(true);
    startInAppUpdate(release?.apkDownloadUrl);
    setTimeout(() => {
      setDownloading(false);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ArrowUpCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">{t('updateCenterTitle')}</h3>
              <p className="text-[11px] text-slate-400">{t('updateCenterDesc')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Version Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400">{t('currentVersionLabel')}</span>
              <div className="text-base font-extrabold text-slate-200 mt-0.5">v{CURRENT_APP_VERSION}</div>
              <span className="text-[10px] text-slate-500">{t('versionInstalledDesc')}</span>
            </div>

            <div
              className={`p-3 rounded-xl border ${
                release?.isNewer
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-slate-800/50 border-slate-700/60'
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-slate-400">{t('latestReleaseLabel')}</span>
              <div className="text-base font-extrabold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
                ) : (
                  <>v{release?.version || CURRENT_APP_VERSION}</>
                )}
                {release?.isNewer && (
                  <span className="px-1.5 py-0.2 text-[9px] bg-emerald-500 text-black font-extrabold rounded-full">
                    NEW
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500">{t('versionOnServerDesc')}</span>
            </div>
          </div>

          {/* Update Status Banner */}
          {loading ? (
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-300">
              <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
              <span>{t('checkingUpdatesText')}</span>
            </div>
          ) : release?.isNewer ? (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                <Sparkles className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{t('updateAvailableBanner', { name: release.name })}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {t('updateReadyInstallDesc')}
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold text-slate-200">{t('appUpToDateBanner')}</span>
                {checkedAt && (
                  <div className="text-[10px] text-slate-500">Checked: {checkedAt}</div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleDownload}
              disabled={loading || downloading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Loading APK...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>
                    {release?.isNewer ? `⚡ ${t('btnDownloadApkDirect')}` : `📥 ${t('btnDownloadApkDirect')}`}
                  </span>
                </>
              )}
            </button>

            <button
              onClick={performOtaReload}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition border border-slate-700 flex items-center justify-center gap-2"
              title="OTA"
            >
              <RefreshCw className="h-3.5 w-3.5 text-cyan-400" />
              <span>🔄 {t('btnOtaSyncLive')}</span>
            </button>
          </div>

          {/* Release Notes */}
          {release?.body && (
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Что нового в версии:
              </span>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 leading-relaxed font-mono max-h-36 overflow-y-auto whitespace-pre-wrap">
                {release.body}
              </div>
            </div>
          )}

          {/* Direct link info */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <a
              href={release?.htmlUrl || `https://github.com/pippopil/WebFootbalFiltr/releases`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-emerald-400 transition"
            >
              <span>Все релизы на GitHub</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <button
              onClick={loadUpdateInfo}
              disabled={loading}
              className="inline-flex items-center gap-1 hover:text-slate-200 transition text-[11px]"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Проверить снова</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
