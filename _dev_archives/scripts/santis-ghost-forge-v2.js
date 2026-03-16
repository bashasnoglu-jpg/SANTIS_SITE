/**
 * SANTIS QUANTUM OS - GHOST FORGE V2.0 (VOLUMETRIC ENGINE)
 * Sovereign Raymarching & SDF Simulation with God Rays
 */

export const GhostForgeV2 = {
    canvas: null,
    gl: null,
    program: null,
    uniforms: {},
    time: 0,
    animationFrameId: null,

    // Sovereign Data Bridge (Lerp Vectors)
    targetMouse: { x: 0, y: 0 },
    currentMouse: { x: 0, y: 0 },

    // Sentinel Control: dynamically adjusted based on DropRatio
    qualitySteps: 40.0,

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return false;

        // Disable depth and antialias for raw fragment performance
        this.gl = this.canvas.getContext('webgl', { alpha: true, antialias: false, depth: false });

        if (!this.gl) {
            console.warn("[Ghost Forge v2] Hardware acceleration unavailable. Volumetrics falling back to Core Stasis.");
            return false;
        }

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.buildNeuralShaders();
        this.setupGeometry();
        this.setupNeuralBridge();
        this.ignite();

        console.log("🦅 [Ghost Forge v2] Volumetric SDF Engine Online. God Rays mathematical core engaged.");
        return true;
    },

    resize() {
        const dpr = window.devicePixelRatio || 1;
        // Optimization: Use lower resolution for volumes, upscale via CSS
        this.canvas.width = this.canvas.clientWidth * (dpr * 0.5);
        this.canvas.height = this.canvas.clientHeight * (dpr * 0.5);
        if (this.gl) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    },

    buildNeuralShaders() {
        const vsSource = `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;

        // The Sovereign Volumetric Math
        const fsSource = `
            precision highp float;
            
            uniform vec2 u_resolution;
            uniform float u_time;
            uniform vec2 u_mouse;
            uniform float u_quality_steps; // Sentinel injected

            // Fast Hash & 3D Noise for volume disruption
            float hash(vec3 p) {
                p = fract(p * 0.3183099 + vec3(.1));
                p *= 17.0;
                return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
            }

            float noise(vec3 x) {
                vec3 i = floor(x);
                vec3 f = fract(x);
                f = f * f * (3.0 - 2.0 * f);
                
                return mix(
                    mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)),f.x),
                        mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)),f.x),f.y),
                    mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)),f.x),
                        mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)),f.x),f.y),f.z
                );
            }

            // Fractal Brownian Motion for Organic Fog
            float fbm(vec3 p) {
                float f = 0.0, amp = 0.5;
                for(int i = 0; i < 4; i++) {
                    f += amp * noise(p);
                    p *= 2.0; 
                    amp *= 0.5;
                }
                return f;
            }

            // The Sovereign SDF: A sphere disrupted by quantum noise over time
            float map(vec3 p) {
                float sphere = length(p) - 1.2;
                float n = fbm(p * 2.0 - vec3(0.0, u_time*0.5, u_time*0.2));
                return sphere + n * 1.5;
            }

            void main() {
                vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
                
                // Camera Ray (ro) offset by mouse/gyro
                vec3 ro = vec3(u_mouse.x * 0.5, u_mouse.y * 0.5, 3.0);
                vec3 rd = normalize(vec3(uv, -1.0));
                
                // Virtual Light Source orbiting the volume
                vec3 lightPos = vec3(2.0 * sin(u_time * 0.5), 1.5, 2.0 * cos(u_time * 0.5));
                vec3 santisGold = vec3(0.83, 0.68, 0.21); // #D4AF37
                vec3 obsidian = vec3(0.02, 0.02, 0.04);
                
                float t = 0.0;
                float density = 0.0;
                vec3 col = vec3(0.0);
                float transmittance = 1.0;
                
                int max_steps = int(u_quality_steps);
                
                // RAYMARCHING LOOP
                for(int i = 0; i < 60; i++) {
                    if(i >= max_steps) break; // Sentinel limits the loop
                    
                    vec3 p = ro + rd * t;
                    float d = map(p);
                    
                    // Inside the quantum fog
                    if(d < 0.05) {
                        float stepDensity = 0.06;
                        density += stepDensity;
                        
                        // God Rays: Shadow calculation towards the light
                        vec3 ldir = normalize(lightPos - p);
                        float shadowDist = map(p + ldir * 0.1);
                        // If shadowDist is positive, light passes through. 
                        float lightAccum = smoothstep(-0.2, 0.3, shadowDist); 
                        
                        // Mix ambient obsidian with striking gold rays scattered in the fog
                        vec3 stepColor = mix(obsidian, santisGold, lightAccum * 1.5) * stepDensity;
                        col += stepColor * transmittance;
                        transmittance *= (1.0 - stepDensity);
                        
                        if(transmittance < 0.01) break; // Optimization: early exit if opaque
                    }
                    
                    // Advance ray safely
                    t += max(d * 0.5, 0.03); 
                }
                
                // Blend with alpha for web integration over the DOM
                gl_FragColor = vec4(col, 1.0 - transmittance);
            }
        `;

        const compileShader = (type, source) => {
            const shader = this.gl.createShader(type);
            this.gl.shaderSource(shader, source);
            this.gl.compileShader(shader);
            if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
                console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
                this.gl.deleteShader(shader);
                return null;
            }
            return shader;
        };

        const vs = compileShader(this.gl.VERTEX_SHADER, vsSource);
        const fs = compileShader(this.gl.FRAGMENT_SHADER, fsSource);

        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vs);
        this.gl.attachShader(this.program, fs);
        this.gl.linkProgram(this.program);

        this.uniforms.u_resolution = this.gl.getUniformLocation(this.program, "u_resolution");
        this.uniforms.u_time = this.gl.getUniformLocation(this.program, "u_time");
        this.uniforms.u_mouse = this.gl.getUniformLocation(this.program, "u_mouse");
        this.uniforms.u_quality_steps = this.gl.getUniformLocation(this.program, "u_quality_steps");
    },

    setupGeometry() {
        // Full screen quad
        const vertices = new Float32Array([
            -1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
            -1.0, 1.0, 1.0, -1.0, 1.0, 1.0
        ]);
        const vbo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

        const positionAttrib = this.gl.getAttribLocation(this.program, "a_position");
        this.gl.enableVertexAttribArray(positionAttrib);
        this.gl.vertexAttribPointer(positionAttrib, 2, this.gl.FLOAT, false, 0, 0);
    },

    setupNeuralBridge() {
        // Desktop Pointer Parallax
        window.addEventListener('mousemove', (e) => {
            this.targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        }, { passive: true });

        // Mobile Gyroscope Parallax (Sovereign Sensor)
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                if (e.gamma === null || e.beta === null) return;
                let x = e.gamma / 30.0;
                let y = (e.beta - 45.0) / 30.0;
                this.targetMouse.x = Math.max(-1, Math.min(1, x));
                this.targetMouse.y = Math.max(-1, Math.min(1, -y));
            }, { passive: true });
        }
    },

    // Sentinel can call this to downgrade rendering on weak phones
    setSentinelQuality(tier) {
        if (tier === 'ULTRA') this.qualitySteps = 50.0;
        else if (tier === 'FADE') this.qualitySteps = 24.0;
        else this.qualitySteps = 10.0;
    },

    ignite() {
        this.time = 0;
        const render = (timestamp) => {
            this.time += 0.01;

            // Kineti-Core LERP (Smooth Inertia for Mouse/Gyro)
            this.currentMouse.x += (this.targetMouse.x - this.currentMouse.x) * 0.04;
            this.currentMouse.y += (this.targetMouse.y - this.currentMouse.y) * 0.04;

            this.gl.useProgram(this.program);
            this.gl.uniform2f(this.uniforms.u_resolution, this.canvas.width, this.canvas.height);
            this.gl.uniform1f(this.uniforms.u_time, this.time);
            this.gl.uniform2f(this.uniforms.u_mouse, this.currentMouse.x, this.currentMouse.y);
            this.gl.uniform1f(this.uniforms.u_quality_steps, this.qualitySteps);

            this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);

            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

            this.animationFrameId = requestAnimationFrame(render);
        };
        this.animationFrameId = requestAnimationFrame(render);
    },

    shutdown() {
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        if (this.gl) {
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        }
    }
};

// Integration complete. Ghost Forge v2.0 Volumetric Core sealed.
