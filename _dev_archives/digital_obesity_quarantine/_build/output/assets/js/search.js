/**

 * SANTIS CLUB - SEARCH MODAL

 * Fuzzy search across products, services, pages

 */



(function () {

    'use strict';



    const SEARCH = {

        isOpen: false,

        results: [],

        selectedIndex: 0,



        // Search index (build from products + services)

        index: [],



        init() {

            this.createModal();

            this.bindEvents();

            this.buildIndex();

        },



        createModal() {

            const modal = document.createElement('div');

            modal.id = 'search-modal';

            modal.className = 'search-modal';

            modal.innerHTML = `

                <div class="search-modal-backdrop" onclick="SEARCH.close()"></div>

                <div class="search-modal-content">

                    <div class="search-header">

                        <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">

                            <circle cx="11" cy="11" r="8"/>

                            <path d="M21 21l-4.35-4.35"/>

                        </svg>

                        <input 

                            type="text" 

                            class="search-input" 

                            id="search-input"

                            placeholder="Ürün, hizmet veya sayfa ara..."

                            autocomplete="off"

                        />

                        <button class="search-close" onclick="SEARCH.close()" aria-label="Close">×</button>

                    </div>

                    <div class="search-results" id="search-results">

                        <div class="search-empty">

                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" opacity="0.3">

                                <circle cx="11" cy="11" r="8"/>

                                <path d="M21 21l-4.35-4.35"/>

                            </svg>

                            <p>Aramaya başlayın...</p>

                        </div>

                    </div>

                    <div class="search-footer">

                        <div class="search-hints">

                            <kbd>↑↓</kbd> Navigate

                            <kbd>↵</kbd> Select

                            <kbd>ESC</kbd> Close

                        </div>

                    </div>

                </div>

            `;



            // Add styles

            const style = document.createElement('style');

            style.textContent = `

                .search-modal {

                    position: fixed;

                    top: 0;

                    left: 0;

                    width: 100%;

                    height: 100%;

                    z-index: 9999;

                    display: none;

                    align-items: flex-start;

                    justify-content: center;

                    padding-top: 10vh;

                }



                .search-modal.active {

                    display: flex;

                }



                .search-modal-backdrop {

                    position: absolute;

                    top: 0;

                    left: 0;

                    width: 100%;

                    height: 100%;

                    background: rgba(0, 0, 0, 0.6);

                    backdrop-filter: blur(4px);

                    animation: fadeIn 0.2s ease;

                }



                @keyframes fadeIn {

                    from { opacity: 0; }

                    to { opacity: 1; }

                }



                .search-modal-content {

                    position: relative;

                    width: 90%;

                    max-width: 600px;

                    background: white;

                    border-radius: 12px;

                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

                    overflow: hidden;

                    animation: slideDown 0.3s ease;

                }



                @keyframes slideDown {

                    from {

                        opacity: 0;

                        transform: translateY(-20px);

                    }

                    to {

                        opacity: 1;

                        transform: translateY(0);

                    }

                }



                .search-header {

                    display: flex;

                    align-items: center;

                    padding: 16px 20px;

                    border-bottom: 1px solid rgba(0, 0, 0, 0.08);

                    gap: 12px;

                }



                .search-icon {

                    color: #5f6368;

                    flex-shrink: 0;

                }



                .search-input {

                    flex: 1;

                    border: none;

                    outline: none;

                    font-size: 16px;

                    color: #202124;

                }



                .search-close {

                    background: none;

                    border: none;

                    font-size: 32px;

                    color: #5f6368;

                    cursor: pointer;

                    width: 32px;

                    height: 32px;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    border-radius: 4px;

                    transition: all 0.2s;

                }



                .search-close:hover {

                    background: rgba(0, 0, 0, 0.05);

                }



                .search-results {

                    max-height: 400px;

                    overflow-y: auto;

                }



                .search-empty {

                    text-align: center;

                    padding: 60px 20px;

                    color: #5f6368;

                }



                .search-empty svg {

                    margin-bottom: 16px;

                }



                .search-result-item {

                    display: flex;

                    align-items: center;

                    padding: 12px 20px;

                    cursor: pointer;

                    transition: background 0.2s;

                    gap: 12px;

                }



                .search-result-item:hover,

                .search-result-item.selected {

                    background: rgba(212, 175, 55, 0.08);

                }



                .search-result-icon {

                    width: 40px;

                    height: 40px;

                    border-radius: 6px;

                    object-fit: cover;

                    flex-shrink: 0;

                    background: #f5f5f5;

                }



                .search-result-content {

                    flex: 1;

                }



                .search-result-title {

                    font-weight: 600;

                    font-size: 14px;

                    color: #202124;

                    margin-bottom: 2px;

                }



                .search-result-subtitle {

                    font-size: 12px;

                    color: #5f6368;

                }



                .search-result-badge {

                    padding: 4px 8px;

                    background: rgba(212, 175, 55, 0.12);

                    color: #9d7e22;

                    font-size: 11px;

                    font-weight: 600;

                    border-radius: 4px;

                }



                .search-footer {

                    padding: 12px 20px;

                    border-top: 1px solid rgba(0, 0, 0, 0.08);

                    background: #f8f9fa;

                }



                .search-hints {

                    display: flex;

                    gap: 16px;

                    font-size: 12px;

                    color: #5f6368;

                }



                .search-hints kbd {

                    padding: 2px 6px;

                    background: white;

                    border: 1px solid rgba(0, 0, 0, 0.12);

                    border-radius: 4px;

                    font-family: monospace;

                    font-size: 11px;

                }

            `;



            document.head.appendChild(style);

            document.body.appendChild(modal);

        },



        async buildIndex() {

            // Build search index from products

            try {

                if (typeof ALL_PRODUCTS !== 'undefined') {

                    this.index = ALL_PRODUCTS.map(p => ({

                        type: 'product',

                        id: p.id,

                        title: p.name.tr,

                        subtitle: p.category?.tr || 'Ürün',

                        url: `products.html#${p.slug}`,

                        image: p.img,

                        keywords: [p.name.tr, p.name.en, p.brand, p.category?.tr].filter(Boolean).join(' ')

                    }));

                }

            } catch (e) {

                console.warn('Product index failed:', e);

            }



            // Add static pages

            this.index.push(

                { type: 'page', title: 'Ana Sayfa', subtitle: 'Sayfa', url: 'index.html', image: '', keywords: 'home anasayfa' },

                { type: 'page', title: 'Hizmetler', subtitle: 'Sayfa', url: 'service.html', image: '', keywords: 'services hamam masaj' },

                { type: 'page', title: 'Ürünler', subtitle: 'Sayfa', url: 'products.html', image: '', keywords: 'products shop' },

                { type: 'page', title: 'Galeri', subtitle: 'Sayfa', url: 'gallery.html', image: '', keywords: 'gallery photos' },

                { type: 'page', title: 'Rezervasyon', subtitle: 'Sayfa', url: 'booking.html', image: '', keywords: 'booking reservation' }

            );

        },



        search(query) {

            if (!query.trim()) {

                this.results = [];

                this.render();

                return;

            }



            const q = query.toLowerCase().trim();



            // Simple fuzzy search

            this.results = this.index.filter(item => {

                const searchText = `${item.title} ${item.subtitle} ${item.keywords || ''}`.toLowerCase();

                return searchText.includes(q);

            }).slice(0, 8); // Limit to 8 results



            this.selectedIndex = 0;

            this.render();

        },



        render() {

            const container = document.getElementById('search-results');



            if (!this.results.length) {

                container.innerHTML = `

                    <div class="search-empty">

                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" opacity="0.3">

                            <circle cx="11" cy="11" r="8"/>

                            <path d="M21 21l-4.35-4.35"/>

                        </svg>

                        <p>Sonuç bulunamadı</p>

                    </div>

                `;

                return;

            }



            container.innerHTML = this.results.map((item, index) => `

                <div class="search-result-item ${index === this.selectedIndex ? 'selected' : ''}" 

                     onclick="SEARCH.select(${index})"

                     data-index="${index}">

                    ${item.image ? `<img src="${item.image}" class="search-result-icon" alt="">` :

                    `<div class="search-result-icon"></div>`}

                    <div class="search-result-content">

                        <div class="search-result-title">${item.title}</div>

                        <div class="search-result-subtitle">${item.subtitle}</div>

                    </div>

                    <span class="search-result-badge">${item.type}</span>

                </div>

            `).join('');

        },



        open() {

            this.isOpen = true;

            document.getElementById('search-modal').classList.add('active');

            document.getElementById('search-input').focus();

            document.body.style.overflow = 'hidden';

        },



        close() {

            this.isOpen = false;

            document.getElementById('search-modal').classList.remove('active');

            document.getElementById('search-input').value = '';

            this.results = [];

            this.render();

            document.body.style.overflow = '';

        },



        select(index) {

            const item = this.results[index];

            if (item) {

                window.location.href = item.url;

            }

        },



        navigateUp() {

            if (this.selectedIndex > 0) {

                this.selectedIndex--;

                this.render();

            }

        },



        navigateDown() {

            if (this.selectedIndex < this.results.length - 1) {

                this.selectedIndex++;

                this.render();

            }

        },



        bindEvents() {

            // Global keyboard shortcut (Cmd/Ctrl + K)

            document.addEventListener('keydown', (e) => {

                if ((e.metaKey || e.ctrlKey) && e.key === 'k') {

                    e.preventDefault();

                    this.open();

                }



                if (!this.isOpen) return;



                // ESC to close

                if (e.key === 'Escape') {

                    this.close();

                }



                // Arrow navigation

                if (e.key === 'ArrowDown') {

                    e.preventDefault();

                    this.navigateDown();

                }



                if (e.key === 'ArrowUp') {

                    e.preventDefault();

                    this.navigateUp();

                }



                // Enter to select

                if (e.key === 'Enter' && this.results.length) {

                    e.preventDefault();

                    this.select(this.selectedIndex);

                }

            });



            // Search input

            document.addEventListener('DOMContentLoaded', () => {

                const input = document.getElementById('search-input');

                if (input) {

                    input.addEventListener('input', (e) => {

                        this.search(e.target.value);

                    });

                }



                // Search button click (from navbar)

                const searchBtn = document.getElementById('searchBtn');

                if (searchBtn) {

                    searchBtn.addEventListener('click', () => this.open());

                }

            });

        }

    };



    // Auto-initialize

    if (document.readyState === 'loading') {

        document.addEventListener('DOMContentLoaded', () => SEARCH.init());

    } else {

        SEARCH.init();

    }



    // Expose globally

    window.SEARCH = SEARCH;



})();

