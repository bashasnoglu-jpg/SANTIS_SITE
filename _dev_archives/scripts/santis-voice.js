/**

 * SANTIS VOICE ENGINE v1.0

 * "The Whisper" - Text-to-Speech Concierge

 */



class SantisVoice {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voice = null;
        this.active = false; // Off by default until Audio is enabled

        // 🧠 Neural Memory Sync
        if (window.SantisMemory) {
            const voiceEnabled = window.SantisMemory.getVoiceEnabled();
            // If memory says enabled, we still wait for Audio to be enabled usually, 
            // but let's respect the user's preference for the *capability*.
            this.active = voiceEnabled;
        }

        // Default Tuning (SPA MODE: Calm & Slow)
        this.config = {
            pitch: 0.9,
            rate: 0.85,
            volume: 0.6
        };

        // Cache voices when ready
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
        this.loadVoices();
    }

    loadVoices() {
        const voices = this.synth.getVoices();
        // Priority: Turkish (tr-TR) -> Google US English Female -> Microsoft Zira -> Any English

        this.voice = voices.find(v => v.lang === 'tr-TR') ||
            voices.find(v => v.name.includes("Google US English")) ||
            voices.find(v => v.name.includes("Zira")) ||
            voices.find(v => v.lang === "en-US");

        console.log(`🎙️ [Voice] Loaded: ${this.voice ? this.voice.name : 'Default'} (${this.voice ? this.voice.lang : 'unknown'})`);
    }



    speak(text) {

        if (!this.active || !this.synth) return;

        if (this.synth.speaking) this.synth.cancel(); // Don't queue, interrupt politely



        const utterance = new SpeechSynthesisUtterance(text);



        // Luxury Tuning (Default or Custom)

        utterance.voice = this.voice;

        utterance.pitch = this.config.pitch;

        utterance.rate = this.config.rate;

        utterance.volume = this.config.volume;



        this.synth.speak(utterance);

    }



    setTuning(config) {

        this.config = { ...this.config, ...config };

        console.log("🎙️ [Voice] Tuning Updated:", this.config);

        // Test speak

        this.speak("Tuning adjusted.");

    }



    // Interaction Bindings

    bindHoverEffects() {

        // Trend Cards

        document.querySelectorAll('.nv-trend-card').forEach(card => {

            card.addEventListener('mouseenter', () => {

                const title = card.querySelector('h3')?.innerText;

                if (title) this.speak(title);

            });

        });



        // Service Cards

        document.querySelectorAll('.soul-card, .prod-card-v2').forEach(card => {

            card.addEventListener('mouseenter', () => {

                const title = card.querySelector('h3, h4')?.innerText;

                if (title) this.speak(title);

            });

        });

    }

}



// Init

window.SantisVoice = new SantisVoice();



// Bind after load

document.addEventListener('DOMContentLoaded', () => {

    // Wait for dynamic content?

    setTimeout(() => window.SantisVoice.bindHoverEffects(), 2000);

});

