/**
 * SANTIS CONCIERGE WIZARD v1.0
 * Smart Booking Flow based on User Mood
 */

const BOOKING_WIZARD = {
    currentStep: 1,
    selections: {
        mood: null,
        service: null,
        date: null,
        time: null,
        name: null
    },

    // MOOD -> SERVICE MAPPING
    recommendations: {
        'relax': ['classic-massage', 'aromatherapy', 'deep-tissue'],
        'detox': ['hammam-classic', 'coffee-peeling', 'lymph-drainage'],
        'glow': ['sothys-hydra', 'sothys-detox-energy', 'face-massage']
    },

    init() {
        // Bind to global triggers
        document.querySelectorAll('.btn-book-wizard').forEach(btn => {
            btn.addEventListener('click', () => this.open());
        });
    },

    open() {
        const modal = document.getElementById('wizardModal');
        if (!modal) return;

        // 1. Get current mood from Core
        this.selections.mood = window.SANTIS_CORE?.state?.currentMood || 'relax';

        // 2. Reset Step
        this.currentStep = 1;
        this.renderStep();

        // 3. Show Modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    close() {
        const modal = document.getElementById('wizardModal');
        if (modal) modal.classList.remove('active');
        document.body.style.overflow = '';
    },

    next() {
        // Validation logic can go here
        this.currentStep++;
        this.renderStep();
    },

    prev() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.renderStep();
        }
    },

    renderStep() {
        // Hide all steps
        document.querySelectorAll('.wizard-step').forEach(el => el.style.display = 'none');

        // Show current
        const stepEl = document.getElementById(`step-${this.currentStep}`);
        if (stepEl) stepEl.style.display = 'block';

        // Update Progress
        this.updateProgress();

        // Dynamic Content Logic
        if (this.currentStep === 1) this.renderServiceOptions();
    },

    updateProgress() {
        const steps = 3;
        const percent = ((this.currentStep - 1) / (steps - 1)) * 100;
        document.getElementById('wizardProgress').style.width = `${percent}%`;
    },

    renderServiceOptions() {
        const container = document.getElementById('wizardServices');
        if (!container) return;

        // Filter services based on Mood
        const mood = this.selections.mood;
        const recs = this.recommendations[mood] || [];

        // Normally we'd fetch from DB, here pseudo-code for demo
        // Ideally we read from window.servicesDB
        let html = '';

        recs.forEach(slug => {
            // Find service details from DB lookup (Mock for now)
            const name = slug.replace(/-/g, ' ').toUpperCase();
            html += `
                <label class="wizard-option">
                    <input type="radio" name="wiz-service" value="${slug}" onchange="BOOKING_WIZARD.selectService('${name}')">
                    <div class="wiz-card">
                        <span class="wiz-icon">💆</span>
                        <div class="wiz-info">
                            <h4>${name}</h4>
                            <p>Önerilen Bakım</p>
                        </div>
                        <span class="wiz-check">✔</span>
                    </div>
                </label>
            `;
        });

        container.innerHTML = html;

        // Add "See All" option
        container.innerHTML += `
             <label class="wizard-option">
                    <input type="radio" name="wiz-service" value="other" onchange="BOOKING_WIZARD.selectService('Diğer / Kararsızım')">
                    <div class="wiz-card">
                        <span class="wiz-icon">📋</span>
                        <div class="wiz-info">
                            <h4>Diğer Hizmetler</h4>
                            <p>Menüden seçmek istiyorum</p>
                        </div>
                    </div>
                </label>
        `;
    },

    selectService(name) {
        this.selections.service = name;
        // Auto advance after selection
        setTimeout(() => this.next(), 300);
    },

    finish() {
        // Collect Data
        this.selections.name = document.getElementById('wizName').value;
        this.selections.date = document.getElementById('wizDate').value;
        this.selections.time = document.getElementById('wizTime').value;

        if (!this.selections.name) return alert("Lütfen adınızı giriniz.");

        // Generate WhatsApp
        const phone = "905348350169";
        const msg = `Merhaba, Santis Club Concierge. \n\n` +
            `Ben *${this.selections.name}*. \n` +
            `Modum: *${this.selections.mood.toUpperCase()}*\n` +
            `Tercihim: *${this.selections.service}*\n` +
            `Tarih: ${this.selections.date || 'Bugün'} - ${this.selections.time || 'Müsaitlik soruyorum'}\n\n` +
            `Rezervasyon için yardımcı olur musunuz?`;

        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
        this.close();
    }
};
