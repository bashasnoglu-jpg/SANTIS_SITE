import React from 'react';

const SovereignControlSurface = () => {
    return (
        <div className="min-h-screen bg-[#050505] text-[#A3A3A3] font-sans selection:bg-[#D4AF37] selection:text-black overflow-hidden flex">

            {/* LEFT EXECUTIVE RAIL */}
            <aside className="w-64 border-r border-[#1A1A1A] flex flex-col justify-between py-12 px-8">
                <div>
                    <h1 className="text-[#E5E5E5] text-xs uppercase tracking-[0.3em] font-light mb-16">Santis OS</h1>
                    <nav className="space-y-6">
                        {['Overview', 'Tactical Intent', 'The God\'s Eye', 'Revenue Engine', 'Sovereign Vaults', 'VIP Operations', 'Resident Therapists', 'System Health'].map((item, idx) => (
                            <div key={idx} className={`text-sm tracking-wider cursor-pointer transition-colors duration-500 hover:text-[#D4AF37] ${idx === 1 ? 'text-[#D4AF37]' : 'text-[#737373]'}`}>
                                {item}
                            </div>
                        ))}
                    </nav>
                </div>
                <div className="text-[10px] tracking-widest uppercase text-[#404040]">
                    Auth Level: <span className="text-[#8A9A5B]">Omega</span>
                </div>
            </aside>

            <main className="flex-1 flex flex-col">
                {/* TOP TELEMETRY STRIP */}
                <header className="h-20 border-b border-[#1A1A1A] flex items-center justify-between px-12 text-xs tracking-widest uppercase">
                    <div className="flex space-x-12">
                        <div>Tenant Scope: <span className="text-[#E5E5E5]">Global Sovereign</span></div>
                        <div>Chrono Matrix: <span className="text-[#E5E5E5]">Live Pulse</span></div>
                    </div>
                    <div className="flex space-x-12">
                        <div className="text-[#D4AF37] animate-pulse">Notification Uplink: 3 Critical</div>
                        <div>Operator: <span className="text-[#E5E5E5]">Command</span></div>
                    </div>
                </header>

                <div className="flex-1 p-12 flex space-x-12 overflow-y-auto">

                    {/* MAIN CONTROL SURFACE */}
                    <div className="flex-1 flex flex-col space-y-16">

                        {/* ROW 1: TACTICAL HORIZON (Continuous Typographic Strip) */}
                        <section className="flex justify-between items-baseline border-b border-[#1A1A1A] pb-8">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-widest text-[#737373] mb-2">Total Volume</span>
                                <span className="text-4xl font-light text-[#E5E5E5]">$142.5K</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-widest text-[#737373] mb-2">Conversion</span>
                                <span className="text-4xl font-light text-[#8A9A5B]">68.2%</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-widest text-[#737373] mb-2">Abandonment</span>
                                <span className="text-4xl font-light text-[#800000]">12.1%</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-widest text-[#737373] mb-2">Ticket Velocity</span>
                                <span className="text-4xl font-light text-[#E5E5E5]">4.2/hr</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-widest text-[#737373] mb-2">Force Util</span>
                                <span className="text-4xl font-light text-[#FFBF00]">92%</span>
                            </div>
                        </section>

                        {/* ROW 2: INTENT MASTERY */}
                        <section className="grid grid-cols-2 gap-16">
                            {/* Intent Gravity */}
                            <div>
                                <h2 className="text-xs uppercase tracking-[0.2em] text-[#E5E5E5] mb-8">Intent Gravity & Flow</h2>
                                <div className="relative h-48 border-l border-[#1A1A1A] pl-8 flex flex-col justify-between">
                                    {/* Abstract representation of solid gold stream to mist */}
                                    <div className="flex items-center space-x-4">
                                        <div className="w-32 h-[1px] bg-[#D4AF37]"></div>
                                        <span className="text-sm tracking-widest text-[#D4AF37]">Deep Recovery Matrix</span>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="w-24 h-[1px] bg-[#8A9A5B]"></div>
                                        <span className="text-sm tracking-widest text-[#8A9A5B]">Couples Sanctuary</span>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="w-16 h-[1px] bg-gradient-to-r from-[#FFBF00] to-transparent"></div>
                                        <span className="text-sm tracking-widest text-[#FFBF00]">Sensory Awakening (Fractured)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Friction Diagnostics */}
                            <div>
                                <h2 className="text-xs uppercase tracking-[0.2em] text-[#E5E5E5] mb-8">Friction Diagnostics</h2>
                                <ul className="space-y-6">
                                    <li className="flex justify-between items-center text-sm border-b border-[#1A1A1A] pb-2">
                                        <span className="text-[#737373]">Pricing Hesitation (Checkout)</span>
                                        <span className="text-[#800000] tracking-widest">SEVERE BLEED</span>
                                    </li>
                                    <li className="flex justify-between items-center text-sm border-b border-[#1A1A1A] pb-2">
                                        <span className="text-[#737373]">Schedule Incompatibility</span>
                                        <span className="text-[#FFBF00] tracking-widest">ELEVATED</span>
                                    </li>
                                    <li className="flex justify-between items-center text-sm border-b border-[#1A1A1A] pb-2">
                                        <span className="text-[#737373]">Digital Handoff Latency</span>
                                        <span className="text-[#8A9A5B] tracking-widest">OPTIMAL</span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        {/* ROW 3: DEPLOYMENT MATRIX */}
                        <section>
                            <h2 className="text-xs uppercase tracking-[0.2em] text-[#E5E5E5] mb-8">Therapist Deployment Matrix</h2>
                            <div className="space-y-4">
                                {/* Deployment Vectors */}
                                {[{ name: 'Aurelia', util: '98%', status: 'fatigue' }, { name: 'Julian', util: '74%', status: 'optimal' }, { name: 'Kaelen', util: '41%', status: 'idle' }].map((t, i) => (
                                    <div key={i} className="flex items-center space-x-8">
                                        <span className="w-16 text-xs uppercase tracking-wider text-[#737373]">{t.name}</span>
                                        <div className="flex-1 h-[2px] bg-[#1A1A1A] relative">
                                            <div
                                                className={`absolute top-0 left-0 h-full ${t.status === 'fatigue' ? 'bg-[#FFBF00]' : t.status === 'optimal' ? 'bg-[#D4AF37]' : 'bg-[#404040]'}`}
                                                style={{ width: t.util }}>
                                            </div>
                                        </div>
                                        <span className="w-12 text-right text-xs tracking-widest">{t.util}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                    </div>

                    {/* RIGHT RAIL: LIVE RADAR & SYSTEM HEALTH */}
                    <aside className="w-80 flex flex-col space-y-16 pl-12 border-l border-[#1A1A1A]">

                        {/* VIP Radar */}
                        <div>
                            <h2 className="text-xs uppercase tracking-[0.2em] text-[#E5E5E5] mb-8 flex items-center">
                                <div className="w-2 h-2 rounded-full bg-[#D4AF37] mr-3 animate-pulse"></div>
                                VIP Radar
                            </h2>
                            <div className="space-y-6">
                                <div className="text-sm">
                                    <div className="text-[#D4AF37] tracking-wider mb-1">M. VANGUARD</div>
                                    <div className="text-[10px] text-[#737373] uppercase tracking-widest">Intent: Sovereign Vault / Pending Handoff</div>
                                </div>
                                <div className="text-sm">
                                    <div className="text-[#FFBF00] tracking-wider mb-1">E. ROTHSCHILD</div>
                                    <div className="text-[10px] text-[#737373] uppercase tracking-widest">Intent: Recovery / Schedule Conflict</div>
                                </div>
                            </div>
                        </div>

                        {/* System Health */}
                        <div>
                            <h2 className="text-xs uppercase tracking-[0.2em] text-[#E5E5E5] mb-8">System Integrity</h2>
                            <div className="space-y-4 text-xs uppercase tracking-widest">
                                <div className="flex justify-between">
                                    <span className="text-[#737373]">Engine</span>
                                    <span className="text-[#8A9A5B]">Nominal</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#737373]">Payment Flow</span>
                                    <span className="text-[#8A9A5B]">Nominal</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#737373]">API Latency</span>
                                    <span className="text-[#E5E5E5]">12ms</span>
                                </div>
                            </div>
                        </div>

                    </aside>

                </div>
            </main>
        </div>
    );
};

export default SovereignControlSurface;
