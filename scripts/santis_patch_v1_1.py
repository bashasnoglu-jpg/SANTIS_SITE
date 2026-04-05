import os

ROOT_DIR = r"C:\Users\tourg\Desktop\SANTIS_SITE\santis-os-monorepo\apps\guest-web\src"

files = {}

files["core/SovereignIdentity.ts"] = """export class SovereignIdentity {
    static getVisitorId() {
        let visitorId = localStorage.getItem('santis_visitor_id');
        if (!visitorId) {
            // Browser uyumlu kriptografik kimlik oluşturucu
            visitorId = 'V-' + crypto.randomUUID();
            localStorage.setItem('santis_visitor_id', visitorId);
        }
        return visitorId;
    }

    static getSessionId() {
        let sessionId = sessionStorage.getItem('santis_session_id');
        if (!sessionId) {
            sessionId = 'S-' + crypto.randomUUID();
            sessionStorage.setItem('santis_session_id', sessionId);
        }
        return sessionId;
    }

    static getPayload() {
        return {
            visitorId: this.getVisitorId(),
            sessionId: this.getSessionId()
        };
    }
}
"""

files["network/SantisSocket.ts"] = """import { EventEmitter } from 'events';
import { SovereignIdentity } from '../core/SovereignIdentity';

export class SantisSocket extends EventEmitter {
    constructor() {
        super();
        this.initConnection();
    }
    
    initConnection() {
        // Send INIT payload containing robust Identity Injection
        const initPayload = {
            type: 'INIT',
            ...SovereignIdentity.getPayload(),
            timestamp: Date.now()
        };
        console.log("[WebSocket] INIT prepared with Identity: ", initPayload);
        // İleriki aşamada burada ws.send(JSON.stringify(initPayload)) çağrılacak.
    }
    
    send(event: string, payload?: any) {
        console.log(`[WebSocket TX] ${event}`, payload || '');
    }
}
"""

for path, content in files.items():
    full_path = os.path.join(ROOT_DIR, path)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Patched: {full_path}")

print("Santis OS v1.1 Identity Patch Applied Successfully. Ghosts eradicated.")
