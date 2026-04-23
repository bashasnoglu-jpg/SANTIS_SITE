import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, Sparkles, Wind, Droplets, 
  Flame, Flower2, Waves, Brain, ShieldAlert,
  Coffee, Leaf, Bath, MapPin, Phone, Clock, Activity, Heart, CheckCircle2,
  AlertCircle, Zap, ArrowDownCircle, Fingerprint, Crown, Globe, Menu, X, Bot
} from 'lucide-react';
import { SovereignBookingFlow } from '../components/dashboard/SovereignBookingFlow';

// --- DATA STRUCTURES --- //
const articles = [
  {
    id: 'thai',
    title: "Thai Felsefesi: Pasif Yoga ve Enerji",
    kicker: "Geleneksel Şifa Dokunuşları",
    content: "Geleneksel Thai Masajı (Nuad Phaen Boran), 2500 yıllık bir geçmişe sahiptir. Buda'nın doktoru Dr. Jivaka tarafından geliştirilen bu sanat, bedeni 'Sen' adı verilen enerji hatları üzerinden iyileştirir. Sadece kasları değil, fasyayı açar ve iç organları uyarır.",
    image: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=1000",
    icon: Wind
  },
  {
    id: 'hamam',
    title: "Hamam: Osmanlı'nın Arınma Mirası",
    kicker: "Göbek Taşı Ritüelleri",
    content: "Sıcak mermer (Nabelstein) üzerinde gözeneklerin açılmasıyla başlayan bu yolculuk, Sisal veya Ham İpek keselerle ölü derinin atılmasıyla devam eder. Sabun-fırça masajı cilde pembe bir ışıltı kazandırırken ruhu sakinleştirir.",
    image: "https://images.unsplash.com/photo-1583416750470-965b2707b355?auto=format&fit=crop&q=80&w=1000",
    icon: Bath
  },
  {
    id: 'chocolate',
    title: "Sıcak Çikolata: Kalorisiz Şımartma",
    kicker: "Duyusal Gurme Spa",
    content: "Kakaodaki Teobromin mucizesi, endorfin salgılatarak modunuzu yükseltir. Shea ve Badem yağı ile harmanlanan sıcak kakao masajı, cildi serbest radikallere karşı korur ve derinlemesine nemlendirir.",
    image: "https://images.unsplash.com/photo-1543364102-1811650b2ed6?auto=format&fit=crop&q=80&w=1000",
    icon: Coffee
  }
];

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""; 

// LLM Integration with Exponential Backoff
async function callGeminiWellnessAI(userInput) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: userInput }] }],
    systemInstruction: {
      parts: [{
        text: "Sen elit ve lüks bir spa merkezi olan Santis'te empatik bir wellness uzmanı ve doktorsun. Kullanıcının fiziksel veya zihinsel şikayetlerini analiz et. Özel bir masaj/spa ritüeli reçete et. SADECE aşağıdaki yapıda bir JSON objesi döndür:\n{\n  \"diagnosis\": \"Kullanıcının durumunu empatik ve profesyonel bir dille açıklayan 2-3 cümlelik teşhis.\",\n  \"ritual\": {\n    \"name\": \"Önerilen Ritüelin Havalı İsmi\",\n    \"price\": 120,\n    \"duration\": \"60 dk\"\n  },\n  \"addons\": [\"Sıcak Taş\", \"Aromaterapi\", \"Saç Derisi Masajı\" vb. gibi 2-3 önerilen ek terapi]\n}"
      }]
    },
    generationConfig: { 
      responseMimeType: "application/json"
    }
  };

  let retries = 5;
  let delay = 1000;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return JSON.parse(textResponse);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
    }
  }
}

// --- COMPONENTS --- //
const MenuItem = ({ name, desc, time, price, dark = false }) => (
  <li className="flex flex-col md:flex-row md:items-end justify-between mb-6 group border-b border-white/5 pb-4">
    <div className="flex-1 pr-4">
      <span className={`font-serif text-lg transition-colors duration-300 ${dark ? 'text-white' : 'text-slate-800'}`}>
        {name}
      </span>
      {desc && <p className={`text-xs font-light mt-1 ${dark ? 'text-white/40' : 'text-slate-500'}`}>{desc}</p>}
    </div>
    <div className="flex gap-4 items-baseline mt-2 md:mt-0">
      <span className="text-2xs tracking-widest uppercase text-slate-500">{time}</span>
      <span className={`font-serif text-lg ${dark ? 'text-sovereign-gold' : 'text-slate-900'}`}>{price}</span>
    </div>
  </li>
);

export default function Concierge() {
  const [activeTab, setActiveTab] = useState('magazine'); // magazine, concierge, menu
  const [scrolled, setScrolled] = useState(false);
  
  // AI State
  const [step, setStep] = useState(1);
  const [aiInput, setAiInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeDiagnosis, setActiveDiagnosis] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAnalysis = async () => {
    if (!aiInput.trim()) return;
    setIsAnalyzing(true);
    setStep(2);
    
    try {
      const aiResult = await callGeminiWellnessAI(aiInput);
      setActiveDiagnosis(aiResult);
    } catch {
      // Fallback in case of API limits or errors
      setActiveDiagnosis({
        diagnosis: "Şu an sistemsel bir yoğunluk yaşıyoruz, ancak anlattıklarınızdan yola çıkarak bedeninizi ve zihninizi dengeleyecek mükemmel bir önerimiz var.",
        ritual: { name: "Santis Signature Recovery", price: 130, duration: "60 dk" },
        addons: ["Aromaterapi", "Sıcak Taş"]
      });
    } finally {
      setIsAnalyzing(false);
      setStep(3);
    }
  };

  return (
    <div className="min-h-screen bg-sovereign-black text-slate-300 font-sans selection:bg-sovereign-gold selection:text-black">
      
      {/* NAVIGATION */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-black/90 backdrop-blur-md py-4' : 'bg-transparent py-8'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="text-2xl font-serif tracking-[0.3em] text-white uppercase">SANTIS</div>
          <div className="hidden md:flex gap-8 text-2xs tracking-[0.2em] font-bold uppercase">
            <button onClick={() => setActiveTab('magazine')} className={`hover:text-sovereign-gold ${activeTab === 'magazine' ? 'text-sovereign-gold' : ''}`}>Dergi</button>
            <button onClick={() => setActiveTab('concierge')} className={`hover:text-sovereign-gold ${activeTab === 'concierge' ? 'text-sovereign-gold' : ''}`}>AI Concierge</button>
            <button onClick={() => setActiveTab('menu')} className={`hover:text-sovereign-gold ${activeTab === 'menu' ? 'text-sovereign-gold' : ''}`}>Menü</button>
          </div>
          <button className="md:hidden text-white"><Menu /></button>
        </div>
      </nav>

      {/* HERO */}
      <header className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <img src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=2000" className="absolute inset-0 w-full h-full object-cover opacity-50" alt="Hero" />
        <div className="relative z-10 text-center px-6">
          <p className="text-sovereign-gold text-2xs tracking-[0.5em] uppercase font-bold mb-4">The Global Massage Atlas</p>
          <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 uppercase tracking-tighter">Dokunuşun Sanatı</h1>
          <div className="flex justify-center gap-4">
             <button onClick={() => setActiveTab('concierge')} className="bg-sovereign-gold text-black px-8 py-3 text-2xs font-bold uppercase tracking-widest hover:bg-white transition-all">Sistemi Başlat</button>
          </div>
        </div>
      </header>

      {/* DYNAMİC CONTENT SWITCHER */}
      <main>
        
        {/* TAB 1: MAGAZINE EDITORIAL */}
        {activeTab === 'magazine' && (
          <section className="py-24 px-6 animate-in fade-in duration-700">
            <div className="max-w-5xl mx-auto space-y-32">
              {articles.map((art, idx) => (
                <div key={art.id} className={`flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-16 items-center`}>
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-3 text-sovereign-gold">
                      <art.icon size={20} />
                      <span className="text-2xs tracking-[0.3em] font-bold uppercase">{art.kicker}</span>
                    </div>
                    <h2 className="text-4xl font-serif text-white">{art.title}</h2>
                    <p className="text-slate-400 font-light leading-relaxed text-lg">{art.content}</p>
                    <button className="text-sovereign-gold text-2xs font-bold uppercase tracking-widest border-b border-sovereign-gold pb-1 hover:text-white hover:border-white transition-all">Devamını Oku</button>
                  </div>
                  <div className="flex-1 w-full">
                    <img src={art.image} className="w-full h-[500px] object-cover rounded-sm shadow-2xl grayscale-[30%] hover:grayscale-0 transition-all duration-700" alt={art.title} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 2: AI CONCIERGE (SANTIS OS) */}
        {activeTab === 'concierge' && (
          <section className="py-24 px-6 max-w-3xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
             {step === 1 && (
               <div className="bg-white/5 border border-white/10 p-12 rounded-2xl backdrop-blur-xl">
                 <div className="text-center mb-10">
                   <Bot className="mx-auto mb-4 text-sovereign-gold" size={48} />
                   <h2 className="text-3xl font-serif text-white mb-2">Size nasıl yardımcı olabiliriz?</h2>
                   <p className="text-slate-500 font-light text-sm">Bedeninizin veya zihninizin problemini kısaca anlatın.</p>
                 </div>
                 <textarea 
                   value={aiInput}
                   onChange={(e) => setAiInput(e.target.value)}
                   className="w-full bg-black/50 border border-white/10 rounded-xl p-6 h-40 text-white focus:border-sovereign-gold outline-none transition-all resize-none text-lg"
                   placeholder="Örn: Boynum kilitlendi, çok stresliyim..."
                 />
                 <button 
                   onClick={() => handleAnalysis()}
                   disabled={isAnalyzing}
                   className="w-full mt-6 bg-sovereign-gold text-black py-5 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-white transition-all shadow-xl shadow-[#c6a96b]/10 disabled:opacity-50"
                 >
                   ✨ AI Teşhisi ve Reçete Oluştur ✨
                 </button>
               </div>
             )}

             {step === 2 && (
               <div className="py-32 text-center space-y-8">
                 <Activity className="mx-auto text-sovereign-gold animate-pulse" size={64} />
                 <p className="text-2xl font-serif text-white animate-pulse">Santis AI zihinsel ve fiziksel yükünüzü analiz ediyor...</p>
               </div>
             )}

             {step === 3 && activeDiagnosis && (
               <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95">
                 <div className="bg-sovereign-gold p-10 text-black">
                    <p className="text-2xs font-black tracking-widest uppercase opacity-60 mb-2">✨ Yapay Zeka Klinik Analiz Sonucu</p>
                    <h2 className="text-3xl font-serif leading-snug">"{activeDiagnosis.diagnosis}"</h2>
                 </div>
                 <div className="p-10 space-y-8">
                    <div>
                      <h3 className="text-2xs font-bold text-sovereign-gold tracking-widest uppercase mb-4">Önerilen Reset Ritüeli</h3>
                      <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <div>
                          <span className="block text-2xl font-serif text-white">{activeDiagnosis.ritual.name}</span>
                          <span className="text-sm text-slate-400 font-light mt-1 block">{activeDiagnosis.ritual.duration}</span>
                        </div>
                        <span className="text-3xl font-serif text-white">{activeDiagnosis.ritual.price}€</span>
                      </div>
                    </div>
                    {activeDiagnosis.addons && activeDiagnosis.addons.length > 0 && (
                      <div>
                        <h3 className="text-2xs font-bold text-sovereign-gold tracking-widest uppercase mb-3">Tavsiye Edilen Eklemeler</h3>
                        <div className="flex flex-wrap gap-2">
                          {activeDiagnosis.addons.map((addon, idx) => (
                            <span key={idx} className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-sm text-slate-300">
                              + {addon}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <button onClick={() => setStep(1)} className="w-full bg-white text-black py-4 rounded-xl font-bold uppercase tracking-widest text-2xs hover:bg-sovereign-gold transition-colors">Yeniden Analiz Et</button>
                 </div>
               </div>
             )}
          </section>
        )}

        {/* TAB 3: FULL MENU (PRICING) */}
        {activeTab === 'menu' && (
          <section className="py-24 px-6 max-w-5xl mx-auto animate-in fade-in duration-700">
             <div className="text-center mb-16">
               <Crown className="mx-auto mb-4 text-sovereign-gold" size={32} />
               <h2 className="text-4xl font-serif text-white">Sovereign Live Booking</h2>
               <p className="text-slate-500 text-2xs tracking-[0.3em] uppercase mt-2">Telemetry Powered Live Gateway</p>
             </div>

             <SovereignBookingFlow />
          </section>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-black py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
           <div className="text-center md:text-left">
             <h4 className="font-serif text-white text-xl mb-4">Santis Budva</h4>
             <p className="text-slate-500 text-sm font-light">Iberostar Waves Slavija, 7th Floor</p>
             <p className="text-slate-500 text-sm font-light">+382 68 543 237</p>
           </div>
           <div className="text-center">
             <div className="text-2xl font-serif text-sovereign-gold uppercase tracking-[0.4em]">Santis</div>
             <p className="text-2xs text-slate-600 tracking-widest mt-2 uppercase">Human Reset OS</p>
           </div>
           <div className="flex justify-center md:justify-end gap-6">
              <span className="text-2xs font-bold text-slate-500 tracking-widest uppercase">Sauna</span>
              <span className="text-2xs font-bold text-slate-500 tracking-widest uppercase">Steam</span>
              <span className="text-2xs font-bold text-slate-500 tracking-widest uppercase">Fitness</span>
           </div>
        </div>
      </footer>

    </div>
  );
}
