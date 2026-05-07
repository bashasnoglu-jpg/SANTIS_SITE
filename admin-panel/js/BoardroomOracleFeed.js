/**
 * SANTIS Boardroom - Oracle Advisory UI
 * Adminin önerileri onaylayıp reddettiği 'Action Rails' katmanı.
 */
export const OracleFeed = {
    init() {
        console.log("[ORACLE]: Boardroom Action Rails awakened.");
        // Geliştirme aşamasında test amaçlı ilk fısıltıyı simüle ediyoruz
        this.simulateLocalWhisper();
    },

    renderSuggestion(suggestion) {
        const feedContainer = document.getElementById('oracle-advisory-feed');
        if (!feedContainer) {
            console.warn("[ORACLE_FEED]: oracle-advisory-feed konteyneri bulunamadı. Lütfen Boardroom HTML'e ekleyin.");
            return;
        }
        
        // Güvenlik: XSS korumalı güvenli element oluşturma
        const suggestionElement = document.createElement('div');
        const riskLevel = suggestion.riskScore >= 0.5 ? 'high' : 'low';
        
        // Lüks Dashboard Stilleri (Geçici inline, sonradan Admin CSS'ine taşınabilir)
        suggestionElement.style.cssText = `
            background: rgba(10, 10, 10, 0.9);
            border: 1px solid var(--color-sovereign-line, #333);
            border-left: 4px solid ${riskLevel === 'high' ? 'var(--color-sovereign-danger, #ff4d4d)' : 'var(--color-sovereign-gold, #d4af37)'};
            border-radius: 4px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            font-family: 'Inter', sans-serif;
            color: var(--color-sovereign-neutral-200, #eee);
            transition: all 0.3s ease;
        `;
        suggestionElement.id = `advisory-${suggestion.id}`;
        
        suggestionElement.innerHTML = `
            <div class="advisory-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #222; padding-bottom:15px; margin-bottom:15px;">
                <span class="advisory-label" style="color:var(--color-sovereign-muted, #888); font-weight:600; font-size:0.75rem; letter-spacing:2px;">[ ORACLE FISILTISI ]</span>
                <span class="advisory-risk" style="color:${riskLevel === 'high' ? 'var(--color-sovereign-danger, #ff4d4d)' : 'var(--color-sovereign-success, #88cc88)'}; font-weight:600; font-size:0.8rem; letter-spacing:1px;">RİSK: %${Math.round(suggestion.riskScore * 100)}</span>
            </div>
            <p class="advisory-text" style="font-size:1.1rem; line-height:1.6; color:var(--color-sovereign-neutral-200, #f0f0f0); margin-bottom:25px;">${suggestion.recommendation}</p>
            <div class="advisory-actions" style="display:flex; gap:15px;">
                <button class="btn-approve" data-id="${suggestion.id}" style="background:var(--color-sovereign-coal, #1a1a1a); border:1px solid var(--color-sovereign-gold, #d4af37); color:var(--color-sovereign-gold, #d4af37); padding:10px 25px; cursor:pointer; flex:1; font-weight:600; letter-spacing:1px; transition:all 0.3s ease;">ONAYLA (EXECUTE)</button>
                <button class="btn-reject" data-id="${suggestion.id}" style="background:transparent; border:1px solid var(--color-sovereign-line-soft, #444); color:var(--color-sovereign-muted, #777); padding:10px 25px; cursor:pointer; flex:1; font-weight:600; letter-spacing:1px; transition:all 0.3s ease;">YOK SAY (DISMISS)</button>
            </div>
        `;

        // Event listener bağlama
        const approveBtn = suggestionElement.querySelector('.btn-approve');
        const rejectBtn = suggestionElement.querySelector('.btn-reject');

        approveBtn.addEventListener('click', () => this.approve(suggestion.id, suggestionElement, suggestion.executePayload));
        rejectBtn.addEventListener('click', () => this.reject(suggestion.id, suggestionElement));
        
        // Hover efektleri
        approveBtn.addEventListener('mouseenter', () => { approveBtn.style.background = 'var(--color-sovereign-gold, #d4af37)'; approveBtn.style.color = 'var(--color-sovereign-black, #000)'; });
        approveBtn.addEventListener('mouseleave', () => { approveBtn.style.background = 'var(--color-sovereign-coal, #1a1a1a)'; approveBtn.style.color = 'var(--color-sovereign-gold, #d4af37)'; });
        rejectBtn.addEventListener('mouseenter', () => rejectBtn.style.borderColor = 'var(--color-sovereign-muted, #777)');
        rejectBtn.addEventListener('mouseleave', () => rejectBtn.style.borderColor = 'var(--color-sovereign-line-soft, #444)');

        // En üste ekle (LIFO)
        feedContainer.prepend(suggestionElement);
        console.log(`[ORACLE]: New suggestion ${suggestion.id} posted to Boardroom.`);
    },

    approve(suggestionId, element, payload) {
        console.log(`[ORACLE]: Action ${suggestionId} APPROVED by Sovereign Admin.`);
        console.log(`[SYS]: Executing Payload >`, payload);
        
        element.innerHTML = `<div style="text-align:center; padding: 30px; color:var(--color-sovereign-gold, #d4af37); font-weight:600; letter-spacing:2px;">[ AKSİYON MÜHÜRLENDİ - SİSTEM GÜNCELLENİYOR ]</div>`;
        element.style.borderColor = 'var(--color-sovereign-gold, #d4af37)';
        element.style.background = 'rgba(212, 175, 55, 0.05)';
        
        // İleride burada WebSocket üzerinden Core Kernel'e onay mesajı (COMMAND) yollanacak.
        setTimeout(() => {
            element.style.opacity = '0';
            element.style.transform = 'scale(0.95)';
            setTimeout(() => element.remove(), 400);
        }, 3000);
    },
    
    reject(suggestionId, element) {
        console.log(`[ORACLE]: Action ${suggestionId} DISMISSED by Sovereign Admin.`);
        element.style.opacity = '0';
        element.style.transform = 'translateX(20px)';
        setTimeout(() => element.remove(), 300);
    },

    // Sprint D - Demo Trigger
    simulateLocalWhisper() {
        setTimeout(() => {
            this.renderSuggestion({
                id: 'surge-' + Date.now(),
                riskScore: 0.15,
                recommendation: "Misafirler Bali masajına çok bakıyor ama rezervasyon yapmıyor. Fiyatı %5 optimize (Surge) edelim mi?",
                executePayload: { command: "ADJUST_PRICE", targetProtocol: "bali-highlight", multiplier: 0.95 }
            });
        }, 1500);
    }
};

document.addEventListener('DOMContentLoaded', () => OracleFeed.init());
