const Redis = require('ioredis');

// Connects to 127.0.0.1:6379 by default
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('connect', () => {
    console.log('🔥 [CHAOS ENGINE] Redis connection established.');
});

redis.on('error', (err) => {
    console.warn('⚠️ [CHAOS ENGINE] Redis connection error (is Redis running?):', err.message);
});

module.exports = redis;
