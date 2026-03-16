async function routes(fastify, options) {
    fastify.get('/plans', async (request, reply) => {
        return {
            plans: [
                {
                    id: "starter",
                    name: "Starter",
                    price_eur: 49,
                    limits: { bookings: 500, ai_messages: 1000, branches: 1 }
                },
                {
                    id: "pro",
                    name: "Professional",
                    price_eur: 149,
                    limits: { bookings: 9999, ai_messages: 50000, branches: 3 }
                },
                {
                    id: "enterprise",
                    name: "Sovereign Elite",
                    price_eur: 499,
                    limits: { bookings: 99999, ai_messages: 999999, branches: 10 }
                }
            ]
        };
    });

    fastify.post('/checkout', async (request, reply) => {
        const payload = request.body || {};
        
        // Mock Stripe Checkout URL Generation
        fastify.log.info(`[STRIPE CHECKOUT] Tenant ${payload.tenant_id} initiated upgrade to ${payload.plan}`);

        return {
            checkout_url: `https://checkout.stripe.sovereign-os.com/session?id=chk_${Date.now()}&plan=${payload.plan}`
        };
    });
}

module.exports = routes;
