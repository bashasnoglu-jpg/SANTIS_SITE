/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ♿ SANTIS MEGA MENU — WAI-ARIA Klavye Navigasyonu v1.0    ║
 * ║  WCAG 2.1 §4.1.3 + ARIA Authoring Practices Guide (APG)   ║
 * ║  Enter/Space: aç · Ok Tuşları: gezin · Esc: kapat         ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * ARIA Pattern: "Disclosure Navigation Menu"
 * Referans: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
 *
 * Kullanım:
 *   <nav id="santis-main-nav" aria-label="Ana Navigasyon">
 *     <ul>
 *       <li>
 *         <button aria-expanded="false" aria-controls="panel-hamam">Hamam</button>
 *         <div id="panel-hamam" role="region" aria-label="Hamam Menüsü" hidden>
 *           <a href="/hamam">Sultan Hamamı</a>
 *           <a href="/hamam/ritual">Hamam Ritüeli</a>
 *         </div>
 *       </li>
 *     </ul>
 *   </nav>
 */

// ── Sabitler ──────────────────────────────────────────────────────────────────
const KEYS = {
    ENTER:     'Enter',
    SPACE:     ' ',
    ESCAPE:    'Escape',
    TAB:       'Tab',
    ARROW_UP:  'ArrowUp',
    ARROW_DN:  'ArrowDown',
    ARROW_RT:  'ArrowRight',
    ARROW_LT:  'ArrowLeft',
    HOME:      'Home',
    END:       'End',
};

// ── 1. MEGA MENÜ SINIFI ───────────────────────────────────────────────────────
class SantisMegaMenu {
    /**
     * @param {HTMLElement} nav - <nav> veya <ul> container
     * @param {{ closeOnOutsideClick?: boolean, hoverDelay?: number }} opts
     */
    constructor(nav, opts = {}) {
        this.nav            = nav;
        this.closeOnOutside = opts.closeOnOutsideClick ?? true;
        this.hoverDelay     = opts.hoverDelay ?? 120; // ms

        /** @type {HTMLButtonElement[]} - Tüm trigger butonları */
        this.triggers = [...nav.querySelectorAll('[aria-expanded]')];
        /** @type {Map<HTMLButtonElement, HTMLElement>} */
        this.panels   = new Map();

        this._init();
    }

    _init() {
        // Her trigger'ı panel ile eşle
        this.triggers.forEach(btn => {
            const panelId = btn.getAttribute('aria-controls');
            const panel   = panelId ? document.getElementById(panelId) : null;
            if (!panel) return;

            this.panels.set(btn, panel);

            // Başlangıç ARIA durumu
            this._ensureAria(btn, panel);

            // Klavye olayları
            btn.addEventListener('keydown', e => this._onTriggerKeydown(e, btn));

            // Panel içindeki focusable elemanlara gezinme
            panel.addEventListener('keydown', e => this._onPanelKeydown(e, btn, panel));

            // Hover (isteğe bağlı, prefers-reduced-motion'a dikkat et)
            if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                let timer;
                btn.addEventListener('mouseenter', () => {
                    clearTimeout(timer);
                    timer = setTimeout(() => this._open(btn), this.hoverDelay);
                });
                btn.addEventListener('mouseleave', () => {
                    clearTimeout(timer);
                    timer = setTimeout(() => {
                        if (!panel.matches(':focus-within')) this._close(btn);
                    }, this.hoverDelay * 2);
                });
                panel.addEventListener('mouseleave', () => {
                    timer = setTimeout(() => {
                        if (!btn.matches(':hover')) this._close(btn);
                    }, this.hoverDelay * 2);
                });
            }
        });

        // Dışarı tıklayınca kapat
        if (this.closeOnOutside) {
            document.addEventListener('click', e => {
                if (!this.nav.contains(e.target)) this._closeAll();
            });

            document.addEventListener('focusin', e => {
                if (!this.nav.contains(e.target)) this._closeAll();
            });
        }
    }

    /** ARIA attr'larını garanti et */
    _ensureAria(btn, panel) {
        if (!btn.id) btn.id = `nav-btn-${Math.random().toString(36).slice(2, 7)}`;
        panel.setAttribute('aria-labelledby', btn.id);
        if (!panel.getAttribute('role')) panel.setAttribute('role', 'region');

        // Başlangıçta kapalı
        btn.setAttribute('aria-expanded', 'false');
        panel.hidden = true;
    }

    // ── Panel Aç/Kapat ────────────────────────────────────────────────────────
    _open(btn) {
        // Diğerlerini kapat
        this.triggers.forEach(t => { if (t !== btn) this._close(t); });

        const panel = this.panels.get(btn);
        if (!panel) return;

        btn.setAttribute('aria-expanded', 'true');
        panel.hidden = false;

        // İlk odaklanabilir elemana focus
        const firstFocusable = this._focusables(panel)[0];
        firstFocusable?.focus();

        // Kernel EventBus
        this._emit('megamenu:open', { trigger: btn, panel });
    }

    _close(btn) {
        const panel = this.panels.get(btn);
        if (!panel) return;

        btn.setAttribute('aria-expanded', 'false');
        panel.hidden = true;
        this._emit('megamenu:close', { trigger: btn, panel });
    }

    _closeAll() {
        this.triggers.forEach(btn => this._close(btn));
    }

    _toggle(btn) {
        btn.getAttribute('aria-expanded') === 'true'
            ? this._close(btn)
            : this._open(btn);
    }

    // ── Klavye: Trigger Button ────────────────────────────────────────────────
    _onTriggerKeydown(e, btn) {
        switch (e.key) {
            case KEYS.ENTER:
            case KEYS.SPACE:
                e.preventDefault();
                this._toggle(btn);
                break;

            case KEYS.ESCAPE:
                this._close(btn);
                btn.focus();
                break;

            case KEYS.ARROW_DN:
                // Panel açık → içine gir
                e.preventDefault();
                if (btn.getAttribute('aria-expanded') === 'true') {
                    this._focusFirst(this.panels.get(btn));
                } else {
                    this._open(btn);
                }
                break;

            case KEYS.ARROW_UP:
                // Panel açık → son elemana git
                e.preventDefault();
                if (btn.getAttribute('aria-expanded') === 'true') {
                    this._focusLast(this.panels.get(btn));
                }
                break;

            case KEYS.ARROW_RT:
            case KEYS.ARROW_LT: {
                // Yatay nav: sonraki/önceki trigger'a geç
                e.preventDefault();
                const dir  = e.key === KEYS.ARROW_RT ? 1 : -1;
                const idx  = this.triggers.indexOf(btn);
                const next = this.triggers[(idx + dir + this.triggers.length) % this.triggers.length];
                next?.focus();
                break;
            }

            case KEYS.HOME:
                e.preventDefault();
                this.triggers[0]?.focus();
                break;

            case KEYS.END:
                e.preventDefault();
                this.triggers[this.triggers.length - 1]?.focus();
                break;

            case KEYS.TAB:
                // Tab ile çıkınca paneli kapat
                this._close(btn);
                break;
        }
    }

    // ── Klavye: Panel İçi ────────────────────────────────────────────────────
    _onPanelKeydown(e, triggerBtn, panel) {
        const items = this._focusables(panel);
        const idx   = items.indexOf(document.activeElement);

        switch (e.key) {
            case KEYS.ESCAPE:
                e.preventDefault();
                this._close(triggerBtn);
                triggerBtn.focus();  // Focus trigger'a döner
                break;

            case KEYS.ARROW_DN: {
                e.preventDefault();
                const next = items[(idx + 1) % items.length];
                next?.focus();
                break;
            }

            case KEYS.ARROW_UP: {
                e.preventDefault();
                const prev = items[(idx - 1 + items.length) % items.length];
                prev?.focus();
                break;
            }

            case KEYS.HOME:
                e.preventDefault();
                items[0]?.focus();
                break;

            case KEYS.END:
                e.preventDefault();
                items[items.length - 1]?.focus();
                break;

            case KEYS.TAB:
                // Tab ile panelden çıkınca kapat
                if (!e.shiftKey && idx === items.length - 1) {
                    this._close(triggerBtn);
                } else if (e.shiftKey && idx === 0) {
                    e.preventDefault();
                    this._close(triggerBtn);
                    triggerBtn.focus();
                }
                break;
        }
    }

    // ── Yardımcılar ───────────────────────────────────────────────────────────
    _focusables(container) {
        return [
            ...container.querySelectorAll(
                'a[href], button:not([disabled]), input:not([disabled]), ' +
                'select:not([disabled]), textarea:not([disabled]), ' +
                '[tabindex]:not([tabindex="-1"])'
            )
        ].filter(el => !el.closest('[hidden]') && !el.closest('[aria-hidden="true"]'));
    }

    _focusFirst(panel) { this._focusables(panel)[0]?.focus(); }
    _focusLast(panel)  { const f = this._focusables(panel); f[f.length - 1]?.focus(); }

    _emit(event, detail) {
        const bus = globalThis.__SANTIS__?.services?.bus ?? window.SantisEventBus;
        bus?.emit(event, detail);
    }
}

// ── 2. CSS: Mega Menü Görsel Stillerini Çek (Co-located) ─────────────────────
function injectMegaMenuCSS() {
    if (document.getElementById('santis-megamenu-css')) return;
    const style = document.createElement('style');
    style.id    = 'santis-megamenu-css';
    style.textContent = `
        /* Panel açılma animasyonu */
        [role="region"]:not([hidden]) {
            animation: nvMenuReveal 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes nvMenuReveal {
            from { opacity: 0; transform: translateY(-6px); }
            to   { opacity: 1; transform: translateY(0);    }
        }

        /* Reduced motion: animasyon kaldır */
        @media (prefers-reduced-motion: reduce) {
            [role="region"]:not([hidden]) {
                animation: none;
            }
        }

        /* Focus ring: trigger butonları */
        [aria-expanded]:focus-visible {
            outline: 2px solid var(--clr-gold, #D4AF37);
            outline-offset: 3px;
            border-radius: 4px;
        }

        /* Panel focus-within: aktif hissini koru */
        [aria-expanded="true"] {
            color: var(--clr-gold, #D4AF37);
        }
    `;
    document.head.appendChild(style);
}

// ── 3. GLOBAL BAŞLATICI ──────────────────────────────────────────────────────
/**
 * Sayfadaki tüm mega menüleri başlat
 * @param {string} selector - Nav container selector
 */
export function initMegaMenu(selector = '#santis-main-nav, [data-megamenu]') {
    injectMegaMenuCSS();

    const navElements = document.querySelectorAll(selector);
    if (navElements.length === 0) {
        console.debug('[MegaMenu] Selector bulunamadı:', selector);
        return [];
    }

    const menus = [...navElements].map(nav => new SantisMegaMenu(nav, {
        closeOnOutsideClick: true,
        hoverDelay: 120,
    }));

    console.log(`[MegaMenu WAI-ARIA v1.0] ✅ ${menus.length} menü başlatıldı.`);
    console.log('  Enter/Space: aç · ↑↓: gezin · Esc: kapat · ←→: trigger geç');
    return menus;
}

export { SantisMegaMenu };
