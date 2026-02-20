/**
 * SANTIS SEO META HELPER v1.0
 * Dynamic canonical URLs, hreflang tags, and Open Graph meta generation
 * 2026-01-30
 */

const SEO_META = {
    config: {
        baseUrl: 'https://santisclub.com',
        defaultLang: 'tr',
        supportedLangs: ['tr', 'en', 'de', 'ru'],
        siteName: 'Santis Club',
        defaultImage: '/assets/img/og-default.webp',
        twitterHandle: '@santisclub'
    },

    init() {
        this.setCanonical();
        this.setHreflang();
        this.ensureOpenGraph();
        console.log('📊 SEO Meta Helper initialized');
    },

    /**
     * Set canonical URL - prevents duplicate content issues
     */
    setCanonical() {
        // Remove existing canonical if any
        const existing = document.querySelector('link[rel="canonical"]');
        if (existing) existing.remove();

        // Build clean canonical URL
        const url = new URL(window.location.href);
        url.search = ''; // Remove query params
        url.hash = '';   // Remove hash

        // Replace localhost with production URL
        let canonical = url.href;
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
            canonical = this.config.baseUrl + url.pathname;
        }

        // Ensure trailing slash consistency (no trailing slash except root)
        if (canonical.endsWith('/') && canonical !== this.config.baseUrl + '/') {
            canonical = canonical.slice(0, -1);
        }

        const link = document.createElement('link');
        link.rel = 'canonical';
        link.href = canonical;
        document.head.appendChild(link);
    },

    /**
     * Set hreflang tags for multi-language support
     */
    setHreflang() {
        // Remove existing hreflang tags
        document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());

        const path = window.location.pathname;

        // For each supported language, create hreflang
        this.config.supportedLangs.forEach(lang => {
            const link = document.createElement('link');
            link.rel = 'alternate';
            link.hreflang = lang;

            // Build language-specific URL
            // Currently all content is in TR, so we use same path
            // In future, this could be /en/page, /de/page etc.
            link.href = `${this.config.baseUrl}${path}`;

            document.head.appendChild(link);
        });

        // Add x-default (usually points to default language)
        const xDefault = document.createElement('link');
        xDefault.rel = 'alternate';
        xDefault.hreflang = 'x-default';
        xDefault.href = `${this.config.baseUrl}${path}`;
        document.head.appendChild(xDefault);
    },

    /**
     * Ensure Open Graph tags exist
     */
    ensureOpenGraph() {
        const og = {
            'og:type': 'website',
            'og:site_name': this.config.siteName,
            'og:locale': 'tr_TR',
            'og:url': document.querySelector('link[rel="canonical"]')?.href || window.location.href
        };

        // Add OG image if missing
        if (!document.querySelector('meta[property="og:image"]')) {
            og['og:image'] = this.config.baseUrl + this.config.defaultImage;
        }

        // Add Twitter card if missing
        if (!document.querySelector('meta[name="twitter:card"]')) {
            this.setMeta('twitter:card', 'summary_large_image', 'name');
            this.setMeta('twitter:site', this.config.twitterHandle, 'name');
        }

        // Set each OG tag
        Object.entries(og).forEach(([property, content]) => {
            if (!document.querySelector(`meta[property="${property}"]`)) {
                this.setMeta(property, content, 'property');
            }
        });
    },

    /**
     * Helper to set meta tags
     */
    setMeta(name, content, type = 'name') {
        const meta = document.createElement('meta');
        meta.setAttribute(type, name);
        meta.content = content;
        document.head.appendChild(meta);
    },

    /**
     * Generate page-specific SEO (call manually for dynamic pages)
     */
    setPageSEO(options = {}) {
        const {
            title,
            description,
            image,
            type = 'article'
        } = options;

        if (title) {
            document.title = `${title} | ${this.config.siteName}`;
            this.setMeta('og:title', title, 'property');
            this.setMeta('twitter:title', title, 'name');
        }

        if (description) {
            // Update or create description
            let descMeta = document.querySelector('meta[name="description"]');
            if (descMeta) {
                descMeta.content = description;
            } else {
                this.setMeta('description', description);
            }
            this.setMeta('og:description', description, 'property');
            this.setMeta('twitter:description', description, 'name');
        }

        if (image) {
            const fullImage = image.startsWith('http') ? image : this.config.baseUrl + image;
            this.setMeta('og:image', fullImage, 'property');
            this.setMeta('twitter:image', fullImage, 'name');
        }

        if (type) {
            let ogType = document.querySelector('meta[property="og:type"]');
            if (ogType) {
                ogType.content = type;
            }
        }
    }
};

// Auto-init on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SEO_META.init());
} else {
    SEO_META.init();
}

// Export for manual use
window.SEO_META = SEO_META;
