/**
 * SANTIS DIGITAL CONCIERGE (v1.0)
 * "Sinematik Karşılama Modülü"
 * 
 * Özellikler:
 * 1. Sol alt köşede "Resepsiyon" butonu.
 * 2. Tıklanınca tam ekran video modal açılır.
 * 3. Video loop oynarken WhatsApp/Arama seçenekleri sunulur.
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Veri Kontrolü (SOCIAL_DATA yüklü mü?)
    if (typeof SOCIAL_DATA === 'undefined' || !SOCIAL_DATA.concierge || !SOCIAL_DATA.concierge.active) {
        console.log("Concierge Inactive or Data Missing");
        return;
    }

    const config = SOCIAL_DATA.concierge;

    // 2. CSS Inject (Stilleri JS ile gömüyoruz, ekstra CSS dosyasına gerek yok)
    const style = document.createElement('style');
    style.innerHTML = `
        /* Floating Button */
        .concierge-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            background: #d4af37;
            border-radius: 50%;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 9999;
            transition: transform 0.3s ease;
            animation: pulse-glow 2s infinite;
        }
        .concierge-btn:hover { transform: scale(1.1); }
        .concierge-btn svg { width: 30px; height: 30px; fill: white; }

        @keyframes pulse-glow {
            0% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.4); }
            70% { box-shadow: 0 0 0 15px rgba(212, 175, 55, 0); }
            100% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }
        }

        /* Modal Overlay */
        .concierge-modal {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: black;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.5s ease;
        }
        .concierge-modal.active { opacity: 1; pointer-events: all; }

        /* Video Background */
        .concierge-video-bg {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            object-fit: cover;
            opacity: 0.6;
        }

        /* Content Wrapper */
        .concierge-content {
            position: relative;
            z-index: 2;
            text-align: center;
            color: white;
            font-family: 'Playfair Display', serif;
            max-width: 400px;
        }
        
        .concierge-title { font-size: 32px; margin-bottom: 10px; }
        .concierge-text { font-family: 'Inter', sans-serif; font-size: 16px; margin-bottom: 30px; opacity: 0.8; }

        /* Action Buttons */
        .concierge-actions { display: flex; flex-direction: column; gap: 15px; width: 100%; }
        .c-btn {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            padding: 15px;
            color: white;
            text-decoration: none;
            font-family: 'Inter', sans-serif;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.3s;
        }
        .c-btn:hover { background: rgba(255,255,255,0.2); }
        .c-btn i { margin-right: 10px; font-size: 18px; }

        /* Close Button */
        .c-close {
            position: absolute;
            top: 30px;
            right: 30px;
            color: white;
            font-size: 30px;
            cursor: pointer;
            z-index: 3;
            background: none;
            border: none;
        }
    `;
    document.head.appendChild(style);

    // 3. HTML Elements Create
    const btn = document.createElement('div');
    btn.className = 'concierge-btn';
    btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>`;
    document.body.appendChild(btn);

    const modal = document.createElement('div');
    modal.className = 'concierge-modal';
    modal.innerHTML = `
        <video class="concierge-video-bg" autoplay muted loop playsinline>
            <source src="assets/img/social/${config.video}" type="video/mp4">
        </video>
        <button class="c-close" onclick="closeConcierge()">×</button>
        <div class="concierge-content">
            <h2 class="concierge-title">${config.title}</h2>
            <p class="concierge-text">${config.welcomeText}</p>
            <div class="concierge-actions">
                <a href="https://wa.me/905348350169" target="_blank" class="c-btn">
                    <span>📹 Görüntülü Bağlan (WhatsApp)</span>
                </a>
                 <a href="tel:+905348350169" class="c-btn">
                    <span>📞 Sesli Ara</span>
                </a>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // 4. Events
    btn.addEventListener('click', () => {
        modal.classList.add('active');
        const video = modal.querySelector('video');
        video.muted = false; // Try to unmute on interaction
        video.play();
    });

    window.closeConcierge = () => {
        modal.classList.remove('active');
        const video = modal.querySelector('video');
        video.muted = true;
        video.pause();
    };
});
