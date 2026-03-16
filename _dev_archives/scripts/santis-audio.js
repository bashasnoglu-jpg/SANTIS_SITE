/**
 * SANTIS SONIC LAYER v1.0 (Generative Audio)
 * "The voice of the Soul Engine."
 * 
 * Features:
 * 1. Procedural Ambience (Rain, Steam, Drones)
 * 2. Binaural Beats (Brainwave Entrainment)
 * 3. 4-7-8 Breath Synchronization
 */

class SantisAudio {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.active = false;

        // Nodes
        this.ambienceNodes = [];
        this.binauralNodes = [];

        // Configuration
        this.volume = 0.5;
        this.currentMood = 'zen';
        this.muted = false;

        // 🧠 Neural Memory Sync
        if (window.SantisMemory) {
            const savedAudio = window.SantisMemory.getAudioSettings();
            if (savedAudio) {
                this.volume = savedAudio.volume !== undefined ? savedAudio.volume : 0.5;
                this.muted = savedAudio.muted || false;
            }
        }
    }

    async init() {
        if (this.ctx) return;

        // efficient AudioContext handling
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        // Master Bus
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.muted ? 0 : this.volume;
        this.masterGain.connect(this.ctx.destination);

        this.active = true;
        console.log("🎵 [Sonic Layer] Audio Engine Initialized.");

        // Start Default Mood
        this.setAmbience(this.currentMood);
    }

    toggle() {
        if (!this.ctx) {
            this.init(); // First click initializes
            return true;
        }

        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
            this.active = true;
            return true;
        } else {
            this.ctx.suspend();
            this.active = false;
            return false;
        }
    }

    setAmbience(mood) {
        if (!this.ctx) {
            this.currentMood = mood;
            return;
        }

        console.log(`🎵 [Sonic Layer] Generative Preset: ${mood.toUpperCase()}`);
        this.stopAll(); // Fade out old

        switch (mood) {
            case 'rain':
                this.genRain();
                this.genBinaural(10); // Alpha (Relaxed Focus)
                break;
            case 'mist':
            case 'zen':
                this.genMist();
                this.genBinaural(7); // Theta (Deep Meditation)
                break;
            case 'dawn':
                this.genDawn();
                this.genBinaural(14); // Beta (Alertness)
                break;
            case 'deep':
            case 'midnight':
                this.genDeep();
                this.genBinaural(4); // Delta (Sleep/Healing)
                break;
        }
    }

    // --- GENERATORS (The "Surprise" Tech) ---

    /* 1. PINK NOISE (The Foundation) */
    createPinkNoise() {
        const bufferSize = 2 * this.ctx.sampleRate;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        let b0, b1, b2, b3, b4, b5, b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;

        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            output[i] *= 0.11; // (roughly) compensate for gain
            b6 = white * 0.115926;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        return noise;
    }

    /* PRESET: RAIN (Pink Noise + Low Pass Modulation) */
    genRain() {
        const noise = this.createPinkNoise();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        // Modulate Filter (The "Gusts")
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.2; // Slow changing wind
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 200;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        const gain = this.ctx.createGain();
        gain.gain.value = 0.4;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start();
        lfo.start();

        this.ambienceNodes.push(noise, lfo, gain);
    }

    /* PRESET: MIST (White Noise + High Pass + Reverb Simulation) */
    genMist() {
        const noise = this.createPinkNoise();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 800;

        const gain = this.ctx.createGain();
        gain.gain.value = 0.15; // Subtle hiss

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start();

        // Underlying Drone
        const drone = this.ctx.createOscillator();
        drone.type = 'sine';
        drone.frequency.value = 60; // 60Hz hum
        const droneGain = this.ctx.createGain();
        droneGain.gain.value = 0.1;

        drone.connect(droneGain);
        droneGain.connect(this.masterGain);
        drone.start();

        this.ambienceNodes.push(noise, drone, gain, droneGain);
    }

    /* PRESET: DEEP (Sub Bass) */
    genDeep() {
        const osc1 = this.ctx.createOscillator();
        osc1.frequency.value = 40; // Sub

        const osc2 = this.ctx.createOscillator();
        osc2.frequency.value = 43; // Slight detune for pulsing

        const gain = this.ctx.createGain();
        gain.gain.value = 0.3;

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain);

        osc1.start();
        osc2.start();

        this.ambienceNodes.push(osc1, osc2, gain);
    }

    /* PRESET: DAWN (Harmonics) */
    genDawn() {
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = 110; // A2

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300; // Soften it

        const gain = this.ctx.createGain();
        gain.gain.value = 0.1;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start();

        this.ambienceNodes.push(osc, gain);
    }

    // --- BINAURAL BEATS (Hidden Layer) ---
    // Creates a phantom frequency inside the brain by playing two slightly different frequencies in L/R ears.
    genBinaural(targetHz) {
        const baseFreq = 200;

        // Left Ear
        const oscL = this.ctx.createOscillator();
        oscL.frequency.value = baseFreq;
        const panL = this.ctx.createStereoPanner();
        panL.pan.value = -1;

        // Right Ear
        const oscR = this.ctx.createOscillator();
        oscR.frequency.value = baseFreq + targetHz; // The difference is the beat
        const panR = this.ctx.createStereoPanner();
        panR.pan.value = 1;

        const gain = this.ctx.createGain();
        gain.gain.value = 0.05; // Extremely subtle, almost subconscious

        oscL.connect(panL);
        panL.connect(gain);

        oscR.connect(panR);
        panR.connect(gain);

        gain.connect(this.masterGain);

        oscL.start();
        oscR.start();

        this.binauralNodes.push(oscL, oscR, gain);
        console.log(`🧠 [Bio-Hack] Binaural Beat Active: ${targetHz}Hz`);
    }

    stopAll() {
        this.ambienceNodes.forEach(n => {
            try { n.stop(); } catch (e) { }
            try { n.disconnect(); } catch (e) { }
        });
        this.binauralNodes.forEach(n => {
            try { n.stop(); } catch (e) { }
            try { n.disconnect(); } catch (e) { }
        });
        this.ambienceNodes = [];
        this.binauralNodes = [];
    }

    setVolume(val) {
        this.volume = val;
        if (this.masterGain && !this.muted) this.masterGain.gain.value = val;

        // Save to Memory
        if (window.SantisMemory) {
            window.SantisMemory.setAudioSettings({ volume: val, muted: this.muted });
        }
    }

    setMute(isMuted) {
        this.muted = isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = isMuted ? 0 : this.volume;
        }
        // Save to Memory
        if (window.SantisMemory) {
            window.SantisMemory.setAudioSettings({ volume: this.volume, muted: isMuted });
        }
    }
}

window.SantisAudio = new SantisAudio();
