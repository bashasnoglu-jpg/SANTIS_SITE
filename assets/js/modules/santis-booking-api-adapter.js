export class SantisBookingAPI {
  static async checkAvailability(payload) {
    try {
      const response = await fetch("/api/v1/booking/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Availability API failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn("[BookingAPI] falling back to mock availability", error);
      return null;
    }
  }
}
