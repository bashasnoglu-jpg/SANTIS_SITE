/**
 * santis-quantum-cell.js
 * WebGL / Three.js Engine for Sovereign Longevity Matrix
 */

const QuantumEngine = {
    scene: null, camera: null, renderer: null, material: null, mesh: null,

    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 4;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        this.createCell();
        
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        this.animate();
    },

    createCell() {
        // Geometriyi yüksek segmentli seçiyoruz ki deformasyon pürüzsüz olsun
        const geometry = new THREE.IcosahedronGeometry(1, 128); // Ekstra çözünürlük

        // Özel ShaderMaterial
        this.material = new THREE.ShaderMaterial({
            wireframe: true, // Başlangıçta daha teknolojik/medikal bir his için tel kafes olabilir (Sonra false yapılabilir)
            uniforms: {
                uTime: { value: 0 },
                uIntensity: { value: 0 }, // Ses şiddeti
                uStress: { value: 0 },    // Hücresel hasar (Jitter)
                uColorHealthy: { value: new THREE.Color("#c6a96b") }, // Altın
                uColorStress: { value: new THREE.Color("#2a0a0a") }  // Koyu Kan Rengi / Nekroz Rengi
            },
            vertexShader: `
                // Gürültü fonksiyonu 3D
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

                float snoise(vec3 v) {
                    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
                    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

                    vec3 i  = floor(v + dot(v, C.yyy) );
                    vec3 x0 = v - i + dot(i, C.xxx) ;

                    vec3 g = step(x0.yzx, x0.xyz);
                    vec3 l = 1.0 - g;
                    vec3 i1 = min( g.xyz, l.zxy );
                    vec3 i2 = max( g.xyz, l.zxy );

                    vec3 x1 = x0 - i1 + C.xxx;
                    vec3 x2 = x0 - i2 + C.yyy;
                    vec3 x3 = x0 - D.yyy;

                    i = mod289(i);
                    vec4 p = permute( permute( permute(
                                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                               + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

                    float n_ = 0.142857142857;
                    vec3  ns = n_ * D.wyz - D.xzx;

                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_ );

                    vec4 x = x_ *ns.x + ns.yyyy;
                    vec4 y = y_ *ns.x + ns.yyyy;
                    vec4 h = 1.0 - abs(x) - abs(y);

                    vec4 b0 = vec4( x.xy, y.xy );
                    vec4 b1 = vec4( x.zw, y.zw );

                    vec4 s0 = floor(b0)*2.0 + 1.0;
                    vec4 s1 = floor(b1)*2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0));

                    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
                    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

                    vec3 p0 = vec3(a0.xy,h.x);
                    vec3 p1 = vec3(a0.zw,h.y);
                    vec3 p2 = vec3(a1.xy,h.z);
                    vec3 p3 = vec3(a1.zw,h.w);

                    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                    p0 *= norm.x;
                    p1 *= norm.y;
                    p2 *= norm.z;
                    p3 *= norm.w;

                    vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                    m = m * m;
                    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
                }

                varying vec2 vUv;
                varying float vDistortion;
                uniform float uTime;
                uniform float uIntensity;
                uniform float uStress;

                void main() {
                    vUv = uv;
                    // Klasik nefes pulsasyonu
                    float basePulse = 1.0 + (snoise(position * 2.0 + uTime * 0.5) * 0.1);
                    
                    // Stres arttıkça vertexleri rastgele dışarı it (Hücresel hasar illüzyonu)
                    // "Spike" (Diken) efekti için noise frekansını uStress ile artırıyoruz
                    float distortion = snoise(position * (3.0 + uStress * 15.0) + uTime) * (uIntensity * 0.5 + uStress * 0.3);
                    vDistortion = distortion;
                    
                    vec3 newPosition = position * basePulse + normal * distortion;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            fragmentShader: `
                varying float vDistortion;
                uniform vec3 uColorHealthy;
                uniform vec3 uColorStress;
                uniform float uStress;

                void main() {
                    // Stres/Hasar oranına göre renk karışımı (Altın -> Karanlık Kan Rengi)
                    vec3 finalColor = mix(uColorHealthy, uColorStress, clamp(uStress * 2.0, 0.0, 1.0));
                    
                    // Bozulma noktalarına gölge ekleyerek derinlik ver
                    finalColor += vDistortion * 0.5; // Sivri yerleri biraz parlat
                    
                    // Ortayı koyu, kenarları parlak bırakmak için bir Fresnel eklenebilir
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `
        });

        this.material.wireframe = true; // Siber-tıbbi etki için wireframe aktif kalabilir veya false yapılabilir
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.scene.add(this.mesh);
    },

    animate() {
        requestAnimationFrame(() => this.animate());

        // Mesh'i yavaşça kendi etrafında döndür
        if(this.mesh) {
            this.mesh.rotation.y += 0.002;
            this.mesh.rotation.x += 0.001;
        }

        // Audio verilerini Shader'a besle
        if (window.SantisData && window.SantisData.isActive) {
            this.material.uniforms.uTime.value += 0.015;
            
            // Normalizasyon: Ses arttıkça büyüme
            this.material.uniforms.uIntensity.value = THREE.MathUtils.lerp(
                this.material.uniforms.uIntensity.value, 
                window.SantisData.volume / 100, 
                0.05
            );
            
            // Stres verisini yumuşatarak shader'a aktar
            this.material.uniforms.uStress.value = THREE.MathUtils.lerp(
                this.material.uniforms.uStress.value, 
                window.SantisData.stress, 
                0.05
            );
            
            // Eğer çok yüksek stresteyse Wireframe'i kapatarak içi dolu iğrenç bir kütleye dönüştürülebilir.
            // if(window.SantisData.stress > 0.6 && this.material.wireframe) this.material.wireframe = false;
        } else {
            // Rölantide kendi halinde salınım
            this.material.uniforms.uTime.value += 0.005;
        }

        this.renderer.render(this.scene, this.camera);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    QuantumEngine.init();
});
