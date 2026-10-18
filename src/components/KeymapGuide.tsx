import React from 'react';
import { Keyboard, X, Sparkles, Layers, VolumeX } from 'lucide-react';
import { KEY_MAPPINGS, getShiftedNote } from '../config/constants';

interface KeymapGuideProps {
  octaveOffset: number;
  isOpen: boolean;
  onClose: () => void;
}

export const KeymapGuide: React.FC<KeymapGuideProps> = ({
  octaveOffset,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      background: 'rgba(3, 7, 18, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
    }}>
      <div 
        className="glass-panel"
        style={{
          maxWidth: 720,
          width: '100%',
          background: '#0d1527',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="btn btn-secondary btn-icon"
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            width: 34,
            height: 34,
            padding: 0,
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Keyboard size={22} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
              Laptop Keyboard Layout
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', margin: 0 }}>
              Current Mapping (Active Octave: {4 + octaveOffset})
            </p>
          </div>
        </div>

        {/* Visual Keyboard Diagram */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.45)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          {/* Black Keys Row (QWERTY top row) */}
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
              BLACK KEYS (Top Row: W, E, T, Y, U, O, P):
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {KEY_MAPPINGS.filter(k => k.isBlack).map(k => (
                <div
                  key={k.code}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 54,
                    height: 58,
                    background: '#151b2e',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem', color: '#67e8f9' }}>
                    {k.keyLabel}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                    {getShiftedNote(`${k.baseNote}${k.baseOctave}`, octaveOffset)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* White Keys Row (Home Row) */}
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
              WHITE KEYS (Home Row: A, S, D, F, G, H, J, K, L, ;):
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {KEY_MAPPINGS.filter(k => !k.isBlack).map(k => (
                <div
                  key={k.code}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 54,
                    height: 58,
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem', color: '#1e1b4b' }}>
                    {k.keyLabel}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#4338ca', fontWeight: 700 }}>
                    {getShiftedNote(`${k.baseNote}${k.baseOctave}`, octaveOffset)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Global Shortcuts Reference */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.75rem', borderRadius: 8 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block' }}>Sustain Pedal</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-purple)' }}>[Spacebar]</span>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.75rem', borderRadius: 8 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block' }}>Octave Down / Up</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-amber)' }}>[Z] / [X] or [-] / [+]</span>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.75rem', borderRadius: 8 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block' }}>Safety Typing Mode</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>Ignored in inputs & forms</span>
          </div>
        </div>

        <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
          Got It, Start Playing
        </button>
      </div>
    </div>
  );
};
