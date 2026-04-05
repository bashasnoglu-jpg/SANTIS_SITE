/**
 * Santis Neural Core (V40 Edge AI - Karar Ağacı)
 * Görevi: Sensörlerden gelen vektörleri işleyip, sıradaki tıklamayı sezgisel olarak tahmin etmek.
 * Not: Sub-1MB hedefine uymak için TensorFlow yüklemek yerine statik bir Karar Ağacı (Decision Tree / Random Forest Lite) modeli kullanılmıştır.
 */

import { santisSensors } from './santis-neural-sensors.js';
import { Governor } from './santis-governor.js';

class SantisNeuralCore {
    constructor() {
        this.predictionInterval = null;
        this.confidenceThreshold = 0.85; // %85'den eminse prefetch at
        this.learnedPaths = new Map(); // Otonom öğrenme için lokal RAM hafızası (Aynı sayfayı art arda çekmemek için)
        
        console.log('🧠 [Neural Core V40] Karar Ağacı ve Synapse Motoru uyandı.');
    }

    startPredictionLoop(intervalMs = 500) {
        if (this.predictionInterval) return;
        
        // Saniyede 2 kez sensörleri oku ve matris tahmini yap
        this.predictionInterval = setInterval(() => {
            const vector = santisSensors.extractVectorState();
            this.evaluateSynapses(vector);
        }, intervalMs);
    }

    stopPredictionLoop() {
        if (this.predictionInterval) {
            clearInterval(this.predictionInterval);
            this.predictionInterval = null;
        }
    }

    /**
     * Karar Ağacı Algoritması (Heuristics tabanlı Edge AI)
     * Vektörü (v) alır ve olasılık hesaplar.
     */
    evaluateSynapses(v) {
        // Eğer fare tamamen hareketsizse ve bir hedefin üzerinde değilse boşuna matematik yapma
        if (v.v_velocity === 0 && v.v_hesitation_ms === 0 && v.v_acceleration === 0) return;

        let predictions = {};

        // ----------------------------------------------------------------
        // KURAL 1: Güçlü Duraksama (Hesitation / Intent)
        // Kullanıcı bir elementin üzerinde ne kadar uzun beklerse, o sayfaya gitme ihtimali o kadar artar
        // ----------------------------------------------------------------
        if (v.v_active_target) {
            const path = this.resolveTargetToPath(v.v_active_target);
            if (path) {
                // Her 100ms için %8 ihtimal ekle, maksimum %95'e kadar çıkabilir.
                let hesitationWeight = Math.min((v.v_hesitation_ms / 100) * 0.08, 0.95);
                predictions[path] = (predictions[path] || 0) + hesitationWeight;
            }
        }

        // ----------------------------------------------------------------
        // KURAL 2: Kinetik Niyet Eğrileri (Velocity & Acceleration)
        // Eğer kullanıcı fareyi yavaşlatıyor ve ekranda uzun süredir kalıyorsa, "Rezervasyon" veya "İletişim" arıyor olabilir
        // ----------------------------------------------------------------
        if (v.v_velocity > 0 && v.v_velocity < 0.3 && v.v_acceleration < -0.1) {
            // Yavaşlama pik yaptı, rezervasyona gitme ihtimali + %25
            predictions['/tr/booking.html'] = (predictions['/tr/booking.html'] || 0) + 0.25;
        }

        // ----------------------------------------------------------------
        // KURAL 3: Bağlamsal Zaman Dilimi (Contextual Routing)
        // Kullanıcının saati ve bekleme süresi, ilgi alanını ele verir
        // ----------------------------------------------------------------
        if (!v.v_active_target) {
            // Gece 21:00 - 04:00 arası: Uyku ve Rahatlama ritüelleri (Hamam / Derin Masaj)
            if (v.v_time >= 0.875 || v.v_time <= 0.16) {
                predictions['/tr/ritueller.html'] = (predictions['/tr/ritueller.html'] || 0) + 0.30; // Temel gece ilgi puanı
                if (v.v_session_dwell_sec > 60) {
                    predictions['/tr/ritueller.html'] += 0.60; // Gecenin bir yarısı 1 dakikadan fazla sitede duruyorsa yüksek ihtimal!
                }
            }
            // Sabah 06:00 - 12:00 arası: Canlanma (Cilt Bakımı / Yüz)
            else if (v.v_time >= 0.25 && v.v_time <= 0.5) {
                predictions['/tr/cilt-bakimi.html'] = (predictions['/tr/cilt-bakimi.html'] || 0) + 0.30;
                if (v.v_session_dwell_sec > 30) {
                    predictions['/tr/cilt-bakimi.html'] += 0.50;
                }
            }
        }

        // Kararları Ateşle
        this.executeTopPredictions(predictions);
    }

    resolveTargetToPath(targetKey) {
        // DOM üzerinden `data-neural-target` okunan hedeflerin gerçek Rotalara Mapping işlemi
        const routeMap = {
            'hamam-card': '/tr/hamam.html',
            'massage-bundle': '/tr/masaj.html',
            'sothys-skin': '/tr/cilt-bakimi.html',
            'booking-btn': '/tr/booking.html',
            'ritueller': '/tr/ritueller.html'
            // Gelecekte CMS üzerinden beslenebilir
        };
        return routeMap[targetKey] || null;
    }

    executeTopPredictions(predictions) {
        for (const [route, confidence] of Object.entries(predictions)) {
            // Eşik değeri aşılmışsa (Örn: %85+)
            if (confidence >= this.confidenceThreshold) {
                this.summonMedyum(route, Math.floor(confidence * 100));
            }
        }
    }

    summonMedyum(route, confidencePercent) {
        // V42: Governor (Üst Beyin) İzni Kontrolü
        // Yüksek ihtimal ise cooldown daha kısa (500ms), düşük ihtimal ise sistem daha şüpheci (2000ms cooldown)
        const dynamicCooldown = confidencePercent > 90 ? 500 : 2000;
        
        if (!Governor.canExecute('ai_prediction_trigger', { cooldown: dynamicCooldown })) {
            return; // Governor sistemi throttle etti. Zeka sussa ve beklese iyi olur.
        }

        // SantisOracle (Medyum V39) globalde varsa ve bu rota daha önce RAM'e alınmadıysa
        if (window.SantisOracle && typeof window.SantisOracle.prefetch === 'function') {
            if (!this.learnedPaths.has(route)) {
                
                console.log(`🧠 [Neural Core v40] Sentient Interface Algıladı: %${confidencePercent} İhtimal. Hedef: ${route}`);
                window.SantisOracle.prefetch(route, 'cold');
                
                this.learnedPaths.set(route, true);
            }
        }
    }
}

// Global Bootloader Kaydı
import { register } from '../core/santis-kernel.js';
export let NeuralCoreInstance;
register('neural_core', async () => {
    NeuralCoreInstance = new SantisNeuralCore();
    window.SANTIS.NeuralCore = NeuralCoreInstance;
    window.SantisNeuralCore = NeuralCoreInstance;
    // Bootloader güvencesinden dolayı artık 2sn'ye gerek yok, direkt Governor/Medyum hazır!
    setTimeout(() => NeuralCoreInstance.startPredictionLoop(500), 500);
}, ['medyum']);
