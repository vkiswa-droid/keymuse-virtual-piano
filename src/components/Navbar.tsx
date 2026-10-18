import React, { useState } from 'react';
import { 
  Music, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  Radio, 
  BookOpen, 
  Disc, 
  Sparkles,
  Sliders
} from 'lucide-react';
import { APP_NAME } from '../config/constants';
import { soundEngine } from '../audio/soundEngine';

interface NavbarProps {
  activeTab: 'play' | 'songs' | 'learn' | 'record';
  onSelectTab: (tab: 'play' | 'songs' | 'learn' | 'record') => void;
  audioState: AudioContextState | 'uninitialized';
  onOpenHelp: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  audioState,
  onOpenHelp,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
}) => {
  const isAudioReady = audioState === 'running';

  const handleAudioInitClick = () => {
    soundEngine.initAudio();
  };

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(7, 10, 18, 0.85)',
      WebkitBackdropFilter: 'blur(16px)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0.75rem 1.5rem',
    }}>
      <div style={{
        maxWidth: 1320,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        {/* Brand Logo */}
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
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
          }}>
            <Music size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #ffffff, #c4b5fd)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {APP_NAME}
              </span>
              <span className="pill-badge purple" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                Free Instrument
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Virtual Laptop Piano
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav style={{
          display: 'flex',
          gap: '0.4rem',
          background: 'rgba(15, 23, 42, 0.7)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}>
          <button
            className={`btn btn-sm ${activeTab === 'play' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onSelectTab('play')}
            style={{ border: 'none' }}
          >
            <Music size={15} />
            <span>Play Piano</span>
          </button>

          <button
            className={`btn btn-sm ${activeTab === 'songs' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onSelectTab('songs')}
            style={{ border: 'none' }}
          >
            <Sparkles size={15} />
            <span>Practice Songs</span>
          </button>

          <button
            className={`btn btn-sm ${activeTab === 'learn' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onSelectTab('learn')}
            style={{ border: 'none' }}
          >
            <BookOpen size={15} />
            <span>Beginner Academy</span>
          </button>

          <button
            className={`btn btn-sm ${activeTab === 'record' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onSelectTab('record')}
            style={{ border: 'none' }}
          >
            <Disc size={15} />
            <span>Recording Studio</span>
          </button>
        </nav>

        {/* Right Controls: Audio Status, Volume, Shortcuts */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          {/* Audio Context Status Indicator */}
          <button
            onClick={handleAudioInitClick}
            title={isAudioReady ? "Audio engine active with low latency" : "Click to activate Web Audio engine"}
            className={`pill-badge ${isAudioReady ? 'active' : 'cyan'}`}
            style={{
              cursor: isAudioReady ? 'default' : 'pointer',
              border: 'none',
              fontFamily: 'inherit',
            }}
          >
            <Radio size={12} className={isAudioReady ? '' : 'animate-pulse'} />
            <span>{isAudioReady ? 'Audio Active' : 'Click to Enable Sound'}</span>
          </button>

          {/* Volume Control */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '0.35rem 0.65rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}>
            <button
              onClick={onToggleMute}
              className="btn btn-icon"
              style={{
                background: 'transparent',
                border: 'none',
                color: isMuted ? 'var(--accent-rose)' : 'var(--text-dim)',
                padding: '2px',
                cursor: 'pointer',
              }}
              title={isMuted ? "Unmute sound" : "Mute sound"}
            >
              {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              style={{ width: 68 }}
              className="custom-range"
              title={`Master Volume: ${Math.round(volume * 100)}%`}
            />
          </div>

          {/* Keyboard Shortcuts Help */}
          <button
            onClick={onOpenHelp}
            className="btn btn-secondary btn-sm"
            title="View laptop keyboard layout and shortcuts"
          >
            <HelpCircle size={16} />
            <span className="desktop-only">Keymap</span>
          </button>
        </div>
      </div>
    </header>
  );
};
