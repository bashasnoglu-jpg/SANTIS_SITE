
path = r"C:\Users\tourg\Desktop\SANTIS_SITE\assets\js\gallery-loader.js"
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Truncate lines from 176 onwards
# Lines are 0-indexed, so we keep lines 0 to 175
lines = lines[:175]

append_code = """    initGallery();
});

// 🧠 LIVE HOLOGRAPHIC RECEIVER
if (window.SantisBrain) {
    window.SantisBrain.listen((type, payload) => {
        // Check if it's a file update for gallery
        if (type === 'update' && payload && payload.file && payload.file.includes('gallery-data.js')) {
            console.log("⚡ [Hologram] Incoming Transmission...");
            
            // 1. Show Toast (Visual Coolness)
            const toast = document.createElement('div');
            toast.className = 'holo-toast';
            toast.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:20px;">📡</span>
                    <div>
                        <strong>GÖRSEL SİNYALİ ALINDI</strong>
                        <div style="font-size:10px; opacity:0.7;">Canlı Render Başlatılıyor...</div>
                    </div>
                </div>
            `;
            // Inline Styles for simplicity
            Object.assign(toast.style, {
                position: 'fixed', bottom: '30px', right: '30px',
                background: 'rgba(20, 20, 20, 0.9)', border: '1px solid #d4af37',
                color: '#fff', padding: '15px 25px', borderRadius: '8px',
                zIndex: '9999', backdropFilter: 'blur(10px)',
                boxShadow: '0 0 20px rgba(212, 175, 55, 0.2)',
                transform: 'translateY(100px)', opacity: '0', transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
            });
            document.body.appendChild(toast);
            
            // Animate In
            requestAnimationFrame(() => {
                toast.style.transform = 'translateY(0)';
                toast.style.opacity = '1';
            });

            // 2. Hot-Reload Data
            const script = document.createElement('script');
            script.src = '../../assets/js/gallery-data.js?t=' + Date.now();
            script.onload = () => {
                console.log("⚡ [Hologram] Data Synced.");
                // Re-render
                window.galleryState.data = window.GALLERY_DATA;
                
                // Re-Apply Filter if needed, or just show all
                const currentFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
                filterGallery(currentFilter);

                // Toast Success
                setTimeout(() => {
                    toast.style.transform = 'translateY(100px)';
                    toast.style.opacity = '0';
                    setTimeout(() => toast.remove(), 500);
                }, 3000);
            };
            document.body.appendChild(script);
        }
    });
}
"""

with open(path, "w", encoding="utf-8") as f:
    f.writelines(lines)
    f.write(append_code)

print("Added Holographic Receiver to gallery-loader.js")
