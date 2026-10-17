/**
 * WanderMemories - Web Audio Sound Engine
 * Synthesizes sound effects (camera shutter, stamp thud, favorite chime)
 * and ambient relaxing travel soundscape using Web Audio API (100% offline & zero asset dependencies)
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.ambientPlaying = false;
    this.ambientInterval = null;
    this.ambientGain = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Camera Shutter Snap
  playShutter() {
    if (this.muted) return;
    try {
      this.init();
      const now = this.ctx.currentTime;

      // Click 1 (Mirror flip)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(800, now);
      osc1.frequency.exponentialRampToValueAtTime(120, now + 0.04);

      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.045);

      // Click 2 (Curtain snap)
      const bufferSize = this.ctx.sampleRate * 0.06;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now + 0.04);
      filter.Q.setValueAtTime(3, now + 0.04);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.setValueAtTime(0.35, now + 0.04);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start(now + 0.04);
      noise.stop(now + 0.1);
    } catch (e) {
      console.warn('Audio shutter error', e);
    }
  }

  // Passport Stamp Thud
  playStamp() {
    if (this.muted) return;
    try {
      this.init();
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {
      console.warn('Audio stamp error', e);
    }
  }

  // Sparkling Favorite Chime
  playChime() {
    if (this.muted) return;
    try {
      this.init();
      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio

      freqs.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);

        gain.gain.setValueAtTime(0.2, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.35);
      });
    } catch (e) {
      console.warn('Audio chime error', e);
    }
  }

  // Ambient Relaxing Travel Soundscape (Warm Rhodes-like Dream Chords)
  toggleAmbient() {
    if (this.ambientPlaying) {
      this.stopAmbient();
      return false;
    } else {
      this.startAmbient();
      return true;
    }
  }

  startAmbient() {
    try {
      this.init();
      this.ambientPlaying = true;
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      this.ambientGain.connect(this.ctx.destination);

      // Dreamy chords progression: Dmaj9 -> Bm7 -> Gmaj7 -> A6
      const chordProgressions = [
        [293.66, 369.99, 440.00, 554.37], // Dmaj7
        [246.94, 293.66, 369.99, 440.00], // Bm7
        [196.00, 246.94, 293.66, 369.99], // Gmaj7
        [220.00, 277.18, 329.63, 440.00]  // A
      ];
      let chordIndex = 0;

      const playChord = () => {
        if (!this.ambientPlaying) return;
        const now = this.ctx.currentTime;
        const chord = chordProgressions[chordIndex];
        chordIndex = (chordIndex + 1) % chordProgressions.length;

        chord.forEach((freq, noteIdx) => {
          const osc = this.ctx.createOscillator();
          const noteGain = this.ctx.createGain();

          osc.type = noteIdx % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, now + noteIdx * 0.3);

          noteGain.gain.setValueAtTime(0.001, now + noteIdx * 0.3);
          noteGain.gain.linearRampToValueAtTime(0.06, now + noteIdx * 0.3 + 0.8);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, now + noteIdx * 0.3 + 3.8);

          osc.connect(noteGain);
          noteGain.connect(this.ambientGain);

          osc.start(now + noteIdx * 0.3);
          osc.stop(now + noteIdx * 0.3 + 4.0);
        });
      };

      playChord();
      this.ambientInterval = setInterval(playChord, 3800);
    } catch (e) {
      console.warn('Ambient sound error', e);
    }
  }

  stopAmbient() {
    this.ambientPlaying = false;
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
    if (this.ambientGain && this.ctx) {
      try {
        this.ambientGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      } catch (e) {}
    }
  }
}

window.soundEngine = new SoundEngine();
