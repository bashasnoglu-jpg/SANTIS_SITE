/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🧠 AURELIA — NETWORK BRIDGE (PHASE J1)                      ║
 * ║  Connectivity Telemetry · Vault Registration                ║
 * ╚══════════════════════════════════════════════════════════════╝
 * 
 * 🛡️ GOVERNANCE: Disconnected but Stable.
 * 🛡️ TELEMETRY: Inbound connectivity signals.
 */

export function initNetworkBridge(orb: any): void {
    if (!orb || typeof orb.setState !== 'function') return;

    // 1. Service Worker Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then((registration) => {
                    console.log('🛡️ [Sovereign Vault] Active. Scope:', registration.scope);
                })
                .catch((err) => {
                    console.error('🛡️ [Sovereign Vault] Registration failed:', err);
                });
        });
    }

    // 2. Connectivity Telemetry
    const dispatchStatus = (status: 'stable' | 'disconnected') => {
        // Trigger Visual Circuit Breaker (Phase J2)
        if (orb && typeof orb.setNetworkStatus === 'function') {
            orb.setNetworkStatus(status);
        }

        const event = new CustomEvent('santis:experience:network', {
            detail: { status, timestamp: performance.now() }
        });
        document.dispatchEvent(event);
        
        if (status === 'disconnected') {
            console.warn('🛡️ [Network Bridge] Mode: Sovereign Local (Offline)');
        }
    };

    window.addEventListener('online', () => dispatchStatus('stable'));
    window.addEventListener('offline', () => dispatchStatus('disconnected'));

    // Initial check
    if (!navigator.onLine) dispatchStatus('disconnected');
}
