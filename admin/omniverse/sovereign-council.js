/**
 * ========================================================================
 * SOVEREIGN COUNCIL — 3-AI Layout Optimization Debate Engine
 * ========================================================================
 * Üç farklı AI persona birbirleriyle "tartışarak" en iyi layout'u bulur.
 *
 *  1. THE MERCHANT (Agresif Satıcı) — Pahalı ürünleri öne çıkar, ciro maksimize
 *  2. THE ARCHITECT (Konservatif UX'çi) — Bilişsel yükü azalt, bounce minimize
 *  3. THE ORACLE (Veri Bilimci) — Verilere göre denge kur, CVR optimize
 *
 * Her tur: 3 AI kendi layout önerisini sunar → Oracle Worker simüle eder → Kazanan seçilir
 * 
 * Usage:
 *   const council = new SovereignCouncil(bridge);
 *   council.debate(cards, config).then(winner => { ... });
 */

class SovereignCouncil {
    constructor(bridge) {
        this.bridge = bridge;
        this.rounds = 3;
        this.onDebateLog = null;   // (persona, message, type) => {}
        this.onRoundResult = null; // (round, results) => {}
        this.personas = {
            merchant: {
                name: 'THE MERCHANT',
                title: 'Agresif Satıcı',
                emoji: '💰',
                color: '#c5a059',
                strategy: 'revenue',
                description: 'Pahalı ürünleri merkeze çeker, büyütür. Ciroyu maksimize eder.'
            },
            architect: {
                name: 'THE ARCHITECT',
                title: 'Konservatif UX\'çi',
                emoji: '🏛️',
                color: '#00e5ff',
                strategy: 'ux',
                description: 'Bilişsel yükü azaltır, eşit dağılım yapar. Bounce minimizasyonu.'
            },
            oracle: {
                name: 'THE ORACLE',
                title: 'Veri Bilimci',
                emoji: '🔮',
                color: '#e879f9',
                strategy: 'balanced',
                description: 'CVR/Ciro/Bounce dengesini optimize eder. Fibonacci spiral kullanır.'
            }
        };
    }

    /**
     * Her persona kendi layout stratejisini uygular
     */
    _generateLayout(persona, cards, canvasWidth, canvasHeight) {
        const cx = canvasWidth / 2;
        const cy = canvasHeight / 2;
        const arranged = cards.map(c => ({ ...c }));

        switch (persona.strategy) {
            case 'revenue':
                // MERCHANT: Pahalı ürünleri merkeze, ucuzları kenarlara
                arranged.sort((a, b) => b.price - a.price);
                arranged.forEach((card, i) => {
                    const angle = (Math.PI * 2 * i) / arranged.length - Math.PI / 2;
                    const radius = 80 + i * 50; // Pahalılar merkeze yakın
                    card.x = cx + Math.cos(angle) * radius;
                    card.y = cy + Math.sin(angle) * radius;
                    // Pahalı kartlara ek kütle
                    card.mass = card.mass * (1 + (arranged.length - i) * 0.15);
                });
                break;

            case 'ux':
                // ARCHITECT: Eşit aralıklı grid, minimum bilişsel yük
                const cols = Math.ceil(Math.sqrt(arranged.length));
                const cellW = canvasWidth / (cols + 1);
                const cellH = canvasHeight / (Math.ceil(arranged.length / cols) + 1);
                arranged.forEach((card, i) => {
                    const col = i % cols;
                    const row = Math.floor(i / cols);
                    card.x = cellW + col * cellW;
                    card.y = cellH + row * cellH;
                    // Tüm kütleleri eşitle (eşit dikkat dağılımı)
                    card.mass = 70;
                });
                break;

            case 'balanced':
                // ORACLE: Fibonacci spiral + CVR ağırlıklı kütle
                const phi = (1 + Math.sqrt(5)) / 2;
                arranged.sort((a, b) => (b.mass * b.price) - (a.mass * a.price));
                arranged.forEach((card, i) => {
                    const angle = i * 2.39996; // Golden angle (2π/φ²)
                    const radius = 30 * Math.sqrt(i + 1);
                    card.x = cx + Math.cos(angle) * radius;
                    card.y = cy + Math.sin(angle) * radius;
                    // Fibonacci ağırlıklı kütle
                    card.mass = card.mass * (1 + 1 / (phi * (i + 1)));
                });
                break;
        }

        return arranged;
    }

    /**
     * Scoring function: CVR weight + Revenue weight - Bounce penalty
     */
    _score(stats) {
        const cvr = parseFloat(stats.cvr);
        const revenue = stats.totalRevenue;
        const bounce = stats.bounced;
        const energy = stats.totalEnergyCost;

        // Normalize and weight
        return (cvr * 100) + (revenue * 0.01) - (bounce * 0.02) - (energy * 0.001);
    }

    /**
     * Tartışma başlat — 3 AI yarışır
     */
    async debate(cards, config = {}) {
        const log = this.onDebateLog || (() => {});
        const canvasW = config.canvasWidth || 1200;
        const canvasH = config.canvasHeight || 800;

        log(null, '═══════════════════════════════════════', 'separator');
        log(null, '👑 SOVEREIGN COUNCIL TOPLANTISI BAŞLIYOR', 'header');
        log(null, '═══════════════════════════════════════', 'separator');

        const results = [];

        for (const [key, persona] of Object.entries(this.personas)) {
            log(persona, `${persona.emoji} ${persona.name} söz alıyor: "${persona.description}"`, 'speak');

            // Generate layout proposal
            const layout = this._generateLayout(persona, cards, canvasW, canvasH);
            log(persona, `Yerleşim önerisini sundu. ${layout.length} kart dizildi.`, 'action');

            // Simulate with Oracle Worker
            log(persona, 'Oracle Worker simülasyona gönderildi...', 'wait');
            const result = await this.bridge.simulate(layout, config);

            const score = this._score(result.stats);

            results.push({
                persona,
                key,
                layout,
                result,
                score
            });

            log(persona, `CVR: ${result.stats.cvr}% | Ciro: €${result.stats.totalRevenue.toLocaleString()} | Bounce: ${result.stats.bounced.toLocaleString()} | Skor: ${score.toFixed(1)}`, 'result');
        }

        // Sort by score — best first
        results.sort((a, b) => b.score - a.score);
        const winner = results[0];
        const loser = results[results.length - 1];

        log(null, '───────────────────────────────────────', 'separator');
        log(winner.persona, `🏆 KAZANAN: ${winner.persona.name} (${winner.persona.title}) — Skor: ${winner.score.toFixed(1)}`, 'winner');
        log(loser.persona, `❌ ELENEN: ${loser.persona.name} — Skor: ${loser.score.toFixed(1)}`, 'loser');
        log(null, '═══════════════════════════════════════', 'separator');

        if (this.onRoundResult) {
            this.onRoundResult(results);
        }

        return {
            winner,
            all: results,
            bestLayout: winner.layout,
            bestStats: winner.result.stats
        };
    }
}

window.SovereignCouncil = SovereignCouncil;
