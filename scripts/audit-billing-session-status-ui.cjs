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
const jsFile = read("assets/js/modules/santis-billing-session-status-ui.js");
const bootloader = read("assets/js/boot/santis-bootloader.js");

[
  "data-billing-session-status",
  "data-billing-session-title",
  "data-billing-session-message"
].forEach(needle => assertIncludes(htmlFile, needle, "HTML Contract"));

[
  "guest:stripe_session_blocked",
  "guest:billing_session_ready"
].forEach(needle => assertIncludes(jsFile, needle, "JS Logic"));

[
  "redirect",
  "window.location",
  "stripe.checkout"
].forEach(needle => assertNotIncludes(jsFile, needle, "Real SDK/Secret leak"));

assertIncludes(bootloader, "santis-billing-session-status-ui.js", "Bootloader registry");

console.log("✅ Billing Session Status UI audit passed");
