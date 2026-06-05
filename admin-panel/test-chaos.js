/* global process */
import { io } from 'socket.io-client';

console.log('Initiating Chaos Flood against Ingestion API...');
const socket = io('http://127.0.0.1:3030', {
  query: { client_type: 'telemetry' },
  reconnection: false
});

socket.on('connect', () => {
  console.log(`Connected with ID: ${socket.id}. Unleashing flood...`);
  // Fire 10 messages instantaneously to trigger 5 msg/sec rate limit
  for (let i = 0; i < 10; i++) {
    socket.emit('public:update_telemetry', { status: 'active' });
    console.log(`Sent malicious update packet ${i+1}`);
  }
});

socket.on('disconnect', (reason) => {
  console.log(`[SUCCESS] Connection dropped by Sovereign Shield! Reason: ${reason}`);
  process.exit(0);
});

socket.on('connect_error', (err) => {
  console.log(`Connection error: ${err.message}`);
  process.exit(1);
});

setTimeout(() => {
  console.error('[FAILED] Test timed out. The shield failed to drop the connection.');
  process.exit(1);
}, 2000);
