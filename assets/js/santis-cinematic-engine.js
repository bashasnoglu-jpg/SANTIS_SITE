const SantisEngine = {
  isLocked: false,
  currentFrame: 0,
  loadingQueue: new Set(),
  frames: [],
  dots: [],
  stage: null,
  pagination: null,
  observer: null,

  init() {
    this.stage = document.querySelector("#santis-cinematic-stage");
    this.frames = [...document.querySelectorAll(".sovereign-frame")];
    this.pagination = document.querySelector("#ghost-pagination");

    if (!this.stage || !this.frames.length || !window.gsap || !window.Observer) {
      console.warn("[Phase 73] Cinematic Engine not mounted.");
      return;
    }

    gsap.registerPlugin(Observer);

    gsap.set(this.frames, {
      yPercent: 100,
      autoAlpha: 0,
    });

    gsap.set(this.frames[0], {
      yPercent: 0,
      autoAlpha: 1,
    });

    this.frames[0].classList.add("active");

    this.setupDots();
    this.setupObserver();
    this.setupResizeListener();
    this.setupKeyboardListener();

    // Init first frame
    this.AssetManager.loadFrameAssets(this.frames[0]).then(() => {
        this.syncDots();
        this.revealFrameContent(this.frames[0]);
        // Prefetch 2nd frame if it exists
        if (this.frames.length > 1) {
            this.AssetManager.loadFrameAssets(this.frames[1]);
        }
        console.info("Santis Engine: Stress Test Phase 75 Active.");
    });
  },

  setupDots() {
    this.dots = this.frames.map((_, index) => {
      const dot = document.createElement("button");
      dot.className = "ghost-dot";
      dot.type = "button";
      dot.setAttribute("aria-label", `Frame ${index + 1}`);
      dot.addEventListener("click", () => this.goToFrame(index));
      if (this.pagination) this.pagination.appendChild(dot);
      return dot;
    });
  },

  syncDots() {
    this.dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === this.currentFrame);
    });
  },

  setupObserver() {
    const dynamicTolerance = window.innerWidth < 1024 ? 35 : 24;
    this.observer = Observer.create({
      target: window,
      type: "wheel,touch,pointer",
      preventDefault: true,
      lockAxis: true,
      preventClicks: false,
      wheelSpeed: -1,
      tolerance: dynamicTolerance,
      onDown: () => this.goToFrame(this.currentFrame + 1),
      onUp: () => this.goToFrame(this.currentFrame - 1),
    });
  },

  setupResizeListener() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.log("Santis Engine: Refreshing Observer...");
            if (this.observer) this.observer.kill();
            this.setupObserver();
            if (window.ScrollTrigger) ScrollTrigger.refresh();
        }, 250); // Debounce süresi
    });
  },

  setupKeyboardListener() {
    window.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "PageDown") {
        this.goToFrame(this.currentFrame + 1);
      }
      if (event.key === "ArrowUp" || event.key === "PageUp") {
        this.goToFrame(this.currentFrame - 1);
      }
    });
  },

  revealFrameContent(frame) {
    const revealItems = frame.querySelectorAll(
      "[data-cinematic-reveal], h1, h2, p, .reveal, .ritual-card, .santis-section-header, .santis-stack-card, .custom-cover-flow"
    );

    gsap.fromTo(
      revealItems,
      {
        y: 28,
        autoAlpha: 0,
        filter: "blur(10px)",
      },
      {
        y: 0,
        autoAlpha: 1,
        filter: "blur(0px)",
        duration: 0.9,
        stagger: 0.08,
        ease: "power3.out",
        delay: 0.15,
        overwrite: "auto"
      }
    );
  },

  AssetManager: {
      async loadFrameAssets(frameElement) {
          if (!frameElement) return Promise.resolve();
          const assets = frameElement.querySelectorAll('[data-santis-src], [data-santis-bg]');
          const promises = Array.from(assets).map(asset => this.processAsset(asset));
          return Promise.all(promises);
      },

      async processAsset(el) {
          const url = el.dataset.santisSrc || el.dataset.santisBg;
          if (!url || SantisEngine.loadingQueue.has(url)) return Promise.resolve();

          SantisEngine.loadingQueue.add(url); // Yükleme listesine ekle

          return new Promise((resolve) => {
              const img = new Image();

              // [NEW] Network Timeout Koruması (5 Saniye)
              const timeout = setTimeout(() => {
                  console.warn(`Asset timeout: ${url}`);
                  SantisEngine.loadingQueue.delete(url);
                  resolve();
              }, 5000);

              img.src = url;
              img.decode().then(() => {
                  clearTimeout(timeout);
                  if (el.dataset.santisSrc) {
                      el.src = url;
                      el.removeAttribute('data-santis-src');
                  } else {
                      el.style.backgroundImage = `url('${url}')`;
                      el.removeAttribute('data-santis-bg');
                  }

                  el.classList.add('santis-asset-loaded');
                  SantisEngine.loadingQueue.delete(url);
                  resolve();
              }).catch(() => {
                  clearTimeout(timeout);
                  SantisEngine.loadingQueue.delete(url);
                  resolve();
              });
          });
      }
  },

  async goToFrame(index) {
      if (index < 0 || index >= this.frames.length || this.isLocked) return;

      this.isLocked = true;

      // [NEW] Acil Durum Kilidi (Failsafe)
      // Eğer bir sebeple animasyon veya yükleme takılırsa 3sn sonra kilidi aç
      const failsafe = setTimeout(() => { this.isLocked = false; }, 3000);

      const targetFrame = this.frames[index];
      const previousFrame = this.frames[this.currentFrame];
      const direction = index > this.currentFrame ? 1 : -1;

      // Telemetry
      const frameId = targetFrame.dataset.frame || `frame-${index}`;
      window.dispatchEvent(new CustomEvent('santis-frame-change', {
        detail: { frameId, timestamp: Date.now() }
      }));

      // Önce asset'leri hazırla (GPU Ready)
      await this.AssetManager.loadFrameAssets(targetFrame);

      this.frames.forEach((f) => f.classList.remove("active"));
      targetFrame.classList.add("active");

      gsap.set(targetFrame, {
        yPercent: direction * 100,
        autoAlpha: 1,
      });

      const tl = gsap.timeline({
        defaults: {
          duration: 1.35,
          ease: "power4.inOut",
        },
        onComplete: () => {
            clearTimeout(failsafe);
            gsap.set(previousFrame, { autoAlpha: 0 });
            this.currentFrame = index;
            this.syncDots();
            this.revealFrameContent(targetFrame);

            // Neighbor loading (Sessizce arka planda)
            if (this.frames[index + 1]) this.AssetManager.loadFrameAssets(this.frames[index + 1]);

            gsap.delayedCall(0.15, () => { this.isLocked = false; });
        }
      });

      tl.to(previousFrame, {
        yPercent: direction * -100,
        autoAlpha: 0.72,
        overwrite: "all" // [STRESS TEST] Çakışan animasyonları öldür
      }).to(
        targetFrame,
        {
          yPercent: 0,
          autoAlpha: 1,
          overwrite: "all"
        },
        0
      );
  }
};

// Motoru başlat
document.addEventListener("DOMContentLoaded", () => {
    SantisEngine.init();
});
