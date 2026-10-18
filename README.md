<<<<<<< HEAD
# KeyMuse — Virtual Laptop Piano & Music Learning Web Application

> **"Your laptop. Your music. Your possibilities."**  
> A free, responsive, modern virtual musical instrument designed for aspiring musicians who want to learn piano and play songs using their everyday laptop keyboard without needing to buy expensive physical equipment.

---

## 🌟 Features Overview

### 1. 🎹 Interactive Virtual Piano
- **Realistic 3D Keyboard**: 3 visible octaves (Octaves 3, 4, 5, and C6) with realistic ivory key bevels, authentic black key offsets, and depth-displacement animations.
- **Laptop Keyboard Mapping**:
  - **White Keys (Home Row)**: `A` (C4), `S` (D4), `D` (E4), `F` (F4), `G` (G4), `H` (A4), `J` (B4), `K` (C5), `L` (D5), `;` (E5).
  - **Black Keys (Top Row)**: `W` (C#4), `E` (D#4), `T` (F#4), `Y` (G#4), `U` (A#4), `O` (C#5), `P` (D#5).
- **Polyphonic Chords**: Hold multiple keys down at once to play chords and harmonies.
- **Glissando & Multi-touch**: Click and drag your mouse across keys, or glide fingers across touchscreen tablets.
- **Key Repeat Prevention**: Built-in safeguards prevent machine-gunning repeat notes when holding down laptop keys.
- **Typing Safety**: Ignores piano hotkeys whenever focused inside text boxes, inputs, or text areas.

### 2. 🎛️ Real-Time Web Audio Synthesizer Engine
- **Modeled Piano**: Physical additive harmonic synthesis with hammer strike transients, natural key tracking, and organic struck-string decays.
- **Soft Keys**: Electric piano / Rhodes-style FM tone with gentle bell-like overtones.
- **Synth Lead**: Dual-saw detuned chorus polyphonic synthesizer with a 24dB resonant lowpass sweep.
- **Sustain Pedal**: Toggle with `Spacebar` or button to let notes ring out with warm damper resonance.
- **Practice Metronome**: Sample-accurate Web Audio click engine with adjustable tempo (40 to 240 BPM), tap tempo, time signatures (4/4, 3/4, 2/4), and visual beat LEDs.

### 3. 🎵 Interactive Song Practice
- **Included Master Repertoire**:
  1. *Twinkle, Twinkle, Little Star* (Beginner)
  2. *Ode to Joy* — Beethoven (Easy)
  3. *Happy Birthday to You* (Easy)
- **Guided Visual Feedback**:
  - Target piano key lights up in glowing amber.
  - Large prompt showing the exact laptop key to press (e.g. `Press [A] for C4`).
  - Next 5 upcoming notes previewed in a sheet-music timeline ribbon.
  - Real-time progress bar and percentage tracker.
  - "Listen to Audio Demo" button to preview the song at adjustable speeds (0.5x, 0.75x, 1x, 1.25x).
  - Restart Song and Skip Note controls.

### 4. 🎓 Beginner Music Academy
- **5 Progressive Lessons**:
  1. *The Musical Alphabet & Middle C*
  2. *White & Black Keys (Sharps # and Flats ♭)*
  3. *Building Your First Melodies*
  4. *Playing Chords & Harmony (C Major, F Major, G Major, A Minor triads)*
  5. *Rhythm, Tempo, and Metronome Timing*
- **Interactive Checkpoints**: The academy validates your playing on the virtual keyboard to advance through exercises.
- **Chord Audition**: One-click preview of full chords to train your musical ear.

### 5. 🎙️ Recording Studio
- **Millisecond Precision**: Records note pitch, press onset, and release duration.
- **Faithful Replay Engine**: Plays back recorded performances with realistic phrasing and sustained durations.
- **Local Persistence**: Automatically saves tracks into browser `localStorage`.
- **JSON Export**: Download your performances directly to your computer as `.json` files.

---

## ⚙️ How to Change the Application Name

The application name is centralized for effortless customization:
1. Open [`src/config/constants.ts`](file:///f:/jacob/src/config/constants.ts).
2. Edit the `APP_NAME` and `APP_TAGLINE` constants:
   ```ts
   export const APP_NAME = 'YourNewBrandName';
   export const APP_TAGLINE = 'Your laptop. Your music. Your possibilities.';
   ```
3. Update `<title>` in [`index.html`](file:///f:/jacob/index.html) if desired.

---

## 🚀 Running the Project

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run TypeScript type check
npx tsc --noEmit

# Build production bundle
npm run build
```
=======
# keymuse-virtual-piano
>>>>>>> 07d22024581a286e42f44816f0147b964a2c5110
