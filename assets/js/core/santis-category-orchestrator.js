// /assets/js/core/santis-category-orchestrator.js

export class SantisCategoryOrchestrator {
    constructor() {
        this.currentCategory = 'ALL';
        this.currentRefinement = null;
        
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.bandButtons = document.querySelectorAll('.category-btn');
        this.refinementPanel = document.getElementById('refinement-panel');
        this.refinementOptionsBox = document.getElementById('refinement-options');

        if (!this.bandButtons.length || !this.refinementPanel) {
            console.warn("[Santis Category Orchestrator] UI elements not found.");
            return;
        }
        
        this.bindEvents();
        console.log("🦅 [Orchestrator] SantisCategoryOrchestrator initialized.");
    }

    bindEvents() {
        this.bandButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const selectedCategory = e.currentTarget.dataset.category;
                this.switchCategory(selectedCategory, e.currentTarget);
            });
        });
    }

    switchCategory(categoryId, targetBtn) {
        // UI Güncellemesi: Aktif butonu vurgula
        this.bandButtons.forEach(b => b.classList.remove('active'));
        targetBtn.classList.add('active');

        this.currentCategory = categoryId;
        this.currentRefinement = null; // Kategori değiştiğinde alt filtre sıfırlanır

        // SantisBus'a kategori değişti sinyali gönder
        if (window.SantisBus) {
            window.SantisBus.emit('category.changed', { category: this.currentCategory });
        }

        // Alt Filtre (Refinement) Panelini Yönet
        if (categoryId === 'ALL' || !window.SantisData) {
            this.hideRefinementPanel();
        } else {
            const hasRefinement = this.buildRefinementOptions(categoryId);
            if (hasRefinement) {
                this.showRefinementPanel();
            } else {
                this.hideRefinementPanel();
            }
        }
    }

    buildRefinementOptions(categoryId) {
        if (!window.SantisData) return false;

        const groups = window.SantisData.getFiltersForCategory(categoryId);
        this.refinementOptionsBox.innerHTML = ''; 

        if (!groups || groups.length === 0) return false;

        groups.forEach(group => {
            const groupWrap = document.createElement('div');
            groupWrap.className = 'santis-refine-group';

            const label = document.createElement('span');
            label.className = 'santis-refine-group-label';
            label.innerText = group.label;

            const optionsWrap = document.createElement('div');
            optionsWrap.className = 'santis-refine-group-options';

            group.options.forEach(option => {
                const btn = document.createElement('button');
                btn.className = 'santis-refine-btn';
                btn.innerText = option.label;
                btn.dataset.groupId = group.id;
                btn.dataset.optionId = option.id;
                btn.addEventListener('click', () => this.applyRefinement(option, group, btn));
                optionsWrap.appendChild(btn);
            });

            groupWrap.appendChild(label);
            groupWrap.appendChild(optionsWrap);
            this.refinementOptionsBox.appendChild(groupWrap);
        });

        return true;
    }

    applyRefinement(option, group, targetBtn) {
        const siblingButtons = targetBtn
            .closest('.santis-refine-group-options')
            .querySelectorAll('.santis-refine-btn');

        siblingButtons.forEach(b => b.classList.remove('active'));
        targetBtn.classList.add('active');

        this.currentRefinement = {
            groupId: group.id,
            optionId: option.id,
            label: option.label
        };

        if (window.SantisBus) {
            window.SantisBus.emit('category.refined', {
                category: this.currentCategory,
                refinement: this.currentRefinement
            });
        }
    }

    showRefinementPanel() {
        this.refinementPanel.classList.remove('hidden');
        // Kinetik motorla yavaşça belirme animasyonu eklenebilir
    }

    hideRefinementPanel() {
        this.refinementPanel.classList.add('hidden');
    }
}

// Instantiate orchestrator globally if not already bound
window.SantisCategoryOrchestratorInst = new SantisCategoryOrchestrator();
