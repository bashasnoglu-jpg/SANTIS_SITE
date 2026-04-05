/**
 * ==========================================
 * 🌌 THE BLACK ROOM: 3D OMNISCIENCE ENGINE
 * ==========================================
 * Veri sadece rakam değildir. Fiziksel bir varlıktır.
 */
(function initBlackRoom3D() {
    console.log("%c[THE BLACK ROOM] WebGL Kuantum Matriksi Başlatıldı 🌌", "color: #00FFCC; font-weight: bold;");

    if (!window.THREE) return console.error("Three.js bulunamadı! Matriks çöküyor.");

    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0015);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.z = 1000;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // 8.000 Nöral Bağlantı (Particles)
    const particleCount = 8000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const originalY = new Float32Array(particleCount);

    for (let i = 0; i < particleCount * 3; i += 3) {
        const x = (Math.random() - 0.5) * 2500;
        const y = (Math.random() - 0.5) * 2500;
        const z = (Math.random() - 0.5) * 2500;
        
        positions[i] = x;
        positions[i+1] = y;
        positions[i+2] = z;
        originalY[i/3] = y; // Yerçekimi efekti için orijinal Y eksenini hatırla
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0x00FFCC, size: 2.5, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Fare Etkileşimi (Evreni Eğme Parallax)
    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - window.innerWidth / 2) * 1.5;
        mouseY = (e.clientY - window.innerHeight / 2) * 1.5;
    });

    // Kill Switch UI Tetikleyicisi
    window.addEventListener('kill-switch-activated', () => {
        const authSpan = document.getElementById('auth-mode');
        if(authSpan) {
            authSpan.innerText = "MANUAL OVERRIDE";
            authSpan.className = "alert-text";
        }
    });

    // ⚡ THE RENDER LOOP (Fizik Kuralları)
    function animate() {
        requestAnimationFrame(animate);

        const state = window.NeuralDB ? NeuralDB.state : null;
        const cpu = state ? Number(state.telemetry?.cpu || 0) : 10;
        const mrr = state ? Number(state.revenue?.mrr || 200000) : 200000;
        const defcon = state ? Number(state.system?.defcon || 5) : 5;
        const mode = window.SovereignAuthority ? SovereignAuthority.currentMode : "HUMAN";

        // 1. CPU VELOCITY: CPU arttıkça uzayın dönüş hızı çıldırır
        let speed = 0.001 + (cpu * 0.00005);
        
        // 2. MRR GRAVITY: Gelir düşerse parçacıklar aşağı çöker (Kasa Boşalıyor)
        const posArray = particles.geometry.attributes.position.array;
        for(let i = 1; i < posArray.length; i += 3) {
            if (mrr < 100000) {
                posArray[i] -= 3; // Çöküş Şelalesi
                if(posArray[i] < -1250) posArray[i] = 1250; // Alttan çıkıp üstten girsin
            } else {
                posArray[i] += (originalY[(i-1)/3] - posArray[i]) * 0.05; // Huzura dön
            }
        }
        particles.geometry.attributes.position.needsUpdate = true;

        // 3. RENK MUTASYONU (Kriz veya Kill Switch anında evren KANAR)
        if (mode === "HUMAN" || defcon < 3 || cpu > 85) {
            material.color.lerp(new THREE.Color(0xff0055), 0.05); // Kan Kırmızısı
            speed *= 2; // Kaos hızı
        } else if (mrr > 200000) {
            material.color.lerp(new THREE.Color(0xd4af37), 0.05); // Zenginlik Altını
        } else {
            material.color.lerp(new THREE.Color(0x00FFCC), 0.05); // Kuantum Yeşili
        }

        particles.rotation.x += speed * 0.5;
        particles.rotation.y += speed;

        camera.position.x += (mouseX - camera.position.x) * 0.05;
        camera.position.y += (-mouseY - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Sahte Yaşam Logları (Atmosfer için)
    setInterval(() => {
        if(window.BlackRoom && window.SovereignAuthority && SovereignAuthority.currentMode === "AUTONOMOUS") {
            if(Math.random() > 0.7) {
                BlackRoom.logDecision({ type: "SYSTEM_PULSE", action: "Nöral ağ sinapsları stabil. Kuantum yönlendirici aktif." });
            }
        }
    }, 6000);
})();
