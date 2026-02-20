/**
 * SANTIS — Direct Cloudflare Pages Deploy via API
 * Bypasses wrangler CLI issues by using the REST API directly.
 */
import { readFileSync, readdirSync, statSync, copyFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join, relative, dirname } from 'path';
import { createHash } from 'crypto';

const ACCOUNT_ID = 'ff05ab6c1dc615b320b503eca0ce8b5d';
const PROJECT_NAME = 'santis-club';
const OUTPUT_DIR = process.cwd(); // Deploy from ROOT

// Get OAuth token from wrangler's stored credentials
async function getToken() {
    // Try wrangler's token first by reading its config
    const { execSync } = await import('child_process');
    try {
        // Wrangler stores OAuth token - we can extract it via config
        const configPaths = [
            join(process.env.USERPROFILE, '.wrangler', 'config', 'default.toml'),
            join(process.env.APPDATA || '', 'wrangler', 'config', 'default.toml'),
        ];
        for (const p of configPaths) {
            try {
                const content = readFileSync(p, 'utf-8');
                const match = content.match(/oauth_token\s*=\s*"([^"]+)"/);
                if (match) return match[1];
            } catch { }
        }
    } catch { }

    // Fallback: use the API token from .env
    try {
        const env = readFileSync('.env', 'utf-8');
        const match = env.match(/CLOUDFLARE_API_TOKEN=(.+)/);
        if (match) return match[1].trim();
    } catch { }

    // Last resort: use wrangler to get a token
    console.log('Trying wrangler token...');
    const result = execSync('npx wrangler config get oauth_token 2>/dev/null || echo ""', { encoding: 'utf-8' });
    if (result.trim()) return result.trim();

    throw new Error('No token found!');
}

function getFiles(dir, base = dir) {
    let results = [];
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relPath = relative(base, fullPath).replace(/\\/g, '/');

        // EXCLUSION LOGIC
        if (
            // Directories to ignore
            entry.isDirectory() && (
                entry.name.startsWith('.') ||          // .git, .vscode, .wrangler
                entry.name === 'node_modules' ||
                entry.name === 'venv' ||
                entry.name.startsWith('_') ||          // _build, _backup, _archive
                entry.name === 'backup' ||
                entry.name === 'backups' ||
                entry.name === 'logs' ||
                entry.name === 'reports' ||
                entry.name === 'tools' ||
                entry.name === 'scripts' ||
                entry.name === 'generator' ||
                entry.name === 'page_configs' ||
                entry.name === 'visual_checkpoints' ||
                entry.name === 'santis-audit'
            )
        ) continue;

        if (
            // Files to ignore
            !entry.isDirectory() && (
                entry.name.startsWith('.') ||          // .env, .gitignore
                entry.name.endsWith('.py') ||
                entry.name.endsWith('.ps1') ||
                entry.name.endsWith('.bat') ||
                entry.name.endsWith('.md') ||
                entry.name.endsWith('.txt') ||
                entry.name.endsWith('.zip') ||
                entry.name.endsWith('.rar') ||
                entry.name.endsWith('.log') ||
                entry.name.endsWith('.json') && entry.name !== 'manifest.json' && !fullPath.includes('assets\\data') && !fullPath.includes('assets/data') || // Allow data json
                entry.name === 'package.json' ||
                entry.name === 'package-lock.json' ||
                entry.name === 'cf-deploy.mjs' ||
                entry.name === 'build.mjs' ||
                entry.name === 'fiveserver.config.js'
            )
        ) continue;

        if (entry.isDirectory()) {
            results = results.concat(getFiles(fullPath, base));
        } else {
            const pathForManifest = '/' + relPath;
            results.push({ path: pathForManifest, fullPath, size: statSync(fullPath).size });
        }
    }
    return results;
}

// ... (imports consolidated at top)

// ... (imports and constants remain, but we add copyFileSync etc)

// ... (getFiles remains same)

function prepareStage() {
    console.log('━━━ SANTIS Staging Build ━━━\n');

    const STAGE_DIR = join(process.cwd(), '_deploy_stage');

    // Clean stage
    if (existsSync(STAGE_DIR)) {
        console.log('🧹 Cleaning previous stage...');
        rmSync(STAGE_DIR, { recursive: true, force: true });
    }
    mkdirSync(STAGE_DIR);

    const files = getFiles(OUTPUT_DIR);
    console.log(`📦 Copying ${files.length} files to ${STAGE_DIR}...`);

    for (const file of files) {
        // file.path is relative path starting with /
        const destPath = join(STAGE_DIR, file.path.substring(1)); // remove leading /
        const destDir = dirname(destPath);

        if (!existsSync(destDir)) {
            mkdirSync(destDir, { recursive: true });
        }

        copyFileSync(file.fullPath, destPath);
    }

    console.log(`✅ Staging complete: ${(files.reduce((s, f) => s + f.size, 0) / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🚀 Ready to deploy: npx wrangler pages deploy _deploy_stage`);
}

prepareStage();
