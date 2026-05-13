import { SovereignCommandPalette } from './admin-command-palette.js';

function injectOmniNavStyles() {
    if (document.getElementById('omni-nav-styles')) return;
    const link = document.createElement('link');
    link.id = 'omni-nav-styles';
    link.rel = 'stylesheet';
    link.href = '/admin/css/admin-omni-nav.css';
    document.head.appendChild(link);
}

function initLauncher() {
    injectOmniNavStyles();
    const popupCheck = document.getElementById('sovereign-omni-nav');
    if (popupCheck) return; // Prevent double init
    
    const palette = new SovereignCommandPalette();

    // Global Keyboard Shortcut: Ctrl + K or Cmd + K
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            palette.toggle();
        }
    });

    // Optional: Mount a global floating button for non-keyboard users
    const floatBtn = document.createElement('button');
    floatBtn.className = 'omni-nav-floating-btn';
    floatBtn.innerHTML = `
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:20px;height:20px;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
        <span>Omni</span>
    `;
    floatBtn.addEventListener('click', () => palette.open());
    document.body.appendChild(floatBtn);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLauncher);
} else {
    initLauncher();
}
