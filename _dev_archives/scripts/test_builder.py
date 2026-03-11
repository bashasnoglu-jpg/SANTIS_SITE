import os

template_head = """<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Santis Club • Spa &amp; Wellness</title>
<meta content="Santis Club – Antalya'da özel lüks spa, hamam ritüelleri ve terapötik wellness deneyimi." name="description"/>
<link href="/assets/css/fonts.css" rel="stylesheet"/>
<!-- 🛡️ Phase 15.4: LCP Hero Preload -->
<link rel="preload" as="image" href="/assets/img/hero/santis_hero_main_v2.webp" fetchpriority="high"/>
<!-- FAANG Hack: Zero-RTT DNS Prefetch & HTTP/3 Preconnect (Protocol 27) -->
<link rel="dns-prefetch" href="https://fonts.googleapis.com">
<link rel="dns-prefetch" href="https://fonts.gstatic.com">
<link rel="preconnect" href="https://wa.me">
<link href="/manifest.json" rel="manifest"/>
<link href="/assets/img/icons/icon-192x192.webp" rel="apple-touch-icon"/>
<script defer="" src="/assets/js/perf-head.js"></script>
<script defer="" src="/assets/js/santis-vault.js"></script>
<script defer="" src="/assets/js/santis-v10-core.js"></script>
<script defer="" src="/assets/js/santis-event-bus.js"></script>
<script defer="" src="/assets/js/santis-graph-resolver.js"></script>
<script defer="" src="/assets/js/i18n-routes.js"></script>
<script defer="" src="/assets/js/loader.js"></script>
<script defer="" src="/assets/js/santis-nav.js"></script>
<link href="/assets/css/preloader-cinema.css" rel="stylesheet"/>
<link href="/assets/css/style.css" rel="stylesheet"/>
<link href="/assets/css/editorial.css" rel="stylesheet"/>
<link href="/assets/css/bento-grid.css" rel="stylesheet"/>
<link href="/assets/css/modules/cards.css" rel="stylesheet"/>
<link href="/assets/css/gallery.css" rel="stylesheet"/>
<link href="/assets/css/video-hero.css" rel="stylesheet"/>
<link href="/assets/css/hero-slider.css" rel="stylesheet"/>
<link href="/assets/css/modules/global-trends.css" rel="stylesheet"/>
<link href="/assets/css/concierge.css" rel="stylesheet"/>
<link href="/assets/css/modules/testimonials.css" rel="stylesheet"/>
<link href="/assets/css/modules/sticky-booking.css" rel="stylesheet"/>
<link href="/assets/css/modules/signature-cards.css" rel="stylesheet"/>
<link href="/assets/css/santis-soul.css" rel="stylesheet"/>
<script defer="" src="/assets/js/hero-slider.js"></script>
<meta content="/assets/img/og-standard.webp" property="og:image"/>
<link href="https://santis-club.com/tr/index.html" rel="canonical"/>
<meta content="Santis Club – Spa &amp; Wellness" property="og:title"/>
<meta content="Santis Club – Antalya'da özel lüks spa, hamam ritüelleri ve terapötik wellness deneyimi." property="og:description"/>
<meta content="https://santis-club.com/tr/index.html" property="og:url"/>
<meta content="website" property="og:type"/>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Service","name":"Index","provider":{"@type":"LocalBusiness","name":"Santis Club"}}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://santis-club.com/index.html"},{"@type":"ListItem","position":2,"name":"Ana Sayfa","item":"https://santis-club.com/tr/index.html"}]}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type": "Question", "name": "Masaj seansı ne kadar sürer?", "acceptedAnswer": {"@type": "Answer", "text": "Masaj seanslarımız 30 ile 90 dakika arasında sürer. Süre seçilen terapiye bağlıdır."}},{"@type": "Question", "name": "Masaj öncesi ne yapmalıyım?", "acceptedAnswer": {"@type": "Answer", "text": "Bir saat önce ağır yemek yememenizi ve bol su içmenizi öneririz. Lütfen 15 dakika erken gelin."}},{"@type": "Question", "name": "Bana hangi masaj türü uygun?", "acceptedAnswer": {"@type": "Answer", "text": "Terapistlerimiz ilk görüşmede ihtiyaçlarınızı değerlendirir ve en uygun masajı önerir."}}]}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"HealthAndBeautyBusiness","name":"Santis Club Spa & Wellness","url":"https://santis-club.com","telephone":"+905348350169","address":{"@type":"PostalAddress","streetAddress":"Çolaklı Mah.","addressLocality":"Manavgat","addressRegion":"Antalya","postalCode":"07600","addressCountry":"TR"},"geo":{"@type":"GeoCoordinates","latitude":"36.7633","longitude":"31.3864"},"priceRange":"€€€","openingHoursSpecification":{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],"opens":"09:00","closes":"22:00"}}</script>
<meta content="Santis Club" property="og:site_name"/><meta content="summary_large_image" name="twitter:card"/><meta content="Santis Club • Spa &amp; Wellness" name="twitter:title"/><meta content="Santis Club – Antalya'da özel lüks spa, hamam ritüelleri ve terapötik wellness deneyimi." name="twitter:description"/><meta content="https://santisclub.com/assets/img/cards/hammam.webp" name="twitter:image"/>
<link rel="alternate" hreflang="de" href="https://santis-club.com/de/index.html" />
<link rel="alternate" hreflang="en" href="https://santis-club.com/en/index.html" />
<link rel="alternate" hreflang="fr" href="https://santis-club.com/fr/index.html" />
<link rel="alternate" hreflang="ru" href="https://santis-club.com/ru/index.html" />
<link rel="alternate" hreflang="tr" href="https://santis-club.com/tr/index.html" />
<link rel="alternate" hreflang="x-default" href="https://santis-club.com/en/index.html" />
</head>
<body class="editorial-mode bg-[#050505] text-white antialiased overflow-x-hidden selection:bg-[#D4AF37] selection:text-black">
<noscript>
<nav style="background:#0a0c10;padding:12px 20px;text-align:center;border-bottom:1px solid rgba(212,175,55,0.15);">
<a href="/tr/index.html" style="color:#d4af37;margin:0 12px;text-decoration:none;font-size:13px;">ANA SAYFA</a>
<a href="/tr/hamam/index.html" style="color:#ccc;margin:0 12px;text-decoration:none;font-size:13px;">HAMAM</a>
<a href="/tr/masajlar/index.html" style="color:#ccc;margin:0 12px;text-decoration:none;font-size:13px;">MASAJLAR</a>
<a href="/tr/cilt-bakimi/index.html" style="color:#ccc;margin:0 12px;text-decoration:none;font-size:13px;">CİLT BAKIM</a>
<a href="/tr/urunler/index.html" style="color:#ccc;margin:0 12px;text-decoration:none;font-size:13px;">MAĞAZA</a>
<a href="/tr/galeri/index.html" style="color:#ccc;margin:0 12px;text-decoration:none;font-size:13px;">GALERİ</a>
<a href="/tr/hakkimizda/index.html" style="color:#ccc;margin:0 12px;text-decoration:none;font-size:13px;">HAKKIMIZDA</a>
</nav>
</noscript>
<div id="navbar-container"></div>
<noscript>
    <div style="background: #D4AF37; color: black; padding: 10px; text-align: center; font-weight: bold; z-index: 9999; position: relative;">
        Santis OS tam deneyimi ve dinamik dil desteği için lütfen JavaScript'i etkinleştirin.
    </div>
</noscript>

<main id="nv-main" role="main">
"""

template_body = """
<!-- SECTION 1: HERO (Immersive Cinematic) -->
<section class="relative w-full h-[92vh] flex items-center justify-center overflow-hidden border-b border-white/5 bg-[#050505]" data-santis-slot="hero_home">
    <div class="absolute inset-0 z-0">
        <!-- Replace hero-dark.webp with santis_hero_main_v2.webp to ensure asset exists. -->
        <img src="/assets/img/hero/santis_hero_main_v2.webp" fetchpriority="high" decoding="async" class="w-full h-full object-cover opacity-60 transform scale-105 transition-transform duration-[20s] ease-out" alt="Santis Hero">
        <div class="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent"></div>
    </div>
    
    <div class="relative z-10 text-center px-4 max-w-4xl mt-20">
        <span class="block text-[#D4AF37] text-xs uppercase tracking-[5px] mb-6 font-bold">Awaken Your Senses</span>
        <h1 class="text-6xl md:text-8xl font-serif text-white leading-tight mb-8 drop-shadow-2xl">
            Sovereign <br><span class="italic text-gray-300">Sanctuary.</span>
        </h1>
        <button class="px-10 py-4 border border-white/20 rounded-full text-sm uppercase tracking-[3px] hover:bg-white hover:text-black transition-all duration-500 backdrop-blur-sm sovereign-touch-target" onclick="document.getElementById('sovereign-rituals').scrollIntoView({behavior:'smooth'})">
            Keşfe Başla
        </button>
    </div>
</section>

<!-- SECTION 2: RAIL 1 - SOVEREIGN RITUALS -->
<section id="sovereign-rituals" class="w-full bg-[#050505] pt-[160px] pb-[120px] border-b border-white/5">
    <div class="max-w-[1400px] mx-auto px-6 mb-12">
        <span class="text-[#D4AF37] text-xs uppercase tracking-[4px] font-bold">Signature</span>
        <h2 class="text-4xl md:text-5xl text-white font-serif mt-2">Sovereign Rituals</h2>
        <p class="text-gray-400 mt-4 max-w-md font-light">En prestijli arınma ve yenilenme paketlerimiz. Keşfetmek için kaydırın.</p>
    </div>

    <div class="rail-viewport" data-rail-engine="true">
        <div class="rail-track">
            
            <a href="/tr/hamam/index.html" class="ritual-card w-[85vw] sm:w-[380px] md:w-[420px] lg:w-[450px] h-[550px] md:h-[640px] rounded-[32px] bg-[#0b0b0b] relative overflow-hidden group block">
                <img src="/assets/img/cards/hammam.webp" loading="lazy" decoding="async" alt="Hammam" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none"></div>
                <div class="absolute bottom-10 left-8 z-10 transition-transform duration-500 group-hover:-translate-y-4">
                    <span class="text-[#D4AF37] text-[9px] uppercase tracking-[3px] block mb-2">Apex Experience</span>
                    <h3 class="text-3xl text-white font-serif drop-shadow-lg">Ottoman Core</h3>
                    <p class="text-gray-300 font-light mt-2 tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-500">120 MIN • DETAYLARI GÖR</p>
                </div>
            </a>

            <a href="/tr/rituals/index.html" class="ritual-card w-[85vw] sm:w-[380px] md:w-[420px] lg:w-[450px] h-[550px] md:h-[640px] rounded-[32px] bg-[#0b0b0b] relative overflow-hidden group block">
                <img src="/assets/img/philosophy.webp" loading="lazy" decoding="async" alt="Philosophy" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none"></div>
                <div class="absolute bottom-10 left-8 z-10 transition-transform duration-500 group-hover:-translate-y-4">
                    <span class="text-[#D4AF37] text-[9px] uppercase tracking-[3px] block mb-2">Signature</span>
                    <h3 class="text-3xl text-white font-serif drop-shadow-lg">Aurelia Trance</h3>
                    <p class="text-gray-300 font-light mt-2 tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-500">150 MIN • DETAYLARI GÖR</p>
                </div>
            </a>
            
            <a href="/tr/rituals/index.html" class="ritual-card w-[85vw] sm:w-[380px] md:w-[420px] lg:w-[450px] h-[550px] md:h-[640px] rounded-[32px] bg-[#0b0b0b] relative overflow-hidden group block">
                <img src="/assets/img/cards/skincare_cover.webp" loading="lazy" decoding="async" alt="Luxury Spa" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]" onerror="this.src='/assets/img/cards/santis_card_skincare_cover.webp'">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none"></div>
                <div class="absolute bottom-10 left-8 z-10 transition-transform duration-500 group-hover:-translate-y-4">
                    <span class="text-[#D4AF37] text-[9px] uppercase tracking-[3px] block mb-2">Rejuvenation</span>
                    <h3 class="text-3xl text-white font-serif drop-shadow-lg">Sovereign Core</h3>
                    <p class="text-gray-300 font-light mt-2 tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-500">90 MIN • DETAYLARI GÖR</p>
                </div>
            </a>

        </div>
    </div>
</section>

<!-- SECTION 3: RAIL 2 - MASSAGE THERAPIES -->
<section id="massage-therapies" class="w-full bg-[#050505] pt-[120px] pb-[120px] border-b border-white/5">
    <div class="max-w-[1400px] mx-auto px-6 mb-12">
        <span class="text-[#D4AF37] text-xs uppercase tracking-[4px] font-bold">Body Therapies</span>
        <h2 class="text-4xl md:text-5xl text-white font-serif mt-2">Massage Collection</h2>
        <p class="text-gray-400 mt-4 max-w-md font-light">Terapötik dokunuşlarla bedeninizi özgür bırakın.</p>
    </div>

    <div class="rail-viewport" data-rail-engine="true">
        <div class="rail-track">
            
            <a href="/tr/masajlar/index.html" class="ritual-card w-[85vw] sm:w-[380px] md:w-[420px] lg:w-[450px] h-[550px] md:h-[640px] rounded-[32px] bg-[#0b0b0b] relative overflow-hidden group block">
                <img src="/assets/img/cards/massage.webp" loading="lazy" decoding="async" alt="Deep Tissue" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none"></div>
                <div class="absolute bottom-10 left-8 z-10 transition-transform duration-500 group-hover:-translate-y-4">
                    <span class="text-[#D4AF37] text-[9px] uppercase tracking-[3px] block mb-2">Deep Tension</span>
                    <h3 class="text-3xl text-white font-serif drop-shadow-lg">Deep Tissue</h3>
                    <p class="text-gray-300 font-light mt-2 tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-500">60/90 MIN • KEŞFET</p>
                </div>
            </a>

            <a href="/tr/masajlar/index.html" class="ritual-card w-[85vw] sm:w-[380px] md:w-[420px] lg:w-[450px] h-[550px] md:h-[640px] rounded-[32px] bg-[#0b0b0b] relative overflow-hidden group block">
                <img src="/assets/img/cards/santis_card_massage_v1.webp" loading="lazy" decoding="async" alt="Thai Stretch" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none"></div>
                <div class="absolute bottom-10 left-8 z-10 transition-transform duration-500 group-hover:-translate-y-4">
                    <span class="text-[#D4AF37] text-[9px] uppercase tracking-[3px] block mb-2">Flexibility</span>
                    <h3 class="text-3xl text-white font-serif drop-shadow-lg">Thai Healing</h3>
                    <p class="text-gray-300 font-light mt-2 tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-500">90/120 MIN • KEŞFET</p>
                </div>
            </a>
            
            <a href="/tr/masajlar/index.html" class="ritual-card w-[85vw] sm:w-[380px] md:w-[420px] lg:w-[450px] h-[550px] md:h-[640px] rounded-[32px] bg-[#0b0b0b] relative overflow-hidden group block">
                <img src="/assets/img/cards/santis_card_hammam_v1.webp" loading="lazy" decoding="async" alt="Relax" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none"></div>
                <div class="absolute bottom-10 left-8 z-10 transition-transform duration-500 group-hover:-translate-y-4">
                    <span class="text-[#D4AF37] text-[9px] uppercase tracking-[3px] block mb-2">Calmness</span>
                    <h3 class="text-3xl text-white font-serif drop-shadow-lg">Relax Massage</h3>
                    <p class="text-gray-300 font-light mt-2 tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-500">60 MIN • KEŞFET</p>
                </div>
            </a>
            
        </div>
    </div>
</section>

<!-- SECTION 4: RAIL 3 - SKIN CARE -->
<section id="skincare-therapies" class="w-full bg-[#050505] pt-[120px] pb-[160px] border-b border-white/5">
    <div class="max-w-[1400px] mx-auto px-6 mb-12">
        <span class="text-[#D4AF37] text-xs uppercase tracking-[4px] font-bold">Facial Treatments</span>
        <h2 class="text-4xl md:text-5xl text-white font-serif mt-2">Skin Care & Renewal</h2>
        <p class="text-gray-400 mt-4 max-w-md font-light">Bilimsel formüller ve doğanın şifasıyla parlayın.</p>
    </div>

    <div class="rail-viewport" data-rail-engine="true">
        <div class="rail-track">
            
            <a href="/tr/cilt-bakimi/index.html" class="ritual-card w-[85vw] sm:w-[380px] md:w-[420px] lg:w-[450px] h-[550px] md:h-[640px] rounded-[32px] bg-[#0b0b0b] relative overflow-hidden group block">
                <img src="/assets/img/cards/facial.webp" loading="lazy" decoding="async" alt="Facial" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none"></div>
                <div class="absolute bottom-10 left-8 z-10 transition-transform duration-500 group-hover:-translate-y-4">
                    <span class="text-[#D4AF37] text-[9px] uppercase tracking-[3px] block mb-2">Anti-Aging</span>
                    <h3 class="text-3xl text-white font-serif drop-shadow-lg">Divine Glow</h3>
                    <p class="text-gray-300 font-light mt-2 tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-500">75 MIN • KEŞFET</p>
                </div>
            </a>

            <a href="/tr/cilt-bakimi/index.html" class="ritual-card w-[85vw] sm:w-[380px] md:w-[420px] lg:w-[450px] h-[550px] md:h-[640px] rounded-[32px] bg-[#0b0b0b] relative overflow-hidden group block">
                <img src="/assets/img/cards/santis_card_skincare_v1.webp" loading="lazy" decoding="async" alt="Hydration" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none"></div>
                <div class="absolute bottom-10 left-8 z-10 transition-transform duration-500 group-hover:-translate-y-4">
                    <span class="text-[#D4AF37] text-[9px] uppercase tracking-[3px] block mb-2">Hydrating</span>
                    <h3 class="text-3xl text-white font-serif drop-shadow-lg">Pure Radiance</h3>
                    <p class="text-gray-300 font-light mt-2 tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-500">60 MIN • KEŞFET</p>
                </div>
            </a>
            
            <a href="/tr/urunler/index.html" class="ritual-card w-[85vw] sm:w-[380px] md:w-[420px] lg:w-[450px] h-[550px] md:h-[640px] rounded-[32px] bg-[#0b0b0b] relative overflow-hidden group block">
                <img src="/assets/img/cards/atelier.webp" loading="lazy" decoding="async" alt="Atelier" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none"></div>
                <div class="absolute bottom-10 left-8 z-10 transition-transform duration-500 group-hover:-translate-y-4">
                    <span class="text-[#D4AF37] text-[9px] uppercase tracking-[3px] block mb-2">Sothys Paris</span>
                    <h3 class="text-3xl text-white font-serif drop-shadow-lg">Luxury Atelier</h3>
                    <p class="text-gray-300 font-light mt-2 tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-500">MAĞAZAYI KEŞFET</p>
                </div>
            </a>

        </div>
    </div>
</section>

<!-- SECTION 5: WELLNESS PHILOSOPHY -->
<section class="w-full bg-[#0b0b0b] py-[160px] border-b border-white/5">
    <div class="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        <!-- Image -->
        <div class="rounded-3xl overflow-hidden h-[500px] md:h-[600px] relative">
            <img src="/assets/img/cards/Santis-spa-rest-graded-clean.webp" alt="Philosophy" loading="lazy" decoding="async" class="w-full h-full object-cover transform transition-transform duration-1000 hover:scale-105">
            <div class="absolute inset-0 bg-black/20 pointer-events-none"></div>
        </div>
        <!-- Text -->
        <div class="max-w-xl">
            <span class="text-[#D4AF37] text-xs uppercase tracking-[4px] font-bold block mb-4">İyi Olma Sanatı</span>
            <h2 class="text-4xl md:text-5xl font-serif text-white leading-tight mb-8">Zamanın durduğu <br><span class="italic text-[#D4AF37]">o sessiz an.</span></h2>
            <p class="text-gray-400 font-light leading-relaxed text-lg mb-6">Santis Club, geleneksel hamam ritüellerini ve modern spa terapilerini eşsiz bir anlayışla buluşturur. Burada zaman yavaşlar, beden dinlenir, zihin berraklaşır.</p>
            <p class="text-gray-400 font-light leading-relaxed text-lg mb-10">Her ritüel, yüzyılların bilgeliğiyle tasarlanmış bir yolculuktur. Sessizlik burada lüks değil — bir yaşam biçimidir.</p>
            <a href="/tr/hakkimizda/index.html" class="inline-flex items-center gap-3 border-b border-[#D4AF37] text-[#D4AF37] pb-1 uppercase tracking-widest text-xs font-bold hover:text-white hover:border-white transition-colors sovereign-touch-target">
                Hikâyemizi Keşfedin 
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            </a>
        </div>
    </div>
</section>

<!-- SECTION 6: GLOBAL TRADITIONS -->
<div class="nv-container nv-section w-full bg-[#050505] py-[160px] border-b border-white/5" id="global-trends">
    <div class="max-w-[1400px] mx-auto px-6 text-center mb-16">
        <span class="text-[#D4AF37] text-xs uppercase tracking-[4px] font-bold block mb-4">Küresel İlham</span>
        <h2 class="text-4xl md:text-5xl text-white font-serif mt-2">Dünyanın Dört Bir Yanından Ritüeller</h2>
    </div>
    <div class="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        <a aria-label="Wabi-Sabi" href="/tr/rituals/index.html" class="group relative h-[520px] rounded-[24px] overflow-hidden flex flex-col justify-end p-8 border border-white/5 hover:border-[#D4AF37]/30 transition-all duration-500">
            <img src="/assets/img/cards/santis_card_hammam_v1.webp" loading="lazy" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-transform duration-1000">
            <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
            <div class="relative z-10 transition-transform duration-500 group-hover:-translate-y-2">
                <span class="text-[#D4AF37] text-[10px] tracking-[2px] uppercase mb-2 block">🇯🇵 KÜRESEL RİTÜEL • ASYA</span>
                <h3 class="text-2xl text-white font-serif">Wabi-Sabi Estetiği</h3>
                <p class="text-gray-400 mt-2 text-sm font-light">Kusursuzluğun güzelliği.</p>
            </div>
        </a>
        <a aria-label="Wat Pho" href="/tr/rituals/index.html" class="group relative h-[520px] rounded-[24px] overflow-hidden flex flex-col justify-end p-8 border border-white/5 hover:border-[#D4AF37]/30 transition-all duration-500">
            <img src="/assets/img/cards/santis_card_massage_v1.webp" loading="lazy" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-transform duration-1000">
            <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
            <div class="relative z-10 transition-transform duration-500 group-hover:-translate-y-2">
                <span class="text-[#D4AF37] text-[10px] tracking-[2px] uppercase mb-2 block">🇹🇭 KÜRESEL RİTÜEL • TAYLAND</span>
                <h3 class="text-2xl text-white font-serif">Wat Pho Bilgeliği</h3>
                <p class="text-gray-400 mt-2 text-sm font-light">Kadim şifa mirası.</p>
            </div>
        </a>
        <a aria-label="Roman Thermal" href="/tr/rituals/index.html" class="group relative h-[520px] rounded-[24px] overflow-hidden flex flex-col justify-end p-8 border border-white/5 hover:border-[#D4AF37]/30 transition-all duration-500">
            <img src="/assets/img/cards/santis_card_skincare_v1.webp" loading="lazy" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-transform duration-1000">
            <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
            <div class="relative z-10 transition-transform duration-500 group-hover:-translate-y-2">
                <span class="text-[#D4AF37] text-[10px] tracking-[2px] uppercase mb-2 block">🇮🇹 KÜRESEL RİTÜEL • İTALYA</span>
                <h3 class="text-2xl text-white font-serif">Roma Termal Kültürü</h3>
                <p class="text-gray-400 mt-2 text-sm font-light">Salus per aquam.</p>
            </div>
        </a>
    </div>
</div>

<!-- SECTION 7: TESTIMONIALS (Trust Layer) -->
<section class="nv-testimonials santis-lazy w-full bg-[#0b0b0b] py-[160px] border-b border-white/5" id="testimonials">
    <div class="max-w-[1400px] mx-auto px-6">
        <div class="text-center mb-16">
            <span class="text-[#D4AF37] text-xs uppercase tracking-[4px] font-bold block mb-4">Misafir Deneyimleri</span>
            <h2 class="text-4xl md:text-5xl text-white font-serif mt-2">Huzurun Yankıları</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="bg-[#050505] p-10 rounded-[24px] border border-white/5">
                <div class="text-[#D4AF37] text-lg mb-6">★★★★★</div>
                <blockquote class="text-gray-300 font-light leading-relaxed mb-8">"Hayatımın en huzurlu 2 saatiydi. Osmanlı Hamam ritüeli eşsiz bir deneyimdi."</blockquote>
                <div>
                    <span class="block text-white font-medium">Ayşe K.</span>
                    <span class="block text-gray-500 text-sm mt-1">Istanbul</span>
                </div>
            </div>
            <div class="bg-[#050505] p-10 rounded-[24px] border border-white/5">
                <div class="text-[#D4AF37] text-lg mb-6">★★★★★</div>
                <blockquote class="text-gray-300 font-light leading-relaxed mb-8">"Aromaterapi masajından sonra vücudum yeniden doğmuş gibi hissetti. Çok profesyonel."</blockquote>
                <div>
                    <span class="block text-white font-medium">Mehmet T.</span>
                    <span class="block text-gray-500 text-sm mt-1">Antalya</span>
                </div>
            </div>
            <div class="bg-[#050505] p-10 rounded-[24px] border border-white/5">
                <div class="text-[#D4AF37] text-lg mb-6">★★★★★</div>
                <blockquote class="text-gray-300 font-light leading-relaxed mb-8">"Sothys cilt bakım seansı muhteşemdi. Cildim hiç bu kadar parlak ve sağlıklı olmamıştı."</blockquote>
                <div>
                    <span class="block text-white font-medium">Elena M.</span>
                    <span class="block text-gray-500 text-sm mt-1">Moskova</span>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- SECTION 8: BOOKING CTA (Conversion Layer) -->
<section class="nv-booking-cta w-full bg-[#050505] py-[160px]" id="bookingCta">
    <div class="max-w-3xl mx-auto px-6 text-center">
        <span class="text-[#D4AF37] text-xs uppercase tracking-[4px] font-bold block mb-4">Ritüelinizi Planlayın</span>
        <h2 class="text-5xl md:text-6xl text-white font-serif mb-8 leading-tight">Huzur sadece bir arama uzağınızda</h2>
        <p class="text-gray-400 font-light text-xl mb-12">Uzmanlarımız sizin için mükemmel ritüeli planlasın.</p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a href="https://wa.me/905348350169" rel="noopener noreferrer" target="_blank" class="px-10 py-5 bg-[#D4AF37] text-black font-bold uppercase tracking-[3px] text-sm rounded-full hover:bg-white transition-all duration-300 w-full sm:w-auto sovereign-touch-target">
                WhatsApp İle Rezervasyon
            </a>
            <a href="tel:+905348350169" class="px-10 py-5 border border-white/20 text-white font-bold uppercase tracking-[3px] text-sm rounded-full hover:bg-white hover:text-black transition-all duration-300 w-full sm:w-auto sovereign-touch-target">
                Bizi Arayın
            </a>
        </div>
    </div>
</section>
</main>

<div class="nv-sticky-booking" id="stickyBooking" aria-hidden="true"><div class="nv-sticky-booking-inner"><span class="nv-sticky-booking-text">Ritüelinizi planlayın</span><a class="nv-btn nv-btn-primary nv-btn-sm sovereign-touch-target" href="https://wa.me/905348350169" rel="noopener noreferrer" target="_blank" tabindex="-1">Rezervasyon</a></div></div>
<div id="footer-container"></div>
<div class="modal-overlay" hidden="" id="bookingModal"></div>
<script defer="" src="/assets/js/url-normalizer.js"></script>
<script defer="" src="/assets/js/routes.js"></script>
<script defer="" src="/assets/js/concierge-engine.js"></script>
<script defer="" src="/assets/js/santis-atmosphere.js"></script>
<script defer="" src="/assets/js/core/santis-neuro-tracker.js"></script>
<script defer="" src="/assets/js/santis-rail.js"></script>
<script defer="" src="/assets/js/app.js"></script>
<script defer="" src="/assets/js/santis-intent-engine.js"></script>
<script>(function(){var b=document.getElementById('stickyBooking');if(!b)return;var s=false;window.addEventListener('scroll',function(){if(window.scrollY>600&&!s){b.classList.add('visible');s=true;}else if(window.scrollY<=600&&s){b.classList.remove('visible');s=false;}},{passive:true});})();</script>
</body>
</html>
"""

# Let's write the file out
with open(r'c:\Users\tourg\Desktop\SANTIS_SITE\tr\index.html', 'w', encoding='utf-8') as f:
    f.write(template_head + template_body)
