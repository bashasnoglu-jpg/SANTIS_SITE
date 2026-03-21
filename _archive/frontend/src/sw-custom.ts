/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

self.skipWaiting();
clientsClaim();

// 1. Çekirdek (Kernel) ve Router için Cache-First (VitePWA bunu manifest üzerinden yapar)
// @ts-ignore: __WB_MANIFEST is injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST);

// 2. 3D Modeller ve Render Worker (GPU) için Stale-While-Revalidate
registerRoute(
  ({ request, url }) => request.destination === 'worker' || url.pathname.endsWith('.glb') || url.pathname.endsWith('.gltf'),
  new StaleWhileRevalidate({
    cacheName: 'santis-ultra-motion-assets',
  })
);

// Custom fetch dinleyicisi RUM/Vite uyumsuzluğu nedeniyle kaldırılmıştır.
// Ağ durumu client tarafındaki Network Worker ile yönetilmektedir.
