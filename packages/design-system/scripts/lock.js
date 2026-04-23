const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const manifestPath = path.join(__dirname, '..', 'theme-manifest.json');
const lockPath = path.join(__dirname, '..', 'theme-manifest.lock.json');

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function main() {
  const raw = fs.readFileSync(manifestPath, 'utf8');
  const lock = {
    hash: sha256(raw),
    lockedAt: new Date().toISOString()
  };

  fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2));
  console.log('\x1b[32m[stitch:lock] Lock üretildi.\x1b[0m');
}

main();
