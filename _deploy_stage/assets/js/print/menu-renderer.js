/**
 * SANTIS PRINT ENGINE (Phase 80)
 * Responsibility: Render services.json into A4 HTML format
 */

console.log("🖨️ [Print Engine] Warming up...");

document.addEventListener('DOMContentLoaded', initPrint);

async function initPrint() {
    const container = document.getElementById('print-content');

    try {
        // 1. Fetch Data
        const response = await fetch('../assets/data/services.json');
        const data = await response.json();

        // 2. Normalize Data (Handle legacy vs new format)
        // Adjust based on actual JSON structure. Assuming array or object with categories.
        // Let's assume standard Santis structure: Object with keys 'massages', 'hammam', etc.
        // Or Array. Let's inspect first or write robust code.

        renderMenu(data, container);

    } catch (e) {
        console.error("Print Error:", e);
        container.innerHTML = "Error loading menu data.";
    }
}

function renderMenu(data, container) {
    // Determine Categories to print
    // We want specifically: Hammam, Massages, Skin Care

    const categories = [
        { key: 'hammam', title: 'TURKISH HAMMAM' },
        { key: 'massages', title: 'WORLD MASSAGES' },
        { key: 'skincare', title: 'SOTHYS SKINCARE' }
    ];

    // Data normalization helper (if data is array vs object)
    // Assuming data is Object { hammam: [...], massages: [...] } based on previous context
    // If it's a flat array, we filter.

    let source = data;
    // If array, we might need grouping. Let's assume Object for now as V5 standard.

    categories.forEach(cat => {
        let items = source[cat.key];

        // Fallback for array structure if needed
        if (!items && Array.isArray(source)) {
            items = source.filter(i => i.category === cat.key || i.type === cat.key);
        }

        if (items && items.length > 0) {
            const catBlock = document.createElement('div');
            catBlock.className = 'print-category';

            let html = `<h2 class="cat-title">${cat.title}</h2>`;

            items.forEach(item => {
                // Filter out internal/hidden items?
                if (item.hidden) return;

                const price = formatPrice(item.price);
                const desc = item.shortDesc || item.desc || "";

                html += `
                    <div class="print-item-wrapper">
                        <div class="print-item">
                            <span class="item-name">${item.title || item.name}</span>
                            <span class="item-price">${price}</span>
                        </div>
                        <span class="item-desc">${desc}</span>
                    </div>
                `;
            });

            catBlock.innerHTML = html;
            container.appendChild(catBlock);
        }
    });
}

function formatPrice(priceObj) {
    if (!priceObj) return '';
    if (typeof priceObj === 'number') return priceObj + ' TL';
    if (typeof priceObj === 'string') return priceObj;

    // Object { amount: 50, currency: '€' }
    if (priceObj.amount) {
        const symbol = priceObj.currency === '€' ? '€' : 'TL';
        return `${priceObj.amount} ${symbol}`;
    }
    return '';
}
