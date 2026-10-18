import React, { useState, useEffect } from 'react';
import { 
  Music, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  Radio, 
  BookOpen, 
  Disc, 
  Sparkles,
  Sliders,
  Cable,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { APP_NAME } from '../config/constants';
import { sampleEngine, AudioEngineStatus } from '../audio/sampleEngine';

interface NavbarProps {
  activeTab: 'play' | 'practice' | 'learn' | 'studio';
  onSelectTab: (tab: 'play' | 'practice' | 'learn' | 'studio') => void;
  onOpenHelp: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenHelp,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
}) => {
  const [audioStatus, setAudioStatus] = useState<AudioEngineStatus>(sampleEngine.getStatus());
  const [loadProgress, setLoadProgress] = useState<number>(sampleEngine.getLoadProgress());
  const [midiDevices, setMidiDevices] = useState<string[]>([]);

  useEffect(() => {
    const unsubStatus = sampleEngine.subscribeStatus((status, progress) => {
      setAudioStatus(status);
      setLoadProgress(progress);
    });

    const unsubMidi = sampleEngine.subscribeMidiDevices((devices) => {
      setMidiDevices(devices);
    });

    return () => {
      unsubStatus();
      unsubMidi();
    };
  }, []);

  const handleAudioInitClick = () => {
    sampleEngine.initAudio();
  };

  return (
    <header style={{
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      background: '#0d0f14',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0.65rem 1.5rem',
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        {/* Brand Logo & Name */}
        <div 
          onClick={() => onSelectTab('play')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
            WebkitUserSelect: 'none',
            userSelect: 'none',
          }}
        >
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 6,
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Music size={18} color="#38bdf8" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#f8fafc',
              }}>
                {APP_NAME}
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '3px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}>
                88-Key Pro
              </span>
            </div>
          </div>
        </div>

        {/* Center DAW-Style Navigation Tabs: Play / Practice / Learn / Studio */}
        <nav style={{
          display: 'flex',
          gap: '2px',
          background: '#141720',
          padding: '3px',
          borderRadius: '6px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <button
            onClick={() => onSelectTab('play')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '4px',
              border: 'none',
              background: activeTab === 'play' ? '#2563eb' : 'transparent',
              color: activeTab === 'play' ? '#ffffff' : '#94a3b8',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <Music size={14} />
            <span>Play</span>
          </button>

          <button
            onClick={() => onSelectTab('practice')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '4px',
              border: 'none',
              background: activeTab === 'practice' ? '#0891b2' : 'transparent',
              color: activeTab === 'practice' ? '#ffffff' : '#94a3b8',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <Sparkles size={14} />
            <span>Practice (Falling Notes)</span>
          </button>

          <button
            onClick={() => onSelectTab('learn')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '4px',
              border: 'none',
              background: activeTab === 'learn' ? '#7c3aed' : 'transparent',
              color: activeTab === 'learn' ? '#ffffff' : '#94a3b8',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <BookOpen size={14} />
            <span>Learn</span>
          </button>

          <button
            onClick={() => onSelectTab('studio')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '4px',
              border: 'none',
              background: activeTab === 'studio' ? '#e11d48' : 'transparent',
              color: activeTab === 'studio' ? '#ffffff' : '#94a3b8',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <Disc size={14} />
            <span>Studio</span>
          </button>
        </nav>

        {/* Right Controls: Real Sample Status, MIDI Device Badge, Volume, Keymap */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Sampled Audio Engine Status */}
          <button
            onClick={handleAudioInitClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: audioStatus === 'ready' 
                ? 'rgba(16, 185, 129, 0.12)' 
                : audioStatus === 'loading'
                ? 'rgba(56, 189, 248, 0.12)'
                : 'rgba(255, 255, 255, 0.04)',
              color: audioStatus === 'ready' 
                ? '#34d399' 
                : audioStatus === 'loading'
                ? '#38bdf8'
                : '#94a3b8',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: audioStatus === 'ready' ? 'default' : 'pointer',
            }}
            title={audioStatus === 'ready' ? "Sampled Acoustic Grand Piano Active" : "Click to initialize audio"}
          >
            {audioStatus === 'loading' ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span>Downloading Grand: {loadProgress}%</span>
              </>
            ) : audioStatus === 'ready' ? (
              <>
                <CheckCircle2 size={12} />
                <span>Sampled Grand</span>
              </>
            ) : audioStatus === 'fallback' ? (
              <>
                <Radio size={12} />
                <span>Modeled Grand</span>
              </>
            ) : (
              <>
                <Radio size={12} />
                <span>Click to Enable Audio</span>
              </>
            )}
          </button>

          {/* Web MIDI Status Badge */}
          {midiDevices.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '4px',
              color: '#c084fc',
              fontSize: '0.725rem',
              fontWeight: 600,
            }} title={`Connected MIDI Device: ${midiDevices.join(', ')}`}>
              <Cable size={12} />
              <span>MIDI Active</span>
            </div>
          )}

          {/* Master Volume */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#141720',
            padding: '3px 8px',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <button
              onClick={onToggleMute}
              style={{
                background: 'transparent',
                border: 'none',
                color: isMuted ? '#f43f5e' : '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                padding: '2px',
              }}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              style={{ width: 60 }}
              className="custom-range"
            />
          </div>

          {/* Keyboard Shortcuts */}
          <button
            onClick={onOpenHelp}
            style={{
              padding: '6px 10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '4px',
              color: '#94a3b8',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <HelpCircle size={14} />
            <span>Keymap</span>
          </button>
        </div>
      </div>
    </header>
  );
};
