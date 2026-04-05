import re

html_path = 'admin/gods-eye-vision.html'
js_path = 'admin/modules/gods_eye.js'

with open(html_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Extract inner body content
match = re.search(r'<div class="h-full w-full flex flex-col" id="app">(.*?)</div>\s*<script', text, re.DOTALL)
if not match:
    match = re.search(r'<body[^>]*>(.*?)<script', text, re.DOTALL)

body_html = match.group(1).strip() if match else '<div>NOT FOUND</div>'
# Escape backticks and internal dollar signs just in case
body_html = body_html.replace('`', '\\`')
body_html = body_html.replace('${', '\\${')

# Convert absolute internal links to data-link
body_html = re.sub(r'<a([^>]+)href=["\']/admin/([^"\']+)["\']([^>]*)>', r'<a\1href="/admin/\2" data-link\3>', body_html)
body_html = re.sub(r'target=["\']_blank["\']', '', body_html)

# Extract script blocks to migrate
script_match = re.search(r'<script>(.*?)</script>', text, re.DOTALL)
script_content = script_match.group(1).strip() if script_match else ''
script_content = script_content.replace("document.addEventListener('DOMContentLoaded', () => {", "function igniteLegacy(signal) {")

# Find the last }); to replace with just }
last_idx = script_content.rfind('});')
if last_idx != -1:
    script_content = script_content[:last_idx] + '}' + script_content[last_idx+3:]

module_template = f'''/**
 * SANTIS MODULE: God\\'s Eye Vision (Elite Lifecycle v2 + Cortex)
 * Ref: Surgical Migration - Phase 7
 * Status: Deployment Ready
 */

export const meta = {{ 
    name: "gods_eye",
    preload: false, 
    keepAlive: false 
}};

let viewAbortController = null;
let activeEcharts = [];
let radarWorker = null;
let webglCtx = null;
let animationFrameId = null;

let gl, shaderProgram, positionBuffer;

export async function mount(viewport, ctx) {{
    console.log("🟢 [God\\'s Eye] Initializing Sovereign Z-Engine...");
    
    viewAbortController = new AbortController();
    const {{ signal }} = viewAbortController;

    // 1. High-Performance Template Injection
    viewport.innerHTML = `
        <div class="gods-eye-wrapper opacity-0 translate-y-2 transition-all duration-300 h-full w-full relative bg-[#050505] text-gray-200 font-sans antialiased">
            <style>
                .text-santis-gold {{ color: #C9A96E; }}
                .bg-santis-gold {{ background-color: #C9A96E; }}
                .border-santis-gold {{ border-color: #C9A96E; }}
                .custom-scroll::-webkit-scrollbar {{ width: 4px; }}
                .custom-scroll::-webkit-scrollbar-track {{ background: #111; }}
                .custom-scroll::-webkit-scrollbar-thumb {{ background: #333; border-radius: 4px; }}
                .custom-scroll::-webkit-scrollbar-thumb:hover {{ background: #C9A96E; }}
                .chart-container {{ position: relative; width: 100%; max-width: 800px; margin: 0 auto; height: 40vh; min-height: 300px; max-height: 450px; }}
                .perspective-container {{ perspective: 1000px; }}
                .tilt-card {{ transition: transform 0.1s ease-out; transform-style: preserve-3d; }}
                .tilt-content {{ transform: translateZ(30px); }}
                #zray-canvas {{ width: 100%; height: 100%; border-radius: 0.75rem; background: linear-gradient(135deg, #111 0%, #1a1a1a 100%); }}
                @keyframes pulse-gold {{ 0%, 100% {{ box-shadow: 0 0 10px rgba(201, 169, 110, 0.3); }} 50% {{ box-shadow: 0 0 25px rgba(201, 169, 110, 0.6); }} }}
                .gold-glow {{ animation: pulse-gold 2s infinite; }}
                .nav-btn-active {{ background: rgba(201, 169, 110, 0.15) !important; border-color: rgba(201, 169, 110, 0.5) !important; color: #C9A96E !important; }}
            </style>
            <div class="h-full w-full flex flex-col" id="app">
                {body_html}
            </div>
        </div>
    `;

    // 2. Worker Fabric Connection
    initRadarWorker(signal);

    // 3. Setup Legacy Assets (ChartJS)
    const loadScript = (src) => new Promise(resolve => {{
        if (document.querySelector(`script[src="${{src}}"]`)) return resolve();
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.crossOrigin = "anonymous";
        document.head.appendChild(s);
    }});
    await loadScript("https://cdn.jsdelivr.net/npm/chart.js");

    // 4. Quiet Luxury Appearance & Ignite Legacy Logic
    requestAnimationFrame(() => {{
        const wrapper = viewport.querySelector('.gods-eye-wrapper');
        if(wrapper) {{
            wrapper.classList.remove('opacity-0', 'translate-y-2');
            wrapper.classList.add('opacity-100', 'translate-y-0');
        }}

        // Small delay to let DOM paint before grabbing canvas
        setTimeout(() => {{
             // The old JS logic (ChartJS radar etc)
             igniteLegacy(signal);
             
             // Setup WebGL over chart container
             setupWebGLRadar();
        }}, 100);
    }});
}}

export async function unmount() {{
    console.log("🔴 [God\\'s Eye] Unmounting... Executing Clean Kill Protocol.");
    
    if (viewAbortController) {{
        viewAbortController.abort();
        viewAbortController = null;
    }}

    // Terminate Worker
    if (radarWorker) {{
        radarWorker.postMessage({{ type: "STOP" }});
        radarWorker.terminate();
        radarWorker = null;
    }}

    if (animationFrameId) {{
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }}

    // Echarts Cleanup
    activeEcharts.forEach(elId => {{
        const el = document.getElementById(elId);
        if (el && window.echarts) {{
            const chart = window.echarts.getInstanceByDom(el);
            if (chart) chart.dispose();
        }}
    }});
    activeEcharts = [];
}}

function initRadarWorker(signal) {{
    radarWorker = new Worker('/admin/assets/js/workers/radar-worker.js');
    radarWorker.postMessage({{ type: "START" }});

    radarWorker.onmessage = (e) => {{
        if (e.data.type === "RADAR_TICK") {{
            const particles = new Float32Array(e.data.particles);
            const anomalies = e.data.anomalies;
            
            // Render on WebGL
            if(gl && shaderProgram) renderWebGL(particles);

            // Push to Cortex State Engine (Zero-Jank sync)
            if (window.SantisState && anomalies > 0) {{
                // Ping state engine so other modules (e.g. Nav Pulse) react
                window.SantisState.systemPulse = "CRITICAL";
                window.SantisState.radarAlerts = (window.SantisState.radarAlerts || 0) + anomalies;
            }}
        }}
    }};
}}

// WEBGL RENDERING
function setupWebGLRadar() {{
    const container = document.querySelector('#insight .chart-container');
    if (!container) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    // We overlay the WebGL over the existing canvas
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.borderRadius = '12px';
    canvas.style.pointerEvents = 'none'; // let clicks pass through to UI underneath if any or just let chart.js have the hover
    container.appendChild(canvas);

    gl = canvas.getContext('webgl2', {{ alpha: true, antialias: true, depth: false }});
    if (!gl) {{
        console.warn('WebGL 2 not supported, particle engine disabled.');
        return;
    }}

    const vsSource = `
        attribute vec3 a_position; // x,y, size
        uniform vec2 u_resolution;
        uniform float u_time;
        varying float v_pulse;
        void main() {{
            vec2 pos = a_position.xy;
            // Map to clipspace, keeping it somewhat centered
            vec2 clipSpace = (pos / 120.0);
            
            // Apply slight perspective offset based on time and height to make it "God's Eye" 3D
            mat2 rot = mat2(cos(u_time*0.1), -sin(u_time*0.1), sin(u_time*0.1), cos(u_time*0.1));
            vec2 rotated = rot * clipSpace;
            
            gl_Position = vec4(rotated.x, rotated.y, 0.0, 1.0);
            gl_PointSize = a_position.z * 1.5;
            v_pulse = sin(u_time * 2.0 + (a_position.x * a_position.y)) * 0.5 + 0.5;
        }}
    `;

    const fsSource = `
        precision mediump float;
        varying float v_pulse;
        void main() {{
            vec2 pt = gl_PointCoord - vec2(0.5);
            if(dot(pt, pt) > 0.25) discard;
            // Mix between Santis Gold and bright yellow
            vec3 color = mix(vec3(0.788, 0.663, 0.431), vec3(1.0, 0.9, 0.6), v_pulse);
            gl_FragColor = vec4(color, mix(0.1, 0.6, v_pulse));
        }}
    `;

    function loadShader(type, source) {{
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {{
            console.error('Shader error: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }}
        return shader;
    }}

    const vertexShader = loadShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource);

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    positionBuffer = gl.createBuffer();
    
    // Enable blending for that glowing 'radar' look
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
}}

function renderWebGL(particles) {{
    if (!gl || !shaderProgram) return;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    // Clear to fully transparent so background shows through
    gl.clearColor(0, 0, 0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(shaderProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particles, gl.DYNAMIC_DRAW);

    const positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    // 3 components (x, y, size), float
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

    const timeLoc = gl.getUniformLocation(shaderProgram, "u_time");
    gl.uniform1f(timeLoc, Date.now() / 1000.0);

    const numParticles = particles.length / 3;
    gl.drawArrays(gl.POINTS, 0, numParticles);
}}

// ─── LEGACY SCRIPTS ───
{script_content}
'''

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(module_template)

print('Successfully generated gods_eye.js')
