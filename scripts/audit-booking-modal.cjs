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
const ledgerJs = read("assets/js/modules/santis-booking-ledger.js");
const apiAdapterJs = read("assets/js/modules/santis-booking-api-adapter.js");

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
assertIncludes(availabilityJs, "SantisBookingAPI.checkAvailability", "API adapter usage");
assertIncludes(apiAdapterJs, "/api/v1/booking/availability", "API endpoint contract");
assertIncludes(apiAdapterJs, "falling back to mock availability", "fallback warning log");
assertIncludes(holdJs, "guest:booking_confirmation_hold_created", "hold event emission");
assertIncludes(ledgerJs, "santis:booking-ledger:v1", "ledger storage key");
assertIncludes(ledgerJs, "guest:booking_confirmation_hold_created", "ledger hold tracking");
assertIncludes(ledgerJs, "BookingLedger", "ledger class name");
assertIncludes(bootloader, "santis-booking-modal.js", "bootloader booking module");
assertIncludes(bootloader, "santis-booking-availability.js", "bootloader availability module");
assertIncludes(bootloader, "santis-booking-confirmation-hold.js", "bootloader hold module");
assertIncludes(bootloader, "santis-booking-ledger.js", "bootloader ledger module");
assertIncludes(css, "prefers-reduced-motion", "reduced motion guard");

console.log("✅ Booking Modal audit passed");
