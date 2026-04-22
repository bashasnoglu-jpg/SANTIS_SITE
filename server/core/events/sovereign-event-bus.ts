import { EventEmitter } from 'node:events';

class SovereignEventBus extends EventEmitter {
  constructor() {
    super();
    // Opsiyonel: Max listener uyarılarını kapat veya artır (ölçeklenme için)
    this.setMaxListeners(50);
  }

  emitRolloutUpdate(payload: any) {
    this.emit('ROLLOUT_STATUS_UPDATE', payload);
  }
}

// Singleton Instance
export const sovereignEventBus = new SovereignEventBus();
