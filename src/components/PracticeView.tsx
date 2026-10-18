import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Repeat, 
  Upload, 
  Maximize, 
  Minimize, 
  Sliders, 
  Award, 
  HelpCircle, 
  CheckCircle2, 
  ChevronRight, 
  Flame, 
  Eye, 
  Hourglass, 
  Volume2, 
  Clock, 
  FolderPlus,
  Sparkles,
  Zap,
  Check
} from 'lucide-react';
import { VisualSong, PRACTICE_SONGS } from '../audio/songsData';
import { ParsedMidiNote, MidiParser } from '../audio/midiParser';
import { FallingNoteCanvas } from './FallingNoteCanvas';
import { Piano88, KeyHighlight } from './Piano88';
import { sampleEngine } from '../audio/sampleEngine';

export type PracticeMode = 'watch' | 'play' | 'wait';

interface PracticeViewProps {
  octaveOffset: number;
  onOctaveChange: (newOffset: number) => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({
  octaveOffset,
  onOctaveChange,
}) => {
  // Song selection
  const [songsList, setSongsList] = useState<VisualSong[]>(PRACTICE_SONGS);
  const [selectedSongId, setSelectedSongId] = useState<string>('ode-to-joy');
  const [importedSong, setImportedSong] = useState<VisualSong | null>(null);

  // Playback & Timing
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [tempoMultiplier, setTempoMultiplier] = useState<number>(1.0);
  const [lookaheadSeconds, setLookaheadSeconds] = useState<number>(2.5);
  
  // Practice Modes
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('watch');
  const [selectedHand, setSelectedHand] = useState<'both' | 'right' | 'left'>('both');
  const [showNoteNames, setShowNoteNames] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // A/B Looping
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);

  // Scoring (Play Mode)
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [accuracyHits, setAccuracyHits] = useState<{ perfect: number; good: number; miss: number }>({ perfect: 0, good: 0, miss: 0 });
  const [feedbackToast, setFeedbackToast] = useState<{ text: string; color: string } | null>(null);

  // Wait Mode state
  const [waitingForMidis, setWaitingForMidis] = useState<number[]>([]);

  // Adaptive Coach
  const [missedNotesLog, setMissedNotesLog] = useState<number[]>([]);
  const [coachSuggestion, setCoachSuggestion] = useState<string | null>(null);

  // Active notes playing from computer playback
  const [songActiveMidis, setSongActiveMidis] = useState<Set<number>>(new Set());
  const [userActiveMidis, setUserActiveMidis] = useState<Set<number>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Current active song
  const currentSong: VisualSong = useMemo(() => {
    if (importedSong && importedSong.id === selectedSongId) {
      return importedSong;
    }
    return songsList.find(s => s.id === selectedSongId) || songsList[0];
  }, [selectedSongId, importedSong, songsList]);

  // Keep notes sorted by start time
  const sortedNotes = useMemo(() => {
    return [...currentSong.notes].sort((a, b) => a.time - b.time);
  }, [currentSong]);

  // Handle Drag & Drop of MIDI files
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      loadMidiFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      loadMidiFile(e.target.files[0]);
    }
  };

  const loadMidiFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const parsed = MidiParser.parse(buffer, file.name);

      const newSong: VisualSong = {
        id: `imported-${Date.now()}`,
        title: parsed.title,
        composer: 'Local MIDI Import',
        eraOrGenre: 'Standard MIDI File',
        difficulty: 'Intermediate',
        bpm: parsed.initialBpm,
        timeSignature: '4/4',
        duration: parsed.duration,
        description: `Imported from "${file.name}" with ${parsed.tracks.length} track(s) and ${parsed.allNotes.length} notes.`,
        notes: parsed.allNotes,
      };

      setImportedSong(newSong);
      setSongsList(prev => [newSong, ...prev]);
      setSelectedSongId(newSong.id);
      handleRestart();
    } catch (err) {
      alert(`Could not parse MIDI file: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Main Animation & Scheduling Loop
  useEffect(() => {
    if (!isPlaying) {
      lastFrameTimeRef.current = performance.now();
      return;
    }

    const tick = () => {
      const now = performance.now();
      const deltaSec = ((now - lastFrameTimeRef.current) / 1000) * tempoMultiplier;
      lastFrameTimeRef.current = now;

      // In Wait Mode: Check if song should pause for expected notes
      if (practiceMode === 'wait') {
        // Find notes that are currently at the strike line (within ±0.06s)
        const upcomingStrikeNotes = sortedNotes.filter(n => {
          if (selectedHand === 'right' && n.hand !== 'right') return false;
          if (selectedHand === 'left' && n.hand !== 'left') return false;
          return n.time >= currentTime && n.time <= currentTime + 0.08;
        });

        if (upcomingStrikeNotes.length > 0) {
          const requiredMidis = upcomingStrikeNotes.map(n => n.midi);
          setWaitingForMidis(requiredMidis);
          // Pause time advancement until user hits the keys!
          animationFrameRef.current = requestAnimationFrame(tick);
          return;
        } else {
          setWaitingForMidis([]);
        }
      }

      // Normal time advancement
      setCurrentTime(prevTime => {
        let nextTime = prevTime + deltaSec;

        // Loop handling
        if (loopB !== null && loopA !== null && nextTime >= loopB) {
          nextTime = loopA;
          sampleEngine.stopAllNotes();
        } else if (nextTime >= currentSong.duration + 1.0) {
          setIsPlaying(false);
          nextTime = 0;
          sampleEngine.stopAllNotes();
        }

        return nextTime;
      });

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    lastFrameTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, tempoMultiplier, practiceMode, currentTime, loopA, loopB, currentSong.duration, sortedNotes, selectedHand]);

  // Audio Playback scheduler for Watch & Play modes
  const scheduledNotesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isPlaying) {
      scheduledNotesRef.current.clear();
      return;
    }

    // When playing in Watch or Play mode, trigger notes when they reach strike line
    const lookaheadAudioWindow = 0.08; // 80ms audio lookahead
    sortedNotes.forEach(n => {
      if (selectedHand === 'right' && n.hand !== 'right') return;
      if (selectedHand === 'left' && n.hand !== 'left') return;

      const noteKey = `${n.midi}-${n.time}`;
      if (currentTime >= n.time - 0.02 && currentTime <= n.time + lookaheadAudioWindow) {
        if (!scheduledNotesRef.current.has(noteKey)) {
          scheduledNotesRef.current.add(noteKey);
          // Play the note with authentic sampled piano
          sampleEngine.playNote(n.midi, n.velocity);
          setTimeout(() => {
            sampleEngine.releaseNote(n.midi);
          }, n.duration * 1000 * 0.95);
        }
      }
    });
  }, [currentTime, isPlaying, sortedNotes, selectedHand]);

  // User Note Interaction Handling
  const handleUserNoteDown = useCallback((midi: number, note: string) => {
    setUserActiveMidis(prev => new Set(prev).add(midi));

    // Wait Mode resolution: if user pressed one of the waiting notes
    if (practiceMode === 'wait' && waitingForMidis.includes(midi)) {
      const remaining = waitingForMidis.filter(m => m !== midi);
      setWaitingForMidis(remaining);
      if (remaining.length === 0) {
        // Continue song!
        setCurrentTime(t => t + 0.1);
      }
    }

    // Play Mode scoring
    if (practiceMode === 'play' && isPlaying) {
      // Find note in song closest to current time
      const match = sortedNotes.find(n => {
        return n.midi === midi && Math.abs(n.time - currentTime) < 0.35;
      });

      if (match) {
        const timeDiff = Math.abs(match.time - currentTime);
        if (timeDiff <= 0.09) {
          // Perfect hit!
          setScore(s => s + 100 * (combo + 1));
          setCombo(c => c + 1);
          setAccuracyHits(a => ({ ...a, perfect: a.perfect + 1 }));
          showToast('PERFECT! +100', '#38bdf8');
        } else {
          // Good hit
          setScore(s => s + 50 * (combo + 1));
          setCombo(c => c + 1);
          setAccuracyHits(a => ({ ...a, good: a.good + 1 }));
          showToast('GOOD +50', '#a855f7');
        }
      } else {
        // Missed / extra note
        setCombo(0);
        setAccuracyHits(a => ({ ...a, miss: a.miss + 1 }));
        setMissedNotesLog(prev => [...prev, midi]);
      }
    }
  }, [practiceMode, waitingForMidis, isPlaying, sortedNotes, currentTime, combo]);

  const handleUserNoteUp = useCallback((midi: number, note: string) => {
    setUserActiveMidis(prev => {
      const next = new Set(prev);
      next.delete(midi);
      return next;
    });
  }, []);

  const showToast = (text: string, color: string) => {
    setFeedbackToast({ text, color });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 450);
  };

  // Transport Handlers
  const handleTogglePlay = () => {
    sampleEngine.initAudio();
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setIsPlaying(false);
    sampleEngine.stopAllNotes();
    scheduledNotesRef.current.clear();
    setCurrentTime(loopA !== null ? loopA : 0);
    setWaitingForMidis([]);
    setScore(0);
    setCombo(0);
    setAccuracyHits({ perfect: 0, good: 0, miss: 0 });
  };

  const handleSeek = (newTime: number) => {
    scheduledNotesRef.current.clear();
    sampleEngine.stopAllNotes();
    setCurrentTime(Math.max(0, Math.min(currentSong.duration, newTime)));
  };

  const toggleLoopA = () => {
    if (loopA === null) {
      setLoopA(currentTime);
    } else {
      setLoopA(null);
    }
  };

  const toggleLoopB = () => {
    if (loopB === null) {
      setLoopB(currentTime);
    } else {
      setLoopB(null);
    }
  };

  // Adaptive Coach: Suggest loop if mistakes logged
  useEffect(() => {
    if (missedNotesLog.length >= 4 && !coachSuggestion) {
      setCoachSuggestion('We noticed 4+ missed notes in this section. Would you like to loop these 2 bars at 70% speed to master the passage?');
    }
  }, [missedNotesLog, coachSuggestion]);

  const applyCoachSuggestion = () => {
    setTempoMultiplier(0.7);
    setLoopA(Math.max(0, currentTime - 3));
    setLoopB(Math.min(currentSong.duration, currentTime + 3));
    setCoachSuggestion(null);
    setMissedNotesLog([]);
    handleRestart();
  };

  // Piano Key Highlights Computation
  const pianoHighlights: KeyHighlight[] = useMemo(() => {
    const list: KeyHighlight[] = [];

    // Notes currently triggered by song
    songActiveMidis.forEach(midi => {
      const songNote = sortedNotes.find(n => n.midi === midi);
      const color = songNote?.hand === 'left' ? 'left' : 'right';
      list.push({ midi, color });
    });

    // Notes waiting in Wait Mode
    waitingForMidis.forEach(midi => {
      list.push({ midi, color: 'target' });
    });

    return list;
  }, [songActiveMidis, sortedNotes, waitingForMidis]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleFileDrop}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#0d0e12',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: isFullscreen ? 0 : '10px',
        overflow: 'hidden',
        position: isFullscreen ? 'fixed' : 'relative',
        inset: isFullscreen ? 0 : undefined,
        zIndex: isFullscreen ? 9999 : 10,
        height: isFullscreen ? '100vh' : '820px',
      }}
    >
      {/* 1. Top Compact Transport & Control Bar */}
      <div style={{
        background: '#14161d',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        zIndex: 20,
      }}>
        {/* Left: Song Picker & MIDI Import */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={selectedSongId}
            onChange={(e) => {
              setSelectedSongId(e.target.value);
              handleRestart();
            }}
            style={{
              background: '#1e212b',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              color: '#f8fafc',
              fontSize: '0.85rem',
              fontWeight: 600,
              padding: '6px 12px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {songsList.map(song => (
              <option key={song.id} value={song.id}>
                {song.title} — {song.composer}
              </option>
            ))}
          </select>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".mid,.midi"
            style={{ display: 'none' }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: '#94a3b8',
              fontSize: '0.775rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            title="Import custom MIDI (.mid / .midi) file"
          >
            <Upload size={13} />
            <span>Import MIDI</span>
          </button>
        </div>

        {/* Center: Practice Mode Switcher (Watch / Play / Wait) */}
        <div style={{
          display: 'flex',
          background: '#090a0f',
          padding: '3px',
          borderRadius: '6px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <button
            onClick={() => { setPracticeMode('watch'); handleRestart(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              borderRadius: '4px',
              border: 'none',
              background: practiceMode === 'watch' ? '#2563eb' : 'transparent',
              color: practiceMode === 'watch' ? '#ffffff' : '#94a3b8',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            title="Watch mode: Listen and observe falling notes"
          >
            <Eye size={13} />
            <span>Watch</span>
          </button>

          <button
            onClick={() => { setPracticeMode('play'); handleRestart(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              borderRadius: '4px',
              border: 'none',
              background: practiceMode === 'play' ? '#0891b2' : 'transparent',
              color: practiceMode === 'play' ? '#ffffff' : '#94a3b8',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            title="Play mode: Play along and get scored on accuracy"
          >
            <Zap size={13} />
            <span>Play</span>
          </button>

          <button
            onClick={() => { setPracticeMode('wait'); handleRestart(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              borderRadius: '4px',
              border: 'none',
              background: practiceMode === 'wait' ? '#ca8a04' : 'transparent',
              color: practiceMode === 'wait' ? '#ffffff' : '#94a3b8',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            title="Wait mode: Pauses until you press the correct keys"
          >
            <Hourglass size={13} />
            <span>Wait for Me</span>
          </button>
        </div>

        {/* Right: Hand Filter & Fullscreen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '2px', background: '#090a0f', padding: '2px', borderRadius: '4px' }}>
            <button
              onClick={() => setSelectedHand('both')}
              style={{
                padding: '3px 8px',
                fontSize: '0.725rem',
                fontWeight: 600,
                borderRadius: '3px',
                border: 'none',
                background: selectedHand === 'both' ? '#334155' : 'transparent',
                color: selectedHand === 'both' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
              }}
            >
              Both
            </button>
            <button
              onClick={() => setSelectedHand('right')}
              style={{
                padding: '3px 8px',
                fontSize: '0.725rem',
                fontWeight: 600,
                borderRadius: '3px',
                border: 'none',
                background: selectedHand === 'right' ? '#0284c7' : 'transparent',
                color: selectedHand === 'right' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
              }}
            >
              Right (RH)
            </button>
            <button
              onClick={() => setSelectedHand('left')}
              style={{
                padding: '3px 8px',
                fontSize: '0.725rem',
                fontWeight: 600,
                borderRadius: '3px',
                border: 'none',
                background: selectedHand === 'left' ? '#7e22ce' : 'transparent',
                color: selectedHand === 'left' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
              }}
            >
              Left (LH)
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{
              padding: '6px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Practice"}
          >
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>
        </div>
      </div>

      {/* 2. Middle Falling-Note Visualizer Canvas */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <FallingNoteCanvas
          notes={sortedNotes}
          currentTime={currentTime}
          lookaheadSeconds={lookaheadSeconds}
          showNoteNames={showNoteNames}
          selectedHand={selectedHand}
          loopA={loopA}
          loopB={loopB}
          activePlayingMidis={songActiveMidis}
          onKeyTriggeredFromSong={(midis) => {
            setSongActiveMidis(new Set(midis));
          }}
        />

        {/* Live Score & Streak Overlay (Play Mode) */}
        {practiceMode === 'play' && (
          <div style={{
            position: 'absolute',
            top: 16,
            right: 20,
            background: 'rgba(15, 17, 24, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '8px',
            padding: '10px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            pointerEvents: 'none',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', fontSize: '0.85rem' }}>
              <span style={{ color: '#94a3b8' }}>Score:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#38bdf8' }}>{score}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', fontSize: '0.8rem' }}>
              <span style={{ color: '#94a3b8' }}>Combo:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: combo > 5 ? '#f59e0b' : '#f8fafc' }}>
                {combo > 0 ? `${combo}x Streak` : '0'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
              <span style={{ color: '#38bdf8' }}>P:{accuracyHits.perfect}</span>
              <span style={{ color: '#a855f7' }}>G:{accuracyHits.good}</span>
              <span style={{ color: '#ef4444' }}>M:{accuracyHits.miss}</span>
            </div>
          </div>
        )}

        {/* Feedback Toast */}
        {feedbackToast && (
          <div style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.85)',
            border: `1px solid ${feedbackToast.color}`,
            color: feedbackToast.color,
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '0.9rem',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            pointerEvents: 'none',
          }}>
            {feedbackToast.text}
          </div>
        )}

        {/* Wait Mode Prompt */}
        {practiceMode === 'wait' && waitingForMidis.length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(202, 138, 4, 0.9)',
            color: '#000000',
            padding: '8px 20px',
            borderRadius: '20px',
            fontSize: '0.9rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 20px rgba(202, 138, 4, 0.4)',
          }}>
            <Hourglass size={16} />
            <span>Press target key(s) on piano to continue...</span>
          </div>
        )}

        {/* Adaptive Coach Notification Drawer */}
        {coachSuggestion && (
          <div style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: 520,
            background: 'rgba(23, 27, 38, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid #38bdf8',
            borderRadius: '8px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
            zIndex: 30,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#38bdf8" />
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#f8fafc', lineHeight: 1.4 }}>
                {coachSuggestion}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={applyCoachSuggestion}
                style={{
                  padding: '4px 10px',
                  background: '#2563eb',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Auto-Loop
              </button>
              <button
                onClick={() => setCoachSuggestion(null)}
                style={{
                  padding: '4px 8px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  color: '#94a3b8',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Transport Playback Controls & Scrubber */}
      <div style={{
        background: '#12141c',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '8px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {/* Timeline Scrubber */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#94a3b8', minWidth: 42 }}>
            {formatTime(currentTime)}
          </span>

          <input
            type="range"
            min={0}
            max={currentSong.duration}
            step={0.05}
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            style={{ flex: 1 }}
            className="custom-range"
          />

          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#64748b', minWidth: 42 }}>
            {formatTime(currentSong.duration)}
          </span>
        </div>

        {/* Transport Buttons Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          {/* Play/Pause/Restart */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleTogglePlay}
              style={{
                width: 36,
                height: 36,
                borderRadius: '6px',
                background: isPlaying ? '#ef4444' : '#2563eb',
                border: 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title={isPlaying ? "Pause Song" : "Play Song"}
            >
              {isPlaying ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
            </button>

            <button
              onClick={handleRestart}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.775rem',
                cursor: 'pointer',
              }}
              title="Restart song"
            >
              <RotateCcw size={13} />
              <span>Restart</span>
            </button>

            {/* Loop Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
              <button
                onClick={toggleLoopA}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: loopA !== null ? '#f59e0b' : 'rgba(255, 255, 255, 0.04)',
                  color: loopA !== null ? '#000' : '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                title={loopA !== null ? `Loop A set at ${formatTime(loopA)}` : "Set Loop Start Point [A]"}
              >
                [A] {loopA !== null ? formatTime(loopA) : 'Set'}
              </button>

              <button
                onClick={toggleLoopB}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: loopB !== null ? '#ef4444' : 'rgba(255, 255, 255, 0.04)',
                  color: loopB !== null ? '#fff' : '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                title={loopB !== null ? `Loop B set at ${formatTime(loopB)}` : "Set Loop End Point [B]"}
              >
                [B] {loopB !== null ? formatTime(loopB) : 'Set'}
              </button>

              {(loopA !== null || loopB !== null) && (
                <button
                  onClick={() => { setLoopA(null); setLoopB(null); }}
                  style={{
                    padding: '3px 6px',
                    borderRadius: '4px',
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                  }}
                  title="Clear loop markers"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Tempo Controls & Falling Speed */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tempo:</span>
              {[0.75, 1.0, 1.25].map(t => (
                <button
                  key={t}
                  onClick={() => setTempoMultiplier(t)}
                  style={{
                    padding: '3px 7px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: tempoMultiplier === t ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                    color: tempoMultiplier === t ? '#38bdf8' : '#94a3b8',
                    fontSize: '0.725rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t}x
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Lookahead:</span>
              <select
                value={lookaheadSeconds}
                onChange={(e) => setLookaheadSeconds(parseFloat(e.target.value))}
                style={{
                  background: '#1a1d26',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  color: '#f8fafc',
                  fontSize: '0.725rem',
                  padding: '3px 6px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value={1.5}>Fast (1.5s)</option>
                <option value={2.5}>Normal (2.5s)</option>
                <option value={3.5}>Slow (3.5s)</option>
                <option value={4.5}>Wide (4.5s)</option>
              </select>
            </div>

            <button
              onClick={() => setShowNoteNames(!showNoteNames)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                background: showNoteNames ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: showNoteNames ? '#38bdf8' : '#64748b',
                fontSize: '0.725rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Toggle note pitch names on falling bars"
            >
              Note Labels
            </button>
          </div>
        </div>
      </div>

      {/* 4. Anchored 88-Key Piano Keyboard at Bottom */}
      <div style={{ zIndex: 10 }}>
        <Piano88
          octaveOffset={octaveOffset}
          onOctaveChange={onOctaveChange}
          highlights={pianoHighlights}
          onNoteDown={handleUserNoteDown}
          onNoteUp={handleUserNoteUp}
          compactToolbar={true}
        />
      </div>
    </div>
  );
};
