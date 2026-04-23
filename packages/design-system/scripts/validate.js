const { readManifest } = require('../index');

function main() {
  readManifest();
  console.log('\x1b[32m[stitch:validate] Manifest doğrulandı.\x1b[0m');
}

main();
