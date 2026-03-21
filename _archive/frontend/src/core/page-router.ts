import { EventBus } from './santis-bus';
import { Fabric } from '../engines/worker-fabric';

export class PageRouter {
    private currentPath: string = window.location.pathname;
    private htmlCache: Map<string, string> = new Map();

    public async mount(): Promise<void> {
        console.log('🧭 [Page Router] SPA Interceptor aktif. Tüm yerel linkler (<a>) ele geçirildi.');
        
        // 1. Tüm sayfa içi link tıklamalarını yakala (Event Delegation)
        document.body.addEventListener('click', (e) => {
            const link = (e.target as HTMLElement).closest('a');
            if (!link || !link.href) return;
            
            const url = new URL(link.href);
            // Sadece kendi domainimizdeki linkleri SPA ile aç (dış linkleri ve yeni sekme açanları geç)
            if (url.origin === window.location.origin && link.target !== '_blank') {
                e.preventDefault();
                this.navigate(url.pathname);
            }
        });

        // 2. Tarayıcı Geri/İleri butonlarını dinle
        window.addEventListener('popstate', () => {
            this.navigate(window.location.pathname, false);
        });
    }

    public async navigate(path: string, pushHistory = true): Promise<void> {
        if (path === this.currentPath) return; // Aynı sayfaya tıklanırsa yoksay
        const previousPath = this.currentPath;
        
        EventBus.emit('ROUTE_START', { path });

        try {
            // 3. Statik HTML dosyasını arka planda çek (Vite geliştirme ortamı için .html ekliyoruz)
            let htmlText = this.htmlCache.get(path);
            if (!htmlText) {
                const routeUrl = path === '/' ? '/index.html' : `${path}.html`;
                const response = await fetch(routeUrl);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                htmlText = await response.text();
                this.htmlCache.set(path, htmlText); // Performans için önbelleğe al
            }
            
            // 4. Gelen HTML'i sanal olarak Parse et ve SADECE 'santis-app-content' alanını al
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            const newContent = doc.querySelector('#santis-app-content')?.innerHTML || '<h1>İçerik Bulunamadı</h1>';
            const newTitle = doc.querySelector('title')?.innerText || 'Santis OS';

            // 5. View Transitions API ile muazzam akıcılıkta DOM geçişi yap
            await this.safeTransition(() => {
                const contentDiv = document.querySelector('#santis-app-content');
                if (contentDiv) contentDiv.innerHTML = newContent;
                document.title = newTitle;
                window.scrollTo({ top: 0, behavior: 'instant' });
            });

            this.currentPath = path;
            if (pushHistory) window.history.pushState(null, '', path);

            // 6. GPU'ya (Render Worker) ve UI'a (EventBus) yeni sayfaya geçtiğimizi haber ver
            Fabric.Render.onRouteChange(path);
            EventBus.emit('ROUTE_CHANGED', { previous: previousPath, current: path, title: newTitle });

        } catch (error) {
            console.error(`🚨 [Router] ${path} yüklenirken hata:`, error);
            EventBus.emit('TRANSITION_ERROR', { route: path, error: String(error) });
            // Hata olursa SPA'yı bozup normal yönlendirme yap (Fallback)
            if (pushHistory) window.location.href = path;
        }
    }

    public async safeTransition(updateDOM: () => void | Promise<void>): Promise<void> {
        try {
            if (!('startViewTransition' in document)) {
                await updateDOM();
                return;
            }
            // @ts-ignore
            const transition = document.startViewTransition(updateDOM);
            await transition.finished;
        } catch (error: any) {
            if (error.name === "AbortError") {
                console.warn("🎬 [Router] Geçiş atlandı: Kullanıcı hızlı navigasyon yaptı.");
            }
        }
    }
}
