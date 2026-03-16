/**
 * SANTIS OS - SOVEREIGN ROUTER & TRANSITION PIPELINE 
 * Tarayıcı İntiharını Durduran, DOM'u Evrilten Kuantum Geçiş Motoru
 * (Çift rAF Kalkanı ve Scroll Restorasyonu ile)
 */

export class SovereignRouter {
    constructor(diffEngine, appSelector = '#nv-main') {
        this.diffEngine = diffEngine;
        this.appContainer = document.querySelector(appSelector) || document.querySelector('#cinematic-wrapper') || document.querySelector('main');

        if (this.appContainer && this.appContainer.id) {
            this.appSelector = '#' + this.appContainer.id;
        } else {
            this.appSelector = appSelector;
        }

        this.isAnimating = false;

        if (!this.appContainer) {
            console.warn(`[Sovereign Router] Kritik: Ana container bulunamadı! Geçiş motoru beklemede.`);
        }

        // Kuantum Kontrolü bizde - Tarayıcının varsayılan scroll restorasyonunu kapat (Zıplamayı önler)
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }

        this.initInterceptor();
        console.log("🦅 [Sovereign Router] Kuantum Geçiş Hattı ve Çift rAF Kalkanı Aktif.");
    }

    initInterceptor() {
        document.body.addEventListener('click', (e) => {
            const link = e.target.closest('a');

            // Eğer Lüks Sınırımız (Aynı origin) dışında veya boş (hash/javascript) ise karışma
            if (!link || link.origin !== window.location.origin) return;
            if (link.target === '_blank' || link.hash || link.getAttribute('download') !== null) return;
            if (link.pathname === window.location.pathname) {
                e.preventDefault();
                return; // Zaten olduğumuz sayfa
            }

            e.preventDefault(); // İntiharı (Hard Reload) Durdur
            this.navigate(link.pathname);
        });

        // Tarayıcının Geri/İleri (Zaman Yolculuğu) Butonlarını Koru
        window.addEventListener('popstate', () => {
            this.navigate(window.location.pathname, false);
        });
    }

    async navigate(targetUrl, pushToHistory = true) {
        if (this.isAnimating || !this.appContainer) return; // Spam veya Eksik Kurulum Kalkanı
        this.isAnimating = true;

        // 1. FADE-OUT: Mevcut DOM'u yumuşakça karanlığa göm (GPU Arkada Hala Dönüyor)
        this.appContainer.style.opacity = '0';
        this.appContainer.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

        try {
            // 2. THE GHOST FETCH: Yeni Sayfayı Arka Planda Çek ve Kuantum Kopya (Sanal DOM) Yarat
            const response = await fetch(targetUrl);
            const htmlString = await response.text();

            const parser = new DOMParser();
            const virtualDoc = parser.parseFromString(htmlString, 'text/html');
            const newContainer = virtualDoc.querySelector(this.appSelector) || virtualDoc.querySelector('#cinematic-wrapper') || virtualDoc.querySelector('#nv-main') || virtualDoc.querySelector('main');
            const newTitle = virtualDoc.querySelector('title') ? virtualDoc.querySelector('title').innerText : document.title;

            if (!newContainer) {
                throw new Error("Hedef Belgede Sığınak Container Bulunamadı.");
            }

            // Eğer sayfa değiştirirken container ID'si evrimleştiyse (örn. #nv-main -> #cinematic-wrapper)
            if (this.appContainer.id !== newContainer.id) {
                this.appContainer.id = newContainer.id;
                this.appContainer.className = newContainer.className;
                this.appSelector = '#' + newContainer.id;
            }

            // Göz İllüzyonu: Geçişin "Lüks" Hissedilmesi İçin En Az Fade-Out Süresi Kadar Bekle
            await new Promise(resolve => setTimeout(resolve, 400));

            // 3. THE QUANTUM MORPH: Eski İçeriği Silmeden Diff Engine İle Yama (GPU Tütmeye Devam Ediyor)
            this.diffEngine.patchContainer(this.appContainer, newContainer);

            // ZAMAN YOLCULUĞU VE ODAK SIFIRLAMA (Scroll Restoration)
            // Sayfa içeriği değiştiğine göre vizörü (Kamerayı) en tepeye pürüzsüzce sıfırla!
            window.scrollTo({ top: 0, behavior: 'auto' });

            // 4. URL VE BAŞLIK GÜNCELLEMESİ (Tarih Yazılır)
            document.title = newTitle;
            if (pushToHistory) {
                window.history.pushState({ path: targetUrl }, newTitle, targetUrl);
            }

            // 5. FADE-IN (Çift rAF Kalkanı): Yeni içerik DOM'a yerleşti. Işıkları Lüksçe Aç!
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this.appContainer.style.opacity = '1';

                    // Geçiş Süresince Tetiklenebilecek Kuantum Olaylarını Bildir
                    if (window.Santis && window.Santis.Bus) {
                        window.Santis.Bus.emit('router:morphed', { target: targetUrl });
                    }

                    // Rota başarıyla tamamlandı, zırhı indir
                    setTimeout(() => { this.isAnimating = false; }, 400);
                });
            });

        } catch (error) {
            console.error("[Sovereign Router] Kuantum Sıçramasında Hata. Acil Çıkış Protokolü (Hard Reload) Tetikleniyor:", error);
            window.location.href = targetUrl;
        }
    }
}

window.SovereignRouter = SovereignRouter;
