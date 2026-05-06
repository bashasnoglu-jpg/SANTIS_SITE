import React from 'react';
import type { Metadata } from 'next';
import { TelemetryProvider } from '../../providers/TelemetryProvider';
import '../globals.css';

// Parametre tiplerini Server Components için belirliyoruz
interface TenantLayoutProps {
  children: React.ReactNode;
  params: {
    tenantCode: string;
  };
}

export async function generateMetadata({ params }: { params: { tenantCode: string } }): Promise<Metadata> {
  // Gelecekte Redis'ten veya SEO veritabanından dinamik çekilebilir.
  const name = params.tenantCode === 'default' ? 'Santis OS' : params.tenantCode.toUpperCase();
  return {
    title: `${name} | Sovereign Wellness`,
    description: `Experience Quiet Luxury Wellness at ${name}`,
  };
}

export default function TenantRootLayout({ children, params }: TenantLayoutProps) {
  return (
    <html lang="tr">
      {/* 
        Veri zehirlenmesini önlemek adına UI layerine TelemetryProvider 
        üzerinden x-tenant-code güvenli bir şekilde basılabilir (Client Componentlere pass edilir)
      */}
      <body data-tenant={params.tenantCode}>
        <TelemetryProvider>
          {children}
        </TelemetryProvider>
      </body>
    </html>
  );
}
