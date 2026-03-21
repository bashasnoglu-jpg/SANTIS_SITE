/**
 * SANTIS FX ENGINE (v1.0)
 * Features: Magnetic Cursor, SVG Liquid Distortion
 */

// Initial Loader handled at bottom
// document.addEventListener('DOMContentLoaded', () => {
//     initCursor();
//     initLiquidDistortion();
// });

/* --- 1. MAGNETIC CURSOR --- */
function initCursor() {
    // Mobil cihazlarda cursor kapat
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const cursor = document.createElement('div');
    cursor.className = 'santis-cursor';

    const cursorInner = document.createElement('div');
    cursorInner.className = 'santis-cursor-inner';

    cursor.appendChild(cursorInner);
    document.body.appendChild(cursor);

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Smooth Follow Loop
    const loop = () => {
        // Linear Interpolation (Lerp) for smoothness
        const dx = mouseX - cursorX;
        const dy = mouseY - cursorY;

        cursorX += dx * 0.15; // Speed factor (0.1 - 0.2 is good)
        cursorY += dy * 0.15;

        cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;

        requestAnimationFrame(loop);
    };
    loop();

    // Magnetic Snap Logic (Event Delegation for Dynamic Elements)
    // We track mouseover on document to catch any element matching our selectors

    const magneticSelectors = 'a, button, .gallery-item, .santis-chip, .prod-card-v2, .santis-btn, .nav-link';

    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest(magneticSelectors);
        if (target) {
            cursor.classList.add('is-hovering');

            // Special cases
            if (target.classList.contains('gallery-item') || target.classList.contains('prod-card-v2')) {
                cursor.classList.add('is-viewing');
                // Optional text update logic if needed
                // cursorInner.innerText = 'GÖZ AT'; 
            }
        }
    });

    document.addEventListener('mouseout', (e) => {
        const target = e.target.closest(magneticSelectors);
        if (target) {
            cursor.classList.remove('is-hovering');
            cursor.classList.remove('is-viewing');
            cursorInner.innerText = '';
        }
    });
}

/* --- 2. ULTRA VISUALS: VELOCITY SKEW & SCROLL --- */
let currentSkew = 0;
let lastScrollY = window.scrollY;

function initUltraVisuals() {
    // 1. Kinetic Typography Setup
    document.querySelectorAll('.santis-title, .santis-editorial-title, .santis-hero-title').forEach(el => {
        el.classList.add('santis-kinetic');
        splitText(el);
    });

    // 2. Curtain Reveal Setup
    document.querySelectorAll('img').forEach(img => {
        // Wrap images in curtain container if not already wrapped
        if (!img.closest('.santis-reveal-curtain') && !img.closest('.santis-cursor') && !img.closest('.nav-logo')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'santis-reveal-curtain';
            img.parentNode.insertBefore(wrapper, img);
            wrapper.appendChild(img);
        }
    });

    // 3. Scroll Loop (Velocity Skew)
    requestAnimationFrame(scrollLoop);

    // 4. Observer
    initObserver();
}

function splitText(el) {
    const text = el.innerText;
    el.innerHTML = '';
    const words = text.split(' ');

    words.forEach(word => {
        const wordSpan = document.createElement('span');
        wordSpan.className = 'santis-kinetic-word';

        [...word].forEach((char, i) => {
            const span = document.createElement('span');
            span.className = 'santis-kinetic-char';
            span.innerHTML = char === ' ' ? '&nbsp;' : char;
            span.style.transitionDelay = `${i * 0.03}s`;
            wordSpan.appendChild(span);
        });

        el.appendChild(wordSpan);
    });
}

function scrollLoop() {
    const newScrollY = window.scrollY;
    const diff = newScrollY - lastScrollY;
    const speed = diff * 0.02; // Ultra refined (Barely noticeable)

    currentSkew = lerp(currentSkew, speed, 0.1);

    // Hard Clamp (Max 2 degrees)
    currentSkew = Math.max(Math.min(currentSkew, 2), -2);

    // Apply Skew to Main Container (exclude fixed elements)
    const main = document.getElementById('santis-main');
    if (main) {
        main.style.transform = `skewY(${currentSkew}deg)`;
    }

    lastScrollY = newScrollY;
    requestAnimationFrame(scrollLoop);
}

function lerp(start, end, factor) {
    return start + (end - start) * factor;
}

function initObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.santis-reveal-curtain, .santis-kinetic').forEach(el => {
        observer.observe(el);
    });
}

// Override Init
document.addEventListener('DOMContentLoaded', () => {
    initCursor();
    initLiquidDistortion(); // Keep liquid
    setTimeout(initUltraVisuals, 100); // Slight delay for DOM
});

/* --- 2. LIQUID DISTORTION (SVG FILTER) --- */
function initLiquidDistortion() {
    // Inject SVG Filter Definition into DOM
    if (document.getElementById('liquidEffect')) return; // Avoid duplicate

    const rawSvg = `
    <svg style="position: absolute; width: 0; height: 0; pointer-events: none;">
        <defs>
            <filter id="liquidEffect">
                <feTurbulence type="fractalNoise" baseFrequency="0.01 0.01" numOctaves="1" result="warp" />
                <feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="30" in="SourceGraphic" in2="warp" />
            </filter>
        </defs>
    </svg>
    `;
    const div = document.createElement('div');
    div.innerHTML = rawSvg;
    document.body.appendChild(div);

    const turb = document.querySelector('#liquidEffect feTurbulence');
    let frames = 0;
    const animateLiquid = () => {
        frames += 1;
        const freqX = 0.01 + Math.sin(frames * 0.02) * 0.002;
        const freqY = 0.01 + Math.cos(frames * 0.03) * 0.002;
        if (turb) turb.setAttribute('baseFrequency', `${freqX} ${freqY}`);
        requestAnimationFrame(animateLiquid);
    };
    animateLiquid();
}
