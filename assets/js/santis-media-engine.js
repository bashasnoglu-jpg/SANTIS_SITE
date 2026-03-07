/**
 * 🌍 [SANTIS EXPERIENCE OS v4.0 - LUXURY MEDIA ENGINE]
 * Zırhlar: Media Registry, Lazy + Priority Loading, Multi-language ALT system, CDN-ready
 */

class SantisMediaEngine {
    constructor() {
        this.manifestPath = '/assets/data/media-manifest.json';
        this.mediaRegistry = null;
        this.init();
    }

    async init() {
        try {
            const response = await fetch(this.manifestPath);
            if (!response.ok) throw new Error('Media Manifest failed to load!');
            this.mediaRegistry = await response.json();

            console.log(`🖼️ [MEDIA ENGINE] Luxury Media Registry Loaded.`);

            // Initial Load
            this.loadMedia();

            // Re-render alt tags when language changes
            document.addEventListener('santisLanguageChanged', () => {
                this.loadMedia();
            });

        } catch (error) {
            console.error('[MEDIA ENGINE] Critical Error:', error);
        }
    }

    loadMedia() {
        if (!this.mediaRegistry) return;

        let currentLang = 'en';
        // Connect to Sovereign I18n Engine if it exists
        if (window.SantisOS && window.SantisOS.currentLang) {
            currentLang = window.SantisOS.currentLang;
        } else if (localStorage.getItem('santis_lang')) {
            currentLang = localStorage.getItem('santis_lang');
        }

        document.querySelectorAll('[data-media]').forEach(el => {
            const key = el.dataset.media;
            const asset = this.mediaRegistry[key];

            if (!asset) return;

            // Update Image Source if different (to prevent reflow)
            if (el.tagName === 'IMG' || el.tagName === 'SOURCE') {
                if (el.src !== asset.src) {
                    el.src = asset.src;
                }
            }

            // Update Alt Tag for multi-language SEO & Accessibility
            if (asset.alt) {
                const altText = asset.alt[currentLang] || asset.alt.en;
                if (el.alt !== altText) {
                    el.alt = altText;
                }
            }

            // Enforce Classes for Media Architecture
            if (!el.classList.contains('santis-media')) {
                el.classList.add('santis-media');
            }
        });
    }
}

// Otonom Başlatıcı
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if it hasn't been done yet to avoid duplicated efforts.
    // The Experience OS will call this directly in v5, but for stand-alone:
    if (!window.SantisMedia) {
        window.SantisMedia = new SantisMediaEngine();
    }
});
