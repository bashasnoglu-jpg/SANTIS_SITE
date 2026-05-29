/**
 * SANTIS SOVEREIGN OS - Ritual UI Orchestrator
 * Connects the HTML Intent Band & Grid to the Ritual State Machine via Event Delegation
 */
class SantisRitualUIOrchestrator {
    constructor() {
        this.gridEl = document.getElementById('ritual-product-grid');
        this.refinementPanel = document.getElementById('ritual-refinement-panel');
        this.upgradesEl = document.getElementById('ritual-upgrade-options');
        this.summaryEl = document.getElementById('ritual-vault-summary');
        this.handoffBtn = document.getElementById('trigger-handoff-btn');
        this.intentBand = document.getElementById('ritual-intent-band');
        
        this.currentIntent = 'ALL';
        
        if (!this.gridEl) return;
        
        this._bindEvents();
        
        // Data Bridge halihazırda yüklüyse UI'ı derle, değilse yüklenmesini bekle
        if (window.SantisData && window.SantisData.masterCatalog) {
            this._renderIntentBand();
            this._renderGrid(this.currentIntent);
            this.renderUpgrades();
        } else {
            document.addEventListener('santis:data:ready', () => {
                this._renderIntentBand();
                this._renderGrid(this.currentIntent);
                this.renderUpgrades();
            });
        }
    }

    _renderIntentBand() {
        if (!this.intentBand || !window.SantisData || !window.SantisData.masterCatalog) return;

        const master = window.SantisData.masterCatalog;
        
        // 1. Statik Başlangıç Sekmesi (Örn: "Journeys / Programlar")
        let htmlTokens = `
            <button class="category-btn active" data-intent="cat_journeys">
                ${master.journeys.category_name}
            </button>
        `;

        // 2. Dinamik Service Kategorileri (JSON'dan otonom türetiliyor)
        master.services.forEach(cat => {
            htmlTokens += `
                <button class="category-btn" data-intent="${cat.category_id}">
                    ${cat.category_name}
                </button>
            `;
        });

        // 3. DOM'a Zerk Et
        this.intentBand.innerHTML = htmlTokens;
        
        // 4. Otomatik İlk Yükleme Ataması
        this.currentIntent = 'cat_journeys'; 
        
        // Event listener'lar zaten _bindEvents() içinde Event Delegation ile dinliyor, ek işleme gerek yok!
    }

    _bindEvents() {
        // 1. Intent Band (Kategori Sekmeleri) İçin Event Delegation
        if (this.intentBand) {
            this.intentBand.addEventListener('click', (e) => {
                const btn = e.target.closest('.category-btn');
                if (!btn) return;

                // Active sınıfını yönet
                this.intentBand.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.currentIntent = btn.dataset.intent;
                
                if (window.SantisRitualOrchestrator) {
                    window.SantisRitualOrchestrator.setIntent(this.currentIntent);
                }
                
                this._renderGrid(this.currentIntent);
            });
        }

        // 2. Ritüel Izgarası İçin Event Delegation
        if (this.gridEl) {
            this.gridEl.addEventListener('click', (e) => {
                const triggerBtn = e.target.closest('.btn-select-ritual');
                if (!triggerBtn) return;

                const rawData = triggerBtn.dataset.ritualPayload;
                if (rawData && window.SantisRitualOrchestrator) {
                    try {
                        const ritualObj = JSON.parse(decodeURIComponent(rawData));
                        const isAdded = window.SantisRitualOrchestrator.toggleVault(ritualObj.id);
                        
                        // Görsel geribildirim: Sadece tıklanan butonun Toggle durumu
                        if (isAdded) {
                            triggerBtn.innerHTML = '✓ Added';
                            triggerBtn.style.color = '#d4af37';
                            triggerBtn.style.borderColor = 'rgba(212, 175, 55, 0.5)';
                            triggerBtn.classList.add('vault-active');
                        } else {
                            triggerBtn.innerHTML = triggerBtn.dataset.originalCta || 'Add to Vault';
                            triggerBtn.style.color = '';
                            triggerBtn.style.borderColor = '';
                            triggerBtn.classList.remove('vault-active');
                        }
                    } catch (error) {
                        console.error("[Santis UI] Ritüel payload'u çözülemedi.", error);
                    }
                }
            });
        }

        // 3. Eklenti (Upgrade) Izgarası İçin Event Delegation
        if (this.upgradesEl) {
            this.upgradesEl.addEventListener('click', (e) => {
                const chip = e.target.closest('.refinement-chip');
                if (!chip) return;

                const rawData = chip.dataset.upgradePayload;
                if (rawData && window.SantisRitualOrchestrator) {
                    try {
                        const upgradeObj = JSON.parse(decodeURIComponent(rawData));
                        // UI state'i değiştir
                        chip.classList.toggle('active');
                        // Orchestrator'a bildir
                        window.SantisRitualOrchestrator.toggleUpgrade(upgradeObj);
                    } catch (error) {
                        console.error("[Santis UI] Upgrade payload'u çözülemedi.", error);
                    }
                }
            });
        }

        // 4. Vault Güncellemelerini Dinle
        document.addEventListener('santis:vault:updated', (e) => {
            const vault = e.detail;
            if (vault.items && vault.items.length > 0) {
                this.handoffBtn.disabled = false;
                this.handoffBtn.style.opacity = '1';
                this.handoffBtn.style.pointerEvents = 'all';
                this.summaryEl.innerHTML = `<strong>${vault.items.length} Hizmet</strong> — Toplam: ${vault.displayDuration}, ${vault.totalPrice}€`;
                
                // --- SOVEREIGN VAULT PULSE ---
                const wrapper = this.summaryEl.parentElement; // Animate the container block
                wrapper.classList.remove('vault-pulse-active');
                void wrapper.offsetWidth; // Sihirli "DOM Reflow" Kuantum Zıplaması! 
                wrapper.classList.add('vault-pulse-active');
            } else {
                this.handoffBtn.disabled = true;
                this.handoffBtn.style.opacity = '0.5';
                this.handoffBtn.style.pointerEvents = 'none';
                this.summaryEl.innerHTML = `Lüks bir kürasyon reçeteleyin...`;
            }
        });

        // 5. Vault sıfırlandığında Upgrade badge'lerindeki active class'ı temizle
        document.addEventListener('santis:vault:cleared_upgrades', () => {
            document.querySelectorAll('.refinement-chip').forEach(chip => {
                chip.classList.remove('active');
            });
        });

        // 6. VIP Handoff Success (Strip Morphing)
        document.addEventListener('santis:handoff:success', (e) => {
            const strip = document.querySelector('.santis-cta-strip');
            if(strip) {
                strip.style.transition = 'all 1.2s cubic-bezier(0.25, 1, 0.5, 1)';
                strip.style.background = '#0a0a0a';
                strip.style.border = '1px solid rgba(212, 175, 55, 0.4)';
                strip.style.boxShadow = '0 0 40px rgba(212, 175, 55, 0.1)';
                
                // Swap content with a subtle fade
                strip.innerHTML = `
                    <div style="text-align: center; width: 100%; padding: 10px 0; animation: fade-in 1s cubic-bezier(0.25, 1, 0.5, 1) forwards;">
                        <h3 style="margin:0 0 8px 0; font-family:'Playfair Display', serif; font-size:1.6rem; color:#c6a96b;">Santis Concierge Bilgilendirildi</h3>
                        <p style="margin:0; font-family:'Inter', sans-serif; font-size:0.95rem; color:rgba(255,255,255,0.7);">Seçiminiz rezerve edildi. Kişisel asistanınız sizinle iletişime geçiyor.</p>
                    </div>
                `;
                
                // Dismiss after 4 seconds to let the page breathe
                setTimeout(() => {
                    strip.style.transform = 'translateY(150%)';
                    strip.style.opacity = '0';
                    strip.style.pointerEvents = 'none';
                }, 4000);
            }
        });
    }

    _createRitualCard(ritual) {
        // Obje verisini güvenli bir şekilde DOM'a gömmek için encodeURIComponent kullanımı
        const payloadStr = encodeURIComponent(JSON.stringify({
            id: ritual.id,
            title: ritual.title,
            price_eur: ritual.price_eur,
            duration_min: ritual.duration_min,
            concierge_payload: ritual.concierge_payload
        }));

        return `
            <div class="santis-bento-card visual-slotted santis-reveal-item" style="background:#0a0a0a; border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; display: flex; flex-direction: column;">
                <div style="flex:1;">
                    <span style="font-family:'Inter', sans-serif; font-size:0.75rem; color:#c6a96b; text-transform:uppercase; letter-spacing:1px;">${ritual.tier} TIER</span>
                    <h3 style="font-family:'Playfair Display', serif; font-size:1.6rem; margin:12px 0 8px; color:#fff;">${ritual.title}</h3>
                    <p style="font-family:'Inter', sans-serif; font-size:0.9rem; color:rgba(255,255,255,0.6); line-height:1.5;">${ritual.summary}</p>
                    <div style="margin-top:16px; font-family:'Inter', sans-serif; font-size:0.85rem; color:#fff;">
                        🕒 ${ritual.duration_min} dk &nbsp;|&nbsp; 💶 €${ritual.price_eur}
                    </div>
                </div>
                <button class="btn-select-ritual santis-btn-ghost mt-4" style="margin-top:20px; width:100%; transition: all 0.3s;" 
                    data-ritual-payload="${payloadStr}" data-original-cta="${ritual.cta || 'Ritüeli Seç'}">
                    ${ritual.cta || 'Ritüeli Seç'}
                </button>
            </div>
        `;
    }

    _createUpgradeBadge(upgrade) {
        const payloadStr = encodeURIComponent(JSON.stringify({
            id: upgrade.id,
            title: upgrade.title,
            price_eur: upgrade.price_eur,
            duration_add_min: upgrade.duration_add_min
        }));

        return `
            <button class="refinement-chip santis-reveal-item" data-upgrade-payload="${payloadStr}">
                + ${upgrade.title} (€${upgrade.price_eur})
            </button>
        `;
    }

    renderUpgrades() {
        if (!this.upgradesEl || !window.SantisData || !window.SantisData.ritualUpgrades) return;
        
        const upgrades = window.SantisData.ritualUpgrades;
        this.upgradesEl.innerHTML = upgrades.map(u => this._createUpgradeBadge(u)).join('');
        
        // Show panel if there are upgrades
        if (upgrades.length > 0) {
            this.refinementPanel.classList.remove('hidden');
        }

        if (window.SantisScrollEngine) {
            window.SantisScrollEngine.initReveal();
        }
    }

    _renderGrid(intentId) {
        if (!window.SantisData || !window.SantisData.masterCatalog) return;
        const master = window.SantisData.masterCatalog;
        let itemsToRender = [];

        // Veri Ayrıştırma (Data Parsing)
        if (intentId === 'cat_journeys') {
        // Journey verileri farklı bir yapıda (includes dizisi var)
        itemsToRender = master.journeys.items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.total_price,
            description: item.includes.join(' <br/> '), // Alt alta lüks dizilim
            duration_info: "Full Journey"
        }));
        } else {
        // Normal Servis kategorisini bul
        const category = master.services.find(c => c.category_id === intentId);
        if (category) {
            itemsToRender = category.items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            description: "", // Tekil servislerde açıklama boş olabilir
            duration_info: `${item.duration_minutes} MIN`
            }));
        }
        }

        // DOM Token'larını İnşa Et (Sıfır Sürtünme)
        if (!this.gridEl) return;
        
        let gridHtml = itemsToRender.map(item => {
            const payloadStr = encodeURIComponent(JSON.stringify({
                id: item.id,
                title: item.name,
                price_eur: item.price,
                duration_min: item.duration_info.replace(' MIN', '') || 0
            }));

            return `
            <div class="santis-bento-card visual-slotted santis-reveal-item" style="background:#0a0a0a; border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; display: flex; flex-direction: column;">
                <div style="flex:1;">
                    <h3 style="font-family:'Playfair Display', serif; font-size:1.6rem; margin:12px 0 8px; color:#fff;">${item.name}</h3>
                    <div style="font-family:'Inter', sans-serif; font-size:0.85rem; color:#c6a96b; letter-spacing:1px; margin-bottom: 12px;">
                        ${item.duration_info} &nbsp;|&nbsp; 💶 €${item.price}
                    </div>
                    ${item.description ? `<p style="font-family:'Inter', sans-serif; font-size:0.9rem; color:rgba(255,255,255,0.6); line-height:1.5;">${item.description}</p>` : ''}
                </div>
                <button class="btn-select-ritual santis-btn-ghost mt-4" style="margin-top:20px; width:100%; transition: all 0.3s;" 
                    data-ritual-payload="${payloadStr}" data-original-cta="Add to Vault">
                    Add to Vault
                </button>
            </div>
        `}).join('');

        // Ekrana Zerk Et
        this.gridEl.innerHTML = gridHtml;

        // Kuantum Gözlemcisini (Soul Flash) Yeni Kartlar İçin Yeniden Ateşle
        if (window.SantisScrollEngine) {
            window.SantisScrollEngine.initReveal();
        }
    }
}

// Global olarak başlat
document.addEventListener('DOMContentLoaded', () => {
    window.SantisRitualUI = new SantisRitualUIOrchestrator();
});
