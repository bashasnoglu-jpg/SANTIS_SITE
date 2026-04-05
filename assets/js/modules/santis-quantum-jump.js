/**
 * ⚡ [SANTIS QUANTUM JUMP] - Phase I: Intent-Based Preloading Engine
 * Niyet Olasılığı: P(intent) = T_hover / T_threshold (Threshold: 65ms)
 */

const QuantumJump = (() => {
    const PREFETCHED_CACHE = new Set();
    const HOVER_THRESHOLD = 65; // Bir niyetin kesinleşme süresi (ms)

    const injectSpeculationRules = (url) => {
        // 2026 Modern Tarayıcı Zırhı: Speculation Rules API
        if (typeof HTMLScriptElement !== 'undefined' && HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
            const specScript = document.createElement('script');
            specScript.type = 'speculationrules';
            specScript.textContent = JSON.stringify({
                prefetch: [{
                    source: 'list',
                    urls: [url],
                    requires: ['anonymous-client-ip-when-cross-origin']
                }]
            });
            document.head.appendChild(specScript);
        } else {
            // Klasik Fallback: Sovereign Fetch
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            document.head.appendChild(link);
        }
    };

    const handleIntent = (e) => {
        const link = e.target.closest('a');
        if (!link || !link.href || link.origin !== window.location.origin) return;
        
        const url = link.href;
        if (PREFETCHED_CACHE.has(url)) return;

        // Kuantum Gecikmesi: Sadece "gerçekten" tıklamaya niyetliyse ateşle
        link.dataset.intentTimer = setTimeout(() => {
            console.log(`🌌 [Quantum Jump] Niyet Tespit Edildi: ${url}`);
            injectSpeculationRules(url);
            PREFETCHED_CACHE.add(url);
            
            // Sovereign Feedback (Opsiyonel: Hover sırasında hafif bir parıltı)
            link.style.cursor = 'wait'; 
            setTimeout(() => link.style.cursor = '', 100);
        }, HOVER_THRESHOLD);
    };

    const cancelIntent = (e) => {
        const link = e.target.closest('a');
        if (link && link.dataset.intentTimer) {
            clearTimeout(parseInt(link.dataset.intentTimer));
            delete link.dataset.intentTimer;
        }
    };

    return {
        init: () => {
            console.log("⚡ [Quantum Jump] Zaman Bükücü Aktif. 0ms Geçiş Hazır.");
            document.addEventListener('mouseover', handleIntent, { passive: true });
            document.addEventListener('mouseout', cancelIntent, { passive: true });
            if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
                document.addEventListener('touchstart', handleIntent, { passive: true });
            }
        }
    };
})();

export default QuantumJump;
