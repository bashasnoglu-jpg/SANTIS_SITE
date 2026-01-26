/**
 * SANTIS CORE ENGINE v1.0
 * "The Soul of the Digital Temple"
 * Handles Mood Management, Theme Switching, and Sensory Logic.
 */

const SANTIS_CORE = {
    state: {
        currentMood: 'relax', // Default
        isFirstVisit: true
    },

    // MOOD DEFINITIONS (The "DNA" of the site)
    moods: {
        relax: {
            id: 'relax',
            name: 'Deep Relax',
            subtitle: 'Sakinleş & Yenilen',
            theme: {
                '--bg-main': '#0a0a0a',
                '--bg-section': '#111111',
                '--bg-card': '#1a1a1a',
                '--text-main': '#ffffff',
                '--text-muted': '#aaaaaa',
                '--gold': '#d4af37', // Classic Gold
                '--nav-bg': 'rgba(10, 10, 10, 0.85)'
            }
        },
        detox: {
            id: 'detox',
            name: 'Pure Detox',
            subtitle: 'Arın & Canlan',
            theme: {
                '--bg-main': '#1a261a', // Deep Forest
                '--bg-section': '#202e20',
                '--bg-card': '#2a3a2a',
                '--text-main': '#f0f5f0',
                '--text-muted': '#b0c0b0',
                '--gold': '#a8c6a0', // Sage/Botanical Greenish Gold
                '--nav-bg': 'rgba(26, 38, 26, 0.85)'
            }
        },
        glow: {
            id: 'glow',
            name: 'Royal Glow',
            subtitle: 'Işılda & Enerji Dol',
            theme: {
                '--bg-main': '#ffffff', // Pearl White
                '--bg-section': '#f8f8f8',
                '--bg-card': '#ffffff',
                '--text-main': '#222222', // High Contrast Dark
                '--text-muted': '#666666',
                '--gold': '#b76e79', // Rose Gold / Copper
                '--nav-bg': 'rgba(255, 255, 255, 0.9)'
            }
        }
    },

    init() {
        console.log("💎 Santis Core Initializing...");

        // 1. Check Storage
        const storedMood = localStorage.getItem('santis_mood');
        if (storedMood && this.moods[storedMood]) {
            this.setMood(storedMood, false);
            this.state.isFirstVisit = false;
        } else {
            // First visit: Show Overlay
            this.showIntro();
        }

        // 2. Bind Events
        this.bindEvents();
    },

    setMood(moodId, save = true) {
        if (!this.moods[moodId]) return;

        console.log(`✨ Setting Mood: ${moodId}`);
        const theme = this.moods[moodId].theme;
        const root = document.documentElement;

        // Apply CSS Variables
        for (const [key, value] of Object.entries(theme)) {
            root.style.setProperty(key, value);
        }

        // Update State
        this.state.currentMood = moodId;

        // Update UI Classes (for specific overrides)
        document.body.className = `mood-${moodId}`;

        // Save
        if (save) localStorage.setItem('santis_mood', moodId);
    },

    showIntro() {
        const overlay = document.getElementById('santisIntro');
        if (overlay) {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Lock scroll
        }
    },

    hideIntro() {
        const overlay = document.getElementById('santisIntro');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.style.display = 'none'; // Cleanup after animation
                document.body.style.overflow = ''; // Unlock scroll
            }, 800);
        }
    },

    selectMood(moodId) {
        this.setMood(moodId);
        this.hideIntro();
    },

    bindEvents() {
        // Example: If we have a mood switcher in navbar later
        document.addEventListener('keydown', (e) => {
            // Secret Hotkeys for Demo
            if (e.ctrlKey && e.key === '1') this.setMood('relax');
            if (e.ctrlKey && e.key === '2') this.setMood('detox');
            if (e.ctrlKey && e.key === '3') this.setMood('glow');
        });
    }
};

// Auto-boot
document.addEventListener('DOMContentLoaded', () => {
    SANTIS_CORE.init();
    window.SANTIS_CORE = SANTIS_CORE;
});
