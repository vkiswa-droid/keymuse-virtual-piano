/**
 * Standard 88-Key Piano Data & Geometry Model
 * Exactly 88 keys: A0 (MIDI 21) through C8 (MIDI 108)
 * 52 White Keys, 36 Black Keys
 * A4 = 440Hz, C4 = MIDI 60 (Middle C)
 */

export interface Piano88Key {
  midi: number;            // MIDI note number (21 to 108)
  note: string;            // Pitch with octave, e.g. "C4", "F#3"
  pitch: string;           // Pitch name without octave, e.g. "C", "F#"
  octave: number;          // Octave number (0 to 8)
  isBlack: boolean;        // True if accidental (black key)
  frequency: number;       // Equal temperament Hz (A4 = 440)
  whiteIndex: number;      // 0 to 51 for white keys, -1 for black keys
  blackIndex: number;      // 0 to 35 for black keys, -1 for white keys
  
  // Normalized horizontal position (0.0 to 1.0) along the 88-key bed
  leftPercent: number;     // Left coordinate in percent (0 to 100)
  widthPercent: number;    // Width in percent (0 to 100)
  
  // Laptop key label if mapped (e.g. "A", "W", "S")
  laptopKey?: string;
  laptopCode?: string;
}

export const TOTAL_KEYS = 88;
export const TOTAL_WHITE_KEYS = 52;
export const TOTAL_BLACK_KEYS = 36;
export const MIN_MIDI = 21;  // A0
export const MAX_MIDI = 108; // C8

export const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Calculates accurate frequency in Hz for equal temperament standard A4 = 440Hz
 */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Converts MIDI note number to note name string (e.g., 60 -> "C4", 69 -> "A4")
 */
export function midiToNoteName(midi: number): string {
  const pitch = PITCH_CLASSES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${pitch}${octave}`;
}

/**
 * Converts note name to MIDI note number (e.g., "C4" -> 60, "A4" -> 69)
 */
export function noteNameToMidi(noteName: string): number {
  const match = noteName.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) return 60;
  const pitch = match[1];
  const octave = parseInt(match[2], 10);
  const pitchIndex = PITCH_CLASSES.indexOf(pitch);
  if (pitchIndex === -1) return 60;
  return (octave + 1) * 12 + pitchIndex;
}

/**
 * Generate the complete standard 88-key piano model
 * Exactly 52 white keys and 36 black keys from A0 to C8
 */
export function generate88Keys(octaveOffset: number = 0): Piano88Key[] {
  const keys: Piano88Key[] = [];
  const whiteKeyWidthPercent = 100 / TOTAL_WHITE_KEYS; // ~1.923% per white key
  const blackKeyWidthPercent = whiteKeyWidthPercent * 0.62; // Standard black key width ratio

  let currentWhiteIndex = 0;
  let currentBlackIndex = 0;

  // First pass: create all keys and assign white key indices
  for (let midi = MIN_MIDI; midi <= MAX_MIDI; midi++) {
    const pitchClassIndex = midi % 12;
    const pitch = PITCH_CLASSES[pitchClassIndex];
    const octave = Math.floor(midi / 12) - 1;
    const isBlack = pitch.includes('#');
    const note = `${pitch}${octave}`;
    const frequency = midiToFrequency(midi);

    if (!isBlack) {
      const leftPercent = currentWhiteIndex * whiteKeyWidthPercent;
      keys.push({
        midi,
        note,
        pitch,
        octave,
        isBlack: false,
        frequency,
        whiteIndex: currentWhiteIndex,
        blackIndex: -1,
        leftPercent,
        widthPercent: whiteKeyWidthPercent,
      });
      currentWhiteIndex++;
    } else {
      keys.push({
        midi,
        note,
        pitch,
        octave,
        isBlack: true,
        frequency,
        whiteIndex: -1,
        blackIndex: currentBlackIndex,
        leftPercent: 0, // will be computed in second pass relative to adjacent white keys
        widthPercent: blackKeyWidthPercent,
      });
      currentBlackIndex++;
    }
  }

  // Second pass: position black keys between white keys with acoustic piano offsets
  // On a real piano:
  // C# is shifted slightly left of center between C and D
  // D# is shifted slightly right of center between D and E
  // F# is shifted slightly left between F and G
  // G# is centered between G and A
  // A# is shifted slightly right between A and B
  keys.forEach((key, index) => {
    if (key.isBlack) {
      // Find the white key immediately preceding this black key
      const prevWhiteKey = keys.slice(0, index).reverse().find(k => !k.isBlack);
      if (prevWhiteKey) {
        let offsetFactor = 0.5; // Default centered on border
        const pitch = key.pitch;

        if (pitch === 'C#') {
          offsetFactor = 0.42; // slightly left
        } else if (pitch === 'D#') {
          offsetFactor = 0.58; // slightly right
        } else if (pitch === 'F#') {
          offsetFactor = 0.38; // slightly left
        } else if (pitch === 'G#') {
          offsetFactor = 0.50; // centered
        } else if (pitch === 'A#') {
          offsetFactor = 0.62; // slightly right
        }

        // Left coordinate starts at the boundary of prevWhiteKey
        const boundaryPercent = prevWhiteKey.leftPercent + prevWhiteKey.widthPercent;
        key.leftPercent = boundaryPercent - (blackKeyWidthPercent * offsetFactor);
      }
    }
  });

  // Assign laptop keyboard mapping based on octaveOffset
  // Base octave is 4 (C4 = Middle C) shifted by octaveOffset
  const targetBaseOctave = 4 + octaveOffset;
  const laptopMap: Record<string, { key: string; code: string }> = {
    [`C${targetBaseOctave}`]: { key: 'A', code: 'KeyA' },
    [`C#${targetBaseOctave}`]: { key: 'W', code: 'KeyW' },
    [`D${targetBaseOctave}`]: { key: 'S', code: 'KeyS' },
    [`D#${targetBaseOctave}`]: { key: 'E', code: 'KeyE' },
    [`E${targetBaseOctave}`]: { key: 'D', code: 'KeyD' },
    [`F${targetBaseOctave}`]: { key: 'F', code: 'KeyF' },
    [`F#${targetBaseOctave}`]: { key: 'T', code: 'KeyT' },
    [`G${targetBaseOctave}`]: { key: 'G', code: 'KeyG' },
    [`G#${targetBaseOctave}`]: { key: 'Y', code: 'KeyY' },
    [`A${targetBaseOctave}`]: { key: 'H', code: 'KeyH' },
    [`A#${targetBaseOctave}`]: { key: 'U', code: 'KeyU' },
    [`B${targetBaseOctave}`]: { key: 'J', code: 'KeyJ' },
    [`C${targetBaseOctave + 1}`]: { key: 'K', code: 'KeyK' },
    [`C#${targetBaseOctave + 1}`]: { key: 'O', code: 'KeyO' },
    [`D${targetBaseOctave + 1}`]: { key: 'L', code: 'KeyL' },
    [`D#${targetBaseOctave + 1}`]: { key: 'P', code: 'KeyP' },
    [`E${targetBaseOctave + 1}`]: { key: ';', code: 'Semicolon' },
  };

  keys.forEach(k => {
    const mapping = laptopMap[k.note];
    if (mapping) {
      k.laptopKey = mapping.key;
      k.laptopCode = mapping.code;
    }
  });

  return keys;
}

export const PIANO_88_KEYS = generate88Keys(0);
