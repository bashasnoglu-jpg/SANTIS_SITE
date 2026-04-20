const http = require('http');

const payload = JSON.stringify({
    filename: 'test-upload.png',
    contentBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGP6zwAA8wB7q8B6pQAAAABJRU5ErkJggg=='
});

const req = http.request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/v1/media/upload',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
    }
}, (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', raw));
});

req.on('error', (e) => console.error(e));
req.write(payload);
req.end();
