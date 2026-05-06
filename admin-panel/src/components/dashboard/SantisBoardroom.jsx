import React, { useState, useEffect } from 'react';
import GhostDrawer from './GhostDrawer';
import LiveIntentMonitor from '../boardroom/LiveIntentMonitor';
import { BoardroomChronos } from '../../features/boardroom/components/BoardroomChronos';
import { History, Activity, Bell, ChevronRight, LayoutDashboard, Settings, LogOut, Eye, Brain, Split, Headset, TrendingUp, Filter } from 'lucide-react';
import { useBoardroomMode } from '../../features/boardroom/context/BoardroomModeContext';

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
  const { mode } = useBoardroomMode();
  const isHistorical = mode === 'HISTORICAL';
  const [timeRange, setTimeRange] = useState('Bu Hafta');
  const [liveEventIndex, setLiveEventIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('telemetry');

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
    <div className={`min-h-screen bg-sovereign-void text-sovereign-ink font-sans flex selection:bg-sovereign-accent/30 selection:text-sovereign-ink ${isHistorical ? 'nv-historical' : ''}`}>
      
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,500;1,400&family=Inter:wght@300;400;500;600&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .nv-historical { filter: saturate(0.6) brightness(0.9); transition: filter 0.4s ease; }
        .nv-historical-badge { 
          position: fixed; top: 24px; right: 180px; z-index: 100;
          padding: 8px 16px; border: 1px solid rgba(212, 175, 55, 0.4);
          background: rgba(212, 175, 55, 0.15); color: #d4af37;
          border-radius: 999px; font-size: 10px; letter-spacing: 0.2em;
          animation: badgePulse 2s infinite;
        }
        @keyframes badgePulse { 0% { opacity: 0.8; } 50% { opacity: 1; } 100% { opacity: 0.8; } }
      `}} />

      {/* ========================================================= */}
      {/* SOL MENÜ (SIDEBAR)                                         */}
      {/* ========================================================= */}
      <aside className="w-64 bg-sovereign-coal border-r border-sovereign-panel hidden lg:flex flex-col">
        <div className="h-24 flex items-center justify-center border-b border-sovereign-panel">
          <h1 className="text-xl tracking-[0.3em] font-light text-sovereign-ink">SANTIS</h1>
        </div>
        
        <div className="p-6">
          <div className="text-sovereign-earth text-2xs uppercase tracking-widest mb-4">Boardroom OS</div>
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('telemetry')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-sm transition-colors ${activeTab === 'telemetry' ? 'bg-sovereign-obsidian border border-sovereign-accent/30 text-sovereign-accent' : 'bg-transparent border border-transparent hover:bg-sovereign-obsidian hover:border-sovereign-panel text-sovereign-sand hover:text-sovereign-ink'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Telemetri Özeti
            </button>
            <button 
              onClick={() => setActiveTab('psychology')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-sm transition-colors ${activeTab === 'psychology' ? 'bg-sovereign-obsidian border border-sovereign-accent/30 text-sovereign-accent' : 'bg-transparent border border-transparent hover:bg-sovereign-obsidian hover:border-sovereign-panel text-sovereign-sand hover:text-sovereign-ink'}`}
            >
              <Brain className="w-4 h-4" /> Psikolojik Katman
            </button>
            <button 
              onClick={() => setActiveTab('journey')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-sm transition-colors ${activeTab === 'journey' ? 'bg-sovereign-obsidian border border-sovereign-accent/30 text-sovereign-accent' : 'bg-transparent border border-transparent hover:bg-sovereign-obsidian hover:border-sovereign-panel text-sovereign-sand hover:text-sovereign-ink'}`}
            >
              <Filter className="w-4 h-4" /> Journey Hunisi
            </button>
            <button 
              onClick={() => setActiveTab('chronos')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-sm transition-colors ${activeTab === 'chronos' ? 'bg-sovereign-obsidian border border-sovereign-accent/30 text-sovereign-accent' : 'bg-transparent border border-transparent hover:bg-sovereign-obsidian hover:border-sovereign-panel text-sovereign-sand hover:text-sovereign-ink'}`}
            >
              <History className="w-4 h-4" /> Chronos & Logic
            </button>
            <button className="w-full flex items-center gap-3 bg-transparent border border-transparent hover:bg-sovereign-obsidian hover:border-sovereign-panel text-sovereign-sand hover:text-sovereign-ink px-4 py-3 rounded-sm text-sm transition-colors">
              <Settings className="w-4 h-4" /> Ayarlar
            </button>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-sovereign-panel">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-sovereign-obsidian border border-sovereign-panel flex items-center justify-center text-sovereign-accent font-serif text-sm">S</div>
            <div>
              <div className="text-sm text-sovereign-ink">Santis Yönetim</div>
              <div className="text-sovereign-earth text-2xs uppercase tracking-widest flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Çevrimiçi
              </div>
            </div>
          </div>
          <button className="w-full flex items-center gap-3 bg-transparent text-sovereign-bronze hover:text-sovereign-ink px-2 py-2 rounded-sm text-xs transition-colors">
            <LogOut className="w-3 h-3" /> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* ANA İÇERİK ALANI                                           */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
        
        {/* Ambient Glow */}
        <div className="absolute top-[-20%] right-[-10%] layout-panel-600 fx-bg-boardroom-radial rounded-full pointer-events-none z-0"></div>

        {/* ÜST BİLGİ ÇUBUĞU (Header) */}
        <header className="h-24 px-8 border-b border-sovereign-panel flex items-center justify-between bg-sovereign-coal/80 backdrop-blur-md z-10 sticky top-0">
          <div>
            <h2 className="font-serif text-2xl text-sovereign-ink">
              {activeTab === 'telemetry' && 'Telemetri Özeti'}
              {activeTab === 'psychology' && 'Psikolojik Katman'}
              {activeTab === 'journey' && 'Journey Hunisi'}
              {activeTab === 'chronos' && 'Chronos & Visual Truth'}
            </h2>
            <div className="flex items-center text-sovereign-bronze text-2xs uppercase tracking-widest mt-1">
              <Activity className="w-3 h-3 mr-2 text-sovereign-accent animate-pulse" /> 
              Canlı Akış: <span className="ml-2 text-sovereign-sand normal-case tracking-normal">{liveEvents[liveEventIndex]}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-sovereign-obsidian border border-sovereign-panel rounded-sm p-1">
              {['Bugün', 'Bu Hafta', 'Bu Ay'].map(range => (
                <button 
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-1.5 text-xs rounded-sm transition-colors ${timeRange === range ? 'bg-sovereign-coal text-sovereign-accent border border-sovereign-panel' : 'text-sovereign-bronze hover:text-sovereign-ink border border-transparent'}`}
                >
                  {range}
                </button>
              ))}
            </div>
            <button 
              onClick={handleOpenDrawer}
              className={`w-10 h-10 flex items-center justify-center border ${hasUnreadPulse ? 'border-sovereign-accent bg-sovereign-accent/10' : 'border-sovereign-panel bg-sovereign-obsidian'} hover:border-sovereign-earth rounded-sm text-sovereign-sand transition-colors relative`}
            >
              <Bell className={`w-4 h-4 ${hasUnreadPulse ? 'text-sovereign-accent animate-pulse' : ''}`} />
              {hasUnreadPulse && <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-sovereign-accent rounded-full shadow-accent-glow"></span>}
            </button>
          </div>
        </header>

        {isHistorical && (
          <div className="nv-historical-badge">
            TEMPORAL ISOLATION: HISTORICAL MODE ACTIVE
          </div>
        )}

        {/* WIDGET GRID */}
        <div className="flex-1 overflow-y-auto p-8 z-10 hide-scrollbar">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            
            {/* TELEMETRİ ÖZETİ EKRANI (Tüm Widgetlar) */}
            {(activeTab === 'telemetry' || activeTab === 'psychology') && (
              <>
                {/* NEW: Live Intent Monitor (SSE + REST) */}
                {activeTab === 'telemetry' && (
                  <div className="md:col-span-2 xl:col-span-3 mb-2 animate-fade-in" style={{ animationDelay: '0ms' }}>
                    <LiveIntentMonitor />
                  </div>
                )}

                {/* WIDGET 1: Müdahale Gösterimi */}
                <div className="bg-sovereign-obsidian border border-sovereign-panel hover:border-sovereign-earth/50 rounded-sm p-8 flex flex-col transition-colors animate-fade-in" style={{ animationDelay: '0ms' }}>
                  <div className="flex items-center gap-3 mb-6 border-b border-sovereign-panel pb-4">
                    <Eye className="w-5 h-5 text-sovereign-accent" />
                    <h3 className="text-sovereign-ink text-sm uppercase tracking-widest font-medium">Müdahale Oranı</h3>
                  </div>
                  <div className="mb-6 flex items-baseline gap-4">
                    <span className="font-serif text-5xl text-sovereign-ink">24%</span>
                    <span className="text-sovereign-accent text-sm font-medium">+2.4%</span>
                  </div>
                  <p className="text-sovereign-bronze text-xs leading-relaxed mb-auto">Psikolojik katmanın kullanıcılara görünme oranı. Ziyaretçilerin dörtte biri rehberliğe ihtiyaç duyuyor.</p>
                  
                  <div className="mt-8 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="w-16 text-2xs uppercase text-sovereign-bronze tracking-widest">Gösterildi</span>
                      <div className="flex-1 h-1.5 bg-sovereign-coal rounded-full overflow-hidden"><div className="h-full bg-sovereign-accent layout-rail-left"></div></div>
                      <span className="w-8 text-right text-xs text-sovereign-ink">842</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-16 text-2xs uppercase text-sovereign-bronze tracking-widest">Sessiz</span>
                      <div className="flex-1 h-1.5 bg-sovereign-coal rounded-full overflow-hidden"><div className="h-full bg-sovereign-earth layout-rail-main"></div></div>
                      <span className="w-8 text-right text-xs text-sovereign-ink">2.6k</span>
                    </div>
                  </div>
                </div>

                {/* WIDGET 2: Bilişsel Durum Dağılımı */}
                <div className="bg-sovereign-obsidian border border-sovereign-panel hover:border-sovereign-earth/50 rounded-sm p-8 flex flex-col transition-colors animate-fade-in" style={{ animationDelay: '100ms' }}>
                  <div className="flex items-center gap-3 mb-6 border-b border-sovereign-panel pb-4">
                    <Brain className="w-5 h-5 text-sovereign-accent" />
                    <h3 className="text-sovereign-ink text-sm uppercase tracking-widest font-medium">Bilişsel Dağılım</h3>
                  </div>
                  <p className="text-sovereign-bronze text-xs leading-relaxed mb-8">Müdahale edilen kullanıcıların analiz edilen zihin durumu profilleri.</p>
                  
                  <div className="space-y-5 mt-auto">
                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-sovereign-ink">Bunalmış (Overwhelmed)</span>
                        <span className="text-sovereign-accent">45%</span>
                      </div>
                      <div className="w-full h-1.5 bg-sovereign-coal rounded-full overflow-hidden"><div className="h-full bg-sovereign-accent layout-split-45"></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-sovereign-ink">Kararsız (Hesitant)</span>
                        <span className="text-sovereign-sand">35%</span>
                      </div>
                      <div className="w-full h-1.5 bg-sovereign-coal rounded-full overflow-hidden"><div className="h-full bg-sovereign-sand layout-split-35"></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-sovereign-ink">Analitik (Analytical)</span>
                        <span className="text-sovereign-earth">20%</span>
                      </div>
                      <div className="w-full h-1.5 bg-sovereign-coal rounded-full overflow-hidden"><div className="h-full bg-sovereign-earth layout-split-20"></div></div>
                    </div>
                  </div>
                </div>

                {/* WIDGET 3: A/B Varyant Performansı */}
                <div className="bg-sovereign-obsidian border border-sovereign-panel hover:border-sovereign-earth/50 rounded-sm p-8 flex flex-col transition-colors animate-fade-in" style={{ animationDelay: '200ms' }}>
                  <div className="flex items-center gap-3 mb-6 border-b border-sovereign-panel pb-4">
                    <Split className="w-5 h-5 text-sovereign-accent" />
                    <h3 className="text-sovereign-ink text-sm uppercase tracking-widest font-medium">Metin Performansı</h3>
                  </div>
                  <p className="text-sovereign-bronze text-xs leading-relaxed mb-auto">Farklı kopya metinlerinin (A/B Test) Concierge'e dönüşüm oranları.</p>
                  
                  <ul className="mt-6 space-y-0 divide-y divide-[var(--sovereign-panel)]">
                    <li className="py-4 flex justify-between items-center">
                      <span className="text-sovereign-bronze text-sm">Varyant A <span className="text-2xs uppercase ml-1">(Rehber)</span></span>
                      <span className="text-sovereign-accent font-medium text-sm">12.4% CTR</span>
                    </li>
                    <li className="py-4 flex justify-between items-center">
                      <span className="text-sovereign-bronze text-sm">Varyant B <span className="text-2xs uppercase ml-1">(Doğrudan)</span></span>
                      <span className="text-sovereign-ink font-medium text-sm">8.1% CTR</span>
                    </li>
                    <li className="py-4 flex justify-between items-center border-b-0 pb-0">
                      <span className="text-sovereign-bronze text-sm">Kazanan Profil</span>
                      <span className="text-sovereign-ink text-sm font-medium">Bunalmış (A)</span>
                    </li>
                  </ul>
                </div>
              </>
            )}

            {(activeTab === 'telemetry' || activeTab === 'journey') && (
              <>
                {/* WIDGET 4: Concierge Dönüşümü */}
                <div className="bg-sovereign-obsidian border border-sovereign-panel hover:border-sovereign-earth/50 rounded-sm p-8 flex flex-col transition-colors animate-fade-in" style={{ animationDelay: '300ms' }}>
                  <div className="flex items-center gap-3 mb-6 border-b border-sovereign-panel pb-4">
                    <Headset className="w-5 h-5 text-sovereign-accent" />
                    <h3 className="text-sovereign-ink text-sm uppercase tracking-widest font-medium">Concierge Yönlendirmesi</h3>
                  </div>
                  <div className="mb-6 flex items-baseline gap-4">
                    <span className="font-serif text-5xl text-sovereign-ink">10.2%</span>
                    <span className="text-sovereign-accent text-sm font-medium">+1.1%</span>
                  </div>
                  <p className="text-sovereign-bronze text-xs leading-relaxed mb-auto">Müdahale katmanından WhatsApp veya canlı destek ekibine geçiş yapanların oranı.</p>
                  
                  <ul className="mt-6 space-y-0 divide-y divide-[var(--sovereign-panel)]">
                    <li className="py-4 flex justify-between items-center">
                      <span className="text-sovereign-bronze text-sm">Toplam Yönlendirme</span>
                      <span className="text-sovereign-ink text-sm font-medium">86 (Bugün)</span>
                    </li>
                    <li className="py-4 flex justify-between items-center border-b-0 pb-0">
                      <span className="text-sovereign-bronze text-sm">Zirve Yapan Sayfa</span>
                      <span className="text-sovereign-ink text-sm font-medium">Hammam Rituals</span>
                    </li>
                  </ul>
                </div>

                {/* WIDGET 5: Journey Sepet Terki (Drop-off) */}
                <div className="bg-sovereign-obsidian border border-sovereign-panel hover:border-sovereign-earth/50 rounded-sm p-8 flex flex-col transition-colors animate-fade-in md:col-span-2 xl:col-span-1" style={{ animationDelay: '400ms' }}>
                  <div className="flex items-center gap-3 mb-6 border-b border-sovereign-panel pb-4">
                    <Filter className="w-5 h-5 text-sovereign-accent" />
                    <h3 className="text-sovereign-ink text-sm uppercase tracking-widest font-medium">Journey Terk Analizi</h3>
                  </div>
                  <p className="text-sovereign-bronze text-xs leading-relaxed mb-6">Müşteriler 4 adımlı Journey Builder (Sepet) akışında nereden çıkıyor?</p>
                  
                  <div className="mt-auto space-y-0 divide-y divide-[var(--sovereign-panel)]">
                    <div className="py-3 flex justify-between items-center">
                      <span className="text-sovereign-sand text-sm">1. Kişiselleştirme</span>
                      <span className="text-sovereign-ink text-sm font-medium">100%</span>
                    </div>
                    <div className="py-3 flex justify-between items-center">
                      <span className="text-sovereign-sand text-sm flex items-center"><ChevronRight className="w-3 h-3 mr-1 text-sovereign-earth"/> 2. Zaman Çizelgesi</span>
                      <div className="text-right"><span className="text-sovereign-ink text-sm font-medium">88%</span> <span className="text-sovereign-bronze text-xs ml-2">-12%</span></div>
                    </div>
                    <div className="py-3 flex justify-between items-center relative overflow-hidden bg-sovereign-earth/10 px-2 -mx-2 rounded">
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-sovereign-accent"></div>
                      <span className="text-sovereign-accent text-sm flex items-center font-medium"><ChevronRight className="w-3 h-3 mr-1"/> 3. Misafir Bilgileri</span>
                      <div className="text-right"><span className="text-sovereign-accent text-sm font-medium">53%</span> <span className="text-sovereign-accent text-xs ml-2 font-medium">-35% (Kritik)</span></div>
                    </div>
                    <div className="py-3 flex justify-between items-center">
                      <span className="text-sovereign-sand text-sm flex items-center"><ChevronRight className="w-3 h-3 mr-1 text-sovereign-earth"/> 4. Onay Gönderimi</span>
                      <div className="text-right"><span className="text-sovereign-ink text-sm font-medium">48%</span> <span className="text-sovereign-bronze text-xs ml-2">-5%</span></div>
                    </div>
                  </div>
                </div>

                {/* WIDGET 6: Gelir Etkisi (Revenue) */}
                <div className="bg-sovereign-obsidian border border-sovereign-panel hover:border-sovereign-earth/50 rounded-sm p-8 flex flex-col transition-colors animate-fade-in md:col-span-2 xl:col-span-1" style={{ animationDelay: '500ms' }}>
                  <div className="flex items-center gap-3 mb-6 border-b border-sovereign-panel pb-4">
                    <TrendingUp className="w-5 h-5 text-sovereign-accent" />
                    <h3 className="text-sovereign-ink text-sm uppercase tracking-widest font-medium">Sistem Gelir Etkisi</h3>
                  </div>
                  <div className="mb-6 flex items-baseline gap-4">
                    <span className="font-serif text-5xl text-sovereign-ink">€14.2k</span>
                    <span className="text-sovereign-sand text-sm font-light uppercase tracking-widest">{timeRange}</span>
                  </div>
                  <p className="text-sovereign-bronze text-xs leading-relaxed mb-auto">Psikolojik katman etkileşimi veya Journey eklentileri (Add-ons) ile üretilen toplam gelir.</p>
                  
                  <ul className="mt-6 space-y-0 divide-y divide-[var(--sovereign-panel)]">
                    <li className="py-4 flex justify-between items-center">
                      <span className="text-sovereign-bronze text-sm">Küratör Eklentisi (Uplift)</span>
                      <span className="text-sovereign-accent font-medium text-sm">+€2,850</span>
                    </li>
                    <li className="py-4 flex justify-between items-center border-b-0 pb-0">
                      <span className="text-sovereign-bronze text-sm">En İyi Satan Eklenti</span>
                      <span className="text-sovereign-ink text-sm font-medium">Salt Glow Peeling</span>
                    </li>
                  </ul>
                </div>
              </>
            )}

            {/* CHRONOS & VISUAL TRUTH LAYER */}
            {activeTab === 'chronos' && (
              <div className="md:col-span-2 xl:col-span-3 animate-fade-in">
                <BoardroomChronos />
              </div>
            )}
          </div>
          
          {/* Footer Warning */}
          <div className="max-w-7xl mx-auto mt-10 text-center animate-fade-in" style={{ animationDelay: '600ms' }}>
            <p className="text-sovereign-bronze text-sm font-light">
              <strong className="text-sovereign-accent font-medium">Aksiyon Önerisi:</strong> Sistem, müşterilerin %35'ini <b>Misafir Bilgileri</b> adımında kaybettiğini tespit etti. Form alanlarının kısaltılması veya misafir girişinin atlanması önerilir.
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
