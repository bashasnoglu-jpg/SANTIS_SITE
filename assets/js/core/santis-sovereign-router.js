// assets/js/core/santis-sovereign-router.js
// SDCR V62.0 - SOVEREIGN QUANTUM ROUTER (Zero-Reload SPA & Ghost Modules)
import { SovereignFocusManager } from './santis-a11y.js';

export class SovereignRouter {
  constructor(viewportId = 'sovereign-viewport') {
    this.viewport = document.getElementById(viewportId);
    this.activeModule = null; // Ghost Modül takibi (Apoptosis için)
    
    if (!this.viewport) {
        console.warn(`[ROUTER] 🩸 Otoyol koptu: '${viewportId}' (Ana Damar) bulunamadı.`);
        return;
    }

    // 1. Tarayıcı Geri/İleri Butonlarını (Time Travel) Ele Geçir
    window.addEventListener('popstate', (e) => {
        // [SP5] OTONOM DİL MOTORU: Zaman yolculuğunda dil atlaması kontrolü
        const path = window.location.pathname;
        const langMatch = path.match(/^\/([a-z]{2})(\/|$)/);
        const expectedLang = langMatch ? langMatch[1] : 'tr';
        
        if (window.SantisOmniLang && window.SantisOmniLang.currentLang !== expectedLang) {
            console.log(`⏳ [Zaman Yolculuğu] Dil Bükülmesi saptandı. TR <-> ${expectedLang}`);
            window.SantisOmniLang.setLangGateway(expectedLang, true); // true = pushState iptal, zaten popstate oldu
        }

        this.navigate(path, false);
    });

    // 2. Otonom Link Dinleyici (DOM'daki tüm <a> etiketlerini ele geçir)
    this.interceptLinks();

    // 3. Otonom Odak Motorunu Başlat (Gözlem ve Modal Hapsi)
    if (!window.SANTIS_A11Y) {
        window.SANTIS_A11Y = new SovereignFocusManager();
    }

    console.log("🌌 [ROUTER] Sovereign Quantum Router Online. SPA Matrix Aktif.");
  }

  async navigate(path, pushHistory = true) {
    if (path === window.location.pathname && pushHistory) return; // Aynı rotadaysak dur

    console.log(`🚀 [ROUTER] Kuantum Sıçrama Başlatılıyor -> ${path}`);
    
    // Geçiş anında ufak bir algısal gerilim efekti (Eğer Calm Core aktifse)
    if (window.SANTIS_CALM) window.SANTIS_CALM.setMode("alert"); 

    try {
        // 1. Ghost Module (Arka Planda Fetch & Parse)
        const viewData = await this.resolveRoute(path);

        if (!viewData) throw new Error("Doku sentezlenemedi (404).");

        // APOPTOSIS (Kanser Önleme / Hafıza Temizliği)
        if (this.activeModule && typeof this.activeModule.unmount === 'function') {
            console.log(`💀 [APOPTOSIS] Eski organın can suyu kesiliyor (Unmount)...`);
            try { this.activeModule.unmount(); } catch (e) { console.error(e); }
            this.activeModule = null;
        }

        // 2. Kuantum Geçiş (View Transitions API - Sinematik Cross-fade)
        const executeSwap = () => {
            const template = document.getElementById(viewData.templateId);
            if (window.DOMForge && typeof window.DOMForge.mount === 'function') {
                window.DOMForge.mount(viewData.templateId, this.viewport, false);
            } else if (template) {
                // FALLBACK: Eğer DOMForge aktif değilse klasik enjeksiyon yap! 
                // Not: DOM değişmezse Tarayıcı 'AbortError: Transition was skipped' fırlatır!
                this.viewport.innerHTML = template.innerHTML;
            }
            
            // URL'i sayfayı yenilemeden sessizce bük
            if (pushHistory) window.history.pushState({ path }, "", path);
            
            // Sayfa başlığını ve VİTRİN etiketlerini (Meta, Title) güncelle
            if (viewData.ghostHead) {
                document.title = viewData.ghostHead.title;
                
                // Eski dinamik etiketleri (ve Ghost'tan gelen title'ları) temizle
                document.head.querySelectorAll('meta[data-santis-head], title[data-lang]').forEach(el => el.remove());
                
                // Yeni etiketleri ekle (Meta tags & multi-lang titles)
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = viewData.ghostHead.metaTags.join('');
                Array.from(tempDiv.children).forEach(el => {
                    el.setAttribute('data-santis-head', 'true');
                    document.head.appendChild(el);
                });
            } else if (viewData.title) {
                document.title = viewData.title;
            }

            // OTONOM DİL YENİLEME: Yeni çekilen HTML ana dilde (TR) geleceği için,
            // eğer kullanıcı şu an yabancı dildeyse Omnilang'i tetikleyerek DOM'u hemen tercüme et!
            if (window.SantisOmniLang && window.SantisOmniLang.currentLang !== 'tr') {
                window.SantisOmniLang.setLangGateway(window.SantisOmniLang.currentLang, true, true);
            }
            
            if (window.SANTIS_CALM) window.SANTIS_CALM.setMode("calm"); // Geçiş bitti, sistemi sakinleştir
            console.log(`✅ [ROUTER] Gerçeklik Değişti. Bulunulan Boyut: ${path}`);
            
            // Otonom Odak (A11y) Sıfırlaması: Yeni rotaya geçince ekran okuyucularına sayfanın değiştiği belirtilir
            setTimeout(() => {
                const focusTarget = document.querySelector('h1, h2, main');
                if (focusTarget) {
                    focusTarget.setAttribute('tabindex', '-1');
                    focusTarget.style.outline = 'none';
                    focusTarget.focus();
                } else {
                    document.body.setAttribute('tabindex', '-1');
                    document.body.focus();
                }
                window.scrollTo(0, 0); 
            }, 50);

            // Yeni sayfaya özel JS'leri tetiklemek için Kovan'a sinyal gönder
            document.dispatchEvent(new CustomEvent('santis:route-changed', { detail: { path, viewData } }));
        };

        if (document.startViewTransition) {
            const vt = document.startViewTransition(executeSwap);
            // Sessizce yut: Eğer kullanıcı hızlıca başka sayfaya tıklarsa (veya tarayıcı animasyonu atlarsa) AbortError fırlatılmasın.
            vt.finished.catch(() => {});
            vt.ready.catch(() => {});
        } else {
            executeSwap(); // API desteklemeyen tarayıcılar için anında kesme (Fallback)
        }

    } catch (error) {
        console.error(`💥 [ROUTER] Sıçrama Başarısız:`, error);
        if (window.SANTIS_CALM) window.SANTIS_CALM.setMode("critical");
    }
  }

  async resolveRoute(path) {
    // Path'ten benzersiz bir template ID üret (/admin/crm.html -> tpl-route-admin-crm-html)
    const routeKey = path.replace(/[^a-zA-Z0-9]/g, '-').replace(/^-+|-+$/g, '') || 'home';
    const templateId = `tpl-route-${routeKey}`;

    // A. CACHE HIT: Şablon zaten ana DOM'da varsa 0.00ms'de dön
    if (document.getElementById(templateId)) {
        const cachedTemplate = document.getElementById(templateId);
        let ghostHead = null;
        try { ghostHead = JSON.parse(cachedTemplate.getAttribute('data-ghost-head')); } catch(e) {}
        
        return { templateId, title: ghostHead ? ghostHead.title : document.title, ghostHead };
    }

    // B. GHOST FETCH: Fiziksel HTML dosyasını arka planda indir
    console.log(`👻 [ROUTER] Ağdan Hayalet Çekimi (Ghost Fetch): ${path}`);
    
    // [SP5] OTONOM KANONİK YAKALAYICI: Sunucuda fiziksel 'en' klasörü yok. Sadece saf dosyayı fetch et.
    let cleanPath = path.replace(/^\/[a-z]{2}(\/|$)/, '/');
    if (cleanPath === '') cleanPath = '/';

    let fetchPath = cleanPath;
    if (!fetchPath.endsWith('.html') && !fetchPath.endsWith('/')) fetchPath += '.html';

    const response = await fetch(fetchPath);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    
    const htmlText = await response.text();
    
    // C. SENTEZ: Gelen HTML'i sanal bir DOM'da ayrıştır (Ana pencereyi dondurmadan)
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const title = doc.querySelector('title')?.innerText || document.title;
    
    // [SP5] VİTRİN (META/TITLE) ENJEKSİYONU: Yeni DOM'un head etiketlerini kopyala
    const ghostHead = {
        title: title,
        metaTags: Array.from(doc.head.querySelectorAll('meta[name="description"], meta[property^="og:"], title[data-lang]')).map(el => el.outerHTML)
    };

    // Hedef sayfada <template id="sovereign-view"> var mı bak, yoksa <main id="sovereign-viewport"> içini al
    let contentNode = doc.querySelector('template#sovereign-view');
    let isTemplate = true;

    if (!contentNode) {
        contentNode = doc.querySelector('main#sovereign-viewport') || doc.querySelector('main') || doc.body;
        isTemplate = false;
    }

    // Yeni bir kapsül yarat ve ana DOM'a ekle (Kriyojenik Hafıza)
    const newTemplate = document.createElement('template');
    newTemplate.id = templateId;
    newTemplate.innerHTML = contentNode.innerHTML;
    newTemplate.setAttribute('data-ghost-head', JSON.stringify(ghostHead));
    document.body.appendChild(newTemplate);

    // D. DYNAMIC IMPORT (Ghost Module): Bu sayfaya özel bir script var mı?
    const scriptMeta = doc.querySelector('meta[name="sovereign-module"]');
    if (scriptMeta) {
        const moduleUrl = scriptMeta.getAttribute('content');
        import(moduleUrl)
            .then((mod) => {
                console.log(`🧬 [GHOST] İzole Modül Uyandırıldı: ${moduleUrl}`);
                if (mod.mount) mod.mount();
                window.SovereignRouter.activeModule = mod;
            })
            .catch(err => console.error(`🩸 [GHOST] Modül Yükleme Hatası:`, err));
    } else {
        window.SovereignRouter.activeModule = null;
    }

    return { templateId, title, ghostHead };
  }

  interceptLinks() {
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href && link.href.startsWith(window.location.origin) && link.target !== '_blank') {
            const url = new URL(link.href);

            // 🛡️ DOKU UYUŞMAZLIĞI KALKANI (Tissue Rejection Bypass)
            // Eğer hedef sayfa '/admin/' dizini dışındaysa SPA çalışsın...
            // Otonom Dil Koruması: Tıklanan link ana dildeyse ve sistem yabancı dildeyse, ön eki hedefe otonom yapıştır!
            let targetPath = url.pathname;
            if (window.SantisOmniLang && window.SantisOmniLang.currentLang !== 'tr') {
                const isAlreadyPrefixed = new RegExp(`^/${window.SantisOmniLang.currentLang}(/|$)`).test(targetPath);
                if (!isAlreadyPrefixed) {
                    let stripped = targetPath.replace(/^\/[a-z]{2}(\/|$)/, '/');
                    targetPath = `/${window.SantisOmniLang.currentLang}${stripped === '/' ? '' : stripped}`;
                    if (targetPath === '') targetPath = '/';
                }
            }

            // Veya bilinçli bir 'data-hard-nav' taşıyorsa Kuantum Geçişi İptal Edilir.
            const isPublicPage = !url.pathname.startsWith('/admin');
            const forceHardNav = link.hasAttribute('data-hard-nav');

            if (isPublicPage || forceHardNav) {
                console.log(`🌌 [ROUTER] Doku Farklılığı: Kuantum geçişi iptal edildi -> Klasik Yükleme Devrede (${url.pathname})`);
                return; // Doğal geçişe izin ver
            }

            // --- Kuantum Geçişi (Ghost Fetch & DOMForge) Başlar ---
            e.preventDefault();
            this.navigate(targetPath + url.search);
        }
    });
  }
}

// Global Singleton Başlatıcı
window.SovereignRouter = new SovereignRouter('sovereign-viewport');
