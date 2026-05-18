/**
 * ═══════════════════════════════════════════════════════════════
 * SANTIS ADMIN SIDEBAR v1.0 — "Sovereign Navigation Engine"
 * ═══════════════════════════════════════════════════════════════
 * 
 * Bu script, admin panellerindeki sol menüyü (sidebar) dinamik olarak oluşturur.
 * Tüm panellerin (index.html, god-mode.html vb.) aynı güncel menüyü kullanmasını sağlar.
 * The Great Purge ile arşive kaldırılan zombi panellere giden linkler temizlenmiştir.
 * 
 * Kullanım: <script src="/admin/assets/js/admin-sidebar.js"></script>
 * Hedef element `<aside id="admin-sidebar-container">` içine render edilir.
 */

(function() {
    'use strict';

    // ── Otonom Sidebar Enjeksiyonu ──────────────────────────────
    const buildSidebar = () => {
        const container = document.getElementById('admin-sidebar-container');
        if (!container) {
            console.warn("⚠️ [Sovereign Sidebar] #admin-sidebar-container bulunamadı. Lütfen HTML'e ekleyin.");
            return;
        }

        // Sidebar İçeriği (Zombi linklerden arındırılmış, güncel ağaç)
        container.innerHTML = `
        <aside id="admin-sidebar" class="w-64 bg-gray-950 border-r border-gray-800 flex flex-col relative flex-shrink-0 z-50 shadow-[10px_0_20px_rgba(0,0,0,0.5)] h-full" style="min-width: 240px; max-width: 600px; width: 256px;">
            <div class="p-6 border-b border-gray-800 shrink-0">
                <h1 class="text-xl font-semibold tracking-wider text-white">SANTIS <span class="text-amber-500 text-xs align-top">V7 OS</span></h1>
                <p class="text-xs text-gray-500 mt-1">Super Admin (HQ Mode)</p>
            </div>
            
            <div class="flex-1 overflow-y-auto custom-scroll flex flex-col">
                <nav id="standard-nav" class="p-4 space-y-2 transition-all duration-500 shrink-0">
                    <a href="/admin/index.html" class="block px-4 py-2 rounded-lg hover:bg-gray-800 text-gray-400 font-medium border border-transparent transition">❖ Control Center</a>
                    
                    <a href="/admin/god-mode.html" class="block px-4 py-3 rounded-lg bg-gradient-to-r from-amber-900/40 to-black border border-amber-500/50 text-amber-400 font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)] flex justify-between items-center group mt-2">
                        <span class="flex items-center gap-2"><span class="text-lg">👁️</span> The God Mode</span>
                        <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse group-hover:bg-amber-400"></span>
                    </a>

                    <a href="/admin/boardroom.html" class="block px-4 py-2 rounded-lg hover:bg-gray-800 text-cyan-400 font-medium transition mt-2 border border-cyan-500/30 bg-cyan-950/20">
                        ♟️ Sovereign Boardroom
                    </a>

                    <a href="/admin/hotels.html" class="block px-4 py-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition mt-2">🏨 Hotels Network</a>
                    <a href="/admin/bookings.html" class="block px-4 py-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition">📅 Live Bookings</a>
                    <a href="/admin/crm.html" class="block px-4 py-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition">💎 AI Offers & CRM</a>
                    <a href="/admin/revenue.html" class="block px-4 py-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition">📈 Revenue Analytics</a>
                    <a href="/admin/black-room.html" class="block px-4 py-3 rounded-lg bg-gradient-to-r from-amber-950/30 to-black border border-amber-500/30 text-amber-400 hover:from-amber-900/50 hover:text-amber-300 transition-all font-semibold flex justify-between items-center group mt-2">
                        <span class="flex items-center gap-2"><span>🦾</span> The Black Room</span>
                        <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    </a>
                </nav>

                <div class="px-4 py-2 mt-auto shrink-0 border-t border-gray-800 pt-4">
                    <p class="text-[10px] uppercase font-bold text-gray-600 tracking-wider mb-2 ml-1">Ecosystem Nodes</p>
                    <div class="space-y-1.5">
                        <a href="/admin/sovereign-lab.html" class="block text-xs px-3 py-2 rounded border border-emerald-900/30 text-emerald-500 bg-emerald-950/20 hover:bg-emerald-900/40 hover:text-emerald-400 hover:border-emerald-500/50 shadow-[0_0_10px_rgba(0,255,194,0.1)] transition font-bold" target="_blank">🧪 Sovereign Lab (Pulse & Flow)</a>
                        <a href="/tenant-dashboard" class="block text-xs px-3 py-2 rounded border border-gray-800 text-gray-400 bg-gray-900/50 hover:bg-gray-800 hover:text-cyan-400 hover:border-cyan-500/30 transition">🏢 Tenant Node</a>
                        <a href="/guest-zen" class="block text-xs px-3 py-2 rounded border border-gray-800 text-gray-400 bg-gray-900/50 hover:bg-gray-800 hover:text-blue-400 hover:border-blue-500/30 transition">🧘‍♀️ Guest App (Zen)</a>
                    </div>
                </div>

                <div class="p-4 border-t border-gray-800 text-xs text-gray-500 text-center mt-4 shrink-0">
                    Santis Master OS v1.0 <br> Connected via WSS
                </div>
            </div>
            
            <!-- Drag Handle for Resizing -->
            <div id="sidebar-drag-handle" class="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-amber-500/50 flex-col justify-center items-center z-50 group flex border-r border-transparent">
                <div class="h-8 w-0.5 bg-gray-600 group-hover:bg-amber-400 rounded-full"></div>
                <div class="h-8 w-0.5 bg-gray-600 group-hover:bg-amber-400 rounded-full mt-1"></div>
            </div>
        </aside>
        `;

        // ── Aktif Sayfayı Vurgula (Highlight Active) ──
        const currentPath = window.location.pathname;
        const normalizedPath = currentPath.endsWith('/') ? currentPath + 'index.html' : currentPath;
        const links = container.querySelectorAll('nav a');
        
        links.forEach(link => {
            if (normalizedPath.endsWith(link.getAttribute('href'))) {
                // Aktif link stili
                if (link.classList.contains('bg-gray-800') === false) {
                    if (!link.classList.contains('bg-gradient-to-r')) {
                        link.classList.remove('text-gray-400', 'hover:bg-gray-800');
                        link.classList.add('bg-gray-800', 'text-amber-500', 'border', 'border-transparent', 'shadow-sm');
                    }
                }
            }
        });

        // ── Sidebar Resizing Logic ──
        const sidebar = document.getElementById('admin-sidebar');
        const dragHandle = document.getElementById('sidebar-drag-handle');
        
        if (dragHandle && sidebar) {
            let isResizing = false;
            let startX;
            let startWidth;

            dragHandle.addEventListener('mousedown', (e) => {
                isResizing = true;
                startX = e.clientX;
                startWidth = parseInt(document.defaultView.getComputedStyle(sidebar).width, 10);
                document.body.style.cursor = 'col-resize';
                sidebar.classList.add('select-none'); // Prevent text selection
            });

            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                const newWidth = startWidth + (e.clientX - startX);
                
                // Constraints defined in inline style: min 240, max 600
                if (newWidth >= 240 && newWidth <= 600) {
                    sidebar.style.width = `${newWidth}px`;
                    
                    // Chart may need resizing when available space changes
                    if (typeof window.myChart !== 'undefined') {
                        try { window.myChart.resize(); } catch(e) {}
                    }
                }
            });

            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;
                    document.body.style.cursor = 'default';
                    sidebar.classList.remove('select-none');
                }
            });
        }
        
        console.log("🧭 [Sovereign Sidebar] Injected successfully.");
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', buildSidebar);
    } else {
        buildSidebar();
    }

})();
