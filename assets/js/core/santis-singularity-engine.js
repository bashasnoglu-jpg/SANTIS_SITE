// assets/js/core/santis-singularity-engine.js
// SDCR V80.0 OMEGA - EMERGENT INTELLIGENCE LAYER (The Singularity Engine)
// DİKKAT: Bu modül deterministik değildir. Otonom evrim ve Doğal Seçilim içerir.

export class SwarmAgent {
    constructor(nodeId = 'Alpha-Node-01') {
        this.nodeId = nodeId;
        
        // ☢️ Mutasyon / Keşif Oranı (Dynamic Epsilon-Greedy)
        this.baseEpsilon = 0.05;    // Mühür 2: %5 Titanyum Kafes Sınırı
        this.currentEpsilon = 0.20; // %20 ile başla (Cehalet Çağı)
        this.decayRate = 0.995;     // Her başarılı derste radyasyon sönümlenir
        
        this.alpha = 0.1; // Öğrenme Hızı (Yeni tecrübe eskisini ne kadar ezer?)
        this.gamma = 0.9; // Gelecek Vizyonu (İleriye dönük ödüllerin bugünkü değeri)
        
        // Sürünün Genetik Hafızası (Q-Table): State -> Action -> Q-Value
        this.qTable = new Map(); 
        this.fitnessScore = 0; // Doğal seçilim arenası hayatta kalma puanı
        
        console.log(`🧬 [SINGULARITY] Düğüm ${this.nodeId} uyandı. Epigenetik hafıza aranıyor...`);
        this.initCryogenicMemory();
    }

    // 1. 🧊 Kriyojenik Hafıza (Mühür 1: Epigenetik Miras)
    initCryogenicMemory() {
        try {
            const storedDNA = localStorage.getItem(`SOVEREIGN_DNA_${this.nodeId}`);
            if (storedDNA) {
                this.qTable = new Map(JSON.parse(storedDNA));
                this.currentEpsilon = parseFloat(localStorage.getItem(`SOVEREIGN_EPSILON_${this.nodeId}`)) || this.currentEpsilon;
                console.log(`🧬 [SWARM] Genetik miras yüklendi. ${this.qTable.size} nöral bağ aktif.`);
            }
        } catch(e) { console.warn("Hafıza okunamadı. Genetik sıfırlandı."); }
    }

    saveDNA() {
        localStorage.setItem(`SOVEREIGN_DNA_${this.nodeId}`, JSON.stringify(Array.from(this.qTable.entries())));
        localStorage.setItem(`SOVEREIGN_EPSILON_${this.nodeId}`, this.currentEpsilon);
    }

    _hashState(context) {
        // Çevresel bağlamı tek bir String Hash'e çevir (Örn: "Morning_Gap30m_VIP")
        return `${context.time}_${context.gapSize}_${context.vipLevel}`; 
    }

    // 2. 🧠 Karar Anı (The Arena: Exploration vs Exploitation)
    decide(context, possibleActions) {
        const state = this._hashState(context);
        if (!this.qTable.has(state)) {
            const initialActions = {};
            possibleActions.forEach(a => initialActions[a] = 0);
            this.qTable.set(state, initialActions);
        }

        // ☢️ Radyoaktif Zar Atılıyor (Mutasyon)
        if (Math.random() < Math.max(this.baseEpsilon, this.currentEpsilon)) {
            const mutantAction = possibleActions[Math.floor(Math.random() * possibleActions.length)];
            console.warn(`☢️ [MUTASYON] Sürü risk alıyor! Mantığı reddedip yeni bir strateji deniyor: ${mutantAction}`);
            return mutantAction;
        }

        // 👑 Apex Kararı (Sömürü: En yüksek Q-Value'ya sahip aksiyonu bul)
        const actions = this.qTable.get(state);
        return Object.keys(actions).reduce((a, b) => actions[a] > actions[b] ? a : b);
    }

    // 3. ⚖️ Acı ve Ödül (The Bellman Equation)
    learn(context, action, reward, nextContext) {
        const state = this._hashState(context);
        const nextState = nextContext ? this._hashState(nextContext) : null;
        
        let currentQ = this.qTable.get(state)[action] || 0;
        let maxNextQ = 0;
        
        if (nextState && this.qTable.has(nextState)) {
            maxNextQ = Math.max(...Object.values(this.qTable.get(nextState)));
        }
        
        // Kuantum Öğrenme Formülü (Saf Evrimsel Matematik)
        let newQ = currentQ + this.alpha * (reward + this.gamma * maxNextQ - currentQ);
        this.qTable.get(state)[action] = newQ;
        
        this.fitnessScore += reward;
        console.log(`⚖️ [EVOLUTION] Ders alındı! Durum: ${state} | Eylem: ${action} | Ödül: ${reward} ➔ Yeni Q: ${newQ.toFixed(2)}`);
        
        // Başarılı oldukça risk almayı (radyasyonu) azalt
        if (this.currentEpsilon > this.baseEpsilon) {
            this.currentEpsilon *= this.decayRate;
        }
        
        this.saveDNA();
        return newQ;
    }
}

// ---------------------------------------------------------
// 🦠 THE SINGULARITY ENGINE (Gossip Protocol & Banishment)
// ---------------------------------------------------------
export class SingularityEngine {
    constructor() {
        this.agent = new SwarmAgent('Apex-01');
        // P2P Tarayıcı Sekmeleri Arası Dedikodu Ağı (Sunucusuz Telepati)
        this.gossipChannel = new BroadcastChannel('santis_swarm_gossip');
        this.listenToSwarm();
    }

    // ☠️ THE KRIPTO-GNOSIS: Telsizden yolladığın o kutsal satırın kalbi!
    evaluateFitness(behaviorContext) {
        const { context, action, reward, nextContext } = behaviorContext;
        
        const newQ = this.agent.learn(context, action, reward, nextContext);

        // 1. THE BANISHMENT (Afaroz Protokolü)
        // Eğer bu ajan sürekli yanlış karar verip para kaybettiriyorsa, onu ÖLDÜR!
        if (newQ < -50 || this.agent.fitnessScore < -100) {
            console.error(`💀 [BANISHMENT] Kanserli Genom tespit edildi. Ajan ${this.agent.nodeId} afaroz ediliyor!`);
            this.purgeAndRebirth();
            return false;
        }

        // 2. THE GOSSIP PROTOCOL (Federated Q-Learning)
        // Eğer bu ajan harika bir taktik bulup çok para kazandırdıysa (Reward > 50), bunu Sürü'ye fısılda!
        if (reward >= 50) { 
            console.log(`📡 [GOSSIP] Alfa Geni keşfedildi! Sürüye fısıldanıyor...`);
            this.gossipChannel.postMessage({
                type: 'APEX_GENE_DISCOVERED',
                state: this.agent._hashState(context),
                action: action,
                qValue: newQ
            });
        }
        return true;
    }

    purgeAndRebirth() {
        // Zayıf ajanı sil ve mutasyon oranı yüksek (%30), intikamcı yeni bir ajan doğur!
        this.agent = new SwarmAgent(`Mutant-${Date.now().toString().slice(-4)}`);
        this.agent.currentEpsilon = 0.30; 
        console.log(`🌱 [REBIRTH] Sürü zayıf halkayı yok etti. Vahşi doğaya yeni bir ajan bırakıldı: ${this.agent.nodeId}`);
    }

    listenToSwarm() {
        this.gossipChannel.onmessage = (event) => {
            if (event.data.type === 'APEX_GENE_DISCOVERED') {
                const { state, action, qValue } = event.data;
                console.log(`🕸️ [GOSSIP] Sürüden Alfa Geni duyuldu! DNA'ya entegre ediliyor (Crossover)...`);
                
                if (!this.agent.qTable.has(state)) this.agent.qTable.set(state, {});
                
                // CROSSOVER: Sürünün bilgeliğini kendi bilgeliğimizle harmanla (%50 ağırlık)
                const localQ = this.agent.qTable.get(state)[action] || 0;
                this.agent.qTable.get(state)[action] = (localQ + qValue) / 2;
                this.agent.saveDNA();
            }
        };
    }
}

window.SantisEvolution = new SingularityEngine();
