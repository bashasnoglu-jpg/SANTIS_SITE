/**
 * SANTIS OS - PHASE 56: SEMANTIC QUANTUM SEARCH
 * Görev: Natural Language Processing (NLP) simülasyonu ile niyet odaklı arama.
 */
class SantisSemanticEngine {
    constructor() {
        // 1. Niyet Uzayı (Intent Space) - 4 Ana Eksen
        // Eksen Sırası: [Rahatlama (Relaxation), İyileşme (Recovery), Işıltı (Radiance), Arınma (Detox)]
        
        // 2. Kuantum Sözlük (Kelimelerin Vektörel Ağırlıkları)
        this.dictionary = {
            "yorgun": [0.8, 0.2, 0.0, 0.1], "bitkin": [0.9, 0.3, 0.0, 0.0],
            "stres": [0.9, 0.1, 0.0, 0.2],  "uykusuz": [0.7, 0.1, 0.3, 0.1],
            "gergin": [0.8, 0.4, 0.0, 0.0],
            "ağrı": [0.1, 0.9, 0.0, 0.0],   "tutulma": [0.0, 0.9, 0.0, 0.0],
            "kas": [0.2, 0.8, 0.0, 0.1],    "kaskatı": [0.1, 0.9, 0.0, 0.0],
            "boyun": [0.1, 0.9, 0.0, 0.0],  "sırt": [0.1, 0.8, 0.0, 0.0],
            "solgun": [0.0, 0.0, 0.9, 0.1], "yaşlanma": [0.0, 0.0, 0.8, 0.1],
            "kırışıklık": [0.0, 0.0, 0.9, 0.0], "cilt": [0.1, 0.0, 0.8, 0.1],
            "leke": [0.0, 0.0, 0.9, 0.1],
            "şişkin": [0.0, 0.0, 0.1, 0.9], "toksin": [0.0, 0.0, 0.1, 0.9],
            "ödem": [0.0, 0.2, 0.0, 0.9],   "ağır": [0.2, 0.2, 0.0, 0.8]
        };

        // 3. Deneyim Kataloğu (Hizmetlerin Vektörel Kimlikleri)
        this.catalog = [
            { id: "deep-tissue", name: "Derin Doku Masajı", vector: [0.2, 0.9, 0.0, 0.2] },
            { id: "aromatherapy", name: "Aromaterapi Masajı", vector: [0.9, 0.2, 0.1, 0.1] },
            { id: "gold-mask", name: "24K Altın Maske", vector: [0.1, 0.0, 0.9, 0.0] },
            { id: "ozone-sauna", name: "Ozon Sauna Detox", vector: [0.1, 0.2, 0.1, 0.9] },
            { id: "swedish", name: "İsveç Masajı", vector: [0.7, 0.6, 0.0, 0.1] }
        ];

        console.log("🌌 [Semantic Engine] Kuantum Niyet Vektörleri Yüklendi.");
    }

    vectorizeQuery(query) {
        let queryVector = [0, 0, 0, 0];
        const words = query.toLowerCase().replace(/[.,!?]/g, '').split(/\s+/);
        let matchCount = 0;

        words.forEach(word => {
            if (word.length < 2) return;
            const matchedKey = Object.keys(this.dictionary).find(key => word.includes(key));
            if (matchedKey) {
                const vec = this.dictionary[matchedKey];
                queryVector = queryVector.map((val, i) => val + vec[i]);
                matchCount++;
            }
        });

        if (matchCount === 0) return [0.25, 0.25, 0.25, 0.25];
        const max = Math.max(...queryVector);
        if (max === 0) return [0.25, 0.25, 0.25, 0.25];
        return queryVector.map(val => val / max); 
    }

    calculateSimilarity(vecA, vecB) {
        let dotProduct = 0, normA = 0, normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    search(query) {
        const userIntentVector = this.vectorizeQuery(query);
        
        const results = this.catalog.map(service => {
            const matchScore = this.calculateSimilarity(userIntentVector, service.vector);
            return { ...service, matchPercentage: (matchScore * 100).toFixed(1), score: matchScore };
        });

        return {
            intent: userIntentVector,
            results: results.sort((a, b) => b.score - a.score)
        };
    }
}

// Window üzerinden Global erişim (Sistem tarafından kullanılabilmesi için)
window.SantisSemanticEngine = SantisSemanticEngine;

// Otonom ateşleme (Eğer direkt kullanılıyorsa)
const QuantumSearch = new SantisSemanticEngine();
window.QuantumSearch = QuantumSearch;
