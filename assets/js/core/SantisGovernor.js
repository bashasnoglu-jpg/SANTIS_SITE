/**
 * SANTIS - Motion Budget Governor (v1.0)
 * Görev: Yüksek frekanslı olayları rAF ile senkronize ederek frame düşüşlerini engeller.
 * "Sessiz Lüks" Pürüzsüzlüğü için Ana-Thread yük dengesini sağlar.
 */
export const SantisGovernor = (() => {
    const _tasks = new Map();
    let _ticking = false;

    const _update = () => {
        _tasks.forEach((task, id) => {
            task();
        });
        // Her frame sonrası temizlenecek görevleri silmiyoruz kalıcı tutuyoruz
        // ta ki cancel diyene kadar (veya fonksiyon rAF loop'unda çalışır).
        // Ancak scroll gibi anlık olaylarda fonksiyon zaten her seferinde yeni schedule edilir.
        _ticking = false;
    };

    const schedule = (id, callback) => {
        _tasks.set(id, callback);
        if (!_ticking) {
            window.requestAnimationFrame((time) => {
                _update();
            });
            _ticking = true;
        }
    };

    const cancel = (id) => _tasks.delete(id);

    return { schedule, cancel };
})();

console.log("🛡️ Santis Governor: Aktif. GPU Bütçesi koruma altında.");
window.SantisGovernor = SantisGovernor;

// ⚡ ULTIMATE INTERCEPTION: Hijack AddEventListener to transparently govern ALL scrolls and mousemoves
const originalAddEventListener = window.addEventListener;
window.addEventListener = function (type, listener, options) {
    if (type === "scroll" || type === "mousemove") {
        const id =
            "gov_" + type + "_" + Math.random().toString(36).substr(2, 9);
        const wrappedListener = function (e) {
            SantisGovernor.schedule(id, () => listener.call(this, e));
        };
        // Store the wrapper so it can be un-listened correctly
        if (typeof listener === "function") {
            listener._santis_gov_wrapper = wrappedListener;
        }
        return originalAddEventListener.call(
            this,
            type,
            wrappedListener,
            options,
        );
    }
    return originalAddEventListener.call(this, type, listener, options);
};

const originalRemoveEventListener = window.removeEventListener;
window.removeEventListener = function (type, listener, options) {
    if (
        (type === "scroll" || type === "mousemove") &&
        listener &&
        listener._santis_gov_wrapper
    ) {
        return originalRemoveEventListener.call(
            this,
            type,
            listener._santis_gov_wrapper,
            options,
        );
    }
    return originalRemoveEventListener.call(this, type, listener, options);
};

console.log("🛡️ Santis Governor: Global Scroll & MouseMove Events Hijacked.");
