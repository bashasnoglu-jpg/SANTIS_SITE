import { SantisBookingAPI } from "./santis-booking-api-adapter.js";

export function checkMockAvailability(payload) {
  const hour = Number(String(payload.preferredTime || "").split(":")[0]);

  if (!payload.preferredDate || !payload.preferredTime) {
    return {
      available: false,
      reason: "Lütfen tarih ve saat seçiniz.",
      alternatives: []
    };
  }

  if (hour < 10 || hour > 20) {
    return {
      available: false,
      reason: "Bu saat aralığı dışında müsaitlik bulunmuyor.",
      alternatives: ["11:00", "14:00", "17:30"]
    };
  }

  return {
    available: true,
    confirmationMode: "host-review",
    message: "Seçtiğiniz zaman ön uygunluk kontrolünden geçti. Son onay için spa ekibi tarafından teyit edilecektir."
  };
}

function renderAvailability(result) {
  const node = document.querySelector("[data-booking-availability]");
  if (!node) return;

  node.hidden = false;
  node.textContent = result.available
    ? result.message
    : result.reason;
    
  if (result.available) {
    node.style.borderColor = "var(--color-gold, #d4af37)";
  } else {
    node.style.borderColor = "var(--color-error, #ff4c4c)";
  }
}

function bindAvailabilityAdapter() {
  document.addEventListener("guest:booking_intent_submitted", async (e) => {
    const payload = e.detail;
    if (!payload) return;
    
    // First try the API
    let result = await SantisBookingAPI.checkAvailability(payload);

    // If API fails or is not available, fallback to mock
    if (!result) {
      result = checkMockAvailability(payload);
    }

    renderAvailability(result);

    const eventPayload = {
      ...payload,
      availability: result,
      timestamp: Date.now()
    };

    window.SantisBus?.emit?.("guest:booking_availability_checked", eventPayload);
    document.dispatchEvent(new CustomEvent("guest:booking_availability_checked", { detail: eventPayload }));
  });
}

bindAvailabilityAdapter();
