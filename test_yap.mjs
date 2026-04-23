import { execSync } from 'child_process';

// 1. DB Push
console.log('>>> Adim 1: DB Vault Semasi Yukleniyor...');
try {
  execSync('npx drizzle-kit push:pg', { cwd: './packages/db', stdio: 'inherit' });
} catch (e) {
  console.error('DB push failed.');
}

// 2. Ingestion API Event
console.log('\n>>> Adim 2: Ingestion API\'ye Canli Event Gonderiliyor...');
try {
  const payload = {
    type: "BOOKING_INTENT_CAPTURED",
    subject: "BOOKING",
    payload: {
      tenantId: "santis-club",
      sessionId: "session_12345",
      intent: "Sovereign Hamam",
      timestamp: 1710000000000
    }
  };

  const response = await fetch('http://localhost:3030/api/events', {
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
