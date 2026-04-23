const fs = require('fs');
const path = require('path');
const { ThemeManifestSchema } = require('./theme-manifest.schema');

const manifestPath = path.join(__dirname, 'theme-manifest.json');
const lockPath = path.join(__dirname, 'theme-manifest.lock.json');

function readManifestRaw() {
  return fs.readFileSync(manifestPath, 'utf8');
}

function readManifestJson() {
  return JSON.parse(readManifestRaw());
}

function readManifest() {
  return ThemeManifestSchema.parse(readManifestJson());
}

module.exports = {
  manifestPath,
  lockPath,
  readManifestRaw,
  readManifestJson,
  readManifest
};
