const fs = require("fs");

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function assertIncludes(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`Missing ${label}: ${needle}`);
  }
}

function assertNotIncludes(source, needle, label) {
  if (source.includes(needle)) {
    throw new Error(`Forbidden ${label} found: ${needle}`);
  }
}

const endpointPy = read("app/api/v1/endpoints/billing.py");

[
  "/checkout-session",
  "CheckoutSessionRequest",
  "CheckoutSessionResponse",
  "price_required",
  "stripe_not_configured",
  "sessionUrl"
].forEach(needle => assertIncludes(endpointPy, needle, "Billing Backend contract"));

[
  "sk_",
  "stripe.checkout",
  "card",
  "email",
  "phone"
].forEach(needle => assertNotIncludes(endpointPy, needle, "PII/Secret leak"));

console.log("✅ Billing Checkout Session audit passed");
