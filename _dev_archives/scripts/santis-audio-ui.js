/**
 * 🎧 SANTIS AUDIO HULL v1.0
 * Pure Procedural Web Audio API Engine
 * Generates "Quiet Luxury" sounds (Stone Click, Silk Hover) instantly without files.
 */

class SantisAudio {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.enabled = false;

        // Config: Very low volume for "Subconscious" feel
        this.volume = {
            click: 0.15,
            hover: 0.04
        };

        this.init();
    }

    init() {
        // User Interaction required to unlock AudioContext
        const enableAudio = () => {
            if (!this.ctx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.ctx = new AudioContext();
                this.masterGain = this.ctx.createGain();
                this.masterGain.connect(this.ctx.destination);
                // console.log("🔈 [Audio Hull] Context Unlocked & Ready.");
                this.enabled = true;
            } else if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }

            // Remove listeners once active
            document.removeEventListener('click', enableAudio);
            document.removeEventListener('keydown', enableAudio);
        };

        document.addEventListener('click', enableAudio);
        document.addEventListener('keydown', enableAudio);

        // Bind UI Events
        this.bindEvents();
    }

    bindEvents() {
        // 1. CLICK (Stone Thud)
        // Delegate to capture all buttons/links
        document.addEventListener('click', (e) => {
            if (e.target.closest('a, button, .nv-btn, .nv-card')) {
                this.playStoneClick();
            }
        });

        // 2. HOVER (Silk Slide)
        // Use capture phase for performance on specific targets
        const targets = document.querySelectorAll('.nv-btn, .nv-card, .nv-trend-card, .product-card');
        targets.forEach(el => {
            el.addEventListener('mouseenter', () => this.playSilkHover());
        });

        // Observer for dynamic content (similar to Physics)
        // ... (Simplified for now, will re-bind on mutations if needed)
    }

    // --- SYNTHESIS ENGINES ---

    /**
     * SOUND: STONE CLICK
     * A dull, percussive thud with no resonance.
     * Tech: Sine Wave @ 120Hz -> 60Hz drop over 0.1s
     */
    playStoneClick() {
        if (!this.enabled || !this.ctx) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        // Tone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);

        // Envelope (ADSR) - Short and dull
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(this.volume.click, t + 0.01); // Fast attack
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12); // Fast decay

        osc.start(t);
        osc.stop(t + 0.15);
    }

    /**
     * SOUND: SILK SLIDE
     * A breathy, airy whoosh.
     * Tech: White Noise -> High Pass Filter (cut low rumble) -> Gain Envelope
     * NOTE: Generating noise buffers is expensive, so we create a 1s buffer once.
     */
    playSilkHover() {
        if (!this.enabled || !this.ctx) return;

        // Create Noise Buffer (or reuse)
        if (!this.noiseBuffer) {
            const bufferSize = this.ctx.sampleRate * 1.5; // 1.5 sec
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            this.noiseBuffer = buffer;
        }

        const t = this.ctx.currentTime;
        const source = this.ctx.createBufferSource();
        source.buffer = this.noiseBuffer;

        // Filter: Cut everything below 800Hz to make it "hissy/silky" not "rumbly"
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, t);
        filter.frequency.linearRampToValueAtTime(1200, t + 0.2); // Sweep up slightly

        const gain = this.ctx.createGain();

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        // Envelope: Swell in and out
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(this.volume.hover, t + 0.1);
        gain.gain.linearRampToValueAtTime(0, t + 0.3);

        source.start(t);
        source.stop(t + 0.35);
    }
    // --- AMBIENCE ENGINE (Procedural Atmospheres) ---

    setAmbience(mood) {
        if (!this.enabled) return;
        // Map soul moods to audio textures
        // 'mist' -> Pink Noise (Airy)
        // 'underwater' -> Brown Noise + LFO (Deep)
        // 'midnight' -> White Noise + High Pass (Crickets/Space)
        const textures = {
            'mist': 'air',
            'zen': 'air',
            'underwater': 'deep',
            'midnight': 'space',
            'golden_hour': 'warm'
        };

        const texture = textures[mood] || 'air';
        if (this.currentTexture !== texture) {
            this.playAmbience(texture);
        }
    }

    playAmbience(type) {
        // Stop previous
        if (this.ambienceNode) {
            try { this.ambienceNode.stop(); } catch (e) { }
            this.ambienceNode = null;
        }

        if (!this.ctx) return;

        // Create Noise
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // Fill Noise based on type
        for (let i = 0; i < bufferSize; i++) {
            if (type === 'deep') data[i] = (Math.random() * 2 - 1) * 0.5; // Brown-ish (Needs filter)
            else data[i] = Math.random() * 2 - 1; // White
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        // Filter Chain
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        // Settings per Type
        const t = this.ctx.currentTime;

        if (type === 'air') { // Mist/Zen
            filter.type = 'lowpass';
            filter.frequency.value = 400;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.02, t + 2); // Very quiet fade in
        } else if (type === 'deep') { // Underwater
            filter.type = 'lowpass';
            filter.frequency.value = 150;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.05, t + 2);
        } else if (type === 'space') { // Midnight
            filter.type = 'highpass';
            filter.frequency.value = 8000; // Hisses
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.01, t + 2);
        } else {
            // Off or Warm
            gain.gain.value = 0;
        }

        source.start();
        this.ambienceNode = source;
        this.currentTexture = type;
        // console.log(`🎧 [Audio] Ambience Shift: ${type}`);
    }
}

// Initialize
window.SantisAudio = new SantisAudio();
