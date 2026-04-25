import { IntentConfirmationHandler } from './handlers/intent-confirmation.handler';

async function runTest() {
  console.log("🚀 [TEST] Otonom Fırlatma Rampası Aktif Ediliyor...");

  const handler = new IntentConfirmationHandler();

  // Zod Zırhından geçmiş gibi simüle edilen Zayıf Paket (Thin Event)
  const mockEvent = {
    traceId: "test-trace-" + Date.now(),
    intent: {
      guestId: "VIP-007"
      // PII (isim, telefon) YOK. Sadece ID.
    },
    payload: {
      intent: "$8.500 NAD+ Infusion (Sovereign Choice)"
    },
    tenant: {
      locale: "en"
    }
  };

  console.log("📦 [TEST] Kiosk'tan Gelen Saf Paket (Payload):", JSON.stringify(mockEvent, null, 2));

  await handler.handle(mockEvent);

  console.log("✅ [TEST] Döngü Tamamlandı. GodMode Radarı Bekleniyor.");
}

runTest().catch(console.error);
