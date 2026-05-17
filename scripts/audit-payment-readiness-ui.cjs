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

const htmlFile = read("tr/index.html");
const jsFile = read("assets/js/modules/santis-payment-readiness-ui.js");
const bootloader = read("assets/js/boot/santis-bootloader.js");

[
  "data-payment-readiness",
  "data-payment-readiness-title",
  "data-payment-readiness-message"
].forEach(needle => assertIncludes(htmlFile, needle, "HTML Contract"));

[
  "guest:payment_eligibility_checked",
  "Ödeme adımı şu anda kapalı"
].forEach(needle => assertIncludes(jsFile, needle, "JS Logic"));

[
  "stripe",
  "payment method"
].forEach(needle => assertNotIncludes(jsFile, needle, "PII/Payment info"));

assertIncludes(bootloader, "santis-payment-readiness-ui.js", "Bootloader registry");

console.log("✅ Payment Readiness UI audit passed");
