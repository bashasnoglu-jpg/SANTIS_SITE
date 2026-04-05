const WS_CONFIG = {
    ALLOWED_ORIGINS: new Set([
        'http://localhost:8080',
        'http://localhost:8081'
    ]),
    ALLOW_NULL_ORIGIN: true
};

function verifyOrigin(origin) {
    if (origin === null || origin === undefined) {
        return WS_CONFIG.ALLOW_NULL_ORIGIN;
    }
    const cleanOrigin = origin.trim().toLowerCase();
    if (cleanOrigin.startsWith('http://localhost:') || cleanOrigin.startsWith('http://127.0.0.1:')) {
        return true;
    }
    return WS_CONFIG.ALLOWED_ORIGINS.has(cleanOrigin);
}

console.log('Result:', verifyOrigin('http://localhost:8081'));
