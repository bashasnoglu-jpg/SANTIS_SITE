const fs = require("fs");

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function assertIncludes(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`Missing ${label}: ${needle}`);
  }
}

const index = read("tr/index.html");
const css = read("assets/css/santis-v6/santis.checkout.css");
const orchestrator = read("assets/js/modules/santis-journey-orchestrator.js");
const ceremony = read("assets/js/modules/santis-checkout-ceremony.js");
const bootloader = read("assets/js/boot/santis-bootloader.js");

[
  "data-checkout-request",
  "data-checkout-ceremony",
  "data-checkout-title",
  "data-checkout-meta",
  "data-checkout-confirm"
].forEach(needle => assertIncludes(index, needle, "HTML checkout contract"));

assertIncludes(orchestrator, "guest:checkout_requested", "journey checkout event emission");
assertIncludes(ceremony, "guest:checkout_requested", "ceremony event binding");
assertIncludes(ceremony, "guest:booking_handoff_requested", "ceremony handoff event emission");
assertIncludes(ceremony, "santis-checkout-eligibility.js", "eligibility module dependency");
assertIncludes(bootloader, "santis-checkout-ceremony.js", "bootloader checkout module");
assertIncludes(css, "prefers-reduced-motion", "reduced motion guard");

console.log("✅ Checkout Ceremony audit passed");
