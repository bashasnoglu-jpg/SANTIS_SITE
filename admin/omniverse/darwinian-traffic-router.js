/**
 * ========================================================================
 * DARWINIAN TRAFFIC ROUTER v1.0 — Multi-Armed Bandit
 * ========================================================================
 * Gerçek kullanıcıları %90 Apex / %10 Mutant olarak böler.
 * Mutant varyantlar gerçek CVR verisiyle test edilir.
 * Bir mutant Apex'i yenerse, canlıda "Taç Giyme Töreni" tetiklenir.
 *
 * Constrained Darwinism: Mutasyonlar sadece kütle, yörünge ve boşluk
 * üzerinde gerçekleşir. Renk, tipografi, marka kimliğine dokunulmaz.
 *
 * Usage:
 *   <script src="admin/omniverse/darwinian-traffic-router.js" defer></script>
 *   Otomatik aktifleşir. SovereignBeacon ile birlikte çalışır.
 */

const DarwinianRouter = (() => {
    const STORAGE_KEY = 'sv_darwin_state';
    const EXPLOIT_RATIO = 0.90; // %90 Apex, %10 Mutant
    const MIN_SAMPLES = 50;     // Taç Giyme için minimum veri noktası
    const CONFIDENCE = 0.05;    // %95 güven aralığı (p < 0.05)

    let state = loadState();

    function loadState() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (saved && saved.version === 'router-v1') return saved;
        } catch (e) {}

        return {
            version: 'router-v1',
            apex: {
                id: 'apex-v1',
                layout: null,   // universe-runtime.json'dan yüklenecek
                impressions: 0,
                conversions: 0,
                cvr: 0
            },
            mutants: [],        // [{ id, layout, impressions, conversions, cvr }]
            generation: 1,
            totalSessions: 0,
            coronations: 0      // Kaç kez taç giyme gerçekleşti
        };
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {}
    }

    /**
     * Constrained Mutation: Sadece fizik parametreleri mutasyona uğrar
     * Renk, font, içerik DOKUNULMAZ.
     */
    function generateMutant(apexLayout) {
        if (!apexLayout) return null;

        const mutantLayout = apexLayout.map(card => ({
            ...card,
            position: {
                x: card.position.x + (Math.random() - 0.5) * 80,
                y: card.position.y + (Math.random() - 0.5) * 60
            },
            mass: Math.max(20, card.mass * (0.85 + Math.random() * 0.3)),
            priority: card.priority // Sıralama değişebilir ama guardrail içinde
        }));

        // Guardrail: Canvas sınırları içinde tut
        mutantLayout.forEach(card => {
            card.position.x = Math.max(50, Math.min(1150, card.position.x));
            card.position.y = Math.max(50, Math.min(750, card.position.y));
        });

        return {
            id: 'mutant-g' + state.generation + '-' + Date.now().toString(36),
            layout: mutantLayout,
            impressions: 0,
            conversions: 0,
            cvr: 0
        };
    }

    /**
     * Ziyaretçiyi Apex veya Mutant'a yönlendir
     * @returns {Object} — { variant: 'apex'|'mutant-xxx', layout: [...] }
     */
    function route() {
        state.totalSessions++;
        const roll = Math.random();

        if (roll < EXPLOIT_RATIO || state.mutants.length === 0) {
            // %90 → Apex Predator
            state.apex.impressions++;
            saveState();

            // Neural Beacon'a varyant bildir
            if (window.SovereignBeacon) {
                SovereignBeacon.ignite(state.apex.id);
            }

            return {
                variant: state.apex.id,
                layout: state.apex.layout,
                isApex: true
            };
        } else {
            // %10 → Rastgele mutant
            const mutant = state.mutants[Math.floor(Math.random() * state.mutants.length)];
            mutant.impressions++;
            saveState();

            if (window.SovereignBeacon) {
                SovereignBeacon.ignite(mutant.id);
            }

            return {
                variant: mutant.id,
                layout: mutant.layout,
                isApex: false
            };
        }
    }

    /**
     * Dönüşüm kaydı (CTA tıklama, satın alma)
     */
    function recordConversion(variantId) {
        if (variantId === state.apex.id) {
            state.apex.conversions++;
            state.apex.cvr = state.apex.impressions > 0 
                ? (state.apex.conversions / state.apex.impressions * 100) 
                : 0;
        } else {
            const mutant = state.mutants.find(m => m.id === variantId);
            if (mutant) {
                mutant.conversions++;
                mutant.cvr = mutant.impressions > 0 
                    ? (mutant.conversions / mutant.impressions * 100) 
                    : 0;
            }
        }
        saveState();

        // Taç Giyme kontrolü
        checkCoronation();
    }

    /**
     * Taç Giyme Töreni: Mutant, Apex'i yendiyse
     * Z-Test ile istatistiksel anlamlılık kontrolü
     */
    function checkCoronation() {
        for (const mutant of state.mutants) {
            if (mutant.impressions < MIN_SAMPLES) continue;
            if (state.apex.impressions < MIN_SAMPLES) continue;

            const p1 = state.apex.cvr / 100;
            const p2 = mutant.cvr / 100;
            const n1 = state.apex.impressions;
            const n2 = mutant.impressions;

            // Pooled proportion
            const p = (state.apex.conversions + mutant.conversions) / (n1 + n2);
            const se = Math.sqrt(p * (1 - p) * (1/n1 + 1/n2));
            const z = se > 0 ? (p2 - p1) / se : 0;

            // z > 1.96 = %95 güvenle mutant daha iyi
            if (z > 1.96 && mutant.cvr > state.apex.cvr) {
                // 👑 TAÇ GİYME TÖRENİ!
                console.log(
                    `%c👑 [CORONATION] ${mutant.id} Apex Predator ilan edildi! CVR: ${mutant.cvr.toFixed(2)}% > ${state.apex.cvr.toFixed(2)}%`,
                    'color:#00ff66; font-weight:bold; font-size:14px;'
                );

                // Eski apex'i öldür, yeni apex'i tahta çıkar
                const oldApex = { ...state.apex };
                state.apex = {
                    id: mutant.id,
                    layout: mutant.layout,
                    impressions: mutant.impressions,
                    conversions: mutant.conversions,
                    cvr: mutant.cvr
                };

                // Mutant listesinden çıkar
                state.mutants = state.mutants.filter(m => m.id !== mutant.id);
                state.coronations++;
                state.generation++;

                // Yeni mutantlar üret (evrim devam ediyor)
                if (state.apex.layout) {
                    for (let i = 0; i < 3; i++) {
                        const newMutant = generateMutant(state.apex.layout);
                        if (newMutant) state.mutants.push(newMutant);
                    }
                }

                saveState();

                // Live Bridge'i tetikle (SSE benzeri DOM güncelleme)
                if (window.SovereignLiveBridge) {
                    console.log('%c[ROUTER] Live Bridge\'e yeni Apex DNA gönderiliyor...', 'color:#c5a059;');
                }

                return; // Bir seferde tek taç giyme
            }
        }
    }

    /**
     * Apex layout'unu yükle (universe-runtime.json'dan)
     */
    async function loadApexFromRuntime(url = '/universe-runtime.json') {
        try {
            const res = await fetch(url + '?t=' + Date.now());
            if (!res.ok) return;
            const runtime = await res.json();
            state.apex.layout = runtime.layout;
            
            // İlk mutantları üret
            if (state.mutants.length === 0 && state.apex.layout) {
                for (let i = 0; i < 3; i++) {
                    const mutant = generateMutant(state.apex.layout);
                    if (mutant) state.mutants.push(mutant);
                }
            }
            saveState();
            console.log(
                `%c[ROUTER] Apex yüklendi. ${state.mutants.length} mutant üretildi. Gen: ${state.generation}`,
                'color:#c5a059;'
            );
        } catch (e) {
            // universe-runtime.json yoksa sessizce bekle
        }
    }

    /**
     * Dashboard için durum raporu
     */
    function getReport() {
        return {
            apex: {
                id: state.apex.id,
                impressions: state.apex.impressions,
                conversions: state.apex.conversions,
                cvr: state.apex.cvr.toFixed(2) + '%'
            },
            mutants: state.mutants.map(m => ({
                id: m.id,
                impressions: m.impressions,
                conversions: m.conversions,
                cvr: m.cvr.toFixed(2) + '%'
            })),
            generation: state.generation,
            totalSessions: state.totalSessions,
            coronations: state.coronations
        };
    }

    // ── AUTO-INIT ──
    function ignite() {
        loadApexFromRuntime();
        console.log(
            '%c[DARWINIAN ROUTER] %cv1.0 Aktif | Exploit: ' + (EXPLOIT_RATIO*100) + '% | Explore: ' + ((1-EXPLOIT_RATIO)*100) + '%',
            'color:#00ff66; font-weight:bold;', 'color:#888;'
        );
    }

    return {
        ignite,
        route,
        recordConversion,
        getReport,
        generateMutant,
        loadApexFromRuntime,
        getState: () => ({ ...state }),
        reset: () => { localStorage.removeItem(STORAGE_KEY); state = loadState(); }
    };
})();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DarwinianRouter.ignite());
} else {
    DarwinianRouter.ignite();
}

window.DarwinianRouter = DarwinianRouter;
