import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { PianoKeyboard } from './components/PianoKeyboard';
import { SoundControls } from './components/SoundControls';
import { SongPractice } from './components/SongPractice';
import { RecordingStudio } from './components/RecordingStudio';
import { BeginnerAcademy } from './components/BeginnerAcademy';
import { KeymapGuide } from './components/KeymapGuide';
import { Footer } from './components/Footer';
import { soundEngine } from './audio/soundEngine';
import { SoundType } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'play' | 'songs' | 'learn' | 'record'>('play');
  const [audioState, setAudioState] = useState<AudioContextState | 'uninitialized'>(soundEngine.getAudioState());
  const [volume, setVolume] = useState<number>(soundEngine.getVolume());
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getIsMuted());
  const [soundType, setSoundType] = useState<SoundType>(soundEngine.getSoundType());
  const [sustain, setSustain] = useState<boolean>(soundEngine.getSustain());
  const [octaveOffset, setOctaveOffset] = useState<number>(0);
  const [isKeymapOpen, setIsKeymapOpen] = useState<boolean>(false);

  // Active target notes for highlighting (from SongPractice or BeginnerAcademy)
  const [targetNotes, setTargetNotes] = useState<string[]>([]);
  const [lastPlayedNote, setLastPlayedNote] = useState<string | null>(null);
  const [lastReleasedNote, setLastReleasedNote] = useState<string | null>(null);

  const pianoSectionRef = useRef<HTMLDivElement>(null);

  // Subscribe to audio state changes
  useEffect(() => {
    const unsubscribe = soundEngine.subscribeStateChange((state) => {
      setAudioState(state);
    });
    return () => unsubscribe();
  }, []);

  const handleVolumeChange = (newVol: number) => {
    soundEngine.setVolume(newVol);
    setVolume(newVol);
    if (isMuted && newVol > 0) {
      soundEngine.toggleMute();
      setIsMuted(false);
    }
  };

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleSoundTypeChange = (type: SoundType) => {
    soundEngine.setSoundType(type);
    setSoundType(type);
  };

  const handleSustainToggle = () => {
    const next = !sustain;
    soundEngine.setSustain(next);
    setSustain(next);
  };

  const handleOctaveChange = (offset: number) => {
    setOctaveOffset(offset);
  };

  const handleNoteTriggered = (note: string) => {
    setLastPlayedNote(note);
    // Reset momentary trigger
    setTimeout(() => {
      setLastPlayedNote(null);
    }, 120);
  };

  const handleNoteReleased = (note: string) => {
    setLastReleasedNote(note);
    setTimeout(() => {
      setLastReleasedNote(null);
    }, 120);
  };

  const scrollToPiano = () => {
    if (pianoSectionRef.current) {
      pianoSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="app-container">
      {/* Top Sticky Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        audioState={audioState}
        onOpenHelp={() => setIsKeymapOpen(true)}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Main Body */}
      <main className="main-content">
        {/* Hero Section (Always shown or on 'play' tab for clean focus) */}
        {activeTab === 'play' && (
          <Hero
            onStartPlaying={scrollToPiano}
            onExploreSongs={() => setActiveTab('songs')}
          />
        )}

        {/* The Piano Keyboard - The core centerpiece of the entire application */}
        <div ref={pianoSectionRef} style={{ marginTop: activeTab === 'play' ? '0.5rem' : '2rem' }}>
          <PianoKeyboard
            octaveOffset={octaveOffset}
            onOctaveChange={handleOctaveChange}
            targetNotes={targetNotes}
            onNoteTriggered={handleNoteTriggered}
            onNoteReleased={handleNoteReleased}
          />
        </div>

        {/* Tab Specific Content */}
        {activeTab === 'play' && (
          <SoundControls
            soundType={soundType}
            onSoundTypeChange={handleSoundTypeChange}
            sustain={sustain}
            onSustainToggle={handleSustainToggle}
            octaveOffset={octaveOffset}
            onOctaveChange={handleOctaveChange}
          />
        )}

        {activeTab === 'songs' && (
          <SongPractice
            octaveOffset={octaveOffset}
            onSetTargetNotes={setTargetNotes}
            lastPlayedNote={lastPlayedNote}
          />
        )}

        {activeTab === 'learn' && (
          <BeginnerAcademy
            octaveOffset={octaveOffset}
            onSetTargetNotes={setTargetNotes}
            lastPlayedNote={lastPlayedNote}
          />
        )}

        {activeTab === 'record' && (
          <RecordingStudio
            lastPlayedNote={lastPlayedNote}
            lastReleasedNote={lastReleasedNote}
            onSetTargetNotes={setTargetNotes}
          />
        )}
      </main>

      {/* Keyboard Shortcuts Modal */}
      <KeymapGuide
        octaveOffset={octaveOffset}
        isOpen={isKeymapOpen}
        onClose={() => setIsKeymapOpen(false)}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;
