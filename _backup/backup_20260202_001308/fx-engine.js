/**
 * SANTIS FX ENGINE (v1.0)
 * Features: Magnetic Cursor, SVG Liquid Distortion
 */

document.addEventListener('DOMContentLoaded', () => {
    initCursor();
    initLiquidDistortion();
});

/* --- 1. MAGNETIC CURSOR --- */
function initCursor() {
    // Mobil cihazlarda cursor kapat
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const cursor = document.createElement('div');
    cursor.className = 'nv-cursor';

    const cursorInner = document.createElement('div');
    cursorInner.className = 'nv-cursor-inner';

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

    const magneticSelectors = 'a, button, .gallery-item, .nv-chip, .prod-card-v2, .nv-btn, .nav-link';

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

/* --- 2. LIQUID DISTORTION (SVG FILTER) --- */
function initLiquidDistortion() {
    // Inject SVG Filter Definition into DOM
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

    // Apply to gallery images on hover via CSS is better, but dynamic update of frequency creates the "flow"
    // Here we will animate the 'baseFrequency' to create movement

    const turb = document.querySelector('#liquidEffect feTurbulence');
    const disp = document.querySelector('#liquidEffect feDisplacementMap');

    let frames = 0;
    const animateLiquid = () => {
        frames += 1;
        // Subtle ripple movement
        const freqX = 0.01 + Math.sin(frames * 0.02) * 0.002;
        const freqY = 0.01 + Math.cos(frames * 0.03) * 0.002;

        if (turb) turb.setAttribute('baseFrequency', `${freqX} ${freqY}`);

        requestAnimationFrame(animateLiquid);
    };
    animateLiquid();
}
