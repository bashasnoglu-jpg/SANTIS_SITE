/**
 * ==========================================
 * 🧠 SOVEREIGN OS V4: THE NEURAL CORTEX
 * ==========================================
 * Engine: Quantum Proxy | Cross-Tab Telepathy | Shadow Persistence
 */
(function initNeuralCortex() {
  console.log("%c[SOVEREIGN V4] Neural Cortex Awakening... 🧠", "color: #ff00ff; font-weight: bold; text-shadow: 0 0 10px #ff00ff;");

  const MEMORY_KEY = 'sovereign_engram';
  const TELEPATHY_CHANNEL = 'sovereign_quantum_link';

  // 1. PRIMORDIAL STATE (Sistemin Varsayılan Bilinci)
  const defaultState = {
    system: { defcon: 5, status: 'ONLINE', activeAgents: 12 },
    revenue: { daily: 14500, mrr: 125000 },
    user: { intent: 'IDLE' },
    telemetry: { leaps: 0 }
  };

  // 2. SHADOW PERSISTENCE (Hafızayı Geri Çağır)
  function loadMemory() {
    try {
      const stored = sessionStorage.getItem(MEMORY_KEY);
      return stored ? deepMerge(defaultState, JSON.parse(stored)) : defaultState;
    } catch { return defaultState; }
  }

  function deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] instanceof Object && key in target) {
        Object.assign(source[key], deepMerge(target[key], source[key]));
      }
    }
    Object.assign(target || {}, source);
    return target;
  }

  let rawState = loadMemory();
  const subscribers = new Set();
  const channel = new BroadcastChannel(TELEPATHY_CHANNEL);
  let isTelepathicSync = false; // Yankı döngüsünü engeller

  // 3. AUTO-MORPH ENGINE (Sıfır JS ile UI Güncelleme)
  function mutateDOM(path, value) {
    document.querySelectorAll(`[data-neural="${path}"]`).forEach(el => {
      if (el.innerText !== String(value) && el.value !== String(value)) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.value = value;
        else el.innerText = value;
        
        // Nöral Atım Efekti (Neon Glitch)
        el.style.transition = 'none';
        el.style.textShadow = '0 0 20px #ff00ff';
        el.style.color = '#ffffff';
        
        requestAnimationFrame(() => {
          setTimeout(() => {
            el.style.transition = 'all 0.4s ease';
            el.style.textShadow = '';
            el.style.color = ''; // CSS'teki orijinal rengine döner
          }, 150);
        });
      }
    });
  }

  // DOM'u baştan aşağı tara ve mevcut state ile doldur
  function syncEntireDOM() {
    const walk = (obj, path = '') => {
      for (let key in obj) {
        const fullPath = path ? `${path}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          walk(obj[key], fullPath);
        } else {
          mutateDOM(fullPath, obj[key]);
        }
      }
    };
    walk(rawState);
  }

  // 4. THE QUANTUM PROXY (Reaktif Zihin Zarı)
  function createProxy(obj, path = '') {
    return new Proxy(obj, {
      get(target, prop) {
        if (typeof target[prop] === 'object' && target[prop] !== null) {
          return createProxy(target[prop], `${path}${prop}.`);
        }
        return target[prop];
      },
      set(target, prop, value) {
        if (target[prop] === value) return true; // Aynıysa enerjiyi harcama
        
        target[prop] = value;
        const fullPath = `${path}${prop}`;
        
        // 1. Diske Mühürle
        sessionStorage.setItem(MEMORY_KEY, JSON.stringify(rawState));
        
        // 2. Local Evreni (DOM) Değiştir
        mutateDOM(fullPath, value);
        
        // 3. Diğer boyutlara (sekmelere) fısılda
        if (!isTelepathicSync) {
            channel.postMessage({ path: fullPath, value: value });
        }
        
        console.log(`%c[SYNAPSE FIRED] ${fullPath} ⚡ ${value}`, "color: #00FFCC; font-size: 10px;");
        return true;
      }
    });
  }

  const GlobalState = createProxy(rawState);

  // 5. CROSS-TAB TELEPATHY (Boyutlar Arası Yankı)
  channel.onmessage = (e) => {
    const { path, value } = e.data;
    isTelepathicSync = true;
    
    // Proxy'yi tetiklemeden raw state'i sessizce güncelle
    const keys = path.split('.');
    let current = rawState;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    sessionStorage.setItem(MEMORY_KEY, JSON.stringify(rawState));
    mutateDOM(path, value); // Diğer sekmedeki UI'ı anında güncelle
    
    isTelepathicSync = false;
    console.log(`%c[QUANTUM LINK] Başka bir sekmeden yankı: ${path} = ${value}`, "color: #ff00ff; font-size: 10px;");
  };

  // 6. TANRISAL API (Dünyaya Açılan Kapı)
  window.NeuralDB = {
    get state() { return GlobalState; },
    purge: () => {
      sessionStorage.removeItem(MEMORY_KEY);
      console.warn("%c[NEURAL CORTEX] MEMORY PURGED. REBOOTING...", "color: red; font-size: 14px; font-weight: bold;");
      location.reload();
    },
    forceSync: syncEntireDOM
  };

  // Başlangıçta Evreni Doldur
  document.addEventListener('DOMContentLoaded', syncEntireDOM);
  // Router geçişlerinde yeni DOM'u hafızayla eşle
  window.addEventListener('sovereign-leap', syncEntireDOM);

})();
