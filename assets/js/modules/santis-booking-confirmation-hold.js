function renderConfirmationHold(e) {
  const payload = e.detail;
  const result = payload?.availability;
  const panel = document.querySelector("[data-booking-hold]");

  if (!panel || !result?.available) return;

  panel.hidden = false;

  const eventPayload = {
    ritualTitle: payload.ritualTitle,
    preferredDate: payload.preferredDate,
    preferredTime: payload.preferredTime,
    confirmationMode: result.confirmationMode || "host-review",
    source: "availability-adapter",
    timestamp: Date.now()
  };

  window.SantisBus?.emit?.("guest:booking_confirmation_hold_created", eventPayload);
  document.dispatchEvent(new CustomEvent("guest:booking_confirmation_hold_created", { detail: eventPayload }));
}

function bindConfirmationHold() {
  document.addEventListener("guest:booking_availability_checked", renderConfirmationHold);
}

bindConfirmationHold();
