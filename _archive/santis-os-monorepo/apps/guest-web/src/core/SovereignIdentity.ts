export class SovereignIdentity {
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
