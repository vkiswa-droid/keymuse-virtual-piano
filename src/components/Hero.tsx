import React from 'react';
import { Play, Sparkles, Keyboard, Zap, Cable, CheckCircle2 } from 'lucide-react';
import { APP_TAGLINE } from '../config/constants';

interface HeroProps {
  onStartPlaying: () => void;
  onExploreSongs: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartPlaying, onExploreSongs }) => {
  return (
    <section style={{
      textAlign: 'center',
      padding: '2.5rem 1rem 1.75rem',
      maxWidth: 880,
      margin: '0 auto',
    }}>
      {/* Category Pill */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '20px', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 600, marginBottom: '16px' }}>
        <Sparkles size={13} />
        <span>Free Browser Instrument • Real Sampled Acoustic Grand Piano</span>
      </div>

      {/* Main Vision Heading */}
      <h1 style={{
        fontSize: 'clamp(2rem, 4.5vw, 3.25rem)',
        fontWeight: 800,
        letterSpacing: '-0.025em',
        lineHeight: 1.15,
        color: '#f8fafc',
        marginBottom: '14px',
      }}>
        {APP_TAGLINE}
      </h1>

      {/* Subtitle */}
      <p style={{
        fontSize: '1.05rem',
        color: '#94a3b8',
        lineHeight: 1.6,
        maxWidth: 680,
        margin: '0 auto 24px',
      }}>
        Turn your laptop keyboard or USB MIDI controller into a professional acoustic piano. Practice masterworks with our falling-note visualizer, import custom MIDI files, and learn music theory without expensive equipment.
      </p>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        marginBottom: '24px',
      }}>
        <button
          onClick={onStartPlaying}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            borderRadius: '6px',
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
          }}
        >
          <Play size={16} fill="currentColor" />
          <span>Start Playing</span>
        </button>

        <button
          onClick={onExploreSongs}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 22px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#f8fafc',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Sparkles size={16} color="#38bdf8" />
          <span>Practice Falling Notes</span>
        </button>
      </div>

      {/* Feature Spec Strip */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap',
        fontSize: '0.775rem',
        color: '#64748b',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Keyboard size={13} color="#94a3b8" />
          <span>Full 88-Key Bed (A0–C8)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Zap size={13} color="#38bdf8" />
          <span>Sampled Acoustic Grand</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Cable size={13} color="#c084fc" />
          <span>Web MIDI Hardware Support</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <CheckCircle2 size={13} color="#34d399" />
          <span>Zero Sign-In • 100% Free</span>
        </div>
      </div>
    </section>
  );
};
