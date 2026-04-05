// santis-evolution-core.js
// SDCR V52.0 OMEGA - THE SINGULARITY (EMERGENT INTELLIGENCE LAYER)

export class SantisEvolutionEngine {
  constructor(omniCore, blackbox) {
    this.omni = omniCore;
    this.blackbox = blackbox;
    
    // RL & Genetik Hiperparametreler
    this.Q_TABLE = new Map(); // dnaHash -> fitnessScore
    this.LEARNING_RATE = 0.2;
    this.MUTATION_RATE = 0.05; // %5 ihtimalle determinizmi yık (Explore)
    
    // Nöroplastisite Döngüsü
    setInterval(() => this.pruneMycelium(), 45000); // Ağ topolojisini buda
    
    console.warn("🧬 [EVOLUTION] Singularity Engine Awakened. Determinism is dead.");
  }

  // -----------------------------
  // 1. REPUTATION GRAPH & NEUROPLASTICITY (Sinaptik Budama)
  // -----------------------------
  pruneMycelium() {
    if (!this.omni || !this.omni.peers || this.omni.peers.size < 5) return;

    console.log("[EVOLUTION] 🕸️ Synaptic Pruning... Optimizing Physical Topology.");

    const peers = Array.from(this.omni.peers.entries());
    
    // Düğümleri Güven (Trust) Skoru ve Gecikmeye (Ping) göre sırala
    peers.sort((a, b) => {
      const scoreA = (a[1].score || 50) / (a[1].latency || 1);
      const scoreB = (b[1].score || 50) / (b[1].latency || 1);
      return scoreB - scoreA; 
    });

    // En alt %25'lik dilimi (Yalan söyleyen, yavaş veya işe yaramaz) FİZİKSEL OLARAK KOPAR.
    const cutoff = Math.floor(peers.length * 0.75);
    const weakPeers = peers.slice(cutoff);

    for (const [peerId, peerData] of weakPeers) {
      // Eğer WebRTC RTCPeerConnection var ise kapat
      if(peerData.pc) peerData.pc.close();
      this.omni.peers.delete(peerId);
      
      if (this.blackbox) this.blackbox.record("EVOLUTION", "SYNAPSE_SEVERED", `Amputated connection with ${peerId} (Low Fitness)`);
    }
  }

  // -----------------------------
  // 2. SWARM GENETICS (Crossover & Epsilon-Greedy Mutation)
  // -----------------------------
  breedDNA(localDAG, swarmDAG) {
    console.log('[EVOLUTION] 🧬 Splice Sequence Initiated: Breeding Swarm DNA with Local Memory...');
    
    // Crossover: İlk yarıyı Swarm'dan, ikinci yarıyı Lokalden al (Topolojik dizilimi bük)
    const midPoint = Math.floor(swarmDAG.length / 2);
    let childDAG = [...swarmDAG.slice(0, midPoint), ...localDAG.slice(midPoint)];

    // Çakışmaları temizle (Geçerli bir DAG olması için Set kullan)
    childDAG = [...new Set(childDAG)];
    const missing = localDAG.filter(mod => !childDAG.includes(mod));
    childDAG.push(...missing);

    // Kasıtlı İsyan (Radiant Mutation): %5 ihtimalle iki genin sırasını rastgele değiştir
    if (Math.random() < this.MUTATION_RATE) {
      console.warn("☢️ [EVOLUTION] SPONTANEOUS MUTATION OCCURRED! Exploring chaotic timeline...");
      if (childDAG.length > 1) {
          const idx1 = Math.floor(Math.random() * childDAG.length);
          const idx2 = Math.floor(Math.random() * childDAG.length);
          
          [childDAG[idx1], childDAG[idx2]] = [childDAG[idx2], childDAG[idx1]]; // Swap
          if (this.blackbox) this.blackbox.record("EVOLUTION", "SPONTANEOUS_MUTATION", `Genome randomized at indexes ${idx1}, ${idx2}`);
      }
    }

    return childDAG;
  }

  // -----------------------------
  // 3. FEDERATED Q-LEARNING (Doğal Seçilim Motoru)
  // -----------------------------
  evaluateFitness(oldSSS, newSSS, dnaHash) {
    const reward = oldSSS - newSSS; // SSS düştüyse ödül pozitiftir
    
    const currentQ = this.Q_TABLE.get(dnaHash) || 0;
    const newQ = currentQ + this.LEARNING_RATE * (reward - currentQ);
    this.Q_TABLE.set(dnaHash, newQ);
    
    if (reward > 150) {
      // Bu melez mutasyon MÜKEMMEL sonuç verdi! 
      if (this.blackbox) this.blackbox.record('EVOLUTION', 'APEX_MUTATION_FOUND', `Efficiency increased by ${reward} SSS.`);
      return true; 
    }
    return false;
  }
}
