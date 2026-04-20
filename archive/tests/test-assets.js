const http = require('http');

http.get('http://localhost:8080/', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        // Find all href and src
        const urls = new Set();
        const matches = data.match(/(src|href)="(\/.*?)"/gi);
        if (matches) {
            matches.forEach(m => {
                const url = m.split('=')[1].replace(/"/g, '');
                urls.add(url);
            });
        }
        
        console.log(`Checking ${urls.size} URLs...`);
        let pending = urls.size;
        
        urls.forEach(url => {
            // Check each URL via HEAD
            const req = http.request({
                host: 'localhost',
                port: 8080,
                path: url,
                method: 'HEAD'
            }, (res) => {
                if (res.statusCode >= 400) {
                    console.log(`🚨 404: ${url}`);
                }
                pending--;
                if (pending === 0) console.log("Done checking assets.");
            });
            req.on('error', e => {
                console.log(`Error checking ${url}: ${e.message}`);
                pending--;
                if (pending === 0) console.log("Done checking assets.");
            });
            req.end();
        });
    });
});
