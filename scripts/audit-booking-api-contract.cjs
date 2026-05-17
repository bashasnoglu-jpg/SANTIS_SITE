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

const endpointPy = read("app/api/v1/endpoints/booking_engine.py");

[
  "BookingAvailabilityRequest",
  "BookingAvailabilityResponse",
  "partySize",
  "ge=1",
  "le=6",
  "preferredDate",
  "preferredTime",
  "available=False",
  "available=True",
  "host-review",
  "alternatives"
].forEach(needle => assertIncludes(endpointPy, needle, "Backend contract element"));

[
  "email",
  "phone",
  "name",
  "payment"
].forEach(needle => assertNotIncludes(endpointPy, needle, "PII/Payment element"));

console.log("✅ Booking API Contract Hardening audit passed");
