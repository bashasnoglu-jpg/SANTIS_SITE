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

        // Show Operator Gate controls if there's a valid non-hold recommendation waiting
        if (overrideControls) {
            if (p.id && p.action !== 'hold_price' && p.mode === 'advisory') {
                overrideControls.style.display = 'flex';
                overrideControls.dataset.recommendationId = p.id;
                overrideControls.dataset.sessionId = p.sessionId || '';
                overrideControls.dataset.traceId = p.traceId || '';
            } else {
                overrideControls.style.display = 'none';
            }
        }

        // Sadece aksiyon varsa log at, "hold" log spam yapmasın
        if (p.action !== 'hold_price') {
             logOracleAction('REVENUE_EVENT', `[PRICING ADVISORY] Action: ${p.action} | Confidence: ${Math.round(p.confidence * 100)}% | Risk: ${p.guardrails?.brandRisk || 'N/A'}`);
        }
    },

    // Shadow Autonomous Mode UI Update
    shadow: (s, humanAction) => {
        const actionEl = document.getElementById('shadow-action');
        const diffEl = document.getElementById('shadow-diff');
        
        if (actionEl) actionEl.innerText = s.simulatedAction.replace(/_/g, ' ').toUpperCase();
        
        if (diffEl) {
            let result = "AWAITING HUMAN";
            let color = "#8b92a5";
            
            if (humanAction) {
                // Determine if human matched the shadow action.
                // Normally humanAction is "approved" / "rejected".
                if (humanAction === "approved") {
                    result = "MATCH (ACCEPTED)";
                    color = "#4caf50";
                } else if (humanAction === "rejected") {
                    result = "DIVERGENCE (REJECTED)";
                    color = "#f44336";
                } else {
                    result = `DIVERGENCE (${humanAction.toUpperCase()})`;
                    color = "#ff9800";
                }
            }
            
            diffEl.innerText = result;
            diffEl.style.color = color;
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
        uiUpdaters.shadow(metrics.shadowPricing, humanAction);
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
          const modal = overlay.querySelector('.oracle-action-modal');
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
          const modal = overlay.querySelector('.oracle-action-modal');
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
                  await window.SantisApi.sendCommand('ExecuteOracleAction', {
                      originalEvent: eventData.type,
                      chosenAction: actionText,
                      context: eventData.payload || {}
                  });

                  // Başarı durumunda modalı kapat ve logger'a mesaj düş
                  closeOracleModal();
                  logOracleAction('SYSTEM_CONFIRM', `Onaylandı: ${actionText}`);

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

      const payload = {
          commandId: crypto.randomUUID(),
          commandType: 'pricing.override.apply',
          requestedAt: new Date().toISOString(),
          traceId,
          sessionId,
          payload: {
              recommendationId,
              decision
          }
      };

      try {
          // Geri bildirim: butonları pasif yap
          const btns = controls.querySelectorAll('button');
          btns.forEach(btn => {
              btn.disabled = true;
              btn.style.opacity = '0.5';
          });

          const response = await fetch('http://localhost:3030/api/v1/commands', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });

          if (!response.ok) throw new Error('Kernel override failed');

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

});
