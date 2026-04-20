class SovereignAudioEngine {
  private ctx: AudioContext | null = null;
  private initialized = false;

  private initCtx() {
    if (this.initialized) return;
    if (typeof window !== 'undefined') {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
           this.ctx = new AudioContextClass();
           this.initialized = true;
        }
      } catch (e) {
        console.warn('AudioContext initialization failed', e);
      }
    }
  }

  // 1. NEURAL PULSE (Simülasyon sırasında derinden gelen bas)
  playNeuralPulse() {
    this.initCtx();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(40, this.ctx.currentTime); // Düşük frekans (Deep Bass)
    osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 1);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 1);
  }

  // 2. SUB-BASS DANGER ALERT (Kritik Yan Etki Uyarısı)
  playDangerAlert() {
    this.initCtx();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth'; // Daha keskin bir tını
    osc.frequency.setValueAtTime(60, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + 0.5);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  // 3. CYBERNETIC WHISPER (Otoriter Sesli Bildirim)
  speak(message: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(message);
    const voices = window.speechSynthesis.getVoices();
    
    // Genellikle İngilizce ve otoriter tınılı bir ses seçimi
    utterance.voice = voices.find(v => v.lang.includes('en') && v.name.includes('Google')) || voices[0];
    utterance.pitch = 0.6; // Daha kalın/tok bir ses
    utterance.rate = 0.85; // Bir miktar yavaş ve vakur
    utterance.volume = 0.4;

    window.speechSynthesis.speak(utterance);
  }

  // 4. SOFT CHIME (Sessiz Onay / Otonom İşlem Tamamlandı)
  playSoftChime() {
    this.initCtx();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle'; // Yumuşak bir tını
    osc.frequency.setValueAtTime(800, this.ctx.currentTime); // Parlak, rahatsız etmeyen bir frekans
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 0.02); // Düşük hacim (0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }
}

export const audioShield = new SovereignAudioEngine();
