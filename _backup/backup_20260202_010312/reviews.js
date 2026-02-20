/**
 * SANTIS CLUB - REVIEWS SYSTEM
 * Handles guest reviews display and submission using LocalStorage.
 */

const REVIEWS = {
    data: [
        {
            name: "Sophie M.",
            rating: 5,
            text: "Amazing experience! The Hammam ritual was authentic and relaxing. Highly recommended.",
            date: "2025-12-10"
        },
        {
            name: "Ahmet Y.",
            rating: 5,
            text: "Masaj terapistleri çok profesyonel. Tesis tertemiz ve atmosfer harika.",
            date: "2026-01-05"
        },
        {
            name: "Elena K.",
            rating: 4,
            text: "Sothys facial treatment was exquisite. My skin feels rejuvenated.",
            date: "2026-01-20"
        }
    ],

    init() {
        // Load from LocalStorage if available
        const stored = localStorage.getItem('santis_reviews');
        if (stored) {
            this.data = JSON.parse(stored);
        }
        this.render();
    },

    render() {
        const container = document.getElementById('reviewsGrid');
        if (!container) return;

        container.innerHTML = this.data.map(rev => `
            <div class="review-card">
                <div class="review-header">
                    <span class="review-stars">${'★'.repeat(rev.rating)}${'☆'.repeat(5 - rev.rating)}</span>
                    <span class="review-date">${rev.date}</span>
                </div>
                <p class="review-text">"${rev.text}"</p>
                <div class="review-author">— ${rev.name}</div>
            </div>
        `).join('');
    },

    openModal() {
        const modal = document.getElementById('reviewModal');
        if (modal) {
            modal.classList.add('active');
            modal.style.display = 'flex';
        }
    },

    closeModal() {
        const modal = document.getElementById('reviewModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => { modal.style.display = 'none'; }, 300);
        }
    },

    submit(e) {
        e.preventDefault();

        const name = document.getElementById('revName').value;
        const rating = parseInt(document.getElementById('revRating').value);
        const text = document.getElementById('revText').value;
        const date = new Date().toISOString().split('T')[0];

        const newReview = { name, rating, text, date };

        // Add to data (top of list)
        this.data.unshift(newReview);

        // Save
        localStorage.setItem('santis_reviews', JSON.stringify(this.data));

        // UI Update
        this.render();
        this.closeModal();
        e.target.reset();

        // Notification (using console/alert for now, app.js logic later)
        alert("Teşekkürler! Yorumunuz kaydedildi.");
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    REVIEWS.init();
});
