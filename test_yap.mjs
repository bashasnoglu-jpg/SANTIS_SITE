import { execSync } from 'child_process';

// 1. DB Push (IPTAL EDILDI - Diger tablolarin silinmesini onlemek icin)
console.log('>>> Adim 1: DB Vault Semasi Yukleniyor... (ATLANDI)');
// try {
//   execSync('npx drizzle-kit push:pg', { cwd: './packages/db', stdio: 'inherit' });
// } catch (e) {
//   console.error('DB push failed.');
// }

// 2. Ingestion API Event
console.log('\n>>> Adim 2: Ingestion API\'ye Canli Event Gonderiliyor...');
try {
  const payload = {
    eventId: "123e4567-e89b-12d3-a456-426614174000",
    eventType: "experience.interaction.mood_selected",
    occurredAt: new Date().toISOString(),
    traceId: "123e4567-e89b-12d3-a456-426614174001",
    sessionId: "session_12345",
    tenant: {
      hotelId: "123e4567-e89b-12d3-a456-426614174002",
      hotelCode: "SANTIS",
      region: "EU",
      locale: "tr",
      currency: "EUR",
      activePolicies: [],
      fallbackMode: false
    },
    intent: {
      guestId: "123e4567-e89b-12d3-a456-426614174003",
      isReturningGuest: true,
      segment: "premium_intent",
      moodAffinity: ["deep_relaxation"],
      premiumThreshold: 85
    },
    payload: {
      mood: "deep_relaxation",
      source: "concierge_prompt",
      hesitation_index: 85, // Mimar Onayı Tetikleyici (Self-Tuning Engine)
      abandon_risk: 85      // Mimar Onayı Tetikleyici (Self-Tuning Engine)
    }
  };

  const response = await fetch('http://localhost:3030/api/v1/test-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const result = await response.json();
  console.log('Sunucu Yaniti:', result);
} catch (e) {
  console.error('Event gonderimi basarisiz:', e.message);
}

console.log('\n>>> Adim 3: TEST TAMAMLANDI! Simdi terminalde asagidaki komutla veritabanina bakabilirsiniz:');
console.log('cd packages/db && npx drizzle-kit studio');
