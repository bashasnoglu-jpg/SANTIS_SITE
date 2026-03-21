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



    // Sentient Guide / Zen Mode
    triggerZenMode() {
        const msg = "Biraz kararsız kaldığınızı seziyorum. Size Zen VIP ritüellerimiz hakkında sesli bilgi vermemi ister misiniz?";
        
        // 1. Otonom "Sıvı Metal" Parlaması (Soul Engine Flare)
        console.log("✨ [Aurelia AI] Sıvı Metal Rezonansı Aktif.");
        const oldGlow = document.documentElement.style.getPropertyValue('--soul-breath-intensity');
        document.documentElement.style.setProperty('--soul-breath-intensity', '0.1s'); // Extremely fast pulse
        document.body.style.boxShadow = "inset 0 0 150px rgba(212,175,55,0.15)";
        document.body.style.transition = "box-shadow 2s ease, --soul-breath-intensity 2s ease";
        
        setTimeout(() => {
            document.documentElement.style.setProperty('--soul-breath-intensity', oldGlow || '6s');
            document.body.style.boxShadow = "none";
        }, 4000);

        // Dispatch visual UI text anyway
        const e = new CustomEvent('santis:aurelia-text-nudge', { detail: { text: msg } });
        window.dispatchEvent(e);

        if (!this.active || !this.synth) {
            console.log("🎙️ [Voice] Sessiz mod: Aurelia UI görsel olarak uyarıldı.");
            return;
        }

        // Shift config to Zen mode
        const originalConfig = { ...this.config };
        this.setTuning({ pitch: 0.8, rate: 0.75, volume: 0.8 });
        
        this.speak(msg);
        
        // Autonomously open Reservation modal after speech starts
        setTimeout(() => {
            if (typeof window.openReservationModal === 'function') {
                window.openReservationModal('Sovereign Zen Therapy');
            }
        }, 3000);

        // Restore config
        setTimeout(() => this.setTuning(originalConfig), 8000);
    }

    // Interaction Bindings

    bindHoverEffects() {

        // Trend Cards

        document.querySelectorAll('.santis-trend-card').forEach(card => {

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

