/**

 * SANTIS CLUB - SEO ENGINE

 * Otomatik SEO Tag Yönetimi v1.0

 * 

 * Özellikler:

 * - Dinamik canonical tag ekleme

 * - Hreflang tag'leri (13 dil)

 * - Schema.org JSON-LD (LocalBusiness, WebSite)

 * - Open Graph meta tag'ler

 * - Twitter Card meta tag'ler

 */



(function () {

    'use strict';



    // ═══════════════════════════════════════════════════════════════

    // YAPILANDIRMA

    // ═══════════════════════════════════════════════════════════════



    const SEO_CONFIG = {

        // Site bilgileri

        siteName: 'Santis Club',

        siteUrl: 'https://santisclub.com',

        defaultLang: 'tr',



        // Desteklenen diller

        languages: ['tr', 'en', 'de', 'ru', 'ar', 'zh-CN', 'ja', 'ko', 'fr', 'es', 'it', 'pt', 'nl'],



        // İşletme bilgileri (Schema.org için)

        business: {

            name: 'Santis Club Spa & Wellness',

            description: 'Premium spa ve wellness deneyimi. Hamam, masaj ve cilt bakımı hizmetleri.',

            phone: '+90 534 835 01 69',

            email: 'info@santisclub.com',

            address: {

                streetAddress: 'Side Mahallesi',

                addressLocality: 'Manavgat',

                addressRegion: 'Antalya',

                postalCode: '07600',

                addressCountry: 'TR'

            },

            geo: {

                latitude: 36.7667,

                longitude: 31.3897

            },

            priceRange: '€€€',

            openingHours: 'Mo-Su 09:00-22:00',

            image: 'https://santisclub.com/assets/img/hero/main.webp'

        },



        // Sosyal medya

        social: {

            instagram: 'https://instagram.com/santisclub',

            youtube: 'https://youtube.com/@santisclub'

        }

    };



    // ═══════════════════════════════════════════════════════════════

    // CANONICAL TAG

    // ═══════════════════════════════════════════════════════════════



    function addCanonicalTag() {

        // Zaten varsa çık

        if (document.querySelector('link[rel="canonical"]')) return;



        // Canonical URL oluştur (query string dahil, hash hariç)

        const canonicalUrl = SEO_CONFIG.siteUrl +

            window.location.pathname +

            window.location.search;



        const link = document.createElement('link');

        link.rel = 'canonical';

        link.href = canonicalUrl;

        document.head.appendChild(link);



        console.log('[SEO] Canonical eklendi:', canonicalUrl);

    }



    // ═══════════════════════════════════════════════════════════════

    // HREFLANG TAG'LERİ

    // ═══════════════════════════════════════════════════════════════



    function addHreflangTags() {

        // Zaten varsa çık

        if (document.querySelector('link[rel="alternate"][hreflang]')) return;



        const basePath = window.location.pathname + window.location.search;



        SEO_CONFIG.languages.forEach(lang => {

            const link = document.createElement('link');

            link.rel = 'alternate';

            link.hreflang = lang;

            link.href = `${SEO_CONFIG.siteUrl}${basePath}${basePath.includes('?') ? '&' : '?'}lang=${lang}`;

            document.head.appendChild(link);

        });



        // x-default (varsayılan)

        const defaultLink = document.createElement('link');

        defaultLink.rel = 'alternate';

        defaultLink.hreflang = 'x-default';

        defaultLink.href = SEO_CONFIG.siteUrl + basePath;

        document.head.appendChild(defaultLink);



        console.log('[SEO] Hreflang tag\'leri eklendi:', SEO_CONFIG.languages.length + 1);

    }



    // ═══════════════════════════════════════════════════════════════

    // SCHEMA.ORG JSON-LD

    // ═══════════════════════════════════════════════════════════════



    function addSchemaOrg() {

        // Zaten varsa çık

        if (document.querySelector('script[type="application/ld+json"]')) return;



        const { business, social, siteName, siteUrl } = SEO_CONFIG;



        // LocalBusiness Schema

        const localBusinessSchema = {

            '@context': 'https://schema.org',

            '@type': 'HealthAndBeautyBusiness',

            'name': business.name,

            'description': business.description,

            'url': siteUrl,

            'telephone': business.phone,

            'email': business.email,

            'image': business.image,

            'priceRange': business.priceRange,

            'openingHours': business.openingHours,

            'address': {

                '@type': 'PostalAddress',

                'streetAddress': business.address.streetAddress,

                'addressLocality': business.address.addressLocality,

                'addressRegion': business.address.addressRegion,

                'postalCode': business.address.postalCode,

                'addressCountry': business.address.addressCountry

            },

            'geo': {

                '@type': 'GeoCoordinates',

                'latitude': business.geo.latitude,

                'longitude': business.geo.longitude

            },

            'sameAs': [

                social.instagram,

                social.youtube

            ],

            'hasOfferCatalog': {

                '@type': 'OfferCatalog',

                'name': 'Spa Hizmetleri',

                'itemListElement': [

                    {

                        '@type': 'Offer',

                        'itemOffered': {

                            '@type': 'Service',

                            'name': 'Hamam Ritüelleri',

                            'description': 'Osmanlı geleneğinde lüks hamam deneyimi'

                        }

                    },

                    {

                        '@type': 'Offer',

                        'itemOffered': {

                            '@type': 'Service',

                            'name': 'Masaj Terapileri',

                            'description': 'Dünya mutfağından masaj teknikleri'

                        }

                    },

                    {

                        '@type': 'Offer',

                        'itemOffered': {

                            '@type': 'Service',

                            'name': 'Cilt Bakımı',

                            'description': 'Sothys Paris ile premium cilt bakımı'

                        }

                    }

                ]

            }

        };



        // WebSite Schema

        const webSiteSchema = {

            '@context': 'https://schema.org',

            '@type': 'WebSite',

            'name': siteName,

            'url': siteUrl,

            'inLanguage': 'tr',

            'potentialAction': {

                '@type': 'SearchAction',

                'target': `${siteUrl}/search?q={search_term_string}`,

                'query-input': 'required name=search_term_string'

            }

        };



        // Script elementleri oluştur

        const script1 = document.createElement('script');

        script1.type = 'application/ld+json';

        script1.textContent = JSON.stringify(localBusinessSchema);

        document.head.appendChild(script1);



        const script2 = document.createElement('script');

        script2.type = 'application/ld+json';

        script2.textContent = JSON.stringify(webSiteSchema);

        document.head.appendChild(script2);



        console.log('[SEO] Schema.org JSON-LD eklendi');

    }



    // ═══════════════════════════════════════════════════════════════

    // OPEN GRAPH & TWITTER CARDS

    // ═══════════════════════════════════════════════════════════════



    function addOpenGraphTags() {

        // Zaten varsa çık

        if (document.querySelector('meta[property="og:title"]')) return;



        const { siteName, siteUrl, business } = SEO_CONFIG;

        const pageTitle = document.title || siteName;

        const pageDescription = document.querySelector('meta[name="description"]')?.content || business.description;

        const pageUrl = siteUrl + window.location.pathname;



        const ogTags = [

            { property: 'og:type', content: 'website' },

            { property: 'og:site_name', content: siteName },

            { property: 'og:title', content: pageTitle },

            { property: 'og:description', content: pageDescription },

            { property: 'og:url', content: pageUrl },

            { property: 'og:image', content: business.image },

            { property: 'og:locale', content: 'tr_TR' }

        ];



        const twitterTags = [

            { name: 'twitter:card', content: 'summary_large_image' },

            { name: 'twitter:title', content: pageTitle },

            { name: 'twitter:description', content: pageDescription },

            { name: 'twitter:image', content: business.image }

        ];



        // OG tags ekle

        ogTags.forEach(tag => {

            const meta = document.createElement('meta');

            meta.setAttribute('property', tag.property);

            meta.content = tag.content;

            document.head.appendChild(meta);

        });



        // Twitter tags ekle

        twitterTags.forEach(tag => {

            const meta = document.createElement('meta');

            meta.name = tag.name;

            meta.content = tag.content;

            document.head.appendChild(meta);

        });



        console.log('[SEO] Open Graph & Twitter Cards eklendi');

    }



    // ═══════════════════════════════════════════════════════════════

    // BAŞLATICI

    // ═══════════════════════════════════════════════════════════════



    function init() {

        // DOM hazır olduğunda çalıştır

        if (document.readyState === 'loading') {

            document.addEventListener('DOMContentLoaded', runSEO);

        } else {

            runSEO();

        }

    }



    function runSEO() {

        addCanonicalTag();

        addHreflangTags();

        addSchemaOrg();

        addOpenGraphTags();



        console.log('🔍 Santis SEO Engine v1.0 aktif');

    }



    // Başlat

    init();



    // Global erişim

    window.SANTIS_SEO = {

        config: SEO_CONFIG,

        refresh: runSEO

    };



})();

