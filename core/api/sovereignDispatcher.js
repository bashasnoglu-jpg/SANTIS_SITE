import { sovereignStore } from '../state/sovereignStore.js';
import { SovereignQueue } from '../state/sovereignQueue.js';

export const SovereignDispatcher = (() => {
    // Zero-Trust Ingress Kapımız (Express/Hono üzerinden geçen kapı)
    const ENDPOINT = '/api/v1/commands'; // Kullanıcının uyarılarına kulak verip canonical route yaptık

    const fire = async (command) => {
        // 1. STATE: İşlem Başladı (UI butonları disable olacak)
        sovereignStore.update('commandLifecycle', { 
            status: 'submitting', 
            lastTraceId: command.traceId, 
            error: null 
        });

        // 2. OFFLINE KONTROLÜ
        if (!navigator.onLine) {
            await SovereignQueue.enqueue(command);
            sovereignStore.update('commandLifecycle', { 
                status: 'queued_offline', 
                lastTraceId: command.traceId, 
                error: null 
            });
            return { status: 'queued' };
        }

        // 3. GERÇEK AĞ İSTEĞİ (Matrix'e Giriş)
        try {
            const response = await fetch(ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer mock_jwt_token_omega_001`
                },
                body: JSON.stringify(command)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || `HTTP ${response.status} Hatası`);
            }

            const responseData = await response.json();

            // 4. STATE: Başarılı (Ack)
            sovereignStore.update('commandLifecycle', { 
                status: 'ack_success', 
                lastTraceId: command.traceId, 
                error: null 
            });
            
            return responseData;

        } catch (error) {
            // 5. STATE: Başarısız (Nack / Error)
            sovereignStore.update('commandLifecycle', { 
                status: 'nack_error', 
                lastTraceId: command.traceId, 
                error: error.message 
            });
            throw error;
        }
    };

    return { fire };
})();
