export class SantisCanvasEngine {
  constructor({ canvas, render }) {
    this.canvas = canvas;
    this.render = render;
    this.rafId = null;
    this.paused = false;
    this.started = false;
  }

  start() {
    if (this.started) return;
    this.started = true;

    const tick = () => {
      if (!this.paused) {
        this.render();
      }
      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  stop() {
    this.started = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  isPaused() {
    return this.paused;
  }
}
