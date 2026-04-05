const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'masaj.html');
let content = fs.readFileSync(file, 'utf8');

let currentCat = 'unknown';
let railMatchMap = {
    'id="rail-massage-classic"': 'classic',
    'id="rail-massage-asian"': 'asian',
    'id="rail-massage-extra"': 'extra'
};

let outputLines = [];
let lines = content.split('\n');
for(let line of lines) {
    for (let key in railMatchMap) {
        if (line.includes(key)) {
            currentCat = railMatchMap[key];
        }
    }
    if (line.includes('<article class="santis-premium-card"')) {
        let match = line.match(/service=([^'"]+)/);
        if (match) {
            let serviceId = match[1];
            // Yalnızca varsa eklemesin
            if (!line.includes('data-service-id')) {
                line = line.replace('<article class="santis-premium-card"', `<article class="santis-premium-card" data-service-id="${serviceId}" data-category="${currentCat}"`);
            }
        }
    }
    outputLines.push(line);
}
content = outputLines.join('\n');

// Kill legacy script
content = content.replace(/<script>\s*\/\/\s*Sovereign OS Module Sync[\s\S]*?<\/script>/g, '');

fs.writeFileSync(file, content);
console.log('Fixed masaj.html successfully.');
