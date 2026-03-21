const API_URL = "http://localhost:3000";

let currentHotelId = null;

// 1. Get Hotel Slug from URL
const urlParams = new URLSearchParams(window.location.search);
const hotelSlug = urlParams.get('hotel') || 'rixos'; // Fallback to rixos for demo

// Elements
const hotelNameEl = document.getElementById('hotelName');
const servicesContainer = document.getElementById('servicesContainer');
const bookingFormSection = document.getElementById('bookingForm');
const selectedServiceNameEl = document.getElementById('selectedServiceName');
const selectedServicePriceEl = document.getElementById('selectedServicePrice');
const serviceIdInput = document.getElementById('serviceId');
const hotelIdInput = document.getElementById('hotelId');
const reservationForm = document.getElementById('reservationForm');
const cancelBookingBtn = document.getElementById('cancelBooking');
const successToast = document.getElementById('successToast');

// 2. Load Initial Data
async function initApp() {
    try {
        // Fetch Hotel Info
        const hotelRes = await fetch(`${API_URL}/hotel/${hotelSlug}`);
        if (!hotelRes.ok) throw new Error("Hotel not found");
        const hotel = await hotelRes.json();

        currentHotelId = hotel.id;
        hotelNameEl.textContent = hotel.name;

        // Fetch Services
        const servicesRes = await fetch(`${API_URL}/services/${hotel.id}`);
        const services = await servicesRes.json();

        renderServices(services);
    } catch (err) {
        console.error("Initialization error:", err);
        hotelNameEl.textContent = "Welcome to Santis";
        servicesContainer.innerHTML = `<div class="loading-spinner">Error loading data. Try again later.</div>`;
    }
}

// 3. Render Services to UI
function renderServices(services) {
    if (services.length === 0) {
        servicesContainer.innerHTML = `<div>No services available at this time.</div>`;
        return;
    }

    servicesContainer.innerHTML = ''; // Clear loading

    services.forEach(service => {
        const card = document.createElement('div');
        card.className = 'service-card';
        card.innerHTML = `
            <div class="service-info">
                <h3>${service.name}</h3>
                <div class="service-meta">${service.duration} Min • Relax</div>
            </div>
            <div style="display: flex; align-items: center;">
                <div class="service-price">€${service.price}</div>
                <button class="btn-book" data-id="${service.id}" data-name="${service.name}" data-price="${service.price}">
                    Book
                </button>
            </div>
        `;
        servicesContainer.appendChild(card);
    });

    // Add click listeners to book buttons
    document.querySelectorAll('.btn-book').forEach(btn => {
        btn.addEventListener('click', (e) => {
            openBookingForm(
                e.target.dataset.id,
                e.target.dataset.name,
                e.target.dataset.price
            );
        });
    });
}

// 4. Handle Booking UI
function openBookingForm(serviceId, serviceName, servicePrice) {
    serviceIdInput.value = serviceId;
    hotelIdInput.value = currentHotelId;
    selectedServiceNameEl.textContent = serviceName;
    selectedServicePriceEl.textContent = `€${servicePrice}`;

    servicesContainer.classList.add('hidden');
    bookingFormSection.classList.remove('hidden');
}

cancelBookingBtn.addEventListener('click', () => {
    bookingFormSection.classList.add('hidden');
    servicesContainer.classList.remove('hidden');
});

// 5. Submit Reservation to API
reservationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const guestName = document.getElementById('guestName').value;
    const time = document.getElementById('bookingTime').value;
    const serviceId = serviceIdInput.value;
    const hotelId = hotelIdInput.value;

    // Build ISO datetime for today
    const [hours, minutes] = time.split(':');
    const bookingDate = new Date();
    bookingDate.setHours(hours, minutes, 0, 0);

    try {
        const res = await fetch(`${API_URL}/reservation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
                hotel_id: parseInt(hotelId),
                service_id: parseInt(serviceId),
                guest_name: guestName,
                time: bookingDate.toISOString()
            })
        });

        if (res.ok) {
            reservationForm.reset();
            bookingFormSection.classList.add('hidden');
            servicesContainer.classList.remove('hidden');

            // Show Success
            successToast.classList.remove('hidden');
            setTimeout(() => {
                successToast.classList.add('hidden');
            }, 4000);
        } else {
            alert("Failed to create reservation. Please try again.");
        }
    } catch (err) {
        console.error("Booking err:", err);
        alert("Network error.");
    }
});

// Start App
initApp();
