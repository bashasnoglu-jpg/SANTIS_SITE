// SANTIS PAGE BUILDER ENGINE (V5)
// Handles Block-Based Page Editing

let currentBlocks = [];
function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

window.PageBuilder = {
    init: async function () {
        console.log("🧱 PageBuilder Init...");
        await this.loadPage('home');
    },

    loadPage: async function (slug) {
        try {
            const res = await fetch(`/api/pages/${slug}`);
            const page = await res.json();
            currentBlocks = page.blocks || [];

            // If empty, add default Hero
            if (currentBlocks.length === 0) {
                currentBlocks.push({ type: 'hero', data: { title: 'Santis Club', subtitle: 'Welcome' } });
            }

            this.render();
            console.log(`🧱 Loaded ${currentBlocks.length} blocks for ${slug}`);
        } catch (e) { console.error("PB Load Error", e); }
    },

    render: function () {
        const container = document.getElementById('pb-container');
        if (!container) return;
        container.innerHTML = '';

        currentBlocks.forEach((block, idx) => {
            const el = this.createBlockElement(block, idx);
            container.appendChild(el);
        });
        this.bindEditorEvents(container);
    },

    createBlockElement: function (block, idx) {
        const div = document.createElement('div');
        div.className = 'pb-block';
        div.style = "background:#1a1a1a; margin-bottom:15px; border:1px solid #333; border-radius:8px; overflow:hidden; transition:all 0.2s;";

        // Header
        div.innerHTML = `
            <div style="background:#222; padding:10px; display:flex; justify-content:space-between; align-items:center; cursor:move;">
                <span style="font-weight:bold; color:var(--os-gold); display:flex; gap:10px; align-items:center;">
                    <span style="background:#333; width:20px; height:20px; text-align:center; border-radius:4px; font-size:10px;">${idx + 1}</span>
                    :: ${block.type.toUpperCase()}
                </span>
                <div style="display:flex; gap:5px;">
                     <button class="btn-os sm" data-pb-action="move" data-idx="${idx}" data-dir="-1" title="Yukarı">⬆</button>
                     <button class="btn-os sm" data-pb-action="move" data-idx="${idx}" data-dir="1" title="Aşağı">⬇</button>
                     <button class="btn-os sm" style="color:#ff5555; border-color:#ff5555;" data-pb-action="remove" data-idx="${idx}" title="Sil">🗑</button>
                </div>
            </div>
            <div style="padding:15px; border-top:1px solid #333;">
                ${this.getBlockForm(block, idx)}
            </div>
        `;
        return div;
    },

    getBlockForm: function (block, idx) {
        if (block.type === 'hero') {
            return `
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:10px;">
                    <input class="os-input" placeholder="Başlık" value="${escapeHtml(block.data.title || '')}" data-pb-field="title" data-idx="${idx}">
                    <input class="os-input" placeholder="Alt Başlık" value="${escapeHtml(block.data.subtitle || '')}" data-pb-field="subtitle" data-idx="${idx}">
                </div>
                <div style="display:flex; gap:10px;">
                     <input id="pb-img-${idx}" class="os-input" placeholder="Görsel (uploads/hero.jpg)" value="${escapeHtml(block.data.image || '')}" data-pb-field="image" data-idx="${idx}">
                     <button class="btn-os" data-pb-action="upload" data-idx="${idx}">📂 Görsel Seç</button>
                </div>
            `;
        }
        if (block.type === 'text') {
            return `
                <input class="os-input" placeholder="Bölüm Başlığı (Opsiyonel)" value="${escapeHtml(block.data.heading || '')}" data-pb-field="heading" data-idx="${idx}" style="margin-bottom:10px;">
                <textarea class="os-input" rows="4" placeholder="İçerik (Markdown destekli)" data-pb-field="text" data-idx="${idx}">${escapeHtml(block.data.text || '')}</textarea>
                <div class="ai-controls" style="margin-top:5px; text-align:right;">
                     <button class="btn-magic sm" data-pb-action="ai" data-idx="${idx}" data-field="text">✨ AI ile Yaz</button>
                </div>
            `;
        }
        if (block.type === 'services') {
            return `
                 <label style="color:#888; font-size:12px;">Gösterilecek Kategori</label>
                 <select class="os-input" data-pb-field="category" data-idx="${idx}">
                    <option value="all" ${block.data.category === 'all' ? 'selected' : ''}>Tümü (Karma)</option>
                    <option value="massage" ${block.data.category === 'massage' ? 'selected' : ''}>Masaj Ritüelleri</option>
                    <option value="skincare" ${block.data.category === 'skincare' ? 'selected' : ''}>Cilt Bakımı</option>
                    <option value="hammam" ${block.data.category === 'hammam' ? 'selected' : ''}>Türk Hamamı</option>
                 </select>
            `;
        }
        if (block.type === 'gallery') {
            return `
                <div style="color:#fff;">Galeri Görselleri (Virgülle veya JSON)</div>
                <textarea class="os-input" rows="2" placeholder='["img1.jpg", "img2.jpg"]' data-pb-field="images" data-idx="${idx}">${escapeHtml(block.data.images || '')}</textarea>
            `;
        }
        return `<div style="color:#666">Bilinmeyen Blok Tipi: ${block.type}</div>`;
    },

    bindEditorEvents: function (container) {
        if (container.dataset.pbBound === '1') return;
        container.dataset.pbBound = '1';

        container.addEventListener('click', function (event) {
            const actionEl = event.target.closest('[data-pb-action]');
            if (!actionEl || !container.contains(actionEl)) return;

            const idx = parseInt(actionEl.dataset.idx || '-1', 10);
            const action = actionEl.dataset.pbAction;

            if (action === 'move') {
                const dir = parseInt(actionEl.dataset.dir || '0', 10);
                if (!Number.isNaN(idx) && !Number.isNaN(dir)) {
                    window.PageBuilder.moveBlock(idx, dir);
                }
                return;
            }

            if (action === 'remove') {
                if (!Number.isNaN(idx)) {
                    window.PageBuilder.removeBlock(idx);
                }
                return;
            }

            if (action === 'upload') {
                if (!Number.isNaN(idx)) {
                    window.triggerUploadPB(idx);
                }
                return;
            }

            if (action === 'ai') {
                const field = actionEl.dataset.field || 'text';
                if (!Number.isNaN(idx)) {
                    window.generateAIForBlock(idx, field);
                }
            }
        });

        const syncField = function (event) {
            const fieldEl = event.target.closest('[data-pb-field]');
            if (!fieldEl || !container.contains(fieldEl)) return;
            const idx = parseInt(fieldEl.dataset.idx || '-1', 10);
            if (Number.isNaN(idx)) return;
            const field = fieldEl.dataset.pbField;
            if (!field) return;
            window.PageBuilder.updateData(idx, field, fieldEl.value);
        };

        container.addEventListener('input', syncField);
        container.addEventListener('change', syncField);
    },

    addBlock: function (type) {
        currentBlocks.push({ type: type, data: {} });
        this.render();
    },

    removeBlock: function (idx) {
        if (confirm('Bloğu silmek istediğinize emin misiniz?')) {
            currentBlocks.splice(idx, 1);
            this.render();
        }
    },

    moveBlock: function (idx, dir) {
        if ((idx === 0 && dir === -1) || (idx === currentBlocks.length - 1 && dir === 1)) return;

        // Swap
        const temp = currentBlocks[idx];
        currentBlocks[idx] = currentBlocks[idx + dir];
        currentBlocks[idx + dir] = temp;

        this.render();
    },

    updateData: function (idx, key, val) {
        currentBlocks[idx].data[key] = val;
    },

    save: async function () {
        const btn = document.getElementById('btn-save-pb');
        if (btn) btn.innerText = "💾 Kaydediliyor...";

        try {
            await fetch('/api/pages/home', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: "Home", blocks: currentBlocks })
            });
            if (btn) btn.innerText = "✅ Kaydedildi";
            alert("✅ Sahne Kaydedildi!");
        } catch (e) {
            console.error(e);
            alert("Kayıt Hatası");
        } finally {
            if (btn) setTimeout(() => btn.innerText = "💾 Sahneye Koy (Save)", 2000);
        }
    }
};

// Start
document.addEventListener('DOMContentLoaded', () => {
    // Only init if we are on the builder tab logic (or explicit call)
    if (document.getElementById('pb-container')) {
        PageBuilder.init();
    }
});

// --- HELPERS ---
window.triggerUploadPB = function (idx) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async e => {
        const file = e.target.files[0];
        if (!file) return;

        const fd = new FormData();
        fd.append('file', file);

        try {
            // Use existing endpoint
            const res = await fetch('/admin/upload', { method: 'POST', body: fd });
            if (res.ok) {
                const data = await res.json();
                const path = "uploads/" + data.filename;

                PageBuilder.updateData(idx, 'image', path);
                document.getElementById(`pb-img-${idx}`).value = path;
                alert("✅ Görsel Eklendi");
            }
        } catch (e) { alert("Upload Hatası"); }
    };
    input.click();
}

window.generateAIForBlock = async function (idx, field) {
    // Simplified AI call for blocks
    const prompt = "Write engaging content for this section.";
    try {
        const res = await fetch('/admin/generate-ai', {
            method: 'POST',
            body: JSON.stringify({ prompt: prompt, tone: 'luxury', length: 'medium', lang: 'tr' })
        });
        const data = await res.json();

        PageBuilder.updateData(idx, field, data.text);
        // Refresh UI
        PageBuilder.render();

    } catch (e) { alert("AI Hatası"); }
}
