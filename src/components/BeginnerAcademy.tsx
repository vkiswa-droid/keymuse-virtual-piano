import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Volume2, 
  Award,
  RotateCcw
} from 'lucide-react';
import { Lesson, LessonExercise } from '../types';
import { LESSONS_DATABASE } from '../audio/lessonsData';
import { sampleEngine } from '../audio/sampleEngine';
import { Piano88, KeyHighlight } from './Piano88';
import { noteNameToMidi } from '../config/piano88';

interface BeginnerAcademyProps {
  octaveOffset: number;
  onOctaveChange: (newOffset: number) => void;
}

export const BeginnerAcademy: React.FC<BeginnerAcademyProps> = ({
  octaveOffset,
  onOctaveChange,
}) => {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  
  // Exercise verification state
  const [playedNotesSequence, setPlayedNotesSequence] = useState<string[]>([]);
  const [exerciseStatus, setExerciseStatus] = useState<'pending' | 'success'>('pending');
  const [lastUserMidi, setLastUserMidi] = useState<number | null>(null);

  const lesson: Lesson = LESSONS_DATABASE[currentLessonIndex] || LESSONS_DATABASE[0];
  const exercise: LessonExercise | undefined = lesson.exercises[currentExerciseIndex];

  // User plays note on piano
  const handleNoteDown = (midi: number, note: string) => {
    setLastUserMidi(midi);

    if (!exercise || exerciseStatus === 'success') return;

    if (exercise.type === 'sequence') {
      const expectedNote = exercise.targetNotes[playedNotesSequence.length];
      if (note === expectedNote) {
        const nextSequence = [...playedNotesSequence, note];
        setPlayedNotesSequence(nextSequence);

        if (nextSequence.length === exercise.targetNotes.length) {
          setExerciseStatus('success');
        }
      } else {
        // Reset sequence on error to try again cleanly
        setPlayedNotesSequence([]);
      }
    } else if (exercise.type === 'chord') {
      if (exercise.targetNotes.includes(note) && !playedNotesSequence.includes(note)) {
        const nextSequence = [...playedNotesSequence, note];
        setPlayedNotesSequence(nextSequence);

        if (nextSequence.length >= exercise.targetNotes.length) {
          setExerciseStatus('success');
        }
      }
    }
  };

  const handleAuditionChord = (notes: string[]) => {
    sampleEngine.initAudio();
    notes.forEach(n => {
      sampleEngine.playNote(n, 0.75);
    });
    setTimeout(() => {
      notes.forEach(n => sampleEngine.releaseNote(n));
    }, 1400);
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex + 1 < lesson.exercises.length) {
      setCurrentExerciseIndex(prev => prev + 1);
      setPlayedNotesSequence([]);
      setExerciseStatus('pending');
    } else {
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

  // Highlights for Piano88
  const pianoHighlights: KeyHighlight[] = [];
  if (exercise) {
    if (exercise.type === 'chord') {
      exercise.targetNotes.forEach(n => {
        pianoHighlights.push({ midi: noteNameToMidi(n), color: 'target' });
      });
    } else {
      const nextRequiredNote = exercise.targetNotes[playedNotesSequence.length];
      if (nextRequiredNote) {
        pianoHighlights.push({ midi: noteNameToMidi(nextRequiredNote), color: 'target' });
      }
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      marginTop: '16px',
    }}>
      {/* Lesson Selector Ribbon */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        background: '#12141a',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BookOpen size={16} color="#c084fc" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
              Beginner Piano Academy
            </h2>
          </div>
          <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
            Progressive curriculum designed for laptop keyboard and sampled grand piano.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', padding: '2px' }}>
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
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: isCurrent ? '#7c3aed' : 'rgba(255, 255, 255, 0.03)',
                  border: isCurrent ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: isCurrent ? '#ffffff' : '#94a3b8',
                  fontSize: '0.775rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {isDone ? <CheckCircle2 size={13} color="#34d399" /> : <span>{l.number}.</span>}
                <span>{l.title.split('&')[0].trim()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Lesson Card */}
      <div style={{
        background: '#12141a',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '8px',
        padding: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Lesson {lesson.number} • {lesson.category}
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0 0 0', color: '#f8fafc' }}>
              {lesson.title}
            </h3>
          </div>
          <span style={{ fontSize: '0.775rem', color: '#64748b' }}>
            {completedLessons.size} of {LESSONS_DATABASE.length} Lessons Finished
          </span>
        </div>

        {/* Concise Explanation Bullet Points */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '10px',
          marginBottom: '20px',
        }}>
          {lesson.explanation.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: '#171922',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '0.85rem',
                color: '#cbd5e1',
                lineHeight: 1.5,
              }}
            >
              {item}
            </div>
          ))}
        </div>

        {/* Interactive Exercise Box */}
        {exercise && (
          <div style={{
            background: exerciseStatus === 'success' ? 'rgba(16, 185, 129, 0.1)' : '#181a24',
            border: exerciseStatus === 'success' ? '1px solid #10b981' : '1px solid #7c3aed',
            borderRadius: '8px',
            padding: '16px',
            transition: 'all 0.2s ease',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={15} color="#c084fc" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
                  Interactive Exercise {currentExerciseIndex + 1} of {lesson.exercises.length}
                </span>
              </div>

              {exercise.type === 'chord' && (
                <button
                  onClick={() => handleAuditionChord(exercise.targetNotes)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid #38bdf8',
                    borderRadius: '4px',
                    color: '#38bdf8',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Volume2 size={13} />
                  <span>Audition Chord</span>
                </button>
              )}
            </div>

            <p style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
              {exercise.instruction}
            </p>
            <p style={{ margin: '0 0 14px 0', fontSize: '0.825rem', color: '#94a3b8' }}>
              💡 {exercise.hint}
            </p>

            {/* Target Keys to hit */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Target Notes:</span>
              {exercise.targetNotes.map((targetNote, tIdx) => {
                const isPlayed = playedNotesSequence.includes(targetNote);
                return (
                  <span
                    key={tIdx}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      background: isPlayed ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      border: isPlayed ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)',
                      color: isPlayed ? '#6ee7b7' : '#ffffff',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {targetNote} {isPlayed ? '✓' : ''}
                  </span>
                );
              })}
            </div>

            {/* Success Action */}
            {exerciseStatus === 'success' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.9rem' }}>
                  ✓ Exercise Complete! Excellent playing.
                </span>
                <button
                  onClick={handleNextExercise}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    background: '#2563eb',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <span>{currentExerciseIndex + 1 < lesson.exercises.length ? 'Next Step' : 'Finish Lesson'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Anchored 88-Key Piano */}
      <div>
        <Piano88
          octaveOffset={octaveOffset}
          onOctaveChange={onOctaveChange}
          highlights={pianoHighlights}
          onNoteDown={handleNoteDown}
        />
      </div>
    </div>
  );
};
