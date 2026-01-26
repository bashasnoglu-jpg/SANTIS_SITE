// slug.js — TR slug helper (minimal, no dependencies)
(function (global) {
  const map = {
    'ç': 'c', 'Ç': 'c',
    'ğ': 'g', 'Ğ': 'g',
    'ı': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o',
    'ş': 's', 'Ş': 's',
    'ü': 'u', 'Ü': 'u'
  };

  function slugifyTR(input) {
    if (!input) return '';
    return String(input)
      .replace(/[çÇğĞıİöÖşŞüÜ]/g, (ch) => map[ch] || ch)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');
  }

  function canonicalPath(lang, section, slug) {
    const safeLang = slugifyTR(lang || 'tr') || 'tr';
    const parts = [safeLang];

    const safeSection = slugifyTR(section || '');
    if (safeSection) parts.push(safeSection);

    const safeSlug = slugifyTR(slug || '');
    if (safeSlug) parts.push(safeSlug);

    return `/${parts.join('/')}/`;
  }

  global.slugifyTR = slugifyTR;
  global.canonicalPath = canonicalPath;
})(typeof window !== 'undefined' ? window : globalThis);

