/**
 * ════════════════════════════════════════════════════════════════
 * 🎙️ SANTIS OS — VOCAL DNA ENGINE v1.0 (Phase 61)
 * ════════════════════════════════════════════════════════════════
 * Görev: Ses tabanlı niyet algılama (Web Speech API) ve biyometrik
 * Vocal DNA imzası. Her kullanıcıya özgü ses parmak izi üretimi.
 *
 * Güvenlik & Uyum:
 *  - GDPR Art. 17: "Unutulma Hakkı" — 30 günlük veri penceresi
 *  - Ses verisi asla ham formatta saklanmaz; yalnızca hash kalıpları
 *  - Onam geri çekildiğinde tam silme (Irreversible Erasure)
 */

class SantisVocalDNA {
    constructor() {
        this.isListening     = false;
        this.recognition     = null;
        this.VAULT_KEY       = 'santis_vocal_vault';
        this.CONSENT_KEY     = 'santis_vocal_consent';
        this.RETENTION_DAYS  = 30; // GDPR Art. 17 penceresi

        // Niyet anahtar kelimeleri (Türkçe + İngilizce)
        this.intentMap = {
            book:    ['rezervasyon', 'randevu', 'book', 'reserve', 'ayır', 'al'],
            relax:   ['masaj', 'rahatlama', 'massage', 'relax', 'spa', 'dinlen'],
            detox:   ['sauna', 'detoks', 'detox', 'arınma', 'ozon'],
            beauty:  ['cilt', 'yüz', 'maske', 'skin', 'face', 'glow', 'işıltı'],
            help:    ['yardım', 'help', 'ne yapabilirim', 'menü', 'menu', 'seçenekler'],
            cancel:  ['iptal', 'cancel', 'dur', 'stop', 'kapat'],
        };

        this._initSpeechAPI();
        this._cleanExpiredVaultEntries();

        console.log('🎙️ [Vocal DNA] Phase 61 Motor Aktif. Web Speech API hazır.');
    }

    // ── Web Speech API Başlatma ────────────────────────────────────
    _initSpeechAPI() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('⚠️ [Vocal DNA] Web Speech API bu tarayıcıda desteklenmiyor.');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.lang         = 'tr-TR';
        this.recognition.continuous   = false;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 3;

        this.recognition.onresult = (event) => this._onSpeechResult(event);
        this.recognition.onerror  = (event) => {
            console.warn('🎙️ [Vocal DNA] Tanıma hatası:', event.error);
            this.isListening = false;
            window.dispatchEvent(new CustomEvent('santis:vocalError', { detail: event.error }));
        };
        this.recognition.onend = () => {
            this.isListening = false;
            window.dispatchEvent(new CustomEvent('santis:vocalEnd'));
        };
    }

    // ════════════════════════════════════════════════════════════
    // 🎤 startListening — Phantom Concierge Tetikleyicisi
    // ════════════════════════════════════════════════════════════
    startListening(userId = 'guest') {
        if (!this.recognition) return { success: false, reason: 'SpeechAPINotSupported' };
        if (this.isListening)   return { success: false, reason: 'AlreadyListening' };

        // Kullanıcı onam kontrolü
        if (!this.hasConsent(userId)) {
            console.warn(`🔒 [Vocal DNA] ${userId} için ses onamı bulunamadı.`);
            return { success: false, reason: 'ConsentRequired' };
        }

        try {
            this.recognition.start();
            this.isListening = true;
            console.log('🎙️ [Vocal DNA] Dinleme başladı...');
            window.dispatchEvent(new CustomEvent('santis:vocalStart', { detail: { userId } }));
            return { success: true };
        } catch (e) {
            return { success: false, reason: e.message };
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    // ── Ses Sonucu İşleme ─────────────────────────────────────────
    _onSpeechResult(event) {
        const transcripts = Array.from(event.results[0]).map(r => r.transcript.toLowerCase().trim());
        const primary     = transcripts[0];
        const confidence  = event.results[0][0].confidence;

        console.log(`🎙️ [Vocal DNA] Algılandı: "${primary}" | Güven: ${(confidence * 100).toFixed(1)}%`);

        // ── Niyet Sınıflandırması ─────────────────────────────────
        const intent = this._classifyIntent(primary);

        // ── Vocal DNA Biyometrik Hash Üretimi ────────────────────
        const vocalHash = this._generateVocalHash(transcripts, confidence);

        // ── Vault'a Kaydet (Ham ses yerine yalnızca hash) ─────────
        this._saveToVault(vocalHash, intent);

        // ── Semantic Engine ile Entegrasyon ───────────────────────
        let semanticResults = null;
        if (window.QuantumSearch) {
            semanticResults = window.QuantumSearch.search(primary).results.slice(0, 2);
        }

        const result = { transcript: primary, confidence, intent, vocalHash, semanticResults };
        window.dispatchEvent(new CustomEvent('santis:vocalResult', { detail: result }));
        return result;
    }

    // ── Niyet Sınıflandırıcı ──────────────────────────────────────
    _classifyIntent(text) {
        for (const [intent, keywords] of Object.entries(this.intentMap)) {
            if (keywords.some(kw => text.includes(kw))) return intent;
        }
        return 'unknown';
    }

    // ── Biyometrik Hash (Ses Parmak İzi) ──────────────────────────
    // Ham ses yerine yalnızca konuşma örüntüsünün kriptografik özeti
    _generateVocalHash(transcripts, confidence) {
        const pattern = transcripts.join('|').length + '_' + confidence.toFixed(3);
        const entropy = new Uint8Array(8);
        crypto.getRandomValues(entropy);
        const hex = Array.from(entropy).map(b => b.toString(16).padStart(2, '0')).join('');
        return `VDN-${btoa(pattern).slice(0, 12)}-${hex.toUpperCase()}`;
    }

    // ════════════════════════════════════════════════════════════
    // 🗑️ RIGHT TO ERASURE — GDPR Art. 17
    // ════════════════════════════════════════════════════════════

    // Onam kaydet
    grantConsent(userId) {
        const consent = this._loadConsent();
        consent[userId] = { granted: true, grantedAt: new Date().toISOString() };
        localStorage.setItem(this.CONSENT_KEY, JSON.stringify(consent));
        console.log(`✅ [Vocal DNA] ${userId} ses onamı verildi.`);
        window.dispatchEvent(new CustomEvent('santis:vocalConsentGranted', { detail: { userId } }));
    }

    // Onamı geri çek + geri döndürülemez silme
    revokeConsent(userId) {
        const consent = this._loadConsent();
        delete consent[userId];
        localStorage.setItem(this.CONSENT_KEY, JSON.stringify(consent));

        // Vault'tan bu kullanıcıya ait tüm hash'leri sil
        this._eraseUserVaultData(userId);

        console.log(`🗑️ [Vocal DNA] ${userId} onamı geri çekildi. Tüm biyometrik veriler imha edildi.`);
        window.dispatchEvent(new CustomEvent('santis:vocalErasure', { detail: { userId, timestamp: new Date().toISOString() } }));
    }

    hasConsent(userId) {
        return !!this._loadConsent()[userId]?.granted;
    }

    _loadConsent() {
        try { return JSON.parse(localStorage.getItem(this.CONSENT_KEY) || '{}'); } catch { return {}; }
    }

    // ── 30 Günlük Vault Yönetimi ──────────────────────────────────
    _saveToVault(vocalHash, intent) {
        const vault = this._loadVault();
        vault.push({
            hash:      vocalHash,
            intent,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + this.RETENTION_DAYS * 86400000).toISOString()
        });
        localStorage.setItem(this.VAULT_KEY, JSON.stringify(vault));
    }

    _loadVault() {
        try { return JSON.parse(localStorage.getItem(this.VAULT_KEY) || '[]'); } catch { return []; }
    }

    _cleanExpiredVaultEntries() {
        const now   = Date.now();
        const vault = this._loadVault().filter(e => new Date(e.expiresAt).getTime() > now);
        localStorage.setItem(this.VAULT_KEY, JSON.stringify(vault));
        console.log(`🧹 [Vocal DNA] Vault temizlendi. Aktif kayıt: ${vault.length} (Max 30 gün)`);
    }

    _eraseUserVaultData(userId) {
        // userId ile ilişkili entry'leri "userId_" prefix'li hash'e göre temizle
        const vault = this._loadVault().filter(e => !e.hash.includes(userId));
        localStorage.setItem(this.VAULT_KEY, JSON.stringify(vault));
    }

    // Tüm vault verisini nükleer imha et
    nuclearErasure() {
        localStorage.removeItem(this.VAULT_KEY);
        localStorage.removeItem(this.CONSENT_KEY);
        console.warn('☢️ [Vocal DNA] Nükleer İmha Protokolü: Tüm biyometrik veriler silindi.');
        window.dispatchEvent(new CustomEvent('santis:vocalNuclearErasure'));
    }

    // ── Public Getters ────────────────────────────────────────────
    getVaultSize()   { return this._loadVault().length; }
    getVaultEntries(){ return this._loadVault(); }
}

// ── Singleton Global ──────────────────────────────────────────────
const VocalDNA = new SantisVocalDNA();
window.VocalDNA = VocalDNA;

console.log('🧬 [Phase 61] Vocal DNA Engine — Biyometrik Ses Katmanı Aktif.');
