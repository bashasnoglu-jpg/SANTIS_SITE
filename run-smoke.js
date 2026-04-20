const http = require('http');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    }).on('error', err => reject(err));
  });
}

async function run() {
  console.log('=== HEALTH ENDPOINT ===');
  try {
    const health = await fetchJson('http://localhost:4040/api/concierge/health');
    console.log('Status:', health.status);
    console.log('Body:', health.body);
  } catch (err) {
    console.error('HEALTH ERROR:', err);
  }

  console.log('\n=== SNAPSHOT ENDPOINT ===');
  try {
    const snapshotUrl = 'http://localhost:4040/api/concierge/snapshot?tenantId=santis-club&locale=tr&currency=EUR&date=2026-04-20&partySize=2&memberTier=gold';
    const snapshot = await fetchJson(snapshotUrl);
    
    const santisHeaders = {};
    for (const [k, v] of Object.entries(snapshot.headers)) {
      if (k.toLowerCase().startsWith('x-santis')) {
        santisHeaders[k] = v;
      }
    }
    
    console.log('Status:', snapshot.status);
    console.log('HEADERS:', JSON.stringify(santisHeaders, null, 2));
    
    try {
        const data = JSON.parse(snapshot.body);
        console.log(JSON.stringify({
          services: data.services ? `[Array of ${data.services.length} items]` : null,
          nextAvailableSlots: data.nextAvailableSlots ? `[Array of ${data.nextAvailableSlots.length} items]` : null,
          warnings: data.warnings,
          policy: data.policy,
          requestId: data.requestId
        }, null, 2));
    } catch (e) {
        console.log('Body:', snapshot.body);
    }

  } catch (err) {
    console.error('SNAPSHOT ERROR:', err);
  }
}

run();
