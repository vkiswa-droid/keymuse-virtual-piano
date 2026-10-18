import React, { useState, useEffect, useRef } from 'react';
import { 
  Disc, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Trash2, 
  Clock, 
  AlertCircle, 
  Music, 
  FileText,
  Save
} from 'lucide-react';
import { RecordedNote, SavedRecording } from '../types';
import { soundEngine } from '../audio/soundEngine';

interface RecordingStudioProps {
  lastPlayedNote: string | null;
  lastReleasedNote: string | null;
  onSetTargetNotes: (notes: string[]) => void;
}

const STORAGE_KEY = 'keymuse_recordings_library';

export const RecordingStudio: React.FC<RecordingStudioProps> = ({
  lastPlayedNote,
  lastReleasedNote,
  onSetTargetNotes,
}) => {
  // Live recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState<RecordedNote[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Playback state
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [playbackProgressMs, setPlaybackProgressMs] = useState(0);

  // Saved library
  const [savedRecordings, setSavedRecordings] = useState<SavedRecording[]>([]);
  const [recordingTitle, setRecordingTitle] = useState('My Performance');

  // Active note press start timestamps
  const activeNoteStartsRef = useRef<Map<string, number>>(new Map());
  const recordingStartTimestampRef = useRef<number>(0);
  const timerIntervalRef = useRef<number | null>(null);
  const playbackTimeoutsRef = useRef<number[]>([]);

  // Load saved recordings from localStorage on mount
  useEffect(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        setSavedRecordings(JSON.parse(data));
      }
    } catch (e) {
      console.warn('Failed to load recordings from localStorage:', e);
    }
  }, []);

  // Save to localStorage
  const persistLibrary = (list: SavedRecording[]) => {
    setSavedRecordings(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  };

  // Timer while recording
  useEffect(() => {
    if (isRecording) {
      timerIntervalRef.current = window.setInterval(() => {
        setElapsedMs(Math.round(performance.now() - recordingStartTimestampRef.current));
      }, 50);
    } else {
      if (timerIntervalRef.current !== null) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current !== null) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRecording]);

  // Track note on while recording
  useEffect(() => {
    if (!isRecording || !lastPlayedNote) return;
    const now = performance.now();
    const relativeStart = Math.max(0, now - recordingStartTimestampRef.current);
    activeNoteStartsRef.current.set(lastPlayedNote, relativeStart);
  }, [lastPlayedNote, isRecording]);

  // Track note off while recording
  useEffect(() => {
    if (!isRecording || !lastReleasedNote) return;
    const startTime = activeNoteStartsRef.current.get(lastReleasedNote);
    if (startTime !== undefined) {
      const now = performance.now();
      const relativeEnd = Math.max(0, now - recordingStartTimestampRef.current);
      const duration = Math.max(80, relativeEnd - startTime);

      setRecordedNotes(prev => [
        ...prev,
        {
          note: lastReleasedNote,
          startTime: Math.round(startTime),
          duration: Math.round(duration),
        },
      ]);
      activeNoteStartsRef.current.delete(lastReleasedNote);
    }
  }, [lastReleasedNote, isRecording]);

  // Start recording
  const handleStartRecording = () => {
    stopPlayback();
    soundEngine.initAudio();
    activeNoteStartsRef.current.clear();
    setRecordedNotes([]);
    setElapsedMs(0);
    recordingStartTimestampRef.current = performance.now();
    setIsRecording(true);
  };

  // Stop recording
  const handleStopRecording = () => {
    if (!isRecording) return;
    const totalDuration = Math.round(performance.now() - recordingStartTimestampRef.current);
    
    // Finalize any currently held notes
    const remainingNotes: RecordedNote[] = [];
    activeNoteStartsRef.current.forEach((startTime, note) => {
      const duration = Math.max(100, totalDuration - startTime);
      remainingNotes.push({
        note,
        startTime: Math.round(startTime),
        duration: Math.round(duration),
      });
    });

    const finalNotes = [...recordedNotes, ...remainingNotes];
    setRecordedNotes(finalNotes);
    setIsRecording(false);
    activeNoteStartsRef.current.clear();

    // Auto-save session to temporary recording library if there are notes
    if (finalNotes.length > 0) {
      const newRecording: SavedRecording = {
        id: `rec-${Date.now()}`,
        title: recordingTitle || `Recording ${savedRecordings.length + 1}`,
        createdAt: Date.now(),
        durationMs: totalDuration,
        notes: finalNotes,
      };
      persistLibrary([newRecording, ...savedRecordings]);
    }
  };

  // Playback an array of recorded notes
  const startPlayback = (notesToPlay: RecordedNote[], totalDurationMs: number) => {
    stopPlayback();
    soundEngine.initAudio();
    setIsPlayingBack(true);
    setPlaybackProgressMs(0);

    const playbackStart = performance.now();
    const timeouts: number[] = [];

    // Schedule all notes
    notesToPlay.forEach(noteItem => {
      // Note On
      const onTimer = window.setTimeout(() => {
        soundEngine.playNote(noteItem.note);
        onSetTargetNotes([noteItem.note]);
      }, noteItem.startTime);
      timeouts.push(onTimer);

      // Note Off
      const offTimer = window.setTimeout(() => {
        soundEngine.releaseNote(noteItem.note);
        onSetTargetNotes([]);
      }, noteItem.startTime + noteItem.duration);
      timeouts.push(offTimer);
    });

    // End of playback
    const endTimer = window.setTimeout(() => {
      setIsPlayingBack(false);
      setPlaybackProgressMs(0);
      onSetTargetNotes([]);
      soundEngine.stopAllNotes();
    }, totalDurationMs + 200);
    timeouts.push(endTimer);

    playbackTimeoutsRef.current = timeouts;
  };

  // Stop current playback
  const stopPlayback = () => {
    playbackTimeoutsRef.current.forEach(t => clearTimeout(t));
    playbackTimeoutsRef.current = [];
    setIsPlayingBack(false);
    setPlaybackProgressMs(0);
    onSetTargetNotes([]);
    soundEngine.stopAllNotes();
  };

  // Export recording as JSON
  const handleExportJson = (rec: SavedRecording) => {
    const jsonStr = JSON.stringify(rec, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rec.title.replace(/\s+/g, '_')}_KeyMuse.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Delete recording from library
  const handleDeleteRecording = (id: string) => {
    const updated = savedRecordings.filter(r => r.id !== id);
    persistLibrary(updated);
  };

  // Format milliseconds into MM:SS.S
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`;
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
      {/* Recording Studio Header */}
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
            <Disc size={20} color="var(--accent-rose)" />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Recording Studio</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', margin: 0 }}>
            Record note pitches, press timings, and release durations with accurate millisecond precision.
          </p>
        </div>

        {/* Live Studio Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isRecording ? (
            <div className="pill-badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
              <div className="rec-pulse-dot" />
              <span>RECORDING IN PROGRESS</span>
            </div>
          ) : isPlayingBack ? (
            <div className="pill-badge cyan">
              <Play size={13} fill="currentColor" />
              <span>REPLAYING PERFORMANCE</span>
            </div>
          ) : (
            <div className="pill-badge">
              <Clock size={13} />
              <span>Studio Ready</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Recording Console Box */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}>
          {/* Controls: Record / Stop / Playback */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #e11d48, #be123c)',
                  boxShadow: '0 4px 18px rgba(225, 29, 72, 0.4)',
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffffff' }} />
                <span>Start Recording</span>
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="btn btn-danger"
              >
                <Square size={16} />
                <span>Stop Recording</span>
              </button>
            )}

            {recordedNotes.length > 0 && !isRecording && (
              <>
                {!isPlayingBack ? (
                  <button
                    onClick={() => startPlayback(recordedNotes, elapsedMs)}
                    className="btn btn-cyan"
                  >
                    <Play size={15} fill="currentColor" />
                    <span>Replay Last Take</span>
                  </button>
                ) : (
                  <button
                    onClick={stopPlayback}
                    className="btn btn-secondary"
                  >
                    <Square size={15} />
                    <span>Stop Playback</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Session Timer & Note Count */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '0.65rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                Time Elapsed
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.4rem',
                fontWeight: 700,
                color: isRecording ? '#f43f5e' : 'var(--text-main)',
              }}>
                {formatTime(elapsedMs)}
              </span>
            </div>

            <div style={{ width: 1, height: 32, background: 'var(--border-subtle)' }} />

            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                Notes Logged
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--accent-cyan)',
              }}>
                {recordedNotes.length}
              </span>
            </div>
          </div>
        </div>

        {/* Local storage explanation banner */}
        <div style={{
          marginTop: '1.25rem',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(6, 182, 212, 0.08)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.8rem',
          color: 'var(--text-dim)',
        }}>
          <AlertCircle size={15} color="var(--accent-cyan)" />
          <span>
            Recordings are saved directly in your browser's private local storage. They remain on your device and will never be uploaded to external servers. Use the <strong>Export</strong> button to save permanent copies to your laptop.
          </span>
        </div>
      </div>

      {/* Saved Library Section */}
      <div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.85rem' }}>
          Saved Take Library ({savedRecordings.length})
        </h3>

        {savedRecordings.length === 0 ? (
          <div style={{
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            background: 'rgba(0, 0, 0, 0.25)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-subtle)',
            color: 'var(--text-muted)',
          }}>
            <Music size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>No recorded takes yet.</p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Press <strong>Start Recording</strong> above and play your laptop keyboard to create your first track!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {savedRecordings.map(rec => (
              <div
                key={rec.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.2rem 0' }}>
                    {rec.title}
                  </h4>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{new Date(rec.createdAt).toLocaleDateString()} {new Date(rec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span>Duration: {formatTime(rec.durationMs)}</span>
                    <span>•</span>
                    <span>{rec.notes.length} notes</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => startPlayback(rec.notes, rec.durationMs)}
                    className="btn btn-cyan btn-sm"
                    title="Play this recording"
                  >
                    <Play size={13} fill="currentColor" />
                    <span>Play</span>
                  </button>

                  <button
                    onClick={() => handleExportJson(rec)}
                    className="btn btn-secondary btn-sm"
                    title="Export as JSON performance file"
                  >
                    <Download size={13} />
                    <span>Export</span>
                  </button>

                  <button
                    onClick={() => handleDeleteRecording(rec.id)}
                    className="btn btn-danger btn-icon"
                    style={{ width: 30, height: 30, padding: 0 }}
                    title="Delete recording"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
