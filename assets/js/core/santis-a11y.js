/**
 * 🦅 SANTIS OS [V62_APEX] - SOVEREIGN A11Y ENGINE
 * Otonom Focus Trap ve Erişilebilirlik Yöneticisi
 */

export class SovereignFocusManager {
    constructor() {
        this.activeModal = null;
        this.previousFocus = null;
        this.focusableElements = [];
        this.firstFocusable = null;
        this.lastFocusable = null;
        
        this.focusableString = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';

        this.initOtonomObserver();
        this.bindEvents();
        console.log("🧿 [A11Y] Sovereign Otonom Odak Motoru (Focus Trap) Aktif.");
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    trapFocus(modalElement) {
        if (this.activeModal === modalElement) return;

        this.previousFocus = document.activeElement;
        this.activeModal = modalElement;

        // WCAG Yönergeleri: ARIA Rolleri
        this.activeModal.setAttribute('role', 'dialog');
        this.activeModal.setAttribute('aria-modal', 'true');
        
        // Arka planı ekran okuyucularına kapat (Aria-Hidden)
        const bgElements = document.querySelectorAll('header, main, footer, .v18-rail');
        bgElements.forEach(el => {
            if (!this.activeModal.contains(el)) el.setAttribute('aria-hidden', 'true');
        });

        this.refreshFocusableElements();

        if (this.focusableElements.length > 0) {
            setTimeout(() => {
                this.firstFocusable.focus();
            }, 100); // UI animasyon bitimini beklemek için tolerans
        } else {
            // Eğer odaklanacak bir şey yoksa, bizzat modal'a odaklan
            this.activeModal.setAttribute('tabindex', '-1');
            setTimeout(() => this.activeModal.focus(), 100);
        }
    }

    refreshFocusableElements() {
        if (!this.activeModal) return;
        
        const nodes = Array.from(this.activeModal.querySelectorAll(this.focusableString)).filter(el => {
            const style = window.getComputedStyle(el);
            // Elementin ve atalarının görünür olduğunu varsayıyoruz ancak en azından kendisi display:none olmamalı
            return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0;
        });

        this.focusableElements = nodes;
        if (nodes.length > 0) {
            this.firstFocusable = nodes[0];
            this.lastFocusable = nodes[nodes.length - 1];
        } else {
            this.firstFocusable = null;
            this.lastFocusable = null;
        }
    }

    releaseFocus() {
        if (!this.activeModal) return;
        
        // ARIA Temizliği
        const bgElements = document.querySelectorAll('[aria-hidden="true"]');
        bgElements.forEach(el => el.removeAttribute('aria-hidden'));

        this.activeModal = null;
        if (this.previousFocus && typeof this.previousFocus.focus === 'function') {
            this.previousFocus.focus();
        }
        this.previousFocus = null;
    }

    handleKeyDown(e) {
        if (!this.activeModal || (e.key !== 'Tab' && e.key !== 'Escape')) return;

        if (e.key === 'Escape') {
            // 🚪 Otonom Çıkış (Kapanma Simülasyonu)
            const closeBtn = this.activeModal.querySelector('.close-modal, .search-modal-backdrop, .santis-close-btn, [data-close]');
            if (closeBtn) {
                closeBtn.click();
            } else {
                this.activeModal.classList.remove('active');
                this.activeModal.style.display = 'none';
            }
            return;
        }

        // Ekranda modal içindeki DOM dinamik değiştiyse (örn Ghost card expand olduysa)
        this.refreshFocusableElements();

        if (this.focusableElements.length === 0) {
            e.preventDefault();
            return;
        }

        if (e.shiftKey) { // Shift + Tab
            if (document.activeElement === this.firstFocusable || !this.activeModal.contains(document.activeElement)) {
                this.lastFocusable.focus();
                e.preventDefault();
            }
        } else { // Tab
            if (document.activeElement === this.lastFocusable || !this.activeModal.contains(document.activeElement)) {
                this.firstFocusable.focus();
                e.preventDefault();
            }
        }
    }

    initOtonomObserver() {
        const checkModalVisibility = (el) => {
            if (!el) return false;
            const style = window.getComputedStyle(el);
            
            // Eğer Ghost (id bazlı) ise opacity 0'dan 0.15'e çıkıyor pointerEvents 'none' değil (wait: ghost-preview'da pointer-events: none kalıyor ama altındaki kartta pointer var. Focus trap Ghost Overlay için değil, asıl etkileşim açılan modal. Ghost card önizleme yapar)
            // Aslında ".santis-matrix-container", ".santis-carousel-stage" modal değildir. 
            // modal-overlay veya active className içerenler modaldir.

            // Sadece gerçekten etkileşimi bloke eden yapılar modaldir.
            const isVisible = style.display !== 'none' && style.opacity !== '0' && style.visibility !== 'hidden';
            const isActiveClass = el.classList.contains('active') || style.pointerEvents === 'auto' || style.pointerEvents === '';

            // Özel İstisna: Ghost Card Overlay (Sadece görsel atmosferdir, tabindex gerektirmez) -> BUNU GÖZ ARDI ET
            if (el.id === 'santis-ghost-overlay') return false;

            return isVisible && isActiveClass;
        };

        const targetCriteria = (el) => {
            if (!el || !el.classList) return false;
            return el.classList.contains('modal-overlay') || 
                   el.classList.contains('search-modal') || 
                   el.id === 'checkout-modal' ||
                   el.id === 'santisLangModal' ||
                   el.id === 'santis-reservation-modal' ||
                   el.id === 'availability-modal';
        };

        const observer = new MutationObserver((mutations) => {
            let newlyOpenedModal = null;
            let newlyClosedModal = false;

            mutations.forEach(mutation => {
                if (mutation.type === 'attributes' && (mutation.attributeName === 'class' || mutation.attributeName === 'style')) {
                    const el = mutation.target;
                    
                    if (targetCriteria(el)) {
                        if (checkModalVisibility(el)) {
                            newlyOpenedModal = el;
                        } else if (this.activeModal === el && !checkModalVisibility(el)) {
                            newlyClosedModal = true;
                        }
                    }
                } else if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Element
                            if (targetCriteria(node) && checkModalVisibility(node)) {
                                newlyOpenedModal = node;
                            } else {
                                const found = node.querySelector?.('.modal-overlay, #checkout-modal, #santis-reservation-modal');
                                if (targetCriteria(found) && checkModalVisibility(found)) {
                                    newlyOpenedModal = found;
                                }
                            }
                        }
                    });
                    
                    mutation.removedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            if (this.activeModal && (node === this.activeModal || node.contains(this.activeModal))) {
                                newlyClosedModal = true;
                            }
                        }
                    });
                }
            });

            if (newlyOpenedModal) {
                this.trapFocus(newlyOpenedModal);
            } else if (newlyClosedModal && !newlyOpenedModal) {
                this.releaseFocus();
            }
        });

        observer.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeFilter: ['class', 'style']
        });
    }
}
