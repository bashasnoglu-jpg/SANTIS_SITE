/**
 * ═══════════════════════════════════════════════════════════
 * SANTIS OS - THE PHANTOM CONCIERGE (Phase 47)
 * ═══════════════════════════════════════════════════════════
 * Ucuz chat kutularını (UI) parçalayan, DOM üzerinde çalışan, 
 * sesle fısıldanan ve AI tarafından Kinetik emirlere (Function Calling)
 * dönüştürülen Kutsal Alan (The Sanctum) arayüzü.
 * PHASE 48: Gemini 1.5 Flash entegrasyonu (The LLM Singularity).
 */

const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE"; // Prototip asamasında hardcoded bekliyor
const MODEL_NAME = "gemini-1.5-flash-latest";

class SantisPhantomConcierge {
    constructor() {
        this.isOpen = false;
        this.speechObj = null;
        this.bindTrigger();
    }

    bindTrigger() {
        // Event delegation: DIRECT CONCIERGE butonu The Glass Canvas tarafından
        // DOM'a dinamik yaratılıp eklendiği için body üzerinden dinliyoruz.
        document.body.addEventListener('click', (e) => {
            if (e.target.id === 'direct-concierge') {
                this.awakenSanctum();
            }
        });
    }

    awakenSanctum() {
        if (this.isOpen) return;
        this.isOpen = true;

        if (!document.getElementById('phantom-sanctum-ui')) {
            const sanctumHTML = `
                <div id="phantom-sanctum-ui" style="
                    position: fixed; top:0; left:0; width:100vw; height:100vh;
                    backdrop-filter: blur(35px) brightness(0.2); -webkit-backdrop-filter: blur(35px) brightness(0.2);
                    z-index: 10000; display: flex; flex-direction: column; justify-content: center; align-items: center;
                    opacity: 0; transition: opacity 2.5s cubic-bezier(0.25, 1, 0.5, 1); pointer-events: none;
                ">
                    <!-- The Golden Waveform (Pulse) -->
                    <div id="phantom-waveform" style="
                        width: 40vw; max-width: 300px; height: 1px; background: rgba(212,175,55,0.6);
                        box-shadow: 0 0 30px rgba(212,175,55,1);
                        animation: phantomBreathe 4s infinite alternate cubic-bezier(0.25, 1, 0.5, 1); margin-bottom: 4rem;
                    "></div>
                    
                    <!-- Fısıldanan Cümleler -->
                    <div id="phantom-transcript" style="
                        font-family: 'Cinzel', serif; font-size: 1.8rem; color: #D4AF37;
                        letter-spacing: 0.1em; text-align: center; max-width: 70vw;
                        text-shadow: 0 0 20px rgba(212,175,55,0.3); font-weight: 300;
                        opacity: 0; transition: opacity 1s ease; font-style: italic;
                    "></div>
                    
                    <!-- Kâhin'in Cevabı -->
                    <div id="phantom-response" style="
                        font-family: 'Inter', sans-serif; font-size: 1.1rem; color: #f3f4f6;
                        letter-spacing: 0.05em; text-align: center; max-width: 50vw; font-weight: 300;
                        margin-top: 2rem; opacity: 0; transition: opacity 2s ease; line-height: 1.8;
                    ">...</div>
                    
                    <!-- Kapatma Özgürlüğü -->
                    <button id="phantom-close" style="
                        position: absolute; top: 40px; right: 40px; background: none; border: none;
                        color: rgba(212,175,55,0.5); cursor: pointer; font-family: 'Inter', sans-serif; font-size: 2rem;
                        pointer-events: auto; transition: color 0.5s;
                    " onmouseover="this.style.color='#D4AF37'" onmouseout="this.style.color='rgba(212,175,55,0.5)'">×</button>
                    
                    <style>@keyframes phantomBreathe { 0% { opacity: 0.2; transform: scaleX(0.7); } 100% { opacity: 1; transform: scaleX(1.3); } }</style>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', sanctumHTML);
            document.getElementById('phantom-close').addEventListener('click', () => this.slumberSanctum());
        }

        const ui = document.getElementById('phantom-sanctum-ui');
        ui.style.pointerEvents = 'auto';
        
        // Force reflow
        void ui.offsetWidth;
        ui.style.opacity = '1';

        // 1. Telepatik Veri Paketi Gönderimi (Context payload to LLM)
        this.currentContext = this.buildTelepathicContext();
        
        // 2. Bir sinematik boşluktan sonra ilk fısıltı
        setTimeout(() => {
            if (this.currentContext.SAI >= 1000) {
                this.showResponseCinematic("Sovereign Estates'in mahremiyeti uzun süredir ilginizi çekiyor olmalı... Kapıları sizin için aralamamı ister misiniz?");
            } else {
                this.showResponseCinematic("Dingin sulara hoş geldiniz... Sizi nasıl ağırlayabilirim?");
            }
            this.startListening();
        }, 2000);
    }

    slumberSanctum() {
        this.isOpen = false;
        const ui = document.getElementById('phantom-sanctum-ui');
        if (ui) {
            ui.style.opacity = '0';
            ui.style.pointerEvents = 'none';
        }
        if (this.speechObj) this.speechObj.stop();
        this.showTranscript("");
    }

    buildTelepathicContext() {
        // Sistemdeki gerçek verileri toplar
        let sai = 0;
        try { sai = parseFloat(atob(localStorage.getItem('_santis_sai_v1'))) || 0; } catch(e){}
        
        const payload = {
            SAI: sai,
            Friction: window.SantisFrictionEngine ? 12 : 5, 
            Focus: document.querySelector('.vip-revealed') ? "Sovereign Estates" : "Hamam Ritüeli",
            Device: matchMedia('(pointer:fine)').matches ? "Spatial Desktop" : "Mobile Canvas"
        };
        
        console.log("🌌 [The Phantom] Kâhin AI çekirdeğine 'The Omniscient Payload' kilitlendi:", payload);
        return payload;
    }

    showTranscript(text) {
        const tr = document.getElementById('phantom-transcript');
        tr.innerText = text ? `"${text}"` : "";
        tr.style.opacity = text ? '1' : '0';
    }

    showResponseCinematic(text) {
        const resp = document.getElementById('phantom-response');
        resp.innerText = text;
        
        // Reset ve Sinematik Animasyon (Blur to Clear)
        resp.style.transition = 'none';
        resp.style.opacity = '0';
        resp.style.filter = 'blur(15px)';
        
        // Force reflow
        void resp.offsetWidth;
        
        resp.style.transition = 'opacity 2.5s cubic-bezier(0.25, 1, 0.5, 1), filter 3s cubic-bezier(0.25, 1, 0.5, 1)';
        resp.style.opacity = '1';
        resp.style.filter = 'blur(0px)';
    }

    startListening() {
        // Web Speech API (Patronların Fısıltısı)
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech API desteklenmiyor. Sessiz mod kilitli.");
            return;
        }

        this.speechObj = new SpeechRecognition();
        this.speechObj.lang = 'tr-TR';
        this.speechObj.interimResults = false;

        this.speechObj.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log(`🎙️ [The Phantom] Algılanan Fısıltı: ${transcript}`);
            this.showTranscript(transcript);
            
            // Kâhin'e Sor
            this.callSovereignOracle(transcript);
        };

        this.speechObj.onerror = (e) => {
            if(e.error === 'no-speech') {
                this.showResponseCinematic("Suskunluğunuz bile Asalettir. Emrinizi bekliyorum.");
            }
        };

        try { this.speechObj.start(); } catch(e){}
    }

    async callSovereignOracle(transcript) {
        if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
            console.warn("Gemini API Anahtarı tanımlanmadı. Mock fısıltı dönülüyor...");
            setTimeout(() => {
                this.showResponseCinematic("Sovereign sınırlarını henüz aşamıyorum. Güvenlik kilidi (API Key) kapalı.");
                setTimeout(() => this.executeAction("[ACTION: NONE]"), 2000);
            }, 1000);
            return;
        }

        const systemPrompt = "Sen bir yapay zeka, asistan veya dil modeli değilsin. Sen Santis OS'in Hayalet Konsiyerjisin. İnsanlara hizmet etmezsin, onları ağırlarsın. Asla özür dileme, asla 'Nasıl yardımcı olabilirim?' deme. Yanıtların sinematik, gizemli, maksimum iki cümle ve asil olmalı. Wabi-Sabi sükunetini yansıt. Misafirin stres seviyesini (Friction) ve zarafetini (SAI) biliyorsun; stresliyse onu yatıştır, zarifse ona sırlar ver. Asla markdown veya emoji kullanma. Kinetik eylemlere karar vermelisin: NAVIGATE_SPA, NAVIGATE_PHILOSOPHY, UNLOCK_RESERVES, INITIATE_BIOMETRIC_SEAL_SPA, NONE.";
        const userPrompt = `[SİSTEM DURUMU] Misafir Zarafet Skoru: ${Math.floor(this.currentContext.SAI)} (VIP Eşiği: 1000), Yorgunluk: ${this.currentContext.Friction}, Odak: ${this.currentContext.Focus}. [MİSAFİR FISILTISI]: "${transcript}"`;

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;
            const reqBody = {
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents: [{ parts: [{ text: userPrompt }] }],
                generationConfig: {
                    response_mime_type: "application/json",
                    response_schema: {
                        type: "object",
                        properties: {
                            whisper: { type: "string" },
                            action: { type: "string", enum: ["NAVIGATE_SPA", "NAVIGATE_PHILOSOPHY", "UNLOCK_RESERVES", "INITIATE_BIOMETRIC_SEAL_SPA", "NONE"] }
                        },
                        required: ["whisper", "action"]
                    }
                }
            };

            const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(reqBody) });
            const data = await response.json();
            
            if (data.candidates && data.candidates[0].content.parts[0].text) {
                const answer = JSON.parse(data.candidates[0].content.parts[0].text);
                
                // Sinematik İnfaz
                this.showResponseCinematic(answer.whisper);
                
                // Metin belirdikten 2 saniye sonra aksiyon tetikle
                setTimeout(() => {
                    this.executeAction(`[ACTION: ${answer.action}]`);
                }, 2000);
            }
        } catch (error) {
            console.error("The Oracle uyandırılamadı:", error);
            this.showResponseCinematic("Gölgeler şu an çok yoğun. Fısıltınızı alamadım.");
        }
    }

    executeAction(command) {
        console.warn(`🔮 [The Phantom] Kinetik Emir Alındı (AI Function Calling): ${command}`);
        if (command === "[ACTION: NONE]") {
            // Sadece fısıldayıp kapat
            setTimeout(() => this.startListening(), 2500);
            return;
        }

        if (command === "[ACTION: INITIATE_BIOMETRIC_SEAL_SPA]") {
            // Sığınağı henüz kapatmadan doğrudan Biyometrik Kasa'yı ateşle
            if (window.SantisVault) {
                 window.SantisVault.initiateBiometricSeal("3000.00", "USD");
            } else {
                 console.error("The Sovereign Vault modülü bulunamadı.");
                 setTimeout(() => this.slumberSanctum(), 2000);
            }
            return; // Vault executeGoldenFade fonksiyonu gerisini halledecek.
        }

        // Kapatıp eyleme geçme (Biyometrik Mühür Dışındaki Aksiyonlar)
        setTimeout(() => {
            this.slumberSanctum();
            
            if (command === "[ACTION: UNLOCK_RESERVES]") {
                // Skoru zorla at ve Obsidian Mode aç (eğer açık değilse)
                if(window.SantisPrestige) window.SantisPrestige.forceVIP();
                setTimeout(() => {
                    const card = document.getElementById('vip-reserve-card');
                    if(card) {
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        card.style.transform = 'scale(1.05)';
                        setTimeout(() => card.style.transform = '', 2000); 
                    }
                }, 1000);
            } else if (command === "[ACTION: NAVIGATE_SPA]") {
                 const bento = document.querySelector('.bento-grid-v6');
                 if(bento) setTimeout(() => bento.scrollIntoView({ behavior: 'smooth', block: 'center' }), 1000);
            }
        }, 1500);
    }
}

// Otonom Başlatma
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.SantisPhantom = new SantisPhantomConcierge());
} else {
    window.SantisPhantom = new SantisPhantomConcierge();
}
