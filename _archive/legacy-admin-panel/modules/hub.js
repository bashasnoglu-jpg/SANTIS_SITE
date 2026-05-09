/**
 * SANTIS MODULE: Master Dashboard / Hub (Phase 8.1 - Core Engine Standard)
 */

export default class HubModule {
    constructor(engine) {
        this.engine = engine;
        this.activeEcharts = [];
        this.rainInterval = null;
        this.canvasAnimation = null;
    }

    render() {
        return `
        <div class="hub-wrapper opacity-0 translate-y-2 transition-all duration-300 h-full w-full relative bg-gray-900 text-gray-200 font-sans antialiased">
            
    <!-- MATRIX CANVAS (Hidden until activated) -->
    <canvas id="matrix-canvas" class="fixed inset-0 z-0 opacity-0 transition-opacity duration-[2000ms] pointer-events-none"></canvas>

    <!-- UI Layout -->
    <div id="master-ui" class="flex h-screen overflow-hidden relative z-10 transition-all duration-1000">
        <!-- Sidebar (Resizable and Scrollable) -->
        <aside id="admin-sidebar" class="w-64 bg-gray-950 border-r border-gray-800 flex flex-col relative flex-shrink-0" style="min-width: 240px; max-width: 600px; width: 256px;">
            <div class="p-6 border-b border-gray-800 shrink-0">
                <h1 class="text-xl font-semibold tracking-wider text-white">SANTIS <span class="text-amber-500 text-xs align-top">V7 OS</span></h1>
                <p class="text-xs text-gray-500 mt-1">Super Admin (HQ Mode)</p>
            </div>
            
            <div class="flex-1 overflow-y-auto custom-scroll flex flex-col">
                <nav id="standard-nav" class="p-4 space-y-2 transition-all duration-500 shrink-0">
                    <a href="/index.html" class="block px-4 py-2 rounded-lg bg-gray-800 text-amber-500 font-medium border border-transparent shadow-sm">❖ Dashboard</a>
                    
                    <!-- THE ORIGINAL GOD MODE LINK -->
                    <a data-link href="/admin/god-mode.html" class="block px-4 py-3 rounded-lg bg-gradient-to-r from-amber-900/40 to-black border border-amber-500/50 text-amber-400 hover:from-amber-800/60 hover:text-amber-300 transition-all font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)] flex justify-between items-center group">
                        <span class="flex items-center gap-2"><span class="text-lg">👁️</span> The God Mode (Classic)</span>
                        <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse group-hover:bg-amber-400"></span>
                    </a>

                    <!-- THE GOD'S EYE — DUAL-CORE OS -->
                    <a data-link href="/admin/gods-eye-vision.html" class="block px-4 py-3 rounded-lg bg-gradient-to-r from-[#D4AF37]/20 to-black border border-[#D4AF37]/60 text-[#D4AF37] hover:from-[#D4AF37]/30 hover:text-yellow-200 transition-all font-bold shadow-[0_0_20px_rgba(212,175,55,0.25)] flex justify-between items-center group">
                        <span class="flex items-center gap-2">
                            <span class="text-lg">⬛</span>
                            <span>God's Eye <span class="text-[10px] font-normal opacity-70 ml-1">Dual-Core OS</span></span>
                        </span>
                        <span class="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse group-hover:bg-yellow-300"></span>
                    </a>

                    <!-- COMMAND CENTER — Realtime Control -->
                    <a data-link href="/admin/command-center.html" class="block px-4 py-3 rounded-lg bg-gradient-to-r from-blue-900/40 to-black border border-blue-500/50 text-blue-400 hover:from-blue-800/60 hover:text-blue-300 transition-all font-bold shadow-[0_0_15px_rgba(59,130,246,0.2)] flex justify-between items-center group">
                        <span class="flex items-center gap-2">
                            <span class="text-lg">🦅</span>
                            <span>Command Center</span>
                        </span>
                        <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse group-hover:bg-blue-400"></span>
                    </a>

                    <!-- THE NEW HQ DASHBOARD LINK -->
                    <a href="/hq-dashboard" class="block px-4 py-2 rounded-lg hover:bg-gray-800 text-cyan-400 font-medium transition mt-2 border border-cyan-500/30 bg-cyan-950/20">
                        ⎈ HQ Dashboard (React)
                    </a>

                    <a data-link href="/admin/hotels.html" class="block px-4 py-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition mt-2">🏨 Hotels Network</a>
                    <a data-link href="/admin/bookings.html" class="block px-4 py-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition">📅 Live Bookings</a>
                    <a data-link href="/admin/crm.html" class="block px-4 py-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition">💎 AI Offers & CRM</a>
                    <a data-link href="/admin/revenue.html" class="block px-4 py-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition">📈 Revenue Analytics</a>
                    <a data-link href="/admin/black-room.html" class="block px-4 py-3 rounded-lg bg-gradient-to-r from-amber-950/30 to-black border border-amber-500/30 text-amber-400 hover:from-amber-900/50 hover:text-amber-300 transition-all font-semibold flex justify-between items-center group">
                        <span class="flex items-center gap-2"><span>🦾</span> The Black Room</span>
                        <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    </a>
                    <div class="pt-4 mt-4 border-t border-gray-800">
                        <p class="text-[10px] uppercase font-bold text-gray-600 tracking-wider mb-2 ml-1">Legacy Core Modules</p>
                    </div>
                </nav>

                <!-- SHADOW MENU (Hidden by default) -->
                <nav id="shadow-nav" class="p-4 space-y-3 hidden opacity-0 transition-opacity duration-1000 shrink-0">
                    <p class="text-[10px] uppercase tracking-[0.4em] text-red-500 font-mono mb-4 text-center animate-pulse">Tactical Override</p>
                    <div class="block px-4 py-3 rounded border border-red-500/50 bg-red-950/20 text-red-400 font-mono text-sm shadow-[0_0_15px_rgba(239,68,68,0.2)] cursor-pointer hover:bg-red-900/40 transition">
                        [1] PROTOCOL STATUS
                    </div>
                    <div onclick="openShadowRitualsModal()" class="block px-4 py-3 rounded border border-red-900/50 hover:border-red-500/50 bg-black/50 text-red-500/70 hover:text-red-400 font-mono text-sm cursor-pointer transition">
                        [2] TACTICAL SERVICES
                    </div>
                    <div onclick="window.location.href='/index.html'" class="block px-4 py-3 rounded border border-red-900/50 hover:border-red-500/50 bg-black/50 text-red-500/70 hover:text-red-400 font-mono text-sm cursor-pointer transition">
                        [3] EMERGENCY EXIT
                    </div>
                </nav>

                <!-- SHADOW RITUALS MODAL -->
                <div id="shadow-rituals-modal" class="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] hidden flex items-center justify-center p-4">
                    <div class="bg-gray-950 border border-red-900/50 rounded-xl w-full max-w-2xl p-6 shadow-[0_0_60px_rgba(239,68,68,0.15)] relative overflow-hidden">
                        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(239,68,68,0.05),transparent_70%)] pointer-events-none"></div>
                        <div class="flex justify-between items-center mb-6 relative">
                            <div>
                                <p class="text-[10px] uppercase tracking-[0.4em] text-red-500 font-mono animate-pulse">Classified Catalog</p>
                                <h3 class="text-lg font-light text-white mt-1">Shadow Rituals</h3>
                            </div>
                            <button onclick="closeShadowRitualsModal()" class="text-red-500/50 hover:text-red-400 text-2xl leading-none transition">&times;</button>
                        </div>
                        <div id="shadow-rituals-list" class="space-y-3 max-h-96 overflow-y-auto pr-1 relative">
                            <div class="flex items-center gap-3 text-red-500/50 animate-pulse">
                                <div class="h-1.5 w-1.5 bg-red-700 rounded-full"></div>
                                <span class="font-mono text-sm">Accessing classified network...</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- App Switcher -->
                <div class="px-4 py-2 mt-auto shrink-0">
                    <p class="text-[10px] uppercase font-bold text-gray-600 tracking-wider mb-2 ml-1">Ecosystem Nodes</p>
                    <div class="space-y-1.5">
                        <a data-link href="/admin/boardroom.html" class="block text-xs px-3 py-2 rounded border border-amber-900/30 text-amber-500 bg-amber-950/20 hover:bg-amber-900/40 hover:text-amber-400 hover:border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.1)] transition font-bold">♟️ Sovereign Command (Boardroom)</a>
                        <a data-link href="/admin/sovereign-lab.html" class="block text-xs px-3 py-2 rounded border border-emerald-900/30 text-emerald-500 bg-emerald-950/20 hover:bg-emerald-900/40 hover:text-emerald-400 hover:border-emerald-500/50 shadow-[0_0_10px_rgba(0,255,194,0.1)] transition font-bold">🧪 Sovereign Lab (Pulse & Flow)</a>
                        <a href="/hq-dashboard" class="block text-xs px-3 py-2 rounded border border-gray-800 text-gray-400 bg-gray-900/50 hover:bg-gray-800 hover:text-amber-500 hover:border-amber-500/30 transition">⎈ HQ God Mode</a>
                        <a href="/tenant-dashboard" class="block text-xs px-3 py-2 rounded border border-gray-800 text-gray-400 bg-gray-900/50 hover:bg-gray-800 hover:text-cyan-400 hover:border-cyan-500/30 transition">🏢 Tenant Node</a>
                        <a href="/guest-zen" class="block text-xs px-3 py-2 rounded border border-gray-800 text-gray-400 bg-gray-900/50 hover:bg-gray-800 hover:text-blue-400 hover:border-blue-500/30 transition">🧘‍♀️ Guest App (Zen)</a>
                    </div>
                </div>

                <div class="p-4 border-t border-gray-800 text-xs text-gray-500 text-center mt-4 shrink-0">
                    Santis Master OS v1.0 <br> Connected via WSS
                </div>

                <!-- DEV TEST PANEL -->
                <div class="px-4 pb-4 border-t border-dashed border-gray-800 pt-3 shrink-0">
                    <p class="text-[9px] uppercase tracking-widest text-gray-700 mb-2 font-mono">Dev Test</p>
                    <div class="space-y-1.5">
                        <button id="btn-baba-yaga"
                            onclick="devTrigger('baba_yaga')"
                            class="w-full text-left text-[10px] px-2 py-1.5 rounded border border-red-900/40 text-red-600 hover:text-red-400 hover:border-red-700 bg-red-950/10 font-mono transition">
                            ⚡ Baba Yaga ON
                        </button>
                        <button id="btn-stand-down"
                            onclick="devStandDown()"
                            class="w-full text-left text-[10px] px-2 py-1.5 rounded border border-gray-800 text-gray-600 hover:text-gray-400 hover:border-gray-600 font-mono transition">
                            🕊️ Stand Down
                        </button>
                        <button id="btn-mock-booking"
                            onclick="devMockBooking()"
                            class="w-full text-left text-[10px] px-2 py-1.5 rounded border border-amber-900/30 text-amber-700 hover:text-amber-400 hover:border-amber-700 font-mono transition">
                            📋 Mock Booking
                        </button>
                    </div>
                </div>
            </div>
        </aside>

        <!-- DRAG HANDLE FOR SIDEBAR -->
        <div id="sidebar-drag-handle" class="w-1.5 cursor-col-resize hover:bg-gray-700 active:bg-amber-500 transition-colors z-20 flex-shrink-0 relative bg-gray-900 border-r border-gray-800" title="Sürükle: Genişlet/Daralt">
            <div class="absolute inset-y-0 left-1/2 -ml-px w-px bg-gray-700/50"></div>
        </div>

        <!-- Main Content -->
        <main class="flex-1 flex flex-col overflow-hidden">
            <!-- Topbar -->
            <header class="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-8">
                <div class="flex items-center space-x-4">
                    <span class="text-sm text-gray-400">Status: <span class="text-green-500 font-medium">● All Systems Nominal</span></span>
                </div>
                <div class="flex items-center space-x-4">
                    <button onclick="window.location.href='hotels.html'" class="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-md transition text-white border border-gray-700">+ Add Hotel</button>
                    <div class="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white font-medium">HQ</div>
                </div>
            </header>

            <!-- Dashboard Content -->
            <div class="flex-1 overflow-y-auto p-8">
                
                <h2 class="text-2xl font-light text-white mb-6">Global Network Overview</h2>
                
                <!-- KPI Cards -->
                <div class="grid grid-cols-4 gap-6 mb-8">
                    <!-- Card 1 -->
                    <div class="bg-gray-800 p-6 rounded-xl border border-gray-700 relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-500 to-transparent opacity-10 rounded-bl-full"></div>
                        <p class="text-sm text-gray-400 mb-1">Total Active Hotels</p>
                        <h3 class="text-3xl font-semibold text-white" id="stat-hotels">18 <span class="text-sm font-normal text-gray-500">/ 20</span></h3>
                    </div>
                    <!-- Card 2 -->
                    <div class="bg-gray-800 p-6 rounded-xl border border-gray-700 relative overflow-hidden">
                        <p class="text-sm text-gray-400 mb-1">Guests in Network</p>
                        <h3 class="text-3xl font-semibold text-white" id="stat-guests">3,420</h3>
                    </div>
                    <!-- Card 3 -->
                    <div class="bg-gray-800 p-6 rounded-xl border border-gray-700 relative overflow-hidden">
                        <p class="text-sm text-gray-400 mb-1">Bookings Today</p>
                        <h3 class="text-3xl font-semibold text-green-400" id="stat-bookings">146 <span class="text-sm font-normal text-green-500/50">↑ 12%</span></h3>
                    </div>
                    <!-- Card 4 -->
                    <div class="bg-gray-800 p-6 rounded-xl border border-gray-700 relative overflow-hidden">
                        <p class="text-sm text-gray-400 mb-1">Total Revenue Today</p>
                        <h3 class="text-3xl font-semibold text-amber-500" id="stat-revenue">€18,450</h3>
                    </div>
                </div>

                <!-- Matrix Section -->
                <div class="grid grid-cols-3 gap-6">
                    <!-- regional performance -->
                    <div class="col-span-1 bg-gray-800 rounded-xl border border-gray-700 p-6">
                        <h4 class="text-white font-medium mb-4">Regional Performance</h4>
                        <div class="space-y-4">
                            <div class="flex justify-between items-center border-b border-gray-700 pb-2">
                                <div>
                                    <p class="text-sm text-white">Antalya Region</p>
                                    <p class="text-xs text-gray-500">14 Hotels</p>
                                </div>
                                <span class="text-amber-500 font-medium">€14,100</span>
                            </div>
                            <div class="flex justify-between items-center border-b border-gray-700 pb-2">
                                <div>
                                    <p class="text-sm text-white">Montenegro Region</p>
                                    <p class="text-xs text-gray-500">4 Hotels</p>
                                </div>
                                <span class="text-amber-500 font-medium">€4,350</span>
                            </div>
                            
                            <div class="mt-8">
                                <h4 class="text-white font-medium mb-4">Top AI Campaigns</h4>
                                <div class="space-y-3">
                                    <div class="flex justify-between items-center bg-gray-900 p-3 rounded-lg border border-gray-700">
                                        <span class="text-sm text-gray-300">Couple Romance Ritual</span>
                                        <span class="text-xs text-green-400 font-medium">32 Conv.</span>
                                    </div>
                                    <div class="flex justify-between items-center bg-gray-900 p-3 rounded-lg border border-gray-700">
                                        <span class="text-sm text-gray-300">Mom & Kids Relax</span>
                                        <span class="text-xs text-green-400 font-medium">18 Conv.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- PHASE E: SANTIS INTELLIGENCE FEED -->
                    <div class="col-span-2 mb-6">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                            <h3 class="text-lg font-semibold text-white tracking-widest uppercase text-sm">Santis Intelligence Feed <span class="text-blue-400 text-xs ml-2">Beta</span></h3>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <!-- 1. Prediction Radar -->
                            <div class="bg-gray-800/80 rounded-xl border border-blue-900/50 p-5 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                                <div class="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                    <svg width="48" height="48" class="h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                                </div>
                                <h4 class="text-blue-400 text-xs font-bold uppercase tracking-wider mb-3">Prediction Radar</h4>
                                <div id="intel-predict-content" class="text-gray-300 text-sm h-16 flex flex-col justify-center">
                                    <div class="flex items-center gap-2 text-gray-500 animate-pulse">
                                        <div class="h-1.5 w-1.5 bg-gray-600 rounded-full"></div>
                                        <span>Scanning semantic edges...</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 2. Surge Monitor -->
                            <div class="bg-gray-800/80 rounded-xl border border-emerald-900/50 p-5 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
                                <div class="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                    <svg width="48" height="48" class="h-12 w-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                </div>
                                <h4 class="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">Surge Monitor</h4>
                                <div id="intel-surge-content" class="text-gray-300 text-sm h-16 flex flex-col justify-center">
                                    <div class="flex items-center gap-2 text-gray-500 animate-pulse">
                                        <div class="h-1.5 w-1.5 bg-gray-600 rounded-full"></div>
                                        <span>Calculating demand curve...</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 3. Graph Pulse -->
                            <div class="bg-gray-800/80 rounded-xl border border-purple-900/50 p-5 relative overflow-hidden group hover:border-purple-500/50 transition-colors">
                                <div class="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                    <svg width="48" height="48" class="h-12 w-12 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                                </div>
                                <h4 class="text-purple-400 text-xs font-bold uppercase tracking-wider mb-3">Graph Pulse</h4>
                                <div id="intel-graph-content" class="text-gray-300 text-sm h-16 flex flex-col justify-center">
                                    <div class="flex items-center gap-2 text-gray-500 animate-pulse">
                                        <div class="h-1.5 w-1.5 bg-gray-600 rounded-full"></div>
                                        <span>Aggregating node relations...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- PHASE O + P: AI CONVERSION ENGINE -->
                    <div class="col-span-3 bg-gray-800 rounded-xl border border-rose-900/40 p-6 mb-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center gap-3">
                                <div class="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></div>
                                <h3 class="text-lg font-semibold text-white tracking-widest uppercase text-sm">AI Conversion Engine & Predictive Revenue</h3>
                            </div>
                            <button onclick="loadAnalyticsMetrics()" class="text-xs px-3 py-1 rounded border border-rose-700/50 text-rose-500 hover:bg-rose-900/20 font-mono transition">⟳ Sync Data</button>
                        </div>
                        <div class="grid grid-cols-3 gap-6">
                            <div class="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Visual Intent Tracked (Heatmap)</p>
                                <h4 class="text-2xl font-light text-rose-400" id="stat-heatmap">0 <span class="text-xs text-gray-600">points</span></h4>
                            </div>
                            <div class="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Flash Offers Converted</p>
                                <h4 class="text-2xl font-light text-emerald-400" id="stat-conversions">0 <span class="text-xs text-gray-600">accepted</span></h4>
                            </div>
                            <div class="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Santis AI Gains (Yield Optimized)</p>
                                <h4 class="text-2xl font-bold text-amber-500" id="stat-ai-gains">€0.00</h4>
                            </div>
                        </div>
                    </div>

                    <!-- Live Bookings -->
                    <div class="col-span-2 bg-gray-800 rounded-xl border border-gray-700 p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h4 class="text-white font-medium">🔴 Live Booking Feed</h4>
                            <span class="text-xs bg-gray-900 border border-gray-700 px-3 py-1 rounded-full text-green-400 animate-pulse">WSS Synced</span>
                        </div>
                        
                        <div class="overflow-hidden">
                            <table class="w-full text-left text-sm text-gray-400">
                                <thead class="text-xs text-gray-500 uppercase bg-gray-900/50">
                                    <tr>
                                        <th class="px-4 py-3 rounded-tl-lg">Time</th>
                                        <th class="px-4 py-3">Hotel (Scope)</th>
                                        <th class="px-4 py-3">Guest Info</th>
                                        <th class="px-4 py-3">Service</th>
                                        <th class="px-4 py-3">Status</th>
                                        <th class="px-4 py-3 rounded-tr-lg">Rev.</th>
                                    </tr>
                                </thead>
                                <tbody id="live-bookings-tbody">
                                    <!-- Populated by JS -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- PHASE G: SENTIENT GUEST CARD PANEL -->
                <div class="mt-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <div class="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                            <h3 class="text-sm font-semibold text-white tracking-widest uppercase">Sentient Guest Intelligence <span class="text-amber-500 text-xs ml-2">Phase G</span></h3>
                        </div>
                        <button onclick="loadVipRoster()" class="text-xs px-3 py-1.5 rounded border border-amber-700/50 text-amber-500 hover:bg-amber-900/20 hover:border-amber-500 font-mono transition">⟳ Refresh</button>
                    </div>

                    <div id="vip-roster-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <!-- Populated by JS -->
                        <div class="col-span-3 text-center py-8 text-gray-600 text-sm font-mono animate-pulse">
                            Scanning guest neural signatures...
                        </div>
                    </div>
                </div>

                <!-- PHASE H: REVENUE INTELLIGENCE PANEL -->
                <div class="mt-8" id="revenue-intelligence-panel">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <div class="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                            <h3 class="text-sm font-semibold text-white tracking-widest uppercase">Revenue Intelligence <span class="text-green-500 text-xs ml-2">Phase H</span></h3>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="loadRevenueData()" class="text-xs px-3 py-1.5 rounded border border-green-800/50 text-green-600 hover:bg-green-900/20 hover:border-green-600 font-mono transition">⟳ Refresh</button>
                            <button onclick="getAIBoost()" id="btn-ai-boost" class="text-xs px-3 py-1.5 rounded border border-amber-700/40 text-amber-600 hover:bg-amber-900/20 hover:border-amber-500 font-mono transition">⚡ AI Boost</button>
                        </div>
                    </div>

                    <!-- KPI Cards -->
                    <div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6" id="revenue-kpi-grid">
                        <div class="bg-gray-800/60 border border-gray-700 rounded-xl p-4 animate-pulse">
                            <p class="text-gray-600 text-[10px] font-mono">Loading...</p>
                        </div>
                    </div>

                    <!-- AI Boost Banner -->
                    <div id="ai-boost-banner" class="hidden mb-6 bg-gradient-to-r from-amber-950/40 to-gray-900 border border-amber-800/40 rounded-xl p-4">
                        <div class="flex items-start gap-3">
                            <span class="text-amber-500 text-xl shrink-0">⚡</span>
                            <div>
                                <p class="text-[9px] uppercase tracking-widest text-amber-700 font-mono mb-1">AI Revenue Intelligence</p>
                                <p id="ai-boost-text" class="text-sm text-gray-300 leading-relaxed"></p>
                                <p id="ai-boost-meta" class="text-[10px] text-green-500 font-mono mt-2"></p>
                            </div>
                        </div>
                    </div>

                    <!-- Churn Radar -->
                    <div class="bg-gray-800/40 border border-gray-700 rounded-xl p-5">
                        <div class="flex items-center gap-2 mb-4">
                            <span class="text-red-500">⚠</span>
                            <h4 class="text-sm text-white font-medium">Churn Radar <span class="text-[10px] text-gray-500 font-normal ml-2">60+ gün gelmeyenler</span></h4>
                        </div>
                        <div id="churn-table" class="space-y-2 text-sm">
                            <p class="text-gray-700 font-mono text-xs animate-pulse">Scanning churn signals...</p>
                        </div>
                    </div>

                    <!-- ══════════════════════════════════════════════════════ -->
                    <!-- PHASE N: EXECUTIVE PULSE DASHBOARD                    -->
                    <!-- ══════════════════════════════════════════════════════ -->

                    <!-- 1. NEURAL PULSE STREAM -->
                    <div class="mt-6 rounded-xl border border-gray-800/60 bg-gray-950/60 backdrop-blur-sm overflow-hidden">
                        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-800/40">
                            <div class="flex items-center gap-2">
                                <span class="relative flex h-2 w-2">
                                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <h3 class="text-xs font-semibold text-gray-300 tracking-widest uppercase">Neural Pulse Stream <span class="text-emerald-500 ml-2">Phase N</span></h3>
                            </div>
                            <button onclick="clearNeural()" class="text-xs text-gray-600 hover:text-gray-400 font-mono transition">⌫ clear</button>
                        </div>
                        <div id="neural-stream" class="font-mono text-xs p-3 space-y-1 max-h-36 overflow-y-auto scrollbar-thin"
                             style="background:linear-gradient(180deg,#0a0f0a 0%,#060a06 100%);">
                            <p class="text-gray-700 animate-pulse">Listening for intelligence signals...</p>
                        </div>
                    </div>

                    <!-- 2. DNA RADAR + MULTIPLIER PULSE ROW -->
                    <div class="mt-4 grid grid-cols-2 gap-4">

                        <!-- DNA RADAR CHART -->
                        <div class="rounded-xl border border-violet-900/40 bg-gray-950/60 p-4">
                            <h3 class="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-3">
                                Psychographic Radar <span class="text-violet-500 ml-2">Live DNA</span>
                            </h3>
                            <canvas id="dna-radar" height="180"></canvas>
                        </div>

                        <!-- MULTIPLIER GAUGE -->
                        <div id="multiplier-card" class="relative rounded-xl border border-amber-900/30 bg-gray-950/60 p-4 flex flex-col items-center justify-center transition-all duration-700" style="overflow:hidden;">
                            <div id="multiplier-glow" class="absolute inset-0 pointer-events-none" style="border-radius:0.75rem;transition:box-shadow 1s ease;"></div>
                            <p class="text-xs text-gray-500 uppercase tracking-widest mb-2">Demand Multiplier</p>
                            <p id="multiplier-value" class="text-5xl font-black tracking-tight text-amber-400 transition-all duration-700">1.35<span class="text-xl text-gray-600">×</span></p>
                            <p id="multiplier-status" class="mt-2 text-xs font-semibold tracking-widest text-gray-500">STABLE</p>
                            <div class="mt-3 w-full bg-gray-800 rounded-full h-1.5">
                                <div id="multiplier-bar" class="h-1.5 rounded-full transition-all duration-700" style="width:54%;background:linear-gradient(90deg,#d97706,#f59e0b);"></div>
                            </div>
                            <p class="text-xs text-gray-700 mt-1 font-mono">range 1.0× — 2.5×</p>
                        </div>

                    </div>

                    <!-- PHASE K: DNA MATRIX PANEL -->
                    <div class="mt-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center gap-3">
                                <div class="h-2 w-2 rounded-full bg-violet-500 animate-pulse"></div>
                                <h3 class="text-sm font-semibold text-white tracking-widest uppercase">Guest DNA Matrix <span class="text-violet-500 text-xs ml-2">Phase K</span></h3>
                            </div>
                            <div class="flex gap-2">
                                <button onclick="loadDNA(false)" class="text-xs px-3 py-1.5 rounded border border-violet-800/50 text-violet-500 hover:bg-violet-900/20 hover:border-violet-500 font-mono transition">⟳ Scan</button>
                                <button onclick="loadDNA(true)" id="btn-dna-ai" class="text-xs px-3 py-1.5 rounded border border-amber-700/40 text-amber-600 hover:bg-amber-900/20 hover:border-amber-500 font-mono transition">✦ AI Labels</button>
                                <a href="/index.html?lang=tr" target="_blank" id="btn-exec-report"
                                   class="relative text-xs px-3 py-1.5 rounded font-mono transition flex items-center gap-1"
                                   style="border:1px solid #C9A96E55; color:#C9A96E; background:linear-gradient(135deg,#1a140800,#C9A96E18); overflow:hidden;"
                                   onmouseover="this.style.background='linear-gradient(135deg,#C9A96E22,#C9A96E33)'"
                                   onmouseout="this.style.background='linear-gradient(135deg,#1a140800,#C9A96E18)'"
                                   onclick="pushNeural('Phase R ∷ Executive Briefing PDF generating...','info')">
                                    ↓ <span style="letter-spacing:0.05em">EXECUTIVE BRIEFING</span>
                                </a>
                            </div>
                        </div>

                        <!-- Cluster Summary Bar -->
                        <div id="dna-cluster-bar" class="grid grid-cols-4 gap-3 mb-5 hidden">
                            <!-- filled by JS -->
                        </div>

                        <!-- DNA Cards Grid -->
                        <div id="dna-cards-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            <div class="col-span-3 text-center py-8 text-gray-700 text-xs font-mono">
                                Press ⟳ Scan to analyze guest DNA...
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    </div>

    

    <!-- BABA YAGA PROTOCOL ENGINE -->
    

        </div>
    `;
    }

    async mount() {
        console.log("🟢 [Master Hub] Class Mount Initiated...");
        const signal = this.abortController.signal;

        // Subscribe to Core State Engine
        this.engine.subscribe('revenue', (val) => {
            if (!this.isAlive()) return; // Dead Module Protection
            const revEl = document.getElementById('stat-revenue');
            if (revEl && val) revEl.innerText = `€${Number(val).toLocaleString()}`;
        });
        
        this.engine.subscribe('activeNodes', (val) => {
            if (!this.isAlive()) return; // Dead Module Protection
            const nodesEl = document.getElementById('stat-hotels');
            if (nodesEl && val) nodesEl.innerHTML = `${val} <span class="text-sm font-normal text-gray-500">/ 20</span>`;
        });

        this.setupLocalListeners(signal);
        this.initMatrixCanvas(signal);
        await this.loadDependencies();

        // Ignite logic
        setTimeout(() => this.igniteLegacyHub(signal), 100);
    }

    unmount() {
        console.log("🔴 [Master Hub] Class Unmount... Executing Memory Wipe.");
        
        // D3, Echarts Cleanup
        this.activeEcharts.forEach(elId => {
            const el = document.getElementById(elId);
            if (el && window.echarts) {
                const chart = window.echarts.getInstanceByDom(el);
                if (chart) chart.dispose();
            }
        });
        this.activeEcharts = [];

        if (this.rainInterval) clearInterval(this.rainInterval);

        const canvas = document.getElementById('matrix-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    // Private helpers
    setupLocalListeners(signal) {
        const dragHandle = document.getElementById('sidebar-drag-handle');
        const sidebar = document.getElementById('admin-sidebar');
        
        if (dragHandle && sidebar) {
            let isResizing = false;
            dragHandle.addEventListener('mousedown', (e) => {
                isResizing = true;
                document.body.style.cursor = 'col-resize';
                e.preventDefault();
            }, { signal });
            
            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                let newWidth = e.clientX;
                if (newWidth < 240) newWidth = 240;
                if (newWidth > 600) newWidth = 600;
                sidebar.classList.remove('w-64');
                sidebar.style.width = `${newWidth}px`;
            }, { signal });
            
            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;
                    document.body.style.cursor = 'default';
                }
            }, { signal });
        }

        // Bind buttons
        window.devTrigger = action => console.log("Dev Trigger:", action);
        window.devStandDown = () => console.log("Dev Stand Down");
        window.devMockBooking = () => console.log("Mock Booking Initiated");
        window.openShadowRitualsModal = () => document.getElementById('shadow-rituals-modal')?.classList.remove('hidden');
        window.closeShadowRitualsModal = () => document.getElementById('shadow-rituals-modal')?.classList.add('hidden');
    }

    initMatrixCanvas(signal) {
        const canvas = document.getElementById('matrix-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const chars = "SANTIS01SOVEREIGN01V7".split("");
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops = Array(Math.floor(columns)).fill(1);
        
        const draw = () => {
            ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#0F0";
            ctx.font = fontSize + "px monospace";

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
            this.canvasAnimation = requestAnimationFrame(draw);
        };

        signal.addEventListener('abort', () => {
            cancelAnimationFrame(this.canvasAnimation);
        });
        
        draw();
    }

    async loadDependencies() {
        const loadScript = (src) => new Promise(resolve => {
            if (document.querySelector(`script[src="${src}"]`)) return resolve();
            const s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.crossOrigin = "anonymous";
            document.head.appendChild(s);
        });

        try {
            await Promise.all([
                loadScript("/assets/vendor/d3.v7.min.js"),
                loadScript("/assets/vendor/echarts.min.js")
            ]);
        } catch(e) {
            console.warn("Dependencies failed to load in hub", e);
        }
    }

    igniteLegacyHub(signal) {
        // Setup initial Echarts if needed
        setTimeout(() => {
            if(window.echarts && document.getElementById('dna-radar')) {
                // Simplified mock for legacy setup
                console.log("[Master Hub] Legacy ignite bypassed to let React / other modules handle graph, this is pure shell now.");
            }
        }, 500);
    }
}
