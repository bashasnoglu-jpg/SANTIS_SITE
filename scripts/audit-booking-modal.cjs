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
const css = read("assets/css/santis-v6/santis.booking.css");
const modalJs = read("assets/js/modules/santis-booking-modal.js");
const bootloader = read("assets/js/boot/santis-bootloader.js");

[
  "data-booking-modal",
  "data-booking-form",
  "data-booking-cancel",
  "data-booking-submit"
].forEach(needle => assertIncludes(index, needle, "HTML booking modal contract"));

assertIncludes(modalJs, "guest:booking_handoff_requested", "handoff event listening");
assertIncludes(modalJs, "guest:booking_intent_submitted", "intent submit event emission");
assertIncludes(bootloader, "santis-booking-modal.js", "bootloader booking module");
assertIncludes(css, "prefers-reduced-motion", "reduced motion guard");

console.log("✅ Booking Modal audit passed");
