/**
 * SANTIS OS — Products Module v1.0
 * Product catalog CRUD, table rendering, export.
 * Phase 2 Modularization (2026.02.14)
 */
(function () {
    'use strict';

    var editingId = null;
    function escapeAttr(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    // --- TABLE RENDERING ---
    window.renderTable = function () {
        var tbody = document.getElementById('table-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        var sorted = [].concat(localCatalog).sort(function (a, b) { return b.id - a.id; });

        sorted.forEach(function (p) {
            var tr = document.createElement('tr');
            tr.innerHTML =
                '<td><img src="../assets/img/cards/' + ((p.img && p.img !== 'undefined') ? p.img : 'santis_card_products_lux.png') + '" data-fallback-src="https://placehold.co/40x40?text=?" width="40"></td>' +
                '<td><strong>' + p.name + '</strong></td>' +
                '<td>' + (p.cat || p.category) + '</td>' +
                '<td>' + p.price + '</td>' +
                '<td>' + (p.badge ? '<span style="color:#d4af37">' + p.badge + '</span>' : '-') + '</td>' +
                '<td>' +
                '<button class="btn-os sm" data-action="product-view" data-id="' + escapeAttr(p.id) + '" data-cat="' + escapeAttr(p.cat || p.category || '') + '">👁️</button>' +
                '<button class="btn-os sm" data-action="product-edit" data-id="' + escapeAttr(p.id) + '">✏️</button>' +
                '<button class="btn-os sm danger" data-action="product-delete" data-id="' + escapeAttr(p.id) + '">🗑️</button>' +
                '</td>';
            tbody.appendChild(tr);
        });
        updateStats();
    };

    window.updateStats = function () {
        var elTotal = document.getElementById('total-count');
        var elCat = document.getElementById('cat-count');

        if (elTotal) elTotal.innerText = localCatalog.length;
        if (elCat) {
            var cats = new Set(localCatalog.map(function (p) { return p.cat || p.category; }));
            elCat.innerText = cats.size;
        }
    };

    // --- PRODUCT VIEW ---
    window.updateProductView = function () {
        if (window.renderTable && typeof window.renderTable === 'function') {
            window.renderTable();
        }
    };

    // --- MODAL (Product-specific) ---
    // Note: openModal with context is in commerce.module.js
    // This handles the basic product modal without context
    window.openModal = function (context) {
        // If context is provided, delegate to commerce module
        if (context && (context === 'cosmetics' || context === 'atelier')) {
            if (window._openCommerceModal) {
                window._openCommerceModal(context);
            }
            return;
        }

        editingId = null;
        var modal = document.getElementById('product-modal');
        if (modal) {
            modal.classList.add('active');
            modal.querySelectorAll('input, textarea').forEach(function (el) { el.value = ''; });
        }
    };

    window.closeModal = function () {
        document.getElementById('product-modal')?.classList.remove('active');
    };

    // --- CRUD ---
    window.saveProduct = async function () {
        var data = {
            name: document.getElementById('inp-name').value,
            category: document.getElementById('inp-category').value,
            cat: document.getElementById('inp-category').value,
            price: document.getElementById('inp-price').value,
            image: document.getElementById('inp-img').value,
            img: document.getElementById('inp-img').value,
            badge: document.getElementById('inp-badge').value,
            description: document.getElementById('inp-desc').value,
            desc: document.getElementById('inp-desc').value
        };

        if (!data.name) { alert("Ürün adı zorunludur!"); return; }

        if (editingId) {
            var idx = localCatalog.findIndex(function (p) { return p.id == editingId; });
            if (idx > -1) localCatalog[idx] = Object.assign({}, localCatalog[idx], data);
        } else {
            var newId = localCatalog.length > 0 ? Math.max.apply(null, localCatalog.map(function (p) { return p.id; })) + 1 : 1;
            localCatalog.push(Object.assign({ id: newId }, data));
        }

        renderTable();
        closeModal();
        saveToServer("assets/data/product-data.json", localCatalog, "productCatalog");
    };

    window.editProduct = function (id) {
        editingId = id;
        var p = localCatalog.find(function (item) { return item.id == id; });
        if (!p) return;

        openModal();
        document.getElementById('inp-name').value = p.name;
        document.getElementById('inp-category').value = p.cat || p.category;
        document.getElementById('inp-price').value = p.price;
        document.getElementById('inp-img').value = p.img || p.image;
        document.getElementById('inp-badge').value = p.badge || "";
        document.getElementById('inp-desc').value = p.desc || p.description;
    };

    window.deleteProduct = function (id) {
        if (confirm("Silmek istiyor musunuz?")) {
            localCatalog = localCatalog.filter(function (p) { return p.id != id; });
            renderTable();
            saveToServer("assets/data/product-data.json", localCatalog, "productCatalog");
        }
    };

    window.viewOnSite = function (id, cat) {
        var folder = 'urunler';
        if (cat.includes('face') || cat.includes('cilt')) folder = 'cilt-bakimi';
        else if (cat.includes('body') || cat.includes('mass') || cat.includes('masaj')) folder = 'masajlar';
        else if (cat.includes('ham')) folder = 'hamam';

        window.open('../tr/' + folder + '/index.html#product-' + id, '_blank');
    };

    // --- EXPORT ---
    window.exportData = function () {
        var dataStr = "const productCatalog = " + JSON.stringify(localCatalog, null, 2) + ";";
        downloadUTF8(dataStr, "product-data.js", "application/javascript");
    };

    console.log('📦 [Module] Products v1.0 loaded');
})();
