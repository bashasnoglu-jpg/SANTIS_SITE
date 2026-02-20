const fs = require('fs');

const path = require('path');



// -------------------------------------------------------------

// CONFIGURATION & CONSTANTS

// -------------------------------------------------------------

const CONFIG = {

    data: path.join(__dirname, '../data/services.json'),

    template: path.join(__dirname, '../templates/service-detail.html'),

    outputDir: path.join(__dirname, '../'), // Root for now, or '../dist' if we want clean split

    // For this specific project, user wants folders in root (e.g. /tr/masajlar/...) so we output to root.

    // CAUTION: "Clean Build" must NOT delete the whole root! We will carefuly clean specific target folders.

    langs: ['tr', 'en', 'ru', 'de', 'fr', 'sr'],

    domain: 'https://santisclub.com',

    buildId: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12)

};



const RESERVED_NAMES = [

    "con", "prn", "aux", "nul",

    "com1", "com2", "com3", "com4", "com5", "com6", "com7", "com8", "com9",

    "lpt1", "lpt2", "lpt3", "lpt4", "lpt5", "lpt6", "lpt7", "lpt8", "lpt9"

];



const CATEGORY_MAP = {

    'massage-classic': {

        tr: 'masajlar', en: 'massages', ru: 'massages',

        de: 'massagen', fr: 'massages', sr: 'masaze'

    },

    'massage-thai': {

        tr: 'masajlar', en: 'massages', ru: 'massages',

        de: 'massagen', fr: 'massages', sr: 'masaze'

    },

    // Add more as needed

};



// -------------------------------------------------------------

// HELPER FUNCTIONS (THE SACRED 10 PROTOCOLS)

// -------------------------------------------------------------



// Protocol 5: BOM Stripper

function readJSON(filePath) {

    try {

        let content = fs.readFileSync(filePath, 'utf8');

        // Strip BOM if present

        if (content.charCodeAt(0) === 0xFEFF) {

            content = content.slice(1);

        }

        return JSON.parse(content);

    } catch (err) {

        console.error(`❌ FATAL: Could not read JSON at ${filePath}`);

        console.error(err);

        process.exit(1);

    }

}



// Protocol 1: Strict ASCII Slugify

function slugify(text) {

    if (!text) return 'untitled';

    const trMap = {

        'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',

        'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U'

    };



    let slug = text.split('').map(char => trMap[char] || char).join('');



    slug = slug.toLowerCase()

        .replace(/[^a-z0-9-]/g, '-') // Allow only alphanumeric and hyphens

        .replace(/-+/g, '-')         // Collapse multiple hyphens

        .replace(/^-|-$/g, '');      // Trim leading/trailing hyphens



    // Protocol 2: Windows Reserved Name Check

    if (RESERVED_NAMES.includes(slug)) {

        console.warn(`⚠️ WARNING: Reserved slug '${slug}' detected. Appending '-service'.`);

        return slug + '-service';

    }



    return slug;

}



// Protocol 6: EBUSY Retry Logic

function safeWriteFile(filePath, content, retries = 5) {

    try {

        fs.writeFileSync(filePath, content, 'utf8');

    } catch (err) {

        if (err.code === 'EBUSY' && retries > 0) {

            console.log(`⏳ EBUSY detected on ${path.basename(filePath)}. Retrying... (${retries})`);

            // Sync wait (Atomics) - waits 100ms

            Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);

            return safeWriteFile(filePath, content, retries - 1);

        } else {

            throw err;

        }

    }

}



function safeMkdir(dirPath) {

    if (!fs.existsSync(dirPath)) {

        try {

            fs.mkdirSync(dirPath, { recursive: true });

        } catch (err) {

            if (err.code === 'EBUSY' || err.code === 'EPERM') {

                // Simple retry for mkdir too

                Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);

                fs.mkdirSync(dirPath, { recursive: true });

            } else {

                throw err;

            }

        }

    }

}



// -------------------------------------------------------------

// MAIN BUILD LOGIC

// -------------------------------------------------------------

function build() {

    console.log(`🚀 Starting Santis Output Generator (Build: ${CONFIG.buildId})`);



    // 1. Load Data

    const services = readJSON(CONFIG.data);

    const template = fs.readFileSync(CONFIG.template, 'utf8');



    // 2. Iterate Languages

    CONFIG.langs.forEach(lang => {

        console.log(`\n🌍 Processing Language: ${lang.toUpperCase()}`);



        services.forEach(item => {

            // A. Resolve Slugs & Paths

            const slug = slugify(item.slug[lang] || item.slug['tr']); // Fallback to TR slug if missing



            // Map category ID to folder name (e.g., massage-classic -> masajlar)

            const catMap = CATEGORY_MAP[item.categoryId] || { tr: 'hizmetler', en: 'services', ru: 'services' };

            const categoryFolder = slugify(catMap[lang]);



            // Construct Physical Path: /tr/masajlar/klasik-isvec/index.html

            // Note: We output to ROOT/lang/cat/slug/

            const relDirPath = path.join(lang, categoryFolder, slug);

            const fullDirPath = path.join(CONFIG.outputDir, relDirPath);



            // B. Calculate Asset Depth (Protocol: Depth-Aware)

            // Depth = number of segments in relDirPath.

            // e.g. tr/masajlar/klasik -> 3 segments -> ../../../

            const depth = relDirPath.split(path.sep).length;

            const assetPrefix = '../'.repeat(depth);



            // C. Generate Hreflang Tags

            let hreflangTags = '';

            CONFIG.langs.forEach(l => {

                const s = slugify(item.slug[l] || item.slug['tr']);

                const c = slugify((CATEGORY_MAP[item.categoryId] || { tr: 'hizmetler', en: 'services', ru: 'services' })[l]);

                // Protocol 7: Trailing Slash enforcement

                const url = `${CONFIG.domain}/${l}/${c}/${s}/`;

                hreflangTags += `<link rel="alternate" hreflang="${l}" href="${url}">\n    `;

            });



            // D. Fill Template

            // Fallbacks: If en/ru title missing, use tr

            const title = item.content.title[lang] || item.content.title['tr'];

            const desc = item.content.description[lang] || item.content.description['tr'];

            const seoTitle = item.meta.title[lang] || item.meta.title['tr'];

            const seoDesc = item.meta.desc[lang] || item.meta.desc['tr'];

            const benefit = item.content.benefit[lang] || item.content.benefit['tr'];

            const usage = item.content.usage[lang] || item.content.usage['tr'];

            const price = item.content.price[lang] || item.content.price['tr'];



            // Protocol 7: Canonical with trailing slash

            const canonicalUrl = `${CONFIG.domain}/${relDirPath.replace(/\\/g, '/')}/`;



            let html = template

                .replace(/{{LANG}}/g, lang)

                .replace(/{{SEO_TITLE}}/g, seoTitle)

                .replace(/{{SEO_DESC}}/g, seoDesc)

                .replace(/{{CANONICAL_URL}}/g, canonicalUrl)

                .replace(/{{HREFLANG_TAGS}}/g, hreflangTags)

                .replace(/{{ASSET_PREFIX}}/g, assetPrefix) // Protocol 3: Asset Path Logic

                .replace(/{{BUILD_ID}}/g, CONFIG.buildId)   // Protocol 3: Cache Busting

                .replace(/{{HERO_IMAGE}}/g, item.assets.hero)

                .replace(/{{TITLE}}/g, title)

                .replace(/{{DESCRIPTION}}/g, desc)

                .replace(/{{CATEGORY_SLUG}}/g, categoryFolder)

                .replace(/{{CATEGORY_NAME}}/g, categoryFolder.toUpperCase()) // Simple uppercase for now

                .replace(/{{BADGE}}/g, item.content.badge || '')

                .replace(/{{BENEFIT}}/g, benefit)

                .replace(/{{USAGE}}/g, usage)

                .replace(/{{PRICE}}/g, price);



            // 3. Write File

            safeMkdir(fullDirPath);

            safeWriteFile(path.join(fullDirPath, 'index.html'), html);



            console.log(`   ✅ Generated: ${relDirPath}/index.html`);

        });

    });



    console.log(`\n✨ Build Complete. Cache ID: ${CONFIG.buildId}`);

}



// Run

build();

