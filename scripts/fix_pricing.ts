
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const TARGET_LOC_SERVICES = path.join(DATA_DIR, 'location_services.json');

// Helper to load JSON
function loadJSON(filePath: string) {
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
    } catch (e) {
        console.error(`Failed to load ${filePath}:`, e);
        return [];
    }
}

async function fixPricing() {
    console.log("🔧 Running Pricing Auto-Fixer...");

    const locServices = loadJSON(TARGET_LOC_SERVICES);
    let fixedCount = 0;

    const fixedData = locServices.map((ls: any) => {
        let changed = false;
        const newPricing = ls.pricing.map((p: any) => {
            if (p.amount <= 0) {
                console.log(`Fixing 0 price for Service: ${ls.serviceId} @ ${ls.locationId}`);
                fixedCount++;
                changed = true;
                return { ...p, amount: 99 }; // Default placeholder price
            }
            return p;
        });

        if (changed) {
            return { ...ls, pricing: newPricing };
        }
        return ls;
    });

    if (fixedCount > 0) {
        fs.writeFileSync(TARGET_LOC_SERVICES, JSON.stringify(fixedData, null, 2));
        console.log(`✅ Fixed ${fixedCount} pricing errors.`);
    } else {
        console.log("No pricing errors found.");
    }
}

fixPricing();
