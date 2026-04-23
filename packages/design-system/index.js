const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'theme-manifest.json');

function readManifest() {
  const raw = fs.readFileSync(manifestPath, 'utf8');
  return JSON.parse(raw);
}

module.exports = {
  readManifest,
  manifestPath
};
