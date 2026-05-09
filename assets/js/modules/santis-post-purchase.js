/**
 * SANTIS OS - MODULE: VIP Post-Purchase Experience
 * Architecture: State-Driven, SPA-Ready, Animated Digital Pass
 * Design: Quiet Luxury, Zero-CLS
 */

export class PostPurchaseModule {
  constructor(engine) {
    this.engine = engine;
    this._isAlive = false;
    this._subscriptions = [];
  }

  mount() {
    this._isAlive = true;

    // Santis Core'daki paymentStatus state'ini dinle
    const unsub = this.engine.subscribe('paymentStatus', (status) => {
      if (!this._isAlive || status !== 'success') return;
      
      // Ödeme başarılıysa, arayüzü manipüle et (Jank-Killer kalkanıyla)
      requestAnimationFrame(() => {
        this.activatePassAnimation();
      });
    });

    this._subscriptions.push(unsub);
  }

  render() {
    // Arayüz iskeletini " Quiet Luxury" tonlarında oluştur.
    // Başlangıçta CSS ile opacity: 0 ve transform: translateY(50px) verilmiştir.
    return `
      <div id="santis-digital-pass" class="santis-digital-pass fixed inset-0 flex items-center justify-center p-6 opacity-0 santis-pass-offset transition-all duration-1000 ease-in-out">
        <div class="santis-pass-card p-12 shadow-2xl max-w-2xl w-full relative overflow-hidden">
          
          <div class="santis-pass-aura absolute -top-40 -left-40 w-96 h-96 opacity-10 rounded-full"></div>
          
          <header class="santis-pass-section-border flex justify-between items-start mb-12 relative z-10 border-b pb-8">
            <div>
              <h1 class="santis-pass-kicker text-xs font-bold uppercase mb-2">Rezervasyon Onayı</h1>
              <p class="santis-pass-title text-5xl font-light tracking-tight">VIP Dijital Bilet</p>
            </div>
            <p class="santis-pass-muted text-right text-xs font-mono">CODE: ${this.engine.getState('visitorId') || 'UNKNWN'}</p>
          </header>

          <main class="grid grid-cols-2 gap-x-12 gap-y-8 mb-12 relative z-10">
            <div>
              <span class="santis-pass-label block uppercase mb-1">HİZMET</span>
              <p class="santis-pass-title text-xl font-light">${this.engine.getState('cartData')?.serviceName || 'Santis Elite Spa'}</p>
            </div>
            <div>
              <span class="santis-pass-label block uppercase mb-1">TARİH & SAAT</span>
              <p class="santis-pass-title text-xl font-light">Gelecekte Belirlenecek</p>
            </div>
          </main>

          <footer class="santis-pass-section-border flex items-center justify-between gap-12 relative z-10 border-t pt-10">
            <div id="reservation-qrcode" class="santis-pass-qr w-32 h-32 p-2 rounded-xl flex items-center justify-center">
              <span class="santis-pass-muted animate-pulse text-xs">QR Yükleniyor...</span>
            </div>
            
            <div class="flex-1 space-y-4">
              <a href="/api/pass/apple/generate" target="_blank" class="block">
                <img src="https://checkout.santisclub.com/assets/img/wallet-apple.svg" alt="Add to Apple Wallet" class="w-full h-auto">
              </a>
              <a href="/api/pass/google/generate" target="_blank" class="block">
                <img src="https://checkout.santisclub.com/assets/img/wallet-google.svg" alt="Add to Google Wallet" class="w-full h-auto">
              </a>
            </div>
          </footer>

        </div>
      </div>
    `;
  }

  activatePassAnimation() {
    const mainViewport = document.getElementById('santis-master-viewport');
    const paymentContainer = document.getElementById('santis-payment-container');

    // 1. Ödeme konteynerini yavaşça sönümlendir (SPA transition)
    if (paymentContainer) {
      paymentContainer.classList.add('opacity-0', 'transition-opacity', 'duration-700');
    }

    // 2. Bilet arayüzünü DOM'a ekle (Render)
    mainViewport.insertAdjacentHTML('beforeend', this.render());

    // 3. Bilet animasyonunu tetikle (Reflow korumasıyla)
    requestAnimationFrame(() => {
      const pass = document.getElementById('santis-digital-pass');
      
      // Önceki element sönümlendikten sonra bileti yükselt
      setTimeout(() => {
        pass.classList.remove('opacity-0', 'santis-pass-offset');
        pass.classList.add('opacity-100', 'translate-y-0');
        this.generateReservationQRCode();
      }, 700);
    });
  }

  generateReservationQRCode() {
    // Gerçek bir QR Code kütüphanesi (Örn: qrcode.js) entegrasyon noktası.
    // Şimdilik sahte bir QR verisiyle simüle ediyoruz.
    const qrcodeContainer = document.getElementById('reservation-qrcode');
    if (!qrcodeContainer) return;

    // Backend'den gelen rezervasyon verisine göre QR kodunu çiz
    // qrcode.toCanvas(qrcodeContainer, `reservation_id_${this.engine.getState('visitorId')}`, function (error) { ... });
    
    // Mock QR Code
    qrcodeContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=reservation_id_${this.engine.getState('visitorId')}" alt="Reservation QR" class="w-full h-full rounded-md shadow-sm">`;
    console.log('🦅 [Santis QR] Rezervasyon QR kodu oluşturuldu.');
  }

  unmount() {
    this._isAlive = false;
    this._subscriptions.forEach(fn => fn());
    this._subscriptions = [];
  }
}
