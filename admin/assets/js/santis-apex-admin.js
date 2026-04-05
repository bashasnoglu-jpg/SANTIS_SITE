/**
 * 🦅 SANTIS OS [V35_OMEGA] - APEX ADMIN ENGINE (TITAN CLASS)
 * Mimari: Sovereign Differential DOM, Double Buffer (Zero-Tearing), Dirty Flag (Zero-Waste), Self-Healing (Heartbeat).
 */

class SantisApexGod {
    constructor() {
        this.DOM = {
            navSkeleton: document.getElementById('admin-nav-skeleton'),
            gridSkeleton: document.getElementById('dashboard-grid-skeleton')
        };
        
        // Başlangıç İskelet Durumu
        this.metrics = [
            { id: 'telemetry', title: 'QUANTUM PIPELINE', value: 'SYNCING', sub: 'MB/s Throughput', color: '#00FF9D', icon: '⚡' },
            { id: 'tbt', title: 'AKTİF ZİYARETÇİ', value: '0', sub: 'Canlı Kullanıcı', color: '#D4AF37', icon: '👥' },
            { id: 'friction', title: 'FRICTION ENGINE', value: '0', sub: 'Kognitif Stres', color: '#FF3B30', icon: '🧠' },
            { id: 'shield', title: 'COGNITIVE INTENT RADAR', value: 'ZEN MODE', sub: 'Kognitif İşlemci Aktif', color: '#00FF9D', icon: '👁️' }
        ];

        this.nodeCache = {}; // O(1) DOM Cache
        this.isHibernating = false;
        this.booted = false;

        this.init();
    }

    init() {
        console.log("🌌 [Titan Class] Boot Sequence Initiated. Awaiting Kernel Sync...");
        
        if (window.SANTIS_KERNEL_READY || (window.Santis && window.Santis.Bootloader && window.Santis.Bootloader.status === 'READY')) {
            this.boot();
        } else {
            window.addEventListener('santis:kernel_ready', () => this.boot());
            setTimeout(() => { if (!this.booted) this.boot(); }, 1500);
        }
    }

    boot() {
        if (this.booted) return;
        this.booted = true;
        console.log("💎 [Titan Class] Kernel Sinyali Alındı. Canlı Arayüz İnşa Ediliyor...");

        const schedule = window.requestIdleCallback || function(cb) { return setTimeout(cb, 1); };

        schedule(() => {
            this.injectCSS();
            this.renderNavigation();
            this.renderGridBase();
            this.setupEventDelegation();
            this.connectLiveStream();
        });
    }

    injectCSS() {
        if (document.getElementById('apex-god-styles')) return;
        const style = document.createElement('style');
        style.id = 'apex-god-styles';
        style.textContent = `
            .apex-card {
                background: var(--surface); border-radius: 12px; padding: 30px; 
                border: 1px solid var(--border); position: relative; overflow: hidden;
                opacity: 0; transform: translateY(20px); cursor: crosshair;
                transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease, border-color 0.3s ease;
                display: flex; flex-direction: column; justify-content: space-between;
                will-change: transform;
            }
            .apex-card.visible { opacity: 1; transform: translateY(0); }
            
            .apex-card.hover-active { 
                transform: translateY(-5px); 
                box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05); 
            }
            
            .metric-val { font-size: 2.8rem; font-weight: 300; letter-spacing: 1px; font-variant-numeric: tabular-nums; transition: color 0.3s ease; }
            .metric-sub { font-size: 1rem; color: #666; margin-left: 8px; font-weight: 300; }
            
            .pulse-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 10px; opacity: 0.8; }
            .pulse-flash { animation: pulseAnim 0.3s ease-out; }
            @keyframes pulseAnim { 0% { opacity: 1; transform: scale(1.5); box-shadow: 0 0 15px currentColor; } 100% { opacity: 0.8; transform: scale(1); box-shadow: none; } }
            
            .data-flash { animation: textFlash 0.3s ease-out; }
            @keyframes textFlash { 0% { color: #fff; text-shadow: 0 0 20px rgba(255,255,255,0.8); transform: scale(1.02); } 100% { color: inherit; text-shadow: none; transform: scale(1); } }
        `;
        document.head.appendChild(style);
    }

    renderNavigation() {
        if (!this.DOM.navSkeleton) return;
        this.DOM.navSkeleton.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 40px; height: 100%; border-bottom: 1px solid var(--border);">
                <div style="display: flex; align-items: center;">
                    <div id="nav-pulse" class="pulse-dot" style="background: #00FF9D; box-shadow: 0 0 10px #00FF9D;"></div>
                    <div style="color: var(--gold); font-weight: 300; letter-spacing: 4px; font-size: 1.1rem;">
                        SANTIS <span style="color:#fff; font-weight: 700;">LIVE CORE</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 24px;">
                    <a href="gods-eye-vision.html" style="color: #C9A96E; text-decoration: none; border: 1px solid rgba(201,169,110,0.5); padding: 6px 16px; border-radius: 4px; font-size: 0.70rem; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; transition: all 0.3s; background: rgba(201,169,110,0.05);" onmouseover="this.style.background='rgba(201, 169, 110, 0.2)'" onmouseout="this.style.background='rgba(201,169,110,0.05)'">
                        👁️ God's Eye Vision
                    </a>
                    <div style="font-size: 0.75rem; color: #888; letter-spacing: 2px; font-family: monospace;">
                        <span style="color:#00FF9D">▶</span> TITAN CLASS : SECURE CONNECTION
                    </div>
                </div>
            </div>
        `;
    }

    renderGridBase() {
        if (!this.DOM.gridSkeleton) return;
        const fragment = document.createDocumentFragment();

        this.metrics.forEach((metric, index) => {
            const card = document.createElement('div');
            card.className = 'apex-card';
            card.dataset.id = metric.id;
            card.style.borderLeft = `3px solid ${metric.color}`;
            
            card.innerHTML = `
                <div style="position: absolute; top: -40px; right: -40px; width: 150px; height: 150px; background: ${metric.color}; opacity: 0.05; border-radius: 50%; filter: blur(30px); pointer-events: none;"></div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <span style="font-size: 0.75rem; letter-spacing: 2px; color: #888; text-transform: uppercase;">${metric.title}</span>
                    <span style="font-size: 1.5rem; filter: drop-shadow(0 0 8px ${metric.color}88);">${metric.icon}</span>
                </div>
                
                <div style="position: relative; z-index: 2;">
                    <div class="metric-val" style="color: ${metric.color};">
                        <span id="val-${metric.id}">${metric.value}</span><span class="metric-sub" id="sub-${metric.id}">${metric.sub}</span>
                    </div>
                </div>
            `;
            fragment.appendChild(card);

            this.nodeCache[metric.id] = {
                valNode: card.querySelector(`#val-${metric.id}`),
                currentValue: String(metric.value),
                currentColor: metric.color
            };

            setTimeout(() => requestAnimationFrame(() => card.classList.add('visible')), index * 75 + 100);
        });

        requestAnimationFrame(() => {
            this.DOM.gridSkeleton.innerHTML = '';
            this.DOM.gridSkeleton.style.minHeight = 'auto';
            this.DOM.gridSkeleton.appendChild(fragment);
        });
    }

    setupEventDelegation() {
        this.DOM.gridSkeleton.addEventListener('mouseover', (e) => {
            const card = e.target.closest('.apex-card');
            if(card) card.classList.add('hover-active');
        });
        this.DOM.gridSkeleton.addEventListener('mouseout', (e) => {
            const card = e.target.closest('.apex-card');
            if(card) card.classList.remove('hover-active');
        });
    }

    // ==========================================
    // 💀 TITAN CLASS: DOUBLE BUFFER, DIRTY FLAG & SELF-HEALING
    // ==========================================

    connectLiveStream() {
        console.log("📡 [Titan Class] Kuantum Hattı ve Ölümsüzlük Protokolü Devrede...");
        try {
            if (typeof SharedArrayBuffer === 'undefined') throw new Error("SAB engellendi.");

            // 64 Byte Bellek (16 element * 4 byte)
            // Harita: [0-3]: Buffer 0 | [4-7]: Buffer 1 | [8]: Active Index | [9]: Dirty Flag
            this.sab = new SharedArrayBuffer(64);
            this.intView = new Int32Array(this.sab);
            this.floatView = new Float32Array(this.sab);
            this.hasSAB = true;

            this.lastHeartbeat = -1;
            this.lastHeartbeatTime = performance.now();

            this.igniteWorker();

            document.addEventListener('visibilitychange', () => {
                if (this.worker) {
                    this.isHibernating = document.hidden;
                    this.worker.postMessage({ type: 'HIBERNATE', state: this.isHibernating });
                }
            });

            this.startUnifiedRenderLoop();
        } catch (error) {
            console.warn("🚨 SAB Kilitli. Lütfen COOP/COEP başlıklarını ekleyin.", error);
            this.hasSAB = false;
            this.fallbackToIntervalSim();
        }
    }

    igniteWorker() {
        if (this.worker) {
            this.worker.terminate(); // Eski zombiyi yok et
            console.warn("💀 [Lazarus Protocol] Düşen işçi katledildi.");
        }
        // Yol düzeltmesi (admin/boardroom.html -> assets/js/santis-telemetry-worker.js)
        this.worker = new Worker('assets/js/santis-telemetry-worker.js'); 
        this.worker.postMessage({ type: 'INIT_SAB', buffer: this.sab });
        
        // Atomics flagleri temizle (yeni işçi temiz bir zeminle başlasın)
        Atomics.store(this.intView, 12, 0); // Kognitive Update: Active Index
        Atomics.store(this.intView, 13, 0); // Kognitive Update: Dirty Flag
        
        console.log("⚙️ [Titan Class] İşçi Başlatıldı ve Ağa Bağlandı.");
        
        this.initMigrationMatrix();
    }

    startUnifiedRenderLoop() {
        console.log("⚡ [Titan Class] 120Hz Unified Render & Lazarus Protokolü Devrede.");
        const loop = () => {
            if (!this.isHibernating && this.hasSAB) {
                this.checkHeartbeat();
                this.flushMemoryBuffer();
            }
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    checkHeartbeat() {
        // İndeks artık 12 (Active Index)
        const readIndex = Atomics.load(this.intView, 12); 
        const currentHeartbeat = this.intView[readIndex * 6 + 3]; // Çarpan artık 6
        
        if (currentHeartbeat !== this.lastHeartbeat) {
            this.lastHeartbeat = currentHeartbeat;
            this.lastHeartbeatTime = performance.now();
            const pulse = document.getElementById('nav-pulse');
            if(pulse && pulse.style.background === 'rgb(255, 59, 48)') pulse.style.background = '#00FF9D';
        } else if (this.lastHeartbeat > 0) {
            if (performance.now() - this.lastHeartbeatTime > 2000) {
                console.error(`💀 [TITAN ALERT] İşçi kilitlendi. Lazarus Protokolü devrede...`);
                this.lastHeartbeat = 0; 
                this.igniteWorker(); 
                const pulse = document.getElementById('nav-pulse');
                if(pulse) pulse.style.background = '#FF3B30'; 
            }
        }
    }

    // ==========================================
    // 🚢 THE LAZARUS MATRIX: MIGRATION SKELETON
    // ==========================================

    initMigrationMatrix() {
        console.log("🚢 [Lazarus Matrix] Eski Panel Taranıyor... Göç Başlıyor.");
        
        // 1. KATMAM: OTONOM HTML BAĞLAYICI (Zero-JS)
        this.domBindings = [];
        const elements = document.querySelectorAll('[data-santis-bind]');
        
        elements.forEach(el => {
            this.domBindings.push({
                node: el,
                memoryIndex: parseInt(el.getAttribute('data-santis-bind')), // RAM'deki hücre numarası (0-5)
                dataType: el.getAttribute('data-santis-type') || 'int',     // 'int' veya 'float'
                format: el.getAttribute('data-santis-format') || 'raw',     // 'currency', 'percent'
                lastValue: null
            });
        });
        console.log(`✅ [Lazarus Matrix] ${this.domBindings.length} Statik DOM noktası Kuantum Hattına kilitlendi.`);

        // 2. KATMAN: KOMPLEKS WIDGET KAYIT YUVASI (Chart.js vb. için)
        this.complexWidgets = new Map();
    }

    // Dışarıdan Kütüphane Bağlamak İçin Sovereign API
    registerWidget(widgetId, memoryIndex, dataType, renderCallback) {
        this.complexWidgets.set(widgetId, {
            memoryIndex: memoryIndex,
            type: dataType,
            render: renderCallback,
            lastValue: null
        });
        console.log(`🔌 [Lazarus Matrix] Kompleks Widget Zırhlandı: ${widgetId}`);
    }

    flushMemoryBuffer() {
        // İndeks 13 artık Dirty Flag
        const isDirty = Atomics.exchange(this.intView, 13, 0); 
        if (!isDirty) return; 

        // İndeks 12 artık Active Index
        const readIndex = Atomics.load(this.intView, 12);
        const base = readIndex * 6; // Çarpan 6

        const friction = this.intView[base + 0];
        const activeUsers = this.intView[base + 1];
        const throughput = this.floatView[base + 2]; 
        
        // 🔮 YAPAY ZEKA VERİLERİ OKUNUYOR
        const aiState = this.intView[base + 4]; 
        const aiScore = this.floatView[base + 5]; 

        let hasChanges = false;
        
        // Mevcut Kartlar
        hasChanges = this.updateMetricNode('friction', friction, friction > 20 ? '#FF3B30' : '#D4AF37') || hasChanges;
        hasChanges = this.updateMetricNode('tbt', activeUsers, '#3B82F6') || hasChanges; 
        hasChanges = this.updateMetricNode('telemetry', throughput.toFixed(2), '#00FF9D') || hasChanges;
        
        // 🧠 THE ORACLE: Dördüncü kartı (ID: 'shield') Kognitif Radar'a dönüştürüyoruz
        let aiText = "ZEN MODE";
        let aiColor = "#00FF9D";
        let aiSub = "Stabil Akış";

        switch(aiState) {
            case 0: aiText = "ZEN FLOW"; aiColor = "#00FF9D"; aiSub = `Niyet Skoru: %${aiScore.toFixed(1)}`; break;
            case 1: aiText = "HESITATION"; aiColor = "#F59E0B"; aiSub = `Kararsızlık Eğilimi: %${aiScore.toFixed(1)}`; break;
            case 2: aiText = "RAGE RISK"; aiColor = "#FF3B30"; aiSub = `Kritik Stres: %${aiScore.toFixed(1)}`; break;
            case 3: aiText = "BUY INTENT"; aiColor = "#3B82F6"; aiSub = `Yüksek Niyet: %${aiScore.toFixed(1)}`; break;
        }

        // Kartın Başlığını ve Rengini Değiştir
        hasChanges = this.updateMetricNode('shield', aiText, aiColor) || hasChanges;
        
        // Kartın Alt Metnini (Subtext) Diferansiyel Güncelle
        const shieldSub = document.getElementById('sub-shield');
        if (shieldSub && shieldSub.textContent !== aiSub) {
            shieldSub.textContent = aiSub;
            shieldSub.style.color = '#888';
            hasChanges = true;
        }

        // 🚨 KOGNİTİF AURA (Rage Risk ise tüm ekranın sınırlarını kan kırmızısı yap)
        const boardroomContent = document.getElementById('dashboard-grid-skeleton');
        if (boardroomContent) {
            const currentShadow = boardroomContent.style.boxShadow;
            const targetShadow = aiState === 2 ? 'inset 0 0 150px rgba(255, 59, 48, 0.15)' : 'none';
            if (currentShadow !== targetShadow) {
                boardroomContent.style.boxShadow = targetShadow;
                boardroomContent.style.transition = 'box-shadow 0.4s ease-out';
            }
        }

        // 🚀 1. OTONOM HTML GÜNCELLEMELERİ
        this.domBindings.forEach(binding => {
            const val = binding.dataType === 'float' 
                ? this.floatView[base + binding.memoryIndex]
                : this.intView[base + binding.memoryIndex];

            const stringValue = String(val);

            // DİFERANSİYEL ZIRH: Sadece değiştiyse DOM'a dokun!
            if (binding.lastValue !== stringValue) {
                let displayVal = val;
                if (binding.format === 'currency') displayVal = '$' + parseFloat(val).toFixed(2);
                if (binding.format === 'percent') displayVal = '%' + parseFloat(val).toFixed(1);

                binding.node.textContent = displayVal;
                binding.lastValue = stringValue;
                hasChanges = true;

                // Kuantum Flaş Animasyonu
                binding.node.classList.remove('data-flash');
                void binding.node.offsetWidth;
                binding.node.classList.add('data-flash');
            }
        });

        // 🚀 2. KOMPLEKS KÜTÜPHANELERİN (WIDGET) GÜNCELLENMESİ
        this.complexWidgets.forEach((widget, id) => {
            const val = widget.type === 'float' 
                ? this.floatView[base + widget.memoryIndex]
                : this.intView[base + widget.memoryIndex];

            if (widget.lastValue !== val) {
                // Eski panelin ağır render fonksiyonunu sadece veri değiştiğinde çağır
                widget.render(val, widget.lastValue);
                widget.lastValue = val;
                hasChanges = true;
            }
        });

        // Flaş Efekti ve Nabız Rengi
        if (hasChanges) {
            const navPulse = document.getElementById('nav-pulse');
            if (navPulse) {
                navPulse.classList.remove('pulse-flash');
                void navPulse.offsetWidth;
                navPulse.classList.add('pulse-flash');
                
                // Nabız rengi otonom olarak AI'ın ruh haline bağlandı!
                navPulse.style.background = aiColor;
                navPulse.style.boxShadow = `0 0 10px ${aiColor}`;
            }
        }
    }

    updateMetricNode(id, value, color) {
        const cache = this.nodeCache[id];
        if (!cache || !cache.valNode) return false;

        const stringValue = String(value);
        let changed = false;

        if (cache.currentValue !== stringValue) {
            cache.valNode.textContent = stringValue;
            cache.currentValue = stringValue;
            changed = true;

            if (color && cache.currentColor !== color) {
                cache.valNode.parentElement.style.color = color;
                cache.currentColor = color;
            }

            cache.valNode.classList.remove('data-flash');
            void cache.valNode.offsetWidth;
            cache.valNode.classList.add('data-flash');
        }
        return changed;
    }

    fallbackToIntervalSim() {
        console.warn("Korumalı Orijin Headers olmadan çalışılıyor. Sabit DOM Differanslama simülasyona dönüldü.");
        setInterval(() => {
            if (this.isHibernating) return;
            const friction = Math.floor(Math.random() * 30);
            const tbt = Math.floor(Math.random() * 300 + 1200); // Canlı Kullanıcı Sim
            const throughput = (Math.random() * 5 + 10).toFixed(2);
            
            let hasChanges = false;
            hasChanges = this.updateMetricNode('friction', friction, friction > 20 ? '#FF3B30' : '#D4AF37') || hasChanges;
            hasChanges = this.updateMetricNode('tbt', tbt, '#D4AF37') || hasChanges;
            hasChanges = this.updateMetricNode('telemetry', throughput, '#00FF9D') || hasChanges;
        }, 800);
    }
}

// Global Motoru Otonom Başlat
window.SantisApex = new SantisApexGod();
