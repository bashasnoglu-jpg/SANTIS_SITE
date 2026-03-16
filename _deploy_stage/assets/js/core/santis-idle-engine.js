/**
 * SANTIS GHOST THREAD (Protocol 27)
 * Idle-Time Exploitation Engine
 */

class SantisIdleEngine {
    constructor() {
        this.taskQueue = [];
        this.isProcessing = false;

        // Tarayıcı requestIdleCallback desteklemiyorsa güvenli fallback
        this.requestIdle = window.requestIdleCallback
            ? window.requestIdleCallback.bind(window)
            : ((cb) => setTimeout(() => cb({ timeRemaining: () => 50 }), 1));
    }

    // Görevleri hayalet sıraya ekle
    enqueue(taskName, taskFunction) {
        this.taskQueue.push({ name: taskName, fn: taskFunction });
        // console.log(`👻 [Ghost Thread] Görev sıraya alındı: ${taskName}`);
        this.schedule();
    }

    schedule() {
        if (this.isProcessing || this.taskQueue.length === 0) return;
        this.isProcessing = true;

        this.requestIdle((deadline) => this.processQueue(deadline));
    }

    processQueue(deadline) {
        // Tarayıcının boş vakti (timeRemaining) varken ve sırada görev varken çalış
        while (deadline.timeRemaining() > 5 && this.taskQueue.length > 0) {
            const task = this.taskQueue.shift();
            try {
                task.fn();
                // console.log(`✅ [Ghost Thread] Görev tamamlandı: ${task.name}`);
            } catch (error) {
                console.error(`❌ [Ghost Thread] Görev hatası: ${task.name}`, error);
            }
        }

        this.isProcessing = false;
        // Eğer sırada hala görev kaldıysa, bir sonraki boş vakti bekle
        if (this.taskQueue.length > 0) {
            this.schedule();
        }
    }
}

// Global Ajanı Başlat
window.SantisIdle = new SantisIdleEngine();
