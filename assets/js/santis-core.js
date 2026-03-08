/**
 * SANTIS OS - THE QUANTUM BOOTLOADER (V6)
 * Tüm sistemleri uyanır uyanmaz birleştiren ve orkestra şefliği yapan merkez.
 */

import { SantisLayoutMesh } from './santis-layout-mesh.js';
import { SovereignGPUField } from './santis-gpu-field.js';
import { SantisDiffEngine } from './santis-diff-v2.js';
import { SovereignRouter } from './santis-router.js';
import { SovereignDataBridge } from './santis-data-bridge.js';
import { SovereignIntentEngine } from './santis-intent-engine.js';

export class SantisCore {
    constructor() {
        console.log("🌌 [Santis Bootloader] V6 Quantum Core Uyanıyor...");

        // --- 1. SİNİR SİSTEMİ (Layout & Observers) ---
        this.layoutMesh = new SantisLayoutMesh();

        // --- 2. GÖRSEL İLLÜZYON ZIRHI (GPU Field) ---
        const canvas = document.getElementById('santis-quantum-canvas');
        if (canvas) {
            this.gpuField = new SovereignGPUField(canvas);
            // LayoutMesh verilerini GPU'ya bağla
            this.layoutMesh.setGPUCallback((data) => {
                this.gpuField.updateInstanceData(data);
            });
        }

        // --- 3. KUANTUM CERRAH (Diff Engine) ---
        this.diffEngine = new SantisDiffEngine();

        // --- 4. EGEMEN AĞ & VERİ (Router & DataBridge) ---
        this.router = new SovereignRouter(this.diffEngine, '#nv-main');
        this.dataBridge = new SovereignDataBridge(this.diffEngine, '#santis-card-grid');

        // --- 5. NİYET MOTORU (Kuantum Psikolojisi) ---
        if (this.gpuField) {
            this.intentEngine = new SovereignIntentEngine(this.gpuField);
        }

        // --- KÜRESEL OLAY YÖNETİMİ (Event Bus) ---
        window.Santis = window.Santis || {};
        window.Santis.Bootloader = this;
        window.Santis.Bus = {
            emit: (event, data) => this.handleSystemEvent(event, data)
        };

        this.startMotionKernel();
        console.log("⚡ [Santis Bootloader] Sistem Online. Sovereign Matrix Aktif.");
    }

    /**
     * Tüm animasyon ve GPU render döngüsünü tek çatı altında toplayan Motion Kernel
     */
    startMotionKernel() {
        const tick = () => {
            // 1. Niyet Motoru hesaplamaları (Float32Array güncellemeleri)
            if (this.intentEngine) {
                this.intentEngine.update();
            }

            // 2. GPU Field Çizimi
            if (this.gpuField) {
                this.gpuField.render();
            }

            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    /**
     * Sistem içindeki olayları (Route değişimi, JSON yüklemesi) koordine eder
     */
    handleSystemEvent(event, data) {
        if (event === 'router:morphed' || event === 'matrix:injected') {
            console.log(`[Event Kernel] Sinyal Tespit Edildi: ${event}. Neuro-Tracker'ları hizalayın!`);

            // DOM değiştiğinde LayoutMesh'i yeniden taramaya zorla
            // Bu sayede GPU dumanları yeni/değişen kartların arkasına kusursuzca yerleşir.
            setTimeout(() => {
                this.layoutMesh.scanAndObserve();
            }, 50); // DOM'un tam oturması için minimal kuantum gecikmesi
        }
    }
}

// Sistemi DOM yüklenince ateşle
document.addEventListener('DOMContentLoaded', () => {
    new SantisCore();
});
