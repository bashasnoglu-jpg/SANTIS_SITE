/**
 * SANTIS OS — Build Script v1.0
 * Phase 4: Production Bundling & Optimization
 *
 * Usage:
 *   node build.mjs              → Full build (admin bundle + public minify)
 *   node build.mjs --admin-only → Admin bundle only
 *   node build.mjs --watch      → Watch mode for admin
 */
import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync, copyFileSync, unlinkSync } from 'fs';
import { join, basename, extname, relative } from 'path';
import { createHash } from 'crypto';

const ROOT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const ADMIN_DIR = join(ROOT, 'admin');
const ASSETS_JS = join(ROOT, 'assets', 'js');
const ASSETS_CSS = join(ROOT, 'assets', 'css');

const args = process.argv.slice(2);
const ADMIN_ONLY = args.includes('--admin-only');
const WATCH_MODE = args.includes('--watch');

// ─── COLORS ──────────────────────────────────────────────────────
const C = { r: '\x1b[0m', g: '\x1b[32m', y: '\x1b[33m', b: '\x1b[34m', d: '\x1b[90m' };
const log = (icon, msg) => console.log(`${C.d}[build]${C.r} ${icon} ${msg}`);

// ─── ADMIN BUNDLE ────────────────────────────────────────────────
// These are the files loaded from admin/index.html in correct order.
// External data files & CDN are excluded (they load before this bundle).
const ADMIN_JS_ORDER = [
    // Head scripts (admin-local only)
    'page-builder.js',
    'health-score.js',
    'audit-history-api.js',
    'city-os.js',
    'city-intelligence.js',
    'media-library.js',
    // Phase 5 — Stability Core (MUST load before all modules)
    'core/admin-registry.js',
    'core/api-wrapper.js',
    'core/error-boundary.js',
    // Core Layer
    'core/event-bus.js',
    'core/ui-engine.js',
    'core/tab-engine.js',
    'core/api-client.js',
    // Modules
    'modules/products.module.js',
    'modules/services.module.js',
    'modules/blog.module.js',
    'modules/audit.module.js',
    'modules/commerce.module.js',
    'modules/sentinel.module.js',
    'modules/system.module.js',
    // Bootstrap + Extensions
    'app.js',
    'dashboard-logic.js',
    'health-badge.js',
    'dashboard-analytics.js',
    'i18n-dashboard.js',
    'inline-panels.js',
    'event-bindings.js',
    // Activity & preview (if exists)
    'activity-dashboard.js',
    'preview-logic.js',
    // audit-engine.js EXCLUDED — Node.js server script (puppeteer, fs, node-fetch)
    'audit-button.js',
    // Phase 5 — Health Overlay (MUST load last)
    'core/health-overlay.js',
];

const ADMIN_CSS_ORDER = [
    'style-v2.css',
    'style-admin.css',
];

async function buildAdminBundle() {
    log('📦', 'Building admin JS bundle...');

    const distDir = join(ADMIN_DIR, 'dist');
    if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });

    // Concatenate JS files in order
    let jsContent = '/* SANTIS OS — Admin Bundle (auto-generated) */\n';
    let included = 0;
    let skipped = [];

    for (const file of ADMIN_JS_ORDER) {
        const fullPath = join(ADMIN_DIR, file);
        if (existsSync(fullPath)) {
            const content = readFileSync(fullPath, 'utf-8');
            jsContent += `\n/* ── ${file} ── */\n${content}\n`;
            included++;
        } else {
            skipped.push(file);
        }
    }

    // Write concatenated file
    const concatPath = join(distDir, '_admin.concat.js');
    writeFileSync(concatPath, jsContent, 'utf-8');

    // Minify with esbuild
    const result = await esbuild.build({
        stdin: {
            contents: jsContent,
            loader: 'js',
        },
        bundle: false,
        minify: true,
        drop: process.env.NODE_ENV === 'development' ? [] : ['console', 'debugger'],
        outfile: join(distDir, 'admin.bundle.js'),
        write: true,
        target: ['es2020'],
        legalComments: 'none',
    });

    const bundleSize = statSync(join(distDir, 'admin.bundle.js')).size;
    const originalSize = Buffer.byteLength(jsContent, 'utf-8');

    log('✅', `Admin JS: ${included} files → admin.bundle.js (${fmtKB(originalSize)} → ${fmtKB(bundleSize)}, ${pctSaved(originalSize, bundleSize)})`);
    if (skipped.length) log('⚠️', `Skipped (not found): ${skipped.join(', ')}`);

    // CSS Bundle
    log('🎨', 'Building admin CSS bundle...');
    let cssContent = '/* SANTIS OS — Admin CSS Bundle */\n';
    for (const file of ADMIN_CSS_ORDER) {
        const fullPath = join(ADMIN_DIR, file);
        if (existsSync(fullPath)) {
            cssContent += `\n/* ── ${file} ── */\n${readFileSync(fullPath, 'utf-8')}\n`;
        }
    }

    const cssResult = await esbuild.build({
        stdin: {
            contents: cssContent,
            loader: 'css',
        },
        bundle: false,
        minify: true,
        outfile: join(distDir, 'admin.bundle.css'),
        write: true,
    });

    const cssBundleSize = statSync(join(distDir, 'admin.bundle.css')).size;
    const cssOrigSize = Buffer.byteLength(cssContent, 'utf-8');
    log('✅', `Admin CSS: ${ADMIN_CSS_ORDER.length} files → admin.bundle.css (${fmtKB(cssOrigSize)} → ${fmtKB(cssBundleSize)}, ${pctSaved(cssOrigSize, cssBundleSize)})`);

    // Generate hash for cache busting
    const hash = createHash('md5')
        .update(readFileSync(join(distDir, 'admin.bundle.js')))
        .digest('hex')
        .substring(0, 8);
    writeFileSync(join(distDir, 'BUILD_HASH'), hash, 'utf-8');
    log('🔑', `Build hash: ${hash}`);

    // Cleanup concat file
    try { unlinkSync(concatPath); } catch (e) { }

    return { included, bundleSize, cssBundleSize, hash };
}

// ─── PUBLIC MINIFICATION ─────────────────────────────────────────
async function minifyPublicAssets() {
    log('📦', 'Minifying public JS files...');

    const jsDistDir = join(ASSETS_JS, 'dist');
    if (!existsSync(jsDistDir)) mkdirSync(jsDistDir, { recursive: true });

    const jsFiles = collectFiles(ASSETS_JS, '.js', ['dist', 'loaders']);
    let jsTotal = 0, jsMinTotal = 0;

    for (const file of jsFiles) {
        const content = readFileSync(file, 'utf-8');
        const name = basename(file, '.js') + '.min.js';
        try {
            const result = await esbuild.transform(content, { minify: true, loader: 'js' });
            writeFileSync(join(jsDistDir, name), result.code, 'utf-8');
            jsTotal += content.length;
            jsMinTotal += result.code.length;
        } catch (e) {
            log('⚠️', `Failed to minify ${basename(file)}: ${e.message}`);
        }
    }

    log('✅', `Public JS: ${jsFiles.length} files minified (${fmtKB(jsTotal)} → ${fmtKB(jsMinTotal)}, ${pctSaved(jsTotal, jsMinTotal)})`);

    // CSS
    log('🎨', 'Minifying public CSS files...');
    const cssDistDir = join(ASSETS_CSS, 'dist');
    if (!existsSync(cssDistDir)) mkdirSync(cssDistDir, { recursive: true });

    const cssFiles = collectFiles(ASSETS_CSS, '.css', ['dist', 'modules']);
    // Also include modules
    const modulesCssDir = join(ASSETS_CSS, 'modules');
    if (existsSync(modulesCssDir)) {
        cssFiles.push(...collectFiles(modulesCssDir, '.css', ['dist']));
    }

    let cssTotal = 0, cssMinTotal = 0;

    for (const file of cssFiles) {
        const content = readFileSync(file, 'utf-8');
        const name = basename(file, '.css') + '.min.css';
        try {
            const result = await esbuild.transform(content, { minify: true, loader: 'css' });
            writeFileSync(join(cssDistDir, name), result.code, 'utf-8');
            cssTotal += content.length;
            cssMinTotal += result.code.length;
        } catch (e) {
            log('⚠️', `Failed to minify ${basename(file)}: ${e.message}`);
        }
    }

    log('✅', `Public CSS: ${cssFiles.length} files minified (${fmtKB(cssTotal)} → ${fmtKB(cssMinTotal)}, ${pctSaved(cssTotal, cssMinTotal)})`);
}

// ─── HELPERS ─────────────────────────────────────────────────────
function collectFiles(dir, ext, excludeDirs = []) {
    const files = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (!excludeDirs.includes(entry.name)) {
                // Don't recurse for now, handle modules separately
            }
            continue;
        }
        if (extname(entry.name) === ext) {
            files.push(join(dir, entry.name));
        }
    }
    return files;
}

function fmtKB(bytes) {
    return (bytes / 1024).toFixed(1) + ' KB';
}

function pctSaved(original, minified) {
    const pct = ((1 - minified / original) * 100).toFixed(0);
    return `${C.g}-${pct}%${C.r}`;
}

// ─── MAIN ────────────────────────────────────────────────────────
async function main() {
    console.log(`\n${C.b}━━━ SANTIS OS Build v1.0 ━━━${C.r}\n`);

    const adminResult = await buildAdminBundle();

    if (!ADMIN_ONLY) {
        await minifyPublicAssets();
    }

    console.log(`\n${C.b}━━━ BUILD COMPLETE ━━━${C.r}\n`);
}

main().catch(e => {
    console.error('Build failed:', e);
    process.exit(1);
});
