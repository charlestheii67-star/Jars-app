import { SpeechBlipConfig, VisemeFrame } from '../types';

export class AudioVoiceEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private isSpeaking = false;
  private currentBlipTimeout: any = null;
  private currentViseme: VisemeFrame = {
    jawOpen: 0,
    mouthWide: 0,
    mouthPucker: 0,
    chinDrop: 0,
    eyebrowArch: 0,
    eyeBlinkLeft: 0,
    eyeBlinkRight: 0,
    headNod: 0,
    headTilt: 0,
  };
  private blinkTimer = 0;
  private nextBlinkInterval = 3.5;
  private isBlinking = false;
  private onVisemeUpdate?: (viseme: VisemeFrame) => void;

  constructor() {}

  public initAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.6;
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setVisemeCallback(cb: (viseme: VisemeFrame) => void) {
    this.onVisemeUpdate = cb;
  }

  /**
   * Decodes an uploaded audio file into an AudioBuffer for custom speech blips
   */
  public async loadAudioFileAsBuffer(file: File): Promise<AudioBuffer> {
    const audioCtx = this.initAudioContext();
    const arrayBuffer = await file.arrayBuffer();
    return await audioCtx.decodeAudioData(arrayBuffer);
  }

  /**
   * Updates real-time visemes from live audio frequency analysis
   */
  public update(delta: number): VisemeFrame {
    // Natural eye blink calculation
    this.blinkTimer += delta;
    if (this.blinkTimer > this.nextBlinkInterval) {
      this.isBlinking = true;
      if (this.blinkTimer > this.nextBlinkInterval + 0.15) {
        this.isBlinking = false;
        this.blinkTimer = 0;
        this.nextBlinkInterval = 2.5 + Math.random() * 4.0;
      }
    }

    const blinkAmount = this.isBlinking ? 1.0 : 0.0;
    this.currentViseme.eyeBlinkLeft = blinkAmount;
    this.currentViseme.eyeBlinkRight = blinkAmount;

    // Analyze live audio frequencies if blip speech is active
    if (this.isSpeaking && this.analyser && this.dataArray) {
      this.analyser.getByteFrequencyData(this.dataArray as any);

      // Low frequencies (vowels: AA, OH, AH) -> Jaw Open
      let lowEnergy = 0;
      for (let i = 2; i < 20; i++) {
        lowEnergy += this.dataArray[i];
      }
      lowEnergy /= 18 * 255;

      // Mid frequencies (vowels: EE, EH) -> Mouth Wide
      let midEnergy = 0;
      for (let i = 20; i < 60; i++) {
        midEnergy += this.dataArray[i];
      }
      midEnergy /= 40 * 255;

      // High frequencies (clicks, sibilants) -> Mouth Pucker
      let highEnergy = 0;
      for (let i = 60; i < 140; i++) {
        highEnergy += this.dataArray[i];
      }
      highEnergy /= 80 * 255;

      // Smooth interpolation for natural lip bounce on blips
      const targetJaw = Math.min(1.0, lowEnergy * 2.2 + highEnergy * 0.8);
      const targetWide = Math.min(1.0, midEnergy * 1.8);
      const targetPucker = Math.min(1.0, highEnergy * 1.5);

      this.currentViseme.jawOpen += (targetJaw - this.currentViseme.jawOpen) * 0.55;
      this.currentViseme.mouthWide += (targetWide - this.currentViseme.mouthWide) * 0.55;
      this.currentViseme.mouthPucker += (targetPucker - this.currentViseme.mouthPucker) * 0.55;
      this.currentViseme.chinDrop = this.currentViseme.jawOpen * 0.9;

      this.currentViseme.headNod = Math.sin(Date.now() * 0.012) * (this.currentViseme.jawOpen * 0.12);
      this.currentViseme.headTilt = Math.cos(Date.now() * 0.009) * (this.currentViseme.mouthWide * 0.08);
      this.currentViseme.eyebrowArch = (lowEnergy + highEnergy) * 0.6;
    } else {
      // Decay back to resting mouth
      this.currentViseme.jawOpen *= 0.65;
      this.currentViseme.mouthWide *= 0.65;
      this.currentViseme.mouthPucker *= 0.65;
      this.currentViseme.chinDrop *= 0.65;
      this.currentViseme.headNod *= 0.75;
      this.currentViseme.headTilt *= 0.75;
      this.currentViseme.eyebrowArch *= 0.75;
    }

    if (this.onVisemeUpdate) {
      this.onVisemeUpdate(this.currentViseme);
    }

    return this.currentViseme;
  }

  /**
   * Plays character dialogue using sound effect speech blips or uploaded user audio files with live caption sync
   */
  public speakWithBlips(
    text: string,
    config: SpeechBlipConfig,
    onEnd?: () => void,
    onProgress?: (visibleText: string) => void
  ): void {
    if (!text || text.trim().length === 0) {
      if (onEnd) onEnd();
      return;
    }

    this.stopSpeaking();
    const audioCtx = this.initAudioContext();
    this.isSpeaking = true;

    // Filter characters into blippable tokens
    const tokens = text.trim().split('');
    let index = 0;
    const baseSpeed = Math.max(35, Math.min(180, config.speedMs || 75));

    const playNextBlip = () => {
      if (!this.isSpeaking || index >= tokens.length) {
        this.isSpeaking = false;
        if (onProgress) onProgress(text);
        if (onEnd) onEnd();
        return;
      }

      const char = tokens[index];
      index++;

      if (onProgress) {
        onProgress(tokens.slice(0, index).join(''));
      }

      // Pause briefly on spaces and punctuation for natural conversational cadence
      if (char === ' ') {
        this.currentBlipTimeout = setTimeout(playNextBlip, baseSpeed * 0.7);
        return;
      } else if (char === ',' || char === ';') {
        this.currentBlipTimeout = setTimeout(playNextBlip, baseSpeed * 2.2);
        return;
      } else if (char === '.' || char === '!' || char === '?') {
        this.currentBlipTimeout = setTimeout(playNextBlip, baseSpeed * 3.5);
        return;
      }

      // Calculate pitch jitter for expressive speech variation
      const jitter = (Math.random() - 0.5) * 2 * (config.pitchVariation ?? 0.25);
      const effectivePitch = Math.max(0.15, (config.pitch || 1.0) * (1 + jitter * 0.35));

      // 1. If custom audio buffer is uploaded, play a slice of the custom sound effect
      if (config.soundType === 'custom_sound' && config.customAudioBuffer) {
        this.playCustomSoundSlice(audioCtx, config.customAudioBuffer, effectivePitch, config.volume ?? 0.85);
      } else {
        // 2. Play procedural sound effect blip based on character sound type
        this.playProceduralBlip(audioCtx, config.soundType, effectivePitch, config.volume ?? 0.85);
      }

      this.currentBlipTimeout = setTimeout(playNextBlip, baseSpeed);
    };

    playNextBlip();
  }

  // Compatibility wrapper
  public speak(text: string, voiceProfile: any, onEnd?: () => void, onProgress?: (visibleText: string) => void): void {
    const config: SpeechBlipConfig = {
      soundType: voiceProfile?.soundType || 'slasher_grunt',
      pitch: voiceProfile?.pitch || 1.0,
      speedMs: 75,
      pitchVariation: 0.3,
      customAudioBuffer: voiceProfile?.customAudioBuffer || null,
      volume: 0.85,
    };
    this.speakWithBlips(text, config, onEnd, onProgress);
  }

  /**
   * Plays a pitch-modulated snippet of the user-uploaded sound effect
   */
  private playCustomSoundSlice(ctx: AudioContext, buffer: AudioBuffer, pitch: number, vol: number) {
    const now = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.setValueAtTime(pitch, now);

    const gainNode = ctx.createGain();
    const blipDuration = 0.08;
    gainNode.gain.setValueAtTime(vol, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + blipDuration);

    source.connect(gainNode);
    if (this.analyser) {
      gainNode.connect(this.analyser);
    }
    gainNode.connect(ctx.destination);

    // Randomize start offset slightly for natural speech texture
    const maxOffset = Math.max(0, buffer.duration - blipDuration);
    const startOffset = Math.random() * Math.min(0.3, maxOffset);

    source.start(now, startOffset, blipDuration);
  }

  /**
   * Generates procedural character speech blips
   */
  private playProceduralBlip(ctx: AudioContext, type: string, pitch: number, vol: number) {
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(vol * 0.7, now);

    if (this.analyser) {
      masterGain.connect(this.analyser);
    }
    masterGain.connect(ctx.destination);

    switch (type) {
      case 'slasher_grunt': {
        // Jason Slasher: Deep guttural throat click & raspy sub-rumble
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const blipGain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(55 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(35 * pitch, now + 0.08);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(280 * pitch, now);

        blipGain.gain.setValueAtTime(0.9, now);
        blipGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        // Add raspy noise click
        const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
        const noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = noiseBuf;

        osc.connect(filter);
        filter.connect(blipGain);
        blipGain.connect(masterGain);
        noiseSrc.connect(masterGain);

        osc.start(now);
        noiseSrc.start(now);
        osc.stop(now + 0.08);
        break;
      }

      case 'retro_8bit': {
        // 8-Bit Retro RPG dialogue blip (Undertale / Earthbound style)
        const osc = ctx.createOscillator();
        const blipGain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(320 * pitch, now);
        osc.frequency.setValueAtTime(440 * pitch, now + 0.02);

        blipGain.gain.setValueAtTime(0.4, now);
        blipGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(blipGain);
        blipGain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.06);
        break;
      }

      case 'cyber_holo': {
        // Cyberpunk synthetic chirp with frequency modulation
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const blipGain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(300 * pitch, now + 0.06);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200 * pitch, now);
        filter.Q.setValueAtTime(4, now);

        blipGain.gain.setValueAtTime(0.6, now);
        blipGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(filter);
        filter.connect(blipGain);
        blipGain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.06);
        break;
      }

      case 'animal_speak': {
        // Animal Crossing style rapid vocal warble
        const osc = ctx.createOscillator();
        const blipGain = ctx.createGain();
        osc.type = 'triangle';
        const startFreq = 400 * pitch;
        const endFreq = 650 * pitch;
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.linearRampToValueAtTime(endFreq, now + 0.05);

        blipGain.gain.setValueAtTime(0.7, now);
        blipGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(blipGain);
        blipGain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.06);
        break;
      }

      case 'crystal_whisper': {
        // Ethereal resonant vocal whisper / rune chime
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const blipGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(520 * pitch, now);

        filter.type = 'peaking';
        filter.frequency.setValueAtTime(900 * pitch, now);
        filter.gain.setValueAtTime(12, now);

        blipGain.gain.setValueAtTime(0.5, now);
        blipGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(filter);
        filter.connect(blipGain);
        blipGain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.09);
        break;
      }

      case 'mech_relay':
      default: {
        // Titan Mech pneumatic relay click
        const osc = ctx.createOscillator();
        const blipGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(60 * pitch, now + 0.04);

        blipGain.gain.setValueAtTime(0.8, now);
        blipGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(blipGain);
        blipGain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }
    }
  }

  public stopSpeaking(): void {
    this.isSpeaking = false;
    if (this.currentBlipTimeout) {
      clearTimeout(this.currentBlipTimeout);
      this.currentBlipTimeout = null;
    }
  }

  /**
   * Procedural Sound Effects Synthesizer for movie cinematic moments & TikTok gifts
   */
  public playSoundEffect(type: 'metalSlash' | 'subBassBoom' | 'synthDrone' | 'thunder' | 'giftSparkle' | 'kiKiMaMa'): void {
    const audioCtx = this.initAudioContext();
    const now = audioCtx.currentTime;

    switch (type) {
      case 'metalSlash': {
        const bufferSize = audioCtx.sampleRate * 0.5;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.12));
        }

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        const hp = audioCtx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(3200, now);
        hp.frequency.exponentialRampToValueAtTime(1200, now + 0.3);

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

        noise.connect(hp);
        hp.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start(now);

        const subOsc = audioCtx.createOscillator();
        const subGain = audioCtx.createGain();
        subOsc.frequency.setValueAtTime(110, now);
        subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.35);
        subGain.gain.setValueAtTime(0.7, now);
        subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        subOsc.connect(subGain);
        subGain.connect(audioCtx.destination);
        subOsc.start(now);
        subOsc.stop(now + 0.4);
        break;
      }

      case 'subBassBoom': {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.8);
        gain.gain.setValueAtTime(0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 1.2);
        break;
      }

      case 'synthDrone': {
        [110, 164.8, 220].forEach((freq) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          const filter = audioCtx.createBiquadFilter();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now);
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(600, now);
          filter.frequency.exponentialRampToValueAtTime(200, now + 2.0);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now);
          osc.stop(now + 2.2);
        });
        break;
      }

      case 'thunder': {
        const bufferSize = audioCtx.sampleRate * 1.5;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.4));
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const lp = audioCtx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(380, now);
        lp.frequency.linearRampToValueAtTime(80, now + 1.4);
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.85, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
        noise.connect(lp);
        lp.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start(now);
        break;
      }

      case 'giftSparkle': {
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
        notes.forEach((freq, idx) => {
          const t = now + idx * 0.08;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.4, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(t);
          osc.stop(t + 0.35);
        });
        break;
      }

      case 'kiKiMaMa': {
        const timings = [0, 0.12, 0.24, 0.45, 0.57, 0.69];
        timings.forEach((tOffset, i) => {
          const t = now + tOffset;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          const filter = audioCtx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(i < 3 ? 2400 : 900, t);
          filter.Q.setValueAtTime(6, t);
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(i < 3 ? 320 : 180, t);
          gain.gain.setValueAtTime(0.2, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(t);
          osc.stop(t + 0.09);
        });
        break;
      }
    }
  }
}

export const globalAudioVoiceEngine = new AudioVoiceEngine();
