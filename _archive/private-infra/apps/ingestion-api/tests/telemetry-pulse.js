const TEST_PAYLOAD = {
  ritual_id: "cold-boot-001",
  timestamp: new Date().toISOString(),
  metrics: {
    bio_kernel_stability: 0.98,
    liquid_weight_pressure: "1200psi",
    system_load: "4%"
  }
};

async function firePulse() {
  try {
    const baseUrl = process.env.SANTIS_INGESTION_API_URL;

    if (!baseUrl) {
      throw new Error("SANTIS_INGESTION_API_URL is required for telemetry pulse tests.");
    }

    const response = await fetch(`${baseUrl}/api/v1/telemetry/pulse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(TEST_PAYLOAD)
    });

    const body = await response.json().catch(() => null);

    console.log(response.ok ? "Telemetry Sent: SUCCESS" : "Telemetry Sent: FAILED");
    console.log("Status:", response.status);
    console.log("Response:", body);

    if (!response.ok) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("Validation Error:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

firePulse();
