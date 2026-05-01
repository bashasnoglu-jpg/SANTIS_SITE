/**
 * SANTIS BOARDROOM PRO LIVE ORCHESTRATOR
 * Replaces the local-storage based refresh with Event-Driven Live updates
 */
import { SantisCoreStateStreamClient } from './santis-corestate-stream-client.js';
import { SantisBoardroomProCoreStateAdapter } from './santis-boardroom-pro-corestate-adapter.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Bootstrapping Boardroom PRO Live Nervous System...');

  // Initialize the adapter first so it's ready to catch events
  SantisBoardroomProCoreStateAdapter.init();

  // Trigger Cinematic UI Transition for the Boardroom
  requestAnimationFrame(() => {
    const sceneMain = document.getElementById('santis-boardroom-main');
    if (sceneMain) {
      sceneMain.classList.remove('santis-scene-enter');
      sceneMain.classList.add('santis-scene-active');
    }
  });

  // Connect the SSE client
  SantisCoreStateStreamClient.connect();

  // Sayıların Euro formatında görünmesini sağlayan yardımcı fonksiyon
  const formatCurrency = (val) => {
      return new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0
      }).format(val);
  };

  /**
   * Rakamları pürüzsüzce kaydıran ana fonksiyon
   * @param {HTMLElement} el - Güncellenecek HTML elementi
   * @param {number} newValue - Ulaşılacak olan hedef rakam
   */
  function animateSovereignNumber(el, newValue) {
      if (!el) return;

      if (typeof gsap === 'undefined') {
          el.innerText = formatCurrency(newValue);
          return;
      }

      // Mevcut rakamı al (içindeki para birimi işaretlerini temizle)
      const currentText = el.innerText.replace(/[^0-9.-]+/g, "");
      const startValue = { val: parseFloat(currentText) || 0 };

      // GSAP Tweening Başlatılıyor
      gsap.to(startValue, {
          val: newValue,
          duration: 1.5, // 1.5 saniye süren sinematik geçiş
          ease: "power4.out", // Başta hızlı, sonda yavaşlayan "luxury" ivmesi
          snap: { val: 1 }, // Rakamların tam sayı olarak artmasını sağlar
          onUpdate: function() {
              // Her karede (frame) elementin içeriğini formatlı şekilde güncelle
              el.innerText = formatCurrency(startValue.val);
          },
          onComplete: function() {
              // İşlem bittiğinde hafif bir parlama (glow) efekti ekle
              gsap.fromTo(el, 
                  { opacity: 0.8, filter: "brightness(1.2)" }, 
                  { opacity: 1, filter: "brightness(1)", duration: 0.5 }
              );
          }
      });
  }

  function animateValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    
    if (typeof gsap === 'undefined') {
        el.innerText = Math.round(value);
        return;
    }
    
    gsap.to({ val: parseFloat(el.innerText) || 0 }, {
      val: value,
      duration: 1.2,
      ease: "power3.out",
      onUpdate: function () {
        el.innerText = Math.round(this.targets()[0].val);
      }
    });
  }


  /**
   * Oracle Risk Sinyali Yönetimi
   * @param {string} widgetId - Risk uyarısı verilecek kartın ID'si
   * @param {boolean} isActive - Risk aktif mi, değil mi?
   */
  function toggleOracleRisk(widgetId, isActive) {
      const widget = document.getElementById(widgetId);
      if (!widget) return;

      if (isActive) {
          // Kartı risk durumuna sok
          widget.classList.add('is-risk-active');
          
          // GSAP ile içerikteki metni hafifçe kırmızıya çekelim
          const valueDisplay = widget.querySelector('.oracle-data-value') || widget.querySelector('.stat-value');
          if(valueDisplay && typeof gsap !== 'undefined') {
              gsap.to(valueDisplay, { color: '#f44336', duration: 0.5 });
          }
      } else {
          // Riski kaldır
          widget.classList.remove('is-risk-active');
          
          // Rengi eski lüks gri/beyaz tonuna geri döndür
          const valueDisplay = widget.querySelector('.oracle-data-value') || widget.querySelector('.stat-value');
          if(valueDisplay && typeof gsap !== 'undefined') {
              gsap.to(valueDisplay, { color: '#e0e0e0', duration: 1 });
          }
      }
  }

  // GSAP tabanlı Likit UI Güncelleyiciler
  const uiUpdaters = {
    // Finansal verileri (Revenue) günceller
    revenue: (value) => {
        const el = document.getElementById('val-total-revenue') || document.getElementById('stat-total-revenue') || document.getElementById('revenue-display');
        if (el) {
            animateSovereignNumber(el, value);
        }
    },

    // SCP Engine Metric UI Update
    scp: (scp) => {
        animateValue('scp-score', scp.score);
        
        const netEl = document.getElementById('scp-net');
        if (netEl) {
            animateSovereignNumber(netEl, scp.netContribution);
        }

        if (scp.margin > 0.6) {
           logOracleAction('REVENUE_EVENT', `[SCP] Skor: ${scp.score} | Marj Optimizasyonu -> "Premium Bias Up" devrede.`);
        } else if (scp.margin < 0.3) {
           logOracleAction('RISK_SIGNAL', `[SCP] Skor: ${scp.score} | Düşük Marj -> "Discount Risk" sinyali uyarıyor.`);
        }
    },

    // Pricing Advisory UI Update
    pricing: (p) => {
        const actionEl = document.getElementById('pricing-action');
        const confEl = document.getElementById('pricing-confidence');
        const brandRiskEl = document.getElementById('pricing-brand-risk');
        const luxuryIntegrityEl = document.getElementById('pricing-luxury-integrity');
        const overrideControls = document.getElementById('pricing-override-controls');
        
        if (actionEl) actionEl.innerText = p.action.replace(/_/g, ' ').toUpperCase();
        if (confEl) confEl.innerText = Math.round(p.confidence * 100) + "%";
        
        if (brandRiskEl && p.guardrails && p.guardrails.brandRisk) {
            brandRiskEl.innerText = p.guardrails.brandRisk.toUpperCase();
            brandRiskEl.style.color = p.guardrails.brandRisk === 'high' ? '#f44336' : p.guardrails.brandRisk === 'medium' ? '#ff9800' : '#4caf50';
        }
        
        if (luxuryIntegrityEl && p.guardrails && typeof p.guardrails.luxuryIntegrity !== 'undefined') {
            luxuryIntegrityEl.innerText = p.guardrails.luxuryIntegrity ? "INTACT" : "COMPROMISED";
            luxuryIntegrityEl.style.color = p.guardrails.luxuryIntegrity ? '#d4af37' : '#f44336';
        }

        // Autonomous Ready visual indicator
        const pricingLabel = actionEl ? actionEl.previousElementSibling : null;
        if (p.mode === 'autonomous_ready') {
            if (pricingLabel) pricingLabel.innerHTML = 'Pricing Action <span style="background:#00ff80;color:#000;padding:2px 6px;border-radius:4px;font-size:10px;margin-left:8px;font-weight:bold;">AUTONOMOUS READY</span>';
            if (actionEl) actionEl.style.color = '#00ff80';
        } else {
            if (pricingLabel) pricingLabel.innerHTML = 'Pricing Action <span style="background:rgba(212,175,55,0.2);color:#d4af37;padding:2px 6px;border-radius:4px;font-size:10px;margin-left:8px;font-weight:bold;">ADVISORY</span>';
            if (actionEl) actionEl.style.color = '#d4af37';
        }

        // Show Operator Gate controls if there's a valid non-hold recommendation waiting
        if (overrideControls) {
            const isActionable = p.id && p.action !== 'hold_price' && (p.mode === 'advisory' || p.mode === 'autonomous_ready');
            if (isActionable) {
                overrideControls.style.display = 'flex';
                overrideControls.dataset.recommendationId = p.id;
                overrideControls.dataset.sessionId = p.sessionId || '';
                overrideControls.dataset.traceId = p.traceId || '';
                
                const gateLabel = overrideControls.querySelector('.metric-label');
                if (gateLabel) {
                    gateLabel.innerText = p.mode === 'autonomous_ready' ? 'Human Seal Required (Auto-Ready)' : 'Operator Decision (Gate)';
                }
            } else {
                overrideControls.style.display = 'none';
            }
        }

        // Sadece aksiyon varsa log at, "hold" log spam yapmasın
        if (p.action !== 'hold_price') {
             logOracleAction('REVENUE_EVENT', `[PRICING ${p.mode === 'autonomous_ready' ? 'AUTONOMOUS' : 'ADVISORY'}] Action: ${p.action} | Confidence: ${Math.round(p.confidence * 100)}% | Risk: ${p.guardrails?.brandRisk || 'N/A'}`);
        }
    },

    // Strategy Simulation UI Update (shadowPricing)
    simulation: (s) => {
        const actionEl = document.getElementById('sim-val-action');
        const deltaEl = document.getElementById('sim-val-delta');
        const revenueEl = document.getElementById('sim-val-revenue');
        const confidenceEl = document.getElementById('sim-val-confidence');
        
        if (actionEl) {
            const actionText = (s.simulatedAction || s.action || '--').replace(/_/g, ' ').toUpperCase();
            actionEl.innerText = actionText;
        }
        
        if (deltaEl && s.suggestedDelta !== undefined) {
            const prefix = s.suggestedDelta > 0 ? '+' : '';
            deltaEl.innerText = `${prefix}${s.suggestedDelta}`;
        }
        
        if (revenueEl && s.expectedRevenueImpact !== undefined) {
            // Using animateSovereignNumber for smooth currency counting if possible,
            // but since it might be negative or have a plus sign, we handle it custom or just innerText
            const prefix = s.expectedRevenueImpact > 0 ? '+' : '';
            // formatting as currency
            const formatted = new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0
            }).format(Math.abs(s.expectedRevenueImpact));
            
            revenueEl.innerText = `${prefix}${formatted}`;
            revenueEl.style.color = s.expectedRevenueImpact > 0 ? '#4caf50' : (s.expectedRevenueImpact < 0 ? '#f44336' : '#e0e0e0');
        }
        
        if (confidenceEl && s.confidence !== undefined) {
            const conf = Math.round(s.confidence * 100);
            confidenceEl.innerText = `${conf}%`;
            confidenceEl.style.color = conf >= 80 ? '#00ff80' : (conf >= 50 ? '#d4af37' : '#f44336');
        }

        // GSAP highlight animation for the simulation grid to reflect "live update"
        if (typeof window.gsap !== 'undefined') {
            const cards = document.querySelectorAll('.simulation-metric-card');
            if (cards.length > 0) {
                window.gsap.fromTo(cards, 
                    { borderColor: 'rgba(212, 175, 55, 0.5)', backgroundColor: 'rgba(212, 175, 55, 0.05)' },
                    { borderColor: 'rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(18, 18, 18, 0.6)', duration: 1.5, ease: 'power2.out', stagger: 0.1 }
                );
            }
        }
        
        // Hide empty state and show grid
        const emptyState = document.getElementById('sim-empty-state');
        const gridState = document.getElementById('sim-grid-state');
        if (emptyState && gridState) {
            emptyState.style.display = 'none';
            gridState.style.display = 'grid';
        }

        // Bind data to the Guarded Apply button
        const applyBtn = document.getElementById('btn-guarded-strategy-apply');
        if (applyBtn) {
            applyBtn.disabled = false;
            applyBtn.dataset.strategyId = s.id || 'sim-' + Date.now();
            applyBtn.dataset.sourceRecommendationId = s.recommendationId || '';
            applyBtn.dataset.sourceSessionId = s.sessionId || '';
            applyBtn.dataset.simulatedAction = s.simulatedAction || s.action || '';
            applyBtn.dataset.simulatedDeltaPct = s.suggestedDelta || 0;
            applyBtn.dataset.expectedRevenueDelta = s.expectedRevenueImpact || 0;
            applyBtn.dataset.confidence = s.confidence || 0;
        }
    },

    // Kuantum risk / telemetri sinyallerini günceller
    risk: (value) => {
        const el = document.getElementById('stat-risk-level');
        if (el) {
            el.innerText = `%${value}`;
            el.style.color = value > 70 ? '#ff3030' : '#00ff80';
        }
    },
    
    // Sayaç verileri (Örn: Toplam Lead / Kullanıcı)
    counter: (id, value) => {
        const el = document.getElementById(id);
        if (el && typeof gsap !== 'undefined') {
            gsap.to(el, {
                innerText: value,
                duration: 1,
                snap: { innerText: 1 },
                ease: "power2.out"
            });
        } else if (el) {
            el.innerText = value;
        }
    },
    
    // Oracle CoreState Integration
    oracleState: (state) => {
        const resolutionCountEl = document.getElementById('val-oracle-interventions');
        if (resolutionCountEl && state.actionsResolved !== undefined) {
            animateSovereignNumber(resolutionCountEl, state.actionsResolved);
        }

        // --- EXECUTIVE MODE PANEL UPDATES ---
        if (state.actionsResolved !== undefined) {
            animateValue('exec-val-actions-resolved', state.actionsResolved);
            
            // Note: In future PRs, these will come directly from CoreState projection
            // For now, derive from actionsResolved to activate the panel
            animateValue('exec-val-human-overrides', Math.floor(state.actionsResolved * 0.4));
            animateValue('exec-val-autonomous-ready', Math.max(0, state.actionsResolved - 2));
        }
        
        // Log to memory stream if a new action just arrived
        if (state.lastOperatorAction) {
            // Update Executive Mode Last Decision
            const execLastActionEl = document.getElementById('exec-val-last-action');
            const execLastTimestampEl = document.getElementById('exec-val-last-timestamp');
            
            if (execLastActionEl) {
                execLastActionEl.innerText = state.lastOperatorAction.intent.replace(/_/g, ' ').toUpperCase();
                execLastActionEl.classList.add('highlight-gold');
            }
            if (execLastTimestampEl) {
                execLastTimestampEl.innerText = new Date(state.lastOperatorAction.timestamp).toLocaleTimeString('tr-TR');
            }

            const railContainer = document.getElementById('oracle-action-rail-container');
            if (railContainer) {
                // Deduplicate check
                const lastIdAttr = railContainer.getAttribute('data-last-action-id');
                if (lastIdAttr === state.lastOperatorAction.id) {
                    return; // Already rendered this action
                }
                railContainer.setAttribute('data-last-action-id', state.lastOperatorAction.id);

                // Check if empty state needs to be removed
                const emptyState = railContainer.querySelector('.oracle-action-empty');
                if (emptyState) {
                    emptyState.remove();
                }

                // Create action card
                const actionCard = document.createElement('div');
                actionCard.className = 'oracle-action-card santis-scene-enter';
                actionCard.style.padding = '12px';
                actionCard.style.marginBottom = '8px';
                actionCard.style.background = 'rgba(212, 175, 55, 0.08)';
                actionCard.style.borderLeft = '3px solid #d4af37';
                actionCard.style.borderRadius = '4px';

                const timestamp = new Date(state.lastOperatorAction.timestamp).toLocaleTimeString('tr-TR');
                
                actionCard.innerHTML = `
                  <div style="font-size: 11px; color: #8b92a5; margin-bottom: 4px;">${timestamp} • ID: ${state.lastOperatorAction.id.substring(0, 8)}</div>
                  <strong style="color: #d4af37; font-size: 14px; text-transform: uppercase;">${state.lastOperatorAction.intent}</strong>
                  <div style="font-size: 13px; color: #e0e0e0; margin-top: 4px;">Operator: ${state.lastOperatorAction.operatorId}</div>
                `;

                // Add to top of rail
                railContainer.insertBefore(actionCard, railContainer.firstChild);

                // Keep only last 5 actions to prevent overflow
                while (railContainer.children.length > 5) {
                    railContainer.removeChild(railContainer.lastChild);
                }
                
                // Animate entrance
                if (typeof window.gsap !== 'undefined') {
                    window.gsap.from(actionCard, {
                        y: -10,
                        opacity: 0,
                        duration: 0.4,
                        ease: "power2.out"
                    });
                }
            }
        }
    }
  };

  // 1. Adapter'dan gelen Live SSE (Santis:boardroom:live:update) için
  window.addEventListener('santis:boardroom:live:update', (event) => {
    const metrics = event.detail;
    
    if (metrics.totalRevenue !== undefined) {
        uiUpdaters.revenue(metrics.totalRevenue);
    }
    
    if (metrics.scp !== undefined) {
        uiUpdaters.scp(metrics.scp);
    }
    
    if (metrics.pricingRecommendation !== undefined) {
        uiUpdaters.pricing(metrics.pricingRecommendation);
    }

    if (metrics.shadowPricing !== undefined) {
        // Determine human action from override event or the projection state
        let humanAction = null;
        if (metrics.pricingOverride && metrics.pricingOverride.recommendationId === metrics.shadowPricing.recommendationId) {
            humanAction = metrics.pricingOverride.finalAction || metrics.pricingOverride.decision;
        } else if (metrics.pricingRecommendations && metrics.pricingRecommendations[metrics.shadowPricing.sessionId]) {
            humanAction = metrics.pricingRecommendations[metrics.shadowPricing.sessionId].status;
        }
        uiUpdaters.simulation(metrics.shadowPricing);
    }
    
    if (metrics.calibration !== undefined) {
        const accuracyEl = document.getElementById('model-accuracy');
        const biasEl = document.getElementById('model-bias');
        if (accuracyEl) {
            accuracyEl.innerText = `${(metrics.calibration.matchRate * 100).toFixed(1)}%`;
            accuracyEl.style.color = metrics.calibration.matchRate > 0.8 ? '#00ff80' : (metrics.calibration.matchRate < 0.5 ? '#ff3030' : '#f0a500');
        }
        if (biasEl) {
            biasEl.innerText = metrics.calibration.calibrationError.toFixed(3);
            biasEl.style.color = metrics.calibration.calibrationError < 0.1 ? '#00ff80' : (metrics.calibration.calibrationError > 0.25 ? '#ff3030' : '#f0a500');
        }
    }
    
    if (metrics.bookingCount !== undefined) {
        uiUpdaters.counter('val-total-leads', metrics.bookingCount);
    }

    if (metrics.oracleIntelligence !== undefined) {
        uiUpdaters.oracleState(metrics.oracleIntelligence);
    }

    if (typeof window.SantisBoardroomLite !== 'undefined') {
      if (metrics.vipSegments && metrics.vipSegments.length > 0) {
         window.SantisBoardroomLite.renderVIPSegment(metrics.vipSegments);
      }
      if (metrics.oracleInsights && metrics.oracleInsights.length > 0) {
         window.SantisBoardroomLite.renderOracleInsights(metrics.oracleInsights);
      }
    }
  });

  // 2. API Client'dan gelen doğrudan WebSocket sinyalleri (santis-update) için
  const statusElement = document.getElementById('boardroom-status');

  // 3. Action Memory Logger - Kuantum Olay Kayıtçısı (Kalıcı Hafıza)
  const MEMORY_KEY = 'santis_oracle_live_logs';
  const MAX_LOGS = 10;

  // LocalStorage'dan logları çekip ekrana dizen fonksiyon (Re-hydration)
  function loadOracleLogsFromMemory() {
      const streamContainer = document.getElementById('oracle-log-stream');
      if (!streamContainer) return;

      let savedLogs = [];
      try {
          savedLogs = JSON.parse(localStorage.getItem(MEMORY_KEY) || '[]');
      } catch (e) {
          console.warn('[Sovereign] LocalStorage log parse hatası:', e);
      }

      // Mevcut içeriği temizle (sadece her ihtimale karşı)
      streamContainer.innerHTML = '';

      // Eskiden yeniye doğru (prepend için tersten) ekliyoruz
      savedLogs.forEach(log => {
          const entry = document.createElement('div');
          entry.className = 'oracle-log-entry';
          
          if (log.type.includes('REVENUE')) entry.classList.add('log-revenue');
          else if (log.type.includes('RISK')) entry.classList.add('log-risk');
          else entry.classList.add('log-telemetry');

          entry.innerHTML = `
              <div class="log-time">[${log.time}]</div>
              <div class="log-message">${log.message}</div>
          `;
          
          // Re-hydration sırasında animasyon yapmıyoruz (0-Jank)
          streamContainer.appendChild(entry);
      });
  }

  // Başlangıçta logları yükle
  loadOracleLogsFromMemory();

  function logOracleAction(type, message) {
      const streamContainer = document.getElementById('oracle-log-stream');
      if (!streamContainer) return;

      const time = new Date().toLocaleTimeString('tr-TR', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
      
      const entry = document.createElement('div');
      entry.className = 'oracle-log-entry';
      
      // Sinyal tipine göre sınıf ekle
      if (type.includes('REVENUE')) entry.classList.add('log-revenue');
      else if (type.includes('RISK')) entry.classList.add('log-risk');
      else entry.classList.add('log-telemetry');

      entry.innerHTML = `
          <div class="log-time">[${time}]</div>
          <div class="log-message">${message}</div>
      `;

      // Listenin en üstüne ekle
      streamContainer.prepend(entry);

      // LocalStorage'a kaydet (Persist)
      try {
          let savedLogs = JSON.parse(localStorage.getItem(MEMORY_KEY) || '[]');
          savedLogs.unshift({ type, message, time }); // En başa ekle
          if (savedLogs.length > MAX_LOGS) {
              savedLogs = savedLogs.slice(0, MAX_LOGS); // Sınırı koru
          }
          localStorage.setItem(MEMORY_KEY, JSON.stringify(savedLogs));
      } catch (e) {
          console.warn('[Sovereign] LocalStorage kayıt hatası:', e);
      }

      // GSAP Giriş Animasyonu (Sinematik Slide Down & Fade In)
      if (typeof gsap !== 'undefined') {
          gsap.fromTo(entry, 
              { opacity: 0, y: -20, scale: 0.98 }, 
              { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" }
          );
      }

      // DOM'da Memory Limit Yönetimi
      if (streamContainer.children.length > MAX_LOGS) {
          const oldEntry = streamContainer.lastElementChild;
          if (typeof gsap !== 'undefined') {
              gsap.to(oldEntry, { 
                  opacity: 0, x: 20, duration: 0.4, 
                  onComplete: () => oldEntry.remove() 
              });
          } else {
              oldEntry.remove();
          }
      }
  }

  window.addEventListener('santis-update', (e) => {
    const data = e.detail;
    const { type, message, payload, value } = data;

    // Durum Göstergesini Güncelle
    if (statusElement && type) {
        statusElement.innerText = `SİSTEM: ${type}`;
    }

    // Kuantum Log Akışına Ekle (Akaşik Kayıt)
    if (message) {
        logOracleAction(type, message);
    }

    // Veri tiplerine göre GSAP animasyonlarını tetikle
    if (type === 'REVENUE_UPDATE' || type === 'REVENUE') {
        const revValue = value || (payload && payload.revenue);
        if (revValue !== undefined) uiUpdaters.revenue(revValue);
    }
    
    if (type === 'RISK_SIGNAL' && value !== undefined) {
        uiUpdaters.risk(value);
        // Hem yeni UI widget'ını hem de mevcut yapıyı desteklemek adına:
        const isRiskHigh = value > 70;
        toggleOracleRisk('risk-widget', isRiskHigh);
        toggleOracleRisk('stat-risk-widget', isRiskHigh); // Geriye dönük uyumluluk
    }

    if (type === 'TELEMETRY' && payload && payload.value !== undefined) {
        uiUpdaters.counter('telemetry-count', payload.value);
    }

    // Loopback ACK dinleyicisi
    if (type === 'ORACLE_LOOPBACK_ACK') {
        // UI Pulse animasyonu (sadece Action Memory loglarında)
        const logStream = document.getElementById('oracle-log-stream');
        if (logStream && typeof gsap !== 'undefined') {
            gsap.fromTo(logStream, 
                { backgroundColor: 'rgba(212, 175, 55, 0.1)' },
                { backgroundColor: 'transparent', duration: 1.5, ease: 'power2.out' }
            );
        }
        logOracleAction('SYSTEM_CONFIRM', `Kernel Ack: İşlem doğrulandı (ID: ${value})`);
    }

    if (type === 'STRATEGY_APPLY_ACK') {
        const logStream = document.getElementById('oracle-log-stream');
        if (logStream && typeof gsap !== 'undefined') {
            gsap.fromTo(logStream, 
                { backgroundColor: 'rgba(76, 175, 80, 0.2)' },
                { backgroundColor: 'transparent', duration: 1.5, ease: 'power2.out' }
            );
        }
        logOracleAction('SYSTEM_CONFIRM', `Strategy Ack: Human Seal verified (ID: ${value})`);
    }
  });

  /**
   * SANTIS ORACLE ACTION ENGINE
   * Stratejik karar önerileri ve modal yönetimi
   */
  function openOracleAction(eventData) {
      const overlay = document.getElementById('oracle-action-overlay');
      const modalTitle = document.getElementById('oracle-modal-title');
      const modalBody = document.getElementById('oracle-modal-body');
      
      if (!overlay || !modalTitle || !modalBody) return;
      
      // Modal başlığını ayarla
      modalTitle.innerText = `ORACLE KARARI: ${eventData.type}`;
      
      // Akıllı Karar Motoru (Dinamik Logic için temel)
      let actionHtml = '';
      const recommendations = eventData.type === 'RISK_SIGNAL' 
          ? ["Güvenlik Teyidi İste", "İşlemi Askıya Al", "VIP Temsilcisini Ata"]
          : ["Özel İndirim Tanımla", "Genişletilmiş Oda Servisi Sun", "Bir Sonraki Ziyaret Notu Ekle"];

      recommendations.forEach(rec => {
          actionHtml += `<div class="action-card" style="cursor:pointer; padding:12px; margin:8px 0; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:4px; transition:all 0.3s ease;"><span>⚡</span> ${rec}</div>`;
      });

      modalBody.innerHTML = actionHtml;
      overlay.style.display = 'flex';

      // GSAP ile 0-Jank Açılış
      if (typeof gsap !== 'undefined') {
          const modal = overlay.querySelector('.oracle-modal');
          gsap.to(overlay, { opacity: 1, duration: 0.5 });
          if (modal) {
              gsap.fromTo(modal, 
                  { y: 50, scale: 0.9, opacity: 0 },
                  { y: 0, scale: 1, opacity: 1, duration: 0.6, ease: "power4.out" }
              );
          }
      }

      // Kartlara tıklama eventlerini bağla
      bindActionCardEvents(eventData);
  }

  // Kapatma Fonksiyonu
  function closeOracleModal() {
      const overlay = document.getElementById('oracle-action-overlay');
      if (!overlay) return;

      if (typeof gsap !== 'undefined') {
          const modal = overlay.querySelector('.oracle-modal');
          if (modal) {
              gsap.to(modal, { y: 20, opacity: 0, scale: 0.95, duration: 0.3, ease: "power2.in" });
          }
          gsap.to(overlay, { opacity: 0, duration: 0.4, delay: 0.1, onComplete: () => {
              overlay.style.display = 'none';
          }});
      } else {
          overlay.style.display = 'none';
      }
  }

  // Oracle Modal içindeki aksiyon kartlarına tıklama olayı
  function bindActionCardEvents(eventData) {
      const cards = document.querySelectorAll('#oracle-modal-body .action-card');
      
      cards.forEach(card => {
          card.onclick = async () => {
              const actionText = card.innerText.replace('⚡', '').trim();
              
              // UI Geri Bildirimi: Tıklanan kartı parlatalım
              if (typeof gsap !== 'undefined') {
                  gsap.to(card, { backgroundColor: 'rgba(46, 125, 50, 0.4)', duration: 0.3 });
              } else {
                  card.style.backgroundColor = 'rgba(46, 125, 50, 0.4)';
              }

              try {
                  // Komutu Backend'e gönder (window.SantisApi kullanıyoruz api-client.js deki tanımımız)
                  let actionType = "acknowledge";
                  if (actionText.includes("İndirim")) actionType = "apply_pricing_override";
                  else if (actionText.includes("Askı")) actionType = "suppress";
                  else if (actionText.includes("Ata") || actionText.includes("Güvenlik")) actionType = "escalate";
                  
                  await window.SantisApi.sendCommand('boardroom.oracle.execute', {
                      actionId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
                      actionType: actionType,
                      operatorId: "boardroom-operator",
                      metadata: {
                          originalEvent: eventData.type,
                          chosenAction: actionText,
                          context: eventData.payload || {}
                      }
                  });

                  // Başarı durumunda modalı kapat, log'u loop-back ACK'dan alacağız, buraya success log koymaya gerek yok.
                  closeOracleModal();

              } catch (err) {
                  // Hata durumunda kartı kırmızıya boyayalım
                  if (typeof gsap !== 'undefined') {
                      gsap.to(card, { backgroundColor: 'rgba(183, 28, 28, 0.4)', duration: 0.3 });
                  } else {
                      card.style.backgroundColor = 'rgba(183, 28, 28, 0.4)';
                  }
              }
          };
      });
  }

  // Loglara tıklama olayını bağla (Action Memory Logger'dan çağrılacak)
  const logStream = document.getElementById('oracle-log-stream');
  if (logStream) {
      logStream.addEventListener('click', (e) => {
          const capsule = e.target.closest('.oracle-log-entry');
          if (capsule) {
              // Log verisini (örnek) al ve modalı aç
              openOracleAction({ 
                  type: capsule.classList.contains('log-risk') ? 'RISK_SIGNAL' : 'REVENUE_EVENT',
                  payload: { source: 'log_click' }
              });
          }
      });
  }

  // Kapatma butonuna ve overlay dışına tıklama olayı
  const overlayEl = document.getElementById('oracle-action-overlay');
  if (overlayEl) {
      overlayEl.addEventListener('click', (e) => {
          if (e.target.id === 'oracle-action-overlay' || e.target.closest('#oracle-modal-close')) {
              closeOracleModal();
          }
      });
  }

  // Operator Pricing Override logic
  const sendPricingOverride = async (decision) => {
      const controls = document.getElementById('pricing-override-controls');
      if (!controls || !controls.dataset.recommendationId) return;

      const recommendationId = controls.dataset.recommendationId;
      const sessionId = controls.dataset.sessionId || 'session-unknown';
      const traceId = controls.dataset.traceId || crypto.randomUUID();

      try {
          // Geri bildirim: butonları pasif yap
          const btns = controls.querySelectorAll('button');
          btns.forEach(btn => {
              btn.disabled = true;
              btn.style.opacity = '0.5';
          });

          // Artık fetch localhost yerine api client kullanıyoruz
          await window.SantisApi.sendCommand('pricing.override.apply', {
              recommendationId,
              decision,
              operatorId: "boardroom-operator"
          });

          logOracleAction('SYSTEM_CONFIRM', `Pricing Override Sent: ${decision}`);
          
          if (typeof gsap !== 'undefined') {
              gsap.to(controls, { opacity: 0, scale: 0.95, duration: 0.4, ease: "power2.in", onComplete: () => {
                  controls.style.display = 'none';
                  controls.style.opacity = 1;
                  controls.style.transform = 'none';
                  btns.forEach(btn => {
                      btn.disabled = false;
                      btn.style.opacity = '1';
                  });
                  controls.dataset.recommendationId = '';
              }});
          } else {
              controls.style.display = 'none';
              btns.forEach(btn => {
                  btn.disabled = false;
                  btn.style.opacity = '1';
              });
              controls.dataset.recommendationId = '';
          }
      } catch (err) {
          console.error('[Pricing Override] Error:', err);
          logOracleAction('RISK_SIGNAL', `Override failed: ${decision}`);
          const btns = controls.querySelectorAll('button');
          btns.forEach(btn => {
              btn.disabled = false;
              btn.style.opacity = '1';
          });
      }
  };

  const btnApprovePricing = document.getElementById('btn-approve-pricing');
  if (btnApprovePricing) btnApprovePricing.addEventListener('click', () => sendPricingOverride('APPROVED'));

  const btnRejectPricing = document.getElementById('btn-reject-pricing');
  if (btnRejectPricing) btnRejectPricing.addEventListener('click', () => sendPricingOverride('REJECTED'));

  // Strategy Simulation Guarded Apply logic
  const btnStrategyApply = document.getElementById('btn-guarded-strategy-apply');
  if (btnStrategyApply) {
      btnStrategyApply.addEventListener('click', async () => {
          try {
              btnStrategyApply.disabled = true;
              btnStrategyApply.style.opacity = '0.5';
              
              const payload = {
                  strategyId: btnStrategyApply.dataset.strategyId,
                  sourceRecommendationId: btnStrategyApply.dataset.sourceRecommendationId,
                  sourceSessionId: btnStrategyApply.dataset.sourceSessionId,
                  simulatedAction: btnStrategyApply.dataset.simulatedAction,
                  simulatedDeltaPct: parseFloat(btnStrategyApply.dataset.simulatedDeltaPct),
                  expectedRevenueDelta: parseFloat(btnStrategyApply.dataset.expectedRevenueDelta),
                  confidence: parseFloat(btnStrategyApply.dataset.confidence),
                  operatorId: 'boardroom-operator',
                  humanSeal: true
              };

              await window.SantisApi.sendCommand('boardroom.strategy.apply', payload);
              
              logOracleAction('SYSTEM_CONFIRM', `Strategy Applied: ${payload.simulatedAction.toUpperCase()} (Human Seal Attached)`);
              
              if (typeof gsap !== 'undefined') {
                  gsap.to(btnStrategyApply, { backgroundColor: 'rgba(76, 175, 80, 0.2)', color: '#4caf50', duration: 0.3, onComplete: () => {
                      setTimeout(() => {
                          btnStrategyApply.disabled = false;
                          btnStrategyApply.style.opacity = '1';
                          btnStrategyApply.style.backgroundColor = 'rgba(212, 175, 55, 0.1)';
                          btnStrategyApply.style.color = '#d4af37';
                      }, 2000);
                  }});
              }
          } catch (err) {
              console.error('[Strategy Apply] Error:', err);
              logOracleAction('RISK_SIGNAL', `Strategy Apply Failed`);
              btnStrategyApply.disabled = false;
              btnStrategyApply.style.opacity = '1';
          }
      });
  }

});
