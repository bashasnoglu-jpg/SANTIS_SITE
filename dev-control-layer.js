const { spawn, execSync, exec } = require('child_process');
const path = require('path');
const os = require('os');

const isWin = os.platform() === 'win32';
const NPM_CMD = isWin ? 'npm.cmd' : 'npm'; // use exact cmd for Windows

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔥 SANTIS PROCESS SUPERVISOR v3');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// 🔥 ZOMBIE KILLER (EADDRINUSE Guard)
try {
    if (isWin) {
        console.log('\x1b[33m[NEXUS] Port 8080, 4040, 5050 ve 5173 Zombi Taraması Yapılıyor (Native Netstat)...\x1b[0m');
        const killPortWin = (port) => {
            try {
                const out = execSync(`netstat -ano | findstr LISTENING | findstr :${port}`);
                const lines = out.toString().split('\n');
                for (const line of lines) {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 5 && parts[1].endsWith(`:${port}`)) {
                        const pid = parts[4];
                        if (pid !== '0') {
                            execSync(`taskkill /F /PID ${pid} >nul 2>&1`);
                        }
                    }
                }
            } catch(e) {}
        };
        killPortWin(8080);
        killPortWin(4040);
        killPortWin(5050);
        killPortWin(5173);
    } else {
        execSync('npx kill-port 8080 4040 5050 5173', { stdio: 'ignore' });
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
        shell: false, // Node does NOT need a shell, prevents zombies
        ref: null,
        restarts: 0
    },
    gateway: {
        name: 'SOVEREIGN_GATEWAY',
        cmd: 'node',
        args: ['--experimental-transform-types', 'server/santis-core-gateway.js'],
        cwd: process.cwd(),
        color: '\x1b[35m', // Magenta
        shell: false,
        ref: null,
        restarts: 0
    },
    forge: {
        name: 'ORBITAL_FORGE',
        cmd: 'node',
        args: ['--experimental-transform-types', 'server/santis-orbital-forge.js'],
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
        shell: isWin, // npm.cmd needs shell (but we will tree-kill it later)
        ref: null,
        restarts: 0
    }
};

function killProcessTree(childProcess) {
    if (!childProcess) return;
    try {
        if (isWin) {
            execSync(`taskkill /pid ${childProcess.pid} /t /f >nul 2>&1`);
        } else {
            childProcess.kill('SIGTERM');
        }
    } catch (e) { }
}

function launchProcess(key) {
    const config = processes[key];
    console.log(`${config.color}▶ [${config.name}] Başlatılıyor...\x1b[0m`);

    const child = spawn(config.cmd, config.args, { 
        cwd: config.cwd,
        shell: config.shell 
    });
    config.ref = child;

    child.stdout.on('data', (data) => {
        require('fs').appendFileSync('master-debug.log', `[${config.name} STDOUT] ${data.toString()}`);
        process.stdout.write(`${config.color}[${config.name}]\x1b[0m ${data}`);
    });
    child.stderr.on('data', (data) => {
        require('fs').appendFileSync('master-debug.log', `[${config.name} STDERR] ${data.toString()}`);
        process.stderr.write(`\x1b[31m[${config.name} ERROR]\x1b[0m ${data}`);
    });

    child.on('close', (code) => {
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
        const fs = require('fs');
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
        spawn(startCmd, ['http://localhost:5173/login'], { shell: true });
    }, 4000);
}, 4500);

['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
    process.on(signal, () => {
        console.log(`\n\x1b[31m[NEXUS SHUTDOWN]\x1b[0m Process Supervisor kapatılıyor...`);
        killProcessTree(processes.backend.ref);
        killProcessTree(processes.gateway.ref);
        killProcessTree(processes.forge.ref);
        killProcessTree(processes.frontend.ref);
        process.exit(0);
    });
});
