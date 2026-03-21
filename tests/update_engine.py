import re

with open('c:\\Users\\tourg\\Desktop\\SANTIS_SITE\\assets\\js\\modules\\interaction-engine.js', 'r', encoding='utf-8') as f:
    js = f.read()

new_logic = """
// ==========================================
// 🦋 SANTIS SOVEREIGN REVEAL v1.2 (STATE MACHINE & FLIP)
// ==========================================
let revealState = {
    isOpen: false,
    isAnimating: false,
    activeCard: null,
    ghostEl: null
};

// 🧭 History API - Initialize Deep Link Listener
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(location.search);
    const revealSlug = params.get('reveal');
    if (revealSlug) {
        // Find the card with data-reveal attr, or fallback to data-id
        setTimeout(() => {
            const card = document.querySelector(`[data-reveal="${revealSlug}"]`) || document.querySelector(`[data-id="${revealSlug}"]`);
            if (card) window.triggerSovereignReveal(card, true);
        }, 1000); // Give matrix time to render
    }
});

// 🧭 History API - Back button support
window.addEventListener('popstate', (e) => {
    if (!e.state?.reveal && revealState.isOpen) {
        window.closeSovereignReveal(true);
    }
});

// 📐 Resize Guardian - Keep Ghost Fullscreen
window.addEventListener('resize', () => {
    if (revealState.isOpen && revealState.ghostEl) {
        revealState.ghostEl.style.width = '100vw';
        revealState.ghostEl.style.height = '100vh';
    }
});

window.triggerSovereignReveal = function(card, fromUrl = false) {
    if (revealState.isOpen || revealState.isAnimating) return;
    
    // Check if clicked card is active in the Cover Flow
    // If we clicked from DOM, interaction-engine handles activeIndex. 
    // We assume interaction-engine only calls this for active cards.
    
    revealState.isAnimating = true;
    revealState.activeCard = card;
    
    // 1. Measure the source
    const rect = card.getBoundingClientRect();
    
    // 2. Setup the Overlay
    let overlay = document.getElementById('santis-ghost-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'santis-ghost-overlay';
        overlay.className = 'santis-ghost-overlay';
        document.body.appendChild(overlay);
    }
    
    // 3. Clone the Card (Ghost)
    const ghost = card.cloneNode(true);
    ghost.className = 'santis-ghost-card';
    Object.assign(ghost.style, {
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        margin: '0',
        transform: 'translateZ(0)',
        filter: 'none',
        opacity: '1'
    });
    
    revealState.ghostEl = ghost;
    
    // 4. Inject Close Button
    const closeBtn = document.createElement('div');
    closeBtn.className = 'santis-ghost-close';
    closeBtn.innerHTML = '&times;';
    ghost.appendChild(closeBtn);
    
    // 5. Inject Gradient
    const grad = document.createElement('div');
    grad.className = 'santis-ghost-gradient';
    ghost.appendChild(grad);
    
    document.body.appendChild(ghost);
    
    // 6. Hide Original & Lock Body
    card.classList.add('ghost-hidden');
    document.body.classList.add('ghost-active');
    
    // 7. Push History State
    if (!fromUrl) {
        const slug = card.getAttribute('data-reveal') || card.getAttribute('data-id') || 'premium-service';
        history.pushState({ reveal: slug }, '', `?reveal=${slug}`);
    }
    
    // 8. FLIP Automation (Start Expansion)
    requestAnimationFrame(() => {
        // Force Reflow
        void ghost.offsetWidth;
        
        overlay.classList.add('is-active');
        ghost.classList.add('is-expanded');
        
        // Use transitionend for deterministic lifecycle
        ghost.addEventListener('transitionend', (e) => {
            // Ensure we are responding to the primary expansion transform/width/height
            if (e.propertyName === 'transform' || e.propertyName === 'width') {
                revealState.isAnimating = false;
                revealState.isOpen = true;
            }
        }, { once: true });
    });
    
    closeBtn.addEventListener('click', () => window.closeSovereignReveal());
    overlay.addEventListener('click', () => window.closeSovereignReveal());
};

window.closeSovereignReveal = function(fromHistory = false) {
    if (!revealState.isOpen || revealState.isAnimating) return;
    revealState.isAnimating = true;
    
    const { ghostEl, activeCard } = revealState;
    if (!ghostEl || !activeCard) return;
    
    // 1. Re-measure the original card dynamically (handles resize/scroll shifts)
    const rect = activeCard.getBoundingClientRect();
    
    // 2. Clear History State
    if (!fromHistory) {
        history.replaceState({}, '', location.pathname);
    }
    
    let overlay = document.getElementById('santis-ghost-overlay');
    if (overlay) overlay.classList.remove('is-active');
    
    // 3. FLIP reverse
    Object.assign(ghostEl.style, {
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        borderRadius: '24px'
    });
    
    ghostEl.classList.remove('is-expanded');
    
    // 4. Cleanup on transition end
    const cleanup = (e) => {
        if (e.propertyName === 'transform' || e.propertyName === 'width') {
            ghostEl.remove();
            activeCard.classList.remove('ghost-hidden');
            document.body.classList.remove('ghost-active');
            
            revealState.isOpen = false;
            revealState.isAnimating = false;
            revealState.ghostEl = null;
            revealState.activeCard = null;
        }
    };
    
    ghostEl.addEventListener('transitionend', cleanup, { once: true });
    
    // Fallback cleanup if transition fails
    setTimeout(() => {
        if (revealState.isAnimating) {
            cleanup({ propertyName: 'width' });
        }
    }, 800);
};

// Global Esc Key Listener
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && revealState.isOpen) {
        window.closeSovereignReveal();
    }
});
// =========================================="""

import re
# We need to replace everything from // ========================================== \n // 🦋 SANTIS SOVEREIGN REVEAL (GHOST EXPANSION)
# down to the end of window.triggerSovereignReveal definition, including its event listeners.

# We can construct a precise regex to match the old block.
old_block_pattern = r"// ==========================================\s*// 🦋 SANTIS SOVEREIGN REVEAL \(GHOST EXPANSION\)[\s\S]*?document\.addEventListener\('keydown', escListener\);\s*\}\s*\};\s*card\.addEventListener\('keydown', escListener\);\s*\/\/.*?\} *\n"

# Actually the end of the file or up to a specific marker?
# In my `view_file` I saw it ends with:
#     const escListener = (e) => {
#         if (e.key === 'Escape') {
#             closeGhost();
#             document.removeEventListener('keydown', escListener);
#         }
#     };
#     document.addEventListener('keydown', escListener);
# };

# Let's replace by splitting.
parts = js.split("// ==========================================\n// 🦋 SANTIS SOVEREIGN REVEAL (GHOST EXPANSION)")
if len(parts) > 1:
    header_index = js.find("// ==========================================\n// 🦋 SANTIS SOVEREIGN REVEAL (GHOST EXPANSION)")
    end_index = js.find("};", header_index + 100)
    # We need to find the outermost closing brace of window.triggerSovereignReveal
    old_func_regex = r"// ==========================================\n// 🦋 SANTIS SOVEREIGN REVEAL \(GHOST EXPANSION\)[\s\S]+?window\.triggerSovereignReveal = function\(card\) \{[\s\S]+?\}\s*;\s*\n"
    match = re.search(old_func_regex, js)
    if match:
        js = js[:match.start()] + new_logic + js[match.end():]
    else:
        # Fallback manual split
        # We know it's at the end of interaction-engine.js!
        js = parts[0] + new_logic

with open('c:\\Users\\tourg\\Desktop\\SANTIS_SITE\\assets\\js\\modules\\interaction-engine.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Updated interaction-engine.js successfully.")
