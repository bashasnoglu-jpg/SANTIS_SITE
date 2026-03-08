/**
 * SANTIS OS - SOVEREIGN EDGE ROUTER (SSR MOCK)
 * 
 * Bu dosya, Edge (Cloudflare Workers, AWS Lambda@Edge) veya Nginx seviyesinde 
 * çalışacak olan "Sıfır Gecikme" bot tespit ve SSR (Server-Side Rendering) 
 * yönlendirme mimarisinin bir simülasyonudur.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const ROOT_DIR = path.join(__dirname, '..');

// Aranan elit Bot ajanları
const BOT_USER_AGENTS = /Googlebot|Bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot/i;

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    // Default index
    if (pathname === '/') pathname = '/index.html';

    // Sadece HTML istekleri için SSR Kalkanı devreye girer
    if (pathname.endsWith('.html')) {
        const userAgent = req.headers['user-agent'] || '';
        const isBot = BOT_USER_AGENTS.test(userAgent);

        console.log(`[Edge OS] Gelen İstek: ${pathname} | Bot mu? ${isBot ? 'EVET 🕷️' : 'HAYIR 🙋‍♂️'}`);

        if (isBot) {
            // 🕷️ BOT TESPİT EDİLDİ: SPA (Single Page App) yerine Static SSR verilecek!
            // Gerçek bir Edge sunucusunda bu içerik Redis'ten veya Prerender.io'dan çekilir.
            serveSsrSnapshot(res, pathname);
            return;
        }
    }

    // 🙋‍♂️ NORMAL KULLANICI / VEYA STATIK DOSYA İSTEĞİ
    serveStaticFile(res, pathname);
});

function serveSsrSnapshot(res, pathname) {
    // 1. Orijinal HTML'yi oku
    const filePath = path.join(ROOT_DIR, pathname);

    fs.readFile(filePath, 'utf8', (err, htmlData) => {
        if (err) {
            res.writeHead(404);
            res.end('404 Not Found');
            return;
        }

        // 2. Kuantum SSR Enjeksiyonu
        // Normalde `santis-ritual-renderer.js`'nin yaptığı işi Edge sunucusu anında DOM'a basar.
        // ItemList JSON-LD SEO Şeması oluşturuyoruz (Discovery Optimization)
        const itemListSchema = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "url": "https://santis.club/tr/rituals/hammam" },
                { "@type": "ListItem", "position": 2, "url": "https://santis.club/tr/rituals/massages" }
            ]
        };

        const jsonLdScript = `<script type="application/ld+json">\n${JSON.stringify(itemListSchema, null, 2)}\n</script>`;

        // <head> tagı içine ItemList şemasını enjekte et
        let ssrHtml = htmlData.replace('</head>', `${jsonLdScript}\n</head>`);

        // 3. SPA Loading Kalkanını Kaldır
        // Botun bembeyaz sayfa görmemesi için ana container'a (nv-main) sahte ama SEO uyumlu bir içerik bas
        const seoContent = `
            <div class="ssr-bot-content">
                <h1>Santis Club - Sovereign Rituals</h1>
                <p>Welcome to the ultimate luxury spa experience. Deep relaxation and sovereign wellness.</p>
                <ul>
                    <li><a href="/tr/rituals/hammam">Ottoman hammam rituals</a></li>
                    <li><a href="/tr/rituals/massages">Deep tissue and signature massages</a></li>
                </ul>
            </div>
        `;
        ssrHtml = ssrHtml.replace('<main id="nv-main">', `<main id="nv-main">\n${seoContent}`);

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(ssrHtml);
    });
}

function serveStaticFile(res, pathname) {
    const filePath = path.join(ROOT_DIR, pathname);
    const ext = path.extname(filePath);
    let contentType = 'text/html';

    switch (ext) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.json': contentType = 'application/json'; break;
        case '.png': contentType = 'image/png'; break;
        case '.jpg': contentType = 'image/jpg'; break;
    }

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('404 Not Found');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
}

server.listen(PORT, () => {
    console.log(`\n🛡️ [Sovereign Edge Router] Mock Server başlatıldı: http://localhost:${PORT}`);
    console.log(`🤖 Bot Testi için: curl -A "Googlebot" http://localhost:${PORT}/tr/rituals/index.html\n`);
});
