import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Music, 
  Volume2, 
  HelpCircle,
  Award
} from 'lucide-react';
import { Lesson, LessonExercise } from '../types';
import { LESSONS_DATABASE } from '../audio/lessonsData';
import { soundEngine } from '../audio/soundEngine';
import { KEY_MAPPINGS } from '../config/constants';

interface BeginnerAcademyProps {
  octaveOffset: number;
  onSetTargetNotes: (notes: string[]) => void;
  lastPlayedNote: string | null;
}

export const BeginnerAcademy: React.FC<BeginnerAcademyProps> = ({
  octaveOffset,
  onSetTargetNotes,
  lastPlayedNote,
}) => {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  
  // Exercise verification state
  const [playedNotesSequence, setPlayedNotesSequence] = useState<string[]>([]);
  const [exerciseStatus, setExerciseStatus] = useState<'pending' | 'success'>('pending');

  const lesson: Lesson = LESSONS_DATABASE[currentLessonIndex] || LESSONS_DATABASE[0];
  const exercise: LessonExercise | undefined = lesson.exercises[currentExerciseIndex];

  // Helper to find laptop key for a given note
  const getLaptopKeyForNote = (noteName: string): string => {
    const match = noteName.match(/^([A-G]#?)(\d)$/);
    if (!match) return '?';
    const pitch = match[1];
    const octave = parseInt(match[2], 10);
    const baseOctave = octave - octaveOffset;

    const mapping = KEY_MAPPINGS.find(m => m.baseNote === pitch && m.baseOctave === baseOctave);
    return mapping ? mapping.keyLabel : '?';
  };

  // Sync target notes to piano keyboard component
  useEffect(() => {
    if (exercise) {
      if (exercise.type === 'chord') {
        onSetTargetNotes(exercise.targetNotes);
      } else {
        // Highlight next required note in sequence
        const nextRequiredNote = exercise.targetNotes[playedNotesSequence.length];
        if (nextRequiredNote) {
          onSetTargetNotes([nextRequiredNote]);
        } else {
          onSetTargetNotes([]);
        }
      }
    } else if (lesson.visualHighlights) {
      onSetTargetNotes(lesson.visualHighlights);
    } else {
      onSetTargetNotes([]);
    }
  }, [lesson, exercise, playedNotesSequence, onSetTargetNotes]);

  // Track user input for exercises
  useEffect(() => {
    if (!lastPlayedNote || !exercise || exerciseStatus === 'success') return;

    if (exercise.type === 'sequence') {
      const expectedNote = exercise.targetNotes[playedNotesSequence.length];
      if (lastPlayedNote === expectedNote) {
        const nextSequence = [...playedNotesSequence, lastPlayedNote];
        setPlayedNotesSequence(nextSequence);

        if (nextSequence.length === exercise.targetNotes.length) {
          setExerciseStatus('success');
        }
      } else {
        // Wrong note played in sequence - reset sequence for retry
        setPlayedNotesSequence([]);
      }
    } else if (exercise.type === 'chord') {
      // For chord, if user plays one of the chord notes, add to sequence if not present
      if (exercise.targetNotes.includes(lastPlayedNote) && !playedNotesSequence.includes(lastPlayedNote)) {
        const nextSequence = [...playedNotesSequence, lastPlayedNote];
        setPlayedNotesSequence(nextSequence);

        if (nextSequence.length >= exercise.targetNotes.length) {
          setExerciseStatus('success');
        }
      }
    }
  }, [lastPlayedNote, exercise, exerciseStatus, playedNotesSequence]);

  const handleAuditionChord = (notes: string[]) => {
    soundEngine.initAudio();
    notes.forEach(note => {
      soundEngine.playNote(note, 0.75);
    });
    setTimeout(() => {
      notes.forEach(note => soundEngine.releaseNote(note));
    }, 1200);
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex + 1 < lesson.exercises.length) {
      setCurrentExerciseIndex(prev => prev + 1);
      setPlayedNotesSequence([]);
      setExerciseStatus('pending');
    } else {
      // Completed this lesson!
      setCompletedLessons(prev => new Set(prev).add(lesson.id));
      if (currentLessonIndex + 1 < LESSONS_DATABASE.length) {
        setCurrentLessonIndex(prev => prev + 1);
        setCurrentExerciseIndex(0);
        setPlayedNotesSequence([]);
        setExerciseStatus('pending');
      }
    }
  };

  const handleSelectLesson = (idx: number) => {
    setCurrentLessonIndex(idx);
    setCurrentExerciseIndex(0);
    setPlayedNotesSequence([]);
    setExerciseStatus('pending');
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
      {/* Academy Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <BookOpen size={20} color="var(--accent-purple)" />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Beginner Music Academy</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', margin: 0 }}>
            Structured, bite-sized lessons designed specifically for learning music theory on a laptop keyboard.
          </p>
        </div>

        <div className="pill-badge purple">
          <span>{completedLessons.size} of {LESSONS_DATABASE.length} Lessons Completed</span>
        </div>
      </div>

      {/* Lesson Selector Ribbon */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        background: 'rgba(0, 0, 0, 0.35)',
        padding: '6px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '1.5rem',
        overflowX: 'auto',
      }}>
        {LESSONS_DATABASE.map((l, index) => {
          const isCurrent = index === currentLessonIndex;
          const isDone = completedLessons.has(l.id);

          return (
            <button
              key={l.id}
              onClick={() => handleSelectLesson(index)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: isCurrent ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(79, 70, 229, 0.3))' : 'transparent',
                border: isCurrent ? '1px solid var(--accent-purple)' : '1px solid transparent',
                color: isCurrent ? '#ffffff' : 'var(--text-dim)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {isDone ? (
                <CheckCircle2 size={15} color="var(--accent-emerald)" />
              ) : (
                <span style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: isCurrent ? 'var(--accent-purple)' : 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}>
                  {l.number}
                </span>
              )}
              <span>{l.title}</span>
            </button>
          );
        })}
      </div>

      {/* Active Lesson Details */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
      }}>
        {/* Lesson Title & Category */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="pill-badge cyan">{lesson.category}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lesson {lesson.number}</span>
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
            {lesson.title}
          </h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-dim)', margin: 0, lineHeight: 1.5 }}>
            {lesson.summary}
          </p>
        </div>

        {/* Lesson Points */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}>
          {lesson.explanation.map((paragraph, pIdx) => (
            <div
              key={pIdx}
              style={{
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                fontSize: '0.875rem',
                color: 'var(--text-dim)',
                lineHeight: 1.55,
              }}
            >
              {paragraph}
            </div>
          ))}
        </div>

        {/* Interactive Lesson Exercise Box */}
        {exercise && (
          <div style={{
            background: exerciseStatus === 'success' 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15))' 
              : 'rgba(0, 0, 0, 0.4)',
            border: exerciseStatus === 'success' 
              ? '1px solid var(--accent-emerald)' 
              : '1px solid rgba(139, 92, 246, 0.35)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            transition: 'all 0.3s ease',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} color="var(--accent-purple)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                  Interactive Exercise {currentExerciseIndex + 1} of {lesson.exercises.length}
                </span>
              </div>

              {exercise.type === 'chord' && (
                <button
                  onClick={() => handleAuditionChord(exercise.targetNotes)}
                  className="btn btn-secondary btn-sm"
                  title="Listen to how this chord sounds"
                >
                  <Volume2 size={14} color="var(--accent-cyan)" />
                  <span>Audition Chord</span>
                </button>
              )}
            </div>

            <p style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.5rem 0', color: '#f8fafc' }}>
              {exercise.instruction}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
              💡 {exercise.hint}
            </p>

            {/* Target Keys Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Target Keys:</span>
              {exercise.targetNotes.map((targetNote, tIdx) => {
                const isPlayed = playedNotesSequence.includes(targetNote);
                return (
                  <div
                    key={tIdx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.4rem 0.75rem',
                      borderRadius: 8,
                      background: isPlayed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                      border: isPlayed ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: isPlayed ? '#6ee7b7' : '#ffffff' }}>
                      {targetNote}
                    </span>
                    <span className="key-badge-laptop" style={{
                      background: isPlayed ? 'var(--accent-emerald)' : '#1e293b',
                      color: isPlayed ? '#041019' : '#f8fafc',
                      borderColor: isPlayed ? '#34d399' : '#475569',
                    }}>
                      {getLaptopKeyForNote(targetNote)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Exercise Completion Action */}
            {exerciseStatus === 'success' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(16, 185, 129, 0.3)',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6ee7b7', fontWeight: 700 }}>
                  <CheckCircle2 size={18} />
                  <span>Excellent! Exercise complete!</span>
                </div>

                <button
                  onClick={handleNextExercise}
                  className="btn btn-primary btn-sm"
                >
                  <span>
                    {currentExerciseIndex + 1 < lesson.exercises.length ? 'Next Exercise' : 'Finish Lesson'}
                  </span>
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
