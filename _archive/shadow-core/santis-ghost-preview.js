/**
 * 🦅 SANTIS OS [V45_APEX] - SOVEREIGN GHOST PREVIEW & SOUNDSCAPE
 * "Tıklamadan Önceki Atmosfer: Hayalet Geçiş Katmanı ve Akustik Fısıltı."
 * * Bu modül, Predictive AI'dan gelen niyet sinyallerini dinleyerek
 * arayüzü sessizce bir sonraki aşamaya hazırlar ve derinden gelen organik bir ses çalar.
 */

class SantisGhostPreview {
    constructor() {
        this.previewLayer = null;
        this.activeIntent = null;
        this.audioCtx = null;
        this.activeOscillator = null;
        this.activeGain = null;
        this.init();
    }

    init() {
        console.log("🌌 [V45 Ghost] Hayalet Önizleme & Akustik Katmanı Aktif.");
        this.createOverlay();
        
        // Predictive AI'ın kehanetlerini dinle
        window.addEventListener('santis:intent_detected', (e) => this.handleGhostIntrusion(e));
        // Fare hedeften uzaklaşırsa hayaleti erit
        window.addEventListener('mousemove', (e) => this.checkIntentExpiration(e));
    }

    /**
     * Görünmez bir hayalet katman oluşturur.
     */
    createOverlay() {
        this.previewLayer = document.createElement('div');
        this.previewLayer.id = 'santis-ghost-overlay';
        this.previewLayer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 5;
            opacity: 0;
            transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), backdrop-filter 0.8s ease;
            background: radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,0) 100%);
        `;
        document.body.appendChild(this.previewLayer);
    }

    /**
     * Kehanet edilen hedefe göre atmosferi değiştirir.
     */
    handleGhostIntrusion(e) {
        if (this.activeIntent === e.detail.target) return;

        const { target, url } = e.detail;
        this.activeIntent = target;

        const theme = this.getThemeByUrl(url);

        requestAnimationFrame(() => {
            this.previewLayer.style.opacity = "0.15";
            this.previewLayer.style.background = theme.gradient;
            this.previewLayer.style.backdropFilter = "blur(2px)";
            
            console.log(`✨ [V45 Ghost] Atmosfer Sızıyor: ${theme.name}`);
        });

        this.playWhisperSound(theme.freq);
    }

    /**
     * Fare hedeften çok uzaklaşırsa atmosferi normale döndürür.
     */
    checkIntentExpiration(e) {
        if (!this.activeIntent) return;

        const rect = this.activeIntent.getBoundingClientRect();
        const buffer = 150; // 150px'lik tolerans alanı

        if (
            e.clientX < rect.left - buffer ||
            e.clientX > rect.right + buffer ||
            e.clientY < rect.top - buffer ||
            e.clientY > rect.bottom + buffer
        ) {
            this.fadeGhost();
        }
    }

    fadeGhost() {
        this.previewLayer.style.opacity = "0";
        this.previewLayer.style.backdropFilter = "blur(0px)";
        this.activeIntent = null;
        this.stopWhisperSound();
    }

    getThemeByUrl(url) {
        if (url.includes('hamam')) return { 
            name: 'Sıcak Amber', 
            freq: 60,
            gradient: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.2) 0%, rgba(0,0,0,0) 70%)' 
        };
        if (url.includes('cilt')) return { 
            name: 'Safir Ferahlık', 
            freq: 85,
            gradient: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.1) 0%, rgba(0,0,0,0) 70%)' 
        };
        return { 
            name: 'Kuantum Boşluk', 
            freq: 55,
            gradient: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.05) 0%, rgba(0,0,0,0) 70%)' 
        };
    }

    /**
     * Sovereign Soundscape - Çok düşük frekanslı organik fısıltı
     */
    playWhisperSound(baseFreq) {
        try {
            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            this.stopWhisperSound();

            const osc = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(baseFreq, this.audioCtx.currentTime);

            const lfo = this.audioCtx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.5;

            const lfoGain = this.audioCtx.createGain();
            lfoGain.gain.value = 5;

            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);

            osc.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);

            gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.03, this.audioCtx.currentTime + 1.5); 

            osc.start();
            lfo.start();

            this.activeOscillator = osc;
            this.activeGain = gainNode;
        } catch (e) {
            console.warn("🔇 [V45 Ghost] Ses kalkanı aktif, fısıltı çalınamadı.");
        }
    }

    stopWhisperSound() {
        if (this.activeGain && this.activeOscillator) {
            const time = this.audioCtx.currentTime;
            this.activeGain.gain.cancelScheduledValues(time);
            this.activeGain.gain.setValueAtTime(this.activeGain.gain.value, time);
            this.activeGain.gain.exponentialRampToValueAtTime(0.001, time + 1.0);
            
            const osc = this.activeOscillator;
            setTimeout(() => {
                try { osc.stop(); } catch(e){}
            }, 1000);
            
            this.activeOscillator = null;
            this.activeGain = null;
        }
    }
}

import { register } from '../core/santis-kernel.js';

register('ghost_preview', async () => {
    window.SANTIS.GhostPreview = new SantisGhostPreview();
    console.log("✅ [V45 Ghost] Hayalet Katmanı ve Soundscape Kernel'e mühürlendi.");
}, ['predictive_ai', 'temporal']);
