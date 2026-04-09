import { sovereignStore } from '../../core/state/sovereignStore.js';
import { CommandFactory } from '../../core/commands/commandFactory.js';
import { SovereignDispatcher } from '../../core/api/sovereignDispatcher.js';

export class SovereignMoodSelector extends HTMLElement {
    constructor() {
        super();
        this.unsubscribe = null;
    }

    connectedCallback() {
        this.renderSkeleton();
        this.button = this.querySelector('#btn-relax');
        this.statusText = this.querySelector('#status-display');

        // Kullanıcı aksiyonu (Tetikleyici)
        this.button.addEventListener('click', () => this.handleSelection());

        // State'i dinle ve UI'ı otonom güncelle (Reaktivite)
        this.unsubscribe = sovereignStore.subscribe('commandLifecycle', (state) => {
            this.updateUI(state);
        });
    }

    disconnectedCallback() {
        if (this.unsubscribe) this.unsubscribe();
    }

    async handleSelection() {
        // Factory'den kurşungeçirmez Command'i al (Mock tenant/session ile)
        const command = CommandFactory.createSelectMood(
            "deep_relaxation", 
            "session-001", 
            "tenant-omega"
        );
        
        // Dispatcher'a fırlat. Try/Catch'e gerek yok, UI state'i dinliyor!
        SovereignDispatcher.fire(command).catch(() => {}); 
    }

    updateUI(state) {
        // State Makinesi Döngüsüne Göre UI Reaksiyonları
        if (state.status === 'submitting') {
            this.button.disabled = true;
            this.button.className = "bg-emerald-600 text-white py-2 px-6 rounded transition-colors opacity-50 cursor-not-allowed animate-pulse";
            this.statusText.innerText = "Sinyal Şifreleniyor... ⚡";
            this.statusText.className = "text-yellow-400 text-xs mt-2";
        } 
        else if (state.status === 'ack_success') {
            this.button.disabled = false;
            this.button.className = "bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-6 rounded transition-colors";
            this.statusText.innerText = `Onaylandı (Ack). Trace: ${state.lastTraceId.substring(0,8)}`;
            this.statusText.className = "text-green-400 text-xs mt-2";
        } 
        else if (state.status === 'nack_error') {
            this.button.disabled = false;
            this.button.className = "bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-6 rounded transition-colors";
            this.statusText.innerText = `Reddedildi: ${state.error}`;
            this.statusText.className = "text-red-500 text-xs mt-2 font-bold";
        }
        else if (state.status === 'queued_offline') {
            this.button.disabled = false; // Başka komutlar alabilir
            this.button.className = "bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-6 rounded transition-colors";
            this.statusText.innerText = "Çevrimdışı. Komut Yetimhaneye Alındı 📦";
            this.statusText.className = "text-blue-400 text-xs mt-2";
        }
    }

    renderSkeleton() {
        this.innerHTML = `
            <div class="sovereign-panel p-4 text-center">
                <h3 class="sovereign-meta-text text-white mb-4">Mood Override Protocol</h3>
                <button id="btn-relax" class="bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-6 rounded transition-colors">
                    ENGAGE: DEEP RELAXATION
                </button>
                <div id="status-display" class="text-gray-500 text-xs mt-2 h-4">Beklemede...</div>
            </div>
        `;
    }
}

customElements.define('sovereign-mood-selector', SovereignMoodSelector);
