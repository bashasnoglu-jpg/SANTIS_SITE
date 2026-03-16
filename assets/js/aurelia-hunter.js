/**
 * ============================================================================
 * 🐺 SOVEREIGN OS - AURELIA EXIT-INTENT HUNTER
 * Kinetik İvme ve Çıkış Niyeti Tespiti (V18 APEX)
 * ============================================================================
 */
class AureliaHunter {
    constructor() {
        this.armed = false;
        this.triggered = false;
        this.lastY = 0;
        this.lastTime = performance.now();
        this.velocityThreshold = -1.2; // Eksi değer: Saniyede 1.2 piksel şiddetle YUKARI çekiş

        // Misafir içeri girer girmez yüzüne vurma. Lüks, beklemeyi gerektirir.
        setTimeout(() => this.armWeapons(), 3000);
    }

    armWeapons() {
        if (window.innerWidth < 1024) return; // Mobil cihazlarda çalışmaz (Fare ivmesi gerekir)
        this.armed = true;
        console.log("🐺 [AURELIA] Avcı Modu Aktif. Kurbanın ivmesi gölgelerden izleniyor...");
        
        document.addEventListener('mousemove', (e) => this.trackPrey(e), { passive: true });
        document.addEventListener('mouseleave', (e) => {
            // Fare tarayıcıdan (yukarıdan) yavaşça çıksa bile garantilemek için tetikle
            if (e.clientY <= 0 && this.armed && !this.triggered) this.evaluateKillShot(e.clientX, -5); 
        });
    }

    trackPrey(e) {
        if (!this.armed || this.triggered) return;

        const now = performance.now();
        const deltaTime = now - this.lastTime;
        if (deltaTime === 0) return;

        // Vektörel Hız (Y Ekseni İvmesi)
        const velocity = (e.clientY - this.lastY) / deltaTime;

        // Mouse ekranın üst 30 pikseline yaklaştıysa ve ivme sertse (Yukarı çekiş)
        if (e.clientY < 30 && velocity < this.velocityThreshold) {
            this.evaluateKillShot(e.clientX, velocity);
        }

        this.lastY = e.clientY;
        this.lastTime = now;
    }

    evaluateKillShot(x, velocity) {
        if (this.triggered) return;
        this.triggered = true;
        
        console.log(`💥 [AURELIA] Çıkış İvmesi Tespit Edildi! (Hız: ${velocity.toFixed(2)}G)`);
        
        this.deploySovereignBarrier();
        this.notifyHeadquarters(velocity);
    }

    deploySovereignBarrier() {
        const barrier = document.createElement('div');
        barrier.id = 'aurelia-trap';
        // Tüm Matrix'i durduran lüks zaman donması (Sovereign Glass Kapanı)
        barrier.innerHTML = `
            <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(10,10,12,0.95); backdrop-filter:blur(20px); z-index:999999; display:flex; flex-direction:column; align-items:center; justify-content:center; opacity:0; transition:opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1);">
                <div style="text-align:center; transform:translateY(30px); transition:all 1.2s cubic-bezier(0.16, 1, 0.3, 1);" id="trap-content">
                    <h2 style="color:#D4AF37; font-family:'Playfair Display', serif; font-size:3rem; letter-spacing:2px; margin-bottom:15px; text-shadow:0 0 30px rgba(212,175,55,0.4);">HENÜZ GİTMİYORSUNUZ.</h2>
                    <p style="color:#E0E0E0; font-family:sans-serif; font-size:1.1rem; max-width:550px; line-height:1.6; margin-bottom:40px;">Santis Club'ın gizli ritüellerini keşfetmeden çıkış yapıyorsunuz. Sizin için hazırlanan <strong>150€'luk Sovereign Ayrıcalığı</strong> sekme kapandığında sonsuza dek buharlaşacaktır.</p>
                    <div style="display:flex; gap:20px; justify-content:center;">
                        <button style="background:#D4AF37; border:none; color:#000; padding:15px 40px; font-size:1rem; font-weight:bold; letter-spacing:2px; cursor:pointer; text-transform:uppercase; transition:all 0.4s; box-shadow:0 0 20px rgba(212,175,55,0.3);" onclick="document.getElementById('aurelia-trap').style.opacity='0'; setTimeout(()=>document.getElementById('aurelia-trap').remove(), 800);">Ayrıcalığı Kabul Et</button>
                        <button style="background:transparent; border:1px solid #444; color:#888; padding:15px 40px; font-size:1rem; cursor:pointer; transition:all 0.4s;" onmouseover="this.style.color='#E0E0E0'; this.style.borderColor='#888'" onmouseout="this.style.color='#888'; this.style.borderColor='#444'" onclick="document.getElementById('aurelia-trap').style.opacity='0'; setTimeout(()=>document.getElementById('aurelia-trap').remove(), 800);">Sıradanlığa Dön</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(barrier);
        
        // CSS tetikleme (Reflow force)
        void barrier.offsetWidth;
        barrier.firstElementChild.style.opacity = '1';
        document.getElementById('trap-content').style.transform = 'translateY(0)';
    }

    notifyHeadquarters(velocity) {
        // Karargaha HTTP POST ile Avı teslim et
        try {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.match(/^\d{1,3}\./);
            const apiBase = isLocal ? `http://${window.location.hostname}:8080/api/v1` : '';

            fetch(`${apiBase}/aurelia/capture`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    huntId: 'HUNT_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                    vectorSpeed: velocity.toFixed(2) + 'G',
                    value: 150, 
                    location: window.location.pathname || 'Sovereign Ana Kapı'
                })
            }).catch(err => console.error("🩸 [AURELIA] HQ Gölgelendi, ama av elde."));
        } catch (e) {}
    }
}

// Sistemi Başlat
document.addEventListener('DOMContentLoaded', () => {
    new AureliaHunter();
});
