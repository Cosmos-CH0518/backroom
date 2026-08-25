/**
 * Procedural Web Audio API sound synthesizer for The Backrooms
 * Zero external audio files required, runs reliably offline & instant playback.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private buzzGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private heartbeatGain: GainNode | null = null;
  private isInitialized = false;
  private lastStepTime = 0;
  private heartbeatInterval: number | null = null;
  private volume = 0.75;
  private isMuted = false;

  public init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupHum();
      this.setupAmbientDrone();
      this.isInitialized = true;
    } catch (e) {
      console.warn('AudioContext initialization failed or blocked:', e);
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
  }

  // Iconic Backrooms 60Hz Fluorescent Hum
  private setupHum() {
    if (!this.ctx || !this.masterGain) return;

    try {
      const humGain = this.ctx.createGain();
      humGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      this.buzzGain = humGain;

      // 60Hz Fundamental
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(60, this.ctx.currentTime);

      // 120Hz 1st Harmonic
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(120, this.ctx.currentTime);

      // 180Hz 2nd Harmonic
      const osc3 = this.ctx.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(180, this.ctx.currentTime);

      // Lowpass filter to muffle the harsh saw
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, this.ctx.currentTime);
      filter.Q.setValueAtTime(4, this.ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      osc3.connect(filter);

      filter.connect(humGain);
      humGain.connect(this.masterGain);

      osc1.start();
      osc2.start();
      osc3.start();
    } catch (e) {
      console.warn('Error setting up hum:', e);
    }
  }

  // Creepy Low Ambient Drone
  private setupAmbientDrone() {
    if (!this.ctx || !this.masterGain) return;

    try {
      const droneGain = this.ctx.createGain();
      droneGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      this.ambientGain = droneGain;

      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(43, this.ctx.currentTime);

      // Subtle LFO for pitch instability
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(3, this.ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      osc.connect(droneGain);
      droneGain.connect(this.masterGain);

      lfo.start();
      osc.start();
    } catch (e) {
      console.warn('Error setting up drone:', e);
    }
  }

  // Modulate buzzing intensity (e.g. near flickering light or during fear)
  public setHumIntensity(intensity: number) {
    if (!this.buzzGain || !this.ctx) return;
    const clamped = Math.max(0.05, Math.min(0.6, intensity));
    this.buzzGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.1);
  }

  // Carpet footstep
  public playFootstep(isSprinting = false, isCrouching = false) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = Date.now();
    const minInterval = isSprinting ? 280 : isCrouching ? 650 : 440;
    if (now - this.lastStepTime < minInterval) return;
    this.lastStepTime = now;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isCrouching ? 160 : 280, t);

      osc.type = 'triangle';
      const baseFreq = (isCrouching ? 55 : isSprinting ? 75 : 65) + (Math.random() * 10 - 5);
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);

      const vol = isCrouching ? 0.06 : isSprinting ? 0.28 : 0.16;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.1);
    } catch (e) {
      console.warn('Footstep error:', e);
    }
  }

  // Flashlight click
  public playFlashlightClick(turnOn: boolean) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(turnOn ? 1800 : 1200, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.02);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.04);
    } catch (e) {
      console.warn('Flashlight click error:', e);
    }
  }

  // Item pickup chime
  public playItemPickup(type: string) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const freqs = type === 'key' ? [523.25, 659.25, 783.99, 1046.5] : [440, 554.37, 659.25];
      
      freqs.forEach((f, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t + idx * 0.06);

        gain.gain.setValueAtTime(0, t + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.18, t + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(t + idx * 0.06);
        osc.stop(t + idx * 0.06 + 0.4);
      });
    } catch (e) {
      console.warn('Pickup sound error:', e);
    }
  }

  // Drinking Almond Water
  public playDrinkWater() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      // Soft glug sound
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260 + i * 40, t + i * 0.12);
        osc.frequency.exponentialRampToValueAtTime(140, t + i * 0.12 + 0.08);

        gain.gain.setValueAtTime(0.15, t + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.09);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t + i * 0.12);
        osc.stop(t + i * 0.12 + 0.1);
      }
    } catch (e) {
      console.warn('Drink water error:', e);
    }
  }

  // Heartbeat pulse (when sanity is low or entity is near)
  public playHeartbeat(urgency = 0.5) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      // Lub-dub
      const playThud = (delay: number, pitch: number, vol: number) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitch, t + delay);
        osc.frequency.exponentialRampToValueAtTime(35, t + delay + 0.09);

        gain.gain.setValueAtTime(vol * (0.2 + urgency * 0.3), t + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.12);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(t + delay);
        osc.stop(t + delay + 0.15);
      };

      playThud(0, 75 + urgency * 20, 0.4);
      playThud(0.12, 60 + urgency * 15, 0.28);
    } catch (e) {
      console.warn('Heartbeat error:', e);
    }
  }

  // Entity Shriek / Detection Glitch
  public playEntityGrowl(intensity = 0.5) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, t);
      filter.Q.setValueAtTime(8, t);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.linearRampToValueAtTime(240, t + 0.2);
      osc.frequency.linearRampToValueAtTime(80, t + 0.6);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.25 * intensity, t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.8);
    } catch (e) {
      console.warn('Entity growl error:', e);
    }
  }

  // Jumpscare / Caught screech
  public playJumpscare() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      // Harsh chaotic dissonance
      [220, 311, 466, 622, 932].forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.linearRampToValueAtTime(freq * 0.7, t + 1.2);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(t);
        osc.stop(t + 1.5);
      });
    } catch (e) {
      console.warn('Jumpscare sound error:', e);
    }
  }
}

export const soundManager = new SoundManager();
