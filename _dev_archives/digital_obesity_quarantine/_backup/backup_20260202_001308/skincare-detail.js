// assets/js/skincare-detail.js
// SANTIS — Skincare Detail UI

(function () {
  const $ = (id) => document.getElementById(id);

  const safe = (v) => String(v ?? "");
  const priceLabel = (price) => {
    if (typeof window.SANTIS_SKINCARE_PRICE_LABEL === "function") return window.SANTIS_SKINCARE_PRICE_LABEL(price);
    return !price ? "Fiyat sorunuz" : `${price}€`;
  };

  function getIdFromUrl() {
    const url = new URL(window.location.href);
    return url.searchParams.get("id");
  }

  function findItem(id) {
    const all = Array.isArray(window.SANTIS_SKINCARE) ? window.SANTIS_SKINCARE : [];
    return all.find((x) => x.id === id) || null;
  }

  function renderNotFound() {
    const root = $("nvDetail");
    if (!root) return;
    root.innerHTML = `
      <div class="santis-empty">
        Program bulunamadı. <a href="index.html">Listeye dön</a>
      </div>
    `;
  }

  function renderDetail(x) {
    const root = $("nvDetail");
    if (!root) return;

    root.innerHTML = `
      <a class="santis-back" href="index.html">← Geri</a>

      <div class="santis-hero">
        <img src="${x.img}" alt="${safe(x.title)}" />
      </div>

      <div class="santis-detailCard">
        <div class="santis-detailTop">
          <h1 class="santis-detailTitle">${safe(x.title)}</h1>
          <div class="santis-detailMeta">
            <span class="santis-pill">${safe(x.tier)}</span>
            <span class="santis-pill">${safe(x.duration)}</span>
          </div>
        </div>

        <p class="santis-detailDesc">${safe(x.desc)}</p>

        <div class="santis-detailRow">
          <div class="santis-price">${priceLabel(x.price)}</div>
          <a class="santis-cta" href="../iletisim/index.html">Randevu / Bilgi Al</a>
        </div>
      </div>
    `;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const id = getIdFromUrl();
    if (!id || !window.SANTIS_SKINCARE) return renderNotFound();

    const item = findItem(id);
    if (!item) return renderNotFound();

    // title update
    document.title = `${item.title} | Cilt Bakımı`;

    renderDetail(item);
  });
})();
