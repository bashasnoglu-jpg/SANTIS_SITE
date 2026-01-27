document.addEventListener('DOMContentLoaded', () => {
    // --- 1. STICKY HEADER (SCROLL EFEKTİ) ---
    const header = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- 2. SMOOTH SCROLL (YUMUŞAK GEÇİŞ) ---
    document.querySelectorAll('a[href^="#"
  ]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// --- 3. REZERVASYON MODAL (POPUP) YÖNETİMİ ---
const modal = document.getElementById("bookingModal");
const btn = document.getElementById("openModalBtn");
const closeBtn = document.querySelector(".close-btn");

// Modalı aç
if (btn) {
    btn.onclick = function () {
        modal.style.display = "flex"; // Flex ile ortalar
    }
}
// Modalı kapat (X butonu)
if (closeBtn) {
    closeBtn.onclick = function () {
        modal.style.display = "none";
    }
}
// Modalı kapat (Dışarı tıklama)
window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
// --- 4. FORM SUBMIT (DEMO) ---
const form = document.getElementById('bookingForm');
if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        alert("Teşekkürler Hakan Bey, rezervasyon talebiniz alındı. Sizinle iletişime geçeceğiz.");
        modal.style.display = "none";
        form.reset();
    });
}

console.log("Santis Club System: Operational 🟢");
});
