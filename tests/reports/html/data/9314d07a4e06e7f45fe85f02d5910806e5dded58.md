# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reservation.spec.ts >> Mobil Deneyim >> modal mobilde tam genişlik açılıyor
- Location: tests\e2e\reservation.spec.ts:441:5

# Error details

```
Error: expect(received).toBeLessThanOrEqual(expected)

Expected: <= 400
Received:    520
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - navigation [ref=e3]:
    - generic [ref=e5]:
      - link "Santis Home" [ref=e6]:
        - /url: /tr/index.html
        - img [ref=e7]
        - generic [ref=e11]:
          - generic [ref=e12]: SANTIS
          - generic [ref=e13]: SPA & THERAPY
      - generic [ref=e14]:
        - link "Ana Sayfa" [ref=e15]:
          - /url: /tr/index.html
        - link "Galeri" [ref=e16]:
          - /url: /tr/galeri/index.html
        - link "Hakkımızda" [ref=e17]:
          - /url: /tr/hakkimizda/index.html
        - link "İletişim" [ref=e18]:
          - /url: /tr/iletisim.html
      - link "Rezervasyon" [ref=e20]:
        - /url: https://wa.me/905348350169
    - generic [ref=e22]:
      - link "Masajlar" [ref=e23]:
        - /url: /tr/masajlar/index.html
      - link "Hamam" [ref=e24]:
        - /url: /tr/hamam/index.html
      - link "Cilt Bakımı" [ref=e25]:
        - /url: /tr/cilt-bakimi/index.html
      - link "Dünya Ritüeli" [ref=e26]:
        - /url: /tr/rituals/index.html
  - generic [ref=e27]:
    - img "Romantik Kaçış Paketi – çift spa deneyimi" [ref=e29]
    - generic [ref=e30]:
      - navigation "Breadcrumb" [ref=e31]:
        - generic [ref=e32]:
          - link "Ana Sayfa" [ref=e33]:
            - /url: /
          - text: /
          - link "Paketler" [ref=e34]:
            - /url: /masaj.html
          - text: / Romantik Kaçış
      - generic [ref=e35]:
        - text: ÇİFT DENEYİMİ
        - heading "Romantik Kaçış Paketi" [level=1] [ref=e36]
      - generic [ref=e37]:
        - generic [ref=e38]:
          - generic [ref=e39]: SÜRE
          - generic [ref=e40]: 150 dk
        - generic [ref=e41]:
          - generic [ref=e42]: KİŞİ
          - generic [ref=e43]: 2 Kişi
        - generic [ref=e44]:
          - generic [ref=e45]: İÇERİK
          - generic [ref=e46]: 3 Ritüel
        - generic [ref=e47]:
          - generic [ref=e48]: FİYAT
          - generic [ref=e49]: 280 €
      - paragraph [ref=e51]: İki terapistin eşzamanlı uyguladığı özel masaj, geleneksel hamam ritüeli ve Sothys cilt bakımından oluşan bu paket; çiftler için tasarlanmış en özel spa yolculuğudur. Birlikte hissedilen derin huzur ve yenilenme anları için.
      - blockquote [ref=e52]: "\"Birlikte paylaşılan sessizlik, en derin bağı kurar.\""
      - generic [ref=e53]:
        - img "Romantik Kaçış Paketi – çift hamam ritüeli atmosferi" [ref=e54]
        - generic [ref=e55]: Santis Club — Özel Çift Salonu
      - generic [ref=e56]:
        - generic [ref=e57]:
          - generic [ref=e58] [cursor=pointer]:
            - generic [ref=e59]: Paket İçeriği
            - generic [ref=e60]: +
          - generic:
            - list [ref=e61]:
              - listitem [ref=e62]: — Eşzamanlı Çift Masajı (60 dk) — 2 terapist
              - listitem [ref=e63]: — Sultan Hamamı Ritüeli — kese & köpük (45 dk)
              - listitem [ref=e64]: — Sothys Yüz Bakımı (45 dk)
              - listitem [ref=e65]: — Isıtılmış aromaterapi yağları
              - listitem [ref=e66]: — Özel soyunma odası ve lounge erişimi
              - listitem [ref=e67]: — Çiçek yaprakları & romantik süsleme
            - text: — — — — — —
        - generic [ref=e68]:
          - generic [ref=e69] [cursor=pointer]:
            - generic [ref=e70]: Faydaları
            - generic [ref=e71]: +
          - generic:
            - list [ref=e72]:
              - listitem [ref=e73]: — Derin kas gevşemesi ve stres azaltma
              - listitem [ref=e74]: — Kan dolaşımı & lenf drenajı aktivasyonu
              - listitem [ref=e75]: — Cilt parlaklığı ve nem dengesi
              - listitem [ref=e76]: — Çift arasında duygusal bağı güçlendirme
              - listitem [ref=e77]: — Enerji yenilenmesi ve zihinsel berraklık
            - text: — — — — —
        - generic [ref=e78]:
          - generic [ref=e79] [cursor=pointer]:
            - generic [ref=e80]: Önemli Bilgiler
            - generic [ref=e81]: +
          - paragraph [ref=e82]: Paket randevusu için en az 24 saat öncesinden rezervasyon yapılması gerekmektedir. Gebelik ve ciddi sağlık sorunları için lütfen önce terapistimizle görüşün. Seanslar özel salonumuzda yapılır.
      - generic [ref=e83]:
        - button "REZERVASYON YAP" [ref=e84]:
          - generic [ref=e85]: REZERVASYON YAP
        - link "WHATSAPP İLE SOR" [ref=e86]:
          - /url: https://wa.me/905348350169
  - dialog "Romantik Kaçış Paketi" [ref=e87]:
    - generic [ref=e88]:
      - button "Kapat" [ref=e89]: ×
      - paragraph [ref=e90]: Santis Club
      - heading "Romantik Kaçış Paketi" [level=2] [ref=e91]
      - paragraph [ref=e92]: 150 dk · 2 Kişi · 280 €
      - generic [ref=e93]:
        - generic [ref=e94]:
          - generic [ref=e95]:
            - text: AD SOYAD *
            - textbox "AD SOYAD *" [active] [ref=e96]:
              - /placeholder: İsminiz
          - generic [ref=e97]:
            - text: TELEFON *
            - textbox "TELEFON *" [ref=e98]:
              - /placeholder: 0533 000 00 00
          - generic [ref=e99]:
            - text: E-POSTA (opsiyonel)
            - textbox "E-POSTA (opsiyonel)" [ref=e100]:
              - /placeholder: onay@email.com
          - generic [ref=e101]:
            - text: TERCİH EDİLEN TARİH *
            - textbox "TERCİH EDİLEN TARİH *" [ref=e102]
          - generic [ref=e103]:
            - text: TERCİH EDİLEN SAAT
            - combobox "TERCİH EDİLEN SAAT" [ref=e104]:
              - option "Seçiniz" [selected]
              - option "09:00"
              - option "10:00"
              - option "11:00"
              - option "13:00"
              - option "14:00"
              - option "15:00"
              - option "16:00"
          - generic [ref=e105]:
            - text: EKLEMEK İSTEDİKLERİNİZ
            - textbox "EKLEMEK İSTEDİKLERİNİZ" [ref=e106]:
              - /placeholder: Özel istekler, alerji bilgisi vs.
        - button "REZERVASYON YAP" [ref=e107]
        - paragraph [ref=e108]: API erişilemezse otomatik WhatsApp'a yönlendirilirsiniz.
  - img
  - generic:
    - generic: RİTÜEL BAŞARIYLA
    - generic: MÜHÜRLENDİ
    - button "Devam Et" [ref=e109]
  - generic:
    - generic:
      - img
      - generic: Apple Wallet'a Ekle
    - generic: Fiziksel Erişim İçin Dijital Mühür
```

# Test source

```ts
  351 |             const request = route.request();
  352 |             capturedBody  = JSON.parse(request.postData() || '{}');
  353 | 
  354 |             await route.fulfill({
  355 |                 status:      200,
  356 |                 contentType: 'application/json',
  357 |                 body: JSON.stringify({ success: true, ref_id: 'TEST-PAYLOAD' }),
  358 |             });
  359 |         });
  360 | 
  361 |         await pg.goto();
  362 |         await pg.openModal();
  363 |         await pg.fillForm(VALID_FORM);
  364 |         await pg.submit();
  365 | 
  366 |         await expect(pg.successLayer).toBeVisible({ timeout: 15_000 });
  367 | 
  368 |         // Payload kontrolü
  369 |         expect(capturedBody).toMatchObject({
  370 |             guest_name:  'Elif Kaya',
  371 |             guest_phone: '05551234567',
  372 |             guest_email: 'elif@test.com',
  373 |         });
  374 |     });
  375 | 
  376 |     test('Content-Type application/json olarak gönderilmeli', async ({ page }) => {
  377 |         const pg = new ReservasyonPage(page);
  378 | 
  379 |         let requestContentType = '';
  380 | 
  381 |         await page.route('**/api/v1/public/reservation', async route => {
  382 |             requestContentType = route.request().headers()['content-type'] || '';
  383 |             await route.fulfill({
  384 |                 status:      200,
  385 |                 contentType: 'application/json',
  386 |                 body: JSON.stringify({ success: true, ref_id: 'CT-TEST' }),
  387 |             });
  388 |         });
  389 | 
  390 |         await pg.goto();
  391 |         await pg.openModal();
  392 |         await pg.fillForm(VALID_FORM);
  393 |         await pg.submit();
  394 | 
  395 |         await expect(pg.successLayer).toBeVisible({ timeout: 15_000 });
  396 |         expect(requestContentType).toContain('application/json');
  397 |     });
  398 | 
  399 | });
  400 | 
  401 | // ────────────────────────────────────────────────────────────────────────────────
  402 | // 7. ERİŞİLEBİLİRLİK (A11y)
  403 | // ────────────────────────────────────────────────────────────────────────────────
  404 | test.describe('Erişilebilirlik', () => {
  405 | 
  406 |     test('modal ARIA nitelikleri doğru', async ({ page }) => {
  407 |         const pg = new ReservasyonPage(page);
  408 |         await pg.goto();
  409 |         await pg.openModal();
  410 | 
  411 |         await expect(pg.modal).toHaveAttribute('role', 'dialog');
  412 |         await expect(pg.modal).toHaveAttribute('aria-modal', 'true');
  413 |         await expect(pg.modal).toHaveAttribute('aria-labelledby', 'modal-title');
  414 |         await expect(page.locator('#modal-title')).toBeVisible();
  415 |     });
  416 | 
  417 |     test('kapat butonu aria-label içeriyor', async ({ page }) => {
  418 |         const pg = new ReservasyonPage(page);
  419 |         await pg.goto();
  420 |         await pg.openModal();
  421 | 
  422 |         await expect(pg.closeBtn).toHaveAttribute('aria-label', 'Kapat');
  423 |     });
  424 | 
  425 |     test('hero görselinin alt metni açıklayıcı', async ({ page }) => {
  426 |         const pg = new ReservasyonPage(page);
  427 |         await pg.goto();
  428 | 
  429 |         const alt = await page.locator('#cinMainVisual').getAttribute('alt');
  430 |         expect(alt?.length).toBeGreaterThan(10); // Anlamlı alt metin
  431 |         expect(alt).not.toMatch(/^image|^img|^\s*$/i);
  432 |     });
  433 | 
  434 | });
  435 | 
  436 | // ────────────────────────────────────────────────────────────────────────────────
  437 | // 8. MOBİL (iPhone 14)
  438 | // ────────────────────────────────────────────────────────────────────────────────
  439 | test.describe('Mobil Deneyim', { tag: '@mobile' }, () => {
  440 | 
  441 |     test('modal mobilde tam genişlik açılıyor', async ({ page }) => {
  442 |         // Viewport zaten playwright.config'deki mobile-safari projesi ile ayarlanır
  443 |         const pg = new ReservasyonPage(page);
  444 |         await pg.goto();
  445 |         await pg.openModal();
  446 | 
  447 |         const modalCard = page.locator('.nv-modal-card');
  448 |         const box       = await modalCard.boundingBox();
  449 | 
  450 |         // min(520px, 92vw) — 390px ekranda 92*390/100 ≈ 359px
> 451 |         expect(box?.width).toBeLessThanOrEqual(400);
      |                            ^ Error: expect(received).toBeLessThanOrEqual(expected)
  452 |         expect(box?.width).toBeGreaterThan(300);
  453 |     });
  454 | 
  455 |     test('form input\'ları mobilde touchable (≥44px)', async ({ page }) => {
  456 |         const pg = new ReservasyonPage(page);
  457 |         await pg.goto();
  458 |         await pg.openModal();
  459 | 
  460 |         const nameBox = await pg.nameInput.boundingBox();
  461 |         expect(nameBox?.height).toBeGreaterThanOrEqual(44); // WCAG touch target
  462 |     });
  463 | 
  464 | });
  465 | 
```