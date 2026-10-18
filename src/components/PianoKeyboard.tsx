import React, { useEffect, useRef, useState, useCallback } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { KEY_MAPPINGS, getShiftedNote } from '../config/constants';
import { ChevronLeft, ChevronRight, Volume2, Music, Sparkles } from 'lucide-react';

interface PianoKeyboardProps {
  octaveOffset: number;
  onOctaveChange: (newOffset: number) => void;
  targetNotes?: string[];
  onNoteTriggered?: (note: string) => void;
  onNoteReleased?: (note: string) => void;
}

interface RenderWhiteKey {
  note: string;
  pitch: string;
  octave: number;
  whiteIndex: number;
  keyLabel?: string;
}

interface RenderBlackKey {
  note: string;
  pitch: string;
  octave: number;
  leftOffsetPx: number;
  keyLabel?: string;
}

// Generate 3 full octaves from C3 to B5, plus C6 (Octaves 3, 4, 5, and C6)
const OCTAVES = [3, 4, 5];
const WHITE_PITCHES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  octaveOffset,
  onOctaveChange,
  targetNotes = [],
  onNoteTriggered,
  onNoteReleased,
}) => {
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const isPointerDownRef = useRef(false);
  const keyboardContainerRef = useRef<HTMLDivElement>(null);

  // Map keyboard event code to current note name
  const codeToNoteMap = useRef<Map<string, string>>(new Map());
  const noteToKeyLabelMap = useRef<Map<string, string>>(new Map());

  // Update dynamic mapping when octaveOffset changes
  useEffect(() => {
    const codeMap = new Map<string, string>();
    const labelMap = new Map<string, string>();

    KEY_MAPPINGS.forEach(item => {
      const shiftedOctave = item.baseOctave + octaveOffset;
      const noteName = `${item.baseNote}${shiftedOctave}`;
      codeMap.set(item.code, noteName);
      labelMap.set(noteName, item.keyLabel);
    });

    codeToNoteMap.current = codeMap;
    noteToKeyLabelMap.current = labelMap;
  }, [octaveOffset]);

  // Trigger Note On
  const triggerNoteOn = useCallback((note: string) => {
    setActiveNotes(prev => {
      if (prev.has(note)) return prev;
      const next = new Set(prev);
      next.add(note);
      return next;
    });

    soundEngine.playNote(note);
    if (onNoteTriggered) {
      onNoteTriggered(note);
    }
  }, [onNoteTriggered]);

  // Trigger Note Off
  const triggerNoteOff = useCallback((note: string) => {
    setActiveNotes(prev => {
      if (!prev.has(note)) return prev;
      const next = new Set(prev);
      next.delete(note);
      return next;
    });

    soundEngine.releaseNote(note);
    if (onNoteReleased) {
      onNoteReleased(note);
    }
  }, [onNoteReleased]);

  // Laptop Physical Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in any text input field
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      // Prevent key repeat when held down
      if (e.repeat) return;

      // Handle octave shift hotkeys [Z] and [X] or [-] and [+]
      if (e.code === 'KeyZ' || e.key === '-') {
        e.preventDefault();
        onOctaveChange(Math.max(-2, octaveOffset - 1));
        return;
      }
      if (e.code === 'KeyX' || e.key === '=' || e.key === '+') {
        e.preventDefault();
        onOctaveChange(Math.min(2, octaveOffset + 1));
        return;
      }

      // Handle Spacebar for Sustain pedal
      if (e.code === 'Space') {
        e.preventDefault();
        soundEngine.setSustain(!soundEngine.getSustain());
        return;
      }

      const note = codeToNoteMap.current.get(e.code);
      if (note) {
        e.preventDefault();
        triggerNoteOn(note);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const note = codeToNoteMap.current.get(e.code);
      if (note) {
        e.preventDefault();
        triggerNoteOff(note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [octaveOffset, onOctaveChange, triggerNoteOn, triggerNoteOff]);

  // Global mouseup to release notes if pointer leaves key
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isPointerDownRef.current = false;
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Compute key positions
  const WHITE_KEY_WIDTH = 48; // px (responsive via CSS)
  const BLACK_KEY_WIDTH = 30; // px
  const whiteKeys: RenderWhiteKey[] = [];
  const blackKeys: RenderBlackKey[] = [];

  let whiteIndex = 0;
  OCTAVES.forEach(octave => {
    WHITE_PITCHES.forEach(pitch => {
      const note = `${pitch}${octave}`;
      whiteKeys.push({
        note,
        pitch,
        octave,
        whiteIndex,
        keyLabel: noteToKeyLabelMap.current.get(note),
      });

      // Add black key if applicable (C#, D#, F#, G#, A#)
      // C# is between whiteIndex and whiteIndex + 1
      if (pitch === 'C') {
        const blackNote = `C#${octave}`;
        blackKeys.push({
          note: blackNote,
          pitch: 'C#',
          octave,
          leftOffsetPx: (whiteIndex + 1) * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2,
          keyLabel: noteToKeyLabelMap.current.get(blackNote),
        });
      } else if (pitch === 'D') {
        const blackNote = `D#${octave}`;
        blackKeys.push({
          note: blackNote,
          pitch: 'D#',
          octave,
          leftOffsetPx: (whiteIndex + 1) * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2,
          keyLabel: noteToKeyLabelMap.current.get(blackNote),
        });
      } else if (pitch === 'F') {
        const blackNote = `F#${octave}`;
        blackKeys.push({
          note: blackNote,
          pitch: 'F#',
          octave,
          leftOffsetPx: (whiteIndex + 1) * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2,
          keyLabel: noteToKeyLabelMap.current.get(blackNote),
        });
      } else if (pitch === 'G') {
        const blackNote = `G#${octave}`;
        blackKeys.push({
          note: blackNote,
          pitch: 'G#',
          octave,
          leftOffsetPx: (whiteIndex + 1) * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2,
          keyLabel: noteToKeyLabelMap.current.get(blackNote),
        });
      } else if (pitch === 'A') {
        const blackNote = `A#${octave}`;
        blackKeys.push({
          note: blackNote,
          pitch: 'A#',
          octave,
          leftOffsetPx: (whiteIndex + 1) * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2,
          keyLabel: noteToKeyLabelMap.current.get(blackNote),
        });
      }

      whiteIndex++;
    });
  });

  // Add final high C6
  whiteKeys.push({
    note: 'C6',
    pitch: 'C',
    octave: 6,
    whiteIndex,
    keyLabel: noteToKeyLabelMap.current.get('C6'),
  });

  // Auto-scroll on mount to center around Middle C
  useEffect(() => {
    if (keyboardContainerRef.current) {
      // Middle C4 is roughly at whiteIndex 7 (48px * 7 = 336px)
      const targetScroll = 336 - keyboardContainerRef.current.clientWidth / 2 + 150;
      keyboardContainerRef.current.scrollLeft = Math.max(0, targetScroll);
    }
  }, []);

  return (
    <div className="piano-wrapper">
      {/* Red Felt Strip along the fallboard */}
      <div className="piano-felt" />

      {/* Header Bar above keyboard */}
      <div className="piano-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="pill-badge purple" style={{ gap: '0.4rem' }}>
            <Music size={13} />
            <span>Interactive 88-Key Scale Model (3 Octaves Visible)</span>
          </div>
          {targetNotes.length > 0 && (
            <div className="pill-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
              <Sparkles size={13} />
              <span>Target: {targetNotes.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Octave Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(0, 0, 0, 0.4)',
          padding: '4px 8px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}>
          <button
            onClick={() => onOctaveChange(Math.max(-2, octaveOffset - 1))}
            disabled={octaveOffset <= -2}
            className="btn btn-secondary btn-icon"
            style={{ width: 28, height: 28, padding: 0 }}
            title="Shift laptop keyboard down 1 octave (Hotkey: Z)"
          >
            <ChevronLeft size={16} />
          </button>

          <span style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: octaveOffset === 0 ? 'var(--text-main)' : 'var(--accent-purple)',
            minWidth: 90,
            textAlign: 'center',
          }}>
            Octave {4 + octaveOffset} {octaveOffset === 0 ? '(Mid)' : octaveOffset > 0 ? `(+${octaveOffset})` : `(${octaveOffset})`}
          </span>

          <button
            onClick={() => onOctaveChange(Math.min(2, octaveOffset + 1))}
            disabled={octaveOffset >= 2}
            className="btn btn-secondary btn-icon"
            style={{ width: 28, height: 28, padding: 0 }}
            title="Shift laptop keyboard up 1 octave (Hotkey: X)"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Keyboard Bed */}
      <div className="piano-scroll-container" ref={keyboardContainerRef}>
        <div 
          className="piano-bed"
          style={{ width: (whiteKeys.length * WHITE_KEY_WIDTH) + 8 }}
          onMouseDown={() => { isPointerDownRef.current = true; }}
        >
          {/* Render White Keys */}
          {whiteKeys.map(key => {
            const isPressed = activeNotes.has(key.note);
            const isTarget = targetNotes.includes(key.note);

            return (
              <div
                key={key.note}
                id={`piano-key-${key.note}`}
                className={`white-key ${isPressed ? 'active' : ''} ${isTarget ? 'target-practice' : ''}`}
                onMouseDown={() => {
                  isPointerDownRef.current = true;
                  triggerNoteOn(key.note);
                }}
                onMouseEnter={() => {
                  if (isPointerDownRef.current) {
                    triggerNoteOn(key.note);
                  }
                }}
                onMouseLeave={() => {
                  if (activeNotes.has(key.note)) {
                    triggerNoteOff(key.note);
                  }
                }}
                onMouseUp={() => {
                  triggerNoteOff(key.note);
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  triggerNoteOn(key.note);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  triggerNoteOff(key.note);
                }}
              >
                <span className="key-badge-note">{key.note}</span>
                {key.keyLabel && (
                  <span className="key-badge-laptop" title={`Press laptop key ${key.keyLabel}`}>
                    {key.keyLabel}
                  </span>
                )}
              </div>
            );
          })}

          {/* Render Black Keys */}
          {blackKeys.map(key => {
            const isPressed = activeNotes.has(key.note);
            const isTarget = targetNotes.includes(key.note);

            return (
              <div
                key={key.note}
                id={`piano-key-${key.note.replace('#', 'sharp')}`}
                className={`black-key ${isPressed ? 'active' : ''} ${isTarget ? 'target-practice' : ''}`}
                style={{ left: key.leftOffsetPx }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  isPointerDownRef.current = true;
                  triggerNoteOn(key.note);
                }}
                onMouseEnter={() => {
                  if (isPointerDownRef.current) {
                    triggerNoteOn(key.note);
                  }
                }}
                onMouseLeave={() => {
                  if (activeNotes.has(key.note)) {
                    triggerNoteOff(key.note);
                  }
                }}
                onMouseUp={(e) => {
                  e.stopPropagation();
                  triggerNoteOff(key.note);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  triggerNoteOn(key.note);
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  triggerNoteOff(key.note);
                }}
              >
                <span className="key-badge-note">{key.pitch}</span>
                {key.keyLabel && (
                  <span className="key-badge-laptop" title={`Press laptop key ${key.keyLabel}`}>
                    {key.keyLabel}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Keyboard Status Bar at bottom */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '0.85rem',
        padding: '0 0.5rem',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Active Mapped Range:</span>
          <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            {getShiftedNote('C4', octaveOffset)} — {getShiftedNote('E5', octaveOffset)}
          </span>
          <span style={{ color: 'var(--accent-purple)' }}>•</span>
          <span>Press physical keys on your laptop keyboard or click directly</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Glissando enabled (click and drag)</span>
          <span>Chords supported</span>
        </div>
      </div>
    </div>
  );
};
