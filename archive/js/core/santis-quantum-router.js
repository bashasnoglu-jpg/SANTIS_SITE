/**
 * ==========================================
 * 🌌 SOVEREIGN OS V3: QUANTUM NAVIGATION CORE
 * ==========================================
 * Engine: Intent Prediction | Shadow Worker | Surgical DOM Morphing
 */
(function initQuantumCore() {
  console.log("%c[SOVEREIGN V3] Quantum Core Online 👁️", "color: #00FFCC; font-weight: bold; text-shadow: 0 0 10px #00FFCC;");

  // 1. SHADOW WORKER (Main Thread'i Özgür Bırakan Gölge İşlemci)
  // Ağ isteklerini arkada yapar, UI kilitlenmez.
  const workerCode = `
    const memory = new Map();
    self.onmessage = async (e) => {
      const { action, url } = e.data;
      if (memory.has(url)) return; // Zaten biliniyorsa dur
      
      try {
        const res = await fetch(url);
        const html = await res.text();
        
        // Worker içinde DOMParser yoktur, Kuantum Regex Cerrahisi yapıyoruz:
        const mainMatch = html.match(/<main[^>]*>([\\s\\S]*?)<\\/main>/i);
        const titleMatch = html.match(/<title>([\\s\\S]*?)<\\/title>/i);
        
        if (mainMatch) {
           memory.set(url, true);
           self.postMessage({ url, content: mainMatch[1], title: titleMatch ? titleMatch[1] : 'Sovereign OS' });
        }
      } catch (err) { /* Sessizlik */ }
    };
  `;
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const shadowWorker = new Worker(URL.createObjectURL(blob));
  const quantumCache = new Map(); // Main thread hafızası

  shadowWorker.onmessage = (e) => {
    quantumCache.set(e.data.url, { content: e.data.content, title: e.data.title });
    console.log(`%c[AI PREDICT] Gelecek hafızaya kazındı: ${new URL(e.data.url).pathname}`, "color: #d4af37; font-size: 10px;");
  };

  // 2. NÖRAL İVME TAHMİNİ (Kahin Algoritması)
  let lastMouse = { x: 0, y: 0, time: Date.now() };
  document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    const dt = now - lastMouse.time;
    if (dt > 50) {
      const dx = e.clientX - lastMouse.x;
      const velocityX = dx / dt; // X eksenindeki hız (px/ms)
      
      // Kullanıcı SOL TARAFA (Gateway'e) doğru hızla ivmeleniyorsa (Örn: -0.6 px/ms)
      // Daha menüye değmeden hedefleri avla!
      if (velocityX < -0.6 && e.clientX < window.innerWidth * 0.4) {
        document.querySelectorAll('#sovereign-gateway-inner a, #sovereign-gateway-container a').forEach(link => {
          if (!quantumCache.has(link.href)) {
             shadowWorker.postMessage({ action: 'PREDICT', url: link.href });
          }
        });
      }
      lastMouse = { x: e.clientX, y: e.clientY, time: now };
    }
  }, { passive: true });

  // 3. ZERO-LATENCY ROUTER (Geçiş Motoru)
  document.addEventListener('click', async (e) => {
    const link = e.target.closest('a');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    if (link.origin !== location.origin) return; // Dış linkler serbest
    // Api/file isteklerini izole et
    if (link.href.includes('/api/') || link.pathname.match(/\.(png|jpg|pdf|zip|svg)$/)) return;

    // 🛡️ DOKU UYUŞMAZLIĞI KALKANI (Tissue Rejection Bypass)
    // Sadece Matrix Pano sayfalarında SPA geçerlidir. Detay sayfalarında klasik DOM yüklenmeli.
    const isPublicDetail = link.pathname.includes('.html') || link.pathname.includes('/massages/') || link.pathname.includes('/tr/hamam/') || link.hasAttribute('data-hard-nav');
    
    // Eğer "/admin" yolunda değilsek ve detay sayfalarından birine gidiyorsak bypass et:
    if (isPublicDetail && !link.pathname.startsWith('/admin')) {
        console.log(`🌌 [QUANTUM ROUTER] Doku farklılığı sezildi: ${link.pathname}. Klasik yönlendirme serbest bırakıldı.`);
        return; // Event.preventDefault ÇALIŞMAZ, normal sayfa açılır.
    }

    e.preventDefault();
    await executeQuantumLeap(link.href);
  });

  let isBackwardNav = false;
  window.addEventListener('popstate', () => {
    isBackwardNav = true;
    executeQuantumLeap(location.href);
  });

  // 4. THE SURGICAL INJECTION (Uygulama)
  async function executeQuantumLeap(url) {
    if (isBackwardNav) {
      document.documentElement.classList.add('is-backward-navigation');
    }

    let pageData = quantumCache.get(url);
    
    // AI kullanıcıdan yavaş kaldıysa (Kullanıcı menüye direkt ışınlandıysa) Fetch It
    if (!pageData) {
      document.body.style.cursor = 'wait';
      try {
          const res = await fetch(url);
          const html = await res.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const mainTarget = doc.querySelector('main');
          
          if (!mainTarget) throw new Error("No main object");
          
          pageData = {
            content: mainTarget.innerHTML || '',
            title: doc.title
          };
          quantumCache.set(url, pageData);
      } catch (err) {
          // Failsafe: Hard Redirect
          document.documentElement.classList.remove('is-backward-navigation');
          isBackwardNav = false;
          window.location.href = url;
          return;
      }
      document.body.style.cursor = 'default';
    }

    const currentMain = document.querySelector('main');
    if (!currentMain) { 
      document.documentElement.classList.remove('is-backward-navigation');
      isBackwardNav = false;
      window.location.href = url; 
      return; 
    }

    const tempDiv = document.createElement('main');
    tempDiv.innerHTML = pageData.content;

    // View Transitions API + Morphing
    if (document.startViewTransition) {
      const transition = document.startViewTransition(() => {
        surgicalMorph(currentMain, tempDiv);
        finalizeLeap(url, pageData.title);
      });
      
      transition.finished.finally(() => {
        document.documentElement.classList.remove('is-backward-navigation');
      });
    } else {
      surgicalMorph(currentMain, tempDiv);
      finalizeLeap(url, pageData.title);
      document.documentElement.classList.remove('is-backward-navigation');
    }

    isBackwardNav = false;
  }

  function finalizeLeap(url, title) {
    if (title) document.title = title;
    history.pushState({}, '', url);
    
    // Gateway Active State Neon Işıklandırması Senkronizasyonu
    const pathsToCheck = [url, new URL(url).pathname];
    document.querySelectorAll('#sovereign-gateway-inner a, #sovereign-gateway-container a').forEach(a => {
      const aPath = new URL(a.href).pathname;
      if (pathsToCheck.includes(aPath) || pathsToCheck[0].includes(aPath)) {
          a.classList.add('active');
          a.style.color = '#00FFCC';
          a.style.opacity = '1';
          a.style.borderLeft = '2px solid #00FFCC';
          a.style.paddingLeft = '12px';
      } else {
          a.classList.remove('active');
          a.style.color = '#d4af37';
          a.style.opacity = '0.5';
          a.style.borderLeft = 'none';
          a.style.paddingLeft = '14px';
      }
    });

    // Re-initialize any specific component scripts on the new main content if needed
    if (window.reinitializeScripts) window.reinitializeScripts();

    // Zihne yeni sayfayı taramasını emret
    window.dispatchEvent(new Event('sovereign-leap'));
    
    // Her menü geçişinde sıçrama sayacını artır (State testi)
    if (window.NeuralDB) {
        NeuralDB.state.telemetry.leaps += 1;
    }
  }

  // 5. REACT-KILLER (VANILLA DOM MORPHING)
  function surgicalMorph(oldNode, newNode) {
    if (!oldNode || !newNode) return;
    if (oldNode.isEqualNode(newNode)) return; 

    // Tag değiştiyse kökten değiştir
    if (oldNode.nodeType !== newNode.nodeType || oldNode.nodeName !== newNode.nodeName) {
      oldNode.replaceWith(newNode.cloneNode(true));
      return;
    }

    // Sadece metin değiştiyse metni güncelle
    if (newNode.nodeType === Node.TEXT_NODE) {
      if (oldNode.nodeValue !== newNode.nodeValue) oldNode.nodeValue = newNode.nodeValue;
      return;
    }

    // Attribute Cerrahisi (Sadece sınıf, ID vb. değiştiyse)
    if (oldNode.nodeType === Node.ELEMENT_NODE) {
        const oldAttrs = oldNode.attributes;
        const newAttrs = newNode.attributes;
        for (let i = (oldAttrs?.length || 0) - 1; i >= 0; i--) {
          const name = oldAttrs[i].name;
          if (!newNode.hasAttribute(name)) oldNode.removeAttribute(name);
        }
        for (let i = 0; i < (newAttrs?.length || 0); i++) {
          const name = newAttrs[i].name;
          const val = newAttrs[i].value;
          if (oldNode.getAttribute(name) !== val) oldNode.setAttribute(name, val);
        }
    }

    // Çocuk Ağaçlara Dal (Rekürsif)
    const oldChildren = Array.from(oldNode.childNodes);
    const newChildren = Array.from(newNode.childNodes);
    const max = Math.max(oldChildren.length, newChildren.length);

    for (let i = 0; i < max; i++) {
      if (!oldChildren[i]) {
        oldNode.appendChild(newChildren[i].cloneNode(true));
      } else if (!newChildren[i]) {
        if (oldChildren[i].parentNode === oldNode) {
            oldNode.removeChild(oldChildren[i]);
        }
      } else {
        surgicalMorph(oldChildren[i], newChildren[i]);
      }
    }
  }

    // Inject Glitch Animation CSS
  const style = document.createElement('style');
  style.textContent = `
    ::view-transition-old(root) {
      animation: quantum-out 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    ::view-transition-new(root) {
      animation: quantum-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    /* 🟡 PROTOKOL KRONOS: Geri Yön (Swipe-Back) Ters Vektör Animasyonu */
    html.is-backward-navigation ::view-transition-old(root) {
      animation: quantum-in-reverse 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    html.is-backward-navigation ::view-transition-new(root) {
      animation: quantum-out-reverse 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    @keyframes quantum-out {
      0% { opacity: 1; filter: blur(0px); transform: scale(1); }
      100% { opacity: 0; filter: blur(12px); transform: scale(0.98); }
    }

    @keyframes quantum-in {
      0% { opacity: 0; filter: blur(12px); transform: scale(1.02); }
      100% { opacity: 1; filter: blur(0px); transform: scale(1); }
    }

    @keyframes quantum-out-reverse {
      0% { opacity: 0; filter: blur(12px); transform: scale(0.98); }
      100% { opacity: 1; filter: blur(0px); transform: scale(1); }
    }

    @keyframes quantum-in-reverse {
      0% { opacity: 1; filter: blur(0px); transform: scale(1); }
      100% { opacity: 0; filter: blur(12px); transform: scale(1.02); }
    }
  `;
  document.head.appendChild(style);

})();
