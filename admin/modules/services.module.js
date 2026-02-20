/**
 * SANTIS OS — Services Module v1.0
 * Service CRUD, table rendering.
 * Phase 2 Modularization (2026.02.14)
 */
(function () {
    'use strict';

    var editingSvcId = null;
    function escapeAttr(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    window.initServices = async function () {
        try {
            console.log("🌍 Fetching Service Data...");
            var response = await fetch('/assets/data/services.json?t=' + Date.now());
            if (!response.ok) throw new Error("HTTP Error " + response.status);

            window.SERVICE_DATA = await response.json();
            console.log("✅ Services Loaded:", window.SERVICE_DATA.length);

            localServices = window.SERVICE_DATA;
            renderServiceTable(localServices);
        } catch (e) {
            console.warn("⚠️ Service Sync Error (Offline Mode?):", e);
            if (window.productCatalog && window.productCatalog.length > 0) {
                console.log("♻️ Using Fallback Catalog:", window.productCatalog.length);
                window.SERVICE_DATA = window.productCatalog;
                renderServiceTable(window.SERVICE_DATA);
            } else {
                var el = document.getElementById('service-list-body');
                if (el) el.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Veri yüklenemedi (Sunucu kapalı olabilir).</td></tr>';
            }
        }
    };

    window.renderServiceTable = function (services) {
        services = services || localServices;
        var tbody = document.getElementById('service-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        localServices.forEach(function (svc) {
            var title = (svc.content && svc.content.tr) ? svc.content.tr.title : svc.name;
            var price = svc.price ? svc.price.amount + ' ' + svc.price.currency : '-';

            var tr = document.createElement('tr');
            tr.innerHTML =
                '<td>' + svc.categoryId + '</td>' +
                '<td><strong>' + title + '</strong></td>' +
                '<td>' + svc.duration + ' dk / ' + price + '</td>' +
                '<td>' + ((svc.tags && svc.tags.includes('SPECIAL')) ? '🔥' : '-') + '</td>' +
                '<td>' +
                '<button class="btn-os sm" data-action="service-edit" data-id="' + escapeAttr(svc.id) + '">✏️</button>' +
                '<button class="btn-os sm danger" data-action="service-delete" data-id="' + escapeAttr(svc.id) + '">🗑️</button>' +
                '</td>';
            tbody.appendChild(tr);
        });
    };

    window.openServiceModal = function () {
        editingSvcId = null;
        var modal = document.getElementById('service-modal');
        if (modal) modal.classList.add('active');
        document.querySelectorAll('#service-modal input, #service-modal textarea').forEach(function (e) { e.value = ''; });
    };

    window.closeServiceModal = function () {
        var modal = document.getElementById('service-modal');
        if (modal) modal.classList.remove('active');
    };

    window.saveService = async function () {
        var title = document.getElementById('svc-title').value;
        var desc = document.getElementById('svc-desc').value;
        var type = document.getElementById('svc-type').value;

        var catId = 'massage-classic';
        if (type === 'hammam') catId = 'massage-classic';
        if (type === 'skincare') catId = 'care-sothys';

        var newSvc = {
            id: editingSvcId || slugify(title),
            categoryId: catId,
            duration: parseInt(document.getElementById('svc-duration').value) || 60,
            price: { amount: parseInt(document.getElementById('svc-price').value) || 0, currency: '€' },
            media: { hero: 'default.jpg' },
            content: {
                tr: { title: title, shortDesc: desc, fullDesc: desc },
                en: { title: title, shortDesc: desc, fullDesc: desc },
                ru: { title: title, shortDesc: desc, fullDesc: desc }
            },
            tags: []
        };

        if (editingSvcId) {
            var idx = localServices.findIndex(function (s) { return s.id == editingSvcId; });
            if (idx > -1) localServices[idx] = Object.assign({}, localServices[idx], newSvc);
        } else {
            localServices.push(newSvc);
        }

        renderServiceTable();
        closeServiceModal();
        await saveToServer("assets/data/services.json", localServices, null, true);
    };

    window.editService = function (id) {
        editingSvcId = id;
        var s = localServices.find(function (i) { return i.id == id; });
        if (!s) return;

        openServiceModal();
        document.getElementById('svc-title').value = s.content.tr.title;
        document.getElementById('svc-duration').value = s.duration;
        document.getElementById('svc-price').value = s.price.amount;
        document.getElementById('svc-desc').value = s.content.tr.shortDesc;
    };

    window.deleteService = function (id) {
        if (confirm("Hizmeti silmek istiyor musunuz?")) {
            localServices = localServices.filter(function (s) { return s.id != id; });
            renderServiceTable();
            saveToServer("assets/data/services.json", localServices, null, true);
        }
    };

    console.log('💆 [Module] Services v1.0 loaded');
})();
