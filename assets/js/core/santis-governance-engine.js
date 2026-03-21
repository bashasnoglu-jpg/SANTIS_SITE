/**
 * ════════════════════════════════════════════════════════════════
 * 🏛️ SANTIS OS — SOVEREIGN GOVERNANCE ENGINE v1.0 (Phase 58)
 * ════════════════════════════════════════════════════════════════
 * Görev: Ajan Anayasası'nı (Sovereign Charter) parse eder,
 * her ajan için TrustScore hesaplar ve eylemleri değerlendirir.
 *
 * Hiyerarşi:
 *  CEO  (Strategist)  → Görevleri DAG'lara böler
 *  CFO  (Treasury)    → Mali limitleri denetler
 *  Auditor            → Ajan çıktılarını doğrular
 */

class SantisGovernanceEngine {
    constructor() {
        this.charter = null;
        this.trustScores = {}; // { agentId: number }
        this.actionLog = [];   // Audit trail
        this.charterUrl = '/data/charter/sovereign-charter.yaml';

        this._init();
    }

    // ── Başlatma: Anayasayı Fetch Et ─────────────────────────────
    async _init() {
        try {
            const response = await fetch(this.charterUrl);
            const yamlText = await response.text();
            this.charter = this._parseYAML(yamlText);
            this._initTrustScores();
            console.log('🏛️ [Governance Engine] Sovereign Charter yüklendi. Ajanlar anayasa altına alındı.', this.charter);
            window.dispatchEvent(new CustomEvent('santis:charterReady', { detail: this.charter }));
        } catch (err) {
            console.error('🚨 [Governance Engine] Charter yüklenemedi! Sistemi izole modda tutuyorum.', err);
        }
    }

    // ── Basit YAML Parser (js-yaml yok, lightweight) ─────────────
    _parseYAML(yamlText) {
        // Charter yapısı sabittir; güvenli amaçlı hafif parse
        const agents = {};
        const global = { trust_score: { initial_base: 50, success_reward: 5, failure_penalty: 15 } };

        // global trust_score alanlarını yakala
        const initMatch = yamlText.match(/initial_base:\s*(\d+)/);
        const rewardMatch = yamlText.match(/success_reward:\s*(\d+)/);
        const penaltyMatch = yamlText.match(/failure_penalty:\s*(\d+)/);
        if (initMatch) global.trust_score.initial_base = parseInt(initMatch[1]);
        if (rewardMatch) global.trust_score.success_reward = parseInt(rewardMatch[1]);
        if (penaltyMatch) global.trust_score.failure_penalty = parseInt(penaltyMatch[1]);

        // Ajan bloklarını yakala
        const agentBlocks = yamlText.matchAll(/  (\w+):\n    display_name: "([^"]+)"[\s\S]*?    trust_score_requirement: (\d+)[\s\S]*?      max_discount_pct: (\d+)[\s\S]*?      daily_budget_usd: (\d+)/g);
        for (const match of agentBlocks) {
            agents[match[1]] = {
                id: match[1],
                display_name: match[2],
                trust_score_requirement: parseInt(match[3]),
                fiscal: {
                    max_discount_pct: parseInt(match[4]),
                    daily_budget_usd: parseInt(match[5])
                }
            };
        }

        return { global, agents };
    }

    // ── TrustScore Başlangıç Değerlerini Yükle ──────────────────
    _initTrustScores() {
        if (!this.charter) return;
        const base = this.charter.global.trust_score.initial_base;
        Object.keys(this.charter.agents).forEach(agentId => {
            // Local storage'dan kalıcı skoru okumaya çalış
            const stored = localStorage.getItem(`santis_trust_${agentId}`);
            this.trustScores[agentId] = stored ? parseInt(stored) : base;
        });
        console.log('📊 [Governance Engine] TrustScores Yüklendi:', this.trustScores);
    }

    // ── Puan Güncelle ─────────────────────────────────────────────
    _updateScore(agentId, success) {
        if (this.trustScores[agentId] === undefined) return;
        const { success_reward, failure_penalty, min_score, max_score } = this.charter.global.trust_score;
        const delta = success ? success_reward : -failure_penalty;
        this.trustScores[agentId] = Math.min(max_score || 100, Math.max(min_score || 0, this.trustScores[agentId] + delta));
        localStorage.setItem(`santis_trust_${agentId}`, this.trustScores[agentId]);
        window.dispatchEvent(new CustomEvent('santis:trustScoreChanged', {
            detail: { agentId, score: this.trustScores[agentId] }
        }));
    }

    // ── Otonomi Seviyesi Hesapla ─────────────────────────────────
    _getAutonomyLevel(score) {
        if (score >= 90) return 'Sovereign';
        if (score >= 60) return 'Monitored';
        return 'Restricted';
    }

    // ════════════════════════════════════════════════════════════
    // ⚖️ evaluateAction — Ana Karar Köprüsü (CEO + CFO + Auditor)
    // ════════════════════════════════════════════════════════════
    evaluateAction(agentId, action, payload = {}) {
        if (!this.charter) {
            console.error('🚨 [Governance] Charter henüz yüklenmedi!');
            return { allowed: false, reason: 'CharterNotLoadedError' };
        }

        const agent = this.charter.agents[agentId];
        if (!agent) {
            return { allowed: false, reason: 'UnknownAgentError' };
        }

        const currentScore = this.trustScores[agentId] ?? 0;
        const autonomy = this._getAutonomyLevel(currentScore);

        // ── 1. CEO (Stratejist): Skor Barajı Kontrolü ────────────
        if (currentScore < agent.trust_score_requirement) {
            const reason = 'UnauthorizedAutonomyError';
            this._log(agentId, action, false, reason, payload);
            this._updateScore(agentId, false);
            console.warn(`🚨 [Governance - CEO] ${agentId} reddedildi. Skor: ${currentScore} < Baraj: ${agent.trust_score_requirement}`);
            return { allowed: false, reason, currentScore, autonomy };
        }

        // ── 2. CFO (Treasury): Mali Limit Kontrolü ───────────────
        if (payload.discount_pct !== undefined && payload.discount_pct > agent.fiscal.max_discount_pct) {
            const reason = 'FiscalInsolvencyError';
            this._log(agentId, action, false, reason, payload);
            this._updateScore(agentId, false);
            console.warn(`💸 [Governance - CFO] ${agentId} bütçe aştı! İstenen: %${payload.discount_pct}, Limit: %${agent.fiscal.max_discount_pct}`);
            return { allowed: false, reason, currentScore, autonomy };
        }

        if (payload.budget_usd !== undefined && payload.budget_usd > agent.fiscal.daily_budget_usd) {
            const reason = 'FiscalInsolvencyError';
            this._log(agentId, action, false, reason, payload);
            this._updateScore(agentId, false);
            console.warn(`💸 [Governance - CFO] ${agentId} günlük bütçeyi aştı! $${payload.budget_usd} > $${agent.fiscal.daily_budget_usd}`);
            return { allowed: false, reason, currentScore, autonomy };
        }

        // ── 3. Auditor: İnsan Onayı Gerekiyor mu? ────────────────
        if (autonomy === 'Restricted') {
            const reason = 'HumanApprovalRequired';
            this._log(agentId, action, false, reason, payload);
            console.warn(`👁️ [Governance - Auditor] ${agentId} kısıtlı. İnsan onayı (Ghost Override) gereklidir.`);
            return { allowed: false, reason, currentScore, autonomy };
        }

        // ── ✅ ONAYLANDI ──────────────────────────────────────────
        this._log(agentId, action, true, 'Approved', payload);
        this._updateScore(agentId, true);
        console.log(`✅ [Governance] ${agentId} → "${action}" onaylandı. Skor: ${this.trustScores[agentId]} | Otonomi: ${autonomy}`);
        return { allowed: true, reason: 'Approved', currentScore: this.trustScores[agentId], autonomy };
    }

    // ── Audit Trail ───────────────────────────────────────────────
    _log(agentId, action, success, reason, payload) {
        const entry = {
            timestamp: new Date().toISOString(),
            agentId, action, success, reason,
            score: this.trustScores[agentId],
            payload
        };
        this.actionLog.push(entry);
        if (this.actionLog.length > 100) this.actionLog.shift(); // Max 100 kayıt
        window.dispatchEvent(new CustomEvent('santis:auditLog', { detail: entry }));
    }

    // ── Public Getters ────────────────────────────────────────────
    getTrustScore(agentId) { return this.trustScores[agentId] ?? 0; }
    getAutonomyLevel(agentId) { return this._getAutonomyLevel(this.getTrustScore(agentId)); }
    getAuditLog() { return [...this.actionLog]; }
    getAllScores() { return { ...this.trustScores }; }
}

// ── Singleton — Global Governance Bus ────────────────────────────
const GovernanceEngine = new SantisGovernanceEngine();
window.GovernanceEngine = GovernanceEngine;

console.log('⚖️ [Sovereign Governance Engine] Phase 58 — Ajan Anayasası Aktif.');
