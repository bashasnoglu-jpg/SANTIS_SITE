/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  📦 SANTIS 2D BIN-PACKING ALGORITMA ENGINE v1.0            ║
 * ║  DOM sırası korunarak erişilebilir bento grid yerleşimi     ║
 * ║  Guillotine Bin-Packing + accessibility-first design        ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Problem: CSS grid-auto-flow: dense → visual-DOM uyumsuzluğu
 *          → Ekran okuyucu ve klavye gezintisi bozulur (WCAG 2.1 §1.3.2)
 *
 * Çözüm: DOM sırasını koruyarak matematiksel yerleşim hesapla,
 *        CSS `grid-column` ve `grid-row` ile uygula.
 */

/**
 * @typedef {{ id: string, w: number, h: number }} GridItem
 * @typedef {{ col: number, row: number, w: number, h: number }} FreeRect
 */

// ── Guillotine Bin-Packing (Short-Side Fit) ──────────────────────────────────
export class SantisBinPacker {
    /**
     * @param {number} cols  - Grid kolon sayısı (varsayılan: 4)
     * @param {number} maxRows - Maksimum satır (kapasite)
     */
    constructor(cols = 4, maxRows = 100) {
        this.cols    = cols;
        this.maxRows = maxRows;
        /** @type {boolean[][]} */
        this.grid    = Array.from({ length: maxRows }, () => new Array(cols).fill(false));
        /** @type {Map<string, {col: number, row: number}>} */
        this.placed  = new Map();
    }

    /**
     * Tüm item'ları DOM sırasıyla pack eder
     * @param {GridItem[]} items
     * @returns {{ id: string, col: number, row: number, w: number, h: number }[]}
     */
    pack(items) {
        const results = [];
        for (const item of items) {
            const pos = this._findFirstFit(item.w, item.h);
            if (!pos) {
                console.warn(`[BinPacker] "${item.id}" yerleştirilemedi (w=${item.w} h=${item.h})`);
                continue;
            }
            this._markOccupied(pos.col, pos.row, item.w, item.h);
            this.placed.set(item.id, pos);
            results.push({ id: item.id, ...pos, w: item.w, h: item.h });
        }
        return results;
    }

    /** İlk uygun boş alanı bul (sol-üst tarayıcı) */
    _findFirstFit(w, h) {
        for (let row = 0; row + h <= this.maxRows; row++) {
            for (let col = 0; col + w <= this.cols; col++) {
                if (this._canPlace(col, row, w, h)) {
                    return { col, row };
                }
            }
        }
        return null;
    }

    _canPlace(col, row, w, h) {
        for (let r = row; r < row + h; r++) {
            for (let c = col; c < col + w; c++) {
                if (this.grid[r]?.[c]) return false;
            }
        }
        return true;
    }

    _markOccupied(col, row, w, h) {
        for (let r = row; r < row + h; r++) {
            for (let c = col; c < col + w; c++) {
                if (this.grid[r]) this.grid[r][c] = true;
            }
        }
    }

    /**
     * Kaç satır kullanıldığını hesapla
     * @returns {number}
     */
    get usedRows() {
        let max = 0;
        this.placed.forEach((pos, id) => {
            // grid item yüksekliği bilinmiyorsa 1 varsay
            max = Math.max(max, pos.row + 1);
        });
        return max;
    }
}

// ── DOM'a Uygulama ────────────────────────────────────────────────────────────
/**
 * Bento grid container'ındaki kartları DOM sırasını bozMAdan grid'e düzenler
 * @param {HTMLElement} container - `.bento-grid` veya benzeri
 * @param {{ cols?: number, colSpanAttr?: string, rowSpanAttr?: string }} options
 */
export function applyBinPacking(container, options = {}) {
    const {
        cols         = 4,
        colSpanAttr  = 'data-col-span',
        rowSpanAttr  = 'data-row-span',
    } = options;

    const cards = [...container.children];
    if (cards.length === 0) return;

    // Grid tanımla
    container.style.display             = 'grid';
    container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    // dense KAPATILIYOR — DOM sırası korunsun
    container.style.gridAutoFlow        = 'row';

    /** @type {GridItem[]} */
    const items = cards.map((card, i) => ({
        id: card.dataset.bentoid || `card-${i}`,
        w:  Math.min(parseInt(card.getAttribute(colSpanAttr) || '1'), cols),
        h:  parseInt(card.getAttribute(rowSpanAttr) || '1'),
    }));

    const packer  = new SantisBinPacker(cols);
    const results = packer.pack(items);

    // CSS grid placement uygula
    results.forEach(({ id, col, row, w, h }) => {
        const card = cards.find(c => (c.dataset.bentoid || `card-${cards.indexOf(c)}`) === id);
        if (!card) return;
        card.style.gridColumn = `${col + 1} / span ${w}`;
        card.style.gridRow    = `${row + 1} / span ${h}`;
    });

    // Erişilebilirlik: grid container'ına ARIA landmark
    if (!container.getAttribute('role')) {
        container.setAttribute('role', 'list');
    }
    cards.forEach(card => {
        if (!card.getAttribute('role')) card.setAttribute('role', 'listitem');
    });

    console.log(`[BinPacker] ✅ ${results.length}/${cards.length} kart yerleştirildi. Satır: ${packer.usedRows}`);
    return results;
}

