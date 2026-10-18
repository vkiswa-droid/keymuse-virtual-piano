/**
 * Acoustic Grand Piano Sample Engine
 * High-fidelity Web Audio sample playback with progressive SoundFont streaming,
 * velocity dynamics, damper pedal sustain, stereo room reverb, and Web MIDI API integration.
 */

import { midiToNoteName, noteNameToMidi, midiToFrequency } from '../config/piano88';

export type AudioEngineStatus = 'uninitialized' | 'loading' | 'ready' | 'fallback' | 'error';

export interface SampledNoteVoice {
  source: AudioBufferSourceNode | OscillatorNode[];
  gainNode: GainNode;
  filterNode?: BiquadFilterNode;
  midi: number;
  note: string;
  startTime: number;
  isSampled: boolean;
}

const SOUNDFONT_URL = 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_grand_piano-mp3.js';
const CACHE_KEY = 'keymuse_soundfont_acoustic_grand_v1';

class SampleEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  
  // Decoded AudioBuffer cache for all 88 keys: Map<midi, AudioBuffer>
  private audioBuffers: Map<number, AudioBuffer> = new Map();
  private activeVoices: Map<string, SampledNoteVoice[]> = new Map();
  
  // State
  private status: AudioEngineStatus = 'uninitialized';
  private loadProgress: number = 0; // 0 to 100
  private loadError: string | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.85;
  private sustainActive: boolean = false;
  private sustainedNotes: Set<string> = new Set();
  
  // Web MIDI API state
  private midiAccess: any = null;
  private connectedMidiDevices: string[] = [];
  
  // Listeners
  private statusListeners: Array<(status: AudioEngineStatus, progress: number) => void> = [];
  private noteEventListeners: Array<(event: { type: 'down' | 'up'; note: string; midi: number; velocity: number }) => void> = [];
  private midiDeviceListeners: Array<(devices: string[]) => void> = [];

  constructor() {
    // Lazy initialization on first user gesture
  }

  public getStatus(): AudioEngineStatus {
    return this.status;
  }

  public getLoadProgress(): number {
    return this.loadProgress;
  }

  public subscribeStatus(listener: (status: AudioEngineStatus, progress: number) => void) {
    this.statusListeners.push(listener);
    listener(this.status, this.loadProgress);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  public subscribeNoteEvents(listener: (event: { type: 'down' | 'up'; note: string; midi: number; velocity: number }) => void) {
    this.noteEventListeners.push(listener);
    return () => {
      this.noteEventListeners = this.noteEventListeners.filter(l => l !== listener);
    };
  }

  public subscribeMidiDevices(listener: (devices: string[]) => void) {
    this.midiDeviceListeners.push(listener);
    listener(this.connectedMidiDevices);
    return () => {
      this.midiDeviceListeners = this.midiDeviceListeners.filter(l => l !== listener);
    };
  }

  private notifyStatus() {
    this.statusListeners.forEach(l => l(this.status, this.loadProgress));
  }

  private notifyNoteEvent(type: 'down' | 'up', note: string, midi: number, velocity: number) {
    this.noteEventListeners.forEach(l => l({ type, note, midi, velocity }));
  }

  /**
   * Initializes Web Audio Context, sets up master bus, reverb, and kicks off sample loading
   */
  public async initAudio(): Promise<boolean> {
    if (this.ctx && this.ctx.state === 'running') {
      return true;
    }

    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx({ latencyHint: 'interactive' });

        // Master Gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // Room Reverb (Convolution)
        this.createRoomReverb();

        // Setup Web MIDI
        this.initWebMidi();
      }

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      if (this.status === 'uninitialized') {
        this.loadSampleLibrary();
      }

      return true;
    } catch (err) {
      console.warn('Failed to initialize AudioContext:', err);
      this.status = 'error';
      this.loadError = 'Audio permission or initialization failed.';
      this.notifyStatus();
      return false;
    }
  }

  /**
   * Creates a synthetic warm recital-hall impulse response for the ConvolverNode
   */
  private createRoomReverb() {
    if (!this.ctx || !this.masterGain) return;

    try {
      const sampleRate = this.ctx.sampleRate;
      const length = sampleRate * 1.8; // 1.8 second room decay
      const impulse = this.ctx.createBuffer(2, length, sampleRate);
      const left = impulse.getChannelData(0);
      const right = impulse.getChannelData(1);

      for (let i = 0; i < length; i++) {
        const decay = Math.exp(-i / (sampleRate * 0.45));
        left[i] = (Math.random() * 2 - 1) * decay;
        right[i] = (Math.random() * 2 - 1) * decay;
      }

      this.reverbNode = this.ctx.createConvolver();
      this.reverbNode.buffer = impulse;

      this.dryGain = this.ctx.createGain();
      this.wetGain = this.ctx.createGain();

      this.dryGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.wetGain.gain.setValueAtTime(0.18, this.ctx.currentTime); // subtle warm room

      this.dryGain.connect(this.masterGain);
      this.wetGain.connect(this.masterGain);
      this.reverbNode.connect(this.wetGain);
    } catch (e) {
      console.warn('Reverb setup error:', e);
    }
  }

  /**
   * Loads the real acoustic grand piano soundfont
   */
  private async loadSampleLibrary() {
    this.status = 'loading';
    this.loadProgress = 10;
    this.notifyStatus();

    try {
      // Check cache first
      let rawScript = sessionStorage.getItem(CACHE_KEY);

      if (!rawScript) {
        this.loadProgress = 25;
        this.notifyStatus();

        const response = await fetch(SOUNDFONT_URL);
        if (!response.ok) {
          throw new Error(`Sample fetch error: ${response.status}`);
        }

        rawScript = await response.text();
        this.loadProgress = 50;
        this.notifyStatus();

        try {
          sessionStorage.setItem(CACHE_KEY, rawScript);
        } catch {
          // Quota exceeded, ignore caching in sessionStorage
        }
      } else {
        this.loadProgress = 45;
        this.notifyStatus();
      }

      // Parse the soundfont script
      // Format: MIDI.Soundfont.acoustic_grand_piano = { "A0": "data:audio/mp3;base64,...", ... }
      const jsonStart = rawScript.indexOf('{');
      const jsonEnd = rawScript.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('Invalid soundfont format received');
      }

      const jsonString = rawScript.substring(jsonStart, jsonEnd + 1);
      const soundfontData: Record<string, string> = JSON.parse(jsonString);

      const noteKeys = Object.keys(soundfontData);
      const totalNotes = noteKeys.length;
      let decodedCount = 0;

      // Decode audio data for each note
      const decodePromises = noteKeys.map(async (noteKey) => {
        if (!this.ctx) return;
        const base64Data = soundfontData[noteKey];
        const audioBuffer = await this.decodeBase64Audio(base64Data);
        if (audioBuffer) {
          // Note key in soundfont might be "A0", "Bb0", "C1", etc.
          const standardizedNote = noteKey.replace('b', '#'); // or standard pitch
          const midi = noteNameToMidi(standardizedNote);
          this.audioBuffers.set(midi, audioBuffer);
        }
        decodedCount++;
        this.loadProgress = Math.min(99, 50 + Math.round((decodedCount / totalNotes) * 49));
        this.notifyStatus();
      });

      await Promise.all(decodePromises);

      this.status = 'ready';
      this.loadProgress = 100;
      this.notifyStatus();
    } catch (err) {
      console.warn('Sample download failed, operating in modeled physical fallback mode:', err);
      this.status = 'fallback';
      this.loadProgress = 100;
      this.notifyStatus();
    }
  }

  /**
   * Helper to decode base64 mp3 string into AudioBuffer
   */
  private async decodeBase64Audio(dataUri: string): Promise<AudioBuffer | null> {
    if (!this.ctx) return null;
    try {
      const base64 = dataUri.split(',')[1];
      const binaryString = window.atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return await this.ctx.decodeAudioData(bytes.buffer);
    } catch (e) {
      console.warn('Decode audio error:', e);
      return null;
    }
  }

  /**
   * Play Note with genuine acoustic piano samples or high-quality physical model
   */
  public playNote(noteOrMidi: string | number, velocity: number = 0.8) {
    const midi = typeof noteOrMidi === 'number' ? noteOrMidi : noteNameToMidi(noteOrMidi);
    const note = typeof noteOrMidi === 'string' ? noteOrMidi : midiToNoteName(noteOrMidi);

    if (!this.ctx) {
      this.initAudio().then(() => {
        this.internalPlayNote(midi, note, velocity);
      });
      return;
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.internalPlayNote(midi, note, velocity);
      });
      return;
    }

    this.internalPlayNote(midi, note, velocity);
  }

  private internalPlayNote(midi: number, note: string, velocity: number) {
    if (!this.ctx || !this.masterGain || !this.dryGain) return;

    const now = this.ctx.currentTime;
    const clampedVelocity = Math.max(0.1, Math.min(1.0, velocity));
    const sampleBuffer = this.audioBuffers.get(midi);

    // Dynamic Filter: Soft strikes are mellow, hard strikes are bright
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const baseFreq = midiToFrequency(midi);
    const cutoff = Math.min(14000, baseFreq * (2.5 + clampedVelocity * 5.0));
    filter.frequency.setValueAtTime(cutoff, now);

    const voiceGain = this.ctx.createGain();
    const targetGain = Math.pow(clampedVelocity, 1.35); // Realistic musical velocity curve
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.linearRampToValueAtTime(targetGain, now + 0.003);

    // Connect to dry and wet paths
    voiceGain.connect(filter);
    filter.connect(this.dryGain);
    if (this.reverbNode) {
      filter.connect(this.reverbNode);
    }

    let voiceObj: SampledNoteVoice;

    if (sampleBuffer) {
      // Sampled Acoustic Grand Piano Playback
      const source = this.ctx.createBufferSource();
      source.buffer = sampleBuffer;
      source.connect(voiceGain);
      source.start(now);

      voiceObj = {
        source,
        gainNode: voiceGain,
        filterNode: filter,
        midi,
        note,
        startTime: now,
        isSampled: true,
      };

      source.onended = () => {
        this.cleanupVoice(note, voiceObj);
      };
    } else {
      // High-Fidelity Modeled Acoustic Fallback
      // Multi-harmonic physical string model
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const osc3 = this.ctx.createOscillator();
      const strikeNoise = this.ctx.createOscillator();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq * 2.001, now); // subtle inharmonicity

      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(baseFreq * 3.003, now);

      strikeNoise.type = 'triangle';
      strikeNoise.frequency.setValueAtTime(baseFreq * 1.5, now);

      const oscGain1 = this.ctx.createGain();
      const oscGain2 = this.ctx.createGain();
      const oscGain3 = this.ctx.createGain();
      const noiseGain = this.ctx.createGain();

      oscGain1.gain.setValueAtTime(0.65, now);
      oscGain2.gain.setValueAtTime(0.28, now);
      oscGain3.gain.setValueAtTime(0.12, now);
      noiseGain.gain.setValueAtTime(0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc1.connect(oscGain1);
      osc2.connect(oscGain2);
      osc3.connect(oscGain3);
      strikeNoise.connect(noiseGain);

      oscGain1.connect(voiceGain);
      oscGain2.connect(voiceGain);
      oscGain3.connect(voiceGain);
      noiseGain.connect(voiceGain);

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);
      strikeNoise.start(now);
      strikeNoise.stop(now + 0.04);

      // Organic string decay
      voiceGain.gain.exponentialRampToValueAtTime(targetGain * 0.45, now + 1.2);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

      voiceObj = {
        source: [osc1, osc2, osc3, strikeNoise],
        gainNode: voiceGain,
        filterNode: filter,
        midi,
        note,
        startTime: now,
        isSampled: false,
      };

      setTimeout(() => {
        this.cleanupVoice(note, voiceObj);
      }, 4600);
    }

    if (!this.activeVoices.has(note)) {
      this.activeVoices.set(note, []);
    }
    this.activeVoices.get(note)!.push(voiceObj);

    this.notifyNoteEvent('down', note, midi, clampedVelocity);
  }

  /**
   * Release note when physical or virtual key is let go
   */
  public releaseNote(noteOrMidi: string | number) {
    const midi = typeof noteOrMidi === 'number' ? noteOrMidi : noteNameToMidi(noteOrMidi);
    const note = typeof noteOrMidi === 'string' ? noteOrMidi : midiToNoteName(noteOrMidi);

    if (this.sustainActive) {
      this.sustainedNotes.add(note);
      this.notifyNoteEvent('up', note, midi, 0);
      return;
    }

    this.stopNoteVoice(note, 0.14);
    this.notifyNoteEvent('up', note, midi, 0);
  }

  private stopNoteVoice(note: string, releaseTimeSec: number) {
    const voices = this.activeVoices.get(note);
    if (!voices || !this.ctx) return;

    const now = this.ctx.currentTime;

    voices.forEach(v => {
      try {
        v.gainNode.gain.cancelScheduledValues(now);
        const currentGain = Math.max(0.0001, v.gainNode.gain.value);
        v.gainNode.gain.setValueAtTime(currentGain, now);
        v.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + releaseTimeSec);

        setTimeout(() => {
          this.cleanupVoice(note, v);
        }, releaseTimeSec * 1000 + 50);
      } catch (e) {
        console.warn('Voice release error:', e);
      }
    });

    this.activeVoices.delete(note);
  }

  private cleanupVoice(note: string, voice: SampledNoteVoice) {
    try {
      if (Array.isArray(voice.source)) {
        voice.source.forEach(osc => {
          try { osc.stop(); osc.disconnect(); } catch {}
        });
      } else {
        try { voice.source.stop(); voice.source.disconnect(); } catch {}
      }
      voice.gainNode.disconnect();
      if (voice.filterNode) voice.filterNode.disconnect();
    } catch {}

    const remaining = this.activeVoices.get(note);
    if (remaining) {
      const filtered = remaining.filter(v => v !== voice);
      if (filtered.length > 0) {
        this.activeVoices.set(note, filtered);
      } else {
        this.activeVoices.delete(note);
      }
    }
  }

  public setSustain(active: boolean) {
    this.sustainActive = active;
    if (!active && this.sustainedNotes.size > 0) {
      this.sustainedNotes.forEach(note => {
        this.stopNoteVoice(note, 0.25);
      });
      this.sustainedNotes.clear();
    }
  }

  public getSustain(): boolean {
    return this.sustainActive;
  }

  public setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.02);
    }
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime, 0.02);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public stopAllNotes() {
    this.activeVoices.forEach((voices, note) => {
      this.stopNoteVoice(note, 0.05);
    });
    this.activeVoices.clear();
    this.sustainedNotes.clear();
  }

  /**
   * Initializes Web MIDI API for external hardware keyboards & controllers
   */
  private async initWebMidi() {
    if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
      return;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      this.updateConnectedMidiDevices();

      this.midiAccess.onstatechange = () => {
        this.updateConnectedMidiDevices();
      };

      for (const input of this.midiAccess.inputs.values()) {
        input.onmidimessage = this.handleMidiMessage.bind(this);
      }
    } catch (e) {
      console.warn('Web MIDI API not available or permission denied:', e);
    }
  }

  private updateConnectedMidiDevices() {
    if (!this.midiAccess) return;
    const devices: string[] = [];
    for (const input of this.midiAccess.inputs.values()) {
      devices.push(input.name || 'MIDI Keyboard');
      input.onmidimessage = this.handleMidiMessage.bind(this);
    }
    this.connectedMidiDevices = devices;
    this.midiDeviceListeners.forEach(l => l(devices));
  }

  private handleMidiMessage(event: { data: Uint8Array | number[] }) {
    const [status, noteOrControl, velocity] = event.data;
    const command = status >> 4;

    if (command === 0x9) { // Note On
      if (velocity > 0) {
        this.playNote(noteOrControl, velocity / 127);
      } else {
        this.releaseNote(noteOrControl);
      }
    } else if (command === 0x8) { // Note Off
      this.releaseNote(noteOrControl);
    } else if (command === 0xB && noteOrControl === 64) { // Sustain Pedal (CC 64)
      this.setSustain(velocity >= 64);
    }
  }
}

export const sampleEngine = new SampleEngine();
