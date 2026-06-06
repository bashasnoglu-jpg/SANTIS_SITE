const SANTIS_ROUTE_REGISTRY = {
    PUBLIC_PAGES: [
        { name: "Ana Sayfa", path: "/index.html" },
        { name: "Spa Rezervasyon", path: "/spa-booking.html" },
        { name: "Spa Menü", path: "/spa-menu.html" },
        { name: "Ritüeller", path: "/ritueller.html" },
        { name: "Hamam", path: "/hamam.html" },
        { name: "Hakkımızda", path: "/hakkimizda.html" },
        { name: "İletişim", path: "/iletisim.html" },
        { name: "Katalog", path: "/katalog.html" }
    ],
    ADMIN_PAGES: [

        { name: "Sovereign Terminal", path: "/sovereign-terminal.html" },
        { name: "UI/UX Lab", path: "/sovereign-ui-lab.html" },
        { name: "Santis World", path: "/santis-world.html" },
        { name: "Vercel Admin Panel", path: "/admin/index.html" }
    ],
    API_ENDPOINTS: [
        { name: "Availability Check", path: "/api/v1/availability", method: "POST" },
        { name: "Booking Hold", path: "/api/v1/scheduling/booking/hold", method: "POST" },
        { name: "Checkout Session", path: "/api/v1/checkout-session", method: "POST" },
        { name: "Aurelia Whisper", path: "/api/v1/whisper", method: "POST" },
        { name: "Telemetry Beacon", path: "/api/v1/telemetry/beacon", method: "POST" },
        { name: "Health Check", path: "/api/v1/health", method: "GET" },
        { name: "Memory Nodes", path: "/api/v1/nodes", method: "GET" }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    const registryContainer = document.getElementById('santis-route-registry-console');
    if (!registryContainer) return;

    let html = `
    <div class="p-6">
        <h3 class="text-white font-serif text-xl border-b border-white/5 pb-4 mb-6 flex justify-between items-center">
            SANTIS OS - ROUTE CONSOLE
            <span class="text-[10px] text-santisGold font-mono uppercase tracking-widest">Global Navigation</span>
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    `;
    
    // Public Pages
    html += `<div>
        <h4 class="text-santisEmerald text-[10px] font-medium mb-4 uppercase tracking-widest flex items-center gap-2">
            <div class="w-1.5 h-1.5 rounded-full bg-santisEmerald"></div>
            Public Pages
        </h4>
        <ul class="space-y-3">`;
    SANTIS_ROUTE_REGISTRY.PUBLIC_PAGES.forEach(route => {
        html += `<li>
            <a href="${route.path}" target="_blank" rel="noopener" class="group flex flex-col hover:bg-white/5 p-2 rounded transition-colors duration-300">
                <span class="text-sm text-gray-300 group-hover:text-white transition-colors">${route.name}</span>
                <span class="text-[10px] text-gray-500 font-mono tracking-tighter">${route.path}</span>
            </a>
        </li>`;
    });
    html += `</ul></div>`;

    // Admin Pages
    html += `<div>
        <h4 class="text-santisGold text-[10px] font-medium mb-4 uppercase tracking-widest flex items-center gap-2">
            <div class="w-1.5 h-1.5 rounded-full bg-santisGold"></div>
            Admin Pages
        </h4>
        <ul class="space-y-3">`;
    SANTIS_ROUTE_REGISTRY.ADMIN_PAGES.forEach(route => {
        html += `<li>
            <a href="${route.path}" target="_blank" rel="noopener" class="group flex flex-col hover:bg-white/5 p-2 rounded transition-colors duration-300">
                <span class="text-sm text-gray-300 group-hover:text-white transition-colors">${route.name}</span>
                <span class="text-[10px] text-gray-500 font-mono tracking-tighter">${route.path}</span>
            </a>
        </li>`;
    });
    html += `</ul></div>`;

    // API Endpoints
    html += `<div>
        <h4 class="text-cyber-muted text-[10px] font-medium mb-4 uppercase tracking-widest flex items-center gap-2 text-gray-400">
            <div class="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
            API Endpoints
        </h4>
        <ul class="space-y-3">`;
    SANTIS_ROUTE_REGISTRY.API_ENDPOINTS.forEach(route => {
        const methodColor = route.method === 'POST' ? 'text-santisEmerald' : 'text-santisGold';
        html += `<li class="flex flex-col p-2 hover:bg-white/5 rounded transition-colors duration-300">
            <div class="flex items-center gap-2 mb-1">
                <span class="text-[9px] font-bold ${methodColor} bg-white/5 px-1.5 py-0.5 rounded uppercase tracking-widest border border-white/5">${route.method}</span>
                <span class="text-sm text-gray-300">${route.name}</span>
            </div>
            <span class="text-[10px] text-gray-500 font-mono tracking-tighter">${route.path}</span>
        </li>`;
    });
    html += `</ul></div>`;

    html += `</div></div>`;

    registryContainer.innerHTML = html;
});
