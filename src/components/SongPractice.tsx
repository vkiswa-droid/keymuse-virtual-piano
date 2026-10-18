import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  SkipForward, 
  Play, 
  Pause, 
  CheckCircle2, 
  Music, 
  Gauge, 
  Award,
  ArrowRight
} from 'lucide-react';
import { Song, SongNote } from '../types';
import { SONGS_DATABASE } from '../audio/songsData';
import { soundEngine } from '../audio/soundEngine';
import { KEY_MAPPINGS } from '../config/constants';

interface SongPracticeProps {
  octaveOffset: number;
  onSetTargetNotes: (notes: string[]) => void;
  lastPlayedNote: string | null;
}

export const SongPractice: React.FC<SongPracticeProps> = ({
  octaveOffset,
  onSetTargetNotes,
  lastPlayedNote,
}) => {
  const [selectedSongId, setSelectedSongId] = useState<string>('twinkle-twinkle');
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number>(0);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [isPlayingAudioGuide, setIsPlayingAudioGuide] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [correctStreak, setCorrectStreak] = useState<number>(0);

  const audioGuideTimerRef = useRef<number | null>(null);

  const currentSong: Song = SONGS_DATABASE.find(s => s.id === selectedSongId) || SONGS_DATABASE[0];
  const currentSongNote: SongNote | undefined = currentSong.notes[currentNoteIndex];

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

  // Sync target note to piano keyboard component
  useEffect(() => {
    if (isCompleted || !currentSongNote) {
      onSetTargetNotes([]);
    } else {
      onSetTargetNotes([currentSongNote.note]);
    }
  }, [currentSongNote, isCompleted, onSetTargetNotes]);

  // Clean up audio guide timer on unmount or song switch
  useEffect(() => {
    return () => {
      if (audioGuideTimerRef.current !== null) {
        window.clearTimeout(audioGuideTimerRef.current);
      }
      setIsPlayingAudioGuide(false);
    };
  }, [selectedSongId]);

  // Listen to user playing the target note
  useEffect(() => {
    if (!lastPlayedNote || isPlayingAudioGuide || isCompleted || !currentSongNote) return;

    if (lastPlayedNote === currentSongNote.note) {
      // User hit the correct note!
      setCorrectStreak(prev => prev + 1);

      if (currentNoteIndex + 1 >= currentSong.notes.length) {
        setIsCompleted(true);
        onSetTargetNotes([]);
      } else {
        setCurrentNoteIndex(prev => prev + 1);
      }
    }
  }, [lastPlayedNote, currentSongNote, currentNoteIndex, currentSong.notes.length, isPlayingAudioGuide, isCompleted, onSetTargetNotes]);

  const handleSelectSong = (songId: string) => {
    stopAudioGuide();
    setSelectedSongId(songId);
    setCurrentNoteIndex(0);
    setIsCompleted(false);
    setCorrectStreak(0);
  };

  const handleRestart = () => {
    stopAudioGuide();
    setCurrentNoteIndex(0);
    setIsCompleted(false);
    setCorrectStreak(0);
  };

  const handleSkipNote = () => {
    if (currentNoteIndex + 1 >= currentSong.notes.length) {
      setIsCompleted(true);
      onSetTargetNotes([]);
    } else {
      setCurrentNoteIndex(prev => prev + 1);
    }
  };

  const stopAudioGuide = () => {
    if (audioGuideTimerRef.current !== null) {
      window.clearTimeout(audioGuideTimerRef.current);
      audioGuideTimerRef.current = null;
    }
    setIsPlayingAudioGuide(false);
    soundEngine.stopAllNotes();
  };

  const startAudioGuide = () => {
    if (isPlayingAudioGuide) {
      stopAudioGuide();
      return;
    }

    soundEngine.initAudio();
    setIsPlayingAudioGuide(true);
    setIsCompleted(false);

    let noteIdx = currentNoteIndex;
    const baseBeatSeconds = (60 / currentSong.bpm) / speedMultiplier;

    const playNextStep = () => {
      if (noteIdx >= currentSong.notes.length) {
        stopAudioGuide();
        setIsCompleted(true);
        return;
      }

      const songNote = currentSong.notes[noteIdx];
      setCurrentNoteIndex(noteIdx);
      soundEngine.playNote(songNote.note);

      const noteDurationMs = songNote.duration * baseBeatSeconds * 1000;
      
      // Schedule note release slightly before the next note
      setTimeout(() => {
        soundEngine.releaseNote(songNote.note);
      }, noteDurationMs * 0.85);

      noteIdx++;
      audioGuideTimerRef.current = window.setTimeout(playNextStep, noteDurationMs);
    };

    playNextStep();
  };

  const progressPercent = Math.round((currentNoteIndex / currentSong.notes.length) * 100);

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
      {/* Song Selector Header */}
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
            <Sparkles size={20} color="var(--accent-purple)" />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Interactive Song Practice</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', margin: 0 }}>
            Play notes sequentially on your laptop keyboard. The piano lights up the exact key to press.
          </p>
        </div>

        {/* Song Selector Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          background: 'rgba(0, 0, 0, 0.4)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
        }}>
          {SONGS_DATABASE.map(song => (
            <button
              key={song.id}
              onClick={() => handleSelectSong(song.id)}
              className={`btn btn-sm ${selectedSongId === song.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none' }}
            >
              <Music size={14} />
              <span>{song.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Song Information Card */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem',
        }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
              {currentSong.title}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              {currentSong.composerOrOrigin} • {currentSong.description}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span className="pill-badge purple">
              Difficulty: {currentSong.difficulty}
            </span>
            <span className="pill-badge cyan">
              Tempo: {Math.round(currentSong.bpm * speedMultiplier)} BPM
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.4rem' }}>
            <span>Song Progress</span>
            <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
              Note {currentNoteIndex} of {currentSong.notes.length} ({progressPercent}%)
            </span>
          </div>
          <div style={{
            height: 8,
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-cyan))',
              transition: 'width 0.2s ease',
              borderRadius: 4,
            }} />
          </div>
        </div>

        {/* If Completed Banner */}
        {isCompleted ? (
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15))',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'var(--accent-emerald)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 24px rgba(16, 185, 129, 0.5)',
            }}>
              <Award size={28} color="#041019" />
            </div>
            <h4 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#6ee7b7' }}>
              Song Completed! Bravo!
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', maxWidth: 460, margin: 0 }}>
              You played every note of "{currentSong.title}" using your laptop keyboard. Keep practicing to build muscle memory!
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button onClick={handleRestart} className="btn btn-primary btn-sm">
                <RotateCcw size={15} />
                <span>Play Again</span>
              </button>
            </div>
          </div>
        ) : (
          /* Active Target Note Banner */
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}>
            {/* Target Note Display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 70,
                height: 70,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(6, 182, 212, 0.25))',
                border: '2px solid var(--accent-purple)',
                boxShadow: '0 0 20px var(--accent-purple-glow)',
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>NEXT NOTE</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>
                  {currentSongNote?.note}
                </span>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Press Laptop Key:</span>
                  <span className="key-badge-laptop" style={{
                    fontSize: '1.1rem',
                    minWidth: 32,
                    height: 32,
                    background: 'var(--accent-purple)',
                    color: '#ffffff',
                    border: '1px solid #c4b5fd',
                    boxShadow: '0 0 10px var(--accent-purple-glow)',
                  }}>
                    {currentSongNote ? getLaptopKeyForNote(currentSongNote.note) : '-'}
                  </span>
                </div>
                {currentSongNote?.lyric && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', margin: '0.35rem 0 0 0', fontStyle: 'italic' }}>
                    Lyric syllable: "{currentSongNote.lyric}"
                  </p>
                )}
              </div>
            </div>

            {/* Note Timeline Ribbon (upcoming notes) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              overflowX: 'auto',
              padding: '0.25rem',
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Upcoming:</span>
              {currentSong.notes.slice(currentNoteIndex + 1, currentNoteIndex + 6).map((n, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '0.35rem 0.6rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 6,
                    minWidth: 42,
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{n.note}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    [{getLaptopKeyForNote(n.note)}]
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Practice Controls Bar: Restart, Skip, Audio Guide, Speed */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '1.25rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleRestart}
              className="btn btn-secondary btn-sm"
              title="Start song over from the beginning"
            >
              <RotateCcw size={14} />
              <span>Restart Song</span>
            </button>

            <button
              onClick={handleSkipNote}
              className="btn btn-secondary btn-sm"
              disabled={isCompleted}
              title="Skip to next note if you are stuck"
            >
              <SkipForward size={14} />
              <span>Skip Note</span>
            </button>

            <button
              onClick={startAudioGuide}
              className={`btn btn-sm ${isPlayingAudioGuide ? 'btn-danger' : 'btn-cyan'}`}
              title="Automatically plays the melody so you can listen and observe the keys"
            >
              {isPlayingAudioGuide ? <Pause size={14} /> : <Play size={14} />}
              <span>{isPlayingAudioGuide ? 'Stop Audio Guide' : 'Listen to Audio Demo'}</span>
            </button>
          </div>

          {/* Speed Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Gauge size={15} color="var(--text-dim)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Speed:</span>
            {[0.5, 0.75, 1.0, 1.25].map(speed => (
              <button
                key={speed}
                onClick={() => setSpeedMultiplier(speed)}
                style={{
                  padding: '3px 7px',
                  borderRadius: 4,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid var(--border-subtle)',
                  background: speedMultiplier === speed ? 'var(--accent-purple)' : 'transparent',
                  color: speedMultiplier === speed ? '#ffffff' : 'var(--text-dim)',
                  cursor: 'pointer',
                }}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
