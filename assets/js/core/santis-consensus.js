/**
 * 👑 LAYER 3: SANTIS CONSENSUS PROTOCOL
 * Leader Lease Expiration & Tab Mutiny Engine
 */
class SantisConsensus {
  constructor() {
    this.isLeader = false;
    this.LEASE_TIMEOUT = 5000;
    this.PING_INTERVAL = 2000;
    this.HEARTBEAT_KEY = "santis_leader_lease";
    
    this.#elect();
    this.#startWatchdog();
  }

  #elect(steal = false) {
    if (!navigator.locks) { this.isLeader = true; return; }

    navigator.locks.request("santis_os_consensus", { mode: "exclusive", steal }, () => {
      return new Promise((resolve) => {
        console.log(`🦅 [CONSENSUS] Liderlik Mührü Alındı. (İsyan: ${steal ? 'Evet' : 'Hayır'})`);
        this.isLeader = true;
        
        // Kira Yenileme (Lease Renewal)
        const beat = setInterval(() => {
          localStorage.setItem(this.HEARTBEAT_KEY, Date.now().toString());
        }, this.PING_INTERVAL);

        window.addEventListener("beforeunload", () => {
          clearInterval(beat);
          this.isLeader = false;
          resolve(); // Kilidi efendice devret
        });
      });
    }).catch(() => { /* Bu sekme bir Proxy / Follower'dır. */ });
  }

  #startWatchdog() {
    setInterval(() => {
      if (this.isLeader) return;
      
      const lastBeatStr = localStorage.getItem(this.HEARTBEAT_KEY);
      const lastBeat = lastBeatStr ? Number(lastBeatStr) : Date.now();
      
      if (Date.now() - lastBeat > this.LEASE_TIMEOUT) {
        console.warn("💀 [CONSENSUS] Lider düştü (Tab Freeze). Kilit gasp ediliyor!");
        this.#elect(true); // Kilidi zorla kır (Mutiny)
      }
    }, 3000);
  }
}
window.santisConsensus = new SantisConsensus();
