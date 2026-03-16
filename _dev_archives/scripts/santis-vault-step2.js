// The Stripe Public Key (Sandbox/Test for now)
const stripePublicKey = "pk_test_TYooMQauvdEDq54NiTphI7jx"; // Replace with real Santis key later
let stripe, elements, cardElement, expressCheckout;

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
    // Only init if we are on a page with the Vault
    const vaultModal = document.getElementById('santis-checkout-vault');
    if (vaultModal) {
        initStripeEngineV2();
    }
});

/**
 * 🌍 STRIPE KOGNİTİF MOTORU Otonom Başlatma (V2 Express Checkout)
 */
async function initStripeEngineV2() {
    try {
        if (!window.Stripe) {
            console.error("[SANTIS STRIPE ERROR] Stripe.js is not loaded.");
            return;
        }
        stripe = window.Stripe(stripePublicKey);

        if (!stripe) {
            console.error("[SANTIS STRIPE ERROR] Failed to initialize Stripe.");
            return;
        }

        const priceAmount = window.SantisVault ? window.SantisVault.sanctumState.price * 100 : 15000;

        elements = stripe.elements({
            mode: 'payment',
            amount: priceAmount > 0 ? priceAmount : 15000,
            currency: 'eur'
        });

        // 1. Render Credit Card Input 
        renderCardElement();

        // 2. Setup V2 Express Checkout (Apple Pay / Google Pay / Link)
        renderExpressCheckout();

        // 3. Bind the main Submit Seal Button (Fallback for purely card)
        bindSealButton();

    } catch (error) {
        console.error("[SANTIS STRIPE ERROR] Engine initialization failed:", error);
    }
}

function renderCardElement() {
    // Sovereign Gold & Black Aesthetic
    const style = {
        base: {
            color: "#fff",
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSmoothing: "antialiased",
            fontSize: "16px",
            "::placeholder": { color: "#555" }
        },
        invalid: {
            color: "#f44336",
            iconColor: "#f44336"
        }
    };

    cardElement = elements.create("card", { style });

    const mountPoint = document.getElementById("stripe-card-element");
    if (mountPoint) {
        cardElement.mount(mountPoint);

        // Error handling during typing
        cardElement.on("change", (event) => {
            const submitButton = document.getElementById("btn-seal-fate");
            const errorDiv = document.getElementById("card-errors");

            if (submitButton && errorDiv) {
                if (event.error) {
                    errorDiv.textContent = event.error.message;
                    submitButton.disabled = true;
                    submitButton.classList.add('opacity-50', 'cursor-not-allowed');
                } else {
                    errorDiv.textContent = "";
                    submitButton.disabled = false;
                    submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            }
        });
    }
}

function renderExpressCheckout() {
    // Toplam fiyatı RAM'den (sanctumState) alırız normalde, test için 150 EUR = 15000 cents
    const priceAmount = window.SantisVault ? window.SantisVault.sanctumState.price * 100 : 15000;

    const expressCheckoutOptions = {
        buttonType: {
            applePay: 'book',
            googlePay: 'book'
        },
        buttonTheme: {
            applePay: 'white-outline', // Elegant dark mode contrast
            googlePay: 'black'
        }
    };

    expressCheckout = elements.create('expressCheckout', expressCheckoutOptions);

    const expressContainer = document.getElementById('express-checkout-element');

    if (expressContainer) {
        expressCheckout.mount(expressContainer);
        console.log("[SANTIS STRIPE V2] Express Checkout element mounted");

        // React to clicks on the Apple/Google pay buttons
        // In Express Checkout, we listen for confirm events or click events
        expressCheckout.on('click', (event) => {
            // Options structure config payload required by Express Checkout for total cost
            const resolveOptions = {
                emailRequired: true,
                phoneNumberRequired: false,
                lineItems: [{
                    name: 'Santis Sovereign Ritual',
                    amount: priceAmount > 0 ? priceAmount : 15000
                }]
            };
            event.resolve(resolveOptions);
        });

        // Express checkout handles token creation internally
        expressCheckout.on('confirm', async (event) => {
            console.log("[SANTIS STRIPE V2] Confirming Express Checkout Payment", event);
            try {
                // Usually we'd create a PaymentIntent on the backend here and return clientSecret
                // const {clientSecret} = await fetch('/api/create-intent').then(res => res.json());
                // const {error} = await stripe.confirmPayment({ elements, clientSecret });
                // For demo/sim validation:
                event.paymentMethod = "simulated_express_pm";

                // Mührü vurdu, animasyon başlar
                if (window.SantisVault) {
                    window.SantisVault.processPayment();
                }
            } catch (error) {
                console.error("Payment failed", error);
            }
        });
    }
}

function bindSealButton() {
    const submitButton = document.getElementById('btn-seal-fate');
    const form = document.querySelector('#step2-payment'); // Wrapping div

    if (!submitButton || !form) return;

    submitButton.addEventListener('click', async (e) => {
        e.preventDefault();

        submitButton.disabled = true;

        // Mühür Dönüyor animasyonu
        const spinner = document.getElementById('seal-spinner');
        if (spinner) spinner.classList.remove('opacity-0');

        // Stripe Card ödeme isteği oluştur (Client Side Demo)
        const { paymentMethod, error } = await stripe.createPaymentMethod({
            type: "card",
            card: cardElement,
            billing_details: {
                name: document.getElementById('guest-name')?.value || 'Santis Guest',
                email: document.getElementById('guest-email')?.value || 'guest@santis.com'
            }
        });

        if (error) {
            document.getElementById("card-errors").textContent = error.message;
            submitButton.disabled = false;
            if (spinner) spinner.classList.add('opacity-0');
        } else {
            // Başarılı (Simülasyon - Normalde Backend'e gider)
            console.log("[SANTIS STRIPE V2] Card PaymentMethod Created:", paymentMethod.id);

            // Step 3'e kay
            if (window.SantisVault) {
                window.SantisVault.processPayment();
            } else {
                if (spinner) spinner.classList.add('opacity-0');
            }
        }
    });
}
