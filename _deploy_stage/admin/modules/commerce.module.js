/**
 * SANTIS OS — Commerce Module v1.0
 * Cosmetics (Sothys) & Atelier CRUD with universal item manager.
 * Phase 2 Modularization (2026.02.14)
 */
(function () {
    'use strict';

    var activeContext = null; // 'cosmetics' or 'atelier'
    var activeId = null;
    function escapeAttr(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    // --- COSMETICS (Sothys) ---
    window.initCosmetics = async function () {
        try {
            var res = await fetch('/assets/data/products-sothys.json?t=' + Date.now());
            if (!res.ok) throw new Error("Cosmetics Data Missing");
            localSothys = await res.json();
            renderCosmetics();
        } catch (e) {
            console.error("Cosmetics Error:", e);
            localSothys = [];
            renderCosmetics();
        }
    };

    window.renderCosmetics = function () {
        var tbody = document.getElementById('tbody-cosmetics');
        if (!tbody) return;
        tbody.innerHTML = '';

        localSothys.forEach(function (p) {
            var tr = document.createElement('tr');
            tr.innerHTML =
                '<td><img src="' + (p.image || '/assets/img/placeholder.png') + '" width="40" style="border-radius:4px;"></td>' +
                '<td><strong>' + p.name + '</strong><br><span style="font-size:11px; color:#888;">' + (p.benefit || '') + '</span></td>' +
                '<td><span class="badge" style="background:#222; color:#fff;">' + p.line + '</span></td>' +
                '<td>€' + p.price + '</td>' +
                '<td>' + (p.volume || '-') + '</td>' +
                '<td>' +
                '<button class="btn-os sm" data-action="item-edit" data-context="cosmetics" data-id="' + escapeAttr(p.id) + '">✏️</button>' +
                '<button class="btn-os sm danger" data-action="item-delete" data-context="cosmetics" data-id="' + escapeAttr(p.id) + '">🗑️</button>' +
                '</td>';
            tbody.appendChild(tr);
        });
    };

    // --- ATELIER (Hamam/Home) ---
    window.initAtelier = async function () {
        try {
            var res = await fetch('/assets/data/products-atelier.json?t=' + Date.now());
            if (!res.ok) throw new Error("Atelier Data Missing");
            localAtelier = await res.json();
            renderAtelier();
        } catch (e) {
            console.error("Atelier Error:", e);
            localAtelier = [];
            renderAtelier();
        }
    };

    window.renderAtelier = function () {
        var tbody = document.getElementById('tbody-atelier');
        if (!tbody) return;
        tbody.innerHTML = '';

        localAtelier.forEach(function (p) {
            var tr = document.createElement('tr');
            tr.innerHTML =
                '<td><img src="' + (p.image || '/assets/img/placeholder.png') + '" width="40" style="border-radius:4px;"></td>' +
                '<td><strong>' + p.name + '</strong><br><span style="font-size:11px; color:#888;">' + (p.desc ? p.desc.substring(0, 30) + '...' : '') + '</span></td>' +
                '<td>' + p.category + '</td>' +
                '<td>€' + p.price + '</td>' +
                '<td>' + (p.variant || '-') + '</td>' +
                '<td>' +
                '<button class="btn-os sm" data-action="item-edit" data-context="atelier" data-id="' + escapeAttr(p.id) + '">✏️</button>' +
                '<button class="btn-os sm danger" data-action="item-delete" data-context="atelier" data-id="' + escapeAttr(p.id) + '">🗑️</button>' +
                '</td>';
            tbody.appendChild(tr);
        });
    };

    // --- UNIVERSAL CRUD (Commerce Context) ---
    // Internal reference for products module delegation
    window._openCommerceModal = function (context) {
        activeContext = context;
        activeId = null;
        var modal = document.getElementById('product-modal');
        if (!modal) return;

        modal.classList.add('active');
        document.querySelectorAll('input, textarea, select').forEach(function (el) { el.value = ''; });

        var previewImg = document.getElementById('preview-img');
        if (previewImg) previewImg.src = '/assets/img/placeholder.png';

        var title = document.getElementById('modal-title');
        var catSelect = document.getElementById('inp-category');
        if (!catSelect) return;

        catSelect.innerHTML = '';

        if (context === 'cosmetics') {
            if (title) title.innerText = 'Yeni Kozmetik Formülü';
            ['hydra', 'jeunesse', 'detox', 'sun', 'men', 'body'].forEach(function (l) {
                var opt = document.createElement('option');
                opt.value = l;
                opt.innerText = l.toUpperCase();
                catSelect.appendChild(opt);
            });
        } else {
            if (title) title.innerText = 'Yeni Atölye Parçası';
            ['textile', 'hamam', 'home', 'soap', 'accessory'].forEach(function (c) {
                var opt = document.createElement('option');
                opt.value = c;
                opt.innerText = c.charAt(0).toUpperCase() + c.slice(1);
                catSelect.appendChild(opt);
            });
        }
    };

    window.editItem = function (context, id) {
        activeContext = context;
        activeId = id;
        var data = context === 'cosmetics' ? localSothys : localAtelier;
        var item = data.find(function (i) { return i.id === id; });
        if (!item) return;

        window._openCommerceModal(context);
        var modalTitle = document.getElementById('modal-title');
        if (modalTitle) modalTitle.innerText = "Düzenle: " + item.name;

        document.getElementById('inp-name').value = item.name;
        document.getElementById('inp-price').value = item.price;
        document.getElementById('inp-img').value = item.image;
        document.getElementById('inp-desc').value = item.desc || item.description || '';

        var previewImg = document.getElementById('preview-img');
        if (previewImg) previewImg.src = item.image || '/assets/img/placeholder.png';

        var catSelect = document.getElementById('inp-category');
        if (context === 'cosmetics') {
            catSelect.value = item.line;
            document.getElementById('inp-badge').value = item.benefit || '';
        } else {
            catSelect.value = item.category;
            document.getElementById('inp-badge').value = item.variant || '';
        }
    };

    window.deleteItem = async function (context, id) {
        if (!confirm("Silmek istiyor musunuz?")) return;

        try {
            if (context === 'cosmetics') {
                localSothys = localSothys.filter(function (i) { return i.id !== id; });
                await bridgeSave('assets/data/products-sothys.json', JSON.stringify(localSothys, null, 4));
                renderCosmetics();
            } else {
                localAtelier = localAtelier.filter(function (i) { return i.id !== id; });
                await bridgeSave('assets/data/products-atelier.json', JSON.stringify(localAtelier, null, 4));
                renderAtelier();
            }
            showToast("🗑️ Kayıt silindi", "success");
        } catch (e) {
            console.error(e);
            showToast("❌ Silme işlemi başarısız", "error");
        }
    };

    window.startSaveItem = async function () {
        if (!activeContext) { saveProduct(); return; }

        var name = document.getElementById('inp-name').value;
        var priceVal = document.getElementById('inp-price').value;

        if (!name || !priceVal) {
            showToast("⚠️ İsim ve Fiyat zorunludur!");
            return;
        }

        var newItem = {
            id: activeId || (activeContext + '-' + Date.now()),
            name: name,
            price: Number(priceVal),
            image: document.getElementById('inp-img').value,
            desc: document.getElementById('inp-desc').value
        };

        if (activeContext === 'cosmetics') {
            newItem.line = document.getElementById('inp-category').value;
            newItem.benefit = document.getElementById('inp-badge').value;

            if (activeId) {
                var idx = localSothys.findIndex(function (i) { return i.id === activeId; });
                if (idx > -1) localSothys[idx] = Object.assign({}, localSothys[idx], newItem);
            } else {
                localSothys.push(newItem);
            }
            await bridgeSave('assets/data/products-sothys.json', JSON.stringify(localSothys, null, 4));
            renderCosmetics();
        } else {
            newItem.category = document.getElementById('inp-category').value;
            newItem.variant = document.getElementById('inp-badge').value;

            if (activeId) {
                var idx = localAtelier.findIndex(function (i) { return i.id === activeId; });
                if (idx > -1) localAtelier[idx] = Object.assign({}, localAtelier[idx], newItem);
            } else {
                localAtelier.push(newItem);
            }
            await bridgeSave('assets/data/products-atelier.json', JSON.stringify(localAtelier, null, 4));
            renderAtelier();
        }

        closeModal();
        showToast("✅ Kayıt Başarılı");
    };

    console.log('🛒 [Module] Commerce v1.0 loaded');
})();
