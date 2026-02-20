/**
 * SANTIS CLUB - ADVANCED PRODUCT FILTERS
 * Price range, brand, category, rating filters
 */

(function () {
    'use strict';

    const FILTERS = {
        active: {
            categories: [],
            brands: [],
            priceRange: [0, 500],
            inStock: false,
            sortBy: 'featured'
        },

        init() {
            this.createFilterUI();
            this.bindEvents();
        },

        createFilterUI() {
            const container = document.getElementById('product-filters');
            if (!container) return;

            container.innerHTML = `
                <div class="filters-header">
                    <h3>Filtrele</h3>
                    <button class="filters-reset" onclick="FILTERS.reset()">Temizle</button>
                </div>

                <!-- Sort -->
                <div class="filter-group">
                    <label class="filter-label">Sırala</label>
                    <select id="filter-sort" class="filter-select">
                        <option value="featured">Öne Çıkanlar</option>
                        <option value="price-asc">Fiyat: Düşük-Yüksek</option>
                        <option value="price-desc">Fiyat: Yüksek-Düşük</option>
                        <option value="name">İsim (A-Z)</option>
                        <option value="newest">Yeni Eklenenler</option>
                    </select>
                </div>

                <!-- Price Range -->
                <div class="filter-group">
                    <label class="filter-label">
                        Fiyat Aralığı
                        <span class="filter-value" id="price-range-value">0€ - 500€</span>
                    </label>
                    <div class="price-range-inputs">
                        <input type="range" id="price-min" min="0" max="500" value="0" step="10">
                        <input type="range" id="price-max" min="0" max="500" value="500" step="10">
                    </div>
                </div>

                <!-- Categories -->
                <div class="filter-group">
                    <label class="filter-label">Kategori</label>
                    <div class="filter-checkboxes" id="filter-categories">
                        <!-- Populated by JS -->
                    </div>
                </div>

                <!-- Brands -->
                <div class="filter-group">
                    <label class="filter-label">Marka</label>
                    <div class="filter-checkboxes" id="filter-brands">
                        <!-- Populated by JS -->
                    </div>
                </div>

                <!-- Stock -->
                <div class="filter-group">
                    <label class="filter-checkbox-inline">
                        <input type="checkbox" id="filter-in-stock">
                        <span>Sadece stokta olanlar</span>
                    </label>
                </div>
            `;

            this.populateCategories();
            this.populateBrands();
        },

        populateCategories() {
            if (typeof ALL_PRODUCTS === 'undefined') return;

            // Extract unique categories (prefer subcat for Sothys collections)
            const categories = [...new Set(ALL_PRODUCTS.map(p => {
                return p.subcat || p.cat || (p.category ? p.category.tr : null);
            }).filter(Boolean))];

            const container = document.getElementById('filter-categories');

            container.innerHTML = categories.map(cat => `
                <label class="filter-checkbox">
                    <input type="checkbox" value="${cat}" onchange="FILTERS.toggleCategory('${cat}')">
                    <span>${cat}</span>
                </label>
            `).join('');
        },

        populateBrands() {
            if (typeof ALL_PRODUCTS === 'undefined') return;

            const brands = [...new Set(ALL_PRODUCTS.map(p => p.brand).filter(Boolean))];
            const container = document.getElementById('filter-brands');

            container.innerHTML = brands.map(brand => `
                <label class="filter-checkbox">
                    <input type="checkbox" value="${brand}" onchange="FILTERS.toggleBrand('${brand}')">
                    <span>${brand}</span>
                </label>
            `).join('');
        },

        toggleCategory(cat) {
            const index = this.active.categories.indexOf(cat);
            if (index > -1) {
                this.active.categories.splice(index, 1);
            } else {
                this.active.categories.push(cat);
            }
            this.apply();
        },

        toggleBrand(brand) {
            const index = this.active.brands.indexOf(brand);
            if (index > -1) {
                this.active.brands.splice(index, 1);
            } else {
                this.active.brands.push(brand);
            }
            this.apply();
        },

        updatePriceRange() {
            const min = parseInt(document.getElementById('price-min').value);
            const max = parseInt(document.getElementById('price-max').value);

            // Ensure min <= max
            if (min > max) {
                document.getElementById('price-min').value = max;
                this.active.priceRange = [max, max];
            } else {
                this.active.priceRange = [min, max];
            }

            document.getElementById('price-range-value').textContent =
                `${this.active.priceRange[0]}€ - ${this.active.priceRange[1]}€`;

            this.apply();
        },

        apply() {
            if (typeof ALL_PRODUCTS === 'undefined') return;

            let filtered = ALL_PRODUCTS;

            // Category filter
            if (this.active.categories.length > 0) {
                filtered = filtered.filter(p =>
                    this.active.categories.includes(p.category?.tr)
                );
            }

            // Brand filter
            if (this.active.brands.length > 0) {
                filtered = filtered.filter(p =>
                    this.active.brands.includes(p.brand)
                );
            }

            // Price filter
            filtered = filtered.filter(p =>
                p.price >= this.active.priceRange[0] &&
                p.price <= this.active.priceRange[1]
            );

            // Stock filter
            if (this.active.inStock) {
                filtered = filtered.filter(p => p.stock !== 'out');
            }

            // Sort
            filtered = this.sort(filtered, this.active.sortBy);

            // Render
            this.render(filtered);

            // Update count
            const count = document.getElementById('filter-count');
            if (count) {
                count.textContent = `${filtered.length} ürün`;
            }
        },

        sort(products, by) {
            const sorted = [...products];

            switch (by) {
                case 'price-asc':
                    return sorted.sort((a, b) => a.price - b.price);
                case 'price-desc':
                    return sorted.sort((a, b) => b.price - a.price);
                case 'name':
                    return sorted.sort((a, b) => a.name.tr.localeCompare(b.name.tr));
                case 'newest':
                    return sorted.reverse();
                case 'featured':
                default:
                    return sorted;
            }
        },

        render(products) {
            // Call existing render function
            if (typeof renderProducts === 'function') {
                renderProducts(products);
            }
        },

        reset() {
            this.active = {
                categories: [],
                brands: [],
                priceRange: [0, 500],
                inStock: false,
                sortBy: 'featured'
            };

            // Reset UI
            document.querySelectorAll('.filter-checkboxes input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
            });

            document.getElementById('price-min').value = 0;
            document.getElementById('price-max').value = 500;
            document.getElementById('filter-in-stock').checked = false;
            document.getElementById('filter-sort').value = 'featured';

            this.updatePriceRange();
            this.apply();
        },

        bindEvents() {
            document.addEventListener('DOMContentLoaded', () => {
                // Price range
                const priceMin = document.getElementById('price-min');
                const priceMax = document.getElementById('price-max');

                if (priceMin && priceMax) {
                    priceMin.addEventListener('input', () => this.updatePriceRange());
                    priceMax.addEventListener('input', () => this.updatePriceRange());
                }

                // Sort
                const sortSelect = document.getElementById('filter-sort');
                if (sortSelect) {
                    sortSelect.addEventListener('change', (e) => {
                        this.active.sortBy = e.target.value;
                        this.apply();
                    });
                }

                // Stock checkbox
                const stockCheckbox = document.getElementById('filter-in-stock');
                if (stockCheckbox) {
                    stockCheckbox.addEventListener('change', (e) => {
                        this.active.inStock = e.target.checked;
                        this.apply();
                    });
                }
            });
        }
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => FILTERS.init());
    } else {
        FILTERS.init();
    }

    // Expose globally
    window.FILTERS = FILTERS;

})();

/* Filter Styles */
const style = document.createElement('style');
style.textContent = `
    .filters-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 2px solid rgba(0, 0, 0, 0.08);
    }

    .filters-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
    }

    .filters-reset {
        background: none;
        border: 1px solid rgba(0, 0, 0, 0.12);
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .filters-reset:hover {
        background: rgba(0, 0, 0, 0.05);
    }

    .filter-group {
        margin-bottom: 24px;
        padding-bottom: 24px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }

    .filter-label {
        display: flex;
        justify-content: space-between;
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 12px;
        color: #202124;
    }

    .filter-value {
        font-weight: 500;
        color: #d4af37;
    }

    .filter-select {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 6px;
        font-size: 14px;
    }

    .price-range-inputs {
        display: flex;
        gap: 12px;
    }

    .price-range-inputs input[type="range"] {
        flex: 1;
        height: 6px;
        -webkit-appearance: none;
        appearance: none;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 3px;
    }

    .price-range-inputs input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        background: #d4af37;
        border-radius: 50%;
        cursor: pointer;
    }

    .filter-checkboxes {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .filter-checkbox {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-size: 14px;
    }

    .filter-checkbox input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
    }

    .filter-checkbox-inline {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-size: 14px;
    }

    .filter-checkbox-inline input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
    }
`;
document.head.appendChild(style);
