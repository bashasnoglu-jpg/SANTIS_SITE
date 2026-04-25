const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Basic clean URL support
    let urlPath = req.url.split('?')[0];
    if (urlPath === '/') urlPath = '/index.html';
    
    // Güvenlik: Path traversal engelleme
    const safePath = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(__dirname, safePath);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found: ' + safePath);
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': mimeType,
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        });

        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\x1b[36m[Sovereign Core] \x1b[32mZero-Dependency Static Server Aktif.\x1b[0m`);
    console.log(`\x1b[36m[Sovereign Core] \x1b[37mPort: \x1b[33m${PORT}\x1b[0m`);
    console.log(`\x1b[36m[Sovereign Core] \x1b[37mAdres: \x1b[34mhttp://localhost:${PORT}/index.html\x1b[0m`);
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`\x1b[31m[HATA]\x1b[0m Port ${PORT} su anda baska bir uygulama tarafindan kullaniliyor!`);
    } else {
        console.error(`\x1b[31m[HATA]\x1b[0m Beklenmeyen bir hata olustu:`, e);
    }
});
