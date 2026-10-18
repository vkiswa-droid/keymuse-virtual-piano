import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Piano88Key, 
  generate88Keys, 
  TOTAL_WHITE_KEYS, 
  TOTAL_KEYS, 
  MIN_MIDI, 
  MAX_MIDI 
} from '../config/piano88';
import { sampleEngine } from '../audio/sampleEngine';
import { keyboardMapping } from '../config/keyboardMapping';
import { KeyboardMappingModal } from './KeyboardMappingModal';
import { 
  Maximize2, 
  Minimize2, 
  ChevronLeft, 
  ChevronRight, 
  Sliders, 
  Keyboard as KeyboardIcon,
  Settings
} from 'lucide-react';

export interface KeyHighlight {
  midi: number;
  color?: string; // 'user' | 'right' | 'left' | 'target'
}

interface Piano88Props {
  octaveOffset: number;
  onOctaveChange: (newOffset: number) => void;
  highlights?: KeyHighlight[];
  onNoteDown?: (midi: number, note: string) => void;
  onNoteUp?: (midi: number, note: string) => void;
  sustain?: boolean;
  compactToolbar?: boolean;
}

export const Piano88: React.FC<Piano88Props> = ({
  octaveOffset,
  onOctaveChange,
  highlights = [],
  onNoteDown,
  onNoteUp,
  sustain = false,
  compactToolbar = false,
}) => {
  const [activeMidiKeys, setActiveMidiKeys] = useState<Set<number>>(new Set());
  const [fit88, setFit88] = useState<boolean>(false);
  const [viewportScroll, setViewportScroll] = useState<number>(0);
  const [visibleRatio, setVisibleRatio] = useState<number>(0.35); // portion of 88 keys visible
  const [isMappingModalOpen, setIsMappingModalOpen] = useState<boolean>(false);
  const [mappingVersion, setMappingVersion] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const pianoBedRef = useRef<HTMLDivElement>(null);
  const isPointerDownRef = useRef(false);

  // Subscribe to keyboard mapping changes
  useEffect(() => {
    return keyboardMapping.subscribe(() => {
      setMappingVersion(v => v + 1);
    });
  }, []);

  // Generate 88 keys with laptop mappings shifted by octaveOffset
  const keys = useMemo(() => generate88Keys(octaveOffset), [octaveOffset, mappingVersion]);

  // Fast highlight lookup
  const highlightMap = useMemo(() => {
    const map = new Map<number, string>();
    highlights.forEach(h => {
      map.set(h.midi, h.color || 'right');
    });
    return map;
  }, [highlights]);

  // Trigger Note Down
  const handleNoteDown = useCallback((midi: number, note: string) => {
    setActiveMidiKeys(prev => {
      if (prev.has(midi)) return prev;
      const next = new Set(prev);
      next.add(midi);
      return next;
    });

    sampleEngine.playNote(midi, 0.82);
    if (onNoteDown) onNoteDown(midi, note);
  }, [onNoteDown]);

  // Trigger Note Up
  const handleNoteUp = useCallback((midi: number, note: string) => {
    setActiveMidiKeys(prev => {
      if (!prev.has(midi)) return prev;
      const next = new Set(prev);
      next.delete(midi);
      return next;
    });

    sampleEngine.releaseNote(midi);
    if (onNoteUp) onNoteUp(midi, note);
  }, [onNoteUp]);

  // Physical Laptop Keyboard Listener with full physical key code mapping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in form inputs
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
        return;
      }

      if (e.repeat) return;

      // Octave Shift shortcuts [Z] Down / [X] Up (only if not mapped to a custom note)
      if (e.code === 'KeyZ' && keyboardMapping.codeToMidi('KeyZ', false) === null) {
        e.preventDefault();
        onOctaveChange(Math.max(-3, octaveOffset - 1));
        return;
      }
      if (e.code === 'KeyX' && keyboardMapping.codeToMidi('KeyX', false) === null) {
        e.preventDefault();
        onOctaveChange(Math.min(3, octaveOffset + 1));
        return;
      }

      // Spacebar for Sustain pedal
      if (e.code === 'Space') {
        e.preventDefault();
        sampleEngine.setSustain(!sampleEngine.getSustain());
        return;
      }

      // Resolve physical laptop key through keyboardMapping engine
      const mappedMidi = keyboardMapping.codeToMidi(e.code, e.shiftKey);
      if (mappedMidi !== null) {
        e.preventDefault();
        const effectiveMidi = Math.min(MAX_MIDI, Math.max(MIN_MIDI, mappedMidi + (octaveOffset * 12)));
        const keyObj = keys.find(k => k.midi === effectiveMidi);
        if (keyObj) {
          handleNoteDown(effectiveMidi, keyObj.note);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
        return;
      }

      // Spacebar release (if momentary sustain is preferred, sustain is toggled on keydown)
      if (e.code === 'Space') {
        return;
      }

      const mappedMidi = keyboardMapping.codeToMidi(e.code, e.shiftKey);
      if (mappedMidi !== null) {
        e.preventDefault();
        const effectiveMidi = Math.min(MAX_MIDI, Math.max(MIN_MIDI, mappedMidi + (octaveOffset * 12)));
        const keyObj = keys.find(k => k.midi === effectiveMidi);
        if (keyObj) {
          handleNoteUp(effectiveMidi, keyObj.note);
        }
      }
    };

    // Safety: prevent stuck notes on window focus loss (tab switch, click away)
    const handleBlur = () => {
      setActiveMidiKeys(prev => {
        prev.forEach(m => sampleEngine.releaseNote(m));
        return new Set();
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [keys, octaveOffset, onOctaveChange, handleNoteDown, handleNoteUp]);

  // Global mouse up
  useEffect(() => {
    const onMouseUp = () => { isPointerDownRef.current = false; };
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, []);

  // Update scroll tracking for the mini overview bar
  const handleScroll = () => {
    if (!containerRef.current || !pianoBedRef.current || fit88) return;
    const scrollLeft = containerRef.current.scrollLeft;
    const maxScroll = pianoBedRef.current.scrollWidth - containerRef.current.clientWidth;
    if (maxScroll > 0) {
      setViewportScroll(scrollLeft / maxScroll);
      setVisibleRatio(containerRef.current.clientWidth / pianoBedRef.current.scrollWidth);
    }
  };

  // Center around Middle C on mount
  useEffect(() => {
    if (containerRef.current && pianoBedRef.current && !fit88) {
      // Middle C4 is MIDI 60 (white key index 23 out of 52)
      const c4Ratio = 23 / 52;
      const totalWidth = pianoBedRef.current.scrollWidth;
      const targetScroll = (c4Ratio * totalWidth) - (containerRef.current.clientWidth / 2);
      containerRef.current.scrollLeft = Math.max(0, targetScroll);
      handleScroll();
    }
  }, [fit88]);

  // Jump to specific octave
  const jumpToOctave = (targetOctave: number) => {
    if (fit88 || !containerRef.current || !pianoBedRef.current) return;
    // Find first white key in target octave
    const key = keys.find(k => k.octave === targetOctave && !k.isBlack);
    if (key) {
      const targetPx = (key.leftPercent / 100) * pianoBedRef.current.scrollWidth;
      containerRef.current.scrollTo({
        left: targetPx - containerRef.current.clientWidth / 2 + 100,
        behavior: 'smooth',
      });
    }
  };

  // White key width
  const whiteKeyWidthPx = fit88 ? undefined : 42; // px per white key in scrollable mode
  const totalPianoBedWidth = fit88 ? '100%' : `${TOTAL_WHITE_KEYS * (whiteKeyWidthPx || 42)}px`;

  return (
    <div className="piano-88-wrapper" style={{
      background: '#12141a',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '8px',
      overflow: 'hidden',
      userSelect: 'none',
      WebkitUserSelect: 'none',
    }}>
      {/* Mini 88-Key Overview Strip & Range Navigation */}
      {!compactToolbar && (
        <div style={{
          padding: '6px 12px',
          background: '#0d0f14',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '0.75rem',
        }}>
          {/* Octave Jump Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#64748b', fontWeight: 600, marginRight: '4px' }}>Jump:</span>
            {[1, 2, 3, 4, 5, 6, 7].map(oct => (
              <button
                key={oct}
                onClick={() => jumpToOctave(oct)}
                disabled={fit88}
                style={{
                  padding: '2px 6px',
                  borderRadius: '3px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: oct === 4 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: oct === 4 ? '#38bdf8' : '#94a3b8',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: fit88 ? 'default' : 'pointer',
                  opacity: fit88 ? 0.4 : 1,
                }}
                title={`Jump view to Octave ${oct}`}
              >
                C{oct}
              </button>
            ))}
          </div>

          {/* Mini 88-Key Strip with Viewport Window */}
          <div style={{
            flex: 1,
            maxWidth: 340,
            height: 16,
            background: '#181b22',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* White keys lines */}
            <div style={{
              display: 'flex',
              width: '100%',
              height: '100%',
            }}>
              {Array.from({ length: TOTAL_WHITE_KEYS }).map((_, i) => (
                <div key={i} style={{ flex: 1, borderRight: '1px solid rgba(255, 255, 255, 0.04)' }} />
              ))}
            </div>

            {/* Viewport Box Indicator */}
            {!fit88 && (
              <div style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${viewportScroll * (1 - visibleRatio) * 100}%`,
                width: `${visibleRatio * 100}%`,
                background: 'rgba(56, 189, 248, 0.25)',
                border: '1px solid #38bdf8',
                borderRadius: '1px',
                pointerEvents: 'none',
              }} />
            )}
          </div>

          {/* Fit 88 Keys Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.725rem' }}>
              Standard 88 Keys (A0–C8)
            </span>
            <button
              onClick={() => setFit88(!fit88)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                background: fit88 ? '#2563eb' : 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                color: '#f8fafc',
                fontSize: '0.725rem',
                cursor: 'pointer',
              }}
              title={fit88 ? "Switch to scrollable view" : "Fit all 88 keys on screen"}
            >
              {fit88 ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              <span>{fit88 ? 'Focused View' : 'Fit 88 Keys'}</span>
            </button>

            {/* Keyboard Mapping Setup Button */}
            <button
              onClick={() => setIsMappingModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '4px',
                color: '#38bdf8',
                fontSize: '0.725rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Open full laptop keyboard mapping editor"
            >
              <KeyboardIcon size={13} />
              <span>Key Setup</span>
            </button>
          </div>
        </div>
      )}

      {/* Red Felt Strip along fallboard */}
      <div style={{
        height: '4px',
        background: 'linear-gradient(90deg, #7f1d1d, #b91c1c, #7f1d1d)',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.6)',
      }} />

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          overflowX: fit88 ? 'hidden' : 'auto',
          overflowY: 'hidden',
          padding: '2px 0 0 0',
          background: '#090a0f',
        }}
      >
        <div
          ref={pianoBedRef}
          onMouseDown={() => { isPointerDownRef.current = true; }}
          style={{
            position: 'relative',
            width: totalPianoBedWidth,
            height: fit88 ? '160px' : '205px',
            display: 'flex',
          }}
        >
          {/* White Keys Layer */}
          {keys.filter(k => !k.isBlack).map(key => {
            const isUserHeld = activeMidiKeys.has(key.midi);
            const hlColor = highlightMap.get(key.midi);

            let bg = 'linear-gradient(180deg, #e2e8f0 0%, #f8fafc 85%, #cbd5e1 100%)';
            let shadow = 'inset 0 -4px 6px rgba(0, 0, 0, 0.12), inset 1px 0 1px rgba(255, 255, 255, 0.8), 0 3px 5px rgba(0, 0, 0, 0.4)';
            let transform = 'translateY(0)';

            if (isUserHeld) {
              bg = 'linear-gradient(180deg, #dbeafe 0%, #bfdbfe 80%, #93c5fd 100%)';
              shadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 12px rgba(59, 130, 246, 0.5)';
              transform = 'translateY(3px)';
            } else if (hlColor === 'right') {
              bg = 'linear-gradient(180deg, #bae6fd 0%, #38bdf8 80%, #0284c7 100%)';
              shadow = '0 0 14px rgba(56, 189, 248, 0.6)';
            } else if (hlColor === 'left') {
              bg = 'linear-gradient(180deg, #e9d5ff 0%, #c084fc 80%, #7e22ce 100%)';
              shadow = '0 0 14px rgba(168, 85, 247, 0.6)';
            } else if (hlColor === 'target') {
              bg = 'linear-gradient(180deg, #fef08a 0%, #eab308 80%, #ca8a04 100%)';
              shadow = '0 0 16px rgba(234, 179, 8, 0.7)';
            }

            return (
              <div
                key={key.midi}
                id={`key-${key.midi}`}
                style={{
                  flex: 1,
                  height: '100%',
                  background: bg,
                  border: '1px solid #94a3b8',
                  borderTop: 'none',
                  borderRadius: '0 0 4px 4px',
                  boxShadow: shadow,
                  transform: transform,
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  paddingBottom: '8px',
                  cursor: 'pointer',
                  zIndex: 1,
                  transition: 'transform 0.05s ease, background 0.06s ease',
                }}
                onMouseDown={() => {
                  isPointerDownRef.current = true;
                  handleNoteDown(key.midi, key.note);
                }}
                onMouseEnter={() => {
                  if (isPointerDownRef.current) {
                    handleNoteDown(key.midi, key.note);
                  }
                }}
                onMouseLeave={() => {
                  if (activeMidiKeys.has(key.midi)) {
                    handleNoteUp(key.midi, key.note);
                  }
                }}
                onMouseUp={() => {
                  handleNoteUp(key.midi, key.note);
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleNoteDown(key.midi, key.note);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleNoteUp(key.midi, key.note);
                }}
              >
                {/* Note Label (C notes show octave name) */}
                <span style={{
                  fontSize: fit88 ? '0.55rem' : '0.675rem',
                  fontWeight: key.pitch === 'C' ? 800 : 600,
                  color: key.pitch === 'C' ? '#1e293b' : '#64748b',
                  marginBottom: '2px',
                }}>
                  {key.pitch === 'C' ? key.note : (!fit88 ? key.pitch : '')}
                </span>

                {/* Laptop Key Badge */}
                {key.laptopKey && !fit88 && (
                  <span style={{
                    minWidth: '18px',
                    height: '18px',
                    padding: '0 3px',
                    background: '#1e293b',
                    color: '#f8fafc',
                    border: '1px solid #475569',
                    borderRadius: '3px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {key.laptopKey}
                  </span>
                )}
              </div>
            );
          })}

          {/* Black Keys Layer */}
          {keys.filter(k => k.isBlack).map(key => {
            const isUserHeld = activeMidiKeys.has(key.midi);
            const hlColor = highlightMap.get(key.midi);

            let bg = 'linear-gradient(180deg, #272a34 0%, #171920 40%, #0d0e12 100%)';
            let shadow = 'inset 0 1px 1px rgba(255, 255, 255, 0.2), inset -1px -1px 2px rgba(0, 0, 0, 0.7), 2px 5px 8px rgba(0, 0, 0, 0.6)';
            let transform = 'translateY(0)';

            if (isUserHeld) {
              bg = 'linear-gradient(180deg, #1e3a8a 0%, #1d4ed8 70%, #172554 100%)';
              shadow = '0 0 12px rgba(59, 130, 246, 0.6)';
              transform = 'translateY(2px)';
            } else if (hlColor === 'right') {
              bg = 'linear-gradient(180deg, #0369a1 0%, #0284c7 70%, #082f49 100%)';
              shadow = '0 0 14px rgba(56, 189, 248, 0.8)';
            } else if (hlColor === 'left') {
              bg = 'linear-gradient(180deg, #6b21a8 0%, #9333ea 70%, #3b0764 100%)';
              shadow = '0 0 14px rgba(168, 85, 247, 0.8)';
            } else if (hlColor === 'target') {
              bg = 'linear-gradient(180deg, #854d0e 0%, #ca8a04 70%, #422006 100%)';
              shadow = '0 0 16px rgba(234, 179, 8, 0.9)';
            }

            return (
              <div
                key={key.midi}
                id={`key-${key.midi}`}
                style={{
                  position: 'absolute',
                  left: `${key.leftPercent}%`,
                  width: `${key.widthPercent}%`,
                  height: fit88 ? '62%' : '65%',
                  background: bg,
                  border: '1px solid #000000',
                  borderRadius: '0 0 3px 3px',
                  boxShadow: shadow,
                  transform: transform,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  paddingBottom: '6px',
                  cursor: 'pointer',
                  zIndex: 3,
                  transition: 'transform 0.05s ease, background 0.06s ease',
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  isPointerDownRef.current = true;
                  handleNoteDown(key.midi, key.note);
                }}
                onMouseEnter={() => {
                  if (isPointerDownRef.current) {
                    handleNoteDown(key.midi, key.note);
                  }
                }}
                onMouseLeave={() => {
                  if (activeMidiKeys.has(key.midi)) {
                    handleNoteUp(key.midi, key.note);
                  }
                }}
                onMouseUp={(e) => {
                  e.stopPropagation();
                  handleNoteUp(key.midi, key.note);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleNoteDown(key.midi, key.note);
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleNoteUp(key.midi, key.note);
                }}
              >
                {/* Laptop Key Badge */}
                {key.laptopKey && !fit88 && (
                  <span style={{
                    minWidth: '16px',
                    height: '16px',
                    padding: '0 2px',
                    background: '#090a0f',
                    color: '#67e8f9',
                    border: '1px solid #334155',
                    borderRadius: '2px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {key.laptopKey}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Keyboard Mapping Setup Modal */}
      <KeyboardMappingModal
        isOpen={isMappingModalOpen}
        onClose={() => setIsMappingModalOpen(false)}
      />
    </div>
  );
};
