/**
 * ═══════════════════════════════════════════════════════════════
 * SANTIS SITE NEURAL MAP ENGINE 🧠 (God Mode Live Traffic Web)
 * ═══════════════════════════════════════════════════════════════
 * 
 * @version V25_SOVEREIGN_SCANNER
 * @description Real-time, GPU Accelerated, Zero-Leak Cyber-Forensic Topology Radar.
 */

class SiteNeuralMapEngine {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) throw new Error("🛡️ [Neural Map] Kuantum Container bulunamadı: " + containerId);
        
        this.network = null;
        this.nodes = new vis.DataSet([]);
        this.edges = new vis.DataSet([]);
        this.pulseInterval = null;
        
        // Quiet Luxury & Cyberpunk Glow Palette
        this.theme = {
            apex:    { bg: '#D4AF37', border: '#b45309', glow: 'rgba(212,175,55,0.8)' }, // Gold
            service: { bg: '#3b82f6', border: '#1d4ed8', glow: 'rgba(59,130,246,0.6)' }, // Neon Blue
            bounce:  { bg: '#ef4444', border: '#b91c1c', glow: 'rgba(239,68,68,0.9)' },  // Kan Kırmızı (Tıkanıklık)
            visitor: { bg: '#10b981', border: '#047857', glow: 'rgba(16,185,129,0.5)' }, // Yeşil
            orphan:  { bg: '#4b5563', border: '#1f2937', glow: 'rgba(75,85,99,0.2)' }    // Karanlıkta Sürüklenen
        };

        // 🎨 Sovereign Dark Mode & Cyberpunk Glow Renk Paleti (Aşama 24/25 Siber Teşhis için)
        this.palette = {
            healthy: { background: '#001a33', border: '#0A84FF', glow: '#0A84FF' }, // Neon Mavi
            orphan: { background: '#0a0a0a', border: '#222222', glow: 'transparent' }, // Karanlık Madde
            bleeding: { background: '#330000', border: '#FF3B30', glow: '#FF3B30' }, // Kan Kırmızı (404)
            healed: { background: '#261a00', border: '#FFD700', glow: '#FFD700' } // Sovereign Gold (301 Mühürlü)
        };
    }

    init(initialData) {
        if (this.network) this.destroy(); // Güvenlik Kalkanı

        // Node ve Edge'leri Vis DataSet içine yükle
        this.nodes.add(initialData.nodes.map(n => this._applyTheme(n)));
        this.edges.add(initialData.edges.map(e => this._applyEdgeTheme(e)));

        const data = { nodes: this.nodes, edges: this.edges };

        // 🧠 Kinetik Fizik ve Estetik Ayarları
        const options = {
            nodes: {
                shape: 'dot',
                font: { color: '#cbd5e1', face: 'Inter, sans-serif', size: 12, strokeWidth: 1, strokeColor: '#000' },
                borderWidth: 2,
                shadow: { enabled: true, color: 'rgba(0,0,0,0.9)', size: 15, x: 0, y: 0 }
            },
            edges: {
                width: 1.5,
                color: { color: 'rgba(10, 132, 255, 0.3)', highlight: '#0A84FF', hover: '#0A84FF' },
                smooth: { type: 'continuous' },
                arrows: { to: { enabled: true, scaleFactor: 0.5 } }
            },
            physics: {
                solver: 'forceAtlas2Based',
                forceAtlas2Based: {
                    gravitationalConstant: -120, // İtme kuvveti
                    centralGravity: 0.015,       // Merkeze çekim (Galaksiyi bir arada tutar)
                    springLength: 120,
                    springConstant: 0.04,
                    damping: 0.4
                },
                maxVelocity: 50,
                minVelocity: 0.1,
                timestep: 0.5,
                stabilization: { iterations: 150 }
            },
            interaction: { 
                hover: true, 
                tooltipDelay: 0, // ⚡ KURAL 4: Zero-Friction (Gecikmesiz Tooltip)
                zoomView: true,
                dragView: true
            },
            // 🗡️ AŞAMA 25: SİBER NEŞTER (Sürükle-Bırak 301 Mühürleme)
            manipulation: {
                enabled: false, // Sadece teşhis modunda aktif edilecek
                addEdge: (edgeData, callback) => this.applyCyberScalpel(edgeData, callback)
            }
        };

        this.network = new vis.Network(this.container, data, options);
        this.bindEvents();
        
        console.log("🦅 [V25 SOVEREIGN] Neural Map Engine & Siber Neşter Ateşlendi. FPS: 120 Lock.");
    }

    bindEvents() {
        this.network.on("hoverNode", () => { this.container.style.cursor = 'crosshair'; });
        this.network.on("blurNode", () => { this.container.style.cursor = 'default'; });
    }

    // Gelen verilere göre düğümlerin temasını (karanlık madde, neon glow) ayarlar
    _applyTheme(node) {
        const t = this.theme[node.type] || this.theme.service;
        
        // Ziyaretcisi olmayan Orphan sayfalar kütlesi çok düşük ve karanlıktır
        const mass = (node.type === 'orphan') ? 0.01 : Math.min(10, (node.metrics?.visitors || 10) / 10 + 1);
        const value = (node.type === 'orphan') ? 5 : (node.metrics?.visitors || 20);

        // Tooltip (Zero-Friction HTML Tooltip)
        const titleContent = document.createElement('div');
        titleContent.innerHTML = `
            <div class="text-white" style="background: rgba(10,10,10,0.95); border: 1px solid ${t.bg}; padding: 8px; border-radius: 6px; font-family: Inter, sans-serif; min-width: 150px; box-shadow: 0 0 15px ${t.glow};">
                <div style="font-size: 11px; color: ${t.bg}; font-weight: bold; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 2px;">${node.label.toUpperCase()}</div>
                <div style="font-size: 10px; color: #9ca3af; margin-bottom: 2px;">Anlık Ziyaretçi: <span class="text-white" style="font-weight: bold;">${node.metrics?.visitors || 0}</span></div>
                <div style="font-size: 10px; color: #9ca3af;">Dönüşüm (CVR): <span style="color: #10b981; font-weight: bold;">%${node.metrics?.cvr || 0}</span></div>
                ${node.type === 'bounce' ? '<div style="font-size: 9px; color: #ef4444; margin-top: 4px; font-style: italic;">⚠️ Tıkanıklık Tespit Edildi</div>' : ''}
            </div>
        `;

        return {
            ...node,
            value: value,
            mass: mass,
            title: titleContent,
            color: {
                background: t.bg,
                border: t.border,
                highlight: { background: t.bg, border: '#fff' },
                hover: { background: t.bg, border: '#fff' }
            },
            shadow: { enabled: true, color: t.glow, size: value > 50 ? 30 : 15 } // Yüksek trafikte çok parlar
        };
    }

    _applyEdgeTheme(edge) {
        // Çizgi kalınlığı trafiğe göre
        const traffic = edge.traffic || 1;
        let color = 'rgba(156, 163, 175, 0.3)'; // Default gri
        
        if (traffic > 50) color = 'rgba(212, 175, 55, 0.9)'; // Altın Yol
        else if (traffic > 10) color = 'rgba(59, 130, 246, 0.7)'; // Mavi Akış
        
        return {
            ...edge,
            value: traffic, 
            color: { color: color, highlight: '#fff', hover: '#fff' }
        };
    }

    /**
     * Nöral Çekirdeği Canlı Besle (Pulsing Nodes & Edges)
     * Backend'den gelen anlık verilerle düğüm büyür, çizgiler bükülür.
     */
    updateTraffic(liveData) {
        if (!this.network) return;

        liveData.nodes.forEach(newData => {
            const existingNode = this.nodes.get(newData.id);
            // Siber Teşhis ile sorunlu (isAnomalous) hale gelmiş düğümleri Live Pulse ezmesin!
            if (existingNode && !existingNode.isAnomalous) {
                const updatedNode = this._applyTheme({ ...existingNode, metrics: newData.metrics, type: newData.type });
                this.nodes.update(updatedNode);
            }
        });

        liveData.edges.forEach(newEdge => {
            const existingEdge = this.edges.get(newEdge.id);
            if (existingEdge) {
                const updatedEdge = this._applyEdgeTheme({ ...existingEdge, traffic: newEdge.traffic });
                this.edges.update(updatedEdge);
            }
        });
    }

    /**
     * 🔬 [AŞAMA 24] NEURAL SCANNER: Siber-Adli Teşhis Enjeksiyonu
     * Veriyi yutar, kanayanları şişirir, yetimleri uzaya fırlatır!
     */
    runDiagnostics(scannerData) {
        console.warn("👁️🗨️ [Neural Scanner] Karanlık uzay taranıyor. Anomaliler tespit ediliyor...");
        
        const updates = [];
        
        // 1. YETİM SAYFALAR (Orphan Pages) - Yerçekiminden kopan karanlık madde
        if (scannerData.orphans) {
            scannerData.orphans.forEach(node => {
                updates.push({
                    id: node.id,
                    label: node.label,
                    mass: 0.01, // 🚀 FİZİK KURALI: Kütle sıfıra yaklaşır, galaksiden dışarı savrulur!
                    color: { background: this.palette.orphan.background, border: this.palette.orphan.border },
                    font: { color: '#444' },
                    shadow: { enabled: false }, 
                    title: `⚠️ [ORPHAN] ${node.label}\nSinyal Yok. Uzayda sürükleniyor.`,
                    isAnomalous: true,
                    anomalyType: 'orphan'
                });
            });
        }

        // 2. KANAYAN YOLLAR (404 / High Bounce) - Acil müdahale gerektiren şişmiş düğümler
        if (scannerData.bleeding) {
            scannerData.bleeding.forEach(node => {
                updates.push({
                    id: node.id,
                    label: node.label,
                    mass: 5, // 🚀 FİZİK KURALI: Şişer ve yörüngeyi bozar
                    size: 25,
                    color: { background: this.palette.bleeding.background, border: this.palette.bleeding.border },
                    shadow: { enabled: true, color: this.palette.bleeding.glow, size: 30 }, 
                    title: `🚨 [404 FATAL] ${node.label}\nKanama Tespit Edildi! Kayıp Trafik: ${node.lostTraffic}`,
                    isAnomalous: true,
                    anomalyType: '404'
                });
            });
        }

        // DOM'a dokunmadan (Zero-Friction) Canvas'ı mutasyona uğrat
        this.nodes.update(updates);
        
        // Siber Neşter modunu (vis-network otonom çizim modunu) aç
        this.network.setOptions({ manipulation: { enabled: true } });
        this.network.addEdgeMode(); 
        
        console.log("💉 [Cyber-Scalpel] Ameliyathane hazır. Sürükle-Bırak 301 onarım modu aktif!");
    }

    /**
     * 🗡️ [AŞAMA 25] 301 MÜHÜRLEME: The Cyber-Scalpel İşlemi
     * Yöneticinin fare ile çizdiği rotayı 301 redirect olarak algılar.
     */
    applyCyberScalpel(edgeData, callback) {
        const sourceNode = this.nodes.get(edgeData.from);
        const targetNode = this.nodes.get(edgeData.to);

        // Kendi kendine yönlendirme veya sağlam düğümden (hatasızdan) yönlendirme yapılmasını engelle
        if (sourceNode.id === targetNode.id || !sourceNode.isAnomalous) {
            callback(null); // Çizimi iptal et
            // Çizim modunu açık tutmaya devam et
            setTimeout(() => this.network.addEdgeMode(), 50);
            return;
        }

        console.log(`🛡️ [SEO Zırhı] API Tetiklendi: 301 Yönlendirme -> ${sourceNode.label} => ${targetNode.label}`);

        // 1. Kanayan/Kopan Düğümü İyileştir (Altın Mühür)
        this.nodes.update({
            id: sourceNode.id,
            label: `[301] ${sourceNode.label}`,
            color: { background: this.palette.healed.background, border: this.palette.healed.border },
            shadow: { enabled: true, color: this.palette.healed.glow, size: 20 },
            mass: 1, // 🚀 FİZİK KURALI: Kütleyi normale çevir, galaksi merkeze geri çeksin!
            size: 15,
            title: `✅ [HEALED] 301 Mührü uygulandı -> Hedef: ${targetNode.label}`,
            isAnomalous: false
        });

        // 2. Şifa Damarını (Edge) Çiz (Neon Yeşil Lazer)
        edgeData.color = { color: '#07F968', highlight: '#07F968' };
        edgeData.width = 2.5;
        edgeData.dashes = [5, 5]; // Veri akışı hissi için kesik çizgi
        
        callback(edgeData); // vis-network'e çizgiyi mühürlemesine izin ver
        
        // Ameliyat bitti, yeni ameliyatlar için neşteri (çizim modunu) tekrar eline al
        setTimeout(() => this.network.addEdgeMode(), 50);
    }

    /**
     * 🚨 SOVEREIGN GARBAGE COLLECTION (0ms TBT Kalkanı)
     * SPA sayfadan çıkıldığında motoru söküp imha eder, RAM/GPU bırakmaz.
     */
    destroy() {
        console.warn("🛡️ [Santis Kalkanı] Neural Map Engine mühürleniyor. RAM/GPU sızıntısı engellendi.");
        if (this.pulseInterval) {
            clearInterval(this.pulseInterval);
            this.pulseInterval = null;
        }
        if (this.network) {
            this.network.destroy();
            this.network = null;
        }
        this.nodes.clear();
        this.edges.clear();
    }
}

window.SiteNeuralMapEngine = SiteNeuralMapEngine;
