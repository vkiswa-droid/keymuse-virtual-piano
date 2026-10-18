import { ParsedMidiNote, ParsedMidiSong } from './midiParser';

export interface VisualSong {
  id: string;
  title: string;
  composer: string;
  eraOrGenre: string;
  difficulty: 'Beginner' | 'Easy' | 'Intermediate';
  bpm: number;
  timeSignature: string;
  description: string;
  duration: number;
  notes: ParsedMidiNote[];
}

/**
 * Built-in Public Domain Masterworks for Piano Practice
 * Rich two-handed arrangements with distinct Left (Bass) and Right (Treble) hands
 */
export const PRACTICE_SONGS: VisualSong[] = [
  {
    id: 'ode-to-joy',
    title: 'Ode to Joy',
    composer: 'Ludwig van Beethoven',
    eraOrGenre: 'Classical / Symphony No. 9',
    difficulty: 'Beginner',
    bpm: 108,
    timeSignature: '4/4',
    duration: 24,
    description: 'Beethoven’s immortal hymn of universal brotherhood. Features smooth stepwise motion in the right hand supported by foundational bass notes in the left hand.',
    notes: [
      // Measure 1
      { midi: 64, note: 'E4', time: 0.0, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 48, note: 'C3', time: 0.0, duration: 1.0, velocity: 0.7, track: 1, hand: 'left' },
      { midi: 64, note: 'E4', time: 0.5, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 65, note: 'F4', time: 1.0, duration: 0.5, velocity: 0.85, track: 0, hand: 'right' },
      { midi: 55, note: 'G3', time: 1.0, duration: 1.0, velocity: 0.65, track: 1, hand: 'left' },
      { midi: 67, note: 'G4', time: 1.5, duration: 0.5, velocity: 0.85, track: 0, hand: 'right' },

      // Measure 2
      { midi: 67, note: 'G4', time: 2.0, duration: 0.5, velocity: 0.85, track: 0, hand: 'right' },
      { midi: 48, note: 'C3', time: 2.0, duration: 1.0, velocity: 0.7, track: 1, hand: 'left' },
      { midi: 65, note: 'F4', time: 2.5, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 64, note: 'E4', time: 3.0, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 55, note: 'G3', time: 3.0, duration: 1.0, velocity: 0.65, track: 1, hand: 'left' },
      { midi: 62, note: 'D4', time: 3.5, duration: 0.5, velocity: 0.75, track: 0, hand: 'right' },

      // Measure 3
      { midi: 60, note: 'C4', time: 4.0, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 53, note: 'F3', time: 4.0, duration: 1.0, velocity: 0.7, track: 1, hand: 'left' },
      { midi: 60, note: 'C4', time: 4.5, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 62, note: 'D4', time: 5.0, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 55, note: 'G3', time: 5.0, duration: 1.0, velocity: 0.7, track: 1, hand: 'left' },
      { midi: 64, note: 'E4', time: 5.5, duration: 0.5, velocity: 0.85, track: 0, hand: 'right' },

      // Measure 4
      { midi: 64, note: 'E4', time: 6.0, duration: 0.75, velocity: 0.85, track: 0, hand: 'right' },
      { midi: 48, note: 'C3', time: 6.0, duration: 1.0, velocity: 0.7, track: 1, hand: 'left' },
      { midi: 62, note: 'D4', time: 6.75, duration: 0.25, velocity: 0.75, track: 0, hand: 'right' },
      { midi: 62, note: 'D4', time: 7.0, duration: 1.0, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 55, note: 'G3', time: 7.0, duration: 1.0, velocity: 0.7, track: 1, hand: 'left' },

      // Measure 5
      { midi: 64, note: 'E4', time: 8.0, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 48, note: 'C3', time: 8.0, duration: 1.0, velocity: 0.7, track: 1, hand: 'left' },
      { midi: 64, note: 'E4', time: 8.5, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 65, note: 'F4', time: 9.0, duration: 0.5, velocity: 0.85, track: 0, hand: 'right' },
      { midi: 55, note: 'G3', time: 9.0, duration: 1.0, velocity: 0.65, track: 1, hand: 'left' },
      { midi: 67, note: 'G4', time: 9.5, duration: 0.5, velocity: 0.85, track: 0, hand: 'right' },

      // Measure 6
      { midi: 67, note: 'G4', time: 10.0, duration: 0.5, velocity: 0.85, track: 0, hand: 'right' },
      { midi: 48, note: 'C3', time: 10.0, duration: 1.0, velocity: 0.7, track: 1, hand: 'left' },
      { midi: 65, note: 'F4', time: 10.5, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 64, note: 'E4', time: 11.0, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 55, note: 'G3', time: 11.0, duration: 1.0, velocity: 0.65, track: 1, hand: 'left' },
      { midi: 62, note: 'D4', time: 11.5, duration: 0.5, velocity: 0.75, track: 0, hand: 'right' },

      // Measure 7
      { midi: 60, note: 'C4', time: 12.0, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 53, note: 'F3', time: 12.0, duration: 1.0, velocity: 0.7, track: 1, hand: 'left' },
      { midi: 60, note: 'C4', time: 12.5, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 62, note: 'D4', time: 13.0, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 55, note: 'G3', time: 13.0, duration: 1.0, velocity: 0.7, track: 1, hand: 'left' },
      { midi: 64, note: 'E4', time: 13.5, duration: 0.5, velocity: 0.85, track: 0, hand: 'right' },

      // Measure 8
      { midi: 62, note: 'D4', time: 14.0, duration: 0.75, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 55, note: 'G3', time: 14.0, duration: 1.0, velocity: 0.7, track: 1, hand: 'left' },
      { midi: 60, note: 'C4', time: 14.75, duration: 0.25, velocity: 0.75, track: 0, hand: 'right' },
      { midi: 60, note: 'C4', time: 15.0, duration: 1.0, velocity: 0.85, track: 0, hand: 'right' },
      { midi: 48, note: 'C3', time: 15.0, duration: 1.0, velocity: 0.75, track: 1, hand: 'left' },
    ],
  },
  {
    id: 'bach-minuet',
    title: 'Minuet in G Major',
    composer: 'Johann Sebastian Bach',
    eraOrGenre: 'Baroque / BWV Anh. 114',
    difficulty: 'Easy',
    bpm: 126,
    timeSignature: '3/4',
    duration: 20,
    description: 'From the Notebook for Anna Magdalena Bach. A dance in triple meter featuring delicate melodic turns and counterpoint.',
    notes: [
      // Measure 1
      { midi: 71, note: 'B4', time: 0.0, duration: 0.5, velocity: 0.85, track: 0, hand: 'right' },
      { midi: 55, note: 'G3', time: 0.0, duration: 1.5, velocity: 0.7, track: 1, hand: 'left' },
      { midi: 67, note: 'G4', time: 0.5, duration: 0.25, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 69, note: 'A4', time: 0.75, duration: 0.25, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 71, note: 'B4', time: 1.0, duration: 0.25, velocity: 0.85, track: 0, hand: 'right' },
      { midi: 72, note: 'C5', time: 1.25, duration: 0.25, velocity: 0.85, track: 0, hand: 'right' },

      // Measure 2
      { midi: 74, note: 'D5', time: 1.5, duration: 0.5, velocity: 0.9, track: 0, hand: 'right' },
      { midi: 59, note: 'B3', time: 1.5, duration: 1.5, velocity: 0.7, track: 1, hand: 'left' },
      { midi: 67, note: 'G4', time: 2.0, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 67, note: 'G4', time: 2.5, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },

      // Measure 3
      { midi: 72, note: 'C5', time: 3.0, duration: 0.5, velocity: 0.85, track: 0, hand: 'right' },
      { midi: 60, note: 'C4', time: 3.0, duration: 1.5, velocity: 0.7, track: 1, hand: 'left' },
      { midi: 74, note: 'D5', time: 3.5, duration: 0.25, velocity: 0.85, track: 0, hand: 'right' },
      { midi: 72, note: 'C5', time: 3.75, duration: 0.25, velocity: 0.85, track: 0, hand: 'right' },
      { midi: 71, note: 'B4', time: 4.0, duration: 0.25, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 69, note: 'A4', time: 4.25, duration: 0.25, velocity: 0.8, track: 0, hand: 'right' },

      // Measure 4
      { midi: 71, note: 'B4', time: 4.5, duration: 0.5, velocity: 0.85, track: 0, hand: 'right' },
      { midi: 59, note: 'B3', time: 4.5, duration: 1.5, velocity: 0.7, track: 1, hand: 'left' },
      { midi: 67, note: 'G4', time: 5.0, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 67, note: 'G4', time: 5.5, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },

      // Measure 5
      { midi: 69, note: 'A4', time: 6.0, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 57, note: 'A3', time: 6.0, duration: 1.5, velocity: 0.7, track: 1, hand: 'left' },
      { midi: 62, note: 'D4', time: 6.5, duration: 0.25, velocity: 0.75, track: 0, hand: 'right' },
      { midi: 64, note: 'E4', time: 6.75, duration: 0.25, velocity: 0.75, track: 0, hand: 'right' },
      { midi: 66, note: 'F#4', time: 7.0, duration: 0.25, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 67, note: 'G4', time: 7.25, duration: 0.25, velocity: 0.8, track: 0, hand: 'right' },

      // Measure 6
      { midi: 69, note: 'A4', time: 7.5, duration: 0.5, velocity: 0.85, track: 0, hand: 'right' },
      { midi: 66, note: 'F#3', time: 7.5, duration: 1.5, velocity: 0.7, track: 1, hand: 'left' },
      { midi: 62, note: 'D4', time: 8.0, duration: 0.5, velocity: 0.75, track: 0, hand: 'right' },
      { midi: 62, note: 'D4', time: 8.5, duration: 0.5, velocity: 0.75, track: 0, hand: 'right' },

      // Measure 7
      { midi: 71, note: 'B4', time: 9.0, duration: 0.5, velocity: 0.85, track: 0, hand: 'right' },
      { midi: 55, note: 'G3', time: 9.0, duration: 1.5, velocity: 0.7, track: 1, hand: 'left' },
      { midi: 67, note: 'G4', time: 9.5, duration: 0.25, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 69, note: 'A4', time: 9.75, duration: 0.25, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 71, note: 'B4', time: 10.0, duration: 0.25, velocity: 0.85, track: 0, hand: 'right' },
      { midi: 74, note: 'D5', time: 10.25, duration: 0.25, velocity: 0.9, track: 0, hand: 'right' },

      // Measure 8
      { midi: 67, note: 'G4', time: 10.5, duration: 1.5, velocity: 0.9, track: 0, hand: 'right' },
      { midi: 55, note: 'G3', time: 10.5, duration: 1.5, velocity: 0.8, track: 1, hand: 'left' },
    ],
  },
  {
    id: 'chopin-prelude',
    title: 'Prelude in E Minor',
    composer: 'Frédéric Chopin',
    eraOrGenre: 'Romantic / Op. 28 No. 4',
    difficulty: 'Intermediate',
    bpm: 66,
    timeSignature: '2/2',
    duration: 22,
    description: 'Chopin’s masterclass in emotional expression. Features a melancholic right-hand melody over descending chromatic left-hand chords.',
    notes: [
      // Measure 1
      { midi: 71, note: 'B4', time: 0.0, duration: 2.0, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 52, note: 'E3', time: 0.0, duration: 0.5, velocity: 0.65, track: 1, hand: 'left' },
      { midi: 55, note: 'G3', time: 0.0, duration: 0.5, velocity: 0.65, track: 1, hand: 'left' },
      { midi: 59, note: 'B3', time: 0.0, duration: 0.5, velocity: 0.65, track: 1, hand: 'left' },

      { midi: 52, note: 'E3', time: 0.5, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 55, note: 'G3', time: 0.5, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 59, note: 'B3', time: 0.5, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },

      { midi: 52, note: 'E3', time: 1.0, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 55, note: 'G3', time: 1.0, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 59, note: 'B3', time: 1.0, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },

      { midi: 52, note: 'E3', time: 1.5, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 55, note: 'G3', time: 1.5, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 59, note: 'B3', time: 1.5, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },

      // Measure 2
      { midi: 71, note: 'B4', time: 2.0, duration: 1.0, velocity: 0.75, track: 0, hand: 'right' },
      { midi: 70, note: 'A#4', time: 3.0, duration: 1.0, velocity: 0.75, track: 0, hand: 'right' },
      // Left hand chromatic shift
      { midi: 52, note: 'E3', time: 2.0, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 55, note: 'G3', time: 2.0, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 58, note: 'A#3', time: 2.0, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },

      { midi: 52, note: 'E3', time: 2.5, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 55, note: 'G3', time: 2.5, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 58, note: 'A#3', time: 2.5, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },

      { midi: 52, note: 'E3', time: 3.0, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 54, note: 'F#3', time: 3.0, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 58, note: 'A#3', time: 3.0, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },

      { midi: 52, note: 'E3', time: 3.5, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 54, note: 'F#3', time: 3.5, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 58, note: 'A#3', time: 3.5, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },

      // Measure 3
      { midi: 71, note: 'B4', time: 4.0, duration: 1.0, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 69, note: 'A4', time: 5.0, duration: 1.0, velocity: 0.75, track: 0, hand: 'right' },
      { midi: 52, note: 'E3', time: 4.0, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 53, note: 'F3', time: 4.0, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 57, note: 'A3', time: 4.0, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },

      { midi: 52, note: 'E3', time: 4.5, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 53, note: 'F3', time: 4.5, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 57, note: 'A3', time: 4.5, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },

      { midi: 52, note: 'E3', time: 5.0, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 53, note: 'F3', time: 5.0, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 57, note: 'A3', time: 5.0, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },

      { midi: 52, note: 'E3', time: 5.5, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 53, note: 'F3', time: 5.5, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 57, note: 'A3', time: 5.5, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },

      // Measure 4
      { midi: 67, note: 'G4', time: 6.0, duration: 2.0, velocity: 0.85, track: 0, hand: 'right' },
      { midi: 52, note: 'E3', time: 6.0, duration: 1.0, velocity: 0.7, track: 1, hand: 'left' },
      { midi: 55, note: 'G3', time: 6.0, duration: 1.0, velocity: 0.7, track: 1, hand: 'left' },
      { midi: 59, note: 'B3', time: 6.0, duration: 1.0, velocity: 0.7, track: 1, hand: 'left' },
    ],
  },
  {
    id: 'twinkle-twinkle',
    title: 'Twinkle, Twinkle, Little Star',
    composer: 'W.A. Mozart / Traditional',
    eraOrGenre: 'Classical Variations / K. 265',
    difficulty: 'Beginner',
    bpm: 100,
    timeSignature: '4/4',
    duration: 16,
    description: 'Mozart’s beloved theme with full left-hand broken chord accompaniment.',
    notes: [
      // Measure 1
      { midi: 60, note: 'C4', time: 0.0, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 48, note: 'C3', time: 0.0, duration: 1.0, velocity: 0.65, track: 1, hand: 'left' },
      { midi: 55, note: 'G3', time: 0.5, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 60, note: 'C4', time: 0.5, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },

      { midi: 67, note: 'G4', time: 1.0, duration: 0.5, velocity: 0.85, track: 0, hand: 'right' },
      { midi: 52, note: 'E3', time: 1.0, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 55, note: 'G3', time: 1.5, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 67, note: 'G4', time: 1.5, duration: 0.5, velocity: 0.85, track: 0, hand: 'right' },

      // Measure 2
      { midi: 69, note: 'A4', time: 2.0, duration: 0.5, velocity: 0.85, track: 0, hand: 'right' },
      { midi: 53, note: 'F3', time: 2.0, duration: 0.5, velocity: 0.65, track: 1, hand: 'left' },
      { midi: 57, note: 'A3', time: 2.5, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 69, note: 'A4', time: 2.5, duration: 0.5, velocity: 0.85, track: 0, hand: 'right' },

      { midi: 67, note: 'G4', time: 3.0, duration: 1.0, velocity: 0.85, track: 0, hand: 'right' },
      { midi: 52, note: 'E3', time: 3.0, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 55, note: 'G3', time: 3.5, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },

      // Measure 3
      { midi: 65, note: 'F4', time: 4.0, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 53, note: 'F3', time: 4.0, duration: 0.5, velocity: 0.65, track: 1, hand: 'left' },
      { midi: 57, note: 'A3', time: 4.5, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 65, note: 'F4', time: 4.5, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },

      { midi: 64, note: 'E4', time: 5.0, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 52, note: 'E3', time: 5.0, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 55, note: 'G3', time: 5.5, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 64, note: 'E4', time: 5.5, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },

      // Measure 4
      { midi: 62, note: 'D4', time: 6.0, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 50, note: 'D3', time: 6.0, duration: 0.5, velocity: 0.65, track: 1, hand: 'left' },
      { midi: 55, note: 'G3', time: 6.5, duration: 0.5, velocity: 0.6, track: 1, hand: 'left' },
      { midi: 62, note: 'D4', time: 6.5, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },

      { midi: 60, note: 'C4', time: 7.0, duration: 1.0, velocity: 0.85, track: 0, hand: 'right' },
      { midi: 48, note: 'C3', time: 7.0, duration: 1.0, velocity: 0.7, track: 1, hand: 'left' },
    ],
  },
  {
    id: 'happy-birthday',
    title: 'Happy Birthday to You',
    composer: 'Mildred & Patty Hill',
    eraOrGenre: 'Traditional Celebration',
    difficulty: 'Easy',
    bpm: 96,
    timeSignature: '3/4',
    duration: 14,
    description: 'The world’s most celebrated anthem with a full harmonic chord bed.',
    notes: [
      { midi: 60, note: 'C4', time: 0.0, duration: 0.35, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 60, note: 'C4', time: 0.4, duration: 0.15, velocity: 0.75, track: 0, hand: 'right' },
      { midi: 62, note: 'D4', time: 0.6, duration: 0.5, velocity: 0.85, track: 0, hand: 'right' },
      { midi: 48, note: 'C3', time: 0.6, duration: 1.0, velocity: 0.7, track: 1, hand: 'left' },
      { midi: 60, note: 'C4', time: 1.1, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 65, note: 'F4', time: 1.6, duration: 0.5, velocity: 0.85, track: 0, hand: 'right' },
      { midi: 53, note: 'F3', time: 1.6, duration: 1.0, velocity: 0.7, track: 1, hand: 'left' },
      { midi: 64, note: 'E4', time: 2.1, duration: 1.0, velocity: 0.85, track: 0, hand: 'right' },

      { midi: 60, note: 'C4', time: 3.2, duration: 0.35, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 60, note: 'C4', time: 3.6, duration: 0.15, velocity: 0.75, track: 0, hand: 'right' },
      { midi: 62, note: 'D4', time: 3.8, duration: 0.5, velocity: 0.85, track: 0, hand: 'right' },
      { midi: 48, note: 'C3', time: 3.8, duration: 1.0, velocity: 0.7, track: 1, hand: 'left' },
      { midi: 60, note: 'C4', time: 4.3, duration: 0.5, velocity: 0.8, track: 0, hand: 'right' },
      { midi: 67, note: 'G4', time: 4.8, duration: 0.5, velocity: 0.85, track: 0, hand: 'right' },
      { midi: 55, note: 'G3', time: 4.8, duration: 1.0, velocity: 0.7, track: 1, hand: 'left' },
      { midi: 65, note: 'F4', time: 5.3, duration: 1.0, velocity: 0.85, track: 0, hand: 'right' },
    ],
  },
];

// Alias for legacy backwards compatibility
export const SONGS_DATABASE: any[] = PRACTICE_SONGS;
