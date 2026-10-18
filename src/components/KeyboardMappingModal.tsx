import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  keyboardMapping, 
  LAPTOP_PHYSICAL_KEYS, 
  NUMPAD_PHYSICAL_KEYS,
  PhysicalKeyDef, 
  KeyboardLayoutProfile,
  KeyAssignment
} from '../config/keyboardMapping';
import { 
  MIN_MIDI, 
  MAX_MIDI, 
  midiToNoteName, 
  midiToFrequency, 
  generate88Keys,
  Piano88Key
} from '../config/piano88';
import { sampleEngine } from '../audio/sampleEngine';
import { 
  X, 
  RotateCcw, 
  Download, 
  Upload, 
  Sparkles, 
  AlertTriangle, 
  Check, 
  Layers, 
  Volume2, 
  Eye, 
  Keyboard as KeyboardIcon,
  Trash2,
  HelpCircle
} from 'lucide-react';

interface KeyboardMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardMappingModal: React.FC<KeyboardMappingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeLayer, setActiveLayer] = useState<'base' | 'shift' | 'numpad'>('base');
  const [selectedCode, setSelectedCode] = useState<string | null>('KeyA');
  const [detectMode, setDetectMode] = useState<boolean>(true);
  const [activePressedCodes, setActivePressedCodes] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<KeyboardLayoutProfile>(keyboardMapping.getProfile());
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [mappingVersion, setMappingVersion] = useState<number>(0);

  // Subscribe to mapping changes
  useEffect(() => {
    return keyboardMapping.subscribe(() => {
      setMappingVersion(v => v + 1);
      setProfile(keyboardMapping.getProfile());
    });
  }, []);

  // All 88 piano notes list for searchable selector
  const all88Notes = useMemo(() => {
    const list: Array<{ midi: number; note: string; isBlack: boolean; freq: number }> = [];
    for (let midi = MIN_MIDI; midi <= MAX_MIDI; midi++) {
      const note = midiToNoteName(midi);
      const isBlack = note.includes('#');
      const freq = Math.round(midiToFrequency(midi) * 10) / 10;
      list.push({ midi, note, isBlack, freq });
    }
    return list;
  }, []);

  // Current assignments for active layer
  const currentAssignments = useMemo(() => {
    const isShift = activeLayer === 'shift';
    const all = keyboardMapping.getAssignments();
    return all.filter(a => a.isShift === isShift);
  }, [activeLayer, mappingVersion]);

  // Selected key object definition
  const selectedKeyDef = useMemo(() => {
    if (!selectedCode) return null;
    return LAPTOP_PHYSICAL_KEYS.find(k => k.code === selectedCode) || 
           NUMPAD_PHYSICAL_KEYS.find(k => k.code === selectedCode) || null;
  }, [selectedCode]);

  // Selected key assignment
  const selectedAssignment = useMemo(() => {
    if (!selectedCode) return null;
    const isShift = activeLayer === 'shift';
    return keyboardMapping.getAssignment(selectedCode, isShift) || null;
  }, [selectedCode, activeLayer, mappingVersion]);

  // Conflicts list
  const conflicts = useMemo(() => {
    return keyboardMapping.getConflicts();
  }, [mappingVersion]);

  // Play test note
  const playTest = useCallback((midi: number) => {
    sampleEngine.playNote(midi, 0.85);
    setTimeout(() => {
      sampleEngine.releaseNote(midi);
    }, 450);
  }, []);

  // Handle physical keydown in modal for testing & key detection
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      if (e.repeat) return;

      // Auto-detect layer shift
      if (e.key === 'Shift') {
        setActiveLayer('shift');
        return;
      }

      // If user presses a key, detect and select it
      if (detectMode) {
        setSelectedCode(e.code);
      }

      setActivePressedCodes(prev => {
        const next = new Set(prev);
        next.add(e.code);
        return next;
      });

      // Sound test
      const isShift = e.shiftKey || activeLayer === 'shift';
      const midi = keyboardMapping.codeToMidi(e.code, isShift);
      if (midi !== null) {
        sampleEngine.playNote(midi, 0.85);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        if (activeLayer === 'shift') {
          // Keep active layer as user explicitly toggled, or don't force reset unless in base
        }
      }

      setActivePressedCodes(prev => {
        const next = new Set(prev);
        next.delete(e.code);
        return next;
      });

      const isShift = e.shiftKey || activeLayer === 'shift';
      const midi = keyboardMapping.codeToMidi(e.code, isShift);
      if (midi !== null) {
        sampleEngine.releaseNote(midi);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen, detectMode, activeLayer]);

  // Handle Preset change
  const handlePresetChange = (newProfile: KeyboardLayoutProfile) => {
    keyboardMapping.setProfile(newProfile);
    setProfile(newProfile);
  };

  // Handle Assigning Note to selected key
  const handleAssignMidi = (midi: number) => {
    if (!selectedCode) return;
    const isShift = activeLayer === 'shift';
    keyboardMapping.setAssignment(selectedCode, midi, isShift);
    playTest(midi);
  };

  // Handle Remove Assignment
  const handleRemoveAssignment = () => {
    if (!selectedCode) return;
    const isShift = activeLayer === 'shift';
    keyboardMapping.removeAssignment(selectedCode, isShift);
  };

  // Export mappings
  const handleExport = () => {
    const json = keyboardMapping.exportToJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keymuse_keyboard_mapping_${profile}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import mappings
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = keyboardMapping.importFromJson(content);
      if (success) {
        setImportStatus('Mapping imported successfully!');
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus('Invalid JSON mapping file.');
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  const currentKeysGrid = activeLayer === 'numpad' ? NUMPAD_PHYSICAL_KEYS : LAPTOP_PHYSICAL_KEYS;
  const isShiftActive = activeLayer === 'shift';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div style={{
        background: 'var(--surface-dark)',
        border: '1px solid var(--border-neutral)',
        borderRadius: 14,
        width: '100%',
        maxWidth: 1040,
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        overflow: 'hidden',
      }}>
        {/* Header Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.4rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface-mid)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)',
            }}>
              <KeyboardIcon size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                Laptop Keyboard Mapping Setup
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Play any of the 88 piano notes using your laptop keys. Click a keycap to inspect or remap.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Reset to Default */}
            <button
              onClick={() => keyboardMapping.resetToDefault()}
              title="Reset all assignments to recommended default"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.8rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={14} />
              Reset
            </button>

            {/* Export JSON */}
            <button
              onClick={handleExport}
              title="Export current keyboard mappings as JSON file"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.8rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              <Download size={14} />
              Export
            </button>

            {/* Import JSON */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.8rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 6,
              cursor: 'pointer',
            }}>
              <Upload size={14} />
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>

            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {importStatus && (
          <div style={{
            padding: '0.5rem 1.4rem',
            background: 'rgba(56, 189, 248, 0.1)',
            borderBottom: '1px solid rgba(56, 189, 248, 0.3)',
            fontSize: '0.82rem',
            color: 'var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <Check size={14} />
            {importStatus}
          </div>
        )}

        {/* Toolbar: Layout Preset & Layer Selector */}
        <div style={{
          padding: '0.75rem 1.4rem',
          background: 'var(--surface-card)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          {/* Preset Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Keyboard Preset:
            </span>
            <select
              value={profile}
              onChange={(e) => handlePresetChange(e.target.value as KeyboardLayoutProfile)}
              style={{
                background: 'var(--surface-dark)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-neutral)',
                borderRadius: 6,
                padding: '0.4rem 0.8rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <option value="daw_extended">Extended DAW 4-Octave (Full Keyboard + Shift) [Recommended]</option>
              <option value="chromatic_tracker">Chromatic Tracker (Consecutive Semitones Across Rows)</option>
              <option value="classic_two_octave">Classic 2-Octave Centered (C4-E5 with W,E,T,Y,U)</option>
            </select>
          </div>

          {/* Layer Selector Tabs */}
          <div style={{
            display: 'flex',
            background: 'var(--surface-dark)',
            padding: 3,
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
          }}>
            <button
              onClick={() => setActiveLayer('base')}
              style={{
                padding: '0.4rem 0.9rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: 6,
                background: activeLayer === 'base' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                color: activeLayer === 'base' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                border: activeLayer === 'base' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              Base Layer (Normal)
            </button>
            <button
              onClick={() => setActiveLayer('shift')}
              style={{
                padding: '0.4rem 0.9rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: 6,
                background: activeLayer === 'shift' ? 'rgba(192, 132, 252, 0.15)' : 'transparent',
                color: activeLayer === 'shift' ? 'var(--accent-purple)' : 'var(--text-muted)',
                border: activeLayer === 'shift' ? '1px solid rgba(192, 132, 252, 0.3)' : '1px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              Shift Layer (Sub-bass & Treble)
            </button>
            <button
              onClick={() => setActiveLayer('numpad')}
              style={{
                padding: '0.4rem 0.9rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: 6,
                background: activeLayer === 'numpad' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: activeLayer === 'numpad' ? 'var(--text-main)' : 'var(--text-muted)',
                border: activeLayer === 'numpad' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              Numpad Keys
            </button>
          </div>

          {/* Detect Key Toggle */}
          <button
            onClick={() => setDetectMode(!detectMode)}
            style={{
              padding: '0.4rem 0.8rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              borderRadius: 6,
              background: detectMode ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255, 255, 255, 0.05)',
              color: detectMode ? '#4ade80' : 'var(--text-muted)',
              border: detectMode ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid var(--border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Eye size={14} />
            {detectMode ? 'Press Key to Detect: ON' : 'Press Key to Detect: OFF'}
          </button>
        </div>

        {/* Main Content Area */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          overflow: 'hidden',
          flex: 1,
        }}>
          {/* Left Panel: Physical Laptop Keyboard Visualizer */}
          <div style={{
            padding: '1.2rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            background: 'var(--surface-dark)',
          }}>
            {/* Keyboard Frame */}
            <div style={{
              background: '#090b10',
              border: '1px solid var(--border-neutral)',
              borderRadius: 12,
              padding: '1rem',
              boxShadow: 'inset 0 4px 12px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}>
              {activeLayer !== 'numpad' ? (
                // Laptop Rows 1 to 5
                [1, 2, 3, 4, 5].map(rowNum => {
                  const rowKeys = LAPTOP_PHYSICAL_KEYS.filter(k => k.row === rowNum);
                  return (
                    <div
                      key={rowNum}
                      style={{
                        display: 'flex',
                        gap: '0.35rem',
                        justifyContent: rowNum === 5 ? 'center' : 'stretch',
                      }}
                    >
                      {rowKeys.map(keyDef => {
                        const isShift = activeLayer === 'shift';
                        const assignment = keyboardMapping.getAssignment(keyDef.code, isShift);
                        const isSelected = selectedCode === keyDef.code;
                        const isPressed = activePressedCodes.has(keyDef.code);
                        const isBlackNote = assignment?.note.includes('#');

                        return (
                          <div
                            key={keyDef.code}
                            onClick={() => {
                              setSelectedCode(keyDef.code);
                              if (assignment) playTest(assignment.midi);
                            }}
                            style={{
                              flex: keyDef.width ? keyDef.width : 1,
                              minWidth: keyDef.width ? keyDef.width * 36 : 38,
                              height: 52,
                              background: isPressed
                                ? (isShiftActive ? 'var(--accent-purple)' : 'var(--accent-cyan)')
                                : isSelected
                                ? 'rgba(56, 189, 248, 0.25)'
                                : assignment
                                ? (isBlackNote ? '#1a182c' : '#1e2433')
                                : '#12151e',
                              border: isSelected
                                ? '2px solid var(--accent-cyan)'
                                : isPressed
                                ? '2px solid #ffffff'
                                : assignment
                                ? (isBlackNote ? '1px solid #7c3aed' : '1px solid var(--border-neutral)')
                                : '1px solid var(--border-subtle)',
                              borderRadius: 6,
                              padding: '0.25rem 0.35rem',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              transition: 'all 0.08s ease',
                              userSelect: 'none',
                              WebkitUserSelect: 'none',
                              boxShadow: isPressed 
                                ? 'inset 0 2px 4px rgba(0, 0, 0, 0.4)' 
                                : '0 2px 4px rgba(0, 0, 0, 0.3)',
                              transform: isPressed ? 'translateY(1px)' : 'none',
                            }}
                          >
                            {/* Keycap physical letter */}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                            }}>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: isPressed ? '#ffffff' : 'var(--text-muted)',
                                fontFamily: 'var(--font-mono)',
                              }}>
                                {keyDef.label}
                              </span>
                              {assignment && (
                                <span style={{
                                  fontSize: '0.62rem',
                                  color: isPressed ? '#ffffff' : 'var(--text-dim)',
                                }}>
                                  {assignment.midi}
                                </span>
                              )}
                            </div>

                            {/* Mapped Piano Note Name */}
                            <div style={{
                              fontSize: assignment ? '0.85rem' : '0.7rem',
                              fontWeight: 800,
                              textAlign: 'center',
                              color: isPressed
                                ? '#ffffff'
                                : assignment
                                ? (isBlackNote ? '#c084fc' : '#38bdf8')
                                : 'var(--text-dim)',
                              fontFamily: 'var(--font-mono)',
                            }}>
                              {assignment ? assignment.note : '—'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              ) : (
                // Numpad Grid
                [1, 2, 3, 4].map(rowNum => {
                  const rowKeys = NUMPAD_PHYSICAL_KEYS.filter(k => k.row === rowNum);
                  return (
                    <div
                      key={rowNum}
                      style={{
                        display: 'flex',
                        gap: '0.4rem',
                        justifyContent: 'center',
                      }}
                    >
                      {rowKeys.map(keyDef => {
                        const assignment = keyboardMapping.getAssignment(keyDef.code, false);
                        const isSelected = selectedCode === keyDef.code;
                        const isPressed = activePressedCodes.has(keyDef.code);

                        return (
                          <div
                            key={keyDef.code}
                            onClick={() => {
                              setSelectedCode(keyDef.code);
                              if (assignment) playTest(assignment.midi);
                            }}
                            style={{
                              width: keyDef.width ? keyDef.width * 54 : 64,
                              height: 56,
                              background: isPressed
                                ? 'var(--accent-cyan)'
                                : isSelected
                                ? 'rgba(56, 189, 248, 0.25)'
                                : assignment
                                ? '#1e2433'
                                : '#12151e',
                              border: isSelected
                                ? '2px solid var(--accent-cyan)'
                                : '1px solid var(--border-neutral)',
                              borderRadius: 6,
                              padding: '0.3rem',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                            }}
                          >
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                              {keyDef.label}
                            </span>
                            <span style={{
                              fontSize: '0.9rem',
                              fontWeight: 800,
                              textAlign: 'center',
                              color: assignment ? '#38bdf8' : 'var(--text-dim)',
                            }}>
                              {assignment ? assignment.note : '—'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>

            {/* Visual Legend & Active Info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              padding: '0.4rem 0.2rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#38bdf8' }} />
                  White Piano Key
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#c084fc' }} />
                  Black Piano Key (#)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#12151e', border: '1px solid var(--border-subtle)' }} />
                  Unassigned
                </span>
              </div>

              <div>
                Mapped Notes: <strong style={{ color: 'var(--text-main)' }}>{currentAssignments.length}</strong> keys
              </div>
            </div>

            {/* Quick Playing Guide */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '0.8rem 1rem',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
            }}>
              <strong style={{ color: 'var(--text-main)' }}>Pro Tip:</strong> In the default <strong>Extended DAW Preset</strong>, you have two full manuals simultaneously:
              <br />• <strong>ZXCVB...</strong> covers Bass to Middle C (C3–C4).
              <br />• <strong>ASDF / QWERTY</strong> covers Middle C to High Treble (C4–G5).
              <br />• Hold <strong>Shift</strong> to access Sub-bass A0–C2 and extreme Treble C6–C8.
            </div>
          </div>

          {/* Right Panel: Note Assignment Inspector & 88-Note Selector */}
          <div style={{
            background: 'var(--surface-mid)',
            borderLeft: '1px solid var(--border-neutral)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Selected Key Details */}
            <div style={{
              padding: '1.2rem',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Keycap Inspector
              </div>

              {selectedKeyDef ? (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{
                        width: 42,
                        height: 42,
                        borderRadius: 8,
                        background: 'var(--surface-dark)',
                        border: '1px solid var(--accent-cyan)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        color: 'var(--accent-cyan)',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {isShiftActive ? `⇧${selectedKeyDef.label}` : selectedKeyDef.label}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {selectedKeyDef.code}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Layer: {isShiftActive ? 'Shift' : 'Base'}
                        </div>
                      </div>
                    </div>

                    {selectedAssignment && (
                      <button
                        onClick={handleRemoveAssignment}
                        title="Remove note assignment from this key"
                        style={{
                          padding: '0.4rem',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: 6,
                          color: '#f87171',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {selectedAssignment ? (
                    <div style={{
                      marginTop: '0.8rem',
                      padding: '0.6rem 0.8rem',
                      borderRadius: 6,
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <div>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                          {selectedAssignment.note}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                          (MIDI {selectedAssignment.midi})
                        </span>
                      </div>
                      <button
                        onClick={() => playTest(selectedAssignment.midi)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: 4,
                          background: 'var(--accent-cyan)',
                          color: '#000',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <Volume2 size={12} />
                        Test
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      marginTop: '0.8rem',
                      padding: '0.6rem 0.8rem',
                      borderRadius: 6,
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px dashed var(--border-subtle)',
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      textAlign: 'center',
                    }}>
                      Key is unassigned. Select a note below to assign.
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Click a key on the keyboard to inspect or reassign.
                </div>
              )}
            </div>

            {/* 88 Piano Notes Search & Assign List */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              overflow: 'hidden',
              padding: '0.8rem 1.2rem',
            }}>
              <div style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                marginBottom: '0.5rem',
              }}>
                Assign Piano Note (A0 – C8)
              </div>

              <div style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                paddingRight: '0.2rem',
              }}>
                {all88Notes.map(n => {
                  const isCurrent = selectedAssignment?.midi === n.midi;

                  return (
                    <div
                      key={n.midi}
                      onClick={() => handleAssignMidi(n.midi)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.4rem 0.6rem',
                        borderRadius: 6,
                        background: isCurrent
                          ? 'rgba(56, 189, 248, 0.2)'
                          : n.isBlack
                          ? 'rgba(255, 255, 255, 0.02)'
                          : 'rgba(255, 255, 255, 0.05)',
                        border: isCurrent
                          ? '1px solid var(--accent-cyan)'
                          : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'background 0.1s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          background: n.isBlack ? '#c084fc' : '#ffffff',
                        }} />
                        <span style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: isCurrent ? 'var(--accent-cyan)' : 'var(--text-main)',
                          fontFamily: 'var(--font-mono)',
                        }}>
                          {n.note}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          {n.freq} Hz
                        </span>
                        <span style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                          background: 'rgba(0, 0, 0, 0.3)',
                          padding: '0.1rem 0.35rem',
                          borderRadius: 4,
                        }}>
                          MIDI {n.midi}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '0.8rem 1.4rem',
          background: 'var(--surface-mid)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={14} color="var(--accent-cyan)" />
            Assignments automatically save locally in your browser.
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1.4rem',
              borderRadius: 6,
              background: 'var(--accent-cyan)',
              color: '#000000',
              fontWeight: 700,
              fontSize: '0.85rem',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
