/**

 * SANTIS VIDEO HERO CONTROLLER v1.0

 * Features: Play/Pause, Lazy loading, Mobile detection

 */



(function () {

    'use strict';



    document.addEventListener('DOMContentLoaded', init);



    function init() {

        const video = document.querySelector('.nv-bg-video');

        const controlBtn = document.getElementById('videoControl');



        if (!video) return;



        console.log('🎬 Video Hero Controller: Initializing...');



        // Setup play/pause control

        if (controlBtn) {

            setupVideoControl(video, controlBtn);

        }



        // Setup lazy loading

        setupLazyLoading(video);



        // Setup mobile detection

        handleMobileVideo(video);



        console.log('✅ Video Hero Controller ready');

    }



    function setupVideoControl(video, btn) {

        let isPlaying = true;



        // Play icon SVG

        const playIcon = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';

        // Pause icon SVG 

        const pauseIcon = '<svg viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';



        btn.addEventListener('click', () => {

            if (isPlaying) {

                video.pause();

                btn.innerHTML = playIcon;

                btn.setAttribute('aria-label', 'Video oynat');

            } else {

                video.play();

                btn.innerHTML = pauseIcon;

                btn.setAttribute('aria-label', 'Video duraklat');

            }

            isPlaying = !isPlaying;

        });

    }



    function setupLazyLoading(video) {

        // If video has data-src, use intersection observer

        if (video.dataset.src) {

            const observer = new IntersectionObserver((entries) => {

                entries.forEach(entry => {

                    if (entry.isIntersecting) {

                        const sources = video.querySelectorAll('source[data-src]');

                        sources.forEach(source => {

                            source.src = source.dataset.src;

                        });

                        video.load();

                        video.play().catch(() => {

                            // Autoplay blocked, show poster

                            console.log('Autoplay blocked by browser');

                        });

                        observer.unobserve(video);

                    }

                });

            }, { rootMargin: '100px' });



            observer.observe(video);

        } else {

            // Try to play immediately

            video.play().catch(() => {

                console.log('Autoplay blocked by browser');

            });

        }

    }



    function handleMobileVideo(video) {

        // Check if mobile

        const isMobile = window.matchMedia('(max-width: 768px)').matches;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;



        if (isMobile || prefersReducedMotion) {

            // Don't autoplay on mobile or if user prefers reduced motion

            video.pause();

            video.removeAttribute('autoplay');



            // Hide control button on mobile (video is hidden via CSS anyway)

            const controlBtn = document.getElementById('videoControl');

            if (controlBtn && isMobile) {

                controlBtn.style.display = 'none';

            }

        }

    }



    // Expose to global scope

    window.SantisVideoHero = {

        init: init

    };



})();

