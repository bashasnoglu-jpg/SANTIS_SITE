/**
 * ==============================================================================
 * SANTIS SDCR - L10 P2P HIVE MESH (Otonom Karargâh Ağı)
 * ==============================================================================
 * İşlev: Sunucuyu bypass ederek yöneticiler arası direkt DataChannel kurar.
 *        Gelen saf baytları C++ WASM Hakemine (The Arbitrator) yedirir.
 * ==============================================================================
 */

class SovereignHiveMesh {
    constructor(wasmBridgeInstance) {
        this.wasm = wasmBridgeInstance; // Faz VI'da derlediğimiz Kuantum Hakem (C++)
        this.peers = new Map(); // RTCPeerConnection Matrisi
        this.dataChannels = new Map(); // P2P Binary Tünelleri
        
        this.signaler = new WebSocket('ws://localhost:8080'); // Çöpçatan VDS IP'si
        this.initSignaler();
    }

    initSignaler() {
        this.signaler.onopen = () => {
            console.log("%c[HIVE MESH] 🌐 Sinyal Santraline Bağlanıldı. Kovan Taranıyor...", "color: #00FFCC; background: #1a1a1a; padding: 2px 4px;");
            this.signaler.send(JSON.stringify({ type: 'HIVE_DISCOVERY' }));
        };

        this.signaler.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'PEER_JOINED') this.createPeer(data.peerId, true);
            else if (data.type === 'OFFER') await this.handleOffer(data);
            else if (data.type === 'ANSWER') await this.peers.get(data.senderId).setRemoteDescription(new RTCSessionDescription(data.sdp));
            else if (data.type === 'ICE_CANDIDATE') {
                if (this.peers.has(data.senderId)) {
                    await this.peers.get(data.senderId).addIceCandidate(new RTCIceCandidate(data.candidate));
                }
            }
        };
    }

    createPeer(targetId, isInitiator) {
        if (this.peers.has(targetId)) return this.peers.get(targetId);
        
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        this.peers.set(targetId, pc);

        if (isInitiator) {
            const dc = pc.createDataChannel('SovereignDeltaSync', { negotiated: false });
            this.setupDataChannel(targetId, dc);
        } else {
            pc.ondatachannel = (event) => this.setupDataChannel(targetId, event.channel);
        }

        pc.onicecandidate = (event) => {
            if (event.candidate) this.signaler.send(JSON.stringify({ type: 'ICE_CANDIDATE', targetId, candidate: event.candidate }));
        };

        if (isInitiator) {
            pc.createOffer().then(offer => pc.setLocalDescription(offer)).then(() => {
                this.signaler.send(JSON.stringify({ type: 'OFFER', targetId, sdp: pc.localDescription }));
            });
        }
        return pc;
    }

    async handleOffer(data) {
        const pc = this.createPeer(data.senderId, false);
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.signaler.send(JSON.stringify({ type: 'ANSWER', targetId: data.senderId, sdp: pc.localDescription }));
    }

    setupDataChannel(targetId, dc) {
        dc.binaryType = 'arraybuffer'; // 🚨 SIFIR KOPYA (ZERO-COPY) ALANI 🚨
        
        dc.onopen = () => {
            console.log(`%c[HIVE MESH] 🔗 P2P Tüneli Mühürlendi: <--> ${targetId}`, "color: #D4AF37; font-weight: bold; background: #1a1a1a; padding: 2px 4px;");
            this.dataChannels.set(targetId, dc);
        };

        dc.onmessage = (event) => {
            // Gelen Raw ArrayBuffer'ı doğrudan C++ WASM Hakemine gönder (JS serileştirmesi YASAK)
            const binaryPayload = new Uint8Array(event.data);
            
            // Simüle edilmiş Tick ve Node ID (Gerçekte C++ matrisine paketin ilk byte'larından okunarak gönderilir)
            const incomingTick = 100; // Örnek zaman yöneyi
            const incomingNodeId = 1; // Örnek kimlik
            
            // WASM Hakemi devrede:
            const decision = this.wasm.evaluateIncomingGossip(99, incomingTick, incomingNodeId, binaryPayload);
            
            if (decision && decision.action === 'OVERRIDE') {
                console.log("[HIVE MESH] ⚖️ DOM Cerrahisi: P2P üzerinden gelen hakikat arayüze işleniyor...");
            }
        };

        dc.onclose = () => {
            this.dataChannels.delete(targetId);
            this.peers.delete(targetId);
        };
    }

    broadcastDelta(binaryDeltaPayload) {
        this.dataChannels.forEach((dc) => {
            if (dc.readyState === 'open') dc.send(binaryDeltaPayload); 
        });
    }
}
// Boot the Hive Mesh by injecting it globally when WASM finishes initializing
// window.SovereignHive = new SovereignHiveMesh(window.SantisWasmCore);
