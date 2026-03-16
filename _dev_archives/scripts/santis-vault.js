/**
 * 🌍 SANTIS COGNITIVE VAULT ENGINE - STRIPE ELEMENTS INTEGRATION
 * Ram-based state, rAF rendering, 0-paint sliding, real payments.
 */

// Global shim so pages can safely use SantisVault for storage and UI handoffs
window.SantisVault = window.SantisVault || (() => {
  const safeStringify = (val) => typeof val === 'string' ? val : JSON.stringify(val);
  const safeParse = (val) => {
    try { return JSON.parse(val); }
    catch { return val; }
  };

  return {
    sanctumState: { price: 150, currency: 'eur' },
    async getItem(key) {
      if (!key) return null;
      return safeParse(localStorage.getItem(key));
    },
    async setItem(key, value) {
      if (!key) return false;
      localStorage.setItem(key, safeStringify(value));
      return true;
    },
    async removeItem(key) {
      if (!key) return false;
      localStorage.removeItem(key);
      return true;
    },
    processPayment() {
      console.info('[Vault] processPayment stub invoked (demo mode).');
      const msg = document.getElementById('payment-message');
      if (msg) {
        msg.classList.remove('hidden');
        msg.textContent = 'Payment sealed (demo mode).';
        setTimeout(() => {
          msg.classList.add('hidden');
          msg.textContent = '';
        }, 4000);
      }
    }
  };
})();

(() => {
  // Only bootstrap on pages that actually have a payment form
  const paymentForm = document.querySelector("#payment-form");
  if (!paymentForm) return;

  const submitButton = document.getElementById("submit-payment");
  const buttonText = document.getElementById("button-text");
  const messageContainer = document.getElementById("payment-message");

  const STRIPE_KEY =
    "pk_test_51T6TcrKbhpyg503tj0P5oUBR6nWeNfT0LzE5K0TOrzP93s83w0lOrx8q1b9QpXIf9N6U8E0d9qNzWx0M7X3D31U500Xg2hWc4L";

  let stripe;
  let elements;

  const loadStripe = () =>
    new Promise((resolve, reject) => {
      if (typeof window.Stripe === "function") {
        return resolve(window.Stripe);
      }
      const script = document.createElement("script");
      script.src = "https://js.stripe.com/v3";
      script.onload = () =>
        typeof window.Stripe === "function"
          ? resolve(window.Stripe)
          : reject(new Error("Stripe.js yüklenemedi."));
      script.onerror = () => reject(new Error("Stripe.js yüklenemedi."));
      document.head.appendChild(script);
    });

  async function initializeVault() {
    if (!stripe) throw new Error("Stripe hazır değil.");
    setLoading(true);

    try {
      const amount = 250;
      const response = await fetch(
        "http://localhost:8000/api/v1/payments/create-checkout-session",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            currency: "eur",
            user_id: "00000000-0000-0000-0000-000000000000",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Sunucu ile bağlantı kurulamadı.");
      }

      const data = await response.json();
      const clientSecret = data.client_secret;

      elements = stripe.elements({
        clientSecret,
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#d4af37",
            colorBackground: "#1a1a1a",
            colorText: "#f1f1f1",
            colorDanger: "#ff8c8c",
            fontFamily: "Inter, system-ui, sans-serif",
          },
        },
      });

      const paymentElement = elements.create("payment");
      paymentElement.mount("#payment-element");
      setLoading(false);
    } catch (error) {
      showMessage(error.message);
      setLoading(false);
    }
  }

  function bindPaymentForm() {
    paymentForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      setLoading(true);

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout-success.html`,
        },
      });

      if (error) {
        if (error.type === "card_error" || error.type === "validation_error") {
          showMessage(error.message);
        } else {
          showMessage("Beklenmeyen bir hata oluştu.");
        }
      } else {
        showMessage("Beklenmeyen bir hata oluştu.");
      }

      setLoading(false);
    });
  }

  function showMessage(messageText) {
    if (!messageContainer) return;
    messageContainer.classList.remove("hidden");
    messageContainer.textContent = messageText;

    setTimeout(() => {
      messageContainer.classList.add("hidden");
      messageContainer.textContent = "";
    }, 5000);
  }

  function setLoading(isLoading) {
    if (!submitButton) return;
    if (isLoading) {
      submitButton.disabled = true;
      if (buttonText) buttonText.classList.add("hidden");
      if (!submitButton.querySelector(".custom-spinner")) {
        const spinner = document.createElement("div");
        spinner.className = "custom-spinner";
        submitButton.appendChild(spinner);
      }
    } else {
      submitButton.disabled = false;
      if (buttonText) buttonText.classList.remove("hidden");
      const spinner = submitButton.querySelector(".custom-spinner");
      if (spinner) spinner.remove();
    }
  }

  loadStripe()
    .then((StripeLib) => {
      stripe = StripeLib(STRIPE_KEY);
      return initializeVault();
    })
    .then(bindPaymentForm)
    .catch((err) => {
      console.warn("[Vault] Stripe init atlandı:", err.message);
      setLoading(false);
    });
})();
