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

const jsFile = read("assets/js/modules/santis-payment-readiness-ledger.js");
const bootloader = read("assets/js/boot/santis-bootloader.js");

[
  "santis:payment-readiness-ledger:v1",
  "guest:payment_eligibility_checked",
  "payment_eligibility_checked",
  "price_required"
].forEach(needle => assertIncludes(jsFile, needle, "Readiness Ledger contract"));

[
  "email",
  "phone",
  "name",
  "card",
  "stripeSession",
  "stripe"
].forEach(needle => assertNotIncludes(jsFile, needle, "PII/Payment info leak check"));

assertIncludes(bootloader, "santis-payment-readiness-ledger.js", "Bootloader registry");

console.log("✅ Payment Readiness Ledger audit passed");
