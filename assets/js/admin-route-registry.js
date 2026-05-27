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
        { name: "Admin Dashboard", path: "/admin-dashboard.html" },
        { name: "HQ Dashboard", path: "/hq-dashboard.html" },
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

    let html = `<div style="padding: 20px; background: #111; color: #eee; border: 1px solid #333; border-radius: 8px; font-family: monospace;">`;
    html += `<h2 style="color: #d4af37; border-bottom: 1px solid #333; padding-bottom: 10px; margin-top: 0;">SANTIS OS - ROUTE CONSOLE</h2>`;
    
    // Public Pages
    html += `<h3 style="color: #10b981; margin-top: 20px;">Public Pages</h3><ul>`;
    SANTIS_ROUTE_REGISTRY.PUBLIC_PAGES.forEach(route => {
        html += `<li style="margin-bottom: 5px;"><a href="${route.path}" target="_blank" rel="noopener" style="color: #60a5fa; text-decoration: none;">${route.name} (${route.path})</a></li>`;
    });
    html += `</ul>`;

    // Admin Pages
    html += `<h3 style="color: #f59e0b; margin-top: 20px;">Admin Pages</h3><ul>`;
    SANTIS_ROUTE_REGISTRY.ADMIN_PAGES.forEach(route => {
        html += `<li style="margin-bottom: 5px;"><a href="${route.path}" target="_blank" rel="noopener" style="color: #60a5fa; text-decoration: none;">${route.name} (${route.path})</a></li>`;
    });
    html += `</ul>`;

    // API Endpoints
    html += `<h3 style="color: #ef4444; margin-top: 20px;">API Endpoints</h3><ul>`;
    SANTIS_ROUTE_REGISTRY.API_ENDPOINTS.forEach(route => {
        html += `<li style="margin-bottom: 5px; color: #9ca3af;">
            <strong style="color: #e5e5e5;">${route.method}</strong> ${route.path} <em style="font-size: 0.9em;">- ${route.name}</em>
        </li>`;
    });
    html += `</ul></div>`;

    registryContainer.innerHTML = html;
});
