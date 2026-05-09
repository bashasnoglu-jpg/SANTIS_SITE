import { sovereignStore } from '../../core/state/sovereignStore.js';
import { IntentSseClient } from '../../core/api/intentSseClient.js';

/**
 * SovereignFocusCard: Salt Okunur (Read-Only) Admin Canlı Gözlem Paneli
 * SSE'den gelen, Store tarafından Normalize edilmiş Canonical Projection verisini (Read Model) render eder.
 */
export class SovereignFocusCard extends HTMLElement {
    constructor() {
        super();
        this.unsubscribe = null;
        this.sessionId = this.getAttribute('session-id') || 'sess_abc12345'; // Gerçekte router veya global state'den gelir
    }

    connectedCallback() {
        this.renderSkeleton();
        this.container = this.querySelector('#focus-content');
        this.statusDot = this.querySelector('#status-dot');

        // Canlı akışı Başlat (Sadece SSE Gateway'e sinyal yollar, DOM'a dokunmaz)
        IntentSseClient.connect(this.sessionId);

        // UI'ın Tek Bağlantı Noktası: Store (Reaktivite)
        this.unsubscribe = sovereignStore.subscribe('liveIntentSnapshot', (state) => {
            this.updateUI(state);
        });
    }

    disconnectedCallback() {
        if (this.unsubscribe) this.unsubscribe();
        IntentSseClient.disconnect();
    }

    updateUI(state) {
        // --- 1. BAĞLANTI DURUMU GÖRSELLEŞTİRİLMESİ ---
        if (state.connectionStatus === 'connecting') {
            this.statusDot.className = "w-2 h-2 rounded-full bg-yellow-400 animate-pulse inline-block mr-2";
            if (!state.data) this.container.innerHTML = `<span class="text-gray-500 text-sm italic">Sinyal Aranıyor...</span>`;
        } 
        else if (state.connectionStatus === 'live') {
            this.statusDot.className = "w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block mr-2";
        } 
        else if (state.connectionStatus === 'disconnected') {
            this.statusDot.className = "w-2 h-2 rounded-full bg-red-500 inline-block mr-2";
            this.container.innerHTML = `<span class="text-red-400 text-sm">Bağlantı Koptu</span>`;
            return; // Çizme, veritabanı koptu
        }

        // --- 2. KANONİK VERİ (PROJECTION) RENDER ---
        if (state.data) {
            const mood = state.data.moodAffinity.length > 0 ? state.data.moodAffinity[0] : 'Yok';
            const trace = state.data.traceId ? `(Trace: ${state.data.traceId.split('-')[0]})` : '';
            const lastUpdated = new Date(state.lastUpdatedAt).toLocaleTimeString();

            this.container.innerHTML = `
                <div class="flex flex-col gap-2">
                    <div class="flex justify-between items-center text-sm border-b border-gray-800 pb-2">
                        <span class="text-gray-400">Aktif Mood</span>
                        <span class="text-emerald-400 font-bold uppercase">${mood}</span>
                    </div>
                    <div class="flex justify-between items-center text-xs text-gray-600 mt-1">
                        <span>Son Güncelleme: ${lastUpdated}</span>
                        <span>${trace}</span>
                    </div>
                </div>
            `;
        } 
        else if (state.connectionStatus === 'live') {
            this.container.innerHTML = `<span class="text-gray-500 text-sm">Sistem Boş (Henüz Mood Seçilmedi)</span>`;
        }
    }

    renderSkeleton() {
        this.innerHTML = `
            <div class="w-full max-w-sm rounded-lg border border-gray-800 bg-nv-void p-4 shadow-xl font-mono">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-gray-300 text-xs tracking-widest uppercase">God Mode: Session Focus</h3>
                    <div title="SSE Status">
                        <span id="status-dot" class="w-2 h-2 rounded-full bg-yellow-400 animate-pulse inline-block mr-2"></span>
                    </div>
                </div>
                <!-- Reaktif Veri Konteyneri -->
                <div id="focus-content" class="min-h-14 flex items-center justify-center">
                    <span class="text-gray-600 text-sm">Matrix Yükleniyor...</span>
                </div>
            </div>
        `;
    }
}

customElements.define('sovereign-focus-card', SovereignFocusCard);
