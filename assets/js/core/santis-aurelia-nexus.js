/**
 * SANTIS OS - AURELIA NEURAL NEXUS [PHASE 38]
 * Zero-UI Booking, STT/TTS Integration & Sentient Voice Assistant
 * Architect: Hakan
 */

class SantisAureliaNexus {
    constructor() {
        this.synth = window.speechSynthesis;
        this.recognition = null;
        this.isListening = false;
        
        this.initTelepathicEar();
        this.listenToMatrix();
        
        // Ses telleri işletim sisteminden yüklenene kadar bekle
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => console.log("🦋 [Aurelia] Ses telleri Kuantum frekansına akort edildi.");
        }
    }

    // 1. DİNLEME MOTORU (Mikrofon Donanımı)
    initTelepathicEar() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("📍 [Aurelia Nexus] Tarayıcı donanımsal dinlemeyi desteklemiyor. Sentetik sessizlik devrede.");
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
            this.isListening = true;
            document.body.classList.add('santis-aurelia-listening'); // Vanta Gold Görsel Nabız
            if (navigator.vibrate) navigator.vibrate([30, 50, 30]); // Hazır ol titreşimi
            console.log("🎙️ [Aurelia] Kuantum Kulak Açıldı. Dinliyorum...");
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            console.log(`🧠 [Misafir Niyeti]: "${transcript}"`);
            this.processIntent(transcript); // Sesi metne çevir ve Niyet Okuyucuya at
        };

        this.recognition.onerror = (event) => {
            console.error("🚨 [Aurelia] İşitme Anomalisi:", event.error);
            this.stopListening();
        };

        this.recognition.onend = () => this.stopListening();
    }

    // 2. MERKEZİ SİNİR SİSTEMİ (EventBus Bağlantısı)
    listenToMatrix() {
        if (!window.SantisEventBus) return;

        // Dışarıdan gelen konuşma emirleri
        window.SantisEventBus.on('aurelia:speak', (text) => this.speak(text));

        // 🚨 OMNIVERSE UYUMU: Misafir HTML'de dili değiştirdiği an, Aurelia'nın beynini anında çevir!
        window.SantisEventBus.on('omniverse:language_shifted', (newLang) => {
            if(this.recognition) {
                this.recognition.lang = newLang === 'tr' ? 'tr-TR' : 'en-US';
            }
        });

        // 🚨 STRES MOTORU UYUMU (Phase 33): Misafir faresini titrettiğinde OTONOM ŞİFA!
        window.SantisEventBus.on('friction:critical', () => {
            const lang = document.documentElement.lang || 'tr';
            const healingText = lang === 'tr' 
                ? "Zihninizin yorulduğunu hissediyorum. Ritüelinizi sizin için mühürlememi ister misiniz? Sadece evet demeniz yeterli." 
                : "I sense your mind is tired. Would you like me to seal your ritual for you? Just say yes.";
            
            this.speak(healingText);
            
            // Soru bittikten sonra cevabı dinlemek için mikrofonu otonom aç!
            setTimeout(() => this.startListening(), healingText.length * 90);
        });
    }

    // 3. KONUŞMA MOTORU (Fısıltı Sentezi)
    speak(text) {
        if (this.synth.speaking) this.synth.cancel(); // Önceki fısıltıyı pürüzsüzce kes

        const currentLang = document.documentElement.lang === 'en' ? 'en-US' : 'tr-TR';
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Sovereign Ses Ayarları (Sessiz Lüks)
        utterance.lang = currentLang;
        utterance.rate = 0.85;  // Biraz yavaş ve tane tane (Dinginlik)
        utterance.pitch = 0.9;  // Biraz daha derin, loş bir ton
        
        // Tarayıcıdaki en asil kadın sesini bul
        const voices = this.synth.getVoices();
        const premiumVoice = voices.find(v => v.lang.includes(currentLang) && (v.name.includes('Female') || v.name.includes('Yelda') || v.name.includes('Samantha'))) || voices.find(v => v.lang.includes(currentLang));
        if (premiumVoice) utterance.voice = premiumVoice;

        utterance.onstart = () => {
            document.body.classList.add('santis-aurelia-speaking'); // Vanta Gold Parlama
            if (window.SantisEventBus) window.SantisEventBus.emit('audio:duck_volume'); // Varsa arkaplan müziğini kıs
        };

        utterance.onend = () => {
            document.body.classList.remove('santis-aurelia-speaking');
            if (window.SantisEventBus) window.SantisEventBus.emit('audio:restore_volume');
        };

        try {
            this.synth.speak(utterance);
        } catch (error) {
            console.warn("Aurelia susturuldu. Ses motoru ilk tıklamayı bekliyor.");
        }
    }

    startListening() {
        if (this.recognition && !this.isListening) {
            const currentLang = document.documentElement.lang === 'en' ? 'en-US' : 'tr-TR';
            this.recognition.lang = currentLang;
            try { this.recognition.start(); } catch(e) {}
        }
    }

    stopListening() {
        this.isListening = false;
        document.body.classList.remove('santis-aurelia-listening');
    }

    // 4. NİYET OKUYUCU (Zero-UI Booking'i Tetikler)
    processIntent(transcript) {
        const lang = document.documentElement.lang;
        
        // Doğal Dil İşleme (NLP) Kelime Havuzu
        const confirmWords = lang === 'tr' ? ['evet', 'onaylıyorum', 'mühürle', 'istiyorum'] : ['yes', 'confirm', 'seal', 'book'];
        const rejectWords = lang === 'tr' ? ['hayır', 'istemiyorum', 'kapat'] : ['no', 'cancel', 'close'];
        
        const isConfirmed = confirmWords.some(word => transcript.includes(word));
        const isRejected = rejectWords.some(word => transcript.includes(word));

        if (isConfirmed) {
            this.speak(lang === 'tr' 
                ? "Niyetiniz algılandı. Biyometrik kilidinizi açıyorum." 
                : "Intent recognized. Opening your biometric seal.");
                
            // 🚨 DOĞRUDAN PHASE 35 (WebAuthn) KUANTUM KİLİDİNİ ATEŞLE! Hiçbir forma gerek yok!
            setTimeout(() => {
                if (window.SantisSealCore) window.SantisSealCore.initiateRitual({title: "Sesli Otonom Rezervasyon", price: 0});
            }, 3000);
            
        } else if (isRejected) {
             this.speak(lang === 'tr' ? "Nasıl isterseniz. Buradayım." : "As you wish. I am here.");
        } else {
             this.speak(lang === 'tr' ? "Sizi tam anlayamadım, niyetinizi tekrar fısıldar mısınız?" : "I didn't quite catch that, could you whisper your intent again?");
             setTimeout(() => this.startListening(), 4000); // Tekrar dinle
        }
    }
}

// OS Boot Sequence - Güvenlik Kilidini Aşma
function initAureliaNexus() {
    const unlockAudio = () => {
        const u = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(u);
        window.AureliaCore = new SantisAureliaNexus();
        document.removeEventListener('click', unlockAudio);
        console.log("🔓 [Aurelia AI] Ses motoru donanım kilidi kırıldı.");
    };
    document.addEventListener('click', unlockAudio);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAureliaNexus);
} else {
    initAureliaNexus();
}
