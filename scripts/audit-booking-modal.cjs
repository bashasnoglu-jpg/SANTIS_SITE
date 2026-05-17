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
const availabilityJs = read("assets/js/modules/santis-booking-availability.js");
const holdJs = read("assets/js/modules/santis-booking-confirmation-hold.js");

[
  "data-booking-modal",
  "data-booking-form",
  "data-booking-cancel",
  "data-booking-submit",
  "data-booking-availability",
  "data-booking-hold"
].forEach(needle => assertIncludes(index, needle, "HTML booking modal contract"));

assertIncludes(modalJs, "guest:booking_handoff_requested", "handoff event listening");
assertIncludes(modalJs, "guest:booking_intent_submitted", "intent submit event emission");
assertIncludes(availabilityJs, "guest:booking_availability_checked", "availability event emission");
assertIncludes(availabilityJs, "checkMockAvailability", "mock availability check");
assertIncludes(holdJs, "guest:booking_confirmation_hold_created", "hold event emission");
assertIncludes(bootloader, "santis-booking-modal.js", "bootloader booking module");
assertIncludes(bootloader, "santis-booking-availability.js", "bootloader availability module");
assertIncludes(bootloader, "santis-booking-confirmation-hold.js", "bootloader hold module");
assertIncludes(css, "prefers-reduced-motion", "reduced motion guard");

console.log("✅ Booking Modal audit passed");
