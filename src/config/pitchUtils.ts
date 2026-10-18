/**
 * Pure Pitch & MIDI Mathematics Utilities (Zero Dependencies)
 * Prevents circular dependencies between piano88, keyboardMapping, and audio engines.
 */

export const MIN_MIDI = 21;  // A0
export const MAX_MIDI = 108; // C8

export const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

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
  const pitchIndex = PITCH_CLASSES.indexOf(pitch as any);
  if (pitchIndex === -1) return 60;
  return (octave + 1) * 12 + pitchIndex;
}
