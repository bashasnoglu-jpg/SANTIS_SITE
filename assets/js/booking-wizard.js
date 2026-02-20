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
            { slug: 'signature-rituel', name: 'Signature Ritüel', desc: 'Santis İmzalı Bütüncül Terapi (75dk)', url: 'tr/masajlar/signature-rituel.html' },
            { slug: 'hammam-ottoman', name: 'Osmanlı Hamam Geleneği', desc: 'Sıcak taş ve köpük ile tam arınma', url: 'tr/hamam/osmanli-hamam-gelenegi.html' },
            { slug: 'hammam-peeling', name: 'Peeling + Köpük', desc: 'Hızlı ve etkili yenilenme', url: 'tr/hamam/kese-kopuk.html' },
            { slug: 'massage-deep', name: 'Derin Doku (Spor) Masajı', desc: 'Kas gerginliği ve laktik asit atılımı', url: 'tr/masajlar/spor-masaji.html' }
        ],

        'stressed': [
            { slug: 'signature-rituel', name: 'Signature Ritüel', desc: 'Santis İmzalı Bütüncül Terapi (75dk)', url: 'tr/masajlar/signature-rituel.html' },
            { slug: 'massage-foam', name: 'Köpük Masajı', desc: 'Nazik ve rahatlatıcı', url: 'tr/hamam/kopuk-masaji.html' },
            { slug: 'massage-aroma', name: 'Aromaterapi Masajı', desc: 'Kokularla zihinsel dinginlik', url: 'tr/masajlar/aromaterapi.html' },
            { slug: 'massage-head', name: 'Hint Baş Masajı', desc: 'Zihni boşaltmak için', url: 'tr/masajlar/bas-boyun-omuz.html' },
            { slug: 'facial-sensitive', name: 'Sothys Hassas Bakım', desc: 'Cildi yatıştırır', url: 'tr/cilt-bakimi/sensitive-soothe.html' }
        ],

        'drained': [
            { slug: 'hammam-coffee', name: 'Kahve Peeling', desc: 'Canlandırıcı etki', url: 'tr/hamam/kahve-detox.html' },
            { slug: 'massage-detox', name: 'Detox Masajı', desc: 'Toksin atımı ve enerji', url: 'tr/masajlar/lenf-drenaj.html' },
            { slug: 'sothys-glow', name: 'Sothys Glow & Detox', desc: 'Cilde ışıltı verir', url: 'tr/cilt-bakimi/vitamin-c-glow.html' }
        ],

        'sensitive': [
            { slug: 'facial-calm', name: 'Sothys Yatıştırıcı Bakım', desc: 'Kızarıklık karşıtı', url: 'tr/cilt-bakimi/sensitive-soothe.html' },
            { slug: 'massage-soft', name: 'Relax Masajı', desc: 'Yumuşak dokunuşlar', url: 'tr/masajlar/klasik-rahatlama.html' }
        ],

        'care': [
            { slug: 'sothys-hydra', name: 'Sothys Hydra 4Ha', desc: 'Yoğun nem desteği', url: 'tr/cilt-bakimi/hyaluron-hydrate.html' },
            { slug: 'sothys-antiage', name: 'Sothys Gençlik Bakımı', desc: 'Premium anti-aging', url: 'tr/cilt-bakimi/anti-aging-pro.html' }
        ]

    },



    // Helper for path resolution (Matches santis-nav.js logic)
    _getPath(file) {
        if (window.SITE_ROOT) return (window.SITE_ROOT + file).replace(/\/\//g, '/');
        const depth = window.location.pathname.split('/').length - 2;
        const prefix = depth > 0 ? "../".repeat(depth) : "";
        return prefix + file;
    },

    init() {
        // Bind to global triggers
        document.querySelectorAll('.btn-book-wizard').forEach(btn => {
            btn.addEventListener('click', () => this.open());
        });

        // 🧠 Phase 16: Auto-Inject HTML if missing
        if (!document.getElementById('wizardModal')) {
            console.log("🕯️ [Ritual Wizard] Injecting Temple Architecture...");

            // DYNAMIC PATH FIX
            const wizardPath = this._getPath('components/booking-wizard.html');

            fetch(wizardPath)
                .then(r => {
                    if (!r.ok) throw new Error(`HTTP ${r.status}`);
                    return r.text();
                })
                .then(html => {
                    // Fix relative paths inside the injected HTML (e.g. images)
                    const depth = window.location.pathname.split('/').length - 2;
                    const prefix = depth > 0 ? "../".repeat(depth) : "";
                    const fixedHtml = html.replace(/src="\//g, `src="${prefix}`).replace(/href="\//g, `href="${prefix}`);

                    document.body.insertAdjacentHTML('beforeend', fixedHtml);
                })
                .catch(e => console.error("Wizard Load Fail", e));
        }
    },



    open(serviceName = null) {

        const modal = document.getElementById('wizardModal') || document.getElementById('bookingModal');
        // Auto-init if not exists (Phase 16 recovery)
        if (!modal) {
            this.init();
            // Wait for injection
            setTimeout(() => this.open(serviceName), 500);
            return;
        }

        // 1. Get current mood from Core
        this.selections.mood = window.SANTIS_CORE?.state?.currentMood || 'fatigued';

        // 2. Reset or Preset
        if (serviceName) {
            this.selections.service = serviceName;
            this.currentStep = 2; // Skip to time
        } else {
            this.currentStep = 1;
        }

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



        // Helper to format URLs safely
        const getUrl = (u) => {
            // If it's a new static page (tr/...) or old dynamic page, ensure path is correct globally
            return this._getPath(u);
        };

        recs.forEach(item => {
            html += `
                <label class="wizard-option">
                    <input type="radio" name="wiz-service" value="${item.slug}" onchange="BOOKING_WIZARD.selectService('${item.name}')">
                    <div class="wiz-card">
                        <span class="wiz-icon">💎</span>
                        <div class="wiz-info">
                            <h4>${item.name}</h4>
                            <p>${item.desc}</p>
                            <a href="${getUrl(item.url)}" class="wiz-link" target="_blank" onclick="event.stopPropagation()">Detay</a>
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

window.BOOKING_WIZARD = BOOKING_WIZARD;
