/**
 * Santis CRM Engine
 * Sorumluluk: "package.sold" algılandığında paket içindeki davranışsal CRM tetikleyicilerini loğa alır.
 */
(function(SpaOS) {
    if (!SpaOS) return;

    let crmLogs = JSON.parse(localStorage.getItem('spaos_crm_logs')) || [];

    SpaOS.on('package.sold', (payload) => {
        console.log(`🧠 [CRMEngine] Davranışsal tetikleyiciler devrede... (${payload.transactionId})`);
        
        const pkg = payload.package;
        const customer = payload.customer || { id: 'GUEST', name: 'Ziyaretçi' };
        
        const crmData = pkg.crm || { triggers: [] };
        
        const logEntry = {
            transactionId: payload.transactionId,
            customerId: customer.id,
            action: 'registered_triggers',
            scheduledTriggers: crmData.triggers,
            upsells: pkg.upsellTargets || [], // check both
            recordedAt: payload.soldAt
        };
        
        crmLogs.push(logEntry);
        localStorage.setItem('spaos_crm_logs', JSON.stringify(crmLogs));

        SpaOS.emit('crm.trigger.evaluate', logEntry);
    });

    window.SantisCRMEngine = {
        getLogs: () => JSON.parse(localStorage.getItem('spaos_crm_logs')) || []
    };
})(window.SantisSpaOS);
