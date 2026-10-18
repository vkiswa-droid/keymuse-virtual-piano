/**
 * KeyMuse Physical Laptop Keyboard Mapping System
 * Complete physical key-to-piano-note engine using KeyboardEvent.code.
 * Supports Base Layer, Shift Layer, and Numpad.
 * Covers all 88 notes from A0 (MIDI 21) to C8 (MIDI 108).
 */

import { midiToNoteName, noteNameToMidi, MIN_MIDI, MAX_MIDI } from './piano88';

export interface PhysicalKeyDef {
  code: string;       // Standard KeyboardEvent.code (e.g. 'KeyQ', 'Digit1')
  label: string;      // Human-readable keycap label (e.g. 'Q', '1', '[')
  row: 1 | 2 | 3 | 4 | 5; // Keyboard row: 1 = Numbers, 2 = QWERTY, 3 = ASDF, 4 = ZXCV, 5 = Bottom/Space
  width?: number;     // Width multiplier (1 = normal square key, 1.5 = tab, 2 = backspace, etc.)
}

export interface KeyAssignment {
  code: string;       // KeyboardEvent.code
  midi: number;       // MIDI note number (21 - 108)
  note: string;       // Note name (e.g. "C4", "F#3")
  isShift: boolean;   // Requires Shift modifier
}

export type KeyboardLayoutProfile = 'daw_extended' | 'chromatic_tracker' | 'classic_two_octave';

// Complete physical laptop QWERTY key grid definitions
export const LAPTOP_PHYSICAL_KEYS: PhysicalKeyDef[] = [
  // Row 1: Number Row
  { code: 'Backquote', label: '`', row: 1 },
  { code: 'Digit1', label: '1', row: 1 },
  { code: 'Digit2', label: '2', row: 1 },
  { code: 'Digit3', label: '3', row: 1 },
  { code: 'Digit4', label: '4', row: 1 },
  { code: 'Digit5', label: '5', row: 1 },
  { code: 'Digit6', label: '6', row: 1 },
  { code: 'Digit7', label: '7', row: 1 },
  { code: 'Digit8', label: '8', row: 1 },
  { code: 'Digit9', label: '9', row: 1 },
  { code: 'Digit0', label: '0', row: 1 },
  { code: 'Minus', label: '-', row: 1 },
  { code: 'Equal', label: '=', row: 1 },
  { code: 'Backspace', label: '⌫', row: 1, width: 1.8 },

  // Row 2: QWERTY Row
  { code: 'Tab', label: 'Tab', row: 2, width: 1.4 },
  { code: 'KeyQ', label: 'Q', row: 2 },
  { code: 'KeyW', label: 'W', row: 2 },
  { code: 'KeyE', label: 'E', row: 2 },
  { code: 'KeyR', label: 'R', row: 2 },
  { code: 'KeyT', label: 'T', row: 2 },
  { code: 'KeyY', label: 'Y', row: 2 },
  { code: 'KeyU', label: 'U', row: 2 },
  { code: 'KeyI', label: 'I', row: 2 },
  { code: 'KeyO', label: 'O', row: 2 },
  { code: 'KeyP', label: 'P', row: 2 },
  { code: 'BracketLeft', label: '[', row: 2 },
  { code: 'BracketRight', label: ']', row: 2 },
  { code: 'Backslash', label: '\\', row: 2, width: 1.4 },

  // Row 3: ASDF / Home Row
  { code: 'CapsLock', label: 'Caps', row: 3, width: 1.7 },
  { code: 'KeyA', label: 'A', row: 3 },
  { code: 'KeyS', label: 'S', row: 3 },
  { code: 'KeyD', label: 'D', row: 3 },
  { code: 'KeyF', label: 'F', row: 3 },
  { code: 'KeyG', label: 'G', row: 3 },
  { code: 'KeyH', label: 'H', row: 3 },
  { code: 'KeyJ', label: 'J', row: 3 },
  { code: 'KeyK', label: 'K', row: 3 },
  { code: 'KeyL', label: 'L', row: 3 },
  { code: 'Semicolon', label: ';', row: 3 },
  { code: 'Quote', label: "'", row: 3 },
  { code: 'Enter', label: 'Enter', row: 3, width: 2.1 },

  // Row 4: ZXCV Row
  { code: 'ShiftLeft', label: 'Shift', row: 4, width: 2.2 },
  { code: 'KeyZ', label: 'Z', row: 4 },
  { code: 'KeyX', label: 'X', row: 4 },
  { code: 'KeyC', label: 'C', row: 4 },
  { code: 'KeyV', label: 'V', row: 4 },
  { code: 'KeyB', label: 'B', row: 4 },
  { code: 'KeyN', label: 'N', row: 4 },
  { code: 'KeyM', label: 'M', row: 4 },
  { code: 'Comma', label: ',', row: 4 },
  { code: 'Period', label: '.', row: 4 },
  { code: 'Slash', label: '/', row: 4 },
  { code: 'ShiftRight', label: 'Shift', row: 4, width: 2.6 },

  // Row 5: Spacebar & Modifiers
  { code: 'Space', label: 'Space (Sustain Pedal)', row: 5, width: 6.2 },
];

// Numpad Keys (for full laptop keyboards & external keypads)
export const NUMPAD_PHYSICAL_KEYS: PhysicalKeyDef[] = [
  { code: 'Numpad7', label: 'Num 7', row: 1 },
  { code: 'Numpad8', label: 'Num 8', row: 1 },
  { code: 'Numpad9', label: 'Num 9', row: 1 },
  { code: 'NumpadDivide', label: 'Num /', row: 1 },

  { code: 'Numpad4', label: 'Num 4', row: 2 },
  { code: 'Numpad5', label: 'Num 5', row: 2 },
  { code: 'Numpad6', label: 'Num 6', row: 2 },
  { code: 'NumpadMultiply', label: 'Num *', row: 2 },

  { code: 'Numpad1', label: 'Num 1', row: 3 },
  { code: 'Numpad2', label: 'Num 2', row: 3 },
  { code: 'Numpad3', label: 'Num 3', row: 3 },
  { code: 'NumpadSubtract', label: 'Num -', row: 3 },

  { code: 'Numpad0', label: 'Num 0', row: 4, width: 2 },
  { code: 'NumpadDecimal', label: 'Num .', row: 4 },
  { code: 'NumpadAdd', label: 'Num +', row: 4 },
];

/**
 * DEFAULT PRESET 1: "DAW Extended Multi-Octave" (RECOMMENDED)
 * Maps consecutive physical rows into a 4-octave multi-manual synthesizer keyboard!
 * 
 * - Bottom Manual (ZXCVB...): C3 to G4 (Bass/Tenor)
 * - Upper Manual (QWERTY...): C4 to G5 (Middle & Treble)
 * - Number Row: C5 to C6 (High Treble)
 * - Shift Layer: Sub-bass A0 to B2 & Extreme Treble C6 to C8!
 * This enables playing literally any of the 88 piano keys from a single laptop!
 */
export function buildDawExtendedPreset(): KeyAssignment[] {
  const assignments: KeyAssignment[] = [];

  const add = (code: string, noteName: string, isShift: boolean = false) => {
    const midi = noteNameToMidi(noteName);
    assignments.push({ code, midi, note: noteName, isShift });
  };

  // ================= BASE LAYER =================

  // --- LOWER MANUAL: ZXCV Row (White Keys C3 - B3) & ASDF Row (Black Keys + Extension) ---
  add('KeyZ', 'C3');
  add('KeyS', 'C#3');
  add('KeyX', 'D3');
  add('KeyD', 'D#3');
  add('KeyC', 'E3');
  add('KeyV', 'F3');
  add('KeyG', 'F#3');
  add('KeyB', 'G3');
  add('KeyH', 'G#3');
  add('KeyN', 'A3');
  add('KeyJ', 'A#3');
  add('KeyM', 'B3');
  add('Comma', 'C4');
  add('KeyL', 'C#4');
  add('Period', 'D4');
  add('Semicolon', 'D#4');
  add('Slash', 'E4');
  add('Quote', 'F4');

  // --- UPPER MANUAL: ASDF/QWERTY Row (White Keys C4 - B4) & Numbers (Black Keys) ---
  add('KeyA', 'C4');
  add('KeyW', 'C#4');
  add('KeyE', 'D#4');
  add('KeyF', 'F4');
  add('KeyT', 'F#4');
  add('KeyY', 'G#4');
  add('KeyU', 'A#4');
  add('KeyK', 'C5');
  add('KeyO', 'C#5');
  add('KeyP', 'D#5');

  // --- QWERTY Row Direct Octave 4 to 5 ---
  add('KeyQ', 'C4');
  add('Digit2', 'C#4');
  add('KeyW', 'D4');
  add('Digit3', 'D#4');
  add('KeyE', 'E4');
  add('KeyR', 'F4');
  add('Digit5', 'F#4');
  add('KeyT', 'G4');
  add('Digit6', 'G#4');
  add('KeyY', 'A4');
  add('Digit7', 'A#4');
  add('KeyU', 'B4');
  add('KeyI', 'C5');
  add('Digit9', 'C#5');
  add('KeyO', 'D5');
  add('Digit0', 'D#5');
  add('KeyP', 'E5');
  add('BracketLeft', 'F5');
  add('Equal', 'F#5');
  add('BracketRight', 'G5');
  add('Backslash', 'G#5');

  // --- Number Row High Register ---
  add('Backquote', 'B4');
  add('Digit1', 'C5');
  add('Digit4', 'F5');
  add('Digit8', 'B5');
  add('Minus', 'A5');

  // --- Numpad (Bass & Chords) ---
  add('Numpad0', 'C2');
  add('Numpad1', 'C3');
  add('Numpad2', 'D3');
  add('Numpad3', 'E3');
  add('Numpad4', 'F3');
  add('Numpad5', 'G3');
  add('Numpad6', 'A3');
  add('Numpad7', 'B3');
  add('Numpad8', 'C4');
  add('Numpad9', 'D4');

  // ================= SHIFT LAYER (SUB-BASS & HIGH TREBLE) =================
  // Shift + ZXCV: Sub-Bass A0 through B2
  add('KeyZ', 'A0', true);
  add('KeyS', 'A#0', true);
  add('KeyX', 'B0', true);
  add('KeyC', 'C1', true);
  add('KeyD', 'C#1', true);
  add('KeyV', 'D1', true);
  add('KeyG', 'D#1', true);
  add('KeyB', 'E1', true);
  add('KeyN', 'F1', true);
  add('KeyH', 'F#1', true);
  add('KeyM', 'G1', true);
  add('KeyJ', 'G#1', true);
  add('Comma', 'A1', true);
  add('KeyK', 'A#1', true);
  add('Period', 'B1', true);
  add('Slash', 'C2', true);

  // Shift + QWERTY: Extreme Treble C6 through C8
  add('KeyQ', 'C6', true);
  add('Digit2', 'C#6', true);
  add('KeyW', 'D6', true);
  add('Digit3', 'D#6', true);
  add('KeyE', 'E6', true);
  add('KeyR', 'F6', true);
  add('Digit5', 'F#6', true);
  add('KeyT', 'G6', true);
  add('Digit6', 'G#6', true);
  add('KeyY', 'A6', true);
  add('Digit7', 'A#6', true);
  add('KeyU', 'B6', true);
  add('KeyI', 'C7', true);
  add('Digit9', 'C#7', true);
  add('KeyO', 'D7', true);
  add('Digit0', 'D#7', true);
  add('KeyP', 'E7', true);
  add('BracketLeft', 'F7', true);
  add('BracketRight', 'G7', true);
  add('Backslash', 'C8', true); // Highest note on the piano!

  return assignments;
}

/**
 * PRESET 2: "Chromatic Tracker" (Continuous sequential semitones across rows)
 */
export function buildChromaticTrackerPreset(): KeyAssignment[] {
  const assignments: KeyAssignment[] = [];
  const add = (code: string, noteName: string, isShift: boolean = false) => {
    assignments.push({ code, midi: noteNameToMidi(noteName), note: noteName, isShift });
  };

  // Row 4 (ZXCV): C2 to D#3 (15 semitones)
  const row4Codes = ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash'];
  row4Codes.forEach((code, idx) => {
    const midi = 36 + idx; // C2 = 36
    add(code, midiToNoteName(midi));
  });

  // Row 3 (ASDF): E3 to F#4
  const row3Codes = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote'];
  row3Codes.forEach((code, idx) => {
    const midi = 46 + idx;
    add(code, midiToNoteName(midi));
  });

  // Row 2 (QWERTY): G4 to A5
  const row2Codes = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash'];
  row2Codes.forEach((code, idx) => {
    const midi = 57 + idx;
    add(code, midiToNoteName(midi));
  });

  // Row 1 (Numbers): A#5 to B6
  const row1Codes = ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal'];
  row1Codes.forEach((code, idx) => {
    const midi = 70 + idx;
    add(code, midiToNoteName(midi));
  });

  return assignments;
}

/**
 * PRESET 3: "Classic 2-Octave Centered" (Traditional piano layout C4-E5)
 */
export function buildClassicTwoOctavePreset(): KeyAssignment[] {
  const assignments: KeyAssignment[] = [];
  const add = (code: string, noteName: string, isShift: boolean = false) => {
    assignments.push({ code, midi: noteNameToMidi(noteName), note: noteName, isShift });
  };

  // White Keys C4 - E5
  add('KeyA', 'C4');
  add('KeyS', 'D4');
  add('KeyD', 'E4');
  add('KeyF', 'F4');
  add('KeyG', 'G4');
  add('KeyH', 'A4');
  add('KeyJ', 'B4');
  add('KeyK', 'C5');
  add('KeyL', 'D5');
  add('Semicolon', 'E5');

  // Black Keys C#4 - D#5
  add('KeyW', 'C#4');
  add('KeyE', 'D#4');
  add('KeyT', 'F#4');
  add('KeyY', 'G#4');
  add('KeyU', 'A#4');
  add('KeyO', 'C#5');
  add('KeyP', 'D#5');

  // Extended Lower Octave (ZXCV)
  add('KeyZ', 'C3');
  add('KeyX', 'D3');
  add('KeyC', 'E3');
  add('KeyV', 'F3');
  add('KeyB', 'G3');
  add('KeyN', 'A3');
  add('KeyM', 'B3');

  return assignments;
}

const STORAGE_KEY = 'keymuse_keyboard_mappings_v2';
const STORAGE_PROFILE_KEY = 'keymuse_keyboard_profile_v2';

/**
 * Keyboard Mapping Manager Singleton
 */
class KeyboardMappingManager {
  private assignments: KeyAssignment[] = [];
  private currentProfile: KeyboardLayoutProfile = 'daw_extended';
  private listeners: Array<() => void> = [];

  constructor() {
    this.load();
  }

  public getProfile(): KeyboardLayoutProfile {
    return this.currentProfile;
  }

  public setProfile(profile: KeyboardLayoutProfile): void {
    this.currentProfile = profile;
    if (profile === 'daw_extended') {
      this.assignments = buildDawExtendedPreset();
    } else if (profile === 'chromatic_tracker') {
      this.assignments = buildChromaticTrackerPreset();
    } else if (profile === 'classic_two_octave') {
      this.assignments = buildClassicTwoOctavePreset();
    }
    this.save();
    this.notify();
  }

  public getAssignments(): KeyAssignment[] {
    return [...this.assignments];
  }

  public getAssignment(code: string, isShift: boolean): KeyAssignment | undefined {
    return this.assignments.find(a => a.code === code && a.isShift === isShift);
  }

  public setAssignment(code: string, midi: number, isShift: boolean): void {
    // Remove any existing assignment for this exact key & layer
    this.assignments = this.assignments.filter(a => !(a.code === code && a.isShift === isShift));
    
    if (midi >= MIN_MIDI && midi <= MAX_MIDI) {
      this.assignments.push({
        code,
        midi,
        note: midiToNoteName(midi),
        isShift,
      });
    }

    this.save();
    this.notify();
  }

  public removeAssignment(code: string, isShift: boolean): void {
    this.assignments = this.assignments.filter(a => !(a.code === code && a.isShift === isShift));
    this.save();
    this.notify();
  }

  public resetToDefault(): void {
    this.setProfile('daw_extended');
  }

  /**
   * Fast lookup: code + shift -> MIDI note number
   */
  public codeToMidi(code: string, isShift: boolean): number | null {
    // Check exact layer first
    const exact = this.assignments.find(a => a.code === code && a.isShift === isShift);
    if (exact) return exact.midi;

    // Fallback: if Shift is not explicitly mapped for this key, check if base key exists
    if (isShift) {
      const base = this.assignments.find(a => a.code === code && !a.isShift);
      if (base) return base.midi;
    }

    return null;
  }

  /**
   * Reverse lookup: find all physical keys mapped to a given MIDI note
   */
  public midiToKeyAssignments(midi: number): KeyAssignment[] {
    return this.assignments.filter(a => a.midi === midi);
  }

  /**
   * Get the primary display key label for a note (e.g. for display on piano key or falling note)
   */
  public getPrimaryLabelForMidi(midi: number): { label: string; isShift: boolean } | null {
    // Prefer base layer first
    const base = this.assignments.find(a => a.midi === midi && !a.isShift);
    if (base) {
      const def = LAPTOP_PHYSICAL_KEYS.find(k => k.code === base.code) || 
                  NUMPAD_PHYSICAL_KEYS.find(k => k.code === base.code);
      return { label: def ? def.label : base.code.replace('Key', ''), isShift: false };
    }

    // Next check Shift layer
    const shift = this.assignments.find(a => a.midi === midi && a.isShift);
    if (shift) {
      const def = LAPTOP_PHYSICAL_KEYS.find(k => k.code === shift.code) || 
                  NUMPAD_PHYSICAL_KEYS.find(k => k.code === shift.code);
      return { label: def ? `⇧${def.label}` : `⇧${shift.code.replace('Key', '')}`, isShift: true };
    }

    return null;
  }

  /**
   * Detect any key conflicts (same key mapped twice on the same layer)
   */
  public getConflicts(): Array<{ code: string; isShift: boolean; notes: string[] }> {
    const map = new Map<string, string[]>();
    this.assignments.forEach(a => {
      const key = `${a.code}:${a.isShift}`;
      const list = map.get(key) || [];
      list.push(a.note);
      map.set(key, list);
    });

    const conflicts: Array<{ code: string; isShift: boolean; notes: string[] }> = [];
    map.forEach((notes, key) => {
      if (notes.length > 1) {
        const [code, shiftStr] = key.split(':');
        conflicts.push({ code, isShift: shiftStr === 'true', notes });
      }
    });

    return conflicts;
  }

  /**
   * Export mapping to JSON
   */
  public exportToJson(): string {
    return JSON.stringify({
      version: 2,
      profile: this.currentProfile,
      assignments: this.assignments,
    }, null, 2);
  }

  /**
   * Import mapping from JSON
   */
  public importFromJson(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data && Array.isArray(data.assignments)) {
        this.assignments = data.assignments.filter((a: any) => 
          typeof a.code === 'string' && 
          typeof a.midi === 'number' &&
          a.midi >= MIN_MIDI && 
          a.midi <= MAX_MIDI
        );
        if (data.profile) this.currentProfile = data.profile;
        this.save();
        this.notify();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import keyboard mappings:', e);
      return false;
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(l => l());
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.assignments));
      localStorage.setItem(STORAGE_PROFILE_KEY, this.currentProfile);
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  private load(): void {
    try {
      const savedProfile = localStorage.getItem(STORAGE_PROFILE_KEY) as KeyboardLayoutProfile | null;
      if (savedProfile) this.currentProfile = savedProfile;

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.assignments = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('LocalStorage load failed, using default preset:', e);
    }

    // Default to DAW Extended Preset
    this.assignments = buildDawExtendedPreset();
  }
}

export const keyboardMapping = new KeyboardMappingManager();
