const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const manifestPath = path.join(__dirname, '..', 'theme-manifest.json');
const lockPath = path.join(__dirname, '..', 'theme-manifest.lock.json');

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function main() {
  if (!fs.existsSync(manifestPath)) {
    console.error('[stitch:check] theme-manifest.json bulunamadı.');
    process.exit(1);
  }

  const manifestRaw = fs.readFileSync(manifestPath, 'utf8');
  const manifestHash = sha256(manifestRaw);

  if (!fs.existsSync(lockPath)) {
    console.warn('[stitch:check] lock dosyası yok. Önce stitch:lock çalıştırın.');
    process.exit(0);
  }

  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  const lockedHash = lock.hash;

  if (manifestHash !== lockedHash) {
    console.warn('[stitch:check] Manifest ile lock arasında fark var.');
    process.exit(1);
  }

  console.log('\x1b[32m[stitch:check] Visual Truth senkron.\x1b[0m');
}

main();
