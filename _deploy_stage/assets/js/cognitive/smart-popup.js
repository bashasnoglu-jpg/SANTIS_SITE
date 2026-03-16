/**
 * SANTIS SMART POPUP (Phase 26)
 * Quiet Luxury Recommendation Engine
 */
class SmartPopup {
    constructor() {
        this.init();
    }

    async init() {
        // Wait 6 seconds for Soul Engine to analyze behavior
        setTimeout(async () => {
            const data = this.getEmotionalOffer();
            if (data) {
                this.render(data);
            }
        }, 6000);
    }

    getEmotionalOffer() {
        const mood = document.body.dataset.userMood || 'neutral';
        console.log(`🤖 [SmartPopup] Generating offer for mood: ${mood.toUpperCase()}`);

        const _l = (p) => window.SantisRouter ? SantisRouter.localize(p) : p;
        const offers = {
            'calm': {
                type: 'vip',
                title: 'Sessiz Saatler',
                message: 'Hafta içi 10:00 - 14:00 arası rezervasyonlarda %15 huzur indirimi.',
                action: 'Huzuru Rezerve Et',
                link: _l('/tr/iletisim.html'),
                promo_code: 'SILENCE15'
            },
            'decisive': {
                type: 'interest',
                title: 'Anı Yakala',
                message: 'Bugün yapacağın rezervasyona özel anında %10 indirim tanımlandı.',
                action: 'Fırsatı Kullan',
                link: _l('/tr/iletisim.html'),
                promo_code: 'NOW10'
            },
            'hesitant': {
                type: 'vip',
                title: 'Tanışma Paketi',
                message: 'İlk deneyiminiz için risksiz, %100 memnuniyet garantili özel paket.',
                action: 'Paketi İncele',
                link: _l('/tr/urunler/index.html'),
                promo_code: 'FIRST'
            },
            'escape': {
                type: 'vip',
                title: 'Gece Kuşu',
                message: 'Geceye özel Moonlight Masajı için size özel bir yerimiz var.',
                action: 'Geceyi Keşfet',
                link: _l('/tr/masajlar/index.html'),
                promo_code: 'MOON'
            },
            'neutral': {
                type: 'interest',
                title: 'Hoş Geldiniz',
                message: 'Santis Club ayrıcalıklarını keşfetmek için kataloğumuza göz atın.',
                action: 'Kataloğu Gör',
                link: _l('/tr/urunler/index.html')
            }
        };

        return offers[mood] || offers['neutral'];
    }

    render(data) {
        // Avoid duplicate
        if (document.getElementById('santis-smart-popup')) return;

        // Styles
        const style = document.createElement('style');
        style.innerHTML = `
            .nv-smart-popup {
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 320px;
                background: rgba(10, 10, 10, 0.95);
                border: 1px solid rgba(212, 175, 55, 0.3);
                border-radius: 4px;
                padding: 20px;
                z-index: 2147483647 !important; /* MAX Z-INDEX FORCE */
                font-family: 'Montserrat', sans-serif;
                color: #fff;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
                backdrop-filter: blur(10px);
                pointer-events: auto !important; /* Force clickability */
                isolation: isolate;
            }
            .nv-smart-popup.active {
                opacity: 1;
                transform: translateY(0);
            }
            .nv-smart-popup-header {
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: #888;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .nv-smart-popup-title {
                font-size: 16px;
                font-weight: 400;
                color: #d4af37; /* Gold */
                margin-bottom: 6px;
            }
            .nv-smart-popup-msg {
                font-size: 12px;
                line-height: 1.5;
                color: #ccc;
                margin-bottom: 15px;
            }
            .nv-smart-popup-btn {
                display: block;
                width: 100%;
                padding: 10px;
                text-align: center;
                background: rgba(212, 175, 55, 0.1);
                border: 1px solid #d4af37;
                color: #d4af37;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 1px;
                text-decoration: none;
                transition: all 0.3s;
                cursor: pointer !important; /* Beat body override */
                position: relative;
                z-index: 2;
            }
            .nv-smart-popup-btn:hover {
                background: #d4af37;
                color: #000;
            }
            .nv-smart-popup-close {
                position: absolute;
                top: 10px;
                right: 15px;
                cursor: pointer;
                color: #555;
                font-size: 16px;
                line-height: 1;
            }
            .nv-smart-popup-close:hover { color: #fff; }
            .nv-badge {
                padding: 2px 4px;
                border-radius: 2px;
                font-size: 9px;
                background: #222;
                border: 1px solid #444;
            }
            .nv-promo-box {
                background: rgba(212, 175, 55, 0.2);
                border: 1px dashed #d4af37;
                color: #fff;
                font-family: monospace;
                font-size: 14px;
                text-align: center;
                padding: 8px;
                margin-bottom: 12px;
                cursor: pointer;
                letter-spacing: 2px;
                font-weight: bold;
                transition: all 0.2s;
            }
            .nv-promo-box:hover {
                background: rgba(212, 175, 55, 0.4);
                transform: scale(1.02);
            }
        `;
        document.head.appendChild(style);

        // HTML
        const popup = document.createElement('div');
        popup.id = 'santis-smart-popup';
        popup.className = 'nv-smart-popup';

        let headerIcon = '✨';
        if (data.type === 'vip') headerIcon = '👑';
        if (data.type === 'interest') headerIcon = '👁️';

        popup.innerHTML = `
            <div class="nv-smart-popup-close">×</div>
            <div class="nv-smart-popup-header">
                <span>${headerIcon}</span>
                <span>SANTIS ORACLE</span>
            </div>
            <div class="nv-smart-popup-title">${data.title}</div>
            <div class="nv-smart-popup-msg">${data.message}</div>
            ${data.promo_code ? `<div class="nv-promo-box" onclick="navigator.clipboard.writeText('${data.promo_code}');alert('Kopya: ${data.promo_code}')">${data.promo_code}</div>` : ''}
            <a href="${data.link || '#'}" class="nv-smart-popup-btn">${data.action}</a>
        `;

        document.body.appendChild(popup);

        // Animate In
        requestAnimationFrame(() => popup.classList.add('active'));

        // Events
        popup.querySelector('.nv-smart-popup-close').addEventListener('click', () => {
            popup.classList.remove('active');
            setTimeout(() => popup.remove(), 600);
        });
    }
}

// Auto Init
document.addEventListener('DOMContentLoaded', () => {
    new SmartPopup();
});
