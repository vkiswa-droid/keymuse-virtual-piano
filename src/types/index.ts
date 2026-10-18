export type NoteName = string;

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
