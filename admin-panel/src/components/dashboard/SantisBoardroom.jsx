import React, { useState, useEffect } from 'react';
import { Eye, Brain, Split, Headset, Filter, TrendingUp, Activity, Bell, ChevronRight, LayoutDashboard, Settings, LogOut } from 'lucide-react';
import GhostDrawer from './GhostDrawer';

// ============================================================================
// DUMMY DATA FOR TELEMETRY
// ============================================================================
const liveEvents = [
  "Bunalmış (Overwhelmed) durumu tetiklendi: Hammam Rituals",
  "Concierge WhatsApp yönlendirmesi başarılı.",
  "Yeni Journey Onaylandı: 240 € (Sovereign Thai + Tea)",
  "Kullanıcı Sepeti Terk Etti: Misafir Detayları Adımı",
  "Analitik durum tespiti yapıldı: Face Care",
];

export default function SantisBoardroom() {
  const [timeRange, setTimeRange] = useState('Bu Hafta');
  const [liveEventIndex, setLiveEventIndex] = useState(0);

  // Sovereign Ghost Operations State
  const [anomalies, setAnomalies] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [latestRisk, setLatestRisk] = useState(0);
  const [hasUnreadPulse, setHasUnreadPulse] = useState(false);

  // Canlı Telemetri Ticker Simülasyonu
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveEventIndex((prev) => (prev + 1) % liveEvents.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // 1. STATE İZOLASYONU (Cold Boot): Sayfa açıldığında Ring Buffer'ı çek
  useEffect(() => {
    fetch('http://localhost:4040/api/v1/telemetry/recent')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data.length > 0) {
          setAnomalies(json.data);
          const lastRisk = parseFloat(json.data[json.data.length - 1].riskDelta);
          setLatestRisk(isNaN(lastRisk) ? 0 : lastRisk);
        }
      })
      .catch(err => console.error("Sovereign Kalkanı: Geçmiş veriler alınamadı", err));
  }, []);

  // 2. CANLI AKIŞ: WebSocket Entegrasyonu (Exponential Backoff + Jitter)
  useEffect(() => {
    let ws;
    let reconnectTimeout;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_DELAY = 30000;

    const connectWebSocket = () => {
      ws = new WebSocket('ws://localhost:4040');

      ws.onopen = () => {
        reconnectAttempts = 0;
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'EVENT' && payload.payload?.action === 'STATUS_UPDATE') {
            const newAnomaly = payload.payload.data;
            
            setAnomalies(prev => {
              const updated = [...prev, newAnomaly];
              return updated.length > 50 ? updated.slice(updated.length - 50) : updated;
            });
            
            const newRisk = parseFloat(newAnomaly.riskDelta);
            if (!isNaN(newRisk)) {
              setLatestRisk(newRisk);
              if (!isDrawerOpen && newRisk > 0.5) {
                setHasUnreadPulse(true);
              }
            }
          }
        } catch (err) {}
      };

      ws.onclose = () => {
        const baseDelay = Math.min(1000 * (2 ** reconnectAttempts), MAX_RECONNECT_DELAY);
        const jitter = Math.random() * 500; 
        const totalDelay = baseDelay + jitter;
        reconnectTimeout = setTimeout(() => {
          reconnectAttempts++;
          connectWebSocket();
        }, totalDelay);
      };
    };

    connectWebSocket();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [isDrawerOpen]);

  // 3. CINEMATIC RITUAL: Risk > 0.5 ise tüm ekran derinleşir
  useEffect(() => {
    if (latestRisk > 0.5) {
      document.body.classList.add('cinematic-ritual');
    } else {
      document.body.classList.remove('cinematic-ritual');
    }
    return () => document.body.classList.remove('cinematic-ritual');
  }, [latestRisk]);

  const handleOpenDrawer = () => {
    setIsDrawerOpen(true);
    setHasUnreadPulse(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0908] text-[#E5E0D8] font-sans flex selection:bg-[#C2A878]/30 selection:text-[#E5E0D8]">
      
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,500;1,400&family=Inter:wght@300;400;500;600&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />

      {/* ========================================================= */}
      {/* SOL MENÜ (SIDEBAR)                                         */}
      {/* ========================================================= */}
      <aside className="w-64 bg-[#141211] border-r border-[#2A2624] hidden lg:flex flex-col">
        <div className="h-24 flex items-center justify-center border-b border-[#2A2624]">
          <h1 className="text-xl tracking-[0.3em] font-light text-[#E5E0D8]">SANTIS</h1>
        </div>
        
        <div className="p-6">
          <div className="text-[#6E5946] text-[10px] uppercase tracking-widest mb-4">Boardroom OS</div>
          <nav className="space-y-2">
            <button className="w-full flex items-center gap-3 bg-[#1A1817] border border-[#C2A878]/30 text-[#C2A878] px-4 py-3 rounded-sm text-sm transition-colors">
              <LayoutDashboard className="w-4 h-4" /> Telemetri Özeti
            </button>
            <button className="w-full flex items-center gap-3 bg-transparent border border-transparent hover:bg-[#1A1817] hover:border-[#2A2624] text-[#B7ADA1] hover:text-[#E5E0D8] px-4 py-3 rounded-sm text-sm transition-colors">
              <Brain className="w-4 h-4" /> Psikolojik Katman
            </button>
            <button className="w-full flex items-center gap-3 bg-transparent border border-transparent hover:bg-[#1A1817] hover:border-[#2A2624] text-[#B7ADA1] hover:text-[#E5E0D8] px-4 py-3 rounded-sm text-sm transition-colors">
              <Filter className="w-4 h-4" /> Journey Hunisi
            </button>
            <button className="w-full flex items-center gap-3 bg-transparent border border-transparent hover:bg-[#1A1817] hover:border-[#2A2624] text-[#B7ADA1] hover:text-[#E5E0D8] px-4 py-3 rounded-sm text-sm transition-colors">
              <Settings className="w-4 h-4" /> Ayarlar
            </button>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-[#2A2624]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#1A1817] border border-[#2A2624] flex items-center justify-center text-[#C2A878] font-serif text-sm">S</div>
            <div>
              <div className="text-sm text-[#E5E0D8]">Santis Yönetim</div>
              <div className="text-[#6E5946] text-[10px] uppercase tracking-widest flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Çevrimiçi
              </div>
            </div>
          </div>
          <button className="w-full flex items-center gap-3 bg-transparent text-[#857B74] hover:text-[#E5E0D8] px-2 py-2 rounded-sm text-xs transition-colors">
            <LogOut className="w-3 h-3" /> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* ANA İÇERİK ALANI                                           */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
        
        {/* Ambient Glow */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(194,168,120,0.03)_0%,transparent_70%)] rounded-full pointer-events-none z-0"></div>

        {/* ÜST BİLGİ ÇUBUĞU (Header) */}
        <header className="h-24 px-8 border-b border-[#2A2624] flex items-center justify-between bg-[#141211]/80 backdrop-blur-md z-10 sticky top-0">
          <div>
            <h2 className="font-serif text-2xl text-[#E5E0D8]">Telemetri Özeti</h2>
            <div className="flex items-center text-[#857B74] text-[10px] uppercase tracking-widest mt-1">
              <Activity className="w-3 h-3 mr-2 text-[#C2A878] animate-pulse" /> 
              Canlı Akış: <span className="ml-2 text-[#B7ADA1] normal-case tracking-normal">{liveEvents[liveEventIndex]}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-[#1A1817] border border-[#2A2624] rounded-sm p-1">
              {['Bugün', 'Bu Hafta', 'Bu Ay'].map(range => (
                <button 
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-1.5 text-xs rounded-sm transition-colors ${timeRange === range ? 'bg-[#141211] text-[#C2A878] border border-[#2A2624]' : 'text-[#857B74] hover:text-[#E5E0D8] border border-transparent'}`}
                >
                  {range}
                </button>
              ))}
            </div>
            <button 
              onClick={handleOpenDrawer}
              className={`w-10 h-10 flex items-center justify-center border ${hasUnreadPulse ? 'border-[#C2A878] bg-[#C2A878]/10' : 'border-[#2A2624] bg-[#1A1817]'} hover:border-[#6E5946] rounded-sm text-[#B7ADA1] transition-colors relative`}
            >
              <Bell className={`w-4 h-4 ${hasUnreadPulse ? 'text-[#C2A878] animate-pulse' : ''}`} />
              {hasUnreadPulse && <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-[#C2A878] rounded-full shadow-[0_0_8px_#C2A878]"></span>}
            </button>
          </div>
        </header>

        {/* WIDGET GRID */}
        <div className="flex-1 overflow-y-auto p-8 z-10 hide-scrollbar">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            
            {/* WIDGET 1: Müdahale Gösterimi */}
            <div className="bg-[#1A1817] border border-[#2A2624] hover:border-[#6E5946]/50 rounded-sm p-8 flex flex-col transition-colors animate-fade-in" style={{ animationDelay: '0ms' }}>
              <div className="flex items-center gap-3 mb-6 border-b border-[#2A2624] pb-4">
                <Eye className="w-5 h-5 text-[#C2A878]" />
                <h3 className="text-[#E5E0D8] text-sm uppercase tracking-widest font-medium">Müdahale Oranı</h3>
              </div>
              <div className="mb-6 flex items-baseline gap-4">
                <span className="font-serif text-5xl text-[#E5E0D8]">24%</span>
                <span className="text-[#C2A878] text-sm font-medium">+2.4%</span>
              </div>
              <p className="text-[#857B74] text-xs leading-relaxed mb-auto">Psikolojik katmanın kullanıcılara görünme oranı. Ziyaretçilerin dörtte biri rehberliğe ihtiyaç duyuyor.</p>
              
              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-16 text-[10px] uppercase text-[#857B74] tracking-widest">Gösterildi</span>
                  <div className="flex-1 h-1.5 bg-[#141211] rounded-full overflow-hidden"><div className="h-full bg-[#C2A878] w-[24%]"></div></div>
                  <span className="w-8 text-right text-xs text-[#E5E0D8]">842</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-16 text-[10px] uppercase text-[#857B74] tracking-widest">Sessiz</span>
                  <div className="flex-1 h-1.5 bg-[#141211] rounded-full overflow-hidden"><div className="h-full bg-[#6E5946] w-[76%]"></div></div>
                  <span className="w-8 text-right text-xs text-[#E5E0D8]">2.6k</span>
                </div>
              </div>
            </div>

            {/* WIDGET 2: Bilişsel Durum Dağılımı */}
            <div className="bg-[#1A1817] border border-[#2A2624] hover:border-[#6E5946]/50 rounded-sm p-8 flex flex-col transition-colors animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-3 mb-6 border-b border-[#2A2624] pb-4">
                <Brain className="w-5 h-5 text-[#C2A878]" />
                <h3 className="text-[#E5E0D8] text-sm uppercase tracking-widest font-medium">Bilişsel Dağılım</h3>
              </div>
              <p className="text-[#857B74] text-xs leading-relaxed mb-8">Müdahale edilen kullanıcıların analiz edilen zihin durumu profilleri.</p>
              
              <div className="space-y-5 mt-auto">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-[#E5E0D8]">Bunalmış (Overwhelmed)</span>
                    <span className="text-[#C2A878]">45%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#141211] rounded-full overflow-hidden"><div className="h-full bg-[#C2A878] w-[45%]"></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-[#E5E0D8]">Kararsız (Hesitant)</span>
                    <span className="text-[#B7ADA1]">35%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#141211] rounded-full overflow-hidden"><div className="h-full bg-[#B7ADA1] w-[35%]"></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-[#E5E0D8]">Analitik (Analytical)</span>
                    <span className="text-[#6E5946]">20%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#141211] rounded-full overflow-hidden"><div className="h-full bg-[#6E5946] w-[20%]"></div></div>
                </div>
              </div>
            </div>

            {/* WIDGET 3: A/B Varyant Performansı */}
            <div className="bg-[#1A1817] border border-[#2A2624] hover:border-[#6E5946]/50 rounded-sm p-8 flex flex-col transition-colors animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-3 mb-6 border-b border-[#2A2624] pb-4">
                <Split className="w-5 h-5 text-[#C2A878]" />
                <h3 className="text-[#E5E0D8] text-sm uppercase tracking-widest font-medium">Metin Performansı</h3>
              </div>
              <p className="text-[#857B74] text-xs leading-relaxed mb-auto">Farklı kopya metinlerinin (A/B Test) Concierge'e dönüşüm oranları.</p>
              
              <ul className="mt-6 space-y-0 divide-y divide-[#2A2624]">
                <li className="py-4 flex justify-between items-center">
                  <span className="text-[#857B74] text-sm">Varyant A <span className="text-[10px] uppercase ml-1">(Rehber)</span></span>
                  <span className="text-[#C2A878] font-medium text-sm">12.4% CTR</span>
                </li>
                <li className="py-4 flex justify-between items-center">
                  <span className="text-[#857B74] text-sm">Varyant B <span className="text-[10px] uppercase ml-1">(Doğrudan)</span></span>
                  <span className="text-[#E5E0D8] font-medium text-sm">8.1% CTR</span>
                </li>
                <li className="py-4 flex justify-between items-center border-b-0 pb-0">
                  <span className="text-[#857B74] text-sm">Kazanan Profil</span>
                  <span className="text-[#E5E0D8] text-sm font-medium">Bunalmış (A)</span>
                </li>
              </ul>
            </div>

            {/* WIDGET 4: Concierge Dönüşümü */}
            <div className="bg-[#1A1817] border border-[#2A2624] hover:border-[#6E5946]/50 rounded-sm p-8 flex flex-col transition-colors animate-fade-in" style={{ animationDelay: '300ms' }}>
              <div className="flex items-center gap-3 mb-6 border-b border-[#2A2624] pb-4">
                <Headset className="w-5 h-5 text-[#C2A878]" />
                <h3 className="text-[#E5E0D8] text-sm uppercase tracking-widest font-medium">Concierge Yönlendirmesi</h3>
              </div>
              <div className="mb-6 flex items-baseline gap-4">
                <span className="font-serif text-5xl text-[#E5E0D8]">10.2%</span>
                <span className="text-[#C2A878] text-sm font-medium">+1.1%</span>
              </div>
              <p className="text-[#857B74] text-xs leading-relaxed mb-auto">Müdahale katmanından WhatsApp veya canlı destek ekibine geçiş yapanların oranı.</p>
              
              <ul className="mt-6 space-y-0 divide-y divide-[#2A2624]">
                <li className="py-4 flex justify-between items-center">
                  <span className="text-[#857B74] text-sm">Toplam Yönlendirme</span>
                  <span className="text-[#E5E0D8] text-sm font-medium">86 (Bugün)</span>
                </li>
                <li className="py-4 flex justify-between items-center border-b-0 pb-0">
                  <span className="text-[#857B74] text-sm">Zirve Yapan Sayfa</span>
                  <span className="text-[#E5E0D8] text-sm font-medium">Hammam Rituals</span>
                </li>
              </ul>
            </div>

            {/* WIDGET 5: Journey Sepet Terki (Drop-off) */}
            <div className="bg-[#1A1817] border border-[#2A2624] hover:border-[#6E5946]/50 rounded-sm p-8 flex flex-col transition-colors animate-fade-in md:col-span-2 xl:col-span-1" style={{ animationDelay: '400ms' }}>
              <div className="flex items-center gap-3 mb-6 border-b border-[#2A2624] pb-4">
                <Filter className="w-5 h-5 text-[#C2A878]" />
                <h3 className="text-[#E5E0D8] text-sm uppercase tracking-widest font-medium">Journey Terk Analizi</h3>
              </div>
              <p className="text-[#857B74] text-xs leading-relaxed mb-6">Müşteriler 4 adımlı Journey Builder (Sepet) akışında nereden çıkıyor?</p>
              
              <div className="mt-auto space-y-0 divide-y divide-[#2A2624]">
                <div className="py-3 flex justify-between items-center">
                  <span className="text-[#B7ADA1] text-sm">1. Kişiselleştirme</span>
                  <span className="text-[#E5E0D8] text-sm font-medium">100%</span>
                </div>
                <div className="py-3 flex justify-between items-center">
                  <span className="text-[#B7ADA1] text-sm flex items-center"><ChevronRight className="w-3 h-3 mr-1 text-[#6E5946]"/> 2. Zaman Çizelgesi</span>
                  <div className="text-right"><span className="text-[#E5E0D8] text-sm font-medium">88%</span> <span className="text-[#857B74] text-xs ml-2">-12%</span></div>
                </div>
                <div className="py-3 flex justify-between items-center relative overflow-hidden bg-[#6E5946]/10 px-2 -mx-2 rounded">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#C2A878]"></div>
                  <span className="text-[#C2A878] text-sm flex items-center font-medium"><ChevronRight className="w-3 h-3 mr-1"/> 3. Misafir Bilgileri</span>
                  <div className="text-right"><span className="text-[#C2A878] text-sm font-medium">53%</span> <span className="text-[#C2A878] text-xs ml-2 font-medium">-35% (Kritik)</span></div>
                </div>
                <div className="py-3 flex justify-between items-center">
                  <span className="text-[#B7ADA1] text-sm flex items-center"><ChevronRight className="w-3 h-3 mr-1 text-[#6E5946]"/> 4. Onay Gönderimi</span>
                  <div className="text-right"><span className="text-[#E5E0D8] text-sm font-medium">48%</span> <span className="text-[#857B74] text-xs ml-2">-5%</span></div>
                </div>
              </div>
            </div>

            {/* WIDGET 6: Gelir Etkisi (Revenue) */}
            <div className="bg-[#1A1817] border border-[#2A2624] hover:border-[#6E5946]/50 rounded-sm p-8 flex flex-col transition-colors animate-fade-in md:col-span-2 xl:col-span-1" style={{ animationDelay: '500ms' }}>
              <div className="flex items-center gap-3 mb-6 border-b border-[#2A2624] pb-4">
                <TrendingUp className="w-5 h-5 text-[#C2A878]" />
                <h3 className="text-[#E5E0D8] text-sm uppercase tracking-widest font-medium">Sistem Gelir Etkisi</h3>
              </div>
              <div className="mb-6 flex items-baseline gap-4">
                <span className="font-serif text-5xl text-[#E5E0D8]">€14.2k</span>
                <span className="text-[#B7ADA1] text-sm font-light uppercase tracking-widest">{timeRange}</span>
              </div>
              <p className="text-[#857B74] text-xs leading-relaxed mb-auto">Psikolojik katman etkileşimi veya Journey eklentileri (Add-ons) ile üretilen toplam gelir.</p>
              
              <ul className="mt-6 space-y-0 divide-y divide-[#2A2624]">
                <li className="py-4 flex justify-between items-center">
                  <span className="text-[#857B74] text-sm">Küratör Eklentisi (Uplift)</span>
                  <span className="text-[#C2A878] font-medium text-sm">+€2,850</span>
                </li>
                <li className="py-4 flex justify-between items-center border-b-0 pb-0">
                  <span className="text-[#857B74] text-sm">En İyi Satan Eklenti</span>
                  <span className="text-[#E5E0D8] text-sm font-medium">Salt Glow Peeling</span>
                </li>
              </ul>
            </div>

          </div>
          
          {/* Footer Warning */}
          <div className="max-w-7xl mx-auto mt-10 text-center animate-fade-in" style={{ animationDelay: '600ms' }}>
            <p className="text-[#857B74] text-sm font-light">
              <strong className="text-[#C2A878] font-medium">Aksiyon Önerisi:</strong> Sistem, müşterilerin %35'ini <b>Misafir Bilgileri</b> adımında kaybettiğini tespit etti. Form alanlarının kısaltılması veya misafir girişinin atlanması önerilir.
            </p>
          </div>
        </div>
      </main>

      <GhostDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        anomalies={anomalies} 
      />
    </div>
  );
}
