/**
 * Phase 72: Neural UX & Adaptive Navigation Engine
 * Santis OS Core: The Mind
 */

const SantisIntentEngine = {
    currentIntent: 'default',
    menuData: null,

    async init() {
        // 1. Load Headless Oracle
        try {
            const res = await fetch('/assets/data/menu.json');
            const data = await res.json();
            this.menuData = data.intents;
        } catch (e) {
            console.error("Headless Oracle (menu.json) failed to load.", e);
        }

        // 2. State Layer Check (LocalStorage for now, later Edge KV)
        const storedIntent = localStorage.getItem('santis_current_intent');
        if (storedIntent && this.menuData && this.menuData[storedIntent]) {
            this.currentIntent = storedIntent;
        }

        // 3. Bind Event Listeners for Orchestration (CustomEvent from Aurelia/Telemetry)
        window.addEventListener('santis:intent_change', (e) => {
            if (e.detail && e.detail.intent) {
                this.switchIntent(e.detail.intent);
            }
        });

        // 4. Initial Render (if different from default or if we want to force JSON render)
        // For progressive enhancement, we might just leave the static HTML menu on first load 
        // unless intent is different.
        if (this.currentIntent !== 'default') {
            this.renderNavigation(this.currentIntent);
        }
    },

    switchIntent(newIntent) {
        if (!this.menuData || !this.menuData[newIntent] || this.currentIntent === newIntent) return;

        console.log(`🧠 [INTENT ENGINE] Shifting aura to: ${newIntent}`);
        this.currentIntent = newIntent;
        localStorage.setItem('santis_current_intent', newIntent);

        // Broadcast System-wide Aura Shift
        window.dispatchEvent(new CustomEvent('santis:aura_shift', {
            detail: { theme: this.menuData[newIntent].theme_aura }
        }));

        this.renderNavigation(newIntent);
    },

    renderNavigation(intentKey) {
        const intentData = this.menuData[intentKey];
        if (!intentData) return;

        const navRoot = document.getElementById('navRoot');
        if (!navRoot) return;

        // Liquid Transition: Fade Out
        navRoot.style.transition = 'opacity 0.4s cubic-bezier(0.32, 0.72, 0, 1), transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)';
        navRoot.style.opacity = '0';
        navRoot.style.transform = 'translateY(10px)';

        setTimeout(() => {
            // Rebuild DOM
            navRoot.innerHTML = '';

            intentData.navigation.forEach(item => {
                const a = document.createElement('a');
                a.className = 'apple-link-item nav-link';
                a.href = item.url;
                a.innerText = item.label;

                if (item.action === 'open_concierge') {
                    a.onclick = (e) => { e.preventDefault(); /* open concierge logic */ };
                }

                if (item.is_highlight) {
                    a.classList.add('text-[#D4AF37]', 'font-bold');
                    // Glisten effect
                    a.style.textShadow = '0 0 10px rgba(212,175,55,0.4)';
                }

                // Append
                navRoot.appendChild(a);
            });

            // Liquid Transition: Fade In
            // Trigger reflow
            void navRoot.offsetWidth;
            navRoot.style.opacity = '1';
            navRoot.style.transform = 'translateY(0)';

            // Re-bind UI Orchestrator (Predictive pre-fetching)
            if (window.UIOrchestrator) {
                window.UIOrchestrator.bindHoverIntents();
            }

        }, 400); // 0.4s match
    }
};

document.addEventListener('DOMContentLoaded', () => SantisIntentEngine.init());
