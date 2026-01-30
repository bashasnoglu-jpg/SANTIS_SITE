const fs = require('fs');
const path = require('path');

// MOCK WINDOW for capturing data from files
const window = {};

// Helper to eval file content in context
function loadJsFile(filename) {
    const content = fs.readFileSync(path.join(__dirname, '../js', filename), 'utf8');
    // Strip IIFE wrappers or specific code if needed, but simple eval might work if code assigns to window
    // Most files are IIFE but assign to window.NV_...
    // We can use a simple VM or just regex extraction if complexity is low.
    // Given the files use `(function(){ ... window.NV_X = ... })();`
    // We can just execute the content in a context where 'window' exists.
    try {
        eval(content);
    } catch (e) {
        console.error(`Error loading ${filename}:`, e.message);
    }
}

// 1. Load Data
console.log("Loading JS Data files...");
loadJsFile('hammam-data.js'); // Populates window.NV_HAMMAM, window.NV_HAMMAM_CATEGORIES, etc.
loadJsFile('massage-data.js'); // Populates window.NV_MASSAGES, etc.
loadJsFile('skincare-data.js'); // Populates window.NV_SKINCARE

// 2. Load Existing JSON
const jsonPath = path.join(__dirname, '../../data/site_content.json');
let jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// 3. Construct New Data Structure
// We only want the ITEMS (Content). Config/Logic (Chips) will stay in JS loader.
// Or we can put standard config (Categories, Tiers) in JSON too.
// Let's put Categories and Tiers in JSON as they are data. Chips have functions, so excluded.

const catalogs = {
    hammam: {
        items: window.NV_HAMMAM || [],
        categories: window.NV_HAMMAM_CATEGORIES || {},
        tiers: window.NV_HAMMAM_TIERS || {}
    },
    massages: {
        items: window.NV_MASSAGES || [],
        categories: window.NV_MASSAGE_CATEGORIES || {},
        tiers: window.NV_MASSAGE_TIERS || {}
        // Chips excluded due to functions
    },
    skincare: {
        items: window.NV_SKINCARE || [],
        categories: window.NV_SKINCARE_CATEGORY_LABELS || {}, // Map label to categories
        order: window.NV_SKINCARE_CATEGORY_ORDER || []
    }
};

// 4. Merge
jsonContent.catalogs = catalogs;

// 5. Write Back
fs.writeFileSync(jsonPath, JSON.stringify(jsonContent, null, 4), 'utf8');
console.log("✅ site_content.json updated successfully with Catalog Data.");
