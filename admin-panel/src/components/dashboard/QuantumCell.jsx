import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ----------------------------------------------------------------------
// GÖLGELENDİRİCİ (SHADER) KODLARI
// GPU üzerinde doğrudan donanım ivmesiyle çalışan matematiksel kurallar
// ----------------------------------------------------------------------

const vertexShader = `
  uniform float u_time;
  uniform float u_stress;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  
  // Basit bir 3D Gürültü (Noise) ve Dalga Fonksiyonu simülasyonu
  // Stres seviyesi arttıkça köşeleri (vertex) normal yönünde dışa veya içe iter
  void main() {
    vUv = uv;
    vNormal = normal;
    
    vec3 pos = position;
    
    // Stres arttıkça dalga boyu ve frekansı artar
    float noiseFreq = 2.0 + (u_stress * 5.0);
    float noiseAmp = 0.1 + (u_stress * 0.4);
    
    // X, Y, Z eksenlerinde zaman ve strese bağlı karmaşık dalgalanma (Sıvı/Kinetik etki)
    vec3 noisePos = vec3(pos.x * noiseFreq + u_time, pos.y * noiseFreq + u_time, pos.z * noiseFreq);
    float noise = sin(noisePos.x) * sin(noisePos.y) * sin(noisePos.z) * noiseAmp;
    
    // Köşeyi, normal (yüzey yönü) boyunca gürültü miktarı kadar kaydır
    pos += normal * noise;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform float u_stress;
  uniform vec3 u_colorBase;
  uniform vec3 u_colorStress;
  
  varying vec3 vNormal;
  
  void main() {
    // Işıklandırma simülasyonu (Sessiz Lüks hissiyatı için sahte bir ışık açısı)
    vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
    float lightIntensity = max(dot(vNormal, lightDirection), 0.2); // Gölgelerde tamamen siyah olmasın
    
    // Mat Pirinç rengi ile İsli Sıcak Gri rengini u_stress (0.0 - 1.0) değerine göre karıştır (Interpolasyon)
    vec3 mixedColor = mix(u_colorBase, u_colorStress, u_stress);
    
    // Rengi ışık şiddeti ile çarpıp ekrana ver
    gl_FragColor = vec4(mixedColor * lightIntensity, 1.0);
  }
`;

// ----------------------------------------------------------------------
// REACT BİLEŞENİ (PRESENTATIONAL / DUMB COMPONENT)
// ----------------------------------------------------------------------

export default function QuantumCell({ stressLevel = 0 }) {
  const meshRef = useRef();
  const materialRef = useRef();

  // Gelen 0-100 arası stres puanını Shader'ın anlayacağı 0.0 - 1.0 aralığına sıkıştır
  const normalizedStress = Math.max(0, Math.min(100, stressLevel)) / 100.0;

  // Shader'a gönderilecek dinamik değişkenler (Uniforms)
  // useMemo ile sarıyoruz ki React her render'da bunları baştan yaratmasın
  const uniforms = useMemo(() => ({
    u_time: { value: 0.0 },
    u_stress: { value: normalizedStress },
    u_colorBase: { value: new THREE.Color('#c6a96b') },   // Mat Pirinç
    u_colorStress: { value: new THREE.Color('#141416') }  // İsli Sıcak Gri
  }), []);

  // Animasyon Döngüsü (120 FPS hedefine kilitli R3F render loop)
  useFrame((state) => {
    const { clock } = state;
    
    if (materialRef.current) {
      // Zamanı sürekli güncelle (Dalgalanmanın kinetik kalması için)
      materialRef.current.uniforms.u_time.value = clock.getElapsedTime();
      
      // Stres seviyesi aniden değişirse, pürüzsüz bir geçiş (Lerp) uygula (Ani sıçramaları önler)
      materialRef.current.uniforms.u_stress.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.u_stress.value,
        normalizedStress,
        0.05
      );
    }
    
    if (meshRef.current) {
      // Küreyi yavaşça kendi etrafında döndür (Lüks bir ambiyans katar)
      meshRef.current.rotation.y += 0.002;
      meshRef.current.rotation.x += 0.001;
    }
  });

  return (
    <mesh ref={meshRef}>
      {/* Geometri: args={[yarıçap, detay]} 
        Detayı 64 yapmak vertex sayısını artırır, böylece dalgalanma çok pürüzsüz olur.
      */}
      <icosahedronGeometry args={[2.5, 64]} />
      
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        wireframe={false} // Geliştirme aşamasında iskeleti görmek için true yapılabilir
      />
    </mesh>
  );
}
