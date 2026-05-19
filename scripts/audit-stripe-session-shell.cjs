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

const jsFile = read("assets/js/modules/santis-stripe-session-shell.js");
const bootloader = read("assets/js/boot/santis-bootloader.js");

[
  "guest:payment_eligibility_checked",
  "guest:stripe_session_blocked",
  "guest:stripe_session_requested",
  "payment_not_eligible",
  "stripe-session-shell"
].forEach(needle => assertIncludes(jsFile, needle, "Stripe Session Shell logic"));

[
  "secret",
  "sk_",
  "card",
  "checkout.redirect"
].forEach(needle => assertNotIncludes(jsFile, needle, "Real SDK/Secret leak"));

assertIncludes(bootloader, "santis-stripe-session-shell.js", "Bootloader registry");

console.log("✅ Stripe Session Shell audit passed");
