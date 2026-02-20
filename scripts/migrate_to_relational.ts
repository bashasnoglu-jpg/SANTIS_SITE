
import fs from 'fs';
import path from 'path';

// --- CONFIG ---
const SOURCE_FILE = path.join(process.cwd(), 'data', 'site_content.json');
const DATA_DIR = path.join(process.cwd(), 'data');
const TARGET_SERVICES = path.join(DATA_DIR, 'services.json');
const TARGET_LOCATIONS = path.join(DATA_DIR, 'locations.json');
const TARGET_LOC_SERVICES = path.join(DATA_DIR, 'location_services.json');

// --- CONSTANTS ---
const CATEGORY_MAP: Record<string, string> = {
    "hammam": "hammam_ritual",
    "massages": "massage",
    "classicMassages": "massage",
    "sportsTherapy": "massage",
    "asianMassages": "massage",
    "ayurveda": "wellness_program",
    "signatureCouples": "packages_couples",
    "kidsFamily": "kids_family",
    "faceSothys": "facial",
    "bodyCare": "body_ritual",
    "products": "physical_service",
    "signature": "packages_couples",
    "kids": "kids_family",
    "face": "facial"
};

// --- HELPER to clean IDs ---
function cleanID(id: string): string {
    return id.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
}

function generateServiceId(key: string, category: string): string {
    let catCode = "GEN";
    if (category.includes("hammam")) catCode = "HAMMAM";
    else if (category.includes("massage")) catCode = "MASSAGE";
    else if (category.includes("facial")) catCode = "FACIAL";
    else if (category.includes("body")) catCode = "BODY";
    else if (category.includes("package")) catCode = "PKG";
    else if (category.includes("kids")) catCode = "KIDS";
    else if (category.includes("wellness")) catCode = "WELL";

    // Create a deterministic short hash or just use the key
    const nameCode = cleanID(key).substring(0, 10);
    return `SRV_${catCode}_${nameCode}_01`;
}

function generateLocationId(slug: string, city: string): string {
    const safeSlug = cleanID(slug.replace(/-/g, '_'));
    const safeCity = cleanID(city ? city.split(' ')[0] : 'ANTALYA');
    return `LOC_${safeSlug}_${safeCity}`;
}

async function migrate() {
    console.log("🚀 Starting Santis OS Data Migration (Global Source)...");

    const raw = fs.readFileSync(SOURCE_FILE, 'utf-8');
    const source = JSON.parse(raw);

    // TARGET ARRAYS
    const services: any[] = [];
    const locations: any[] = [];
    const locationServices: any[] = [];

    // 1. MIGRATE LOCATIONS (from global.promotedHotels OR global.hotels)
    // Inspect source structure... based on snippets, it seems inside 'global'?
    // Wait, Step 339 shows "hotels": [ ... ] at line 104 inside... global?
    // Yes, indentation suggests global.hotels

    const rawLocations = source.global?.hotels || source.global?.promotedHotels || [];
    const locationMap = new Map<string, string>(); // slug -> ID

    console.log(`Found ${rawLocations.length} locations.`);

    for (const loc of rawLocations) {
        // Assume TR info is primary for location metadata
        const trInfo = loc.translations?.tr || {};
        const city = trInfo.location || "Antalya";
        const id = generateLocationId(loc.slug, city);

        locationMap.set(loc.slug, id);

        locations.push({
            id,
            slug: loc.slug,
            name: trInfo.name || loc.slug,
            tier: "luxury", // Default
            currency: "EUR",
            isActive: true
        });
    }

    // Add Santis Club if missing
    if (locations.length === 0) {
        const id = "LOC_SANTIS_CLUB_ANTALYA";
        locationMap.set("santis-club", id);
        locations.push({
            id, slug: "santis-club", name: "Santis Club", tier: "luxury", currency: "EUR", isActive: true
        });
    }

    // 2. MIGRATE SERVICES (from global.services)
    const rawServices = source.global?.services || {};
    console.log(`Found ${Object.keys(rawServices).length} raw services.`);

    for (const [key, sData] of Object.entries(rawServices)) {
        const anySData = sData as any;

        // Determine Category
        const sourceCat = anySData.categoryId || "massages";
        const category = CATEGORY_MAP[sourceCat] || "massage";

        // Generate ID
        const id = generateServiceId(key, category);

        // Slug logic: Use explicit slug if available, else key
        const slug = (anySData.slug || key.replace(/_/g, '-')).toLowerCase();

        // I18N Builder
        const i18n: any = {};

        // Pivot name/desc
        if (anySData.name) {
            for (const [lang, val] of Object.entries(anySData.name)) {
                if (!i18n[lang]) i18n[lang] = {};
                i18n[lang].title = val;
            }
        }
        if (anySData.desc) {
            for (const [lang, val] of Object.entries(anySData.desc)) {
                if (!i18n[lang]) i18n[lang] = {};
                i18n[lang].desc = val;
            }
        }

        // Valid languages check (fallback)
        if (!i18n.tr) i18n.tr = { title: key, desc: "" };

        // Create Service Object
        services.push({
            id,
            slug,
            category,
            type: "physical_service",
            defaultDuration: anySData.durationMin || anySData.duration || 60,
            i18n,
            config: {
                hasWetArea: category.includes("hammam"),
                requiresTherapist: true
            },
            meta: {
                version: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        });

        // Create Location Mappings
        const targetHotels = anySData.hotelSlugs || [];
        const price = anySData.price || 0;
        const cur = anySData.currency || "EUR";

        if (targetHotels.length > 0) {
            targetHotels.forEach((slug: string) => {
                const locId = locationMap.get(slug);
                if (locId) {
                    locationServices.push({
                        locationId: locId,
                        serviceId: id,
                        isActive: true,
                        pricing: [{ season: "standard", amount: price, currency: cur }]
                    });
                } else {
                    // Start of Santis OS: Warn about integrity
                    // console.warn(`Orphan hotel slug: ${slug} in service ${key}`);
                }
            });
        }
    }

    // WRITE FILES
    fs.writeFileSync(TARGET_LOCATIONS, JSON.stringify(locations, null, 2));
    console.log(`✅ Created locations.json (${locations.length} locations)`);

    fs.writeFileSync(TARGET_SERVICES, JSON.stringify(services, null, 2));
    console.log(`✅ Created services.json (${services.length} services)`);

    fs.writeFileSync(TARGET_LOC_SERVICES, JSON.stringify(locationServices, null, 2));
    console.log(`✅ Created location_services.json (${locationServices.length} mappings)`);

    console.log("\nMigration Complete. Now run: npm run guardian");
}

migrate();
