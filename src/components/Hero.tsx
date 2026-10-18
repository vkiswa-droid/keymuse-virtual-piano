import React from 'react';
import { Play, Sparkles, Keyboard, ShieldCheck, Zap } from 'lucide-react';
import { APP_TAGLINE } from '../config/constants';

interface HeroProps {
  onStartPlaying: () => void;
  onExploreSongs: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartPlaying, onExploreSongs }) => {
  return (
    <section className="hero-section">
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        {/* Value badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <div className="pill-badge purple" style={{ gap: '0.5rem' }}>
            <Sparkles size={14} color="#a78bfa" />
            <span>100% Free Virtual Instrument • No Hardware Required</span>
          </div>
        </div>

        {/* Vision Heading */}
        <h1 className="hero-title">
          {APP_TAGLINE}
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle">
          Turn your laptop keyboard into a responsive, expressive musical piano. Practice famous melodies note-by-note, master chords with guided feedback, and record your songs without spending a single dollar.
        </p>

        {/* Action CTAs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '2rem',
        }}>
          <button 
            onClick={onStartPlaying}
            className="btn btn-primary"
            style={{ 
              fontSize: '1.05rem', 
              padding: '0.85rem 1.85rem',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <Play size={18} fill="#ffffff" />
            <span>Start Playing</span>
          </button>

          <button 
            onClick={onExploreSongs}
            className="btn btn-secondary"
            style={{ 
              fontSize: '1.05rem', 
              padding: '0.85rem 1.75rem',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <Sparkles size={18} color="#06b6d4" />
            <span>Practice Songs</span>
          </button>
        </div>

        {/* Key Feature Badges */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap',
          color: 'var(--text-muted)',
          fontSize: '0.825rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Keyboard size={15} color="#8b5cf6" />
            <span>17 Keys Mapped to Home Row</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Zap size={15} color="#06b6d4" />
            <span>Low-Latency Web Audio Engine</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={15} color="#10b981" />
            <span>No Account • Completely Free</span>
          </div>
        </div>
      </div>
    </section>
  );
};
