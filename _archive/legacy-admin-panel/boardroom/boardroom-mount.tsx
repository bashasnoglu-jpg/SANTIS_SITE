import React from 'react';
import { createRoot } from 'react-dom/client';
import BoardroomOracleFeed from './components/BoardroomOracleFeed';

// Mühür: React'in Inject Edileceği Hedef
const ROOT_ID = 'santis-react-core';

// Güvenli Bootloader: DOM'un hazır olmasını bekle
function bootSovereignReact() {
  const container = document.getElementById(ROOT_ID);
  if (!container) {
    console.error(`[Sovereign Boot] Hedef '${ROOT_ID}' bulunamadı. React başlatılamadı.`);
    return;
  }

  // Zaten boot edildiyse tekrar boot etme (Live Reload vs. çift tetiklemelere karşı)
  if (container.hasAttribute('data-react-booted')) {
    return;
  }
  container.setAttribute('data-react-booted', 'true');

  // Hedefi görünür yap
  container.style.opacity = '1';

  console.log('🦅 [Sovereign Boot] React Kök Dizini (Root) başarıyla oluşturuldu.');
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <BoardroomOracleFeed />
    </React.StrictMode>
  );
}

// Güvenli Boot Akışı
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootSovereignReact);
} else {
  bootSovereignReact();
}
