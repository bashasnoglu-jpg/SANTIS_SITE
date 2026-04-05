// santis-swarm-memory-v56.js
// SDCR V56.0 OMEGA - SWARM MEMORY & BYZANTINE FAULT TOLERANCE LAYER

export class SantisSwarmMemory {
  constructor(cortex, identity, mesh, blackbox) {
    this.cortex = cortex;
    this.identity = identity;
    this.mesh = mesh;
    this.blackbox = blackbox;

    this.globalPatterns = new Map(); 
    this.peerTrustLedger = new Map(); 

    this.localHardwareTier = this.evaluateHardwareProfile();

    console.warn("🌐 [V56 SWARM CORE] Global Memory Protocol Online. We are One.");
  }

  evaluateHardwareProfile() {
    const cores = navigator.hardwareConcurrency || 4;
    const ram = navigator.deviceMemory || 4;
    
    if (cores >= 8 && ram >= 8) return { tier: 'HIGH_END', baseWeight: 1.5 };
    if (cores >= 4 && ram >= 4) return { tier: 'MID_TIER', baseWeight: 1.0 };
    return { tier: 'LOW_END', baseWeight: 0.5 };
  }

  broadcastExperience(actionId, sssSpike) {
    if (sssSpike < 200) return; 

    const experiencePacket = {
      type: "SWARM_EXPERIENCE",
      peerId: this.identity?.fingerprint || "ANONYMOUS",
      hardwareTier: this.localHardwareTier.tier,
      action: actionId,        
      spike: sssSpike,         
      timestamp: Date.now()
    };

    if (this.identity && this.identity.sign) {
      this.identity.sign(experiencePacket).then(signature => {
        if(this.mesh) this.mesh.broadcast({ payload: experiencePacket, signature });
        if(this.blackbox) this.blackbox.record("V56_SWARM", "EXPERIENCE_SHARED", `Broadcasted trauma for: ${actionId}`);
      });
    }
  }

  async ingestExperience(packet, signature) {
    const { peerId, action, spike, hardwareTier } = packet;

    if (this.identity && this.identity.verify) {
      const isValid = await this.identity.verify(peerId, packet, signature);
      if (!isValid) return;
    }

    if (this.isAnomalous(action, spike)) {
      this.slashTrust(peerId, 50); 
      if(this.blackbox) this.blackbox.record("V56_GUARD", "POISONING_BLOCKED", `Z-Score anomaly from ${peerId}. Peer slashed.`);
      return;
    }

    const peerTrust = this.peerTrustLedger.get(peerId) || 1.0;
    const hardwareMultiplier = (hardwareTier === 'HIGH_END') ? 1.5 : (hardwareTier === 'LOW_END' ? 0.5 : 1.0);
    const finalImpact = spike * peerTrust * hardwareMultiplier;

    this.updateGlobalPattern(action, finalImpact, peerId, hardwareTier);
  }

  updateGlobalPattern(action, impact, peerId, hardwareTier) {
    if (!this.globalPatterns.has(action)) {
      this.globalPatterns.set(action, { severity: 0, confidence: 0, affectedTiers: new Set(), reporters: new Set() });
    }

    const pattern = this.globalPatterns.get(action);
    
    if (pattern.reporters.has(peerId)) return; 
    
    pattern.reporters.add(peerId);
    pattern.affectedTiers.add(hardwareTier);
    
    pattern.severity = (pattern.severity * pattern.confidence + impact) / (pattern.confidence + 1);
    pattern.confidence += 0.1;

    if (pattern.confidence > 0.8 && pattern.severity > 600 && pattern.affectedTiers.has(this.localHardwareTier.tier)) {
      console.warn(`🌐 [V56 IMMUNITY] Pre-Cog Shield Activated for: ${action}. Swarm dictates severe crash risk.`);
      if(this.cortex && this.cortex.preemptivelyAmputate) this.cortex.preemptivelyAmputate(action); 
      if(this.blackbox) this.blackbox.record("V56_IMMUNITY", "PREEMPTIVE_AMPUTATION", `Swarm memory saved node from ${action}.`);
    }
  }

  slashTrust(peerId, amount) {
    const current = this.peerTrustLedger.get(peerId) || 1.0;
    this.peerTrustLedger.set(peerId, Math.max(0.1, current - (amount/100)));
  }

  isAnomalous(action, spike) {
    const pattern = this.globalPatterns.get(action);
    if (!pattern || pattern.confidence < 0.5) return false; 
    
    return (spike > pattern.severity * 3);
  }
}

// Global Core
export const swarmMemory = new SantisSwarmMemory(window.SDCR?.Cortex, window.SDCR?.Identity, null, window.__SDCR_BLACKBOX__);
window.__SDCR_V56__ = swarmMemory;
