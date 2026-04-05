/**
 * Santis Revenue Engine
 * Sorumluluk: "package.sold" durumunda Ertelenmiş Gelir (Deferred Revenue) defterini günceller.
 */
(function(SpaOS) {
    if (!SpaOS) return;

    let ledger = JSON.parse(localStorage.getItem('spaos_ledger')) || [];

    SpaOS.on('package.sold', (payload) => {
        console.log(`🏦 [RevenueEngine] Satış işleniyor... (${payload.transactionId})`);
        
        const pkg = payload.package;
        const totalFaceValue = pkg.components ? pkg.components.reduce((sum, c) => sum + (c.faceValue * c.quantity), 0) : pkg.price;
        const pricePaid = pkg.price;
        
        const record = {
            transactionId: payload.transactionId,
            packageId: pkg.id,
            recognizedRevenue: 0, // Hizmet ifa edildikçe artacak (Phase 2)
            deferredRevenue: pricePaid, // Tamamı yükümlülük
            totalFaceValue: totalFaceValue,
            discountRate: ((1 - (pricePaid / totalFaceValue)) * 100).toFixed(1),
            status: 'unfulfilled',
            createdAt: payload.soldAt
        };
        
        ledger.push(record);
        localStorage.setItem('spaos_ledger', JSON.stringify(ledger));

        // Dashboard ve diğer dinleyiciler için kanıt
        SpaOS.emit('revenue.deferred.created', {
            transactionId: payload.transactionId,
            deferredAmount: pricePaid,
            totalLiabilities: ledger.reduce((sum, r) => sum + r.deferredRevenue, 0)
        });
    });

    window.SantisRevenueEngine = {
        getLedger: () => JSON.parse(localStorage.getItem('spaos_ledger')) || []
    };
})(window.SantisSpaOS);
