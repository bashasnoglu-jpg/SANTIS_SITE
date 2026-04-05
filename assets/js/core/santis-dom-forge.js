/* ==========================================================================
   🦅 SANTIS OMNI-OS V18 | THE NODE FACTORY (Zero-Parse DOM Engine)
   L10 Singularity: DOM Forge
   ========================================================================== */

window.SantisDOMForge = (() => {
    // Kuantum Flush Kuyruğu (Toplu DOM Güncelleme)
    const paintQueue = [];
    let isFlushing = false;

    /**
     * Gelen JSON (HyperScript benzeri) hiyerarşiyi saf C++ HTMLElement ağacına dönüştürür.
     * Asla innerHTML KULLANMAZ (!), Parser (Ayrıştırıcı) Yükü Sıfırdır.
     */
    const createNode = (type, props = {}, ...children) => {
        // Zero-GC Cryo-Sleep entegrasyonu (Apoptosis Protokolü aktifse uyuyan iskeleti canlandır değilse yeni yarat)
        let element = window.SantisApoptosis ? window.SantisApoptosis.resurrect(type) : document.createElement(type);

        for (const [key, value] of Object.entries(props)) {
            if (key === 'className' || key === 'class') {
                element.className = value;
            } else if (key.startsWith('on') && typeof value === 'function') {
                const eventName = key.toLowerCase().substring(2);
                element.addEventListener(eventName, value, { passive: eventName.includes('scroll') || eventName.includes('touch') });
            } else if (key.startsWith('data-')) {
                element.setAttribute(key, value);
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else {
                element[key] = value;
            }
        }

        const appendChild = (child) => {
            if (!child) return;
            if (typeof child === 'string' || typeof child === 'number') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            } else if (Array.isArray(child)) {
                child.forEach(appendChild);
            }
        };

        children.forEach(appendChild);
        return element;
    };

    /**
     * İşlemciyi (V8) kiletlememek için düğümleri DocumentFragment olarak paketler
     */
    const createFragment = (nodes) => {
        const fragment = document.createDocumentFragment();
        nodes.forEach(node => {
            if (node) fragment.appendChild(node);
        });
        return fragment;
    };

    /**
     * Hedef Elementin içeriğini DOM Thrashing olmadan C++ DocumentFragment üzerinden enjekte eder.
     * Paint döngüsüne (requestVideoFrameCallback / requestAnimationFrame) hizalanır.
     */
    const flushNode = (target, newContent) => {
        paintQueue.push({ target, newContent });
        if (!isFlushing) {
            isFlushing = true;
            scheduleFlush();
        }
    };

    const scheduleFlush = () => {
        // En optimal tarama ve çizim döngüsü (Paint Synchronization)
        const frameAPI = window.requestVideoFrameCallback || window.requestAnimationFrame || ((cb) => setTimeout(cb, 16));
        
        frameAPI(() => {
            paintQueue.forEach(({ target, newContent }) => {
                if (!target) return;
                
                // GC tetikleyen `.innerHTML = ''` yerine, Cryo-Sleep uyumasını sağla
                if (window.SantisApoptosis) {
                    Array.from(target.children).forEach(child => window.SantisApoptosis.markForDeath(child, 'Flush_Clear'));
                } else {
                    target.innerHTML = ''; // Failsafe
                }
                target.appendChild(newContent);
            });
            
            paintQueue.length = 0;
            isFlushing = false;
        });
    };

    console.log("🧬 [DOM Forge] Zero-Parse Node Fabrikası Aktif. InnerHTML Devri Kapandı.");

    // SantisDOM API'sini Forge'a hizala (Eski sistem de varsa üstüne yazılır veya entegre edilir)
    window.SantisDOM = window.SantisDOM || { read: () => {}, write: (fn) => fn() };
    const originalWrite = window.SantisDOM.write;
    window.SantisDOM.write = (fn) => { 
        // V8'i tıkamamak için Forge Flush ile koordineli çalışabilir
        if(typeof fn === 'function') originalWrite(fn); 
    };

    return { 
        createNode, 
        createFragment, 
        flushNode, 
        h: createNode // HyperScript alias
    };
})();
