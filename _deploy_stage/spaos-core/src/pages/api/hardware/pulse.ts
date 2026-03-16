import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await request.json();
    console.log(`[SpaOS Hardware API] 🦅 Received Command from Frontend.`);
    console.log(`[SpaOS Hardware API] 📦 Payload Payload:`, payload);

    // Simulated IoT Network Dispatch
    // In a real-world scenario, this is where you'd connect to the Hue Bridge / KNX IP Gateway
    if (payload.hardware_execution?.immediate_room_state === "trigger_golden_pulse") {
      console.log(`[SpaOS Hardware API] ⚡ DISPATCHING TO KNX HUB: Pulse "Triumphant Gold"`);
      // Simulating network delay to IoT hub
      await new Promise(r => setTimeout(r, 600));
      console.log(`[SpaOS Hardware API] ✔️ IOT COMMAND EXECUTED: Room is glowing.`);
    }

    return new Response(
      JSON.stringify({ 
        status: "success", 
        message: "Hardware execution triggered successfully.",
        dispatched_to_lan: true
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ status: "error", message: "Invalid payload format." }),
      { status: 400 }
    );
  }
};
