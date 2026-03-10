// ========================================================================
// 🦅 SANTIS OMNI-OS V18 | THE SOVEREIGN GPU SHADER (LIQUID GOLD)
// ========================================================================

export function init() {
    console.log("🌋 [GPU Engine] The Sovereign Canvas Uyanıyor. Uzay-Zaman Bükülüyor...");

    const canvas = document.getElementById('santis-god-canvas');
    if (!canvas) {
        console.warn("🚨 [GPU Engine] Kutsal Tuval (Canvas) bulunamadı. Görsel tekillik iptal edildi.");
        return null;
    }

    // Ekran kartının saf gücünü çek! (desynchronized: true -> Tarayıcının V-Sync'ini beklemeden GPU'ya yaz!)
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    let width, height;

    // 1. ZAMAN VE UZAYIN LERP'İ (Kusursuz Akışkanlık)
    let currentScroll = window.scrollY;
    let targetScroll = window.scrollY;
    let velocity = 0;

    // Uzayı ekrana uydur
    const resize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        // Retina ekranlar için piksel yoğunluğunu (DPR) ayarla!
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
    };
    window.addEventListener('resize', resize, { passive: true });
    resize();

    // 2. KÖLE MAIN THREAD'DEN SİNYAL AL (Sadece hedefin yerini söyler, hesaplama YAPAMAZ)
    window.addEventListener('scroll', () => {
        targetScroll = window.scrollY;
    }, { passive: true }); // passive: true -> Tarayıcıya "Asla DOM'u bloklamayacağım" yeminidir!

    // 3. THE LIQUID GOLD PARTICLES (Altın Külçelerinin Ruhları)
    const particleCount = window.innerWidth < 768 ? 30 : 80; // Mobile optimizasyonu
    const particles = Array.from({ length: particleCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.5 + 0.5,
        speedY: Math.random() * 0.5 + 0.1,
        alpha: Math.random() * 0.5 + 0.1
    }));

    // 4. THE 120Hz RENDER LOOP (Nükleer Reaksiyon Döngüsü)
    const render = () => {
        // LERP (Linear Interpolation) ile Scroll Hızını hesapla (Yumuşak ivme, Viskozite: 0.08)
        currentScroll += (targetScroll - currentScroll) * 0.08;
        velocity = targetScroll - currentScroll;

        // Vantablack boşluğunu temizle (Sadece transparan bir nefes)
        ctx.clearRect(0, 0, width, height);

        // Hıza (Velocity) bağlı altın vizkozitesi! Hızlı kaydırınca altın parlar!
        const isScrolling = Math.abs(velocity) > 2.0;

        particles.forEach(p => {
            // Parçacıklar hem kendi hızlarında yukarı çıkar, hem de scroll hızına (velocity) vahşice tepki verir!
            p.y -= p.speedY + (velocity * 0.15);

            // Ekrandan çıkan parçacığı sonsuz uzay döngüsüne al
            if (p.y < -20) p.y = height + 20;
            if (p.y > height + 20) p.y = -20;

            // SCROLL EDİLİYORSA: Ekran Kartı uzayı büker! Tozlar ivmeye göre savrulur ve PARLAR!
            if (isScrolling) {
                ctx.fillStyle = `rgba(212, 175, 55, ${Math.min(0.9, p.alpha + 0.4)})`; // Parlama
                ctx.beginPath();
                // Uzay bükülmesi: Hız arttıkça parçacıklar esner (Liquid Distortion)
                ctx.arc(p.x, p.y, p.size + (Math.abs(velocity) * 0.02), 0, Math.PI * 2);
            } else {
                ctx.fillStyle = `rgba(212, 175, 55, ${p.alpha})`; // Sakin
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            }

            ctx.fill();
        });

        // 120 FPS'e kilitlenmiş V-Sync Döngüsü
        requestAnimationFrame(render);
    };

    // Motoru Ateşle!
    requestAnimationFrame(render);

    console.log("🏆 [V18 GPU APEX] Liquid Gold Shader 120 FPS'e Kilitlendi! Viskozite Aktif.");
    return { status: 'dictating' };
}
