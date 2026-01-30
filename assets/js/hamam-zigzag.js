
(() => {
  // Not: Bu data’yı tr/hamam.html içindeki mevcut kartlardan üret (başlık/süre/fiyat/tag).
  // Görseller Unsplash üzerinden çekilmektedir.
  const rituals = [
    {
      title: "Osmanlı Ritüeli",
      tag: "CLASSIC",
      duration: "45 DK",
      price: "75€",
      excerpt: "Sıcak taş, kese ve köpükle arınmayı yavaşlatan; bedeni ritme sokan klasik Osmanlı akışı.",
      img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800&auto=format&fit=crop",
      detailHref: "tr/hammam/ottoman-hammam-tradition.html",
      waHref: "#nv-wa",
      wa: true,
      pack: "hamam",
      tier: "classic"
    },
    {
      title: "Klasik Kese & Köpük",
      tag: "PURIFY",
      duration: "30 DK",
      price: "50€",
      excerpt: "Derin temizlik, canlı dolaşım ve yumuşak bir bitiş: hızlı ama tam bir ‘reset’.",
      img: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800&auto=format&fit=crop",
      detailHref: "tr/hammam/peeling-foam-massage.html",
      waHref: "#nv-wa",
      wa: true,
      pack: "hamam",
      tier: "signature"
    },
    {
      title: "Köpük Balonu",
      tag: "DETOX",
      duration: "30 DK",
      price: "55€",
      excerpt: "Köpüğün ağırlıksız dokusu: sinir sistemini sakinleştiren, nefesi açan yumuşak bir ritüel.",
      img: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=800&auto=format&fit=crop",
      detailHref: "tr/hammam/foam-massage.html",
      waHref: "#nv-wa",
      wa: true,
      pack: "hamam",
      tier: "deluxe"
    },
    {
      title: "Private Hammam",
      tag: "PREMIUM",
      duration: "60 DK",
      price: "120€",
      excerpt: "Daha uzun, daha kişisel, daha sessiz: ritüelin premium yorumu; acele etmeden.",
      img: "https://images.unsplash.com/photo-1552693673-1bf958298935?q=80&w=800&auto=format&fit=crop",
      detailHref: "#", // Assuming private hammam might be a different page or section
      waHref: "#nv-wa",
      wa: true,
      pack: "hamam",
      tier: "premium"
    },
    {
      title: "Kahve Peeling",
      tag: "ENERGIZE",
      duration: "30 DK",
      price: "50€",
      excerpt: "Türk kahvesi telvesi ile yapılan peeling. Kan dolaşımını hızlandırır.",
      img: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?q=80&w=800&auto=format&fit=crop",
      detailHref: "tr/hammam/coffee-peeling.html",
      waHref: "#nv-wa",
      wa: true,
      pack: "hamam",
      tier: "energize"
    },
    {
      title: "Bal Ritüeli",
      tag: "COMFORT",
      duration: "30 DK",
      price: "55€",
      excerpt: "Doğal balın cilde sürülmesi ve sıcak göbek taşında emilimin sağlanması.",
      img: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=800&auto=format&fit=crop",
      detailHref: "tr/hammam/honey-ritual.html",
      waHref: "#nv-wa",
      wa: true,
      pack: "hamam",
      tier: "comfort"
    },
    {
      title: "Çikolata Ritüeli",
      tag: "INDULGENCE",
      duration: "30 DK",
      price: "55€",
      excerpt: "Kakao yağı ve çikolata içeren özel karışımla yapılan tatlı bir bakım.",
      img: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=800&auto=format&fit=crop",
      detailHref: "tr/hammam/chocolate-ritual.html",
      waHref: "#nv-wa",
      wa: true,
      pack: "hamam",
      tier: "seasonal"
    },
    {
      title: "Yosun (Alg) Ritüeli",
      tag: "DETOX",
      duration: "30 DK",
      price: "55€",
      excerpt: "Mikronize yosun tozu ile yapılan vücut maskesi. Metabolizmayı hızlandırır.",
      img: "https://images.unsplash.com/photo-1591343395082-e21b64b55d4b?q=80&w=800&auto=format&fit=crop",
      detailHref: "tr/hammam/algae-ritual.html",
      waHref: "#nv-wa",
      wa: true,
      pack: "hamam",
      tier: "detox"
    },
    {
      title: "Jet Lag Recovery",
      tag: "RECOVERY",
      duration: "50 DK",
      price: "70€",
      excerpt: "Okaliptüs ve sıcak taş ile seyahat yorgunluğunu atan özel ritüel.",
      img: "https://images.unsplash.com/photo-1574680096141-1cddd32e04ca?q=80&w=800&auto=format&fit=crop",
      detailHref: "tr/hammam/jet-lag-recovery.html",
      waHref: "#nv-wa",
      wa: true,
      pack: "hamam",
      tier: "recovery"
    }
  ];

  const elDiscover = document.getElementById("nv-hamam-discover");
  const elZigzag = document.getElementById("nv-hamam-zigzag");

  if (elDiscover) {
    const top = rituals.slice(0, 6);
    elDiscover.innerHTML = top.map((r) => `
      <article class="nv-pin nv-grain">
        <a href="${r.detailHref}" aria-label="${r.title} detay sayfası">
          <img src="${r.img}" alt="${r.title}" loading="lazy" />
          <div class="nv-pin-meta">
            <h3 class="nv-pin-title">${r.title}</h3>
            <div class="nv-pin-sub">
              <span>${r.tag}</span>
              <span>${r.duration}</span>
              <span>${r.price}</span>
            </div>
          </div>
        </a>
      </article>
    `).join("");
  }

  if (elZigzag) {
    elZigzag.innerHTML = rituals.map((r, i) => `
      <article class="nv-z-item">
        <div class="nv-z-photo nv-grain">
          <img src="${r.img}" alt="${r.title}" loading="lazy" />
        </div>

        <div class="nv-z-body">
          <div class="nv-z-tag">${r.tag}</div>
          <h3 class="nv-z-title"><span>${r.title}</span></h3>
          <p class="nv-z-excerpt">${r.excerpt}</p>
          <div class="nv-z-meta">
            <span>${r.duration}</span>
            <span>${r.price}</span>
          </div>
          <div class="nv-z-cta">
            <a class="nv-z-link" href="${r.detailHref}">RİTÜELİ İNCELE</a>
            <a class="nv-z-link" href="${r.waHref}" data-wa="1" data-pack="${r.pack}" data-tier="${r.tier}">REZERVASYON (WHATSAPP)</a>
          </div>
        </div>
      </article>
    `).join("");
  }
})();
