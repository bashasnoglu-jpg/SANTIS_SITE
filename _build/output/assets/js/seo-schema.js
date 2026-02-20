/**

 * SANTIS ADVANCED SEO ENGINE v1.0

 * Generates dynamic JSON-LD Structured Data for Google Rich Results.

 */



const SEO_ENGINE = {

    init() {

        console.log("🔍 SEO Engine Initializing...");



        // 1. Common Organization Schema (Every Page)

        this.injectSchema(this.getOrganizationSchema());



        // 2. Page Specific Logic

        const path = window.location.pathname;



        if (path.includes('index.html') || path === '/') {

            this.injectSchema(this.getLocalBusinessSchema());

        }

        else if (path.includes('products.html')) {

            // For catalog page, we might list top products

            // Or better, distinct product pages inject their own specific schema via backend

            // Here we inject a "Collection" or Breadcrumb schema

            this.injectSchema(this.getBreadcrumbSchema("Koleksiyon", "products.html"));

        }

        else if (path.includes('service.html')) {

            this.injectSchema(this.getServiceSchema());

            this.injectSchema(this.getBreadcrumbSchema("Hizmetler", "service.html"));

        }

    },



    injectSchema(data) {

        const script = document.createElement('script');

        script.type = 'application/ld+json';

        script.text = JSON.stringify(data);

        document.head.appendChild(script);

    },



    getOrganizationSchema() {

        return {

            "@context": "https://schema.org",

            "@type": "Organization",

            "name": "Santis Club",

            "url": "https://santisclub.com", // Example URL

            "logo": "https://santisclub.com/assets/images/logo.png",

            "contactPoint": {

                "@type": "ContactPoint",

                "telephone": "+90-534-835-0169",

                "contactType": "customer service",

                "areaServed": "TR",

                "availableLanguage": ["Turkish", "English", "German", "Russian"]

            },

            "sameAs": [

                "https://instagram.com/santisclub",

                "https://facebook.com/santisclub"

            ]

        };

    },



    getLocalBusinessSchema() {

        return {

            "@context": "https://schema.org",

            "@type": "DaySpa",

            "name": "Santis Club",

            "image": "https://santisclub.com/assets/images/hero.jpg",

            "@id": "https://santisclub.com",

            "url": "https://santisclub.com",

            "telephone": "+905348350169",

            "address": {

                "@type": "PostalAddress",

                "streetAddress": "Antalya", // Needs specific address

                "addressLocality": "Antalya",

                "postalCode": "07000",

                "addressCountry": "TR"

            },

            "geo": {

                "@type": "GeoCoordinates",

                "latitude": 36.8841, // Example coords

                "longitude": 30.7056

            },

            "openingHoursSpecification": {

                "@type": "OpeningHoursSpecification",

                "dayOfWeek": [

                    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"

                ],

                "opens": "09:00",

                "closes": "21:00"

            },

            "priceRange": "$$"

        };

    },



    getServiceSchema() {

        return {

            "@context": "https://schema.org",

            "@type": "Service",

            "serviceType": "Turkish Bath & Massage",

            "provider": {

                "@type": "DaySpa",

                "name": "Santis Club"

            },

            "areaServed": {

                "@type": "City",

                "name": "Antalya"

            },

            "hasOfferCatalog": {

                "@type": "OfferCatalog",

                "name": "Spa Services",

                "itemListElement": [

                    {

                        "@type": "Offer",

                        "itemOffered": {

                            "@type": "Service",

                            "name": "Traditional Turkish Bath"

                        }

                    },

                    {

                        "@type": "Offer",

                        "itemOffered": {

                            "@type": "Service",

                            "name": "Deep Tissue Massage"

                        }

                    },

                    {

                        "@type": "Offer",

                        "itemOffered": {

                            "@type": "Service",

                            "name": "Sothys Facial Care"

                        }

                    }

                ]

            }

        };

    },



    getBreadcrumbSchema(name, url) {

        return {

            "@context": "https://schema.org",

            "@type": "BreadcrumbList",

            "itemListElement": [{

                "@type": "ListItem",

                "position": 1,

                "name": "Home",

                "item": "https://santisclub.com/index.html"

            }, {

                "@type": "ListItem",

                "position": 2,

                "name": name,

                "item": `https://santisclub.com/${url}`

            }]

        };

    }

};



// Auto Init

document.addEventListener('DOMContentLoaded', () => {

    SEO_ENGINE.init();

});

