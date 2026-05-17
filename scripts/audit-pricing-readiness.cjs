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

const jsFile = read("assets/js/modules/santis-pricing-readiness.js");
const bootloader = read("assets/js/boot/santis-bootloader.js");

[
  "guest:pricing_required",
  "guest:pricing_resolved",
  "price_required",
  "currency",
  "EUR"
].forEach(needle => assertIncludes(jsFile, needle, "Pricing Readiness contract"));

[
  "stripe",
  "checkout",
  "card"
].forEach(needle => assertNotIncludes(jsFile, needle, "Real SDK/Secret leak"));

assertIncludes(bootloader, "santis-pricing-readiness.js", "Bootloader registry");

console.log("✅ Pricing Readiness Engine audit passed");
