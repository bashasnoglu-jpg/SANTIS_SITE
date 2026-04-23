const fs = require('fs');
const crypto = require('crypto');
const { readManifest, readManifestRaw, lockPath } = require('../index');

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function main() {
  readManifest();

  if (!fs.existsSync(lockPath)) {
    console.error('\x1b[31m[stitch:check] Lock dosyası yok. Önce stitch:lock çalıştırın.\x1b[0m');
    process.exit(1);
  }

  const manifestHash = sha256(readManifestRaw());
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));

  if (manifestHash !== lock.hash) {
    console.error('\x1b[31m[stitch:check] Manifest ile lock arasında fark var.\x1b[0m');
    process.exit(1);
  }

  console.log('\x1b[32m[stitch:check] Visual Truth senkron.\x1b[0m');
}

main();
