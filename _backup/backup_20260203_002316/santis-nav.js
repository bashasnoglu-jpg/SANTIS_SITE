/**
 * SANTIS NAVIGATION MODULE v2.1
 * Standardized Header/Footer Injection with Defensive Pathing.
 */

function initNavAndFooter() {
    // Helper to load HTML
    async function loadComp(id, file) {
        // Prevent file:// protocol CORS issues if purely local without server
        if (window.location.protocol === "file:") return;

        const el = document.getElementById(id);
        if (!el) return;

        try {
            const res = await fetch(file);
            if (!res.ok) throw new Error(res.status);
            const text = await res.text();
            el.innerHTML = text; // Inject HTML

            // Re-evaluate scripts in injected HTML
            el.querySelectorAll("script").forEach(s => {
                const ns = document.createElement("script");
                Array.from(s.attributes).forEach(a => ns.setAttribute(a.name, a.value));
                ns.text = s.textContent;
                s.parentNode.replaceChild(ns, s);
            });

            // If navbar, init interactions
            if (id === 'navbar-container') {
                initNavbarInteractions();
            }

        } catch (e) {
            console.warn(`[Santis] Failed to load ${file}`, e);
        }
    }

    // Determine path based on depth (defensive pathing)
    const getPath = (file) => {
        if (window.SITE_ROOT) return window.SITE_ROOT + file;
        // Heuristic for root index
        const depth = window.location.pathname.split('/').length - 2;
        const prefix = depth > 0 ? "../".repeat(depth) : "";
        return prefix + file;
    };

    loadComp("navbar-container", getPath("components/navbar.html"));
    loadComp("footer-container", getPath("components/footer.html"));
}

function initNavbarInteractions() {
    // Wait for DOM injection
    setTimeout(() => {
        const ham = document.getElementById('hamburger');
        const menu = document.getElementById('mobileMenu');

        if (ham && menu) {
            // Remove old listeners to prevent duplicates (clone node)
            const newHam = ham.cloneNode(true);
            if (ham.parentNode) ham.parentNode.replaceChild(newHam, ham);

            newHam.addEventListener('click', () => {
                newHam.classList.toggle('active');
                menu.classList.toggle('active');
                document.body.classList.toggle('no-scroll');
            });

            // Close on link click
            menu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    newHam.classList.remove('active');
                    menu.classList.remove('active');
                    document.body.classList.remove('no-scroll');
                });
            });
        }

        // Refresh language switcher if exists
        if (window.SANTIS_LANG && window.SANTIS_LANG.refresh) {
            window.SANTIS_LANG.refresh();
        }

    }, 100);
}

// Auto-run on load
document.addEventListener("DOMContentLoaded", initNavAndFooter);
