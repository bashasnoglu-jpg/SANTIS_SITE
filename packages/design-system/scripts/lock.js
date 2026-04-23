const fs = require('fs');
const crypto = require('crypto');
const { readManifest, readManifestRaw, lockPath } = require('../index');

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function main() {
  readManifest();

  const lock = {
    hash: sha256(readManifestRaw()),
    lockedAt: new Date().toISOString()
  };

  fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2));
  console.log('\x1b[32m[stitch:lock] Lock üretildi.\x1b[0m');
}

main();
