import { Lesson } from '../types';

export const LESSONS_DATABASE: Lesson[] = [
  {
    id: 'lesson-1-note-names',
    number: 1,
    title: 'The Musical Alphabet & Middle C',
    category: 'Fundamentals',
    summary: 'Discover the 7 natural notes of the musical alphabet and locate Middle C on your keyboard.',
    explanation: [
      'In Western music, notes repeat continuously using only seven letters: A, B, C, D, E, F, and G.',
      'After G, the cycle starts right back at A, but in a higher pitch (the next "octave").',
      'The most important landmark for any pianist is "Middle C" (C4). On your laptop keyboard, Middle C is mapped to the [A] key.',
      'Notice how the white keys sit under your fingertips in alphabetical sequence: C (A), D (S), E (D), F (F), G (G), A (H), B (J), and back to C (K).'
    ],
    visualHighlights: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
    exercises: [
      {
        instruction: 'Play Middle C (C4) on your keyboard by pressing [A].',
        hint: 'Middle C is the white key labeled [A]. Press it once to hear the anchor of the keyboard.',
        targetNotes: ['C4'],
        type: 'sequence',
      },
      {
        instruction: 'Play the ascending musical alphabet from C4 up to G4: [A] -> [S] -> [D] -> [F] -> [G].',
        hint: 'Press each key sequentially: C, D, E, F, G.',
        targetNotes: ['C4', 'D4', 'E4', 'F4', 'G4'],
        type: 'sequence',
      },
      {
        instruction: 'Play the full octave from C4 to C5: [A] -> [S] -> [D] -> [F] -> [G] -> [H] -> [J] -> [K].',
        hint: 'Notice how both C4 and C5 sound like the exact same musical note, just at a higher pitch!',
        targetNotes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
        type: 'sequence',
      },
    ],
  },
  {
    id: 'lesson-2-white-black-keys',
    number: 2,
    title: 'White & Black Keys (Sharps and Flats)',
    category: 'Keyboard',
    summary: 'Understand the difference between Natural notes (white keys) and Accidentals (black keys).',
    explanation: [
      'Look closely at the piano keyboard: the black keys appear in repeating alternating groups of TWO and THREE.',
      'Black keys are called "Accidentals". A Sharp (#) raises a note by half a step (semitone). A Flat (♭) lowers a note by half a step.',
      'For example, the black key just above C is called C-Sharp (C#) or D-Flat (D♭). On your laptop, press [W] to play C#4.',
      'Notice that there are NO black keys between E and F, and between B and C. This is a natural acoustic property of the major scale!'
    ],
    visualHighlights: ['C#4', 'D#4', 'F#4', 'G#4', 'A#4'],
    exercises: [
      {
        instruction: 'Play the two-black-key group: C#4 ([W]) followed by D#4 ([E]).',
        hint: 'The keys [W] and [E] form the twin black key group right above C, D, and E.',
        targetNotes: ['C#4', 'D#4'],
        type: 'sequence',
      },
      {
        instruction: 'Play the three-black-key group: F#4 ([T]), G#4 ([Y]), and A#4 ([U]).',
        hint: 'These three keys form the triplet black key group above F, G, and A.',
        targetNotes: ['F#4', 'G#4', 'A#4'],
        type: 'sequence',
      },
      {
        instruction: 'Play a chromatic scale snippet: C4 -> C#4 -> D4 -> D#4 -> E4 ([A] -> [W] -> [S] -> [E] -> [D]).',
        hint: 'Playing every white and black key in order creates a half-step chromatic motion.',
        targetNotes: ['C4', 'C#4', 'D4', 'D#4', 'E4'],
        type: 'sequence',
      },
    ],
  },
  {
    id: 'lesson-3-basic-melodies',
    number: 3,
    title: 'Building Your First Melodies',
    category: 'Melody',
    summary: 'Learn how simple melodic contours and step motions create recognizable musical phrases.',
    explanation: [
      'A melody is created by stringing individual musical notes together over time.',
      'Stepwise motion means moving from one note directly to the adjacent white key (e.g., C to D).',
      'Leap motion means skipping one or more notes (e.g., C to G).',
      'Combining steps and leaps creates tension and emotional resolution in music.'
    ],
    visualHighlights: ['C4', 'D4', 'E4', 'G4'],
    exercises: [
      {
        instruction: 'Play the iconic 3-note stepwise folk motif: E4 -> D4 -> C4 -> D4 -> E4 -> E4 -> E4 ([D] [S] [A] [S] [D] [D] [D]).',
        hint: 'This is the opening of "Mary Had a Little Lamb"!',
        targetNotes: ['E4', 'D4', 'C4', 'D4', 'E4', 'E4', 'E4'],
        type: 'sequence',
      },
      {
        instruction: 'Practice a fifth leap: C4 ([A]) jumping straight up to G4 ([G]) and back down to C4.',
        hint: 'This fifth leap is the opening of both "Twinkle Twinkle" and "Star Wars"!',
        targetNotes: ['C4', 'G4', 'C4'],
        type: 'sequence',
      },
    ],
  },
  {
    id: 'lesson-4-simple-chords',
    number: 4,
    title: 'Playing Chords & Harmony (Triads)',
    category: 'Harmony',
    summary: 'Combine three notes together simultaneously to create lush, resonant piano chords.',
    explanation: [
      'A "Chord" is when you play two or more notes at the exact same time.',
      'The most foundational chord in music is the "Triad", built by stacking thirds (skipping every other white key).',
      'The C Major Chord (C - E - G) sounds bright, happy, and resolved. On your laptop, press [A], [D], and [G] together!',
      'Minor chords sound melancholic or thoughtful. For example, A Minor (A - C - E) uses [H], [K], and [Semicolon] (or [H], [A], [D]).',
      'Most pop songs in history use just four chords: C Major, G Major, A Minor, and F Major!'
    ],
    visualHighlights: ['C4', 'E4', 'G4', 'F4', 'A4', 'C5', 'B4', 'D5'],
    exercises: [
      {
        instruction: 'Play the C Major Chord (Triad): C4 + E4 + G4 ([A] + [D] + [G]).',
        hint: 'Hold [A], [D], and [G] together simultaneously with your left or right hand.',
        targetNotes: ['C4', 'E4', 'G4'],
        type: 'chord',
      },
      {
        instruction: 'Play the F Major Chord (Triad): F4 + A4 + C5 ([F] + [H] + [K]).',
        hint: 'Press [F], [H], and [K] simultaneously. Notice the warm, uplifting harmony.',
        targetNotes: ['F4', 'A4', 'C5'],
        type: 'chord',
      },
      {
        instruction: 'Play the G Major Chord (Triad): G4 + B4 + D5 ([G] + [J] + [L]).',
        hint: 'Press [G], [J], and [L] simultaneously. This chord naturally wants to resolve back to C Major.',
        targetNotes: ['G4', 'B4', 'D5'],
        type: 'chord',
      },
      {
        instruction: 'Play the A Minor Chord: A4 + C5 + E5 ([H] + [K] + [;]).',
        hint: 'Press [H], [K], and [;] (semicolon). Notice how minor chords have an emotional, tender character.',
        targetNotes: ['A4', 'C5', 'E5'],
        type: 'chord',
      },
    ],
  },
  {
    id: 'lesson-5-rhythm-timing',
    number: 5,
    title: 'Rhythm, Tempo, and Metronome Timing',
    category: 'Rhythm',
    summary: 'Master the heartbeat of music: quarter notes, counting in 4/4 time, and staying steady.',
    explanation: [
      'Music is pitch organized in time. Without rhythm, notes are just isolated sounds.',
      'A "Beat" is the steady pulse you tap your foot to.',
      '"BPM" stands for Beats Per Minute. 60 BPM is one beat per second; 120 BPM is twice as fast.',
      'A Quarter Note receives 1 beat. A Half Note receives 2 beats. A Whole Note is held for 4 full beats.',
      'Using the Metronome built into KeyMuse is the secret weapon used by every master musician to build internal rhythm.'
    ],
    visualHighlights: ['C4', 'D4', 'E4', 'F4', 'G4'],
    exercises: [
      {
        instruction: 'Play 4 steady quarter notes on Middle C: [A] -> [A] -> [A] -> [A].',
        hint: 'Count out loud: "1, 2, 3, 4" and tap Middle C on each number with even timing.',
        targetNotes: ['C4', 'C4', 'C4', 'C4'],
        type: 'sequence',
      },
      {
        instruction: 'Play a rhythmic scale pattern: C4, C4, D4, D4, E4, E4, C4 ([A] [A] [S] [S] [D] [D] [A]).',
        hint: 'Keep a steady, bouncing rhythm on each double tap.',
        targetNotes: ['C4', 'C4', 'D4', 'D4', 'E4', 'E4', 'C4'],
        type: 'sequence',
      },
    ],
  },
];
