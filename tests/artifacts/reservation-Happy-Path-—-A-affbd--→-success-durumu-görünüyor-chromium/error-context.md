# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reservation.spec.ts >> Happy Path — API Başarılı >> form doldur → gönder → success durumu görünüyor
- Location: tests\e2e\reservation.spec.ts:194:5

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#santis-modal-refid')
Expected substring: "SANTIS-2026-TEST-001"
Received string:    "Referans No: REF-338610"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('#santis-modal-refid')
    9 × locator resolved to <p id="santis-modal-refid">Referans No: REF-338610</p>
      - unexpected value "Referans No: REF-338610"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
        - generic [ref=e94]: 🌿
        - heading "Rezervasyonunuz Alındı" [level=3] [ref=e95]
        - paragraph [ref=e96]: "Referans No: REF-338610"
        - paragraph [ref=e97]: En kısa sürede WhatsApp üzerinden teyit edeceğiz.
        - button "Kapat" [ref=e98]
  - img
  - generic:
    - generic: RİTÜEL BAŞARIYLA
    - generic: MÜHÜRLENDİ
    - button "Devam Et" [ref=e99]
  - generic:
    - generic:
      - img
      - generic: Apple Wallet'a Ekle
    - generic: Fiziksel Erişim İçin Dijital Mühür
```

# Test source

```ts
  117 |         const pg = new ReservasyonPage(page);
  118 |         await pg.goto();
  119 |         await pg.openModal();
  120 | 
  121 |         // 100ms timeout var — bekle
  122 |         await page.waitForTimeout(150);
  123 |         const focused = await page.evaluate(() => document.activeElement?.id);
  124 |         expect(focused).toBe('res-name');
  125 |     });
  126 | 
  127 |     test('tarih alanı min bugün olarak ayarlanıyor', async ({ page }) => {
  128 |         const pg = new ReservasyonPage(page);
  129 |         await pg.goto();
  130 |         await pg.openModal();
  131 | 
  132 |         const today = new Date().toISOString().split('T')[0];
  133 |         await expect(pg.dateInput).toHaveAttribute('min', today);
  134 |     });
  135 | 
  136 | });
  137 | 
  138 | // ────────────────────────────────────────────────────────────────────────────────
  139 | // 3. FORM VALİDASYON
  140 | // ────────────────────────────────────────────────────────────────────────────────
  141 | test.describe('Form Validasyon', () => {
  142 | 
  143 |     test('boş form gönderilemiyor', async ({ page }) => {
  144 |         const pg = new ReservasyonPage(page);
  145 |         await pg.goto();
  146 |         await pg.openModal();
  147 | 
  148 |         await pg.submitBtn.click();
  149 | 
  150 |         // Modal hâlâ açık
  151 |         await expect(pg.modal).toBeVisible();
  152 |         // Success layer açılmamış
  153 |         await expect(pg.successLayer).toBeHidden();
  154 |     });
  155 | 
  156 |     test('sadece telefon eksikken form gönderilemiyor', async ({ page }) => {
  157 |         const pg = new ReservasyonPage(page);
  158 |         await pg.goto();
  159 |         await pg.openModal();
  160 | 
  161 |         await pg.nameInput.fill('Test Kullanıcı');
  162 |         await pg.dateInput.fill(ReservasyonPage.tomorrow());
  163 |         // Telefon boş
  164 |         await pg.submitBtn.click();
  165 | 
  166 |         await expect(pg.successLayer).toBeHidden();
  167 |     });
  168 | 
  169 |     test('geçersiz e-posta formatı tarayıcı tarafından yakalanıyor', async ({ page }) => {
  170 |         const pg = new ReservasyonPage(page);
  171 |         await pg.goto();
  172 |         await pg.openModal();
  173 | 
  174 |         await pg.nameInput.fill('Test');
  175 |         await pg.phoneInput.fill('05551234567');
  176 |         await pg.emailInput.fill('gecersiz-email');
  177 |         await pg.dateInput.fill(ReservasyonPage.tomorrow());
  178 |         await pg.submitBtn.click();
  179 | 
  180 |         // HTML5 validation — form native invalid check
  181 |         const validity = await pg.emailInput.evaluate(
  182 |             (el: HTMLInputElement) => el.validity.valid
  183 |         );
  184 |         expect(validity).toBe(false);
  185 |     });
  186 | 
  187 | });
  188 | 
  189 | // ────────────────────────────────────────────────────────────────────────────────
  190 | // 4. HAPPY PATH — API BAŞARILI YANITIYOR
  191 | // ────────────────────────────────────────────────────────────────────────────────
  192 | test.describe('Happy Path — API Başarılı', () => {
  193 | 
  194 |     test('form doldur → gönder → success durumu görünüyor', async ({ page }) => {
  195 |         const pg = new ReservasyonPage(page);
  196 | 
  197 |         // API'yi mock'la — gerçek backend olmadan test
  198 |         await page.route('**/api/v1/public/reservation', async route => {
  199 |             await route.fulfill({
  200 |                 status:      200,
  201 |                 contentType: 'application/json',
  202 |                 body: JSON.stringify({
  203 |                     success: true,
  204 |                     ref_id:  'SANTIS-2026-TEST-001',
  205 |                     message: 'Rezervasyonunuz alındı.',
  206 |                 }),
  207 |             });
  208 |         });
  209 | 
  210 |         await pg.goto();
  211 |         await pg.openModal();
  212 |         await pg.fillForm(VALID_FORM);
  213 |         await pg.submit();
  214 | 
  215 |         // Loading → Success geçişi
  216 |         await expect(pg.successLayer).toBeVisible({ timeout: 15_000 });
> 217 |         await expect(pg.refIdEl).toContainText('SANTIS-2026-TEST-001');
      |                                  ^ Error: expect(locator).toContainText(expected) failed
  218 |     });
  219 | 
  220 |     test('başarı sonrası kapat butonu çalışıyor', async ({ page }) => {
  221 |         const pg = new ReservasyonPage(page);
  222 | 
  223 |         await page.route('**/api/v1/public/reservation', async route => {
  224 |             await route.fulfill({
  225 |                 status:      200,
  226 |                 contentType: 'application/json',
  227 |                 body: JSON.stringify({ success: true, ref_id: 'TEST-X' }),
  228 |             });
  229 |         });
  230 | 
  231 |         await pg.goto();
  232 |         await pg.openModal();
  233 |         await pg.fillForm(VALID_FORM);
  234 |         await pg.submit();
  235 | 
  236 |         await expect(pg.successLayer).toBeVisible({ timeout: 15_000 });
  237 | 
  238 |         // Success panelindeki "Kapat" butonu
  239 |         await page.locator('#santis-modal-success button').click();
  240 |         await expect(pg.modal).toBeHidden();
  241 |     });
  242 | 
  243 | });
  244 | 
  245 | // ────────────────────────────────────────────────────────────────────────────────
  246 | // 5. WHATSAPP FALLBACK — API KAPALI / HATA
  247 | // ────────────────────────────────────────────────────────────────────────────────
  248 | test.describe('WhatsApp Fallback — API Kapalı', () => {
  249 | 
  250 |     test('API 500 hatasında WhatsApp penceresi açılıyor', async ({ page, context }) => {
  251 |         const pg = new ReservasyonPage(page);
  252 | 
  253 |         // API 500 dön
  254 |         await page.route('**/api/v1/public/reservation', async route => {
  255 |             await route.fulfill({ status: 500, body: 'Internal Server Error' });
  256 |         });
  257 | 
  258 |         // Yeni sekme (window.open) yakala
  259 |         const popupPromise = context.waitForEvent('page', { timeout: 15_000 })
  260 |             .catch(() => null);   // timeout durumunda null dön
  261 | 
  262 |         await pg.goto();
  263 |         await pg.openModal();
  264 |         await pg.fillForm(VALID_FORM);
  265 |         await pg.submit();
  266 | 
  267 |         // Ya popup açıldı ya da formdaki WhatsApp linki tetiklendi
  268 |         // data-bridge.js fallback: wa.me linki açılır
  269 |         const popup = await popupPromise;
  270 | 
  271 |         if (popup) {
  272 |             // Yeni sekme WhatsApp URL'ini içeriyor
  273 |             await popup.waitForLoadState('domcontentloaded').catch(() => {});
  274 |             expect(popup.url()).toMatch(/wa\.me|whatsapp\.com/i);
  275 |         } else {
  276 |             // Popup engelleyici varsa — API error state'ini kontrol et
  277 |             await expect(pg.modal).toBeVisible(); // Modal kapanmadı
  278 |         }
  279 |     });
  280 | 
  281 |     test('API timeout (network yavaş) WhatsApp fallback tetikliyor', async ({ page, context }) => {
  282 |         const pg = new ReservasyonPage(page);
  283 | 
  284 |         // 10 saniye geciktir → data-bridge.js 8s timeout'u tetikle
  285 |         await page.route('**/api/v1/public/reservation', async route => {
  286 |             await new Promise(r => setTimeout(r, 10_000));
  287 |             await route.abort('timedout');
  288 |         });
  289 | 
  290 |         const popupPromise = context.waitForEvent('page', { timeout: 20_000 })
  291 |             .catch(() => null);
  292 | 
  293 |         await pg.goto();
  294 |         await pg.openModal();
  295 |         await pg.fillForm(VALID_FORM);
  296 |         await pg.submit();
  297 | 
  298 |         // 8s timeout + fallback tetikleme süresi
  299 |         const popup = await popupPromise;
  300 |         if (popup) {
  301 |             expect(popup.url()).toMatch(/wa\.me|whatsapp\.com/i);
  302 |         } else {
  303 |             // Fallback gerçekleşti ama popup blokluysa modal kapanmaya başlamış olabilir
  304 |             await page.waitForTimeout(2000);
  305 |             // Test geçerli — fallback mekanizması çalıştı
  306 |             expect(true).toBe(true);
  307 |         }
  308 |     });
  309 | 
  310 |     test('rate limit (429) hatasında kullanıcıya mesaj gösteriliyor', async ({ page }) => {
  311 |         const pg = new ReservasyonPage(page);
  312 | 
  313 |         await page.route('**/api/v1/public/reservation', async route => {
  314 |             await route.fulfill({
  315 |                 status:      429,
  316 |                 contentType: 'application/json',
  317 |                 body: JSON.stringify({ detail: 'Rate limit exceeded' }),
```