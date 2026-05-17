/**
 * SANTIS MODULE: God's Eye Vision (Elite Lifecycle v2 + WebGL + Cortex)
 * Ref: Surgical Migration - Phase 7
 * Status: Deployment Ready
 */

export default class GodsEyeModule {
    constructor(engine) {
        this.engine = engine;
        this.viewAbortController = null;
        this.radarWorker = null;
        this.gl = null;
        this.shaderProgram = null; 
        this.positionBuffer = null;
        this.targetListEl = null;

        // Bind contextual methods
        this.renderWebGL = this.renderWebGL.bind(this);
    }

    render() {
        return `
        <div class="gods-eye-wrapper opacity-0 transition-opacity duration-300 h-full w-full bg-[#050505] text-[#d1d5db] font-mono flex flex-col relative overflow-hidden">
            <!-- HEADER -->
            <header class="h-16 border-b border-gray-800/60 bg-black/50 backdrop-blur-xl flex items-center justify-between px-6 z-10 shrink-0">
                <div class="flex items-center gap-4">
                    <h1 class="text-xl font-bold tracking-widest text-white">SANTIS <span class="text-[#C9A96E] font-normal text-sm ml-1">GOD'S EYE VISION</span></h1>
                    <div class="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-950/30 border border-emerald-800/30 rounded text-[10px] text-emerald-400">
                        <span class="animate-pulse">●</span> SYSTEM ONLINE
                    </div>
                </div>
            </header>

            <!-- MAIN CONTENT -->
            <div class="flex-1 w-full relative flex">
                <div class="flex-1 w-full relative p-4" id="radar-container" style="background: radial-gradient(circle at center, #111 0%, #000 100%);">
                    <canvas id="radar-canvas" class="w-full h-full rounded-2xl border border-gray-800/50 shadow-2xl"></canvas>
                </div>
                
                <!-- SIDEBAR TARGET LIST -->
                <div class="w-64 border-l border-gray-800/60 bg-black/40 p-4 flex flex-col gap-2">
                    <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800/50 pb-2 mb-2">Anomalous Targets</div>
                    <div id="target-list" class="flex-1 overflow-y-auto custom-scroll text-[10px] space-y-1"></div>
                </div>
            </div>
        </div>
        `;
    }

    async mount() {
        console.log("🟢 [God's Eye] Booting Z-Engine (WebGL/Worker)...");
        
        this.viewAbortController = new AbortController();
        const { signal } = this.viewAbortController;

        // Container is set by santis-core, but we select internal parts
        const viewport = document.getElementById('santis-master-viewport');
        if(!viewport) return; // fail safe

        this.targetListEl = viewport.querySelector('#target-list');

        // 2. Setup WebGL over the canvas
        this.setupWebGLRadar(viewport);

        // 3. Initiate Worker Fabric Connection
        this.initRadarWorker(signal);

        // Fade In
        requestAnimationFrame(() => {
            const wrapper = viewport.querySelector('.gods-eye-wrapper');
            if(wrapper) {
                wrapper.classList.remove('opacity-0');
                wrapper.classList.add('opacity-100');
            }
        });
    }

    unmount() {
        console.log("🔴 [God's Eye] Unmounting... Executing Clean Kill Protocol.");
        
        if (this.viewAbortController) {
            this.viewAbortController.abort();
            this.viewAbortController = null;
        }

        // Terminate Worker
        if (this.radarWorker) {
            this.radarWorker.postMessage({ type: "STOP" });
            this.radarWorker.terminate();
            this.radarWorker = null;
        }

        // Destroy WebGL context loosely
        if (this.gl) {
            const ext = this.gl.getExtension('WEBGL_lose_context');
            if (ext) ext.loseContext();
            this.gl = null;
        }
    }

    initRadarWorker(signal) {
        this.radarWorker = new Worker('/admin/assets/js/workers/radar-worker.js');
        this.radarWorker.postMessage({ type: "START" });

        let frameCount = 0;

        this.radarWorker.onmessage = (e) => {
            if (e.data.type === "RADAR_TICK") {
                const particles = new Float32Array(e.data.particles);
                const targets = e.data.targets; // New targets array passed from worker
                
                // 1. Render on WebGL Layer (GPU)
                if(this.gl && this.shaderProgram) this.renderWebGL(particles);

                frameCount++;
                
                // 2. Update DOM minimally (throttle to prevent layout thrashing)
                if (frameCount % 4 === 0 && this.targetListEl) {
                    const htmlFrag = targets.map(t => `<div class="text-emerald-400 p-1 bg-emerald-950/20 border border-emerald-900/40 rounded fade-in">Spotted: ${t.id}</div>`).join('');
                    if (htmlFrag !== this.targetListEl.innerHTML) {
                        this.targetListEl.innerHTML = htmlFrag;
                    }
                }

                // 3. Push to Cortex State Engine (Zero-Jank sync)
                if (window.SantisState && targets.length > 5) {
                    // Ping state engine so other modules (e.g. Nav Pulse) react
                    window.SantisState.systemPulse = "CRITICAL";
                    window.SantisState.radarAlerts = (window.SantisState.radarAlerts || 0) + 1;
                }
            }
        };
    }

    // WEBGL RENDERING
    setupWebGLRadar(viewport) {
        const canvas = viewport.querySelector('#radar-canvas');
        if (!canvas) return;
        
        // Explicit sizing for WebGL
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, depth: false });
        this.gl = gl;
        
        if (!gl) {
            console.warn('WebGL 2 not supported.');
            return;
        }

        const vsSource = `
            attribute vec3 a_position; // x,y, size
            uniform float u_time;
            varying float v_pulse;
            void main() {
                // Map 0-800 to clip space -1.0 to 1.0
                vec2 pos = a_position.xy;
                vec2 clipSpace = (pos / 400.0) - 1.0;
                
                gl_Position = vec4(clipSpace, 0.0, 1.0);
                gl_PointSize = a_position.z;
                
                v_pulse = sin(u_time * 5.0 + a_position.x * 0.1) * 0.5 + 0.5;
            }
        `;

        const fsSource = `
            precision mediump float;
            varying float v_pulse;
            void main() {
                vec2 pt = gl_PointCoord - vec2(0.5);
                if(dot(pt, pt) > 0.25) discard;
                // Matrix Green color
                vec3 color = mix(vec3(0.0, 0.5, 0.0), vec3(0.0, 1.0, 0.0), v_pulse);
                gl_FragColor = vec4(color, mix(0.3, 0.9, v_pulse));
            }
        `;

        function loadShader(type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error('Shader error: ' + gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        }

        const vertexShader = loadShader(gl.VERTEX_SHADER, vsSource);
        const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource);

        this.shaderProgram = gl.createProgram();
        gl.attachShader(this.shaderProgram, vertexShader);
        gl.attachShader(this.shaderProgram, fragmentShader);
        gl.linkProgram(this.shaderProgram);

        this.positionBuffer = gl.createBuffer();
        
        // Enable blending for that glowing 'radar' look
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    }

    renderWebGL(particles) {
        if (!this.gl || !this.shaderProgram) return;

        const gl = this.gl;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this.shaderProgram);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, particles, gl.DYNAMIC_DRAW);

        const positionLocation = gl.getAttribLocation(this.shaderProgram, "a_position");
        gl.enableVertexAttribArray(positionLocation);
        // 3 components (x, y, size), float
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

        const timeLoc = gl.getUniformLocation(this.shaderProgram, "u_time");
        gl.uniform1f(timeLoc, Date.now() / 1000.0);

        const numParticles = particles.length / 3;
        gl.drawArrays(gl.POINTS, 0, numParticles);
    }
}
