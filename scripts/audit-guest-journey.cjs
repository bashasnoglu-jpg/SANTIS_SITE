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
const journey = read("assets/js/modules/santis-journey-orchestrator.js");
const recommender = read("assets/js/modules/santis-ritual-recommender.js");
const css = read("assets/css/santis-v6/santis.journey.css");
const bootloader = read("assets/js/boot/santis-bootloader.js");

[
  'data-intent="recover"',
  'data-intent="calm"',
  'data-intent="glow"',
  'data-intent="deep-reset"',
  'data-intent="couple-ritual"',
  "data-ritual-recommendation",
  "data-itinerary-preview"
].forEach((needle) => assertIncludes(index, needle, "journey HTML contract"));

[
  "guest:intent_selected",
  "guest:atmosphere_aligned",
  "guest:ritual_recommended",
  "guest:itinerary_ready"
].forEach((needle) => assertIncludes(journey, needle, "journey event contract"));

[
  "recover",
  "calm",
  "glow",
  "deep-reset",
  "couple-ritual"
].forEach((needle) => assertIncludes(recommender, needle, "ritual recommendation mapping"));

assertIncludes(css, "prefers-reduced-motion", "reduced motion guard");
assertIncludes(bootloader, "santis-journey-orchestrator.js", "bootloader journey module");

console.log("✅ Guest Journey audit passed");
