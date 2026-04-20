/**
 * santis-vocal-scanner.js
 * Ses verilerini analiz eder ve Global bir 'SantisData' nesnesine basar.
 */
window.SantisData = { volume: 0, stress: 0, isActive: false };

window.VocalScanner = {
    audioContext: null,
    analyser: null,
    dataArray: null,

    // Nöro-UI'den (Bio-Handshake) tetiklenir
    async requestAccess() {
        return this.init();
    },

    async init() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = this.audioContext.createMediaStreamSource(stream);
            
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048; // Yüksek çözünürlüklü frekans analizi
            this.analyser.smoothingTimeConstant = 0.8;
            
            source.connect(this.analyser);
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            
            SantisData.isActive = true;
            this.update();
            console.log("Santis Vocal Scanner: Aktif. Biyometrik veri alınıyor...");
        } catch (err) {
            console.error("Mikrofon erişimi engellendi. UHNWI protokolü iptal:", err);
            // Güvenlik uyarısı UI
            const btn = document.getElementById('init-btn');
            if(btn) {
                btn.style.display = 'block';
                btn.innerHTML = 'ACCESS DENIED';
                btn.style.color = 'red';
                btn.style.borderColor = 'red';
            }
        }
    },

    update() {
        if (!SantisData.isActive) return;
        requestAnimationFrame(() => this.update());

        this.analyser.getByteFrequencyData(this.dataArray);

        // 1. Volume (RMS Genliği) hesaplama
        let values = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            values += this.dataArray[i];
        }
        SantisData.volume = values / this.dataArray.length;

        // 2. Stress (Pitch Jitter / High-Freq Noise) hesaplama
        // Yüksek frekanslardaki (stres emaresi) ani değişimleri yakalar
        let highFreqSum = 0;
        const startBin = Math.floor(this.dataArray.length * 0.6); // Üst %40'lık frekans bandı
        for (let i = startBin; i < this.dataArray.length; i++) {
            highFreqSum += this.dataArray[i];
        }
        // Normalize edilmiş stres puanı (Hücresel Hasar Çarpanı)
        SantisData.stress = (highFreqSum / (this.dataArray.length - startBin)) / 128;
    }
};
