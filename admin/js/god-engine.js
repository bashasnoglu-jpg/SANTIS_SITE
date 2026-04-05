/**
 * ═══════════════════════════════════════════════════════════
 * GOD ENGINE — THE MATRIX TELEMETRY CLIENT (Faz God)
 * ═══════════════════════════════════════════════════════════
 * Binds to ws://localhost:8080/ws?client_type=admin
 * Subscribes to LIVE_PULSE, TELEMETRY_BEACON, SYSTEM_BOOT
 * Uses ECharts for real-time resonance velocity.
 */

class GodEngine {
    constructor() {
        this.ws = null;
        this.socketUrl = `ws://${window.location.host}/ws`; // v3 INIT Handshake kullanılacak, query param yok
        this.reconnectAttempts = 0;
        
        // DOM Elements
        this.elGuests = document.getElementById('val-guests');
        this.elFriction = document.getElementById('val-friction');
        this.elUplinks = document.getElementById('val-uplinks');
        this.elLogs = document.getElementById('matrix-logs');
        this.elStatusDot = document.getElementById('socket-status-dot');
        this.elStatusText = document.getElementById('socket-status-text');

        // State & Chart
        this.uplinksCounter = 0;
        this.chartInstance = null;
        this.chartData = {
            time: [],
            resonance: [] // Mock tracking simulated server stability/resonance
        };

        this.initChart();
        this.connect();
    }

    initChart() {
        const chartDom = document.getElementById('main-chart');
        if (!chartDom || typeof echarts === 'undefined') return;
        
        this.chartInstance = echarts.init(chartDom, 'dark');
        
        // Fill initial 60 seconds of empty data to make line appear from right
        const now = new Date();
        for (let i = 0; i < 60; i++) {
            this.chartData.time.unshift([now.getHours(), now.getMinutes(), now.getSeconds() - i].join(':'));
            this.chartData.resonance.unshift(0);
        }

        const option = {
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis', axisPointer: { type: 'cross', label: { backgroundColor: '#D4AF37' } } },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: [
                {
                    type: 'category',
                    boundaryGap: false,
                    data: this.chartData.time,
                    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
                    axisLabel: { color: '#888' }
                }
            ],
            yAxis: [
                {
                    type: 'value',
                    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } },
                    axisLabel: { color: '#888' },
                    max: 100
                }
            ],
            series: [
                {
                    name: 'Resonance',
                    type: 'line',
                    smooth: true,
                    lineStyle: { width: 3, color: '#D4AF37' },
                    showSymbol: false,
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(212, 175, 55, 0.4)' },
                            { offset: 1, color: 'rgba(212, 175, 55, 0.0)' }
                        ])
                    },
                    data: this.chartData.resonance
                }
            ]
        };
        this.chartInstance.setOption(option);

        // Handle window resize smoothly
        window.addEventListener('resize', () => {
            this.chartInstance.resize();
        });
    }

    connect() {
        this.log('SYS', 'Establishing Quantum Socket...', 'system');
        this.ws = new WebSocket(this.socketUrl);

        this.ws.onopen = () => {
            let identity = null;
            let identitySource = 'Sovereign_Core';

            if (window.SantisIdentity) {
                identity = window.SantisIdentity.getIdentityBundle();
            }
            
            // 🛡️ Otonom Acil Durum Kimliği (Sadece God Engine için)
            if (!identity) {
                identitySource = 'fallback_ephemeral';
                const generateId = (p) => `${p}-EPHEM-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
                
                // Mümkünse localStorage'dan tut, yoksa ram üstünde bırak
                let vid = null, sid = null;
                try {
                     vid = localStorage.getItem('santis.visitorId') || generateId('VIS');
                     localStorage.setItem('santis.visitorId', vid);
                     sid = sessionStorage.getItem('santis.sessionId') || generateId('SES');
                     sessionStorage.setItem('santis.sessionId', sid);
                } catch(e) {
                     vid = generateId('VIS');
                     sid = generateId('SES');
                }
                
                identity = {
                    visitorId: vid,
                    sessionId: sid,
                    connectionId: generateId('CONN')
                };
            }

            // v3 STRICT INIT Handshake Payload
            const initPayload = {
                type: 'INIT',
                namespace: 'admin',
                token: 'ANONYMOUS',
                visitorId: identity.visitorId,
                sessionId: identity.sessionId,
                connectionId: identity.connectionId,
                timestamp: Date.now(),
                capabilities: ['telemetry:read', 'system:god_mode'],
                meta: { identitySource }
            };

            this.ws.send(JSON.stringify(initPayload));
            
            this.reconnectAttempts = 0;
            this.updateStatus(true);
            this.log('SYS', 'Uplink Established. Receiving Pulse.', 'system');
        };

        this.ws.onmessage = async (e) => {
            try {
                const textData = e.data instanceof Blob ? await e.data.text() : e.data;
                const event = JSON.parse(textData);
                this.routeEvent(event);
            } catch (err) {
                console.warn('Non-JSON packet dropped.');
            }
        };

        this.ws.onclose = () => {
            this.updateStatus(false);
            this.log('SYS', 'Connection Severed. Re-initiating protocols...', 'error');
            setTimeout(() => {
                this.reconnectAttempts++;
                this.connect();
            }, Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000));
        };

        this.ws.onerror = (err) => {
            this.log('ERR', 'WebSocket Socket Anomaly Detected', 'error');
        };
    }

    routeEvent(event) {
        this.uplinksCounter++;
        this.elUplinks.innerText = this.uplinksCounter;

        switch (event.type) {
            case 'SYSTEM_BOOT':
                this.log('SYS', `Kernel v${event.payload.version} Recognized. ${event.payload.message}`, 'system');
                break;
            case 'pong':
                // Silent infrastructure
                break;
            case 'LIVE_PULSE':
                this.handlePulse(event.data);
                break;
            case 'TELEMETRY_BEACON':
                this.handleBeacon(event.payload);
                break;
            default:
                if (event.type && !['broadcast'].includes(event.type)) {
                    this.log('NET', `Unmapped Event: ${event.type}`, '');
                }
                break;
        }
    }

    handlePulse(data) {
        // Broadcasts every 10 seconds from server.js
        if(data.activeGuests) this.elGuests.innerText = data.activeGuests;
        
        // Push to chart
        const now = new Date();
        const timeStr = [now.getHours(), now.getMinutes(), now.getSeconds()].join(':');
        
        // Simulated resonance based on guests + a baseline
        const baseResonance = 85 + (Math.random() * 10);
        const finalRes = Math.min(100, (baseResonance + (data.activeGuests * 0.5))).toFixed(1);

        this.chartData.time.push(timeStr);
        this.chartData.resonance.push(parseFloat(finalRes));
        
        if (this.chartData.time.length > 60) {
            this.chartData.time.shift();
            this.chartData.resonance.shift();
        }

        if (this.chartInstance) {
            this.chartInstance.setOption({
                xAxis: [{ data: this.chartData.time }],
                series: [{ data: this.chartData.resonance }]
            });
        }
    }

    handleBeacon(payload) {
        // Beacons coming from Frontends (santis-telemetry-worker.js or core)
        let klass = '';
        let prefix = 'BCN';
        if (payload.level === 'WARN' || payload.level === 'ERROR') klass = 'error';
        if (payload.level === 'AI' || payload.level === 'DECISION') {
            klass = 'ai';
            prefix = 'AI_';
        }

        const msg = payload.message || payload.decision || 'Signal received';
        this.log(prefix, `[${payload.page || 'sys'}] ${msg}`, klass);

        // If it's a friction or LoAF anomaly, bump friction score purely for visual matrix
        if (msg.includes('Friction') || payload.level === 'WARN') {
            const currentF = parseFloat(this.elFriction.innerText);
            this.elFriction.innerText = (currentF + 1.2).toFixed(1);
            
            // Glitch effect on friction
            this.elFriction.classList.add('glitch');
            this.elFriction.style.color = 'var(--danger)';
            setTimeout(() => {
                this.elFriction.classList.remove('glitch');
                this.elFriction.style.color = 'var(--gold-accent)';
            }, 800);
        }
    }

    log(prefix, message, cssClass) {
        const el = document.createElement('div');
        el.className = 'log-line';
        
        const now = new Date();
        const timestamp = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
        
        const timeSpan = `<span class="log-time">${timestamp} ${prefix}</span>`;
        const msgSpan = `<span class="log-msg ${cssClass}">${message}</span>`;
        
        el.innerHTML = timeSpan + msgSpan;
        this.elLogs.appendChild(el);
        
        // Auto-scroll
        this.elLogs.scrollTop = this.elLogs.scrollHeight;

        // Limit DOM nodes
        if (this.elLogs.childElementCount > 100) {
            this.elLogs.removeChild(this.elLogs.firstElementChild);
        }
    }

    updateStatus(isActive) {
        if (isActive) {
            this.elStatusDot.style.animation = 'pulse 2s infinite';
            this.elStatusDot.style.backgroundColor = 'var(--success)';
            this.elStatusDot.style.boxShadow = '0 0 10px var(--success)';
            this.elStatusText.innerText = 'Uplink Active';
            this.elStatusText.style.color = 'var(--text-muted)';
        } else {
            this.elStatusDot.style.animation = 'none';
            this.elStatusDot.style.backgroundColor = 'var(--danger)';
            this.elStatusDot.style.boxShadow = '0 0 10px var(--danger)';
            this.elStatusText.innerText = 'Connection Lost';
            this.elStatusText.style.color = 'var(--danger)';
        }
    }
}

// Initialize Matrix Node
document.addEventListener('DOMContentLoaded', () => {
    window.__godEngine = new GodEngine();
});
