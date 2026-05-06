import React from 'react';
import type { Metadata } from 'next';
import '../globals.css'; // Sadece global CSS, Telemetry yok.

export const metadata: Metadata = {
  title: 'Page Not Found | Santis OS',
  description: 'The requested luxury wellness destination could not be found.',
};

export default function Luxury404Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* Fallback sayfasında Telemetry Provider YER ALMAZ. Bot trafikleri elenir. */}
      <body>
        {children}
      </body>
    </html>
  );
}
