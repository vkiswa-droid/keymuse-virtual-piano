export type NoteName =
  | 'C3' | 'C#3' | 'D3' | 'D#3' | 'E3' | 'F3' | 'F#3' | 'G3' | 'G#3' | 'A3' | 'A#3' | 'B3'
  | 'C4' | 'C#4' | 'D4' | 'D#4' | 'E4' | 'F4' | 'F#4' | 'G4' | 'G#4' | 'A4' | 'A#4' | 'B4'
  | 'C5' | 'C#5' | 'D5' | 'D#5' | 'E5' | 'F5' | 'F#5' | 'G5' | 'G#5' | 'A5' | 'A#5' | 'B5'
  | 'C6' | 'C#6' | 'D6' | 'D#6' | 'E6' | 'F6' | 'F#6' | 'G6' | 'G#6' | 'A6' | 'A#6' | 'B6';

export type SoundType = 'piano' | 'soft' | 'synth';

export interface KeyMappingItem {
  code: string;       // e.g. "KeyA"
  keyLabel: string;   // e.g. "A"
  baseNote: string;   // e.g. "C"
  baseOctave: number; // e.g. 4
  isBlack: boolean;
  sharpOf?: string;   // e.g. "C" for "C#"
}

export interface PianoKeyInfo {
  note: string;       // e.g. "C4"
  pitchName: string;  // e.g. "C"
  octave: number;     // e.g. 4
  frequency: number;  // e.g. 261.63
  isBlack: boolean;
  keyLabel?: string;  // Laptop key like "A"
  code?: string;      // Event code like "KeyA"
}

export interface SongNote {
  note: string;       // e.g. "C4"
  duration: number;   // In beats (e.g., 1 for quarter note, 0.5 for eighth note)
  lyric?: string;     // Optional syllable
}

export interface Song {
  id: string;
  title: string;
  composerOrOrigin: string;
  difficulty: 'Beginner' | 'Easy' | 'Intermediate';
  bpm: number;
  description: string;
  notes: SongNote[];
}

export interface RecordedNote {
  note: string;
  startTime: number;  // In milliseconds from recording start
  duration: number;   // In milliseconds
}

export interface SavedRecording {
  id: string;
  title: string;
  createdAt: number;
  durationMs: number;
  notes: RecordedNote[];
}

export interface LessonExercise {
  instruction: string;
  hint: string;
  targetNotes: string[]; // Notes to play sequentially or simultaneously
  type: 'sequence' | 'chord';
}

export interface Lesson {
  id: string;
  number: number;
  title: string;
  category: 'Fundamentals' | 'Keyboard' | 'Melody' | 'Harmony' | 'Rhythm';
  summary: string;
  explanation: string[];
  visualHighlights?: string[]; // e.g. ['C4', 'E4', 'G4']
  exercises: LessonExercise[];
}
