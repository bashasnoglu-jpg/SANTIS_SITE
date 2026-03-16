// 🌍 [SANTIS EXPERIENCE OS v4.0 - THE POLYGLOT KERNEL]
// Zırhlar: Surgical Text Replace, rAF Batching, Mutation Shield, Event Delegation, FOUC Cloak

class SantisExperienceOS {
    constructor() {
        this.currentLang = localStorage.getItem('santis_lang') || 'en';
        this.state = { i18n: {}, routes: {}, media: {} };
        this.observer = null;
        this.isMutating = false; // Sonsuz Döngü Kalkanı

        // 🛡️ FOUC Kalkanı: Veri gelene kadar siteyi zarifçe gizle (Titremeyi önler)
        document.documentElement.style.opacity = '0';
        document.documentElement.style.transition = 'opacity 0.6s cubic-bezier(0.23, 1, 0.32, 1)';

        this.bootSequence();
    }

    async bootSequence() {
        try {
            // 1. Kognitif Çekirdekleri Paralel İndir (Maksimum Ağ Hızı)
            const [i18nRes, routesRes, mediaRes] = await Promise.all([
                fetch('/assets/data/i18n.json').catch(() => ({ json: () => ({}) })),
                fetch('/assets/data/routes.json').catch(() => ({ json: () => ({}) })),
                fetch('/assets/data/media_manifest.json').catch(() => ({ json: () => ({}) }))
            ]);

            this.state.i18n = await i18nRes.json();
            this.state.routes = await routesRes.json();
            this.state.media = await mediaRes.json(); // Phase 61 Hazırlığı!

            // 2. DOM'u İlk Kez Mühürle
            await this.renderDOM(document.body);

            // 3. FOUC Kalkanını Kaldır ve Sistemi Asilce Göster
            document.documentElement.lang = this.currentLang;
            document.documentElement.style.opacity = '1';

            // 4. Otonom Gözcü ve Nöbetçileri Başlat
            this.startMutationSentinel();
            this.bindGlobalDelegation();

            console.log(`⚡ [EXPERIENCE OS] Kernel Aktif. Sistem Titreşimsiz Çalışıyor: [${this.currentLang.toUpperCase()}]`);
        } catch (e) {
            console.error("🔥 [OS KERNEL PANIC] Boot sekansı çöktü:", e);
            document.documentElement.style.opacity = '1'; // Hata olursa site kör kalmasın
        }
    }

    // ⚡ 60FPS BATCH RENDERING (Layout Thrashing'i Engeller)
    async renderDOM(context) {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                this.isMutating = true; // Kalkanı İndir (MutationObserver bizi görmesin diye)

                // A. SEMANTİK METİNLER (i18n)
                context.querySelectorAll('[data-i18n]').forEach(el => {
                    const val = this.resolvePath(this.state.i18n, el.dataset.i18n);
                    if (val && val[this.currentLang]) {
                        this.surgicalTextReplace(el, val[this.currentLang]);
                    }
                });

                // B. FORM YER TUTUCULARI
                context.querySelectorAll('[data-placeholder]').forEach(el => {
                    const val = this.resolvePath(this.state.i18n, el.dataset.placeholder);
                    if (val && val[this.currentLang]) {
                        el.setAttribute('placeholder', val[this.currentLang]);
                    }
                });

                // C. ROTA MOTORU (Kırık Link & Scroll Reset İmhası)
                context.querySelectorAll('[data-route]').forEach(el => {
                    const val = this.resolvePath(this.state.routes, el.dataset.route);
                    if (val && val[this.currentLang]) {
                        el.setAttribute('href', `/${this.currentLang}${val[this.currentLang]}`);
                        el.dataset.invalidRoute = "false";
                    } else {
                        el.setAttribute('href', 'javascript:void(0)');
                        el.dataset.invalidRoute = "true"; // Otonom kalkan için zehirli işaret
                    }
                });

                // D. GÖRSEL MANİFESTO (Phase 61 Entegrasyon Yuvası - Oto Alt Tag)
                context.querySelectorAll('[data-media]').forEach(img => {
                    const val = this.resolvePath(this.state.media, img.dataset.media);
                    if (val) {
                        if (img.src !== val.src) img.src = val.src; // Gereksiz Reflow engeli
                        if (val.alt && val.alt[this.currentLang]) {
                            img.setAttribute('alt', val.alt[this.currentLang]);
                        }
                    }
                });

                this.isMutating = false; // Kalkanı Kaldır
                resolve();
            });
        });
    }

    // 🛡️ CERRAHİ METİN DEĞİŞİMİ (İkon Katliamını Önler)
    surgicalTextReplace(el, newText) {
        let hasTextNode = false;
        // İçindeki Node'ları tek tek gez, sadece Metin (Text) olanı bul ve değiştir
        for (let node of el.childNodes) {
            if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== '') {
                node.nodeValue = newText;
                hasTextNode = true;
                break;
            }
        }
        // Eğer içinde hiç TextNode yoksa mecburen içeriği tamamen değiştir
        if (!hasTextNode) {
            el.textContent = newText;
        }
    }

    // JSON Yolu Çözücü (Örn: "nav.spa")
    resolvePath(obj, path) {
        if (!path) return null;
        return path.split('.').reduce((p, c) => p && p[c], obj);
    }

    // 👁️ OTONOM GÖZCÜ (DOM'a sonradan eklenen Sepet/Modal elementlerini anında çevirir)
    startMutationSentinel() {
        this.observer = new MutationObserver((mutations) => {
            if (this.isMutating) return; // Kalkan açıksa umursama (Infinite Loop Engelle!)

            let shouldRender = false;
            for (let m of mutations) {
                if (m.addedNodes.length > 0) {
                    shouldRender = true;
                    break;
                }
            }
            if (shouldRender) this.renderDOM(document.body);
        });

        this.observer.observe(document.body, { childList: true, subtree: true });
    }

    // 🚀 SIFIR HAFIZA SIZINTISI (Global Event Delegation)
    bindGlobalDelegation() {
        document.body.addEventListener('click', (e) => {
            // Boş Rota Tıklamalarını Yakala ve Sıçramayı (CLS) Koru
            const routeLink = e.target.closest('[data-route]');
            if (routeLink && routeLink.dataset.invalidRoute === "true") {
                e.preventDefault();
                console.warn("🛡️ [Sovereign Shield] Boş rotaya tıklandı. Kognitif akış kesildi (Titreme önlendi).");
            }

            // Siberpunk Dil Değiştirici
            const langSwitch = e.target.closest('[data-lang-switch]');
            if (langSwitch) {
                e.preventDefault();
                this.switchLanguage(langSwitch.dataset.langSwitch);
            }
        });
    }

    // 🌍 KOGNİTİF DİL DEĞİŞTİRME (Zero-Latency)
    switchLanguage(lang) {
        if (lang === this.currentLang) return;
        this.currentLang = lang;
        localStorage.setItem('santis_lang', lang);

        // Ekranı hafifçe karart (Opacity dalgalanması)
        document.body.style.opacity = '0.3';

        setTimeout(async () => {
            await this.renderDOM(document.body);
            document.documentElement.lang = lang;
            document.body.style.opacity = '1';
        }, 300);
    }
}

// Otonom Başlatıcı
document.addEventListener('DOMContentLoaded', () => {
    window.SantisOS = new SantisExperienceOS();
});
