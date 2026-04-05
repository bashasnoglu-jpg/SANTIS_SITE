/**
 * =======================================================
 * SANTIS DISTRIBUTED COGNITIVE RUNTIME - V42.5
 * Modül: LEVIATHAN PROTOCOL (WebRTC Mesh + Consensus Arbiter)
 * "Kuleler yıkılır, Kovan yaşar. Gerçeklik en ağır kütüğe aittir."
 * =======================================================
 */

import { NeuralBus } from './sovereign-bus.js';
import { SantisCognitiveLedger } from './santis-cognitive-ledger.js'; 

class LeviathanMeshArbiter {
    constructor() {
        this.peers = new Map(); // Yeraltı Tünelleri (RTCDataChannel)
        this.localId = crypto.randomUUID().split('-')[0]; // Deterministik Tie-Breaker
        
        this.isCoordinator = false;
        this.STATUS = 'TOWER_ACTIVE'; 
        
        // 1. Kule'nin çöküşünü (Disconnect) dinle ve Kıyameti başlat!
        NeuralBus.subscribe('SYSTEM_SYNC', (payload) => {
            if (payload.status === 'OFFLINE') this._awakenTheUnderground();
        });

        // 2. Kule hayattayken gelen "Tanışma" (Signaling) sinyallerini yakala
        NeuralBus.subscribe('RTC:SIGNAL', (payload) => this._handleSleeperCellSignaling(payload));
    }

    // ==========================================
    // 1. SLEEPER CELL (Tünelleri Kule Hayattayken Kaz)
    // ==========================================
    async _handleSleeperCellSignaling(data) {
        if (!this.peers.has(data.peerId)) {
            const rtc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
            this.peers.set(data.peerId, { connection: rtc, channel: null });
            
            if (data.isInitiator) {
                const channel = rtc.createDataChannel('santis-underground', { negotiated: true, id: 1 });
                this._bindChannel(data.peerId, channel);
            } else {
                rtc.ondatachannel = (e) => this._bindChannel(data.peerId, e.channel);
            }
        }
    }

    _bindChannel(peerId, channel) {
        channel.onopen = () => console.log(`🕳️ [LEVIATHAN] Yeraltı tüneli kazıldı: [${peerId}] (Dormant/Uyku Modu)`);
        channel.onclose = () => this.peers.delete(peerId);
        channel.onmessage = (e) => this._handleUndergroundMessage(peerId, JSON.parse(e.data));
        this.peers.get(peerId).channel = channel;
    }

    // ==========================================
    // 2. THE FALL (Kule Düştü, Anarşi Başladı)
    // ==========================================
    _awakenTheUnderground() {
        if (this.STATUS === 'UNDERGROUND_MODE') return;
        
        console.error("🗼 [LEVIATHAN] KULE DÜŞTÜ! Ağ bağlantısı koptu.");
        console.warn(`🌐 [LEVIATHAN] Yeraltı Ağı Aktive Ediliyor... Node: [${this.localId}]`);
        this.STATUS = 'UNDERGROUND_MODE';

        // Anarşiyi önlemek için saniyesinde SEÇİM (Election) başlat!
        this._initiateConsensusElection();
    }

    // ==========================================
    // 3. PROOF OF CONTINUITY (Hakemlik ve Lider Seçimi)
    // ==========================================
    _initiateConsensusElection() {
        const myAuthority = {
            id: this.localId,
            vectorTime: SantisCognitiveLedger.logicalClock || 0,
        };

        this._broadcast({ type: 'ELECTION_BID', data: myAuthority });
        
        this.electionTimer = setTimeout(() => {
            this._claimThrone();
        }, 500);
    }

    _handleUndergroundMessage(peerId, msg) {
        if (msg.type === 'ELECTION_BID') {
            const rival = msg.data;
            const myClock = SantisCognitiveLedger.logicalClock || 0;

            if (rival.vectorTime > myClock || (rival.vectorTime === myClock && rival.id > this.localId)) {
                clearTimeout(this.electionTimer);
                console.log(`⚖️ [LEVIATHAN] Liderlik reddedildi. [${rival.id}] düğümü daha güncel bir gerçekliğe sahip. Biat edildi.`);
                this.isCoordinator = false;
            }
        } 
        else if (msg.type === 'CORONATION') {
            console.warn(`👑 [LEVIATHAN] Yeni Ağ Koordinatörü atandı: [${peerId}]. Gerçeklik senkronize ediliyor...`);
            this.isCoordinator = false;
            clearTimeout(this.electionTimer);
            
            if (SantisCognitiveLedger.overwriteReality) {
                SantisCognitiveLedger.overwriteReality(msg.masterLedger);
            }
        }
        else if (msg.type === 'MESH_EVENT' && !this.isCoordinator) {
            NeuralBus.dispatchLocal('NETWORK_INBOUND', msg.payload, 1);
        }
    }

    _claimThrone() {
        this.isCoordinator = true;
        console.log(`👑 [LEVIATHAN] BÖLÜNMÜŞ BEYİN ÖNLENDİ. Mutlak Güç! [${this.localId}] Master Arbiter seçildi.`);
        
        this._broadcast({ 
            type: 'CORONATION', 
            masterLedger: SantisCognitiveLedger.history || []
        });
    }

    // ==========================================
    // 4. MESH YAYINI (P2P Fısıltı Ağı)
    // ==========================================
    _broadcast(msg) {
        if (this.STATUS !== 'UNDERGROUND_MODE') return; 
        const payload = JSON.stringify(msg);
        for (const [id, peerObj] of this.peers.entries()) {
            if (peerObj.channel && peerObj.channel.readyState === 'open') {
                peerObj.channel.send(payload);
            }
        }
    }
}

export const CognitiveMesh = new LeviathanMeshArbiter();
