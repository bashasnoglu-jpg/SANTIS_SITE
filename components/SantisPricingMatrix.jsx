import React, { useState } from 'react';

const pricingPlans = [
    {
        id: 'entry',
        name: 'Entry Plan',
        price: '950',
        features: ['Temel Biyometrik Takip', 'Haftalık Rapor', 'Standart Destek'],
        highlight: false,
        cta: 'Başlat'
    },
    {
        id: 'sovereign',
        name: 'Sovereign Choice',
        price: '2,450',
        features: ['7/24 Kuantum Tarama', 'Öncelikli Bio-Hacking Alt yapısı', 'Kişisel Longevity Koçu', 'Sınırsız Slot Erişimi'],
        highlight: true,
        badge: 'EN ÇOK TERCİH EDİLEN',
        cta: 'Sovereign Ol'
    },
    {
        id: 'anchor',
        name: 'Anchor Plan',
        price: '12,000',
        features: ['Ömür Boyu Genetik Koruma', 'Özel Klinik Önceliği', '7/24 Yerinde Müdahale', 'VVIP Kuantum Küre Erişimi'],
        highlight: false,
        cta: 'Elit Katılım'
    }
];

const SantisPricingMatrix = () => {
    const [selected, setSelected] = useState('sovereign');

    return (
        <div className="bg-sbr-dark py-20 px-10 min-h-screen text-white font-sans">
            <div className="max-w-6xl mx-auto text-center mb-16">
                <h2 className="text-sbr-gold text-sm tracking-boardroom uppercase mb-4">Longevity Architecture</h2>
                <h1 className="text-4xl md:text-5xl font-light tracking-tight">Geleceğinizi Mühürleyin.</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {pricingPlans.map((plan) => (
                    <div
                        key={plan.id}
                        onClick={() => setSelected(plan.id)}
                        className={`relative cursor-pointer transition-all duration-500 p-8 border ${selected === plan.id
                                ? 'border-sbr-gold bg-sbr-surface scale-105 shadow-sbr-gold-selected'
                                : 'border-zinc-800 bg-transparent opacity-70 scale-100 hover:opacity-100'
                            }`}
                    >
                        {plan.badge && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sbr-gold text-black text-micro font-bold px-3 py-1 tracking-widest">
                                {plan.badge}
                            </span>
                        )}

                        <h3 className="text-xl font-light mb-6 tracking-wide">{plan.name}</h3>
                        <div className="flex items-baseline mb-8">
                            <span className="text-4xl font-semibold">${plan.price}</span>
                            <span className="text-zinc-500 ml-2">/aylık</span>
                        </div>

                        <ul className="space-y-4 mb-10 text-sm text-zinc-400">
                            {plan.features.map((feature, idx) => (
                                <li key={idx} className="flex items-center">
                                    <span className="w-1.5 h-1.5 bg-sbr-gold rounded-full mr-3"></span>
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <button className={`w-full py-4 tracking-widest text-xs uppercase transition-all ${selected === plan.id
                                ? 'bg-sbr-gold text-black font-bold'
                                : 'border border-zinc-700 hover:border-sbr-gold text-zinc-400'
                            }`}>
                            {plan.cta}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SantisPricingMatrix;
