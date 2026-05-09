const { JSDOM } = require("jsdom");
const http = require("http");

const SERVER_URL = "http://localhost:8080";
const PAGES_TO_SCAN = [
    "/",
    "/",
    "/admin/index.html",
    "/masajlar.html",
    "/iletisim.html",
    "/en/index.html"
];

async function checkUrlStatus(url) {
    if (!url || url === '#' || url.startsWith('javascript:')) return 200;
    
    return new Promise((resolve) => {
        const fullUrl = url.startsWith('http') ? url : `${SERVER_URL}${url.startsWith('/') ? '' : '/'}${url}`;
        http.get(fullUrl, (res) => {
            resolve(res.statusCode);
            res.resume(); // consume response data to free up memory
        }).on('error', () => resolve(500));
    });
}

async function runNavbarScan() {
    console.log("🦅 [NAVBAR DOMINANCE SCAN] Initializing JSDOM Mode...");
    
    let report = {
        pages_scanned: 0,
        navbar_found: 0,
        navbar_missing: [],
        broken_links: [],
        structure_issues: [],
        visual_inconsistencies: [],
        critical_errors: []
    };

    for (const route of PAGES_TO_SCAN) {
        if (await checkUrlStatus(route) !== 200) {
            console.log(`Skipping offline or missing page: ${route}`);
            continue;
        }

        report.pages_scanned++;
        
        try {
            // Load page with JS Execution enabled to allow app.js to inject navbar
            const dom = await JSDOM.fromURL(`${SERVER_URL}${route}`, {
                runScripts: "dangerously",
                resources: "usable",
                pretendToBeVisual: true,
                beforeParse(window) {
                    window.fetch = (url, options) => {
                        const fullUrl = url.toString().startsWith('/') ? `${SERVER_URL}${url}` : url.toString();
                        return fetch(fullUrl, options);
                    };
                }
            });
            
            // Wait a short bit for scripts to execute and inject the navbar
            await new Promise(r => setTimeout(r, 800));

            const document = dom.window.document;
            const nav = document.querySelector('nav, .navbar, #global-navbar, #nv-main-nav, [data-component="navbar"], header');
            
            if (!nav) {
                report.navbar_missing.push(route);
                report.critical_errors.push(`Navbar hiç yok ❌ (${route})`);
                dom.window.close();
                continue;
            }

            report.navbar_found++;
            
            const text = nav.textContent || '';
            const logo = nav.querySelector('img, svg, .logo, [alt*="logo" i]');
            const cta = nav.querySelector('button, .cta, .btn-primary, [href*="rezervasyon"]');
            const links = Array.from(nav.querySelectorAll('a')).map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href') }));
            const mobileMenu = nav.querySelector('.hamburger, [aria-label*="menu" i], button');

            const hasLogo = !!logo;
            const hasCTA = !!cta;
            const hasMobileMenu = !!mobileMenu;

            const requiredLinks = ['Ana Sayfa', 'Hizmetler', 'Hakkımızda', 'İletişim'];
            const missingLinks = requiredLinks.filter(req => !text.toLowerCase().includes(req.toLowerCase()));
            
            if (!hasLogo) report.structure_issues.push(`STRUCTURE_INCOMPLETE: Logo missing on ${route}`);
            if (!hasCTA) report.structure_issues.push(`STRUCTURE_INCOMPLETE: CTA missing on ${route}`);
            if (!hasMobileMenu) report.structure_issues.push(`STRUCTURE_INCOMPLETE: Mobile menu missing on ${route}`);
            if (missingLinks.length > 0) report.structure_issues.push(`STRUCTURE_INCOMPLETE: Missing links [${missingLinks.join(', ')}] on ${route}`);

            // Link Health Check
            for (const link of links) {
                if (!link.href || link.href === '#' || link.href.startsWith('javascript:')) continue;
                
                const status = await checkUrlStatus(link.href);
                if (status === 404) {
                    report.broken_links.push(`${link.href} (on ${route})`);
                    report.critical_errors.push(`Linkler çalışmıyor ❌ (${link.href} on ${route})`);
                } else if (status === 301 || status === 302) {
                    report.structure_issues.push(`REDIRECT ⚠️: ${link.href}`);
                }
            }

            dom.window.close();

        } catch (err) {
            report.critical_errors.push(`Page load fail: ${route} - ${err.message}`);
        }
    }

    report.broken_links = [...new Set(report.broken_links)];
    report.critical_errors = [...new Set(report.critical_errors)];
    report.structure_issues = [...new Set(report.structure_issues)];

    console.log("\n--- FINAL REPORT FORMAT ---");
    console.log(JSON.stringify(report, null, 2));
}

runNavbarScan();
