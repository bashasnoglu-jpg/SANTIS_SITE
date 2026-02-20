import os

css_path = "assets/css/style.css"
repair_css = """
/* =========================================
   🚨 EMERGENCY NAVBAR REPAIR BLOCK
   ========================================= */
.navbar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 80px;
    z-index: 999999;
    background: rgba(11, 13, 17, 0.85); /* Dark Santis Bg */
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s ease;
}

.navbar-container {
    width: 92%;
    max-width: 1600px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
}

/* Logo */
.logo {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    color: #fff;
}
.logo-text {
    display: flex;
    flex-direction: column;
    line-height: 1;
}
.brand-name {
    font-family: 'Cinzel', serif;
    font-size: 1.2rem;
    letter-spacing: 2px;
    color: #fff;
}
.brand-sub {
    font-family: 'Inter', sans-serif;
    font-size: 0.5rem;
    letter-spacing: 4px;
    color: #d4af37;
    text-transform: uppercase;
}

/* Desktop Links */
.nav-links {
    display: flex;
    gap: 40px;
}
.nav-link {
    color: #a0a0a0;
    text-decoration: none;
    font-family: 'Inter', sans-serif;
    font-size: 0.75rem;
    letter-spacing: 1px;
    text-transform: uppercase;
    transition: color 0.3s ease;
}
.nav-link:hover {
    color: #d4af37;
}

/* Mobile & Actions */
.nav-actions {
    display: flex;
    align-items: center;
    gap: 20px;
}

.hamburger-btn {
    display: none; /* Hidden on desktop */
    flex-direction: column;
    justify-content: center;
    gap: 6px;
    width: 30px;
    height: 30px;
    cursor: pointer;
    z-index: 1000000; /* Above overlay */
}
.hamburger-btn .bar {
    width: 100%;
    height: 2px;
    background-color: #d4af37;
    transition: all 0.3s ease;
}
.hamburger-btn.active .bar:nth-child(1) {
    transform: rotate(45deg) translate(5px, 5px);
}
.hamburger-btn.active .bar:nth-child(2) {
    opacity: 0;
} 
/* Wait, standard hamburger has 3 bars usually, here html says 2 bars */
/* HTML: span.bar, span.bar */
.hamburger-btn .bar:nth-child(1) { width: 100%; }
.hamburger-btn .bar:nth-child(2) { width: 70%; align-self: flex-end; }

.hamburger-btn.active .bar:nth-child(1) {
    transform: rotate(45deg) translate(2px, -2px);
    width: 100%;
}
.hamburger-btn.active .bar:nth-child(2) {
    transform: rotate(-45deg) translate(2px, 2px);
    width: 100%;
}

/* Mobile Menu Overlay */
.mobile-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background: #0b0d11;
    z-index: 999990;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.mobile-menu-overlay.active {
    opacity: 1;
    pointer-events: all;
}
.mobile-menu-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
}
.mobile-link {
    font-family: 'Playfair Display', serif;
    font-size: 2rem;
    color: #fff;
    text-decoration: none;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.5s ease;
}
.mobile-menu-overlay.active .mobile-link {
    opacity: 1;
    transform: translateY(0);
}

/* Responsive */
@media (max-width: 1024px) {
    .nav-links { display: none; }
    .hamburger-btn { display: flex; }
    .mobile-hide { display: none; }
}
"""

with open(css_path, "a", encoding="utf-8") as f:
    f.write(repair_css)

print("✅ Navbar CSS injected successfully.")
