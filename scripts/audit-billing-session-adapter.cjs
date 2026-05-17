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

const jsFile = read("assets/js/modules/santis-billing-session-adapter.js");
const bootloader = read("assets/js/boot/santis-bootloader.js");

[
  "/api/v1/billing/checkout-session",
  "guest:stripe_session_requested",
  "guest:billing_session_ready",
  "guest:stripe_session_blocked",
  "billing_api_unreachable"
].forEach(needle => assertIncludes(jsFile, needle, "Billing Session Adapter contract"));

[
  "window.location",
  "redirect",
  "sk_",
  "card"
].forEach(needle => assertNotIncludes(jsFile, needle, "PII/Redirect/Secret leak"));

assertIncludes(bootloader, "santis-billing-session-adapter.js", "Bootloader registry");

console.log("✅ Billing Session Adapter audit passed");
