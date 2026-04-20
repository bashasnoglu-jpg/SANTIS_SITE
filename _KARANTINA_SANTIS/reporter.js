import fs from 'fs';
import path from 'path';

/**
 * Santis Gemini V5.1 - Performans Raporlayıcı
 * Bu script, JSON çıktılarını okur ve görsel raporlar üretir.
 */

const REPORT_PATH = './perf-report.json';
const HTML_OUTPUT = './performance-report.html';

async function generateReport() {
    try {
        // 1. JSON Verisini Oku
        if (!fs.existsSync(REPORT_PATH)) {
            console.error("Hata: Rapor dosyası bulunamadı! Lütfen önce testi çalıştırın.");
            return;
        }

        const data = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
        const { metrics, thresholds, status } = data;

        // 2. Terminal Özeti (Basit ve Etkili)
        console.log("\n=== SANTIS GEMINI PERFORMANS ÖZETİ ===");
        console.log(`Durum: ${status === 'PASS' ? '✅ BAŞARILI' : '❌ BAŞARISIZ'}`);
        console.log(`URL: ${data.url}`);
        console.log("---------------------------------------");
        
        for (const [key, value] of Object.entries(metrics)) {
            const limit = thresholds[key] || thresholds[key.toUpperCase()] || thresholds['MIN_' + key.toUpperCase()] || thresholds['MAX_' + key.toUpperCase()];
            if (limit === undefined) continue;
            
            const isIssue = (key === 'fps' || key === 'avgFps' ? value < limit : value > limit);
            const icon = isIssue ? '🚩' : '✔';
            console.log(`${icon} ${key.toUpperCase()}: ${value} (Eşik: ${limit})`);
        }

        // 3. HTML Raporu Oluşturma
        const htmlContent = `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Santis Gemini V5.1 - Performans Raporu</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
            </style>
        </head>
        <body class="bg-slate-950 text-slate-200 min-h-screen selection:bg-emerald-500/30">
            <div class="max-w-4xl mx-auto px-6 py-12">
                <!-- Header -->
                <header class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-slate-800 pb-8">
                    <div>
                        <div class="flex items-center gap-3 mb-2">
                            <div class="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <svg class="w-5 h-5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                            </div>
                            <h1 class="text-2xl font-extrabold tracking-tight text-white">Santis Gemini <span class="text-emerald-500">V5.1</span></h1>
                        </div>
                        <p class="text-slate-400 text-sm font-medium">Otonom Performans Denetim Raporu</p>
                    </div>
                    
                    <div class="flex items-center gap-3">
                        <div class="px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase border ${status === 'PASS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}">
                            ${status === 'PASS' ? 'Sovereign Quality' : 'Performance Debt'}
                        </div>
                    </div>
                </header>

                <!-- Main Content -->
                <main class="space-y-8">
                    <!-- Meta Info Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Test Edilen URL</span>
                            <code class="text-emerald-400 text-sm break-all">${data.url}</code>
                        </div>
                        <div class="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Denetim Zamanı</span>
                            <span class="text-slate-200 text-sm font-semibold">${new Date().toLocaleString('tr-TR')}</span>
                        </div>
                    </div>

                    <!-- Metrics Table -->
                    <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                        <div class="overflow-x-auto custom-scrollbar">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="bg-slate-800/50">
                                        <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metrik</th>
                                        <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Değer</th>
                                        <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Eşik</th>
                                        <th class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Durum</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-800">
                                    ${Object.keys(metrics).map(key => {
                                        const limit = thresholds[key] || thresholds[key.toUpperCase()] || thresholds['MIN_' + key.toUpperCase()] || thresholds['MAX_' + key.toUpperCase()];
                                        if (limit === undefined) return '';
                                        const isIssue = (key === 'fps' || key === 'avgFps' ? metrics[key] < limit : metrics[key] > limit);
                                        return `
                                        <tr class="hover:bg-slate-800/30 transition-colors">
                                            <td class="px-6 py-5">
                                                <span class="text-sm font-bold text-white">${key.toUpperCase()}</span>
                                            </td>
                                            <td class="px-6 py-5">
                                                <span class="text-sm font-mono ${isIssue ? 'text-rose-400' : 'text-emerald-400'}">${metrics[key]}</span>
                                            </td>
                                            <td class="px-6 py-5">
                                                <span class="text-sm text-slate-500 font-mono">${limit}</span>
                                            </td>
                                            <td class="px-6 py-5">
                                                <div class="flex items-center gap-2">
                                                    <div class="w-1.5 h-1.5 rounded-full ${isIssue ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'}"></div>
                                                    <span class="text-[11px] font-bold uppercase tracking-wider ${isIssue ? 'text-rose-400' : 'text-emerald-400'}">
                                                        ${isIssue ? 'İHLAL' : 'UYGUN'}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>`;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Summary Card -->
                    <div class="bg-emerald-500/5 border border-emerald-500/10 p-8 rounded-2xl text-center">
                        <p class="text-slate-400 text-sm italic">"Performans bir özellik değil, bir haktır. Santis OS, bu hakkı her milisaniyede savunur."</p>
                    </div>
                </main>

                <!-- Footer -->
                <footer class="mt-16 pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    <div>&copy; ${new Date().getFullYear()} Santis OS Intelligence</div>
                    <div class="flex items-center gap-4">
                        <span class="hover:text-emerald-500 transition-colors cursor-help">Security Verified</span>
                        <span class="hover:text-emerald-500 transition-colors cursor-help">Performance Audited</span>
                    </div>
                </footer>
            </div>
        </body>
        </html>`;

        fs.writeFileSync(HTML_OUTPUT, htmlContent);
        console.log(`\n✅ HTML raporu oluşturuldu: ${HTML_OUTPUT}`);

    } catch (error) {
        console.error("Rapor oluşturulurken hata oluştu:", error);
    }
}

generateReport();
