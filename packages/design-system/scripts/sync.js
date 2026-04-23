const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '..', 'theme-manifest.json');

function main() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  const nextManifest = {
    ...manifest,
    meta: {
      ...manifest.meta,
      source: 'stitch-manual',
      updatedAt: new Date().toISOString()
    }
  };

  fs.writeFileSync(manifestPath, JSON.stringify(nextManifest, null, 2));
  console.log('\x1b[36m[stitch:sync] Manifest güncellendi.\x1b[0m');
}

main();
