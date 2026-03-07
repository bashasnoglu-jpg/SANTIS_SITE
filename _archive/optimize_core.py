
path = r"C:\Users\tourg\Desktop\SANTIS_SITE\assets\js\santis-core-v6.js"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# I will locate the start of InitCursor block and end of InitLiquidGL block
start_marker = "    // --- 2. MAGNETIC CURSOR (GSAP) ---"
end_marker = "    // --- 4. INTERACTION API ---"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + """    // --- 2. MAGNETIC CURSOR (GSAP) ---
    initCursor() {
        if (window.matchMedia("(pointer: coarse)").matches) return; // No mobile

        const cursor = document.createElement('div');
        cursor.className = 'nv-cursor-v6';
        document.body.appendChild(cursor);

        // SHARED STATE (For both Cursor and WebGL)
        this.mouseState = { x: window.innerWidth/2, y: window.innerHeight/2 };
        this.cursorPos = { x: window.innerWidth/2, y: window.innerHeight/2 };
        const speed = 0.15; 

        // SINGLE OPTIMIZED LISTENER (Passive)
        window.addEventListener('mousemove', (e) => {
            this.mouseState.x = e.clientX;
            this.mouseState.y = e.clientY;
        }, { passive: true });

        const loop = () => {
            // Lerp Cursor
            this.cursorPos.x += (this.mouseState.x - this.cursorPos.x) * speed;
            this.cursorPos.y += (this.mouseState.y - this.cursorPos.y) * speed;

            // GSAP Update
            if (window.gsap) {
                gsap.set(cursor, { x: this.cursorPos.x, y: this.cursorPos.y });
            }

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
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false }); // Disable AA for perf
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap Pixel Ratio
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

        // No more separate listener! Updates in RAF loop.

        // Animation Loop
        const animate = (time) => {
            this.uniforms.uTime.value = time * 0.001;

            // SYNC MOUSE HERE (From Shared State)
            if (this.mouseState) {
                this.uniforms.uMouse.value.x = this.mouseState.x / window.innerWidth;
                this.uniforms.uMouse.value.y = 1.0 - (this.mouseState.y / window.innerHeight);
            }

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

""" + content[end_idx:]

    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Optimized santis-core-v6.js")
else:
    print("Markers not found")
