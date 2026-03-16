/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🏭 SANTIS OS v3 — Vite MPA Build Pipeline v2              ║
 * ║  Tree-shaking · Minification · Cache-Busting · Code-Split   ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { defineConfig } from 'vite';
import { resolve, join, relative } from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// ─── MPA Entry Discovery ─────────────────────────────────────────────────────
// Bu dizinler tamamen atlanır — kendi build sistemleri var veya arşiv
const EXCLUDE_DIRS = new Set([
    'node_modules', 'dist', 'venv', '.git', '.wrangler', 'tmp',
    // Arşiv ve yedek klasörler
    '_archive', '_backup', '_dev_archives', '_backup_manual',
    'backup', 'backups', 'backup_assets', 'SantisV5.5_Backup',
    'Quarantine', 'quarantine', 'quarantine_zone',
    'visual_checkpoints', 'test-results', '_deploy_stage',
    // Kendi Vite instance'ı olan admin panel
    'admin-panel', 'admin',
    // Demo ve test sayfaları
    'demo', 'trends', 'print', 'sr',
    // Backend/Python
    'app', 'api', 'alembic',
]);

function getHtmlEntries(dir, fileList = {}, rootDir = dir) {
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (_) {
        return fileList;
    }

    for (const entry of entries) {
        // Hariç tutulan dizin mi?
        if (EXCLUDE_DIRS.has(entry.name)) continue;

        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
            getHtmlEntries(fullPath, fileList, rootDir);
        } else if (entry.name.endsWith('.html')) {
            const rel = relative(rootDir, fullPath).replace(/\\/g, '/').replace('.html', '');
            // Benzersiz key oluştur
            const key = rel.replace(/[\/\-\.\s]/g, '_').replace(/^_/, '');
            fileList[key] = resolve(rootDir, fullPath);
        }
    }
    return fileList;
}

// Entry point'leri bul
const htmlEntries = getHtmlEntries(__dirname);
const entryCount = Object.keys(htmlEntries).length;
console.log(`[vite.config] 📦 MPA Entries discovered: ${entryCount} HTML files`);

// ─── Config ──────────────────────────────────────────────────────────────────
export default defineConfig({
    root:    __dirname,
    base:    '/',

    // PostCSS — tailwindcss'i pas geç, Vite'ın varsayılanını kullan
    css: {
        postcss: {
            plugins: []  // Admin panel'in tailwind config'ini global'e taşıma
        }
    },

    // ── Dev Server ──────────────────────────────────────────────────────────
    server: {
        port: 5173,
        open: '/tr/index.html',
    },

    // ── Build ───────────────────────────────────────────────────────────────
    build: {
        outDir:                 'dist',
        emptyOutDir:            true,
        target:                 'es2022',
        sourcemap:              false,
        minify:                 'esbuild',
        chunkSizeWarningLimit:  400,

        rollupOptions: {
            input: htmlEntries,

            output: {
                // Cache-Busting
                entryFileNames: 'assets/js/[name]-[hash].js',
                chunkFileNames: 'assets/js/chunks/[name]-[hash].js',
                assetFileNames: (info) => {
                    const name = info.names?.[0] || info.name || '';
                    const ext  = name.split('.').pop() || '';
                    if (['css','scss'].includes(ext))           return 'assets/css/[name]-[hash][extname]';
                    if (['woff','woff2','ttf','eot'].includes(ext)) return 'assets/fonts/[name]-[hash][extname]';
                    if (['png','jpg','jpeg','webp','gif','svg','ico'].includes(ext)) return 'assets/img/[name][extname]';
                    return 'assets/[ext]/[name]-[hash][extname]';
                },

                // ── Akıllı Kod Parçalama ────────────────────────────────────
                manualChunks(id) {
                    if (id.includes('workers/'))                       return 'santis-fabric-worker';
                    if (id.includes('/core/santis-core') ||
                        id.includes('/modules/interaction-engine') ||
                        id.includes('/modules/page-router'))           return 'santis-kernel';
                    if (id.includes('/ui/') || id.includes('/engines/')) return 'santis-experience';
                    if (id.includes('checkout') || id.includes('booking')) return 'santis-commerce';
                    if (id.includes('node_modules'))                   return 'santis-vendor';
                    return undefined;
                }
            }
        }
    },

    // ── Web Worker ──────────────────────────────────────────────────────────
    worker: {
        format: 'es'
    },

    // ── esbuild ─────────────────────────────────────────────────────────────
    esbuild: {
        pure:          ['console.log', 'console.info', 'console.warn', 'console.debug'],
        target:        'es2022',
        legalComments: 'none',
    },

    // ── Resolve Aliases ─────────────────────────────────────────────────────
    resolve: {
        alias: {
            '@kernel':  resolve(__dirname, 'assets/js/core'),
            '@modules': resolve(__dirname, 'assets/js/modules'),
            '@workers': resolve(__dirname, 'assets/js/workers'),
            '@engines': resolve(__dirname, 'assets/js/engines'),
            '@ui':      resolve(__dirname, 'assets/js/ui'),
        }
    }
});
