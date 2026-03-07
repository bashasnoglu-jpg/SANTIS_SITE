/**
 * SANTIS — Page Config (CSP-Safe)
 * Reads page-level configuration from <html> data-* attributes.
 * Replaces inline <script>window.SITE_ROOT = '/';</script> patterns.
 * 
 * Usage in HTML:
 *   <html data-site-root="/" data-page-group="kese-ve-kopuk-masaji">
 *   <script src="/assets/js/page-config.js"></script>
 */
(function () {
    var html = document.documentElement;

    // SITE_ROOT — default '/'
    window.SITE_ROOT = html.getAttribute('data-site-root') || '/';

    // PAGE_GROUP_ID — from data-attr, URL param, or null
    var groupId = html.getAttribute('data-page-group');
    if (!groupId) {
        var params = new URLSearchParams(window.location.search);
        groupId = params.get('group_id') || params.get('slug') || params.get('id') || params.get('s');
    }
    window.PAGE_GROUP_ID = groupId || null;
})();
