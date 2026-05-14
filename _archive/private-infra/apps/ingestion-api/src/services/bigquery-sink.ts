/**
 * SANTIS BIGQUERY SINK
 * Operatör kararlarını uzun vadeli analiz için BigQuery'ye akıtır.
 */
import { BigQuery } from '@google-cloud/bigquery';

const bigquery = new BigQuery({
    // credentials: JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON)
});

const datasetId = 'santis_analytics';
const tableId = 'operator_decisions';

export interface DecisionLog {
    planId: string;
    decision: 'APPROVED' | 'REJECTED';
    timestamp?: number;
}

/**
 * Kararı BigQuery'ye kaydeder.
 * @param {DecisionLog} data - { planId, decision, timestamp }
 */
export async function sinkToBigQuery(data: DecisionLog) {
    try {
        const payload = {
            plan_id: data.planId,
            decision_type: data.decision,
            created_at: data.timestamp ? bigquery.timestamp(new Date(data.timestamp)) : bigquery.timestamp(new Date())
        };

        await bigquery
            .dataset(datasetId)
            .table(tableId)
            .insert([payload]);
        
        console.log(`[BIGQUERY] Decision for ${data.planId} successfully synced.`);
    } catch (error) {
        // Hata durumunda yerel loglara fallback yapar
        console.error('[CRITICAL] BigQuery Sink Error:', error);
        // fs.appendFileSync('failed_decisions.log', JSON.stringify(data) + '\n');
    }
}
