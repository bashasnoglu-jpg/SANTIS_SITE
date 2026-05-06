import { SantisSocket } from '../network/SantisSocket';

export class SantisReservationModal {
    private holdTimer: number | NodeJS.Timeout | null = null;
    private currentStatus = 'CALM';
    private ws = new SantisSocket();

    constructor() {
        this.initEventListeners();
    }

    initEventListeners() {
        this.ws.on('RESERVE_HOLD_SYNC', (data) => this.handleHoldSync(data));
        this.ws.on('INTELLIGENCE_SIGNAL', (signal) => this.handleSystemUrgency(signal));
    }

    handleHoldSync({ ttl, status, price }: any) {
        this.updateUI(status, price);
        this.startHoldCountdown(ttl);
    }

    startHoldCountdown(seconds: number) {
        if (this.holdTimer) clearTimeout(this.holdTimer);
        this.holdTimer = setTimeout(() => {
            this.ws.send('REQUEST_RENEWAL_SILENT');
        }, seconds * 1000 - 60000);
    }

    handleSystemUrgency(signal: any) {
        if (signal.type === 'QUEUE_DETECTED' && this.holdTimer) {
            this.showSoftNotification(
                "Size ayrılan bu seçkin zaman dilimini korumaya devam etmek ister misiniz?",
                "Evet, Devam Et"
            );
        }
    }

    showSoftNotification(msg: string, btnText: string) {
        console.log(`[Concierge Notification] ${msg}`);
    }

    updateUI(status: string, price: number) {
        const modalElement = document.querySelector('#reservation-modal');
        const bookingCard = document.querySelector('.reservation-summary-card');

        if (!modalElement || !bookingCard) return;

        if (status === 'EXCLUSIVE_ACCESS') {
            modalElement.classList.add('state-exclusive');
            bookingCard.classList.add('focus-target');
            console.log("[Concierge] Focus mode engaged: Museum Lighting applied.");
        } else {
            modalElement.classList.remove('state-exclusive');
            bookingCard.classList.remove('focus-target');
        }
    }
}
