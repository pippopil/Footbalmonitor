/**
 * Web Audio API Synthesizer
 * Provides crystal-clear audio alerts without external MP3 dependencies.
 */

export type AlertSoundType = 'whistle' | 'gong' | 'bell' | 'ping';

export interface SoundProfileInfo {
  id: AlertSoundType;
  name: string;
  desc: string;
  icon: string;
}

export const ALERT_SOUND_PROFILES: SoundProfileInfo[] = [
  {
    id: 'whistle',
    name: '⚽ Спортивный свисток',
    desc: 'Судейский свисток с резким акцентом',
    icon: '🎺',
  },
  {
    id: 'gong',
    name: '🥋 Глубокий гонг',
    desc: 'Резонансный плотный удар восточного гонга',
    icon: '🥋',
  },
  {
    id: 'bell',
    name: '🔔 Кристальный колокол',
    desc: 'Чистый колокольный звон 1046Hz',
    icon: '🔔',
  },
  {
    id: 'ping',
    name: '⚡ Радарный пинг',
    desc: 'Космический электронный алерт',
    icon: '⚡',
  },
];

let globalAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!globalAudioCtx || globalAudioCtx.state === 'closed') {
    globalAudioCtx = new AudioCtx();
  }
  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx;
}

/**
 * Play a specific sound profile via Web Audio API synthesis
 */
export function playAlertSound(type: AlertSoundType = 'whistle', volume = 0.25): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(Math.min(1, Math.max(0, volume)), now);
  masterGain.connect(ctx.destination);

  switch (type) {
    case 'whistle': {
      // Dual-tone whistle pulse with modulation
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      // Fundamental and harmonic
      osc1.frequency.setValueAtTime(2600, now);
      osc2.frequency.setValueAtTime(2850, now);

      // Tremolo effect for realistic air blowing
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(32, now);
      lfoGain.gain.setValueAtTime(80, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.04);
      gain.gain.setValueAtTime(0.35, now + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(masterGain);

      lfo.start(now);
      osc1.start(now);
      osc2.start(now);

      lfo.stop(now + 0.4);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
      break;
    }

    case 'gong': {
      // Deep resonant gong with low fundamental and metallic harmonics
      const freqs = [180, 240, 310, 480];
      const gains = [0.45, 0.25, 0.15, 0.08];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(gains[idx], now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        osc.connect(g);
        g.connect(masterGain);

        osc.start(now);
        osc.stop(now + 1.25);
      });
      break;
    }

    case 'bell': {
      // Crystal clear chime: high C (1046Hz) + high E (1318Hz)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const g1 = ctx.createGain();
      const g2 = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(1046.5, now);
      osc2.frequency.setValueAtTime(1318.5, now + 0.06);

      g1.gain.setValueAtTime(0.3, now);
      g1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      g2.gain.setValueAtTime(0.35, now + 0.06);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc1.connect(g1);
      osc2.connect(g2);
      g1.connect(masterGain);
      g2.connect(masterGain);

      osc1.start(now);
      osc2.start(now + 0.06);

      osc1.stop(now + 0.65);
      osc2.stop(now + 0.85);
      break;
    }

    case 'ping':
    default: {
      // Frequency sweep digital ping
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.14);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.42);
      break;
    }
  }
}
