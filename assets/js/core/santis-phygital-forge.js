/**
 * SANTIS OS - THE PHYGITAL FORGE [PHASE 36]
 * Kinetic Wallet Manifestation, Phantom Glass Pass & Neuro-Resonance
 * Architect: Hakan
 */

class SantisPhygitalForge {
    constructor() {
        this.listenForQuantumSeal();
    }

    listenForQuantumSeal() {
        // Phase 35'ten gelen Biyometrik Onay Sinyalini (WebAuthn Success) Dinle
        if (window.SantisEventBus) {
            window.SantisEventBus.on('wallet:generate_pass', (ritualData) => {
                this.manifestLivingTicket(ritualData);
            });
        }
    }

    manifestLivingTicket(ritualData) {
        console.log(`🎫 [Phygital Forge] Maddeleşme Başladı! Ritüel: ${ritualData.title}`);

        // 1. Ruh Haline Göre Biletin Aurasını Belirle (Neuro-Resonance)
        const frictionScore = this.getEmotionalState();
        const aura = this.forgeAura(frictionScore);

        // 2. Kinetik Bilet İskeletini DOM'a Enjekte Et
        const ticketOverlay = this.createKineticTicket(ritualData, aura);
        document.body.appendChild(ticketOverlay);

        // 3. Ağır Bir Fiziksel Düşüş Hissi (Haptic Feedback)
        if (navigator.vibrate) navigator.vibrate([150, 40, 250]); // Güm... Güm!
        
        // Sesli Kutsama (Phase 34 Entegrasyonu)
        if (window.SantisEventBus) window.SantisEventBus.emit('audio:ticket_drop', '528Hz');

        // 4. Bilet Tıklanıp Cüzdana Gittiğinde Animasyon
        const addBtn = ticketOverlay.querySelector('.santis-wallet-btn');
        addBtn.addEventListener('click', () => {
            this.absorbIntoWallet(ticketOverlay, ritualData);
        });
    }

    getEmotionalState() {
        try {
            const cache = localStorage.getItem('santis_emotional_cache');
            return cache ? JSON.parse(cache).frictionScore : 0;
        } catch { return 0; }
    }

    forgeAura(frictionScore) {
        // Stresli misafire koyu altın şifa, sakin misafire saf Vanta Black Matrix
        if (frictionScore > 70) return { bg: 'linear-gradient(145deg, #1A1A1A, #000)', glow: 'rgba(212, 175, 55, 0.5)', text: '#D4AF37', label: 'ZEN ŞİFASI' }; 
        return { bg: 'linear-gradient(145deg, #0A0A0A, #111)', glow: 'rgba(255, 255, 255, 0.15)', text: '#E0E0E0', label: 'SOVEREIGN VIP' }; 
    }

    createKineticTicket(ritualData, aura) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.85); backdrop-filter: blur(20px);
            z-index: 99999; display: flex; align-items: center; justify-content: center;
            opacity: 0; transition: opacity 0.5s ease; perspective: 1000px;
        `;

        const ticket = document.createElement('div');
        ticket.className = 'santis-living-pass';
        
        // Holografik Cam ve Kinetik Başlangıç Pozisyonu (Ekranın çok üstünde)
        ticket.style.cssText = `
            width: 320px; height: 520px; background: ${aura.bg}; border-radius: 20px;
            box-shadow: 0 40px 80px rgba(0,0,0,0.9), inset 0 0 30px ${aura.glow};
            display: flex; flex-direction: column; align-items: center; padding: 40px 20px;
            color: ${aura.text}; font-family: 'Cinzel', serif; border: 1px solid rgba(255,255,255,0.08);
            transform: translateY(-150vh) rotateX(45deg) scale(0.8);
            transition: transform 1s cubic-bezier(0.34, 1.56, 0.64, 1); /* Sert Sekme (Bounce) Efekti */
            position: relative; overflow: hidden; transform-style: preserve-3d;
        `;

        ticket.innerHTML = `
            <div id="hologram-glare" style="position:absolute; top:-100%; left:-100%; width:300%; height:300%; background: radial-gradient(circle, ${aura.glow} 0%, transparent 60%); opacity: 0.4; pointer-events:none; transition: transform 0.1s; mix-blend-mode: screen;"></div>
            
            <div class="text-center" style="z-index: 2;">
                <h2 style="font-size: 22px; margin: 0; letter-spacing: 4px; text-shadow: 0 0 10px ${aura.glow};">SANTIS</h2>
                <div style="font-size: 10px; opacity: 0.6; margin-top: 5px; letter-spacing: 6px;">LIVING TICKET</div>
            </div>
            
            <div class="text-center" style="margin-top: 30px; z-index: 2;">
                <div style="font-size: 11px; opacity: 0.8; font-family: sans-serif; letter-spacing: 2px; margin-bottom: 8px;">${aura.label}</div>
                <h3 class="text-white" style="font-size: 26px; margin: 0;">${ritualData.title || 'Kuantum Mührü'}</h3>
            </div>

            <div class="flex" style="width: 160px; height: 160px; background: #fff; border-radius: 12px; margin: 40px 0; align-items: center; justify-content: center; box-shadow: inset 0 0 20px rgba(0,0,0,0.8); z-index: 2;">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=SANTIS-VIP-${Date.now()}" style="width:140px; height:140px; opacity: 0.9; mix-blend-mode: multiply;">
            </div>

            <button class="cursor-pointer w-full santis-wallet-btn" style="background: rgba(255,255,255,0.1); color: ${aura.text}; border: 1px solid ${aura.glow}; padding: 15px 30px; border-radius: 30px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; transition: all 0.3s ease; backdrop-filter: blur(5px); z-index: 2;">CÜZDANA EKLE</button>
        `;

        overlay.appendChild(ticket);

        // Kinetik Düşüşü Tetikle
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            setTimeout(() => {
                ticket.style.transform = 'translateY(0) rotateX(0deg) scale(1)';
            }, 50);
        });

        // Jiroskopik Işık Kırılması (Phase 26 Biyometrik Mirası)
        const glare = ticket.querySelector('#hologram-glare');
        
        // Masaüstü (Fare İvmesi)
        overlay.addEventListener('mousemove', (e) => {
            const x = (window.innerWidth / 2 - e.pageX) / 20;
            const y = (window.innerHeight / 2 - e.pageY) / 20;
            ticket.style.transform = `rotateY(${-x}deg) rotateX(${y}deg)`;
            if(glare) glare.style.transform = `translate(${e.pageX/3}px, ${e.pageY/3}px)`;
        });

        // Mobil (Donanımsal Jiroskop)
        window.addEventListener('deviceorientation', (e) => {
            const tiltX = (e.gamma || 0) / 2;
            const tiltY = (e.beta || 0) / 2;
            ticket.style.transform = `rotateY(${tiltX}deg) rotateX(${-tiltY}deg)`;
            if(glare) glare.style.transform = `translate(${tiltX*5}px, ${tiltY*5}px)`;
        });

        return overlay;
    }

    absorbIntoWallet(overlayElement, ritualData) {
        console.log("🍏 [Phygital Forge] Bilet Cüzdana Emiliyor... Fiziksel dünya bağlantısı kuruluyor.");
        const ticket = overlayElement.querySelector('.santis-living-pass');
        
        // Cüzdana Gidiş Efekti (Ekranın altına doğru çekilip yok olur)
        ticket.style.transition = 'all 0.6s cubic-bezier(0.55, 0.085, 0.68, 0.53)';
        ticket.style.transform = 'translateY(150vh) rotateX(-45deg) scale(0.4)';
        ticket.style.opacity = '0';
        overlayElement.style.opacity = '0';
        
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        if (window.SantisEventBus) window.SantisEventBus.emit('aurelia:speak', 'Biletiniz cüzdanınıza mühürlendi. Santis tapınağında fiziksel olarak görüşmek üzere.');

        setTimeout(() => overlayElement.remove(), 600);
        
        // Phase 37 IoT Bağlantısı İçin Kanca (Geofence Tohumu atıldı)
        if (window.SantisEventBus) window.SantisEventBus.emit('phygital:ticket_sealed', ritualData);
    }
}

// Otonom Demircisini Matrise Yükle
document.addEventListener('DOMContentLoaded', () => {
    window.SantisPhygitalCore = new SantisPhygitalForge();
});
