const Redis = require('ioredis');

// Connects to 127.0.0.1:6379 by default
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
        if (times >= 3) {
            console.warn('⚠️ [CHAOS ENGINE] Redis unreachable. Stopping reconnects to prevent log spam.');
            return null; // Stop retrying
        }
        return Math.min(times * 100, 3000);
    }
});

// Suppress unhandled errors from ioredis
redis.on('error', (err) => {
    if (err.message && err.message.includes('ECONNREFUSED')) return; // Silenced in retryStrategy
    console.warn('⚠️ [CHAOS ENGINE] Redis warning:', err.message);
});

module.exports = redis;
