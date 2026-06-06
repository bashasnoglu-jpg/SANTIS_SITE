export const AdvisorClient = {
    async evaluateIntent(actionDetails) {
        try {
            const isDebugMode = localStorage.getItem('ADVISOR_DEBUG_MODE') === 'true';
            if (!isDebugMode) {
                return;
            }

            const payload = {
                tenantId: window.SANTIS_TENANT || 'aman-tokyo', // Fallback for testing
                guestId: window.SANTIS_GUEST_ID || 'anonymous_guest',
                currentAction: actionDetails || 'page_exit_intent'
            };

            const response = await fetch('/api/v1/advisor/intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                console.warn('[Advisor Kernel Debug] Failed to fetch advisory', response.status);
                return;
            }

            const data = await response.json();
            
            console.log('[Advisor Kernel Debug] Received Advisory Context:', data);

            window.dispatchEvent(new CustomEvent("santis:advisor-debug", { 
                detail: data 
            }));

        } catch (error) {
            console.error('[Advisor Kernel Debug] Network error:', error);
        }
    }
};

// Auto-attach to existing exit-intent flow if present
window.addEventListener('santis:intent', (e) => {
    AdvisorClient.evaluateIntent(e.detail || 'santis_intent_event');
});
