import * as Comlink from 'comlink';
import * as THREE from 'three';
// WebGPU Renderer Three.js r160+ Standardı
import { WebGPURenderer } from 'three/webgpu';

export interface RenderWorkerContract {
    initEngine(canvas: OffscreenCanvas, width: number, height: number, pixelRatio: number): Promise<void>;
    onResize(width: number, height: number, pixelRatio: number): void;
    onScroll(progress: number): void;
    onPointerMove(x: number, y: number): void;
    onRouteChange(route: string): void;
    onNetworkStatus(isOnline: boolean): void;
    // Neural Interaction Methods
    particleBurst(energy: number): void;
    orbDistort(dx: number, dy: number): void;
    cameraFocus(active: boolean): void;
    triggerCheckoutSuccess(): void;
}

let renderer: any; // WebGPURenderer | THREE.WebGLRenderer
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let liquidMesh: THREE.Mesh;
let particles: THREE.Points;

// Neural Targets
let targetParticleEnergy = 0;
let targetCameraZ = 5;

// Main thread'den gelecek asenkron hedefler
let targetX = 0; let targetY = 0; let currentScroll = 0;
let targetOpacity = 1; // Content sayfalarında objeyi görünmez yapmak için
let targetTransmission = 0.9;

async function createRenderer(canvas: OffscreenCanvas, width: number, height: number, pixelRatio: number) {
    if ('gpu' in navigator) {
        try {
            renderer = new WebGPURenderer({ canvas, antialias: true, alpha: true });
            renderer.setPixelRatio(pixelRatio);
            renderer.setSize(width, height, false);
            await renderer.init();
            console.log('🚀 [GPU Worker] WebGPU Renderer başarıyla başlatıldı!');
            return;
        } catch (e) {
            console.warn('⚠️ [GPU Worker] WebGPU başlatılamadı, WebGL 2 fallback devrede.', e);
        }
    }
    
    console.log('🔄 [GPU Worker] WebGLRenderer Fallback aktif.');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
}

const renderLogic: RenderWorkerContract = {
    async initEngine(canvas, width, height, pixelRatio) {
        console.log('🎨 [Render Worker] OffscreenCanvas teslim alındı! Ultra Motion Engine v1 başlatılıyor...');
        
        await createRenderer(canvas, width, height, pixelRatio);

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.z = 5;

        // 1. Santis OS Liquid Glass Orb (Apple Vision Pro tarzı)
        const geometry = new THREE.IcosahedronGeometry(1.5, 64); // Yüksek detaylı topoloji
        const material = new THREE.MeshPhysicalMaterial({ 
            color: 0x4f46e5, 
            metalness: 1.0,
            roughness: 0.05,
            transmission: 0.9, // Cam hissi
            thickness: 1.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            ior: 1.5,
            transparent: true
        });
        liquidMesh = new THREE.Mesh(geometry, material);
        scene.add(liquidMesh);

        // Aydınlatmalar
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
        dirLight.position.set(2, 2, 2);
        scene.add(dirLight);

        // 2. Compute Particle System Background (Fallback uyumlu basit yaklaşım)
        const particleGeo = new THREE.BufferGeometry();
        const particleCount = 10000;
        const posArray = new Float32Array(particleCount * 3);
        for(let i=0; i < particleCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 15;
        }
        particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particleMat = new THREE.PointsMaterial({
            size: 0.02,
            color: 0x10b981,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        particles = new THREE.Points(particleGeo, particleMat);
        scene.add(particles);

        // Render Loop tamamen Worker içinde dönüyor! UI asla donmaz.
        const animate = () => {
            requestAnimationFrame(animate);
            
            // Yumuşak interpolasyon (Main thread yorulmadan burada hesaplanır)
            liquidMesh.rotation.x += (targetY * 0.5 - liquidMesh.rotation.x) * 0.05;
            liquidMesh.rotation.y += (targetX * 0.5 - liquidMesh.rotation.y) * 0.05;
            
            // Görünürlük (Opacity/Transmission) morflaması
            if (liquidMesh.material) {
                const mat = liquidMesh.material as THREE.MeshPhysicalMaterial;
                mat.opacity += (targetOpacity - mat.opacity) * 0.05;
                mat.transmission += (targetTransmission - mat.transmission) * 0.05;
            }
            
            // GSAP Scroll Senkronizasyonu (Camera/Obje hareketi)
            liquidMesh.position.y = -currentScroll * 4;
            liquidMesh.rotation.z = currentScroll * Math.PI;

            // Arka plan parçacıkları kameraya tepki versin (Neural Hype)
            targetParticleEnergy *= 0.95; // Sönümlenme (Decay)
            particles.rotation.y += targetParticleEnergy * 0.02;
            particles.rotation.y += currentScroll * Math.PI * 0.1 + (Date.now() * 0.000005);
            particles.rotation.x += currentScroll * Math.PI * 0.05;

            // Neural Focus Camera Lerp
            camera.position.z += (targetCameraZ - camera.position.z) * 0.05;

            // WebGPU rendering
            renderer.render(scene, camera);
        };
        animate();
    },
    
    onResize(width, height, pixelRatio) {
        if (!camera || !renderer) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(width, height, false);
    },
    
    onScroll(progress) { currentScroll = progress; },
    onPointerMove(x, y) { targetX = x; targetY = y; },
    onRouteChange(path) {
        console.log(`🎨 [Render Worker] Rota değişimi algılandı: ${path}. Sahne morph ediliyor...`);
        
        // Örnek: Sayfaya göre sıvı metalin hedefini veya rengini değiştir
        if (path.includes('rezervasyon')) {
            targetY = Math.PI; // Obje 180 derece arkasını dönsün
            targetOpacity = 1.0;
            targetTransmission = 0.9;
            if (liquidMesh && liquidMesh.material) {
                (liquidMesh.material as THREE.MeshPhysicalMaterial).color.setHex(0x10b981); // Zümrüt Yeşili
            }
        } else if (path === '/' || path === '/index.html' || path === '') {
            targetY = 0; // Ana sayfa konumu
            targetOpacity = 1.0;
            targetTransmission = 0.9;
            if (liquidMesh && liquidMesh.material) {
                (liquidMesh.material as THREE.MeshPhysicalMaterial).color.setHex(0x4f46e5); // İndigo
            }
        } else {
            // ALT SAYFALAR (Hakkımızda, Masaj, Hamam vb.)
            // Orb'u tamamen şeffaf yapıp gizle ki içeriğin arkasında pus yapmasın!
            targetOpacity = 0.0;
            targetTransmission = 0.0;
        }
    },
    onNetworkStatus(isOnline) {
        if (!isOnline) {
            console.log('🌌 [Render Worker] Uyku Modu. İletim azaltılıyor...');
            if (liquidMesh && liquidMesh.material) {
                (liquidMesh.material as THREE.MeshPhysicalMaterial).opacity = 0.2; 
                (liquidMesh.material as THREE.MeshPhysicalMaterial).transmission = 0.1;
                (liquidMesh.material as THREE.MeshPhysicalMaterial).wireframe = true;
            }
        } else {
            console.log('🌌 [Render Worker] Uyanış. Liquid Glass aktif...');
            if (liquidMesh && liquidMesh.material) {
                (liquidMesh.material as THREE.MeshPhysicalMaterial).opacity = 1.0;
                (liquidMesh.material as THREE.MeshPhysicalMaterial).transmission = 0.9;
                (liquidMesh.material as THREE.MeshPhysicalMaterial).wireframe = false;
            }
        }
    },
    
    // Neural Reaction RPCs
    particleBurst(energy: number) {
        targetParticleEnergy = energy;
    },
    orbDistort(dx: number, dy: number) {
        if (liquidMesh) {
            liquidMesh.rotation.x += dy * 0.1;
            liquidMesh.rotation.y += dx * 0.1;
        }
    },
    cameraFocus(active: boolean) {
        targetCameraZ = active ? 3.5 : 5;
    },
    
    // Phase 15: Grand Finale
    triggerCheckoutSuccess() {
        console.log('🎨 [Render Worker] Ödeme onaylandı! Sıvı Metal Altına (Gold) dönüşüyor...');
        targetY = Math.PI * 4; // Hızlıca kendi etrafında fırıl fırıl dönsün
        if (liquidMesh && liquidMesh.material) {
            const mat = liquidMesh.material as THREE.MeshBasicMaterial;
            mat.color.setHex(0xffd700); // Saf Altın Rengi
            mat.wireframe = false; // Tel kafes dolsun, katı bir cisme dönüşsün!
            mat.opacity = 0.9;
        }
    }
};

Comlink.expose(renderLogic);
export type { RenderWorkerContract as RenderServicesContract };
