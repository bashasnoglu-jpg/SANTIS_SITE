/**
 * ========================================================================
 * UX GRAVITY ENGINE — CORE: SPATIAL HASH GRID
 * O(n) Performanslı Uzaysal Ağ Motoru
 * ========================================================================
 * 50.000 botu 60 FPS'de çalıştıran sihir burada.
 * Her bot sadece kendi hücresindeki ürünlerle etkileşir → O(n*m) → O(n)
 */

export class SpatialHashGrid {
    constructor(width, height, cellSize = 200) {
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.grid = new Map();
    }

    _key(col, row) {
        return `${col},${row}`;
    }

    _cellFor(x, y) {
        return {
            col: Math.floor(x / this.cellSize),
            row: Math.floor(y / this.cellSize)
        };
    }

    clear() {
        this.grid.clear();
    }

    insert(entity) {
        const { col, row } = this._cellFor(entity.x, entity.y);
        const key = this._key(col, row);
        if (!this.grid.has(key)) this.grid.set(key, []);
        this.grid.get(key).push(entity);
    }

    query(x, y, radius) {
        const results = [];
        const minCell = this._cellFor(x - radius, y - radius);
        const maxCell = this._cellFor(x + radius, y + radius);

        for (let col = minCell.col; col <= maxCell.col; col++) {
            for (let row = minCell.row; row <= maxCell.row; row++) {
                const key = this._key(col, row);
                const cell = this.grid.get(key);
                if (cell) {
                    for (const entity of cell) {
                        const dx = entity.x - x;
                        const dy = entity.y - y;
                        if (dx * dx + dy * dy <= radius * radius) {
                            results.push(entity);
                        }
                    }
                }
            }
        }
        return results;
    }

    resize(width, height) {
        this.cols = Math.ceil(width / this.cellSize);
        this.rows = Math.ceil(height / this.cellSize);
    }
}

/**
 * ========================================================================
 * GRAVITY PHYSICS ENGINE
 * Ters Kare Kanunu + Kütle Çekim + Sürtünme + Olay Ufku
 * ========================================================================
 */
export class GravityPhysics {
    constructor(config = {}) {
        this.G = config.gravitationalConstant || 80;
        this.friction = config.friction || 0.94;
        this.eventHorizonMultiplier = config.eventHorizonMultiplier || 0.5;
    }

    /**
     * Bir bot için en güçlü çekim kaynağını hesapla ve hız vektörünü güncelle.
     * @returns {object|null} Eğer bot olay ufkuna girdiyse yakalanan ürün, yoksa null
     */
    applyGravity(bot, products) {
        let bestPull = 0;
        let bestTarget = null;
        let capturedBy = null;

        for (const product of products) {
            const dx = product.x - bot.x;
            const dy = product.y - bot.y;
            const distSq = dx * dx + dy * dy;
            const dist = Math.max(Math.sqrt(distSq), 10);

            // Ters Kare Kanunu: F = G * mass / r²
            const pull = (this.G * product.mass) / distSq;

            // Olay Ufku kontrolü: Ürünün çekim yarıçapının içine giren bot "dönüşmüş" sayılır
            const eventHorizon = product.radius * this.eventHorizonMultiplier;
            if (dist < eventHorizon) {
                capturedBy = product;
                bot.active = false;
                break;
            }

            if (pull > bestPull) {
                bestPull = pull;
                bestTarget = { dx, dy, dist, pull };
            }
        }

        // Hız vektörü güncelleme
        if (bestTarget && bot.active) {
            bot.vx += (bestTarget.dx / bestTarget.dist) * bestTarget.pull;
            bot.vy += (bestTarget.dy / bestTarget.dist) * bestTarget.pull;
        }

        // Sürtünme
        bot.vx *= this.friction;
        bot.vy *= this.friction;

        // Pozisyon güncelleme
        bot.x += bot.vx;
        bot.y += bot.vy;

        return capturedBy;
    }
}
