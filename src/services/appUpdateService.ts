/**
 * In-App Application Update Service
 * Checks GitHub Releases for new APK versions and provides in-app one-click update capabilities.
 */

export const CURRENT_APP_VERSION = '1.0.26';
export const GITHUB_REPO = 'pippopil/WebFootbalFiltr';
export const GITHUB_RELEASES_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
export const DIRECT_APK_DOWNLOAD_URL = `https://github.com/${GITHUB_REPO}/releases/latest/download/SportSignal-latest.apk`;

export interface AppReleaseInfo {
  version: string;
  name: string;
  body: string;
  publishedAt: string;
  htmlUrl: string;
  apkDownloadUrl: string;
  isNewer: boolean;
}

/**
 * Compare semantic versions (e.g., '1.0.12' vs '1.0.13')
 */
export function isVersionNewer(remoteVersion: string, currentVersion: string): boolean {
  const cleanRemote = remoteVersion.replace(/^[vV]/, '').trim();
  const cleanCurrent = currentVersion.replace(/^[vV]/, '').trim();

  const remoteParts = cleanRemote.split('.').map((p) => parseInt(p, 10) || 0);
  const currentParts = cleanCurrent.split('.').map((p) => parseInt(p, 10) || 0);

  const len = Math.max(remoteParts.length, currentParts.length);
  for (let i = 0; i < len; i++) {
    const r = remoteParts[i] || 0;
    const c = currentParts[i] || 0;
    if (r > c) return true;
    if (r < c) return false;
  }
  return false;
}

/**
 * Check GitHub for latest release
 */
export async function checkAppUpdate(): Promise<AppReleaseInfo | null> {
  try {
    const res = await fetch(GITHUB_RELEASES_API, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!res.ok) {
      return null;
    }

    const release = await res.json();
    if (!release || !release.tag_name) {
      return null;
    }

    const remoteVersion = release.tag_name.replace(/^[vV]/, '');
    let apkDownloadUrl = DIRECT_APK_DOWNLOAD_URL;

    // Check if an .apk asset exists in the release
    if (Array.isArray(release.assets)) {
      const apkAsset = release.assets.find(
        (a: any) =>
          a.name && (a.name.endsWith('.apk') || a.content_type === 'application/vnd.android.package-archive')
      );
      if (apkAsset?.browser_download_url) {
        apkDownloadUrl = apkAsset.browser_download_url;
      }
    }

    const isNewer = isVersionNewer(remoteVersion, CURRENT_APP_VERSION);

    return {
      version: remoteVersion,
      name: release.name || `SportSignal AI v${remoteVersion}`,
      body: release.body || 'Исправления и улучшения производительности приложения.',
      publishedAt: release.published_at || new Date().toISOString(),
      htmlUrl: release.html_url || `https://github.com/${GITHUB_REPO}/releases`,
      apkDownloadUrl,
      isNewer,
    };
  } catch (err) {
    console.warn('Check update error:', err);
    return null;
  }
}

/**
 * Start APK download / install directly inside Android
 */
export function startInAppUpdate(apkUrl?: string): void {
  const downloadUrl = apkUrl || DIRECT_APK_DOWNLOAD_URL;

  // Try direct browser navigation so Android DownloadManager / APK installer picks it up
  if (typeof window !== 'undefined') {
    window.location.href = downloadUrl;
  }
}

/**
 * Perform Over-The-Air web reload without full APK reinstall
 */
export function performOtaReload(): void {
  if (typeof window !== 'undefined') {
    // Clear cache and reload
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) caches.delete(name);
      });
    }
    window.location.reload();
  }
}
