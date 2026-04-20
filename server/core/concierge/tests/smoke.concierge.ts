const BASE_URL = process.env.CONCIERGE_BASE_URL || 'http://localhost:4040';

async function runScenario(name: string, query: string) {
  const url = `${BASE_URL}/api/concierge/snapshot?${query}`;

  const response = await fetch(url);
  const body = await response.json();

  console.log(`\n=== ${name} ===`);
  console.log('status:', response.status);
  console.log('x-santis-request-id:', response.headers.get('x-santis-request-id'));
  console.log('x-santis-degraded:', response.headers.get('x-santis-degraded'));
  console.log('warnings:', body.warnings?.map((w: any) => w.code) ?? []);
  console.log('services:', body.services?.length ?? 0);
  console.log('slots:', body.nextAvailableSlots?.length ?? 0);
  console.log('bookingAllowed:', body.policy?.bookingAllowed ?? null);
}

async function main() {
  const query =
    'tenantId=santis-club&locale=tr&currency=EUR&date=2026-04-20&partySize=2&memberTier=gold';

  await runScenario('snapshot smoke', query);
}

main().catch((err) => {
  console.error('[smoke.concierge] failed', err);
  process.exit(1);
});
