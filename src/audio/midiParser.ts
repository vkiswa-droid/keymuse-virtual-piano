/**
 * Zero-Dependency Standard MIDI File (SMF) Parser
 * Reads Format 0 and Format 1 MIDI files (.mid / .midi)
 * Extracts tracks, tempo changes, time signatures, and exact timed note events with durations and hand assignment.
 */

import { midiToNoteName } from '../config/piano88';

export interface ParsedMidiNote {
  midi: number;
  note: string;
  time: number;       // Start time in seconds
  duration: number;   // Duration in seconds
  velocity: number;   // 0.0 to 1.0
  track: number;      // 0-indexed track number
  hand: 'left' | 'right'; // Left hand (bass) or Right hand (treble)
}

export interface ParsedMidiTrack {
  id: number;
  name: string;
  noteCount: number;
  notes: ParsedMidiNote[];
}

export interface ParsedMidiSong {
  title: string;
  format: number;
  ppq: number;
  duration: number; // Total song length in seconds
  initialBpm: number;
  tracks: ParsedMidiTrack[];
  allNotes: ParsedMidiNote[]; // Sorted chronologically
}

export class MidiParser {
  /**
   * Parse an ArrayBuffer containing raw MIDI file data
   */
  public static parse(buffer: ArrayBuffer, fileName: string = 'Imported Song'): ParsedMidiSong {
    const data = new DataView(buffer);
    let offset = 0;

    // Check Header chunk "MThd"
    const headerId = this.readString(data, offset, 4);
    offset += 4;
    if (headerId !== 'MThd') {
      throw new Error('Invalid MIDI file: Missing MThd header');
    }

    const headerLength = data.getUint32(offset, false);
    offset += 4;
    const format = data.getUint16(offset, false);
    offset += 2;
    const trackCount = data.getUint16(offset, false);
    offset += 2;
    const timeDivision = data.getUint16(offset, false);
    offset += 2;

    // Time division: ticks per quarter note (PPQ)
    const ppq = (timeDivision & 0x8000) === 0 ? timeDivision : 480;

    // Skip any extra header bytes
    if (headerLength > 6) {
      offset += headerLength - 6;
    }

    // Default tempo: 120 BPM = 500,000 microseconds per quarter note
    let defaultMicrosecondsPerQuarter = 500000;
    let songTitle = fileName.replace(/\.[^/.]+$/, '');

    // Tempo events across tracks for global time mapping: { tick: number, tempo: number, time: number }
    const tempoMap: Array<{ tick: number; tempo: number; time: number }> = [
      { tick: 0, tempo: defaultMicrosecondsPerQuarter, time: 0 },
    ];

    interface RawNoteEvent {
      midi: number;
      startTick: number;
      durationTicks?: number;
      velocity: number;
      track: number;
      time?: number;
      duration?: number;
    }

    const tracksData: Array<{ name: string; notes: RawNoteEvent[] }> = [];

    // Parse Track Chunks "MTrk"
    for (let t = 0; t < trackCount && offset < data.byteLength; t++) {
      if (offset + 8 > data.byteLength) break;

      const chunkId = this.readString(data, offset, 4);
      offset += 4;
      const chunkLength = data.getUint32(offset, false);
      offset += 4;

      if (chunkId !== 'MTrk') {
        offset += chunkLength;
        continue;
      }

      const trackEnd = offset + chunkLength;
      let currentTick = 0;
      let runningStatus = 0;
      let trackName = `Track ${t + 1}`;
      const openNotes: Map<number, RawNoteEvent> = new Map();
      const trackNotes: RawNoteEvent[] = [];

      while (offset < trackEnd && offset < data.byteLength) {
        // Delta time (VLQ)
        const vlqDelta = this.readVarLength(data, offset);
        offset += vlqDelta.byteLength;
        currentTick += vlqDelta.value;

        if (offset >= data.byteLength) break;

        let statusByte = data.getUint8(offset);

        if (statusByte >= 0x80) {
          offset++;
          runningStatus = statusByte;
        } else {
          statusByte = runningStatus;
        }

        const messageType = statusByte & 0xF0;

        if (statusByte === 0xFF) {
          // Meta Event
          const metaType = data.getUint8(offset);
          offset++;
          const metaLength = this.readVarLength(data, offset);
          offset += metaLength.byteLength;
          const metaOffset = offset;
          offset += metaLength.value;

          if (metaType === 0x03) {
            // Track / Sequence Name
            trackName = this.readString(data, metaOffset, metaLength.value);
            if (t === 0 && !songTitle) {
              songTitle = trackName;
            }
          } else if (metaType === 0x51 && metaLength.value === 3) {
            // Set Tempo
            const tempo = (data.getUint8(metaOffset) << 16) | (data.getUint8(metaOffset + 1) << 8) | data.getUint8(metaOffset + 2);
            tempoMap.push({ tick: currentTick, tempo, time: 0 });
          }
        } else if (statusByte === 0xF0 || statusByte === 0xF7) {
          // SysEx event
          const sysexLen = this.readVarLength(data, offset);
          offset += sysexLen.byteLength + sysexLen.value;
        } else if (messageType === 0x90) {
          // Note On
          const noteNumber = data.getUint8(offset);
          const velocity = data.getUint8(offset + 1);
          offset += 2;

          if (velocity > 0) {
            // If already open, close previous
            if (openNotes.has(noteNumber)) {
              const prev = openNotes.get(noteNumber)!;
              prev.durationTicks = Math.max(1, currentTick - prev.startTick);
              trackNotes.push(prev);
            }
            openNotes.set(noteNumber, {
              midi: noteNumber,
              startTick: currentTick,
              velocity: velocity / 127,
              track: t,
            });
          } else {
            // Velocity 0 = Note Off
            if (openNotes.has(noteNumber)) {
              const noteObj = openNotes.get(noteNumber)!;
              noteObj.durationTicks = Math.max(1, currentTick - noteObj.startTick);
              trackNotes.push(noteObj);
              openNotes.delete(noteNumber);
            }
          }
        } else if (messageType === 0x80) {
          // Note Off
          const noteNumber = data.getUint8(offset);
          offset += 2; // skip note & velocity

          if (openNotes.has(noteNumber)) {
            const noteObj = openNotes.get(noteNumber)!;
            noteObj.durationTicks = Math.max(1, currentTick - noteObj.startTick);
            trackNotes.push(noteObj);
            openNotes.delete(noteNumber);
          }
        } else if (messageType === 0xC0 || messageType === 0xD0) {
          offset += 1; // Program change or channel pressure
        } else if (messageType === 0xA0 || messageType === 0xB0 || messageType === 0xE0) {
          offset += 2; // Aftertouch, Control Change, Pitch Wheel
        }
      }

      // Close remaining open notes
      openNotes.forEach(noteObj => {
        noteObj.durationTicks = Math.max(1, ppq);
        trackNotes.push(noteObj);
      });

      tracksData.push({ name: trackName, notes: trackNotes });
    }

    // Sort tempo events and compute cumulative real time
    tempoMap.sort((a, b) => a.tick - b.tick);
    let prevTick = 0;
    let prevTime = 0;
    let currentTempo = defaultMicrosecondsPerQuarter;

    for (let i = 0; i < tempoMap.length; i++) {
      const deltaTicks = tempoMap[i].tick - prevTick;
      const deltaTime = (deltaTicks * currentTempo) / (ppq * 1000000);
      tempoMap[i].time = prevTime + deltaTime;
      prevTick = tempoMap[i].tick;
      prevTime = tempoMap[i].time;
      currentTempo = tempoMap[i].tempo;
    }

    // Function to convert tick to seconds
    const tickToSeconds = (targetTick: number): number => {
      let segmentIndex = 0;
      for (let i = 0; i < tempoMap.length; i++) {
        if (tempoMap[i].tick <= targetTick) {
          segmentIndex = i;
        } else {
          break;
        }
      }
      const segment = tempoMap[segmentIndex];
      const deltaTicks = targetTick - segment.tick;
      const secondsPerTick = segment.tempo / (ppq * 1000000);
      return segment.time + (deltaTicks * secondsPerTick);
    };

    // Calculate real seconds and hand assignment
    const allParsedNotes: ParsedMidiNote[] = [];
    const parsedTracks: ParsedMidiTrack[] = [];
    let maxEndTime = 0;

    tracksData.forEach((td, trackIdx) => {
      const trackNotesList: ParsedMidiNote[] = [];

      td.notes.forEach(rn => {
        const startTime = tickToSeconds(rn.startTick);
        const endTime = tickToSeconds(rn.startTick + (rn.durationTicks || ppq));
        const duration = Math.max(0.08, endTime - startTime);

        if (startTime + duration > maxEndTime) {
          maxEndTime = startTime + duration;
        }

        // Hand detection:
        // If trackIdx is 1 (often Bass in standard 2-track MIDI piano), treat as Left Hand.
        // Otherwise, split around Middle C (MIDI 60).
        let hand: 'left' | 'right' = 'right';
        if (tracksData.length >= 2) {
          hand = trackIdx === 0 ? 'right' : 'left';
        } else {
          hand = rn.midi < 60 ? 'left' : 'right';
        }

        const noteItem: ParsedMidiNote = {
          midi: rn.midi,
          note: midiToNoteName(rn.midi),
          time: parseFloat(startTime.toFixed(4)),
          duration: parseFloat(duration.toFixed(4)),
          velocity: parseFloat(rn.velocity.toFixed(3)),
          track: trackIdx,
          hand,
        };

        trackNotesList.push(noteItem);
        allParsedNotes.push(noteItem);
      });

      trackNotesList.sort((a, b) => a.time - b.time);

      parsedTracks.push({
        id: trackIdx,
        name: td.name,
        noteCount: trackNotesList.length,
        notes: trackNotesList,
      });
    });

    allParsedNotes.sort((a, b) => a.time - b.time);

    const initialBpm = Math.round(60000000 / (tempoMap[0]?.tempo || defaultMicrosecondsPerQuarter));

    return {
      title: songTitle || 'Imported Performance',
      format,
      ppq,
      duration: Math.max(1, parseFloat(maxEndTime.toFixed(2))),
      initialBpm,
      tracks: parsedTracks,
      allNotes: allParsedNotes,
    };
  }

  private static readString(data: DataView, offset: number, length: number): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      if (offset + i < data.byteLength) {
        result += String.fromCharCode(data.getUint8(offset + i));
      }
    }
    return result;
  }

  private static readVarLength(data: DataView, offset: number): { value: number; byteLength: number } {
    let value = 0;
    let byteLength = 0;
    let b = 0;

    do {
      if (offset + byteLength >= data.byteLength) break;
      b = data.getUint8(offset + byteLength);
      value = (value << 7) | (b & 0x7F);
      byteLength++;
    } while ((b & 0x80) !== 0 && byteLength < 5);

    return { value, byteLength };
  }
}
