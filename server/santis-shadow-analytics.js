// server/santis-shadow-analytics.js
import { dbVault } from './santis-db-vault.js';

/**
 * Santis Shadow Analytics: Veriyi kalıcı ve karanlık hale getirir
 */
export async function recordShadowData(data) {
    const { tenantId, sessionId, stressLevel, planId, calmUsed, conversionStatus } = data;

    const query = `
        INSERT INTO shadow_analytics 
        (session_id, tenant_id, max_stress_level, final_plan_id, conversion_status, calm_protocol_activated)
        VALUES ($1, $2, $3, $4, $5, $6)
    `;

    // Varsayılan conversionStatus eklendi ki sadece API'dan onaylananlar TRUE geçsin.
    const values = [sessionId, tenantId || 'tn_santis_v28_kiosk', stressLevel, planId, conversionStatus ?? false, calmUsed ?? false];

    try {
        await dbVault.query(query, values);
        console.log(`[SHADOW ANALYTICS] Session ${sessionId} başarıyla Postgres karanlığına mühürlendi. 📊`);
    } catch (err) {
        console.error("[SHADOW ANALYTICS] Yazma Hatası:", err);
    }
}

/**
 * Boardroom Dashboard için Isı Haritası Verisi Sağlayıcı
 */
export async function getStressHeatmap() {
    try {
        const { rows } = await dbVault.query(`SELECT * FROM sovereign_stress_heatmap;`);
        return rows;
    } catch (err) {
        console.error("[SHADOW ANALYTICS] View Okuma Hatası:", err);
        return [];
    }
}
