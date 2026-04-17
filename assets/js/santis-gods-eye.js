import { SantisCanvasEngine } from './santis-canvas-engine.js';
import { bindVisibilityShield } from './visibility-shield.js';

const canvas = document.querySelector('#santis-gods-eye-canvas');

if (canvas) {
  const engine = new SantisCanvasEngine({
    canvas,
    render: () => {
      // mevcut draw logic
    }
  });

  engine.start();

  const cleanupVisibility = bindVisibilityShield(engine, canvas);

  window.addEventListener('beforeunload', () => {
    cleanupVisibility();
    engine.stop();
  });
}
