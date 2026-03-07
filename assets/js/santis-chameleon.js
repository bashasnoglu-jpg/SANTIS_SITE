/**
 * SANTIS CHAMELEON ENGINE V1.0 (AI Content Personalization)
 * 
 * Ghost Tracker'dan gelen niyet metriklerini okur, API'ye danışır ve
 * misafirin personasına göre ana sayfadaki Hero ve Başlıkları otonom değiştirir.
 */

class SantisChameleon {
    constructor() {
        this.apiEndpoint = '/api/v1/personalize/chameleon';
        this.isEnabled = window.location.pathname === '/' || window.location.pathname.endsWith('index.html');
        // Sadece gateway veya anasayfada aktif

        if (this.isEnabled) {
            this.init();
        }
    }

    async init() {
        // Ghost_session data check
        const ghostData = this.collectGhostData();
        if (!ghostData.visited_pages.length) {
            console.log('🦎 [Chameleon] No sufficient intent data yet. Staying default.');
            return;
        }

        try {
            console.log('🦎 [Chameleon] Analyzing persona based on intent...');
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ghostData)
            });

            if (!response.ok) throw new Error('Chameleon API response not OK');

            const personaData = await response.json();
            this.applyPersona(personaData);

        } catch (error) {
            console.warn('🦎 [Chameleon] Engine skipped due to error or network:', error);
        }
    }

    collectGhostData() {
        // Ghost Tracker'ın sessionStorage'a bıraktığı (veya bırakacağı) breadcrumb verilerini toplar
        let visited = [];
        try {
            const raw = sessionStorage.getItem('santis_ghost_path');
            if (raw) visited = JSON.parse(raw);

            // Eğer boşsa, tarayıcı history tabanlı bir tahminde bulun (Basit Hack)
            if (!visited.length && document.referrer.includes(window.location.host)) {
                visited.push(document.referrer);
            }
        } catch (e) { }

        return {
            visited_pages: visited,
            duration: parseInt(sessionStorage.getItem('santis_ghost_duration') || '0'),
            intent_score: parseInt(sessionStorage.getItem('santis_ghost_score') || '0')
        };
    }

    applyPersona(data) {
        console.log(`🎭 [Chameleon] Persona Matched: ${data.persona}`);

        // 🧬 GLOBAL PERSONA EXPORT — Revenue Brain, Telemetry ve Persuader okuyabilsin
        window.santisPersona = data.persona;
        if (window.SANTIS) window.SANTIS.persona = data.persona;
        document.documentElement.dataset.persona = data.persona;

        // 1. Update Headline
        const titleEl = document.querySelector('.gateway-title') || document.querySelector('h1');
        if (titleEl && titleEl.innerText !== data.headline) {
            this.fadeSwap(titleEl, data.headline);
        }

        // 2. Update Subtitle
        const subEl = document.querySelector('.gateway-subtitle');
        if (subEl && subEl.innerText !== data.subtitle) {
            this.fadeSwap(subEl, data.subtitle);
        }

        // 3. Update Hero Background -> Phase 35: Delegated to V10 Atmosphere Engine
        window.dispatchEvent(new CustomEvent('santis-persona-changed', {
            detail: { persona: data.persona }
        }));

        // PHASE 45 H3: Persona Palette Sync (Whale Mode)
        const persona = (data.persona || '').toLowerCase();
        const isWhale = persona.includes('whale') || persona.includes('sovereign') || persona.includes('vip');
        if (isWhale) {
            document.body.classList.add('whale-mode');
            console.log("[Theme Sync] Applied 'Royal Gold' palette for persona:", data.persona);
            // Persist for this session
            sessionStorage.setItem('santis_whale_mode', '1');
        } else {
            document.body.classList.remove('whale-mode');
        }
    }


    fadeSwap(element, newText) {
        element.style.transition = 'opacity 0.6s';
        element.style.opacity = '0';
        setTimeout(() => {
            element.innerText = newText;
            element.style.opacity = '1';
        }, 600);
    }
}

// Santis Core yüklendikten sonra otonom çalışır
document.addEventListener('DOMContentLoaded', () => new SantisChameleon());
