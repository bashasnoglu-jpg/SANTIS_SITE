const DEFAULT_ERROR_MESSAGE = 'Bilinmeyen bir egemenlik ihlali olustu.';

export const SOVEREIGN_ERROR_MAP = {
  AUTH_INVALID_CREDENTIALS: 'Giris yetkisi reddedildi. Bilgilerinizi kontrol edin.',
  AUTH_SESSION_EXPIRED: 'Oturum muhru zaman asimina ugradi. Yeniden giris yapmalisiniz.',
  AUTH_INSUFFICIENT_PERMISSIONS: 'Bu islem icin egemenlik yetkiniz bulunmamaktadir.',
  CONFIG_INVALID_SCHEMA: 'Yapilandirma formati gecersiz. Anayasal semaya uymuyor.',
  CONFIG_WRITE_LOCKED: 'Sistem ayarlari su an muhurlu. Baska bir islem devam ediyor.',
  UPLOAD_GATEWAY_OFFLINE: 'Yukleme gumruk kapisi su an devrede degil. Orbital Forge (5050) servisini baslatin.',
  SEAL_NOT_FOUND: 'Islem anahtari bulunamadi. Lutfen yuklemeyi bastan baslatin.',
  SEAL_EXPIRED: 'Muhur suresi doldu. Guvenlik protokolu geregi islem iptal edildi.',
  SEAL_IN_USE: 'Ayni muhru kullanan baska bir islem zaten calisiyor. Lutfen kisa bir sure sonra tekrar deneyin.',
  TOKEN_MISMATCH: 'Kimlik dogrulama basarisiz. Yetkisiz erisim denemesi saptandi.',
  ASSET_MISMATCH: 'Muhur farkli bir varliga ait. Islem guvenlik duvari tarafindan durduruldu.',
  SEAL_TENANT_MISMATCH: 'Tenant uyusmazligi saptandi. Veri mulkiyeti korunuyor.',
  SEAL_CHECKSUM_MISMATCH: 'Dosya butunlugu bozulmus. Veri orijinal haliyle eslesmiyor.',
  FINALIZE_RACE_DETECTED: 'Ayni islem icin mukerrer talep algilandi. Sistem kilidi devrede.',
  MISSING_SEAL_CONTEXT: 'Yukleme sozlesmesi eksik. Islem yeniden baslatilmalidir.',
  ASSET_NOT_FOUND: 'Muhur kaydi bulundu ancak varlik kaydi bulunamadi. Lutfen yuklemeyi tekrarlayin.',
  SEAL_ALREADY_USED_OR_ASSET_NOT_DRAFT: 'Bu varlik zaten muhurlenmis veya tekrar finalize edilemez.',
  DEFAULT: DEFAULT_ERROR_MESSAGE,
};

const SOVEREIGN_ERROR_ALIASES = {
  ACCESS_DENIED: 'AUTH_INVALID_CREDENTIALS',
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  BOARDROOM_UNAUTHORIZED: 'AUTH_SESSION_EXPIRED',
  BOARDROOM_FORBIDDEN: 'AUTH_INSUFFICIENT_PERMISSIONS',
  INVALID_JSON: 'CONFIG_INVALID_SCHEMA',
};

const HIGH_SEVERITY_CODES = new Set([
  'AUTH_INSUFFICIENT_PERMISSIONS',
  'UPLOAD_GATEWAY_OFFLINE',
  'SEAL_NOT_FOUND',
  'SEAL_EXPIRED',
  'SEAL_IN_USE',
  'TOKEN_MISMATCH',
  'ASSET_MISMATCH',
  'SEAL_TENANT_MISMATCH',
  'SEAL_CHECKSUM_MISMATCH',
  'FINALIZE_RACE_DETECTED',
  'MISSING_SEAL_CONTEXT',
  'ASSET_NOT_FOUND',
  'SEAL_ALREADY_USED_OR_ASSET_NOT_DRAFT',
]);

export function resolveSovereignError(code, fallbackMessage = DEFAULT_ERROR_MESSAGE) {
  if (typeof code !== 'string' || !code.trim()) {
    return {
      code: null,
      message: fallbackMessage,
      severity: 'MEDIUM',
    };
  }

  const normalizedCode = code.trim();
  const canonicalCode = SOVEREIGN_ERROR_ALIASES[normalizedCode] || normalizedCode;
  return {
    code: canonicalCode,
    rawCode: normalizedCode,
    message: SOVEREIGN_ERROR_MAP[canonicalCode] || fallbackMessage,
    severity: HIGH_SEVERITY_CODES.has(canonicalCode) ? 'HIGH' : 'MEDIUM',
  };
}
