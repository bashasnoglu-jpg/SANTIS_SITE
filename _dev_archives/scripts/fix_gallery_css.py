
path = r"C:\Users\tourg\Desktop\SANTIS_SITE\assets\css\gallery.css"
append_css = """

/* --- 6. LIGHTBOX STYLES (Added via Fix) --- */
.lightbox {
    display: none; /* Hidden by default */
    position: fixed;
    z-index: 10000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(10, 10, 10, 0.95); /* Deep Santis Black */
    backdrop-filter: blur(10px);
    justify-content: center;
    align-items: center;
    flex-direction: column;
    animation: fadeIn 0.3s ease;
}

.lightbox-content {
    max-width: 90%;
    max-height: 80vh;
    box-shadow: 0 0 50px rgba(0,0,0,0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    animation: zoomIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.lightbox-close {
    position: absolute;
    top: 30px;
    right: 40px;
    color: #f1f1f1;
    font-size: 40px;
    font-weight: 300;
    transition: 0.3s;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
}

.lightbox-close:hover,
.lightbox-close:focus {
    color: var(--gold, #d4af37);
    text-decoration: none;
    cursor: pointer;
    transform: rotate(90deg);
}

#caption {
    margin: 20px 0;
    width: 80%;
    text-align: center;
    color: #ccc;
    font-family: 'Cormorant Garamond', serif;
    font-size: 24px;
    font-style: italic;
    opacity: 0;
    animation: slideUp 0.5s ease 0.2s forwards;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
"""

with open(path, "a", encoding="utf-8") as f:
    f.write(append_css)

print("Appended Lightbox CSS to gallery.css")
