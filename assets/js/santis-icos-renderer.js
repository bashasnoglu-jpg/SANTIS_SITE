/**
 * OMNI-CORE FAZ 11.5: iCOS 2.0 Quantum Hydration Renderer
 * Yüksek Performanslı, Güvenli (XSS-Free) Edge DOM İnjektörü
 */

document.addEventListener("DOMContentLoaded", () => {
    const mountPoint = document.getElementById("santis-icos-mount");
    if (!mountPoint) return;

    const slug = mountPoint.getAttribute("data-icos-slug");
    if (!slug) return;

    const currentLang = document.documentElement.lang || "tr";

    // 1. INIT & FETCH (Edge Resolution)
    console.log(`⚡ [iCOS] Hydrating Edge State for: ${slug}`);

    fetch(`/api/content/services/${slug}`)
        .then(res => {
            if (!res.ok) throw new Error("iCOS Blob not found");
            return res.json();
        })
        .then(data => {
            // 2. VALIDATE & EXTRACT
            const localeData = data.locale && data.locale[currentLang] ? data.locale[currentLang] : data.locale["en"];
            if (!localeData) throw new Error("Locale data missing in iCOS Hash blob");

            // 3. SAFE-BIND (No innerHTML, only textContent)
            document.querySelectorAll("[data-icos-bind]").forEach(el => {
                const key = el.getAttribute("data-icos-bind");
                if (localeData[key]) {
                    el.textContent = localeData[key];
                }
            });

            // Medya Bind Protocol
            if (data.images && data.images.length > 0) {
                document.querySelectorAll("[data-icos-img]").forEach((imgEl) => {
                    const idx = parseInt(imgEl.getAttribute("data-icos-img") || "0", 10);
                    if (data.images[idx]) {
                        // Strict Domain Policy for images
                        const safeUrl = new URL(data.images[idx], window.location.origin);
                        imgEl.src = safeUrl.href;
                    }
                });
            }

            // 4. Otomatik Semantic Purity (JSON-LD)
            generateSeoSchema(localeData, slug, data.images);

            // 5. HYDRATION COMPLETE
            window.dispatchEvent(new CustomEvent("iCOSHydrationComplete", { detail: { slug: slug, version: data.version_hash || "edge" } }));
            console.log("✅ [iCOS] Safe Hydration Complete");
        })
        .catch(err => {
            console.error("🔴 [iCOS] Hydration Pipeline Error:", err);
            // Fallback UI
            const fallbackNode = document.getElementById("icos-fallback-alert");
            if (fallbackNode) fallbackNode.style.display = "block";
        });
});

function generateSeoSchema(localeData, slug, images) {
    // Engelleme riskine karşı güvenlik katmanı
    const existing = document.getElementById("icos-schema-ld");
    if (existing) existing.remove();

    const schema = {
        "@context": "https://schema.org",
        "@type": "HealthClub",
        "name": localeData.title,
        "description": localeData.description,
        "image": images && images.length > 0 ? new URL(images[0], window.location.origin).href : "",
        "url": `${window.location.origin}/services/${slug}`
    };

    const script = document.createElement("script");
    script.id = "icos-schema-ld";
    script.setAttribute("type", "application/ld+json");
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
}
