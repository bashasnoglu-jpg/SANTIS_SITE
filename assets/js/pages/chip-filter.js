// 🧠 Santis Filter Engine v2.0 (Deterministic & Safe)

const CATEGORY_MAP = {
  "sothys-purifying": ["skincare", "purify"],
  "sothys-antiage": ["skincare", "antiage"],
  "sothys-men": ["skincare", "men"]
};

function normalize(val) {
  return (val || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}

function matchesFilter(item, filterKey) {
  const normalizedCategory = normalize(item.category);
  const normalizedTags = (item.tags || []).map(normalize);

  const allowed = CATEGORY_MAP[filterKey];

  if (!allowed) {
    // fallback: direkt eşleşme
    return normalizedCategory === filterKey;
  }

  return (
    allowed.includes(normalizedCategory) ||
    normalizedTags.some(tag => allowed.includes(tag))
  );
}

function applyFilter(data, filterKey) {
  if (!Array.isArray(data)) return [];

  const filtered = data.filter(item => matchesFilter(item, filterKey));

  console.log(`🔮 [Filter Engine v2] ${filterKey} → ${filtered.length}/${data.length}`);

  // ⚠️ UX FAILSAFE
  if (filtered.length === 0) {
    console.warn("⚠️ Boş sonuç! Fallback devrede...");
    return data.slice(0, 4); // ilk 4 kartı göster
  }

  return filtered;
}

// duplicate bind engelle
if (!window.__CHIP_FILTER_BOUND__) {
  window.__CHIP_FILTER_BOUND__ = true;

  document.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-filter]");
    if (!chip) return;

    // Aktif sınıfı yeniden dağıt
    document.querySelectorAll(".santis-chip").forEach(c => c.classList.remove("is-active"));
    chip.classList.add("is-active");

    const filterKey = chip.dataset.filter;
    window.dispatchEvent(new CustomEvent("santis:filter", { detail: filterKey }));
  });
}

/* ─── V44 QUANTUM GLARE: Filtre Çiplerinde Fare Takibi ─── */
if (!window.__CHIP_GLARE_BOUND__) {
  window.__CHIP_GLARE_BOUND__ = true;

  // Delegate: tüm .santis-chip'leri body üzerinden izle (yeni eklenenler de dahil)
  document.addEventListener("mousemove", (e) => {
    const chip = e.target.closest(".santis-chip");
    if (!chip) return;

    const rect = chip.getBoundingClientRect();
    // Farenin chip içindeki yüzde koordinatları
    const cx = ((e.clientX - rect.left) / rect.width)  * 100;
    const cy = ((e.clientY - rect.top)  / rect.height) * 100;

    chip.style.setProperty("--cx", `${cx}%`);
    chip.style.setProperty("--cy", `${cy}%`);
  });
}
