import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Disc, 
  Volume2, 
  VolumeX, 
  Layers, 
  Flame, 
  Activity, 
  Play, 
  Square, 
  Clock, 
  Info,
  Footprints
} from 'lucide-react';
import { SoundType } from '../types';
import { soundEngine } from '../audio/soundEngine';

interface SoundControlsProps {
  soundType: SoundType;
  onSoundTypeChange: (type: SoundType) => void;
  sustain: boolean;
  onSustainToggle: () => void;
  octaveOffset: number;
  onOctaveChange: (offset: number) => void;
}

export const SoundControls: React.FC<SoundControlsProps> = ({
  soundType,
  onSoundTypeChange,
  sustain,
  onSustainToggle,
  octaveOffset,
  onOctaveChange,
}) => {
  // Metronome state
  const [isMetronomeOn, setIsMetronomeOn] = useState(soundEngine.isMetronomeActive());
  const [bpm, setBpm] = useState(soundEngine.getMetronomeBpm());
  const [timeSignature, setTimeSignature] = useState(4);
  const [activeBeat, setActiveBeat] = useState(0);

  // Tap tempo state
  const tapTimesRef = React.useRef<number[]>([]);

  useEffect(() => {
    soundEngine.setOnBeatCallback((beat) => {
      setActiveBeat(beat);
    });

    return () => {
      soundEngine.setOnBeatCallback(null);
    };
  }, []);

  const handleToggleMetronome = () => {
    if (isMetronomeOn) {
      soundEngine.stopMetronome();
      setIsMetronomeOn(false);
    } else {
      soundEngine.setMetronomeBeats(timeSignature);
      soundEngine.setMetronomeBpm(bpm);
      soundEngine.startMetronome();
      setIsMetronomeOn(true);
    }
  };

  const handleBpmChange = (newBpm: number) => {
    const clamped = Math.max(40, Math.min(240, Math.round(newBpm)));
    setBpm(clamped);
    soundEngine.setMetronomeBpm(clamped);
  };

  const handleTimeSigChange = (beats: number) => {
    setTimeSignature(beats);
    soundEngine.setMetronomeBeats(beats);
    if (isMetronomeOn) {
      soundEngine.stopMetronome();
      soundEngine.startMetronome();
    }
  };

  const handleTapTempo = () => {
    const now = performance.now();
    const taps = tapTimesRef.current;
    
    // Reset if last tap was more than 2 seconds ago
    if (taps.length > 0 && now - taps[taps.length - 1] > 2000) {
      taps.length = 0;
    }

    taps.push(now);
    if (taps.length > 4) {
      taps.shift();
    }

    if (taps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < taps.length; i++) {
        intervals.push(taps[i] - taps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      handleBpmChange(calculatedBpm);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', marginTop: '1.5rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sliders size={18} color="var(--accent-purple)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Instrument & Audio Controls</h2>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}>
          <Info size={13} />
          <span>Real-time Web Audio Synthesizer • Low latency</span>
        </div>
      </div>

      <div className="controls-grid">
        {/* Control 1: Sound Engine Tone Selection */}
        <div className="control-card">
          <div className="control-title">
            <Layers size={14} color="var(--accent-purple)" />
            <span>Tone Generator</span>
          </div>

          <div className="segmented-group">
            <button
              onClick={() => onSoundTypeChange('piano')}
              className={`segment-btn ${soundType === 'piano' ? 'active' : ''}`}
            >
              Modeled Piano
            </button>
            <button
              onClick={() => onSoundTypeChange('soft')}
              className={`segment-btn ${soundType === 'soft' ? 'active' : ''}`}
            >
              Soft Keys
            </button>
            <button
              onClick={() => onSoundTypeChange('synth')}
              className={`segment-btn ${soundType === 'synth' ? 'active' : ''}`}
            >
              Synth Lead
            </button>
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: 0, lineHeight: 1.4 }}>
            {soundType === 'piano' && 'Physical harmonic synthesis modeled after acoustic piano hammer strikes.'}
            {soundType === 'soft' && 'Smooth sine-wave electric keys with bell-like overtone resonance.'}
            {soundType === 'synth' && 'Detuned dual-sawtooth polyphonic synthesizer with 24dB resonant filter.'}
          </p>
        </div>

        {/* Control 2: Sustain Pedal */}
        <div className="control-card">
          <div className="control-title">
            <Footprints size={14} color="var(--accent-cyan)" />
            <span>Sustain Pedal</span>
          </div>

          <button
            onClick={onSustainToggle}
            className={`sustain-pedal-btn ${sustain ? 'active' : ''}`}
            title="Toggle sustain (Shortcut: Spacebar)"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: sustain ? 'var(--accent-purple)' : 'rgba(255, 255, 255, 0.2)',
                boxShadow: sustain ? '0 0 10px var(--accent-purple)' : 'none',
              }} />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {sustain ? 'Sustain Active' : 'Sustain Off'}
              </span>
            </div>
            <span className="pill-badge" style={{ fontSize: '0.7rem' }}>
              Spacebar
            </span>
          </button>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: 0 }}>
            Allows notes to ring out naturally after releasing laptop keys.
          </p>
        </div>

        {/* Control 3: Octave Preset Switcher */}
        <div className="control-card">
          <div className="control-title">
            <Activity size={14} color="var(--accent-amber)" />
            <span>Octave Shift</span>
          </div>

          <div className="segmented-group">
            <button
              onClick={() => onOctaveChange(-1)}
              className={`segment-btn ${octaveOffset === -1 ? 'active' : ''}`}
              title="Octave 3 (Low)"
            >
              Low (Oct 3)
            </button>
            <button
              onClick={() => onOctaveChange(0)}
              className={`segment-btn ${octaveOffset === 0 ? 'active' : ''}`}
              title="Octave 4 (Default Middle C)"
            >
              Mid (Oct 4)
            </button>
            <button
              onClick={() => onOctaveChange(1)}
              className={`segment-btn ${octaveOffset === 1 ? 'active' : ''}`}
              title="Octave 5 (High)"
            >
              High (Oct 5)
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            <span>Shortcut: [Z] Down / [X] Up</span>
            <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>
              Base: {octaveOffset === 0 ? 'Middle C (C4)' : octaveOffset > 0 ? `C${4 + octaveOffset}` : `C${4 + octaveOffset}`}
            </span>
          </div>
        </div>

        {/* Control 4: Functional Metronome */}
        <div className="control-card">
          <div className="control-title">
            <Clock size={14} color="var(--accent-emerald)" />
            <span>Practice Metronome</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            {/* Play/Stop button */}
            <button
              onClick={handleToggleMetronome}
              className={`btn btn-sm ${isMetronomeOn ? 'btn-danger' : 'btn-primary'}`}
              style={{ minWidth: 80 }}
            >
              {isMetronomeOn ? <Square size={14} /> : <Play size={14} />}
              <span>{isMetronomeOn ? 'Stop' : 'Start'}</span>
            </button>

            {/* Tap Tempo Button */}
            <button
              onClick={handleTapTempo}
              className="btn btn-secondary btn-sm"
              title="Tap repeatedly to set tempo"
            >
              Tap Tempo
            </button>

            {/* Time signature */}
            <div style={{ display: 'flex', gap: 3 }}>
              {[2, 3, 4].map(sig => (
                <button
                  key={sig}
                  onClick={() => handleTimeSigChange(sig)}
                  style={{
                    padding: '3px 6px',
                    fontSize: '0.75rem',
                    borderRadius: 4,
                    border: '1px solid var(--border-subtle)',
                    background: timeSignature === sig ? 'var(--accent-purple)' : 'transparent',
                    color: timeSignature === sig ? '#fff' : 'var(--text-dim)',
                    cursor: 'pointer',
                  }}
                >
                  {sig}/4
                </button>
              ))}
            </div>
          </div>

          {/* Slider and BPM counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="range"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => handleBpmChange(parseInt(e.target.value, 10))}
              className="custom-range"
            />
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: 'var(--text-main)',
              minWidth: 55,
              textAlign: 'right',
            }}>
              {bpm} BPM
            </span>
          </div>

          {/* Flashing beat indicators */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Beat Indicator:</span>
            <div className="beat-leds">
              {Array.from({ length: timeSignature }).map((_, index) => {
                const isCurrent = isMetronomeOn && activeBeat === index;
                const isAccent = index === 0;
                let className = 'beat-dot';
                if (isCurrent) {
                  className += isAccent ? ' accent-beat' : ' regular-beat';
                }
                return <div key={index} className={className} />;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
