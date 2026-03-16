/**
 * SANTIS ADAPTIVE QUALITY ENGINE V1.0
 * Ağ bağlantı hızına göre dinamik resim kalitesi ve CSS efektleri ayarlar
 */

class SantisAdaptiveQuality {
    constructor() {
        this.connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        this.init();
    }

    init() {
        if (!this.connection) {
            this.applyQuality('fast'); // Default fallback
            return;
        }

        this.updateQuality();

        // Listen for network changes
        this.connection.addEventListener('change', () => this.updateQuality());
    }

    updateQuality() {
        const type = this.connection.effectiveType;
        let qualityLevel = 'fast';

        if (/\b(slow-2g|2g)\b/.test(type)) {
            qualityLevel = 'slow';
        } else if (/\b(3g|4g)\b/.test(type)) {
            // Keep 3g/4g balanced depending on save-data mode
            qualityLevel = this.connection.saveData ? 'slow' : 'medium';
        } else {
            // fast (4g well connected, 5g, wifi, ethernet)
            qualityLevel = 'fast';
        }

        this.applyQuality(qualityLevel);
    }

    applyQuality(level) {
        document.documentElement.setAttribute('data-net', level);

        // Set variables according to network speed
        let nqQuality = '95';
        if (level === 'slow') nqQuality = '60';
        else if (level === 'medium') nqQuality = '80';

        document.documentElement.style.setProperty('--nq-quality', nqQuality);

        console.log(`📡 [Adaptive Quality] Network level: ${level} (Quality: ${nqQuality})`);

        // Adjust existing lazy loaded elements based on network speed (Dynamic eager for very slow to prevent layout shift wait)
        if (level === 'slow') {
            document.querySelectorAll('img[loading="lazy"]').forEach(img => {
                img.setAttribute('loading', 'eager');
            });
            // You can add style to disable heavy CSS filters here via adding a global class, handled by data-net attribute mapped in CSS
        }
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new SantisAdaptiveQuality());
} else {
    new SantisAdaptiveQuality();
}
