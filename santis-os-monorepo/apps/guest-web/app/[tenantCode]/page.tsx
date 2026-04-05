import React from 'react';
import { headers } from 'next/headers';
import SovereignRail from '../../components/SovereignRail';
import SovereignCard from '../../components/SovereignCard';

interface TenantPageProps {
  params: {
    tenantCode: string;
  };
}

export default function TenantHomePage({ params }: TenantPageProps) {
  // Edge'den gelen mühür (Middleware güvencesi)
  const headersList = headers();
  const secureTenantCode = headersList.get('x-tenant-code') || params.tenantCode;

  // Lüks karşılama mesajını tenant'a göre özelleştirebiliriz.
  const hotelName = secureTenantCode === 'maxxroyal' 
    ? 'Maxx Royal' 
    : secureTenantCode === 'rixos' 
      ? 'Rixos Premium' 
      : 'Santis Club';

  return (
    <main style={{ padding: 'var(--sovereign-header-v) 0', overflowX: 'hidden' }}>
      <div style={{ padding: '0 var(--sovereign-rail-padding-x)', marginBottom: 'var(--sovereign-space-lg)' }}>
        <p style={{ opacity: 0.6, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>
          {hotelName}
        </p>
        <h1 style={{ fontWeight: 400, letterSpacing: '-0.02em', margin: 'var(--sovereign-space-xs) 0 0 0' }}>
          Zamanı Yavaşlatın
        </h1>
        <p style={{ opacity: 0.7, margin: 'var(--sovereign-space-xs) 0 0 0' }}>
          Size özel hazırlanmış ritüeller ve masaj terapileri.
        </p>
      </div>

      <SovereignRail railId="homepage-hero-rail">
        <SovereignCard 
          id="massage-deep-relax"
          title="Derin Rahatlama"
          subtitle="60 Dk veya 90 Dk - Özgün Terapiler"
          imageUrl="/assets/img/massage-1.jpg"
          mood="deep_relaxation"
        />
        <SovereignCard 
          id="hamam-royal"
          title="Sultan Hamamı"
          subtitle="Geleneksel Kese & Köpük Ritüeli"
          imageUrl="/assets/img/hamam-1.jpg"
          mood="detox"
        />
        <SovereignCard 
          id="skincare-sothys"
          title="Sothys Cilt Bakımı"
          subtitle="Gençleştirici Anti-Aging"
          imageUrl="/assets/img/skincare-1.jpg"
          mood="beauty"
        />
      </SovereignRail>
    </main>
  );
}
