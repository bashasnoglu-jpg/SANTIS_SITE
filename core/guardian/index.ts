import { ServiceSchema, LocationSchema, LocationServiceSchema } from "./schemas.js";
import { report } from "./reporter.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

// --- DATA SCANNERS ---
function loadJSON(filePath: string) {
    try {
        const raw = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(raw);
    } catch (e) {
        console.error(`Failed to load ${filePath}:`, e);
        return [];
    }
}

export async function runGuardian() {
    console.log("🛡️ Starting Santis OS Guardian...");

    const dataDir = path.join(process.cwd(), "data");

    const services = loadJSON(path.join(dataDir, "services.json"));
    const locations = loadJSON(path.join(dataDir, "locations.json"));
    const locationServices = loadJSON(path.join(dataDir, "location_services.json"));

    const errors: any[] = [];

    // 1. SCHEMA VALIDATION
    console.log("🔍 Validating Schemas...");

    services.forEach((s: any, i: number) => {
        const res = ServiceSchema.safeParse(s);
        if (!res.success) errors.push({ file: "services.json", index: i, id: s.id, error: res.error.issues });
    });

    locations.forEach((l: any, i: number) => {
        const res = LocationSchema.safeParse(l);
        if (!res.success) errors.push({ file: "locations.json", index: i, id: l.id, error: res.error.issues });
    });

    locationServices.forEach((ls: any, i: number) => {
        const res = LocationServiceSchema.safeParse(ls);
        if (!res.success) errors.push({ file: "location_services.json", index: i, error: res.error.issues });
    });

    // 2. RELATIONSHIP VALIDATION
    console.log("🔍 Validating Relationships...");

    const serviceIds = new Set(services.map((s: any) => s.id));
    const locationIds = new Set(locations.map((l: any) => l.id));

    locationServices.forEach((ls: any, i: number) => {
        if (!serviceIds.has(ls.serviceId)) {
            errors.push({ type: "RELATION_ERROR", msg: `Orphan Reference: Service ID ${ls.serviceId} not found in library.`, index: i });
        }
        if (!locationIds.has(ls.locationId)) {
            errors.push({ type: "RELATION_ERROR", msg: `Orphan Reference: Location ID ${ls.locationId} not found in library.`, index: i });
        }
    });

    if (errors.length > 0) {
        report(errors);
        process.exit(1);
    }

    console.log("✅ Santis OS Data Integrity: 100%");
}

// Auto-run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runGuardian();
}
