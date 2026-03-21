/* ═══════════════════════════════════════════════════════════════════════════

   SANTIS CLUB — LUXURY CARD INTERACTIONS v2.0

   Features: Scroll Reveal, Parallax Tilt, Stagger Animation, Chip Filters

   ═══════════════════════════════════════════════════════════════════════════ */



(function () {

    'use strict';



    // ─────────────────────────────────────────────────────────────────────────

    // CONFIGURATION

    // ─────────────────────────────────────────────────────────────────────────

    const CONFIG = {

        animation: {

            staggerDelay: 100,      // ms between each card

            duration: 600,          // ms animation duration

            threshold: 0.15,        // Intersection threshold

            rootMargin: '0px 0px -50px 0px'

        },

        tilt: {

            max: 8,                 // Max tilt degrees

            perspective: 1000,      // Perspective px

            scale: 1.02,            // Hover scale

            speed: 400,             // Transition speed ms

            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'

        }

    };



    // ─────────────────────────────────────────────────────────────────────────

    // SCROLL REVEAL (Intersection Observer)

    // ─────────────────────────────────────────────────────────────────────────

    function initScrollReveal() {

        const cards = document.querySelectorAll('.luxury-card[data-animate="entry"]');

        if (!cards.length) return;



        const observer = new IntersectionObserver((entries) => {

            entries.forEach((entry, index) => {

                if (entry.isIntersecting) {

                    const delay = index * CONFIG.animation.staggerDelay;



                    setTimeout(() => {

                        entry.target.classList.add('is-visible');

                    }, delay);



                    observer.unobserve(entry.target);

                }

            });

        }, {

            threshold: CONFIG.animation.threshold,

            rootMargin: CONFIG.animation.rootMargin

        });



        cards.forEach(card => observer.observe(card));

    }



    // ─────────────────────────────────────────────────────────────────────────

    // PARALLAX TILT (Mouse Movement)

    // ─────────────────────────────────────────────────────────────────────────

    function initParallaxTilt() {

        const cards = document.querySelectorAll('.luxury-card[data-tilt]');

        if (!cards.length) return;



        cards.forEach(card => {

            card.addEventListener('mousemove', (e) => handleTilt(e, card));

            card.addEventListener('mouseleave', (e) => resetTilt(e, card));

            card.addEventListener('mouseenter', (e) => handleEnter(e, card));

        });

    }



    function handleTilt(e, card) {

        const rect = card.getBoundingClientRect();

        const centerX = rect.left + rect.width / 2;

        const centerY = rect.top + rect.height / 2;



        const mouseX = e.clientX - centerX;

        const mouseY = e.clientY - centerY;



        const rotateX = (mouseY / (rect.height / 2)) * -CONFIG.tilt.max;

        const rotateY = (mouseX / (rect.width / 2)) * CONFIG.tilt.max;



        card.style.transform = `

            perspective(${CONFIG.tilt.perspective}px)

            rotateX(${rotateX}deg)

            rotateY(${rotateY}deg)

            scale(${CONFIG.tilt.scale})

        `;



        // Subtle glow following cursor

        const glowX = ((mouseX / rect.width) * 100) + 50;

        const glowY = ((mouseY / rect.height) * 100) + 50;

        card.style.setProperty('--glow-x', `${glowX}%`);

        card.style.setProperty('--glow-y', `${glowY}%`);

    }



    function handleEnter(e, card) {

        card.style.transition = `transform ${CONFIG.tilt.speed}ms ${CONFIG.tilt.easing}`;

    }



    function resetTilt(e, card) {

        card.style.transition = `transform ${CONFIG.tilt.speed}ms ${CONFIG.tilt.easing}`;

        card.style.transform = '';

        card.style.removeProperty('--glow-x');

        card.style.removeProperty('--glow-y');

    }



    // ─────────────────────────────────────────────────────────────────────────

    // CHIP FILTERS

    // ─────────────────────────────────────────────────────────────────────────

    function initChipFilters() {

        const filterContainer = document.querySelector('.chip-filters');

        const cards = document.querySelectorAll('.luxury-card[data-category]');



        if (!filterContainer || !cards.length) return;



        filterContainer.addEventListener('click', (e) => {

            const chip = e.target.closest('.chip-filter');

            if (!chip) return;



            // Update active state

            filterContainer.querySelectorAll('.chip-filter').forEach(c => {

                c.classList.remove('is-active');

            });

            chip.classList.add('is-active');



            // Filter cards

            const filterKey = chip.dataset.filter;

            filterCards(cards, filterKey);

        });

    }



    function filterCards(cards, filterKey) {

        cards.forEach((card, index) => {

            const shouldShow = filterKey === 'all' ||

                card.dataset.category === filterKey ||

                (card.dataset.tags && card.dataset.tags.includes(filterKey));



            if (shouldShow) {

                card.style.display = '';

                card.style.animation = `fadeInUp 0.5s ${index * 0.05}s both`;

            } else {

                card.style.animation = 'fadeOutDown 0.3s forwards';

                setTimeout(() => {

                    card.style.display = 'none';

                }, 300);

            }

        });

    }



    // ─────────────────────────────────────────────────────────────────────────

    // FAVORITE BUTTON

    // ─────────────────────────────────────────────────────────────────────────

    function initFavoriteButtons() {

        document.addEventListener('click', (e) => {

            const btn = e.target.closest('.card__action');

            if (!btn) return;



            e.preventDefault();

            e.stopPropagation();



            btn.classList.toggle('is-active');



            // Optional: Save to localStorage

            const cardId = btn.closest('.luxury-card').dataset.id;

            if (cardId) {

                const favorites = JSON.parse(localStorage.getItem('santis_favorites') || '[]');

                const index = favorites.indexOf(cardId);



                if (index > -1) {

                    favorites.splice(index, 1);

                } else {

                    favorites.push(cardId);

                }



                localStorage.setItem('santis_favorites', JSON.stringify(favorites));

            }



            // Haptic feedback animation

            btn.style.transform = 'scale(1.3)';

            setTimeout(() => {

                btn.style.transform = '';

            }, 150);

        });

    }



    // ─────────────────────────────────────────────────────────────────────────

    // CARD RENDERER (Dynamic Card Generation)

    // ─────────────────────────────────────────────────────────────────────────

    window.LuxuryCardRenderer = {

        /**

         * Render a single luxury card

         * @param {Object} data - Card data

         * @param {Object} options - Render options

         * @returns {HTMLElement}

         */

        renderCard(data, options = {}) {

            const {

                variant = 'default',  // 'default', 'editorial', 'split', 'compact'

                size = 'md',          // 'xl', 'lg', 'md', 'sm'

                animate = true,

                tilt = false

            } = options;



            const card = document.createElement('article');

            card.className = `luxury-card luxury-card--${variant} card--${size}`;

            card.dataset.id = data.id;

            card.dataset.category = data.category || '';

            card.dataset.tags = (data.tags || []).join(',');



            if (animate) card.dataset.animate = 'entry';

            if (tilt) card.dataset.tilt = 'true';



            // Get tier info

            const tierInfo = window.SANTIS_MASSAGE_TIERS?.[data.tier] || {};



            card.innerHTML = `

                <!-- Image -->

                <div class="card__image-wrapper">

                    <img 

                        class="card__image" 

                        src="${data.img || '/assets/img/luxury-placeholder.webp'}" 

                        alt="${data.title}"

                        loading="lazy"

                        decoding="async"

                    >

                    <div class="card__overlay"></div>

                </div>



                <!-- Badge -->

                ${this.renderBadge(data, tierInfo)}



                <!-- Favorite Button -->

                <button class="card__action" aria-label="Koleksiyona ekle">

                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">

                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>

                    </svg>

                </button>



                <!-- Content -->

                <div class="card__content">

                    <h3 class="card__title" style="line-height: 1.25; margin-bottom: 0.5rem;">${data.title}</h3>

                    <p class="card__description" style="opacity: 0.8;">${data.desc || ''}</p>

                    

                    <!-- Meta Pills -->

                    <div class="card__meta">

                        ${data.duration ? `

                            <span class="card__pill">

                                <span class="card__pill-icon">⏱</span>

                                ${data.duration}

                            </span>

                        ` : ''}

                        ${data.price ? `

                            <span class="card__pill card__pill--price">

                                ${data.price}€

                            </span>

                        ` : ''}

                    </div>



                    <!-- CTA -->

                    <a href="${window.SantisRouter ? SantisRouter.localize('/masaj.html' + (data.slug || data.id) + '/') : '/masaj.html' + (data.slug || data.id) + '/'}" class="card__cta">

                        <span>Keşfet</span>

                        <span class="card__cta-arrow">→</span>

                    </a>

                </div>

            `;



            return card;

        },



        /**

         * Render badge based on data

         */

        renderBadge(data, tierInfo) {

            if (data.tier === 'SIGNATURE') {

                return `<span class="card__badge card__badge--signature">👑 İmza</span>`;

            }

            if (data.isPopular) {

                return `<span class="card__badge card__badge--popular">⭐ En Popüler</span>`;

            }

            if (data.isNew) {

                return `<span class="card__badge card__badge--new">🆕 Yeni</span>`;

            }

            if (tierInfo.label) {

                return `<span class="card__badge card__badge--tier" style="background: ${tierInfo.bg}; color: ${tierInfo.color}">${tierInfo.label}</span>`;

            }

            return '';

        },



        /**

         * Render grid of cards

         */

        renderGrid(container, items, options = {}) {

            const { layout = 'default' } = options;



            container.classList.add('luxury-grid');

            if (layout === 'bento') container.classList.add('luxury-grid--bento');



            container.innerHTML = '';



            items.forEach((item, index) => {

                // Determine card size

                let size = 'md';

                if (index === 0 && layout === 'bento') size = 'xl';

                else if (index < 3 && layout === 'bento') size = 'lg';



                const card = this.renderCard(item, { ...options, size });

                container.appendChild(card);

            });



            // Re-init animations

            initScrollReveal();

            if (options.tilt) initParallaxTilt();

        }

    };



    // ─────────────────────────────────────────────────────────────────────────

    // KEYFRAME ANIMATIONS (Inject)

    // ─────────────────────────────────────────────────────────────────────────

    function injectAnimations() {

        if (document.getElementById('luxury-card-animations')) return;



        const style = document.createElement('style');

        style.id = 'luxury-card-animations';

        style.textContent = `

            @keyframes fadeInUp {

                from {

                    opacity: 0;

                    transform: translateY(30px);

                }

                to {

                    opacity: 1;

                    transform: translateY(0);

                }

            }

            

            @keyframes fadeOutDown {

                from {

                    opacity: 1;

                    transform: translateY(0);

                }

                to {

                    opacity: 0;

                    transform: translateY(20px);

                }

            }

        `;

        document.head.appendChild(style);

    }



    // ─────────────────────────────────────────────────────────────────────────

    // INIT

    // ─────────────────────────────────────────────────────────────────────────

    function init() {

        injectAnimations();

        initScrollReveal();

        initParallaxTilt();

        initChipFilters();

        initFavoriteButtons();



        console.log('✅ Luxury Cards System Initialized');

    }



    // Run on DOM ready

    if (document.readyState === 'loading') {

        document.addEventListener('DOMContentLoaded', init);

    } else {

        init();

    }



})();

