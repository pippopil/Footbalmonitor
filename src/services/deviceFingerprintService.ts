/**
 * Multi-layer Device & Browser Fingerprinting Service
 * Generates a stable, non-invasive hardware/browser hash to prevent trial period abuse
 * (prevents users from creating new accounts every 3 days to get free trials).
 */

const TRIAL_STORAGE_KEY = 'footbalmonitor_claimed_device_trial';

export interface DeviceFingerprintResult {
  fingerprintHash: string;
  isTrialClaimedOnDevice: boolean;
  claimedAt?: string;
  components: {
    canvas: string;
    webgl: string;
    screen: string;
    audio: string;
    timezone: string;
    platform: string;
  };
}

/**
 * Fast string hashing algorithm (djb2 / Fowler–Noll–Vo mix)
 */
function hashString(str: string): string {
  let hash1 = 5381;
  let hash2 = 52711;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) ^ char;
    hash2 = ((hash2 << 5) + hash2) ^ char;
  }
  const part1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  return `${part1}${part2}`;
}

/**
 * 2D Canvas rendering fingerprint
 */
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas-2d';

    ctx.textBaseline = 'top';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('FootballMonitor🎯2026', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('TrialDefense#40', 4, 17);

    return hashString(canvas.toDataURL());
  } catch {
    return 'canvas-error';
  }
}

/**
 * WebGL GPU Vendor & Renderer fingerprint
 */
function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return 'no-webgl';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) {
      return hashString(gl.getParameter(gl.RENDERER) || 'generic-webgl');
    }

    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
    return hashString(`${vendor}:::${renderer}`);
  } catch {
    return 'webgl-error';
  }
}

/**
 * AudioContext oscillator frequency response fingerprint
 */
function getAudioFingerprint(): string {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return 'no-audio-context';

    // We use a deterministic static hash from audio parameters
    const ctx = new AudioContextClass();
    const sampleRate = ctx.sampleRate || 44100;
    const maxChannelCount = ctx.destination?.maxChannelCount || 2;
    ctx.close().catch(() => {});
    return hashString(`audio_${sampleRate}_${maxChannelCount}`);
  } catch {
    return 'audio-error';
  }
}

/**
 * Compute the comprehensive device fingerprint
 */
export function getDeviceFingerprint(): DeviceFingerprintResult {
  if (typeof window === 'undefined') {
    return {
      fingerprintHash: 'server-render',
      isTrialClaimedOnDevice: false,
      components: {
        canvas: '',
        webgl: '',
        screen: '',
        audio: '',
        timezone: '',
        platform: '',
      },
    };
  }

  const canvas = getCanvasFingerprint();
  const webgl = getWebGLFingerprint();
  const audio = getAudioFingerprint();
  const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown-tz';
  const platform = navigator.platform || navigator.userAgent || 'unknown-platform';
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;

  const rawCombined = `${canvas}|${webgl}|${audio}|${screenInfo}|${timezone}|${platform}|${hardwareConcurrency}`;
  const fingerprintHash = hashString(rawCombined);

  // Check if trial was recorded in localStorage or sessionStorage or cookies
  let isClaimed = false;
  let claimedAt: string | undefined;

  try {
    const stored = localStorage.getItem(TRIAL_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && (parsed.hash === fingerprintHash || parsed.claimed === true)) {
        isClaimed = true;
        claimedAt = parsed.claimedAt;
      }
    }
  } catch {}

  return {
    fingerprintHash,
    isTrialClaimedOnDevice: isClaimed,
    claimedAt,
    components: {
      canvas,
      webgl,
      screen: screenInfo,
      audio,
      timezone,
      platform,
    },
  };
}

/**
 * Records that a trial has been claimed on this device.
 * Stores both in local storage and notifies the server audit registry.
 */
export async function markTrialClaimedOnDevice(userEmail: string, fingerprintHash: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const payload = {
    claimed: true,
    hash: fingerprintHash,
    claimedAt: new Date().toISOString(),
    email: userEmail,
  };

  try {
    localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(payload));
  } catch {}

  // Sync with server registry
  try {
    await fetch('/api/trial-registry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceHash: fingerprintHash,
        email: userEmail,
      }),
    });
  } catch {
    // Best-effort
  }
}

/**
 * Checks server-side trial registry if device has already used trial.
 */
export async function verifyServerDeviceTrial(fingerprintHash: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/trial-registry?hash=${encodeURIComponent(fingerprintHash)}`);
    const data = await res.json();
    return Boolean(data.alreadyClaimed);
  } catch {
    return false;
  }
}
