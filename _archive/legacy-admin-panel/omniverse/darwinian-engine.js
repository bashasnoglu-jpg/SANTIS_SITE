/**
 * ========================================================================
 * DARWINIAN INTERFACE EVOLUTION ENGINE
 * ========================================================================
 * Genetik algoritma ile arayüz tasarımlarını evrimleştirir.
 * 
 * 3 AI Breeder mutasyon üretir → Oracle Worker fitness hesaplar →
 * En kötüler ölür → En iyiler çaprazlanır → 50 nesil evrim
 *
 * Usage:
 *   const darwin = new DarwinianEngine(bridge);
 *   darwin.evolve(cards, config).then(apex => { ... });
 */

class DarwinianEngine {
    constructor(bridge) {
        this.bridge = bridge;
        this.onGeneration = null;  // (gen, best, avg, population) => {}
        this.onComplete = null;    // (apex) => {}
        this.onLog = null;         // (msg, type) => {}

        // 3 AI Breeders
        this.breeders = {
            hermes: {
                name: 'HERMES', emoji: '⚡', color: '#c5a059',
                title: 'Agresif Satıcı',
                mutate: (card, canvasW, canvasH) => ({
                    ...card,
                    x: canvasW * 0.3 + Math.random() * canvasW * 0.4,
                    y: canvasH * 0.2 + Math.random() * canvasH * 0.3,
                    mass: card.mass * (1.2 + Math.random() * 0.8)
                })
            },
            archimedes: {
                name: 'ARCHIMEDES', emoji: '🏛️', color: '#00e5ff',
                title: 'Mimar',
                mutate: (card, canvasW, canvasH, idx, total) => {
                    const phi = (1 + Math.sqrt(5)) / 2;
                    const angle = idx * (2 * Math.PI / phi);
                    const r = 50 + (canvasW * 0.25) * (idx / total);
                    return {
                        ...card,
                        x: canvasW / 2 + Math.cos(angle) * r + (Math.random() - 0.5) * 50,
                        y: canvasH / 2 + Math.sin(angle) * r + (Math.random() - 0.5) * 50,
                        mass: 60 + Math.random() * 30
                    };
                }
            },
            aurelia: {
                name: 'AURELIA', emoji: '🔮', color: '#e879f9',
                title: 'Veri Bilimci',
                mutate: (card, canvasW, canvasH, idx, total) => {
                    // F-Pattern biased: top-left heavy
                    const fX = idx < total / 2 
                        ? canvasW * 0.15 + Math.random() * canvasW * 0.35
                        : canvasW * 0.4 + Math.random() * canvasW * 0.45;
                    const fY = canvasH * 0.1 + (idx / total) * canvasH * 0.7 + (Math.random() - 0.5) * 60;
                    return {
                        ...card,
                        x: fX, y: fY,
                        mass: card.mass * (0.8 + (card.price / 200) * 0.6)
                    };
                }
            }
        };
    }

    /**
     * Fitness skoru: CVR² / (Bounce × E_cost)
     */
    _fitness(stats) {
        const cvr = parseFloat(stats.cvr) || 0.01;
        const bounce = Math.max(stats.bounced, 1);
        const energy = Math.max(stats.totalEnergyCost, 1);
        return (cvr * cvr * 10000) / (bounce * energy * 0.0001);
    }

    /**
     * Primordial Soup: İlk nesli üret
     */
    _generatePrimordialSoup(cards, populationSize, canvasW, canvasH) {
        const population = [];
        const breederKeys = Object.keys(this.breeders);

        for (let i = 0; i < populationSize; i++) {
            // Her birey rastgele bir breeder'ın mutasyonunu alır
            const bKey = breederKeys[i % breederKeys.length];
            const breeder = this.breeders[bKey];

            const individual = cards.map((card, idx) => 
                breeder.mutate(card, canvasW, canvasH, idx, cards.length)
            );

            // Ek rastgele mutasyon (çeşitlilik)
            individual.forEach(card => {
                card.x += (Math.random() - 0.5) * 80 * (i / populationSize);
                card.y += (Math.random() - 0.5) * 60 * (i / populationSize);
                card.mass *= 0.85 + Math.random() * 0.3;
                // Canvas sınırları
                card.x = Math.max(50, Math.min(canvasW - 50, card.x));
                card.y = Math.max(50, Math.min(canvasH - 50, card.y));
            });

            population.push({
                dna: individual,
                fitness: 0,
                breeder: bKey,
                generation: 0
            });
        }

        return population;
    }

    /**
     * Crossover: İki ebeveynin DNA'sını birleştir
     */
    _crossover(parent1, parent2) {
        const child = parent1.dna.map((card, i) => {
            const p2card = parent2.dna[i];
            // %50 şansla her özelliği birinden al
            return {
                ...card,
                x: Math.random() < 0.5 ? card.x : p2card.x,
                y: Math.random() < 0.5 ? card.y : p2card.y,
                mass: (card.mass + p2card.mass) / 2
            };
        });
        return child;
    }

    /**
     * Mutasyon: Küçük rastgele değişiklikler
     */
    _mutate(dna, canvasW, canvasH, mutationRate = 0.15) {
        return dna.map(card => {
            if (Math.random() < mutationRate) {
                return {
                    ...card,
                    x: Math.max(50, Math.min(canvasW - 50, card.x + (Math.random() - 0.5) * 100)),
                    y: Math.max(50, Math.min(canvasH - 50, card.y + (Math.random() - 0.5) * 80)),
                    mass: Math.max(20, card.mass * (0.8 + Math.random() * 0.4))
                };
            }
            return { ...card };
        });
    }

    /**
     * ANA EVRİM DÖNGÜSÜ
     */
    async evolve(cards, config = {}) {
        const {
            populationSize = 30,
            generations = 20,
            survivors = 6,
            botCount = 8000,
            canvasWidth = 1000,
            canvasHeight = 600,
            mutationRate = 0.15
        } = config;

        const log = this.onLog || (() => {});
        const simConfig = { botCount, canvasWidth, canvasHeight, maxTicks: 300 };

        log('═══════════════════════════════════════════', 'separator');
        log('🧬 DARWINIAN EVOLUTION ENGINE BAŞLADI', 'header');
        log(`Popülasyon: ${populationSize} | Nesil: ${generations} | Hayatta Kalan: ${survivors}`, 'info');
        log('═══════════════════════════════════════════', 'separator');

        // PHASE 1: Primordial Soup
        log('🌊 Primordial Soup: Sıfırıncı nesil üretiliyor...', 'info');
        let population = this._generatePrimordialSoup(cards, populationSize, canvasWidth, canvasHeight);

        let allTimeBest = null;
        const fitnessHistory = [];

        // PHASE 2: Evolution Loop
        for (let gen = 0; gen < generations; gen++) {
            log(`── GEN ${gen + 1}/${generations} ──────────────────────────`, 'gen');

            // Evaluate fitness for each individual
            for (let i = 0; i < population.length; i++) {
                const individual = population[i];
                try {
                    const result = await this.bridge.simulate(individual.dna, simConfig);
                    individual.fitness = this._fitness(result.stats);
                    individual.stats = result.stats;
                    individual.heatmap = result.heatmap;
                } catch (e) {
                    individual.fitness = 0;
                }
            }

            // Sort by fitness (best first)
            population.sort((a, b) => b.fitness - a.fitness);

            const best = population[0];
            const avg = population.reduce((s, p) => s + p.fitness, 0) / population.length;
            const worst = population[population.length - 1];

            fitnessHistory.push({ gen: gen + 1, best: best.fitness, avg });

            log(`🏆 En İyi: ${best.fitness.toFixed(1)} (${this.breeders[best.breeder]?.name || 'Hybrid'}) | CVR: ${best.stats?.cvr || '?'}%`, 'best');
            log(`📊 Ortalama: ${avg.toFixed(1)} | En Kötü: ${worst.fitness.toFixed(1)}`, 'avg');

            // Track all-time best
            if (!allTimeBest || best.fitness > allTimeBest.fitness) {
                allTimeBest = { ...best, generation: gen + 1 };
            }

            // Callback
            if (this.onGeneration) {
                this.onGeneration(gen + 1, best, avg, population);
            }

            // THE BLOODBATH: Kill worst, keep survivors
            const elite = population.slice(0, survivors);
            log(`☠️ ${population.length - survivors} zayıf tasarım ÖLDÜRÜLDÜ.`, 'kill');

            // CROSSOVER & MUTATION: Breed new generation
            const newPop = [...elite]; // Elitler direkt hayatta kalır

            while (newPop.length < populationSize) {
                // Tournament selection: rastgele 2 ebeveyn seç
                const p1 = elite[Math.floor(Math.random() * elite.length)];
                const p2 = elite[Math.floor(Math.random() * elite.length)];

                const childDna = this._crossover(p1, p2);
                const mutatedDna = this._mutate(childDna, canvasWidth, canvasHeight, mutationRate);

                newPop.push({
                    dna: mutatedDna,
                    fitness: 0,
                    breeder: 'hybrid',
                    generation: gen + 1
                });
            }

            population = newPop;
            log(`🧬 ${populationSize - survivors} yeni melez birey doğdu. Nesil ${gen + 2} hazır.`, 'breed');
        }

        // PHASE 3: Results
        log('═══════════════════════════════════════════', 'separator');
        log(`🦅 EVRİM TAMAMLANDI! ${generations} Nesil Boyunca Doğal Seçilim Uygulandı.`, 'header');
        log(`🏆 APEX PREDATOR: Fitness ${allTimeBest.fitness.toFixed(1)} | Gen ${allTimeBest.generation} | CVR: ${allTimeBest.stats?.cvr}%`, 'apex');
        log('═══════════════════════════════════════════', 'separator');

        const apex = {
            layout: allTimeBest.dna,
            stats: allTimeBest.stats,
            heatmap: allTimeBest.heatmap,
            fitness: allTimeBest.fitness,
            generation: allTimeBest.generation,
            fitnessHistory
        };

        if (this.onComplete) this.onComplete(apex);

        return apex;
    }
}

window.DarwinianEngine = DarwinianEngine;
