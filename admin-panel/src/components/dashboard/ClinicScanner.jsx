import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// --- 1. GLSL SHADER TANIMLAMALARI ---
const vertexShader = `
  uniform float u_audioIntensity;
  uniform float u_time;
  varying vec2 vUv;
  varying float vDisplacement;

  // Hücre zarına organik bir pürüzlülük veren 3D Noise fonksiyonu
  float noise(vec3 p) {
      return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
  }

  void main() {
      vUv = uv;
      
      // Ses şiddeti ve zamana bağlı olarak yüzeyde sapma (displacement)
      float n = noise(position * 2.0 + u_time);
      float displacement = n * u_audioIntensity * 0.05; 
      vDisplacement = displacement;

      // Normaller doğrultusunda vertex'leri dışa itiyoruz
      vec3 newPosition = position + normal * displacement;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 u_baseColor;
  uniform vec3 u_stressColor;
  varying float vDisplacement;

  void main() {
      // Yüzey ne kadar bükülürse, renk o kadar 'stress' rengine kayar
      float mixFactor = smoothstep(0.0, 1.0, vDisplacement * 15.0);
      vec3 finalColor = mix(u_baseColor, u_stressColor, mixFactor);
      
      gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export default function ClinicScanner() {
  const mountRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const mediaStreamRef = useRef(null); // Mikrofon donanımını kapatmak için
  const idleTimeoutRef = useRef(null); // Otonom Amnezi sayacı
  
  const [headline, setHeadline] = useState("Hücresel Yorgunluk Analizi Sürüyor...");
  const [cortisolScore, setCortisolScore] = useState(0);

  // --- 2. Hover Deşifresi (LLM Simülasyonu) ---
  const handleHoverStart = () => {
    hoverTimerRef.current = setTimeout(() => {
      setHeadline("Tükenmişliği reddedin. Mitokondriyal dirilişiniz için tam zamanı.");
    }, 3000);
  };

  const handleHoverEnd = () => {
    clearTimeout(hoverTimerRef.current);
    setHeadline("Hücresel Yorgunluk Analizi Sürüyor..."); // Çekilince başlığı sıfırla
  };

  // --- 3. Web Audio API (Siber-Tıbbi Sinyal Yakalama) ---
  const startAudioScan = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream; // DONANIM İZİNİ KAYDET
      
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
    } catch (err) {
      console.error("Mikrofon izni reddedildi. Siber-tıbbi matris sese erişemiyor.", err);
    }
  };

  // --- OTONOM AMNEZİ PROTOKOLÜ ---
  const triggerAutonomousAmnesia = () => {
    console.log("[SOVEREIGN OS] Sessiz Uyku protokolü devrede. Matris temizleniyor...");
    
    // 1. Donanım bağlantılarını kes (Mikrofonu tamamen kapat)
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    // 2. Audio Node'ları imha et
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;

    // 3. Arayüzü (Kognitif State) sıfırla
    setHeadline("Hücresel Yorgunluk Analizi Sürüyor...");
    setCortisolScore(0);
  };

  // --- GLOBAL IDLE LISTENER (Sessiz Lüks Koruyucusu) ---
  useEffect(() => {
    const resetIdleTimer = () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      // 2 dakika (120.000 milisaniye) eylemsizlik sınırı
      idleTimeoutRef.current = setTimeout(triggerAutonomousAmnesia, 120000);
    };

    // Kiosk üzerindeki fiziksel etkileşimleri dinle
    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('touchstart', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    window.addEventListener('click', resetIdleTimer);

    // Sistem açıldığında ilk sayacı başlat
    resetIdleTimer();

    // Temizlik
    return () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('touchstart', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      window.removeEventListener('click', resetIdleTimer);
    };
  }, []);

  // --- 4. Three.js & WebGL Render Motoru ---
  useEffect(() => {
    // Sahne, Kamera ve Render Kurulumu
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / 400, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth / 2, 400);
    renderer.setPixelRatio(window.devicePixelRatio);
    if (mountRef.current) {
        mountRef.current.appendChild(renderer.domElement);
    }

    // Pürüzsüz bükülme için poligon sayısını artırılmış Küre
    const geometry = new THREE.SphereGeometry(2, 128, 128);

    // GLSL Shader Materyali
    const material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        u_time: { value: 0.0 },
        u_audioIntensity: { value: 0.0 },
        u_baseColor: { value: new THREE.Color('var(--sovereign-gold)') },  // Mat Pirinç
        u_stressColor: { value: new THREE.Color('var(--sovereign-dark)') } // İsli Gri (Yıpranma)
      },
      wireframe: true // Siberpunk estetiği için kafes görünümü
    });

    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    camera.position.z = 5;

    // Animasyon Döngüsü
    const clock = new THREE.Clock();
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Kendi ekseninde otonom dönüş
      sphere.rotation.x += 0.002;
      sphere.rotation.y += 0.003;
      
      // GPU'ya geçen süreyi bildiriyoruz (Organik noise dalgalanması için)
      material.uniforms.u_time.value = clock.getElapsedTime();

      // Mikrofondan gelen canlı frekansı analiz et ve GPU'ya aktar
      if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          sum += dataArrayRef.current[i];
        }
        const average = sum / dataArrayRef.current.length;
        
        // Ses şiddetini GPU'daki 'u_audioIntensity' değişkenine fırlat
        material.uniforms.u_audioIntensity.value = average;

        // UI için Kortizol puanı
        setCortisolScore(Math.floor(average));
      }

      renderer.render(scene, camera);
    };

    animate();

    // Temizlik (Component Unmount)
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // --- UI Render ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px', backgroundColor: 'var(--os-isli-gri, var(--sovereign-dark))', minHeight: '100vh' }}>
      
      <h1 style={{ color: 'var(--os-mat-pirinc, var(--sovereign-gold))', fontWeight: 300, transition: 'all 0.5s', textAlign: 'center' }}>
        {headline}
      </h1>

      <div ref={mountRef} style={{ margin: '30px 0', filter: 'drop-shadow(0 0 20px rgba(198, 169, 107, 0.2))' }}></div>

      <div style={{ marginBottom: '40px', fontSize: '14px', letterSpacing: '2px', color: 'var(--sovereign-neutral-200)' }}>
        ANLIK KORTİZOL PUANI: <span style={{ color: cortisolScore > 50 ? 'var(--sovereign-danger)' : 'var(--os-mat-pirinc, var(--sovereign-gold))', fontWeight: 'bold' }}>{cortisolScore}</span>
      </div>

      <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
        <button 
          onClick={startAudioScan} 
          className="vip-concierge-btn" 
          style={{ 
              backgroundColor: 'var(--sovereign-dark)', color: 'var(--sovereign-gold)', border: '1px solid var(--sovereign-gold)', 
              padding: '16px 32px', borderRadius: '4px', cursor: 'pointer', letterSpacing: '1px' 
          }}
        >
          SİSTEMİ BAŞLAT (SES ANALİZİ)
        </button>

        <div 
          onMouseEnter={handleHoverStart} 
          onMouseLeave={handleHoverEnd}
          style={{ 
              padding: '20px 30px', border: '1px solid var(--sovereign-gold)', borderRadius: '8px', 
              cursor: 'crosshair', transition: 'all 0.3s ease', backgroundColor: 'rgba(198, 169, 107, 0.05)'
          }}
        >
          <h3 style={{ margin: 0, color: 'var(--sovereign-gold)', fontSize: '18px', fontWeight: 400 }}>NAD+ Infusion</h3>
          <p style={{ margin: '8px 0 0 0', color: 'var(--sovereign-muted)', fontSize: '12px', letterSpacing: '1px' }}>SOVEREIGN CHOICE - $8.500</p>
        </div>
      </div>

    </div>
  );
}
