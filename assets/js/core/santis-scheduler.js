/**
 * 🎬 LAYER 2: SANTIS KINEMATIC SCHEDULER
 * ViewTransition "AbortError" engelleyici Single-Flight Lock.
 */
class SantisTransitionScheduler {
  constructor() {
    this.inProgress = false;
    this.queue = [];
  }

  schedule(domUpdateCallback, context = "Santis_Kernel") {
    if (!document.startViewTransition) return domUpdateCallback(); // API yoksa anında çalıştır

    // 1. Çarpışma Tespit Edildi: İsteği kuyruğa al!
    if (this.inProgress) {
      console.log(`⏳ [SCHEDULER] Çakışma önlendi. Görev kuyruğa alındı: [${context}]`);
      return new Promise(resolve => this.queue.push({ domUpdateCallback, resolve }));
    }

    return this.#execute(domUpdateCallback);
  }

  async #execute(domUpdateCallback) {
    this.inProgress = true;
    try {
      const transition = document.startViewTransition(domUpdateCallback);
      await transition.finished; // DOM mutasyonunun fiziksel olarak bitmesini bekle
    } catch (err) {
      if (err.name === "AbortError") {
        // Bu bir hata değildir, DOM güvenliği için DOM güncellenmiş animasyon atlanmıştır.
        console.warn("⚡ [SCHEDULER] Transition skipped (State korundu).");
      } else {
        console.error("❌ [SCHEDULER] Kritik Animasyon Hatası:", err);
      }
    } finally {
      this.inProgress = false;
      // 2. Kuyrukta bekleyen frame varsa mikro-task olarak sıradakini ateşle
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        queueMicrotask(() => this.schedule(next.domUpdateCallback).then(next.resolve));
      }
    }
  }
}
window.santisUI = new SantisTransitionScheduler();
