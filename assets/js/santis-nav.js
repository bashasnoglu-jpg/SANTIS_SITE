/**
 * SANTIS NAVIGATION MODULE
 * Extracted from app.js for modularity.
 */

function getNavModel() {
    return CONTENT?.global?.navModel && Array.isArray(CONTENT.global.navModel)
        ? CONTENT.global.navModel
        : (window.NAV_MODEL || []);
}

function buildPrefix() {
    return "";
}

function buildUrl(routeKey, sectionKey) {
    if (window.DEMO_MODE) {
        return "#" + (sectionKey || routeKey);
    }

    const routes = CONTENT?.global?.routes || {};
    if (routes[routeKey]) return buildPrefix() + routes[routeKey];

    // Dynamic Routing (Query Params)
    if (sectionKey === 'booking') return "?section=booking";
    return "?view=" + routeKey;
}

function scrollToSection(sectionKey) {
    const target = document.querySelector(`[data-section="${sectionKey}"]`) || document.getElementById(sectionKey);
    if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function scrollToId(id) {
    scrollToSection(id);
}

function setActiveCategoryFromRoute(routeKey) {
    const map = {
        hammam: "hammam",
        massages: "",
        classic: "classicMassages",
        sports: "sportsTherapy",
        asian: "asianMassages",
        ayurveda: "ayurveda",
        signature: "signatureCouples",
        kids: "kidsFamily",
        face: "faceSothys",
        products: "products"
    };

    const nextCat = map[routeKey];
    const catId = (nextCat !== undefined) ? nextCat : routeKey;

    if (!catId) return false;

    state.activeCategoryId = catId;
    return true;
}

function handleNavDemoClick(item) {
    if (item.categoryId) {
        state.activeCategoryId = item.categoryId;
        if (typeof renderCategoryToolbar === "function") renderCategoryToolbar();
        if (typeof renderCategories === "function") renderCategories();
        if (typeof renderServiceResults === "function") renderServiceResults();
    }
    const target = item.sectionKey || item.route;
    scrollToSection(target);
    history.replaceState(null, "", "#" + target);
}

/* Render Nav (New Version) */
function renderNav() {
    const root = document.getElementById("navRoot");
    if (!root) return;

    root.innerHTML = "";

    const model = getNavModel();

    for (const item of model) {
        if (item.enabled === false) continue;

        const div = document.createElement("div");
        const hasChildren = Array.isArray(item.children) && item.children.length > 0;
        div.className = "nav-item" + (hasChildren ? " has-sub" : "");

        const a = document.createElement("a");
        a.className = "nav-link";

        const sectionKey = item.sectionKey || item.route;
        a.href = buildUrl(item.route, sectionKey);
        a.textContent = t(`nav.${item.key}`) || item.label || item.key;

        if (window.DEMO_MODE) {
            a.onclick = (e) => {
                e.preventDefault();
                handleNavDemoClick(item);
            };
        }

        div.appendChild(a);

        if (hasChildren) {
            const menu = document.createElement("div");
            menu.className = "submenu";

            for (const ch of item.children) {
                const ca = document.createElement("a");
                const chSectionKey = ch.sectionKey || ch.route;
                ca.href = buildUrl(ch.route, chSectionKey);
                ca.textContent = t(`nav.${ch.key}`) || ch.label || ch.key;

                if (window.DEMO_MODE) {
                    ca.onclick = (e) => {
                        e.preventDefault();
                        handleNavDemoClick(ch);
                    };
                }
                menu.appendChild(ca);
            }
            div.appendChild(menu);
        }
        root.appendChild(div);
    }

    // CTA
    const cta = document.getElementById("ctaBooking");
    if (cta) {
        cta.textContent = t("nav.bookingWhatsapp");
        const ctaSectionKey = "booking";
        cta.href = buildUrl("booking", ctaSectionKey);

        if (window.DEMO_MODE) {
            cta.onclick = (e) => {
                e.preventDefault();
                scrollToSection(ctaSectionKey);
                openBookingModal();
            };
        }
    }
}
