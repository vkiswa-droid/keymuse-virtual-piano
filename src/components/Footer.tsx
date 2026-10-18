import React from 'react';
import { Heart, Music, Shield, Sparkles } from 'lucide-react';
import { APP_NAME } from '../config/constants';

export const Footer: React.FC = () => {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      background: 'rgba(5, 8, 16, 0.9)',
      padding: '2.5rem 1.5rem',
      marginTop: 'auto',
      color: 'var(--text-muted)',
      fontSize: '0.85rem',
    }}>
      <div style={{
        maxWidth: 1320,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1.05rem' }}>
              {APP_NAME}
            </span>
            <span className="pill-badge purple" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
              Open Music Education
            </span>
          </div>
          <p style={{ margin: 0, maxWidth: 500, lineHeight: 1.5, color: 'var(--text-dim)' }}>
            Empowering everyone to explore piano, play classical and popular melodies, and understand harmony using their everyday laptop keyboard.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={14} color="var(--accent-purple)" />
            <span>Web Audio API</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Shield size={14} color="var(--accent-emerald)" />
            <span>Private & Browser Local</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>Made with</span>
            <Heart size={14} color="var(--accent-rose)" fill="var(--accent-rose)" />
            <span>for aspiring musicians</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
