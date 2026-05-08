import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ----------------------------------------------------------------------
// GÖLGELENDİRİCİ (SHADER) KODLARI - SOVEREIGN AURA
// Agresif gürültü (noise) silindi. Yerine meditatif, sıvı bir dalgalanma (sine wave) eklendi.
// ----------------------------------------------------------------------

const vertexShader = `
  uniform float u_time;
  uniform float u_intensity;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  
  void main() {
    vUv = uv;
    vNormal = normal;
    
    vec3 pos = position;
    
    // Meditatif frekans: Dalgalar çok daha yavaş ve organik yayılır
    float noiseFreq = 1.2;
    // Genlik (Amplitude): Ses şiddeti arttıkça küre çok nazikçe genleşir, asla sivrilmez
    float noiseAmp = 0.05 + (u_intensity * 0.15); 
    
    // X, Y, Z eksenlerinde su damlası etkisini taklit eden trigonometrik dalgalanma
    vec3 noisePos = vec3(pos.x * noiseFreq + u_time * 0.4, pos.y * noiseFreq + u_time * 0.3, pos.z * noiseFreq);
    float noise = sin(noisePos.x) * cos(noisePos.y) * sin(noisePos.z) * noiseAmp;
    
    pos += normal * noise;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform float u_intensity;
  uniform vec3 u_colorBase;
  uniform vec3 u_colorGlow;
  
  varying vec3 vNormal;
  
  void main() {
    // Yumuşak, tepe açılı stüdyo ışığı simülasyonu
    vec3 lightDirection = normalize(vec3(1.0, 2.0, 1.0));
    float lightIntensity = max(dot(vNormal, lightDirection), 0.4); 
    
    // İsli griye (karanlığa) dönüş iptal edildi. 
    // Bunun yerine ses arttıkça mat pirinçten, içten parlayan sıcak bir altın/pirinç tonuna geçiş.
    vec3 mixedColor = mix(u_colorBase, u_colorGlow, u_intensity);
    
    gl_FragColor = vec4(mixedColor * lightIntensity, 1.0);
  }
`;

// ----------------------------------------------------------------------
// REACT BİLEŞENİ (MEDITATIF KÜRE)
// ----------------------------------------------------------------------

export default function SovereignAura({ intensity = 0 }) {
  const meshRef = useRef();
  const materialRef = useRef();

  const uniforms = useMemo(() => ({
    u_time: { value: 0.0 },
    u_intensity: { value: intensity },
    u_colorBase: { value: new THREE.Color('var(--sovereign-gold)') },   // Ana Renk: Mat Pirinç
    u_colorGlow: { value: new THREE.Color('var(--sovereign-sand)') }    // Parlama Rengi: Sıcak Pirinç
  }), [intensity]);

  useFrame((state) => {
    const { clock } = state;
    
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = clock.getElapsedTime();
      
      // Kinetik yumuşatma (Lerp): Ses aniden kesilse bile küre yavaşça eski formuna döner
      materialRef.current.uniforms.u_intensity.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.u_intensity.value,
        intensity,
        0.04
      );
    }
    
    if (meshRef.current) {
      // Küre kendi etrafında gezegen gibi çok yavaş döner
      meshRef.current.rotation.y += 0.001;
      meshRef.current.rotation.x += 0.0005;
    }
  });

  return (
    <mesh ref={meshRef}>
      {/* Geometri detayı 64'ten 128'e çıkarıldı! 
        Bu, üçgen sayısını devasa ölçüde artırarak bükülmelerin ipeksi bir pürüzsüzlüğe ulaşmasını sağlar. 
      */}
      <icosahedronGeometry args={[2.5, 128]} />
      
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        opacity={0.9}
      />
    </mesh>
  );
}
