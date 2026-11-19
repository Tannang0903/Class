// Web Audio API Synthesizer for UFO Classroom Game

class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private ufoOsc1: OscillatorNode | null = null;
  private ufoGain: GainNode | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (!val) {
      this.stopUfoHum();
    }
  }

  // UFO Hover continuous sci-fi sound
  public startUfoHum() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx || this.ufoOsc1) return;

      const osc = this.ctx.createOscillator();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      const masterGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(85, this.ctx.currentTime);

      // Low frequency modulation (LFO) for throbbing UFO engine
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(4.5, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(15, this.ctx.currentTime);
      lfo.connect(osc.frequency);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420, this.ctx.currentTime);

      masterGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.08, this.ctx.currentTime + 0.4);

      osc.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(this.ctx.destination);

      osc.start();
      lfo.start();

      this.ufoOsc1 = osc;
      this.ufoGain = masterGain;
    } catch {
      // AudioContext policy fallback
    }
  }

  public stopUfoHum() {
    try {
      if (this.ufoGain && this.ctx) {
        this.ufoGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.3);
      }
      setTimeout(() => {
        if (this.ufoOsc1) {
          try {
            this.ufoOsc1.stop();
            this.ufoOsc1.disconnect();
          } catch {}
          this.ufoOsc1 = null;
        }
      }, 350);
    } catch {
      this.ufoOsc1 = null;
    }
  }

  // Beam activation sound
  public playTractorBeam() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.8);
      osc.frequency.exponentialRampToValueAtTime(350, now + 1.4);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.5);
    } catch {}
  }

  // Funny comical squeak / exclamation sound
  public playStudentScream() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Two-tone rising cartoon "wah-wah" or startled pip
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.35);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch {}
  }

  // Abduction suction chime
  public playAbductionWarp() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const notes = [440, 554, 659, 880, 1108];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.08, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } catch {}
  }

  // Fanfare victory jingle when mission is completed
  public playVictoryFanfare() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Chords: C5 -> E5 -> G5 -> C6
      const melody = [
        { f: 523.25, time: 0.0, dur: 0.15 },
        { f: 523.25, time: 0.15, dur: 0.15 },
        { f: 523.25, time: 0.3, dur: 0.15 },
        { f: 659.25, time: 0.5, dur: 0.3 },
        { f: 783.99, time: 0.85, dur: 0.4 },
        { f: 1046.5, time: 1.3, dur: 0.9 },
      ];

      melody.forEach(item => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(item.f, now + item.time);

        gain.gain.setValueAtTime(0.12, now + item.time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + item.time + item.dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + item.time);
        osc.stop(now + item.time + item.dur + 0.1);
      });
    } catch {}
  }

  // Button click
  public playClick() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }
}

export const soundManager = new SoundManager();
