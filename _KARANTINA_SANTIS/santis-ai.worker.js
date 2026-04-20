/**
 * SANTIS OS - PHASE 58: NEURAL WEB WORKER
 * Görev: Asenkron Niyet Analizi, Ağırlık Optimizasyonu ve Veri Karantinası
 */

class SovereignNeuralCore {
    constructor() {
        // Standart Ağırlık Matrisi
        this.weights = {
            friction: 0.25,
            velocity: 0.20,
            dwellTime: 0.25,
            jitter: 0.30 // Kararsızlık (Micro-Hesitation) ağırlığı
        };
        
        // Bağlamsal Çarpanlar (Context Multipliers)
        this.contextModifiers = {
            timeOfDay: { detox: 1.0, sleep: 1.0 },
            origin: { purify: 1.0 }
        };

        this.learningRate = 0.05;
        this.stableDataset = null; // Çöküş anında dönülecek güvenli liman
    }

    // Başlangıç verilerini (Local Storage'dan gelen) yükler
    boot(initialWeights, contextData) {
        if (initialWeights) this.weights = { ...this.weights, ...initialWeights };
        
        // Sirkadiyen Ritmi Ayarla
        const hour = contextData.hour;
        if (hour >= 6 && hour <= 11) this.contextModifiers.timeOfDay.detox = 1.3; // Sabah
        if (hour >= 21 || hour <= 3) this.contextModifiers.timeOfDay.sleep = 1.4; // Gece

        // Origin (Geliş Yolu) Ayarı
        if (contextData.origin && contextData.origin.includes("hamam")) {
            this.contextModifiers.origin.purify = 1.2;
        }

        self.postMessage({ type: 'LOG', message: 'Sovereign Core Booted. Ağırlıklar yüklendi.' });
    }

    // Kuantum Hedef Tahmini
    predict(features) {
        // Temel Skor Hesaplama (Weighted Matrix)
        let baseScore = (features.friction * this.weights.friction) +
                        (features.velocity * this.weights.velocity) +
                        (features.dwellTime * this.weights.dwellTime) +
                        (features.jitter * this.weights.jitter);

        // Niyet Çıkarımı Modeli (Örnek Mantık)
        let predictedIntent = null;
        let highestConfidence = 0;

        // Senaryo 1: Yüksek Jitter (Kararsızlık) = Relaxing / Sleep
        let sleepConfidence = baseScore * this.contextModifiers.timeOfDay.sleep;
        if (features.jitter > 0.6) sleepConfidence *= 1.5; 

        // Senaryo 2: Hızlı ve Kararlı (Düşük Friction) = Detox / Purify
        let purifyConfidence = (1 - features.friction) * this.contextModifiers.origin.purify;

        // Karar Ağacı
        if (sleepConfidence > highestConfidence && sleepConfidence > 0.7) {
            highestConfidence = sleepConfidence;
            predictedIntent = "relaxing";
        }
        if (purifyConfidence > highestConfidence && purifyConfidence > 0.7) {
            highestConfidence = purifyConfidence;
            predictedIntent = "purifying";
        }

        if (predictedIntent) {
            self.postMessage({ 
                type: 'INTENT_DETECTED', 
                intent: predictedIntent, 
                confidence: highestConfidence 
            });
        }
    }

    // Self-Learning: Geri bildirim ile ağırlıkları kalibre et
    learn(feedback) {
        const { success, dominantFeature } = feedback;
        if (success && this.weights[dominantFeature]) {
            this.weights[dominantFeature] = Math.min(1.0, this.weights[dominantFeature] + this.learningRate);
        } else if (!success && this.weights[dominantFeature]) {
            this.weights[dominantFeature] = Math.max(0.1, this.weights[dominantFeature] - this.learningRate);
        }
        
        // Yeni ağırlıkları Main Thread'e gönder (LocalStorage'a yazması için)
        self.postMessage({ type: 'WEIGHTS_UPDATED', weights: this.weights });
    }

    // Self-Healing & Quarantine Pipeline
    validateDataset(dataset) {
        if (!Array.isArray(dataset)) return false;

        let healthyNodes = [];
        let brokenCount = 0;

        dataset.forEach(node => {
            if (!node.id || !node.category || !node.media) {
                brokenCount++;
                // Karantinaya alındı (healthyNodes'a eklenmedi)
            } else {
                healthyNodes.push(node);
            }
        });

        const failureRate = brokenCount / dataset.length;

        if (failureRate > 0.3) {
            self.postMessage({ type: 'CRITICAL_ERROR', message: 'Dataset %' + (failureRate*100).toFixed(1) + ' bozuk. Stable State dönülüyor.' });
            return this.stableDataset; // God's Eye Ping atılacak
        }

        // Başarılı ise bunu yeni stabil durum olarak kaydet
        this.stableDataset = healthyNodes;
        return healthyNodes;
    }
}

const Core = new SovereignNeuralCore();

// Main Thread'den gelen mesajları dinleme
self.onmessage = function(e) {
    const { action, payload } = e.data;

    switch (action) {
        case 'BOOT':
            Core.boot(payload.weights, payload.context);
            break;
        case 'TICK': // Sürekli akan sensör verisi
            Core.predict(payload);
            break;
        case 'FEEDBACK': // Tıklama gerçekleştiğinde
            Core.learn(payload);
            break;
        case 'VALIDATE': // Yeni veri seti geldiğinde
            const cleanData = Core.validateDataset(payload);
            self.postMessage({ type: 'DATASET_READY', dataset: cleanData });
            break;
    }
};
