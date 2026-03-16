/**
 * SANTIS BOOKING ENGINE v2.0 (Demo Core)
 * ──────────────────────────────────────
 * Enterprise-grade wizard state machine.
 * Simulates real-time availability and booking creation.
 */

const BookingEngine = {
    // STATE
    state: {
        step: 1,
        maxSteps: 3, // 4 is Success
        data: {
            service: null, // {id, name, price, duration}
            date: null,
            time: null,
            guest: {
                name: '',
                phone: '',
                notes: ''
            }
        },
        services: [
            { id: 'ritual_sig', name: 'Santis Signature Ritüel', price: '140€', duration: '90 dk', desc: 'Bütüncül arınma ve yenilenme terapisi.' },
            { id: 'massage_deep', name: 'Derin Doku Masajı', price: '90€', duration: '50 dk', desc: 'Kas gerginliği ve spor sonrası toparlanma.' },
            { id: 'hammam_otto', name: 'Osmanlı Hamam Sefası', price: '75€', duration: '45 dk', desc: 'Geleneksel kese ve köpük ritüeli.' },
            { id: 'facial_glow', name: 'Sothys Glow Bakım', price: '110€', duration: '60 dk', desc: 'Cilde ışıltı ve canlılık kazandırır.' }
        ]
    },

    // INIT
    init() {
        console.log("🦅 Booking Engine Initialized");
        this.cacheDOM();
        this.bindEvents();

        // Load State if exists (Refresh Protection)
        this.loadState();

        this.renderServices();

        // Random Scarcity for Demo
        this.assignScarcity();
        this.renderTimeSlots();

        this.updateUI();
    },

    cacheDOM() {
        this.dom = {
            steps: document.querySelectorAll('.wizard-step'),
            indicators: document.querySelectorAll('.step-indicator'),
            nextBtn: document.getElementById('btnNext'),
            prevBtn: document.getElementById('btnPrev'),
            serviceGrid: document.getElementById('serviceGrid'),
            timeSlotsContainer: document.getElementById('timeSlots'), // Renamed for clarity in render
            loading: document.getElementById('loadingOverlay'),
            successView: document.getElementById('successView'),
            wizardContent: document.getElementById('wizardContent'),
            // New Summary Elements
            summaryContainer: document.getElementById('orderSummary'),
            summaryTotal: document.getElementById('summaryTotal')
        };
    },

    bindEvents() {
        this.dom.nextBtn?.addEventListener('click', () => this.next());
        this.dom.prevBtn?.addEventListener('click', () => this.prev());

        // Date Input Change
        document.getElementById('inputDate')?.addEventListener('change', (e) => {
            this.state.data.date = e.target.value;
            this.saveState();
            this.validateStep();
        });

        // Inputs persistence
        ['inputName', 'inputPhone', 'inputNote'].forEach(id => {
            document.getElementById(id)?.addEventListener('keyup', (e) => {
                if (id === 'inputName') this.state.data.guest.name = e.target.value;
                if (id === 'inputPhone') this.state.data.guest.phone = e.target.value;
                if (id === 'inputNote') this.state.data.guest.notes = e.target.value;
                this.saveState();
                this.validateStep();
            });
        });
    },

    // PERSISTENCE
    saveState() {
        localStorage.setItem('santis_booking_state', JSON.stringify(this.state));
    },

    loadState() {
        const saved = localStorage.getItem('santis_booking_state');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Merge carefully or just restore
                this.state = { ...this.state, ...parsed };

                // Restore Inputs
                if (this.state.data.guest.name) document.getElementById('inputName').value = this.state.data.guest.name;
                if (this.state.data.guest.phone) document.getElementById('inputPhone').value = this.state.data.guest.phone;
                if (this.state.data.guest.notes) document.getElementById('inputNote').value = this.state.data.guest.notes;
                if (this.state.data.date) document.getElementById('inputDate').value = this.state.data.date;

            } catch (e) {
                console.warn("State restore failed", e);
            }
        }
    },

    clearState() {
        localStorage.removeItem('santis_booking_state');
    },

    // SCARCITY LOGIC
    assignScarcity() {
        this.scarcityMap = {
            '14:30': 'Only 1 slot left',
            '16:00': 'High Demand',
            '17:30': '3 slots left'
        };
    },

    renderTimeSlots() {
        if (!this.dom.timeSlotsContainer) return;
        const slots = ['10:00', '11:30', '13:00', '14:30', '16:00', '17:30'];

        const html = slots.map(time => {
            const scarcityBadge = this.scarcityMap[time]
                ? `<span class="scarcity-badge">${this.scarcityMap[time]}</span>`
                : '';

            const isSelected = this.state.data.time === time ? 'selected' : '';

            return `
                <div class="time-slot ${isSelected}" onclick="BookingEngine.selectTime('${time}')">
                    <span class="slot-time">${time}</span>
                    ${scarcityBadge}
                </div>
            `;
        }).join('');

        this.dom.timeSlotsContainer.innerHTML = html;
    },

    // LOGIC
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

    selectService(serviceId) {
        const svc = this.state.services.find(s => s.id === serviceId);
        if (svc) {
            this.state.data.service = svc;
            this.saveState();

            // Visual Feedback
            document.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'));
            document.querySelector(`[data-id="${serviceId}"]`).classList.add('selected');

            // Auto advance
            setTimeout(() => this.next(), 400);
        }
    },

    selectTime(slot) {
        this.state.data.time = slot;
        this.saveState();

        document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
        // Re-render to keep badges or just toggle class
        // Simple toggle for now, but better to re-render if complex
        this.renderTimeSlots();

        this.validateStep();
    },

    validateStep() {
        let valid = false;
        const s = this.state;

        if (s.step === 1) valid = !!s.data.service;
        if (s.step === 2) valid = !!s.data.date && !!s.data.time;
        if (s.step === 3) {
            // Inputs are already bound in state via keyup
            if (s.data.guest.name && s.data.guest.phone) valid = true;
        }

        // Update Button State
        if (this.dom.nextBtn) {
            this.dom.nextBtn.disabled = !valid;
            this.dom.nextBtn.style.opacity = valid ? '1' : '0.5';

            // Change text on last step
            if (s.step === s.maxSteps) {
                // Show Total in Button
                const price = s.data.service ? s.data.service.price : '';
                this.dom.nextBtn.textContent = `REZERVASYONU ONAYLA (${price})`;
                this.dom.nextBtn.classList.add('primary');
            } else {
                this.dom.nextBtn.textContent = 'DEVAM ET';
                this.dom.nextBtn.classList.remove('primary');
            }
        }

        return valid;
    },

    // RENDERERS
    renderServices() {
        if (!this.dom.serviceGrid) return;

        const html = this.state.services.map(svc => {
            const isSelected = (this.state.data.service && this.state.data.service.id === svc.id) ? 'selected' : '';
            return `
            <div class="service-card ${isSelected}" data-id="${svc.id}" onclick="BookingEngine.selectService('${svc.id}')">
                <div class="svc-header">
                    <h3 class="svc-title">${svc.name}</h3>
                    <span class="svc-price">${svc.price}</span>
                </div>
                <p class="svc-desc">${svc.desc}</p>
                <div class="svc-meta">
                    <span>⏱ ${svc.duration}</span>
                    <span>✨ Premium</span>
                </div>
            </div>
        `}).join('');

        this.dom.serviceGrid.innerHTML = html;
    },

    updateUI() {
        // Steps Visibility
        this.dom.steps.forEach((step, index) => {
            if (index + 1 === this.state.step) step.classList.add('active');
            else step.classList.remove('active');
        });

        // Indicators
        this.dom.indicators.forEach((ind, index) => {
            if (index + 1 === this.state.step) ind.classList.add('active');
            else ind.classList.remove('selected');
        });

        // Buttons
        this.dom.prevBtn.style.visibility = this.state.step === 1 ? 'hidden' : 'visible';

        // Update Summary if Step 3
        if (this.state.step === 3) {
            this.renderSummary();
        }

        this.validateStep();
    },

    renderSummary() {
        const summaryEl = document.getElementById('step3Summary');
        if (!summaryEl || !this.state.data.service) return;

        const s = this.state.data;
        summaryEl.innerHTML = `
            <div class="order-summary-box">
                <h3 class="summary-title">Özet</h3>
                <div class="summary-row">
                    <span>Hizmet</span>
                    <span>${s.service.name}</span>
                </div>
                <div class="summary-row">
                    <span>Tarih / Saat</span>
                    <span>${s.date || '--'} / ${s.time || '--'}</span>
                </div>
                <div class="summary-divider"></div>
                <div class="summary-total">
                    <span>TOPLAM</span>
                    <span class="total-price">${s.service.price}</span>
                </div>
            </div>
        `;
    },

    // MOCK BACKEND
    submitBooking() {
        console.log("🦅 Submitting Booking...", this.state.data);

        this.dom.loading.classList.add('active');

        // Natural Loading Delay (1.2s - 2.2s)
        const delay = 1200 + Math.random() * 1000;

        setTimeout(() => {
            const bookingId = 'STS-' + Math.floor(1000 + Math.random() * 9000);
            this.clearState(); // Clear persistence on success
            this.showSuccess(bookingId);
        }, delay);
    },

    showSuccess(id) {
        this.dom.loading.classList.remove('active');
        this.dom.wizardContent.style.display = 'none';

        // DOM manipulations for success
        const successHtml = `
            <div class="success-ticket">
                <span class="ticket-icon">✅</span>
                <h2>Rezervasyon Onaylandı</h2>
                <p>Teşekkürler ${this.state.data.guest.name}. Talebiniz başarıyla alındı.</p>
                <div class="ticket-details">
                    <p><strong>${this.state.data.service.name}</strong></p>
                    <p>${this.state.data.date} • ${this.state.data.time}</p>
                </div>
                <span class="ticket-id">Ref: ${id}</span>
                <p style="margin-top:20px; font-size:12px; color:#888;">Onay mesajı WhatsApp üzerinden gönderildi.</p>
                
                <div class="trust-signals">
                    <p>🔒 Your reservation is secured under Santis Booking System v1.0</p>
                    <p>SSL Secured • Data Encrypted</p>
                </div>

                <a href="/" class="btn-wizard primary" style="display:inline-block; margin-top:30px; text-decoration:none;">ANA SAYFAYA DÖN</a>
            </div>
        `;

        this.dom.successView.innerHTML = successHtml;
        this.dom.successView.style.display = 'block';
    }
};

// Auto-Init
document.addEventListener('DOMContentLoaded', () => {
    BookingEngine.init();
});
