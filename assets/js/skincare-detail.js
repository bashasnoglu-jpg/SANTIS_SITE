// assets/js/skincare-detail.js
// SANTIS — Skincare Detail UI

(function () {
  const $ = (id) => document.getElementById(id);

  const safe = (v) => String(v ?? "");
  const priceLabel = (price) => {
    if (typeof window.NV_SKINCARE_PRICE_LABEL === "function") return window.NV_SKINCARE_PRICE_LABEL(price);
    return !price ? "Fiyat sorunuz" : `${price}€`;
  };

  function getIdFromUrl() {
    const url = new URL(window.location.href);
    return url.searchParams.get("id");
  }

  function findItem(id) {
    const all = Array.isArray(window.NV_SKINCARE) ? window.NV_SKINCARE : [];
    return all.find((x) => x.id === id) || null;
  }

  function renderNotFound() {
    const root = $("nvDetail");
    if (!root) return;
    root.innerHTML = `
      <div class="nv-empty">
        Program bulunamadı. <a href="index.html">Listeye dön</a>
      </div>
    `;
  }

  function renderDetail(x) {
    const root = $("nvDetail");
    if (!root) return;

    root.innerHTML = `
      <a class="nv-back" href="index.html">← Geri</a>

      <div class="nv-hero">
        <img src="${x.img}" alt="${safe(x.title)}" />
      </div>

      <div class="nv-detailCard">
        <div class="nv-detailTop">
          <h1 class="nv-detailTitle">${safe(x.title)}</h1>
          <div class="nv-detailMeta">
            <span class="nv-pill">${safe(x.tier)}</span>
            <span class="nv-pill">${safe(x.duration)}</span>
          </div>
        </div>

        <p class="nv-detailDesc">${safe(x.desc)}</p>

        <div class="nv-detailRow">
          <div class="nv-price">${priceLabel(x.price)}</div>
          <a class="nv-cta" href="../iletisim/index.html">Randevu / Bilgi Al</a>
        </div>
      </div>
    `;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const id = getIdFromUrl();
    if (!id || !window.NV_SKINCARE) return renderNotFound();

    const item = findItem(id);
    if (!item) return renderNotFound();

    // title update
    document.title = `${item.title} | Cilt Bakımı`;

    renderDetail(item);
  });
})();
