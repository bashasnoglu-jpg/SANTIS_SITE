/**
 * SANTIS OS - SOVEREIGN GPU FIELD (KUANTUM TUVALİ)
 * Instanced Rendering, Float32Array Pipeline via WebGL2
 */

export class SovereignGPUField {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`[Sovereign GPU Field] #${canvasId} bulunamadı!`);
            return;
        }

        this.gl = this.canvas.getContext('webgl2', {
            alpha: true,
            antialias: false,
            depth: false,
            preserveDrawingBuffer: false
        });

        if (!this.gl) {
            console.error("[Sovereign GPU Field] WebGL2 desteklenmiyor. Fallback moduna geçiliyor.");
            return;
        }

        // --- SISTEM LIMITLERI (SESSİZ LÜKS) ---
        // Saniyede 120 FPS akıcılığı için optimum maksimum kart sayısı
        this.MAX_CARDS = 200;

        // Veri Otoyolu: Şerit Genişliği (Stride) -> 32 Bayt
        // x(4), y(4), w(4), h(4), r(4), g(4), b(4), effect(4) = 8 * 4 = 32
        this.STRIDE_BYTES = 32;

        // O(1) Güncelleme Havuzu (CPU tarafındaki Buffer)
        this.instanceBufferData = new Float32Array(this.MAX_CARDS * 8);
        this.activeCardCount = 0;

        // Yüklemeler
        this.program = this.createShaderProgram();
        this.setupGeometry();
        this.bindInstancedAttributes();

        // Responsive Canvas
        this.resize();
        window.addEventListener('resize', () => {
            this.resize();
            this.updateResolutionUniform();
        });
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    updateResolutionUniform() {
        this.gl.useProgram(this.program);
        const u_res = this.gl.getUniformLocation(this.program, "u_resolution");
        this.gl.uniform2f(u_res, window.innerWidth, window.innerHeight);
    }

    /**
     * GPU Veri Otoyolunu Doldurur (Data Pipeline)
     * @param {Map} activeCardsCache Layout Mesh'ten gelen Intersection önbelleği
     * @param {Number} globalScrollY Sayfanın kaydırma miktarı (O(1) Scroll Mimarisi)
     */
    syncWithLayoutMesh(activeCardsCache, globalScrollY = 0) {
        let count = 0;

        // Observer Mesh'in "Sadece Görünür Kartlar" önbelleği üzerinde gez
        for (let [, data] of activeCardsCache) {
            if (count >= this.MAX_CARDS) break;

            const baseIndex = count * 8;

            // Konum ve Boyut (Layout)
            this.instanceBufferData[baseIndex + 0] = data.x;
            this.instanceBufferData[baseIndex + 1] = data.y - globalScrollY; // Kuantum Kaydırma Formülü!
            this.instanceBufferData[baseIndex + 2] = data.w;
            this.instanceBufferData[baseIndex + 3] = data.h;

            // DNA (Renk & Türbülans/Effect)
            this.instanceBufferData[baseIndex + 4] = data.dna.color[0];
            this.instanceBufferData[baseIndex + 5] = data.dna.color[1];
            this.instanceBufferData[baseIndex + 6] = data.dna.color[2];
            this.instanceBufferData[baseIndex + 7] = data.dna.effect;

            count++;
        }

        this.activeCardCount = count;

        if (this.activeCardCount > 0) {
            // GPU VRAM'ine 32 Baytlık mermileri (Float32Array) yolla
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.instance);

            // bufferSubData: Tüm Array'i değil SADECE DEĞİŞEN VERİYİ günceller (Sovereign Hızı)
            const subArray = new Float32Array(this.instanceBufferData.buffer, 0, count * 8);
            this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, subArray);
        }
    }

    /**
     * Kuantum Tuvalini Ateşler. RAF döngüsü içinden saniyede 60 kez çağrılır.
     * @param {Number} timeInSeconds u_time (Zaman uniform'u)
     */
    render(timeInSeconds) {
        if (this.activeCardCount === 0) return; // Çizilecek bir şey yok, GPU yatsın (Maksimum Pil Ömrü)

        const gl = this.gl;
        gl.useProgram(this.program);

        // Zaman rüzgarını estir (Türbülans Animasyonu)
        gl.uniform1f(gl.getUniformLocation(this.program, "u_time"), timeInSeconds);

        // Kuantum Çizim Emri (Instanced Render)
        gl.bindVertexArray(this.vao);
        // Triangles, 0. köşeden başla, 6 köşe çiz (1 Dikdörtgen), ve bunu N KART İÇİN TEKRARLA!
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.activeCardCount);

        gl.bindVertexArray(null);
    }

    // --- DONANIM KÖPRÜSÜ (VERTEX & FRAGMENT KURULUMU) ---

    setupGeometry() {
        const gl = this.gl;
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        // Şablon Dikdörtgen Geometrisi (UV map: 0..1 arası)
        const quadVertices = new Float32Array([
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            0.0, 1.0,
            1.0, 0.0,
            1.0, 1.0
        ]);

        this.buffers = {
            quad: gl.createBuffer(),
            instance: gl.createBuffer()
        };

        // 1. Şablon Vertex Buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.quad);
        gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

        const a_position = gl.getAttribLocation(this.program, "a_position");
        gl.enableVertexAttribArray(a_position);
        gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

        // 2. Instanced Otoyolu Buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.instance);
        gl.bufferData(gl.ARRAY_BUFFER, this.instanceBufferData.byteLength, gl.DYNAMIC_DRAW);
    }

    bindInstancedAttributes() {
        const gl = this.gl;
        const STRIDE = this.STRIDE_BYTES; // 32

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.instance);

        // 1. a_rect (x,y,w,h) -> Offset: 0
        const a_rect = gl.getAttribLocation(this.program, "a_rect");
        gl.enableVertexAttribArray(a_rect);
        gl.vertexAttribPointer(a_rect, 4, gl.FLOAT, false, STRIDE, 0);
        gl.vertexAttribDivisor(a_rect, 1);

        // 2. a_color (r,g,b) -> Offset: 16
        const a_color = gl.getAttribLocation(this.program, "a_color");
        gl.enableVertexAttribArray(a_color);
        gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, STRIDE, 16);
        gl.vertexAttribDivisor(a_color, 1);

        // 3. a_effect (effect) -> Offset: 28
        const a_effect = gl.getAttribLocation(this.program, "a_effect");
        gl.enableVertexAttribArray(a_effect);
        gl.vertexAttribPointer(a_effect, 1, gl.FLOAT, false, STRIDE, 28);
        gl.vertexAttribDivisor(a_effect, 1);

        gl.bindVertexArray(null); // VAO mühürle
    }

    createShaderProgram() {
        const gl = this.gl;

        // KOMUTANIN ONAYLADIĞI VERTEX SHADER (Clip-Space Transformasyonu)
        const vsSource = `#version 300 es
        in vec2 a_position;
        in vec4 a_rect;    // (x, y, w, h)
        in vec3 a_color;
        in float a_effect;

        uniform vec2 u_resolution;

        out vec2 v_uv;
        out vec3 v_color;
        out float v_effect;

        void main() {
            vec2 pixelPosition = (a_position * a_rect.zw) + a_rect.xy;
            vec2 clipSpace = (pixelPosition / u_resolution) * 2.0 - 1.0;
            // WebGL Y ekseni tarayıcıya göre terstir, düzeltilir.
            gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);

            v_uv = a_position;
            v_color = a_color;
            v_effect = a_effect;
        }`;

        // MİSTİK GHOST FORGE FRAGMENT SHADER (Quiet Luxury & Sovereign Vignette)
        const fsSource = `#version 300 es
        precision highp float;

        in vec2 v_uv;
        in vec3 v_color;
        in float v_effect;

        uniform float u_time;
        out vec4 outColor;

        // Performanslı 2D Simplex Noise Fonksiyonu (Sessiz Lüks)
        vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        float snoise(vec2 v){
          const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                   -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy) );
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1; i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
          i = mod(i, 289.0);
          vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m; m = m*m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        void main() {
            // Zaman ve Türbülans Etkisiyle Yukan Akan UV
            vec2 flowedUV = v_uv;
            flowedUV.y -= u_time * 0.15 * v_effect; // Aura etkisi

            // Organik Hacimsel Duman Dokusu
            float n = snoise(flowedUV * 2.5 + (u_time * 0.1));
            // Sınırlama (Daha az agresif, ipeksi geçiş)
            n = smoothstep(-0.4, 0.6, n); 

            // Vignette (Kenar Karartma) - Kuantum Yerçekimi Maskesi
            float dist = distance(v_uv, vec2(0.5, 0.5));
            // 0.2'ye kadar saf ışık, 0.6'da mutlak karanlık (Obsidyen) - Işık Yerçekimi
            float vignette = smoothstep(0.6, 0.2, dist);

            // Rengi mühürle (Pavyon ve yapay ışık yansımalarından kaçınarak)
            // Renk * Gürültü Kuvveti * Karartma Maskesi
            vec3 finalColor = v_color * (n + 0.2) * vignette * 1.5;

            // Kenarlarda tamamen transparanlık, ortada yoğun duman
            float finalAlpha = vignette * v_effect * n;
            
            outColor = vec4(finalColor, finalAlpha);
        }`;

        const vShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vShader, vsSource);
        gl.compileShader(vShader);
        if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
            console.error("[GPU Field] Vertex Error:", gl.getShaderInfoLog(vShader));
        }

        const fShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fShader, fsSource);
        gl.compileShader(fShader);
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
            console.error("[GPU Field] Fragment Error:", gl.getShaderInfoLog(fShader));
        }

        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vShader);
        gl.attachShader(shaderProgram, fShader);
        gl.linkProgram(shaderProgram);

        gl.useProgram(shaderProgram);
        this.updateResolutionUniform();

        return shaderProgram;
    }
}
window.SovereignGPUField = SovereignGPUField;
