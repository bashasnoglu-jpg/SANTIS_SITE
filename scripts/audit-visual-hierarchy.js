import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSS_DIR = path.resolve(__dirname, '../assets/css');

const RULES = [
  {
    name: 'Raw Hex Color',
    regex: /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\\b/g,
    message: 'Ham hex kodu tespit edildi. Theme manifest token kullanın.'
  },
  {
    name: 'Emergency Z-Index',
    regex: /z-index:\\s*(9999|2147483647|[1-9]\\d{3,})/g,
    message: 'Yasaklı z-index bulundu. --z-* token skalası dışına çıkılamaz.'
  },
  {
    name: 'Important Override',
    regex: /!important/g,
    message: '!important kullanımı tespit edildi.'
  },
  {
    name: 'Raw Font Size',
    regex: /font-size:\\s*\\d*\\.?\\d+(rem|px|em|vh|vw)/g,
    message: 'Manuel font-size tespit edildi. Tipografi merdiveni tokenlarını kullanın.'
  },
  {
    name: 'Raw Motion Duration',
    regex: /(transition|animation)(-duration)?\\s*:[^;]*\\b\\d*\\.?\\d+s\\b/g,
    message: 'Raw motion duration bulundu. Motion kernel duration tokenlarını kullanın.'
  },
  {
    name: 'Raw Transform Distance',
    regex: /translate[XY]?\\(\\d+px\\)/g,
    message: 'Raw transform distance bulundu. Motion kernel distance tokenlarını kullanın.'
  },
  {
    name: 'Raw Blur Value',
    regex: /blur\\(\\d+px\\)/g,
    message: 'Raw blur değeri bulundu. Motion kernel blur tokenlarını kullanın.'
  }
];

function scanDirectory(directory) {
  let hasErrors = false;

  if (!fs.existsSync(directory)) {
    console.error(`❌ CSS directory not found: ${directory}`);
    process.exit(1);
  }

  const files = fs.readdirSync(directory);

  files.forEach(file => {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (scanDirectory(fullPath)) {
        hasErrors = true;
      }
      return;
    }

    if (!file.endsWith('.css')) {
      return;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      RULES.forEach(rule => {
        const matches = line.match(rule.regex);

        if (matches) {
          hasErrors = true;

          console.log(`\n❌ [${rule.name}] ${file}:${index + 1}`);
          console.log(`   Kod: ${line.trim()}`);
          console.log(`   Kural: ${rule.message}`);
        }
      });
    });
  });

  return hasErrors;
}

console.log('🛡️ Sovereign Guard: Visual Hierarchy Audit başlatılıyor...');

const foundErrors = scanDirectory(CSS_DIR);

if (foundErrors) {
  console.log('\n⚠️ Visual hierarchy ihlalleri bulundu.');
  process.exit(1);
}

console.log('\n✅ Sıfır ihlal. Visual hierarchy mühürlendi.');
process.exit(0);
