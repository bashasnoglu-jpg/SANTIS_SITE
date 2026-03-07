/**
 * Blok E: Edge & CDN (Global Distribution)
 * Cloudflare Worker for Santis OS
 * 
 * Functions:
 * 1. Geographic Routing (Accept-Language / GeoIP based locale redirects).
 * 2. Static Asset Cache Control (Immutability).
 * 3. Fallback Shield (Stale-While-Revalidate protection if Backend is down).
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const country = request.cf?.country || 'TR';
        const acceptLang = request.headers.get('Accept-Language') || '';

        // --- 1. EDGE LOCALIZATION (Auto-Redirect on Root Level) ---
        // If a user hits domain.com/ or domain.com without a language path,
        // we determine their locale at the Edge level and redirect them.
        if (url.pathname === '/' || url.pathname === '') {
            let targetLocale = 'en'; // Default

            // Priority 1: User Browser Preference
            if (acceptLang.startsWith('tr')) targetLocale = 'tr';
            else if (acceptLang.startsWith('ru')) targetLocale = 'ru';
            else if (acceptLang.startsWith('de')) targetLocale = 'de';
            else if (acceptLang.startsWith('fr')) targetLocale = 'fr';
            // Priority 2: Geographic IP Location
            else if (country === 'TR') targetLocale = 'tr';
            else if (country === 'RU') targetLocale = 'ru';
            else if (country === 'DE') targetLocale = 'de';
            else if (country === 'FR') targetLocale = 'fr';

            // Redirect to localized homepage
            if (targetLocale !== 'tr') { // Assuming TR is the root for now, or depending on strategy
                // If the strategy is `domain.com/en/index.html`
                const redirectUrl = new URL(`/${targetLocale}/`, request.url);
                return Response.redirect(redirectUrl.toString(), 301);
            }
        }

        // --- 2. FETCH FROM ORIGIN (Santis Core) ---
        // Pass the request to Origin (FastAPI backend or Storage Bucket)
        let response = await fetch(request);

        // --- 3. RESPOND MODIFICATION (High Availability Shield) ---
        // Clone the response to modify headers
        response = new Response(response.body, response);

        // Apply strict caching rules for static assets (images, css, js)
        if (url.pathname.match(/\.(jpg|jpeg|png|webp|css|js|svg)$/)) {
            // Cache static assets vigorously
            response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        }

        // Fallback Shield for API Content (Stale While Revalidate)
        // If it's a content API response (not a mutation), allow serving old content if backend is slow/down
        if (request.method === 'GET' && url.pathname.startsWith('/api/v1/content/resolve')) {
            // Serve from cache for up to 5 minutes, but keep serving old data for 1 day while fetching new data in background
            response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
        }

        // Edge Security Headers
        response.headers.set('X-Edge-Location', request.cf?.colo || 'Unknown');
        response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
        response.headers.set('X-Content-Type-Options', 'nosniff');

        return response;
    }
};
