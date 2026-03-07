/**
 * Phase 67: The Sovereign Rituals Engine
 * Ultra-Mega Spatial Design & Magnetic Scroll Protocol
 */

document.addEventListener('DOMContentLoaded', () => {
    initSovereignLayout();
    initSovereignPrefetch();
});

function initSovereignLayout() {
    const containers = document.querySelectorAll('.rituals-container');
    const whisperBox = document.getElementById('inline-aurelia-whisper');
    const whisperText = document.getElementById('inline-whisper-text');

    if (containers.length === 0) return;

    // --- AURELIA WHISPER INTERSECTION OBSERVER (GLOBAL) ---
    let whisperObserver;
    if ('IntersectionObserver' in window) {
        // Görev 2: Aurelia Insight (Inline Whisper) RAG Engine
        const whisperDict = {
            'sig-card-0': 'Termal kubbe ve köpük bulutu içerisinde derin toksin atımı. Kastara sinmiş antik yorgunluğun şifası.',
            'sig-card-1': 'Kinetik derin doku terapisi ile kas blokajlarının çözülmesi. Adımlarınızın eskisi gibi hafiflediği o an.',
            'sig-card-2': 'Saf altın yaprağı dokunuşu ile Sovereign mühürlemesi. Lüksün fiziksel bir forma dönüştüğü nokta.',
            'hammam-card-0': 'Kahve ve deniz tuzu ile canlandırıcı arınma. Derinin en derin tabakalarına inen bir diriliş.',
            'hammam-card-1': 'Özel tekniklerin senteziyle kombinasyon masajı. Bedenin kendi kendini onarma sürecinin tetikleyicisi.',
            'therapy-card-0': 'Organik yosun peeling ile mineral yüklemesi. Hücresel seviyede bir uyanış ve parlaklık hissi.',
            'therapy-card-1': 'Ödem atan lenfatik drenaj teknikleri. Sistemin yükünü hafifleten, berraklık getiren kusursuz bir akış.'
        };

        whisperObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const cardId = entry.target.id;
                    const message = whisperDict[cardId] || 'Size özel hazırlanmış şifa dolu bir Sovereign dokunuşu...';

                    if (whisperText && whisperText.innerText !== message) {
                        whisperText.style.opacity = 0;
                        whisperText.style.transform = 'translateY(10px)';

                        setTimeout(() => {
                            whisperText.innerText = message;
                            whisperText.style.opacity = 1;
                            whisperText.style.transform = 'translateY(0)';

                            if (whisperBox && whisperBox.classList.contains('opacity-0')) {
                                whisperBox.classList.remove('opacity-0', 'translate-y-4', 'h-0');
                                whisperBox.classList.add('opacity-100', 'translate-y-0', 'h-auto');
                            }
                        }, 400);
                    }
                }
            });
        }, {
            rootMargin: '0px',
            threshold: 0.6
        });

        if (whisperText) {
            whisperText.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
        }
    }

    // --- LOOP THROUGH EACH RAIL ---
    containers.forEach(container => {

        // --- EVENT LISTENER DUPLICATION SHIELD --- //
        if (container.dataset.sovereignInitialized === 'true') return;
        container.dataset.sovereignInitialized = 'true';

        const wrapper = container.closest('.group\\/slider') || container.closest('.rituals-section');
        const cards = container.querySelectorAll('.ritual-card');

        if (!wrapper || cards.length === 0) return;

        // --- MAGNETIC SCROLL & FOCUS DIMMING (PER RAIL) ---
        let focusObserver;
        if ('IntersectionObserver' in window) {
            focusObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('snapped-focus');
                        entry.target.classList.remove('snapped-dim');
                    } else {
                        entry.target.classList.remove('snapped-focus');
                        entry.target.classList.add('snapped-dim');
                    }
                });
            }, {
                root: container,
                rootMargin: '0px',
                threshold: 0.55
            });

            cards.forEach(card => {
                focusObserver.observe(card);
                if (whisperObserver) whisperObserver.observe(card);
            });
        }

        let isDown = false;
        let startX;
        let scrollLeft;

        // 1. Mouse Drag Mantığı (Apple Akıcılığı)
        container.addEventListener('mousedown', (e) => {
            isDown = true;
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
            // Kaydırırken takılmayı önlemek için snap özelliğini kapat
            container.style.scrollSnapType = 'none';
            container.classList.add('cursor-grabbing');
        });

        const resetScrollParams = () => {
            isDown = false;
            container.style.scrollSnapType = 'x mandatory';
            container.classList.remove('cursor-grabbing');
        };

        container.addEventListener('mouseleave', resetScrollParams);
        container.addEventListener('mouseup', resetScrollParams);

        container.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 1.5; // Momentum Çarpanı
            container.scrollLeft = scrollLeft - walk;
        });

        // 2. Chevron Ok Navigasyonu
        const btnPrev = wrapper.querySelector('.slider-prev');
        const btnNext = wrapper.querySelector('.slider-next');

        // Dinamik kaydırma mesafesi
        const getScrollAmount = () => {
            const firstCard = container.querySelector('.ritual-card');
            return firstCard ? firstCard.clientWidth + 32 : 450; // 32px gap
        };

        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                container.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
            });
        }
        if (btnNext) {
            btnNext.addEventListener('click', () => {
                container.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
            });
        }

        // Chevron Opacity Update
        container.addEventListener('scroll', () => {
            if (btnPrev) {
                if (container.scrollLeft <= 10) {
                    btnPrev.style.opacity = '0';
                    btnPrev.style.pointerEvents = 'none';
                } else {
                    btnPrev.style.opacity = '1';
                    btnPrev.style.pointerEvents = 'auto';
                }
            }

            if (btnNext) {
                if (Math.ceil(container.scrollLeft + container.clientWidth) >= container.scrollWidth - 10) {
                    btnNext.style.opacity = '0';
                    btnNext.style.pointerEvents = 'none';
                } else {
                    btnNext.style.opacity = '1';
                    btnNext.style.pointerEvents = 'auto';
                }
            }
        });

        // Initial check
        container.dispatchEvent(new Event('scroll'));
    });
}

// Phase 86: The Sovereign Prefetch Engine
function initSovereignPrefetch() {
    const cards = document.querySelectorAll('.ritual-card');
    if (cards.length === 0) return;

    cards.forEach(card => {
        card.addEventListener('mouseenter', async () => {
            const slug = card.getAttribute('data-slug');
            if (!slug) return; // Not linked to Phase 86 detail yet

            // Use the global catalog populated by DataBridge
            const globalData = window.santisServices || window.catalog || [];

            if (globalData.length > 0) {
                // Find matching item by slug or ID
                const targetData = globalData.find(r => r.slug === slug || `ritual-${r.id}` === slug || r.id === slug);

                if (targetData && (targetData.hero_image || targetData.image)) {
                    const imgSrc = targetData.hero_image || targetData.image;
                    const img = new Image();
                    img.src = imgSrc;

                    // Inject preload into browser head if not already there
                    const existingLink = document.querySelector(`link[href="${imgSrc}"]`);
                    if (!existingLink) {
                        const imgLink = document.createElement('link');
                        imgLink.rel = 'preload';
                        imgLink.as = 'image';
                        imgLink.href = imgSrc;
                        document.head.appendChild(imgLink);
                    }
                }
            }
        }, { once: true }); // Only trigger once per card to save bandwidth

        // Wrap the card in a clickable area for the cinematic route
        card.addEventListener('click', (e) => {
            // Ignore if clicking the Sovereign Seal checkout button directly 
            if (e.target.closest('button')) return;

            const slug = card.getAttribute('data-slug');
            if (slug) {
                // Zero-Friction Route Transition  → Sovereign Detail Engine
                window.location.href = `/service-detail.html?slug=${slug}`;
            }
        });
    });
}
