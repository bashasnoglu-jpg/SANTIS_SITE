const fs = require("fs");

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function assertIncludes(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`Missing ${label}: ${needle}`);
  }
}

const vault = read("assets/js/modules/santis-sovereign-vault.js");
const orchestrator = read("assets/js/modules/santis-journey-orchestrator.js");
const bootloader = read("assets/js/boot/santis-bootloader.js");

[
  "STORAGE_KEY",
  "saveJourney",
  "loadJourney",
  "clearJourney",
  "localStorage",
  "__SANTIS_VAULT_CACHE__",
  "Do not store payment data"
].forEach((needle) => assertIncludes(vault, needle, "vault contract"));

[
  "data-vault-clear",
  "clearJourney",
  "guest:journey_reset"
].forEach((needle) => assertIncludes(orchestrator, needle, "clear memory UX"));

assertIncludes(bootloader, "santis-sovereign-vault.js", "bootloader vault module");
assertIncludes(orchestrator, "SantisSovereignVault.saveJourney", "orchestrator save usage");
assertIncludes(orchestrator, "SantisSovereignVault.loadJourney", "orchestrator load usage");

console.log("✅ Sovereign Vault audit passed");
