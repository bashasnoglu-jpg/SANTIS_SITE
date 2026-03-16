/**
 * db.js — STUB v2.0 (Migration: 2026-03-01)
 * ─────────────────────────────────────────
 * servicesDB → /assets/data/db.json (64 servis, 16.3 KB)
 * productsDB → aşağıda statik olarak korunuyor (karmaşık JS yapısı)
 *
 * Yükleme sırası:
 * 1. fetch() ile db.json async yüklenir → window.servicesDB set edilir
 * 2. Yüklenince 'servicesDB:ready' eventi dispatch edilir
 * 3. productsDB bu dosyada statik kalır (ileride ürünler API'ye taşınacak)
 */
(function () {
  'use strict';

  // ── servicesDB: JSON'dan async yükle ──────────────────────────────────────
  if (!window.servicesDB || window.servicesDB.length === 0) {
    const origin = window.location.origin || '';
    fetch(origin + '/assets/data/db.json')
      .then(function (r) {
        if (!r.ok) throw new Error('db.json yüklenemedi: ' + r.status);
        return r.json();
      })
      .then(function (data) {
        window.servicesDB = data;
        document.dispatchEvent(
          new CustomEvent('servicesDB:ready', { detail: { count: data.length } })
        );
      })
      .catch(function (e) {
        console.warn('[db.js] servicesDB JSON yüklenemedi:', e);
      });
  }
})();
