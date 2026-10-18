import React, { useState, useEffect, useRef } from 'react';
import { 
  Disc, 
  Square, 
  Play, 
  Download, 
  Trash2, 
  Clock, 
  AlertCircle, 
  Music, 
  Save 
} from 'lucide-react';
import { RecordedNote, SavedRecording } from '../types';
import { sampleEngine } from '../audio/sampleEngine';
import { Piano88, KeyHighlight } from './Piano88';

interface RecordingStudioProps {
  octaveOffset: number;
  onOctaveChange: (newOffset: number) => void;
}

const STORAGE_KEY = 'keymuse_studio_takes_v2';

export const RecordingStudio: React.FC<RecordingStudioProps> = ({
  octaveOffset,
  onOctaveChange,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState<RecordedNote[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);

  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [savedRecordings, setSavedRecordings] = useState<SavedRecording[]>([]);
  const [recordingTitle, setRecordingTitle] = useState('My Piano Take');

  // Active note press start timestamps: Map<note, startTimeMs>
  const activeStartsRef = useRef<Map<string, number>>(new Map());
  const recordingStartRef = useRef<number>(0);
  const timerIntervalRef = useRef<number | null>(null);
  const playbackTimeoutsRef = useRef<number[]>([]);
  const [playbackActiveMidis, setPlaybackActiveMidis] = useState<Set<number>>(new Set());

  // Load from localStorage
  useEffect(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) setSavedRecordings(JSON.parse(data));
    } catch (e) {
      console.warn('Failed to load recordings:', e);
    }
  }, []);

  const persistLibrary = (list: SavedRecording[]) => {
    setSavedRecordings(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  };

  // Timer while recording
  useEffect(() => {
    if (isRecording) {
      timerIntervalRef.current = window.setInterval(() => {
        setElapsedMs(Math.round(performance.now() - recordingStartRef.current));
      }, 50);
    } else {
      if (timerIntervalRef.current !== null) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current !== null) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  // Handle Note Down from Piano88
  const handleNoteDown = (midi: number, note: string) => {
    if (!isRecording) return;
    const now = performance.now();
    const relativeStart = Math.max(0, now - recordingStartRef.current);
    activeStartsRef.current.set(note, relativeStart);
  };

  // Handle Note Up from Piano88
  const handleNoteUp = (midi: number, note: string) => {
    if (!isRecording) return;
    const startTime = activeStartsRef.current.get(note);
    if (startTime !== undefined) {
      const now = performance.now();
      const relativeEnd = Math.max(0, now - recordingStartRef.current);
      const duration = Math.max(80, relativeEnd - startTime);

      setRecordedNotes(prev => [
        ...prev,
        {
          note,
          startTime: Math.round(startTime),
          duration: Math.round(duration),
        },
      ]);
      activeStartsRef.current.delete(note);
    }
  };

  const handleStartRecording = () => {
    stopPlayback();
    sampleEngine.initAudio();
    activeStartsRef.current.clear();
    setRecordedNotes([]);
    setElapsedMs(0);
    recordingStartRef.current = performance.now();
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    if (!isRecording) return;
    const totalDuration = Math.round(performance.now() - recordingStartRef.current);

    const remainingNotes: RecordedNote[] = [];
    activeStartsRef.current.forEach((startTime, note) => {
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
    activeStartsRef.current.clear();

    if (finalNotes.length > 0) {
      const newRec: SavedRecording = {
        id: `rec-${Date.now()}`,
        title: recordingTitle || `Take ${savedRecordings.length + 1}`,
        createdAt: Date.now(),
        durationMs: totalDuration,
        notes: finalNotes,
      };
      persistLibrary([newRec, ...savedRecordings]);
    }
  };

  const startPlayback = (notesToPlay: RecordedNote[], durationMs: number) => {
    stopPlayback();
    sampleEngine.initAudio();
    setIsPlayingBack(true);

    const timeouts: number[] = [];

    notesToPlay.forEach(item => {
      // Note On
      const onTimer = window.setTimeout(() => {
        sampleEngine.playNote(item.note);
      }, item.startTime);
      timeouts.push(onTimer);

      // Note Off
      const offTimer = window.setTimeout(() => {
        sampleEngine.releaseNote(item.note);
      }, item.startTime + item.duration);
      timeouts.push(offTimer);
    });

    const endTimer = window.setTimeout(() => {
      setIsPlayingBack(false);
      sampleEngine.stopAllNotes();
    }, durationMs + 200);
    timeouts.push(endTimer);

    playbackTimeoutsRef.current = timeouts;
  };

  const stopPlayback = () => {
    playbackTimeoutsRef.current.forEach(t => clearTimeout(t));
    playbackTimeoutsRef.current = [];
    setIsPlayingBack(false);
    sampleEngine.stopAllNotes();
  };

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

  const handleDelete = (id: string) => {
    persistLibrary(savedRecordings.filter(r => r.id !== id));
  };

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${tenths}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
      {/* Studio Console Header */}
      <div style={{
        background: '#12141a',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '8px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Disc size={18} color="#e11d48" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
              Piano Recording Studio
            </h2>
          </div>
          <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
            Capture authentic acoustic grand piano performances with exact duration and timing.
          </p>
        </div>

        {/* Record & Timer Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                background: '#e11d48',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
              <span>Record</span>
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                background: '#475569',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <Square size={14} />
              <span>Stop & Save</span>
            </button>
          )}

          {recordedNotes.length > 0 && !isRecording && (
            <button
              onClick={() => startPlayback(recordedNotes, elapsedMs)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: '#0891b2',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <Play size={14} fill="currentColor" />
              <span>Replay Last Take</span>
            </button>
          )}

          <div style={{
            background: '#0a0c10',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '6px 14px',
            borderRadius: '6px',
            fontFamily: 'var(--font-mono)',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: isRecording ? '#f43f5e' : '#f8fafc',
          }}>
            {formatTime(elapsedMs)}
          </div>
        </div>
      </div>

      {/* Anchored 88-Key Piano */}
      <div>
        <Piano88
          octaveOffset={octaveOffset}
          onOctaveChange={onOctaveChange}
          onNoteDown={handleNoteDown}
          onNoteUp={handleNoteUp}
        />
      </div>

      {/* Saved Takes Library */}
      <div style={{
        background: '#12141a',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '8px',
        padding: '16px 20px',
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 12px 0' }}>
          Saved Takes Library ({savedRecordings.length})
        </h3>

        {savedRecordings.length === 0 ? (
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            No recorded takes yet. Press <strong>Record</strong> above and play your laptop or MIDI keyboard to create a track.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {savedRecordings.map(rec => (
              <div
                key={rec.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: '#171922',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '6px',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                    {rec.title}
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '0.725rem', color: '#64748b', marginTop: '2px' }}>
                    <span>{new Date(rec.createdAt).toLocaleDateString()} {new Date(rec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span>Duration: {formatTime(rec.durationMs)}</span>
                    <span>•</span>
                    <span>{rec.notes.length} notes</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => startPlayback(rec.notes, rec.durationMs)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      background: '#0891b2',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Play size={12} fill="currentColor" />
                    <span>Play</span>
                  </button>

                  <button
                    onClick={() => handleExportJson(rec)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      color: '#94a3b8',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Download size={12} />
                    <span>Export</span>
                  </button>

                  <button
                    onClick={() => handleDelete(rec.id)}
                    style={{
                      padding: '4px 8px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '4px',
                      color: '#f87171',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={12} />
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
