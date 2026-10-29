// src/services/voiceAlertAnnouncer.ts
// Live Multilingual Voice & Audio Announcer for SportSignal AI

import { Language } from '../i18n/translations';

export interface VoiceAlertPayload {
  strategyName: string;
  homeTeam: string;
  awayTeam: string;
  minute: number;
  score: string | number[];
  market?: string;
  odds?: number;
}

class VoiceAlertAnnouncerService {
  private enabled: boolean = false;
  private volume: number = 0.9;
  private audioContext: AudioContext | null = null;
  private lastAnnouncedKey: string = '';
  private lastAnnouncedAt: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedEnabled = localStorage.getItem('sportsignal_voice_enabled');
      this.enabled = savedEnabled === 'true';

      const savedVol = localStorage.getItem('sportsignal_voice_volume');
      if (savedVol) {
        this.volume = parseFloat(savedVol) || 0.9;
      }
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (typeof window !== 'undefined') {
      localStorage.setItem('sportsignal_voice_enabled', val ? 'true' : 'false');
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0.1, Math.min(1.0, val));
    if (typeof window !== 'undefined') {
      localStorage.setItem('sportsignal_voice_volume', String(this.volume));
    }
  }

  // Play synthetic attention chime prior to voice speech
  public playChime() {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new AudioCtx();
      }

      const ctx = this.audioContext;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      // High chime tone 1 (880Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.15 * this.volume, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Harmonious chime tone 2 (1320Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1320, now + 0.08);
      gain2.gain.setValueAtTime(0.18 * this.volume, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.5);

      // Trigger mobile haptic if supported
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate([100, 60, 100, 60, 200]);
      }
    } catch (e) {
      // AudioContext might be blocked until user interaction
    }
  }

  // Announce signal verbally in the given language
  public announceSignal(payload: VoiceAlertPayload, lang: Language = 'ru') {
    if (!this.enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const scoreStr = Array.isArray(payload.score) ? `${payload.score[0]} ${payload.score[1]}` : String(payload.score);
    const key = `${payload.strategyName}-${payload.homeTeam}-${payload.awayTeam}-${payload.minute}`;
    const now = Date.now();

    // Prevent repeating identical signal within 30 seconds
    if (this.lastAnnouncedKey === key && now - this.lastAnnouncedAt < 30000) {
      return;
    }

    this.lastAnnouncedKey = key;
    this.lastAnnouncedAt = now;

    // First sound the chime
    this.playChime();

    // Wait 250ms for chime to finish then speak
    setTimeout(() => {
      this.speakText(this.formatPhrase(payload, lang, scoreStr), lang);
    }, 280);
  }

  public testVoice(lang: Language = 'ru') {
    this.playChime();
    setTimeout(() => {
      const samplePhrases: Record<Language, string> = {
        ru: 'Тест голосового оповещения SportSignal AI. Сигналы готовы к озвучиванию!',
        en: 'SportSignal AI voice alert test. Live signals are ready for announcement!',
        tr: 'SportSignal AI sesli bildirim testi. Canlı sinyaller seslendirilmeye hazır!',
        it: 'Test notifica vocale SportSignal AI. Segnali live pronti per l\'annuncio!',
        zh: 'SportSignal AI 语音播报测试。实时比赛信号播报已就绪！',
      };
      this.speakText(samplePhrases[lang] || samplePhrases.ru, lang);
    }, 280);
  }

  private formatPhrase(payload: VoiceAlertPayload, lang: Language, scoreStr: string): string {
    const market = payload.market || 'Live сигнал';
    switch (lang) {
      case 'en':
        return `Attention! Strategy ${payload.strategyName}. Match ${payload.homeTeam} against ${payload.awayTeam}, minute ${payload.minute}, score ${scoreStr}. Target market: ${market}!`;
      case 'tr':
        return `Dikkat! ${payload.strategyName} stratejisi. Maç ${payload.homeTeam} ve ${payload.awayTeam}, dakika ${payload.minute}, skor ${scoreStr}. Öneri: ${market}!`;
      case 'it':
        return `Attenzione! Strategia ${payload.strategyName}. Partita ${payload.homeTeam} contro ${payload.awayTeam}, minuto ${payload.minute}, risultato ${scoreStr}. Mercato consigliato: ${market}!`;
      case 'zh':
        return `注意！${payload.strategyName} 策略预警。比赛：${payload.homeTeam} 对阵 ${payload.awayTeam}，第 ${payload.minute} 分钟，比分 ${scoreStr}。推荐盘口：${market}！`;
      case 'ru':
      default:
        return `Внимание! Сработал алгоритм ${payload.strategyName}. Матч ${payload.homeTeam} против ${payload.awayTeam}, ${payload.minute}-я минута, счёт ${scoreStr}. Рекомендация: ${market}!`;
    }
  }

  private speakText(text: string, lang: Language) {
    try {
      window.speechSynthesis.cancel(); // cancel pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = this.volume;
      utterance.rate = 1.05; // slightly swift and energetic
      utterance.pitch = 1.0;

      const langLocales: Record<Language, string> = {
        ru: 'ru-RU',
        en: 'en-US',
        tr: 'tr-TR',
        it: 'it-IT',
        zh: 'zh-CN',
      };
      utterance.lang = langLocales[lang] || 'ru-RU';

      // Pick native voice if available
      const voices = window.speechSynthesis.getVoices();
      const targetPrefix = langLocales[lang].split('-')[0];
      const matchingVoice = voices.find((v) => v.lang.startsWith(targetPrefix));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis failed:', e);
    }
  }
}

export const voiceAnnouncer = new VoiceAlertAnnouncerService();
