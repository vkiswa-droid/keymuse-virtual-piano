import { KeyMappingItem } from '../types';

/**
 * Global application title - easily configurable
 */
export const APP_NAME = 'KeyMuse';
export const APP_TAGLINE = 'Your laptop. Your music. Your possibilities.';

export const BASE_OCTAVE = 4;
export const MIN_OCTAVE_OFFSET = -2;
export const MAX_OCTAVE_OFFSET = 2;

// The strict mapping specified in requirements:
// White: A (C4), S (D4), D (E4), F (F4), G (G4), H (A4), J (B4), K (C5), L (D5), Semicolon (E5)
// Black: W (C#4), E (D#4), T (F#4), Y (G#4), U (A#4), O (C#5), P (D#5)
export const KEY_MAPPINGS: KeyMappingItem[] = [
  // C4 octave
  { code: 'KeyA', keyLabel: 'A', baseNote: 'C', baseOctave: 4, isBlack: false },
  { code: 'KeyW', keyLabel: 'W', baseNote: 'C#', baseOctave: 4, isBlack: true, sharpOf: 'C' },
  { code: 'KeyS', keyLabel: 'S', baseNote: 'D', baseOctave: 4, isBlack: false },
  { code: 'KeyE', keyLabel: 'E', baseNote: 'D#', baseOctave: 4, isBlack: true, sharpOf: 'D' },
  { code: 'KeyD', keyLabel: 'D', baseNote: 'E', baseOctave: 4, isBlack: false },
  { code: 'KeyF', keyLabel: 'F', baseNote: 'F', baseOctave: 4, isBlack: false },
  { code: 'KeyT', keyLabel: 'T', baseNote: 'F#', baseOctave: 4, isBlack: true, sharpOf: 'F' },
  { code: 'KeyG', keyLabel: 'G', baseNote: 'G', baseOctave: 4, isBlack: false },
  { code: 'KeyY', keyLabel: 'Y', baseNote: 'G#', baseOctave: 4, isBlack: true, sharpOf: 'G' },
  { code: 'KeyH', keyLabel: 'H', baseNote: 'A', baseOctave: 4, isBlack: false },
  { code: 'KeyU', keyLabel: 'U', baseNote: 'A#', baseOctave: 4, isBlack: true, sharpOf: 'A' },
  { code: 'KeyJ', keyLabel: 'J', baseNote: 'B', baseOctave: 4, isBlack: false },
  
  // C5 upper range
  { code: 'KeyK', keyLabel: 'K', baseNote: 'C', baseOctave: 5, isBlack: false },
  { code: 'KeyO', keyLabel: 'O', baseNote: 'C#', baseOctave: 5, isBlack: true, sharpOf: 'C' },
  { code: 'KeyL', keyLabel: 'L', baseNote: 'D', baseOctave: 5, isBlack: false },
  { code: 'KeyP', keyLabel: 'P', baseNote: 'D#', baseOctave: 5, isBlack: true, sharpOf: 'D' },
  { code: 'Semicolon', keyLabel: ';', baseNote: 'E', baseOctave: 5, isBlack: false },
];

// Semitone offsets from C
export const NOTE_SEMITONES: Record<string, number> = {
  'C': 0,
  'C#': 1,
  'D': 2,
  'D#': 3,
  'E': 4,
  'F': 5,
  'F#': 6,
  'G': 7,
  'G#': 8,
  'A': 9,
  'A#': 10,
  'B': 11,
};

export const PITCH_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Calculates accurate frequency in Hz for standard equal temperament A4 = 440Hz
 */
export function getNoteFrequency(noteName: string): number {
  const match = noteName.match(/^([A-G]#?)(\d)$/);
  if (!match) return 440;
  const pitch = match[1];
  const octave = parseInt(match[2], 10);
  const semitone = NOTE_SEMITONES[pitch];
  if (semitone === undefined) return 440;
  
  // MIDI number: C4 is 60, A4 is 69 (440Hz)
  const midi = (octave + 1) * 12 + semitone;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Converts a note name with an octave offset
 */
export function getShiftedNote(noteName: string, octaveOffset: number): string {
  const match = noteName.match(/^([A-G]#?)(\d)$/);
  if (!match) return noteName;
  const pitch = match[1];
  const octave = parseInt(match[2], 10) + octaveOffset;
  return `${pitch}${octave}`;
}
