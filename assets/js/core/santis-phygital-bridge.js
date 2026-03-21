/**
 * ════════════════════════════════════════════════════════════════
 * 🌐 SANTIS OS — PHYGITAL BRIDGE v1.0 (Phase 59)
 * ════════════════════════════════════════════════════════════════
 * Görev: Fiziksel IoT cihazları ile Santis OS arasında güvenli
 * bir komut köprüsü kurmak. Yalnızca TrustScore ≥ 95 olan ajanlar
 * fiziksel cihazlara erişebilir.
 *
 * Mimarisi:
 *  Digital Twin Registry  → Fiziksel cihazların sanal ikizleri
 *  IoT Command Router     → TrustScore kapılı komut göndericisi
 *  Ghost Override         → İnsan müdahalesi için acil geçersiz kılma
 *  Reassessment Queue     → Başarısız ajanların yeniden değerlendirme kuyruğu
 */

class SantisPhygitalBridge {
    constructor() {
        // TrustScore eşiği — fiziksel dünyaya erişim için minimum skor
        this.IoT_TRUST_THRESHOLD = 95;

        // ── Digital Twin Registry ────────────────────────────────
        // Gerçek cihazlar yerine simüle edilmiş sanal ikizler
        this.twins = {
            'smart_lock_hamam':  { id: 'smart_lock_hamam',  label: 'Hamam Akıllı Kilit',    status: 'locked',   lastCommand: null, commandCount: 0 },
            'sauna_thermostat':  { id: 'sauna_thermostat',  label: 'Sauna Termostatı',       status: 'idle',     lastCommand: null, temperature: 38, commandCount: 0 },
            'ambient_lighting':  { id: 'ambient_lighting',  label: 'Ortam Aydınlatma',       status: 'on',       lastCommand: null, brightness: 80, commandCount: 0 },
            'massage_table_led': { id: 'massage_table_led', label: 'Masaj Masası LED Halo',  status: 'off',      lastCommand: null, commandCount: 0 },
            'reception_display': { id: 'reception_display', label: 'Resepsiyon Ekranı',      status: 'standby',  lastCommand: null, commandCount: 0 },
        };

        // Acil Ghost Override bayrağı
        this.ghostOverrideActive = false;
        this.ghostOverrideBy = null;

        // Yeniden değerlendirme kuyruğu
        this.reassessmentQueue = [];

        // Komut Geçmişi (Audit Trail)
        this.commandLog = [];

        this._boot();
    }

    _boot() {
        console.log('🌐 [Phygital Bridge] Dijital İkizler ayağa kalkıyor...');
        this._broadcastTwinState();
        console.log('🌐 [Phygital Bridge] IoT Köprüsü Aktif. TrustScore Eşiği: ≥', this.IoT_TRUST_THRESHOLD);
        window.dispatchEvent(new CustomEvent('santis:phygitalReady', { detail: this.twins }));
    }

    // ════════════════════════════════════════════════════════════
    // 📡 sendCommand — Ana IoT Komut Yönlendiricisi
    // ════════════════════════════════════════════════════════════
    sendCommand(agentId, deviceId, command, params = {}) {

        // ── 1. Ghost Override Aktif mi? ───────────────────────────
        if (this.ghostOverrideActive) {
            console.warn(`👻 [Ghost Override] Tüm ajan komutları askıya alındı. Override: ${this.ghostOverrideBy}`);
            return { success: false, reason: 'GhostOverrideActive', overrideBy: this.ghostOverrideBy };
        }

        // ── 2. Cihaz var mı? ──────────────────────────────────────
        const twin = this.twins[deviceId];
        if (!twin) {
            return { success: false, reason: 'UnknownDeviceError', deviceId };
        }

        // ── 3. TrustScore Kapısı (≥ 95 Zorunlu) ─────────────────
        const engine = window.GovernanceEngine;
        const currentScore = engine ? engine.getTrustScore(agentId) : 0;

        if (currentScore < this.IoT_TRUST_THRESHOLD) {
            console.warn(`🔒 [Phygital Bridge] ${agentId} → "${deviceId}" ERİŞİM REDDEDİLDİ. Skor: ${currentScore} < ${this.IoT_TRUST_THRESHOLD}`);
            this._queueForReassessment(agentId, currentScore);
            this._log(agentId, deviceId, command, false, 'IoTTrustGateError', params);
            return { success: false, reason: 'IoTTrustGateError', currentScore, required: this.IoT_TRUST_THRESHOLD };
        }

        // ── 4. Komutu Çalıştır (Dijital İkizi Güncelle) ──────────
        this._executeOnTwin(twin, command, params);
        this._log(agentId, deviceId, command, true, 'Executed', params);
        console.log(`✅ [Phygital Bridge] ${agentId} → "${twin.label}" | Komut: ${command}`, params);

        return { success: true, reason: 'Executed', device: twin };
    }

    _executeOnTwin(twin, command, params) {
        twin.lastCommand = command;
        twin.commandCount++;
        twin.lastUpdated = new Date().toISOString();

        switch (command) {
            case 'unlock':      twin.status = 'unlocked'; break;
            case 'lock':        twin.status = 'locked'; break;
            case 'set_temp':    twin.temperature = params.value ?? twin.temperature; twin.status = 'active'; break;
            case 'set_brightness': twin.brightness = params.value ?? twin.brightness; twin.status = 'on'; break;
            case 'turn_on':     twin.status = 'on'; break;
            case 'turn_off':    twin.status = 'off'; break;
            case 'display':     twin.status = 'displaying'; twin.content = params.content ?? ''; break;
            default:            twin.status = 'command_received';
        }

        this._broadcastTwinState();
    }

    // ════════════════════════════════════════════════════════════
    // 👻 Ghost Override — Acil İnsan Müdahalesi Protokolü
    // ════════════════════════════════════════════════════════════
    activateGhostOverride(operatorId = 'ADMIN') {
        this.ghostOverrideActive = true;
        this.ghostOverrideBy = operatorId;
        console.warn(`🚨 [Ghost Override] AKTİF! Tüm otonom IoT komutları DONDURULDU. Operatör: ${operatorId}`);
        window.dispatchEvent(new CustomEvent('santis:ghostOverride', { detail: { active: true, operatorId } }));
    }

    deactivateGhostOverride(operatorId = 'ADMIN') {
        this.ghostOverrideActive = false;
        this.ghostOverrideBy = null;
        console.log(`✅ [Ghost Override] Deaktive edildi. Otonom kontrol iade edildi. Operatör: ${operatorId}`);
        window.dispatchEvent(new CustomEvent('santis:ghostOverride', { detail: { active: false, operatorId } }));
    }

    // ── Yeniden Değerlendirme Kuyruğu ────────────────────────────
    _queueForReassessment(agentId, currentScore) {
        const existing = this.reassessmentQueue.find(q => q.agentId === agentId);
        if (!existing) {
            this.reassessmentQueue.push({ agentId, score: currentScore, queuedAt: new Date().toISOString() });
            console.warn(`📋 [Phygital Bridge] ${agentId} yeniden değerlendirme kuyruğuna alındı.`);
            window.dispatchEvent(new CustomEvent('santis:agentReassessment', { detail: { agentId, currentScore } }));
        }
    }

    // ── Digital Twin Durumunu Yayınla ────────────────────────────
    _broadcastTwinState() {
        window.dispatchEvent(new CustomEvent('santis:twinStateUpdate', { detail: { twins: this.twins } }));
    }

    // ── Audit Log ─────────────────────────────────────────────────
    _log(agentId, deviceId, command, success, reason, params) {
        const entry = { timestamp: new Date().toISOString(), agentId, deviceId, command, success, reason, params };
        this.commandLog.push(entry);
        if (this.commandLog.length > 200) this.commandLog.shift();
    }

    // ── Public Getters ────────────────────────────────────────────
    getTwinState(deviceId) { return this.twins[deviceId] || null; }
    getAllTwins() { return { ...this.twins }; }
    getReassessmentQueue() { return [...this.reassessmentQueue]; }
    getCommandLog() { return [...this.commandLog]; }
    isGhostOverrideActive() { return this.ghostOverrideActive; }
}

// ── Singleton Global ──────────────────────────────────────────────
const PhygitalBridge = new SantisPhygitalBridge();
window.PhygitalBridge = PhygitalBridge;

console.log('🔩 [Phase 59] Phygital Bridge Aktif — Fiziksel ve Dijital Dünya Birleşti.');
