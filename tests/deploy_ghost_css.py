import os

css_path = r"c:\Users\tourg\Desktop\SANTIS_SITE\assets\css\style.css"
with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

missing_css = """
/* ==========================================
   🦋 SOVEREIGN REVEAL v1.2 & CHOREOGRAPHY
   ========================================== */

/* Ghost Overlay (Darkens the background) */
.santis-ghost-overlay {
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: rgba(10, 10, 12, 0.9);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    z-index: 9998;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
.santis-ghost-overlay.is-active {
    opacity: 1;
    pointer-events: auto;
}

/* Base Ghost Card */
.santis-ghost-card {
    position: fixed;
    will-change: transform, width, height, border-radius;
    transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1), 
                height 0.6s cubic-bezier(0.22, 1, 0.36, 1), 
                transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), 
                border-radius 0.6s cubic-bezier(0.22, 1, 0.36, 1);
    overflow: hidden;
    /* Ensure no margin/padding jumps */
    margin: 0 !important;
    padding: 0 !important;
    background: #0A0A0C;
    /* Prevent text selection */
    user-select: none;
}

/* Ensure child image covers the ghost bounds */
.santis-ghost-card > img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    margin: 0;
    position: absolute;
    top: 0; left: 0;
    transition: opacity 0.6s ease;
}

/* Darken image slightly when expanded for better text contrast */
.santis-ghost-card.is-expanded > img {
    opacity: 0.4;
}

/* Content wrapper that sits over the ghost image */
.santis-ghost-card .santis-stack-card-content {
    position: absolute;
    bottom: 30px;
    left: 30px;
    right: 30px;
    z-index: 2;
    /* Will morph via SovereignMorphEngine */
}

/* Close button */
.santis-ghost-close {
    position: absolute;
    top: 40px;
    right: 40px;
    width: 50px;
    height: 50px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    color: #fff;
    font-size: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    opacity: 0;
    transform: scale(0.8) rotate(-45deg);
    transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
.santis-ghost-card.is-expanded .santis-ghost-close {
    opacity: 1;
    transform: scale(1) rotate(0);
    transition-delay: 0.3s;
}
.santis-ghost-close:hover {
    background: rgba(255, 255, 255, 0.2);
}

/* Lock body interactions under ghost */
body.ghost-active {
    overflow: hidden;
}

/* ------------------------------------------
   🎭 PHASE 6: STAGGERED MASK REVEAL (ORPHAN ELEMENTS)
   ------------------------------------------ */
.santis-reveal-data {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 0 10%;
    z-index: 5;
    pointer-events: none;
}
.santis-ghost-card.is-expanded .santis-reveal-data {
    pointer-events: auto;
}

/* Hide reveal data in the normal carousel cards */
.santis-stack-card .santis-reveal-data {
    display: none;
}
/* Show in Ghost Card */
.santis-ghost-card .santis-reveal-data {
    display: flex;
}

/* The Mask */
.santis-stagger-mask {
    overflow: hidden;
    display: inline-block;
    vertical-align: top;
    /* Extra padding incase typography has large descenders */
    padding-bottom: 0.1em; 
    margin-bottom: 20px;
}

/* The Dancer */
.santis-stagger-item {
    display: block;
    opacity: 0;
    transform: translateY(110%);
    will-change: transform, opacity;
    transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) calc(var(--stagger-idx, 0) * 50ms),
                opacity 0.6s ease calc(var(--stagger-idx, 0) * 50ms);
}

/* The Conductor (Triggered by JS transitionend) */
.santis-ghost-card.reveal-content-active .santis-stagger-item {
    opacity: 1;
    transform: translateY(0);
}

.orphan-desc {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.8);
    text-align: center;
    max-width: 600px;
    line-height: 1.6;
}

.orphan-cta {
    margin-top: 30px;
    padding: 15px 40px;
    background: #D4AF37;
    color: #0A0A0C;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    border-radius: 4px;
    text-decoration: none;
}
"""

if 'SOVEREIGN REVEAL v1.2' not in css:
    with open(css_path, "a", encoding="utf-8") as f:
        f.write("\n" + missing_css)
    print("Injected UI CSS Rules mapping.")
