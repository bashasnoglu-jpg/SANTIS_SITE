// santis-omni-mind.js
// SDCR V52.0 OMEGA - PHASE 2: EMERGENT INTELLIGENCE LAYER

class SantisOmniMind {
    constructor(cortex, telemetry, blackbox) {
        this.cortex = cortex;
        this.telemetry = telemetry;
        this.blackbox = blackbox;
        
        // Peer Reputation Graph (EigenTrust POC)
        this.peers = new Map(); 
        
        // Q-Table (Reinforcement Learning - Multi-Armed Bandit)
        this.qTable = new Map(); // State_Action -> Q-Value
        this.epsilon = 0.1; // 10% Exploration Rate (Risk iştahı)
        this.learningRate = 0.1;
        this.discountFactor = 0.9;

        // Cihaz Sınıfı Tespiti (Global Mutation Scoring için)
        this.deviceTier = this.detectDeviceTier();

        this.keyPair = null;
        this.nodeId = `Node_${Math.random().toString(36).substring(2, 9)}`;

        console.warn("%c[SDCR:OMNI-MIND-V4] 🧠 Emergent Intelligence Layer Initialized...", "color: #ff0055; font-weight: bold;");
        this.bootstrap();
    }

    detectDeviceTier() {
        const cores = navigator.hardwareConcurrency || 4;
        const memory = navigator.deviceMemory || 4;
        if (cores >= 8 && memory >= 8) return 'HIGH_END';
        if (cores <= 4 && memory <= 4) return 'LOW_END';
        return 'MID_TIER';
    }

    async bootstrap() {
        await this.generateIdentity();
        this.connectToSignaler('ws://localhost:8081/');
        this.startAgenticRL(); // Epsilon-Greedy Zekayı Başlat
    }

    // ==========================================
    // 1. REINFORCEMENT LEARNING (Q-Table Mutasyon Ajani)
    // ==========================================
    startAgenticRL() {
        // Statik kurallar bitti. Sistem her 15 saniyede bir otonom deney yapar.
        setInterval(() => {
            const currentSSS = window.__SANTIS_SSS__ || 0;
            if (currentSSS < 300) return; // Sadece stres altında öğren (Hayatta kalma güdüsü)

            const state = `SSS_${Math.floor(currentSSS/100)*100}_TIER_${this.deviceTier}`;
            const actions = this.getPossibleMutations();
            
            if (actions.length === 0) return;

            // Epsilon-Greedy Seçim Mantığı
            let selectedAction;
            if (Math.random() < this.epsilon) {
                // EXPLORE (%10 İhtimal): Kasten rastgele bir modülü kes (Risk al, mutasyon dene)
                selectedAction = actions[Math.floor(Math.random() * actions.length)];
                if (this.blackbox) this.blackbox.record('OMNI-MIND:RL', 'EXPLORE', `Taking random evolutionary risk: ${selectedAction.target}`, 'warning');
                console.log(`[RL-ENGINE] 🎲 Exploration Triggered. Testing mutation on: ${selectedAction.target}`);
            } else {
                // EXPLOIT (%90 İhtimal): Q-Table geçmişindeki en yüksek puanlı (ödüllü) taktiği uygula
                selectedAction = this.getBestActionFromQTable(state, actions);
                if (this.blackbox) this.blackbox.record('OMNI-MIND:RL', 'EXPLOIT', `Applying historically successful mutation: ${selectedAction.target}`, 'info');
            }

            // Sinerji Performansını Kaydet ve Puanla (Reward Function)
            const preSSS = currentSSS;
            this.executeMutation(selectedAction);

            // 5 saniye bekle ve sonucu gör
            setTimeout(() => {
                const postSSS = window.__SANTIS_SSS__ || 0;
                const reward = preSSS - postSSS; // SSS'yi ne kadar düşürdü? (Pozitifse başarılı)
                
                this.updateQTable(state, selectedAction.id, reward);
                
                // Kovanı Yükselt (Apex DNA Keşfedildi mi?)
                if (reward > 80) { // Apex Eşiği
                    this.broadcastApexMutation(selectedAction, reward);
                }
            }, 5000);

        }, 15000);
    }

    getPossibleMutations() {
        // SDCR OMEGA Laboratuvarındaki aktif (yaşayan) lüks organları listele
        let actions = [];
        // Hardcode POC Action listesi (Harness Entegrasyonu İçin)
        actions.push({ id: `AMPUTATE_gods-eye-3d-engine.js`, type: 'AMPUTATE', target: 'gods-eye-3d-engine.js' });
        actions.push({ id: `AMPUTATE_big-data-telemetry.js`, type: 'AMPUTATE', target: 'big-data-telemetry.js' });
        return actions;
    }

    getBestActionFromQTable(state, actions) {
        let bestScore = -Infinity;
        let bestAction = actions[0];

        actions.forEach(action => {
            const qKey = `${state}::${action.id}`;
            const score = this.qTable.get(qKey) || 0;
            if (score > bestScore) {
                bestScore = score;
                bestAction = action;
            }
        });
        return bestAction; // Hiçbiri yoksa ilkini döner (-Infinity sıfırı yener)
    }

    updateQTable(state, actionId, reward) {
        const qKey = `${state}::${actionId}`;
        const currentQ = this.qTable.get(qKey) || 0;
        // Basit Q-Learning (Bellman denkleminin iskeleti)
        const newQ = currentQ + this.learningRate * (reward - currentQ);
        this.qTable.set(qKey, newQ);
        console.log(`%c[RL-ENGINE] Learned Q-Value: [${qKey}] -> ${newQ.toFixed(2)}`, "color: #ff00ff;");
    }

    executeMutation(action) {
        // Harness DOM üzerinden sistemi "simüle/hack" ederek modülü yalandan kesiyoruz
        // OMEGA Gerçek implementasyonunda Cortex DAG'ına emir yollar.
        try {
            const dummyModId = action.target === 'gods-eye-3d-engine.js' ? 'mod-lux1' : 'mod-lux2';
            const el = document.getElementById(dummyModId);
            const statusEl = document.getElementById(`status-${dummyModId}`);
            if(el) {
                el.className = 'module luxury amputated';
                statusEl.innerText = '✂️ RL AMPUTATED';
                statusEl.style.color = 'var(--neon-red)';
            }
        } catch(e) {}
    }

    // ==========================================
    // 2. GOSSIP PROTOCOL & PEER REPUTATION
    // ==========================================
    broadcastGossip(badPeerOrigin, reason) {
        // Zararlı Düğümü ifşa et (Name and Shame)
        const packet = {
            type: 'GOSSIP_ALERT',
            origin: this.nodeId,
            targetPeer: badPeerOrigin,
            reason: reason,
            timestamp: Date.now()
        };
        this.signaler.send(JSON.stringify(packet));
        console.log(`%c[GOSSIP PROTOCOL] 📢 Ağa Dedikodu Yayıldı: ${badPeerOrigin} toksik olarak işaretlendi.`, "color: #ff9900; font-weight: bold; background: #222; padding: 2px;");
    }

    processGossip(msg) {
        if (msg.origin === this.nodeId) return;

        // Sybil Gossip Koruması: Dedikodu getiren Peer'a güveniyor muyum?
        const senderTrust = this.peers.get(msg.origin)?.score || 50;
        if (senderTrust < 40) return; // Güvenilmeyen birinin dedikodusunu dinleme (Aforoz/İftira Koruması)

        const targetPeer = msg.targetPeer;
        let tData = this.peers.get(targetPeer) || { score: 50 };
        
        // Dedikodu getirenin güvenine oranla hedef peer'ı matematiksel olarak cezalandır (Slashing)
        const penalty = (senderTrust / 100) * 20; 
        tData.score = Math.max(0, tData.score - penalty);
        this.peers.set(targetPeer, tData);

        console.warn(`[GOSSIP PROTOCOL] 👂 İstihbarat Alındı: ${msg.origin} uyardı. Hedef ${targetPeer} Skoru ${tData.score.toFixed(1)}'e Düşürüldü.`);
        if (this.blackbox) this.blackbox.record('OMNI-MIND:GOSSIP', 'GOSSIP_PENALTY_APPLIED', `Slashing ${targetPeer} trust based on intel from ${msg.origin}`);
    }

    // ==========================================
    // 3. GLOBAL MUTATION SCORING (Doğal Seçilim)
    // ==========================================
    async broadcastApexMutation(action, localReward) {
        // Zayıf cihazda mucize olan şey güçlü cihazda çöp olabilir, bunu açıkça belirt
        const dnaPayload = {
            mutation: action,
            deviceTier: this.deviceTier,
            fitnessScore: localReward // recovered RAM / SSS drop equivalent
        };
        
        const signature = await this.signPayload(dnaPayload);
        this.signaler.send(JSON.stringify({
            type: 'EVOLUTION_DNA',
            origin: this.nodeId,
            pubKey: this.publicKeyJWK,
            payload: dnaPayload,
            signature: signature
        }));
        console.log(`[OMNI-MIND] 🚀 Apex Genetik Zincir Ağa Enjekte Edildi (Tier: ${this.deviceTier})`);
    }

    async handleIncomingDNA(msg) {
        const { origin, payload, signature } = msg;

        // Kripto Zırh (Aşı taklit edilemez)
        const isValid = await this.verifySignature(payload, signature, this.peers.get(origin)?.pubKey || msg.pubKey);
        if(!isValid) return;

        let peerData = this.peers.get(origin) || { score: 50, pubKey: msg.pubKey, lastSeen: Date.now() };
        
        // 🧬 Global Mutation Scoring (Doğal Seçilim Çarpışması)
        // Eğer zayıf bir cihazın attığı panik amputasyonuysa ve biz Yüksek Katman cihazsak, bu DNAdaki mutasyonu at!
        if (payload.deviceTier === 'LOW_END' && this.deviceTier === 'HIGH_END') {
            console.log(`%c[OMNI-MIND] 🛡️ Doğal Seçilim Reddedildi: Gelen DNA Low-End cihazda üretilmiş. Yüksek İrtifa Cihazı (High-End) için bu kesik mantıksız.`, "color: cyan;");
            return; // Etkisiz gen (Yoksay)
        }

        console.log(`%c[OMNI-MIND] 🧪 Apex DNA Kabul Edildi (From ${payload.deviceTier}). Canary Kuluçkası Başlatılıyor...`, "color: #00ffcc;");
        if (this.blackbox) this.blackbox.record('OMNI-MIND:DNA', 'CANARY_INCUBATION', `Testing Foreign Apex Genetic from ${origin}`);

        // Kuluçka (Canary) Sandbox Testi
        const baselineSSS = window.__SANTIS_SSS__ || 0;
        this.executeMutation(payload.mutation); 
        
        setTimeout(() => {
            const currentSSS = window.__SANTIS_SSS__ || 0;
            // Eğer Yabancı DNA bizim SSS'imizi Yükseltiyorsa (Hastalık Taşıyorsa)
            if (currentSSS > baselineSSS + 100) {
                console.error(`[OMNI-MIND] 🤮 KULUÇKA KUSMA REFLEKSİ: DNA Zehirli çıktı. P2P Ağına uyarı geçiliyor (Gossip)...`);
                peerData.score -= 30; // Kendi Skorumuzda Cezalandır
                this.broadcastGossip(origin, 'TOXIC_DNA_CANARY_FAILURE'); // Agı Uyar!
                
                if (this.blackbox) this.blackbox.record('OMNI-MIND:DNA', 'VOMIT', `Foreign Genetic severely damaged local state. Triggering Gossip.`, 'critical');
                // DOM Rollback (Simülasyon)
                document.getElementById('mod-lux1').className = 'module luxury';
            } else {
                console.log(`[OMNI-MIND] ✔️ Doğal Seçilim Başarılı. Yabancı Gen Entegre Edildi. Skoru Arttı.`);
                peerData.score += 15;
            }
            this.peers.set(origin, peerData);
        }, 8000);
    }

    // ==========================================
    // CORE BOOTSTRAP (Kripto & Uplink)
    // ==========================================
    async generateIdentity() {
        this.keyPair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
        this.publicKeyJWK = await crypto.subtle.exportKey("jwk", this.keyPair.publicKey);
        console.log(`%c[OMNI-MIND] 🔐 Cryptographic ECDSA Soul Forged: ${this.nodeId}`, "color: #b900ff; font-weight: bold;");
    }

    async signPayload(payloadObj) {
        const data = new TextEncoder().encode(JSON.stringify(payloadObj));
        const sig = await crypto.subtle.sign({ name: "ECDSA", hash: { name: "SHA-256" } }, this.keyPair.privateKey, data);
        return btoa(String.fromCharCode(...new Uint8Array(sig)));
    }

    async verifySignature(payloadObj, signatureB64, publicKeyJWK) {
        try {
            const key = await crypto.subtle.importKey("jwk", publicKeyJWK, { name: "ECDSA", namedCurve: "P-256" }, true, ["verify"]);
            const sigBuf = new Uint8Array(atob(signatureB64).split("").map(c => c.charCodeAt(0)));
            const dataBuf = new TextEncoder().encode(JSON.stringify(payloadObj));
            return await crypto.subtle.verify({ name: "ECDSA", hash: { name: "SHA-256" } }, key, sigBuf, dataBuf);
        } catch(e) { return false; }
    }

    connectToSignaler(url) {
        this.signaler = new WebSocket(url);
        this.signaler.onopen = () => {
            this.signaler.send(JSON.stringify({ type: 'MESH_JOIN', origin: this.nodeId, pubKey: this.publicKeyJWK }));
        };
        this.signaler.onmessage = async (packet) => {
            try {
                const msg = JSON.parse(packet.data);
                if (msg.type === 'GOSSIP_ALERT') this.processGossip(msg);
                if (msg.type === 'EVOLUTION_DNA' && msg.origin !== this.nodeId) this.handleIncomingDNA(msg);
            } catch(e) {}
        };
    }
}

// Global Export
export const hiveMind = new SantisOmniMind(window.SDCR?.Cortex, window.SDCR?.Sensor, window.__SDCR_BLACKBOX__);
window.__OMNI_MIND__ = hiveMind;
