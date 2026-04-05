/**
 * Santis Commission Engine
 * Sorumluluk: "package.sold" algılandığında departmanlar/terapistler için 3 katmanlı komisyon simülasyonunu işletir.
 */
(function(SpaOS) {
    if (!SpaOS) return;

    let commissions = JSON.parse(localStorage.getItem('spaos_commissions')) || [];

    SpaOS.on('package.sold', (payload) => {
        console.log(`💸 [CommissionEngine] 3-Tier Prim hesaplanıyor... (${payload.transactionId})`);
        
        const pkg = payload.package;
        const price = pkg.price;
        const rules = pkg.commission || { sales: 0, delivery: 0, retention: 0 };
        
        const calc = {
            transactionId: payload.transactionId,
            packageId: pkg.id,
            salesCommission: parseFloat((price * rules.sales).toFixed(2)),
            deliveryReserve: parseFloat((price * rules.delivery).toFixed(2)),
            retentionReserve: parseFloat((price * rules.retention).toFixed(2)),
            currency: pkg.currency,
            createdAt: payload.soldAt
        };
        
        commissions.push(calc);
        localStorage.setItem('spaos_commissions', JSON.stringify(commissions));

        SpaOS.emit('commission.calculate', calc);
    });

    window.SantisCommissionEngine = {
        getCommissions: () => JSON.parse(localStorage.getItem('spaos_commissions')) || []
    };
})(window.SantisSpaOS);
