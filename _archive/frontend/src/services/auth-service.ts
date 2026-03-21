import { EventBus } from '../core/santis-bus';
import { Fabric } from '../engines/worker-fabric';

export class AuthService {
    /**
     * L5 Checkout Biyometrik Doğrulama (WebAuthn / Passkeys)
     * Bu işlem doğrudan DOM/Tarayıcı arayüzü gerektirdiği için Main Thread'de çalışır,
     * ancak ağır kriptografik paketleme ve ağ isteği Network Worker'a devredilir.
     */
    public async promptL5Checkout(): Promise<void> {
        if (!window.PublicKeyCredential) {
            console.error('🚨 [Auth] Bu cihaz Biyometrik Doğrulamayı (WebAuthn) desteklemiyor.');
            return;
        }

        try {
            console.log('🛡️ [Auth] L5 Biyometrik Sensörler Bekleniyor (FaceID / TouchID)...');
            
            // Gerçek bir senaryoda challenge sunucudan gelir.
            const challenge = new Uint8Array(32); crypto.getRandomValues(challenge);

            // Biyometrik tarama isteği (UI İpliğinde çalışmak ZORUNDADIR)
            const credential = await navigator.credentials.get({
                publicKey: {
                    challenge,
                    rpId: window.location.hostname, // 'localhost' for local tests
                    userVerification: 'required' // 'discouraged' | 'preferred' | 'required'
                }
            }) as PublicKeyCredential;

            if (!credential) {
                console.warn('⚠️ [Auth] Biyometrik tarama iptal edildi.');
                return;
            }

            console.log('✅ [Auth] Biyometrik Tarama Başarılı! Yük Worker\'a aktarılıyor...');

            // Dummy payload mapping for the demo
            const assertionPayload = {
                id: credential.id,
                rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
                type: credential.type,
                // In a real app we would parse authenticatorData, clientDataJSON, signature
            };

            // Ağ Katmanını yormamak için yükü Network Worker'a fırlat
            const result = await Fabric.Network.verifyBiometric(assertionPayload);

            if (result.status === 'success' && result.token) {
                // Token'ı merkezi EventBus otobanına fırlat
                EventBus.emit('AUTH_SUCCESS', { token: result.token });
            }

        } catch (err) {
            console.error('🚨 [Auth] L5 Biyometrik Onay Hatası:', err);
        }
    }
}

export const AuthEngine = new AuthService();
