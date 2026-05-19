const fs = require("fs");

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function assertIncludes(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`Missing ${label}: ${needle}`);
  }
}

const endpointPy = read("app/api/v1/endpoints/booking_engine.py");
const mainPy = read("app/main.py");

[
  ".post(",
  "/availability",
  "BookingAvailabilityRequest",
  "BookingAvailabilityResponse",
  "host-review",
  "alternatives"
].forEach(needle => assertIncludes(endpointPy, needle, "Backend endpoint contract"));

assertIncludes(mainPy, "/api/v1", "API version prefix in main app");

console.log("✅ Booking API Backend audit passed");
