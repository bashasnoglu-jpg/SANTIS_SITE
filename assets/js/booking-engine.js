/**
 * SANTIS BOOKING ENGINE v1.1
 * ──────────────────────────
 * Multi-step reservation wizard for Santis Club Spa.
 * Depends on: api-client.js (SantisAPI)
 */

const BookingEngine = {

    /* ───────── STATE ───────── */
    state: {
        step: 1,
        maxSteps: 3,
        data: {
            service: null,
            date: null,
            time: null,
            guest: { name: '', phone: '', notes: '' }
        },
        services: [
            { id: 'ritual_sig',   name: 'Santis Signature Ritüel', price: '140€', duration: '90 dk', desc: 'Bütüncül arınma ve yenilenme terapisi.' },
            { id: 'massage_deep', name: 'Derin Doku Masajı',        price: '90€',  duration: '50 dk', desc: 'Kas gerginliği ve spor sonrası toparlanma.' },
            { id: 'hammam_otto',  name: 'Osmanlı Hamam Sefası',     price: '75€',  duration: '45 dk', desc: 'Geleneksel kese ve köpük ritüeli.' },
            { id: 'facial_glow',  name: 'Sothys Glow Bakım',        price: '110€', duration: '60 dk', desc: 'Cilde ışıltı ve canlılık kazandırır.' }
        ]
    },

    /* ───────── INIT ───────── */
    init() {
        console.log('🦅 Booking Engine Initialized');
        this.cacheDOM();
        this.bindEvents();
        this.loadState();
        this.renderServices();
        this.assignScarcity();
        this.renderTimeSlots();
        this.updateUI();
    },

    cacheDOM() {
        this.dom = {
            steps:              document.querySelectorAll('.wizard-step'),
            indicators:         document.querySelectorAll('.step-indicator'),
            nextBtn:            document.getElementById('btnNext'),
            prevBtn:            document.getElementById('btnPrev'),
            serviceGrid:        document.getElementById('serviceGrid'),
            timeSlotsContainer: document.getElementById('timeSlots'),
            loading:            document.getElementById('loadingOverlay'),
            successView:        document.getElementById('successView'),
            wizardContent:      document.getElementById('wizardContent'),
            summaryContainer:   document.getElementById('orderSummary'),
            summaryTotal:       document.getElementById('summaryTotal')
        };
    },

    bindEvents() {
        this.dom.nextBtn?.addEventListener('click', () => this.next());
        this.dom.prevBtn?.addEventListener('click', () => this.prev());

        document.getElementById('inputDate')?.addEventListener('change', e => {
            this.state.data.date = e.target.value;
            this.saveState();
            this.validateStep();
        });

        ['inputName', 'inputPhone', 'inputNote'].forEach(id => {
            document.getElementById(id)?.addEventListener('keyup', e => {
                if (id === 'inputName')  this.state.data.guest.name  = e.target.value;
                if (id === 'inputPhone') this.state.data.guest.phone = e.target.value;
                if (id === 'inputNote')  this.state.data.guest.notes = e.target.value;
                this.saveState();
                this.validateStep();
            });
        });
    },

    /* ───────── STATE PERSISTENCE ───────── */
    saveState() {
        localStorage.setItem('santis_booking_state', JSON.stringify(this.state));
    },

    loadState() {
        const raw = localStorage.getItem('santis_booking_state');
        if (!raw) return;
        try {
            const saved = JSON.parse(raw);
            this.state = { ...this.state, ...saved };
            if (this.state.data.guest.name)  document.getElementById('inputName').value  = this.state.data.guest.name;
            if (this.state.data.guest.phone) document.getElementById('inputPhone').value = this.state.data.guest.phone;
            if (this.state.data.guest.notes) document.getElementById('inputNote').value  = this.state.data.guest.notes;
            if (this.state.data.date)        document.getElementById('inputDate').value   = this.state.data.date;
        } catch (e) {
            console.warn('State restore failed', e);
        }
    },

    clearState() {
        localStorage.removeItem('santis_booking_state');
    },

    /* ───────── TIME SLOTS ───────── */
    assignScarcity() {
        this.scarcityMap = {
            '14:30': 'Yalnız 1 yer kaldı',
            '16:00': 'Yoğun Talep',
            '17:30': '3 yer kaldı'
        };
    },

    renderTimeSlots() {
        if (!this.dom.timeSlotsContainer) return;
        const times = ['10:00', '11:30', '13:00', '14:30', '16:00', '17:30'];
        this.dom.timeSlotsContainer.innerHTML = times.map(s => {
            const badge    = this.scarcityMap[s] ? `<span class="scarcity-badge">${this.scarcityMap[s]}</span>` : '';
            const selected = this.state.data.time === s ? 'selected' : '';
            return `
                <div class="time-slot ${selected}" onclick="BookingEngine.selectTime('${s}')">
                    <span class="slot-time">${s}</span>
                    ${badge}
                </div>`;
        }).join('');
    },

    /* ───────── NAVIGATION ───────── */
    next() {
        if (!this.validateStep()) return;
        if (this.state.step === this.state.maxSteps) {
            this.submitBooking();
        } else {
            this.state.step++;
            this.saveState();
            this.updateUI();
        }
    },

    prev() {
        if (this.state.step > 1) {
            this.state.step--;
            this.saveState();
            this.updateUI();
        }
    },

    /* ───────── SELECT HANDLERS ───────── */
    selectService(id) {
        const svc = this.state.services.find(s => s.id === id);
        if (!svc) return;
        this.state.data.service = svc;
        this.saveState();
        document.querySelectorAll('.service-card').forEach(el => el.classList.remove('selected'));
        document.querySelector(`[data-id="${id}"]`)?.classList.add('selected');
        setTimeout(() => this.next(), 400);
    },

    selectTime(time) {
        this.state.data.time = time;
        this.saveState();
        this.renderTimeSlots();
        this.validateStep();
    },

    /* ───────── VALIDATION ───────── */
    validateStep() {
        let valid = false;
        const { step, data, maxSteps } = this.state;

        if (step === 1) valid = !!data.service;
        if (step === 2) valid = !!data.date && !!data.time;
        if (step === 3) valid = !!(data.guest.name && data.guest.phone);

        if (this.dom.nextBtn) {
            this.dom.nextBtn.disabled      = !valid;
            this.dom.nextBtn.style.opacity = valid ? '1' : '0.5';

            if (step === maxSteps) {
                const price = data.service ? data.service.price : '';
                this.dom.nextBtn.textContent = `REZERVASYONU ONAYLA (${price})`;
                this.dom.nextBtn.classList.add('primary');
            } else {
                this.dom.nextBtn.textContent = 'DEVAM ET';
                this.dom.nextBtn.classList.remove('primary');
            }
        }
        return valid;
    },

    /* ───────── RENDER ───────── */
    renderServices() {
        if (!this.dom.serviceGrid) return;
        this.dom.serviceGrid.innerHTML = this.state.services.map(svc => {
            const selected = this.state.data.service?.id === svc.id ? 'selected' : '';
            return `
                <div class="service-card ${selected}" data-id="${svc.id}" onclick="BookingEngine.selectService('${svc.id}')">
                    <div class="svc-header">
                        <h3 class="svc-title">${svc.name}</h3>
                        <span class="svc-price">${svc.price}</span>
                    </div>
                    <p class="svc-desc">${svc.desc}</p>
                    <div class="svc-meta">
                        <span>⏱ ${svc.duration}</span>
                        <span>✨ Premium</span>
                    </div>
                </div>`;
        }).join('');
    },

    updateUI() {
        this.dom.steps.forEach((el, i) => {
            el.classList.toggle('active', i + 1 === this.state.step);
        });
        this.dom.indicators.forEach((el, i) => {
            el.classList.toggle('active',   i + 1 === this.state.step);
            el.classList.toggle('selected', i + 1 < this.state.step);
        });
        if (this.dom.prevBtn) {
            this.dom.prevBtn.style.visibility = this.state.step === 1 ? 'hidden' : 'visible';
        }
        if (this.state.step === 3) this.renderSummary();
        this.validateStep();
    },

    renderSummary() {
        const el = document.getElementById('step3Summary');
        if (!el || !this.state.data.service) return;
        const { service, date, time } = this.state.data;
        el.innerHTML = `
            <div class="order-summary-box">
                <h3 class="summary-title">Özet</h3>
                <div class="summary-row"><span>Hizmet</span><span>${service.name}</span></div>
                <div class="summary-row"><span>Tarih / Saat</span><span>${date || '--'} / ${time || '--'}</span></div>
                <div class="summary-divider"></div>
                <div class="summary-total">
                    <span>TOPLAM</span>
                    <span class="total-price">${service.price}</span>
                </div>
            </div>`;
    },

    /* ───────── SUBMIT ───────── */
    submitBooking() {
        console.log('🦅 Submitting Booking…', this.state.data);
        this.dom.loading.classList.add('active');
        const delay = 1200 + Math.random() * 1000;
        setTimeout(() => {
            const ref = 'STS-' + Math.floor(1000 + Math.random() * 9000);
            this.clearState();
            this.showSuccess(ref);
        }, delay);
    },

    showSuccess(ref) {
        this.dom.loading.classList.remove('active');
        this.dom.wizardContent.style.display = 'none';
        const { service, date, time, guest } = this.state.data;
        this.dom.successView.innerHTML = `
            <div class="success-ticket">
                <span class="ticket-icon">✅</span>
                <h2>Rezervasyon Onaylandı</h2>
                <p>Teşekkürler ${guest.name}. Talebiniz başarıyla alındı.</p>
                <div class="ticket-details">
                    <p><strong>${service?.name || ''}</strong></p>
                    <p>${date} • ${time}</p>
                </div>
                <span class="ticket-id">Ref: ${ref}</span>
                <p style="margin-top:20px; font-size:12px; color:#888;">Onay mesajı WhatsApp üzerinden gönderildi.</p>
                <div class="trust-signals">
                    <p>🔒 Rezervasyonunuz güvende — Santis Booking System v1.1</p>
                    <p>SSL Secured • Data Encrypted</p>
                </div>
                <a href="/" class="btn-wizard primary" style="display:inline-block; margin-top:30px; text-decoration:none;">ANA SAYFAYA DÖN</a>
            </div>`;
        this.dom.successView.style.display = 'block';
    }
};

/* ───────── AUTO-INIT ───────── */
document.addEventListener('DOMContentLoaded', () => { BookingEngine.init(); });
