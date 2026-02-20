/**

 * SANTIS CONCIERGE WIZARD v1.1

 * Smart Booking Flow based on User Mood

 * Refined with Specific Service Mappings

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

    // MOOD -> SERVICE MAPPING (From Workbench)
    // Keys match santis-core.js mood IDs
    recommendations: {
        'fatigued': [

            { slug: 'hammam-ottoman', name: 'Osmanlı Hamam Geleneği', desc: 'Sıcak taş ve köpük ile tam arınma', url: 'service-detail.html?slug=osmanli-ritueli' },

            { slug: 'hammam-peeling', name: 'Peeling + Köpük', desc: 'Hızlı ve etkili yenilenme', url: 'service-detail.html?slug=kese-kopuk' },

            { slug: 'massage-deep', name: 'Derin Doku Masajı', desc: 'Kas gerginliği için', url: 'service-detail.html?slug=derin-doku' }

        ],

        'stressed': [

            { slug: 'massage-foam', name: 'Köpük Masajı', desc: 'Nazik ve rahatlatıcı', url: 'service-detail.html?slug=kopuk-masaji' },

            { slug: 'massage-aroma', name: 'Aromaterapi Masajı', desc: 'Kokularla zihinsel dinginlik', url: 'service-detail.html?slug=aromaterapi' },

            { slug: 'massage-head', name: 'Hint Baş Masajı', desc: 'Zihni boşaltmak için', url: 'service-detail.html?slug=bas-boyun-omuz' },

            { slug: 'facial-sensitive', name: 'Sothys Hassas Bakım', desc: 'Cildi yatıştırır', url: 'service-detail.html?slug=sensitive-soothe' }

        ],

        'drained': [

            { slug: 'hammam-coffee', name: 'Kahve Peeling', desc: 'Canlandırıcı etki', url: 'service-detail.html?slug=kahve-detox' },

            { slug: 'massage-detox', name: 'Detox Masajı', desc: 'Toksin atımı ve enerji', url: 'service-detail.html?slug=lenf-drenaj' },

            { slug: 'sothys-glow', name: 'Sothys Glow & Detox', desc: 'Cilde ışıltı verir', url: 'service-detail.html?slug=vitamin-c-glow' }

        ],

        'sensitive': [

            { slug: 'facial-calm', name: 'Sothys Yatıştırıcı Bakım', desc: 'Kızarıklık karşıtı', url: 'service-detail.html?slug=sensitive-soothe' },

            { slug: 'massage-soft', name: 'Relax Masajı', desc: 'Yumuşak dokunuşlar', url: 'service-detail.html?slug=klasik-rahatlama' }

        ],

        'care': [

            { slug: 'sothys-hydra', name: 'Sothys Hydra 4Ha', desc: 'Yoğun nem desteği', url: 'service-detail.html?slug=hyaluron-hydrate' },

            { slug: 'sothys-antiage', name: 'Sothys Gençlik Bakımı', desc: 'Premium anti-aging', url: 'service-detail.html?slug=anti-aging-pro' }

        ]

    },



    init() {
        // Bind to global triggers
        document.querySelectorAll('.btn-book-wizard').forEach(btn => {
            btn.addEventListener('click', () => this.open());
        });

        // 🧠 Phase 16: Auto-Inject HTML if missing
        if (!document.getElementById('wizardModal')) {
            console.log("🕯️ [Ritual Wizard] Injecting Temple Architecture...");
            fetch('/components/booking-wizard.html')
                .then(r => r.text())
                .then(html => {
                    document.body.insertAdjacentHTML('beforeend', html);
                })
                .catch(e => console.error("Wizard Load Fail", e));
        }
    },



    open() {

        const modal = document.getElementById('wizardModal') || document.getElementById('bookingModal');

        if (!modal) return;



        // 1. Get current mood from Core

        this.selections.mood = window.SANTIS_CORE?.state?.currentMood || 'fatigued'; // Default to fatigued



        // 2. Reset Step

        this.currentStep = 1;

        this.renderStep();



        // 3. Show Modal

        modal.classList.add('active');

        document.body.style.overflow = 'hidden';

    },



    close() {

        const modal = document.getElementById('wizardModal') || document.getElementById('bookingModal');

        if (modal) modal.classList.remove('active');

        document.body.style.overflow = '';

    },



    next() {

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

        const recs = this.recommendations[mood] || this.recommendations['fatigued'];



        let html = '';



        recs.forEach(item => {
            html += `
                <label class="wizard-option">
                    <input type="radio" name="wiz-service" value="${item.slug}" onchange="BOOKING_WIZARD.selectService('${item.name}')">
                    <div class="wiz-card">
                        <span class="wiz-icon">💎</span>
                        <div class="wiz-info">
                            <h4>${item.name}</h4>
                            <p>${item.desc}</p>
                            <a href="${item.url}" class="wiz-link" target="_blank" onclick="event.stopPropagation()">Detay</a>
                        </div>
                        <span class="wiz-check">✔</span>
                    </div>
                </label>
            `;
        });

        container.innerHTML = html;
    },

    selectService(name) {
        this.selections.service = name;
        setTimeout(() => this.next(), 300);
    },

    finish() {
        const nameInput = document.getElementById('wizName');
        this.selections.name = nameInput ? nameInput.value : '';

        // Generate WhatsApp
        const phone = "905348350169";
        const serviceName = this.selections.service || 'Belirtilmedi';

        const msg = `🌿 *Santis Club — Sessizliğe Adım*\n\n` +
            `Ben *${this.selections.name}*.\n` +
            `Yeriniz hazır.\n` +
            `Şimdi tek yapmanız gereken gelmek… ve hiçbir şey yapmamak.\n\n` +
            `Seçilen Ritüel: *[${serviceName.toUpperCase()}]*\n` +
            `Müsaitlik durumunu teyit edebilir misiniz?`;

        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
        this.close();
    }
};
