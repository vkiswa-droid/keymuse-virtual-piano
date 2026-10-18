import { SoundType } from '../types';
import { getNoteFrequency } from '../config/constants';

interface ActiveVoice {
  oscillators: OscillatorNode[];
  gainNodes: GainNode[];
  filterNodes?: BiquadFilterNode[];
  envelopeGain: GainNode;
  note: string;
  startTime: number;
  soundType: SoundType;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeVoices: Map<string, ActiveVoice> = new Map();
  private volume: number = 0.8;
  private isMuted: boolean = false;
  private sustainEnabled: boolean = false;
  private sustainedNotes: Set<string> = new Set();
  private soundType: SoundType = 'piano';
  
  // Metronome state
  private metronomeTimerId: number | null = null;
  private metronomeBpm: number = 100;
  private metronomeBeatsPerMeasure: number = 4;
  private currentBeat: number = 0;
  private isMetronomePlaying: boolean = false;
  private onBeatCallback: ((beat: number) => void) | null = null;

  // Audio state listener
  private onStateChangeListeners: Array<(state: AudioContextState | 'uninitialized') => void> = [];

  constructor() {
    // AudioContext will be lazily created or initialized on first user interaction
  }

  public getAudioState(): AudioContextState | 'uninitialized' {
    if (!this.ctx) return 'uninitialized';
    return this.ctx.state;
  }

  public subscribeStateChange(listener: (state: AudioContextState | 'uninitialized') => void) {
    this.onStateChangeListeners.push(listener);
    listener(this.getAudioState());
    return () => {
      this.onStateChangeListeners = this.onStateChangeListeners.filter(l => l !== listener);
    };
  }

  private notifyStateChange() {
    const state = this.getAudioState();
    this.onStateChangeListeners.forEach(listener => listener(state));
  }

  public async initAudio(): Promise<boolean> {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx({ latencyHint: 'interactive' });
        
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.ctx.onstatechange = () => {
          this.notifyStateChange();
        };
      }

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      this.notifyStateChange();
      return true;
    } catch (err) {
      console.warn('AudioContext initialization error:', err);
      return false;
    }
  }

  public setSoundType(type: SoundType) {
    this.soundType = type;
  }

  public getSoundType(): SoundType {
    return this.soundType;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.015);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.015);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setSustain(enabled: boolean) {
    this.sustainEnabled = enabled;
    // If sustain turned off, release all sustained notes that are no longer physically held
    if (!enabled && this.sustainedNotes.size > 0) {
      this.sustainedNotes.forEach(note => {
        this.stopVoice(note, true);
      });
      this.sustainedNotes.clear();
    }
  }

  public getSustain(): boolean {
    return this.sustainEnabled;
  }

  /**
   * Triggers a note on. Supports chords (multiple voices can play at once).
   */
  public playNote(note: string, velocity: number = 0.8) {
    if (!this.ctx) {
      this.initAudio().then(() => {
        this.internalPlayNote(note, velocity);
      });
      return;
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.internalPlayNote(note, velocity);
      });
      return;
    }

    this.internalPlayNote(note, velocity);
  }

  private internalPlayNote(note: string, velocity: number) {
    if (!this.ctx || !this.masterGain) return;

    // If already playing, stop existing note cleanly
    if (this.activeVoices.has(note)) {
      this.stopVoice(note, false);
    }

    const now = this.ctx.currentTime;
    const freq = getNoteFrequency(note);
    const soundType = this.soundType;

    const envelopeGain = this.ctx.createGain();
    envelopeGain.gain.setValueAtTime(0.0001, now);

    const oscillators: OscillatorNode[] = [];
    const gainNodes: GainNode[] = [];
    const filterNodes: BiquadFilterNode[] = [];

    if (soundType === 'piano') {
      // Harmonic physical model for acoustic piano tone
      // Struck string harmonics: Fundamental (1x), 2nd (2x), 3rd (3x), 4th (4x)
      const harmonics = [
        { mult: 1.0, gain: 0.65, decayMult: 1.0 },
        { mult: 2.0, gain: 0.35, decayMult: 1.4 },
        { mult: 3.0, gain: 0.18, decayMult: 2.0 },
        { mult: 4.0, gain: 0.08, decayMult: 2.6 },
      ];

      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      // Piano key tracking: higher notes are naturally brighter
      const baseCutoff = Math.min(6500, freq * 4.5 + 800);
      lowpass.frequency.setValueAtTime(baseCutoff, now);
      lowpass.frequency.exponentialRampToValueAtTime(Math.max(400, baseCutoff * 0.45), now + 1.8);
      filterNodes.push(lowpass);

      harmonics.forEach(h => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const hGain = this.ctx.createGain();
        
        // Piano strings have slight natural inharmonicity
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * h.mult * (1 + (h.mult - 1) * 0.0008), now);

        hGain.gain.setValueAtTime(h.gain * velocity, now);
        osc.connect(hGain);
        hGain.connect(lowpass);

        osc.start(now);
        oscillators.push(osc);
        gainNodes.push(hGain);
      });

      // Hammer strike transient (short percussive burst)
      const hammerOsc = this.ctx.createOscillator();
      const hammerGain = this.ctx.createGain();
      hammerOsc.type = 'triangle';
      hammerOsc.frequency.setValueAtTime(freq * 1.5, now);
      hammerGain.gain.setValueAtTime(0.25 * velocity, now);
      hammerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
      hammerOsc.connect(hammerGain);
      hammerGain.connect(lowpass);
      hammerOsc.start(now);
      hammerOsc.stop(now + 0.04);
      oscillators.push(hammerOsc);

      lowpass.connect(envelopeGain);

      // Attack: instantaneous, crisp struck hammer
      envelopeGain.gain.exponentialRampToValueAtTime(1.0, now + 0.004);
      // Gentle natural sustain decay while held
      envelopeGain.gain.exponentialRampToValueAtTime(0.42, now + 1.2);
      envelopeGain.gain.exponentialRampToValueAtTime(0.18, now + 3.0);

    } else if (soundType === 'soft') {
      // Soft Keys: Electric Piano / Warm Bell tone
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const osc1Gain = this.ctx.createGain();
      const osc2Gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);
      osc1Gain.gain.setValueAtTime(0.7 * velocity, now);

      // Bell overtone at 3x or 4x
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 3, now);
      osc2Gain.gain.setValueAtTime(0.18 * velocity, now);
      osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, now);
      filterNodes.push(filter);

      osc1.connect(osc1Gain);
      osc2.connect(osc2Gain);
      osc1Gain.connect(filter);
      osc2Gain.connect(filter);
      filter.connect(envelopeGain);

      osc1.start(now);
      osc2.start(now);
      oscillators.push(osc1, osc2);
      gainNodes.push(osc1Gain, osc2Gain);

      // Soft rounded attack
      envelopeGain.gain.exponentialRampToValueAtTime(0.85, now + 0.02);
      envelopeGain.gain.exponentialRampToValueAtTime(0.4, now + 1.5);

    } else {
      // Synth Keys: Rich modern polysynth lead
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const oscSub = this.ctx.createOscillator();
      const osc1Gain = this.ctx.createGain();
      const osc2Gain = this.ctx.createGain();
      const subGain = this.ctx.createGain();

      // Detuned sawtooth pair for wide chorus effect
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, now);
      osc1.detune.setValueAtTime(-6, now); // -6 cents
      osc1Gain.gain.setValueAtTime(0.35 * velocity, now);

      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(freq, now);
      osc2.detune.setValueAtTime(6, now); // +6 cents
      osc2Gain.gain.setValueAtTime(0.35 * velocity, now);

      // Sub oscillator 1 octave down
      oscSub.type = 'square';
      oscSub.frequency.setValueAtTime(freq / 2, now);
      subGain.gain.setValueAtTime(0.12 * velocity, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.setValueAtTime(4.0, now); // Resonant sweep
      filter.frequency.setValueAtTime(freq * 1.5, now);
      filter.frequency.exponentialRampToValueAtTime(Math.min(8000, freq * 5), now + 0.08);
      filter.frequency.exponentialRampToValueAtTime(freq * 2.2, now + 1.2);
      filterNodes.push(filter);

      osc1.connect(osc1Gain);
      osc2.connect(osc2Gain);
      oscSub.connect(subGain);
      osc1Gain.connect(filter);
      osc2Gain.connect(filter);
      subGain.connect(filter);
      filter.connect(envelopeGain);

      osc1.start(now);
      osc2.start(now);
      oscSub.start(now);
      oscillators.push(osc1, osc2, oscSub);
      gainNodes.push(osc1Gain, osc2Gain, subGain);

      envelopeGain.gain.exponentialRampToValueAtTime(0.8, now + 0.008);
      envelopeGain.gain.exponentialRampToValueAtTime(0.5, now + 0.8);
    }

    envelopeGain.connect(this.masterGain);

    this.activeVoices.set(note, {
      oscillators,
      gainNodes,
      filterNodes,
      envelopeGain,
      note,
      startTime: now,
      soundType,
    });
  }

  /**
   * Release a note when key is let go
   */
  public releaseNote(note: string) {
    if (this.sustainEnabled) {
      // Mark as sustained until pedal is lifted
      this.sustainedNotes.add(note);
      return;
    }

    this.stopVoice(note, true);
  }

  private stopVoice(note: string, smoothRelease: boolean) {
    const voice = this.activeVoices.get(note);
    if (!voice || !this.ctx) return;

    this.activeVoices.delete(note);
    const now = this.ctx.currentTime;
    const releaseDuration = smoothRelease ? (this.sustainEnabled ? 1.8 : 0.14) : 0.02;

    try {
      voice.envelopeGain.gain.cancelScheduledValues(now);
      const currentVal = Math.max(0.0001, voice.envelopeGain.gain.value);
      voice.envelopeGain.gain.setValueAtTime(currentVal, now);
      voice.envelopeGain.gain.exponentialRampToValueAtTime(0.0001, now + releaseDuration);

      setTimeout(() => {
        voice.oscillators.forEach(osc => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {
            // Already stopped
          }
        });
        voice.gainNodes.forEach(g => {
          try { g.disconnect(); } catch {}
        });
        if (voice.filterNodes) {
          voice.filterNodes.forEach(f => {
            try { f.disconnect(); } catch {}
          });
        }
        try { voice.envelopeGain.disconnect(); } catch {}
      }, releaseDuration * 1000 + 100);
    } catch (e) {
      console.warn('Error stopping voice:', e);
    }
  }

  /**
   * Stop all active notes immediately
   */
  public stopAllNotes() {
    this.activeVoices.forEach((_, note) => {
      this.stopVoice(note, false);
    });
    this.activeVoices.clear();
    this.sustainedNotes.clear();
  }

  // --- Metronome Engine ---
  public setMetronomeBpm(bpm: number) {
    this.metronomeBpm = Math.max(40, Math.min(240, Math.round(bpm)));
    if (this.isMetronomePlaying) {
      this.stopMetronome();
      this.startMetronome();
    }
  }

  public getMetronomeBpm(): number {
    return this.metronomeBpm;
  }

  public setMetronomeBeats(beats: number) {
    this.metronomeBeatsPerMeasure = beats;
  }

  public setOnBeatCallback(cb: ((beat: number) => void) | null) {
    this.onBeatCallback = cb;
  }

  public startMetronome() {
    if (this.isMetronomePlaying) return;
    this.initAudio();
    this.isMetronomePlaying = true;
    this.currentBeat = 0;

    const intervalMs = (60 / this.metronomeBpm) * 1000;
    
    // Play first beat immediately
    this.playMetronomeClick(this.currentBeat);
    if (this.onBeatCallback) this.onBeatCallback(this.currentBeat);

    this.metronomeTimerId = window.setInterval(() => {
      this.currentBeat = (this.currentBeat + 1) % this.metronomeBeatsPerMeasure;
      this.playMetronomeClick(this.currentBeat);
      if (this.onBeatCallback) this.onBeatCallback(this.currentBeat);
    }, intervalMs);
  }

  public stopMetronome() {
    if (this.metronomeTimerId !== null) {
      clearInterval(this.metronomeTimerId);
      this.metronomeTimerId = null;
    }
    this.isMetronomePlaying = false;
    this.currentBeat = 0;
  }

  public isMetronomeActive(): boolean {
    return this.isMetronomePlaying;
  }

  private playMetronomeClick(beatIndex: number) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const isAccent = beatIndex === 0;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // High woodblock tick on beat 1 (1050Hz), mid tick on others (750Hz)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isAccent ? 1050 : 750, now);

    const clickGain = isAccent ? 0.35 : 0.2;
    gain.gain.setValueAtTime(clickGain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export const soundEngine = new SoundEngine();
