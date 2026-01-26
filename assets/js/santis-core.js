/**
 * SANTIS CORE ENGINE v1.1
 * - 5 Moods (Fatigued, Stressed, Drained, Sensitive, Care)
 * - Theme Switcher
 */

const SANTIS_CORE = {
    state: {
        currentMood: 'fatigued', // Default
        isFirstVisit: true
    },

    // 5 MOODS DEFINITION
    moods: {
        fatigued: { // Yorgun
            id: 'fatigued',
            name: 'Yorgun',
            subtitle: 'Derin Dinlenme',
            theme: {
                '--bg-main': '#1a1a1a',
                '--bg-section': '#222',
                '--text-main': '#e0e0e0',
                '--gold': '#d4af37'
            }
        },
        stressed: { // Stresli
            id: 'stressed',
            name: 'Stresli',
            subtitle: 'Dinginleş & Rahatla',
            theme: {
                '--bg-main': '#1e2424', // Deep Teal/Blueish
                '--bg-section': '#252b2b',
                '--text-main': '#dcecec',
                '--gold': '#a0c0c0'
            }
        },
        drained: { // Enerjisiz
            id: 'drained',
            name: 'Enerjisiz',
            subtitle: 'Canlan & Tazelen',
            theme: {
                '--bg-main': '#ffffff',
                '--bg-section': '#f4f4f4',
                '--text-main': '#222',
                '--gold': '#ff8c00' // Energetic Orange/Gold
            }
        },
        sensitive: { // Hassas
            id: 'sensitive',
            name: 'Hassas',
            subtitle: 'Nazik Dokunuş',
            theme: {
                '--bg-main': '#f9f7f7', // Soft Pink/White
                '--bg-section': '#fff',
                '--text-main': '#555',
                '--gold': '#e6b3b3' // Rose
            }
        },
        care: { // Sadece Bakım
            id: 'care',
            name: 'Bakım',
            subtitle: 'Sothys Uzmanlığı',
            theme: {
                '--bg-main': '#fff',
                '--bg-section': '#fff',
                '--text-main': '#333',
                '--gold': '#333' // Clinical/Clean Black
            }
        }
    },

    init() {
        const storedMood = localStorage.getItem('santis_mood');
        if (storedMood && this.moods[storedMood]) {
            this.setMood(storedMood, false);
            this.state.isFirstVisit = false;
        } else {
            this.showIntro();
        }
    },

    setMood(moodId, save = true) {
        if (!this.moods[moodId]) return;

        const theme = this.moods[moodId].theme;
        const root = document.documentElement;

        for (const [key, value] of Object.entries(theme)) {
            root.style.setProperty(key, value);
        }

        this.state.currentMood = moodId;
        document.body.className = `mood-${moodId}`;
        if (save) localStorage.setItem('santis_mood', moodId);
    },

    showIntro() {
        const overlay = document.getElementById('santisIntro');
        if (overlay) {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            this.renderIntroOptions();
        }
    },

    renderIntroOptions() {
        const grid = document.querySelector('.mood-grid');
        if (!grid) return;

        let html = '';
        const moodList = ['fatigued', 'stressed', 'drained', 'sensitive', 'care'];

        moodList.forEach(id => {
            const m = this.moods[id];
            // Icons map
            const icons = { fatigued: '🌿', stressed: '☁️', drained: '⚡', sensitive: '🌸', care: '🧴' };

            html += `
                <div class="mood-card" onclick="SANTIS_CORE.selectMood('${id}')">
                    <span class="mood-icon">${icons[id]}</span>
                    <h3 class="mood-title">${m.name}</h3>
                    <span class="mood-sub">${m.subtitle}</span>
                </div>
            `;
        });

        grid.innerHTML = html;
        // Update grid columns for 5 items
        grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(140px, 1fr))';
    },

    hideIntro() {
        const overlay = document.getElementById('santisIntro');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.style.display = 'none';
                document.body.style.overflow = '';
            }, 800);
        }
    },

    selectMood(moodId) {
        this.setMood(moodId);
        this.hideIntro();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    SANTIS_CORE.init();
    window.SANTIS_CORE = SANTIS_CORE;
});
