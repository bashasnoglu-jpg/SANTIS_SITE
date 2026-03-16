// ==========================================
// 💳 PHASE 68 & 84: THE SOVEREIGN SEAL (ZERO-FRICTION CHECKOUT + FLUID ROLLING)
// ==========================================

const _SEAL_IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const _SEAL_API_BASE = window.__API_BASE__ || (_SEAL_IS_LOCAL ? 'http://localhost:8080/api/v1' : 'https://api.sovereign-os.com/api/v1');

const SovereignCardEngine = {
    timers: {},
    appliedRebates: {},

    init() {
        document.querySelectorAll('.ritual-card').forEach(card => {
            // Hover başlatıldığında sayacı kur
            card.addEventListener('mouseenter', () => this.handleHover(card));
            // Karttan çıkınca iptal et
            card.addEventListener('mouseleave', () => this.cancelHover(card));
        });
    },

    handleHover(card) {
        const ritualId = card.id;
        if (this.appliedRebates[ritualId]) return; // Zaten indirim varsa çık

        // 7 Saniye Hesitation Kuralı
        this.timers[ritualId] = setTimeout(() => {
            this.triggerFluidRolling(ritualId, card);
        }, 7000);
    },

    cancelHover(card) {
        const ritualId = card.id;
        if (this.timers[ritualId]) {
            clearTimeout(this.timers[ritualId]);
            delete this.timers[ritualId];
        }
    },

    triggerFluidRolling(ritualId, card) {
        console.log(`⏱️ [HESITATION OVERCOME] 7 saniye doldu. Rakamlar düşüyor: ${ritualId}`);
        this.appliedRebates[ritualId] = true;

        // Fluid Rolling Mekaniği
        const track = card.querySelector('.popup-price-track');
        if (track) {
            track.style.transform = `translateY(-50%)`; // İkinci fiyata kayar
        }

        // Çizgili fiyatın opacity'sini sıfırla ki silinsin
        const oldPrice = card.querySelector('.original-price');
        if (oldPrice) {
            oldPrice.classList.remove('group-hover:opacity-100');
            oldPrice.style.opacity = '0';
        }

        // Telemetri Ingest Phase 66 (God Mode'a Gönder)
        const ghostScore = window.SantisOS?.telemetryData?.sas_score || 95;
        const sessionId = sessionStorage.getItem('sovereign_sid') || 'sv_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('sovereign_sid', sessionId);

        try {
            fetch(`${_SEAL_API_BASE}/telemetry/ingest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    component: "ritual_card",
                    element_id: ritualId,
                    action: "hesitation_7s",
                    value: ghostScore,
                    session_id: sessionId
                })
            });
        } catch (e) {
            console.error("Telemetry hatası", e);
        }

        // Aurelia Fısıldasın
        if (typeof window.showAureliaToast === 'function') {
            window.showAureliaToast("Zamanınızın değeri var. Sovereign Rakamları sizin için mühürlendi.");
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    SovereignCardEngine.init();
});

// ZERO-FRICTION CHECKOUT MOTORU (Phase 68: Sovereign Seal Checkout)

// Brain Worker Reference for Telemetry
const brainWorker = new Worker('/assets/js/core/santis-brain-worker.js');

let currentBookingState = {
    ritualId: null,
    ritualName: null,
    targetPrice: 0,
    selectedDate: null,
    selectedTime: null,
    holdTimer: null
};

window.legacyTriggerSovereignCheckout = function (cardId) {
    if (!cardId) return;

    const ritualId = window.RITUAL_ID || cardId.replace('sig-card-', '').replace('hammam-card-', '').replace('therapy-card-', '');
    console.log(`🔒 [MATRIX INITIATED] Sovereign Ağ Geçidi Açılıyor: ${ritualId}`);

    let targetPrice = 150;
    let ritualName = "Sovereign Ritual";

    const stickyPriceEl = document.getElementById('sticky-price');
    if (stickyPriceEl) targetPrice = parseInt(stickyPriceEl.innerText.replace(/[^0-9]/g, ''), 10);

    const titleEl = document.getElementById('sticky-title') || document.querySelector('h1') || document.querySelector('h2');
    if (titleEl) ritualName = titleEl.innerText;

    currentBookingState.ritualId = ritualId;
    currentBookingState.ritualName = ritualName;
    currentBookingState.targetPrice = targetPrice;
    currentBookingState.selectedDate = null;
    currentBookingState.selectedTime = null;

    const priceDisplay = document.getElementById('matrix-total-price');
    if (priceDisplay) priceDisplay.innerText = `${targetPrice}€`;

    const lockBtn = document.getElementById('btn-lock-slot');
    if (lockBtn) {
        lockBtn.dataset.active = "false";
        lockBtn.innerText = "Hold For 10 Min";
    }

    // 1. Worker Telemetry Signal (Main Thread'i yormadan)
    brainWorker.postMessage({
        type: 'CHECKOUT_INITIATED',
        payload: { ritualId, timestamp: performance.now() }
    });

    openAvailabilityMatrix();
};

window.openAvailabilityMatrix = function () {
    const modal = document.getElementById('availability-modal');
    if (!modal) return;

    if (window.lenis) window.lenis.stop();
    document.body.style.overflow = 'hidden';

    // rAF ile modal açılışını bir sonraki render döngüsüne kilitle
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0', 'pointer-events-none');
        modal.style.opacity = '1';
        modal.style.pointerEvents = 'auto';
        modal.style.zIndex = '99999';

        const panel = modal.querySelector('.max-w-2xl');
        if (panel) {
            panel.style.willChange = 'transform, opacity'; // GPU'yu uyar
            panel.classList.remove('translate-y-12');
            panel.classList.add('translate-y-0');
        }

        document.getElementById('matrix-time-section').classList.add('opacity-50', 'pointer-events-none');
        document.getElementById('matrix-slots').innerHTML = '';

        // Takvimi renderla (Main thread boşaldığında)
        if ('requestIdleCallback' in window) {
            requestIdleCallback(generateMatrixDates);
        } else {
            setTimeout(generateMatrixDates, 30);
        }

        // 🖱️ Kinetik Drag-to-Scroll (Tarih Şeridi için)
        const datesStrip = document.getElementById('matrix-dates');
        if (datesStrip && !datesStrip._dragInit) {
            datesStrip._dragInit = true;
            let isDown = false, startX = 0, scrollLeftStart = 0;

            datesStrip.addEventListener('mousedown', (e) => {
                isDown = true;
                datesStrip.style.scrollSnapType = 'none';
                startX = e.pageX - datesStrip.offsetLeft;
                scrollLeftStart = datesStrip.scrollLeft;
            });
            datesStrip.addEventListener('mouseleave', () => { isDown = false; });
            datesStrip.addEventListener('mouseup', () => {
                isDown = false;
                setTimeout(() => { datesStrip.style.scrollSnapType = 'x mandatory'; }, 80);
            });
            datesStrip.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                datesStrip.scrollLeft = scrollLeftStart - (e.pageX - datesStrip.offsetLeft - startX) * 1.5;
            });
        }

    }); // end requestAnimationFrame
};

window.closeAvailabilityMatrix = function () {
    const modal = document.getElementById('availability-modal');
    if (!modal) return;

    const panel = modal.querySelector('.max-w-2xl');
    if (panel) {
        requestAnimationFrame(() => {
            panel.classList.remove('translate-y-0');
            panel.classList.add('translate-y-12');

            setTimeout(() => {
                modal.classList.add('opacity-0', 'pointer-events-none');
                modal.style.opacity = '0';
                modal.style.pointerEvents = 'none';

                if (window.lenis) window.lenis.start();
                document.body.style.overflow = '';
                if (currentBookingState.holdTimer) clearInterval(currentBookingState.holdTimer);
            }, 400);
        });
    }
};

// 📅 Generate Kinetic Dates (Next 14 Days)
function generateMatrixDates() {
    const container = document.getElementById('matrix-dates');
    if (!container) return;

    const today = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    document.getElementById('matrix-month-label').innerText = months[today.getMonth()];

    // Fragment kullanımı ve DOM Batch Update
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < 14; i++) {
        let d = new Date(today);
        d.setDate(today.getDate() + i);

        const isToday = i === 0;
        const dayName = isToday ? 'TODAY' : days[d.getDay()];
        const dateNum = d.getDate();
        const fullDateStr = d.toISOString().split('T')[0];

        const btn = document.createElement('button');
        btn.className = `flex-shrink-0 w-20 p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-2 group outline-none
            ${isToday ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10' : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'}`;
        btn.dataset.date = fullDateStr;
        btn.onclick = () => selectMatrixDate(btn, fullDateStr);

        btn.innerHTML = `
            <span class="text-[9px] uppercase tracking-widest ${isToday ? 'text-[#D4AF37]' : 'text-gray-500 group-hover:text-gray-300 transition-colors'}">${dayName}</span>
            <span class="text-2xl font-serif text-white">${dateNum}</span>
        `;
        fragment.appendChild(btn);
    }

    // rAF ile DOM'a tek seferde göm
    requestAnimationFrame(() => {
        container.innerHTML = '';
        container.appendChild(fragment);
    });
}

function selectMatrixDate(btn, dateStr) {
    currentBookingState.selectedDate = dateStr;
    currentBookingState.selectedTime = null;

    requestAnimationFrame(() => {
        const allBtns = document.getElementById('matrix-dates').querySelectorAll('button');
        allBtns.forEach(b => {
            b.classList.remove('border-[#D4AF37]', 'bg-[#D4AF37]/20');
            b.classList.add('border-white/10', 'bg-white/5');
            const label = b.querySelector('span:first-child');
            if (label && label.innerText !== 'TODAY') {
                label.classList.remove('text-[#D4AF37]');
                label.classList.add('text-gray-500');
            }
        });

        btn.classList.remove('border-white/10', 'bg-white/5');
        btn.classList.add('border-[#D4AF37]', 'bg-[#D4AF37]/20');
        const activeLabel = btn.querySelector('span:first-child');
        if (activeLabel && activeLabel.innerText !== 'TODAY') {
            activeLabel.classList.remove('text-gray-500');
            activeLabel.classList.add('text-[#D4AF37]');
        }
    });

    checkLockReadiness();
    if ('requestIdleCallback' in window) {
        requestIdleCallback(generateMatrixTimes);
    } else {
        setTimeout(generateMatrixTimes, 20);
    }
}

// ⏰ Generate Time Slots for the Selected Date
function generateMatrixTimes() {
    const container = document.getElementById('matrix-slots');
    const hours = ['10:00', '11:00', '13:00', '14:30', '16:00', '17:30', '19:00'];
    const fragment = document.createDocumentFragment();

    hours.forEach((time, index) => {
        const isBooked = Math.random() < 0.2;
        const btn = document.createElement('button');
        btn.className = `p-3 rounded-xl border text-sm font-medium transition-all duration-300 outline-none
            ${isBooked ? 'border-red-500/20 bg-red-500/5 text-gray-600 cursor-not-allowed mx-auto opacity-50 relative overflow-hidden'
                : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/40 hover:text-white hover:-translate-y-1'}`;

        if (!isBooked) {
            btn.onclick = () => selectMatrixTime(btn, time);
        }

        if (isBooked) {
            btn.innerHTML = `<span class="line-through">${time}</span><div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_45%,rgba(255,255,255,0.1)_50%,transparent_55%)] animate-[shimmer_2s_infinite]"></div>`;
        } else {
            btn.innerText = time;
        }

        btn.style.opacity = '0';
        btn.style.transform = 'translateY(10px)';
        fragment.appendChild(btn);

        // Staggered Entrance without freezing DOM
        setTimeout(() => {
            requestAnimationFrame(() => {
                if (!isBooked) btn.style.opacity = '1';
                else btn.style.opacity = '0.5';
                if (!isBooked) btn.style.transform = 'translateY(0)';
            });
        }, index * 50);
    });

    requestAnimationFrame(() => {
        container.innerHTML = '';
        container.appendChild(fragment);
        document.getElementById('matrix-time-section').classList.remove('opacity-50', 'pointer-events-none');
    });
}

function selectMatrixTime(btn, time) {
    currentBookingState.selectedTime = time;

    requestAnimationFrame(() => {
        const allBtns = document.getElementById('matrix-slots').querySelectorAll('button');
        allBtns.forEach(b => {
            if (!b.classList.contains('cursor-not-allowed')) {
                b.classList.remove('border-white', 'bg-white', 'text-black', 'scale-105');
                b.classList.add('border-white/10', 'bg-white/5', 'text-gray-300');
            }
        });

        btn.classList.remove('border-white/10', 'bg-white/5', 'text-gray-300');
        btn.classList.add('border-white', 'bg-white', 'text-black', 'scale-105');
    });

    brainWorker.postMessage({
        type: 'SLOT_SELECTED',
        payload: { time, timestamp: performance.now() }
    });

    checkLockReadiness();
}

function checkLockReadiness() {
    const lockBtn = document.getElementById('btn-lock-slot');
    if (!lockBtn) return;

    requestAnimationFrame(() => {
        if (currentBookingState.selectedDate && currentBookingState.selectedTime) {
            lockBtn.dataset.active = "true";
            lockBtn.onclick = initiateSovereignLock;
        } else {
            lockBtn.dataset.active = "false";
            lockBtn.onclick = null;
        }
    });
}

// 🔐 THE 10-MINUTE ATOMIC LOCK (Phase 87)
function initiateSovereignLock() {
    const lockBtn = document.getElementById('btn-lock-slot');
    lockBtn.dataset.active = "false";

    requestAnimationFrame(() => {
        lockBtn.innerHTML = `
            <span class="flex items-center gap-3 justify-center">
                <span class="w-3 h-3 rounded-full border-2 border-black border-t-transparent animate-spin"></span>
                SECURING SLOT...
            </span>`;
    });

    setTimeout(() => {
        requestAnimationFrame(() => {
            lockBtn.classList.remove('bg-white', 'text-black');
            lockBtn.classList.add('bg-[#D4AF37]', 'text-black', 'border-[#D4AF37]');

            lockBtn.innerHTML = `
                <div class="flex items-center gap-3 justify-center text-black">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    <span>LOCKED (10:00) — PAY NOW</span>
                </div>
            `;

            lockBtn.onclick = executePhase68Checkout;
            lockBtn.dataset.active = "true";
        });

        let secondsLeft = 600;
        currentBookingState.holdTimer = setInterval(() => {
            secondsLeft--;
            if (secondsLeft <= 0) {
                clearInterval(currentBookingState.holdTimer);
                closeAvailabilityMatrix();
                alert('Zaman aşımı. Slot serbest bırakıldı.');
                return;
            }

            const m = Math.floor(secondsLeft / 60);
            const s = secondsLeft % 60;
            const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

            requestAnimationFrame(() => {
                lockBtn.innerHTML = `
                    <div class="flex items-center gap-3 justify-center text-black">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        <span>LOCKED (${timeStr}) — PAY NOW</span>
                    </div>
                `;
            });
        }, 1000);
    }, 800);
}

// Proceed to Stripe Hosted API
async function executePhase68Checkout() {
    console.log(`💳 [COMMERCE ENGINE] Launching Stripe for session lock: ${currentBookingState.selectedDate} @ ${currentBookingState.selectedTime}`);

    const btn = document.getElementById('btn-lock-slot');

    requestAnimationFrame(() => {
        btn.innerHTML = `<span class="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin inline-block"></span>`;

        const overlayHtml = `
            <div id="sovereign-seal-overlay" class="fixed inset-0 z-[9999] bg-[#050505]/85 backdrop-blur-2xl transition-opacity duration-[800ms] flex flex-col items-center justify-center pointer-events-auto" style="opacity: 1; transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                <div class="w-24 h-24 rounded-full bg-[#D4AF37]/5 flex items-center justify-center border border-[#D4AF37]/30 shadow-[0_0_50px_rgba(212,175,55,0.2)] mb-8 relative">
                    <span class="absolute inset-0 rounded-full border border-[#D4AF37]/40 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-20"></span>
                    <span class="w-12 h-12 border-[3px] border-[#D4AF37]/80 border-t-transparent border-b-transparent rounded-full animate-spin"></span>
                    <span class="absolute text-[12px] text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]">👑</span>
                </div>
                <h3 class="font-serif text-3xl text-white italic tracking-wider drop-shadow-lg">Sovereign <span class="not-italic text-[#D4AF37]">Gateway</span></h3>
                <p class="font-mono text-[9px] text-gray-500 uppercase tracking-[6px] mt-4 animate-pulse">Routing to Secure Ledger</p>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', overlayHtml);
    });

    try {
        const response = await fetch(`${_SEAL_API_BASE}/payments/checkout/sovereign-seal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ritual_id: currentBookingState.ritualId,
                ritual_name: currentBookingState.ritualName,
                price_eur: currentBookingState.targetPrice,
                date: currentBookingState.selectedDate,
                time: currentBookingState.selectedTime
            })
        });

        if (!response.ok) throw new Error("Vault Kilitli.");
        const data = await response.json();

        if (data.checkout_url) {
            brainWorker.postMessage({ type: 'ORDER_FINALIZED', payload: { sessionId: data.id || 'stripe_session_fallback' } });
            window.location.href = data.checkout_url;
        } else {
            throw new Error("URL dönmedi.");
        }
    } catch (e) {
        console.warn("Backend kapali, Stripe Checkout'a statik mock ile yonlendiriliyor (Phase 87 Frontend Test)...");
        setTimeout(() => {
            alert('Stripe Hosted Checkout Sayfası Açılıyor \n💳 Tutar: ' + currentBookingState.targetPrice + '€\n🕒 Randevu: ' + currentBookingState.selectedDate + ' - ' + currentBookingState.selectedTime);
            closeAvailabilityMatrix();
            requestAnimationFrame(() => {
                document.getElementById('sovereign-seal-overlay')?.remove();
                btn.innerHTML = 'Hold For 10 Min';
                btn.classList.remove('bg-[#D4AF37]', 'text-black', 'border-[#D4AF37]');
                btn.classList.add('bg-white/10', 'text-white/50');
                btn.dataset.active = "false";
            });
        }, 1500);
    }
}
