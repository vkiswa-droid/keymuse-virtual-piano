import React, { useRef, useEffect, useCallback } from 'react';
import { ParsedMidiNote } from '../audio/midiParser';
import { PIANO_88_KEYS, TOTAL_WHITE_KEYS } from '../config/piano88';
import { keyboardMapping } from '../config/keyboardMapping';

interface FallingNoteCanvasProps {
  notes: ParsedMidiNote[];
  currentTime: number;
  lookaheadSeconds?: number;
  showNoteNames?: boolean;
  selectedHand?: 'both' | 'right' | 'left';
  loopA: number | null;
  loopB: number | null;
  activePlayingMidis: Set<number>;
  onKeyTriggeredFromSong?: (activeMidis: number[]) => void;
}

export const FallingNoteCanvas: React.FC<FallingNoteCanvasProps> = ({
  notes,
  currentTime,
  lookaheadSeconds = 2.5,
  showNoteNames = true,
  selectedHand = 'both',
  loopA,
  loopB,
  activePlayingMidis,
  onKeyTriggeredFromSong,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Pre-index 88 keys by MIDI number for fast lookup in animation loop
  const keyMap = useRef(new Map(PIANO_88_KEYS.map(k => [k.midi, k])));

  // Render Loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Draw Canvas Background & Vertical Key Lanes
    ctx.fillStyle = '#0a0c10';
    ctx.fillRect(0, 0, width, height);

    // Draw subtle vertical pitch lanes
    PIANO_88_KEYS.forEach(key => {
      const x = (key.leftPercent / 100) * width;
      const w = (key.widthPercent / 100) * width;

      if (key.isBlack) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(x, 0, w, height);
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + w, 0);
        ctx.lineTo(x + w, height);
        ctx.stroke();
      }
    });

    // 2. Draw A/B Loop Markers if set
    if (loopA !== null) {
      const deltaA = loopA - currentTime;
      if (deltaA >= 0 && deltaA <= lookaheadSeconds) {
        const yA = height - (deltaA / lookaheadSeconds) * height;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, yA);
        ctx.lineTo(width, yA);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('LOOP A ⚑', 12, yA - 4);
      }
    }

    if (loopB !== null) {
      const deltaB = loopB - currentTime;
      if (deltaB >= 0 && deltaB <= lookaheadSeconds) {
        const yB = height - (deltaB / lookaheadSeconds) * height;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, yB);
        ctx.lineTo(width, yB);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('LOOP B ⚑', 12, yB - 4);
      }
    }

    // 3. Draw Strike / Hit Line at the bottom
    const strikeY = height - 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, strikeY);
    ctx.lineTo(width, strikeY);
    ctx.stroke();

    // 4. Filter and Draw Falling Note Bars
    const activeCurrentMidis: number[] = [];

    // Filter notes visible within the time window [currentTime - 0.5s, currentTime + lookaheadSeconds]
    const windowStart = currentTime - 0.2;
    const windowEnd = currentTime + lookaheadSeconds;

    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];

      // Hand filtering
      if (selectedHand === 'right' && n.hand !== 'right') continue;
      if (selectedHand === 'left' && n.hand !== 'left') continue;

      const noteEnd = n.time + n.duration;
      if (noteEnd < windowStart) continue;
      if (n.time > windowEnd) break; // notes are sorted by start time

      const key = keyMap.current.get(n.midi);
      if (!key) continue;

      const x = (key.leftPercent / 100) * width + 1;
      const w = Math.max(4, (key.widthPercent / 100) * width - 2);

      // Y coordinates:
      // Note start reaches strike line at delta = 0
      const deltaStart = n.time - currentTime;
      const deltaEnd = noteEnd - currentTime;

      const yBottom = height - (deltaStart / lookaheadSeconds) * height;
      const yTop = height - (deltaEnd / lookaheadSeconds) * height;
      const barHeight = Math.max(6, yBottom - yTop);

      // Check if note is currently crossing the strike line
      const isCurrentlyStriking = currentTime >= n.time && currentTime <= noteEnd;
      if (isCurrentlyStriking) {
        activeCurrentMidis.push(n.midi);
      }

      // Bar Colors
      const isRightHand = n.hand === 'right';
      let fillGradient: CanvasGradient;

      if (isRightHand) {
        fillGradient = ctx.createLinearGradient(x, yTop, x + w, yBottom);
        fillGradient.addColorStop(0, '#38bdf8');
        fillGradient.addColorStop(1, '#0284c7');
      } else {
        fillGradient = ctx.createLinearGradient(x, yTop, x + w, yBottom);
        fillGradient.addColorStop(0, '#c084fc');
        fillGradient.addColorStop(1, '#7e22ce');
      }

      ctx.fillStyle = fillGradient;

      // Draw rounded bar
      const radius = Math.min(4, w / 2, barHeight / 2);
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, yTop, w, barHeight, radius);
      } else {
        ctx.rect(x, yTop, w, barHeight);
      }
      ctx.fill();

      // Border / Highlight
      ctx.strokeStyle = isRightHand ? 'rgba(186, 230, 253, 0.6)' : 'rgba(243, 232, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Top Gloss Line
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(x + 1, yTop + 1, Math.max(1, w - 2), 2);

      // Strike Flare Animation if hitting bottom
      if (isCurrentlyStriking) {
        ctx.save();
        ctx.shadowColor = isRightHand ? '#38bdf8' : '#c084fc';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 1, strikeY - 2, w + 2, 4);
        ctx.restore();
      }

      // Note Pitch Label & Laptop Keycap Shortcut
      if (showNoteNames && barHeight > 14 && w > 12) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const keyHint = keyboardMapping.getPrimaryLabelForMidi(n.midi);
        const text = keyHint && w > 24 ? `${n.note} [${keyHint.label}]` : n.note;
        ctx.fillText(text, x + w / 2, yBottom - 8);
      }
    }

    // Notify parent of notes currently hitting the strike line so keyboard keys illuminate!
    if (onKeyTriggeredFromSong) {
      onKeyTriggeredFromSong(activeCurrentMidis);
    }

    ctx.restore();
  }, [notes, currentTime, lookaheadSeconds, showNoteNames, selectedHand, loopA, loopB, onKeyTriggeredFromSong]);

  useEffect(() => {
    render();
  }, [render]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </div>
  );
};
