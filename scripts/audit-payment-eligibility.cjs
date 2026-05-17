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

const jsFile = read("assets/js/modules/santis-payment-eligibility.js");
const bootloader = read("assets/js/boot/santis-bootloader.js");

[
  "guest:booking_confirmation_hold_created",
  "guest:payment_eligibility_checked",
  "price_required",
  "confirmationMode",
  "host-review",
  "eligible"
].forEach(needle => assertIncludes(jsFile, needle, "Payment eligibility contract"));

[
  "email",
  "phone",
  "name",
  "payment method",
  "stripe"
].forEach(needle => assertNotIncludes(jsFile, needle, "PII/Payment implementation leaks"));

assertIncludes(bootloader, "santis-payment-eligibility.js", "Bootloader registry");

console.log("✅ Payment Eligibility audit passed");
