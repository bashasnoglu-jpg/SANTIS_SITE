/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🏭 SANTIS OS v3 — Vite MPA Build Pipeline (Canonical TS)  ║
 * ║  Tree-shaking · Minification · Cache-Busting · Port SSOT    ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { defineConfig } from 'vite';
import { resolve, join, relative } from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// ─── MPA Entry Discovery ─────────────────────────────────────────────────────
const EXCLUDE_DIRS = new Set([
    'node_modules', 'dist', 'venv', '.git', '.wrangler', 'tmp',
    '_archive', '_backup', '_dev_archives', '_backup_manual',
    'backup', 'backups', 'backup_assets', 'SantisV5.5_Backup',
    'Quarantine', 'quarantine', 'quarantine_zone',
    'visual_checkpoints', 'test-results', '_deploy_stage',
    'demo', 'trends', 'print', 'sr', 'clinic-kiosk', 'guest-zen',
    'tools', 'templates', 'packages', 'apps', 'admin-panel',
    'app', 'api', 'alembic', 'tests', 'reports',
]);

const EXCLUDE_FILES = new Set([
    'admin-dashboard.html',
    'hq-dashboard.html',
    'index_backup.html',
    'index_v1.html',
    'index_v2.html',
    'sovereign-terminal.html',
    'SANTIS_SITE_GRAPH_VISUAL.html',
    'spaos-hero-demo.html',
    'spaos-vertical-demo.html'
]);

function getHtmlEntries(dir: string, fileList: Record<string, string> = {}, rootDir = dir) {
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (_) {
        return fileList;
    }

    for (const entry of entries) {
        if (EXCLUDE_DIRS.has(entry.name)) continue;
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            getHtmlEntries(fullPath, fileList, rootDir);
        } else if (entry.name.endsWith('.html')) {
            if (EXCLUDE_FILES.has(entry.name)) continue;
            const rel = relative(rootDir, fullPath).replace(/\\/g, '/').replace('.html', '');
            const key = rel.replace(/[\/\-\.\s]/g, '_').replace(/^_/, '');
            fileList[key] = resolve(rootDir, fullPath);
        }
    }
    return fileList;
}

const htmlEntries = getHtmlEntries(__dirname);

export default defineConfig({
    root:    __dirname,
    base:    '/',

    plugins: [
        tailwindcss(),
    ],

    // ── Dev Server (Port SSOT: 8081) ──────────────────────────────────────────
    server: {
        port: 8081,
        strictPort: true,
        open: '/',
        proxy: {
            // Direct to Ingestion API (SSOT: 3030)
            '/api': {
                target: 'http://localhost:3030',
                changeOrigin: true,
            },
        },
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

    worker: {
        format: 'es'
    },

    esbuild: {
        pure:          ['console.log', 'console.info', 'console.warn', 'console.debug'],
        target:        'es2022',
        legalComments: 'none',
    },

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
