/**
 * SANTIS OS — Cloudflare Domain Setup Script
 * santis-club.com → Cloudflare Pages custom domain bağlama
 * 
 * Kullanım:
 *   1) .env dosyasına CLOUDFLARE_API_TOKEN=xxx ekleyin
 *   2) node cloudflare-setup.mjs
 */
import { readFileSync } from 'fs';

// ─── Config ──────────────────────────────────────────────
const ACCOUNT_ID = 'ff05ab6c1dc615b320b503eca0ce8b5d';
const PROJECT_NAME = 'santis-club';
const DOMAINS = ['santis-club.com', 'www.santis-club.com'];

// Load API token from .env
const envContent = readFileSync('.env', 'utf-8');
const tokenMatch = envContent.match(/CLOUDFLARE_API_TOKEN=(.+)/);
if (!tokenMatch) {
    console.error('❌ CLOUDFLARE_API_TOKEN .env dosyasında bulunamadı!');
    console.log('Cloudflare Dashboard → My Profile → API Tokens → Create Token');
    console.log('"Edit Cloudflare Pages" template\'ini kullanın');
    process.exit(1);
}
const API_TOKEN = tokenMatch[1].trim();

const BASE_URL = `https://api.cloudflare.com/client/v4`;
const headers = {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json'
};

async function apiCall(method, path, body = null) {
    const url = `${BASE_URL}${path}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const data = await res.json();
    return data;
}

// ─── Step 1: Verify token ────────────────────────────────
async function verifyToken() {
    console.log('\n🔑 Token doğrulanıyor...');
    const data = await apiCall('GET', '/user/tokens/verify');
    if (data.success) {
        console.log('✅ Token geçerli! Status:', data.result.status);
        return true;
    } else {
        console.error('❌ Token geçersiz:', data.errors);
        return false;
    }
}

// ─── Step 2: Get Zone ID for santis-club.com ─────────────
async function getZoneId() {
    console.log('\n🌐 Zone ID alınıyor...');
    const data = await apiCall('GET', `/zones?name=santis-club.com&account.id=${ACCOUNT_ID}`);
    if (data.success && data.result.length > 0) {
        const zone = data.result[0];
        console.log(`✅ Zone bulundu: ${zone.name} (${zone.id}) — Status: ${zone.status}`);
        return zone.id;
    } else {
        console.error('❌ Zone bulunamadı. Domain Cloudflare\'a eklenmiş olmalı.');
        return null;
    }
}

// ─── Step 3: Add custom domains to Pages project ─────────
async function addCustomDomain(domain) {
    console.log(`\n📌 Custom domain ekleniyor: ${domain}`);
    const data = await apiCall(
        'POST',
        `/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/domains`,
        { name: domain }
    );
    if (data.success) {
        console.log(`✅ ${domain} eklendi! Status: ${data.result.status || 'pending'}`);
        return true;
    } else {
        const errMsg = data.errors?.map(e => e.message).join(', ') || 'Bilinmeyen hata';
        if (errMsg.includes('already exists') || errMsg.includes('already associated')) {
            console.log(`ℹ️  ${domain} zaten ekli.`);
            return true;
        }
        console.error(`❌ ${domain} eklenemedi:`, errMsg);
        return false;
    }
}

// ─── Step 4: Configure SSL/TLS ──────────────────────────
async function configureSSL(zoneId) {
    console.log('\n🔒 SSL/TLS ayarlanıyor...');

    // Full (strict) mode
    let res = await apiCall('PATCH', `/zones/${zoneId}/settings/ssl`, { value: 'strict' });
    console.log(res.success ? '✅ SSL: Full (strict)' : '❌ SSL ayarlanamadı');

    // Always Use HTTPS
    res = await apiCall('PATCH', `/zones/${zoneId}/settings/always_use_https`, { value: 'on' });
    console.log(res.success ? '✅ Always Use HTTPS: ON' : '❌ Always HTTPS ayarlanamadı');

    // Minimum TLS 1.2
    res = await apiCall('PATCH', `/zones/${zoneId}/settings/min_tls_version`, { value: '1.2' });
    console.log(res.success ? '✅ Min TLS: 1.2' : '❌ Min TLS ayarlanamadı');

    // Automatic HTTPS Rewrites
    res = await apiCall('PATCH', `/zones/${zoneId}/settings/automatic_https_rewrites`, { value: 'on' });
    console.log(res.success ? '✅ Auto HTTPS Rewrites: ON' : '❌ Ayarlanamadı');
}

// ─── Step 5: Security Settings ──────────────────────────
async function configureSecurity(zoneId) {
    console.log('\n🛡️  Güvenlik ayarları...');

    // Security Level
    let res = await apiCall('PATCH', `/zones/${zoneId}/settings/security_level`, { value: 'medium' });
    console.log(res.success ? '✅ Security Level: Medium' : '❌ Ayarlanamadı');

    // Browser Integrity Check
    res = await apiCall('PATCH', `/zones/${zoneId}/settings/browser_check`, { value: 'on' });
    console.log(res.success ? '✅ Browser Integrity Check: ON' : '❌ Ayarlanamadı');

    // Email Obfuscation
    res = await apiCall('PATCH', `/zones/${zoneId}/settings/email_obfuscation`, { value: 'on' });
    console.log(res.success ? '✅ Email Obfuscation: ON' : '❌ Ayarlanamadı');
}

// ─── Step 6: Performance Settings ────────────────────────
async function configurePerformance(zoneId) {
    console.log('\n⚡ Performans ayarları...');

    // Brotli
    let res = await apiCall('PATCH', `/zones/${zoneId}/settings/brotli`, { value: 'on' });
    console.log(res.success ? '✅ Brotli: ON' : '❌ Ayarlanamadı');

    // HTTP/3
    res = await apiCall('PATCH', `/zones/${zoneId}/settings/h2_prioritization`, { value: 'on' });
    console.log(res.success ? '✅ H2 Prioritization: ON' : '⚠️ (free plan sınırı olabilir)');

    // Early Hints
    res = await apiCall('PATCH', `/zones/${zoneId}/settings/early_hints`, { value: 'on' });
    console.log(res.success ? '✅ Early Hints: ON' : '❌ Ayarlanamadı');

    // Browser Cache TTL
    res = await apiCall('PATCH', `/zones/${zoneId}/settings/browser_cache_ttl`, { value: 14400 });
    console.log(res.success ? '✅ Browser Cache TTL: 4 saat' : '❌ Ayarlanamadı');

    // Auto Minify (deprecated in newer API versions, but worth trying)
    res = await apiCall('PATCH', `/zones/${zoneId}/settings/minify`, { value: { js: 'on', css: 'on', html: 'on' } });
    console.log(res.success ? '✅ Auto Minify: JS+CSS+HTML' : '⚠️ Minify API uyumlu değil (dashboard\'dan ayarlanabilir)');
}

// ─── Step 7: HSTS ────────────────────────────────────────
async function configureHSTS(zoneId) {
    console.log('\n🔐 HSTS ayarlanıyor...');
    const res = await apiCall('PATCH', `/zones/${zoneId}/settings/security_header`, {
        value: {
            strict_transport_security: {
                enabled: true,
                max_age: 31536000,
                include_subdomains: true,
                preload: true,
                nosniff: true
            }
        }
    });
    console.log(res.success ? '✅ HSTS: 12 ay, preload, includeSubDomains' : '❌ HSTS ayarlanamadı');
}

// ─── Step 8: List current domains ────────────────────────
async function listDomains() {
    console.log('\n📋 Mevcut custom domain\'ler:');
    const data = await apiCall('GET', `/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/domains`);
    if (data.success) {
        for (const d of data.result) {
            const icon = d.status === 'active' ? '🟢' : '🟡';
            console.log(`  ${icon} ${d.name} — ${d.status}`);
        }
    }
}

// ─── MAIN ────────────────────────────────────────────────
async function main() {
    console.log('━━━ SANTIS OS — Cloudflare Domain Setup ━━━');

    const valid = await verifyToken();
    if (!valid) process.exit(1);

    // Add custom domains
    for (const domain of DOMAINS) {
        await addCustomDomain(domain);
    }

    // Get zone ID for SSL/Security/Performance
    const zoneId = await getZoneId();
    if (zoneId) {
        await configureSSL(zoneId);
        await configureHSTS(zoneId);
        await configureSecurity(zoneId);
        await configurePerformance(zoneId);
    }

    // List final state
    await listDomains();

    console.log('\n━━━ SETUP COMPLETE ━━━');
    console.log('🌐 https://santis-club.com → birkaç dakika içinde aktif olacak');
    console.log('📝 SSL sertifikası otomatik oluşturulur (1-5 dk)');
}

main().catch(e => { console.error('HATA:', e); process.exit(1); });
