import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const config = {
  // Statik dosyaları ve dışarıda bırakılması gereken rotaları Edge yönlendirmesinden muaf tut
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets|api/ingest|admin|404-luxury).*)',
  ],
};

function generateCacheKey(request: NextRequest, locale: string): string {
  const pathname = request.nextUrl.pathname;
  const searchParams = request.nextUrl.searchParams;
  // Basit SearchHash (eğer search yoksa 'base', yoksa spesifik key tutarız)
  const searchHash = searchParams.toString() ? Buffer.from(searchParams.toString()).toString('base64').substring(0, 8) : 'base';
  
  return `santis:web:${locale}:${pathname}:${searchHash}`;
}

function shouldBypassCache(request: NextRequest): boolean {
  // Yalnızca GET istekleri cache adayıdır
  if (request.method !== 'GET') return true;
  
  const pathname = request.nextUrl.pathname;
  
  // 1. Booking akışı, Admin ve Preview modları Cache dışı bırakılır
  if (pathname.includes('/booking') || pathname.includes('/preview')) return true;
  
  // 2. Kişiselleştirilmiş oturumlar ve Auth Cookie varlığı
  const authCookie = request.cookies.get('santis_auth_session');
  if (authCookie) return true;

  // 3. Bypass Token
  const bypassToken = request.headers.get('x-bypass-cache');
  if (bypassToken === process.env.EDGE_CACHE_BYPASS_TOKEN) return true;

  // 4. Draft mode (Next.js context)
  if (request.cookies.has('__prerender_bypass')) return true;

  return false;
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  
  // 1. Hostname ve Cache Bileşenlerini Yakala
  let hostname = request.headers.get('host') || '';
  hostname = hostname.replace(/:\d+$/, '');
  
  const isLocalhost = hostname.includes('localhost');
  const tenantCode = isLocalhost 
    ? (hostname.split('.')[0] === 'localhost' ? 'default' : hostname.split('.')[0])
    : hostname.replace('.santis.app', '');

  // Otoriter Mühürleme (Next.js Context'e veri bırakır)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-code', tenantCode);
  requestHeaders.set('x-request-id', crypto.randomUUID());

  // 2. Bypass Kuralları Kontrolü
  if (shouldBypassCache(request)) {
    const response = NextResponse.rewrite(new URL(`/${tenantCode}${url.pathname}${url.search}`, request.url), {
      request: { headers: requestHeaders },
    });
    response.headers.set('x-santis-cache', 'BYPASS');
    return response;
  }

  // 3. Cache Key Standardı
  const locale = request.cookies.get('NEXT_LOCALE')?.value || 'tr';
  const cacheKey = generateCacheKey(request, locale);

  const CACHE_ENABLED = process.env.EDGE_CACHE_ENABLED === 'true';

  // 4. Redis Cache Okuma
  if (CACHE_ENABLED) {
    try {
      const cachedResponse = await redis.get<string>(cacheKey);
      
      if (cachedResponse) {
        // Cache Hit! Doğrudan Edge'den dön. (Normalde render edilmiş HTML Redis'te tutulur).
        // Bu örnekte Rewrite yönlendirmesini hızla dönüp Hit header'ı ekliyoruz.
        // İleride Next.js ISR/Static HTML'i doğrudan saklanabilir.
        const response = NextResponse.rewrite(new URL(`/${tenantCode}${url.pathname}${url.search}`, request.url), {
          request: { headers: requestHeaders },
        });
        response.headers.set('x-santis-cache', 'HIT');
        return response;
      }
    } catch (error) {
      console.error('Edge Cache Redis Error:', error);
    }
  }

  // 5. Cache Miss: Normal Next.js Yönlendirmesine İzin Ver
  const response = NextResponse.rewrite(new URL(`/${tenantCode}${url.pathname}${url.search}`, request.url), {
    request: { headers: requestHeaders },
  });
  
  response.headers.set('x-santis-cache', 'MISS');
  return response;
}
