import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSS_FILE = path.join(__dirname, 'assets', 'css', 'style.css');
const MANIFEST_FILE = path.join(__dirname, 'packages', 'design-system', 'theme-manifest.json');
const REPORTS_DIR = path.join(__dirname, '.antigravity-reports');
const REPORT_FILE = path.join(REPORTS_DIR, 'design-token-audit.md');

async function runTokenAudit() {
    console.log('🌌 Santis OS: Design Token Reality Mapping Başlatılıyor...\n');

    // Ensure reports directory exists
    if (!(await fs.access(REPORTS_DIR).then(() => true).catch(() => false))) {
        await fs.mkdir(REPORTS_DIR, { recursive: true });
    }

    if (!(await fs.access(CSS_FILE).then(() => true).catch(() => false))) {
        console.error('❌ Hata: assets/css/style.css bulunamadı.');
        return;
    }

    const cssContent = await fs.readFile(CSS_FILE, 'utf-8');
    const manifest = JSON.parse(await fs.readFile(MANIFEST_FILE, 'utf-8'));

    // Düzenli ifadeler (Regex)
    const hexRegex = /#([a-fA-F0-9]{3,6})\b/g;
    const rgbaRegex = /rgba?\([^)]+\)/g;
    const pxRegex = /\b\d+(\.\d+)?px\b/g;
    const remRegex = /\b\d+(\.\d+)?rem\b/g;

    const findings = {
        colors: [...new Set([...(cssContent.match(hexRegex) || []), ...(cssContent.match(rgbaRegex) || [])])],
        spacing: [...new Set([...(cssContent.match(pxRegex) || []), ...(cssContent.match(remRegex) || [])])]
    };

    let report = `# 🎨 Santis OS - Design Token Audit Report\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;

    report += `## 🔴 1. Tespit Edilen Ham Renkler (Hardcoded Colors)\n`;
    findings.colors.forEach(color => {
        // Mevcut manifestte bu renk var mı?
        const tokenMatch = Object.entries(manifest.colors).find(([_, value]) => value.toLowerCase() === color.toLowerCase());
        const status = tokenMatch ? `✅ Eşleşti: \`${tokenMatch[0]}\`` : `⚠️ YETİM (Orphan)`;
        report += `- \`${color}\` : ${status}\n`;
    });

    report += `\n## 📏 2. Tespit Edilen Boşluk Değerleri (Hardcoded Spacing)\n`;
    findings.spacing.forEach(val => {
        const tokenMatch = Object.entries(manifest.spacing).find(([_, value]) => value === val);
        const status = tokenMatch ? `✅ Eşleşti: \`spacing.${tokenMatch[0]}\`` : `⚠️ YETİM (Orphan)`;
        report += `- \`${val}\` : ${status}\n`;
    });

    await fs.writeFile(REPORT_FILE, report);
    console.log(`✅ Tarama tamamlandı. Rapor oluşturuldu: ${REPORT_FILE}`);
}

runTokenAudit().catch(console.error);
