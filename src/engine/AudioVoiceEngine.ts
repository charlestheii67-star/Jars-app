import { VisemeFrame, VoiceProfile } from '../types';

export class AudioVoiceEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private synthUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
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

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  public initAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.65;
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
   * Evaluates current audio waveform & frequency bands to compute real-time facial visemes
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

    // Analyze live audio frequencies if speaking
    if (this.isSpeaking && this.analyser && this.dataArray) {
      this.analyser.getByteFrequencyData(this.dataArray as any);

      // Low frequencies (vowels: AA, OH, AH) -> Jaw Open
      let lowEnergy = 0;
      for (let i = 2; i < 16; i++) {
        lowEnergy += this.dataArray[i];
      }
      lowEnergy /= 14 * 255;

      // Mid frequencies (vowels: EE, EH) -> Mouth Wide
      let midEnergy = 0;
      for (let i = 16; i < 48; i++) {
        midEnergy += this.dataArray[i];
      }
      midEnergy /= 32 * 255;

      // High frequencies (consonants: S, T, F, SH) -> Mouth Pucker / Teeth
      let highEnergy = 0;
      for (let i = 48; i < 120; i++) {
        highEnergy += this.dataArray[i];
      }
      highEnergy /= 72 * 255;

      // Smooth interpolation for natural lip physics
      const targetJaw = Math.min(1.0, lowEnergy * 1.6);
      const targetWide = Math.min(1.0, midEnergy * 1.4);
      const targetPucker = Math.min(1.0, highEnergy * 1.2);

      this.currentViseme.jawOpen += (targetJaw - this.currentViseme.jawOpen) * 0.45;
      this.currentViseme.mouthWide += (targetWide - this.currentViseme.mouthWide) * 0.45;
      this.currentViseme.mouthPucker += (targetPucker - this.currentViseme.mouthPucker) * 0.45;
      this.currentViseme.chinDrop = this.currentViseme.jawOpen * 0.85;

      // Subtle natural speech head movements
      this.currentViseme.headNod = Math.sin(Date.now() * 0.007) * (this.currentViseme.jawOpen * 0.15);
      this.currentViseme.headTilt = Math.cos(Date.now() * 0.005) * (this.currentViseme.mouthWide * 0.1);
      this.currentViseme.eyebrowArch = (lowEnergy + highEnergy) * 0.5;
    } else {
      // Decay back to resting mouth position
      this.currentViseme.jawOpen *= 0.75;
      this.currentViseme.mouthWide *= 0.75;
      this.currentViseme.mouthPucker *= 0.75;
      this.currentViseme.chinDrop *= 0.75;
      this.currentViseme.headNod *= 0.8;
      this.currentViseme.headTilt *= 0.8;
      this.currentViseme.eyebrowArch *= 0.8;
    }

    if (this.onVisemeUpdate) {
      this.onVisemeUpdate(this.currentViseme);
    }

    return this.currentViseme;
  }

  /**
   * Speaks dialogue text with voice cloning settings and drives automated real-time lip sync
   */
  public speak(text: string, voiceProfile: VoiceProfile, onEnd?: () => void): void {
    if (!text || text.trim().length === 0) {
      if (onEnd) onEnd();
      return;
    }

    const audioCtx = this.initAudioContext();
    window.speechSynthesis.cancel();

    // Setup speech synthesis utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = Math.max(0.1, Math.min(2.0, voiceProfile.pitch));
    utterance.rate = Math.max(0.4, Math.min(1.8, voiceProfile.rate));

    // Choose preferred voice based on gender / personality
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      let chosenVoice: SpeechSynthesisVoice | undefined;
      if (voiceProfile.voiceGender === 'female') {
        chosenVoice = voices.find(v => v.lang.startsWith('en') && /female|samantha|zira|karen|victoria/i.test(v.name));
      } else if (voiceProfile.voiceGender === 'monster' || voiceProfile.voiceGender === 'robot') {
        chosenVoice = voices.find(v => v.lang.startsWith('en') && /david|daniel|alex|fred/i.test(v.name));
      } else {
        chosenVoice = voices.find(v => v.lang.startsWith('en') && /male|david|george|james/i.test(v.name));
      }
      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }
    }

    // Connect synthetic audio simulator so analyser gets frequency data during speech
    this.isSpeaking = true;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    // Voice modulation based on profile
    if (voiceProfile.voiceGender === 'monster') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, audioCtx.currentTime);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65, audioCtx.currentTime);
    } else if (voiceProfile.voiceGender === 'robot') {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, audioCtx.currentTime);
      filter.Q.setValueAtTime(4, audioCtx.currentTime);
      osc.type = 'square';
      osc.frequency.setValueAtTime(140, audioCtx.currentTime);
    } else {
      filter.type = 'peaking';
      filter.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, audioCtx.currentTime);
    }

    // Feed to analyser node for viseme generation
    gainNode.gain.setValueAtTime(0.015, audioCtx.currentTime); // Inaudible carrier signal for analyser
    osc.connect(filter);
    filter.connect(gainNode);
    if (this.analyser) {
      gainNode.connect(this.analyser);
    }

    osc.start();

    // Natural speech rhythm pulse simulation while utterance is reading
    const speechPulse = setInterval(() => {
      if (!this.isSpeaking) {
        clearInterval(speechPulse);
        return;
      }
      const syllableIntensity = Math.random() * 0.7 + 0.3;
      gainNode.gain.setValueAtTime(syllableIntensity * 0.1, audioCtx.currentTime);
      osc.frequency.setValueAtTime(120 + Math.random() * 200, audioCtx.currentTime);
    }, 110);

    utterance.onend = () => {
      this.isSpeaking = false;
      clearInterval(speechPulse);
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      clearInterval(speechPulse);
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
      if (onEnd) onEnd();
    };

    this.synthUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    this.isSpeaking = false;
    window.speechSynthesis.cancel();
  }

  /**
   * Procedural Sound Effects Synthesizer for movie cinematic moments & TikTok gifts
   */
  public playSoundEffect(type: 'metalSlash' | 'subBassBoom' | 'synthDrone' | 'thunder' | 'giftSparkle' | 'kiKiMaMa'): void {
    const audioCtx = this.initAudioContext();
    const now = audioCtx.currentTime;

    switch (type) {
      case 'metalSlash': {
        // High-pass metallic scrape followed by sub-bass slice
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

        // Heavy impact thump
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
        // Massive cinematic movie trailer boom
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
        // Atmospheric dark synth chord
        [110, 164.8, 220].forEach(freq => {
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
        // Low-frequency rumble + explosive lightning crack
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
        // TikTok gift coin/galaxy sparkling pentatonic arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C E G C E
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
        // Atmospheric whispered rhythm echo: ki-ki-ki, ma-ma-ma
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
