import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Piano88 } from './components/Piano88';
import { SoundControls } from './components/SoundControls';
import { PracticeView } from './components/PracticeView';
import { BeginnerAcademy } from './components/BeginnerAcademy';
import { RecordingStudio } from './components/RecordingStudio';
import { KeyboardMappingModal } from './components/KeyboardMappingModal';
import { Footer } from './components/Footer';
import { sampleEngine } from './audio/sampleEngine';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'play' | 'practice' | 'learn' | 'studio'>('practice');
  const [volume, setVolume] = useState<number>(sampleEngine.getVolume());
  const [isMuted, setIsMuted] = useState<boolean>(sampleEngine.getIsMuted());
  const [sustain, setSustain] = useState<boolean>(sampleEngine.getSustain());
  const [octaveOffset, setOctaveOffset] = useState<number>(0);
  const [isKeymapOpen, setIsKeymapOpen] = useState<boolean>(false);

  const pianoSectionRef = React.useRef<HTMLDivElement>(null);

  const handleVolumeChange = (newVol: number) => {
    sampleEngine.setVolume(newVol);
    setVolume(newVol);
    if (isMuted && newVol > 0) {
      sampleEngine.toggleMute();
      setIsMuted(false);
    }
  };

  const handleToggleMute = () => {
    const muted = sampleEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleSustainToggle = () => {
    const next = !sustain;
    sampleEngine.setSustain(next);
    setSustain(next);
  };

  const handleOctaveChange = (offset: number) => {
    setOctaveOffset(offset);
  };

  const scrollToPiano = () => {
    if (pianoSectionRef.current) {
      pianoSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: '#090a0f',
      color: '#f8fafc',
    }}>
      {/* Top DAW-Style Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenHelp={() => setIsKeymapOpen(true)}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Main Workspace Area */}
      <main style={{
        flex: 1,
        maxWidth: 1400,
        width: '100%',
        margin: '0 auto',
        padding: '0 16px 32px',
      }}>
        {/* Play Tab: Free Play Piano & Hero */}
        {activeTab === 'play' && (
          <div>
            <Hero
              onStartPlaying={scrollToPiano}
              onExploreSongs={() => setActiveTab('practice')}
            />

            <div ref={pianoSectionRef} style={{ marginTop: '16px' }}>
              <Piano88
                octaveOffset={octaveOffset}
                onOctaveChange={handleOctaveChange}
                sustain={sustain}
              />
            </div>

            <SoundControls
              sustain={sustain}
              onSustainToggle={handleSustainToggle}
              octaveOffset={octaveOffset}
              onOctaveChange={handleOctaveChange}
            />
          </div>
        )}

        {/* Practice Tab: Flagship Falling-Note Visualizer */}
        {activeTab === 'practice' && (
          <div style={{ marginTop: '16px' }}>
            <PracticeView
              octaveOffset={octaveOffset}
              onOctaveChange={handleOctaveChange}
            />
          </div>
        )}

        {/* Learn Tab: Beginner Academy */}
        {activeTab === 'learn' && (
          <BeginnerAcademy
            octaveOffset={octaveOffset}
            onOctaveChange={handleOctaveChange}
          />
        )}

        {/* Studio Tab: Recording & MIDI Utility */}
        {activeTab === 'studio' && (
          <RecordingStudio
            octaveOffset={octaveOffset}
            onOctaveChange={handleOctaveChange}
          />
        )}
      </main>

      {/* Full Laptop Keyboard Mapping Setup Modal */}
      <KeyboardMappingModal
        isOpen={isKeymapOpen}
        onClose={() => setIsKeymapOpen(false)}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;
