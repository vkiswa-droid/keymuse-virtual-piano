import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Volume2, 
  VolumeX, 
  Footprints, 
  Clock, 
  Play, 
  Square, 
  Radio, 
  Sparkles, 
  Activity 
} from 'lucide-react';
import { sampleEngine } from '../audio/sampleEngine';

interface SoundControlsProps {
  sustain: boolean;
  onSustainToggle: () => void;
  octaveOffset: number;
  onOctaveChange: (offset: number) => void;
}

export const SoundControls: React.FC<SoundControlsProps> = ({
  sustain,
  onSustainToggle,
  octaveOffset,
  onOctaveChange,
}) => {
  // Metronome state
  const [isMetronomeOn, setIsMetronomeOn] = useState(false);
  const [bpm, setBpm] = useState(108);
  const [timeSignature, setTimeSignature] = useState(4);
  const [activeBeat, setActiveBeat] = useState(0);

  const metronomeTimerRef = React.useRef<number | null>(null);
  const tapTimesRef = React.useRef<number[]>([]);

  const handleToggleMetronome = () => {
    if (isMetronomeOn) {
      if (metronomeTimerRef.current !== null) {
        clearInterval(metronomeTimerRef.current);
        metronomeTimerRef.current = null;
      }
      setIsMetronomeOn(false);
      setActiveBeat(0);
    } else {
      sampleEngine.initAudio();
      setIsMetronomeOn(true);
      setActiveBeat(0);
      playClick(0);

      const intervalMs = (60 / bpm) * 1000;
      let currentB = 0;
      metronomeTimerRef.current = window.setInterval(() => {
        currentB = (currentB + 1) % timeSignature;
        setActiveBeat(currentB);
        playClick(currentB);
      }, intervalMs);
    }
  };

  const playClick = (beat: number) => {
    // Play woodblock / high-pitch tick for beat 1, lower for others
    const clickMidi = beat === 0 ? 84 : 76;
    sampleEngine.playNote(clickMidi, beat === 0 ? 0.7 : 0.4);
    setTimeout(() => {
      sampleEngine.releaseNote(clickMidi);
    }, 40);
  };

  useEffect(() => {
    return () => {
      if (metronomeTimerRef.current !== null) {
        clearInterval(metronomeTimerRef.current);
      }
    };
  }, []);

  const handleBpmChange = (newBpm: number) => {
    const clamped = Math.max(40, Math.min(240, Math.round(newBpm)));
    setBpm(clamped);
    if (isMetronomeOn) {
      if (metronomeTimerRef.current !== null) {
        clearInterval(metronomeTimerRef.current);
      }
      const intervalMs = (60 / clamped) * 1000;
      let currentB = activeBeat;
      metronomeTimerRef.current = window.setInterval(() => {
        currentB = (currentB + 1) % timeSignature;
        setActiveBeat(currentB);
        playClick(currentB);
      }, intervalMs);
    }
  };

  const handleTapTempo = () => {
    const now = performance.now();
    const taps = tapTimesRef.current;
    if (taps.length > 0 && now - taps[taps.length - 1] > 2000) {
      taps.length = 0;
    }
    taps.push(now);
    if (taps.length > 4) taps.shift();

    if (taps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < taps.length; i++) {
        intervals.push(taps[i] - taps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      handleBpmChange(Math.round(60000 / avgInterval));
    }
  };

  return (
    <div style={{
      background: '#12141a',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '8px',
      padding: '16px',
      marginTop: '16px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={16} color="#38bdf8" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
            Instrument & Acoustic Controls
          </h3>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          Real Sampled Steinway / Yamaha Grand • Physical Damper & Reverb
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px',
      }}>
        {/* Sustain Pedal Card */}
        <div style={{
          background: '#181b24',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '6px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
            Damper Sustain Pedal
          </span>

          <button
            onClick={onSustainToggle}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '6px',
              background: sustain ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0, 0, 0, 0.3)',
              border: sustain ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
              color: sustain ? '#38bdf8' : '#94a3b8',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Footprints size={16} />
              <span>{sustain ? 'Sustain Active' : 'Sustain Off'}</span>
            </div>
            <span style={{
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(255, 255, 255, 0.06)',
              padding: '2px 6px',
              borderRadius: '3px',
            }}>
              Spacebar
            </span>
          </button>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
            Extends harmonic decay of strings naturally.
          </span>
        </div>

        {/* Octave Range Preset */}
        <div style={{
          background: '#181b24',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '6px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
            Laptop Keyboard Octave
          </span>

          <div style={{ display: 'flex', background: '#0d0f14', padding: '3px', borderRadius: '4px' }}>
            <button
              onClick={() => onOctaveChange(-1)}
              style={{
                flex: 1,
                padding: '5px',
                border: 'none',
                borderRadius: '3px',
                background: octaveOffset === -1 ? '#2563eb' : 'transparent',
                color: octaveOffset === -1 ? '#fff' : '#94a3b8',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Octave 3 (Low)
            </button>
            <button
              onClick={() => onOctaveChange(0)}
              style={{
                flex: 1,
                padding: '5px',
                border: 'none',
                borderRadius: '3px',
                background: octaveOffset === 0 ? '#2563eb' : 'transparent',
                color: octaveOffset === 0 ? '#fff' : '#94a3b8',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Octave 4 (Mid C)
            </button>
            <button
              onClick={() => onOctaveChange(1)}
              style={{
                flex: 1,
                padding: '5px',
                border: 'none',
                borderRadius: '3px',
                background: octaveOffset === 1 ? '#2563eb' : 'transparent',
                color: octaveOffset === 1 ? '#fff' : '#94a3b8',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Octave 5 (High)
            </button>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
            Shift with hotkeys [Z] Down / [X] Up.
          </span>
        </div>

        {/* Metronome */}
        <div style={{
          background: '#181b24',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '6px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
            Practice Metronome
          </span>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={handleToggleMetronome}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '4px',
                border: 'none',
                background: isMetronomeOn ? '#ef4444' : '#2563eb',
                color: '#fff',
                fontSize: '0.775rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isMetronomeOn ? <Square size={12} /> : <Play size={12} />}
              <span>{isMetronomeOn ? 'Stop' : 'Start'}</span>
            </button>

            <button
              onClick={handleTapTempo}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#94a3b8',
                fontSize: '0.725rem',
                cursor: 'pointer',
              }}
            >
              Tap Tempo
            </button>

            <div style={{ display: 'flex', gap: '2px' }}>
              {[2, 3, 4].map(s => (
                <button
                  key={s}
                  onClick={() => setTimeSignature(s)}
                  style={{
                    padding: '2px 5px',
                    borderRadius: '2px',
                    border: 'none',
                    background: timeSignature === s ? '#334155' : 'transparent',
                    color: timeSignature === s ? '#fff' : '#64748b',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                  }}
                >
                  {s}/4
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="range"
              min={40}
              max={240}
              value={bpm}
              onChange={(e) => handleBpmChange(parseInt(e.target.value, 10))}
              className="custom-range"
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, minWidth: 50, textAlign: 'right' }}>
              {bpm} BPM
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
