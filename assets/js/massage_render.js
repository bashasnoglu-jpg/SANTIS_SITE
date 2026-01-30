// assets/js/massage_render.js
(function () {
  if (window.__NV_MASSAGE_LIST_INIT__) return;
  window.__NV_MASSAGE_LIST_INIT__ = true;

  // Kategori tanımları ve "Chapter" bilgileri
  const SECTIONS = [
    { id: "classicMassages", label: "Classic Rituals", num: "I", desc: "Zamanın ötesinde, klasik dokunuşlarla bedeni ve ruhu dengeleyen temel ritüeller." },
    { id: "sportsTherapy", label: "Therapy & Sports", num: "II", desc: "Derin doku, kas yenilenmesi ve performans odaklı, hedefe yönelik terapiler." },
    { id: "asianMassages", label: "Asian Wisdom", num: "III", desc: "Doğunun kadim bilgeliği, enerji akışı ve bütünsel şifa sanatları." },
    { id: "ayurveda", label: "Ayurvedic Journey", num: "IV", desc: "Yaşam bilimi Ayurveda ile bedensel ve zihinsel dengenin (Dosha) yeniden keşfi." }
  ];

  function byCategory(list) {
    const map = {};
    list.forEach(item => {
      (map[item.category] ||= []).push(item);
    });
    return map;
  }

  // THE VOGUE CARD TEMPLATE (Reused)
  function vogueCardHTML(item) {
    const href = `/tr/massage.html?id=${encodeURIComponent(item.id)}#${encodeURIComponent(item.category)}`;
    return `
      <article class="nv-vogue-card" onclick="window.location.href='${href}'">
        <img src="${item.img}" alt="${item.title}" class="nv-vogue-img" loading="lazy" decoding="async">
        <div class="nv-vogue-overlay"></div>
        <span class="nv-vogue-tier">${item.tier}</span>
        <span class="nv-vogue-duration">${item.duration}</span>
        <div class="nv-vogue-content">
          <h3 class="nv-vogue-title">${item.title}</h3>
          <p class="nv-vogue-desc">${item.desc}</p>
        </div>
      </article>
    `;
  }

  function renderSmartTabs() {
    const root = document.getElementById("massageGrid");
    if (!root) return;

    const list = Array.isArray(window.NV_MASSAGES) ? window.NV_MASSAGES : [];
    const grouped = byCategory(list);

    // 1. Render Tab Buttons
    const tabsHTML = `
            <div class="nv-smart-tabs-container">
                <div class="nv-smart-tabs">
                    <button class="nv-tab-btn active" onclick="filterTab('all')">TÜM RİTÜELLER</button>
                    ${SECTIONS.map(sec => `
                        <button class="nv-tab-btn" onclick="filterTab('${sec.id}')">${sec.label.toUpperCase()}</button>
                    `).join('')}
                </div>
            </div>
        `;

    // 2. Render Content Grids (Hidden by default, except All if we want, or just filter logic)
    // Simplest: Just one grid container that repopulates, OR pre-render all divs and toggle visibility.
    // Let's use PRE-RENDER for instant switching (smooth UX).

    const contentHTML = `
            <div id="tab-content-wrapper" style="min-height:600px;">
                <!-- ALL -->
                <div class="nv-tab-content active" id="tab-all">
                   <div class="nv-tab-grid">
                      ${list.map(vogueCardHTML).join('')}
                   </div>
                </div>

                <!-- SECTIONS -->
                ${SECTIONS.map(sec => `
                    <div class="nv-tab-content" id="tab-${sec.id}">
                        <div class="nv-tab-grid">
                            ${(grouped[sec.id] || []).map(vogueCardHTML).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

    root.innerHTML = tabsHTML + contentHTML;

    // Global function for tab switching
    window.filterTab = function (catId) {
      // Update Buttons
      document.querySelectorAll('.nv-tab-btn').forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active'); // Assumes onclick event passed

      // Update Content
      document.querySelectorAll('.nv-tab-content').forEach(div => div.classList.remove('active'));
      document.getElementById(`tab-${catId}`).classList.add('active');

      // Optional: Scroll to top of grid
      // window.scrollTo({ top: document.getElementById('massageGrid').offsetTop - 100, behavior: 'smooth' });
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderSmartTabs);
  } else {
    renderSmartTabs();
  }
})();
