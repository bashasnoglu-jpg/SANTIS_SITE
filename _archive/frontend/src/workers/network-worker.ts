import * as Comlink from 'comlink';
import createClient from 'openapi-fetch';
import type { paths } from '../services/api/schema'; // Automatically generated types

const { POST } = createClient<paths>({ baseUrl: "http://localhost:8000" });

export interface NetworkWorkerContract {
    /**
     * SENDS the WebAuthn attestation/assertion to the backend securely
     */
    verifyBiometric(assertionPayload: any): Promise<{ status: string; token?: string }>;
}

const networkLogic: NetworkWorkerContract = {
    async verifyBiometric(assertionPayload: any) {
        console.log('🌐 [Network Worker] L5 Biyometrik yükü (payload) sunucuya iletiliyor...');
        
        // This is a zero-dependency type-safe fetch call!
        const { data, error } = await POST("/auth/webauthn/verify", {
            body: assertionPayload
        });

        if (error) {
            console.error('🌐 [Network Worker] Biyometrik Doğrulama Başarısız!', error);
            return { status: 'error' };
        }

        console.log('🌐 [Network Worker] 🔥 Biyometrik Onay Başarılı! Token üretildi.');
        return { status: 'success', token: data?.token };
    }
};

Comlink.expose(networkLogic);
export type { NetworkWorkerContract as NetworkServicesContract };
