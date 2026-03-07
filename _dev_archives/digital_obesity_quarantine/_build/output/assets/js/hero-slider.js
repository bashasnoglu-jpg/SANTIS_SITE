document.addEventListener('DOMContentLoaded', () => {

    const slides = document.querySelectorAll('.nv-campaign-slide');

    const progress = document.getElementById('heroProgress');



    // Check if slider exists on this page

    if (slides.length === 0) return;



    let current = 0;

    const slideDuration = 5000; // 5 seconds per slide

    const totalDuration = slides.length * slideDuration;



    // Initial State

    // Ensure first slide is active if not already

    if (!document.querySelector('.nv-campaign-slide.active')) {

        slides[0].classList.add('active');

    }



    // Progress Bar Animation Helper

    function resetProgressBar() {

        if (!progress) return;

        progress.style.transition = 'none';

        progress.style.width = '0%';



        // Force Reflow

        void progress.offsetWidth;



        progress.style.transition = `width ${slideDuration}ms linear`;

        progress.style.width = '100%';

    }



    function nextSlide() {

        // Remove active class from current

        slides[current].classList.remove('active');



        // Move to next

        current = (current + 1) % slides.length; // Loop back to 0



        // Add active class to new

        slides[current].classList.add('active');



        // Reset Progress Bar for the new slide

        // Note: Logic allows for per-slide progress or global. 

        // Here we do per-slide filling for visual effect

        resetProgressBar();

    }



    // Start Loop

    resetProgressBar(); // Start progress for first slide

    setInterval(nextSlide, slideDuration);

});

