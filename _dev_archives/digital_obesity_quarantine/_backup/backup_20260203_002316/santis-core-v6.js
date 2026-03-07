
/**
 * SANTIS CORE ENGINE V6.0 (THE TRINITY)
 * 1. WebGL Liquid Distortion (Three.js)
 * 2. Physics Animation (GSAP)
 * 3. Inertia Scroll (Lenis)
 */

class SantisEngine {
    constructor() {
        // CENTRAL CONFIGURATION (TUNE HERE)
        this.CONFIG = {
            scroll: {
                duration: 1.0, // Standard Weight (Native-like)
                smoothTouch: true, // Re-enabled for Hybrid Devices
                touchMultiplier: 1.5,
                mouseMultiplier: 1.0, // Standard 1:1 Response
            },
            cursor: {
                speed: 0.15
            }
        };

        this.initSmoothScroll();
        this.initCursor();
        // Defer WebGL to ensure High Performance
        setTimeout(() => this.initLiquidGL(), 500);
    }

    // --- 1. SMOOTH SCROLL (Lenis) ---
    initSmoothScroll() {
        if (!window.Lenis) return;

        this.lenis = new Lenis({
            duration: this.CONFIG.scroll.duration,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Expo Ease
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: this.CONFIG.scroll.mouseMultiplier, // Use Config
            smoothTouch: this.CONFIG.scroll.smoothTouch,
            touchMultiplier: this.CONFIG.scroll.touchMultiplier,
        });

        // Sync with GSAP
        // this.lenis.on('scroll', ScrollTrigger.update); // If ScrollTrigger is used

        const raf = (time) => {
            this.lenis.raf(time);
            requestAnimationFrame(raf);
        };
        requestAnimationFrame(raf);

        console.log("🌊 Lenis Smooth Scroll Active (Luxury Mode)");
    }

    // --- 2. MAGNETIC CURSOR (GSAP) ---
    initCursor() {
        if (window.matchMedia("(pointer: coarse)").matches) return; // No mobile

        const cursor = document.createElement('div');
        cursor.className = 'nv-cursor-v6';
        document.body.appendChild(cursor);

        const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        const mouse = { x: pos.x, y: pos.y };
        const speed = 0.15; // Delay factor

        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });

        const loop = () => {
            pos.x += (mouse.x - pos.x) * speed;
            pos.y += (mouse.y - pos.y) * speed;

            // GSAP for smooth transform
            gsap.set(cursor, { x: pos.x, y: pos.y });

            requestAnimationFrame(loop);
        };
        loop();

        // Magnetism
        document.querySelectorAll('a, button, .gallery-item').forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('active'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
        });
    }

    // --- 3. LIQUID DISTORTION (Three.js) ---
    initLiquidGL() {
        if (!window.THREE) return;

        // Container
        const container = document.createElement('div');
        container.id = 'webgl-container';
        container.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100vh; z-index:-1; pointer-events:none; opacity:0.6; transition: opacity 0.5s ease;';
        document.body.prepend(container);

        // Scene Setup
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        // Uniforms for Shader (Exposed to Class)
        this.uniforms = {
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector2(0.5, 0.5) },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            uHover: { value: 0.0 } // New Control Uniform
        };

        // Plane (Full Screen)
        const geometry = new THREE.PlaneGeometry(2, 2);

        // Custom Shader (The Liquid Magic)
        const material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform vec2 uMouse;
                uniform vec2 uResolution;
                uniform float uHover; 
                varying vec2 vUv;

                // Noise function
                float random (in vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }

                float noise (in vec2 st) {
                    vec2 i = floor(st);
                    vec2 f = fract(st);
                    float a = random(i);
                    float b = random(i + vec2(1.0, 0.0));
                    float c = random(i + vec2(0.0, 1.0));
                    float d = random(i + vec2(1.0, 1.0));
                    vec2 u = f * f * (3.0 - 2.0 * f);
                    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
                }

                void main() {
                    vec2 st = gl_FragCoord.xy/uResolution.xy;
                    
                    // Liquid Motion
                    // Sped up slightly on hover
                    float t = uTime * (0.2 + uHover * 0.3); 
                    float n = noise(st * 3.0 + t);
                    
                    // Mouse Interaction
                    float dist = distance(st, uMouse);
                    // uHover boosts the effect radius and intensity
                    float mouseEffect = smoothstep(0.4 + uHover * 0.2, 0.0, dist) * (0.1 + uHover * 0.15);

                    // Color: Deep Santis Grey with Gold Hints
                    vec3 color = vec3(0.05, 0.06, 0.08); // Base Dark
                    color += vec3(0.02, 0.02, 0.05) * n; // Texture
                    color += vec3(0.8, 0.6, 0.2) * mouseEffect * n; // Gold Ripple

                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            transparent: true
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // Mouse Tracker for GL
        window.addEventListener('mousemove', (e) => {
            this.uniforms.uMouse.value.x = e.clientX / window.innerWidth;
            this.uniforms.uMouse.value.y = 1.0 - (e.clientY / window.innerHeight);
        });

        // Animation Loop
        const animate = (time) => {
            this.uniforms.uTime.value = time * 0.001;
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };
        animate();

        // Resize Sizing
        window.addEventListener('resize', () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            this.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
        });

        console.log("🌌 Three.js Liquid Engine Active");
    }

    // --- 4. INTERACTION API ---
    bindHover(isActive) {
        if (!this.uniforms) return;
        // Smooth transition using GSAP
        gsap.to(this.uniforms.uHover, {
            value: isActive ? 1.0 : 0.0,
            duration: 1.5,
            ease: "power2.out"
        });

        // Also fade container opacity slightly
        const container = document.getElementById('webgl-container');
        if (container) {
            container.style.opacity = isActive ? "0.8" : "0.6";
        }
    }
}

// Init when DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    window.SantisV6 = new SantisEngine();
});
