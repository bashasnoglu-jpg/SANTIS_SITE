const { spawn, execSync, exec } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const isWin = os.platform() === 'win32';
const NPM_CMD = isWin ? 'npm.cmd' : 'npm'; // use exact cmd for Windows

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔥 SANTIS PROCESS SUPERVISOR v3 (HARDENED)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// ─── SSOT: PORTS ─────────────────────────────────────────────────
const PORTS = {
    backend: 8080,
    gateway: 4040,
    forge: 5050,
    vite: 5173
};

// ─── LOCK MECHANISM (Prevent Double Spawn) ───────────────────────
const LOCK_FILE = path.join(__dirname, '.nexus-lock');

if (fs.existsSync(LOCK_FILE)) {
    try {
        const existingPid = fs.readFileSync(LOCK_FILE, 'utf8').trim();
        // Check if process is actually running
        process.kill(existingPid, 0); 
        console.error(`\x1b[31m[CRITICAL]\x1b[0m Supervisor is already running (PID: ${existingPid}).`);
        console.error('Aborting double spawn to prevent EADDRINUSE crash loop.');
        process.exit(1);
    } catch (e) {
        // If process.kill throws, the process is dead. We can safely remove the stale lock.
        console.log('\x1b[33m[SUPERVISOR]\x1b[0m Stale lock file found. Cleaning up...');
        fs.unlinkSync(LOCK_FILE);
    }
}
// Write our lock
fs.writeFileSync(LOCK_FILE, process.pid.toString(), 'utf8');


// 🔥 ZOMBIE KILLER (EADDRINUSE Guard)
try {
    if (isWin) {
        console.log('\x1b[33m[SUPERVISOR]\x1b[0m Port Zombi Taraması Yapılıyor (Native Netstat)...\x1b[0m');
        const killPortWin = (port) => {
            try {
                // Windows dilinden bağımsız olmak için LISTENING aramıyoruz.
                const out = execSync(`netstat -ano | findstr :${port}`);
                const lines = out.toString().split('\n');
                for (const line of lines) {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 5 && parts[1].endsWith(`:${port}`)) {
                        const pid = parts[parts.length - 1]; // PID her zaman son elemandır
                        if (pid !== '0') {
                            execSync(`taskkill /F /PID ${pid} >nul 2>&1`);
                            console.log(`\x1b[32m[CLEANUP]\x1b[0m Killed zombie on port ${port} (PID: ${pid})`);
                        }
                    }
                }
            } catch(e) {}
        };
        Object.values(PORTS).forEach(killPortWin);
    } else {
        execSync(`npx kill-port ${Object.values(PORTS).join(' ')}`, { stdio: 'ignore' });
    }
} catch (e) {
    // Ignore
}

const processes = {
    backend: {
        name: 'SOVEREIGN_SERVER',
        cmd: 'node',
        args: ['server.js'],
        cwd: process.cwd(),
        color: '\x1b[32m', // Green
        shell: false, 
        ref: null,
        restarts: 0
    },
    gateway: {
        name: 'SOVEREIGN_GATEWAY',
        cmd: 'node',
        // Changed to .mjs to fix MODULE_TYPELESS_PACKAGE_JSON warning
        args: ['--experimental-transform-types', 'server/santis-core-gateway.mjs'],
        cwd: process.cwd(),
        color: '\x1b[35m', // Magenta
        shell: false,
        ref: null,
        restarts: 0
    },
    forge: {
        name: 'ORBITAL_FORGE',
        cmd: 'node',
        // Changed to .mjs to fix MODULE_TYPELESS_PACKAGE_JSON warning
        args: ['--experimental-transform-types', 'server/santis-orbital-forge.mjs'],
        cwd: process.cwd(),
        color: '\x1b[33m', // Yellow
        shell: false,
        ref: null,
        restarts: 0
    },
    frontend: {
        name: 'ADMIN_PANEL_VITE',
        cmd: NPM_CMD,
        args: ['run', 'dev'],
        cwd: path.join(process.cwd(), 'admin-panel'),
        color: '\x1b[36m', // Cyan
        shell: isWin, 
        ref: null,
        restarts: 0
    }
};

let isShuttingDown = false;

function killProcessTree(childProcess) {
    if (!childProcess || childProcess.killed) return;
    try {
        if (isWin) {
            execSync(`taskkill /pid ${childProcess.pid} /t /f >nul 2>&1`);
        } else {
            childProcess.kill('SIGTERM');
        }
    } catch (e) { }
}

function launchProcess(key) {
    if (isShuttingDown) return;
    
    const config = processes[key];
    console.log(`${config.color}▶ [${config.name}] Başlatılıyor...\x1b[0m`);

    const child = spawn(config.cmd, config.args, { 
        cwd: config.cwd,
        shell: config.shell 
    });
    config.ref = child;

    child.stdout.on('data', (data) => {
        fs.appendFileSync('master-debug.log', `[${config.name} STDOUT] ${data.toString()}`);
        process.stdout.write(`${config.color}[${config.name}]\x1b[0m ${data}`);
    });
    child.stderr.on('data', (data) => {
        fs.appendFileSync('master-debug.log', `[${config.name} STDERR] ${data.toString()}`);
        process.stderr.write(`\x1b[31m[${config.name} ERROR]\x1b[0m ${data}`);
    });

    child.on('close', (code) => {
        if (isShuttingDown) return;
        
        console.log(`\x1b[33m[${config.name}] Kapandı (Kod: ${code}).\x1b[0m`);
        if (config.restarts < 5) {
            config.restarts++;
            // 🛡️ Önce arındır, sonra başlat
            killProcessTree(config.ref);
            console.log(`\x1b[33m[${config.name}] Yeniden başlatılıyor (Deneme: ${config.restarts}/5)\x1b[0m`);
            setTimeout(() => launchProcess(key), 2000); 
        } else {
            console.error(`\x1b[31m[CRITICAL] ${config.name} 5 kez çöktü! Loop durduruldu.\x1b[0m`);
        }
    });

    child.on('error', (err) => {
        fs.appendFileSync('daemon-error.log', `[${config.name} DAEMON ERROR] ${err.message}\n`);
        console.error(`\x1b[31m[${config.name} DAEMON ERROR]\x1b[0m ${err.message}`);
    });
}

// 1. Backend
launchProcess('backend');
setTimeout(() => launchProcess('gateway'), 1500);
setTimeout(() => launchProcess('forge'), 3000);

// 2. Frontend ve Tarayıcı
setTimeout(() => {
    launchProcess('frontend');
    setTimeout(() => {
        console.log(`\x1b[35m[NEXUS ROUTER]\x1b[0m Tarayıcı Yönlendiriliyor...`);
        const startCmd = isWin ? 'start' : (os.platform() === 'darwin' ? 'open' : 'xdg-open');
        spawn(startCmd, [`http://localhost:${PORTS.vite}/login`], { shell: true });
    }, 4000);
}, 4500);

const shutdownGracefully = () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    
    console.log(`\n\x1b[31m[NEXUS SHUTDOWN]\x1b[0m Process Supervisor zarifçe kapatılıyor...`);
    
    // Kill all child processes
    Object.values(processes).forEach(p => killProcessTree(p.ref));
    
    // Remove lock file
    try {
        if (fs.existsSync(LOCK_FILE)) {
            fs.unlinkSync(LOCK_FILE);
            console.log(`\x1b[32m[CLEANUP]\x1b[0m Nexus kilidi (.nexus-lock) başarıyla kaldırıldı.`);
        }
    } catch(e) {}
    
    setTimeout(() => process.exit(0), 1000); // Wait for tree kill to settle
};

['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
    process.on(signal, shutdownGracefully);
});

// Also handle uncaught exceptions to clean up lock file
process.on('uncaughtException', (err) => {
    console.error('\x1b[31m[SUPERVISOR FATAL]\x1b[0m', err);
    shutdownGracefully();
});
