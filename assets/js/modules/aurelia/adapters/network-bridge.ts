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
        // We notify the scheduler via a custom event that the scheduler/bridge will handle
        const event = new CustomEvent('santis:experience:network', {
            detail: { status, timestamp: performance.now() }
        });
        document.dispatchEvent(event);
        
        // Optionally trigger a visual state if needed, 
        // but typically network status is an advisory metric for the Orb.
        if (status === 'disconnected') {
            console.warn('🛡️ [Network Bridge] Mode: Sovereign Local (Offline)');
        }
    };

    window.addEventListener('online', () => dispatchStatus('stable'));
    window.addEventListener('offline', () => dispatchStatus('disconnected'));

    // Initial check
    if (!navigator.onLine) dispatchStatus('disconnected');
}
