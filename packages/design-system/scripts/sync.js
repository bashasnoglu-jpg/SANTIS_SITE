const fs = require('fs');
const path = require('path');
const os = require('os');
const { manifestPath, readManifestJson } = require('../index');
const { ThemeManifestSchema } = require('../theme-manifest.schema');

function atomicWriteJson(targetPath, data) {
  const dir = path.dirname(targetPath);
  const tmpPath = path.join(
    dir,
    `.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.json`
  );

  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2) + os.EOL, 'utf8');
  fs.renameSync(tmpPath, targetPath);
}

function main() {
  const current = readManifestJson();

  const nextManifest = ThemeManifestSchema.parse({
    ...current,
    meta: {
      ...current.meta,
      source: 'stitch-manual',
      updatedAt: new Date().toISOString()
    }
  });

  atomicWriteJson(manifestPath, nextManifest);

  console.log('\x1b[36m[stitch:sync] Manifest atomik olarak güncellendi.\x1b[0m');
}

main();
