import { SantisTelemetryIntent } from './santis-telemetry-intent.js';

class RailInstance {
  constructor(rail) {
    this.rail = rail;
    this.shell = rail.closest('.santis-rail-shell');
    this.prevButton = this.shell?.querySelector('[data-rail-nav="prev"]');
    this.nextButton = this.shell?.querySelector('[data-rail-nav="next"]');

    this.state = {
      isPointerDown: false,
      isDragging: false,
      isSettling: false,
      dragStartedAtX: 0,
      startScrollLeft: 0,
      dragThreshold: 6
    };

    this.bound = {};
  }

  init() {
    this.bindEvents();
    this.bindTelemetry();
    this.updateNavState();
  }

  bindEvents() {
    this.bound.onPointerDown = this.onPointerDown.bind(this);
    this.bound.onPointerMove = this.onPointerMove.bind(this);
    this.bound.onPointerUp = this.onPointerUp.bind(this);
    this.bound.onScroll = this.onScroll.bind(this);
    this.bound.onResize = this.updateNavState.bind(this);
    this.bound.onPrev = () => this.scrollByCard(-1);
    this.bound.onNext = () => this.scrollByCard(1);

    this.rail.addEventListener('pointerdown', this.bound.onPointerDown);
    window.addEventListener('pointermove', this.bound.onPointerMove);
    window.addEventListener('pointerup', this.bound.onPointerUp);
    this.rail.addEventListener('scroll', this.bound.onScroll, { passive: true });
    window.addEventListener('resize', this.bound.onResize);

    this.prevButton?.addEventListener('click', this.bound.onPrev);
    this.nextButton?.addEventListener('click', this.bound.onNext);
  }

  bindTelemetry() {
    SantisTelemetryIntent.bindRail(this.rail, () => this.state.isDragging || this.state.isSettling);
  }

  onPointerDown(event) {
    this.state.isPointerDown = true;
    this.state.dragStartedAtX = event.clientX;
    this.state.startScrollLeft = this.rail.scrollLeft;
  }

  onPointerMove(event) {
    if (!this.state.isPointerDown) return;

    const deltaX = event.clientX - this.state.dragStartedAtX;

    if (!this.state.isDragging && Math.abs(deltaX) > this.state.dragThreshold) {
      this.startDragging();
    }

    if (!this.state.isDragging) return;

    this.rail.scrollLeft = this.state.startScrollLeft - deltaX;
  }

  onPointerUp() {
    if (this.state.isDragging) {
      this.stopDraggingAndSettle();
    }
    this.state.isPointerDown = false;
  }

  startDragging() {
    this.state.isDragging = true;
    this.rail.classList.add('is-dragging');
  }

  stopDraggingAndSettle() {
    this.state.isDragging = false;
    this.state.isSettling = true;
    this.rail.classList.remove('is-dragging');

    window.setTimeout(() => {
      this.state.isSettling = false;
      this.updateNavState();
    }, 140);
  }

  onScroll() {
    this.updateNavState();
  }

  scrollByCard(direction) {
    const firstCard = this.rail.querySelector('.sovereign-card');
    if (!firstCard) return;

    const styles = window.getComputedStyle(this.rail);
    const gap = parseFloat(styles.columnGap || styles.gap || '24');
    const distance = firstCard.getBoundingClientRect().width + gap;

    this.rail.scrollBy({
      left: direction * distance,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
  }

  updateNavState() {
    const maxScrollLeft = this.rail.scrollWidth - this.rail.clientWidth;
    const hasOverflow = maxScrollLeft > 8;
    const isAtStart = this.rail.scrollLeft <= 8;
    const isAtEnd = this.rail.scrollLeft >= maxScrollLeft - 8;

    this.shell?.classList.toggle('is-nav-active', hasOverflow);
    if (this.prevButton) this.prevButton.disabled = isAtStart;
    if (this.nextButton) this.nextButton.disabled = isAtEnd;
  }
}

class SovereignRailManager {
  static instance;

  static boot() {
    if (!this.instance) {
      this.instance = new SovereignRailManager();
    }
    this.instance.init();
  }

  constructor() {
    this.rails = [];
  }

  init() {
    document.querySelectorAll('.santis-premium-rail').forEach((rail) => {
      this.rails.push(new RailInstance(rail));
    });

    this.rails.forEach((rail) => rail.init());
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => SovereignRailManager.boot(), { once: true });
} else {
  SovereignRailManager.boot();
}
