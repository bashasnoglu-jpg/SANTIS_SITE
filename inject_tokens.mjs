/**
 * SANTIS OS - Token Injection & CSS Generation Script
 * 1. tokens.json dosyasını okur ve kök CSS değişkenlerini (tokens.css) oluşturur.
 * 2. style.css içindeki ham değerleri bu değişkenlerle değiştirir.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dosya yolları
const TOKENS_FILE = path.join(__dirname, 'packages', 'design-system', 'tokens.json');
const STYLE_FILE = path.join(__dirname, 'assets', 'css', 'style.css');
const OUTPUT_CSS_FILE = path.join(__dirname, 'assets', 'css', 'tokens.css');

// JSON nesnesini düzleştirip CSS değişkeni adlarına çeviren yardımcı fonksiyon
function flattenTokens(obj, prefix = '-') {
    let result = {};
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            // Eğer $value anahtarı varsa, bu bir tokendir.
            if ('$value' in obj[key]) {
                const varName = `${prefix}-${key}`;
                let value = obj[key]['$value'];
                
                // Referansları (örn: {color.base.gold}) CSS var() formatına çevir
                if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
                    const refPath = value.slice(1, -1).replace(/\./g, '-');
                    value = `var(--${refPath})`;
                }
                result[varName] = value;
            } else {
                // Derinlere inmeye devam et
                const nested = flattenTokens(obj[key], `${prefix}-${key}`);
                result = { ...result, ...nested };
            }
        }
    }
    return result;
}

async function executeTokenInjection() {
    console.log('🌌 Santis OS: Token Injection Protocol Başlatılıyor...\n');

    try {
        // 1. JSON'ı oku ve tokens.css dosyasını oluştur
        const tokensData = JSON.parse(await fs.readFile(TOKENS_FILE, 'utf-8'));
        const flatTokens = flattenTokens(tokensData);
        
        let cssOutput = `/* SANTIS OS - SOVEREIGN TOKENS (Otomatik Oluşturuldu) */\n:root {\n`;
        for (const [varName, value] of Object.entries(flatTokens)) {
            cssOutput += `    ${varName}: ${value};\n`;
        }
        cssOutput += `}\n`;

        await fs.writeFile(OUTPUT_CSS_FILE, cssOutput);
        console.log(`✅ [1/2] tokens.css başarıyla oluşturuldu!`);

        // 2. style.css içindeki ham değerleri güvenli bir şekilde değiştir
        let styleContent = await fs.readFile(STYLE_FILE, 'utf-8');
        let replacementCount = 0;

        // Eşleştirme haritası (Ham Değer -> CSS Değişkeni)
        const replacements = [
            { raw: /#D4AF37/gi, token: 'var(--color-base-gold)' },
            { raw: /#1A1817/gi, token: 'var(--color-base-obsidian)' },
            { raw: /#F4F3F1/gi, token: 'var(--color-base-ivory)' },
            { raw: /#00FFC2/gi, token: 'var(--color-base-cyan)' },
            { raw: /#1a1a1a/gi, token: 'var(--color-surface-primary)' },
            { raw: /#2a2a2a/gi, token: 'var(--color-surface-elevated)' },
            { raw: /#333333/gi, token: 'var(--color-border-muted)' },
            { raw: /#333/gi, token: 'var(--color-border-muted)' },
            { raw: /rgba\(212, 175, 55, 0.15\)/gi, token: 'var(--color-composite-gold-glow)' },
            { raw: /rgba\(212, 175, 55, 0.18\)/gi, token: 'var(--color-composite-gold-flash)' },
            { raw: /rgba\(212, 175, 55, 0.5\)/gi, token: 'var(--color-composite-gold-frame)' },
            { raw: /\b480px\b/g, token: 'var(--breakpoint-mobile)' },
            { raw: /\b769px\b/g, token: 'var(--breakpoint-tablet)' },
            { raw: /\b1200px\b/g, token: 'var(--breakpoint-desktop)' }
        ];

        replacements.forEach(({ raw, token }) => {
            const matches = styleContent.match(raw);
            if (matches) {
                replacementCount += matches.length;
                styleContent = styleContent.replace(raw, token);
            }
        });

        await fs.writeFile(STYLE_FILE, styleContent);
        console.log(`✅ [2/2] style.css güncellendi. Toplam ${replacementCount} ham değer semantik token ile değiştirildi.`);
        console.log('\n✨ Token Enjeksiyon operasyonu başarıyla tamamlandı!');

    } catch (error) {
        console.error('❌ Kritik Hata:', error.message);
    }
}

executeTokenInjection();
